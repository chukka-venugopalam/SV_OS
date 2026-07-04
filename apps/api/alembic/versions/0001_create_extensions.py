"""Create PostgreSQL extensions.

Revision ID: 0001
Revises: None
Create Date: 2026-07-01

Enabled extensions:

- ``uuid-ossp`` — UUID generation functions (gen_random_uuid).
  Required by every table's primary key default.

- ``pgcrypto`` — Cryptographic functions (gen_random_uuid is
  re-exported from pgcrypto in PG 13+; we enable it explicitly
  for any future hashing or encryption needs).

- ``pg_trgm`` — Trigram-based text similarity for fuzzy search
  on knowledge_nodes.title and knowledge_nodes.description.

- ``unaccent`` — Accent-removal text dictionary, used in
  conjunction with full-text search to normalise accented
  characters.

- ``btree_gin`` — GIN operator class for B-tree compatible
  types, enabling composite GIN indexes (e.g. for full-text
  + category filtering in a single index).

- ``btree_gist`` — GiST operator class for B-tree compatible
  types, enabling exclusion constraints and GiST indexes over
  range + scalar columns (future use for scheduling).

Rationale for each extension is documented above. Only
extensions that provide measurable value to the current schema
are enabled.
"""

from typing import Sequence, Union

from alembic import op

revision: str = '0001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── uuid-ossp ─────────────────────────────────────────────────
    # Required for gen_random_uuid() — used as DEFAULT on all 20
    # table primary keys. Available by default in PostgreSQL 13+ but
    # explicitly enabled for clarity and backward compatibility.
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    # ── pgcrypto ──────────────────────────────────────────────────
    # Provides gen_random_uuid() (re-exported from uuid-ossp in PG
    # 13+), plus cryptographic hash functions (digest, hmac) and
    # pgp_sym_encrypt/pgp_pub_encrypt for future encryption needs.
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

    # ── pg_trgm ───────────────────────────────────────────────────
    # Enables similarity() and show_trgm() functions for fuzzy text
    # matching. Powers "did you mean?" suggestions and typo-tolerant
    # search on knowledge_nodes.title and knowledge_nodes.description.
    op.execute('CREATE EXTENSION IF NOT EXISTS "pg_trgm"')

    # ── unaccent ──────────────────────────────────────────────────
    # Provides the unaccent() text search dictionary, registered as
    # a full-text search configuration dictionary. Normalises accented
    # characters (é → e, ñ → n) so searches match regardless of
    # accent usage.
    op.execute('CREATE EXTENSION IF NOT EXISTS "unaccent"')

    # ── btree_gin ─────────────────────────────────────────────────
    # Allows creating GIN indexes on scalar columns (int, text, uuid).
    # Enables composite GIN indexes like (search_vector, node_type)
    # that support full-text search + category filtering in one index.
    op.execute('CREATE EXTENSION IF NOT EXISTS "btree_gin"')

    # ── btree_gist ────────────────────────────────────────────────
    # Allows creating GiST indexes on scalar columns. Enables
    # exclusion constraints for overlapping ranges. Enabled now for
    # future scheduling/availability features.
    op.execute('CREATE EXTENSION IF NOT EXISTS "btree_gist"')


def downgrade() -> None:
    # ── Extensions are dropped in reverse dependency order ────────
    # btree_gin and btree_gist depend on the index infrastructure;
    # unaccent depends on pg_trgm for certain operations.
    op.execute('DROP EXTENSION IF EXISTS "btree_gist"')
    op.execute('DROP EXTENSION IF EXISTS "btree_gin"')
    op.execute('DROP EXTENSION IF EXISTS "unaccent"')
    op.execute('DROP EXTENSION IF EXISTS "pg_trgm"')
    op.execute('DROP EXTENSION IF EXISTS "pgcrypto"')
    op.execute('DROP EXTENSION IF EXISTS "uuid-ossp"')
