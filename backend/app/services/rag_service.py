from __future__ import annotations

from app.core.openai_client import get_embeddings
from app.core.vector_store import vector_store

SIMILARITY_THRESHOLD = 0.3  # Minimum cosine similarity


async def retrieve_relevant_chunks(
    tenant_id: str,
    query: str,
    n_results: int = 5,
) -> list[dict]:
    """Retrieve relevant document chunks for a query using RAG."""
    # Embed the query
    query_embedding = (await get_embeddings([query]))[0]

    # Search vector store
    results = vector_store.query(
        tenant_id=tenant_id,
        query_embedding=query_embedding,
        n_results=n_results,
    )

    if not results["documents"] or not results["documents"][0]:
        return []

    chunks = []
    for i, (doc, metadata, distance) in enumerate(
        zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        )
    ):
        # ChromaDB returns distances (lower = more similar for cosine)
        # Convert to similarity: similarity = 1 - distance
        similarity = 1 - distance

        if similarity < SIMILARITY_THRESHOLD:
            continue

        chunks.append(
            {
                "content": doc,
                "metadata": metadata,
                "similarity": similarity,
                "rank": i + 1,
            }
        )

    return chunks
