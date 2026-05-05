import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.v1.router import api_router
from app.websocket.chat_ws import router as chat_ws_router
from app.websocket.agent_ws import router as agent_ws_router


async def _email_poller_loop():
    """Polls all email inboxes every 60 seconds."""
    from app.services.email_service import poll_all_inboxes
    while True:
        try:
            await poll_all_inboxes()
        except Exception as e:
            import structlog
            structlog.get_logger().error("email_poller_error", error=str(e))
        await asyncio.sleep(60)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(_email_poller_loop())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="ResolvAI",
    description="AI-powered customer support agent",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(api_router)

# WebSocket routes
app.include_router(chat_ws_router)
app.include_router(agent_ws_router)
