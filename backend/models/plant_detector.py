from ultralytics import YOLO
from PIL import Image
import numpy as np
import os


class PlantDetector:
    def __init__(self):
        weights_path = os.path.join(os.path.dirname(__file__), "yolov8_plantdoc.pt")
        self.model = YOLO(weights_path)

    def detect_and_crop(self, pil_image: Image.Image, conf: float = 0.25):
        """
        YOLO se leaf detect karo, crop karke return karo.
        Class prediction intentionally ignore hai — sirf bbox use hota hai.
        Returns: (cropped_pil_image, bbox_dict) or (None, None) if no leaf found
        """
        img_array = np.array(pil_image)
        results = self.model(img_array, conf=conf, verbose=False)[0]

        if len(results.boxes) == 0:
            return None, None

        # Sabse confident box lo
        best_box = max(results.boxes, key=lambda b: float(b.conf[0]))
        x1, y1, x2, y2 = [int(v) for v in best_box.xyxy[0].tolist()]
        confidence = round(float(best_box.conf[0]), 2)

        # Thoda padding add karo crop ke around
        pad = 10
        w, h = pil_image.size
        x1 = max(0, x1 - pad)
        y1 = max(0, y1 - pad)
        x2 = min(w, x2 + pad)
        y2 = min(h, y2 + pad)

        cropped = pil_image.crop((x1, y1, x2, y2))

        bbox = {
            "x1": x1, "y1": y1,
            "x2": x2, "y2": y2,
            "confidence": confidence
        }

        return cropped, bbox


_detector = None


def get_detector() -> PlantDetector:
    global _detector
    if _detector is None:
        _detector = PlantDetector()
    return _detector
