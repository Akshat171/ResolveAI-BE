from __future__ import annotations

import json
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # conversation_id -> WebSocket (customer connections)
        self.customer_connections: dict[str, WebSocket] = {}
        # tenant_id -> list of WebSockets (agent connections)
        self.agent_connections: dict[str, list[WebSocket]] = {}

    async def connect_customer(self, conversation_id: str, websocket: WebSocket):
        await websocket.accept()
        self.customer_connections[conversation_id] = websocket

    async def connect_agent(self, tenant_id: str, websocket: WebSocket):
        await websocket.accept()
        if tenant_id not in self.agent_connections:
            self.agent_connections[tenant_id] = []
        self.agent_connections[tenant_id].append(websocket)

    def disconnect_customer(self, conversation_id: str):
        self.customer_connections.pop(conversation_id, None)

    def disconnect_agent(self, tenant_id: str, websocket: WebSocket):
        if tenant_id in self.agent_connections:
            self.agent_connections[tenant_id] = [
                ws for ws in self.agent_connections[tenant_id] if ws != websocket
            ]

    async def send_to_customer(self, conversation_id: str, message: dict):
        ws = self.customer_connections.get(conversation_id)
        if ws:
            await ws.send_text(json.dumps(message))

    async def send_to_agents(self, tenant_id: str, message: dict):
        agents = self.agent_connections.get(tenant_id, [])
        disconnected = []
        for ws in agents:
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                disconnected.append(ws)
        # Clean up disconnected agents
        for ws in disconnected:
            self.disconnect_agent(tenant_id, ws)


manager = ConnectionManager()
