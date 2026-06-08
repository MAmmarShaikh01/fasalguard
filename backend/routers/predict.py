from fastapi import APIRouter, UploadFile, File, HTTPException
from models.vit_classifier import ViTClassifier
from models.severity_analyzer import SeverityAnalyzer
from utils.image_utils import preprocess_image
from knowledge_base.plant_diseases import KNOWLEDGE_BASE
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

classifier = ViTClassifier()
severity = SeverityAnalyzer()


def lookup_treatment(disease_name: str) -> str | None:
    disease_lower = disease_name.lower().replace("___", " ").replace("_", " ")
    for entry in KNOWLEDGE_BASE:
        for keyword in entry["diseases"]:
            if keyword in disease_lower:
                return (
                    f"**Crop:** {entry['crop']}\n\n"
                    f"**Symptoms:** {entry['symptoms']}\n\n"
                    f"**Organic Treatment:** {entry['treatment_organic']}\n\n"
                    f"**Chemical Treatment:** {entry['treatment_chemical']}\n\n"
                    f"**Prevention:** {entry['prevention']}"
                )
    return None


@router.post("/api/predict")
async def predict_leaf(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        contents = await file.read()
        image = preprocess_image(contents)
    except Exception as e:
        logger.error(f"Image preprocessing failed: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid image: {str(e)}")

    try:
        top_k = classifier.predict_top_k(image)
        disease_name = top_k[0]["label"]
        confidence = top_k[0]["score"]
        severity_pct = severity.analyze(image, disease_name)
        treatment = lookup_treatment(disease_name)
    except Exception as e:
        logger.error(f"Inference failed: {e}")
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

    return {
        "disease": disease_name,
        "confidence": round(confidence, 3),
        "severity_percentage": round(severity_pct, 1),
        "treatment": treatment,
        "top_predictions": [
            {"label": r["label"], "score": round(r["score"], 3)}
            for r in top_k
        ],
    }
