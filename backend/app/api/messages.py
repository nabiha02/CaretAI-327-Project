"""API routes for saved patient, caregiver, and assistant messages."""

from typing import List
from fastapi import APIRouter, HTTPException

from app.database.client import database_connection
from app.schemas.message import MessageCreate, MessageResponse, MessageListItem
from app.services.storage import get_visit, insert_message, list_messages

router = APIRouter(prefix="/messages", tags=["messages"])


@router.post("/", response_model=MessageResponse, status_code=201)
def create_message(message: MessageCreate):
    """Create a message associated with an existing visit."""
    try:
        with database_connection() as connection:
            if get_visit(connection, message.visit_id) is None:
                raise HTTPException(status_code=404, detail="Visit not found")
            return insert_message(connection, message.visit_id, message.author, message.text)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Could not save the message") from exc


@router.get("/", response_model=List[MessageListItem])
def list_saved_messages(visit_id: int | None = None):
    """List messages, optionally filtered by visit ID."""
    try:
        with database_connection() as connection:
            if visit_id is not None and get_visit(connection, visit_id) is None:
                raise HTTPException(status_code=404, detail="Visit not found")
            return list_messages(connection, visit_id)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Could not load messages") from exc
