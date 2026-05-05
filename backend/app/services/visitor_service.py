from __future__ import annotations

"""
Visitor memory service.

Builds a profile of a returning visitor from their past conversations
and formats a compact prompt snippet for the AI system prompt.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation import Conversation
from app.models.message import Message


async def get_visitor_profile(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    visitor_id: str,
    exclude_conversation_id: Optional[uuid.UUID] = None,
) -> dict:
    """
    Return a profile dict for the visitor.
    If this is their first visit, returns {"is_returning": False}.
    """
    query = (
        select(Conversation)
        .where(
            Conversation.tenant_id == tenant_id,
            Conversation.visitor_id == visitor_id,
        )
        .order_by(Conversation.created_at.desc())
        .limit(10)
    )
    result = await db.execute(query)
    all_convs = result.scalars().all()

    # Exclude the current conversation (just started)
    past_convs = [c for c in all_convs if c.id != exclude_conversation_id]

    if not past_convs:
        return {"is_returning": False}

    # Collect the first visitor message from each of the last 3 conversations
    # — these act as "topic hints"
    recent_questions: list[str] = []
    last_emotion = "calm"
    has_unresolved = False

    for conv in past_convs[:3]:
        msgs_result = await db.execute(
            select(Message)
            .where(
                Message.conversation_id == conv.id,
                Message.role == "visitor",
            )
            .order_by(Message.created_at.asc())
            .limit(2)
        )
        msgs = msgs_result.scalars().all()
        for m in msgs:
            snippet = m.content[:100].strip()
            if snippet:
                recent_questions.append(snippet)

        # Pick up last recorded emotion from conversation metadata
        if conv.metadata_ and conv.metadata_.get("last_emotion"):
            last_emotion = conv.metadata_["last_emotion"]

        if conv.status == "active":
            has_unresolved = True

    # Days since last visit
    last_visit = past_convs[0].created_at
    now = datetime.now(timezone.utc)
    if last_visit.tzinfo is None:
        last_visit = last_visit.replace(tzinfo=timezone.utc)
    days_ago = (now - last_visit).days

    return {
        "is_returning": True,
        "visit_count": len(past_convs),
        "days_since_last_visit": days_ago,
        "visitor_name": past_convs[0].visitor_name,
        "last_emotion": last_emotion,
        "has_unresolved": has_unresolved,
        "recent_questions": recent_questions[:4],
    }


def build_visitor_prompt_snippet(profile: dict) -> Optional[str]:
    """
    Format a compact memory note to inject into the AI system prompt.
    Returns None for first-time visitors.
    """
    if not profile.get("is_returning"):
        return None

    lines: list[str] = []

    name_part = f" ({profile['visitor_name']})" if profile.get("visitor_name") else ""
    lines.append(
        f"VISITOR MEMORY: This is a returning visitor{name_part}. "
        f"They have chatted {profile['visit_count']} time(s) before."
    )

    if profile["days_since_last_visit"] == 0:
        lines.append("Their last visit was today.")
    elif profile["days_since_last_visit"] == 1:
        lines.append("Their last visit was yesterday.")
    else:
        lines.append(f"Their last visit was {profile['days_since_last_visit']} days ago.")

    if profile.get("recent_questions"):
        questions_text = "; ".join(f'"{q}"' for q in profile["recent_questions"])
        lines.append(f"Topics they previously asked about: {questions_text}.")

    if profile.get("last_emotion") in ("frustrated", "angry"):
        lines.append(
            "They were frustrated in a previous session — be extra patient and proactive."
        )

    if profile.get("has_unresolved"):
        lines.append(
            "They may have an unresolved issue from a previous conversation — check if they are following up."
        )

    lines.append(
        "Use this context to give a more personalised response. "
        "If they seem to be asking about the same topic as before, acknowledge continuity naturally."
    )

    return "\n".join(lines)
