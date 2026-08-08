"""
FaceCheck Pro — YouTube Thumbnail Crawler
Extracts face images from YouTube video thumbnails.

YouTube thumbnails use predictable CDN URLs:
- Default: https://img.youtube.com/vi/{VIDEO_ID}/default.jpg (120x90)
- HQ: https://img.youtube.com/vi/{VIDEO_ID}/hqdefault.jpg (480x360)
- SD: https://img.youtube.com/vi/{VIDEO_ID}/sddefault.jpg (640x480)
- Max: https://img.youtube.com/vi/{VIDEO_ID}/maxresdefault.jpg (1280x720)

We search for videos by topic (news, wanted, mugshot, etc.) and extract
thumbnails that likely contain faces.

YouTube Data API is free: 10,000 units/day (~100 searches).
"""

import os
import httpx
from typing import List, Dict, Any
from datetime import datetime, timezone, timedelta


YOUTUBE_API_KEY = ""  # Set via env var: YOUTUBE_API_KEY
YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3"
YOUTUBE_THUMBNAIL_CDN = "https://img.youtube.com/vi"


# Search queries optimized for finding face-heavy content
FACE_SEARCH_QUERIES = [
    "wanted fugitive arrested",
    "police booking mugshot",
    "missing person found",
    "crime suspect arrested",
    "scammer caught exposed",
    "sex offender arrested",
    "most wanted criminal",
    "fugitive captured",
    "romance scammer exposed",
    "news interview face",
    "criminal sentence court",
    "police released photo suspect",
]


async def search_youtube_videos(
    query: str, max_results: int = 25
) -> List[Dict[str, Any]]:
    """
    Search YouTube for videos and extract thumbnail URLs.
    Each thumbnail becomes a candidate for face detection.
    """
    import os

    api_key = os.environ.get("YOUTUBE_API_KEY", YOUTUBE_API_KEY)
    if not api_key:
        print("[YouTube] No API key set. Get one free at https://console.cloud.google.com")
        return []

    videos = []

    async with httpx.AsyncClient(timeout=30) as client:
        try:
            resp = await client.get(
                f"{YOUTUBE_API_URL}/search",
                params={
                    "part": "snippet",
                    "q": query,
                    "maxResults": min(max_results, 50),
                    "type": "video",
                    "videoEmbeddable": "true",
                    "relevanceLanguage": "en",
                    "key": api_key,
                },
            )
            if resp.status_code != 200:
                print(f"[YouTube] HTTP {resp.status_code}: {resp.text[:200]}")
                return videos

            data = resp.json()
            items = data.get("items", [])

            for item in items:
                video_id = item.get("id", {}).get("videoId", "")
                snippet = item.get("snippet", {})

                if not video_id:
                    continue

                # Try max resolution thumbnail first, fall back to HQ
                thumbnails = snippet.get("thumbnails", {})
                thumbnail_url = (
                    thumbnails.get("maxres", {}).get("url")
                    or thumbnails.get("high", {}).get("url")
                    or thumbnails.get("medium", {}).get("url")
                    or f"{YOUTUBE_THUMBNAIL_CDN}/{video_id}/hqdefault.jpg"
                )

                title = snippet.get("title", "")
                channel = snippet.get("channelTitle", "")
                description = snippet.get("description", "")[:300]
                published = snippet.get("publishedAt", "")

                videos.append({
                    "source_url": f"https://www.youtube.com/watch?v={video_id}",
                    "source_name": f"YouTube — {channel}",
                    "category": "video",
                    "title": title,
                    "thumbnail_url": thumbnail_url,
                    "description": (
                        f"YouTube video by {channel}: {title[:200]}. {description}"
                    )[:500],
                    "extra_metadata": {
                        "source": "youtube",
                        "video_id": video_id,
                        "channel": channel,
                        "published_at": published,
                        "direct_thumbnail": f"{YOUTUBE_THUMBNAIL_CDN}/{video_id}/maxresdefault.jpg",
                    },
                })

        except Exception as e:
            print(f"[YouTube] Error searching '{query}': {e}")

    return videos


async def fetch_youtube_faces(max_per_query: int = 15) -> List[Dict[str, Any]]:
    """
    Search YouTube across all face-relevant query topics.
    Returns thumbnail URLs as face candidates.
    """
    all_videos = []

    for query in FACE_SEARCH_QUERIES:
        try:
            videos = await search_youtube_videos(query, max_results=max_per_query)
            all_videos.extend(videos)
            print(f"[YouTube] Query '{query}': {len(videos)} videos")
        except Exception as e:
            print(f"[YouTube] Query '{query}' failed: {e}")
            continue

    # Deduplicate by video_id
    seen_ids = set()
    deduped = []
    for v in all_videos:
        vid = v.get("extra_metadata", {}).get("video_id", "")
        if vid and vid not in seen_ids:
            seen_ids.add(vid)
            deduped.append(v)
        elif not vid:
            deduped.append(v)

    print(f"[YouTube] Total (deduped): {len(deduped)} video thumbnails")
    return deduped


def get_youtube_thumbnail_urls(video_id: str) -> List[Dict[str, str]]:
    """
    Get all available thumbnail URLs for a YouTube video.
    Useful for trying different resolutions.
    """
    base = f"{YOUTUBE_THUMBNAIL_CDN}/{video_id}"
    return [
        {"quality": "maxresdefault", "url": f"{base}/maxresdefault.jpg", "size": "1280x720"},
        {"quality": "sddefault", "url": f"{base}/sddefault.jpg", "size": "640x480"},
        {"quality": "hqdefault", "url": f"{base}/hqdefault.jpg", "size": "480x360"},
        {"quality": "mqdefault", "url": f"{base}/mqdefault.jpg", "size": "320x180"},
        {"quality": "default", "url": f"{base}/default.jpg", "size": "120x90"},
    ]
