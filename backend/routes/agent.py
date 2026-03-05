import json
import asyncio
import uuid
from datetime import datetime, timezone
from typing import AsyncGenerator

from fastapi import APIRouter, Request
from sse_starlette.sse import EventSourceResponse

from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types as genai_types

from agents.orchestrator import orchestrator_agent
from models.action import ChatRequest

router = APIRouter(prefix="/agent", tags=["agent"])

# for adk
session_service = InMemorySessionService()

pending_actions_store: list[dict] = []

APP_NAME = "warden"


async def _get_or_create_session(session_id: str):
    """Get existing session or create a new one."""
    try:
        session = await session_service.get_session(
            app_name=APP_NAME, user_id="default_user", session_id=session_id
        )
        if session:
            return session
    except Exception:
        pass
    session = await session_service.create_session(
        app_name=APP_NAME, user_id="default_user", session_id=session_id
    )
    return session


async def _stream_agent_response(message: str, session_id: str) -> AsyncGenerator[str, None]:
    """Stream the agent response via SSE."""
    session = await _get_or_create_session(session_id)

    runner = Runner(
        agent=orchestrator_agent,
        app_name=APP_NAME,
        session_service=session_service,
    )

    user_content = genai_types.Content(
        role="user", parts=[genai_types.Part(text=message)]
    )

    yield json.dumps({
        "type": "thinking",
        "content": "Warden is analyzing your request...",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    full_response = ""
    reasoning_steps = []

    try:
        async for event in runner.run_async(
            user_id="default_user",
            session_id=session.id,
            new_message=user_content,
        ):
            if event.content and event.content.parts:
                for part in event.content.parts:
                    if part.text:
                        full_response += part.text
                        yield json.dumps({
                            "type": "response",
                            "content": part.text,
                            "agent": event.author or "warden",
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        })
                    if part.function_call:
                        reasoning_steps.append(
                            f"Calling tool: {part.function_call.name}"
                        )
                        yield json.dumps({
                            "type": "thinking",
                            "content": f"Using tool: {part.function_call.name}",
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        })
    except Exception as e:
        # fallback (demo) generate a mock response for demo purposes
        yield json.dumps({
            "type": "thinking",
            "content": "Analyzing supply chain data...",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        await asyncio.sleep(0.5)

        mock_response = _get_demo_response(message)
        for chunk in _chunk_text(mock_response["content"], 60):
            yield json.dumps({
                "type": "response",
                "content": chunk,
                "agent": "warden",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
            await asyncio.sleep(0.05)

        if mock_response.get("actions"):
            for action in mock_response["actions"]:
                action["action_id"] = f"act-{uuid.uuid4().hex[:8]}"
                action["created_at"] = datetime.now(timezone.utc).isoformat()
                action["status"] = "pending"
                pending_actions_store.append(action)
                yield json.dumps({
                    "type": "action_generated",
                    "content": action,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })

    yield json.dumps({
        "type": "done",
        "reasoning_trace": reasoning_steps,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


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


def _get_demo_response(message: str) -> dict:
    """Return pre-scripted demo responses for common queries."""
    msg_lower = message.lower()

    if "run demo scenario" in msg_lower or "demo" in msg_lower:
        return {
            "content": """**DISRUPTION DETECTED: Taiwan Strait Shipping Congestion**

**Perception Analysis:**
PLA naval exercises are causing 14-21 day commercial shipping delays in the Taiwan Strait. Port of Kaohsiung has confirmed significant congestion affecting outbound semiconductor shipments.

**Direct Impact on AutoParts GmbH:**
- **TSMC Shipment #TW-4821** (MCU-32BIT-AUTO, 40,000 units) — DELAYED
- **Current MCU Inventory:** 18,000 units (12 days at current consumption)
- **Daily Burn Rate:** 1,500 units/day
- **Critical Level:** Day 8 (stockout risk begins)

**Risk Assessment:**
- **Revenue at Risk:** €4,239,000
  - BMW Order #DE-8821: €2,250,000 (SLA breach in 6 days — probability 73%)
  - VW Order #DE-9103: €1,989,000 (SLA breach in 11 days — probability 45%)
- **Overall Risk Score:** 78/100 (HIGH)

**Mitigation Strategies (Ranked):**

**Option A — Emergency Air Freight** | Cost: +€180,000 | Confidence: 88%
Arrange emergency air freight for 40,000 MCU units from TSMC Hsinchu. Delivery in 3-5 days. Saves BMW SLA entirely.

**Option B — Infineon Dresden Backup (RECOMMENDED)** | Cost: +€45,000 | Confidence: 82%
Activate backup supply from Infineon Dresden — 16,000 units (40% of gap) with 5-day lead time. Combine with proactive BMW communication.

**Option C — SLA Negotiation** | Cost: ~€12,000 | Confidence: 55%
Negotiate 7-day SLA extensions with BMW and VW. Low cost but risks relationship damage.

**Option D — Do Nothing (Baseline)** | Confidence: 20%
73% probability of BMW SLA breach. Estimated penalty: €350,000.

**Recommended Action:** Option B + proactive customer communication.

I've generated 4 actions for your approval:""",
            "actions": [
                {
                    "type": "email",
                    "title": "Supplier Outreach — Infineon Dresden",
                    "description": "Email to Klaus Richter at Infineon Dresden requesting emergency MCU-32BIT-AUTO allocation (16,000 units)",
                    "target": "Infineon Technologies (Dresden)",
                    "urgency": "critical",
                    "content": "Emergency procurement request for 16,000 MCU-32BIT-AUTO units from Dresden backup facility.",
                },
                {
                    "type": "escalation",
                    "title": "Executive Escalation Brief",
                    "description": "Internal brief to VP Operations on Taiwan Strait disruption impact and recommended actions",
                    "target": "Max Mueller, VP Operations",
                    "urgency": "high",
                    "content": "Supply chain disruption brief: €4.2M revenue at risk from Taiwan Strait congestion. Recommended: activate Infineon Dresden backup supply.",
                },
                {
                    "type": "email",
                    "title": "BMW Account Communication",
                    "description": "Proactive communication to BMW account manager about potential delivery impact on Order #DE-8821",
                    "target": "BMW AG",
                    "urgency": "high",
                    "content": "Proactive notification regarding Order #DE-8821 with mitigation plan details.",
                },
                {
                    "type": "po_adjustment",
                    "title": "Emergency Reorder — MCU-32BIT-AUTO",
                    "description": "ERP reorder flag: 60,000 units MCU-32BIT-AUTO at emergency priority",
                    "target": "ERP System",
                    "urgency": "critical",
                    "content": "Reorder 60,000 units MCU-32BIT-AUTO. Split: 16K from Infineon Dresden (emergency, 5-day), 44K from TSMC (when available).",
                },
            ],
        }

    if "biggest" in msg_lower and "risk" in msg_lower:
        return {
            "content": """**Current Biggest Supply Risk: Taiwan Strait Shipping Congestion**

The most critical risk right now is the ongoing Taiwan Strait disruption affecting TSMC semiconductor shipments.

**Key Metrics:**
- **Risk Score:** 78/100 (HIGH)
- **Revenue at Risk:** €4,239,000
- **Days Until Stockout:** 8 days for MCU-32BIT-AUTO
- **Affected Orders:** 2 (BMW and VW)
- **SLA Breach Probability:** 73% for BMW, 45% for VW

**Why This Is Critical:**
1. TSMC is a **single-source** supplier for MCU-32BIT-AUTO — our highest concentration risk
2. BMW SLA is 14 days with penalty clause — only 6 days remaining
3. MCU-32BIT-AUTO is used in 60% of our product lines

**Secondary Risk:** South Korea export control discussions could affect Samsung SDI battery component supply (severity: 4/10, monitoring).

Would you like me to run a cascade simulation or generate mitigation strategies?""",
            "actions": [],
        }

    if "simulate" in msg_lower and "taiwan" in msg_lower:
        return {
            "content": """**Cascade Simulation: Taiwan Strait Closure — 30 Day Scenario**

Running disruption cascade from TSMC (Taiwan) through your supply chain...

**Cascade Path:**
```
Taiwan Strait Closure (30 days)
  └→ TSMC Supply Cut (-60%)
      └→ MCU-32BIT-AUTO (stockout in 8 days)
      │   └→ Assembly Line A (output: -80%)
      │       └→ BMW Order #DE-8821 (SLA breach Day 6, €2.25M)
      │       └→ BMW Order #DE-9301 (SLA breach Day 12, €588K)
      └→ POWER-MGMT-IC (stockout in 18 days)
          └→ Assembly Line B (output: -40% after Day 18)
              └→ VW Order #DE-9103 (SLA breach Day 21, €1.99M)
```

**30-Day Impact Summary:**
| Metric | Value |
|--------|-------|
| Total Revenue at Risk | €4,827,000 |
| Orders Breaching SLA | 3 of 4 |
| Production Lines Affected | 2 of 3 |
| Customers Impacted | 2 (BMW, VW) |
| Estimated Penalties | €520,000 |

**Critical Inflection Points:**
- **Day 8:** MCU stockout — Assembly Line A stops
- **Day 12:** Second BMW order breaches SLA
- **Day 18:** POWER-MGMT-IC stockout — Assembly Line B degrades
- **Day 21:** VW order breaches SLA

Would you like me to generate mitigation strategies for this scenario?""",
            "actions": [],
        }

    if "email" in msg_lower and "tsmc" in msg_lower:
        return {
            "content": """I've drafted an email to your TSMC account manager. Here's the preview:

**To:** Wei-Lin Chen, Account Director (w.chen@tsmc-sales.example.com)
**Subject:** [Priority] Urgent — Shipment Status Update Request (AutoParts GmbH)

The email requests:
1. Updated delivery timeline for Shipment #TW-4821 (40,000 MCU units)
2. Confirmation of alternative shipping routes being explored
3. An urgent call with their logistics team

I've added this to your approval queue. Would you like me to modify the email before you approve it?""",
            "actions": [
                {
                    "type": "email",
                    "title": "TSMC Account Manager Outreach",
                    "description": "Urgent email to Wei-Lin Chen requesting shipment status update and alternative routes",
                    "target": "TSMC",
                    "urgency": "high",
                    "content": "Priority email requesting updated delivery timeline for Shipment #TW-4821 and exploration of alternative shipping routes.",
                },
            ],
        }

    if "sla" in msg_lower and ("breach" in msg_lower or "risk" in msg_lower):
        return {
            "content": """**Orders at Risk of SLA Breach:**

| Order | Customer | Value | SLA Deadline | Days Left | Breach Prob. |
|-------|----------|-------|-------------|-----------|-------------|
| #DE-8821 | BMW AG | €2,250,000 | Mar 10 | **6 days** | 🔴 73% |
| #DE-9103 | VW Group | €1,989,000 | Mar 21 | 17 days | 🟡 45% |
| #DE-9301 | BMW AG | €588,000 | Mar 28 | 24 days | 🟢 15% |
| #DE-9250 | Bosch GmbH | €710,000 | Apr 1 | 28 days | 🟢 8% |

**Most Critical:** BMW Order #DE-8821
- Product: Engine Control Unit v4.2 (12,000 units)
- Bottleneck: MCU-32BIT-AUTO shortage (TSMC delay)
- Current production: 45% complete
- SLA has **penalty clause** — estimated penalty: €180,000

**Recommended Action:** Prioritize mitigation for #DE-8821 immediately. Activate Infineon Dresden backup and begin proactive BMW communication.

Would you like me to generate specific actions for this?""",
            "actions": [],
        }

    if "semiconductor" in msg_lower and "exposure" in msg_lower:
        return {
            "content": """**Semiconductor Exposure Analysis for AutoParts GmbH:**

**Total Semi Spend:** €68.5M/year (51% of total supplier spend)

**By Supplier:**
| Supplier | Spend | Components | Source Risk | Status |
|----------|-------|-----------|-------------|--------|
| TSMC (Taiwan) | €48M | MCU, POWER-MGMT | 🔴 CRITICAL | At Risk |
| Infineon MY | €28M | CAN, GATE-DRIVER | 🟡 MEDIUM | Normal |
| Infineon DE | €12M | MCU, CAN (backup) | 🟢 LOW | Normal |
| STMicro | €8.5M | POWER-MGMT, SENSOR | 🟢 LOW | Normal |

**Concentration Risk:**
- MCU-32BIT-AUTO: **70% single-sourced from TSMC** — CRITICAL
- POWER-MGMT-IC: 60% TSMC, 40% STMicro — HIGH
- CAN-CONTROLLER: Well-diversified (Infineon MY + DE) — LOW

**Recommendation:** Your semiconductor exposure is heavily concentrated in Taiwan (70% by spend). Immediate actions:
1. Qualify Infineon Dresden as primary MCU backup (in progress)
2. Increase STMicro allocation for POWER-MGMT-IC to 50%
3. Explore Texas Instruments as third MCU source for 2027

Would you like me to create a diversification plan?""",
            "actions": [],
        }

    # Default response
    return {
        "content": f"""I understand your question. Let me analyze this against AutoParts GmbH's current supply chain situation.

**Current Status Overview:**
- **Overall Risk Score:** 78/100 (HIGH)
- **Active Disruptions:** 1 (Taiwan Strait shipping congestion)
- **Revenue at Risk:** €4,239,000
- **Pending Actions:** {len(pending_actions_store)} awaiting approval

The Taiwan Strait situation remains our primary concern, with TSMC shipments delayed 14-21 days. MCU-32BIT-AUTO inventory is at 12 days and declining.

How can I help you further? I can:
- Analyze specific supplier risks
- Run disruption cascade simulations
- Generate mitigation strategies
- Draft communications or PO adjustments""",
        "actions": [],
    }


@router.post("/chat")
async def agent_chat(request: ChatRequest):
    """SSE streaming endpoint for agent chat."""
    async def event_generator():
        async for data in _stream_agent_response(request.message, request.session_id):
            yield {"data": data}

    return EventSourceResponse(event_generator())


@router.get("/monitor")
async def agent_monitor():
    """Trigger the perception agent to check for new signals."""
    from tools.news_tool import get_latest_news, get_active_disruptions

    news = get_latest_news("supply chain disruption semiconductor")
    active = get_active_disruptions()

    high_severity = [s for s in news["signals"] if s["severity_score"] >= 7]

    return {
        "new_signals": news["signals"],
        "active_disruptions": active["disruptions"],
        "high_severity_count": len(high_severity),
        "risk_delta": 5 if high_severity else 0,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/actions/pending")
async def get_pending_actions():
    """Return pending actions from the agent."""
    pending = [a for a in pending_actions_store if a.get("status") == "pending"]
    return {"actions": pending, "count": len(pending)}
