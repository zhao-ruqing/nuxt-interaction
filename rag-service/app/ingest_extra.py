"""Incremental ingest helpers: paths, Q&A markdown, uploads."""
from __future__ import annotations

import re
from datetime import datetime
from pathlib import Path
from typing import Any

from app import config
from app import bm25_index
from app.ingest import (
    SUPPORTED_SUFFIXES,
    TEXT_SUFFIXES,
    _stable_id,
    chunk_text,
    embed_texts,
    get_chroma_collection,
    get_openai_client,
    load_file_units,
)

QA_SUBDIR = "15-用户问答"
UPLOAD_SUBDIR = "16-用户上传"


def _materialize_chunks(
    rel: str,
    units: list[dict[str, Any]],
) -> tuple[list[str], list[str], list[dict[str, Any]]]:
    ids: list[str] = []
    documents: list[str] = []
    metadatas: list[dict[str, Any]] = []
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
    return ids, documents, metadatas


def _upsert_chunks(
    ids: list[str],
    documents: list[str],
    metadatas: list[dict[str, Any]],
    *,
    incremental: bool,
) -> dict[str, Any]:
    if not documents:
        return {"chunks": 0, "bm25": None, "collection_count": 0}
    client = get_openai_client()
    collection = get_chroma_collection(reset=False)
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
    if incremental:
        bm25_info = bm25_index.append_and_save(ids, documents, metadatas)
    else:
        bm25_info = bm25_index.build_and_save(ids, documents, metadatas)
    return {
        "chunks": len(documents),
        "bm25": bm25_info,
        "collection_count": collection.count(),
    }


def ingest_paths(paths: list[Path], *, incremental: bool = True) -> dict[str, Any]:
    """Ingest only the given files. Incremental: upsert + BM25 append (no full reset)."""
    if not paths:
        return {
            "files": 0,
            "chunks": 0,
            "message": "no paths",
            "mode": "incremental" if incremental else "full",
        }

    all_ids: list[str] = []
    all_docs: list[str] = []
    all_meta: list[dict[str, Any]] = []
    rels: list[str] = []

    for path in paths:
        path = Path(path)
        if not path.is_file():
            continue
        if path.suffix.lower() not in SUPPORTED_SUFFIXES:
            continue
        try:
            rel = str(path.relative_to(config.DATA_DIR)).replace("\\", "/")
            units = load_file_units(path)
        except Exception:
            continue
        ids, docs, metas = _materialize_chunks(rel, units)
        if not docs:
            continue
        rels.append(rel)
        all_ids.extend(ids)
        all_docs.extend(docs)
        all_meta.extend(metas)

    if not all_docs:
        return {
            "files": 0,
            "chunks": 0,
            "sources": [],
            "message": "no chunks from paths",
            "mode": "incremental" if incremental else "full",
        }

    result = _upsert_chunks(all_ids, all_docs, all_meta, incremental=incremental)
    return {
        "files": len(rels),
        "chunks": result["chunks"],
        "added_chunks": result["chunks"],
        "sources": rels,
        "data_dir": str(config.DATA_DIR),
        "chroma_dir": str(config.CHROMA_DIR),
        "bm25": result.get("bm25"),
        "collection_count": result.get("collection_count"),
        "mode": "incremental" if incremental else "full",
        "embedding_model": config.EMBEDDING_MODEL,
    }


def unique_dest_path(directory: Path, filename: str) -> Path:
    directory.mkdir(parents=True, exist_ok=True)
    safe = Path(filename).name
    if not safe or safe in (".", ".."):
        raise ValueError("invalid filename")
    target = directory / safe
    if not target.exists():
        return target
    stem = Path(safe).stem
    suffix = Path(safe).suffix
    i = 1
    while True:
        cand = directory / f"{stem}_{i}{suffix}"
        if not cand.exists():
            return cand
        i += 1


def save_qa_markdown(question: str, answer: str) -> Path:
    q = (question or "").strip()
    a = (answer or "").strip()
    if not q or not a:
        raise ValueError("question and answer are required")

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    slug = re.sub(r"[^\w\u4e00-\u9fff]+", "_", q[:24], flags=re.UNICODE).strip("_") or "qa"
    filename = f"qa_{ts}_{slug}.md"
    dest_dir = config.DATA_DIR / QA_SUBDIR
    dest = unique_dest_path(dest_dir, filename)

    body = (
        "---\n"
        "type: qa\n"
        f"created: {datetime.now().isoformat(timespec='seconds')}\n"
        "---\n\n"
        "# 用户问答\n\n"
        "## 问题\n"
        f"{q}\n\n"
        "## 答案\n"
        f"{a}\n"
    )
    dest.write_text(body, encoding="utf-8")
    return dest


def ingest_qa(question: str, answer: str) -> dict[str, Any]:
    path = save_qa_markdown(question, answer)
    result = ingest_paths([path], incremental=True)
    result["saved_path"] = str(path)
    result["rel_source"] = str(path.relative_to(config.DATA_DIR)).replace("\\", "/")
    result["kind"] = "qa"
    return result


def save_upload(
    filename: str,
    content: bytes,
    subdir: str | None = None,
) -> Path:
    name = Path(filename).name
    suffix = Path(name).suffix.lower()
    if suffix not in SUPPORTED_SUFFIXES:
        raise ValueError(
            f"unsupported file type: {suffix or '(none)'}; "
            f"allowed: {sorted(SUPPORTED_SUFFIXES)}"
        )

    rel = (subdir or UPLOAD_SUBDIR).replace("\\", "/").strip().strip("/")
    if not rel:
        rel = UPLOAD_SUBDIR
    dest_dir = (config.DATA_DIR / rel).resolve()
    data_root = config.DATA_DIR.resolve()
    if dest_dir != data_root and data_root not in dest_dir.parents:
        raise ValueError("subdir escapes data directory")

    dest = unique_dest_path(dest_dir, name)
    dest.write_bytes(content)
    return dest


def ingest_upload(
    filename: str,
    content: bytes,
    subdir: str | None = None,
) -> dict[str, Any]:
    path = save_upload(filename, content, subdir=subdir)
    result = ingest_paths([path], incremental=True)
    result["saved_path"] = str(path)
    result["rel_source"] = str(path.relative_to(config.DATA_DIR)).replace("\\", "/")
    result["kind"] = "upload"
    result["renamed"] = Path(filename).name != path.name
    return result
