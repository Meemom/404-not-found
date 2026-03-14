# Warden - Autonomous Supply Chain Resilience Co-Pilot

## Project Overview

Warden is an AI-powered supply chain risk management platform. It monitors disruptions, calculates risk, suggests mitigations, and drafts actions for the user company. Monorepo with `frontend/` (Next.js) and `backend/` (FastAPI).

## Commands

### Frontend (from `frontend/`)
```bash
npm run dev      # Dev server on http://localhost:3000 (Turbopack)
npm run build    # Production build
npm run lint     # ESLint (eslint v9, flat config)
```

### Backend (from `backend/`)
```bash
pip install -r requirements.txt
python main.py   # Uvicorn dev server on http://localhost:8000 (auto-reload)
```

Requires `.env` with `GOOGLE_API_KEY` for ADK/Gemini. Falls back to demo mode if agent fails.

## Architecture

### Backend — Google ADK Agent System
- **Orchestrator** (`agents/orchestrator.py`): Root agent using Gemini 2.5 Flash, routes to 4 sub-agents by intent:
  - `perception_agent` — news/disruptions/signals
  - `risk_engine_agent` — risk scores/revenue impact/inventory
  - `planning_agent` — strategy/simulation/mitigation
  - `action_agent` — drafting emails/POs/escalations
- **Routes**: `agent.py` (SSE chat + demo fallback), `dashboard.py`, `actions.py`, `company.py`, `upload.py`
- **Tools** (`tools/`): ADK tools for news, email, ERP, simulation, supplier lookup, MCP integration
- **State**: In-memory, no database (Supabase client exists in requirements but not primary)

### Frontend — Next.js 16 + React 19
- **App Router** with `"use client"` directives on interactive components
- **Path alias**: `@/` maps to `frontend/src/`
- **State**: Zustand store (`lib/store.ts`) — single `useWardenStore` with company, dashboard, actions, chat, disruptions
- **API client** (`lib/api.ts`): REST + SSE streaming for chat. SSE events: `thinking`, `token`/`response`, `action_generated`, `done`
- **Styling**: Tailwind CSS 4 with CSS custom properties (`--w-ob-*` theme tokens, `--w-blue` accent)

### Key Frontend Patterns
- **3D Visualizations**: Pure Three.js via `useRef`/`useEffect` (not R3F declarative). Factory functions in `.ts` files, thin React wrappers for lifecycle.
  - `SupplyGlobe` — globe with supply chain routes
  - `StockRoom` — 3D warehouse using CSS2DRenderer for HTML overlays on WebGL
- **ReactFlow graph** (`components/visualization/`): Custom nodes (Supplier, Part, Order, Customer, Event) with expanded overlay views
- **Navigation**: `NavigationBar` with `ViewTab` type controls tab switching (`"graph" | "globe" | "stockroom"`)

### SSE Chat Flow
Frontend `streamChat()` → POST `/agent/chat` → Backend streams SSE events → Frontend parses `data:` lines, dispatches to `onToken`/`onEvent` callbacks, updates Zustand store via `updateLastAssistantMessage`.

## Environment Variables
- `CORS_ORIGINS` — Comma-separated allowed origins (default: `http://localhost:3000`)
- `BACKEND_HOST` / `BACKEND_PORT` — Backend bind address (default: `0.0.0.0:8000`)
- `GOOGLE_API_KEY` — Required for ADK/Gemini agents
