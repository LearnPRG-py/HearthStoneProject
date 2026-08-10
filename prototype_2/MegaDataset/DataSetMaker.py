import os
import cv2
import pandas as pd
import mediapipe as mp

imagesSinceInitialization = 0
perCategoryTarget = 2400

base_options = mp.tasks.base_options
hand_landmarker = mp.tasks.vision.hand_landmarker
hand_landmarker_options = mp.tasks.vision.hand_landmarker_options
vision_running_mode = mp.tasks.vision.RunningMode
model_path = "hand_landmarker.task"

letterhash = {chr(i + 65): i for i in range(26)}

target_label = 0
target_orientation = 1
write_buffer = []


def flush_buffer_to_csv(filename="data.csv"):
    global write_buffer
    if not write_buffer:
        return
    new_df = pd.DataFrame(write_buffer)
    if os.path.exists(filename):
        old_df = pd.read_csv(filename)
        new_df = pd.concat([old_df, new_df], ignore_index=True)
    new_df.to_csv(filename, index=False)
    print(f"Flushed {len(write_buffer)} rows to {filename}")
    write_buffer.clear()


def SuggestLabels(filename="data.csv"):
    if not os.path.exists(filename):
        return "No suggestions available"
    df = pd.read_csv(filename)
    df["labelorientation"] = (
        df["label"].astype(str) + " " + df["orientation"].astype(str)
    )
    existing_lo_counts = df["labelorientation"].value_counts()
    all_labels = [str(i) for i in range(26)]
    all_orientations = [str(i) for i in range(1, 7)]
    missing_los = [
        f"{lbl} {ori}"
        for lbl in all_labels
        for ori in all_orientations
        if f"{lbl} {ori}" not in existing_lo_counts.index
    ]
    suggested_lo = missing_los[0] if missing_los else existing_lo_counts.idxmin()
    lbl, ori = suggested_lo.split()
    inverted = {v: k for k, v in letterhash.items()}
    return (
        f"Most underdone label+orientations:\n"
        f"{existing_lo_counts.nsmallest(3)}\n"
        f"Suggesting label '{inverted[int(lbl)]}' with orientation {ori}"
    )


def UpdateLabelsAndOrientation():
    global target_label, target_orientation
    try:
        target_label = letterhash[input("Enter target label: ").upper()]
    except:
        print(
            "Invalid label, might be on Tryjobs, if not on TryJobs, restart the program and give it another try."
        )
        quit()
    target_orientation = int(
        input(
            "1) Wrist up\n"
            "2) Wrist down\n"
            "3) Wrist left\n"
            "4) Wrist right\n"
            "5) Wrist toward camera\n"
            "6) Wrist opposite camera\n"
        )
    )
    if target_orientation < 1 or target_orientation > 6:
        print("Invalid orientation, try again")
        quit()


def transform_landmarks():
    if not os.path.exists("data.csv"):
        print("No data.csv found, try again after capturing some data")
        return
    datacsv = pd.read_csv("data.csv")

    def rot(df, xsign=1, ysign=1, swap=False):
        out = df.copy()
        for k in range(20):
            # 20 landmarks (since wrist is subtracted from all points and taken as origin)
            x = df[f"lm_{3*k}"]
            y = df[f"lm_{3*k+1}"]
            if swap:
                out[f"lm_{3*k}"] = ysign * y
                out[f"lm_{3*k+1}"] = xsign * x
            else:
                out[f"lm_{3*k}"] = xsign * x
                out[f"lm_{3*k+1}"] = ysign * y
        return out

    aug = pd.concat(
        [
            datacsv,
            rot(datacsv, -1, 1, True),
            rot(datacsv, -1, -1),
            rot(datacsv, 1, -1, True),
        ]
    )
    final = pd.concat(
        [
            aug,
            rot(aug, -1, 1),
            rot(aug, 1, -1),
            rot(aug, -1, -1),
        ]
    )
    final.to_csv("processeddata.csv", index=False)
    print(f"Post-processed dataset size: {len(final)}")


def hand_landmarks_callback(result, output_image, timestamp_ms):
    # These variables must exist for a valid callback
    global imagesSinceInitialization

    if not result.hand_landmarks:
        return

    landmarks = result.hand_landmarks[0]
    wrist = landmarks[0]

    row = {}
    idx = 0
    for lm in landmarks[1:]:
        row[f"lm_{idx}"] = lm.x - wrist.x
        row[f"lm_{idx+1}"] = lm.y - wrist.y
        row[f"lm_{idx+2}"] = lm.z - wrist.z
        idx += 3

    row["label"] = target_label
    row["orientation"] = target_orientation

    write_buffer.append(row)
    imagesSinceInitialization += 1

    print(f"Captured frame {imagesSinceInitialization}")


options = hand_landmarker_options(
    base_options=base_options(model_asset_path=model_path),
    running_mode=vision_running_mode.LIVE_STREAM,
    num_hands=1,
    result_callback=hand_landmarks_callback,
)

landmarker = hand_landmarker.create_from_options(options)


def main():
    cap = cv2.VideoCapture(0)
    if os.path.exists("data.csv"):
        getDfForProgress = pd.read_csv("data.csv")
        print(
            "Welcome, total progress is: "
            f"{len(getDfForProgress)} out of {perCategoryTarget*26} images "
            f"or {len(getDfForProgress)*100/(perCategoryTarget*26)}%"
        )
    else:
        print("Welcome, let us begin creating this beautiful dataset")

    if os.path.exists("processeddata.csv"):
        getDfForProgress = pd.read_csv("processeddata.csv")
        print(
            f"Processed data already exists and currently has {len(getDfForProgress)} rows"
        )

    print(SuggestLabels())
    UpdateLabelsAndOrientation()

    timestamp_ms = 0
    auto = False
    counter = 0

    try:
        while True:
            if not auto:
                char = input("[Enter]=capture | a=auto | c=change | q=quit ")
                if char == "q":
                    break
                if char == "c":
                    flush_buffer_to_csv()
                    print(SuggestLabels())
                    UpdateLabelsAndOrientation()
                    continue
                if char == "a":
                    limit = int(input("Enter number of frames to capture: "))
                    if limit <= 0:
                        limit = 100  # Default value
                    auto = True
                    counter = 0
            else:
                counter += 1
                if counter >= limit:
                    auto = False
                    print("Auto mode ended")

            ret, frame = cap.read()
            if not ret:
                continue

            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(mp.ImageFormat.SRGB, frame_rgb)
            landmarker.detect_async(mp_image, timestamp_ms)
            timestamp_ms += 33

    finally:
        cap.release()
        flush_buffer_to_csv()
        if input("Run post-processing? (y/N): ").lower() == "y":
            transform_landmarks()


if __name__ == "__main__":
    main()
