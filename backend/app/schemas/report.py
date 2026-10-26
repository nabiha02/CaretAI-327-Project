"""Pydantic schemas for clinical reports."""

from typing import Optional, List
from pydantic import BaseModel, Field


class ReportBase(BaseModel):
    visit_id: int = Field(..., gt=0)
    report_name: str = Field(..., min_length=1)
    status: str = Field(..., pattern="^(Draft|Pending|Shared|Available|Requested)$")
    summary: Optional[str] = None


class ReportCreate(ReportBase):
    pass


class ReportUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(Draft|Pending|Shared|Available|Requested)$")
    summary: Optional[str] = None


class ReportResponse(ReportBase):
    id: int
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class ReportListItem(BaseModel):
    id: int
    visit_id: int
    report_name: str
    status: str
    summary: Optional[str] = None
    created_at: str

    model_config = {"from_attributes": True}