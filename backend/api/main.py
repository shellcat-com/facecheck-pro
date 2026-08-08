"""
FaceCheck Pro — FastAPI Backend Server
Provides face search API that:
1. Accepts uploaded face images
2. Computes face embeddings using ArcFace (InsightFace)
3. Searches ChromaDB for similar faces
4. Returns real results with source URLs and match scores

Run: python -m uvicorn backend.api.main:app --host 0.0.0.0 --port 8000 --reload
"""

import sys
import os
import io
import json
import uuid
import asyncio
import base64
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
import numpy as np

from backend.engine.face_embedder import FaceEmbedder, embedder
from backend.engine.vector_store import FaceVectorStore, vector_store

app = FastAPI(
    title="FaceCheck Pro API",
    description="Real face recognition search engine — searches across FBI, Interpol, mugshots, news, videos, and scammer databases",
    version="1.0.0",
)

# Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# No UPLOAD_DIR or IMAGES_DIR needed — we're RAM-only.
# Uploaded images are processed in memory and never touch disk.
# Crawler images are downloaded to RAM, embedded, then discarded.

# Category labels
CATEGORY_LABELS = {
    "mugshot": "Mugshots & Offenders",
    "scammer": "Scammers & Fraudsters",
    "news": "News & Blogs",
    "video": "Videos",
    "social": "Social Media",
    "other": "Other Sources",
}

CATEGORY_ICONS = {
    "mugshot": "📋",
    "scammer": "🚨",
    "news": "📰",
    "video": "▶️",
    "social": "📱",
    "other": "🌐",
}


def match_label(score: int) -> Dict[str, str]:
    """Get human-readable match label and color."""
    if score >= 90:
        return {"text": "Certain Match", "color": "#22c55e"}
    if score >= 83:
        return {"text": "Confident Match", "color": "#4ade80"}
    if score >= 70:
        return {"text": "Uncertain Match", "color": "#facc15"}
    if score >= 50:
        return {"text": "Weak Match", "color": "#fb923c"}
    return {"text": "No Match", "color": "#ef4444"}


@app.on_event("startup")
async def startup():
    """Initialize face embedder and vector store on server start."""
    print("=" * 60)
    print("🚀 FaceCheck Pro API starting...")
    print("=" * 60)

    emb_ok = await embedder.initialize()
    if emb_ok:
        print("✅ Face embedding engine ready (ArcFace 512-dim)")
    else:
        print("⚠️  Face embedding engine NOT available")
        print("   Install: pip install onnxruntime opencv-python-headless")
        print("   Models will download on first run (~170MB)")

    store_ok = vector_store.initialize()
    if store_ok:
        stats = vector_store.get_stats()
        print(f"✅ Vector store ready — {stats.get('total_faces', 0)} faces indexed")
    else:
        print("⚠️  Vector store NOT available")
        print("   Install: pip install chromadb")


@app.get("/")
async def root():
    """API root — health check."""
    stats = vector_store.get_stats() if vector_store._ready else {}
    return {
        "name": "FaceCheck Pro API",
        "version": "1.0.0",
        "status": "online",
        "engine_ready": embedder._ready,
        "store_ready": vector_store._ready,
        "total_faces_indexed": stats.get("total_faces", 0),
        "categories": stats.get("categories", {}),
    }


@app.post("/api/admin/clear")
async def clear_database():
    """Admin: Clear and recreate the vector database."""
    vector_store.clear()
    return {"status": "cleared", "total_faces": 0}


@app.get("/api/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "engine": embedder._ready,
        "vector_store": vector_store._ready,
    }


@app.get("/api/stats")
async def stats():
    """Get database statistics."""
    if not vector_store._ready:
        return JSONResponse(
            {"error": "Vector store not initialized"}, status_code=503
        )
    return vector_store.get_stats()


@app.post("/api/search")
async def search_face(file: UploadFile = File(...)):
    """
    Search for a face across all indexed databases.

    Accepts an image file, detects faces, computes embeddings,
    searches ChromaDB, and returns matching results.

    Returns:
    - matches: List of matching faces with scores, source URLs, categories
    - query_face: Info about the detected face in the uploaded image
    - external_engines: Links to search on Google Lens, Yandex, etc.
    """
    if not embedder._ready:
        return JSONResponse(
            {
                "error": "Face engine not ready",
                "message": "The face embedding engine is still initializing or failed. Check server logs.",
            },
            status_code=503,
        )

    if not vector_store._ready:
        return JSONResponse(
            {
                "error": "Vector store not ready",
                "message": "The vector database is not available. Seed data first.",
            },
            status_code=503,
        )

    try:
        # Read uploaded image — stays in RAM, NEVER touches disk
        contents = await file.read()

        # Embed directly from bytes (RAM-only, no disk write)
        faces = await embedder.embed_bytes(contents, threshold=0.4)

        if not faces:
            thumbnail_b64 = base64.b64encode(contents).decode()[:100] if len(contents) < 500000 else ""
            return {
                "matches": [],
                "query_face": {"detected": False, "message": "No face detected. Try a clearer front-facing photo."},
                "external_engines": get_external_engines(thumbnail_b64),
                "total_matches": 0,
            }

        # Use the first detected face's embedding
        best_face = faces[0]
        query_embedding = best_face["embedding"]
        face_box = best_face["box"]

        # Search vector store
        results = vector_store.search(
            query_embedding, top_k=30, min_similarity=0.25
        )

        # Enrich results with labels and icons
        enriched = []
        for r in results:
            cat = r.get("category", "other")
            label = match_label(r.get("match_score", 0))

            # Parse JSON-encoded metadata fields back into native types
            metadata = r.get("metadata", {})
            parsed_meta = {}
            for k, v in metadata.items():
                if isinstance(v, str) and (v.startswith("[") or v.startswith("{")):
                    try:
                        parsed_meta[k] = json.loads(v)
                    except (json.JSONDecodeError, ValueError):
                        parsed_meta[k] = v
                else:
                    parsed_meta[k] = v

            enriched.append({
                "id": r["id"],
                "match_score": r["match_score"],
                "similarity": r["similarity"],
                "source_url": r["source_url"],
                "source_name": r["source_name"],
                "category": cat,
                "title": r.get("title", ""),
                "thumbnail_url": r.get("thumbnail_url", ""),
                "description": r.get("description", ""),
                "found_at": r.get("indexed_at", datetime.now(timezone.utc).isoformat()),
                "category_label": CATEGORY_LABELS.get(cat, "Other"),
                "category_icon": CATEGORY_ICONS.get(cat, "🌐"),
                "match_label": label["text"],
                "match_color": label["color"],
                "metadata": parsed_meta,
            })

        # Sort by match score
        enriched.sort(key=lambda x: x.get("match_score", 0), reverse=True)

        # Generate base64 thumbnail from in-memory bytes (no disk)
        try:
            from PIL import Image as PILImage
            thumb = PILImage.open(io.BytesIO(contents))
            thumb.thumbnail((300, 300))
            buf = io.BytesIO()
            thumb.save(buf, "JPEG", quality=85)
            thumbnail_b64 = base64.b64encode(buf.getvalue()).decode()
        except Exception:
            thumbnail_b64 = ""

        # Build response — nothing to clean up (RAM-only, no temp files)
        return {
            "matches": enriched,
            "query_face": {
                "detected": True,
                "face_count": len(faces),
                "box": face_box,
            },
            "external_engines": get_external_engines(thumbnail_b64),
            "total_matches": len(enriched),
            "searched_database": vector_store.get_stats().get("total_faces", 0),
        }

    except Exception as e:
        print(f"[API] Search error: {e}")
        return JSONResponse(
            {"error": "Search failed", "message": str(e)},
            status_code=500,
        )


@app.post("/api/search-url")
async def search_face_url(image_url: str = Form(...)):
    """
    Search for a face from an image URL.
    Downloads the image to RAM, then processes — NEVER touches disk.
    """
    import httpx

    if not image_url:
        raise HTTPException(status_code=400, detail="No image URL provided")

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(image_url, follow_redirects=True)
            resp.raise_for_status()
            contents = resp.content

        # Process directly from bytes (RAM-only, no temp file)
        if not embedder._ready:
            return JSONResponse(
                {"error": "Face engine not ready"},
                status_code=503,
            )
        if not vector_store._ready:
            return JSONResponse(
                {"error": "Vector store not ready"},
                status_code=503,
            )

        faces = await embedder.embed_bytes(contents, threshold=0.4)

        if not faces:
            return {
                "matches": [],
                "query_face": {"detected": False, "message": "No face detected."},
                "external_engines": get_external_engines(),
                "total_matches": 0,
            }

        best_face = faces[0]
        results = vector_store.search(best_face["embedding"], top_k=30, min_similarity=0.25)

        enriched = []
        for r in results:
            cat = r.get("category", "other")
            label = match_label(r.get("match_score", 0))
            metadata = r.get("metadata", {})
            parsed_meta = {}
            for k, v in metadata.items():
                if isinstance(v, str) and (v.startswith("[") or v.startswith("{")):
                    try:
                        parsed_meta[k] = json.loads(v)
                    except (json.JSONDecodeError, ValueError):
                        parsed_meta[k] = v
                else:
                    parsed_meta[k] = v
            enriched.append({
                "id": r["id"],
                "match_score": r["match_score"],
                "similarity": r["similarity"],
                "source_url": r["source_url"],
                "source_name": r["source_name"],
                "category": cat,
                "title": r.get("title", ""),
                "thumbnail_url": r.get("thumbnail_url", ""),
                "description": r.get("description", ""),
                "found_at": r.get("indexed_at", datetime.now(timezone.utc).isoformat()),
                "category_label": CATEGORY_LABELS.get(cat, "Other"),
                "category_icon": CATEGORY_ICONS.get(cat, "🌐"),
                "match_label": label["text"],
                "match_color": label["color"],
                "metadata": parsed_meta,
            })

        enriched.sort(key=lambda x: x.get("match_score", 0), reverse=True)

        return {
            "matches": enriched,
            "query_face": {"detected": True, "face_count": len(faces), "box": best_face["box"]},
            "external_engines": get_external_engines(),
            "total_matches": len(enriched),
            "searched_database": vector_store.get_stats().get("total_faces", 0),
        }

    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=f"Failed to download image: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {e}")


def get_external_engines(thumbnail_b64: str = "") -> List[Dict[str, Any]]:
    """Generate links to external reverse image search engines.

    Each link goes to the engine's upload/search page.
    External services cannot access localhost images, so users re-upload
    the same photo on each engine's page.
    """
    engines = [
        {
            "name": "Google Lens",
            "url": "https://lens.google.com/",
            "icon": "🔍",
            "description": "Most comprehensive — searches Google's entire image index. Drag your photo onto the page.",
            "category": "other",
        },
        {
            "name": "Yandex Images",
            "url": "https://yandex.com/images/",
            "icon": "🌐",
            "description": "Excellent for Eastern European, Asian, and social media faces. Click the camera icon to upload.",
            "category": "other",
        },
        {
            "name": "Bing Visual Search",
            "url": "https://www.bing.com/images/search?view=detailv2&iss=sbi",
            "icon": "🔎",
            "description": "Microsoft's visual search — finds exact and similar images. Click the camera icon.",
            "category": "other",
        },
        {
            "name": "TinEye",
            "url": "https://tineye.com/",
            "icon": "🎯",
            "description": "Finds every instance of this exact image online, including edited versions. Upload on the page.",
            "category": "other",
        },
        {
            "name": "PimEyes",
            "url": "https://pimeyes.com/en",
            "icon": "👁️",
            "description": "Dedicated face search engine — upload for face-specific matches across the web.",
            "category": "other",
        },
        {
            "name": "Search4Faces",
            "url": "https://search4faces.com/",
            "icon": "👤",
            "description": "Search social media profiles (VK, TikTok, ClubHouse) for this face. Upload on site.",
            "category": "social",
        },
    ]
    return engines


# ─── Seed database endpoint (uses already-loaded models, no second process) ───

@app.post("/api/seed")
async def seed_database(source: str = "all", max_per_source: int = 50):
    """
    Seed the face database from crawlers using the running server's models.
    Sources: fbi, registries, social, news, videos, scammers, all
    """
    from backend.crawlers.fbi_wanted import fetch_fbi_wanted, fetch_interpol_red_notices
    from backend.crawlers.sex_offender_registries import fetch_all_registries
    from backend.crawlers.social_media import fetch_all_social
    from backend.crawlers.news_media import fetch_gdelt_news_images, fetch_public_rss_news
    from backend.crawlers.scammers import fetch_all_scammers
    from backend.crawlers.videos_youtube import fetch_youtube_faces

    import httpx

    stats = {"source": source, "faces_added": 0, "errors": []}

    async def download_image_bytes(url: str) -> Optional[bytes]:
        """Download image to RAM only. NEVER touches disk. Returns raw bytes or None."""
        try:
            async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
                resp = await client.get(url, headers={
                    "User-Agent": "FaceCheck-Pro/1.0 (research; public-data)",
                    "Accept": "image/avif,image/webp,image/*,*/*",
                })
                resp.raise_for_status()
                content_type = resp.headers.get("content-type", "")
                if "html" in content_type:
                    return None
                if len(resp.content) < 100:
                    return None
                return resp.content
        except Exception:
            return None

    async def process_and_store(face_records, category: str, max_dl: int = 50):
        added = 0

        for i, record in enumerate(face_records[:max_dl]):
            try:
                image_url = record.get("thumbnail_url") or record.get("source_url", "")
                if not image_url:
                    continue

                # Download to RAM only — NEVER touches disk
                image_bytes = await download_image_bytes(image_url)
                if not image_bytes:
                    continue

                # Embed directly from bytes — no file path needed
                faces = await embedder.embed_bytes(image_bytes, threshold=0.4)
                # image_bytes is now the only reference — it gets garbage collected

                if not faces:
                    continue

                for face in faces:
                    doc_id = vector_store.add_face(
                        embedding=face["embedding"],
                        source_url=record.get("source_url", ""),
                        source_name=record.get("source_name", "Unknown"),
                        category=record.get("category", category),
                        title=record.get("title", ""),
                        thumbnail_url=record.get("thumbnail_url", ""),
                        description=record.get("description", ""),
                        extra_metadata=record.get("extra_metadata"),
                    )
                    if doc_id:
                        added += 1

                await asyncio.sleep(0.1)

            except Exception as e:
                stats["errors"].append(str(e))
                continue

        return added

    try:
        if source in ("fbi", "all"):
            fbi_faces = await fetch_fbi_wanted(max_pages=15)
            added = await process_and_store(fbi_faces, "mugshot", max_per_source)
            stats["faces_added"] += added
            stats["fbi"] = added

        if source in ("registries", "all"):
            reg_faces = await fetch_all_registries()
            added = await process_and_store(reg_faces, "mugshot", max_per_source)
            stats["faces_added"] += added
            stats["registries"] = added

        if source in ("social", "all"):
            social_faces = await fetch_all_social()
            added = await process_and_store(social_faces, "social", max_per_source)
            stats["faces_added"] += added
            stats["social"] = added

        if source in ("news", "all"):
            gdelt_faces = await fetch_gdelt_news_images(max_results=max_per_source)
            rss_faces = await fetch_public_rss_news()
            added = await process_and_store(gdelt_faces + rss_faces, "news", max_per_source)
            stats["faces_added"] += added
            stats["news"] = added

        if source in ("scammers", "all"):
            scam_faces = await fetch_all_scammers()
            added = await process_and_store(scam_faces, "scammer", max_per_source)
            stats["faces_added"] += added
            stats["scammers"] = added

        if source in ("videos", "all"):
            vid_faces = await fetch_youtube_faces(max_per_query=10)
            added = await process_and_store(vid_faces, "video", max_per_source)
            stats["faces_added"] += added
            stats["videos"] = added

        stats["total_in_db"] = vector_store.get_stats().get("total_faces", 0)

    except Exception as e:
        stats["errors"].append(str(e))

    return stats


# ─── FaceCheck.id compatible search endpoint ───

@app.post("/api/facecheck/search")
async def facecheck_search(request: dict):
    """
    FaceCheck.id compatible API — same format as their POST /api/search.

    Request body:
    {
        "id_search": "<session_id>",
        "with_progress": true,
        "status_only": false,
        "demo": false
    }

    Response format matches FaceCheck.id:
    {
        "data": {
            "output": {
                "items": [{ "base64": "data:image/webp;base64,...", "score": 95, "url": "..." }]
            }
        }
    }
    """
    import base64 as b64
    import io as BytesIO

    id_search = request.get("id_search", "")
    demo = request.get("demo", False)

    if not id_search:
        return JSONResponse({"error": "id_search required"}, status_code=400)

    # Look up the stored search session (saved by our frontend)
    search_data = SEARCH_SESSIONS.get(id_search)
    if not search_data:
        return {
            "data": {"output": {"items": [], "message": "Search not found or expired"}}
        }

    embedding = search_data.get("embedding")
    if embedding is None:
        return {
            "data": {"output": {"items": [], "message": "Embedding not available"}}
        }

    # Search vector store
    results = vector_store.search(
        np.array(embedding), top_k=30, min_similarity=0.25
    )

    # Convert to FaceCheck.id format. This store is RAM-only — we keep no local
    # image cache — so we return the source thumbnail URL instead of an embedded
    # image. (The real FaceCheck.id base64-encoded result images as an anti-
    # scraping measure; we simply hand back the origin URL and the photo loads
    # from there — fbi.gov, a CDN, etc. — never from us.)
    items = []
    for r in results:
        base64_img = ""
        thumb_url = r.get("thumbnail_url", "")

        cat = r.get("category", "other")
        label = match_label(r.get("match_score", 0))
        metadata = r.get("metadata", {})

        items.append({
            "id": r["id"],
            "score": r["match_score"],
            "base64": base64_img,
            "url": r.get("source_url", ""),
            "thumbnail_url": thumb_url,
            "source_name": r.get("source_name", ""),
            "category": cat,
            "category_icon": CATEGORY_ICONS.get(cat, "🌐"),
            "title": r.get("title", ""),
            "description": r.get("description", ""),
            "match_label": label["text"],
            "match_color": label["color"],
            "metadata": metadata,
        })

    return {
        "data": {
            "output": {
                "items": items,
                "total": len(items),
                "searched": vector_store.get_stats().get("total_faces", 0),
            }
        }
    }


# ─── Store search session (compatible with FaceCheck.id flow) ───

# In-memory search sessions (maps id_search -> {embedding, created_at})
SEARCH_SESSIONS: Dict[str, dict] = {}


@app.post("/api/facecheck/upload")
async def facecheck_upload(file: UploadFile = File(...)):
    """
    FaceCheck.id compatible upload endpoint.
    Stores the face embedding and returns an id_search for polling.
    """
    import uuid as uuid_mod

    if not embedder._ready:
        return JSONResponse({"error": "Engine not ready"}, status_code=503)

    try:
        contents = await file.read()
        # RAM-only — embed directly from the uploaded bytes, never write to disk
        faces = await embedder.embed_bytes(contents, threshold=0.4)

        if not faces:
            return JSONResponse(
                {"error": "No face detected", "message": "Try a clearer front-facing photo"},
                status_code=400,
            )

        # Generate search session ID
        id_search = uuid_mod.uuid4().hex[:16]

        SEARCH_SESSIONS[id_search] = {
            "embedding": faces[0]["embedding"].tolist(),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "box": faces[0]["box"],
        }

        # Clean old sessions (keep last 100)
        if len(SEARCH_SESSIONS) > 100:
            oldest = sorted(SEARCH_SESSIONS.keys(), key=lambda k: SEARCH_SESSIONS[k]["created_at"])
            for old_key in oldest[:10]:
                del SEARCH_SESSIONS[old_key]

        return {
            "id_search": id_search,
            "face_detected": True,
            "face_count": len(faces),
        }

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


# Run with: python -m uvicorn backend.api.main:app --host 0.0.0.0 --port 8000 --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.api.main:app", host="0.0.0.0", port=8000, reload=True)
