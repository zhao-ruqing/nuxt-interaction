"""FastAPI RAG service for nuxt-interaction. Frontend stays in Nuxt (zero keys)."""
from __future__ import annotations

from typing import Any, Literal

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app import config
from app import rag
from app import ingest_extra

app = FastAPI(title="nuxt-interaction RAG", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:3000", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str = Field(..., min_length=1)


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1)
    top_k: int = Field(default=4, ge=1, le=10)
    messages: list[ChatMessage] | None = None
    history: list[ChatMessage] | None = None


class IngestRequest(BaseModel):
    reset: bool = True


class QaRequest(BaseModel):
    question: str = Field(..., min_length=1)
    answer: str = Field(..., min_length=1)


@app.get("/health")
def health():
    return {
        "ok": True,
        "chat_model": config.CHAT_MODEL,
        "embedding_model": config.EMBEDDING_MODEL,
        "data_dir": str(config.DATA_DIR),
        "chroma_dir": str(config.CHROMA_DIR),
        "collection": config.COLLECTION_NAME,
        "qa_subdir": ingest_extra.QA_SUBDIR,
        "upload_subdir": ingest_extra.UPLOAD_SUBDIR,
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
        hist_models = body.messages if body.messages is not None else body.history
        history: list[dict[str, Any]] | None = None
        if hist_models:
            history = [{"role": m.role, "content": m.content} for m in hist_models]
        return rag.chat(
            question=body.question.strip(),
            top_k=body.top_k,
            history=history,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.post("/qa")
def add_qa(body: QaRequest):
    """Persist a Q&A markdown under 15-用户问答 and incremental-ingest it."""
    try:
        return ingest_extra.ingest_qa(body.question.strip(), body.answer.strip())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.post("/upload")
async def upload_source(
    file: UploadFile = File(...),
    subdir: str | None = Form(default=None),
):
    """Save an allowed source file under DATA_DIR and incremental-ingest it."""
    try:
        raw = await file.read()
        if not raw:
            raise HTTPException(status_code=400, detail="empty file")
        name = file.filename or "upload.bin"
        return ingest_extra.ingest_upload(name, raw, subdir=subdir)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
