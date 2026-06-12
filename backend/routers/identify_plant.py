from fastapi import APIRouter, UploadFile, File, HTTPException
from models.plant_classifier import PlantClassifier
from utils.image_utils import preprocess_image
import numpy as np
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

classifier = PlantClassifier()

SATURATION_THRESHOLD = 40
GREEN_RATIO_THRESHOLD = 0.35


def _likely_contains_plant(image) -> tuple[bool, float]:
    rgb = np.array(image, dtype=np.float32)
    max_c = np.max(rgb, axis=2)
    min_c = np.min(rgb, axis=2)
    saturation = max_c - min_c
    colored = saturation > SATURATION_THRESHOLD
    if not np.any(colored):
        return False, 0.0
    green_dominant = (rgb[:, :, 1] > rgb[:, :, 0]) & (rgb[:, :, 1] > rgb[:, :, 2])
    green_ratio = float(np.mean(green_dominant[colored]))
    return green_ratio > GREEN_RATIO_THRESHOLD, green_ratio


@router.post("/api/identify-plant")
async def identify_plant(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        contents = await file.read()
        image = preprocess_image(contents)
    except Exception as e:
        logger.error(f"Image preprocessing failed: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid image: {str(e)}")

    is_plant, green_ratio = _likely_contains_plant(image)
    if not is_plant:
        return {
            "plant_name": None,
            "confidence": 0,
            "green_ratio": round(green_ratio, 3),
            "top_predictions": [],
            "warning": "The image does not appear to contain a plant. Try a photo with visible green leaves or flowers.",
        }

    try:
        predictions = classifier.classify(image)
    except Exception as e:
        logger.error(f"Plant classification failed: {e}")
        raise HTTPException(status_code=500, detail=f"Classification error: {str(e)}")

    top = predictions[0]

    return {
        "plant_name": top["label"],
        "confidence": round(top["score"], 3),
        "green_ratio": round(green_ratio, 3),
        "top_predictions": [
            {"label": r["label"], "score": round(r["score"], 3)}
            for r in predictions
        ],
    }
