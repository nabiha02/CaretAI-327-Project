"""Request models for the patient/caregiver intake conversation."""

from typing import Literal
from pydantic import BaseModel, Field, field_validator


class ConversationStart(BaseModel):
    main_concern: str = Field(..., min_length=1, max_length=1000)
    mode: Literal["Chat", "Voice"] = "Chat"
    language: str = "English"
    reporter: Literal["Patient", "Caregiver"] = "Patient"

    @field_validator("main_concern")
    @classmethod
    def trim_concern(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("A main concern is required")
        return value

    @field_validator("language", mode="before")
    @classmethod
    def normalize_language(cls, value: str) -> str:
        if not isinstance(value, str):
            raise ValueError("Language must be English or বাংলা")
        normalized = value.strip().casefold()
        if normalized in {"english", "en"}:
            return "English"
        if normalized in {"বাংলা", "bangla", "bengali", "bn"}:
            return "বাংলা"
        raise ValueError("Language must be English or বাংলা")


class ConversationMessageCreate(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)

    @field_validator("text")
    @classmethod
    def trim_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Message cannot be blank")
        return value
