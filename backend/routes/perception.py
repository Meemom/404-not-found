"""Perception API routes for on-demand event intelligence."""

from __future__ import annotations

import asyncio
import os
from datetime import datetime, timezone
from typing import Literal

import httpx
from fastapi import APIRouter
from pydantic import BaseModel, Field

from mcp.brave_search import search_event_news
from mcp.fetch_tool import fetch_article_content
from mcp.manager import mcp_manager
from tools.youtube_tool import search_event_videos

router = APIRouter(prefix="/perception", tags=["perception"])


class EventIntelligenceRequest(BaseModel):
    event_id: str
    event_title: str
    event_type: str
    affected_regions: list[str] = Field(default_factory=list)
    severity: int


class FetchArticleRequest(BaseModel):
    url: str


class MCPStatusResponse(BaseModel):
    brave_search: bool
    fetch: bool
    youtube: bool


async def _youtube_api_usable() -> bool:
    """Validate YouTube API key by making a lightweight videos.list request."""
    api_key = (os.getenv("YOUTUBE_API_KEY") or "").strip()
    if not api_key:
        return False

    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(
                "https://www.googleapis.com/youtube/v3/videos",
                params={
                    "part": "id",
                    "id": "dQw4w9WgXcQ",
                    "key": api_key,
                },
            )
        return resp.status_code == 200
    except Exception:
        return False


@router.post("/event-intelligence")
async def event_intelligence(request: EventIntelligenceRequest):
    articles, videos = await asyncio.gather(
        search_event_news(
            event_title=request.event_title,
            event_type=request.event_type,
            affected_regions=request.affected_regions,
            max_results=8,
        ),
        search_event_videos(event_title=request.event_title, max_results=3),
    )

    mcp_status = {
        "brave_search": "live" if mcp_manager.brave_available and any(not a.get("is_mock", True) for a in articles) else "fallback",
        "fetch": "available" if mcp_manager.fetch_available else "unavailable",
        "youtube": "live" if any(not v.get("is_mock", True) for v in videos) else "fallback",
    }

    return {
        "event_id": request.event_id,
        "articles": articles,
        "videos": videos,
        "mcp_status": mcp_status,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/fetch-article")
async def fetch_article(request: FetchArticleRequest):
    return await fetch_article_content(request.url)


@router.get("/mcp-status", response_model=MCPStatusResponse)
async def get_mcp_status():
    youtube_ok = await _youtube_api_usable()
    return {
        "brave_search": mcp_manager.brave_available,
        "fetch": mcp_manager.fetch_available,
        "youtube": youtube_ok,
    }
