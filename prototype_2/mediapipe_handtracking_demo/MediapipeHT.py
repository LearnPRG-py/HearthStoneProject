import cv2
import mediapipe as mp
import threading

base_options = mp.tasks.base_options
hand_landmarker = mp.tasks.vision.hand_landmarker
hand_landmarker_options = mp.tasks.vision.hand_landmarker_options
vision_running_mode = mp.tasks.vision.RunningMode

model_path = "../hand_landmarker.task"

current_landmarks = None
current_landmarks_lock = threading.Lock()


def hand_callback(result, output_image, timestamp_ms):
    global current_landmarks
    with current_landmarks_lock:
        if result.hand_landmarks:
            current_landmarks = result.hand_landmarks
        else:
            current_landmarks = None


options = hand_landmarker_options(
    base_options=base_options(model_asset_path=model_path),
    running_mode=vision_running_mode.LIVE_STREAM,
    num_hands=2,
    result_callback=hand_callback,
)

landmarker = hand_landmarker.create_from_options(options)

cam = cv2.VideoCapture(0)
timestamp_ms = 0

while cam.isOpened():
    ret, frame = cam.read()
    if not ret:
        break

    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(mp.ImageFormat.SRGB, frame_rgb)
    landmarker.detect_async(mp_image, timestamp_ms)
    timestamp_ms += 1

    with current_landmarks_lock:
        landmarks = current_landmarks

    if landmarks:
        h, w, _ = frame.shape
        for hand in landmarks:
            for lm in hand:
                cv2.circle(frame, (int(lm.x * w), int(lm.y * h)), 4, (0, 255, 0), -1)

    cv2.imshow("MediaPipe Hands", frame)
    if cv2.waitKey(5) & 0xFF == 27:
        break

cam.release()
cv2.destroyAllWindows()
