"""API routes for saved doctor-review report drafts."""

from typing import List
from fastapi import APIRouter, HTTPException

from app.database.client import database_connection
from app.schemas.report import ReportCreate, ReportUpdate, ReportResponse, ReportListItem
from app.services.storage import get_visit, insert_report, list_reports, update_report

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/", response_model=ReportResponse, status_code=201)
def create_report(report: ReportCreate):
    """Save a report draft associated with a visit."""
    try:
        with database_connection() as connection:
            if get_visit(connection, report.visit_id) is None:
                raise HTTPException(status_code=404, detail="Visit not found")
            return insert_report(connection, report.model_dump(mode="json"))
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Could not save the report") from exc


@router.get("/", response_model=List[ReportListItem])
def list_saved_reports(visit_id: int | None = None, status: str | None = None):
    """List reports, optionally filtered by visit ID or status."""
    try:
        with database_connection() as connection:
            if visit_id is not None and get_visit(connection, visit_id) is None:
                raise HTTPException(status_code=404, detail="Visit not found")
            return list_reports(connection, visit_id, status)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Could not load reports") from exc


@router.put("/{report_id}", response_model=ReportResponse)
def update_saved_report(report_id: int, update: ReportUpdate):
    """Update a report's review status or doctor-edited summary."""
    try:
        values = update.model_dump(exclude_unset=True)
        if not values:
            raise HTTPException(status_code=400, detail="No fields to update")
        with database_connection() as connection:
            report = update_report(connection, report_id, values)
            if report is None:
                raise HTTPException(status_code=404, detail="Report not found")
            return report
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Could not update the report") from exc
