import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class ConversationResponse(BaseModel):
    id: uuid.UUID
    visitor_id: Optional[str]
    visitor_name: Optional[str]
    visitor_email: Optional[str]
    status: str
    channel: str
    resolution_type: Optional[str]
    confidence_avg: Optional[float]
    started_at: datetime
    resolved_at: Optional[datetime]
    created_at: datetime
    email_subject: Optional[str] = None
    email_inbox_id: Optional[uuid.UUID] = None

    model_config = {"from_attributes": True}


class MessageResponse(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    confidence_score: Optional[float]
    emotion: Optional[str] = None
    sources: list
    created_at: datetime

    model_config = {"from_attributes": True}


class WidgetMessageRequest(BaseModel):
    content: str
    visitor_id: Optional[str] = None
    visitor_name: Optional[str] = None
    visitor_email: Optional[str] = None


class WidgetConversationStart(BaseModel):
    visitor_id: Optional[str] = None
    visitor_name: Optional[str] = None
    visitor_email: Optional[str] = None
