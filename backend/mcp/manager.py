"""Singleton MCP manager for Brave Search and Fetch servers."""

from __future__ import annotations

import logging
import os
from typing import Any

from google.adk.tools.mcp_tool import MCPToolset
from google.adk.tools.mcp_tool.mcp_session_manager import StdioConnectionParams
from mcp import StdioServerParameters

logger = logging.getLogger(__name__)


class MCPManager:
    def __init__(self) -> None:
        self._brave_toolset: MCPToolset | None = None
        self._fetch_toolset: MCPToolset | None = None
        self._brave_available = False
        self._fetch_available = False

    async def startup(self) -> None:
        """Try connecting to each MCP server. Never raise."""
        brave_key = os.environ.get("BRAVE_SEARCH_API_KEY")
        stdio_timeout = float(os.getenv("MCP_STDIO_TIMEOUT", "10"))

        if not brave_key.strip():
            logger.warning("[MCP] Brave Search MCP unavailable: missing BRAVE_SEARCH_API_KEY")
            self._brave_available = False
            self._brave_toolset = None
        else:
            try:
                self._brave_toolset = MCPToolset(
                    connection_params=StdioConnectionParams(
                        server_params=StdioServerParameters(
                            command="npx",
                            args=["-y", "@modelcontextprotocol/server-brave-search"],
                            env={"BRAVE_SEARCH_API_KEY": brave_key},
                        ),
                        timeout=stdio_timeout,
                    )
                )
                # Force an initial session/listing so startup reflects real availability.
                await self._brave_toolset.get_tools()
                self._brave_available = True
                logger.info("[MCP] Brave Search MCP connected")
            except Exception as exc:
                logger.warning("[MCP] Brave Search MCP unavailable: %s", exc)
                self._brave_available = False
                self._brave_toolset = None

        fetch_enabled = os.getenv("ENABLE_FETCH_MCP", "false").lower() in {"1", "true", "yes", "on"}
        if not fetch_enabled:
            logger.info("[MCP] Fetch MCP disabled (set ENABLE_FETCH_MCP=true to enable)")
            self._fetch_available = False
            self._fetch_toolset = None
            return

        fetch_args_raw = os.getenv("FETCH_MCP_ARGS", "-y mcp-server-fetch-typescript")

        try:
            self._fetch_toolset = MCPToolset(
                connection_params=StdioConnectionParams(
                    server_params=StdioServerParameters(
                        command=os.getenv("FETCH_MCP_COMMAND", "npx"),
                        args=fetch_args_raw.split(),
                    ),
                    timeout=stdio_timeout,
                )
            )
            await self._fetch_toolset.get_tools()
            self._fetch_available = True
            logger.info("[MCP] Fetch MCP connected")
        except Exception as exc:
            logger.warning("[MCP] Fetch MCP unavailable: %s", exc)
            self._fetch_available = False
            self._fetch_toolset = None

    async def shutdown(self) -> None:
        for toolset in [self._brave_toolset, self._fetch_toolset]:
            if toolset:
                try:
                    await toolset.close()
                except Exception:
                    pass
        logger.info("[MCP] MCP connections closed")

    @property
    def brave_available(self) -> bool:
        return self._brave_available

    @property
    def fetch_available(self) -> bool:
        return self._fetch_available

    @property
    def brave_toolset(self) -> MCPToolset | None:
        return self._brave_toolset

    @property
    def fetch_toolset(self) -> MCPToolset | None:
        return self._fetch_toolset

    async def call_brave_search(self, query: str, count: int = 8) -> Any:
        """Invoke Brave MCP search tool through the active MCP session."""
        if not self._brave_toolset:
            raise RuntimeError("Brave MCP unavailable")

        async def _runner(session):
            tools = await session.list_tools()
            names = [t.name for t in tools.tools]
            preferred = ["brave_web_search", "web_search", "search"]
            tool_name = next((n for n in preferred if n in names), names[0] if names else None)
            if not tool_name:
                raise RuntimeError("No Brave MCP tools exposed")
            return await session.call_tool(tool_name, {"query": query, "count": count})

        try:
            return await self._brave_toolset._execute_with_session(  # noqa: SLF001
                _runner,
                "Failed to execute Brave search",
            )
        except Exception:
            self._brave_available = False
            raise

    async def call_fetch(self, url: str) -> Any:
        """Invoke Fetch MCP tool through the active MCP session."""
        if not self._fetch_toolset:
            raise RuntimeError("Fetch MCP unavailable")

        async def _runner(session):
            tools = await session.list_tools()
            names = [t.name for t in tools.tools]
            preferred = ["fetch", "fetch_url", "http_get", "get"]
            tool_name = next((n for n in preferred if n in names), names[0] if names else None)
            if not tool_name:
                raise RuntimeError("No Fetch MCP tools exposed")
            return await session.call_tool(tool_name, {"url": url})

        try:
            return await self._fetch_toolset._execute_with_session(  # noqa: SLF001
                _runner,
                "Failed to execute Fetch tool",
            )
        except Exception:
            self._fetch_available = False
            raise


mcp_manager = MCPManager()
