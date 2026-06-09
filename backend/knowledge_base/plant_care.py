WATERING_GUIDE = {
    "apple": {
        "frequency": "1-2 times per week",
        "amount": "1-2 inches per week",
        "tips": "Water deeply at the base. Reduce in winter. Young trees need more frequent watering.",
        "sunlight": "Full sun (6+ hours daily)"
    },
    "blueberry": {
        "frequency": "2-3 times per week",
        "amount": "1-2 inches per week",
        "tips": "Keep soil consistently moist but not waterlogged. Use acidic water if possible (pH 4.5-5.5).",
        "sunlight": "Full sun to partial shade"
    },
    "cherry": {
        "frequency": "1-2 times per week",
        "amount": "1 inch per week",
        "tips": "Water deeply during fruit development. Reduce after harvest. Avoid overhead watering.",
        "sunlight": "Full sun"
    },
    "corn": {
        "frequency": "2-3 times per week",
        "amount": "1-1.5 inches per week",
        "tips": "Critical to water during pollination and ear development. Water at soil level.",
        "sunlight": "Full sun"
    },
    "grape": {
        "frequency": "1 time per week",
        "amount": "0.5-1 inch per week",
        "tips": "Deep watering encourages deep roots. Reduce water as grapes ripen for better flavor.",
        "sunlight": "Full sun"
    },
    "orange": {
        "frequency": "1-2 times per week",
        "amount": "1-1.5 inches per week",
        "tips": "Deep watering every 7-14 days. Young trees need more. Reduce in cool season.",
        "sunlight": "Full sun"
    },
    "peach": {
        "frequency": "1-2 times per week",
        "amount": "1-1.5 inches per week",
        "tips": "Water deeply at the base. Critical during fruit development. Avoid wetting leaves.",
        "sunlight": "Full sun"
    },
    "pepper": {
        "frequency": "2-3 times per week",
        "amount": "1-2 inches per week",
        "tips": "Consistent moisture is key. Mulch to retain moisture. Reduce water as fruits ripen.",
        "sunlight": "Full sun"
    },
    "potato": {
        "frequency": "2-3 times per week",
        "amount": "1-2 inches per week",
        "tips": "Keep soil evenly moist, especially during tuber formation. Stop watering 2 weeks before harvest.",
        "sunlight": "Full sun"
    },
    "raspberry": {
        "frequency": "2 times per week",
        "amount": "1-1.5 inches per week",
        "tips": "Water at soil level to prevent diseases. Mulch to keep roots cool and moist.",
        "sunlight": "Full sun to partial shade"
    },
    "soybean": {
        "frequency": "1-2 times per week",
        "amount": "1 inch per week",
        "tips": "Critical to water during flowering and pod fill. Avoid water stress during these stages.",
        "sunlight": "Full sun"
    },
    "squash": {
        "frequency": "2-3 times per week",
        "amount": "1-2 inches per week",
        "tips": "Water deeply at the base. Avoid wetting leaves to prevent powdery mildew.",
        "sunlight": "Full sun"
    },
    "strawberry": {
        "frequency": "2-3 times per week",
        "amount": "1-1.5 inches per week",
        "tips": "Keep soil consistently moist. Use drip irrigation to avoid fruit rot. Mulch to retain moisture.",
        "sunlight": "Full sun"
    },
    "tomato": {
        "frequency": "2-3 times per week",
        "amount": "1-2 inches per week",
        "tips": "Water deeply at the base. Consistent watering prevents blossom end rot. Reduce as fruits ripen.",
        "sunlight": "Full sun"
    },
}

def get_plant_name(disease_label: str) -> str:
    plant = disease_label.split("___")[0].replace("_", " ").replace("(","").replace(")","").strip()
    return plant

def get_watering_info(disease_label: str) -> dict | None:
    plant_raw = disease_label.split("___")[0].lower()
    plant_clean = plant_raw.replace("_", " ").replace("(", "").replace(")", "").strip()
    for key, info in WATERING_GUIDE.items():
        if key in plant_clean or plant_clean in key:
            return info
    return None
