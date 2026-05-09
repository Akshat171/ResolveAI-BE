"""add email_message_id to messages

Revision ID: f1a2b3c4d5e6
Revises: e3f1a2b4c5d6
Create Date: 2026-05-05 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, None] = 'e3f1a2b4c5d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    cols = [c['name'] for c in bind.execute(sa.text(
        "SELECT column_name AS name FROM information_schema.columns WHERE table_name='messages'"
    )).mappings().all()]

    if 'email_message_id' not in cols:
        op.add_column('messages', sa.Column('email_message_id', sa.String(500), nullable=True))
        op.create_index('ix_messages_email_message_id', 'messages', ['email_message_id'])


def downgrade() -> None:
    op.drop_index('ix_messages_email_message_id', table_name='messages')
    op.drop_column('messages', 'email_message_id')
