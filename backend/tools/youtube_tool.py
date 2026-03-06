from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

# Trusted channels whose content is considered reliable for supply chain intel
_TRUSTED_CHANNELS = {
    "reuters", "bloomberg", "cnbc", "bbc news", "al jazeera english",
    "financial times", "the wall street journal", "wsj", "sky news",
    "dw news", "france 24 english", "associated press", "ap",
    "freightwaves", "lloyd's list", "supply chain brain",
    "the loadstar", "joc", "journal of commerce",
    "logistics manager", "the economist",
}

def _is_trusted(channel: str) -> bool:
    return channel.strip().lower() in _TRUSTED_CHANNELS


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
    now = datetime.now(timezone.utc)
    date1 = (now - timedelta(days=1)).strftime("%Y-%m-%dT%H:%M:%SZ")
    date2 = (now - timedelta(days=3)).strftime("%Y-%m-%dT%H:%M:%SZ")
    return [
        {
            "video_id": "mock-video-1",
            "title": f"{safe_title}: Logistics Breakdown Explained",
            "channel_name": "Reuters",
            "published_at": date1,
            "thumbnail_url": "https://placehold.co/320x180?text=Video+1",
            "watch_url": "https://youtube.com/watch?v=mock-video-1",
            "duration": None,
            "is_mock": True,
        },
        {
            "video_id": "mock-video-2",
            "title": f"How {safe_title} Impacts Automotive Manufacturing",
            "channel_name": "CNBC",
            "published_at": date2,
            "thumbnail_url": "https://placehold.co/320x180?text=Video+2",
            "watch_url": "https://youtube.com/watch?v=mock-video-2",
            "duration": None,
            "is_mock": True,
        },
    ]


async def search_event_videos(event_title: str, max_results: int = 3) -> list[dict[str, Any]]:
    """Search YouTube for event-related videos from trusted sources, max 2 weeks old."""
    api_key = (os.getenv("YOUTUBE_API_KEY") or "").strip()
    if not api_key:
        return _fallback_videos(event_title)

    two_weeks_ago = (datetime.now(timezone.utc) - timedelta(days=14)).strftime("%Y-%m-%dT%H:%M:%SZ")

    try:
        url = "https://www.googleapis.com/youtube/v3/search"
        params = {
            "part": "snippet",
            "q": f"{event_title} supply chain",
            "type": "video",
            "maxResults": max_results * 4,  # fetch extra so we can filter by channel
            "order": "date",
            "publishedAfter": two_weeks_ago,
            "relevanceLanguage": "en",
            "key": api_key,
        }

        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        items = data.get("items", [])

        # Prefer trusted channels; fall back to top results if none matched
        trusted = [i for i in items if _is_trusted(i.get("snippet", {}).get("channelTitle", ""))]
        pool = trusted if trusted else items

        ids = [i.get("id", {}).get("videoId") for i in pool if i.get("id", {}).get("videoId")]
        duration_map = await _fetch_durations(ids[:max_results], api_key) if ids else {}

        videos: list[dict[str, Any]] = []
        for item in pool:
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
            if len(videos) >= max_results:
                break

        return videos if videos else _fallback_videos(event_title)
    except Exception:
        return _fallback_videos(event_title)
