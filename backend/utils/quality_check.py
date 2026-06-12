import numpy as np
from PIL import Image
from scipy.ndimage import convolve

BLUR_THRESHOLD = 80.0
DARKNESS_THRESHOLD = 50.0
SATURATION_THRESHOLD = 40
GREEN_RATIO_THRESHOLD = 0.35


def analyze_image_quality(image: Image.Image) -> dict:
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
    max_c = np.max(rgb, axis=2)
    min_c = np.min(rgb, axis=2)
    saturation = max_c - min_c
    colored = saturation > SATURATION_THRESHOLD

    if not np.any(colored):
        green_ratio = 0.0
    else:
        green_dominant = (rgb[:, :, 1] > rgb[:, :, 0]) & (rgb[:, :, 1] > rgb[:, :, 2])
        green_ratio = float(np.mean(green_dominant[colored]))

    likely_leaf = green_ratio > GREEN_RATIO_THRESHOLD

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
