"""add email channel

Revision ID: e3f1a2b4c5d6
Revises: 84cedba7a50a
Create Date: 2026-05-04 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'e3f1a2b4c5d6'
down_revision: Union[str, None] = '84cedba7a50a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()

    # Create email_inboxes table (skip if already exists from a partial run)
    if not bind.dialect.has_table(bind, 'email_inboxes'):
        op.create_table(
            'email_inboxes',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
            sa.Column('name', sa.String(255), nullable=False),
            sa.Column('email', sa.String(255), nullable=False),
            sa.Column('imap_host', sa.String(255), nullable=False),
            sa.Column('imap_port', sa.Integer(), nullable=False, server_default='993'),
            sa.Column('imap_username', sa.String(255), nullable=False),
            sa.Column('imap_password', sa.String(500), nullable=False),
            sa.Column('imap_use_ssl', sa.Boolean(), nullable=False, server_default='true'),
            sa.Column('smtp_host', sa.String(255), nullable=False),
            sa.Column('smtp_port', sa.Integer(), nullable=False, server_default='587'),
            sa.Column('smtp_username', sa.String(255), nullable=False),
            sa.Column('smtp_password', sa.String(500), nullable=False),
            sa.Column('smtp_use_tls', sa.Boolean(), nullable=False, server_default='true'),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
            sa.Column('last_checked_at', sa.DateTime(timezone=True), nullable=True),
        )

    op.create_index('ix_email_inboxes_tenant_id', 'email_inboxes', ['tenant_id'], if_not_exists=True)

    # Add email columns to conversations (skip if already present)
    cols = [c['name'] for c in bind.execute(sa.text(
        "SELECT column_name AS name FROM information_schema.columns WHERE table_name='conversations'"
    )).mappings().all()]

    if 'email_inbox_id' not in cols:
        op.add_column('conversations', sa.Column(
            'email_inbox_id',
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey('email_inboxes.id', ondelete='SET NULL'),
            nullable=True,
        ))
    if 'email_subject' not in cols:
        op.add_column('conversations', sa.Column(
            'email_subject',
            sa.String(500),
            nullable=True,
        ))


def downgrade() -> None:
    op.drop_column('conversations', 'email_subject')
    op.drop_column('conversations', 'email_inbox_id')
    op.drop_index('ix_email_inboxes_tenant_id', table_name='email_inboxes')
    op.drop_table('email_inboxes')
