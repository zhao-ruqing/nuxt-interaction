"""Rewrite follow-up questions into standalone queries using recent history.

Standard approach (LangChain create_history_aware_retriever style):
only reformulate when the latest question depends on chat history
(anaphora / ellipsis). Otherwise return it unchanged — never inject a
part number, parameter, or qualifier the user did not mention.

Runs BEFORE retrieval. On any failure, fall back to the original question.
"""
from __future__ import annotations

import re
from typing import Any

from app import config
from app.ingest import get_openai_client

# Keep rewrite prompts short: last N messages (user+assistant).
HISTORY_WINDOW = 8

# LangChain-aligned contextualize prompt (+ CN clarity).
REWRITE_SYSTEM = (
    "Given a chat history and the latest user question which might reference "
    "context in the chat history, formulate a standalone question which can be "
    "understood without the chat history. Do NOT answer the question, just "
    "reformulate it if needed and otherwise return it as is.\n\n"
    "中文补充（必须遵守）：\n"
    "1. 仅当最新问题依赖上文（代词指代、省略主语/型号、追问同一对象的参数等）时才改写。"
    "若问题本身已是独立、可检索的完整问句，原样返回，不要润色。\n"
    "2. 禁止把历史里的型号、参数名、限定词（如 LX8605、输入/输出）注入到一个"
    "本身没有提到它们、也不依赖上文的新问题里。\n"
    "3. 只输出那一句问题本身：不要引号、不要解释、不要回答。"
)

# Light gate: only call the LLM rewriter when these cues suggest dependency
# on prior context. Do NOT use part-number presence or sentence length.
_ANAPHORA_RE = re.compile(
    r"(它|它们|其|这款|那款|这个|那个|此种|该型号|该器件|上述|前面说的|刚才|同上)"
)
_ELLIPSIS_FOLLOWUP_RE = re.compile(
    r"(还有呢|那呢|再呢|另外呢|然后呢|接下来呢)"
)
# Short elliptical tails like 「电流呢？」「封装呢」「功耗呢？」
_SHORT_NE_RE = re.compile(
    r"^[\w\u4e00-\u9fff\+\-/%μµΩ℃°]+(呢|呢？|呢\?|吗？|吗\?)$"
)


def needs_contextualize(question: str) -> bool:
    """True only when the utterance looks dependent on prior context."""
    q = (question or "").strip()
    if not q:
        return False
    if _ANAPHORA_RE.search(q):
        return True
    if _ELLIPSIS_FOLLOWUP_RE.search(q):
        return True
    # Compact follow-ups that are mostly a parameter + 呢/吗
    compact = re.sub(r"\s+", "", q)
    if _SHORT_NE_RE.match(compact):
        return True
    return False


def _normalize_history(history: list[dict[str, Any]] | None) -> list[dict[str, str]]:
    if not history:
        return []
    out: list[dict[str, str]] = []
    for item in history:
        if not isinstance(item, dict):
            continue
        role = str(item.get("role") or "").strip().lower()
        content = str(item.get("content") or "").strip()
        if role not in ("user", "assistant", "system"):
            continue
        if not content:
            continue
        # Drop placeholder / loading assistant bubbles
        if role == "assistant" and content in ("检索中…", "检索中...", "thinking…"):
            continue
        out.append({"role": role, "content": content})
    if len(out) > HISTORY_WINDOW:
        out = out[-HISTORY_WINDOW:]
    return out


def rewrite_question(
    question: str,
    history: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Return {rewritten, original, used_history, rewritten_flag, error?, skipped?}."""
    original = (question or "").strip()
    hist = _normalize_history(history)
    base = {
        "original": original,
        "rewritten": original,
        "used_history": hist,
        "rewritten_flag": False,
        "error": None,
        "skipped": None,
        "model": config.CHAT_MODEL,
    }
    if not original:
        return base
    # No prior turns → nothing to rewrite
    if not hist:
        base["skipped"] = "no_history"
        return base

    # Light safety gate: standalone new-intent questions skip LLM rewrite.
    if not needs_contextualize(original):
        base["skipped"] = "standalone_no_anaphora"
        base["used_history"] = hist  # history still available to generation upstream
        return base

    hist_lines = []
    for m in hist:
        label = "用户" if m["role"] == "user" else ("助手" if m["role"] == "assistant" else "系统")
        hist_lines.append(f"{label}: {m['content']}")
    user_prompt = (
        "【对话历史】\n"
        + "\n".join(hist_lines)
        + "\n\n【最新用户问题】\n"
        + original
        + "\n\n"
        "若最新问题依赖历史，改写成独立检索问题；否则原样返回最新问题："
    )

    try:
        client = get_openai_client()
        resp = client.chat.completions.create(
            model=config.CHAT_MODEL,
            messages=[
                {"role": "system", "content": REWRITE_SYSTEM},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.0,
        )
        text = (resp.choices[0].message.content or "").strip()
        # Strip accidental quotes / fences
        if text.startswith("```"):
            text = text.strip("`").strip()
        if (text.startswith('"') and text.endswith('"')) or (
            text.startswith("「") and text.endswith("」")
        ):
            text = text[1:-1].strip()
        if not text:
            base["error"] = "empty_rewrite"
            return base
        base["rewritten"] = text
        base["rewritten_flag"] = text != original
        base["skipped"] = None
        return base
    except Exception as e:
        base["error"] = f"{type(e).__name__}: rewrite failed; using original"
        return base