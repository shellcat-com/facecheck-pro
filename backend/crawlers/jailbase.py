"""
FaceCheck Pro — JailBase API Mugshot Crawler
FREE — gets recent bookings with mugshots from county jails across the US.

API docs: https://www.jailbase.com/api/
No API key required for basic search.
Rate limited — be respectful.
"""

import httpx
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone


JAILBASE_API = "https://www.jailbase.com/api/v1"


async def fetch_recent_bookings(sources_count: int = 10) -> List[Dict[str, Any]]:
    """
    Fetch recent bookings from random US county jails.
    Returns booking records with mugshot URLs.
    """
    faces = []

    async with httpx.AsyncClient(timeout=30) as client:
        # First, get list of available sources (county jails)
        try:
            resp = await client.get(
                f"{JAILBASE_API}/sources/",
                headers={"Accept": "application/json"},
            )
            resp.raise_for_status()
            sources_data = resp.json()
            sources = sources_data.get("records", [])[:sources_count]
            print(f"[JailBase] Found {len(sources)} county sources")
        except Exception as e:
            print(f"[JailBase] Failed to get sources: {e}")
            return faces

        # For each source, get recent bookings
        for source in sources:
            source_id = source.get("source_id", "")
            county = source.get("name", source_id)

            try:
                resp = await client.get(
                    f"{JAILBASE_API}/recent/",
                    params={"source_id": source_id},
                    headers={"Accept": "application/json"},
                )
                resp.raise_for_status()
                data = resp.json()

                records = data.get("records", [])
                for record in records:
                    mugshot_url = record.get("mugshot_url") or record.get("mugshot")
                    if not mugshot_url:
                        continue

                    name = record.get("name", "").strip()
                    charges = record.get("charges", [])
                    charge_str = ", ".join(charges[:3]) if charges else ""
                    book_date = record.get("book_date", "")
                    bond = record.get("bond_amount", "")

                    faces.append({
                        "source_url": mugshot_url,
                        "source_name": f"{county} County Jail",
                        "category": "mugshot",
                        "title": f"{name} — {county} County Booking",
                        "thumbnail_url": mugshot_url,
                        "description": (
                            f"Booking at {county} County Jail. "
                            f"{'Charges: ' + charge_str + '. ' if charge_str else ''}"
                            f"{'Bond: $' + str(bond) + '. ' if bond else ''}"
                            f"Booked: {book_date}"
                        )[:500],
                        "extra_metadata": {
                            "source": "jailbase",
                            "county": county,
                            "charges": charges,
                            "book_date": book_date,
                            "bond": str(bond) if bond else "",
                        },
                    })

                print(f"[JailBase] {county}: {len(records)} bookings, {len([r for r in records if r.get('mugshot_url')])} with mugshots")

            except Exception as e:
                print(f"[JailBase] Error fetching {county}: {e}")
                continue

    print(f"[JailBase] Total: {len(faces)} mugshot faces")
    return faces


async def search_jailbase(
    first_name: str = "", last_name: str = "", state: str = ""
) -> List[Dict[str, Any]]:
    """
    Search JailBase by name and/or state.
    FREE — no API key.
    """
    faces = []

    async with httpx.AsyncClient(timeout=30) as client:
        params = {}
        if first_name:
            params["first_name"] = first_name
        if last_name:
            params["last_name"] = last_name
        if state:
            params["state"] = state

        try:
            resp = await client.get(
                f"{JAILBASE_API}/search/",
                params=params,
                headers={"Accept": "application/json"},
            )
            resp.raise_for_status()
            data = resp.json()

            for record in data.get("records", []):
                mugshot_url = record.get("mugshot_url") or record.get("mugshot")
                if not mugshot_url:
                    continue

                name = f"{record.get('first_name', '')} {record.get('last_name', '')}".strip()
                charges = record.get("charges", [])
                charge_str = ", ".join(charges[:3]) if charges else ""

                faces.append({
                    "source_url": mugshot_url,
                    "source_name": "JailBase",
                    "category": "mugshot",
                    "title": name or "County Booking",
                    "thumbnail_url": mugshot_url,
                    "description": (
                        f"JailBase record: {name}. "
                        f"{'Charges: ' + charge_str + '. ' if charge_str else ''}"
                    )[:500],
                    "extra_metadata": {
                        "source": "jailbase_search",
                        "charges": charges,
                        "state": state,
                    },
                })

        except Exception as e:
            print(f"[JailBase] Search error: {e}")

    return faces
