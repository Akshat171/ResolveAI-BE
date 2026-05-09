import uuid
from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import NotFoundError
from app.dependencies import get_current_user
from app.models.canned_response import CannedResponse
from app.models.user import User

router = APIRouter(prefix="/canned-responses", tags=["canned-responses"])


class CannedResponseCreate(BaseModel):
    title: str
    shortcut: Optional[str] = None
    content: str


class CannedResponseUpdate(BaseModel):
    title: Optional[str] = None
    shortcut: Optional[str] = None
    content: Optional[str] = None


class CannedResponseOut(BaseModel):
    id: uuid.UUID
    title: str
    shortcut: Optional[str]
    content: str

    model_config = {"from_attributes": True}


@router.get("", response_model=list[CannedResponseOut])
async def list_canned_responses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CannedResponse)
        .where(CannedResponse.tenant_id == current_user.tenant_id)
        .order_by(CannedResponse.title)
    )
    return result.scalars().all()


@router.post("", response_model=CannedResponseOut)
async def create_canned_response(
    payload: CannedResponseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cr = CannedResponse(tenant_id=current_user.tenant_id, **payload.model_dump())
    db.add(cr)
    await db.commit()
    await db.refresh(cr)
    return cr


@router.patch("/{cr_id}", response_model=CannedResponseOut)
async def update_canned_response(
    cr_id: uuid.UUID,
    payload: CannedResponseUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CannedResponse).where(
            CannedResponse.id == cr_id,
            CannedResponse.tenant_id == current_user.tenant_id,
        )
    )
    cr = result.scalar_one_or_none()
    if not cr:
        raise NotFoundError("Canned response not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(cr, field, value)
    await db.commit()
    await db.refresh(cr)
    return cr


@router.delete("/{cr_id}")
async def delete_canned_response(
    cr_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CannedResponse).where(
            CannedResponse.id == cr_id,
            CannedResponse.tenant_id == current_user.tenant_id,
        )
    )
    cr = result.scalar_one_or_none()
    if not cr:
        raise NotFoundError("Canned response not found")
    await db.delete(cr)
    await db.commit()
    return {"detail": "Deleted"}
