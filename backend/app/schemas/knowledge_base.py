import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class KnowledgeBaseCreate(BaseModel):
    name: str
    description: Optional[str] = None


class KnowledgeBaseResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class KnowledgeItemResponse(BaseModel):
    id: uuid.UUID
    source_type: str
    source_url: Optional[str]
    title: Optional[str]
    status: str
    chunk_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class TextIngestionRequest(BaseModel):
    title: str
    content: str
    source_type: str = "text"


class UrlCrawlRequest(BaseModel):
    urls: List[str]
    max_depth: int = 1
