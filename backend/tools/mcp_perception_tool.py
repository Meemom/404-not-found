"""Live perception tooling with graceful fallback when MCP dependencies are unavailable."""

from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx

from tools.mcp_manager import mcp_service_manager

DATA_DIR = Path(__file__).parent.parent / "data"
CACHE_FILE = DATA_DIR / "perception_cache" / "latest_signals.json"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load_json(filename: str) -> list[dict[str, Any]]:
    with open(DATA_DIR / filename, "r", encoding="utf-8") as f:
        return json.load(f)


def _normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def _strip_html(html: str) -> str:
    no_script = re.sub(r"<script[\\s\\S]*?</script>", " ", html, flags=re.IGNORECASE)
    no_style = re.sub(r"<style[\\s\\S]*?</style>", " ", no_script, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", " ", no_style)
    return _normalize_text(text)


def _extract_top_terms(text: str, max_terms: int = 6) -> list[str]:
    words = re.findall(r"[a-zA-Z]{4,}", text.lower())
    stop = {
        "that",
        "with",
        "from",
        "this",
        "have",
        "will",
        "into",
        "their",
        "after",
        "about",
        "supply",
        "chain",
        "news",
    }
    freq: dict[str, int] = {}
    for w in words:
        if w in stop:
            continue
        freq[w] = freq.get(w, 0) + 1
    return [k for k, _ in sorted(freq.items(), key=lambda x: x[1], reverse=True)[:max_terms]]


def _classify_signal(text: str) -> tuple[str, int]:
    txt = text.lower()
    if any(k in txt for k in ["military", "sanction", "strait", "tariff", "geopolitical"]):
        return "geopolitical", 8
    if any(k in txt for k in ["port", "shipping", "freight", "logistics", "route"]):
        return "shipping", 7
    if any(k in txt for k in ["earthquake", "flood", "typhoon", "storm", "climate"]):
        return "climate", 7
    if any(k in txt for k in ["bankruptcy", "insolvency", "credit", "default"]):
        return "financial", 8
    if any(k in txt for k in ["factory", "outage", "strike", "production"]):
        return "supplier", 6
    return "general", 4


def _score_relevance(text: str, supplier_names: list[str], component_names: list[str]) -> float:
    txt = text.lower()
    score = 0.0

    for supplier in supplier_names:
        token = supplier.lower().split("(")[0].strip()
        if token and token in txt:
            score += 0.22

    for component in component_names:
        token = component.lower().split("-")[0].strip()
        if token and token in txt:
            score += 0.16

    if any(k in txt for k in ["automotive", "semiconductor", "battery"]):
        score += 0.18
    if any(k in txt for k in ["delay", "shortage", "disruption", "halt"]):
        score += 0.2

    return round(min(1.0, score), 2)


def _fetch_url_snippet(url: str) -> str:
    if not mcp_service_manager.is_enabled("fetch"):
        return ""

    timeout = float(os.getenv("FETCH_TIMEOUT_SECONDS", "4.0"))
    try:
        with httpx.Client(timeout=timeout, follow_redirects=True) as client:
            resp = client.get(url)
            if resp.status_code >= 400:
                return ""
            return _strip_html(resp.text)[:1200]
    except Exception:
        return ""


def _search_brave(query: str, count: int) -> list[dict[str, Any]]:
    if not mcp_service_manager.is_enabled("brave_search"):
        return []

    brave_key = os.getenv("BRAVE_API_KEY", "").strip()
    if not brave_key:
        return []

    url = "https://api.search.brave.com/res/v1/web/search"
    headers = {
        "Accept": "application/json",
        "X-Subscription-Token": brave_key,
    }

    try:
        with httpx.Client(timeout=8.0) as client:
            response = client.get(url, params={"q": query, "count": count}, headers=headers)
            if response.status_code >= 400:
                return []
            payload = response.json()
            return payload.get("web", {}).get("results", []) or []
    except Exception:
        return []


def _mock_signals_for_query(query: str) -> list[dict[str, Any]]:
    disruptions = _load_json("mock_disruptions.json")
    query_tokens = {t for t in re.findall(r"[a-zA-Z]{4,}", query.lower())}
    signals: list[dict[str, Any]] = []

    for item in disruptions:
        title = item.get("title", "")
        desc = item.get("description", "")
        text = f"{title}. {desc}"
        if query_tokens:
            text_tokens = set(re.findall(r"[a-zA-Z]{4,}", text.lower()))
            overlap = query_tokens.intersection(text_tokens)
            if len(overlap) == 0 and "supply" not in query_tokens and "chain" not in query_tokens:
                continue

        disruption_type, base_severity = _classify_signal(text)
        signals.append(
            {
                "headline": title,
                "summary": desc,
                "source": "local_mock_data",
                "published": item.get("detected_at", _now_iso()),
                "url": "",
                "disruption_type": disruption_type,
                "severity": max(base_severity, int(item.get("severity", 5))),
                "relevance_score": 0.7,
                "topics": _extract_top_terms(text),
                "origin": "fallback",
            }
        )

    if not signals:
        for item in disruptions[:4]:
            text = f"{item.get('title', '')}. {item.get('description', '')}"
            disruption_type, base_severity = _classify_signal(text)
            signals.append(
                {
                    "headline": item.get("title", ""),
                    "summary": item.get("description", ""),
                    "source": "local_mock_data",
                    "published": item.get("detected_at", _now_iso()),
                    "url": "",
                    "disruption_type": disruption_type,
                    "severity": max(base_severity, int(item.get("severity", 5))),
                    "relevance_score": 0.55,
                    "topics": _extract_top_terms(text),
                    "origin": "fallback",
                }
            )

    return signals[:6]


def _persist_signals(signals: list[dict[str, Any]], query: str) -> bool:
    if not mcp_service_manager.is_enabled("filesystem"):
        return False

    payload = {
        "timestamp": _now_iso(),
        "query": query,
        "signal_count": len(signals),
        "signals": signals,
    }
    try:
        CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)
        return True
    except Exception:
        return False


def _cluster_signals(signals: list[dict[str, Any]]) -> list[dict[str, Any]]:
    clusters: dict[str, dict[str, Any]] = {}
    for signal in signals:
        key = f"{signal.get('disruption_type', 'general')}:{','.join(signal.get('topics', [])[:2])}"
        if key not in clusters:
            clusters[key] = {
                "cluster_id": key,
                "disruption_type": signal.get("disruption_type", "general"),
                "signal_count": 0,
                "max_severity": 0,
                "avg_relevance": 0.0,
                "sample_headlines": [],
            }

        c = clusters[key]
        c["signal_count"] += 1
        c["max_severity"] = max(c["max_severity"], int(signal.get("severity", 0)))
        c["avg_relevance"] += float(signal.get("relevance_score", 0.0))
        if len(c["sample_headlines"]) < 3:
            c["sample_headlines"].append(signal.get("headline", ""))

    result = []
    for c in clusters.values():
        if c["signal_count"] > 0:
            c["avg_relevance"] = round(c["avg_relevance"] / c["signal_count"], 2)
        result.append(c)

    result.sort(key=lambda x: (x["max_severity"], x["avg_relevance"]), reverse=True)
    return result


def get_live_disruption_signals(query: str = "supply chain disruption", limit: int = 8) -> dict[str, Any]:
    """Fetch live disruption signals using Brave + fetch and persist to local cache."""
    suppliers = _load_json("mock_suppliers.json")
    inventory = _load_json("mock_inventory.json")

    supplier_names = [s.get("name", "") for s in suppliers]
    component_names = [i.get("name", "") for i in inventory]

    brave_results = _search_brave(query, count=max(1, min(20, limit)))
    signals: list[dict[str, Any]] = []

    for result in brave_results:
        title = _normalize_text(result.get("title", ""))
        description = _normalize_text(result.get("description", ""))
        url = result.get("url", "")
        page_excerpt = _fetch_url_snippet(url)

        combined_text = _normalize_text(f"{title}. {description}. {page_excerpt}")
        disruption_type, base_severity = _classify_signal(combined_text)
        relevance = _score_relevance(combined_text, supplier_names, component_names)

        signals.append(
            {
                "headline": title,
                "summary": (description or page_excerpt[:260])[:400],
                "source": "brave_search",
                "published": _now_iso(),
                "url": url,
                "disruption_type": disruption_type,
                "severity": base_severity,
                "relevance_score": relevance,
                "topics": _extract_top_terms(combined_text),
                "origin": "live",
            }
        )

    source_mode = "live"
    if not signals:
        source_mode = "fallback"
        signals = _mock_signals_for_query(query)

    clusters = _cluster_signals(signals)
    persisted = _persist_signals(signals, query)

    return {
        "query": query,
        "timestamp": _now_iso(),
        "source_mode": source_mode,
        "mcp_status": mcp_service_manager.status(),
        "signal_count": len(signals),
        "signals": signals,
        "clusters": clusters,
        "persisted_to_filesystem": persisted,
    }


def get_last_persisted_signals() -> dict[str, Any]:
    """Read the latest signal snapshot from filesystem cache."""
    try:
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            payload = json.load(f)
        payload["cache_hit"] = True
        return payload
    except Exception:
        return {
            "cache_hit": False,
            "timestamp": _now_iso(),
            "signal_count": 0,
            "signals": [],
        }
