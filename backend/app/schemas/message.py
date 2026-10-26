"""Pydantic schemas for patient messages."""

from typing import Optional, List
from pydantic import BaseModel, Field


class MessageBase(BaseModel):
    visit_id: int = Field(..., gt=0)
    author: str = Field(..., pattern="^(CARETAI|Patient|Caregiver|Doctor)$")
    text: str = Field(..., min_length=1)


class MessageCreate(MessageBase):
    pass


class MessageResponse(MessageBase):
    id: int
    created_at: str

    model_config = {"from_attributes": True}


class MessageListItem(BaseModel):
    id: int
    visit_id: int
    author: str
    text: str
    created_at: str

    model_config = {"from_attributes": True}