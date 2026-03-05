import json
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter

DATA_DIR = Path(__file__).parent.parent / "data"

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


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


@router.get("/globe-data")
async def globe_data():
    """Return data formatted for react-globe.gl visualization."""
    company = _load_json("mock_company.json")
    suppliers = _load_json("mock_suppliers.json")
    orders = _load_json("mock_orders.json")
    disruptions = _load_json("mock_disruptions.json")

    # Company HQ node
    nodes = [
        {
            "id": company["id"],
            "name": company["name"],
            "lat": company["hq"]["lat"],
            "lng": company["hq"]["lng"],
            "type": "hq",
            "color": "#0D9488",
            "size": 1.0,
            "label": company["name"],
            "details": {
                "city": company["hq"]["city"],
                "country": company["hq"]["country"],
                "revenue": company["annual_revenue_eur"],
                "employees": company["employees"],
            },
        }
    ]

    # Customer nodes
    for cust in company.get("customers", []):
        if cust.get("location"):
            nodes.append({
                "id": cust["id"],
                "name": cust["name"],
                "lat": cust["location"]["lat"],
                "lng": cust["location"]["lng"],
                "type": "customer",
                "color": "#3B82F6",
                "size": 0.6,
                "label": cust["name"],
                "details": {
                    "tier": cust["tier"],
                    "annual_value": cust["annual_value_eur"],
                    "sla_days": cust["sla_days"],
                },
            })

    # Supplier nodes
    for sup in suppliers:
        status_color = {
            "normal": "#0D9488",
            "at_risk": "#F59E0B",
            "disrupted": "#EF4444",
        }
        nodes.append({
            "id": sup["supplier_id"],
            "name": sup["name"],
            "lat": sup["location"]["lat"],
            "lng": sup["location"]["lng"],
            "type": "supplier",
            "tier": sup["tier"],
            "color": status_color.get(sup["current_status"], "#3B82F6"),
            "size": 0.8 if sup["tier"] == 1 else 0.5,
            "label": sup["name"],
            "status": sup["current_status"],
            "health_score": sup["health_score"],
            "details": {
                "city": sup["location"]["city"],
                "country": sup["location"]["country"],
                "components": sup["components_supplied"],
                "health_score": sup["health_score"],
                "lead_time": sup["lead_time_days"],
                "annual_spend": sup["annual_spend_eur"],
                "single_source": sup["single_source"],
            },
        })

    # Shipment arcs
    arcs = []
    for order in orders:
        for shipment in order.get("shipments", []):
            supplier = next(
                (s for s in suppliers if s["supplier_id"] == shipment["from_supplier"]),
                None,
            )
            if supplier:
                arc_color = {
                    "on_track": "#0D9488",
                    "at_risk": "#F59E0B",
                    "delayed": "#EF4444",
                }
                arcs.append({
                    "id": shipment["shipment_id"],
                    "startLat": supplier["location"]["lat"],
                    "startLng": supplier["location"]["lng"],
                    "endLat": company["hq"]["lat"],
                    "endLng": company["hq"]["lng"],
                    "color": arc_color.get(shipment["status"], "#3B82F6"),
                    "status": shipment["status"],
                    "label": f"{shipment['component']} ({shipment['quantity']} units)",
                    "stroke": 2 if shipment["status"] == "on_track" else 3,
                    "dash": shipment["status"] == "delayed",
                })

    # Delivery arcs (company to customers)
    for cust in company.get("customers", []):
        if cust.get("location"):
            arcs.append({
                "id": f"delivery-{cust['id']}",
                "startLat": company["hq"]["lat"],
                "startLng": company["hq"]["lng"],
                "endLat": cust["location"]["lat"],
                "endLng": cust["location"]["lng"],
                "color": "#3B82F6",
                "status": "active",
                "label": f"Deliveries to {cust['name']}",
                "stroke": 1.5,
                "dash": False,
            })

    # Risk zones
    active_disruptions = [d for d in disruptions if d.get("is_active")]
    risk_zones = []
    for dis in active_disruptions:
        # Map disruption to geographic coordinates
        region_coords = {
            "Taiwan": {"lat": 23.5, "lng": 121.0, "radius": 5},
            "South Korea": {"lat": 36.0, "lng": 128.0, "radius": 4},
            "Malaysia": {"lat": 4.0, "lng": 102.0, "radius": 4},
        }
        for country in dis.get("affected_countries", []):
            if country in region_coords:
                risk_zones.append({
                    "id": f"rz-{dis['disruption_id']}-{country}",
                    "lat": region_coords[country]["lat"],
                    "lng": region_coords[country]["lng"],
                    "radius": region_coords[country]["radius"],
                    "color": "rgba(239, 68, 68, 0.3)",
                    "label": dis["title"],
                    "severity": dis["severity"],
                })

    return {
        "nodes": nodes,
        "arcs": arcs,
        "risk_zones": risk_zones,
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/cascade-data")
async def cascade_data():
    """Return cascade graph data formatted for React Flow."""
    from tools.simulation_tool import simulate_disruption_cascade

    result = simulate_disruption_cascade(
        disruption_type="port_closure",
        affected_supplier_id="sup-tsmc-001",
        duration_days=21,
        supply_reduction_pct=60,
    )

    cascade = result.get("cascade", {})
    nodes = cascade.get("nodes", [])
    edges = cascade.get("edges", [])

    # Adapt nodes for React Flow frontend
    adapted_nodes = []
    for n in nodes:
        adapted_nodes.append({
            "id": n["id"],
            "type": n.get("type", "default"),
            "label": n.get("label", ""),
            "x": n.get("position", {}).get("x", 0),
            "y": n.get("position", {}).get("y", 0),
            "impact": n.get("data", {}).get("status", "low"),
            "detail": n.get("data", {}).get("supply_reduction", n.get("data", {}).get("capacity", "")),
            "probability": int(n.get("data", {}).get("breach_probability", 0) * 100) if isinstance(n.get("data", {}).get("breach_probability"), (int, float)) else None,
        })

    adapted_edges = []
    for e in edges:
        adapted_edges.append({
            "source": e["source"],
            "target": e["target"],
            "label": e.get("label", ""),
            "severity": "critical" if e.get("type") == "broken" else "high" if e.get("type") == "at_risk" else "low",
            "animated": e.get("type") == "broken",
        })

    return {
        "scenario_name": f"{result.get('disruption_type', 'Unknown').replace('_', ' ').title()} — {result.get('affected_supplier', 'Unknown')}",
        "nodes": adapted_nodes,
        "edges": adapted_edges,
        "impact_summary": result.get("impact_summary", {}),
    }
