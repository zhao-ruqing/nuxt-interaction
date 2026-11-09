"""Hybrid retrieve: vector (Chroma) + lexical (BM25) → RRF fuse → TopK.

Never calls the chat model. Callers must pass these hits into generate.
"""
from __future__ import annotations

from typing import Any

from app import config
from app import bm25_index
from app.ingest import embed_texts, get_chroma_collection, get_openai_client


def _rrf_fuse(
    vector_hits: list[dict[str, Any]],
    lexical_hits: list[dict[str, Any]],
    top_k: int,
    rrf_k: int = config.RRF_K,
) -> list[dict[str, Any]]:
    """Reciprocal Rank Fusion over two ranked lists. Keyed by chunk id or source+index+excerpt hash."""
    scores: dict[str, float] = {}
    payload: dict[str, dict[str, Any]] = {}

    def _key(h: dict[str, Any]) -> str:
        if h.get("id"):
            return str(h["id"])
        return f"{h.get('source')}|{h.get('chunk_index')}|{(h.get('excerpt') or '')[:48]}"

    for h in vector_hits:
        key = _key(h)
        rank = int(h.get("rank") or 9999)
        scores[key] = scores.get(key, 0.0) + 1.0 / (rrf_k + rank)
        base = payload.get(key) or {
            "id": h.get("id"),
            "source": h.get("source"),
            "chunk_index": h.get("chunk_index"),
            "sheet": h.get("sheet"),
            "excerpt": h.get("excerpt") or "",
            "distance": h.get("distance"),
            "similarity": h.get("similarity"),
            "bm25_score": None,
            "channels": [],
        }
        if "vector" not in base["channels"]:
            base["channels"].append("vector")
        base["distance"] = h.get("distance", base.get("distance"))
        base["similarity"] = h.get("similarity", base.get("similarity"))
        if h.get("sheet") and not base.get("sheet"):
            base["sheet"] = h.get("sheet")
        payload[key] = base

    for h in lexical_hits:
        key = _key(h)
        rank = int(h.get("rank") or 9999)
        scores[key] = scores.get(key, 0.0) + 1.0 / (rrf_k + rank)
        base = payload.get(key) or {
            "id": h.get("id"),
            "source": h.get("source"),
            "chunk_index": h.get("chunk_index"),
            "sheet": h.get("sheet"),
            "excerpt": h.get("excerpt") or "",
            "distance": None,
            "similarity": None,
            "bm25_score": h.get("bm25_score"),
            "channels": [],
        }
        if "bm25" not in base["channels"]:
            base["channels"].append("bm25")
        base["bm25_score"] = h.get("bm25_score", base.get("bm25_score"))
        if not base.get("excerpt"):
            base["excerpt"] = h.get("excerpt") or ""
        if h.get("sheet") and not base.get("sheet"):
            base["sheet"] = h.get("sheet")
        payload[key] = base

    ordered = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)
    fused: list[dict[str, Any]] = []
    for rank, (key, score) in enumerate(ordered[: max(1, top_k)], 1):
        item = dict(payload[key])
        item["rank"] = rank
        item["rrf_score"] = score
        fused.append(item)
    return fused


def retrieve(question: str, top_k: int = config.TOP_K) -> dict[str, Any]:
    """Hybrid: wider vector + BM25 recall → RRF → final TopK."""
    question = (question or "").strip()
    pool = max(int(config.CANDIDATE_POOL), int(top_k))
    embedding_meta: dict[str, Any] = {
        "model": config.EMBEDDING_MODEL,
        "dimensions": 0,
        "status": "skipped",
        "note": "未向量化",
    }

    if not question:
        return {
            "hits": [],
            "embedding": embedding_meta,
            "top_k_requested": top_k,
            "candidate_pool": pool,
            "collection_count": 0,
            "fusion": "rrf",
            "vector_hit_count": 0,
            "bm25_hit_count": 0,
        }

    collection = get_chroma_collection(reset=False)
    count = collection.count()
    if count == 0:
        embedding_meta["status"] = "skipped"
        embedding_meta["note"] = "知识库为空，跳过向量化"
        return {
            "hits": [],
            "embedding": embedding_meta,
            "top_k_requested": top_k,
            "candidate_pool": pool,
            "collection_count": 0,
            "fusion": "rrf",
            "vector_hit_count": 0,
            "bm25_hit_count": 0,
        }

    # --- vector channel ---
    client = get_openai_client()
    q_emb = embed_texts(client, [question])[0]
    embedding_meta = {
        "model": config.EMBEDDING_MODEL,
        "dimensions": len(q_emb),
        "status": "ok",
        "note": "已向量化（不展示向量数值）",
    }
    n_vec = min(pool, count)
    result = collection.query(
        query_embeddings=[q_emb],
        n_results=n_vec,
        include=["documents", "metadatas", "distances"],
    )
    docs = (result.get("documents") or [[]])[0]
    metas = (result.get("metadatas") or [[]])[0]
    dists = (result.get("distances") or [[]])[0]
    ids_list = (result.get("ids") or [[]])[0]

    vector_hits: list[dict[str, Any]] = []
    for rank, (doc, meta, dist) in enumerate(zip(docs, metas, dists), 1):
        meta = meta or {}
        try:
            similarity = 1.0 - float(dist)
        except (TypeError, ValueError):
            similarity = None
        cid = ids_list[rank - 1] if rank - 1 < len(ids_list) else None
        vector_hits.append(
            {
                "id": cid,
                "rank": rank,
                "source": meta.get("source", "unknown"),
                "chunk_index": meta.get("chunk_index"),
                "sheet": meta.get("sheet"),
                "excerpt": doc or "",
                "distance": dist,
                "similarity": similarity,
                "channel": "vector",
            }
        )

    # --- lexical channel ---
    lexical_hits = bm25_index.search(question, top_n=pool)

    fused = _rrf_fuse(vector_hits, lexical_hits, top_k=top_k, rrf_k=config.RRF_K)

    return {
        "hits": fused,
        "embedding": embedding_meta,
        "top_k_requested": top_k,
        "candidate_pool": pool,
        "collection_count": count,
        "fusion": "rrf",
        "vector_hit_count": len(vector_hits),
        "bm25_hit_count": len(lexical_hits),
        "query": question,
    }
