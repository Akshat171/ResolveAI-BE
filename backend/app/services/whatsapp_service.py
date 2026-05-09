"""WhatsApp Cloud API service — send messages and handle inbound webhooks."""
from __future__ import annotations

import httpx
import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation import Conversation
from app.models.message import Message
from app.models.whatsapp_inbox import WhatsAppInbox

log = structlog.get_logger()

GRAPH_API_VERSION = "v19.0"
GRAPH_API_BASE = f"https://graph.facebook.com/{GRAPH_API_VERSION}"


async def send_whatsapp_message(inbox: WhatsAppInbox, to_phone: str, body: str) -> bool:
    """Send a text message via WhatsApp Cloud API. Returns True on success."""
    url = f"{GRAPH_API_BASE}/{inbox.phone_number_id}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to_phone,
        "type": "text",
        "text": {"preview_url": False, "body": body},
    }
    headers = {
        "Authorization": f"Bearer {inbox.access_token}",
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(timeout=15) as client:
        try:
            res = await client.post(url, json=payload, headers=headers)
            res.raise_for_status()
            return True
        except httpx.HTTPStatusError as e:
            log.error("whatsapp_send_failed", status=e.response.status_code, body=e.response.text, to=to_phone)
            return False
        except Exception as e:
            log.error("whatsapp_send_error", error=str(e), to=to_phone)
            return False


async def handle_inbound_message(inbox: WhatsAppInbox, wa_id: str, contact_name: str, message: dict, db: AsyncSession):
    """Process one inbound WhatsApp message — create/update conversation and AI reply."""
    from app.services.chat_service import get_ai_response
    from app.services.emotion_service import detect_emotion, is_negative
    from app.services.escalation_service import create_escalation

    # Only handle text messages for now
    if message.get("type") != "text":
        log.info("whatsapp_non_text_skipped", type=message.get("type"), wa_id=wa_id)
        return

    body = message["text"]["body"].strip()
    if not body:
        return

    wamid = message.get("id", "")

    # Deduplication — skip already-processed message IDs
    if wamid:
        existing = await db.execute(
            select(Message).where(
                Message.tenant_id == inbox.tenant_id,
                Message.email_message_id == wamid,
            )
        )
        if existing.scalar_one_or_none():
            return

    # Find or create conversation for this WhatsApp number
    result = await db.execute(
        select(Conversation).where(
            Conversation.tenant_id == inbox.tenant_id,
            Conversation.channel == "whatsapp",
            Conversation.visitor_id == wa_id,
            Conversation.status != "resolved",
        ).order_by(Conversation.created_at.desc()).limit(1)
    )
    conversation = result.scalar_one_or_none()

    if not conversation:
        conversation = Conversation(
            tenant_id=inbox.tenant_id,
            visitor_id=wa_id,
            visitor_name=contact_name or wa_id,
            channel="whatsapp",
            whatsapp_inbox_id=inbox.id,
            status="active",
            metadata_={},
        )
        db.add(conversation)
        await db.flush()

    # Emotion detection
    emotion_result = detect_emotion(body)
    emotion = emotion_result["emotion"]
    meta = dict(conversation.metadata_ or {})
    if is_negative(emotion):
        meta["consecutive_frustrated"] = meta.get("consecutive_frustrated", 0) + 1
    else:
        meta["consecutive_frustrated"] = 0
    meta["last_emotion"] = emotion
    conversation.metadata_ = meta

    # Save visitor message
    visitor_msg = Message(
        conversation_id=conversation.id,
        tenant_id=inbox.tenant_id,
        role="visitor",
        content=body,
        emotion=emotion,
        email_message_id=wamid,  # reuse field for external message ID dedup
    )
    db.add(visitor_msg)
    await db.flush()

    # AI reply (only if active)
    if conversation.status == "active":
        ai_response = await get_ai_response(db, conversation, body, emotion=emotion)

        ai_msg = Message(
            conversation_id=conversation.id,
            tenant_id=inbox.tenant_id,
            role="ai",
            content=ai_response["content"],
            confidence_score=ai_response["confidence"],
            sources=ai_response["sources"],
            token_usage=ai_response.get("token_usage"),
        )
        db.add(ai_msg)
        await db.flush()

        # Send via WhatsApp
        await send_whatsapp_message(inbox, wa_id, ai_response["content"])

        # Escalation check
        if conversation.status != "escalated":
            if ai_response["confidence"] < 0.4:
                await create_escalation(db, conversation, "low_confidence", f"AI confidence: {ai_response['confidence']:.2f}")
            elif meta.get("consecutive_frustrated", 0) >= 2:
                await create_escalation(db, conversation, "frustration_detected", f"Customer sent {meta['consecutive_frustrated']} frustrated messages")

    await db.commit()
