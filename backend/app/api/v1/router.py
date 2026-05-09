from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.tenants import router as tenants_router
from app.api.v1.knowledge_bases import router as kb_router
from app.api.v1.conversations import router as conversations_router
from app.api.v1.widget import router as widget_router
from app.api.v1.escalations import router as escalations_router
from app.api.v1.api_keys import router as api_keys_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.health import router as health_router
from app.api.v1.email import router as email_router
from app.api.v1.whatsapp import router as whatsapp_router
from app.api.v1.canned_responses import router as canned_responses_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(tenants_router)
api_router.include_router(kb_router)
api_router.include_router(conversations_router)
api_router.include_router(widget_router)
api_router.include_router(escalations_router)
api_router.include_router(api_keys_router)
api_router.include_router(analytics_router)
api_router.include_router(health_router)
api_router.include_router(email_router)
api_router.include_router(whatsapp_router)
api_router.include_router(canned_responses_router)
