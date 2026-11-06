"""Retrieve: embed the question → TopK cosine similarity over Chroma → return chunks.

Never calls the chat model. Callers must pass these hits into generate.
"""
from __future__ import annotations

from typing import Any

from app import config
from app.ingest import embed_texts, get_chroma_collection, get_openai_client


def retrieve(question: str, top_k: int = config.TOP_K) -> dict[str, Any]:
    """Embed question, similarity-search Chroma.

    Returns:
      {
        "hits": [{rank, source, chunk_index, excerpt, distance, similarity}, ...],
        "embedding": {model, dimensions, status, note},
        "top_k_requested": int,
        "collection_count": int,
      }
    """
    question = (question or "").strip()
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
            "collection_count": 0,
        }

    client = get_openai_client()
    collection = get_chroma_collection(reset=False)
    count = collection.count()
    if count == 0:
        embedding_meta["status"] = "skipped"
        embedding_meta["note"] = "知识库为空，跳过向量化"
        return {
            "hits": [],
            "embedding": embedding_meta,
            "top_k_requested": top_k,
            "collection_count": 0,
        }

    q_emb = embed_texts(client, [question])[0]
    embedding_meta = {
        "model": config.EMBEDDING_MODEL,
        "dimensions": len(q_emb),
        "status": "ok",
        "note": "已向量化（不展示向量数值）",
    }

    n = min(top_k, count)
    result = collection.query(
        query_embeddings=[q_emb],
        n_results=n,
        include=["documents", "metadatas", "distances"],
    )
    docs = (result.get("documents") or [[]])[0]
    metas = (result.get("metadatas") or [[]])[0]
    dists = (result.get("distances") or [[]])[0]

    hits: list[dict[str, Any]] = []
    for rank, (doc, meta, dist) in enumerate(zip(docs, metas, dists), 1):
        meta = meta or {}
        # Chroma cosine space: distance ≈ 1 - cosine_similarity
        try:
            similarity = 1.0 - float(dist)
        except (TypeError, ValueError):
            similarity = None
        hits.append(
            {
                "rank": rank,
                "source": meta.get("source", "unknown"),
                "chunk_index": meta.get("chunk_index"),
                "excerpt": doc or "",
                "distance": dist,
                "similarity": similarity,
            }
        )
    return {
        "hits": hits,
        "embedding": embedding_meta,
        "top_k_requested": top_k,
        "collection_count": count,
    }
