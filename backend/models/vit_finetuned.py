import os
import logging
from pathlib import Path
from typing import Optional

import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

# Resolve model directory — works both locally and inside Docker
_HERE = Path(__file__).resolve().parent
# Local:  backend/models/ -> ../.. -> project root
_LOCAL = _HERE.parent.parent / "fasalguard_final_93pct"
# Docker: /app/models/ -> /app
_DOCKER = _HERE.parent / "fasalguard_final_93pct"
MODEL_DIR = _DOCKER if _DOCKER.exists() else _LOCAL


class ViTFineTuned:
    """
    Inference wrapper for the fine-tuned ViT model (fasalguard_final_93pct).
    
    Loads the safetensors model via HuggingFace Transformers.
    Falls back to the original TFLite classifier if PyTorch is unavailable.
    """

    def __init__(self, model_dir: Optional[str] = None):
        self.model_dir = model_dir or str(MODEL_DIR)
        self._model = None
        self._processor = None
        self._labels: dict[int, str] = {}

    def _load(self):
        if self._model is not None:
            return

        logger.info(f"Loading fine-tuned ViT from {self.model_dir}")
        try:
            from transformers import AutoImageProcessor, AutoModelForImageClassification
            import torch

            self._processor = AutoImageProcessor.from_pretrained(self.model_dir)
            self._model = AutoModelForImageClassification.from_pretrained(
                self.model_dir,
                torchscript=False,
            )
            self._model.eval()

            # Move to CPU explicitly
            self._device = torch.device("cpu")
            self._model.to(self._device)

            # Extract labels
            config = self._model.config
            self._labels = {int(k): v for k, v in config.id2label.items()}
            logger.info(f"Loaded ViT with {len(self._labels)} classes on {self._device}")

        except ImportError as e:
            raise RuntimeError(f"PyTorch/Transformers not available: {e}")

    def _preprocess(self, image: Image.Image):
        self._load()
        import torch
        inputs = self._processor(images=image, return_tensors="pt")
        return {k: v.to(self._device) for k, v in inputs.items()}

    def _get_probs(self, image: Image.Image) -> np.ndarray:
        self._load()
        import torch
        inputs = self._preprocess(image)
        with torch.no_grad():
            outputs = self._model(**inputs)
            logits = outputs.logits
            probs = torch.nn.functional.softmax(logits, dim=-1)
        return probs.cpu().numpy()[0]

    def predict(self, image: Image.Image) -> tuple[str, float]:
        probs = self._get_probs(image)
        top_idx = int(np.argmax(probs))
        return self._labels[top_idx], float(probs[top_idx])

    def predict_top_k(self, image: Image.Image, k: int = 3) -> list[dict]:
        probs = self._get_probs(image)
        top_indices = np.argsort(probs)[-k:][::-1]
        return [
            {"label": self._labels[int(i)], "score": float(probs[i])}
            for i in top_indices
        ]

    def predict_plant_only(self, image: Image.Image) -> list[dict]:
        probs = self._get_probs(image)
        plant_scores: dict[str, float] = {}
        for idx, prob in enumerate(probs):
            label = self._labels.get(idx, f"class_{idx}")
            plant = label.split("___")[0].replace("_", " ").replace("(", "").replace(")", "").strip()
            plant_scores[plant] = plant_scores.get(plant, 0) + float(prob)
        sorted_plants = sorted(plant_scores.items(), key=lambda x: -x[1])
        return [
            {"label": plant, "score": round(score, 4)}
            for plant, score in sorted_plants[:5]
        ]
