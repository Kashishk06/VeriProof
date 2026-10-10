import os
import sys

_CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
_BACKEND_DIR = os.path.dirname(_CURRENT_DIR)
_ROOT_DIR = os.path.dirname(_BACKEND_DIR)
for _p in (_BACKEND_DIR, _ROOT_DIR, os.path.join(_ROOT_DIR, "ml")):
    if _p not in sys.path:
        sys.path.insert(0, _p)

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.router import api_router


# Configure basic logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    version="1.0.0"
)

# Set up CORS
origins = [str(origin) for origin in settings.CORS_ORIGINS] if settings.CORS_ORIGINS else []
for _default in ["http://localhost:5173", "http://localhost:3000", "http://localhost:4173"]:
    if _default not in origins:
        origins.append(_default)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["Root"])
def root_endpoint():
    return {
        "message": "Welcome to the VeriProof API",
        "docs_url": "/docs",
        "health_url": f"{settings.API_V1_STR}/health"
    }

app.include_router(api_router, prefix=settings.API_V1_STR)
