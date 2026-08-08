"""
FaceCheck Pro — Face Embedding Engine
Uses InsightFace (ArcFace ResNet50 + SCRFD 10g) via ONNX Runtime.
Detection + recognition in one pass. 512-dim normalized embeddings.
"""

import os
import numpy as np
from pathlib import Path
from typing import Optional, Tuple, List

MODEL_DIR = Path(__file__).parent.parent / "data" / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)


class FaceEmbedder:
    """InsightFace face detection + ArcFace embedding (buffalo_l)."""

    def __init__(self, det_threshold: float = 0.5):
        self._det_threshold = det_threshold
        self._min_face_size = 30
        self._ready = False
        self._model = None

    async def initialize(self) -> bool:
        if self._ready:
            return True
        try:
            import insightface
            os.environ["INSIGHTFACE_HOME"] = str(MODEL_DIR.parent)

            self._model = insightface.app.FaceAnalysis(
                name="buffalo_l",
                root=str(MODEL_DIR.parent),
                allowed_modules=["detection", "recognition"],
                providers=["CoreMLExecutionProvider", "CPUExecutionProvider"],
            )
            self._model.prepare(ctx_id=0, det_size=(640, 640), det_thresh=self._det_threshold)
            self._ready = True
            print("[FaceEmbedder] InsightFace buffalo_l ready (SCRFD + ArcFace R50).")
            return True
        except ImportError:
            print("[FaceEmbedder] insightface not installed.")
            return False
        except Exception as e:
            print(f"[FaceEmbedder] Init failed: {e}")
            import traceback; traceback.print_exc()
            return False

    def detect_faces(
        self, img: np.ndarray, threshold: Optional[float] = None
    ) -> List[Tuple[float, float, float, float, float]]:
        """
        Detect faces. Returns list of (x1, y1, x2, y2, confidence).
        Uses InsightFace SCRFD 10g — excellent at finding faces in varied conditions.
        """
        if not self._ready or img is None:
            return []

        try:
            faces = self._model.get(img)
            results = []
            thresh = threshold if threshold is not None else self._det_threshold

            for face in faces:
                bbox = face.bbox.astype(float)
                x1, y1, x2, y2 = bbox
                w, h = x2 - x1, y2 - y1

                if w < self._min_face_size or h < self._min_face_size:
                    continue

                score = float(face.det_score) if hasattr(face, "det_score") else 1.0
                if score < thresh:
                    continue

                results.append((x1, y1, x2, y2, score))

            return results

        except Exception as e:
            print(f"[FaceEmbedder] Detection error: {e}")
            return []

    async def embed_image(self, image_path: str, threshold: float = 0.5) -> List[dict]:
        """
        Full pipeline: load image from disk, detect faces, compute ArcFace embeddings.
        Uses InsightFace's model.get() which does detection + recognition in one pass.

        Returns list of {box: {x,y,w,h}, embedding: 512-dim float32, confidence: float}
        """
        import cv2

        img = cv2.imread(image_path)
        if img is None:
            return []
        return self._process_image(img, threshold)

    async def embed_bytes(self, image_bytes: bytes, threshold: float = 0.5) -> List[dict]:
        """
        RAM-ONLY pipeline: decode bytes in memory, detect faces, compute embeddings.
        NEVER touches disk. Image bytes are decoded, processed, and discarded.

        Returns list of {box: {x,y,w,h}, embedding: 512-dim float32, confidence: float}
        """
        import cv2

        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return []
        return self._process_image(img, threshold)

    def _process_image(self, img: np.ndarray, threshold: float = 0.5) -> List[dict]:
        """Shared pipeline: numpy image → detect faces → compute embeddings."""
        results = []

        try:
            old_thresh = self._model.det_thresh
            self._model.det_thresh = threshold

            faces = self._model.get(img)

            self._model.det_thresh = old_thresh

            for face in faces:
                bbox = face.bbox.astype(float)
                x1, y1, x2, y2 = bbox
                w, h = x2 - x1, y2 - y1

                if w < self._min_face_size or h < self._min_face_size:
                    continue

                embedding = face.embedding
                if embedding is None or len(embedding) != 512:
                    continue

                score = float(face.det_score) if hasattr(face, "det_score") else 1.0

                results.append({
                    "box": {"x": int(x1), "y": int(y1), "w": int(w), "h": int(h)},
                    "embedding": embedding.astype(np.float32),
                    "confidence": score,
                })

        except Exception as e:
            print(f"[FaceEmbedder] _process_image error: {e}")
            import traceback; traceback.print_exc()

        return results


# Singleton
embedder = FaceEmbedder(det_threshold=0.5)
