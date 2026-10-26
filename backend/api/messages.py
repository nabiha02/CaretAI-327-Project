"""API routes for patient messages."""

from fastapi import APIRouter, HTTPException
from typing import List

from app.schemas.message import MessageCreate, MessageResponse, MessageListItem
from app.database.client import get_supabase_client

router = APIRouter(prefix="/messages", tags=["messages"])


@router.post("/", response_model=MessageResponse, status_code=201)
def create_message(message: MessageCreate):
    """Create a new message associated with a visit."""
    supabase = get_supabase_client()
    try:
        data = message.model_dump()
        result = supabase.table("messages").insert(data).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create message")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/", response_model=List[MessageListItem])
def list_messages(visit_id: int | None = None):
    """List messages, optionally filtered by visit ID."""
    supabase = get_supabase_client()
    try:
        query = supabase.table("messages").select("*")
        if visit_id is not None:
            query = query.eq("visit_id", visit_id)
        result = query.execute()
        return result.data or []
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))