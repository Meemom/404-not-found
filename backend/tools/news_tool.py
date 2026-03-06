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


def classify_signal(raw_text: str) -> dict:
    """Classify a raw news signal into a structured DisruptionSignal.

    Args:
        raw_text: The raw news headline or summary text to classify.

    Returns:
        Classified disruption signal with severity, type, affected regions, and supplier cross-references.
    """
    known_supplier_ids = [
        "tsmc-001", "samsung-sdi-002", "infineon-my-003",
        "continental-004", "valeo-005", "bosch-rex-006",
    ]

    text_lower = raw_text.lower()

    # Determine disruption type based on keywords
    if any(w in text_lower for w in ["military", "naval", "strait", "geopolitical", "sanction", "tariff"]):
        disruption_type = "geopolitical"
    elif any(w in text_lower for w in ["shipping", "port", "freight", "logistics", "route"]):
        disruption_type = "shipping"
    elif any(w in text_lower for w in ["earthquake", "typhoon", "flood", "climate", "weather"]):
        disruption_type = "climate"
    elif any(w in text_lower for w in ["bankruptcy", "financial", "credit", "default"]):
        disruption_type = "financial"
    else:
        disruption_type = "supplier"

    # Determine affected regions
    affected_regions = []
    if "taiwan" in text_lower:
        affected_regions.append("Taiwan")
    if "korea" in text_lower:
        affected_regions.append("South Korea")
    if "malaysia" in text_lower:
        affected_regions.append("Malaysia")
    if "china" in text_lower:
        affected_regions.append("China")
    if "europe" in text_lower or "germany" in text_lower:
        affected_regions.append("Europe")
    if not affected_regions:
        affected_regions.append("Global")

    # Cross-reference affected suppliers
    affected_supplier_ids = []
    if "taiwan" in text_lower or "tsmc" in text_lower:
        affected_supplier_ids.append("tsmc-001")
    if "korea" in text_lower or "samsung" in text_lower:
        affected_supplier_ids.append("samsung-sdi-002")
    if "malaysia" in text_lower or "infineon" in text_lower:
        affected_supplier_ids.append("infineon-my-003")

    # Determine severity based on content
    severity = 5
    if any(w in text_lower for w in ["military", "war", "blockade", "critical"]):
        severity = 9
    elif any(w in text_lower for w in ["exercise", "congestion", "delay", "disruption"]):
        severity = 7
    elif any(w in text_lower for w in ["monitor", "potential", "proposed"]):
        severity = 4

    # Calculate relevance score
    relevance = min(1.0, len(affected_supplier_ids) * 0.3 + (severity / 10) * 0.4)

    return {
        "raw_text": raw_text,
        "disruption_type": disruption_type,
        "severity": severity,
        "affected_regions": affected_regions,
        "affected_supplier_ids": affected_supplier_ids,
        "relevance_score": round(relevance, 2),
        "classification_confidence": 0.85,
        "requires_action": severity >= 7,
    }
