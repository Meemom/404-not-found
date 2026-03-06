"""Fetch MCP wrapper for full article retrieval."""

from __future__ import annotations

import asyncio
import re
from html import unescape
from typing import Any

from mcp.manager import mcp_manager


def _strip_tags(html_text: str) -> str:
    html_text = re.sub(r"<script[\\s\\S]*?</script>", " ", html_text, flags=re.IGNORECASE)
    html_text = re.sub(r"<style[\\s\\S]*?</style>", " ", html_text, flags=re.IGNORECASE)
    html_text = re.sub(r"<[^>]+>", " ", html_text)
    html_text = unescape(html_text)
    html_text = re.sub(r"\s+", " ", html_text)
    return html_text.strip()


def _extract_main_html(raw_html: str) -> str:
    article_match = re.search(r"<article[\\s\\S]*?</article>", raw_html, flags=re.IGNORECASE)
    if article_match:
        return article_match.group(0)

    main_match = re.search(r"<main[\\s\\S]*?</main>", raw_html, flags=re.IGNORECASE)
    if main_match:
        return main_match.group(0)

    return raw_html


def _truncate_words(text: str, limit: int = 800) -> str:
    words = text.split()
    if len(words) <= limit:
        return text
    return " ".join(words[:limit])


def _extract_raw_text(payload: Any) -> str:
    if payload is None:
        return ""
    if isinstance(payload, str):
        return payload
    if isinstance(payload, dict):
        if isinstance(payload.get("content"), list):
            bits = []
            for item in payload["content"]:
                if isinstance(item, dict):
                    bits.append(str(item.get("text") or item.get("content") or ""))
                else:
                    bits.append(str(item))
            return "\n".join(bits)
        return "\n".join(str(v) for v in payload.values())
    if hasattr(payload, "model_dump"):
        return _extract_raw_text(payload.model_dump(mode="json", exclude_none=True))
    return str(payload)


async def fetch_article_content(url: str) -> dict[str, Any]:
    """Fetch full article text via Fetch MCP within 5 seconds."""
    if not mcp_manager.fetch_available:
        return {
            "content": "Full article preview unavailable. Visit the source URL to read more.",
            "word_count": 0,
            "fetch_success": False,
        }

    try:
        async with asyncio.timeout(5):
            raw = await mcp_manager.call_fetch(url)
            raw_text = _extract_raw_text(raw)
            if not raw_text:
                raise RuntimeError("empty_fetch_payload")

            main_html = _extract_main_html(raw_text)
            content = _truncate_words(_strip_tags(main_html), 800)
            word_count = len(content.split())

            return {
                "content": content,
                "word_count": word_count,
                "fetch_success": True,
            }
    except Exception:
        return {
            "content": "Full article preview unavailable. Visit the source URL to read more.",
            "word_count": 0,
            "fetch_success": False,
        }
