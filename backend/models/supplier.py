from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional


class SupplierContact(BaseModel):
    name: str
    role: str
    email: str


class SupplierLocation(BaseModel):
    city: str
    country: str
    lat: float
    lng: float


class Supplier(BaseModel):
    supplier_id: str
    name: str
    location: SupplierLocation
    tier: int
    components_supplied: list[str]
    health_score: int = Field(ge=0, le=100)
    lead_time_days: int
    single_source: bool
    annual_spend_eur: float
    contract_type: str  # "spot" | "annual" | "multi-year"
    force_majeure_clause: bool
    backup_suppliers: list[str] = []
    current_status: str = "normal"  # "normal" | "at_risk" | "disrupted"
    contact: Optional[SupplierContact] = None
    reliability_rating: Optional[int] = None
    on_time_delivery_pct: Optional[float] = None
    quality_score: Optional[int] = None


class Shipment(BaseModel):
    shipment_id: str
    from_supplier: str
    component: str
    quantity: int
    status: str  # "on_track" | "at_risk" | "delayed"
    eta_original: str
    eta_revised: Optional[str] = None
    delay_days: int = 0


class Order(BaseModel):
    order_id: str
    customer_id: str
    customer_name: str
    product: str
    quantity: int
    unit_price_eur: float
    total_value_eur: float
    order_date: str
    due_date: str
    sla_deadline: str
    status: str
    completion_pct: int
    components_required: list[str]
    shipments: list[Shipment] = []


class InventoryItem(BaseModel):
    component_id: str
    name: str
    category: str
    current_stock_units: int
    daily_consumption_units: int
    days_of_supply: int
    safety_stock_units: int
    reorder_point_units: int
    status: str  # "healthy" | "adequate" | "below_reorder" | "critical"
    unit_cost_eur: float
    primary_supplier: str
    backup_supplier: Optional[str] = None
    warehouse_location: str
    last_replenishment: str
    next_expected_delivery: Optional[str] = None
