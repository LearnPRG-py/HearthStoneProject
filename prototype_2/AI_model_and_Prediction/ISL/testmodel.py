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

model = tf.keras.models.load_model("/Users/aryankrishnan/ProjectHearthstone/prototype_2/AI_model_and_Prediction/ISL/isl_cnn_model.keras")

# class_names pulled from Data folder subdirectories (A, B, C... one per category)
# NOTE: adjust DATA_DIR_FOR_LABELS if your training Data/ folder isn't next to this script
DATA_DIR_FOR_LABELS = "/Users/aryankrishnan/ProjectHearthstone/prototype_2/AI_model_and_Prediction/ISL/Data"
class_names = sorted(os.listdir(DATA_DIR_FOR_LABELS))


def auto_correct(word):
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

MODEL_PATH = "/Users/aryankrishnan/ProjectHearthstone/prototype_2/hand_landmarker.task"

WRIST = 0
MIDDLE_MCP = 9


def normalize_two_hands(result):
    """
    Mirrors preprocessor.py logic: primary hand = Left if present else Right.
    Origin = primary wrist. Scale = primary wrist->middle-MCP distance.
    Returns (42, 3) array or None if no hand detected.
    """
    hands = {"Left": None, "Right": None}
    for i, handedness in enumerate(result.handedness):
        label = handedness[0].category_name
        pts = np.array([[p.x, p.y, p.z] for p in result.hand_landmarks[i]], dtype=np.float32)
        hands[label] = pts

    left = hands["Left"]
    right = hands["Right"]

    primary = left if left is not None else right
    secondary = right if left is not None else left

    if primary is None:
        return None

    out = np.zeros((2, 21, 3), dtype=np.float32)
    origin = primary[WRIST].copy()
    scale = np.linalg.norm(primary[MIDDLE_MCP] - primary[WRIST])
    scale = scale if scale > 1e-6 else 1e-6

    out[0] = (primary - origin) / scale
    if secondary is not None:
        out[1] = (secondary - origin) / scale

    return out.reshape(42, 3)


def hand_callback(result, output_image, timestamp_ms):
    if not result.hand_landmarks:
        return
    pts = normalize_two_hands(result)
    if pts is None:
        return
    try:
        landmark_queue.put_nowait(pts)
    except queue.Full:
        pass


options = HandLandmarkerOptions(
    base_options=BaseOptions(model_asset_path=MODEL_PATH),
    running_mode=VisionRunningMode.LIVE_STREAM,
    num_hands=2,
    result_callback=hand_callback,
)

landmarker = HandLandmarker.create_from_options(options)

cam = cv2.VideoCapture(0)
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
