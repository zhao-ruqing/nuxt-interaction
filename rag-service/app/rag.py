"""
Standard RAG pipeline (separated for learning):

  ingest.py   — load docs → chunk (500/50) → embed → Chroma persist
  retrieve.py — question embed → TopK similarity search → return chunks
  generate.py — build prompt FROM retrieved chunks only → chat → answer+citations

rag.py re-exports the public API used by FastAPI.
No generation without retrieval; insufficient context must refuse.
"""
from app.ingest import ingest
from app.retrieve import retrieve
from app.generate import generate, chat

__all__ = ["ingest", "retrieve", "generate", "chat"]
