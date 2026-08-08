"""
FaceCheck Pro — Scammer Database Crawler
Aggregates scammer photos from community-maintained databases.

Sources:
- ScamHaters United: Community database of romance scammers with photos
- RomanceScam.com: Scammer photo gallery and reports

These are public community databases — FaceCheck.id added ~100k images from these.
"""

import httpx
from typing import List, Dict, Any
from bs4 import BeautifulSoup


# Community scammer databases
SCAMHATERS_URL = "https://scamhatersunited.com"
ROMANCESCAM_URL = "https://www.romancescam.com"


async def fetch_scamhaters_photos(max_pages: int = 5) -> List[Dict[str, Any]]:
    """
    Scrape scammer photos from ScamHaters United.
    This is a community database where victims upload scammer photos.
    """
    faces = []

    async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
        headers = {
            "User-Agent": "FaceCheck-Pro/1.0 (research; public data collection)",
            "Accept": "text/html,application/xhtml+xml",
        }

        # Try the gallery pages
        gallery_urls = [
            f"{SCAMHATERS_URL}/scammer-gallery",
            f"{SCAMHATERS_URL}/gallery",
            f"{SCAMHATERS_URL}/scammers",
        ]

        for gallery_url in gallery_urls:
            try:
                resp = await client.get(gallery_url, headers=headers)
                if resp.status_code != 200:
                    continue

                soup = BeautifulSoup(resp.text, "lxml")
                images = soup.find_all("img")

                for img in images:
                    src = img.get("src") or img.get("data-src", "")
                    if not src:
                        continue

                    # Make absolute URL
                    if src.startswith("/"):
                        src = f"{SCAMHATERS_URL}{src}"
                    elif not src.startswith("http"):
                        src = f"{SCAMHATERS_URL}/{src}"

                    # Filter non-face images
                    alt = img.get("alt", "").lower()
                    if any(word in alt for word in ["logo", "icon", "banner", "ad", "button"]):
                        continue

                    faces.append({
                        "source_url": src,
                        "source_name": "ScamHaters United",
                        "category": "scammer",
                        "title": alt or "Scammer Photo (Community Report)",
                        "thumbnail_url": src,
                        "description": (
                            "Romance scammer photo from ScamHaters United community database. "
                            "Victims have flagged this photo as used in online scams."
                        ),
                        "extra_metadata": {
                            "source": "scamhaters_united",
                            "alt_text": alt,
                        },
                    })

                print(f"[ScamHaters] Found {len(images)} images at {gallery_url}")

            except Exception as e:
                print(f"[ScamHaters] Error: {e}")
                continue

    print(f"[ScamHaters] Total: {len(faces)} scammer photos")
    return faces


async def fetch_romancescam_photos(max_pages: int = 5) -> List[Dict[str, Any]]:
    """
    Scrape scammer photos from RomanceScam.com.
    Community database of romance scammer profiles with photos.
    """
    faces = []

    async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
        headers = {
            "User-Agent": "FaceCheck-Pro/1.0 (research; public data collection)",
            "Accept": "text/html,application/xhtml+xml",
        }

        gallery_urls = [
            f"{ROMANCESCAM_URL}/scammer-pictures",
            f"{ROMANCESCAM_URL}/photo-gallery",
            f"{ROMANCESCAM_URL}/gallery",
        ]

        for gallery_url in gallery_urls:
            try:
                resp = await client.get(gallery_url, headers=headers)
                if resp.status_code != 200:
                    continue

                soup = BeautifulSoup(resp.text, "lxml")
                images = soup.find_all("img")

                for img in images:
                    src = img.get("src") or img.get("data-src", "")
                    if not src:
                        continue

                    if src.startswith("/"):
                        src = f"{ROMANCESCAM_URL}{src}"
                    elif not src.startswith("http"):
                        continue

                    alt = img.get("alt", "").lower()
                    if any(word in alt for word in ["logo", "icon", "banner", "ad"]):
                        continue

                    faces.append({
                        "source_url": src,
                        "source_name": "RomanceScam.com",
                        "category": "scammer",
                        "title": alt or "Scammer Photo (RomanceScam Report)",
                        "thumbnail_url": src,
                        "description": (
                            "Romance scammer photo from RomanceScam.com community database. "
                            "Flagged by community as used in romance scams and catfishing."
                        ),
                        "extra_metadata": {
                            "source": "romancescam",
                            "alt_text": alt,
                        },
                    })

                print(f"[RomanceScam] Found {len(images)} images at {gallery_url}")

            except Exception as e:
                print(f"[RomanceScam] Error: {e}")
                continue

    print(f"[RomanceScam] Total: {len(faces)} scammer photos")
    return faces


async def fetch_all_scammers() -> List[Dict[str, Any]]:
    """Fetch scammer photos from all available sources."""
    all_faces = []

    try:
        scamhaters_faces = await fetch_scamhaters_photos()
        all_faces.extend(scamhaters_faces)
    except Exception as e:
        print(f"[Scammers] ScamHaters failed: {e}")

    try:
        romancescam_faces = await fetch_romancescam_photos()
        all_faces.extend(romancescam_faces)
    except Exception as e:
        print(f"[Scammers] RomanceScam failed: {e}")

    # Deduplicate by URL
    seen = set()
    deduped = []
    for face in all_faces:
        if face["source_url"] not in seen:
            seen.add(face["source_url"])
            deduped.append(face)

    print(f"[Scammers] Total (deduped): {len(deduped)} faces")
    return deduped
