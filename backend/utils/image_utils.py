from io import BytesIO
from PIL import Image

MAX_SIZE = 1024

def preprocess_image(raw_bytes: bytes) -> Image.Image:
    image = Image.open(BytesIO(raw_bytes)).convert("RGB")

    if max(image.size) > MAX_SIZE:
        image.thumbnail((MAX_SIZE, MAX_SIZE), Image.LANCZOS)

    return image
