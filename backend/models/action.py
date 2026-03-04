from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class MitigationStrategy(BaseModel):
    strategy_id: str
    title: str
    description: str
    estimated_cost_eur: float
    estimated_savings_eur: float
    implementation_time_days: int
    confidence_score: float = Field(ge=0.0, le=1.0)
    trade_offs: list[str] = []
    recommended: bool = False


class PendingAction(BaseModel):
    action_id: str
    type: str  # "email" | "po_adjustment" | "escalation" | "stock_build"
    title: str
    description: str
    target: str  # supplier name or internal team
    urgency: str  # "critical" | "high" | "medium" | "low"
    content: str  # full email draft, PO details, etc.
    related_disruption: Optional[str] = None
    related_order: Optional[str] = None
    created_at: str
    status: str = "pending"  # "pending" | "approved" | "dismissed"
    approved_at: Optional[str] = None
    dismissed_at: Optional[str] = None
    dismiss_reason: Optional[str] = None


class AgentResponse(BaseModel):
    session_id: str
    message: str
    reasoning_trace: list[str] = []
    recommendations: list[MitigationStrategy] = []
    actions_generated: list[PendingAction] = []
    confidence_score: float = Field(ge=0.0, le=1.0, default=0.85)
    revenue_at_risk_eur: Optional[float] = None
    metadata: dict = {}


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str
    timestamp: str
    metadata: Optional[dict] = None


class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"


class ActionApproval(BaseModel):
    action_id: str
    approved: bool
    reason: Optional[str] = None
