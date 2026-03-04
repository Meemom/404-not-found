from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional


class Location(BaseModel):
    city: str
    country: str
    lat: float
    lng: float


class Avatar(BaseModel):
    initials: str
    color: str
    shape: str = "hexagon"


class Customer(BaseModel):
    id: str
    name: str
    tier: int
    annual_value_eur: float
    sla_days: int
    location: Optional[Location] = None


class InventoryPolicy(BaseModel):
    safety_stock_days: int
    reorder_point_days: int


class CompanyProfile(BaseModel):
    id: str
    name: str
    industry: str
    hq: Location
    annual_revenue_eur: float
    employees: int
    avatar: Avatar
    customers: list[Customer]
    risk_appetite: str = "moderate"
    inventory_policy: InventoryPolicy
    critical_components: list[str]
    founded_year: Optional[int] = None
    certifications: list[str] = []
    primary_products: list[str] = []


class CompanyProfileUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    hq: Optional[Location] = None
    annual_revenue_eur: Optional[float] = None
    employees: Optional[int] = None
    avatar: Optional[Avatar] = None
    risk_appetite: Optional[str] = None
    inventory_policy: Optional[InventoryPolicy] = None
    critical_components: Optional[list[str]] = None
