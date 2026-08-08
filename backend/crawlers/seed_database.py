"""
FaceCheck Pro — Database Seeder
Coordinates all crawlers, downloads images, runs face detection,
and populates the ChromaDB vector store with real face data.

Usage:
  python -m backend.crawlers.seed_database          # Full seed (all categories)
  python -m backend.crawlers.seed_database --fbi     # FBI only
  python -m backend.crawlers.seed_database --stats   # Show stats only
"""

import os
import sys
import asyncio
import argparse
from pathlib import Path
from typing import List, Dict, Any

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.engine.face_embedder import FaceEmbedder, embedder
from backend.engine.vector_store import FaceVectorStore, vector_store
from backend.crawlers.fbi_wanted import (
    fetch_fbi_wanted,
    fetch_interpol_red_notices,
    download_face_image,
)
from backend.crawlers.jailbase import fetch_recent_bookings
from backend.crawlers.scammers import fetch_all_scammers
from backend.crawlers.news_media import (
    fetch_gdelt_news_images,
    fetch_public_rss_news,
    fetch_newsapi_images,
)
from backend.crawlers.videos_youtube import fetch_youtube_faces

IMAGES_DIR = Path(__file__).parent.parent / "data" / "images"
IMAGES_DIR.mkdir(parents=True, exist_ok=True)


async def process_faces(
    face_records: List[Dict[str, Any]],
    category: str,
    max_download: int = 50,
) -> int:
    """
    Download face images, extract embeddings, and store in ChromaDB.
    Returns number of successfully indexed faces.
    """
    indexed = 0
    download_dir = IMAGES_DIR / category
    download_dir.mkdir(parents=True, exist_ok=True)

    # Limit downloads per category
    to_process = face_records[:max_download]

    for i, record in enumerate(to_process):
        try:
            # Download image
            image_url = record.get("source_url") or record.get("thumbnail_url", "")
            if not image_url:
                continue

            print(f"  [{category}] Downloading {i+1}/{len(to_process)}: {image_url[:100]}...")
            local_path = await download_face_image(image_url, download_dir)
            if not local_path:
                continue

            # Extract face embedding (use lower threshold for detection sensitivity)
            faces = await embedder.embed_image(local_path, threshold=0.4)
            if not faces:
                # Clean up if no face detected
                try:
                    os.remove(local_path)
                except OSError:
                    pass
                continue

            # Store each detected face
            for face in faces:
                record["embedding"] = face["embedding"]
                record["category"] = category
                if "thumbnail_url" not in record:
                    record["thumbnail_url"] = image_url

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
                    indexed += 1

            # Keep the image if face was found; it's now in our index

            # Small delay to be respectful
            await asyncio.sleep(0.1)

        except Exception as e:
            print(f"  [{category}] Error processing record: {e}")
            continue

    return indexed


async def seed_fbi_interpol() -> int:
    """Seed database with FBI Wanted + Interpol Red Notices."""
    print("\n🔍 Seeding: FBI Most Wanted + Interpol Red Notices...")

    fbi_faces = await fetch_fbi_wanted(max_pages=20)
    interpol_faces = await fetch_interpol_red_notices(max_pages=10)
    all_faces = fbi_faces + interpol_faces

    print(f"  FBI+Interpol: {len(all_faces)} total records to process")
    indexed = await process_faces(all_faces, "mugshot", max_download=150)
    print(f"  ✅ FBI+Interpol: {indexed} faces indexed")
    return indexed


async def seed_jailbase() -> int:
    """Seed database with JailBase mugshots."""
    print("\n🔍 Seeding: JailBase County Mugshots...")

    jailbase_faces = await fetch_recent_bookings(sources_count=10)
    indexed = await process_faces(jailbase_faces, "mugshot", max_download=50)
    print(f"  ✅ JailBase: {indexed} faces indexed")
    return indexed


async def seed_scammers() -> int:
    """Seed database with scammer photos."""
    print("\n🔍 Seeding: Scammer Community Databases...")

    scammer_faces = await fetch_all_scammers()
    indexed = await process_faces(scammer_faces, "scammer", max_download=50)
    print(f"  ✅ Scammers: {indexed} faces indexed")
    return indexed


async def seed_news() -> int:
    """Seed database with news article images."""
    print("\n🔍 Seeding: News & Blogs (GDELT + RSS)...")

    gdelt_faces = await fetch_gdelt_news_images(max_results=100)
    rss_faces = await fetch_public_rss_news()
    all_faces = gdelt_faces + rss_faces

    # Also try NewsAPI if key is set
    newsapi_faces = await fetch_newsapi_images(query="wanted OR arrested OR mugshot")
    all_faces.extend(newsapi_faces)

    print(f"  News: {len(all_faces)} total records to process")
    indexed = await process_faces(all_faces, "news", max_download=50)
    print(f"  ✅ News: {indexed} faces indexed")
    return indexed


async def seed_videos() -> int:
    """Seed database with YouTube video thumbnails."""
    print("\n🔍 Seeding: YouTube Video Thumbnails...")

    youtube_faces = await fetch_youtube_faces(max_per_query=10)
    indexed = await process_faces(youtube_faces, "video", max_download=50)
    print(f"  ✅ Videos: {indexed} faces indexed")
    return indexed


async def seed_all():
    """Run all seeders and populate the database."""
    print("=" * 60)
    print("🌱 FaceCheck Pro — Database Seeder")
    print("=" * 60)

    # Initialize engine and vector store
    print("\n⚙️  Initializing face embedding engine...")
    emb_ready = await embedder.initialize()
    if not emb_ready:
        print("❌ Failed to initialize face embedding engine!")
        print("   Make sure onnxruntime and opencv are installed:")
        print("   pip install onnxruntime opencv-python-headless")
        return

    print("⚙️  Initializing vector store...")
    store_ready = vector_store.initialize()
    if not store_ready:
        print("❌ Failed to initialize vector store!")
        print("   Make sure chromadb is installed:")
        print("   pip install chromadb")
        return

    # Run all seeders
    total = 0

    total += await seed_fbi_interpol()
    total += await seed_jailbase()
    total += await seed_scammers()
    total += await seed_news()
    total += await seed_videos()

    # Show final stats
    print("\n" + "=" * 60)
    print(f"✅ SEEDING COMPLETE: {total} faces indexed total")
    print("=" * 60)

    stats = vector_store.get_stats()
    print(f"\n📊 Database Stats:")
    print(f"   Total faces: {stats.get('total_faces', 0)}")
    print(f"   Categories: {stats.get('categories', {})}")
    print(f"   Storage: {stats.get('chroma_path', '')}")


async def show_stats():
    """Show current database statistics."""
    vector_store.initialize()
    stats = vector_store.get_stats()
    print("\n📊 FaceCheck Pro Database Stats")
    print("-" * 40)
    print(f"Ready: {stats['ready']}")
    print(f"Total faces indexed: {stats.get('total_faces', 0)}")
    print(f"Categories: {stats.get('categories', {})}")
    print(f"Storage path: {stats.get('chroma_path', '')}")


async def main():
    parser = argparse.ArgumentParser(description="FaceCheck Pro Database Seeder")
    parser.add_argument("--fbi", action="store_true", help="Seed FBI+Interpol only")
    parser.add_argument("--mugshots", action="store_true", help="Seed mugshots only")
    parser.add_argument("--scammers", action="store_true", help="Seed scammers only")
    parser.add_argument("--news", action="store_true", help="Seed news only")
    parser.add_argument("--videos", action="store_true", help="Seed videos only")
    parser.add_argument("--stats", action="store_true", help="Show stats only")
    args = parser.parse_args()

    if args.stats:
        await show_stats()
        return

    # Initialize
    emb_ready = await embedder.initialize()
    store_ready = vector_store.initialize()

    if not emb_ready or not store_ready:
        print("❌ Engine initialization failed. Check dependencies.")
        return

    if args.fbi:
        await seed_fbi_interpol()
    elif args.mugshots:
        await seed_jailbase()
    elif args.scammers:
        await seed_scammers()
    elif args.news:
        await seed_news()
    elif args.videos:
        await seed_videos()
    else:
        await seed_all()


if __name__ == "__main__":
    asyncio.run(main())
