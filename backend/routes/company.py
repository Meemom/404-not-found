import json
from pathlib import Path

from fastapi import APIRouter

DATA_DIR = Path(__file__).parent.parent / "data"

router = APIRouter(prefix="/company", tags=["company"])

# in-memory company profile (loaded from mock data)
_company_profile = None


def _load_company():
    global _company_profile
    if _company_profile is None:
        with open(DATA_DIR / "mock_company.json", "r") as f:
            _company_profile = json.load(f)
    return _company_profile


@router.get("/profile")
async def get_company_profile():
    """Get the current company profile."""
    return _load_company()


@router.post("/profile")
async def update_company_profile(updates: dict):
    """Update company profile (used during onboarding)."""
    global _company_profile
    profile = _load_company()
    profile.update(updates)
    _company_profile = profile
    return {"status": "updated", "profile": _company_profile}


@router.get("/customers")
async def get_customers():
    """Get customer list."""
    profile = _load_company()
    return {"customers": profile.get("customers", [])}


@router.get("/metrics")
async def get_company_metrics():
    """Get key company metrics for dashboard."""
    profile = _load_company()
    return {
        "name": profile["name"],
        "annual_revenue_eur": profile["annual_revenue_eur"],
        "employees": profile["employees"],
        "customer_count": len(profile.get("customers", [])),
        "total_customer_value_eur": sum(c["annual_value_eur"] for c in profile.get("customers", [])),
        "critical_components": profile.get("critical_components", []),
        "certifications": profile.get("certifications", []),
        "avatar": profile.get("avatar", {}),
    }
