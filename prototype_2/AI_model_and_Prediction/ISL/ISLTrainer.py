# -*- coding: utf-8 -*-
"""ISL training script — updated for flat schema and instant preprocessing."""
from sklearn.model_selection import train_test_split
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras import layers, models, callbacks

# Variable data
epochs = 50
batch_size = 64
model_save_path = "isl_cnn_model.keras"
random_seed = 42
np.random.seed(random_seed)
tf.random.set_seed(random_seed)

# 1. Load Data
df = pd.read_csv('Data.csv')
print("Classes found:", sorted(df['target'].unique()))
labels = df['target'].astype(str)

num_hands = 2
num_landmarks = 21
coords_per_landmark = 3
num_classes = len(sorted(labels.unique()))

def preprocess_landmarks(dataframe):
    """
    Extracts, shapes, and shifts coordinates relative to the wrists (landmark 0).
    Completely vectorized for speed.
    """
    # Filter out target and configuration columns to grab just the 126 coordinate columns
    coord_cols = [c for c in dataframe.columns if c not in ['target', 'uses_two_hands']]
    
    # Shape: (num_samples, 126) -> (num_samples, 42, 3)
    X_raw = dataframe[coord_cols].values.astype(np.float32).reshape(-1, num_hands * num_landmarks, coords_per_landmark)
    
    # Left hand wrist is at index 0, Right hand wrist is at index 21
    left_wrist = X_raw[:, 0:1, :]       # Shape (num_samples, 1, 3)
    right_wrist = X_raw[:, 21:22, :]     # Shape (num_samples, 1, 3)
    
    # Subtract wrist origins to ensure absolute translation invariance
    X_raw[:, 0:21, :] -= left_wrist
    X_raw[:, 21:42, :] -= right_wrist
    
    return X_raw

# Run Preprocessing instantly
X_proc = preprocess_landmarks(df)

# Possible labels
label_map = {l: i for i, l in enumerate(sorted(labels.unique()))}
y = labels.map(label_map).values
y_onehot = tf.keras.utils.to_categorical(y, num_classes)

# Split
X_train, X_val, y_train, y_val = train_test_split(
    X_proc, y_onehot, test_size=0.1, random_state=random_seed, stratify=y
)

# Model Blocks
def conv_block(x, filters, kernel_size=3, drop=0.2):
    y = layers.Conv1D(filters, kernel_size, padding='same', use_bias=False)(x)
    y = layers.BatchNormalization()(y)
    y = layers.Activation('relu')(y)
    y = layers.Dropout(drop)(y)
    return y

def residual_block(x, filters, kernel_size=3, drop=0.2):
    shortcut = x
    y = conv_block(x, filters, kernel_size, drop)
    y = layers.Conv1D(filters, kernel_size, padding='same', use_bias=False)(y)
    y = layers.BatchNormalization()(y)
    if shortcut.shape[-1] != filters:
        shortcut = layers.Conv1D(filters, 1, padding='same', use_bias=False)(shortcut)
        shortcut = layers.BatchNormalization()(shortcut)
    y = layers.Add()([shortcut, y])
    y = layers.Activation('relu')(y)
    y = layers.Dropout(drop)(y)
    return y

def build_thicc_cnn(input_shape=(42, 3), num_classes=29, dropout=0.3):
    inp = layers.Input(shape=input_shape)
    x = conv_block(inp, 64, drop=dropout)
    x = conv_block(x, 128, drop=dropout)
    x = residual_block(x, 128, drop=dropout)
    x = residual_block(x, 256, drop=dropout)
    x = residual_block(x, 256, drop=dropout)
    x = layers.GlobalAveragePooling1D()(x)
    x = layers.Dense(512, use_bias=False)(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation('relu')(x)
    x = layers.Dropout(dropout)(x)
    out = layers.Dense(num_classes, activation='softmax')(x)
    return models.Model(inp, out)

model = build_thicc_cnn((num_hands * num_landmarks, coords_per_landmark), num_classes)

# Compile
model.compile(
    optimizer=tf.keras.optimizers.Adam(1e-3),
    loss=tf.keras.losses.CategoricalCrossentropy(label_smoothing=0.05),
    metrics=['accuracy']
)

# Callbacks
cbs = [
    callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=4, verbose=1),
    callbacks.EarlyStopping(monitor='val_loss', patience=8, restore_best_weights=True),
    callbacks.ModelCheckpoint(model_save_path, monitor='val_accuracy', save_best_only=True, verbose=1)
]

# Training
history = model.fit(
    X_train, y_train,
    validation_data=(X_val, y_val),
    epochs=epochs,
    batch_size=batch_size,
    callbacks=cbs,
    verbose=1
)

# Final model save
model.save(model_save_path)
print(f"Model saved to {model_save_path}")
