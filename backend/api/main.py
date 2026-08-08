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
import uuid
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

UPLOAD_DIR = Path(__file__).parent.parent / "data" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

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
        # Read uploaded image
        contents = await file.read()

        # Save temporarily
        temp_filename = f"{uuid.uuid4().hex}.jpg"
        temp_path = UPLOAD_DIR / temp_filename
        with open(temp_path, "wb") as f:
            f.write(contents)

        # Use InsightFace embed_image for detection + embedding in one pass
        faces = await embedder.embed_image(str(temp_path), threshold=0.4)

        if not faces:
            # Cleanup and return no-detection response
            try:
                os.remove(temp_path)
            except OSError:
                pass

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

            enriched.append({
                **r,
                "category_label": CATEGORY_LABELS.get(cat, "Other"),
                "category_icon": CATEGORY_ICONS.get(cat, "🌐"),
                "match_label": label["text"],
                "match_color": label["color"],
                "found_at": r.get("indexed_at", datetime.now(timezone.utc).isoformat()),
            })

        # Sort by match score
        enriched.sort(key=lambda x: x.get("match_score", 0), reverse=True)

        # Generate base64 thumbnail for external engine links
        try:
            from PIL import Image as PILImage
            thumb = PILImage.open(temp_path)
            thumb.thumbnail((300, 300))
            buf = io.BytesIO()
            thumb.save(buf, "JPEG", quality=85)
            thumbnail_b64 = base64.b64encode(buf.getvalue()).decode()
        except Exception:
            thumbnail_b64 = ""

        # Build response
        response = {
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

        # Cleanup temp file
        try:
            os.remove(temp_path)
        except OSError:
            pass

        return response

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
    Downloads the image, then processes like /api/search.
    """
    import httpx

    if not image_url:
        raise HTTPException(status_code=400, detail="No image URL provided")

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(image_url, follow_redirects=True)
            resp.raise_for_status()
            contents = resp.content

        # Save to BytesIO as UploadFile-compatible
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        # Process using the same search logic
        from fastapi.datastructures import UploadFile
        with open(tmp_path, "rb") as f:
            file = UploadFile(filename="search.jpg", file=f)
            result = await search_face(file)

        try:
            os.remove(tmp_path)
        except OSError:
            pass

        return result

    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=f"Failed to download image: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {e}")


def get_external_engines(thumbnail_b64: str = "") -> List[Dict[str, Any]]:
    """Generate links to external reverse image search engines."""
    engines = [
        {
            "name": "Google Lens",
            "url": "https://lens.google.com/uploadbyurl?url=YOUR_IMAGE_URL",
            "icon": "🔍",
            "description": "Most comprehensive reverse image search. Finds faces across Google's entire index.",
            "category": "other",
        },
        {
            "name": "Yandex Images",
            "url": "https://yandex.com/images/search?rpt=imageview&url=YOUR_IMAGE_URL",
            "icon": "🌐",
            "description": "Excellent for finding faces on Eastern European and Asian websites.",
            "category": "other",
        },
        {
            "name": "Bing Visual Search",
            "url": "https://www.bing.com/images/search?q=imgurl:YOUR_IMAGE_URL&view=detailv2&iss=sbi",
            "icon": "🔎",
            "description": "Microsoft's visual search — finds exact and similar images across the web.",
            "category": "other",
        },
        {
            "name": "TinEye",
            "url": "https://tineye.com/search?url=YOUR_IMAGE_URL",
            "icon": "🎯",
            "description": "Finds every instance of this exact image online, including edited versions.",
            "category": "other",
        },
        {
            "name": "PimEyes",
            "url": "https://pimeyes.com/en",
            "icon": "👁️",
            "description": "Dedicated face search engine. Upload this photo for face-specific results.",
            "category": "other",
        },
        {
            "name": "Search4Faces",
            "url": "https://search4faces.com/",
            "icon": "👤",
            "description": "Search social media profiles (VK, TikTok, ClubHouse) for this face.",
            "category": "social",
        },
    ]
    return engines


# Run with: python -m uvicorn backend.api.main:app --host 0.0.0.0 --port 8000 --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.api.main:app", host="0.0.0.0", port=8000, reload=True)
