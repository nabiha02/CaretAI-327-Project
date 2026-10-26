"""Pydantic schemas for patient visits."""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class ReportedInfo(BaseModel):
    label: str = Field(..., min_length=1)
    value: str = Field(..., min_length=1)


class ReviewStatus(BaseModel):
    status: str = Field(..., pattern="^(Waiting for doctor review|Reviewed)$")
    doctor: Optional[str] = None
    date: Optional[str] = None
    patientConfirmed: bool = False
    patientCorrections: dict[str, str] = Field(default_factory=dict)


class RecommendationMedication(BaseModel):
    name: str
    dose: str
    schedule: str
    duration: str
    meal: str
    instruction: str


class RecommendationTest(BaseModel):
    name: str
    instruction: str
    status: str


class Recommendations(BaseModel):
    medications: List[RecommendationMedication] = []
    tests: List[RecommendationTest] = []
    diet: List[str] = []
    instructions: str = ""


class FollowUp(BaseModel):
    date: str
    instruction: str


class VisitBase(BaseModel):
    date: str
    mode: str = Field(..., pattern="^(Chat|Voice)$")
    language: str = Field(..., pattern="^(English|বাংলা)$")
    status: str = Field(..., pattern="^(In Progress|Confirmed|Reviewed)$")
    duration: Optional[str] = None
    mainConcern: str
    onset: str
    pattern: Optional[str] = None
    reportedInformation: List[str] = []
    quotes: List[str] = []
    summary: str
    notMentioned: List[ReportedInfo] = []
    review: ReviewStatus
    recommendations: Optional[Recommendations] = None
    followup: Optional[FollowUp] = None


class VisitConfirmation(BaseModel):
    reviewed_fields: dict[str, str] = Field(default_factory=dict)


class VisitCreate(VisitBase):
    pass


class VisitResponse(VisitBase):
    id: int

    model_config = {"from_attributes": True}


class VisitListItem(BaseModel):
    id: int
    date: str
    mode: str
    language: str
    status: str
    mainConcern: str
    summary: str
    review: ReviewStatus

    model_config = {"from_attributes": True}