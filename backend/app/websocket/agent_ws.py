import json
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_factory
from app.core.security import decode_token
from app.models.user import User
from app.models.message import Message
from app.models.conversation import Conversation
from app.websocket.manager import manager

router = APIRouter()


@router.websocket("/ws/agent")
async def agent_websocket(websocket: WebSocket):
    token = websocket.query_params.get("token", "")
    payload = decode_token(token)

    if not payload or payload.get("type") != "access":
        await websocket.close(code=4001, reason="Invalid token")
        return

    tenant_id = payload.get("tenant_id")
    user_id = payload.get("sub")

    if not tenant_id or not user_id:
        await websocket.close(code=4001, reason="Invalid token")
        return

    await manager.connect_agent(tenant_id, websocket)

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message.get("type") == "message":
                conversation_id = message.get("conversation_id")
                content = message.get("content", "").strip()
                if not conversation_id or not content:
                    continue

                async with async_session_factory() as db:
                    # Save agent message
                    agent_msg = Message(
                        conversation_id=uuid.UUID(conversation_id),
                        tenant_id=uuid.UUID(tenant_id),
                        role="agent",
                        content=content,
                    )
                    db.add(agent_msg)
                    await db.commit()

                # Forward to customer
                await manager.send_to_customer(
                    conversation_id,
                    {
                        "type": "message",
                        "role": "agent",
                        "content": content,
                        "id": str(agent_msg.id),
                    },
                )

            elif message.get("type") == "typing":
                conversation_id = message.get("conversation_id")
                if conversation_id:
                    await manager.send_to_customer(
                        conversation_id,
                        {"type": "typing", "role": "agent"},
                    )

            elif message.get("type") == "resolve":
                conversation_id = message.get("conversation_id")
                if conversation_id:
                    async with async_session_factory() as db:
                        result = await db.execute(
                            select(Conversation).where(
                                Conversation.id == uuid.UUID(conversation_id)
                            )
                        )
                        conv = result.scalar_one_or_none()
                        if conv:
                            from datetime import datetime, timezone
                            conv.status = "resolved"
                            conv.resolved_at = datetime.now(timezone.utc)
                            conv.resolution_type = "human_resolved"
                            await db.commit()

                    await manager.send_to_customer(
                        conversation_id,
                        {"type": "resolved"},
                    )

    except WebSocketDisconnect:
        manager.disconnect_agent(tenant_id, websocket)
    except Exception:
        manager.disconnect_agent(tenant_id, websocket)
