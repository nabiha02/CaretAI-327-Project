"""API routes for clinical reports."""

from fastapi import APIRouter, HTTPException
from typing import List

from app.schemas.report import ReportCreate, ReportUpdate, ReportResponse, ReportListItem
from app.database.client import get_supabase_client

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/", response_model=ReportResponse, status_code=201)
def create_report(report: ReportCreate):
    """Create a new report draft associated with a visit."""
    supabase = get_supabase_client()
    try:
        data = report.model_dump()
        result = supabase.table("reports").insert(data).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create report")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/", response_model=List[ReportListItem])
def list_reports(visit_id: int | None = None, status: str | None = None):
    """List reports, optionally filtered by visit ID or status."""
    supabase = get_supabase_client()
    try:
        query = supabase.table("reports").select("*")
        if visit_id is not None:
            query = query.eq("visit_id", visit_id)
        if status is not None:
            query = query.eq("status", status)
        result = query.execute()
        return result.data or []
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/{report_id}", response_model=ReportResponse)
def update_report(report_id: int, update: ReportUpdate):
    """Update a report (e.g., change status from Draft to Pending)."""
    supabase = get_supabase_client()
    try:
        data = update.model_dump(exclude_unset=True)
        if not data:
            raise HTTPException(status_code=400, detail="No fields to update")
        result = (
            supabase.table("reports").update(data).eq("id", report_id).execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Report not found")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))