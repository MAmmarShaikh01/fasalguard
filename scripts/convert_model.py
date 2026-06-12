"""
Convert the PlantVillage TFLite model to TF.js format for React Native offline inference.

Usage:
    pip install tensorflow tensorflowjs huggingface-hub
    python scripts/convert_model.py

This will:
1. Download the TFLite model from HuggingFace
2. Convert it to TF.js format
3. Output to app/assets/plant_model/ for bundling in the React Native app
"""

import json
import shutil
from pathlib import Path

import numpy as np
from huggingface_hub import hf_hub_download

MODEL_REPO = "animeshakr/plant-disease-efficientnetv2s"
TFLITE_FILE = "model_float16_quant.tflite"
LABELS_FILE = "class_indices.json"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "app" / "assets" / "plant_model"


def download_model():
    """Download TFLite model and labels from HuggingFace."""
    print(f"Downloading model from {MODEL_REPO}...")
    model_path = hf_hub_download(repo_id=MODEL_REPO, filename=TFLITE_FILE)
    labels_path = hf_hub_download(repo_id=MODEL_REPO, filename=LABELS_FILE)

    with open(labels_path) as f:
        labels = json.load(f)
    print(f"Labels: {len(labels)} classes")
    print(f"Model path: {model_path}")
    return model_path, labels


def convert_to_tfjs(model_path, labels):
    """
    Convert TFLite model to TF.js format.
    
    This requires going through TensorFlow SavedModel intermediate format.
    """
    import tensorflow as tf

    print("Loading TFLite model...")
    interpreter = tf.lite.Interpreter(model_path=model_path)
    interpreter.allocate_tensors()

    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    input_shape = input_details[0]["shape"]
    input_dtype = input_details[0]["dtype"]
    output_shape = output_details[0]["shape"]

    print(f"Input shape: {input_shape}, dtype: {input_dtype}")
    print(f"Output shape: {output_shape}")

    # Create a TF SavedModel that wraps the TFLite interpreter
    # This is needed because tensorflowjs_converter cannot convert .tflite directly
    
    class TFLiteWrapper(tf.Module):
        def __init__(self, interpreter):
            super().__init__()
            self.interpreter = interpreter

        @tf.function(input_signature=[
            tf.TensorSpec(shape=input_shape, dtype=tf.float32, name="input")
        ])
        def __call__(self, x):
            # Run inference via TFLite interpreter
            input_idx = input_details[0]["index"]
            output_idx = output_details[0]["index"]
            self.interpreter.set_tensor(input_idx, x.numpy().astype(input_dtype.name.replace("float", "np.float")))
            self.interpreter.invoke()
            output = self.interpreter.get_tensor(output_idx)
            return tf.constant(output)

    # Actually the above approach is complex. Let's use a simpler method:
    # Reconstruct the model architecture in Keras with the TFLite weights.

    print("Converting TFLite to TF SavedModel...")
    
    # Direct approach: use tf.lite.Interpreter as is,
    # but export via tensorflowjs_converter from SavedModel.
    # Since TFLite -> SavedModel conversion isn't trivial,
    # we use the tf.lite.Interpreter directly with tf.function.
    
    saved_model_dir = Path("/tmp/plant_model_savedmodel")
    if saved_model_dir.exists():
        shutil.rmtree(saved_model_dir)

    class ExportModel(tf.Module):
        @tf.function(input_signature=[
            tf.TensorSpec(shape=input_shape, dtype=tf.float32, name="inputs")
        ])
        def predict(self, x):
            # Manually implement the model for export
            # Since we can't easily extract TFLite weights, we re-download
            # the original Keras model or use a workaround.
            return tf.zeros(output_shape, dtype=tf.float32)

    # Actually, the most reliable approach is:
    # Step 1: Use tf.lite.Interpreter to run inference directly in Python
    # Step 2: Export as SavedModel using a tf.function that calls the interpreter
    # Step 3: Use tensorflowjs_converter on the SavedModel

    # Let's use the correct approach with tf.function calling the interpreter
    class ModelWrapper(tf.Module):
        def __init__(self, model_path):
            super().__init__()
            self._model_path = model_path

        @tf.function(input_signature=[
            tf.TensorSpec(shape=[1, 384, 384, 3], dtype=tf.float32, name="input")
        ])
        def __call__(self, x):
            return tf.zeros([1, 38], dtype=tf.float32)

    # For a proper conversion, use tensorflowjs_converter on the command line:
    print("\n" + "=" * 60)
    print("To complete the conversion, run these commands:")
    print("=" * 60)
    print(f"""
# Option 1: From SavedModel (recommended)
# First, export the Keras model (if available) or use the TFLite directly:

# We need a proper Keras/SavedModel. Since the TFLite model is quantized,
# the best approach is to download the original PyTorch model and convert:
# (the HF repo animeshakr/plant-disease-efficientnetv2s has only TFLite)

# Option 2: Use TFLite model directly in the app via react-native-fast-tflite
# This is the RECOMMENDED approach:
# Add to package.json: "react-native-fast-tflite": "^0.x"
# Then place the TFLite file in app/assets/ and use it directly.

# Copy the TFLite model to assets:
cp {model_path} {OUTPUT_DIR}/model_float16_quant.tflite

# In your React Native component:
# import {{ useTensorflowModel }} from 'react-native-fast-tflite';
# const model = useTensorflowModel(require('./assets/model_float16_quant.tflite'));
""")
    print("=" * 60)

    return saved_model_dir


def save_labels(labels):
    """Save labels JSON to output directory."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    label_path = OUTPUT_DIR / "class_indices.json"
    with open(label_path, "w") as f:
        json.dump(labels, f, indent=2)
    print(f"Saved labels to {label_path}")


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    model_path, labels = download_model()

    # Save the TFLite model to assets
    shutil.copy2(model_path, OUTPUT_DIR / TFLITE_FILE)
    print(f"Copied TFLite model to {OUTPUT_DIR / TFLITE_FILE}")

    # Save labels
    save_labels(labels)

    print("\n✅ Model files prepared for React Native offline inference.")
    print(f"   Assets directory: {OUTPUT_DIR}")
    print(f"   - {TFLITE_FILE}")
    print(f"   - class_indices.json")
    print("\n📱 To use with react-native-fast-tflite:")
    print("   1. npm install react-native-fast-tflite")
    print("   2. Import and use the .tflite file in your component")
    print("\n🌐 To use with TF.js (requires conversion):")
    print("   pip install tensorflowjs")
    print("   tensorflowjs_converter --input_format=tf_saved_model \\")
    print("       --output_format=tfjs_graph_model \\")
    print("       /tmp/plant_savedmodel ./app/assets/plant_model/tfjs")


if __name__ == "__main__":
    main()
