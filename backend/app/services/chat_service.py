import re

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.openai_client import chat_completion
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.tenant import Tenant
from app.services.rag_service import retrieve_relevant_chunks

CONFIDENCE_MAP = {"high": 0.9, "medium": 0.6, "low": 0.3}
ESCALATION_KEYWORDS = [
    "speak to a human",
    "talk to a person",
    "real person",
    "human agent",
    "speak to someone",
    "talk to someone",
    "refund",
    "cancel my",
    "legal",
    "lawyer",
    "sue",
]


def _should_auto_escalate(visitor_message: str) -> bool:
    """Check if the visitor's message should trigger auto-escalation."""
    lower = visitor_message.lower()
    return any(keyword in lower for keyword in ESCALATION_KEYWORDS)


async def get_ai_response(
    db: AsyncSession,
    conversation: Conversation,
    visitor_message: str,
    emotion: str = "calm",
) -> dict:
    """Generate an AI response using RAG + OpenAI."""

    # Check for auto-escalation keywords
    if _should_auto_escalate(visitor_message):
        return {
            "content": "I understand you'd like to speak with a human agent. Let me connect you with someone from our team who can help.",
            "confidence": 0.2,
            "sources": [],
            "token_usage": None,
        }

    # Get tenant info
    tenant_result = await db.execute(
        select(Tenant).where(Tenant.id == conversation.tenant_id)
    )
    tenant = tenant_result.scalar_one()

    # Build visitor memory snippet (only for returning visitors, no extra LLM call)
    visitor_memory = ""
    if conversation.visitor_id:
        from app.services.visitor_service import get_visitor_profile, build_visitor_prompt_snippet
        profile = await get_visitor_profile(
            db,
            tenant_id=conversation.tenant_id,
            visitor_id=conversation.visitor_id,
            exclude_conversation_id=conversation.id,
        )
        snippet = build_visitor_prompt_snippet(profile)
        if snippet:
            visitor_memory = f"\n\n{snippet}"

    # Retrieve relevant chunks
    chunks = await retrieve_relevant_chunks(
        tenant_id=str(conversation.tenant_id),
        query=visitor_message,
    )

    # Get conversation history (last 10 messages)
    history_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.desc())
        .limit(10)
    )
    history_messages = list(reversed(history_result.scalars().all()))

    # Build the prompt
    context_text = "\n---\n".join([c["content"] for c in chunks]) if chunks else "No relevant information found in the knowledge base."

    empathy_note = ""
    if emotion == "angry":
        empathy_note = "\n\nEMOTION ALERT: The customer is clearly angry and upset. Start by sincerely apologising for their experience. Use a warm, calm, understanding tone. Prioritise a fast resolution over completeness."
    elif emotion == "frustrated":
        empathy_note = "\n\nEMOTION ALERT: The customer is frustrated. Acknowledge their frustration briefly, then get straight to a helpful answer. Keep the tone empathetic and avoid sounding robotic."

    system_prompt = f"""You are a customer support agent for {tenant.name}. You ONLY answer questions related to {tenant.name} and its products/services.{empathy_note}{visitor_memory}

STRICT RULES:
1. ONLY use the provided context to answer. Never use your general knowledge.
2. If the question is NOT related to {tenant.name} or its products/services (e.g. general knowledge questions, coding help, math, weather, news, personal advice), politely decline and say you can only help with {tenant.name}-related questions.
3. If the question IS related but the context doesn't contain the answer, say you don't have that information and offer to connect them with a human agent.
4. Do NOT make up information. Do NOT guess. Do NOT answer from general knowledge.
5. Do not reference the context directly (don't say "according to the documents"). Respond naturally.

## Context:
{context_text}

IMPORTANT: After your answer, on a NEW line, output exactly: CONFIDENCE: high, CONFIDENCE: medium, or CONFIDENCE: low
- high: The context clearly answers the question
- medium: The context partially answers the question
- low: The question is off-topic OR the context does not answer it"""

    messages = [{"role": "system", "content": system_prompt}]

    # Add conversation history
    for msg in history_messages:
        role = "user" if msg.role == "visitor" else "assistant"
        messages.append({"role": role, "content": msg.content})

    # Add current message
    messages.append({"role": "user", "content": visitor_message})

    # Get completion
    result = await chat_completion(messages)

    # Parse confidence from response
    content = result["content"]
    confidence_score = 0.6  # default medium

    confidence_match = re.search(r"CONFIDENCE:\s*(high|medium|low)", content, re.IGNORECASE)
    if confidence_match:
        confidence_label = confidence_match.group(1).lower()
        confidence_score = CONFIDENCE_MAP.get(confidence_label, 0.6)
        # Remove the confidence line from the response
        content = re.sub(r"\n?CONFIDENCE:\s*(high|medium|low)\s*$", "", content, flags=re.IGNORECASE).strip()

    # Factor in retrieval quality
    if chunks:
        best_similarity = max(c["similarity"] for c in chunks)
        if best_similarity < 0.35:
            confidence_score = min(confidence_score, 0.4)
    else:
        confidence_score = min(confidence_score, 0.3)

    sources = [
        {
            "title": c["metadata"].get("title", ""),
            "similarity": round(c["similarity"], 3),
        }
        for c in chunks[:3]
    ]

    return {
        "content": content,
        "confidence": round(confidence_score, 2),
        "sources": sources,
        "token_usage": result["usage"],
    }
