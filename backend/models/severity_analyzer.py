import numpy as np
from PIL import Image
from scipy.ndimage import convolve

class SeverityAnalyzer:
    def analyze(self, image: Image.Image, disease_name: str) -> float:
        if "healthy" in disease_name.lower():
            return 0.0

        gray = image.convert("L")
        arr = np.array(gray, dtype=np.float32)

        laplacian = np.array([[0, 1, 0], [1, -4, 1], [0, 1, 0]], dtype=np.float32)
        edges = convolve(arr, laplacian, mode="reflect")

        threshold = np.mean(np.abs(edges)) + np.std(np.abs(edges))
        affected = np.sum(np.abs(edges) > threshold)
        total = arr.size
        ratio = float(affected / total) * 100

        return min(round(ratio, 1), 100.0)
