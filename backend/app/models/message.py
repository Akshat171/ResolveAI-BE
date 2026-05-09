import uuid
from typing import Optional

from sqlalchemy import String, Text, Float, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Message(BaseModel):
    __tablename__ = "messages"

    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), index=True
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), index=True
    )
    role: Mapped[str] = mapped_column(String(50))
    content: Mapped[str] = mapped_column(Text)
    confidence_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    emotion: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    sources: Mapped[list] = mapped_column(JSON, default=list)
    token_usage: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    email_message_id: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, index=True)

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
