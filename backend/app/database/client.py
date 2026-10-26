"""SQLite storage for the local CARETAI demo backend.

The local database keeps the conversation and generated draft available across
server restarts. Set CARETAI_DB_PATH to choose a different database file.
"""

from contextlib import contextmanager
import os
from pathlib import Path
import sqlite3
from typing import Iterator


DEFAULT_DATABASE_PATH = Path(__file__).resolve().parents[2] / "data" / "caretai.sqlite3"


@contextmanager
def database_connection() -> Iterator[sqlite3.Connection]:
    """Yield an initialized SQLite connection and always close it."""
    configured_path = os.getenv("CARETAI_DB_PATH", "").strip()
    database_path = Path(configured_path) if configured_path else DEFAULT_DATABASE_PATH
    if str(database_path) != ":memory:":
        database_path.parent.mkdir(parents=True, exist_ok=True)

    connection = sqlite3.connect(str(database_path), timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS visits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                mode TEXT NOT NULL,
                language TEXT NOT NULL,
                status TEXT NOT NULL,
                duration TEXT,
                "mainConcern" TEXT NOT NULL,
                onset TEXT NOT NULL,
                pattern TEXT,
                "reportedInformation" TEXT NOT NULL DEFAULT '[]',
                quotes TEXT NOT NULL DEFAULT '[]',
                summary TEXT NOT NULL DEFAULT '',
                "notMentioned" TEXT NOT NULL DEFAULT '[]',
                review TEXT NOT NULL DEFAULT '{}',
                recommendations TEXT,
                followup TEXT,
                intake_step INTEGER NOT NULL DEFAULT 0,
                completed INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                visit_id INTEGER NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
                author TEXT NOT NULL,
                text TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS messages_visit_id_idx ON messages(visit_id, id);
            CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                visit_id INTEGER NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
                report_name TEXT NOT NULL,
                status TEXT NOT NULL,
                summary TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS reports_visit_id_idx ON reports(visit_id, id);
            """
        )
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()
