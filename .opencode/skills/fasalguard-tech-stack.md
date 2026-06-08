---
name: fasalguard-tech-stack
description: Official docs, versions, and setup for FasalGuard plant health project's full tech stack
---

# FasalGuard Tech Stack — Official Docs & Versions (June 2026)
# All versions fetched directly from npm and PyPI registries

---

## 1. Languages

### Python 3.10+
- **Official site:** https://www.python.org/downloads/
- **Docs:** https://docs.python.org/3/
- **Required:** 3.10+ (FastAPI 0.136.x requires 3.10+)

### TypeScript 5.x
- **Official site:** https://www.typescriptlang.org/
- **Docs:** https://www.typescriptlang.org/docs/
- **Install:** `npm install -D typescript`

### JavaScript (ES2022+)
- Used in frontend and legacy Flask web UI

---

## 2. Mobile App — Expo / React Native

### Expo SDK 56
- **Official docs:** https://docs.expo.dev/
- **SDK 56 changelog:** https://expo.dev/changelog/sdk-56
- **Install:** `npx create-expo-app@latest my-app`
- **SDK version:** 56.0.9 (latest stable, June 2026)
- **React Native version:** 0.85.3 (bundled with SDK 56)
- **New Architecture:** Fabric enabled by default in SDK 56
- **Expo Go:** https://expo.dev/go

### expo-camera
- **Official docs:** https://docs.expo.dev/versions/latest/sdk/camera/
- **GitHub (SDK 54):** https://github.com/expo/expo/tree/sdk-54/packages/expo-camera
- **Install:** `npx expo install expo-camera`
- **Key API:** `CameraView` component (not legacy `Camera`)
- **Config plugin** in `app.json` for permissions
- **Permissions:** `cameraPermission`, `microphonePermission`

### expo-image-picker
- **Official docs:** https://docs.expo.dev/versions/latest/sdk/imagepicker/
- **npm:** https://www.npmjs.com/package/expo-image-picker
- **Install:** `npx expo install expo-image-picker`
- **Key functions:** `launchCameraAsync()`, `launchImageLibraryAsync()`
- **Config plugin** for `photosPermission`, `cameraPermission`

### expo-image-manipulator (for compression)
- **Official docs:** https://docs.expo.dev/versions/latest/sdk/imagemanipulator/
- **npm:** https://www.npmjs.com/package/expo-image-manipulator
- **Install:** `npx expo install expo-image-manipulator`
- **Usage:** `ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1024 } }], { compress: 0.7 })`

### react-native-reanimated 4.x
- **Official docs:** https://docs.swmansion.com/react-native-reanimated/
- **Expo docs:** https://docs.expo.dev/versions/latest/sdk/reanimated/
- **Version:** 4.4.1 (latest stable, June 2026)
- **Install:** `npx expo install react-native-reanimated react-native-worklets`
- **Requires:** React Native New Architecture (Fabric)
- **Key APIs:** `useSharedValue`, `withTiming`, `useAnimatedStyle`, `Easing`

### lucide-react-native
- **Official site:** https://lucide.dev/
- **RN docs:** https://lucide.dev/guide/packages/lucide-react-native
- **npm:** https://www.npmjs.com/package/lucide-react-native
- **Version:** 1.17.0 (latest, June 2026)
- **Install:** `npm install lucide-react-native`
- **Peer dep:** `react-native-svg` (v12-15)
- **Usage:** `import { Camera } from 'lucide-react-native'`

### react-native-maps
- **Official docs:** https://github.com/react-native-maps/react-native-maps
- **Expo docs:** https://docs.expo.dev/versions/latest/sdk/map-view/
- **Version:** 1.27.2 (latest, Mar 2026)
- **Install:** `npx expo install react-native-maps`
- **Works in:** Expo Go (Apple Maps on iOS, Google Maps on Android)
- **Production:** Requires Google Maps API key via config plugin

### expo-location
- **Official docs:** https://docs.expo.dev/versions/latest/sdk/location/
- **Install:** `npx expo install expo-location`
- **Usage:** `Location.requestForegroundPermissionsAsync()`, `Location.getCurrentPositionAsync()`

### react-native-gesture-handler
- **Official docs:** https://docs.swmansion.com/react-native-gesture-handler/
- **Expo docs:** https://docs.expo.dev/versions/latest/sdk/gesture-handler/
- **Version:** 3.0.0 (latest, June 2026)
- **Install:** `npx expo install react-native-gesture-handler`
- **Key:** Wrap app in `<GestureHandlerRootView>`

### react-native-markdown-display
- **npm:** https://www.npmjs.com/package/react-native-markdown-display
- **Version:** 7.0.2 (2 years old, stable)
- **Install:** `npm install react-native-markdown-display`
- **Usage:** `<Markdown>{markdownString}</Markdown>`
- **Note:** Native-component renderer, not webview

### @react-native-async-storage/async-storage
- **Official docs:** https://react-native-async-storage.github.io/3.0/
- **Expo docs:** https://docs.expo.dev/versions/latest/sdk/async-storage/
- **Version:** 3.1.1 (latest, June 2026)
- **Install:** `npx expo install @react-native-async-storage/async-storage`
- **Usage:** `getItem()`, `setItem()`, `removeItem()` — key-value storage

### axios
- **Official docs:** https://axios-http.com/docs/intro
- **npm:** https://www.npmjs.com/package/axios
- **Version:** 1.17.0 (latest, June 2026)
- **Install:** `npm install axios`
- **Usage for FasalGuard:** See [How React Native App Connects to Railway](#how-react-native-app-connects-to-railway) for full api.ts setup.

### zustand
- **Official docs:** https://zustand.docs.pmnd.rs/
- **npm:** https://www.npmjs.com/package/zustand
- **Version:** 5.0.14 (latest, June 2026)
- **Install:** `npm install zustand`
- **Usage:**
  ```ts
  import { create } from 'zustand';
  const useStore = create((set) => ({ diagnostics: [], addDiagnostic: (d) => ... }));
  ```

---

## 3. Backend — FastAPI

### FastAPI
- **Official docs:** https://fastapi.tiangolo.com/
- **GitHub:** https://github.com/fastapi/fastapi
- **Version:** 0.136.3 (latest stable, June 2026)
- **Install:** `pip install "fastapi[standard]"`
- **Requires:** Python 3.10+
- **Key features:** Async, auto OpenAPI/Swagger, Pydantic v2
- **Server:** `uvicorn main:app --host 0.0.0.0 --port 8000`

### Uvicorn
- **Docs:** https://www.uvicorn.org/
- **Install:** included with `fastapi[standard]`
- **Usage:** `uvicorn main:app --host 0.0.0.0 --port 8000`

### python-multipart
- **Required for:** File upload parsing
- **Install:** `pip install python-multipart`

### Pydantic v2
- **Docs:** https://docs.pydantic.dev/latest/
- **Built into:** FastAPI
- **Key for FasalGuard:** Request/response schema validation for `/api/predict`, `/api/chat`

---

## 4. Backend — ML / AI

### PyTorch
- **Official site:** https://pytorch.org/
- **Docs:** https://pytorch.org/docs/stable/
- **Version:** 2.12.0 (latest, June 2026)
- **Install (CPU only):** `pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu`
- **Install (CUDA 12.8):** `pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cu128`
- **Key for FasalGuard:** ML model inference (ViT)
- **Note:** Use CPU-only install on Railway (no GPU)

### torchvision
- **Docs:** https://pytorch.org/vision/stable/
- **Version:** 0.27.0 (latest, matches torch 2.12.0)
- **Key:** Transforms (V2 API recommended): https://docs.pytorch.org/vision/main/transforms.html
- **Usage:** Image preprocessing for ViT model

### Hugging Face Transformers
- **Official docs:** https://huggingface.co/docs/transformers/index
- **GitHub:** https://github.com/huggingface/transformers
- **Version:** 5.10.2 (latest, June 2026)
- **Install:** `pip install transformers`
- **Key for FasalGuard:** `pipeline("image-classification", model="google/vit-base-patch16-224")`
- **Model hub:** https://huggingface.co/models?pipeline_tag=image-classification&sort=trending

### Pillow (PIL)
- **Docs:** https://pillow.readthedocs.io/
- **Version:** 12.2.0 (latest, June 2026)
- **Install:** `pip install Pillow`
- **Usage:** Image loading/conversion for model input

### numpy
- **Docs:** https://numpy.org/doc/stable/
- **Version:** 2.4.6 (latest, June 2026)
- **Install:** `pip install numpy`
- **Usage:** Array operations, image tensor manipulation

---

## 5. Backend — RAG Chatbot (Phase 4)

### LangChain (Python)
- **Official docs:** https://docs.langchain.com/oss/python/langchain/rag
- **GitHub:** https://github.com/langchain-ai/langchain
- **Version:** 1.3.4 (latest, June 2026)
- **Install:** `pip install langchain langchain-openai langchain-community`
- **Key for FasalGuard:** RAG pipeline — embed treatment docs, retrieve context, answer Q&A
- **Components:** `DocumentLoader`, `TextSplitter`, `VectorStore`, `RetrievalQA`

### ChromaDB (vector store)
- **Docs:** https://docs.trychroma.com/
- **Install:** `pip install chromadb`
- **Usage:** Store treatment document embeddings for RAG

### langchain-openai
- **PyPI:** https://pypi.org/project/langchain-openai/
- **Version:** 1.2.2 (latest, June 2026)
- **Install:** `pip install langchain-openai`
- **Usage:** OpenAI LLM integration for RAG chatbot

### OpenAI / Anthropic API
- **OpenAI:** https://platform.openai.com/docs/
- **Anthropic (Claude):** https://docs.anthropic.com/en/docs
- **Usage:** LLM for treatment Q&A (RAG chatbot)

---

## 6. Device-Side Computer Vision

### @tensorflow/tfjs-react-native
- **GitHub:** https://github.com/tensorflow/tfjs/tree/master/tfjs-react-native
- **npm:** https://www.npmjs.com/package/@tensorflow/tfjs-react-native
- **Version:** 1.0.0 (stable, 2 years old)
- **Install:** `npm install @tensorflow/tfjs @tensorflow/tfjs-react-native`
- **Also need:** `expo-gl`, `expo-camera`
- **Usage:** On-device MobileNetV2 for offline healthy vs diseased binary classification
- **Key step:** `await tf.ready()` before inference
- **Note:** Works with Expo managed workflow, uses `expo-gl` backend

### @tensorflow-models/mobilenet
- **GitHub:** https://github.com/tensorflow/tfjs-models/tree/master/mobilenet
- **Install:** `npm install @tensorflow-models/mobilenet`
- **Usage:** Pre-trained quantized model for offline leaf classification

### Image Quality Analysis
- **Approach:** Backend-based analysis via `/api/quality` endpoint
- **Blur detection:** Laplacian variance (scipy convolve) on grayscale image
- **Darkness detection:** Mean pixel brightness threshold
- **Leaf detection:** Green-channel ratio (green > red && green > blue)
- **Thresholds:** Blur < 80 variance, Dark < 50 mean brightness, Leaf > 0.35 green ratio
- **Frontend fallback:** Simple brightness estimate if backend unreachable
- **Note:** `react-native-opencv` has no maintained React Native binding — use backend scipy

---

## 7. Hosting / DevOps

### Railway
- **Official docs:** https://docs.railway.com/
- **FastAPI deploy guide:** https://docs.railway.com/guides/fastapi
- **Quick start:** https://docs.railway.com/quick-start
- **Dashboard:** https://railway.com/dashboard
- **Free trial credits:** Get initial trial (no credit card required to start)
- **Free tier:** Always-on, 512MB RAM, no session expiry → suitable for capstone demo
- **Regions:** https://docs.railway.com/deployments/regions

### Railway Deploy Methods (Choose One)

#### A) GitHub Auto-Deploy (Recommended)
1. Push your FastAPI backend to a GitHub repo
2. Go to https://railway.com/dashboard → **New Project** → **Deploy from GitHub repo**
3. Select your repo → **Deploy Now**
4. Railway auto-detects Python, installs deps, runs `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Every `git push` to the connected branch triggers a new deployment
6. **GitHub autodeploys:** https://docs.railway.com/deployments/github-autodeploys

#### B) CLI Deploy
```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

### Getting the Public URL (Domain)
After deploying, make the service accessible:
1. Go to **Service Settings** → **Networking** → **Public Networking**
2. Click **Generate Domain** → get `https://fasalguard-production.up.railway.app`
3. Railway automatically provisions SSL certificates

**Key system env variable:** `$RAILWAY_PUBLIC_DOMAIN` — Railway injects this automatically.
Reference: https://docs.railway.com/variables/reference

### How React Native App Connects to Railway
The React Native app (Expo) communicates with the Railway backend via HTTPS using Axios.

#### Setup api.ts (frontend service layer):
```ts
// src/services/api.ts
import axios from 'axios';

// In development: use your Railway URL directly
// In production: pass via environment or build-time config
const RAILWAY_URL = 'https://fasalguard-production.up.railway.app';

const api = axios.create({
  baseURL: RAILWAY_URL,
  timeout: 30000, // 30s — ViT inference can take 3-5s on CPU
});

export const predictLeaf = async (imageUri: string) => {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'leaf.jpg',
  } as any);
  const { data } = await api.post('/api/predict', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const chatWithBot = async (message: string) => {
  const { data } = await api.post('/api/chat', { message });
  return data;
};
```

#### Handling CORS (FastAPI backend):
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow Expo dev client
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### Configuring per environment:
- **Development:** Use `railway run` or the auto-generated URL from Railway dashboard
- **Expo Go:** Use the full Railway URL (e.g., `https://fasalguard-production.up.railway.app`)
- **Production:** Read URL from a config file or environment

### Environment Variables on Railway
Set via **Dashboard** → **Service** → **Variables** tab, or via CLI:
```bash
railway variables set KEY=VALUE
```

| Variable | Purpose | Example |
|----------|---------|---------|
| `PORT` | Railway injects this automatically — uvicorn must bind to `$PORT` | `8000` (auto) |
| `OPENAI_API_KEY` | For RAG chatbot (Phase 4) | `sk-...` |
| `ANTHROPIC_API_KEY` | For Claude Vision LLM | `sk-ant-...` |

Railway also injects: `RAILWAY_PUBLIC_DOMAIN`, `RAILWAY_PROJECT_NAME`, `RAILWAY_ENVIRONMENT_NAME`, etc.
Full reference: https://docs.railway.com/variables/reference

### Optimized Dockerfile for FasalGuard (CPU Inference)
```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install only CPU version of torch (smaller image, Railway has no GPU)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

COPY . .

EXPOSE 8000

# Bind to $PORT (Railway injects this) or default 8000
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
```

**requirements.txt for Railway:**
```
fastapi[standard]
python-multipart
transformers
Pillow
numpy
pydantic
langchain
langchain-openai
chromadb
```

**Note:** `torch` and `torchvision` installed via CPU index in Dockerfile (smaller image size).

### Railway Project Structure for FasalGuard
```
FasalGuard/
├── backend/                    # FastAPI backend
│   ├── main.py                 # App entry point (uvicorn runs this)
│   ├── requirements.txt
│   ├── routers/
│   │   ├── predict.py
│   │   ├── chat.py
│   │   └── health.py
│   ├── models/
│   │   ├── vit_classifier.py
│   │   └── severity_analyzer.py
│   └── utils/
│       └── image_utils.py
├── Dockerfile                  # Railway auto-detects this
└── .gitignore
```

### Troubleshooting Railway
| Issue | Solution |
|-------|----------|
| App fails to start | Check deploy logs — likely missing dependency |
| torch is too large | Use CPU-only install (see Dockerfile above) |
| 502 Bad Gateway | Ensure uvicorn binds to `$PORT` (not hardcoded `8000`) |
| Slow inference | Expected ~3-5s on CPU — show loading skeleton in app |
| CORS errors | Add `CORSMiddleware` with `allow_origins=["*"]` |
| File upload fails | Ensure `python-multipart` is installed |

### EAS Build (Expo Android APK)
- **Docs:** https://docs.expo.dev/build/introduction/
- **Free tier:** 30 builds/month
- **Usage:** `eas build --platform android` for APK
- **Set Railway URL in app config** before building so the APK points to your backend

### GitHub
- **Docs:** https://docs.github.com/
- **Usage:** Source control, Railway auto-deploy from git
- **Recommended:** Single repo with both `backend/` and `app/` directories, or two repos

---

## 8. Summary: Install Commands Quick Reference

### Python Backend
```bash
pip install "fastapi[standard]" python-multipart pydantic
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install transformers Pillow numpy
```

### React Native (Expo) App
```bash
npx create-expo-app@latest FasalGuardApp
cd FasalGuardApp
npx expo install expo-camera expo-image-picker expo-image-manipulator
npx expo install react-native-reanimated react-native-worklets
npx expo install react-native-maps expo-location
npx expo install react-native-gesture-handler
npx expo install @react-native-async-storage/async-storage
npm install lucide-react-native react-native-markdown-display axios zustand
npm install @tensorflow/tfjs @tensorflow/tfjs-react-native @tensorflow-models/mobilenet
```

### RAG Chatbot (Python)
```bash
pip install langchain langchain-openai chromadb
```
