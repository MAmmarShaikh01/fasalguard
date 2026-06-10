import os

os.environ["TQDM_DISABLE"] = "1"

import logging
from transformers import pipeline
from PIL import Image

logger = logging.getLogger(__name__)

MODEL_NAME = "Professor/Plant_Classification_model"

class PlantClassifier:
    def __init__(self):
        self._pipeline = None

    def _load(self):
        if self._pipeline is None:
            logger.info(f"Loading plant classifier model: {MODEL_NAME}")
            self._pipeline = pipeline(
                "image-classification",
                model=MODEL_NAME,
                top_k=5,
            )

    def classify(self, image: Image.Image) -> list[dict]:
        self._load()
        return self._pipeline(image)
