from __future__ import annotations

import json
import re
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.openai_client import chat_completion
from app.dependencies import get_current_user
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.escalation import Escalation
from app.models.user import User

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/overview")
async def get_overview(
    days: int = Query(30, le=90),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    tenant_id = current_user.tenant_id

    # Total conversations
    total_result = await db.execute(
        select(func.count(Conversation.id)).where(
            Conversation.tenant_id == tenant_id,
            Conversation.created_at >= since,
        )
    )
    total_conversations = total_result.scalar() or 0

    # Resolved by AI
    ai_resolved = await db.execute(
        select(func.count(Conversation.id)).where(
            Conversation.tenant_id == tenant_id,
            Conversation.created_at >= since,
            Conversation.resolution_type == "ai_resolved",
        )
    )
    ai_resolved_count = ai_resolved.scalar() or 0

    # Escalated
    escalated = await db.execute(
        select(func.count(Escalation.id)).where(
            Escalation.tenant_id == tenant_id,
            Escalation.created_at >= since,
        )
    )
    escalation_count = escalated.scalar() or 0

    # Average confidence
    avg_conf = await db.execute(
        select(func.avg(Message.confidence_score)).where(
            Message.tenant_id == tenant_id,
            Message.role == "ai",
            Message.created_at >= since,
            Message.confidence_score.isnot(None),
        )
    )
    avg_confidence = avg_conf.scalar()

    resolution_rate = (ai_resolved_count / total_conversations * 100) if total_conversations > 0 else 0

    return {
        "total_conversations": total_conversations,
        "ai_resolved": ai_resolved_count,
        "escalations": escalation_count,
        "resolution_rate": round(resolution_rate, 1),
        "avg_confidence": round(avg_confidence, 2) if avg_confidence else None,
        "period_days": days,
    }


@router.get("/insights")
async def get_insights(
    days: int = Query(7, le=30),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    AI-generated weekly insight report.
    Analyses visitor questions, knowledge gaps, and escalations,
    then returns plain-English findings + actionable recommendations.
    """
    since = datetime.now(timezone.utc) - timedelta(days=days)
    tenant_id = current_user.tenant_id

    # All visitor messages in the period (cap at 150 for token budget)
    visitor_result = await db.execute(
        select(Message.content)
        .where(
            Message.tenant_id == tenant_id,
            Message.role == "visitor",
            Message.created_at >= since,
        )
        .order_by(Message.created_at.desc())
        .limit(150)
    )
    visitor_messages = visitor_result.scalars().all()

    # AI messages where confidence was low — these are the knowledge gaps
    gap_result = await db.execute(
        select(Message.content, Message.confidence_score)
        .where(
            Message.tenant_id == tenant_id,
            Message.role == "ai",
            Message.created_at >= since,
            Message.confidence_score < 0.4,
            Message.confidence_score.isnot(None),
        )
        .limit(50)
    )
    gap_rows = gap_result.fetchall()

    # Escalation count for the period
    esc_result = await db.execute(
        select(func.count(Escalation.id)).where(
            Escalation.tenant_id == tenant_id,
            Escalation.created_at >= since,
        )
    )
    escalation_count = esc_result.scalar() or 0

    total_questions = len(visitor_messages)
    total_gaps = len(gap_rows)

    # Not enough data yet — return early without calling OpenAI
    if total_questions == 0:
        return {
            "period_days": days,
            "total_questions": 0,
            "content_gaps": 0,
            "escalations": escalation_count,
            "summary": "No conversations yet this period. Once customers start chatting, insights will appear here.",
            "top_topics": [],
            "gap_examples": [],
            "recommendations": [],
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }

    questions_block = "\n".join(f"- {m}" for m in visitor_messages[:100])
    gaps_block = (
        "\n".join(f"- {row.content[:120]}" for row in gap_rows[:20])
        if gap_rows
        else "None identified."
    )

    prompt = f"""You are analysing {total_questions} customer support questions sent over the last {days} days.

CUSTOMER QUESTIONS:
{questions_block}

QUESTIONS THE AI COULD NOT ANSWER WELL (knowledge gaps — add these to the knowledge base):
{gaps_block}

Return ONLY valid JSON matching this exact schema — no markdown, no extra text:
{{
  "summary": "2–3 sentence plain-English summary of what customers needed this period and the overall support health",
  "top_topics": [
    {{"topic": "short topic label", "count": <estimated_integer>, "example": "verbatim or near-verbatim example question"}}
  ],
  "gap_examples": [
    {{"question": "the unanswered question", "fix": "one sentence describing what content to add to the knowledge base"}}
  ],
  "recommendations": [
    "<specific, actionable recommendation for the business owner>"
  ]
}}

Rules:
- top_topics: up to 5 entries, sorted by count descending
- gap_examples: up to 3 entries, only real gaps where customers clearly needed an answer
- recommendations: exactly 3 entries, each starting with a verb (e.g. "Add a FAQ entry about…", "Update your return policy page…")
- Be concrete. Do not give generic advice."""

    result = await chat_completion(
        [{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=900,
    )

    # Parse the JSON response — strip markdown fences if present
    raw = result["content"].strip()
    json_match = re.search(r"\{.*\}", raw, re.DOTALL)
    try:
        ai_data = json.loads(json_match.group() if json_match else raw)
    except (json.JSONDecodeError, AttributeError):
        ai_data = {
            "summary": raw,
            "top_topics": [],
            "gap_examples": [],
            "recommendations": [],
        }

    return {
        "period_days": days,
        "total_questions": total_questions,
        "content_gaps": total_gaps,
        "escalations": escalation_count,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        **ai_data,
    }
