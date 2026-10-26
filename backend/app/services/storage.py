"""Small persistence helpers shared by the CARETAI API routes."""

import json
import sqlite3
from datetime import datetime, timezone
from typing import Any


VISIT_JSON_FIELDS = {
    "reportedInformation",
    "quotes",
    "notMentioned",
    "review",
    "recommendations",
    "followup",
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def insert_visit(
    connection: sqlite3.Connection,
    values: dict[str, Any],
    *,
    intake_step: int = 0,
    completed: bool = False,
) -> dict[str, Any]:
    data = dict(values)
    for field in VISIT_JSON_FIELDS:
        value = data.get(field)
        data[field] = json.dumps(value, ensure_ascii=False) if value is not None else None
    data.update({"intake_step": intake_step, "completed": int(completed), "created_at": utc_now()})
    columns = list(data)
    placeholders = ", ".join("?" for _ in columns)
    quoted_columns = ", ".join(f'"{column}"' for column in columns)
    cursor = connection.execute(
        f"INSERT INTO visits ({quoted_columns}) VALUES ({placeholders})",
        [data[column] for column in columns],
    )
    return get_visit(connection, cursor.lastrowid)  # type: ignore[return-value]


def get_visit(connection: sqlite3.Connection, visit_id: int) -> dict[str, Any] | None:
    row = connection.execute("SELECT * FROM visits WHERE id = ?", (visit_id,)).fetchone()
    return visit_from_row(row) if row else None


def list_visits(connection: sqlite3.Connection) -> list[dict[str, Any]]:
    rows = connection.execute("SELECT * FROM visits ORDER BY id DESC").fetchall()
    return [visit_from_row(row) for row in rows]


def update_visit(connection: sqlite3.Connection, visit_id: int, values: dict[str, Any]) -> dict[str, Any] | None:
    data = dict(values)
    for field in VISIT_JSON_FIELDS:
        if field in data:
            data[field] = json.dumps(data[field], ensure_ascii=False) if data[field] is not None else None
    if data:
        assignments = ", ".join(f'"{column}" = ?' for column in data)
        connection.execute(
            f"UPDATE visits SET {assignments} WHERE id = ?",
            [*data.values(), visit_id],
        )
    return get_visit(connection, visit_id)


def insert_message(connection: sqlite3.Connection, visit_id: int, author: str, text: str) -> dict[str, Any]:
    cursor = connection.execute(
        "INSERT INTO messages (visit_id, author, text, created_at) VALUES (?, ?, ?, ?)",
        (visit_id, author, text, utc_now()),
    )
    row = connection.execute("SELECT * FROM messages WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return dict(row)


def list_messages(connection: sqlite3.Connection, visit_id: int | None = None) -> list[dict[str, Any]]:
    if visit_id is None:
        rows = connection.execute("SELECT * FROM messages ORDER BY id").fetchall()
    else:
        rows = connection.execute(
            "SELECT * FROM messages WHERE visit_id = ? ORDER BY id", (visit_id,)
        ).fetchall()
    return [dict(row) for row in rows]


def insert_report(connection: sqlite3.Connection, values: dict[str, Any]) -> dict[str, Any]:
    now = utc_now()
    cursor = connection.execute(
        """INSERT INTO reports (visit_id, report_name, status, summary, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (
            values["visit_id"],
            values["report_name"],
            values["status"],
            values.get("summary"),
            now,
            now,
        ),
    )
    row = connection.execute("SELECT * FROM reports WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return dict(row)


def get_report(connection: sqlite3.Connection, report_id: int) -> dict[str, Any] | None:
    row = connection.execute("SELECT * FROM reports WHERE id = ?", (report_id,)).fetchone()
    return dict(row) if row else None


def list_reports(
    connection: sqlite3.Connection,
    visit_id: int | None = None,
    status: str | None = None,
) -> list[dict[str, Any]]:
    query = "SELECT * FROM reports WHERE 1 = 1"
    parameters: list[Any] = []
    if visit_id is not None:
        query += " AND visit_id = ?"
        parameters.append(visit_id)
    if status is not None:
        query += " AND status = ?"
        parameters.append(status)
    query += " ORDER BY id DESC"
    rows = connection.execute(query, parameters).fetchall()
    return [dict(row) for row in rows]


def update_report(connection: sqlite3.Connection, report_id: int, values: dict[str, Any]) -> dict[str, Any] | None:
    data = dict(values)
    if data:
        data["updated_at"] = utc_now()
        assignments = ", ".join(f'"{column}" = ?' for column in data)
        connection.execute(
            f"UPDATE reports SET {assignments} WHERE id = ?",
            [*data.values(), report_id],
        )
    return get_report(connection, report_id)


def visit_from_row(row: sqlite3.Row) -> dict[str, Any]:
    data = dict(row)
    for field in VISIT_JSON_FIELDS:
        if data[field] is not None:
            data[field] = json.loads(data[field])
    data.pop("intake_step", None)
    data.pop("completed", None)
    data.pop("created_at", None)
    return data
