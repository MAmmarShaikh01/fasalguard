import os
import sys
from pathlib import Path
from dotenv import load_dotenv

os.environ["TQDM_DISABLE"] = "1"

# Workaround: Python 3.13+ on Windows crashes when tqdm tries to flush stderr
if os.name == "nt" and sys.version_info >= (3, 13):
    class _SafeStderr:
        def write(self, s):
            try:
                sys.__stderr__.write(s)
            except OSError:
                pass
        def flush(self):
            try:
                sys.__stderr__.flush()
            except OSError:
                pass
        def isatty(self):
            try:
                return sys.__stderr__.isatty()
            except OSError:
                return False
    sys.stderr = _SafeStderr()

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import health, predict, chat, quality, identify_plant

app = FastAPI(title="FasalGuard API", version="1.0.0")

@app.get("/")
async def root():
    return {
        "app": "FasalGuard API",
        "version": "1.0.0",
        "endpoints": {
            "GET /api/health": "Health check",
            "POST /api/predict": "Upload leaf image → disease diagnosis",
            "POST /api/quality": "Image quality check",
            "POST /api/identify-plant": "Plant species identification",
            "POST /api/chat": "Treatment assistant (needs GROQ_API_KEY)",
        },
    }

origins_str = os.environ.get("CORS_ORIGINS", "*")
allowed_origins = [o.strip() for o in origins_str.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(predict.router)
app.include_router(chat.router)
app.include_router(quality.router)
app.include_router(identify_plant.router)
