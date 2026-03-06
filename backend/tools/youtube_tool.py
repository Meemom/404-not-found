from __future__ import annotations

import os
from typing import Any

import httpx


async def _fetch_durations(video_ids: list[str], api_key: str) -> dict[str, str | None]:
    if not video_ids:
        return {}

    url = "https://www.googleapis.com/youtube/v3/videos"
    params = {
        "part": "contentDetails",
        "id": ",".join(video_ids),
        "key": api_key,
    }

    async with httpx.AsyncClient(timeout=4.0) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

    durations: dict[str, str | None] = {}
    for item in data.get("items", []):
        vid = item.get("id")
        duration = item.get("contentDetails", {}).get("duration")
        if vid:
            durations[vid] = duration
    return durations


def _fallback_videos(event_title: str) -> list[dict[str, Any]]:
    safe_title = event_title.strip() or "Supply Chain Event"
    return [
        {
            "video_id": "mock-video-1",
            "title": f"{safe_title}: Logistics Breakdown Explained",
            "channel_name": "SupplyChain Desk",
            "published_at": "2026-03-01T09:00:00Z",
            "thumbnail_url": "https://placehold.co/320x180?text=Video+1",
            "watch_url": "https://youtube.com/watch?v=mock-video-1",
            "duration": None,
            "is_mock": True,
        },
        {
            "video_id": "mock-video-2",
            "title": f"How {safe_title} Impacts Automotive Manufacturing",
            "channel_name": "Ops Intelligence",
            "published_at": "2026-02-27T13:30:00Z",
            "thumbnail_url": "https://placehold.co/320x180?text=Video+2",
            "watch_url": "https://youtube.com/watch?v=mock-video-2",
            "duration": None,
            "is_mock": True,
        },
    ]


async def search_event_videos(event_title: str, max_results: int = 3) -> list[dict[str, Any]]:
    """Search YouTube directly for event-related videos."""
    api_key = (os.getenv("YOUTUBE_API_KEY") or "").strip()
    if not api_key:
        return _fallback_videos(event_title)

    try:
        url = "https://www.googleapis.com/youtube/v3/search"
        params = {
            "part": "snippet",
            "q": f"{event_title} supply chain 2025",
            "type": "video",
            "maxResults": max_results,
            "order": "relevance",
            "key": api_key,
        }

        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        items = data.get("items", [])
        ids = [i.get("id", {}).get("videoId") for i in items if i.get("id", {}).get("videoId")]
        duration_map = await _fetch_durations(ids, api_key)

        videos: list[dict[str, Any]] = []
        for item in items:
            video_id = item.get("id", {}).get("videoId")
            if not video_id:
                continue
            snippet = item.get("snippet", {})
            videos.append(
                {
                    "video_id": video_id,
                    "title": snippet.get("title", "Untitled Video"),
                    "channel_name": snippet.get("channelTitle", "Unknown Channel"),
                    "published_at": snippet.get("publishedAt", ""),
                    "thumbnail_url": snippet.get("thumbnails", {}).get("medium", {}).get(
                        "url", f"https://img.youtube.com/vi/{video_id}/mqdefault.jpg"
                    ),
                    "watch_url": f"https://youtube.com/watch?v={video_id}",
                    "duration": duration_map.get(video_id),
                    "is_mock": False,
                }
            )

        return videos[:max_results] if videos else _fallback_videos(event_title)
    except Exception:
        return _fallback_videos(event_title)
