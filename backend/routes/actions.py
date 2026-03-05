import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/actions", tags=["actions"])

# TODO: might move this to db
_actions_store: list[dict] = [
    {
        "action_id": "act-demo-001",
        "type": "email",
        "title": "Supplier Outreach — Infineon Dresden",
        "description": "Emergency email to Klaus Richter requesting 16,000 MCU-32BIT-AUTO units from Dresden backup facility",
        "target": "Infineon Technologies (Dresden)",
        "urgency": "critical",
        "content": "Dear Klaus Richter,\n\nI am writing on behalf of AutoParts GmbH regarding an urgent procurement request. Due to ongoing Taiwan Strait shipping disruptions affecting our primary TSMC supply line, we need to activate our backup supply agreement.\n\nWe are requesting emergency allocation of 16,000 MCU-32BIT-AUTO units from your Dresden facility with expedited 5-day delivery.\n\nPlease confirm availability and delivery timeline at your earliest convenience.\n\nBest regards,\nAutoParts GmbH Procurement",
        "related_disruption": "DIS-2026-002",
        "related_order": "ORD-DE-8821",
        "created_at": "2026-03-03T08:00:00Z",
        "status": "pending",
    },
    {
        "action_id": "act-demo-002",
        "type": "escalation",
        "title": "Executive Escalation — VP Operations",
        "description": "Internal brief to Max Mueller on Taiwan Strait disruption and €4.2M revenue at risk",
        "target": "Max Mueller, VP Operations",
        "urgency": "high",
        "content": "SUPPLY CHAIN DISRUPTION BRIEF\n\nSituation: Taiwan Strait shipping congestion (14-21 day delays)\nImpact: €4,239,000 revenue at risk, 2 orders at SLA breach risk\nRecommended: Activate Infineon Dresden backup + proactive BMW communication\nDecision Required: Authorize emergency procurement budget (€45K-€180K range)",
        "related_disruption": "DIS-2026-002",
        "related_order": None,
        "created_at": "2026-03-03T08:05:00Z",
        "status": "pending",
    },
    {
        "action_id": "act-demo-003",
        "type": "email",
        "title": "BMW Proactive Communication",
        "description": "Proactive outreach to BMW account manager about potential impact on Order #DE-8821",
        "target": "BMW AG",
        "urgency": "high",
        "content": "Dear BMW Account Manager,\n\nI am reaching out proactively regarding Order #DE-8821 (Engine Control Unit v4.2, 12,000 units).\n\nWe are experiencing delays from our semiconductor supplier due to Taiwan Strait shipping congestion. We have activated backup supply from our European facility and expect to mitigate the majority of the impact.\n\nWe will provide a detailed update within 48 hours with confirmed revised timelines.\n\nSincerely,\nAutoParts GmbH",
        "related_disruption": "DIS-2026-002",
        "related_order": "ORD-DE-8821",
        "created_at": "2026-03-03T08:10:00Z",
        "status": "pending",
    },
    {
        "action_id": "act-demo-004",
        "type": "po_adjustment",
        "title": "Emergency Reorder — MCU-32BIT-AUTO",
        "description": "ERP reorder flag: 60,000 units MCU-32BIT-AUTO at emergency priority",
        "target": "ERP System",
        "urgency": "critical",
        "content": "REORDER REQUEST\nComponent: MCU-32BIT-AUTO (32-bit Automotive Microcontroller)\nQuantity: 60,000 units\nPriority: EMERGENCY\nSplit: 16,000 from Infineon Dresden (5-day lead), 44,000 from TSMC (when available)\nEstimated Cost: €510,000\nJustification: Current stock at 12 days, below reorder point. Taiwan Strait disruption affecting primary supply.",
        "related_disruption": "DIS-2026-002",
        "related_order": None,
        "created_at": "2026-03-03T08:15:00Z",
        "status": "pending",
    },
]


@router.get("/pending")
async def get_pending_actions():
    """Get all pending actions awaiting approval."""
    pending = [a for a in _actions_store if a["status"] == "pending"]
    return {
        "actions": pending,
        "count": len(pending),
        "total": len(_actions_store),
    }


@router.get("/all")
async def get_all_actions():
    """Get all actions (pending, approved, dismissed)."""
    return {
        "actions": _actions_store,
        "pending": len([a for a in _actions_store if a["status"] == "pending"]),
        "approved": len([a for a in _actions_store if a["status"] == "approved"]),
        "dismissed": len([a for a in _actions_store if a["status"] == "dismissed"]),
    }


@router.post("/{action_id}/approve")
async def approve_action(action_id: str):
    """Approve a pending action."""
    action = next((a for a in _actions_store if a["action_id"] == action_id), None)
    if not action:
        raise HTTPException(status_code=404, detail=f"Action {action_id} not found")
    if action["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Action {action_id} is already {action['status']}")

    action["status"] = "approved"
    action["approved_at"] = datetime.now(timezone.utc).isoformat()

    return {
        "status": "approved",
        "action_id": action_id,
        "message": f"Action '{action['title']}' approved successfully.",
        "approved_at": action["approved_at"],
    }


@router.post("/{action_id}/dismiss")
async def dismiss_action(action_id: str, reason: str = ""):
    """Dismiss a pending action."""
    action = next((a for a in _actions_store if a["action_id"] == action_id), None)
    if not action:
        raise HTTPException(status_code=404, detail=f"Action {action_id} not found")
    if action["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Action {action_id} is already {action['status']}")

    action["status"] = "dismissed"
    action["dismissed_at"] = datetime.now(timezone.utc).isoformat()
    action["dismiss_reason"] = reason

    return {
        "status": "dismissed",
        "action_id": action_id,
        "message": f"Action '{action['title']}' dismissed.",
        "reason": reason,
    }
