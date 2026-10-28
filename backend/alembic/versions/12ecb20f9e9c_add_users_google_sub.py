"""add users google_sub

Revision ID: 12ecb20f9e9c
Revises: eabdb79b7ed6
Create Date: 2026-10-28 06:42:35.341095

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '12ecb20f9e9c'
down_revision: Union[str, None] = 'eabdb79b7ed6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('google_sub', sa.String(), nullable=True))
    op.create_unique_constraint('uq_users_google_sub', 'users', ['google_sub'])


def downgrade() -> None:
    op.drop_constraint('uq_users_google_sub', 'users', type_='unique')
    op.drop_column('users', 'google_sub')
