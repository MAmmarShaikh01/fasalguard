import os
os.environ["TQDM_DISABLE"] = "1"

import json
import logging
import numpy as np
from PIL import Image
from huggingface_hub import hf_hub_download

logger = logging.getLogger(__name__)

MODEL_REPO = "animeshakr/plant-disease-efficientnetv2s"
TFLITE_FILE = "model_float16_quant.tflite"
LABELS_FILE = "class_indices.json"


class ViTClassifier:
    def __init__(self, model_repo: str = MODEL_REPO):
        self.model_repo = model_repo
        self._interpreter = None
        self._labels: dict[int, str] = {}

    def _load(self):
        if self._interpreter is not None:
            return

        logger.info(f"Downloading model from {self.model_repo}")
        model_path = hf_hub_download(
            repo_id=self.model_repo,
            filename=TFLITE_FILE,
        )
        labels_path = hf_hub_download(
            repo_id=self.model_repo,
            filename=LABELS_FILE,
        )

        with open(labels_path) as f:
            self._labels = {int(k): v for k, v in json.load(f).items()}

        try:
            from ai_edge_litert.interpreter import Interpreter
        except ImportError:
            try:
                import tflite_runtime.interpreter as tflite
                Interpreter = tflite.Interpreter
            except ImportError:
                import tensorflow as tf
                Interpreter = tf.lite.Interpreter

        self._interpreter = Interpreter(model_path=model_path)
        self._interpreter.allocate_tensors()
        self._input_details = self._interpreter.get_input_details()
        self._output_details = self._interpreter.get_output_details()
        logger.info(f"Model loaded, input shape: {self._input_details[0]['shape']}")

    def _preprocess(self, image: Image.Image) -> np.ndarray:
        image = image.resize((384, 384))
        arr = np.array(image, dtype=np.float32)
        arr = np.expand_dims(arr, axis=0)
        return arr

    def predict(self, image: Image.Image) -> tuple[str, float]:
        self._load()
        input_arr = self._preprocess(image)
        self._interpreter.set_tensor(self._input_details[0]["index"], input_arr)
        self._interpreter.invoke()
        probs = self._interpreter.get_tensor(self._output_details[0]["index"])[0]
        top_idx = int(np.argmax(probs))
        return self._labels[top_idx], float(probs[top_idx])

    def predict_top_k(self, image: Image.Image, k: int = 3) -> list[dict]:
        self._load()
        input_arr = self._preprocess(image)
        self._interpreter.set_tensor(self._input_details[0]["index"], input_arr)
        self._interpreter.invoke()
        probs = self._interpreter.get_tensor(self._output_details[0]["index"])[0]
        top_indices = np.argsort(probs)[-k:][::-1]
        return [
            {"label": self._labels[int(i)], "score": float(probs[i])}
            for i in top_indices
        ]
