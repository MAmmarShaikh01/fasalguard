from fastapi import APIRouter
import torch
import transformers

router = APIRouter()

@router.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "torch_version": torch.__version__,
        "transformers_version": transformers.__version__,
    }
