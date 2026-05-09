"""add email verification fields to users

Revision ID: a1b2c3d4e5f6
Revises: f1a2b3c4d5e6
Create Date: 2026-05-05 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'f1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    cols = [c['name'] for c in bind.execute(sa.text(
        "SELECT column_name AS name FROM information_schema.columns WHERE table_name='users'"
    )).mappings().all()]

    if 'is_email_verified' not in cols:
        # Existing users are considered verified so they aren't locked out
        op.add_column('users', sa.Column('is_email_verified', sa.Boolean(), nullable=False, server_default='true'))

    if 'email_verification_token' not in cols:
        op.add_column('users', sa.Column('email_verification_token', sa.String(255), nullable=True))
        op.create_index('ix_users_email_verification_token', 'users', ['email_verification_token'])

    if 'email_verification_expires_at' not in cols:
        op.add_column('users', sa.Column('email_verification_expires_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_index('ix_users_email_verification_token', table_name='users')
    op.drop_column('users', 'email_verification_expires_at')
    op.drop_column('users', 'email_verification_token')
    op.drop_column('users', 'is_email_verified')
