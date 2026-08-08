"""
FaceCheck Pro — News & Media Crawler
Indexes face images from news websites and blogs.

Sources:
- GDELT VGKG (Global Knowledge Graph): 500M+ news images indexed, free via BigQuery
- NewsAPI.org: Free tier — 100 requests/day, articles with image URLs
- Public news sitemaps and RSS feeds

GDELT VGKG is the primary source — it processes global news in real-time
and extracts all images from news articles worldwide.
"""

import httpx
import asyncio
from typing import List, Dict, Any
from datetime import datetime, timezone, timedelta


# GDELT VGKG API endpoint (free, no auth needed)
GDELT_VGKG_API = "https://api.gdeltproject.org/api/v2/summary/summary"

# NewsAPI (requires free API key)
NEWS_API_KEY = ""  # Set via env var: NEWSAPI_KEY
NEWSAPI_URL = "https://newsapi.org/v2/everything"


async def fetch_gdelt_news_images(
    max_results: int = 250,
    theme: str = "GENERAL",
    hours_back: int = 48,
) -> List[Dict[str, Any]]:
    """
    Fetch news article images from GDELT VGKG.
    GDELT monitors global news in 100+ languages and extracts all images.

    themes: GENERAL, TERROR, CRIME, SOCIAL_MEDIA, etc.
    Returns face records with source article URLs.
    """
    import os
    faces = []
    # GDELT timemode
    timespan = f"{hours_back}hours"

    async with httpx.AsyncClient(timeout=60) as client:
        try:
            # Query GDELT VGKG for images from news articles
            resp = await client.get(
                GDELT_VGKG_API,
                params={
                    "d": "iatv",  # Image Atlas mode
                    "t": theme,
                    "ts": "full",
                    "n": min(max_results, 500),
                    "fmt": "json",
                },
            )
            if resp.status_code != 200:
                print(f"[GDELT] HTTP {resp.status_code}")
                return faces

            data = resp.json()
            items = data.get("items", data.get("news", [])) or []

            for item in items[:max_results]:
                image_url = (
                    item.get("imageurl") or item.get("image_url") or ""
                )
                source_url = (
                    item.get("url") or item.get("article_url") or ""
                )
                title = (
                    item.get("title") or item.get("seendate", "")
                )

                if not image_url:
                    continue

                # Ensure image URL is valid
                if not image_url.startswith("http"):
                    if source_url.startswith("http"):
                        image_url = source_url  # fallback
                    else:
                        continue

                faces.append({
                    "source_url": source_url or image_url,
                    "source_name": "GDELT News",
                    "category": "news",
                    "title": title[:300] if title else "News Article",
                    "thumbnail_url": image_url,
                    "description": (
                        f"News article from GDELT Global Knowledge Graph. "
                        f"{title[:200] if title else 'Indexed from global news media.'}"
                    )[:500],
                    "extra_metadata": {
                        "source": "gdelt_vgkg",
                        "domain": item.get("domain", ""),
                        "language": item.get("lang", ""),
                        "tone": item.get("tone", ""),
                    },
                })

            print(f"[GDELT] {len(faces)} news images from GDELT VGKG")

        except Exception as e:
            print(f"[GDELT] Error: {e}")

    return faces


async def fetch_newsapi_images(
    query: str = "person",
    days_back: int = 7,
) -> List[Dict[str, Any]]:
    """
    Fetch news articles with images from NewsAPI.org.
    Requires NEWSAPI_KEY environment variable (free: 100 req/day).
    """
    import os

    api_key = os.environ.get("NEWSAPI_KEY", NEWS_API_KEY)
    if not api_key:
        print("[NewsAPI] No API key set. Get one free at https://newsapi.org/register")
        return []

    faces = []
    from_date = (datetime.now(timezone.utc) - timedelta(days=days_back)).strftime("%Y-%m-%d")

    async with httpx.AsyncClient(timeout=30) as client:
        try:
            resp = await client.get(
                NEWSAPI_URL,
                params={
                    "q": query,
                    "from": from_date,
                    "sortBy": "relevancy",
                    "language": "en",
                    "pageSize": 100,
                    "apiKey": api_key,
                },
            )
            if resp.status_code != 200:
                print(f"[NewsAPI] HTTP {resp.status_code}: {resp.text[:200]}")
                return faces

            data = resp.json()
            articles = data.get("articles", [])

            for article in articles:
                image_url = article.get("urlToImage")
                if not image_url:
                    continue

                source_name = (
                    article.get("source", {}).get("name", "News Source")
                )
                title = article.get("title", "")
                description = article.get("description", "")

                faces.append({
                    "source_url": article.get("url", image_url),
                    "source_name": source_name,
                    "category": "news",
                    "title": title[:300] if title else "News Article",
                    "thumbnail_url": image_url,
                    "description": (
                        f"{source_name}: {description[:300] if description else title[:300]}"
                    )[:500],
                    "extra_metadata": {
                        "source": "newsapi",
                        "published_at": article.get("publishedAt", ""),
                        "author": article.get("author", ""),
                    },
                })

            print(f"[NewsAPI] {len(faces)} images from {len(articles)} articles")

        except Exception as e:
            print(f"[NewsAPI] Error: {e}")

    return faces


async def fetch_public_rss_news() -> List[Dict[str, Any]]:
    """
    Fetch face-containing images from major public RSS feeds.
    Targets news sites with open RSS feeds that frequently have people photos.
    """
    import feedparser

    faces = []

    # Major public RSS feeds (no auth needed)
    rss_feeds = [
        "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
        "https://feeds.bbci.co.uk/news/rss.xml",
        "https://feeds.npr.org/1001/rss.xml",
        "https://www.theguardian.com/world/rss",
        "https://abcnews.go.com/abcnews/topstories",
    ]

    for feed_url in rss_feeds:
        try:
            feed = feedparser.parse(feed_url)
            source_name = feed.feed.get("title", feed_url)

            for entry in feed.entries[:20]:  # Top 20 per feed
                # Extract image from media:content or enclosures
                image_url = ""
                if hasattr(entry, "media_content") and entry.media_content:
                    image_url = entry.media_content[0].get("url", "")
                elif hasattr(entry, "media_thumbnail") and entry.media_thumbnail:
                    image_url = entry.media_thumbnail[0].get("url", "")
                elif hasattr(entry, "links"):
                    for link in entry.links:
                        if link.get("type", "").startswith("image/"):
                            image_url = link.get("href", "")
                            break

                if not image_url:
                    continue

                faces.append({
                    "source_url": entry.get("link", image_url),
                    "source_name": source_name[:100],
                    "category": "news",
                    "title": entry.get("title", "")[:300],
                    "thumbnail_url": image_url,
                    "description": (
                        f"{source_name}: {entry.get('title', '')[:300]}"
                    )[:500],
                    "extra_metadata": {
                        "source": "rss_feed",
                        "published": entry.get("published", ""),
                    },
                })

            print(f"[RSS] {source_name}: {len(faces)} images so far")

        except Exception as e:
            print(f"[RSS] Error parsing {feed_url}: {e}")
            continue

    print(f"[RSS] Total: {len(faces)} images from news RSS feeds")
    return faces
