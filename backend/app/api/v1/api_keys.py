import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import NotFoundError
from app.core.security import generate_api_key
from app.dependencies import get_current_user
from app.models.api_key import ApiKey
from app.models.user import User

router = APIRouter(prefix="/api-keys", tags=["api-keys"])


@router.get("")
async def list_api_keys(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ApiKey)
        .where(ApiKey.tenant_id == current_user.tenant_id, ApiKey.is_active == True)
        .order_by(ApiKey.created_at.desc())
    )
    keys = result.scalars().all()
    return [
        {
            "id": str(k.id),
            "name": k.name,
            "key_prefix": k.key_prefix,
            "scopes": k.scopes,
            "created_at": k.created_at.isoformat(),
            "last_used_at": k.last_used_at.isoformat() if k.last_used_at else None,
        }
        for k in keys
    ]


@router.post("")
async def create_api_key_endpoint(
    name: str = "Default",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    full_key, key_prefix, key_hash = generate_api_key()

    api_key = ApiKey(
        tenant_id=current_user.tenant_id,
        key_hash=key_hash,
        key_prefix=key_prefix,
        name=name,
        scopes=["widget", "api"],
    )
    db.add(api_key)
    await db.flush()

    return {
        "id": str(api_key.id),
        "key": full_key,  # Only shown once!
        "key_prefix": key_prefix,
        "name": name,
        "message": "Save this key — it won't be shown again.",
    }


@router.delete("/{key_id}")
async def revoke_api_key(
    key_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ApiKey).where(
            ApiKey.id == key_id,
            ApiKey.tenant_id == current_user.tenant_id,
        )
    )
    key = result.scalar_one_or_none()
    if not key:
        raise NotFoundError("API key not found")
    key.is_active = False
    return {"detail": "API key revoked"}
