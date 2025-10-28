import cv2
import mediapipe as mp
import numpy as np
import tensorflow as tf

model = tf.keras.models.load_model("asl_cnn_model_rel.h5")
class_names = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'del', 'nothing', 'space']

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils

cap = cv2.VideoCapture(0)

with mp_hands.Hands(static_image_mode=False,
                    max_num_hands=1,
                    min_detection_confidence=0.7,
                    min_tracking_confidence=0.7) as hands:
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(image)

        if results.multi_hand_landmarks:
            hand_landmarks = results.multi_hand_landmarks[0]
            data = np.array([[lm.x, lm.y, lm.z] for lm in hand_landmarks.landmark]).flatten()
            pts = np.array([[lm.x, lm.y, lm.z] for lm in hand_landmarks.landmark], dtype=np.float32).reshape(21, 3)

            # make coordinates relative to wrist (landmark 0)
            ref = pts[0]
            pts -= ref
            pts = pts[1:]
            scale = np.max(np.linalg.norm(pts, axis=1))
            pts /= (scale + 1e-6)
            data = np.expand_dims(pts, axis=0)
            preds = model.predict(data)
            print(preds)
            label = class_names[np.argmax(preds)]

            # Drawing
            mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)
            cv2.putText(frame, f"{label}", (10, 60),
                        cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 255, 0), 3, cv2.LINE_AA)

        cv2.imshow("Hand Sign Prediction", frame)
        if cv2.waitKey(5) & 0xFF == 27:
            break

cap.release()
cv2.destroyAllWindows()