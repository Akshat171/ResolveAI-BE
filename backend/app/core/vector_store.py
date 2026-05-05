from __future__ import annotations

import chromadb
from chromadb.config import Settings as ChromaSettings

from app.config import settings


class VectorStore:
    def __init__(self):
        self._client = None

    @property
    def client(self) -> chromadb.ClientAPI:
        if self._client is None:
            self._client = chromadb.PersistentClient(
                path=settings.chroma_persist_dir,
                settings=ChromaSettings(anonymized_telemetry=False),
            )
        return self._client

    def get_collection(self, tenant_id: str) -> chromadb.Collection:
        collection_name = f"tenant_{tenant_id.replace('-', '_')}"
        return self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"},
        )

    def add_documents(
        self,
        tenant_id: str,
        ids: list[str],
        documents: list[str],
        embeddings: list[list[float]],
        metadatas: list[dict] | None = None,
    ):
        collection = self.get_collection(tenant_id)
        collection.add(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
        )

    def query(
        self,
        tenant_id: str,
        query_embedding: list[float],
        n_results: int = 5,
    ) -> dict:
        collection = self.get_collection(tenant_id)
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            include=["documents", "metadatas", "distances"],
        )
        return results

    def delete_item_vectors(self, tenant_id: str, item_id: str):
        collection = self.get_collection(tenant_id)
        # Get all vector IDs for this item
        results = collection.get(
            where={"knowledge_item_id": item_id},
            include=[],
        )
        if results["ids"]:
            collection.delete(ids=results["ids"])

    def delete_tenant_collection(self, tenant_id: str):
        collection_name = f"tenant_{tenant_id.replace('-', '_')}"
        try:
            self.client.delete_collection(collection_name)
        except ValueError:
            pass  # Collection doesn't exist


vector_store = VectorStore()
