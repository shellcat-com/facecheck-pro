"""
FaceCheck Pro — Sex Offender Registry Crawler
Indexes face photos from US state and national sex offender registries.
ALL PUBLIC DATA — these registries are legally mandated to be publicly accessible.

Sources (all free, no API key):
- NSOPW.gov — National Sex Offender Public Website (aggregates all states)
- State-level registries with search APIs

Scale: California alone has ~100k registrants. Nationwide: ~900k.
FaceCheck.id indexes these extensively — major source of their "Sex Offenders" category.
"""

import httpx
import asyncio
from typing import List, Dict, Any
from bs4 import BeautifulSoup
import json
import re
from urllib.parse import urljoin


# State registry search URLs — most states have public search portals
STATE_REGISTRIES = [
    {
        "state": "California",
        "search_url": "https://www.meganslaw.ca.gov/Search.aspx",
        "api_url": "https://www.meganslaw.ca.gov/api/Search",
        "type": "meganslaw",
    },
    {
        "state": "Florida",
        "search_url": "https://offender.fdle.state.fl.us/offender/sops/home.jsf",
        "api_url": "https://offender.fdle.state.fl.us/offender/sops/rest/api/offenders/search",
        "type": "fdle",
    },
    {
        "state": "Texas",
        "search_url": "https://records.txdps.state.tx.us/SexOffenderRegistry",
        "api_url": "https://records.txdps.state.tx.us/SexOffenderRegistry/Search",
        "type": "txdps",
    },
]

# NSOPW National Search (Dru Sjodin National Sex Offender Public Website)
NSOPW_BASE = "https://www.nsopw.gov"

# Known mugshot/offender aggregator sites (public)
OFFENDER_AGGREGATORS = [
    "https://www.homefacts.com/offenders.html",
    "https://www.city-data.com/so/so-United-States.html",
    "https://www.offenderradar.com",
    "https://www.sexoffenderarchives.com",
]

# Direct image-rich offender pages
OFFENDER_SITES = [
    {
        "name": "NSOPW National Search",
        "url": "https://www.nsopw.gov/Search",
        "category": "mugshot",
    },
    {
        "name": "Family Watchdog",
        "url": "https://www.familywatchdog.us/",
        "category": "mugshot",
    },
]


async def fetch_state_registry(state_info: dict, max_results: int = 50) -> List[Dict[str, Any]]:
    """
    Fetch offender records from a state-level Megan's Law registry.
    These are public government databases — legally required to be accessible.
    """
    faces = []
    state = state_info["state"]

    async with httpx.AsyncClient(timeout=60, follow_redirects=True) as client:
        headers = {
            "User-Agent": "FaceCheck-Pro/1.0 (public-safety-research)",
            "Accept": "application/json, text/html",
            "Origin": state_info["search_url"].rsplit("/", 1)[0],
        }

        try:
            api_url = state_info.get("api_url", "")
            if not api_url:
                # Try scraping the HTML page
                resp = await client.get(state_info["search_url"], headers=headers)
                if resp.status_code != 200:
                    print(f"[{state}] HTTP {resp.status_code}")
                    return faces

                soup = BeautifulSoup(resp.text, "lxml")
                # Look for offender listing tables or cards
                # Each state formats differently — look for image tags with offender info nearby
                images = soup.find_all("img")
                for img in images:
                    src = img.get("src") or img.get("data-src", "")
                    if not src or not any(kw in src.lower() for kw in ["photo", "mugshot", "offender", "registrant"]):
                        continue

                    # Make absolute
                    src = urljoin(state_info["search_url"], src)

                    # Try to find nearby name/text
                    parent = img.find_parent(["tr", "div", "li"])
                    text = parent.get_text(strip=True)[:300] if parent else ""

                    faces.append({
                        "source_url": state_info["search_url"],
                        "source_name": f"{state} Sex Offender Registry",
                        "category": "mugshot",
                        "title": text[:100] or f"{state} Registrant",
                        "thumbnail_url": src,
                        "description": f"{state} Sex Offender Registry — Public Record. {text[:300]}",
                        "extra_metadata": {
                            "source": f"{state.lower()}_registry",
                            "state": state,
                            "registry_type": "sex_offender",
                        },
                    })

            print(f"[{state}] Found {len(faces)} images from registry page")

        except Exception as e:
            print(f"[{state}] Error: {e}")

    return faces


async def fetch_nsopw_search(last_name: str = "", zip_code: str = "") -> List[Dict[str, Any]]:
    """
    Search the national NSOPW.gov website.
    This aggregates ALL state registries into one search.
    """
    faces = []

    async with httpx.AsyncClient(timeout=60, follow_redirects=True) as client:
        headers = {
            "User-Agent": "FaceCheck-Pro/1.0 (public-safety-research)",
            "Accept": "text/html,application/xhtml+xml",
            "Origin": NSOPW_BASE,
        }

        try:
            # NSOPW has a search form — try various approaches
            search_urls = [
                f"{NSOPW_BASE}/en/Search/Results",
                f"{NSOPW_BASE}/en/Search",
                f"{NSOPW_BASE}/Search",
            ]

            for search_url in search_urls:
                try:
                    resp = await client.get(search_url, headers=headers)
                    if resp.status_code != 200:
                        continue

                    soup = BeautifulSoup(resp.text, "lxml")
                    images = soup.find_all("img")

                    for img in images:
                        src = img.get("src", "")
                        if not src:
                            continue
                        src = urljoin(NSOPW_BASE, src)

                        alt = img.get("alt", "")
                        parent_text = ""
                        parent = img.find_parent(["div", "tr", "li"])
                        if parent:
                            parent_text = parent.get_text(strip=True)[:200]

                        faces.append({
                            "source_url": NSOPW_BASE,
                            "source_name": "NSOPW National Registry",
                            "category": "mugshot",
                            "title": alt or parent_text[:100] or "National Registry Entry",
                            "thumbnail_url": src,
                            "description": f"National Sex Offender Public Website — {parent_text[:300]}",
                            "extra_metadata": {
                                "source": "nsopw",
                                "registry": "national",
                            },
                        })

                    if faces:
                        print(f"[NSOPW] Found {len(faces)} images at {search_url}")
                        break

                except Exception:
                    continue

        except Exception as e:
            print(f"[NSOPW] Error: {e}")

    return faces


async def fetch_offender_aggregator_sites() -> List[Dict[str, Any]]:
    """
    Scrape offender aggregator websites that compile data from multiple sources.
    These sites republish public government data with photos.
    """
    faces = []

    async with httpx.AsyncClient(timeout=60, follow_redirects=True) as client:
        headers = {
            "User-Agent": "FaceCheck-Pro/1.0 (public-safety-research)",
            "Accept": "text/html,application/xhtml+xml",
        }

        for site_url in OFFENDER_AGGREGATORS:
            try:
                resp = await client.get(site_url, headers=headers)
                if resp.status_code != 200:
                    continue

                soup = BeautifulSoup(resp.text, "lxml")
                images = soup.find_all("img")

                for img in images[:100]:  # Limit per site
                    src = img.get("src") or img.get("data-src", "")
                    if not src:
                        continue

                    src = urljoin(site_url, src)

                    # Skip icons, logos, ads
                    if any(kw in src.lower() for kw in ["icon", "logo", "banner", "ad-", "pixel", "tracking"]):
                        continue

                    alt = img.get("alt", "") or img.get("title", "")

                    faces.append({
                        "source_url": site_url,
                        "source_name": f"Offender Registry ({src.split('/')[2]})",
                        "category": "mugshot",
                        "title": alt[:200] if alt else "Public Registry Record",
                        "thumbnail_url": src,
                        "description": f"Public offender/registry record from {src.split('/')[2]}",
                        "extra_metadata": {
                            "source": "offender_aggregator",
                            "site": site_url,
                        },
                    })

                print(f"[Aggregator] {site_url}: {len(faces)} images so far")

            except Exception as e:
                print(f"[Aggregator] Error with {site_url}: {e}")
                continue

    return faces


async def fetch_all_registries() -> List[Dict[str, Any]]:
    """Fetch faces from all sex offender registries."""
    all_faces = []

    # Try national registry first (aggregates all states)
    try:
        nsopw_faces = await fetch_nsopw_search()
        all_faces.extend(nsopw_faces)
    except Exception as e:
        print(f"[Registries] NSOPW failed: {e}")

    # Try state-level registries
    for state_info in STATE_REGISTRIES:
        try:
            state_faces = await fetch_state_registry(state_info, max_results=50)
            all_faces.extend(state_faces)
        except Exception as e:
            print(f"[Registries] {state_info['state']} failed: {e}")

    # Try aggregator sites
    try:
        agg_faces = await fetch_offender_aggregator_sites()
        all_faces.extend(agg_faces)
    except Exception as e:
        print(f"[Registries] Aggregators failed: {e}")

    # Deduplicate by thumbnail_url
    seen = set()
    deduped = []
    for face in all_faces:
        thumb = face.get("thumbnail_url", "")
        if thumb and thumb not in seen:
            seen.add(thumb)
            deduped.append(face)
        elif not thumb:
            deduped.append(face)

    print(f"[Registries] Total (deduped): {len(deduped)} faces")
    return deduped
