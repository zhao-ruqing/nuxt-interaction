"""Retrieval-query normalization (search-friendly), SEPARATE from conversational rewrite.

Conversational rewrite (rewrite.py) only resolves anaphora/ellipsis across turns.
This step turns spoken / recommendation-style questions into a compact search query
for hybrid retrieval. It must NOT invent part numbers or inject history entities.
Generation should still use the user's original utterance.
"""
from __future__ import annotations

from typing import Any

from app import config
from app.ingest import get_openai_client

NORMALIZE_SYSTEM = (
    "You normalize user questions into concise search queries for a technical "
    "datasheet / knowledge-base retriever.\n"
    "Rules:\n"
    "1. Extract the intent and key domain terms (applications, features, parameters).\n"
    "2. Do NOT answer the question.\n"
    "3. Do NOT invent or add part numbers, model names, or brands that are not in "
    "the latest user question itself.\n"
    "4. If the latest question is already a clear, search-ready question "
    "(e.g. a direct parameter lookup), return it unchanged.\n"
    "5. Output only the search query text — no quotes, no explanation.\n"
    "中文：把口语化/推荐类问题提炼成利于检索的短查询，保留关键需求词；"
    "禁止编造型号；已是独立检索问句则原样返回。"
)


def normalize_search_query(question: str) -> dict[str, Any]:
    """Return {original, search_query, changed, error?}."""
    original = (question or "").strip()
    base = {
        "original": original,
        "search_query": original,
        "changed": False,
        "error": None,
        "model": config.CHAT_MODEL,
    }
    if not original:
        return base

    user_prompt = (
        "【最新用户问题】\n"
        f"{original}\n\n"
        "请输出用于知识库检索的查询（不要回答，不要添加问题中未出现的型号）："
    )
    try:
        client = get_openai_client()
        resp = client.chat.completions.create(
            model=config.CHAT_MODEL,
            messages=[
                {"role": "system", "content": NORMALIZE_SYSTEM},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.0,
        )
        text = (resp.choices[0].message.content or "").strip()
        if text.startswith("```"):
            text = text.strip("`").strip()
        if (text.startswith('"') and text.endswith('"')) or (
            text.startswith("「") and text.endswith("」")
        ):
            text = text[1:-1].strip()
        if not text:
            base["error"] = "empty_normalize"
            return base
        base["search_query"] = text
        base["changed"] = text != original
        return base
    except Exception as e:
        base["error"] = f"{type(e).__name__}: normalize failed; using original"
        return base
