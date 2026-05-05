from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation import Conversation
from app.models.escalation import Escalation


async def create_escalation(
    db: AsyncSession,
    conversation: Conversation,
    reason: str,
    reason_detail: Optional[str] = None,
):
    """Create an escalation for a conversation."""
    conversation.status = "escalated"

    escalation = Escalation(
        conversation_id=conversation.id,
        tenant_id=conversation.tenant_id,
        reason=reason,
        reason_detail=reason_detail,
        status="pending",
        priority="normal" if reason == "low_confidence" else "high",
    )
    db.add(escalation)
    return escalation
