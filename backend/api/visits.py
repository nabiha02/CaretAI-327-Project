"""API routes for patient visits."""

from fastapi import APIRouter, HTTPException, Depends
from typing import List

from app.schemas.visit import VisitCreate, VisitResponse, VisitListItem
from app.database.client import get_supabase_client

router = APIRouter(prefix="/visits", tags=["visits"])


@router.post("/", response_model=VisitResponse, status_code=201)
def create_visit(visit: VisitCreate):
    """Create a new patient visit record."""
    supabase = get_supabase_client()
    try:
        data = visit.model_dump()
        result = supabase.table("visits").insert(data).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create visit")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/", response_model=List[VisitListItem])
def list_visits():
    """List all patient visits."""
    supabase = get_supabase_client()
    try:
        result = (
            supabase.table("visits")
            .select("id, date, mode, language, status, mainConcern, summary")
            .execute()
        )
        return result.data or []
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/{visit_id}", response_model=VisitResponse)
def get_visit(visit_id: int):
    """Get a single visit by ID."""
    supabase = get_supabase_client()
    try:
        result = (
            supabase.table("visits").select("*").eq("id", visit_id).execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Visit not found")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))