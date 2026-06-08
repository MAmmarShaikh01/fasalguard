from fastapi import APIRouter, UploadFile, File, HTTPException
from utils.image_utils import preprocess_image
import numpy as np
from scipy.ndimage import convolve

router = APIRouter()

BLUR_THRESHOLD = 80.0
DARKNESS_THRESHOLD = 50.0

@router.post("/api/quality")
async def check_image_quality(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        contents = await file.read()
        image = preprocess_image(contents)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {str(e)}")

    gray = image.convert("L")
    arr = np.array(gray, dtype=np.float32)

    laplacian_kernel = np.array([[0, -1, 0], [-1, 4, -1], [0, -1, 0]], dtype=np.float32)
    edges = convolve(arr, laplacian_kernel, mode="reflect")
    laplacian_var = float(np.var(edges))

    is_blurry = laplacian_var < BLUR_THRESHOLD
    blur_score = min(laplacian_var / 200.0, 1.0)

    mean_brightness = float(np.mean(arr))
    is_too_dark = mean_brightness < DARKNESS_THRESHOLD
    brightness_score = min(mean_brightness / 200.0, 1.0)

    rgb = np.array(image, dtype=np.float32)
    green_channel = rgb[:, :, 1]
    red_channel = rgb[:, :, 0]
    blue_channel = rgb[:, :, 2]

    green_ratio = float(np.mean(green_channel > red_channel) + np.mean(green_channel > blue_channel)) / 2.0
    likely_leaf = green_ratio > 0.35

    return {
        "is_blurry": is_blurry,
        "is_too_dark": is_too_dark,
        "likely_leaf": bool(likely_leaf),
        "laplacian_variance": round(laplacian_var, 2),
        "mean_brightness": round(mean_brightness, 1),
        "green_ratio": round(green_ratio, 3),
        "blur_score": round(blur_score, 3),
        "brightness_score": round(brightness_score, 3),
        "passed": not is_blurry and not is_too_dark and likely_leaf,
    }
