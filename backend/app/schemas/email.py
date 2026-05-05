import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class EmailInboxCreate(BaseModel):
    name: str
    email: str
    imap_host: str
    imap_port: int = 993
    imap_username: str
    imap_password: str
    imap_use_ssl: bool = True
    smtp_host: str
    smtp_port: int = 587
    smtp_username: str
    smtp_password: str
    smtp_use_tls: bool = True


class EmailInboxUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None
    imap_password: Optional[str] = None
    smtp_password: Optional[str] = None


class EmailInboxResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    imap_host: str
    imap_port: int
    imap_username: str
    imap_use_ssl: bool
    smtp_host: str
    smtp_port: int
    smtp_username: str
    smtp_use_tls: bool
    is_active: bool
    last_checked_at: Optional[datetime]
    created_at: datetime
    model_config = {"from_attributes": True}


class EmailReplyRequest(BaseModel):
    content: str  # plain text reply body
