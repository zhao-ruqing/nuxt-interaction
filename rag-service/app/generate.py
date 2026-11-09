"""Generate: build prompt ONLY from retrieved chunks → DashScope chat → answer + citations.

If retrieval is empty, refuse without calling the model with free-form knowledge.
Multi-turn: rewrite follow-ups before retrieve; pass recent history into generation.
"""
from __future__ import annotations

from typing import Any

from app import config
from app.ingest import get_openai_client
from app.retrieve import retrieve
from app.rewrite import rewrite_question, _normalize_history, HISTORY_WINDOW
from app.normalize_query import normalize_search_query

SYSTEM_PROMPT = (
    "你是本地知识库问答助手。"
    "你只能根据用户消息里提供的【检索上下文】回答。"
    "若上下文不足以回答，必须明确说「根据现有资料，我不知道」或「资料中未找到相关信息」，禁止编造。"
    "不要使用你自己的世界知识填补空白。"
    "可参考【对话历史】保持指代一致，但事实仍必须以【检索上下文】为准。"
    "回答简洁；语言与问题一致。"
)


def _build_user_prompt(
    question: str,
    hits: list[dict[str, Any]],
    history: list[dict[str, str]] | None = None,
) -> str:
    blocks = []
    for i, h in enumerate(hits, 1):
        blocks.append(
            f"[{i}] 来源: {h.get('source')} (chunk_index={h.get('chunk_index')})\n"
            f"{h.get('excerpt') or ''}"
        )
    context = "\n\n".join(blocks)

    hist_block = ""
    if history:
        lines = []
        for m in history:
            label = "用户" if m["role"] == "user" else ("助手" if m["role"] == "assistant" else "系统")
            lines.append(f"{label}: {m['content']}")
        hist_block = "【对话历史】\n" + "\n".join(lines) + "\n\n"

    return (
        f"{hist_block}"
        f"【检索上下文】\n{context}\n\n"
        f"【用户问题】\n{question}\n\n"
        "请仅依据【检索上下文】作答；无依据则明确说不知道，不要编造。"
        "若问题是追问，结合【对话历史】理解指代，但答案事实仍须来自【检索上下文】。"
    )


def generate(
    question: str,
    hits: list[dict[str, Any]],
    history: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Generate answer strictly from provided retrieval hits. Does not re-retrieve."""
    hist = _normalize_history(history)
    citations = [
        {
            "source": h.get("source", "unknown"),
            "chunk_index": h.get("chunk_index"),
            "sheet": h.get("sheet"),
            "excerpt": (h.get("excerpt") or "")[:400],
            "distance": h.get("distance"),
            "similarity": h.get("similarity"),
            "rrf_score": h.get("rrf_score"),
            "channels": h.get("channels"),
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

    user_prompt = _build_user_prompt(question, hits, hist)
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


def chat(
    question: str,
    top_k: int = config.TOP_K,
    history: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Standard RAG with optional multi-turn: rewrite → retrieve → generate."""
    question = (question or "").strip()
    hist = _normalize_history(history)

    # 1) Conversational contextualize (anaphora/ellipsis only)
    rewrite_info = rewrite_question(question, hist)
    contextualized = (rewrite_info.get("rewritten") or question).strip() or question

    # 2) Retrieval-query normalization (search-friendly; no invented part numbers)
    norm_info = normalize_search_query(contextualized)
    search_question = (norm_info.get("search_query") or contextualized).strip() or contextualized

    retrieval = retrieve(search_question, top_k=top_k)
    hits = retrieval.get("hits") or []
    emb = retrieval.get("embedding") or {}

    # Generation uses the user's original utterance + history; facts from chunks only
    gen = generate(question=question, hits=hits, history=hist)

    skip_reason = rewrite_info.get("skipped")
    if rewrite_info.get("rewritten_flag"):
        step0_status = "ok"
        step0_note = "已用历史改写成独立检索问题"
    elif rewrite_info.get("error"):
        step0_status = "fallback"
        step0_note = "改写失败，回退原文"
    elif skip_reason == "no_history":
        step0_status = "skipped"
        step0_note = "无历史，跳过改写"
    elif skip_reason == "standalone_no_anaphora":
        step0_status = "skipped"
        step0_note = "新问题无指代/省略依赖，保持原文检索（不注入历史型号）"
    elif not hist:
        step0_status = "skipped"
        step0_note = "无历史，跳过改写"
    else:
        step0_status = "unchanged"
        step0_note = "原文已足够独立，原样返回"

    step0 = {
        "step": 0,
        "name": "追问改写",
        "status": step0_status,
        "detail": {
            "original_question": rewrite_info.get("original"),
            "rewritten_question": rewrite_info.get("rewritten"),
            "history_turns_used": len(rewrite_info.get("used_history") or []),
            "history_window": HISTORY_WINDOW,
            "skipped": skip_reason,
            "error": rewrite_info.get("error"),
            "note": step0_note,
        },
    }

    step1 = {
        "step": 1,
        "name": "问题向量化",
        "status": emb.get("status", "unknown"),
        "detail": {
            "embedding_model": emb.get("model"),
            "dimensions": emb.get("dimensions", 0),
            "note": emb.get("note", ""),
            "embedded_text": search_question,
            "contextualized_question": contextualized,
            "normalized_search_query": search_question,
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
            "query_used": search_question,
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
                "note": "检索 chunk + 近期对话历史拼进 Prompt；事实仍只看检索上下文",
                "system_prompt": gen.get("system_prompt") or SYSTEM_PROMPT,
                "user_prompt": gen.get("user_prompt") or "",
                "chunk_count_in_context": len(hits),
                "history_turns_in_prompt": len(hist),
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
                "history_turns_in_prompt": len(hist),
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
                "note": "已用检索上下文（+历史）调用聊天模型生成答案",
                "refuse_reason": None,
            },
        }

    step_norm = {
        "step": 0.5,
        "name": "检索查询规范化",
        "status": (
            "ok"
            if norm_info.get("changed")
            else ("fallback" if norm_info.get("error") else "unchanged")
        ),
        "detail": {
            "input_question": contextualized,
            "search_query": search_question,
            "changed": bool(norm_info.get("changed")),
            "error": norm_info.get("error"),
            "note": (
                "已提炼检索友好查询"
                if norm_info.get("changed")
                else (
                    "规范化失败，回退上一阶段问题"
                    if norm_info.get("error")
                    else "已是检索友好问句，保持不变"
                )
            ),
        },
    }

    if isinstance(step2.get("detail"), dict):
        step2["detail"]["candidate_pool"] = retrieval.get("candidate_pool")
        step2["detail"]["fusion"] = retrieval.get("fusion")
        step2["detail"]["vector_hit_count"] = retrieval.get("vector_hit_count")
        step2["detail"]["bm25_hit_count"] = retrieval.get("bm25_hit_count")
        step2["detail"]["query_used"] = search_question

    return {
        "answer": gen["answer"],
        "citations": gen["citations"],
        "model": gen["model"],
        "retrieved": gen["retrieved"],
        "refused": bool(gen.get("refused")),
        "question_original": question,
        "question_rewritten": contextualized,
        "question_search": search_question,
        "process": {
            "pipeline": (
                "history → contextualize → normalize_search → "
                "hybrid(vector+bm25 RRF) → prompt(chunks+history) → chat"
            ),
            "steps": [step0, step_norm, step1, step2, step3, step4],
        },
    }