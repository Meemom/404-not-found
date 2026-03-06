import json
from datetime import datetime, timezone
from pathlib import Path
from typing import TypedDict

DATA_DIR = Path(__file__).parent.parent / "data"


class WardenSessionState(TypedDict):
    company_profile: dict
    active_disruptions: list
    pending_actions: list
    conversation_history: list
    risk_snapshot: dict
    agent_activity: dict
    last_updated: str


def _load_json(filename: str):
    with open(DATA_DIR / filename, "r") as f:
        return json.load(f)


def load_initial_state() -> dict:
    """Build the initial session state from mock data files."""
    company = _load_json("mock_company.json")
    disruptions = _load_json("mock_disruptions.json")
    inventory = _load_json("mock_inventory.json")
    orders = _load_json("mock_orders.json")
    suppliers = _load_json("mock_suppliers.json")

    active_disruptions = [d for d in disruptions if d.get("is_active")]
    at_risk_orders = [
        o for o in orders
        if any(s["status"] in ("delayed", "at_risk") for s in o.get("shipments", []))
    ]
    revenue_at_risk = sum(o["total_value_eur"] for o in at_risk_orders)

    return {
        # Core session state fields (WardenSessionState)
        "company_profile": company,
        "active_disruptions": active_disruptions,
        "pending_actions": [],
        "conversation_history": [],
        "risk_snapshot": {
            "overall_score": 78,
            "revenue_at_risk_eur": revenue_at_risk,
            "active_disruptions": len(active_disruptions),
            "suppliers_at_risk": len(
                [s for s in suppliers if s["current_status"] != "normal"]
            ),
            "orders_at_risk": len(at_risk_orders),
            "sla_breaches_pending": 1,
            "last_updated": datetime.now(timezone.utc).isoformat(),
        },
        "agent_activity": {
            "orchestrator": "idle",
            "perception": "idle",
            "risk_engine": "idle",
            "planning": "idle",
            "action": "idle",
        },
        "last_updated": datetime.now(timezone.utc).isoformat(),
        # Extended data (available to tools via direct file reads)
        "inventory": inventory,
        "orders": orders,
        "suppliers": suppliers,
        "disruptions": disruptions,
    }
