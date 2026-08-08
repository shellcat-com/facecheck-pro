"""
FaceCheck Pro — Social Media Profile Crawler
Scrapes public social media profiles for face images.

FaceCheck.id's primary data source is public social media profiles.
They index faces from:
- Instagram (public profiles)
- TikTok (public profiles)
- VK (very open — Russian social network)
- Twitter/X (public profiles)
- LinkedIn (public profiles)
- Facebook (public pages only)

ALL DATA IS PUBLIC — we only scrape profiles visible without login.

Strategy: Use search engines to find public social media profile images,
then pass them through face detection to filter for actual faces.
"""

import httpx
import asyncio
from typing import List, Dict, Any
from urllib.parse import quote_plus


# Public social media profile image patterns
# These are thumbnails/CDN URLs accessible without authentication
SOCIAL_MEDIA_SOURCES = [
    {
        "name": "Instagram (Public)",
        "search_url": "https://www.google.com/search?q=site:instagram.com+public+profile&tbm=isch",
        "image_pattern": "instagram.com",
        "domain": "instagram.com",
        "category": "social",
    },
    {
        "name": "TikTok (Public)",
        "search_url": "https://www.google.com/search?q=site:tiktok.com+@profile+photo&tbm=isch",
        "image_pattern": "tiktok.com",
        "domain": "tiktok.com",
        "category": "social",
    },
    {
        "name": "VK (Public)",
        "search_url": "https://www.google.com/search?q=site:vk.com+profile+photo&tbm=isch",
        "image_pattern": "vk.com",
        "domain": "vk.com",
        "category": "social",
    },
    {
        "name": "Twitter/X (Public)",
        "search_url": "https://www.google.com/search?q=site:x.com+profile&tbm=isch",
        "image_pattern": "x.com",
        "domain": "x.com",
        "category": "social",
    },
    {
        "name": "LinkedIn (Public)",
        "search_url": "https://www.google.com/search?q=site:linkedin.com+public+profile+photo&tbm=isch",
        "image_pattern": "linkedin.com",
        "domain": "linkedin.com",
        "category": "social",
    },
]

# Direct public profile image sources (no API key needed)
PUBLIC_IMAGE_APIS = [
    # UI Faces — free AI-generated face images (for testing)
    "https://uifaces.co/api?limit=50",
    # Random User — free API with real-looking face photos
    "https://randomuser.me/api/?results=50&inc=picture,name",
    # DiceBear Avatars — not real faces but useful for testing
    "https://api.dicebear.com/7.x/avataaars/svg?seed=",
]


async def fetch_randomuser_faces(count: int = 50) -> List[Dict[str, Any]]:
    """
    Fetch faces from Random User API (free, no key needed).
    These are AI-generated but good for testing the pipeline.
    """
    faces = []

    async with httpx.AsyncClient(timeout=30) as client:
        try:
            resp = await client.get(
                f"https://randomuser.me/api/",
                params={"results": min(count, 5000), "inc": "picture,name"},
            )
            if resp.status_code != 200:
                return faces

            data = resp.json()
            for user in data.get("results", []):
                name = user.get("name", {})
                full_name = f"{name.get('first', '')} {name.get('last', '')}".strip()
                picture = user.get("picture", {})
                image_url = picture.get("large", picture.get("medium", ""))

                if not image_url:
                    continue

                faces.append({
                    "source_url": "https://randomuser.me/",
                    "source_name": "Random User API",
                    "category": "other",
                    "title": full_name or "Generated Profile",
                    "thumbnail_url": image_url,
                    "description": f"AI-generated face for pipeline testing: {full_name}",
                    "extra_metadata": {
                        "source": "randomuser",
                        "is_generated": True,
                    },
                })

            print(f"[RandomUser] Fetched {len(faces)} test faces")

        except Exception as e:
            print(f"[RandomUser] Error: {e}")

    return faces


async def search_google_images(query: str, max_images: int = 30) -> List[str]:
    """
    Search Google Images for public face photos.
    Returns direct image URLs (not Google's proxy — those expire).
    """
    image_urls = []

    async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml",
        }

        search_url = f"https://www.google.com/search?q={quote_plus(query)}&tbm=isch&num={max_images}"

        try:
            resp = await client.get(search_url, headers=headers)
            if resp.status_code != 200:
                print(f"[Google Images] HTTP {resp.status_code}")
                return image_urls

            # Google Images embeds image URLs in the page data
            # Modern Google Images page has the data in script tags
            import re
            text = resp.text

            # Extract image URLs from the page
            # Pattern: "https://...jpg" or "https://...png" or "https://...webp"
            img_pattern = r'"(https?://[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"'
            matches = re.findall(img_pattern, text, re.IGNORECASE)

            # Filter out Google's own domains and tracking pixels
            for url in matches:
                if any(skip in url.lower() for skip in [
                    "google", "gstatic", "doubleclick", "pixel",
                    "tracking", "analytics", "beacon",
                ]):
                    continue
                if url not in image_urls:
                    image_urls.append(url)

            print(f"[Google Images] Found {len(image_urls)} image URLs for '{query[:40]}...'")

        except Exception as e:
            print(f"[Google Images] Error: {e}")

    return image_urls[:max_images]


async def fetch_social_media_faces(max_per_source: int = 30) -> List[Dict[str, Any]]:
    """
    Search for public social media profile images across platforms.
    Uses Google Images to find profile photos from public accounts.
    """
    faces = []

    for source in SOCIAL_MEDIA_SOURCES:
        try:
            # Search Google Images for this social media platform
            image_urls = await search_google_images(
                f"site:{source['domain']} face photo public profile",
                max_images=max_per_source,
            )

            for url in image_urls:
                faces.append({
                    "source_url": url,
                    "source_name": source["name"],
                    "category": source["category"],
                    "title": f"Public Profile — {source['domain']}",
                    "thumbnail_url": url,
                    "description": (
                        f"Public social media profile image indexed from {source['domain']}. "
                        f"Found via public web search."
                    ),
                    "extra_metadata": {
                        "source": "social_media_search",
                        "platform": source["domain"],
                    },
                })

            print(f"[Social] {source['name']}: {len(image_urls)} image URLs")
            await asyncio.sleep(1)  # Rate limit

        except Exception as e:
            print(f"[Social] Error with {source['name']}: {e}")
            continue

    # Deduplicate
    seen = set()
    deduped = []
    for face in faces:
        thumb = face.get("thumbnail_url", "")
        if thumb and thumb not in seen:
            seen.add(thumb)
            deduped.append(face)

    print(f"[Social] Total (deduped): {len(deduped)} faces from social media")
    return deduped


async def fetch_all_social() -> List[Dict[str, Any]]:
    """Fetch faces from all social media sources."""
    all_faces = []

    # Get test faces from Random User API (quick, always works)
    try:
        test_faces = await fetch_randomuser_faces(count=50)
        all_faces.extend(test_faces)
    except Exception as e:
        print(f"[Social] RandomUser failed: {e}")

    # Get real social media faces via Google Images search
    try:
        social_faces = await fetch_social_media_faces(max_per_source=20)
        all_faces.extend(social_faces)
    except Exception as e:
        print(f"[Social] Social media search failed: {e}")

    return all_faces
