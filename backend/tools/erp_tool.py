import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"


def get_inventory_levels(component_id: str = "") -> dict:
    """Get current inventory levels from the ERP system.

    Args:
        component_id: Optional specific component ID to query. Leave empty for all.

    Returns:
        Inventory data including stock levels, days of supply, and status.
    """
    inv_path = DATA_DIR / "mock_inventory.json"
    with open(inv_path, "r") as f:
        inventory = json.load(f)

    if component_id:
        inventory = [i for i in inventory if i["component_id"] == component_id]

    critical = [i for i in inventory if i["status"] in ("below_reorder", "critical")]
    return {
        "total_components": len(inventory),
        "critical_count": len(critical),
        "inventory": inventory,
    }


def get_active_orders(customer_name: str = "") -> dict:
    """Get active orders from the ERP system.

    Args:
        customer_name: Optional filter by customer name. Leave empty for all.

    Returns:
        Active orders with shipment status and SLA details.
    """
    orders_path = DATA_DIR / "mock_orders.json"
    with open(orders_path, "r") as f:
        orders = json.load(f)

    if customer_name:
        orders = [o for o in orders if customer_name.lower() in o["customer_name"].lower()]

    at_risk = [o for o in orders if any(
        s["status"] in ("delayed", "at_risk") for s in o.get("shipments", [])
    )]
    total_value = sum(o["total_value_eur"] for o in orders)
    at_risk_value = sum(o["total_value_eur"] for o in at_risk)

    return {
        "total_orders": len(orders),
        "at_risk_orders": len(at_risk),
        "total_value_eur": total_value,
        "at_risk_value_eur": at_risk_value,
        "orders": orders,
    }


def get_production_status() -> dict:
    """Get current production line status.

    Returns:
        Production line status with capacity and at-risk output.
    """
    return {
        "production_lines": [
            {
                "line_id": "LINE-A",
                "name": "Assembly Line A — ECU Production",
                "product": "Engine Control Unit v4.2",
                "capacity_units_per_week": 3000,
                "current_output_pct": 75,
                "at_risk_output_units": 2400,
                "status": "at_risk",
                "bottleneck_component": "MCU-32BIT-AUTO",
                "notes": "Reduced output due to semiconductor shortage from TSMC delay",
            },
            {
                "line_id": "LINE-B",
                "name": "Assembly Line B — Power Modules",
                "product": "Power Management Module v3.1",
                "capacity_units_per_week": 2000,
                "current_output_pct": 90,
                "at_risk_output_units": 0,
                "status": "normal",
                "bottleneck_component": None,
                "notes": "Operating normally, sufficient POWER-MGMT-IC stock for 18 days",
            },
            {
                "line_id": "LINE-C",
                "name": "Assembly Line C — CAN Controllers",
                "product": "CAN Bus Controller Board v2.0",
                "capacity_units_per_week": 1200,
                "current_output_pct": 95,
                "at_risk_output_units": 0,
                "status": "normal",
                "bottleneck_component": None,
                "notes": "Healthy inventory, Infineon Malaysia shipments on track",
            },
        ]
    }


def flag_reorder(component_id: str, quantity: int, urgency: str = "standard") -> dict:
    """Flag a component for reorder in the ERP system.

    Args:
        component_id: The component to reorder.
        quantity: Number of units to order.
        urgency: Priority level — "standard", "urgent", or "emergency".

    Returns:
        Confirmation of the reorder flag.
    """
    return {
        "status": "flagged",
        "component_id": component_id,
        "quantity": quantity,
        "urgency": urgency,
        "message": f"Reorder flag set: {quantity} units of {component_id} at {urgency} priority. Awaiting human approval.",
        "estimated_lead_time_days": 7 if urgency == "emergency" else 14 if urgency == "urgent" else 21,
    }


def calculate_stockout_date(component_id: str, weekly_consumption: int = 0) -> dict:
    """Calculate when a component will reach stockout given current inventory and consumption rate.

    Args:
        component_id: The component ID to analyze.
        weekly_consumption: Weekly consumption in units. If 0, uses the daily rate from inventory data × 7.

    Returns:
        Stockout analysis with date, days remaining, and risk level.
    """
    from datetime import datetime, timedelta, timezone

    inv_path = DATA_DIR / "mock_inventory.json"
    with open(inv_path, "r") as f:
        inventory = json.load(f)

    item = next((i for i in inventory if i["component_id"] == component_id), None)
    if not item:
        return {"error": f"Component {component_id} not found"}

    daily_consumption = weekly_consumption / 7 if weekly_consumption else item["daily_consumption_units"]
    current_stock = item["current_stock_units"]
    days_until_stockout = int(current_stock / daily_consumption) if daily_consumption > 0 else 999

    now = datetime.now(timezone.utc)
    stockout_date = now + timedelta(days=days_until_stockout)

    risk_level = "critical" if days_until_stockout <= 7 else "high" if days_until_stockout <= 14 else "medium" if days_until_stockout <= 21 else "low"

    return {
        "component_id": component_id,
        "component_name": item["name"],
        "current_stock_units": current_stock,
        "daily_consumption_units": int(daily_consumption),
        "weekly_consumption_units": int(daily_consumption * 7),
        "days_until_stockout": days_until_stockout,
        "stockout_date": stockout_date.strftime("%Y-%m-%d"),
        "safety_stock_units": item["safety_stock_units"],
        "below_safety_stock": current_stock < item["safety_stock_units"],
        "risk_level": risk_level,
        "primary_supplier": item["primary_supplier"],
        "backup_supplier": item.get("backup_supplier"),
    }


def estimate_revenue_at_risk(affected_component_ids: list[str]) -> dict:
    """Estimate total revenue at risk based on which components are affected.

    Args:
        affected_component_ids: List of component IDs that are disrupted or at risk.

    Returns:
        Revenue at risk breakdown by order and customer.
    """
    orders_path = DATA_DIR / "mock_orders.json"
    with open(orders_path, "r") as f:
        orders = json.load(f)

    affected_orders = []
    total_revenue_at_risk = 0.0

    for order in orders:
        overlap = [c for c in order["components_required"] if c in affected_component_ids]
        if overlap:
            affected_orders.append({
                "order_id": order["order_id"],
                "customer_name": order["customer_name"],
                "product": order["product"],
                "total_value_eur": order["total_value_eur"],
                "affected_components": overlap,
                "sla_deadline": order["sla_deadline"],
                "completion_pct": order["completion_pct"],
                "remaining_value_eur": order["total_value_eur"] * (1 - order["completion_pct"] / 100),
            })
            total_revenue_at_risk += order["total_value_eur"]

    return {
        "affected_component_ids": affected_component_ids,
        "total_revenue_at_risk_eur": total_revenue_at_risk,
        "affected_orders_count": len(affected_orders),
        "affected_orders": affected_orders,
    }
