"""Patient conversation endpoints that save an evidence-preserving draft."""

from fastapi import APIRouter, HTTPException

from app.database.client import database_connection
from app.schemas.conversation import ConversationMessageCreate, ConversationStart
from app.services.conversation import (
    QUESTIONS,
    record_patient_message,
    save_draft_report,
    start_conversation,
)
from app.services.storage import get_visit, list_messages

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.post("", status_code=201)
def create_conversation(request: ConversationStart):
    """Start a patient/caregiver intake and return its first question."""
    with database_connection() as connection:
        return start_conversation(
            connection,
            main_concern=request.main_concern,
            mode=request.mode,
            language=request.language,
            reporter=request.reporter,
        )


@router.get("/{visit_id}")
def get_conversation(visit_id: int):
    """Retrieve a saved visit and its complete message transcript."""
    with database_connection() as connection:
        visit = get_visit(connection, visit_id)
        if visit is None:
            raise HTTPException(status_code=404, detail="Conversation not found")
        state = connection.execute(
            "SELECT intake_step FROM visits WHERE id = ?", (visit_id,)
        ).fetchone()
        return {
            "visit": visit,
            "messages": list_messages(connection, visit_id),
            "progress": {
                "answered": min(state["intake_step"], len(QUESTIONS)),
                "total": len(QUESTIONS),
            },
        }


@router.post("/{visit_id}/messages")
def add_patient_message(visit_id: int, request: ConversationMessageCreate):
    """Save a patient/caregiver reply and advance the structured intake."""
    with database_connection() as connection:
        result = record_patient_message(connection, visit_id, request.text)
        if result is None:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return result


@router.post("/{visit_id}/draft-report", status_code=201)
def create_or_refresh_draft_report(visit_id: int):
    """Save a doctor-review draft, even when the intake is incomplete."""
    with database_connection() as connection:
        visit = get_visit(connection, visit_id)
        if visit is None:
            raise HTTPException(status_code=404, detail="Conversation not found")
        messages = list_messages(connection, visit_id)
        report = save_draft_report(connection, visit, messages)
        return {"report": report, "visit": get_visit(connection, visit_id)}
