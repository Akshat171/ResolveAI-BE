import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import NotFoundError
from app.dependencies import get_current_user
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User
from app.schemas.conversation import ConversationResponse, MessageResponse

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.get("", response_model=list[ConversationResponse])
async def list_conversations(
    status: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Conversation).where(Conversation.tenant_id == current_user.tenant_id)
    if status:
        query = query.where(Conversation.status == status)
    query = query.order_by(Conversation.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.tenant_id == current_user.tenant_id,
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise NotFoundError("Conversation not found")
    return conv


@router.get("/{conversation_id}/messages", response_model=list[MessageResponse])
async def get_messages(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Message)
        .where(
            Message.conversation_id == conversation_id,
            Message.tenant_id == current_user.tenant_id,
        )
        .order_by(Message.created_at.asc())
    )
    return result.scalars().all()


@router.get("/{conversation_id}/visitor-history")
async def get_visitor_history(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns past conversations for the same visitor — for the dashboard conversation view."""
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.tenant_id == current_user.tenant_id,
        )
    )
    conv = result.scalar_one_or_none()
    if not conv or not conv.visitor_id:
        return {"is_returning": False, "past_conversations": []}

    from app.services.visitor_service import get_visitor_profile
    profile = await get_visitor_profile(
        db,
        tenant_id=current_user.tenant_id,
        visitor_id=conv.visitor_id,
        exclude_conversation_id=conversation_id,
    )

    # Also return a compact list of past conversations with their first message
    past_result = await db.execute(
        select(Conversation)
        .where(
            Conversation.tenant_id == current_user.tenant_id,
            Conversation.visitor_id == conv.visitor_id,
            Conversation.id != conversation_id,
        )
        .order_by(Conversation.created_at.desc())
        .limit(5)
    )
    past_convs = past_result.scalars().all()

    past_list = []
    for pc in past_convs:
        first_msg_result = await db.execute(
            select(Message)
            .where(Message.conversation_id == pc.id, Message.role == "visitor")
            .order_by(Message.created_at.asc())
            .limit(1)
        )
        first_msg = first_msg_result.scalar_one_or_none()
        past_list.append({
            "id": str(pc.id),
            "status": pc.status,
            "created_at": pc.created_at.isoformat(),
            "first_message": first_msg.content[:120] if first_msg else None,
            "last_emotion": pc.metadata_.get("last_emotion", "calm") if pc.metadata_ else "calm",
        })

    return {**profile, "past_conversations": past_list}


@router.patch("/{conversation_id}")
async def update_conversation(
    conversation_id: uuid.UUID,
    status: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.tenant_id == current_user.tenant_id,
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise NotFoundError("Conversation not found")
    conv.status = status
    if status == "resolved":
        from datetime import datetime, timezone
        conv.resolved_at = datetime.now(timezone.utc)
        conv.resolution_type = "human_resolved"
    return {"detail": "Updated"}
