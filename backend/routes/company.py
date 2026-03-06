import json
import os
from pathlib import Path

import httpx
from fastapi import APIRouter
from google import genai
from sse_starlette.sse import EventSourceResponse

DATA_DIR = Path(__file__).parent.parent / "data"

router = APIRouter(prefix="/company", tags=["company"])

_gemini_client = None

def _get_gemini():
    global _gemini_client
    if _gemini_client is None:
        _gemini_client = genai.Client()
    return _gemini_client

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


@router.get("/uploaded-data")
async def get_uploaded_data():
    """Get data uploaded during onboarding (suppliers, SLA, BOM)."""
    profile = _load_company()
    return {
        "suppliers": profile.get("uploaded_suppliers", []),
        "sla": profile.get("uploaded_sla", []),
        "bom": profile.get("uploaded_bom", []),
    }


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


def _brave_search(query: str, count: int = 5) -> list[dict]:
    """Search Brave for supply chain news."""
    key = os.getenv("BRAVE_SEARCH_API_KEY", "").strip()
    if not key:
        return []
    try:
        with httpx.Client(timeout=8.0) as client:
            resp = client.get(
                "https://api.search.brave.com/res/v1/web/search",
                params={"q": query, "count": count},
                headers={"Accept": "application/json", "X-Subscription-Token": key},
            )
            if resp.status_code >= 400:
                return []
            return resp.json().get("web", {}).get("results", []) or []
    except Exception:
        return []


@router.get("/scanned-events")
async def get_scanned_events():
    """Get previously scanned events."""
    profile = _load_company()
    return profile.get("scanned_events", [])


@router.get("/scan-events")
async def scan_events():
    """SSE endpoint: search for supply-chain events relevant to the company."""
    profile = _load_company()
    company_name = profile.get("name", "the company")
    industry = profile.get("industry", "manufacturing")
    suppliers = profile.get("onboarding_suppliers", [])
    supplier_names = [s.get("name", "") for s in suppliers if s.get("name")]

    async def event_stream():
        import asyncio

        yield {"event": "status", "data": json.dumps({"message": "Scanning global supply chain news..."})}
        await asyncio.sleep(0.3)

        # Build search queries based on company context
        queries = [
            f"{industry} supply chain disruption 2026",
            f"{industry} supplier risk shortage delay",
        ]
        if supplier_names:
            queries.append(f"{' OR '.join(supplier_names[:3])} supply chain news")

        all_results = []
        for i, query in enumerate(queries):
            yield {"event": "status", "data": json.dumps({
                "message": f"Searching: {query[:50]}...",
                "progress": round((i + 1) / (len(queries) + 1) * 60),
            })}
            await asyncio.sleep(0.1)
            results = _brave_search(query, count=5)
            all_results.extend(results)

        yield {"event": "status", "data": json.dumps({
            "message": f"Found {len(all_results)} articles. Analyzing with AI...",
            "progress": 65,
        })}
        await asyncio.sleep(0.2)

        # Deduplicate by URL
        seen_urls = set()
        unique_results = []
        for r in all_results:
            url = r.get("url", "")
            if url not in seen_urls:
                seen_urls.add(url)
                unique_results.append(r)

        # Build article summaries for Gemini
        articles_text = "\n".join(
            f"- {r.get('title', '')} | {r.get('description', '')}"
            for r in unique_results[:12]
        )

        supplier_context = ", ".join(supplier_names[:5]) if supplier_names else "various suppliers"

        prompt = f"""You are a supply chain risk analyst. Given these news articles, identify the top 3-5 events that could affect the supply chain of "{company_name}" (industry: {industry}, key suppliers: {supplier_context}).

Articles:
{articles_text}

For each event, return a JSON array of objects with these exact fields:
- "type": one of "Geopolitical", "Market", "Climate", "Logistics", "Regulatory", "Supplier"
- "region": short description of what the event is (max 40 chars)
- "severity": integer 1-10
- "confidence": integer 50-100
- "expected_delay_days": integer 1-30
- "headline": the full headline
- "summary": 1-sentence summary of impact on the company

Return ONLY valid JSON array, no markdown.
If no relevant events found, return an empty array []."""

        events = []
        try:
            response = _get_gemini().models.generate_content(
                model="gemini-2.5-flash",
                contents=[prompt],
            )
            text = response.text.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
            events = json.loads(text)
        except Exception as e:
            yield {"event": "status", "data": json.dumps({
                "message": f"AI analysis error: {str(e)[:80]}",
                "progress": 80,
            })}

        yield {"event": "status", "data": json.dumps({
            "message": f"Identified {len(events)} relevant events",
            "progress": 90,
        })}
        await asyncio.sleep(0.2)

        # Emit each event individually for live UI updates
        for i, evt in enumerate(events):
            yield {"event": "event_found", "data": json.dumps(evt)}
            await asyncio.sleep(0.4)

        # Store events in company profile
        global _company_profile
        profile = _load_company()
        profile["scanned_events"] = events
        _company_profile = profile

        yield {"event": "done", "data": json.dumps({
            "message": "Scan complete",
            "progress": 100,
            "event_count": len(events),
        })}

    return EventSourceResponse(event_stream())
