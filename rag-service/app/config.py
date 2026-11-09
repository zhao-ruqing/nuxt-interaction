"""Load settings from .env (never hardcode secrets)."""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")


def _path(value: str | None, default: Path) -> Path:
    p = Path(value) if value else default
    if not p.is_absolute():
        p = ROOT / p
    return p


DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY", "").strip()
DASHSCOPE_BASE_URL = os.getenv(
    "DASHSCOPE_BASE_URL",
    "https://dashscope.aliyuncs.com/compatible-mode/v1",
).strip()
CHAT_MODEL = os.getenv("CHAT_MODEL", "qwen3.8-27b").strip()
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "qwen3.7-text-embedding-flash").strip()
DATA_DIR = _path(os.getenv("DATA_DIR"), Path(r"D:\Project\My-Projects\agent\数据源"))
CHROMA_DIR = _path(os.getenv("CHROMA_DIR"), ROOT / "data" / "chroma")
BM25_PATH = _path(os.getenv("BM25_PATH"), ROOT / "data" / "bm25_index.json")

CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
TOP_K = 4
# Wider recall before fusion; final generation still uses TOP_K (or request top_k).
CANDIDATE_POOL = 20
RRF_K = 60
COLLECTION_NAME = "nuxt_interaction_rag"


def require_api_key() -> str:
    if not DASHSCOPE_API_KEY:
        raise RuntimeError("DASHSCOPE_API_KEY is missing in .env")
    return DASHSCOPE_API_KEY
