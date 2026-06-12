import requests, json, sys

URL = "https://Ammar5525-fasalguard.hf.space/api/predict"

cases = [
    ("Apple Scab (+70% confident)", "demo_images/1_Apple Scab.jpg"),
    ("Apple Black Rot (model said Peach)", "demo_images/2_Apple Black Rot.jpg"),
    ("Apple Cedar Rust (+66% confident)", "demo_images/3_Apple Cedar Rust.jpg"),
    ("Apple Healthy (+31% correct)", "demo_images/4_Apple Healthy.jpg"),
    ("White background (no leaf)", "test_edge/white_background.jpg"),
    ("Blurry green shape", "test_edge/blurry_leaf.jpg"),
    ("Random noise (non-plant)", "test_edge/random_noise.jpg"),
    ("Gray rectangle (non-leaf)", "test_edge/gray_rectangle.jpg"),
]

for name, path in cases:
    try:
        with open(path, "rb") as f:
            r = requests.post(URL, files={"file": (path, f, "image/jpeg")}, timeout=120)
        data = r.json()
        top = data.get("top_predictions", [])
        print(f"--- {name} ---")
        print(f"  disease={data.get('disease','?')}, conf={data.get('confidence','?'):.3f}")
        for p in top[:3]:
            print(f"    {p['label']}: {p['score']:.3f}")
        if data.get("warnings"):
            print(f"  WARNINGS: {', '.join(data['warnings'])}")
        else:
            print(f"  No warnings")
        print()
    except Exception as e:
        print(f"--- {name} --- ERROR: {e}\n")
