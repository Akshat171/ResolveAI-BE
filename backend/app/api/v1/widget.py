from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies import get_tenant_from_api_key
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.tenant import Tenant
from app.schemas.conversation import (
    ConversationResponse,
    MessageResponse,
    WidgetConversationStart,
    WidgetMessageRequest,
)

router = APIRouter(prefix="/widget", tags=["widget"])


@router.get("/visitor/{visitor_id}")
async def get_visitor_profile_endpoint(
    visitor_id: str,
    tenant_id: uuid.UUID = Depends(get_tenant_from_api_key),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns returning-visitor profile for the widget to show a personalised greeting.
    Called on widget mount when a visitor_id already exists in localStorage.
    """
    from app.services.visitor_service import get_visitor_profile
    profile = await get_visitor_profile(db, tenant_id=tenant_id, visitor_id=visitor_id)
    return profile


@router.get("/config")
async def get_widget_config(
    tenant_id: uuid.UUID = Depends(get_tenant_from_api_key),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one()
    return {
        "tenant_name": tenant.name,
        "widget_color": tenant.settings.get("widget_color", "#6366f1"),
        "widget_position": tenant.settings.get("widget_position", "bottom-right"),
        "greeting_message": tenant.settings.get(
            "greeting_message", "Hi! How can I help you today?"
        ),
        "proactive_enabled": tenant.settings.get("proactive_enabled", True),
        "proactive_message": tenant.settings.get(
            "proactive_message", "👋 Need help? I'm here!"
        ),
        "proactive_time_delay": tenant.settings.get("proactive_time_delay", 30),
        "proactive_exit_intent": tenant.settings.get("proactive_exit_intent", True),
        "proactive_scroll_depth": tenant.settings.get("proactive_scroll_depth", 70),
    }


@router.post("/conversations", response_model=ConversationResponse)
async def start_conversation(
    request: WidgetConversationStart,
    tenant_id: uuid.UUID = Depends(get_tenant_from_api_key),
    db: AsyncSession = Depends(get_db),
):
    conversation = Conversation(
        tenant_id=tenant_id,
        visitor_id=request.visitor_id,
        visitor_name=request.visitor_name,
        visitor_email=request.visitor_email,
        status="active",
        channel="widget",
    )
    db.add(conversation)
    await db.flush()
    return conversation


@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(
    conversation_id: uuid.UUID,
    request: WidgetMessageRequest,
    tenant_id: uuid.UUID = Depends(get_tenant_from_api_key),
    db: AsyncSession = Depends(get_db),
):
    # Verify conversation belongs to tenant
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.tenant_id == tenant_id,
        )
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Conversation not found")

    # Detect emotion on visitor message
    from app.services.emotion_service import detect_emotion, is_negative
    emotion_result = detect_emotion(request.content)
    emotion = emotion_result["emotion"]

    # Track consecutive negative messages in conversation metadata
    meta = dict(conversation.metadata_ or {})
    if is_negative(emotion):
        meta["consecutive_frustrated"] = meta.get("consecutive_frustrated", 0) + 1
    else:
        meta["consecutive_frustrated"] = 0
    meta["last_emotion"] = emotion
    conversation.metadata_ = meta

    # Save visitor message
    visitor_msg = Message(
        conversation_id=conversation_id,
        tenant_id=tenant_id,
        role="visitor",
        content=request.content,
        emotion=emotion,
    )
    db.add(visitor_msg)
    await db.flush()

    # Get AI response via chat service
    from app.services.chat_service import get_ai_response
    ai_response = await get_ai_response(db, conversation, request.content, emotion=emotion)

    # Save AI message
    ai_msg = Message(
        conversation_id=conversation_id,
        tenant_id=tenant_id,
        role="ai",
        content=ai_response["content"],
        confidence_score=ai_response["confidence"],
        sources=ai_response["sources"],
        token_usage=ai_response.get("token_usage"),
    )
    db.add(ai_msg)
    await db.flush()

    # Check for escalation — low confidence OR sustained frustration
    from app.services.escalation_service import create_escalation
    if conversation.status != "escalated":
        if ai_response["confidence"] < 0.4:
            await create_escalation(
                db, conversation, "low_confidence",
                f"AI confidence: {ai_response['confidence']:.2f}",
            )
        elif meta.get("consecutive_frustrated", 0) >= 2:
            await create_escalation(
                db, conversation, "frustration_detected",
                f"Customer sent {meta['consecutive_frustrated']} consecutive frustrated/angry messages",
            )

    return ai_msg


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageResponse])
async def get_widget_messages(
    conversation_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_tenant_from_api_key),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Message)
        .where(
            Message.conversation_id == conversation_id,
            Message.tenant_id == tenant_id,
        )
        .order_by(Message.created_at.asc())
    )
    return result.scalars().all()
