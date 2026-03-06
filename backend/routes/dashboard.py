import json
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter

DATA_DIR = Path(__file__).parent.parent / "data"

router = APIRouter(prefix="/insights", tags=["insights"])


def _load_json(filename: str):
    with open(DATA_DIR / filename, "r") as f:
        return json.load(f)


@router.get("/overview")
async def dashboard_overview():
    """Return complete dashboard overview data."""
    suppliers = _load_json("mock_suppliers.json")
    orders = _load_json("mock_orders.json")
    inventory = _load_json("mock_inventory.json")
    disruptions = _load_json("mock_disruptions.json")

    active_disruptions = [d for d in disruptions if d.get("is_active")]
    at_risk_suppliers = [s for s in suppliers if s["current_status"] != "normal"]
    at_risk_orders = [
        o for o in orders
        if any(s["status"] in ("delayed", "at_risk") for s in o.get("shipments", []))
    ]

    revenue_at_risk = sum(o["total_value_eur"] for o in at_risk_orders)

    supplier_health = [
        {
            "supplier_id": s["supplier_id"],
            "name": s["name"],
            "health_score": s["health_score"],
            "status": s["current_status"],
            "components_at_risk": s["components_supplied"] if s["current_status"] != "normal" else [],
        }
        for s in suppliers
    ]

    sla_at_risk = [
        {
            "order_id": o["order_id"],
            "customer": o["customer_name"],
            "customer_name": o["customer_name"],
            "value_eur": o["total_value_eur"],
            "sla_deadline": o["sla_deadline"],
            "completion_pct": o["completion_pct"],
            "breach_probability": 100 - o["completion_pct"],
            "product": o["product"],
        }
        for o in at_risk_orders
    ]

    critical_inventory = [
        {
            "component_id": i["component_id"],
            "name": i["name"],
            "days_of_supply": i["days_of_supply"],
            "reorder_point_days": i.get("reorder_point_days", 20),
            "status": i["status"],
        }
        for i in inventory
        if i["status"] in ("below_reorder", "critical")
    ]

    # Calculate overall risk score
    risk_score = min(100, max(0,
        (len(active_disruptions) * 20) +
        (len(at_risk_suppliers) * 15) +
        (len(at_risk_orders) * 10) +
        sum(1 for i in inventory if i["status"] in ("below_reorder", "critical")) * 8
    ))

    return {
        "risk_score": risk_score,
        "revenue_at_risk_eur": revenue_at_risk,
        "active_alerts": len(active_disruptions),
        "pending_actions": 0,
        "supplier_health": supplier_health,
        "sla_at_risk_orders": sla_at_risk,
        "critical_inventory": critical_inventory,
        "disruptions": [
            {
                "id": d["disruption_id"],
                "title": d["title"],
                "description": d.get("description", ""),
                "severity": d.get("severity", 5),
                "affected_region": d.get("affected_region", "Unknown"),
                "status": "active" if d.get("is_active") else "resolved",
                "detected_at": d.get("detected_at"),
                "financial_impact_eur": d.get("financial_impact_eur"),
                "affected_suppliers": d.get("affected_supplier_ids", []),
            }
            for d in disruptions
        ],
        "total_orders": len(orders),
        "total_suppliers": len(suppliers),
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }

