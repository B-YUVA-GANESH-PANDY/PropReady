import os
import pickle
import numpy as np
from typing import List, Dict, Any
from app.core.config import settings
from app.services.embedding_service import embedding_service

class VectorStoreService:
    def __init__(self):
        self.index_path = os.path.join(settings.VECTOR_DB_PATH, "faiss.index")
        self.meta_path = os.path.join(settings.VECTOR_DB_PATH, "metadata.pkl")
        self.chunks_metadata: List[Dict[str, Any]] = []
        self._faiss_index = None
        self._init_index()

    def _init_index(self):
        dim = 384
        try:
            import faiss
            if os.path.exists(self.index_path) and os.path.exists(self.meta_path):
                self._faiss_index = faiss.read_index(self.index_path)
                with open(self.meta_path, "rb") as f:
                    self.chunks_metadata = pickle.load(f)
            else:
                self._faiss_index = faiss.IndexFlatL2(dim)
                self.chunks_metadata = []
        except Exception as e:
            print(f"FAISS index init fallback: {e}")
            self._faiss_index = None

    def save_index(self):
        try:
            import faiss
            if self._faiss_index is not None:
                faiss.write_index(self._faiss_index, self.index_path)
                with open(self.meta_path, "wb") as f:
                    pickle.dump(self.chunks_metadata, f)
        except Exception as e:
            print(f"Failed to save FAISS index: {e}")

    def add_chunks(self, chunks: List[Dict[str, Any]]):
        """
        Add chunks with metadata to vector database.
        Each chunk item:
        {
            "user_id": int,
            "property_id": int,
            "document_id": int,
            "document_name": str,
            "document_type": str,
            "page_number": int,
            "chunk_index": int,
            "chunk_text": str
        }
        """
        if not chunks:
            return

        texts = [c["chunk_text"] for c in chunks]
        embeddings = embedding_service.encode(texts)

        if self._faiss_index is not None:
            try:
                self._faiss_index.add(embeddings)
                self.chunks_metadata.extend(chunks)
                self.save_index()
            except Exception as e:
                print(f"Error adding to FAISS index: {e}")
                self.chunks_metadata.extend(chunks)
        else:
            self.chunks_metadata.extend(chunks)

    def search_chunks(
        self,
        query: str,
        user_id: int,
        property_id: int,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        CRITICAL SECURITY RULE:
        Retrieves top_k chunks STRICTLY filtered by user_id AND property_id BEFORE returning!
        """
        if not self.chunks_metadata:
            return []

        # 1. Filter candidate chunks by mandatory user_id & property_id matching
        candidate_indices = [
            idx for idx, meta in enumerate(self.chunks_metadata)
            if meta.get("user_id") == user_id and meta.get("property_id") == property_id
        ]

        if not candidate_indices:
            return []

        query_emb = embedding_service.encode([query])[0]

        # 2. Rank candidates using cosine similarity / distance
        scored_candidates = []
        for idx in candidate_indices:
            meta = self.chunks_metadata[idx]
            chunk_text = meta.get("chunk_text", "")
            chunk_emb = embedding_service.encode([chunk_text])[0]
            
            # Dot product for similarity
            sim = float(np.dot(query_emb, chunk_emb))
            scored_candidates.append((sim, meta))

        # 3. Sort by similarity descending
        scored_candidates.sort(key=lambda x: x[0], reverse=True)

        results = []
        for sim, meta in scored_candidates[:top_k]:
            meta_copy = meta.copy()
            meta_copy["similarity_score"] = round(sim, 4)
            results.append(meta_copy)

        return results

vector_store_service = VectorStoreService()
