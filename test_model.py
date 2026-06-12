import requests, json, sys

images = [
    "demo_images/1_Apple Scab.jpg",
    "demo_images/2_Apple Black Rot.jpg",
    "demo_images/3_Apple Cedar Rust.jpg",
    "demo_images/4_Apple Healthy.jpg",
]

url = sys.argv[1] if len(sys.argv) > 1 else "https://Ammar5525-fasalguard.hf.space/api/predict"

for img_path in images:
    try:
        with open(img_path, "rb") as f:
            r = requests.post(url, files={"file": (img_path, f, "image/jpeg")}, timeout=120)
        data = r.json()
        print(f"--- {img_path} ---")
        print(f"  disease={data.get('disease','?')}, conf={data.get('confidence','?')}")
        for p in data.get("top_predictions", [])[:3]:
            print(f"    {p['label']}: {p['score']:.3f}")
        warnings = data.get("warnings", [])
        if warnings:
            print(f"  warnings: {warnings}")
        print()
    except Exception as e:
        print(f"--- {img_path} --- ERROR: {e}\n")
