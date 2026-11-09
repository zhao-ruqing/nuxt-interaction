"""
Standard RAG pipeline (separated for learning):

  rewrite.py         — conversational contextualize (anaphora/ellipsis only)
  normalize_query.py — search-friendly retrieval query (no invented part numbers)
  ingest.py          — load docs → chunk → embed → Chroma + BM25
  ingest_extra.py    — incremental path/Q&A/upload ingest
  retrieve.py        — hybrid vector+BM25 → RRF → TopK
  generate.py        — prompt FROM retrieved chunks (+ history) → chat

rag.py re-exports the public API used by FastAPI.
"""
from app.ingest import ingest
from app.retrieve import retrieve
from app.generate import generate, chat
from app.rewrite import rewrite_question
from app.normalize_query import normalize_search_query
from app.ingest_extra import ingest_paths, ingest_qa, ingest_upload

__all__ = [
    "ingest",
    "retrieve",
    "generate",
    "chat",
    "rewrite_question",
    "normalize_search_query",
    "ingest_paths",
    "ingest_qa",
    "ingest_upload",
]
