"""MCP lifecycle and availability manager for backend tools."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any


class MCPServiceManager:
    """Tracks readiness for Brave search, web fetch, and filesystem-backed tooling."""

    def __init__(self) -> None:
        self._started = False
        self._services: dict[str, dict[str, Any]] = {
            "brave_search": {"enabled": False, "reason": "not_started"},
            "fetch": {"enabled": False, "reason": "not_started"},
            "filesystem": {"enabled": False, "reason": "not_started"},
        }
        self.cache_dir = Path(__file__).parent.parent / "data" / "perception_cache"

    async def startup(self) -> None:
        if self._started:
            return

        mcp_enabled = os.getenv("ENABLE_MCP_TOOLS", "true").lower() in {
            "1",
            "true",
            "yes",
            "on",
        }

        if not mcp_enabled:
            for key in self._services:
                self._services[key] = {"enabled": False, "reason": "disabled_by_env"}
            self._started = True
            return

        brave_key = os.getenv("BRAVE_API_KEY", "").strip()
        self._services["brave_search"] = {
            "enabled": bool(brave_key),
            "reason": "ready" if brave_key else "missing_BRAVE_API_KEY",
        }

        fetch_enabled = os.getenv("ENABLE_FETCH_TOOL", "true").lower() in {
            "1",
            "true",
            "yes",
            "on",
        }
        self._services["fetch"] = {
            "enabled": fetch_enabled,
            "reason": "ready" if fetch_enabled else "disabled_by_env",
        }

        try:
            self.cache_dir.mkdir(parents=True, exist_ok=True)
            self._services["filesystem"] = {"enabled": True, "reason": "ready"}
        except Exception as exc:  # pragma: no cover - defensive path
            self._services["filesystem"] = {
                "enabled": False,
                "reason": f"mkdir_failed:{type(exc).__name__}",
            }

        self._started = True

    async def shutdown(self) -> None:
        self._started = False

    def is_enabled(self, service: str) -> bool:
        return bool(self._services.get(service, {}).get("enabled", False))

    def status(self) -> dict[str, Any]:
        return {
            "started": self._started,
            "services": self._services,
            "cache_dir": str(self.cache_dir),
        }


mcp_service_manager = MCPServiceManager()
