import numpy as np
from typing import List

class EmbeddingService:
    def __init__(self):
        self._model = None
        self._model_initialized = False

    def _init_model(self):
        if not self._model_initialized:
            try:
                from sentence_transformers import SentenceTransformer
                from app.core.config import settings
                self._model = SentenceTransformer(settings.EMBEDDING_MODEL)
                self._model_initialized = True
            except Exception as e:
                print(f"SentenceTransformer fallback init: {e}")
                self._model_initialized = True
                self._model = None

    def encode(self, texts: List[str]) -> np.ndarray:
        """
        Encode a list of text strings into numpy float32 embeddings (384-dimensional).
        """
        self._init_model()
        if self._model:
            try:
                embeddings = self._model.encode(texts, convert_to_numpy=True)
                return embeddings.astype('float32')
            except Exception as e:
                print(f"Error encoding embeddings: {e}")

        # Deterministic feature hashing fallback embedding generator (384 dimensions)
        dim = 384
        res = []
        for t in texts:
            vec = np.zeros(dim, dtype='float32')
            words = t.lower().split()
            for w in words:
                idx = hash(w) % dim
                vec[idx] += 1.0
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            res.append(vec)
        return np.array(res, dtype='float32')

embedding_service = EmbeddingService()
