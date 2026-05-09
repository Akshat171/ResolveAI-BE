import uuid
from typing import Optional
from pydantic import BaseModel


class WhatsAppInboxCreate(BaseModel):
    display_name: str
    phone_number: str
    phone_number_id: str
    business_account_id: str
    access_token: str
    verify_token: str


class WhatsAppInboxUpdate(BaseModel):
    display_name: Optional[str] = None
    access_token: Optional[str] = None
    verify_token: Optional[str] = None
    is_active: Optional[bool] = None


class WhatsAppInboxResponse(BaseModel):
    id: uuid.UUID
    display_name: str
    phone_number: str
    phone_number_id: str
    business_account_id: str
    verify_token: str
    is_active: bool

    model_config = {"from_attributes": True}


class WhatsAppReplyRequest(BaseModel):
    content: str
