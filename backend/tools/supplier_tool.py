"""Supplier health and profile data tool."""

import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"


def get_supplier_profile(supplier_id: str = "") -> dict:
    """Get detailed supplier profile and health data.

    Args:
        supplier_id: Specific supplier ID. Leave empty for all suppliers.

    Returns:
        Supplier profile(s) with health scores and status.
    """
    sup_path = DATA_DIR / "mock_suppliers.json"
    with open(sup_path, "r") as f:
        suppliers = json.load(f)

    if supplier_id:
        suppliers = [s for s in suppliers if s["supplier_id"] == supplier_id]
        if not suppliers:
            return {"error": f"Supplier {supplier_id} not found"}
        return {"supplier": suppliers[0]}

    return {
        "total_suppliers": len(suppliers),
        "at_risk_count": len([s for s in suppliers if s["current_status"] != "normal"]),
        "suppliers": suppliers,
    }


def get_supplier_risk_assessment(supplier_id: str) -> dict:
    """Get a risk assessment for a specific supplier.

    Args:
        supplier_id: The supplier to assess.

    Returns:
        Risk assessment including concentration risk, geographic risk, and alternatives.
    """
    sup_path = DATA_DIR / "mock_suppliers.json"
    with open(sup_path, "r") as f:
        suppliers = json.load(f)

    supplier = next((s for s in suppliers if s["supplier_id"] == supplier_id), None)
    if not supplier:
        return {"error": f"Supplier {supplier_id} not found"}

    # Calculate risk factors
    concentration_risk = "HIGH" if supplier["single_source"] else "LOW"
    geo_risk_map = {
        "Taiwan": "CRITICAL",
        "South Korea": "MEDIUM",
        "Malaysia": "MEDIUM",
        "Germany": "LOW",
        "Switzerland": "LOW",
    }
    geographic_risk = geo_risk_map.get(supplier["location"]["country"], "MEDIUM")

    return {
        "supplier_id": supplier_id,
        "supplier_name": supplier["name"],
        "health_score": supplier["health_score"],
        "current_status": supplier["current_status"],
        "risk_factors": {
            "concentration_risk": concentration_risk,
            "geographic_risk": geographic_risk,
            "contract_protection": "STRONG" if supplier["force_majeure_clause"] else "WEAK",
            "lead_time_risk": "HIGH" if supplier["lead_time_days"] > 30 else "MEDIUM" if supplier["lead_time_days"] > 14 else "LOW",
        },
        "annual_spend_eur": supplier["annual_spend_eur"],
        "backup_available": len(supplier.get("backup_suppliers", [])) > 0,
        "backup_suppliers": supplier.get("backup_suppliers", []),
        "components_at_risk": supplier["components_supplied"],
        "recommendation": f"{'Diversify sourcing immediately — single-source dependency' if supplier['single_source'] else 'Maintain monitoring'} for {supplier['name']}",
    }


def search_alternative_suppliers(component_id: str) -> dict:
    """Search for alternative suppliers for a given component.

    Args:
        component_id: The component ID to find alternatives for.

    Returns:
        List of potential alternative suppliers with lead times and costs.
    """
    sup_path = DATA_DIR / "mock_suppliers.json"
    with open(sup_path, "r") as f:
        suppliers = json.load(f)

    alternatives = [
        s for s in suppliers
        if component_id in s["components_supplied"]
    ]

    return {
        "component_id": component_id,
        "alternatives_found": len(alternatives),
        "suppliers": [
            {
                "supplier_id": s["supplier_id"],
                "name": s["name"],
                "location": s["location"],
                "health_score": s["health_score"],
                "lead_time_days": s["lead_time_days"],
                "current_status": s["current_status"],
                "contract_type": s["contract_type"],
            }
            for s in alternatives
        ],
    }
