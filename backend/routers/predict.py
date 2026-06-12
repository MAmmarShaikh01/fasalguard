from fastapi import APIRouter, UploadFile, File, HTTPException
from models.vit_classifier import ViTClassifier
from models.vit_finetuned import ViTFineTuned
from models.severity_analyzer import SeverityAnalyzer
from utils.image_utils import preprocess_image
from utils.quality_check import analyze_image_quality
from knowledge_base.plant_diseases import KNOWLEDGE_BASE
from knowledge_base.plant_care import get_plant_name, get_watering_info
import logging
import os

router = APIRouter()
logger = logging.getLogger(__name__)

# Primary: fine-tuned ViT (fasalguard_final_93pct)
# Fallback: original TFLite classifier
USE_FINETUNED = os.environ.get("USE_FINETUNED", "true").lower() == "true"

try:
    if USE_FINETUNED:
        classifier = ViTFineTuned()
        logger.info("Using fine-tuned ViT model (fasalguard_final_93pct)")
    else:
        raise RuntimeError("Switched to fallback")
except Exception as e:
    logger.warning(f"Fine-tuned model not available ({e}), using original classifier")
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

    quality = analyze_image_quality(image)

    try:
        top_k = classifier.predict_top_k(image)
        disease_name = top_k[0]["label"]
        confidence = top_k[0]["score"]
        severity_pct = severity.analyze(image, disease_name)
        treatment = lookup_treatment(disease_name)
        plant_name = get_plant_name(disease_name)
        watering = get_watering_info(disease_name)
    except Exception as e:
        logger.error(f"Inference failed: {e}")
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

    warnings: list[str] = []
    if not quality["passed"]:
        if not quality["likely_leaf"]:
            warnings.append("Image doesn't appear to be a leaf")
        if quality["is_blurry"]:
            warnings.append("Image is blurry — results may be affected")
        if quality["is_too_dark"]:
            warnings.append("Image is too dark — results may be affected")
    if confidence < 0.3:
        warnings.append(f"Low confidence ({confidence:.1%}) — results may be inaccurate")
    top_3_sum = sum(r["score"] for r in top_k[:3])
    if top_3_sum < 0.5:
        warnings.append("Model is uncertain about this image")
    if len(top_k) >= 2:
        plant_0 = top_k[0]["label"].split("___")[0].lower().strip("_() ")
        plant_1 = top_k[1]["label"].split("___")[0].lower().strip("_() ")
        margin = top_k[0]["score"] - top_k[1]["score"]
        if plant_0 != plant_1 and margin < 0.15:
            plant_scores: dict[str, float] = {}
            for r in top_k:
                p = r["label"].split("___")[0].replace("_", " ").replace("(", "").replace(")", "").strip()
                if p not in plant_scores or r["score"] > plant_scores[p]:
                    plant_scores[p] = r["score"]
            details = ", ".join(f"{p.lower()} ({s*100:.1f}%)" for p, s in plant_scores.items())
            warnings.append(f"Conflicting predictions — different plants detected ({details}). Try a clearer leaf photo.")

    response = {
        "disease": disease_name,
        "plant_name": plant_name,
        "watering": watering,
        "confidence": round(confidence, 3),
        "severity_percentage": round(severity_pct, 1),
        "treatment": treatment,
        "top_predictions": [
            {"label": r["label"], "score": round(r["score"], 3)}
            for r in top_k
        ],
    }
    if warnings:
        response["warnings"] = warnings
    return response
