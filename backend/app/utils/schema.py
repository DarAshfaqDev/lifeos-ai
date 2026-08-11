from sqlalchemy import text
from sqlalchemy.engine import Engine
import logging

logger = logging.getLogger(__name__)

# Columns that may be missing on already-created databases (pre-feature).
# Kept idempotent so startup never fails on existing data.
_ADD_COLUMN_STATEMENTS = [
    ("users", "is_guest", "BOOLEAN DEFAULT 0"),
    ("tasks", "postponed_count", "INTEGER DEFAULT 0"),
]


def ensure_schema(engine: Engine) -> None:
    """Add any missing columns to existing databases.

    Fresh databases get the full schema from Base.metadata.create_all.
    Existing databases (created before a model change) need ALTER TABLE.
    """
    dialect = engine.dialect.name
    if dialect == "sqlite":
        _ensure_sqlite(engine)
    elif dialect == "postgresql":
        _ensure_postgres(engine)


def _ensure_sqlite(engine: Engine) -> None:
    def column_exists(table: str, column: str) -> bool:
        with engine.connect() as conn:
            rows = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
        return any(str(row[1]) == column for row in rows)

    for table, column, definition in _ADD_COLUMN_STATEMENTS:
        try:
            if column_exists(table, column):
                continue
            with engine.begin() as conn:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {definition}"))
            logger.info("Added missing column %s.%s", table, column)
        except Exception as e:  # noqa: BLE001
            logger.warning("Could not ensure column %s.%s: %s", table, column, e)


def _ensure_postgres(engine: Engine) -> None:
    for table, column, definition in _ADD_COLUMN_STATEMENTS:
        try:
            with engine.begin() as conn:
                conn.execute(
                    text(
                        f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {column} {definition}"
                    )
                )
            logger.info("Ensured column %s.%s", table, column)
        except Exception as e:  # noqa: BLE001
            logger.warning("Could not ensure column %s.%s: %s", table, column, e)
