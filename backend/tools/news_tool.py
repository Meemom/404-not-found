"""News ingestion tool — fetches and classifies disruption signals."""

import json
import os
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"


def get_latest_news(query: str = "supply chain disruption") -> dict:
    """Fetch the latest supply-chain-relevant news signals.

    Args:
        query: Search query for news articles (e.g. "Taiwan semiconductor disruption").

    Returns:
        A dict with a list of news signals classified by relevance.
    """
    # TODO: these r mock signals, replace with actual scarping etc
    signals = [
        {
            "headline": "PLA Naval Exercises Cause Commercial Shipping Delays in Taiwan Strait",
            "source": "Reuters",
            "published": "2026-02-25T08:30:00Z",
            "summary": "Chinese military exercises in the Taiwan Strait are causing 14-21 day delays at the Port of Kaohsiung. Commercial vessels are being rerouted, significantly impacting semiconductor supply chains.",
            "disruption_type": "geopolitical",
            "affected_regions": ["Taiwan", "East Asia"],
            "severity_score": 9,
            "relevance_to_company": "HIGH — TSMC is your primary semiconductor supplier shipping from Kaohsiung. Direct impact on MCU-32BIT-AUTO and POWER-MGMT-IC supply lines.",
            "url": "https://reuters.com/example/taiwan-strait-disruption",
        },
        {
            "headline": "South Korea Announces New Export Controls on Battery Materials",
            "source": "Nikkei Asia",
            "published": "2026-02-28T12:00:00Z",
            "summary": "South Korean government considering export controls on advanced battery materials amid trade tensions. Could affect battery cell exports.",
            "disruption_type": "regulatory",
            "affected_regions": ["South Korea"],
            "severity_score": 4,
            "relevance_to_company": "MEDIUM — Samsung SDI is a Tier-1 supplier for battery components. Monitor for policy finalization.",
            "url": "https://nikkei.com/example/korea-export-controls",
        },
        {
            "headline": "EU Proposes Stricter Automotive Chip Traceability Requirements",
            "source": "Financial Times",
            "published": "2026-03-01T09:15:00Z",
            "summary": "European Commission draft regulation would require full supply chain traceability for automotive-grade semiconductors by 2027.",
            "disruption_type": "regulatory",
            "affected_regions": ["Europe"],
            "severity_score": 3,
            "relevance_to_company": "LOW — Long-term compliance concern, no immediate supply impact. Begin documentation preparation.",
            "url": "https://ft.com/example/eu-chip-traceability",
        },
    ]

    # Filter by query if specific terms are used
    query_lower = query.lower()
    if "taiwan" in query_lower:
        signals = [s for s in signals if "Taiwan" in str(s.get("affected_regions", []))]
    elif "korea" in query_lower or "samsung" in query_lower:
        signals = [s for s in signals if "South Korea" in str(s.get("affected_regions", []))]

    return {
        "query": query,
        "signal_count": len(signals),
        "signals": signals,
        "timestamp": "2026-03-03T10:00:00Z",
    }


def get_active_disruptions() -> dict:
    """Return all currently active disruptions from the disruption log.

    Returns:
        A dict with a list of active disruption events.
    """
    disruptions_path = DATA_DIR / "mock_disruptions.json"
    with open(disruptions_path, "r") as f:
        all_disruptions = json.load(f)

    active = [d for d in all_disruptions if d.get("is_active", False)]
    return {
        "active_count": len(active),
        "disruptions": active,
    }
