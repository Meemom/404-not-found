import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"


def simulate_disruption_cascade(
    disruption_type: str,
    affected_supplier_id: str,
    duration_days: int = 21,
    supply_reduction_pct: int = 60,
) -> dict:
    """Simulate how a disruption cascades through the supply chain.

    Args:
        disruption_type: Type of disruption (e.g. "port_closure", "facility_damage").
        affected_supplier_id: The supplier ID that is directly affected.
        duration_days: Expected duration of the disruption in days.
        supply_reduction_pct: Percentage reduction in supply from affected supplier.

    Returns:
        Cascade simulation showing impact propagation through supply chain tiers.
    """
    # load data
    with open(DATA_DIR / "mock_suppliers.json") as f:
        suppliers = json.load(f)
    with open(DATA_DIR / "mock_inventory.json") as f:
        inventory = json.load(f)
    with open(DATA_DIR / "mock_orders.json") as f:
        orders = json.load(f)

    supplier = next((s for s in suppliers if s["supplier_id"] == affected_supplier_id), None)
    if not supplier:
        return {"error": f"Supplier {affected_supplier_id} not found"}

    # calculate cascade
    affected_components = supplier["components_supplied"]
    affected_inventory = [i for i in inventory if i["component_id"] in affected_components]
    affected_orders = [
        o for o in orders
        if any(c in affected_components for c in o["components_required"])
    ]

    cascade_nodes = []
    cascade_edges = []

    # Level 0: Disruption
    cascade_nodes.append({
        "id": "disruption-0",
        "type": "disruption",
        "label": f"{disruption_type.replace('_', ' ').title()}",
        "data": {"duration_days": duration_days, "severity": "critical"},
        "position": {"x": 0, "y": 250},
    })

    # Level 1: Affected supplier
    cascade_nodes.append({
        "id": f"supplier-{supplier['supplier_id']}",
        "type": "supplier",
        "label": supplier["name"],
        "data": {
            "health_score": supplier["health_score"],
            "supply_reduction": f"{supply_reduction_pct}%",
            "location": supplier["location"]["country"],
        },
        "position": {"x": 300, "y": 250},
    })
    cascade_edges.append({
        "id": f"e-dis-sup",
        "source": "disruption-0",
        "target": f"supplier-{supplier['supplier_id']}",
        "type": "broken",
        "label": f"-{supply_reduction_pct}% supply",
    })

    # Level 2: Affected components
    for idx, inv in enumerate(affected_inventory):
        node_id = f"component-{inv['component_id']}"
        days_until_critical = max(0, inv["days_of_supply"] - (duration_days * supply_reduction_pct / 100))
        cascade_nodes.append({
            "id": node_id,
            "type": "component",
            "label": inv["name"],
            "data": {
                "component_id": inv["component_id"],
                "stock_days": inv["days_of_supply"],
                "days_until_critical": round(days_until_critical),
                "status": "critical" if days_until_critical < 7 else "at_risk",
            },
            "position": {"x": 600, "y": 150 + idx * 200},
        })
        cascade_edges.append({
            "id": f"e-sup-comp-{idx}",
            "source": f"supplier-{supplier['supplier_id']}",
            "target": node_id,
            "type": "at_risk",
            "label": f"{inv['days_of_supply']} days remaining",
        })

    # Level 3: Production lines
    production_node = {
        "id": "production-line-a",
        "type": "production",
        "label": "Assembly Line A",
        "data": {
            "capacity": "3,000 units/week",
            "at_risk_output": "2,400 units/week",
            "status": "at_risk",
        },
        "position": {"x": 900, "y": 250},
    }
    cascade_nodes.append(production_node)
    for inv in affected_inventory:
        cascade_edges.append({
            "id": f"e-comp-prod-{inv['component_id']}",
            "source": f"component-{inv['component_id']}",
            "target": "production-line-a",
            "type": "at_risk",
        })

    # Level 4: Affected orders
    total_revenue_at_risk = 0
    for idx, order in enumerate(affected_orders):
        node_id = f"order-{order['order_id']}"
        total_revenue_at_risk += order["total_value_eur"]
        days_to_sla = 6 + idx * 5  # Simulated
        cascade_nodes.append({
            "id": node_id,
            "type": "order",
            "label": f"Order {order['order_id']}",
            "data": {
                "customer": order["customer_name"],
                "value_eur": order["total_value_eur"],
                "sla_deadline": order["sla_deadline"],
                "days_to_breach": days_to_sla,
                "breach_probability": 0.73 if days_to_sla < 7 else 0.45,
            },
            "position": {"x": 1200, "y": 100 + idx * 200},
        })
        cascade_edges.append({
            "id": f"e-prod-ord-{idx}",
            "source": "production-line-a",
            "target": node_id,
            "type": "at_risk" if days_to_sla > 7 else "broken",
            "label": f"SLA breach in {days_to_sla}d",
        })

    # Level 5: Customer nodes
    seen_customers = set()
    for idx, order in enumerate(affected_orders):
        if order["customer_name"] not in seen_customers:
            seen_customers.add(order["customer_name"])
            cust_id = f"customer-{order['customer_id']}"
            cascade_nodes.append({
                "id": cust_id,
                "type": "customer",
                "label": order["customer_name"],
                "data": {
                    "tier": 1,
                    "relationship": "Strategic",
                    "penalty_clause": True,
                },
                "position": {"x": 1500, "y": 100 + len(seen_customers) * 200},
            })
            cascade_edges.append({
                "id": f"e-ord-cust-{idx}",
                "source": f"order-{order['order_id']}",
                "target": cust_id,
                "type": "normal",
            })

    return {
        "simulation_id": f"sim-{disruption_type}-{affected_supplier_id}",
        "disruption_type": disruption_type,
        "affected_supplier": supplier["name"],
        "duration_days": duration_days,
        "supply_reduction_pct": supply_reduction_pct,
        "cascade": {
            "nodes": cascade_nodes,
            "edges": cascade_edges,
        },
        "impact_summary": {
            "components_affected": len(affected_inventory),
            "orders_at_risk": len(affected_orders),
            "revenue_at_risk_eur": total_revenue_at_risk,
            "production_lines_affected": 1,
            "customers_impacted": len(seen_customers),
        },
    }


def simulate_mitigation_options(
    disruption_id: str,
    revenue_at_risk_eur: float,
) -> dict:
    """Generate and compare mitigation strategy options.

    Args:
        disruption_id: The disruption event to mitigate.
        revenue_at_risk_eur: The total revenue at risk from this disruption.

    Returns:
        Ranked list of mitigation strategies with trade-off analysis.
    """
    return {
        "disruption_id": disruption_id,
        "revenue_at_risk_eur": revenue_at_risk_eur,
        "strategies": [
            {
                "strategy_id": "strat-A",
                "title": "Emergency Air Freight from Taiwan",
                "description": "Arrange emergency air freight for 40,000 MCU units from TSMC Hsinchu facility, bypassing sea route entirely. Delivery in 3-5 days.",
                "estimated_cost_eur": 180000,
                "estimated_savings_eur": revenue_at_risk_eur - 180000,
                "implementation_time_days": 2,
                "confidence_score": 0.88,
                "trade_offs": [
                    "High logistics cost (€180K premium over sea freight)",
                    "Saves BMW SLA — avoids penalty clause activation",
                    "Sets precedent for emergency procurement budget",
                    "Fastest resolution but most expensive",
                ],
                "recommended": False,
            },
            {
                "strategy_id": "strat-B",
                "title": "Partial Sourcing from Infineon Dresden (Backup)",
                "description": "Activate backup supply agreement with Infineon Dresden facility. They can provide 40% of required MCU-32BIT-AUTO volume (16,000 units) with 5-day lead time.",
                "estimated_cost_eur": 45000,
                "estimated_savings_eur": revenue_at_risk_eur * 0.4 - 45000,
                "implementation_time_days": 5,
                "confidence_score": 0.82,
                "trade_offs": [
                    "Covers 40% of gap — need additional strategy for remaining 60%",
                    "Cost-effective at €45K premium",
                    "Strengthens relationship with European backup supplier",
                    "May need to combine with SLA negotiation for full coverage",
                ],
                "recommended": True,
            },
            {
                "strategy_id": "strat-C",
                "title": "Customer SLA Negotiation + Buffer Building",
                "description": "Proactively communicate with BMW and VW to negotiate 7-day SLA extensions. Simultaneously begin building buffer stock from all available sources.",
                "estimated_cost_eur": 12000,
                "estimated_savings_eur": revenue_at_risk_eur * 0.6,
                "implementation_time_days": 1,
                "confidence_score": 0.55,
                "trade_offs": [
                    "Lowest cost option",
                    "Risk of relationship damage with Tier-1 customers",
                    "BMW may refuse — penalty clause is contractual",
                    "VW more likely to accept given longer original SLA",
                    "Does not solve underlying supply gap",
                ],
                "recommended": False,
            },
            {
                "strategy_id": "strat-D",
                "title": "Do Nothing (Baseline)",
                "description": "Maintain current course and wait for Taiwan Strait situation to resolve. Monitor daily and react if inventory hits critical levels.",
                "estimated_cost_eur": 0,
                "estimated_savings_eur": 0,
                "implementation_time_days": 0,
                "confidence_score": 0.20,
                "trade_offs": [
                    "Zero immediate cost",
                    "High probability of SLA breach (73% for BMW)",
                    "Potential penalty clause activation: est. €350K",
                    "Relationship damage with strategic customers",
                    "Reactive rather than proactive — not recommended",
                ],
                "recommended": False,
            },
        ],
        "recommended_combination": "Strategy B (Infineon Dresden backup) + proactive BMW communication from Strategy C. This provides 40% supply coverage at moderate cost while maintaining customer relationships.",
    }
