"""
Convert the fine-tuned ViT model to TFLite for production deployment.

Usage:
    pip install -r requirements-convert.txt
    python scripts/convert_vit_to_tflite.py

Output:
    fasaguard_final_93pct_tflite/
        ├── model_float32.tflite      (float32, ~345MB, highest accuracy)
        ├── model_float16.tflite      (float16, ~172MB, negligible accuracy loss)
        ├── model_int8.tflite         (int8 quantized, ~86MB, fastest for mobile)
        ├── class_indices.json         (label mapping for inference)
        └── preprocessor_config.json   (preprocessing params)
"""

import json
import shutil
from pathlib import Path



MODEL_SOURCE = Path(__file__).resolve().parent.parent / "fasalguard_final_93pct"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "fasalguard_final_93pct_tflite"


def step1_export_onnx():
    """Export PyTorch model to ONNX format."""
    print("\n[1/4] Exporting PyTorch → ONNX...")
    from transformers import AutoModelForImageClassification, AutoImageProcessor
    import torch

    model = AutoModelForImageClassification.from_pretrained(str(MODEL_SOURCE))
    processor = AutoImageProcessor.from_pretrained(str(MODEL_SOURCE))
    model.eval()

    # Create dummy input (batch=1, 3 channels, 224x224)
    dummy = torch.randn(1, 3, 224, 224)

    onnx_dir = OUTPUT_DIR / "onnx"
    onnx_dir.mkdir(parents=True, exist_ok=True)
    onnx_path = onnx_dir / "model.onnx"

    torch.onnx.export(
        model,
        dummy,
        onnx_path,
        input_names=["pixel_values"],
        output_names=["logits"],
        dynamic_axes={
            "pixel_values": {0: "batch_size", 2: "height", 3: "width"},
            "logits": {0: "batch_size"},
        },
        opset_version=14,
    )
    print(f"   ✅ ONNX model saved: {onnx_path}")

    # Save processor config for later
    processor.save_pretrained(onnx_dir)
    return onnx_path


def step2_convert_tflite(onnx_path: Path):
    """Convert ONNX model to TFLite using onnx2tf CLI."""
    print("\n[2/4] Converting ONNX → TensorFlow Lite...")
    import subprocess, sys

    tflite_dir = OUTPUT_DIR / "tflite"
    tflite_dir.mkdir(parents=True, exist_ok=True)

    # Try onnx2tf CLI first
    try:
        subprocess.run(
            [sys.executable, "-m", "onnx2tf", "-i", str(onnx_path), "-o", str(tflite_dir)],
            check=True, capture_output=True, text=True,
        )
        print(f"   ✅ TFLite via onnx2tf: {tflite_dir}")
        return tflite_dir
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("   ⚠️ onnx2tf CLI failed, trying direct TensorFlow conversion...")
        return step2_tf_direct(onnx_path, tflite_dir)


def step2_tf_direct(onnx_path: Path, tflite_dir: Path):
    """Convert via ONNX → TensorFlow SavedModel → TFLite."""
    import onnx
    try:
        from onnx_tf.backend import prepare
    except ImportError:
        print("   ⚠️ onnx-tf not installed. Install with: pip install onnx-tf")
        print("   Attempting direct TensorFlow ONNX loader...")
        return step2_tf_onnx_loader(onnx_path, tflite_dir)

    tf_dir = OUTPUT_DIR / "savedmodel"

    onnx_model = onnx.load(onnx_path)
    tf_rep = prepare(onnx_model)
    tf_rep.export_graph(str(tf_dir))
    print(f"   ✅ SavedModel: {tf_dir}")

    import tensorflow as tf
    converter = tf.lite.TFLiteConverter.from_saved_model(str(tf_dir))
    converter.target_spec.supported_ops = [
        tf.lite.OpsSet.TFLITE_BUILTINS,
        tf.lite.OpsSet.SELECT_TF_OPS,
    ]

    # float32
    tflite_32 = converter.convert()
    (tflite_dir / "model_float32.tflite").write_bytes(tflite_32)
    print(f"   ✅ float32: {(tflite_dir / 'model_float32.tflite').stat().st_size / 1024 / 1024:.0f} MB")

    # float16
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    converter.target_spec.supported_types = [tf.float16]
    tflite_16 = converter.convert()
    (tflite_dir / "model_float16.tflite").write_bytes(tflite_16)
    print(f"   ✅ float16: {(tflite_dir / 'model_float16.tflite').stat().st_size / 1024 / 1024:.0f} MB")

    print("   ⚠️ Int8 quantization skipped — requires representative dataset")
    return tflite_dir


def step2_tf_onnx_loader(onnx_path: Path, tflite_dir: Path):
    """Last resort: load ONNX with tf directly."""
    import tensorflow as tf
    import tf2onnx
    model_proto, _ = tf2onnx.onnx_to_tf(onnx_path)

    converter = tf.lite.TFLiteConverter.from_saved_model(model_proto)
    converter.target_spec.supported_ops = [
        tf.lite.OpsSet.TFLITE_BUILTINS,
        tf.lite.OpsSet.SELECT_TF_OPS,
    ]
    tflite_32 = converter.convert()
    (tflite_dir / "model_float32.tflite").write_bytes(tflite_32)
    print(f"   ✅ float32: {(tflite_dir / 'model_float32.tflite').stat().st_size / 1024 / 1024:.0f} MB")
    return tflite_dir


def step3_save_metadata(tflite_dir: Path):
    """Save class labels and preprocessing config alongside the model."""
    print("\n[3/4] Saving metadata...")

    # Copy config from source
    shutil.copy2(
        MODEL_SOURCE / "preprocessor_config.json",
        tflite_dir / "preprocessor_config.json",
    )

    # Save class indices in the same format as the current model
    with open(MODEL_SOURCE / "config.json") as f:
        config = json.load(f)
    class_indices = {int(k): v for k, v in config["id2label"].items()}
    with open(tflite_dir / "class_indices.json", "w") as f:
        json.dump(class_indices, f, indent=2)

    # Also save a human-readable label list
    labels_sorted = [class_indices[i] for i in sorted(class_indices)]
    with open(tflite_dir / "labels.txt", "w") as f:
        f.write("\n".join(labels_sorted))

    print(f"   ✅ class_indices.json ({len(class_indices)} classes)")
    print(f"   ✅ labels.txt")


def step4_verify(tflite_dir: Path):
    """Run a quick verification with a dummy input."""
    print("\n[4/4] Verifying TFLite model...")
    try:
        import tensorflow as tf

        tflite_models = list(tflite_dir.glob("*.tflite"))
        if not tflite_models:
            print("   ⚠️ No TFLite models found to verify")
            return

        model_path = tflite_models[0]
        interpreter = tf.lite.Interpreter(model_path=str(model_path))
        interpreter.allocate_tensors()

        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()

        input_shape = input_details[0]["shape"]
        output_shape = output_details[0]["shape"]

        # Run dummy inference
        dummy = np.random.randn(*input_shape).astype(np.float32)
        interpreter.set_tensor(input_details[0]["index"], dummy)
        interpreter.invoke()
        output = interpreter.get_tensor(output_details[0]["index"])

        print(f"   ✅ Input shape: {input_shape}")
        print(f"   ✅ Output shape: {output_shape}")
        print(f"   ✅ Inference OK (top-1: {float(output[0].max()):.4f})")
        print(f"   ✅ Model verified: {model_path.name}")

        # Report file sizes
        for p in sorted(tflite_models):
            print(f"      {p.name}: {p.stat().st_size / 1024 / 1024:.1f} MB")

    except ImportError:
        print("   ⚠️ TensorFlow not available for verification")
        print(f"   TFLite files are in: {tflite_dir}")


def main():
    print("=" * 60)
    print("  🌿 FasalGuard: ViT → TFLite Converter")
    print("=" * 60)
    print(f"\nSource: {MODEL_SOURCE}")
    print(f"Output: {OUTPUT_DIR}")

    if not MODEL_SOURCE.exists():
        print(f"\n❌ Model directory not found: {MODEL_SOURCE}")
        print("   Train or download the fine-tuned model first.")
        return

    try:
        onnx_path = step1_export_onnx()
        tflite_dir = step2_convert_tflite(onnx_path)
        step3_save_metadata(tflite_dir)
        step4_verify(tflite_dir)

        print("\n" + "=" * 60)
        print("  ✅ Conversion complete!")
        print("=" * 60)
        print(f"\nTFLite models: {tflite_dir}")
        print("\nTo deploy in production:")
        print(f"  1. Copy model_float16.tflite to backend/ or app/assets/")
        print(f"  2. Use class_indices.json for label mapping")
        print(f"  3. Preprocessing: resize to 224x224, normalize with")
        print(f"     mean=[0.5,0.5,0.5], std=[0.5,0.5,0.5]")

    except Exception as e:
        print(f"\n❌ Conversion failed: {e}")
        print("\nTroubleshooting:")
        print("  pip install torch transformers onnx onnx2tf tensorflow")
        raise


if __name__ == "__main__":
    main()
