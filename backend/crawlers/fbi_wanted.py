"""
FaceCheck Pro — FBI Most Wanted + Interpol Red Notices Crawler
FREE, NO API KEY REQUIRED — government public data.

Sources:
- FBI Wanted API: https://api.fbi.gov/wanted/v1/list — photos + details
- Interpol Red Notices: https://ws-public.interpol.int/notices/v1/red — fugitives

These provide REAL face data with mugshot-quality photos.
"""

import io
import os
import httpx
import asyncio
from pathlib import Path
from typing import List, Dict, Any, Optional
from PIL import Image

# User-Agent required to avoid 403 blocks
UA = "FaceCheck-Pro/1.0 (research; public-data; https://github.com/shellcat-com/facecheck-pro)"
HEADERS = {"User-Agent": UA, "Accept": "application/json"}


async def fetch_fbi_wanted(max_pages: int = 5) -> List[Dict[str, Any]]:
    """
    Fetch wanted persons from FBI API. Each person has: title, images, description, crimes.
    """
    faces = []
    base_url = "https://api.fbi.gov/@wanted"

    async with httpx.AsyncClient(timeout=60, headers=HEADERS) as client:
        for page in range(1, max_pages + 1):
            try:
                resp = await client.get(f"{base_url}?page={page}&pageSize=50")
                resp.raise_for_status()
                data = resp.json()
                items = data.get("items", [])
                if not items:
                    break

                for item in items:
                    images = item.get("images", [])
                    if not images:
                        continue

                    image_url = (
                        images[0].get("large")
                        or images[0].get("original")
                        or images[0].get("thumb")
                    )
                    if not image_url:
                        continue

                    title = item.get("title", "").strip()
                    description = item.get("description", "")
                    details = item.get("details", "")
                    reward = item.get("reward_text", "")

                    faces.append({
                        "source_url": image_url,
                        "source_name": "FBI Wanted",
                        "category": "mugshot",
                        "title": title or "FBI Wanted Person",
                        "thumbnail_url": image_url,
                        "description": (
                            f"FBI Wanted: {title}. "
                            f"{reward + '. ' if reward else ''}"
                            f"{description[:200] if description else details[:200]}"
                        )[:500],
                        "extra_metadata": {
                            "source": "fbi",
                            "crimes": details[:300] if details else "",
                            "reward": reward,
                            "aliases": item.get("aliases", []),
                        },
                    })

                print(f"[FBI] Page {page}: {len(items)} records, {len(faces)} faces total")

            except Exception as e:
                print(f"[FBI] Page {page} error: {e}")
                continue

    print(f"[FBI] Total: {len(faces)} faces from FBI Wanted API")
    return faces


async def fetch_interpol_red_notices(max_pages: int = 5) -> List[Dict[str, Any]]:
    """
    Fetch Red Notices from Interpol API. FREE, no API key needed.
    """
    faces = []
    base_url = "https://ws-public.interpol.int/notices/v1/red"

    async with httpx.AsyncClient(timeout=60, headers=HEADERS) as client:
        for page in range(1, max_pages + 1):
            try:
                resp = await client.get(
                    f"{base_url}?page={page}&resultPerPage=20"
                )

                # Interpol returns 403 without proper User-Agent; try alternate endpoint
                if resp.status_code == 403:
                    print(f"[Interpol] 403 Forbidden — Interpol API may block programmatic access")
                    break

                resp.raise_for_status()
                data = resp.json()
                notices = data.get("_embedded", {}).get("notices", [])
                if not notices:
                    break

                for notice in notices:
                    notice_id = notice.get("entity_id", "")
                    if not notice_id:
                        continue

                    try:
                        detail_resp = await client.get(f"{base_url}/{notice_id}")
                        if detail_resp.status_code == 403:
                            continue
                        detail_resp.raise_for_status()
                        detail = detail_resp.json()

                        links = detail.get("_links", {})
                        thumbnail = links.get("thumbnail", {}).get("href", "")
                        images_link = links.get("images", {}).get("href", "")

                        photo_url = thumbnail or images_link
                        if not photo_url:
                            continue

                        name = detail.get("name", "")
                        forename = detail.get("forename", "")
                        full_name = f"{forename} {name}".strip()

                        arrest_warrants = detail.get("arrest_warrants", [])
                        charge = arrest_warrants[0].get("charge", "") if arrest_warrants else ""

                        faces.append({
                            "source_url": photo_url,
                            "source_name": "Interpol Red Notice",
                            "category": "mugshot",
                            "title": full_name or f"Red Notice #{notice_id}",
                            "thumbnail_url": photo_url,
                            "description": (
                                f"INTERPOL Red Notice: {full_name}. "
                                f"Wanted internationally. {charge[:200]}"
                            )[:500],
                            "extra_metadata": {
                                "source": "interpol",
                                "notice_id": notice_id,
                                "nationality": detail.get("nationalities", []),
                                "charge": charge,
                            },
                        })
                    except Exception:
                        continue

                print(f"[Interpol] Page {page}: {len(notices)} notices")

            except Exception as e:
                print(f"[Interpol] Page {page} error: {e}")
                continue

    print(f"[Interpol] Total: {len(faces)} faces")
    return faces


async def download_face_image(url: str, save_dir: Path) -> Optional[str]:
    """
    Download a face image with proper headers. Returns local path or None.
    """
    save_dir.mkdir(parents=True, exist_ok=True)

    try:
        img_headers = {
            "User-Agent": UA,
            "Accept": "image/avif,image/webp,image/*,*/*",
        }

        async with httpx.AsyncClient(timeout=30, headers=img_headers, follow_redirects=True) as client:
            resp = await client.get(url)
            resp.raise_for_status()

            content_type = resp.headers.get("content-type", "")
            if "html" in content_type:
                return None  # Got HTML instead of image

            import hashlib
            file_hash = hashlib.md5(url.encode()).hexdigest()[:12]

            # Determine extension
            if "jpeg" in content_type or "jpg" in content_type:
                ext = "jpg"
            elif "png" in content_type:
                ext = "png"
            elif "webp" in content_type:
                ext = "webp"
            else:
                ext = "jpg"

            filepath = save_dir / f"{file_hash}.{ext}"
            with open(filepath, "wb") as f:
                f.write(resp.content)

            # Verify valid image
            try:
                img = Image.open(filepath)
                img.verify()
                img = Image.open(filepath)
                if img.width < 20 or img.height < 20:
                    os.remove(filepath)
                    return None
            except Exception:
                if filepath.exists():
                    os.remove(filepath)
                return None

            return str(filepath)

    except Exception:
        return None
