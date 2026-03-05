# Warden - Autonomous Supply Chain Resilience Co-Pilot

## Project Overview

Warden is an AI-powered supply chain risk management platform built for a hackathon (team: 404-not-found). It monitors disruptions, calculates risk, suggests mitigations, and drafts actions (emails, POs, escalations) for a fictional company, AutoParts GmbH.

## Tech Stack

- **Frontend:** Next.js 16 + React 19, TypeScript, Tailwind CSS 4, Radix UI, Zustand, React Flow, react-globe.gl, Recharts, Framer Motion
- **Backend:** Python FastAPI, Google ADK (Agent Development Kit) with Gemini 2.0 Flash, SSE streaming via sse-starlette
- **State:** In-memory (no database)

## Project Structure

```
backend/
  main.py              # FastAPI app entry point (uvicorn, CORS, route registration)
  agents/              # Google ADK agents
    orchestrator.py    # Root agent that routes to sub-agents
    perception_agent.py
    risk_engine_agent.py
    planning_agent.py
    action_agent.py
  routes/
    agent.py           # SSE chat endpoint + demo fallback responses
    dashboard.py
    actions.py
    company.py
    memory.py
  tools/               # ADK tools (news, email, ERP, simulation, supplier)
  models/              # Pydantic models (action, company, risk, supplier)
  data/                # Static data files

frontend/
  src/
    app/               # Next.js App Router pages
      dashboard/       # Main dashboard with sub-pages: copilot, actions, cascade, globe, memory
      onboarding/
    components/
      copilot/         # Chat UI (ChatBubble, ChatInput, ThinkingIndicator)
      dashboard/       # Dashboard widgets (RiskGauge, SLACountdown, etc.)
      layout/          # Sidebar, TopBar, CompanyAvatar
    lib/
      api.ts           # Backend API client
      store.ts         # Zustand store
      types.ts         # TypeScript types
      utils.ts         # Utility functions (cn helper, etc.)
```

## Running the Project

### Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
# Runs on http://localhost:8000
```

Requires a `.env` file with Google AI API key for ADK/Gemini. Falls back to demo mode if agent fails.

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

## Key Architecture Decisions

- The agent chat endpoint (`/agent/chat`) streams responses via SSE with event types: `thinking`, `response`, `action_generated`, `done`
- If the real Google ADK agent throws an error, it falls back to hardcoded demo responses in `routes/agent.py`
- The orchestrator agent routes to 4 sub-agents based on intent: perception, risk engine, planning, action
- All actions (emails, POs, escalations) go to a pending queue for human approval
- Frontend uses Zustand for state management

## Environment Variables

- `CORS_ORIGINS` - Comma-separated allowed origins (default: `http://localhost:3000`)
- `BACKEND_HOST` - Backend host (default: `0.0.0.0`)
- `BACKEND_PORT` - Backend port (default: `8000`)
- Google ADK requires `GOOGLE_API_KEY` or equivalent auth