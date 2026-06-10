from fastapi import APIRouter, UploadFile, File, HTTPException
from models.plant_classifier import PlantClassifier
from utils.image_utils import preprocess_image
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

classifier = PlantClassifier()

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

    try:
        predictions = classifier.classify(image)
    except Exception as e:
        logger.error(f"Plant classification failed: {e}")
        raise HTTPException(status_code=500, detail=f"Classification error: {str(e)}")

    top = predictions[0]

    return {
        "plant_name": top["label"],
        "confidence": round(top["score"], 3),
        "top_predictions": [
            {"label": r["label"], "score": round(r["score"], 3)}
            for r in predictions
        ],
    }
