from __future__ import annotations

import uuid
from typing import Any

import structlog
from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, async_session_factory
from app.core.exceptions import NotFoundError
from app.dependencies import get_current_user
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User
from app.models.whatsapp_inbox import WhatsAppInbox
from app.schemas.conversation import MessageResponse
from app.schemas.whatsapp import (
    WhatsAppInboxCreate,
    WhatsAppInboxResponse,
    WhatsAppInboxUpdate,
    WhatsAppReplyRequest,
)

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])
log = structlog.get_logger()


# ── Inbox CRUD ────────────────────────────────────────────────────────────────

@router.get("/inboxes", response_model=list[WhatsAppInboxResponse])
async def list_inboxes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WhatsAppInbox)
        .where(WhatsAppInbox.tenant_id == current_user.tenant_id)
        .order_by(WhatsAppInbox.created_at.desc())
    )
    return result.scalars().all()


@router.post("/inboxes", response_model=WhatsAppInboxResponse)
async def create_inbox(
    payload: WhatsAppInboxCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    inbox = WhatsAppInbox(tenant_id=current_user.tenant_id, **payload.model_dump())
    db.add(inbox)
    await db.commit()
    await db.refresh(inbox)
    return inbox


@router.patch("/inboxes/{inbox_id}", response_model=WhatsAppInboxResponse)
async def update_inbox(
    inbox_id: uuid.UUID,
    payload: WhatsAppInboxUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WhatsAppInbox).where(
            WhatsAppInbox.id == inbox_id,
            WhatsAppInbox.tenant_id == current_user.tenant_id,
        )
    )
    inbox = result.scalar_one_or_none()
    if not inbox:
        raise NotFoundError("Inbox not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(inbox, field, value)
    await db.commit()
    await db.refresh(inbox)
    return inbox


@router.delete("/inboxes/{inbox_id}")
async def delete_inbox(
    inbox_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WhatsAppInbox).where(
            WhatsAppInbox.id == inbox_id,
            WhatsAppInbox.tenant_id == current_user.tenant_id,
        )
    )
    inbox = result.scalar_one_or_none()
    if not inbox:
        raise NotFoundError("Inbox not found")
    await db.delete(inbox)
    await db.commit()
    return {"detail": "Deleted"}


# ── Webhook ───────────────────────────────────────────────────────────────────

@router.get("/webhook")
async def verify_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Meta calls this GET to verify the webhook URL."""
    params = request.query_params
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")

    if mode != "subscribe" or not token:
        return Response(content="Bad request", status_code=400)

    # Find any inbox whose verify_token matches
    result = await db.execute(
        select(WhatsAppInbox).where(
            WhatsAppInbox.verify_token == token,
            WhatsAppInbox.is_active == True,
        )
    )
    inbox = result.scalar_one_or_none()
    if not inbox:
        return Response(content="Forbidden", status_code=403)

    return Response(content=challenge, media_type="text/plain")


@router.post("/webhook")
async def receive_webhook(request: Request):
    """Meta sends all incoming WhatsApp messages here."""
    try:
        data: dict[str, Any] = await request.json()
    except Exception:
        return Response(status_code=200)  # always 200 to Meta

    if data.get("object") != "whatsapp_business_account":
        return Response(status_code=200)

    async with async_session_factory() as db:
        for entry in data.get("entry", []):
            for change in entry.get("changes", []):
                if change.get("field") != "messages":
                    continue
                value = change.get("value", {})
                await _process_webhook_value(value, db)

    return Response(status_code=200)


async def _process_webhook_value(value: dict, db: AsyncSession):
    from app.services.whatsapp_service import handle_inbound_message

    phone_number_id = value.get("metadata", {}).get("phone_number_id")
    if not phone_number_id:
        return

    result = await db.execute(
        select(WhatsAppInbox).where(
            WhatsAppInbox.phone_number_id == phone_number_id,
            WhatsAppInbox.is_active == True,
        )
    )
    inbox = result.scalar_one_or_none()
    if not inbox:
        log.warning("whatsapp_inbox_not_found", phone_number_id=phone_number_id)
        return

    contacts = {c["wa_id"]: c["profile"]["name"] for c in value.get("contacts", [])}

    for message in value.get("messages", []):
        msg_type = message.get("type")

        # Only process inbound text messages from customers.
        # Meta also sends: image, audio, video, document, sticker,
        # reaction, location, unsupported — skip all of these.
        if msg_type != "text":
            log.info("whatsapp_non_text_ignored", type=msg_type)
            continue

        wa_id = message.get("from")

        # Ignore echo: Meta can send back messages the business itself sent
        # (when echo is enabled in app settings). The business number won't
        # match a customer wa_id but guard it explicitly.
        if wa_id == inbox.phone_number.lstrip("+"):
            continue

        contact_name = contacts.get(wa_id, wa_id)
        try:
            await handle_inbound_message(inbox, wa_id, contact_name, message, db)
        except Exception as e:
            log.error("whatsapp_message_error", error=str(e), wa_id=wa_id)


# ── Agent manual reply ────────────────────────────────────────────────────────

@router.post("/conversations/{conversation_id}/reply", response_model=MessageResponse)
async def reply_to_whatsapp(
    conversation_id: uuid.UUID,
    payload: WhatsAppReplyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.tenant_id == current_user.tenant_id,
            Conversation.channel == "whatsapp",
        )
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise NotFoundError("WhatsApp conversation not found")

    if not conversation.whatsapp_inbox_id:
        raise NotFoundError("No WhatsApp inbox linked to this conversation")

    inbox_result = await db.execute(
        select(WhatsAppInbox).where(WhatsAppInbox.id == conversation.whatsapp_inbox_id)
    )
    inbox = inbox_result.scalar_one_or_none()
    if not inbox:
        raise NotFoundError("Inbox not found")

    agent_msg = Message(
        conversation_id=conversation.id,
        tenant_id=current_user.tenant_id,
        role="agent",
        content=payload.content,
    )
    db.add(agent_msg)
    await db.commit()

    try:
        from app.services.whatsapp_service import send_whatsapp_message
        await send_whatsapp_message(inbox, conversation.visitor_id or "", payload.content)
    except Exception as e:
        log.error("whatsapp_agent_reply_failed", conversation_id=str(conversation_id), error=str(e))

    return agent_msg
