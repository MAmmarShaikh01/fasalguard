# Implementation Plan — FasalGuard: Plant Health Detection System

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                    FasalGuard — Plant Health App                  │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────────────┐  │
│  │ Expo Camera   │    │ Media Library│    │ Async Storage     │  │
│  │ (capture leaf)│    │ (pick image) │    │ (offline cache)   │  │
│  └──────┬───────┘    └──────┬───────┘    └───────────────────┘  │
│         │                   │                                     │
│         ▼                   ▼                                     │
│  ┌──────────────────────────────────────────────────────┐        │
│  │           Pre-Processing Block (Device-Side)         │        │
│  │  ┌─────────────────┐  ┌──────────────────────────┐   │        │
│  │  │ Quality Firewall │  │ Image Resizer/Compressor │   │        │
│  │  │ (Laplacian       │  │ (react-native-image-     │   │        │
│  │  │  variance check) │  │  resizer — max 1024px)   │   │        │
│  │  └─────────────────┘  └──────────────────────────┘   │        │
│  └──────────────────────────────────────────────────────┘        │
│                              │                                     │
│                              ▼                                     │
│  ┌──────────────────────────────────────────────────────┐        │
│  │     Local Inference (Offline Fallback)                │        │
│  │  ┌──────────────────────────────────────────────┐    │        │
│  │  │ TensorFlow.js / ONNX MobileNetV2 (quantized)  │    │        │
│  │  │ → Binary Healthy vs. Diseased (no internet)   │    │        │
│  │  └──────────────────────────────────────────────┘    │        │
│  └──────────────────────────────────────────────────────┘        │
│                              │                                     │
└──────────────────────────────┼─────────────────────────────────────┘
                                │ (Axios Multipart Form — HTTPS)
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Cloud/Server Layer                             │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │           FastAPI Server (Railway — always-on)               ││
│  │  ┌──────────────┐  ┌────────────────────┐  ┌─────────────┐  ││
│  │  │ /api/predict │  │ Vision Transformer  │  │ /api/chat   │  ││
│  │  │ (multipart)  │─►│ (ViT) or Claude/    │─►│ (RAG        │  ││
│  │  └──────────────┘  │ DeepSeek-VL (JSON) │  │  Assistant) │  ││
│  │                    └────────────────────┘  └─────────────┘  ││
│  │  ┌──────────────────────────────────────────────────────────┐││
│  │  │ Response: diseaseName, severity%, confidenceScore,       │││
│  │  │ treatmentRemedy (markdown), geotag                       │││
│  │  └──────────────────────────────────────────────────────────┘││
│  └──────────────────────────────────────────────────────────────┘│
│                              │                                     │
│                              ▼                                     │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │  Data & Geospatial Layer                                     ││
│  │  ┌──────────────┐  ┌────────────────────┐  ┌──────────────┐ ││
│  │  │ Zustand      │  │ AsyncStorage Cache │  │ Regional     │ ││
│  │  │ (global      │  │ (offline history)  │  │ Outbreak Map │ ││
│  │  │  state)      │  │                    │  │ (react-native│ ││
│  │  └──────────────┘  └────────────────────┘  │  maps)       │ ││
│  │                                            └──────────────┘ ││
│  └──────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

---

## 📐 Complete End-to-End System Flow

```
[ User Interaction ] ──> (Expo Camera / Media Library) ──> [ Raw Asset URI ]
                                                                   │
                                                                   ▼
[ Localization Engine ] <── (React Native Location / Maps) <── [ Pre-Processing Block ]
                                                                   │ (Image Optimization)
                                                                   ▼
[ Local Cache Lookup ] <─── (Async Storage / WatermelonDB) <── [ Network Gateway ]
                                                                   │ (Axios Multipart Form)
                                                                   ▼
[ Analytical Interface ] <── (Markdown Render / Reanimated) <── [ Cloud AI Serverless Edge ]
                                                                   (Vision Model + Severity Logic)
```

---

## 🚀 Advanced Feature Set

### 1. Computer Vision Pre-Processing & Quality Firewall
- Auto-analyzes leaf photo before sending to server
- Detects blurry, too dark, or non-leaf images → alerts user to retake
- Saves API token costs and prevents server-side classification errors
- Edge-based multi-class classification fallback for offline health tagging

### 2. Multi-Class Infection Severity Quantizer
- Calculates exact percentage of leaf area affected (e.g., "14.2% Severity Status: Moderate Infection")
- Beyond simple disease name — processes image matrix for severity

### 3. Regional Outbreak Geospatial Mapping
- Tags coordinates with each scan (user permission)
- Interactive local map tracking disease spread in real-time
- Farmers can see if a crop blight is heading toward their district

### 4. Interactive Treatment Assistant (RAG Chatbot)
- Inline specialized conversational sheet slides up after diagnosis
- Users chat about organic pesticide ratios, harvesting timelines, soil remediation

---

## 🛠️ Tech Stack

### 📱 Frontend & Device Hardware Layer
| Component | Technology |
|-----------|-----------|
| Camera | expo-camera & expo-image-picker (SDK 56) |
| Image Optimization | react-native-image-resizer (max 1024px) |
| Animations | react-native-reanimated + lucide-react-native |
| Maps | react-native-maps |

### 🔍 Computer Vision & Local Processing
| Component | Technology |
|-----------|-----------|
| Blur Detection | Backend `/api/quality` (Laplacian variance via scipy) |
| Offline Inference | @tensorflow/tfjs-react-native or ONNX Runtime Mobile |
| Local Model | Quantized MobileNetV2 (Healthy vs. Diseased binary check) |

### ☁️ Cloud AI & Heavy Processing
| Component | Technology |
|-----------|-----------|
| Backend Hosting | Railway (free tier — always-on, no expiry) |
| Image Classification | PyTorch / Torchvision — PlantVillage dataset model |
| Vision LLM | Claude 3.5 Sonnet / DeepSeek-VL with JSON-schema prompt |
| Inference | CPU (ViT runs ~3–5s on Railway CPU, acceptable for capstone) |
| GPU | ❌ Not needed — Railway free tier is CPU-only |

### 💾 Data Persistence & State
| Component | Technology |
|-----------|-----------|
| Global State | Zustand |
| Local Cache | @react-native-async-storage/async-storage |
| Advanced DB | WatermelonDB (optional) |

---

## Project Structure

```
FasalGuard/
├── app/                              # React Native (Expo) mobile app
│   ├── App.tsx
│   ├── src/
│   │   ├── screens/
│   │   │   ├── CameraScreen.tsx      # Leaf capture
│   │   │   ├── ResultScreen.tsx      # Diagnosis + severity
│   │   │   ├── MapScreen.tsx         # Outbreak geospatial view
│   │   │   └── ChatScreen.tsx        # RAG treatment assistant
│   │   ├── services/
│   │   │   ├── api.ts                # Axios client → Railway URL
│   │   │   └── offline.ts            # Local TF.js inference
│   │   ├── components/
│   │   │   ├── CameraView.tsx
│   │   │   ├── QualityBadge.tsx      # Blur/darkness indicator
│   │   │   ├── SeverityGauge.tsx     # Severity percentage UI
│   │   │   ├── ReportCard.tsx        # Diagnostic report (Markdown)
│   │   │   └── MapOverlay.tsx
│   │   ├── store/
│   │   │   └── useDiagnosticStore.ts # Zustand store
│   │   └── utils/
│   │       ├── compress.ts
│   │       └── imageQuality.ts       # Laplacian variance check
│   └── package.json
│
├── backend/                          # FastAPI server
│   ├── main.py
│   ├── requirements.txt
│   ├── routers/
│   │   ├── predict.py                # /api/predict
│   │   ├── chat.py                   # /api/chat (RAG)
│   │   └── health.py                 # /api/health
│   ├── models/
│   │   ├── vit_classifier.py         # ViT image classification
│   │   └── severity_analyzer.py      # Leaf area infection %
│   └── utils/
│       ├── image_utils.py
│
├── Dockerfile                         # Railway deployment (root level)
├── .gitignore
│
├── legacy/                           # Existing Flask prototype
│   ├── app.py                        # Flask ViT web app
│   ├── requirements.txt
│   ├── templates/index.html
│   └── static/
│       ├── css/style.css
│       └── js/main.js
│
└── docs/
    └── IMPLEMENTATION_PLAN.md
```

---

## Implementation Timeline

### Phase 1 — Foundation (Week 1)
- [ ] Initialize React Native (Expo) project with TypeScript
- [ ] Configure expo-camera with hardware permissions
- [ ] Set up FastAPI server with basic endpoints
- [ ] Deploy Vision Transformer model (google/vit-base-patch16-224)
- [ ] Implement image upload → prediction → display result cycle
- [ ] Deploy backend on Railway (git push → auto-deploy)

### Phase 2 — Intelligence & Quality (Week 2)
- [x] Image pre-processing: Laplacian blur detection (backend `/api/quality` endpoint)
- [x] Image resizer: compress to 1024px before upload
- [x] Quality firewall UI (badges for blurry/dark/non-leaf + retake/proceed flow)
- [x] Severity quantizer: leaf area infection % calculation (Laplacian edge detection)
- [x] Multi-class prediction with confidence scores (top-3)

### Phase 3 — Advanced Features (Week 3)
- [ ] Geospatial tagging with react-native-maps
- [ ] Regional outbreak map view
- [ ] Offline fallback: TensorFlow.js MobileNetV2 binary classifier
- [ ] Zustand store for diagnostic history
- [ ] AsyncStorage offline cache for past reports

### Phase 4 — RAG Chatbot & Polish (Week 4)
- [ ] RAG treatment assistant endpoint (/api/chat)
- [ ] Inline slide-up chat sheet UI
- [ ] Markdown rendering for diagnostic reports
- [ ] UI/UX refinement with Reanimated animations
- [ ] Performance optimization & testing
- [ ] Documentation & demo preparation

---

## Bottleneck Analysis

### Inference Speed (CPU vs GPU)
- **Problem:** Railway free tier has no GPU — ViT inference takes ~3–5s on CPU instead of ~1s on GPU
- **Solution:** Still fine for capstone — UX shows loading skeleton; or upgrade to Railway paid GPU ($)
- **Alternative:** Switch to a smaller/lighter model (e.g., MobileNetV3) if speed becomes an issue

### Always-On Requirement
- **Problem:** Colab sessions expire after ~12 hours, requiring keepalive hacks
- **Solution:** Railway runs 24/7 on free tier — no expiry, no tunnel setup

### Offline Capability
- **Problem:** Field workers often lack internet
- **Solution:** TF.js / ONNX quantized MobileNetV2 for on-device binary check

---

## 100% Free Feasibility Scorecard

| Category | Component | Free? | Enough for Capstone? |
|----------|-----------|-------|---------------------|
| ✅ | Expo SDK | ✔️ | ✅ |
| ✅ | expo-camera | ✔️ | ✅ |
| ✅ | FastAPI + Railway | ✔️ (always-on) | ✅ |
| ✅ | Hugging Face ViT Model | ✔️ | ✅ |
| ✅ | Zustand / AsyncStorage | ✔️ | ✅ |
| ✅ | Railway Hosting | ✔️ (512MB RAM, always-on) | ✅ |
| ✅ | App Distribution | ✔️ (Expo Go) | ✅ |
| ⚠️ | CPU Inference Speed | ~3–5s (no GPU) | ✅ (acceptable with skeleton UI) |

**Verdict: 100% FREE for hackathon/capstone/demo — no tunnels, no session expiry** ✅
