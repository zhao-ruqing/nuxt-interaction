"""FastAPI RAG service for nuxt-interaction. Frontend stays in Nuxt (zero keys)."""
from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app import config
from app import rag

app = FastAPI(title="nuxt-interaction RAG", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:3000", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1)
    top_k: int = Field(default=4, ge=1, le=10)


class IngestRequest(BaseModel):
    reset: bool = True


@app.get("/health")
def health():
    return {
        "ok": True,
        "chat_model": config.CHAT_MODEL,
        "embedding_model": config.EMBEDDING_MODEL,
        "data_dir": str(config.DATA_DIR),
        "chroma_dir": str(config.CHROMA_DIR),
        "collection": config.COLLECTION_NAME,
    }


@app.post("/ingest")
def ingest(body: IngestRequest | None = None):
    reset = True if body is None else body.reset
    try:
        return rag.ingest(reset=reset)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.post("/chat")
def chat(body: ChatRequest):
    try:
        return rag.chat(question=body.question.strip(), top_k=body.top_k)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
