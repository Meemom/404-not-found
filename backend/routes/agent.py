import json
import asyncio
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import AsyncGenerator

from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types as genai_types

from agents.orchestrator import orchestrator_agent
from agents.state import load_initial_state
from models.action import ChatRequest
from tools.mcp_manager import mcp_service_manager
from tools.mcp_perception_tool import get_live_disruption_signals, get_last_persisted_signals

router = APIRouter(prefix="/agent", tags=["agent"])

#for adk
session_service = InMemorySessionService()
APP_NAME = "warden"

# Shared pending actions store (accessible by routes/actions.py too)
pending_actions_store: list[dict] = []
DATA_DIR = Path(__file__).parent.parent / "data"


def _ts() -> str:
    return datetime.now(timezone.utc).isoformat()


def _sse(payload: dict) -> str:
    return json.dumps(payload)


# ──────────────────────────────────────────────
# Session management
# ──────────────────────────────────────────────

async def _get_or_create_session(session_id: str):
    """Return an existing ADK session or create one seeded with mock data."""
    try:
        session = await session_service.get_session(
            app_name=APP_NAME, user_id="default_user", session_id=session_id,
        )
        if session:
            return session
    except Exception:
        pass

    initial_state = load_initial_state()
    session = await session_service.create_session(
        app_name=APP_NAME,
        user_id="default_user",
        session_id=session_id,
        state=initial_state,
    )
    return session


# ──────────────────────────────────────────────
# Live ADK streaming (uses real LLM)
# ──────────────────────────────────────────────

async def _stream_agent_response(message: str, session_id: str) -> AsyncGenerator[str, None]:
    """Stream agent response via SSE with lifecycle events."""
    session = await _get_or_create_session(session_id)

    runner = Runner(
        agent=orchestrator_agent,
        app_name=APP_NAME,
        session_service=session_service,
    )

    user_content = genai_types.Content(
        role="user", parts=[genai_types.Part(text=message)],
    )

    # Emit orchestrator start
    yield _sse({
        "event": "agent_start",
        "agent": "orchestrator",
        "task": "routing_query",
        "timestamp": _ts(),
    })

    current_agent: str | None = None
    full_response = ""

    try:
        async for event in runner.run_async(
            user_id="default_user",
            session_id=session.id,
            new_message=user_content,
        ):
            author = event.author or "orchestrator"

            # Detect agent transitions
            if author != current_agent:
                if current_agent and current_agent != author:
                    # Previous agent completed, hand off
                    yield _sse({
                        "event": "agent_complete",
                        "agent": current_agent,
                        "timestamp": _ts(),
                    })
                    yield _sse({
                        "event": "agent_handoff",
                        "from": current_agent,
                        "to": author,
                        "payload_summary": "delegating_task",
                        "timestamp": _ts(),
                    })
                    yield _sse({
                        "event": "agent_start",
                        "agent": author,
                        "task": "processing_request",
                        "timestamp": _ts(),
                    })
                current_agent = author

            if event.content and event.content.parts:
                for part in event.content.parts:
                    # Tool call
                    if part.function_call:
                        yield _sse({
                            "event": "tool_call",
                            "agent": author,
                            "tool": part.function_call.name,
                            "args": {
                                k: str(v)[:100]
                                for k, v in (part.function_call.args or {}).items()
                            },
                            "timestamp": _ts(),
                        })

                    # Tool result
                    if part.function_response:
                        resp = part.function_response.response or {}
                        yield _sse({
                            "event": "tool_result",
                            "agent": author,
                            "tool": part.function_response.name,
                            "result_size_bytes": len(json.dumps(resp, default=str)),
                            "timestamp": _ts(),
                        })

                    # Text token
                    if part.text:
                        full_response += part.text
                        # Also emit in the old format for backward compatibility
                        yield _sse({
                            "event": "token",
                            "content": part.text,
                            "type": "response",
                            "agent": author,
                            "timestamp": _ts(),
                        })

    except Exception as e:
        # Fallback to demo responses when LLM is unavailable
        yield _sse({
            "event": "agent_start",
            "agent": "perception_agent",
            "task": "analyzing_fallback",
            "timestamp": _ts(),
        })
        await asyncio.sleep(0.3)
        yield _sse({
            "event": "agent_complete",
            "agent": "perception_agent",
            "timestamp": _ts(),
        })

        demo = _get_demo_response(message)
        for chunk in _chunk_text(demo["content"], 80):
            yield _sse({
                "event": "token",
                "content": chunk,
                "type": "response",
                "agent": "warden",
                "timestamp": _ts(),
            })
            await asyncio.sleep(0.03)

        for action in demo.get("actions", []):
            action["action_id"] = f"act-{uuid.uuid4().hex[:8]}"
            action["created_at"] = _ts()
            action["status"] = "pending"
            pending_actions_store.append(action)
            yield _sse({
                "event": "action_generated",
                "action_type": action["type"],
                "action_id": action["action_id"],
                "preview": action["title"],
                "type": "action_generated",
                "content": action,
                "timestamp": _ts(),
            })

    # Final agent complete
    if current_agent:
        yield _sse({
            "event": "agent_complete",
            "agent": current_agent,
            "timestamp": _ts(),
        })

    # Update session state
    try:
        session = await session_service.get_session(
            app_name=APP_NAME, user_id="default_user", session_id=session_id,
        )
        if session and hasattr(session, "state") and session.state is not None:
            history = session.state.get("conversation_history", [])
            history.append({"role": "user", "content": message, "timestamp": _ts()})
            history.append({"role": "assistant", "content": full_response[:500], "timestamp": _ts()})
            session.state["conversation_history"] = history
            session.state["last_updated"] = _ts()
    except Exception:
        pass

    yield _sse({"event": "done", "type": "done", "timestamp": _ts()})


# ──────────────────────────────────────────────
# Demo scenario — hardcoded Taiwan Strait sequence
# ──────────────────────────────────────────────

async def _stream_demo_scenario() -> AsyncGenerator[str, None]:
    # ── Step 1: Orchestrator starts ──
    yield _sse({
        "event": "agent_start",
        "agent": "orchestrator",
        "task": "routing_query",
        "timestamp": _ts(),
    })
    await asyncio.sleep(0.4)

    # ── Step 2: Delegate to perception ──
    yield _sse({
        "event": "agent_handoff",
        "from": "orchestrator",
        "to": "perception_agent",
        "payload_summary": "check_taiwan_strait_signals",
        "timestamp": _ts(),
    })
    yield _sse({
        "event": "agent_start",
        "agent": "perception_agent",
        "task": "searching_signals",
        "timestamp": _ts(),
    })
    await asyncio.sleep(0.3)

    # Perception tool calls
    yield _sse({
        "event": "tool_call",
        "agent": "perception_agent",
        "tool": "get_latest_news",
        "args": {"query": "Taiwan strait disruption"},
        "timestamp": _ts(),
    })
    await asyncio.sleep(0.5)
    yield _sse({
        "event": "tool_result",
        "agent": "perception_agent",
        "tool": "get_latest_news",
        "result_count": 3,
        "result_size_bytes": 2400,
        "timestamp": _ts(),
    })
    await asyncio.sleep(0.2)

    yield _sse({
        "event": "tool_call",
        "agent": "perception_agent",
        "tool": "classify_signal",
        "args": {"raw_text": "PLA Naval Exercises Taiwan Strait"},
        "timestamp": _ts(),
    })
    await asyncio.sleep(0.3)
    yield _sse({
        "event": "tool_result",
        "agent": "perception_agent",
        "tool": "classify_signal",
        "result_count": 1,
        "result_size_bytes": 450,
        "timestamp": _ts(),
    })
    await asyncio.sleep(0.2)

    # 3 signals classified
    signals_summary = [
        {"title": "PLA Naval Exercises — Taiwan Strait Shipping Delays", "severity": 9, "type": "geopolitical"},
        {"title": "South Korea Export Control Review on Battery Materials", "severity": 4, "type": "regulatory"},
        {"title": "EU Automotive Chip Traceability Proposal", "severity": 3, "type": "regulatory"},
    ]

    yield _sse({
        "event": "agent_complete",
        "agent": "perception_agent",
        "signals_detected": len(signals_summary),
        "max_severity": 9,
        "timestamp": _ts(),
    })
    await asyncio.sleep(0.3)

    # ── Step 3: Delegate to risk engine ──
    yield _sse({
        "event": "agent_handoff",
        "from": "perception_agent",
        "to": "risk_engine_agent",
        "payload_summary": "3_signals_severity_9",
        "timestamp": _ts(),
    })
    yield _sse({
        "event": "agent_start",
        "agent": "risk_engine_agent",
        "task": "calculating_impact",
        "timestamp": _ts(),
    })
    await asyncio.sleep(0.3)

    # Risk engine tool calls
    yield _sse({
        "event": "tool_call",
        "agent": "risk_engine_agent",
        "tool": "get_inventory_levels",
        "args": {"component_id": "MCU-32BIT-AUTO"},
        "timestamp": _ts(),
    })
    await asyncio.sleep(0.4)
    yield _sse({
        "event": "tool_result",
        "agent": "risk_engine_agent",
        "tool": "get_inventory_levels",
        "result_count": 1,
        "result_size_bytes": 320,
        "timestamp": _ts(),
    })
    await asyncio.sleep(0.2)

    yield _sse({
        "event": "tool_call",
        "agent": "risk_engine_agent",
        "tool": "calculate_stockout_date",
        "args": {"component_id": "MCU-32BIT-AUTO", "weekly_consumption": "5000"},
        "timestamp": _ts(),
    })
    await asyncio.sleep(0.3)
    yield _sse({
        "event": "tool_result",
        "agent": "risk_engine_agent",
        "tool": "calculate_stockout_date",
        "result_count": 1,
        "result_size_bytes": 280,
        "timestamp": _ts(),
    })
    await asyncio.sleep(0.2)

    yield _sse({
        "event": "tool_call",
        "agent": "risk_engine_agent",
        "tool": "estimate_revenue_at_risk",
        "args": {"affected_component_ids": '["MCU-32BIT-AUTO", "POWER-MGMT-IC"]'},
        "timestamp": _ts(),
    })
    await asyncio.sleep(0.4)
    yield _sse({
        "event": "tool_result",
        "agent": "risk_engine_agent",
        "tool": "estimate_revenue_at_risk",
        "result_count": 3,
        "result_size_bytes": 640,
        "timestamp": _ts(),
    })
    await asyncio.sleep(0.2)

    # Risk update event
    yield _sse({
        "event": "risk_update",
        "risk_score": 78,
        "revenue_at_risk_eur": 4239000,
        "days_until_stockout": 8,
        "timestamp": _ts(),
    })

    yield _sse({
        "event": "agent_complete",
        "agent": "risk_engine_agent",
        "timestamp": _ts(),
    })
    await asyncio.sleep(0.3)

    # ── Step 4: Delegate to planning ──
    yield _sse({
        "event": "agent_handoff",
        "from": "risk_engine_agent",
        "to": "planning_agent",
        "payload_summary": "€4.2M_at_risk_8d_stockout",
        "timestamp": _ts(),
    })
    yield _sse({
        "event": "agent_start",
        "agent": "planning_agent",
        "task": "generating_mitigation_strategies",
        "timestamp": _ts(),
    })
    await asyncio.sleep(0.3)

    yield _sse({
        "event": "tool_call",
        "agent": "planning_agent",
        "tool": "simulate_mitigation_options",
        "args": {"disruption_id": "DIS-2026-002", "revenue_at_risk_eur": "4239000"},
        "timestamp": _ts(),
    })
    await asyncio.sleep(0.5)
    yield _sse({
        "event": "tool_result",
        "agent": "planning_agent",
        "tool": "simulate_mitigation_options",
        "result_count": 4,
        "result_size_bytes": 1800,
        "timestamp": _ts(),
    })
    await asyncio.sleep(0.2)

    yield _sse({
        "event": "tool_call",
        "agent": "planning_agent",
        "tool": "get_contract_terms",
        "args": {"supplier_id": "sup-infineon-de-001"},
        "timestamp": _ts(),
    })
    await asyncio.sleep(0.3)
    yield _sse({
        "event": "tool_result",
        "agent": "planning_agent",
        "tool": "get_contract_terms",
        "result_count": 1,
        "result_size_bytes": 420,
        "timestamp": _ts(),
    })

    yield _sse({
        "event": "agent_complete",
        "agent": "planning_agent",
        "timestamp": _ts(),
    })
    await asyncio.sleep(0.3)

    # ── Step 5: Delegate to action ──
    yield _sse({
        "event": "agent_handoff",
        "from": "planning_agent",
        "to": "action_agent",
        "payload_summary": "3_strategies_ranked",
        "timestamp": _ts(),
    })
    yield _sse({
        "event": "agent_start",
        "agent": "action_agent",
        "task": "drafting_actions",
        "timestamp": _ts(),
    })
    await asyncio.sleep(0.3)

    yield _sse({
        "event": "tool_call",
        "agent": "action_agent",
        "tool": "draft_supplier_email",
        "args": {"supplier_name": "TSMC", "subject": "Urgent Shipment Status"},
        "timestamp": _ts(),
    })
    await asyncio.sleep(0.3)
    yield _sse({
        "event": "tool_result",
        "agent": "action_agent",
        "tool": "draft_supplier_email",
        "result_count": 1,
        "result_size_bytes": 650,
        "timestamp": _ts(),
    })
    await asyncio.sleep(0.1)

    yield _sse({
        "event": "tool_call",
        "agent": "action_agent",
        "tool": "draft_supplier_email",
        "args": {"supplier_name": "Infineon Dresden", "subject": "Emergency MCU Allocation"},
        "timestamp": _ts(),
    })
    await asyncio.sleep(0.3)
    yield _sse({
        "event": "tool_result",
        "agent": "action_agent",
        "tool": "draft_supplier_email",
        "result_count": 1,
        "result_size_bytes": 580,
        "timestamp": _ts(),
    })
    await asyncio.sleep(0.1)

    yield _sse({
        "event": "tool_call",
        "agent": "action_agent",
        "tool": "draft_internal_escalation",
        "args": {"recipient_name": "Max Mueller", "recipient_role": "VP Operations"},
        "timestamp": _ts(),
    })
    await asyncio.sleep(0.3)
    yield _sse({
        "event": "tool_result",
        "agent": "action_agent",
        "tool": "draft_internal_escalation",
        "result_count": 1,
        "result_size_bytes": 720,
        "timestamp": _ts(),
    })
    await asyncio.sleep(0.1)

    yield _sse({
        "event": "tool_call",
        "agent": "action_agent",
        "tool": "flag_reorder",
        "args": {"component_id": "MCU-32BIT-AUTO", "quantity": "60000", "urgency": "emergency"},
        "timestamp": _ts(),
    })
    await asyncio.sleep(0.3)
    yield _sse({
        "event": "tool_result",
        "agent": "action_agent",
        "tool": "flag_reorder",
        "result_count": 1,
        "result_size_bytes": 180,
        "timestamp": _ts(),
    })

    yield _sse({
        "event": "agent_complete",
        "agent": "action_agent",
        "timestamp": _ts(),
    })
    await asyncio.sleep(0.2)

    # ── Step 6: Generate the 4 pending actions ──

    demo_actions = [
        {
            "action_id": f"act-{uuid.uuid4().hex[:8]}",
            "type": "email",
            "title": "Supplier Outreach — TSMC",
            "description": "Urgent email to Wei-Lin Chen at TSMC requesting shipment status update for #TW-4821 and alternative shipping routes.",
            "target": "TSMC",
            "urgency": "critical",
            "content": "Dear Wei-Lin Chen,\n\nI am writing on behalf of AutoParts GmbH regarding Shipment #TW-4821 (40,000 MCU-32BIT-AUTO units). We understand the Taiwan Strait situation is impacting shipping at Port of Kaohsiung.\n\nWe urgently request:\n1. Updated delivery timeline for #TW-4821\n2. Confirmation of alternative shipping routes being explored\n3. A call with your logistics team within 24 hours\n\nThis shipment is critical to our BMW Order #DE-8821 (SLA deadline: March 10).\n\nBest regards,\nProcurement Team\nAutoParts GmbH\nprocurement@autoparts-gmbh.de",
            "related_disruption": "DIS-2026-002",
            "related_order": "ORD-DE-8821",
            "created_at": _ts(),
            "status": "pending",
        },
        {
            "action_id": f"act-{uuid.uuid4().hex[:8]}",
            "type": "email",
            "title": "Supplier Outreach — Infineon Dresden",
            "description": "Emergency email to Klaus Richter requesting 16,000 MCU-32BIT-AUTO units from Dresden backup facility.",
            "target": "Infineon Technologies (Dresden)",
            "urgency": "critical",
            "content": "Dear Klaus Richter,\n\nI am writing on behalf of AutoParts GmbH regarding an urgent procurement request. Due to ongoing Taiwan Strait shipping disruptions affecting our primary TSMC supply line, we need to activate our backup supply agreement.\n\nWe request emergency allocation of:\n- Component: MCU-32BIT-AUTO\n- Quantity: 16,000 units (40% of our gap)\n- Delivery: 5-day expedited\n- Reference: Contract clause 7.2 (Emergency Allocation)\n\nPlease confirm availability and delivery timeline within 12 hours.\n\nBest regards,\nProcurement Team\nAutoParts GmbH\nprocurement@autoparts-gmbh.de",
            "related_disruption": "DIS-2026-002",
            "related_order": "ORD-DE-8821",
            "created_at": _ts(),
            "status": "pending",
        },
        {
            "action_id": f"act-{uuid.uuid4().hex[:8]}",
            "type": "escalation",
            "title": "Executive Escalation — VP Operations",
            "description": "Internal brief to Max Mueller on Taiwan Strait disruption and €4.2M revenue at risk.",
            "target": "Max Mueller, VP Operations",
            "urgency": "high",
            "content": "SUPPLY CHAIN DISRUPTION BRIEF\n\nSituation: Taiwan Strait shipping congestion (14-21 day delays) from PLA naval exercises.\nImpact: €4,239,000 revenue at risk, 2 orders at SLA breach risk.\n- BMW #DE-8821: €2.25M, SLA breach probability 73% (6 days remaining)\n- VW #DE-9103: €1.99M, SLA breach probability 45% (16 days remaining)\n\nRecommended: Activate Infineon Dresden backup (€45K premium) + proactive BMW communication.\nDecision Required: Authorize emergency procurement budget (€45K-€180K range) by end of day.",
            "related_disruption": "DIS-2026-002",
            "related_order": None,
            "created_at": _ts(),
            "status": "pending",
        },
        {
            "action_id": f"act-{uuid.uuid4().hex[:8]}",
            "type": "po_adjustment",
            "title": "Emergency Reorder — MCU-32BIT-AUTO",
            "description": "ERP reorder flag: 60,000 units MCU-32BIT-AUTO at emergency priority.",
            "target": "ERP System",
            "urgency": "critical",
            "content": "REORDER REQUEST\nComponent: MCU-32BIT-AUTO (32-bit Automotive Microcontroller)\nQuantity: 60,000 units\nPriority: EMERGENCY\nSplit: 16,000 from Infineon Dresden (5-day lead), 44,000 from TSMC (when available)\nEstimated Cost: €510,000\nJustification: Current stock at 12 days, below reorder point. Taiwan Strait disruption affecting primary supply.",
            "related_disruption": "DIS-2026-002",
            "related_order": None,
            "created_at": _ts(),
            "status": "pending",
        },
    ]

    for action in demo_actions:
        pending_actions_store.append(action)
        yield _sse({
            "event": "action_generated",
            "action_type": action["type"],
            "action_id": action["action_id"],
            "preview": action["title"],
            "type": "action_generated",
            "content": action,
            "timestamp": _ts(),
        })
        await asyncio.sleep(0.15)

    # ── Step 7: Final summary streamed as tokens ──
    yield _sse({
        "event": "agent_handoff",
        "from": "action_agent",
        "to": "orchestrator",
        "payload_summary": "4_actions_drafted",
        "timestamp": _ts(),
    })
    await asyncio.sleep(0.2)

    summary = """**DISRUPTION DETECTED: Taiwan Strait Shipping Congestion**

**Perception Analysis:**
PLA naval exercises are causing 14-21 day commercial shipping delays in the Taiwan Strait. Port of Kaohsiung has confirmed significant congestion affecting outbound semiconductor shipments. 3 signals classified — primary signal severity: 9/10 (geopolitical).

**Direct Impact on AutoParts GmbH:**
- **TSMC Shipment #TW-4821** (MCU-32BIT-AUTO, 40,000 units) — DELAYED 17 days
- **Current MCU Inventory:** 18,000 units (12 days at current consumption)
- **Daily Burn Rate:** 1,500 units/day → **Stockout in 8 days**

**Risk Assessment (Risk Engine):**
- **Revenue at Risk:** €4,239,000
  - BMW Order #DE-8821: €2,250,000 (SLA breach probability **73%**, 6 days remaining)
  - VW Order #DE-9103: €1,989,000 (SLA breach probability **45%**, 16 days remaining)
- **Overall Risk Score:** 78/100 (HIGH)
- **Suppliers Affected:** TSMC (health score dropped to 42)

**Mitigation Strategies (Planning Agent — Ranked):**

| Option | Strategy | Cost | Savings | Confidence | Timeline |
|--------|----------|------|---------|------------|----------|
| **A** | Emergency Air Freight (TSMC → Frankfurt) | €180,000 | €4,059,000 | 88% | 2 days |
| **B** ★ | Infineon Dresden Backup (16K units) | €45,000 | €1,650,600 | 82% | 5 days |
| **C** | SLA Negotiation with BMW/VW | €12,000 | €2,543,400 | 55% | 1 day |
| **D** | Do Nothing (Baseline) | €0 | €0 | 20% | — |

★ **Recommended:** Option B (Infineon Dresden backup) combined with proactive BMW communication. Covers 40% of MCU gap at moderate cost while preserving customer relationships.

**Actions Generated (4 pending approval):**
1. ✉️ **Email TSMC** — Request shipment status update for #TW-4821
2. ✉️ **Email Infineon Dresden** — Activate emergency backup supply (16K MCU units)
3. 📋 **Executive Escalation** — Brief VP Operations Max Mueller (€4.2M at risk)
4. 🔄 **ERP Reorder** — Emergency flag for 60,000 MCU-32BIT-AUTO units

All actions require your approval before execution. Review them in the Actions tab.

**Confidence Level:** 82% — based on verified inventory data, confirmed shipment delays, and established backup supplier capabilities."""

    for chunk in _chunk_text(summary, 80):
        yield _sse({
            "event": "token",
            "content": chunk,
            "type": "response",
            "agent": "warden",
            "timestamp": _ts(),
        })
        await asyncio.sleep(0.03)

    yield _sse({"event": "done", "type": "done", "timestamp": _ts()})


# ──────────────────────────────────────────────
# Demo response fallback (when LLM unavailable)
# ──────────────────────────────────────────────

def _chunk_text(text: str, size: int) -> list[str]:
    words = text.split(" ")
    chunks = []
    current = ""
    for w in words:
        if len(current) + len(w) + 1 > size:
            chunks.append(current + " ")
            current = w
        else:
            current = f"{current} {w}" if current else w
    if current:
        chunks.append(current)
    return chunks


def _fmt_eur(amount: float | int) -> str:
    return f"EUR {amount:,.0f}"


def _load_json(filename: str):
    with open(DATA_DIR / filename, "r", encoding="utf-8") as f:
        return json.load(f)


def _build_live_snapshot() -> dict:
    suppliers = _load_json("mock_suppliers.json")
    orders = _load_json("mock_orders.json")
    inventory = _load_json("mock_inventory.json")
    disruptions = _load_json("mock_disruptions.json")

    active_disruptions = [d for d in disruptions if d.get("is_active")]
    at_risk_orders = [
        o for o in orders
        if any(s.get("status") in ("delayed", "at_risk") for s in o.get("shipments", []))
    ]
    low_inventory = [
        i for i in inventory
        if i.get("status") in ("below_reorder", "critical")
    ]
    at_risk_suppliers = [
        s for s in suppliers
        if s.get("current_status") in ("at_risk", "disrupted")
    ]

    revenue_at_risk = sum(float(o.get("total_value_eur", 0)) for o in at_risk_orders)
    risk_score = min(100, max(0,
        (len(active_disruptions) * 20)
        + (len(at_risk_suppliers) * 15)
        + (len(at_risk_orders) * 10)
        + (len(low_inventory) * 8)
    ))

    return {
        "suppliers": suppliers,
        "orders": orders,
        "inventory": inventory,
        "disruptions": disruptions,
        "active_disruptions": active_disruptions,
        "at_risk_orders": at_risk_orders,
        "at_risk_suppliers": at_risk_suppliers,
        "low_inventory": low_inventory,
        "revenue_at_risk": revenue_at_risk,
        "risk_score": risk_score,
    }


def _top_supplier_risks(snapshot: dict) -> list[dict]:
    suppliers = list(snapshot["suppliers"])
    suppliers.sort(
        key=lambda s: (
            0 if s.get("current_status") == "disrupted" else 1 if s.get("current_status") == "at_risk" else 2,
            s.get("health_score", 100),
        )
    )
    return suppliers[:3]


def _get_demo_response(message: str) -> dict:
    """Query-aware fallback when ADK/LLM path is unavailable."""
    msg = message.lower()
    snapshot = _build_live_snapshot()

    risk_score = snapshot["risk_score"]
    revenue_at_risk = snapshot["revenue_at_risk"]
    active_disruptions = snapshot["active_disruptions"]
    at_risk_orders = snapshot["at_risk_orders"]
    low_inventory = snapshot["low_inventory"]

    if any(k in msg for k in ["supplier", "vendors", "vendor", "health"]):
        top = _top_supplier_risks(snapshot)
        content = ["Supplier risk view (fallback mode):", ""]
        for s in top:
            content.append(
                f"- {s.get('name')}: status={s.get('current_status')}, health={s.get('health_score')}, lead_time={s.get('lead_time_days')}d"
            )
        content.append("")
        content.append("Ask me: 'Which supplier is single-source?' or 'Draft supplier outreach'.")
        return {"content": "\n".join(content), "actions": []}

    if any(k in msg for k in ["inventory", "stock", "stockout", "component"]):
        critical = sorted(low_inventory, key=lambda i: i.get("days_of_supply", 999))[:4]
        lines = ["Inventory watch (fallback mode):", ""]
        if not critical:
            lines.append("- No components below reorder threshold.")
        for i in critical:
            lines.append(
                f"- {i.get('name')} ({i.get('component_id')}): {i.get('days_of_supply')} days of supply, status={i.get('status')}"
            )
        lines.append("")
        lines.append("I can propose reorder quantities if you share target safety-stock days.")
        return {"content": "\n".join(lines), "actions": []}

    if any(k in msg for k in ["sla", "order", "revenue", "breach"]):
        ranked = sorted(at_risk_orders, key=lambda o: o.get("completion_pct", 100))[:5]
        lines = [
            "Order/SLA risk view (fallback mode):",
            f"- Revenue at risk: {_fmt_eur(revenue_at_risk)}",
            "",
        ]
        for o in ranked:
            breach_prob = 100 - int(o.get("completion_pct", 0))
            lines.append(
                f"- {o.get('order_id')} | {o.get('customer_name')} | {_fmt_eur(o.get('total_value_eur', 0))} | breach_prob~{breach_prob}%"
            )
        lines.append("")
        lines.append("I can also draft customer communication for the highest-risk order.")
        return {"content": "\n".join(lines), "actions": []}

    if any(k in msg for k in ["disruption", "risk", "status", "overview", "summary"]):
        disruption_title = active_disruptions[0].get("title") if active_disruptions else "No active disruptions"
        lines = [
            "Supply chain overview (fallback mode):",
            f"- Risk score: {risk_score}/100",
            f"- Active disruptions: {len(active_disruptions)} ({disruption_title})",
            f"- Revenue at risk: {_fmt_eur(revenue_at_risk)}",
            f"- Low-inventory components: {len(low_inventory)}",
            f"- Pending actions: {len(pending_actions_store)}",
            "",
            "You can ask for supplier detail, inventory breakdown, or SLA order risk analysis.",
        ]
        return {"content": "\n".join(lines), "actions": []}

    return {
        "content": (
            "I can help with navigation, analysis, and action drafting.\n\n"
            "Try one of these:\n"
            "- 'Show supplier risk summary'\n"
            "- 'Which orders are most likely to breach SLA?'\n"
            "- 'Show low inventory components'\n"
            "- '/actions list' to review pending actions"
        ),
        "actions": [],
    }


# ──────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────

@router.post("/chat")
async def agent_chat(request: ChatRequest):
    """SSE streaming endpoint for agent chat."""
    async def event_generator():
        async for data in _stream_agent_response(request.message, request.session_id):
            yield {"data": data}

    return EventSourceResponse(event_generator())


@router.post("/demo")
async def agent_demo():
    """Pre-scripted Taiwan Strait disruption demo scenario (SSE stream)."""
    async def event_generator():
        async for data in _stream_demo_scenario():
            yield {"data": data}

    return EventSourceResponse(event_generator())


@router.get("/monitor")
async def agent_monitor():
    """Trigger perception agent to check for new signals."""
    from tools.news_tool import get_latest_news, get_active_disruptions

    news = get_latest_news("supply chain disruption semiconductor Taiwan")
    active = get_active_disruptions()

    high_severity = [s for s in news["signals"] if s["severity_score"] >= 7]

    # Calculate risk delta based on new signals
    risk_delta = 0
    for sig in high_severity:
        risk_delta += min(10, sig["severity_score"] - 5)

    return {
        "new_signals": news["signals"],
        "active_disruptions": active["disruptions"],
        "high_severity_count": len(high_severity),
        "risk_delta": risk_delta,
        "timestamp": _ts(),
    }


@router.get("/perception/live")
async def perception_live(
    query: str = "automotive semiconductor disruption",
    limit: int = 8,
):
    """Run live perception ingestion with Brave/fetch/filesystem and fallback."""
    result = get_live_disruption_signals(query=query, limit=limit)
    if result.get("source_mode") == "fallback":
        cached = get_last_persisted_signals()
        result["cached_snapshot"] = cached
    return result


@router.get("/mcp/status")
async def get_mcp_status():
    """Expose MCP service availability for debugging and UI checks."""
    return mcp_service_manager.status()


@router.get("/actions/pending")
async def get_pending_agent_actions():
    """Return pending actions from agent runs."""
    pending = [a for a in pending_actions_store if a.get("status") == "pending"]
    return {"actions": pending, "count": len(pending)}


@router.get("/session/{session_id}")
async def get_session_state(session_id: str):
    """Return the current session state for debugging/inspection."""
    try:
        session = await session_service.get_session(
            app_name=APP_NAME, user_id="default_user", session_id=session_id,
        )
        if session and hasattr(session, "state"):
            return {
                "session_id": session_id,
                "state": session.state,
                "exists": True,
            }
    except Exception:
        pass
    return {"session_id": session_id, "exists": False, "state": None}
