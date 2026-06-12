from fastapi import APIRouter, UploadFile, File, HTTPException
from utils.image_utils import preprocess_image
from utils.quality_check import analyze_image_quality
import numpy as np

router = APIRouter()


@router.post("/api/quality")
async def check_image_quality(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        contents = await file.read()
        image = preprocess_image(contents)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {str(e)}")

    return analyze_image_quality(image)
