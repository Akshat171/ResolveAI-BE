import uuid
from typing import Optional
from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel


class WhatsAppInbox(BaseModel):
    __tablename__ = "whatsapp_inboxes"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), index=True
    )
    display_name: Mapped[str] = mapped_column(String(255))          # e.g. "Support WhatsApp"
    phone_number: Mapped[str] = mapped_column(String(20))           # e.g. "+1234567890"
    phone_number_id: Mapped[str] = mapped_column(String(255), index=True)  # Meta phone number ID
    business_account_id: Mapped[str] = mapped_column(String(255))   # WhatsApp Business Account ID
    access_token: Mapped[str] = mapped_column(String(1000))         # Meta permanent access token
    verify_token: Mapped[str] = mapped_column(String(255))          # Webhook verify token (user sets)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    tenant = relationship("Tenant", back_populates="whatsapp_inboxes")
