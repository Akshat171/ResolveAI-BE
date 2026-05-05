import hashlib
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.openai_client import get_embeddings
from app.core.vector_store import vector_store
from app.models.knowledge_chunk import KnowledgeChunk
from app.models.knowledge_item import KnowledgeItem
from app.services.ingestion.chunker import chunk_text
from app.services.ingestion.pdf_ingester import extract_text_from_pdf
from app.services.ingestion.text_ingester import extract_text_from_content
from app.services.ingestion.url_crawler import extract_text_from_url


async def _process_and_store_chunks(
    db: AsyncSession,
    item: KnowledgeItem,
    text: str,
):
    """Common pipeline: chunk text, embed, store in vector DB and Postgres."""
    item.status = "processing"
    item.content_hash = hashlib.sha256(text.encode()).hexdigest()

    # Chunk the text
    chunks = chunk_text(text)
    if not chunks:
        item.status = "failed"
        item.error_message = "No content extracted"
        return

    # Generate embeddings
    embeddings = await get_embeddings(chunks)

    # Store in ChromaDB and Postgres
    vector_ids = []
    for i, (chunk_text_content, embedding) in enumerate(zip(chunks, embeddings)):
        chunk_id = str(uuid.uuid4())
        vector_ids.append(chunk_id)

        # Store in Postgres
        db_chunk = KnowledgeChunk(
            knowledge_item_id=item.id,
            tenant_id=item.tenant_id,
            chunk_index=i,
            content=chunk_text_content,
            token_count=len(chunk_text_content) // 4,  # rough estimate
            vector_id=chunk_id,
            metadata_={"title": item.title, "source_type": item.source_type},
        )
        db.add(db_chunk)

    # Store in ChromaDB
    vector_store.add_documents(
        tenant_id=str(item.tenant_id),
        ids=vector_ids,
        documents=chunks,
        embeddings=embeddings,
        metadatas=[
            {
                "knowledge_item_id": str(item.id),
                "title": item.title or "",
                "chunk_index": i,
                "source_type": item.source_type,
            }
            for i in range(len(chunks))
        ],
    )

    item.chunk_count = len(chunks)
    item.status = "completed"


async def process_text_ingestion(
    db: AsyncSession,
    item: KnowledgeItem,
    content: str,
):
    """Process a text/markdown ingestion."""
    try:
        text = extract_text_from_content(content, item.source_type)
        await _process_and_store_chunks(db, item, text)
    except Exception as e:
        item.status = "failed"
        item.error_message = str(e)


async def process_pdf_ingestion(
    db: AsyncSession,
    item: KnowledgeItem,
    pdf_bytes: bytes,
):
    """Process a PDF file ingestion."""
    try:
        text = extract_text_from_pdf(pdf_bytes)
        if not text.strip():
            item.status = "failed"
            item.error_message = "No text extracted from PDF"
            return
        await _process_and_store_chunks(db, item, text)
    except Exception as e:
        item.status = "failed"
        item.error_message = str(e)


async def process_url_ingestion(
    db: AsyncSession,
    item: KnowledgeItem,
):
    """Process a URL crawl ingestion."""
    try:
        text = await extract_text_from_url(item.source_url)
        if not text:
            item.status = "failed"
            item.error_message = "Could not extract content from URL"
            return
        await _process_and_store_chunks(db, item, text)
    except Exception as e:
        item.status = "failed"
        item.error_message = str(e)
