import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import NotFoundError
from app.dependencies import get_current_user
from app.models.escalation import Escalation
from app.models.conversation import Conversation
from app.models.user import User

router = APIRouter(prefix="/escalations", tags=["escalations"])


@router.get("")
async def list_escalations(
    status: Optional[str] = Query("pending"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Escalation).where(Escalation.tenant_id == current_user.tenant_id)
    if status:
        query = query.where(Escalation.status == status)
    query = query.order_by(Escalation.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.patch("/{escalation_id}/accept")
async def accept_escalation(
    escalation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Escalation).where(
            Escalation.id == escalation_id,
            Escalation.tenant_id == current_user.tenant_id,
        )
    )
    escalation = result.scalar_one_or_none()
    if not escalation:
        raise NotFoundError("Escalation not found")

    escalation.status = "accepted"
    escalation.assigned_agent_id = current_user.id
    escalation.accepted_at = datetime.now(timezone.utc)

    # Update conversation status
    conv_result = await db.execute(
        select(Conversation).where(Conversation.id == escalation.conversation_id)
    )
    conv = conv_result.scalar_one()
    conv.status = "escalated"
    conv.assigned_agent_id = current_user.id

    return {"detail": "Escalation accepted"}


@router.patch("/{escalation_id}/resolve")
async def resolve_escalation(
    escalation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Escalation).where(
            Escalation.id == escalation_id,
            Escalation.tenant_id == current_user.tenant_id,
        )
    )
    escalation = result.scalar_one_or_none()
    if not escalation:
        raise NotFoundError("Escalation not found")

    escalation.status = "resolved"
    escalation.resolved_at = datetime.now(timezone.utc)

    conv_result = await db.execute(
        select(Conversation).where(Conversation.id == escalation.conversation_id)
    )
    conv = conv_result.scalar_one()
    conv.status = "resolved"
    conv.resolved_at = datetime.now(timezone.utc)
    conv.resolution_type = "human_resolved"

    return {"detail": "Escalation resolved"}
