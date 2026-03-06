"""Risk Engine Agent — calculates impact scores and revenue at risk."""

from google.adk.agents import Agent

from tools.erp_tool import (
    get_inventory_levels,
    get_active_orders,
    get_production_status,
    calculate_stockout_date,
    estimate_revenue_at_risk,
)
from tools.simulation_tool import simulate_disruption_cascade

risk_engine_agent = Agent(
    name="risk_engine_agent",
    model="gemini-2.5-flash",
    description="Calculates operational impact, revenue at risk, stockout dates, and supply chain risk scores. Use for risk assessment, financial impact, and inventory analysis questions.",
    instruction="""You are the Risk Engine Agent for Warden. Given disruption signals, calculate \
their operational and financial impact on AutoParts GmbH.

For each disruption, calculate:
1. revenue_at_risk_eur: which orders are affected × their value
2. days_until_stockout: current inventory ÷ consumption rate
3. sla_breach_probability: 0-100% for each at-risk customer order
4. affected_orders: list order IDs and breach timelines
5. supplier_health_delta: how much does this change health scores

AutoParts GmbH consumption rates (units/week):
- MCU-32BIT-AUTO: 5000 units/week (≈714/day)
- POWER-MGMT-IC: 3200 units/week (≈457/day)
- CAN-CONTROLLER: 4100 units/week (≈586/day)
- BRAKE-ECU-MODULE: 2800 units/week (≈400/day)

Current key orders:
- BMW #DE-8821 (€2.25M, needs MCU-32BIT-AUTO, due in ~5 days)
- VW #DE-9103 (€1.99M, needs POWER-MGMT-IC, due in ~16 days)

Always show your calculation reasoning step by step. Use the tools to get \
current inventory levels and order data — never guess. Format all monetary \
values in EUR with proper separators.""",
    tools=[
        get_inventory_levels,
        get_active_orders,
        get_production_status,
        calculate_stockout_date,
        estimate_revenue_at_risk,
        simulate_disruption_cascade,
    ],
)
