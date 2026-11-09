"""Lexical BM25 index over ingested chunks (Chinese-aware via jieba).

Built at ingest time; used by hybrid retrieve. Supports full rebuild and append.
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

import jieba
from rank_bm25 import BM25Okapi

from app import config

_TOKEN_RE = re.compile(r"[\w\u4e00-\u9fff]+", re.UNICODE)


def tokenize(text: str) -> list[str]:
    text = (text or "").strip().lower()
    if not text:
        return []
    parts = [t.strip() for t in jieba.lcut(text) if t and t.strip()]
    out: list[str] = []
    for t in parts:
        if _TOKEN_RE.fullmatch(t) or any(ch.isalnum() or "\u4e00" <= ch <= "\u9fff" for ch in t):
            if t not in ("的", "了", "和", "与", "或", "是", "在", "为", "及"):
                out.append(t)
    return out


def build_and_save(
    ids: list[str],
    documents: list[str],
    metadatas: list[dict[str, Any]],
    path: Path | None = None,
) -> dict[str, Any]:
    path = path or config.BM25_PATH
    path.parent.mkdir(parents=True, exist_ok=True)
    corpus_tokens = [tokenize(doc) for doc in documents]
    payload = {
        "ids": ids,
        "documents": documents,
        "metadatas": metadatas,
        "tokens": corpus_tokens,
    }
    path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    return {"docs": len(ids), "path": str(path), "mode": "rebuild"}


def _load(path: Path | None = None) -> dict[str, Any] | None:
    path = path or config.BM25_PATH
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def append_and_save(
    ids: list[str],
    documents: list[str],
    metadatas: list[dict[str, Any]],
    path: Path | None = None,
) -> dict[str, Any]:
    """Append new chunks to the existing BM25 corpus (skip duplicate ids)."""
    path = path or config.BM25_PATH
    data = _load(path) or {"ids": [], "documents": [], "metadatas": [], "tokens": []}
    existing = set(data.get("ids") or [])
    added = 0
    for cid, doc, meta in zip(ids, documents, metadatas):
        if cid in existing:
            continue
        data.setdefault("ids", []).append(cid)
        data.setdefault("documents", []).append(doc)
        data.setdefault("metadatas", []).append(meta)
        data.setdefault("tokens", []).append(tokenize(doc))
        existing.add(cid)
        added += 1
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    return {
        "docs": len(data.get("ids") or []),
        "added": added,
        "path": str(path),
        "mode": "append",
    }


def search(query: str, top_n: int = 20) -> list[dict[str, Any]]:
    """Return ranked lexical hits: id, source, chunk_index, excerpt, bm25_score, rank."""
    data = _load()
    if not data or not data.get("ids"):
        return []
    tokens_list = data.get("tokens") or []
    if not tokens_list:
        return []
    q_tokens = tokenize(query)
    if not q_tokens:
        return []
    bm25 = BM25Okapi(tokens_list)
    scores = bm25.get_scores(q_tokens)
    ranked = sorted(range(len(scores)), key=lambda i: float(scores[i]), reverse=True)
    hits: list[dict[str, Any]] = []
    for rank_i, idx in enumerate(ranked[: max(1, top_n)], 1):
        score = float(scores[idx])
        if score <= 0:
            break
        meta = (data.get("metadatas") or [{}])[idx] or {}
        hits.append(
            {
                "id": data["ids"][idx],
                "source": meta.get("source", "unknown"),
                "chunk_index": meta.get("chunk_index"),
                "sheet": meta.get("sheet"),
                "excerpt": data["documents"][idx],
                "bm25_score": score,
                "rank": rank_i,
                "channel": "bm25",
            }
        )
    return hits
