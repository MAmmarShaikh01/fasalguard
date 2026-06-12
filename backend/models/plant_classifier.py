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


def _extract_plant_name(label: str) -> str:
    plant = label.split("___")[0]
    plant = plant.replace("_", " ").replace("(", "").replace(")", "").strip()
    return plant if plant else "Unknown"


class PlantClassifier:
    def __init__(self):
        self._interpreter = None
        self._plant_map: dict[int, str] = {}

    def _load(self):
        if self._interpreter is not None:
            return

        logger.info(f"Loading plant classifier from {MODEL_REPO}")
        model_path = hf_hub_download(repo_id=MODEL_REPO, filename=TFLITE_FILE)
        labels_path = hf_hub_download(repo_id=MODEL_REPO, filename=LABELS_FILE)

        with open(labels_path) as f:
            raw_labels: dict[str, str] = json.load(f)

        self._plant_map = {int(k): _extract_plant_name(v) for k, v in raw_labels.items()}

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
        logger.info(f"Plant classifier loaded, input shape: {self._input_details[0]['shape']}")

    def _preprocess(self, image: Image.Image) -> np.ndarray:
        image = image.resize((384, 384))
        arr = np.array(image, dtype=np.float32) / 255.0
        return np.expand_dims(arr, axis=0)

    def _get_probs(self, image: Image.Image) -> np.ndarray:
        self._load()
        input_arr = self._preprocess(image)
        self._interpreter.set_tensor(self._input_details[0]["index"], input_arr)
        self._interpreter.invoke()
        raw = self._interpreter.get_tensor(self._output_details[0]["index"])[0]

        if raw.sum() > 0 and abs(raw.sum() - 1.0) > 0.01:
            exp = np.exp(raw - np.max(raw))
            return exp / exp.sum()
        return raw

    def classify(self, image: Image.Image) -> list[dict]:
        probs = self._get_probs(image)

        plant_scores: dict[str, float] = {}
        for idx, prob in enumerate(probs):
            plant = self._plant_map.get(idx, "Unknown")
            plant_scores[plant] = plant_scores.get(plant, 0) + float(prob)

        sorted_plants = sorted(plant_scores.items(), key=lambda x: -x[1])
        return [
            {"label": plant, "score": round(score, 4)}
            for plant, score in sorted_plants[:5]
        ]
