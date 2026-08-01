import os
import cv2
import csv
import numpy as np
import mediapipe as mp
from tqdm import tqdm

os.environ["GLOG_minloglevel"] = "3"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

DATA_DIR = "Data"
OUTPUT_CSV = "isl_landmarks.csv"
HAND_MODEL = "/Users/aryankrishnan/ProjectHearthstone/prototype_2/hand_landmarker.task"

BaseOptions = mp.tasks.BaseOptions
HandLandmarker = mp.tasks.vision.HandLandmarker
HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode

WRIST = 0
MIDDLE_MCP = 9


def make_options(delegate):
    return HandLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=HAND_MODEL, delegate=delegate),
        running_mode=VisionRunningMode.IMAGE,
        num_hands=2,
        min_hand_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    )


def landmarks_to_array(lm_list):
    return np.array([[p.x, p.y, p.z] for p in lm_list], dtype=np.float32)


def extract_and_normalize(result):
    hands = {"Left": None, "Right": None}
    for i, handedness in enumerate(result.handedness):
        label = handedness[0].category_name
        hands[label] = landmarks_to_array(result.hand_landmarks[i])

    left = hands["Left"]
    right = hands["Right"]

    # prefer left as origin hand if present, else fall back to right
    primary_label = "Left" if left is not None else ("Right" if right is not None else None)
    primary = left if left is not None else right
    secondary = right if left is not None else left

    if primary is None:
        return None, None

    out = np.zeros((2, 21, 3), dtype=np.float32)
    origin = primary[WRIST].copy()
    scale = np.linalg.norm(primary[MIDDLE_MCP] - primary[WRIST])
    scale = scale if scale > 1e-6 else 1e-6

    out[0] = (primary - origin) / scale
    if secondary is not None:
        out[1] = (secondary - origin) / scale

    return out.flatten(), primary_label


def process_image(path, hand_lm):
    frame = cv2.imread(path)
    if frame is None:
        return None, None

    frame_rgba = cv2.cvtColor(frame, cv2.COLOR_BGR2RGBA)
    frame_rgba = np.ascontiguousarray(frame_rgba)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGBA, data=frame_rgba)

    result = hand_lm.detect(mp_image)
    if not result.hand_landmarks:
        return None, None

    return extract_and_normalize(result)


def load_done_paths():
    done = set()
    if os.path.exists(OUTPUT_CSV):
        with open(OUTPUT_CSV, "r", newline="") as f:
            reader = csv.reader(f)
            next(reader, None)  # header
            for row in reader:
                if row:
                    done.add(row[0])  # Path column
    return done


def main():
    image_paths = []
    for root, _, files in os.walk(DATA_DIR):
        if root == DATA_DIR:
            continue
        category = os.path.basename(root)
        for f in files:
            if f.lower().endswith((".jpg", ".jpeg", ".png")):
                full_path = os.path.join(root, f)
                image_paths.append((category, full_path))

    done_paths = load_done_paths()
    remaining = [(c, p) for c, p in image_paths if p not in done_paths]

    print(f"Found {len(image_paths)} images, {len(done_paths)} already done, {len(remaining)} remaining")

    if not remaining:
        print("Nothing left to process.")
        return

    write_header = not os.path.exists(OUTPUT_CSV)

    try:
        hand_lm = HandLandmarker.create_from_options(make_options(BaseOptions.Delegate.GPU))
        print("Running on GPU")
    except Exception as e:
        print(f"GPU failed ({e}), falling back to CPU")
        hand_lm = HandLandmarker.create_from_options(make_options(BaseOptions.Delegate.CPU))

    with open(OUTPUT_CSV, "a", newline="") as f:
        writer = csv.writer(f)
        if write_header:
            writer.writerow(["Path", "Category", "PrimaryHand", "landmarks"])

        skipped = 0
        for i, (category, path) in enumerate(tqdm(remaining)):
            landmarks, primary_label = process_image(path, hand_lm)

            if landmarks is None:
                skipped += 1
            else:
                writer.writerow([path, category, primary_label, landmarks.tolist()])

            f.flush()
            os.fsync(f.fileno())

    hand_lm.close()
    print(f"Skipped {skipped} images this run.")


if __name__ == "__main__":
    main()
