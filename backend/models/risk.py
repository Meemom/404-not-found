from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional


class RiskDetails(BaseModel):
    shipments_affected: list[str] = []
    orders_at_risk: list[str] = []
    days_until_stockout: Optional[int] = None
    sla_breach_probability: Optional[float] = None
    revenue_at_risk_eur: Optional[float] = None


class DisruptionSignal(BaseModel):
    disruption_id: str
    title: str
    type: str  # "geopolitical" | "natural_disaster" | "logistics" | "labor" | "facility" | "regulatory"
    region: str
    affected_countries: list[str] = []
    start_date: str
    end_date: Optional[str] = None
    severity: int = Field(ge=1, le=10)
    description: str
    affected_suppliers: list[str] = []
    financial_impact_eur: Optional[float] = None
    mitigation_taken: Optional[str] = None
    outcome: Optional[str] = None  # "effective" | "partially_effective" | "ineffective"
    lessons_learned: Optional[str] = None
    is_active: bool = False
    risk_details: Optional[RiskDetails] = None


class RiskSnapshot(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    revenue_at_risk_eur: float
    active_disruptions: int
    suppliers_at_risk: int
    orders_at_risk: int
    sla_breaches_pending: int
    last_updated: str


class SupplierHealthSummary(BaseModel):
    supplier_id: str
    name: str
    health_score: int
    current_status: str
    components_at_risk: list[str] = []


class DashboardOverview(BaseModel):
    risk_score: int
    revenue_at_risk_eur: float
    active_alerts: int
    pending_actions: int
    supplier_health: list[SupplierHealthSummary]
    sla_at_risk_orders: list[dict]
    last_updated: str
