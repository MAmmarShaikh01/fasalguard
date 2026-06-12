---
title: FasalGuard
emoji: 🌿
colorFrom: green
colorTo: green
sdk: docker
app_port: 7860
pinned: false
---

# FasalGuard — Plant Health Detection API

Plant disease detection with species ID, severity analysis, treatment recommendations, and watering guide.

**Model:** `VaigandlaHemanth/leaf-disease-clip-vit` (fine-tuned on PlantVillage, 38 classes)
**Chat:** `llama-3.3-70b-versatile` via Groq

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check |
| `/api/predict` | POST | Upload leaf image, get disease + treatment |
| `/api/chat` | POST | Ask plant care questions |
| `/api/quality` | POST | Check image quality |

## Environment

Set `GROQ_API_KEY` in HF Space Settings → Repository Secrets for the chat feature.
