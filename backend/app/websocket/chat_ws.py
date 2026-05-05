import json
import uuid
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_factory
from app.models.api_key import ApiKey
from app.models.conversation import Conversation
from app.models.message import Message
from app.core.security import verify_password
from app.services.chat_service import get_ai_response
from app.services.escalation_service import create_escalation
from app.services.emotion_service import detect_emotion, is_negative
from app.websocket.manager import manager

router = APIRouter()


async def validate_api_key(api_key: str, db: AsyncSession) -> Optional[uuid.UUID]:
    """Validate API key and return tenant_id."""
    if not api_key or not api_key.startswith("rai_"):
        return None
    key_prefix = api_key[:12]
    result = await db.execute(
        select(ApiKey).where(ApiKey.key_prefix == key_prefix, ApiKey.is_active == True)
    )
    key_obj = result.scalar_one_or_none()
    if key_obj and verify_password(api_key, key_obj.key_hash):
        return key_obj.tenant_id
    return None


@router.websocket("/ws/chat/{conversation_id}")
async def chat_websocket(websocket: WebSocket, conversation_id: str):
    api_key = websocket.query_params.get("api_key", "")

    async with async_session_factory() as db:
        tenant_id = await validate_api_key(api_key, db)
        if not tenant_id:
            await websocket.close(code=4001, reason="Invalid API key")
            return

        # Verify conversation belongs to tenant
        result = await db.execute(
            select(Conversation).where(
                Conversation.id == uuid.UUID(conversation_id),
                Conversation.tenant_id == tenant_id,
            )
        )
        conversation = result.scalar_one_or_none()
        if not conversation:
            await websocket.close(code=4004, reason="Conversation not found")
            return

    await manager.connect_customer(conversation_id, websocket)

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
                continue

            if message.get("type") == "message":
                content = message.get("content", "").strip()
                if not content:
                    continue

                # Send typing indicator
                await manager.send_to_customer(
                    conversation_id, {"type": "typing", "role": "ai"}
                )

                try:
                    async with async_session_factory() as db:
                        # Reload conversation
                        result = await db.execute(
                            select(Conversation).where(Conversation.id == uuid.UUID(conversation_id))
                        )
                        conversation = result.scalar_one()

                        # Detect emotion on visitor message
                        emotion_result = detect_emotion(content)
                        emotion = emotion_result["emotion"]

                        # Track consecutive negative messages
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
                            tenant_id=conversation.tenant_id,
                            role="visitor",
                            content=content,
                            emotion=emotion,
                        )
                        db.add(visitor_msg)

                        if conversation.status == "escalated":
                            # Forward to agents
                            await manager.send_to_agents(
                                str(conversation.tenant_id),
                                {
                                    "type": "visitor_message",
                                    "conversation_id": conversation_id,
                                    "message": {
                                        "role": "visitor",
                                        "content": content,
                                    },
                                },
                            )
                        else:
                            # Get AI response (with emotion-aware tone)
                            ai_response = await get_ai_response(
                                db, conversation, content, emotion=emotion
                            )

                            ai_msg = Message(
                                conversation_id=conversation.id,
                                tenant_id=conversation.tenant_id,
                                role="ai",
                                content=ai_response["content"],
                                confidence_score=ai_response["confidence"],
                                sources=ai_response["sources"],
                                token_usage=ai_response.get("token_usage"),
                            )
                            db.add(ai_msg)

                            # Send AI response to customer
                            await manager.send_to_customer(
                                conversation_id,
                                {
                                    "type": "message",
                                    "role": "ai",
                                    "content": ai_response["content"],
                                    "id": str(ai_msg.id),
                                },
                            )

                            # Check for escalation — low confidence OR sustained frustration
                            should_escalate = (
                                ai_response["confidence"] < 0.4
                                or meta.get("consecutive_frustrated", 0) >= 2
                            )
                            if should_escalate:
                                reason = (
                                    "low_confidence"
                                    if ai_response["confidence"] < 0.4
                                    else "frustration_detected"
                                )
                                detail = (
                                    f"AI confidence: {ai_response['confidence']:.2f}"
                                    if reason == "low_confidence"
                                    else f"Customer sent {meta['consecutive_frustrated']} consecutive frustrated/angry messages"
                                )
                                await create_escalation(db, conversation, reason, detail)

                                escalation_msg = (
                                    "I'm connecting you with a human agent for better assistance."
                                    if reason == "low_confidence"
                                    else "I can hear that you're frustrated and I want to make sure you get the best help. Let me connect you with a human agent right away."
                                )
                                await manager.send_to_customer(
                                    conversation_id,
                                    {"type": "escalated", "message": escalation_msg},
                                )
                                await manager.send_to_agents(
                                    str(conversation.tenant_id),
                                    {
                                        "type": "new_escalation",
                                        "conversation_id": conversation_id,
                                        "reason": reason,
                                        "emotion": emotion,
                                    },
                                )

                        await db.commit()
                except Exception as e:
                    import traceback
                    traceback.print_exc()
                    await manager.send_to_customer(
                        conversation_id,
                        {
                            "type": "message",
                            "role": "ai",
                            "content": "Sorry, something went wrong. Please try again.",
                            "id": str(uuid.uuid4()),
                        },
                    )

    except WebSocketDisconnect:
        manager.disconnect_customer(conversation_id)
    except Exception:
        manager.disconnect_customer(conversation_id)
