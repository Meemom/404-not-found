import json
from fastapi import APIRouter, UploadFile, File, Form 
from google import genai 

from db import supabase 

router = APIRouter(prefix="/upload", tags=["upload"])
client = genai.Client()

async def extract_with_gemini(file_bytes: bytes, filename: str, doc_type: str) -> dict: 
    """Send file to Gemini and get structured JSON back."""

    prompts = {
          "suppliers": (
              "Extract supplier data from this document. Return JSON array with objects "
              "containing: name, country, components (what they supply). "
              "Return ONLY valid JSON, no markdown."
          ),
          "sla": (
              "Extract customer SLA data from this document. Return JSON array with objects "
              "containing: customer (name), annual_revenue, contract_terms, sla_days (int), penalty_percent (number), payment_history. "
              "Return ONLY valid JSON, no markdown."
          ),
          "bom": (
              "Extract bill of materials data from this document. Return JSON array with objects "
              "containing: stock_keeping_unit, description, supplier_name, quantity_per_unit (int), "
              "lead_time_days (int), unit_cost (number or null). "
              "Return ONLY valid JSON, no markdown."
          ),
      }

    # Upload file to Gemini
    uploaded = client.files.upload(
        file=file_bytes,
        config={"display_name": filename}
    )

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[uploaded, prompts[doc_type]],
    )

    # Parse the JSON from the response
    text = response.text.strip()
    # Strip markdown code fences if present
    if text.startswith("```"):
          ext = text.split("\n", 1)[1].rsplit("```", 1)[0]
    return json.loads(text)


@router.post("/suppliers")
async def upload_suppliers(
    file: UploadFile = File(...),
    company_id: str = Form(...),
  ):
    content = await file.read()
    rows = await extract_with_gemini(content, file.filename, "suppliers")

    # Store in Supabase
    for row in rows:
        supabase.table("suppliers").insert({
            "company_id": company_id,
            "name": row.get("name", ""),
            "country": row.get("country", ""),
            "components": row.get("components", ""),
        }).execute()

    return {"extracted": rows, "count": len(rows)}


@router.post("/sla")
async def upload_sla(
    file: UploadFile = File(...),
    company_id: str = Form(...),
):
    content = await file.read()
    rows = await extract_with_gemini(content, file.filename, "sla")

    for row in rows:
        supabase.table("customers").insert({
            "company_id": company_id,
            "name": row.get("customer", ""),
            "sla_days": row.get("sla_days"),
            "penalty_percent": row.get("penalty_percent"),
        }).execute()

    return {"extracted": rows, "count": len(rows)}


@router.post("/bom")
async def upload_bom(
    file: UploadFile = File(...),
    company_id: str = Form(...),
  ):
    content = await file.read()
    rows = await extract_with_gemini(content, file.filename, "bom")

    for row in rows:
        supabase.table("parts").insert({
            "company_id": company_id,
            "part_number": row.get("part_number", ""),
            "description": row.get("description", ""),
            "supplier_name": row.get("supplier_name", ""),
            "quantity_per_unit": row.get("quantity_per_unit"),
            "lead_time_days": row.get("lead_time_days"),
            "unit_cost": row.get("unit_cost"),
        }).execute()

    return {"extracted": rows, "count": len(rows)}