"""initial

Revision ID: 001
Revises: 
Create Date: 2026-04-14 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        'signals',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('direction', sa.String(), nullable=False),
        sa.Column('mode', sa.String(), nullable=False),
        sa.Column('zone', sa.String(), nullable=False),
        sa.Column('total_score', sa.Integer(), nullable=False),
        sa.Column('entry_low', sa.Float(), nullable=False),
        sa.Column('entry_high', sa.Float(), nullable=False),
        sa.Column('stop_loss', sa.Float(), nullable=False),
        sa.Column('tp1', sa.Float(), nullable=False),
        sa.Column('tp2', sa.Float(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='PENDING'),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade() -> None:
    op.drop_table('signals')
