"""
FaceCheck Pro — ChromaDB Vector Store
Stores face embeddings with metadata (source URL, category, name, etc.)
Provides cosine similarity search for face matching.
"""

import os
import uuid
import json
import numpy as np
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

DATA_DIR = Path(__file__).parent.parent / "data"
CHROMA_PATH = DATA_DIR / "chroma"
CHROMA_PATH.mkdir(parents=True, exist_ok=True)

COLLECTION_NAME = "faces"


class FaceVectorStore:
    """
    ChromaDB-backed vector store for face embeddings.
    Each face is stored as: {id, embedding(512-dim float32), metadata{source_url, category, name, ...}}
    """

    def __init__(self):
        self._client = None
        self._collection = None
        self._ready = False

    def initialize(self) -> bool:
        """Initialize ChromaDB client and get/create the faces collection."""
        try:
            import chromadb
            from chromadb.config import Settings

            self._client = chromadb.PersistentClient(
                path=str(CHROMA_PATH),
                settings=Settings(anonymized_telemetry=False),
            )

            # Get or create collection
            try:
                self._collection = self._client.get_collection(COLLECTION_NAME)
            except Exception:
                self._collection = self._client.create_collection(
                    name=COLLECTION_NAME,
                    metadata={"hnsw:space": "cosine"},
                )

            self._ready = True
            count = self._collection.count()
            print(f"[VectorStore] Ready — {count} faces indexed.")
            return True

        except ImportError:
            print("[VectorStore] chromadb not installed. pip install chromadb")
            return False
        except Exception as e:
            print(f"[VectorStore] Init failed: {e}")
            return False

    def add_face(
        self,
        embedding: np.ndarray,
        source_url: str,
        source_name: str,
        category: str,
        title: str = "",
        thumbnail_url: str = "",
        description: str = "",
        extra_metadata: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Add a face embedding to the store.
        Returns the document ID.
        """
        if not self._ready:
            return ""

        doc_id = str(uuid.uuid4())

        metadata = {
            "source_url": source_url,
            "source_name": source_name,
            "category": category,
            "title": title or source_name,
            "thumbnail_url": thumbnail_url or source_url,
            "description": description,
            "indexed_at": datetime.now(timezone.utc).isoformat(),
        }
        if extra_metadata:
            # ChromaDB rejects empty lists, None values, and nested dicts
            for k, v in extra_metadata.items():
                if v is None:
                    continue
                if isinstance(v, list) and len(v) == 0:
                    continue
                if isinstance(v, (list, dict)):
                    metadata[k] = json.dumps(v) if isinstance(v, list) else str(v)
                elif isinstance(v, (str, int, float, bool)):
                    metadata[k] = v
                else:
                    metadata[k] = str(v)

        try:
            self._collection.add(
                ids=[doc_id],
                embeddings=[embedding.tolist()],
                metadatas=[metadata],
            )
            return doc_id
        except Exception as e:
            print(f"[VectorStore] Add failed: {e}")
            return ""

    def add_faces_batch(self, faces: List[Dict[str, Any]]) -> List[str]:
        """
        Batch add faces. Each face dict must have:
        {embedding, source_url, source_name, category, title?, thumbnail_url?, description?}
        Returns list of document IDs.
        """
        if not self._ready or not faces:
            return []

        ids = [str(uuid.uuid4()) for _ in faces]
        embeddings = [f["embedding"].tolist() for f in faces]
        metadatas = []

        for f in faces:
            meta = {
                "source_url": f["source_url"],
                "source_name": f["source_name"],
                "category": f["category"],
                "title": f.get("title", f["source_name"]),
                "thumbnail_url": f.get("thumbnail_url", f["source_url"]),
                "description": f.get("description", ""),
                "indexed_at": datetime.now(timezone.utc).isoformat(),
            }
            if "extra_metadata" in f:
                meta.update(f["extra_metadata"])
            metadatas.append(meta)

        try:
            self._collection.add(ids=ids, embeddings=embeddings, metadatas=metadatas)
            return ids
        except Exception as e:
            print(f"[VectorStore] Batch add failed: {e}")
            return []

    def search(
        self, embedding: np.ndarray, top_k: int = 20, min_similarity: float = 0.35
    ) -> List[Dict[str, Any]]:
        """
        Search for similar faces.
        Returns results sorted by similarity (highest first).
        min_similarity filters out weak matches (cosine similarity threshold).
        """
        if not self._ready:
            return []

        try:
            results = self._collection.query(
                query_embeddings=[embedding.tolist()],
                n_results=top_k,
                include=["metadatas", "distances", "embeddings"],
            )

            if not results["ids"] or not results["ids"][0]:
                return []

            hits = []
            for i, doc_id in enumerate(results["ids"][0]):
                distance = results["distances"][0][i] if results["distances"] else 0
                # ChromaDB cosine distance → similarity score (0-100)
                # Cosine distance in ChromaDB: 1 - cosine_similarity
                # For hnsw:space=cosine, distance = 1 - cos(θ)
                # So similarity = 1 - distance
                similarity = 1.0 - distance
                match_score = int(similarity * 100)

                if similarity < min_similarity:
                    continue

                meta = results["metadatas"][0][i] if results["metadatas"] else {}

                # Extract known fields, pass everything else as extra_metadata
                known_fields = {"source_url", "source_name", "category", "title",
                                "thumbnail_url", "description", "indexed_at"}
                extra = {k: v for k, v in meta.items() if k not in known_fields}

                hit = {
                    "id": doc_id,
                    "match_score": match_score,
                    "similarity": round(similarity, 4),
                    "source_url": meta.get("source_url", ""),
                    "source_name": meta.get("source_name", ""),
                    "category": meta.get("category", "other"),
                    "title": meta.get("title", ""),
                    "thumbnail_url": meta.get("thumbnail_url", ""),
                    "description": meta.get("description", ""),
                    "indexed_at": meta.get("indexed_at", ""),
                    "metadata": extra,
                }
                hits.append(hit)

            return hits

        except Exception as e:
            print(f"[VectorStore] Search failed: {e}")
            return []

    def get_stats(self) -> Dict[str, Any]:
        """Get database statistics."""
        if not self._ready:
            return {"ready": False, "total_faces": 0}

        try:
            total = self._collection.count()
            # Get category distribution
            all_meta = self._collection.get(include=["metadatas"])
            categories = {}
            if all_meta["metadatas"]:
                for m in all_meta["metadatas"]:
                    cat = m.get("category", "other")
                    categories[cat] = categories.get(cat, 0) + 1

            return {
                "ready": True,
                "total_faces": total,
                "categories": categories,
                "chroma_path": str(CHROMA_PATH),
            }
        except Exception:
            return {"ready": True, "total_faces": 0}

    def clear(self):
        """Delete all faces from the collection."""
        if self._ready:
            try:
                self._client.delete_collection(COLLECTION_NAME)
                self._collection = self._client.create_collection(
                    name=COLLECTION_NAME,
                    metadata={"hnsw:space": "cosine"},
                )
                print("[VectorStore] Collection cleared.")
            except Exception as e:
                print(f"[VectorStore] Clear failed: {e}")


# Singleton
vector_store = FaceVectorStore()
