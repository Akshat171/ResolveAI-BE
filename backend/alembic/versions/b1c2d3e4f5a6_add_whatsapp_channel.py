"""add whatsapp channel

Revision ID: b1c2d3e4f5a6
Revises: a1b2c3d4e5f6
Create Date: 2026-05-05 17:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = 'b1c2d3e4f5a6'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()

    if not bind.dialect.has_table(bind, 'whatsapp_inboxes'):
        op.create_table(
            'whatsapp_inboxes',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
            sa.Column('display_name', sa.String(255), nullable=False),
            sa.Column('phone_number', sa.String(20), nullable=False),
            sa.Column('phone_number_id', sa.String(255), nullable=False),
            sa.Column('business_account_id', sa.String(255), nullable=False),
            sa.Column('access_token', sa.String(1000), nullable=False),
            sa.Column('verify_token', sa.String(255), nullable=False),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        )

    op.create_index('ix_whatsapp_inboxes_tenant_id', 'whatsapp_inboxes', ['tenant_id'], if_not_exists=True)
    op.create_index('ix_whatsapp_inboxes_phone_number_id', 'whatsapp_inboxes', ['phone_number_id'], if_not_exists=True)

    cols = [c['name'] for c in bind.execute(sa.text(
        "SELECT column_name AS name FROM information_schema.columns WHERE table_name='conversations'"
    )).mappings().all()]

    if 'whatsapp_inbox_id' not in cols:
        op.add_column('conversations', sa.Column(
            'whatsapp_inbox_id',
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey('whatsapp_inboxes.id', ondelete='SET NULL'),
            nullable=True,
        ))


def downgrade() -> None:
    op.drop_column('conversations', 'whatsapp_inbox_id')
    op.drop_index('ix_whatsapp_inboxes_phone_number_id', table_name='whatsapp_inboxes')
    op.drop_index('ix_whatsapp_inboxes_tenant_id', table_name='whatsapp_inboxes')
    op.drop_table('whatsapp_inboxes')
