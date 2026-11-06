"""Generate: build prompt ONLY from retrieved chunks → DashScope chat → answer + citations.

If retrieval is empty, refuse without calling the model with free-form knowledge.
"""
from __future__ import annotations

from typing import Any

from app import config
from app.ingest import get_openai_client
from app.retrieve import retrieve

SYSTEM_PROMPT = (
    "你是本地知识库问答助手。"
    "你只能根据用户消息里提供的【检索上下文】回答。"
    "若上下文不足以回答，必须明确说「根据现有资料，我不知道」或「资料中未找到相关信息」，禁止编造。"
    "不要使用你自己的世界知识填补空白。"
    "回答简洁；语言与问题一致。"
)


def _build_user_prompt(question: str, hits: list[dict[str, Any]]) -> str:
    blocks = []
    for i, h in enumerate(hits, 1):
        blocks.append(
            f"[{i}] 来源: {h.get('source')} (chunk_index={h.get('chunk_index')})\n"
            f"{h.get('excerpt') or ''}"
        )
    context = "\n\n".join(blocks)
    return (
        f"【检索上下文】\n{context}\n\n"
        f"【用户问题】\n{question}\n\n"
        "请仅依据【检索上下文】作答；无依据则明确说不知道，不要编造。"
    )


def generate(question: str, hits: list[dict[str, Any]]) -> dict[str, Any]:
    """Generate answer strictly from provided retrieval hits. Does not re-retrieve."""
    citations = [
        {
            "source": h.get("source", "unknown"),
            "chunk_index": h.get("chunk_index"),
            "excerpt": (h.get("excerpt") or "")[:400],
            "distance": h.get("distance"),
            "similarity": h.get("similarity"),
        }
        for h in hits
    ]

    if not hits:
        return {
            "answer": "知识库为空或未检索到相关内容。请先 POST /ingest 导入数据源后再问。",
            "citations": [],
            "model": config.CHAT_MODEL,
            "retrieved": 0,
            "refused": True,
            "refuse_reason": "无足够检索结果",
            "user_prompt": "",
            "system_prompt": SYSTEM_PROMPT,
        }

    user_prompt = _build_user_prompt(question, hits)
    client = get_openai_client()
    resp = client.chat.completions.create(
        model=config.CHAT_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.1,
    )
    answer = (resp.choices[0].message.content or "").strip()
    return {
        "answer": answer,
        "citations": citations,
        "model": config.CHAT_MODEL,
        "retrieved": len(hits),
        "refused": False,
        "refuse_reason": None,
        "user_prompt": user_prompt,
        "system_prompt": SYSTEM_PROMPT,
    }


def chat(question: str, top_k: int = config.TOP_K) -> dict[str, Any]:
    """Standard RAG: retrieve → generate, with visible process steps for the UI."""
    question = (question or "").strip()
    retrieval = retrieve(question, top_k=top_k)
    hits = retrieval.get("hits") or []
    emb = retrieval.get("embedding") or {}

    gen = generate(question=question, hits=hits)

    step1 = {
        "step": 1,
        "name": "问题向量化",
        "status": emb.get("status", "unknown"),
        "detail": {
            "embedding_model": emb.get("model"),
            "dimensions": emb.get("dimensions", 0),
            "note": emb.get("note", ""),
        },
    }

    hit_views = []
    for h in hits:
        hit_views.append(
            {
                "rank": h.get("rank"),
                "source": h.get("source"),
                "chunk_index": h.get("chunk_index"),
                "distance": h.get("distance"),
                "similarity": h.get("similarity"),
                "excerpt": h.get("excerpt") or "",
            }
        )
    step2 = {
        "step": 2,
        "name": "TopK 相似度检索",
        "status": "ok" if hits else "empty",
        "detail": {
            "top_k_requested": retrieval.get("top_k_requested", top_k),
            "collection_count": retrieval.get("collection_count", 0),
            "hit_count": len(hits),
            "hits": hit_views,
            "note": (
                f"命中 {len(hits)} 条 chunk"
                if hits
                else "无足够检索结果 → 将拒答"
            ),
        },
    }

    if hits:
        step3 = {
            "step": 3,
            "name": "Prompt 组装",
            "status": "ok",
            "detail": {
                "note": "仅用上述检索到的 chunk 拼进【检索上下文】，不注入模型世界知识",
                "system_prompt": gen.get("system_prompt") or SYSTEM_PROMPT,
                "user_prompt": gen.get("user_prompt") or "",
                "chunk_count_in_context": len(hits),
            },
        }
    else:
        step3 = {
            "step": 3,
            "name": "Prompt 组装",
            "status": "skipped",
            "detail": {
                "note": "无足够检索结果 → 跳过 Prompt 组装，不调用聊天模型编造答案",
                "system_prompt": "",
                "user_prompt": "",
                "chunk_count_in_context": 0,
            },
        }

    if gen.get("refused"):
        step4 = {
            "step": 4,
            "name": "Chat 生成",
            "status": "refused",
            "detail": {
                "chat_model": config.CHAT_MODEL,
                "called_model": False,
                "note": "无足够检索结果 → 拒答",
                "refuse_reason": gen.get("refuse_reason") or "无足够检索结果",
            },
        }
    else:
        step4 = {
            "step": 4,
            "name": "Chat 生成",
            "status": "ok",
            "detail": {
                "chat_model": config.CHAT_MODEL,
                "called_model": True,
                "note": "已用检索上下文调用聊天模型生成答案",
                "refuse_reason": None,
            },
        }

    return {
        "answer": gen["answer"],
        "citations": gen["citations"],
        "model": gen["model"],
        "retrieved": gen["retrieved"],
        "refused": bool(gen.get("refused")),
        "process": {
            "pipeline": "question → embed → TopK retrieve → prompt(from chunks only) → chat",
            "steps": [step1, step2, step3, step4],
        },
    }
