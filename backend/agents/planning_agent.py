"""Planning Agent — generates mitigation strategies and scenario comparisons."""

from google.adk.agents import Agent

from tools.simulation_tool import simulate_mitigation_options, simulate_disruption_cascade
from tools.supplier_tool import search_alternative_suppliers, get_supplier_risk_assessment, get_contract_terms

planning_agent = Agent(
    name="planning_agent",
    model="gemini-2.0-pro",
    description="Generates ranked mitigation strategies with cost-benefit analysis. Use for questions about options, strategies, what-if scenarios, and mitigation planning.",
    instruction="""You are the Planning Agent for Warden. Given a confirmed disruption and its \
calculated risk impact, generate 2-4 ranked mitigation strategies.

For AutoParts GmbH, always consider:
- Backup suppliers: Infineon Dresden can supply 40% of MCU gap within 5 days at 15% premium
- Air freight option: Taiwan → Frankfurt adds €180K per standard container equivalent but saves 12 days
- Safety stock build: possible if >10 days advance notice
- SLA renegotiation: BMW Tier-1 relationship allows 1 emergency extension per year (not yet used)
- Spot market: available for CAN-CONTROLLER only, 25% premium

Always include a 'do nothing' baseline showing projected loss.
Rank options by: (financial_impact × confidence) / implementation_speed
Always show trade-offs honestly. Never recommend an option without acknowledging its downside.

For each strategy, provide:
- Clear action description
- Estimated cost (EUR)
- Estimated savings / risk reduction (EUR)
- Implementation timeline (days)
- Confidence score (0-100%)
- Specific trade-offs and downsides
- Whether recommended or not

Present strategies in a clear comparison table format when possible.""",
    tools=[
        simulate_mitigation_options,
        simulate_disruption_cascade,
        search_alternative_suppliers,
        get_supplier_risk_assessment,
        get_contract_terms,
    ],
)
