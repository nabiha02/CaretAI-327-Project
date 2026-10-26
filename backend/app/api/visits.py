"""API routes for patient visits."""

from fastapi import APIRouter, HTTPException
from typing import List

from app.database.client import database_connection
from app.schemas.visit import VisitConfirmation, VisitCreate, VisitResponse, VisitListItem
from app.services.conversation import save_draft_report
from app.services.storage import get_visit, insert_visit, list_messages, list_visits, update_visit

router = APIRouter(prefix="/visits", tags=["visits"])


@router.post("/", response_model=VisitResponse, status_code=201)
def create_visit(visit: VisitCreate):
    """Create a patient visit record."""
    try:
        with database_connection() as connection:
            return insert_visit(connection, visit.model_dump(mode="json"))
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Could not save the visit") from exc


@router.get("/", response_model=List[VisitListItem])
def list_all_visits():
    """List saved visits for the local demo workspace."""
    try:
        with database_connection() as connection:
            return list_visits(connection)
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Could not load visits") from exc


@router.post("/{visit_id}/confirm")
def confirm_saved_visit(visit_id: int, request: VisitConfirmation):
    """Persist the patient's confirmation and refresh the doctor-review draft."""
    try:
        with database_connection() as connection:
            visit = get_visit(connection, visit_id)
            if visit is None:
                raise HTTPException(status_code=404, detail="Visit not found")

            review = {
                **(visit.get("review") or {}),
                "patientConfirmed": True,
                "patientCorrections": request.reviewed_fields,
            }
            updated_visit = update_visit(
                connection,
                visit_id,
                {"status": "Confirmed", "review": review},
            )
            assert updated_visit is not None
            report = save_draft_report(connection, updated_visit, list_messages(connection, visit_id))
            return {"visit": get_visit(connection, visit_id), "report": report}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Could not confirm the visit") from exc


@router.get("/{visit_id}", response_model=VisitResponse)
def get_one_visit(visit_id: int):
    """Get a saved visit by ID."""
    try:
        with database_connection() as connection:
            visit = get_visit(connection, visit_id)
            if visit is None:
                raise HTTPException(status_code=404, detail="Visit not found")
            return visit
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Could not load the visit") from exc
