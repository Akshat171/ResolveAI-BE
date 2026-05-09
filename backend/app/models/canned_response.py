import uuid
from typing import Optional
from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel


class CannedResponse(BaseModel):
    __tablename__ = "canned_responses"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(255))       # e.g. "Greeting"
    shortcut: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # e.g. "/hi"
    content: Mapped[str] = mapped_column(Text)            # the actual message text

    tenant = relationship("Tenant", back_populates="canned_responses")
