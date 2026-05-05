from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import NotFoundError
from app.dependencies import get_current_user
from app.models.knowledge_base import KnowledgeBase
from app.models.knowledge_item import KnowledgeItem
from app.models.user import User
from app.schemas.knowledge_base import (
    KnowledgeBaseCreate,
    KnowledgeBaseResponse,
    KnowledgeItemResponse,
    TextIngestionRequest,
    UrlCrawlRequest,
)

router = APIRouter(prefix="/knowledge-bases", tags=["knowledge-bases"])


@router.get("", response_model=list[KnowledgeBaseResponse])
async def list_knowledge_bases(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(KnowledgeBase)
        .where(KnowledgeBase.tenant_id == current_user.tenant_id)
        .order_by(KnowledgeBase.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=KnowledgeBaseResponse)
async def create_knowledge_base(
    request: KnowledgeBaseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    kb = KnowledgeBase(
        tenant_id=current_user.tenant_id,
        name=request.name,
        description=request.description,
    )
    db.add(kb)
    await db.flush()
    return kb


@router.delete("/{kb_id}")
async def delete_knowledge_base(
    kb_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(KnowledgeBase).where(
            KnowledgeBase.id == kb_id,
            KnowledgeBase.tenant_id == current_user.tenant_id,
        )
    )
    kb = result.scalar_one_or_none()
    if not kb:
        raise NotFoundError("Knowledge base not found")
    await db.delete(kb)
    return {"detail": "Deleted"}


@router.get("/{kb_id}/items", response_model=list[KnowledgeItemResponse])
async def list_items(
    kb_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(KnowledgeItem)
        .where(
            KnowledgeItem.knowledge_base_id == kb_id,
            KnowledgeItem.tenant_id == current_user.tenant_id,
        )
        .order_by(KnowledgeItem.created_at.desc())
    )
    return result.scalars().all()


@router.post("/{kb_id}/items/text", response_model=KnowledgeItemResponse)
async def ingest_text(
    kb_id: uuid.UUID,
    request: TextIngestionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify KB belongs to tenant
    result = await db.execute(
        select(KnowledgeBase).where(
            KnowledgeBase.id == kb_id,
            KnowledgeBase.tenant_id == current_user.tenant_id,
        )
    )
    if not result.scalar_one_or_none():
        raise NotFoundError("Knowledge base not found")

    item = KnowledgeItem(
        knowledge_base_id=kb_id,
        tenant_id=current_user.tenant_id,
        source_type=request.source_type,
        title=request.title,
        status="pending",
    )
    db.add(item)
    await db.flush()

    # Queue ingestion task (will be implemented with Celery)
    # For now, process inline via service
    from app.services.knowledge_service import process_text_ingestion
    await process_text_ingestion(db, item, request.content)

    return item


@router.post("/{kb_id}/items/upload", response_model=KnowledgeItemResponse)
async def upload_file(
    kb_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(KnowledgeBase).where(
            KnowledgeBase.id == kb_id,
            KnowledgeBase.tenant_id == current_user.tenant_id,
        )
    )
    if not result.scalar_one_or_none():
        raise NotFoundError("Knowledge base not found")

    content = await file.read()
    if len(content) > 50 * 1024 * 1024:  # 50MB limit
        from app.core.exceptions import BadRequestError
        raise BadRequestError("File too large. Maximum size is 50MB.")

    item = KnowledgeItem(
        knowledge_base_id=kb_id,
        tenant_id=current_user.tenant_id,
        source_type="pdf",
        title=file.filename,
        status="pending",
    )
    db.add(item)
    await db.flush()

    from app.services.knowledge_service import process_pdf_ingestion
    await process_pdf_ingestion(db, item, content)

    return item


@router.post("/{kb_id}/items/crawl", response_model=list[KnowledgeItemResponse])
async def crawl_urls(
    kb_id: uuid.UUID,
    request: UrlCrawlRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(KnowledgeBase).where(
            KnowledgeBase.id == kb_id,
            KnowledgeBase.tenant_id == current_user.tenant_id,
        )
    )
    if not result.scalar_one_or_none():
        raise NotFoundError("Knowledge base not found")

    items = []
    for url in request.urls:
        item = KnowledgeItem(
            knowledge_base_id=kb_id,
            tenant_id=current_user.tenant_id,
            source_type="url",
            source_url=url,
            title=url,
            status="pending",
        )
        db.add(item)
        await db.flush()
        items.append(item)

    # Process each URL (in production, use Celery)
    from app.services.knowledge_service import process_url_ingestion
    for item in items:
        await process_url_ingestion(db, item)

    return items


@router.delete("/{kb_id}/items/{item_id}")
async def delete_item(
    kb_id: uuid.UUID,
    item_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(KnowledgeItem).where(
            KnowledgeItem.id == item_id,
            KnowledgeItem.knowledge_base_id == kb_id,
            KnowledgeItem.tenant_id == current_user.tenant_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise NotFoundError("Item not found")

    # Remove vectors from ChromaDB
    from app.core.vector_store import vector_store
    vector_store.delete_item_vectors(str(current_user.tenant_id), str(item_id))

    await db.delete(item)
    return {"detail": "Deleted"}
