"""Memory / historical disruption endpoints."""

import json
from pathlib import Path

from fastapi import APIRouter

DATA_DIR = Path(__file__).parent.parent / "data"

router = APIRouter(prefix="/memory", tags=["memory"])


@router.get("/disruptions")
async def get_disruption_history():
    """Get historical disruption log with lessons learned."""
    with open(DATA_DIR / "mock_disruptions.json", "r") as f:
        disruptions = json.load(f)

    historical = [d for d in disruptions if not d.get("is_active")]
    active = [d for d in disruptions if d.get("is_active")]

    return {
        "historical": historical,
        "active": active,
        "total_events": len(disruptions),
        "total_financial_impact_eur": sum(
            d.get("financial_impact_eur", 0) or 0 for d in historical
        ),
        "patterns": [
            {
                "pattern": "Geopolitical risks in East Asia dominate semiconductor supply disruptions",
                "frequency": "3 events in 12 months",
                "recommendation": "Accelerate European semiconductor sourcing qualification",
            },
            {
                "pattern": "Port and logistics disruptions have 10-21 day typical duration",
                "frequency": "2 events in 12 months",
                "recommendation": "Maintain 21-day safety stock for sea-freight-dependent components",
            },
            {
                "pattern": "Single-source components (TSMC MCU) are recurring risk vector",
                "frequency": "4 out of 6 disruptions involved single-source suppliers",
                "recommendation": "Eliminate all single-source dependencies by end of 2026",
            },
        ],
    }


@router.get("/disruptions/{disruption_id}")
async def get_disruption_detail(disruption_id: str):
    """Get detailed information about a specific disruption."""
    with open(DATA_DIR / "mock_disruptions.json", "r") as f:
        disruptions = json.load(f)

    disruption = next((d for d in disruptions if d["disruption_id"] == disruption_id), None)
    if not disruption:
        return {"error": f"Disruption {disruption_id} not found"}

    return disruption
