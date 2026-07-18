import cv2
import mediapipe as mp
import numpy as np
import tensorflow as tf
import threading
import queue
import platform
import subprocess
from spellchecker import SpellChecker
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
spell = SpellChecker()
current_word = ""
first_person = True

model = tf.keras.models.load_model(
    os.path.join(
        BASE_DIR,
        "../AI_model_and_Prediction/hearthstone_fingerspelling_AI"
        + ("_firstperson" if first_person else "_thirdperson")
        + ".keras",
    )
)

class_names = [
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
    "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T",
    "U", "V", "W", "X", "Y", "Z",
    "del", "nothing", "space",
]


def auto_correct(word):
    # words like i and a:
    if len(word) <= 1:
        return word
    corrected = spell.correction(word)
    return corrected if corrected else word


lastspoken = None
label_lock = threading.Lock()
landmark_queue = queue.Queue(maxsize=5)

# important for speed of single and double letters while testing, edit as you want
first_letter_frames = 5
double_letter_frames = 15

single_lower_limit_index = double_letter_frames - first_letter_frames
upper_limit_index = double_letter_frames + 1


def speak(text):
    system = platform.system()
    if system == "Darwin":
        subprocess.Popen(["say", text])
    elif system == "Windows":
        import comtypes.client
        speaker = comtypes.client.CreateObject("SAPI.SpVoice")
        speaker.Speak(text)
    else:
        subprocess.Popen(["spd-say", text])


def process_label(label):
    global current_word
    if label == "space":
        if current_word != "":
            corrected = auto_correct(current_word)
            speak(corrected)
            print("Typed:", current_word, "Corrected:", corrected)
            current_word = ""
    elif label == "del":
        current_word = current_word[:-1]
    elif label != "nothing":
        current_word += label.lower()


BaseOptions = mp.tasks.BaseOptions
HandLandmarker = mp.tasks.vision.HandLandmarker
HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode

MODEL_PATH = os.path.join(BASE_DIR, "../hand_landmarker.task")


def hand_callback(result, output_image, timestamp_ms):
    if not result.hand_landmarks:
        return
    lm = result.hand_landmarks[0]
    pts = np.array([[p.x, p.y, p.z] for p in lm], dtype=np.float32)
    ref = pts[0]
    pts = pts - ref

    # Flip X and Z to convert from first-person (chest-mounted) camera
    # to the second-person (facing) perspective the model was trained on.
    # X flip: corrects left/right mirror inversion
    # Z flip: corrects depth direction inversion
    pts[:, 0] *= -1   # mirror left/right (X)
    pts[:, 2] *= -1   # flip depth (Z)

    pts = pts[1:]
    scale = np.max(np.linalg.norm(pts, axis=1))
    pts /= scale + 1e-6
    try:
        landmark_queue.put_nowait(pts)
    except queue.Full:
        pass


options = HandLandmarkerOptions(
    base_options=BaseOptions(model_asset_path=MODEL_PATH),
    running_mode=VisionRunningMode.LIVE_STREAM,
    num_hands=1,
    result_callback=hand_callback,
)

landmarker = HandLandmarker.create_from_options(options)

cam = cv2.VideoCapture(1)
timestamp_ms = 0
labelbuffer = []
while cam.isOpened():
    ret, frame = cam.read()
    if not ret:
        break

    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(mp.ImageFormat.SRGB, frame_rgb)
    landmarker.detect_async(mp_image, timestamp_ms)
    timestamp_ms += 1

    try:
        pts = landmark_queue.get_nowait()
        data = np.expand_dims(pts, axis=0)
        preds = model.predict(data, verbose=0)
        label = class_names[np.argmax(preds)]

        with label_lock:
            labelbuffer.append(label)
            if len(labelbuffer) > upper_limit_index:
                labelbuffer.pop(0)
            if len(labelbuffer) < upper_limit_index:
                continue
            stablelabel = labelbuffer[double_letter_frames]
            if (
                len(set(labelbuffer[single_lower_limit_index:upper_limit_index])) == 1
                and labelbuffer[single_lower_limit_index]
                != labelbuffer[single_lower_limit_index - 1]
            ):
                if lastspoken != labelbuffer[double_letter_frames]:
                    process_label(stablelabel)
                    lastspoken = stablelabel
            elif (
                len(set(labelbuffer[1:upper_limit_index])) == 1
                and labelbuffer[1] != labelbuffer[0]
            ):
                # allow a duplicate letter here
                process_label(stablelabel)
                lastspoken = stablelabel
    except queue.Empty:
        pass

    cv2.putText(
        frame, current_word, (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2
    )
    cv2.imshow("Hand Sign Prediction", frame)
    if cv2.waitKey(5) & 0xFF == 27:
        break

cam.release()
cv2.destroyAllWindows()