"""
This python convertor acts as a way to wrap the tfjs conversion tool. This tool
was created to explicitly address 2 errors with the command line tool which I
was unable to fix over the course of working on this. This hence acts as a
temporary conversion workaround.
"""

import tensorflow as tf
import os

first_person = False

model_path = (
    "../AI_model_and_Prediction/hearthstone_fingerspelling_AI"
    + ("_firstperson" if first_person else "_thirdperson")
    + ".keras"
)

model = tf.keras.models.load_model(model_path)
export_path = "saved_model_dir"
model.export(export_path)

os.system(
    "tensorflowjs_converter --input_format=tf_saved_model " "saved_model_dir tfjs_model"
)

# os.system("rm -rf saved_model_dir")
