"""Ingest: load source files → fixed-size chunk → DashScope embed → Chroma persist.

New/changed files are NOT auto-watched. Call POST /ingest explicitly after adding files.
"""
from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Any

import chromadb
from openai import OpenAI

from app import config

TEXT_SUFFIXES = {".md", ".txt", ".markdown"}


def get_openai_client() -> OpenAI:
    return OpenAI(
        api_key=config.require_api_key(),
        base_url=config.DASHSCOPE_BASE_URL,
    )


def get_chroma_collection(reset: bool = False):
    config.CHROMA_DIR.mkdir(parents=True, exist_ok=True)
    client = chromadb.PersistentClient(path=str(config.CHROMA_DIR))
    if reset:
        try:
            client.delete_collection(config.COLLECTION_NAME)
        except Exception:
            pass
    return client.get_or_create_collection(
        name=config.COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )


def iter_source_files(data_dir: Path | None = None) -> list[Path]:
    root = data_dir or config.DATA_DIR
    if not root.exists():
        return []
    files: list[Path] = []
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if ".git" in path.parts:
            continue
        if path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        files.append(path)
    return sorted(files)


def chunk_text(
    text: str,
    size: int = config.CHUNK_SIZE,
    overlap: int = config.CHUNK_OVERLAP,
) -> list[str]:
    """Fixed-size character chunks with overlap (standard RAG chunking)."""
    text = text.replace("\r\n", "\n").strip()
    if not text:
        return []
    if len(text) <= size:
        return [text]
    chunks: list[str] = []
    start = 0
    n = len(text)
    while start < n:
        end = min(start + size, n)
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= n:
            break
        start = max(0, end - overlap)
        if start >= n:
            break
    return chunks


def _stable_id(source: str, index: int, content: str) -> str:
    digest = hashlib.sha1(f"{source}|{index}|{content[:64]}".encode("utf-8")).hexdigest()[:16]
    return f"{digest}_{index}"


def embed_texts(client: OpenAI, texts: list[str]) -> list[list[float]]:
    """DashScope OpenAI-compatible embeddings."""
    if not texts:
        return []
    out: list[list[float]] = []
    batch_size = 16
    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        resp = client.embeddings.create(model=config.EMBEDDING_MODEL, input=batch)
        sorted_data = sorted(resp.data, key=lambda d: d.index)
        out.extend([d.embedding for d in sorted_data])
    return out


def ingest(reset: bool = True) -> dict[str, Any]:
    """Full ingest pipeline: scan → chunk → embed → upsert into Chroma."""
    files = iter_source_files()
    if not files:
        return {"files": 0, "chunks": 0, "message": f"No .md/.txt under {config.DATA_DIR}"}

    client = get_openai_client()
    collection = get_chroma_collection(reset=reset)

    ids: list[str] = []
    documents: list[str] = []
    metadatas: list[dict[str, Any]] = []

    for path in files:
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        rel = str(path.relative_to(config.DATA_DIR)).replace("\\", "/")
        for i, chunk in enumerate(chunk_text(text)):
            ids.append(_stable_id(rel, i, chunk))
            documents.append(chunk)
            metadatas.append({"source": rel, "chunk_index": i})

    if not documents:
        return {"files": len(files), "chunks": 0, "message": "Files found but no text chunks"}

    batch_size = 32
    for i in range(0, len(documents), batch_size):
        batch_docs = documents[i : i + batch_size]
        batch_ids = ids[i : i + batch_size]
        batch_meta = metadatas[i : i + batch_size]
        embeddings = embed_texts(client, batch_docs)
        collection.upsert(
            ids=batch_ids,
            documents=batch_docs,
            metadatas=batch_meta,
            embeddings=embeddings,
        )

    return {
        "files": len(files),
        "chunks": len(documents),
        "data_dir": str(config.DATA_DIR),
        "chroma_dir": str(config.CHROMA_DIR),
        "embedding_model": config.EMBEDDING_MODEL,
        "chunk_size": config.CHUNK_SIZE,
        "chunk_overlap": config.CHUNK_OVERLAP,
    }
