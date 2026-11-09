"""Ingest: load source files → chunk → DashScope embed → Chroma + BM25 persist.

New/changed files are NOT auto-watched. Call POST /ingest explicitly after adding files.
xlsx: chunk by sheet header+row units (generic for all workbooks).
"""
from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Any

import chromadb
from openai import OpenAI

from app import config
from app import bm25_index

TEXT_SUFFIXES = {".md", ".txt", ".markdown"}
XLSX_SUFFIXES = {".xlsx"}
SUPPORTED_SUFFIXES = TEXT_SUFFIXES | XLSX_SUFFIXES


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
        if path.name.startswith("~$"):
            continue
        if path.suffix.lower() not in SUPPORTED_SUFFIXES:
            continue
        files.append(path)
    return sorted(files)


def _cell_str(v: Any) -> str:
    if v is None:
        return ""
    return str(v).strip()


def iter_xlsx_units(path: Path) -> list[dict[str, Any]]:
    """Yield retrievable units: one chunk per header+data-row (all sheets).

    Short fields (e.g. application cells) stay in their own small units instead
    of being buried inside a large electrical-characteristics blob.
    """
    from openpyxl import load_workbook

    wb = load_workbook(path, read_only=True, data_only=True)
    units: list[dict[str, Any]] = []
    doc_name = path.name

    for sheet in wb.worksheets:
        rows = list(sheet.iter_rows(values_only=True))
        if not rows:
            continue
        header = None
        data_start = 0
        for idx, row in enumerate(rows):
            cells = [_cell_str(c) for c in row]
            if any(cells):
                header = cells
                data_start = idx + 1
                break
        if not header:
            continue
        while header and header[-1] == "":
            header.pop()
        if not header:
            continue

        # Sheet banner unit (helps sheet-level discovery without huge blobs)
        banner = (
            f"文档: {doc_name}\n"
            f"工作表: {sheet.title}\n"
            f"表头: {' | '.join(header)}"
        )
        units.append(
            {
                "text": banner,
                "sheet": sheet.title,
                "row_index": None,
                "kind": "sheet_header",
            }
        )

        for r_i, row in enumerate(rows[data_start:], start=data_start + 1):
            cells = [_cell_str(c) for c in row[: len(header)]]
            if not any(cells):
                continue
            pairs = []
            for h, v in zip(header, cells):
                if v == "":
                    continue
                pairs.append(f"{h}={v}")
            if not pairs:
                continue
            text = (
                f"文档: {doc_name}\n"
                f"工作表: {sheet.title}\n"
                f"表头: {' | '.join(header)}\n"
                f"行: {'; '.join(pairs)}"
            )
            units.append(
                {
                    "text": text,
                    "sheet": sheet.title,
                    "row_index": r_i,
                    "kind": "row",
                }
            )
    wb.close()
    return units


def _is_qa_path(path: Path) -> bool:
    """User Q&A markdown under 15-用户问答 (or qa_*.md) stays one retrievable unit."""
    parts = set(path.parts)
    if "15-用户问答" in parts:
        return True
    name = path.name.lower()
    return name.startswith("qa_") and path.suffix.lower() in TEXT_SUFFIXES


def load_file_units(path: Path) -> list[dict[str, Any]]:
    """Return list of {text, sheet?, row_index?, kind} for any supported file."""
    suffix = path.suffix.lower()
    if suffix in XLSX_SUFFIXES:
        return iter_xlsx_units(path)
    raw = path.read_text(encoding="utf-8", errors="ignore")
    if _is_qa_path(path):
        # Never split Q from A — one citation-friendly unit.
        body = raw.strip()
        if not body:
            return []
        return [{"text": body, "sheet": None, "row_index": None, "kind": "qa"}]
    chunks = chunk_text(raw)
    return [{"text": c, "sheet": None, "row_index": None, "kind": "text"} for c in chunks]


def chunk_text(
    text: str,
    size: int = config.CHUNK_SIZE,
    overlap: int = config.CHUNK_OVERLAP,
) -> list[str]:
    """Fixed-size character chunks with overlap (for md/txt)."""
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
    """Full ingest pipeline: scan → chunk → embed → Chroma + BM25."""
    files = iter_source_files()
    if not files:
        return {
            "files": 0,
            "chunks": 0,
            "message": f"No .md/.txt/.xlsx under {config.DATA_DIR}",
        }

    client = get_openai_client()
    collection = get_chroma_collection(reset=reset)

    ids: list[str] = []
    documents: list[str] = []
    metadatas: list[dict[str, Any]] = []

    for path in files:
        try:
            units = load_file_units(path)
        except Exception:
            continue
        rel = str(path.relative_to(config.DATA_DIR)).replace("\\", "/")
        local_index = 0
        for unit in units:
            unit_text = (unit.get("text") or "").strip()
            if not unit_text:
                continue
            if (unit.get("kind") or "") == "qa":
                pieces = [unit_text]
            else:
                pieces = (
                    chunk_text(unit_text)
                    if len(unit_text) > config.CHUNK_SIZE
                    else [unit_text]
                )
            for piece in pieces:
                cid = _stable_id(rel, local_index, piece)
                ids.append(cid)
                documents.append(piece)
                meta: dict[str, Any] = {
                    "source": rel,
                    "chunk_index": local_index,
                    "kind": unit.get("kind") or "text",
                }
                if unit.get("sheet") is not None:
                    meta["sheet"] = str(unit["sheet"])
                if unit.get("row_index") is not None:
                    meta["row_index"] = int(unit["row_index"])
                metadatas.append(meta)
                local_index += 1

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

    bm25_info = bm25_index.build_and_save(ids, documents, metadatas)

    return {
        "files": len(files),
        "chunks": len(documents),
        "data_dir": str(config.DATA_DIR),
        "chroma_dir": str(config.CHROMA_DIR),
        "bm25_path": bm25_info.get("path"),
        "embedding_model": config.EMBEDDING_MODEL,
        "chunk_size": config.CHUNK_SIZE,
        "chunk_overlap": config.CHUNK_OVERLAP,
        "xlsx_chunking": "header+row units (all sheets)",
    }
