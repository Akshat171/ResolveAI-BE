from __future__ import annotations
import uuid
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.exceptions import NotFoundError
from app.dependencies import get_current_user
from app.models.conversation import Conversation
from app.models.email_inbox import EmailInbox
from app.models.message import Message
from app.models.user import User
from app.schemas.email import EmailInboxCreate, EmailInboxUpdate, EmailInboxResponse, EmailReplyRequest
from app.schemas.conversation import MessageResponse

router = APIRouter(prefix="/email", tags=["email"])


@router.get("/inboxes", response_model=list[EmailInboxResponse])
async def list_inboxes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(EmailInbox).where(EmailInbox.tenant_id == current_user.tenant_id).order_by(EmailInbox.created_at.desc())
    )
    return result.scalars().all()


@router.post("/inboxes", response_model=EmailInboxResponse)
async def create_inbox(
    payload: EmailInboxCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    inbox = EmailInbox(tenant_id=current_user.tenant_id, **payload.model_dump())
    db.add(inbox)
    await db.commit()
    await db.refresh(inbox)
    return inbox


@router.patch("/inboxes/{inbox_id}", response_model=EmailInboxResponse)
async def update_inbox(
    inbox_id: uuid.UUID,
    payload: EmailInboxUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(EmailInbox).where(EmailInbox.id == inbox_id, EmailInbox.tenant_id == current_user.tenant_id)
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
        select(EmailInbox).where(EmailInbox.id == inbox_id, EmailInbox.tenant_id == current_user.tenant_id)
    )
    inbox = result.scalar_one_or_none()
    if not inbox:
        raise NotFoundError("Inbox not found")
    await db.delete(inbox)
    await db.commit()
    return {"detail": "Deleted"}


@router.post("/inboxes/{inbox_id}/check")
async def check_inbox_now(
    inbox_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Manually trigger an inbox check."""
    result = await db.execute(
        select(EmailInbox).where(EmailInbox.id == inbox_id, EmailInbox.tenant_id == current_user.tenant_id)
    )
    inbox = result.scalar_one_or_none()
    if not inbox:
        raise NotFoundError("Inbox not found")
    from app.services.email_service import process_inbox
    background_tasks.add_task(process_inbox, inbox, db)
    return {"detail": "Inbox check triggered"}


@router.post("/conversations/{conversation_id}/reply", response_model=MessageResponse)
async def reply_to_email(
    conversation_id: uuid.UUID,
    payload: EmailReplyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Human agent sends a manual reply to an email conversation."""
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.tenant_id == current_user.tenant_id,
            Conversation.channel == "email",
        )
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise NotFoundError("Email conversation not found")

    if not conversation.email_inbox_id:
        raise NotFoundError("No inbox linked to this conversation")

    inbox_result = await db.execute(select(EmailInbox).where(EmailInbox.id == conversation.email_inbox_id))
    inbox = inbox_result.scalar_one_or_none()
    if not inbox:
        raise NotFoundError("Inbox not found")

    # Save agent message
    agent_msg = Message(
        conversation_id=conversation.id,
        tenant_id=current_user.tenant_id,
        role="agent",
        content=payload.content,
    )
    db.add(agent_msg)
    await db.flush()

    # Commit the message first — it's saved regardless of SMTP outcome
    await db.commit()

    # Send via SMTP (best-effort — log failure but don't roll back the saved message)
    try:
        from app.services.email_service import send_email
        thread_id = (conversation.metadata_ or {}).get("email_thread_id", "")
        references = (conversation.metadata_ or {}).get("email_references", "")
        await send_email(
            inbox=inbox,
            to_email=conversation.visitor_email or "",
            to_name=conversation.visitor_name or "",
            subject=conversation.email_subject or "Re: Support",
            body=payload.content,
            in_reply_to=thread_id,
            references=references,
        )
    except Exception as e:
        import structlog
        structlog.get_logger().error("smtp_send_failed", conversation_id=str(conversation_id), error=str(e))

    return agent_msg
