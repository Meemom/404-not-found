"""Brave Search MCP wrapper for event intelligence."""

from __future__ import annotations

import re
import uuid
from urllib.parse import urlparse
from typing import Any

from mcp.manager import mcp_manager


def _extract_text(obj: Any) -> str:
    if obj is None:
        return ""
    if isinstance(obj, str):
        return obj
    if isinstance(obj, dict):
        return " ".join(_extract_text(v) for v in obj.values())
    if isinstance(obj, list):
        return " ".join(_extract_text(v) for v in obj)
    if hasattr(obj, "model_dump"):
        return _extract_text(obj.model_dump())
    if hasattr(obj, "text"):
        return _extract_text(getattr(obj, "text"))
    if hasattr(obj, "content"):
        return _extract_text(getattr(obj, "content"))
    return str(obj)


def _clean_domain(url: str) -> str:
    try:
        host = urlparse(url).netloc.lower().replace("www.", "")
        return host or "unknown"
    except Exception:
        return "unknown"


def _contains_any(text: str, terms: list[str]) -> bool:
    lowered = text.lower()
    return any(t.lower() in lowered for t in terms if t)


def _score_result(
    event_title: str,
    affected_regions: list[str],
    title: str,
    summary: str,
) -> float:
    score = 0.5

    event_keywords = [k for k in re.findall(r"[A-Za-z]{4,}", event_title) if len(k) >= 4]
    if _contains_any(title, event_keywords):
        score += 0.3

    if _contains_any(title + " " + summary, affected_regions):
        score += 0.2

    summary_lower = summary.lower()
    if "supply chain" in summary_lower or "manufacturing" in summary_lower:
        score += 0.1

    return round(min(score, 1.0), 2)


def _taiwan_fallback() -> list[dict[str, Any]]:
    data = [
        {
            "title": "Taiwan Strait Tensions Disrupt Asia-Pacific Shipping Lanes",
            "summary": "Commercial vessels report major delays as naval activity pushes carriers to longer alternate routes.",
            "source_name": "FreightWaves",
            "source_url": "https://freightwaves.com",
            "published_at": "2 hours ago",
            "relevance_score": 0.95,
        },
        {
            "title": "Chipmakers Warn of Logistics Delays from Taiwan Strait Rerouting",
            "summary": "Automotive semiconductor deliveries face one to two week variability due to congestion near Kaohsiung.",
            "source_name": "Reuters",
            "source_url": "https://reuters.com",
            "published_at": "4 hours ago",
            "relevance_score": 0.92,
        },
        {
            "title": "Container Shipping Rates Jump on East Asia Trade Corridors",
            "summary": "Spot freight rates rose as shippers avoid high-risk maritime zones and port queues deepen.",
            "source_name": "Lloyd's List",
            "source_url": "https://lloydslist.com",
            "published_at": "6 hours ago",
            "relevance_score": 0.9,
        },
        {
            "title": "European Auto Suppliers Assess Exposure to Taiwan Transit Risks",
            "summary": "Tier-1 suppliers are re-planning inventory buffers for MCU and PMIC categories.",
            "source_name": "Automotive News",
            "source_url": "https://autonews.com",
            "published_at": "9 hours ago",
            "relevance_score": 0.87,
        },
        {
            "title": "Port Congestion in Southern Taiwan Extends ETAs for Electronics Cargo",
            "summary": "Forwarders cite longer handling times and reduced schedule reliability for outbound chip shipments.",
            "source_name": "The Loadstar",
            "source_url": "https://theloadstar.com",
            "published_at": "12 hours ago",
            "relevance_score": 0.84,
        },
    ]
    return [
        {
            "article_id": str(uuid.uuid4()),
            **item,
            "source_type": "news",
            "is_mock": True,
        }
        for item in data
    ]


def _semiconductor_fallback() -> list[dict[str, Any]]:
    data = [
        {
            "title": "Semiconductor Price Surge Pressures Automotive Electronics Margins",
            "summary": "Rising wafer and packaging costs are driving higher component quotes across MCU categories.",
            "source_name": "Nikkei Asia",
            "source_url": "https://asia.nikkei.com",
            "published_at": "3 hours ago",
            "relevance_score": 0.94,
        },
        {
            "title": "Lead Times Widen for Automotive-Grade Microcontrollers",
            "summary": "Procurement teams report renewed shortages in power management and controller IC families.",
            "source_name": "EE Times",
            "source_url": "https://eetimes.com",
            "published_at": "5 hours ago",
            "relevance_score": 0.91,
        },
        {
            "title": "European OEMs Increase Buffer Stock Amid Chip Volatility",
            "summary": "Supply chain planners are extending safety stock targets for semiconductors through 2026.",
            "source_name": "S&P Global",
            "source_url": "https://spglobal.com",
            "published_at": "8 hours ago",
            "relevance_score": 0.88,
        },
        {
            "title": "Foundry Capacity Reallocation Tightens Spot Availability",
            "summary": "Competition for mature-node capacity affects industrial and automotive buyers.",
            "source_name": "Bloomberg",
            "source_url": "https://bloomberg.com",
            "published_at": "11 hours ago",
            "relevance_score": 0.86,
        },
        {
            "title": "Tier-1 Suppliers Renegotiate Contracts After Chip Cost Spikes",
            "summary": "Manufacturers are revisiting escalation clauses and delivery priorities with key vendors.",
            "source_name": "Financial Times",
            "source_url": "https://ft.com",
            "published_at": "1 day ago",
            "relevance_score": 0.84,
        },
    ]
    return [
        {
            "article_id": str(uuid.uuid4()),
            **item,
            "source_type": "news",
            "is_mock": True,
        }
        for item in data
    ]


def _generic_fallback(event_title: str) -> list[dict[str, Any]]:
    data = []
    for idx in range(1, 4):
        data.append(
            {
                "article_id": str(uuid.uuid4()),
                "title": f"Analysts Track Operational Impact of {event_title}",
                "summary": f"New reporting examines how {event_title} may affect production plans, logistics reliability, and supplier SLAs.",
                "source_name": f"Industry Desk {idx}",
                "source_url": "https://news.example.com",
                "published_at": f"{idx * 2} hours ago",
                "relevance_score": round(0.8 - (idx * 0.08), 2),
                "source_type": "news",
                "is_mock": True,
            }
        )
    return data


def _fallback(event_title: str) -> list[dict[str, Any]]:
    title_lower = event_title.lower()
    if "taiwan strait" in title_lower:
        return _taiwan_fallback()
    if "semiconductor" in title_lower:
        return _semiconductor_fallback()
    return _generic_fallback(event_title)


def _parse_mcp_results(raw: Any) -> list[dict[str, Any]]:
    payload: Any = raw
    if hasattr(raw, "model_dump"):
        payload = raw.model_dump(mode="json", exclude_none=True)

    if isinstance(payload, dict):
        if isinstance(payload.get("content"), list):
            text_blobs = [
                item.get("text", "") if isinstance(item, dict) else str(item)
                for item in payload["content"]
            ]
            joined = "\n".join(text_blobs)
            rows = _extract_json_rows(joined)
            return rows if rows else _extract_text_rows(joined)
        payload_text = _extract_text(payload)
        rows = _extract_json_rows(payload_text)
        return rows if rows else _extract_text_rows(payload_text)

    payload_text = _extract_text(payload)
    rows = _extract_json_rows(payload_text)
    return rows if rows else _extract_text_rows(payload_text)


def _extract_json_rows(text: str) -> list[dict[str, Any]]:
    text = text.strip()
    if not text:
        return []

    # Prefer direct JSON payloads from MCP servers.
    try:
        loaded = __import__("json").loads(text)
        if isinstance(loaded, dict):
            if isinstance(loaded.get("results"), list):
                return [r for r in loaded["results"] if isinstance(r, dict)]
            if isinstance(loaded.get("web", {}).get("results"), list):
                return [r for r in loaded["web"]["results"] if isinstance(r, dict)]
        if isinstance(loaded, list):
            return [r for r in loaded if isinstance(r, dict)]
    except Exception:
        pass

    return []


def _extract_text_rows(text: str) -> list[dict[str, Any]]:
    """Parse plain-text Brave output blocks into structured rows."""
    if not text.strip():
        return []

    rows: list[dict[str, Any]] = []
    block_pattern = re.compile(
        r"Title:\s*(?P<title>.*?)\s*\n"
        r"Description:\s*(?P<description>.*?)\s*\n"
        r"URL:\s*(?P<url>\S+)",
        flags=re.IGNORECASE | re.DOTALL,
    )

    for match in block_pattern.finditer(text):
        title = re.sub(r"\s+", " ", match.group("title")).strip()
        description = re.sub(r"\s+", " ", match.group("description")).strip()
        description = re.sub(r"<[^>]+>", "", description)
        url = match.group("url").strip()

        if not title and not url:
            continue

        rows.append(
            {
                "title": title or "Untitled",
                "description": description,
                "url": url,
            }
        )

    return rows


async def search_event_news(
    event_title: str,
    event_type: str,
    affected_regions: list[str],
    max_results: int = 8,
) -> list[dict[str, Any]]:
    """Search event news through Brave MCP with deterministic fallback."""
    query_map = {
        "geopolitical": f"{event_title} shipping supply chain impact",
        "market": f"{event_title} manufacturing semiconductor shortage",
        "climate": f"{event_title} port logistics disruption",
        "financial": f"{event_title} supplier bankruptcy automotive",
    }
    query = query_map.get(event_type, f"{event_title} supply chain")
    if affected_regions:
        query += " " + " ".join(affected_regions[:2])

    if not mcp_manager.brave_available:
        return _fallback(event_title)

    try:
        raw = await mcp_manager.call_brave_search(query=query, count=max_results)
        rows = _parse_mcp_results(raw)
        if not rows:
            return _fallback(event_title)

        articles: list[dict[str, Any]] = []
        for row in rows[:max_results]:
            title = str(row.get("title") or row.get("name") or "Untitled").strip()
            summary = str(
                row.get("description")
                or row.get("snippet")
                or row.get("summary")
                or ""
            ).strip()
            url = str(row.get("url") or row.get("link") or "").strip()
            published = str(
                row.get("age")
                or row.get("published")
                or row.get("published_at")
                or "unknown"
            )
            relevance = _score_result(event_title, affected_regions, title, summary)

            articles.append(
                {
                    "article_id": str(uuid.uuid4()),
                    "title": title,
                    "summary": summary,
                    "source_name": _clean_domain(url),
                    "source_url": url,
                    "published_at": published,
                    "relevance_score": relevance,
                    "source_type": "news",
                    "is_mock": False,
                }
            )

        articles.sort(key=lambda x: x["relevance_score"], reverse=True)
        return articles
    except Exception:
        return _fallback(event_title)
