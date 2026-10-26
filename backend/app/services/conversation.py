"""Conservative, source-preserving intake and draft-report workflow."""

import re
import sqlite3
from datetime import datetime, timezone
from typing import Any

from app.services.storage import (
    get_visit,
    insert_message,
    insert_report,
    list_messages,
    update_report,
    update_visit,
)


QUESTIONS = [
    {
        "key": "onset",
        "label": "Onset and change",
        "en": "When did this concern begin, and has it changed since it started?",
        "bn": "এই সমস্যাটি কবে শুরু হয়েছে, এবং শুরু হওয়ার পর থেকে কি কোনো পরিবর্তন হয়েছে?",
    },
    {
        "key": "pattern",
        "label": "Frequency and pattern",
        "en": "How often does it happen? Does anything seem to make it better or worse?",
        "bn": "এটি কত ঘন ঘন হচ্ছে? কোনো কিছুতে বাড়ে বা কমে বলে মনে হয় কি?",
    },
    {
        "key": "daily_impact",
        "label": "Daily impact",
        "en": "How is it affecting daily activities, sleep, or eating?",
        "bn": "এটি দৈনন্দিন কাজ, ঘুম বা খাওয়ায় কী প্রভাব ফেলছে?",
    },
    {
        "key": "other_details",
        "label": "Other symptoms or details",
        "en": "Are there any other symptoms or details you think the doctor should know?",
        "bn": "আর কোনো লক্ষণ বা তথ্য আছে যা ডাক্তারকে জানানো দরকার?",
    },
    {
        "key": "medications",
        "label": "Current medicines",
        "en": "What medicines is the patient currently taking, if any? If unsure, say so; do not change medicines based on this chat.",
        "bn": "রোগী বর্তমানে কোনো ওষুধ খাচ্ছেন কি? নিশ্চিত না হলে বলুন—এই কথোপকথনের ভিত্তিতে ওষুধ পরিবর্তন করবেন না।",
    },
    {
        "key": "allergies",
        "label": "Known allergies",
        "en": "Are there known allergies or sensitivities the doctor should know about? If unsure, say so.",
        "bn": "ডাক্তারের জানার মতো কোনো পরিচিত অ্যালার্জি বা সংবেদনশীলতা আছে কি? নিশ্চিত না হলে সেটিও বলুন।",
    },
]

UNKNOWN_ANSWERS = {
    "i don't know",
    "i do not know",
    "don't know",
    "do not know",
    "not sure",
    "unsure",
    "unknown",
    "not provided",
    "not reported",
    "not mentioned",
    "idk",
    "আমি জানি না",
    "জানি না",
    "নিশ্চিত নই",
}
CORRECTION_CUE = re.compile(
    r"\b(actually|correction|i meant|what i meant|that was wrong|to correct myself)\b",
    re.IGNORECASE,
)


def question_text(question: dict[str, str], language: str) -> str:
    return question["bn"] if language == "বাংলা" else question["en"]


def is_unknown_answer(text: str) -> bool:
    normalized = " ".join(text.casefold().strip().split())
    return normalized in UNKNOWN_ANSWERS


def start_conversation(
    connection: sqlite3.Connection,
    *,
    main_concern: str,
    mode: str,
    language: str,
    reporter: str,
) -> dict[str, Any]:
    from app.services.storage import insert_visit

    now = datetime.now(timezone.utc).date().isoformat()
    not_mentioned = [{"label": question["label"], "value": "Not yet asked"} for question in QUESTIONS]
    visit = insert_visit(
        connection,
        {
            "date": now,
            "mode": mode,
            "language": language,
            "status": "In Progress",
            "duration": None,
            "mainConcern": main_concern,
            "onset": "Not provided yet",
            "pattern": None,
            "reportedInformation": [],
            "quotes": [main_concern],
            "summary": "Intake in progress; a doctor-review draft has not been created yet.",
            "notMentioned": not_mentioned,
            "review": {"status": "Waiting for doctor review"},
            "recommendations": None,
            "followup": None,
        },
        intake_step=0,
    )
    patient_message = insert_message(connection, visit["id"], reporter, main_concern)
    assistant_message = insert_message(
        connection,
        visit["id"],
        "CARETAI",
        question_text(QUESTIONS[0], language),
    )
    return {
        "visit": visit,
        "messages": [patient_message, assistant_message],
        "progress": {"answered": 0, "total": len(QUESTIONS)},
        "next_question": assistant_message["text"],
        "draft_report": None,
    }


def record_patient_message(
    connection: sqlite3.Connection,
    visit_id: int,
    text: str,
) -> dict[str, Any] | None:
    visit = get_visit(connection, visit_id)
    if visit is None:
        return None

    state = connection.execute(
        "SELECT intake_step, completed FROM visits WHERE id = ?", (visit_id,)
    ).fetchone()
    messages = list_messages(connection, visit_id)
    reporter = next(
        (message["author"] for message in messages if message["author"] in {"Patient", "Caregiver"}),
        "Patient",
    )
    patient_message = insert_message(connection, visit_id, reporter, text)

    step = int(state["intake_step"])
    details = list(visit["notMentioned"] or [])
    if step < len(QUESTIONS):
        question = QUESTIONS[step]
        value = "Patient/caregiver said they do not know" if is_unknown_answer(text) else text
        for item in details:
            if item["label"] == question["label"]:
                item["value"] = value
                break
        next_step = step + 1
    else:
        next_step = step

    update_values: dict[str, Any] = {
        "notMentioned": details,
        "quotes": [*visit["quotes"], text],
        "reportedInformation": [*visit["reportedInformation"], text],
        "intake_step": next_step,
    }
    if step == 0 and not is_unknown_answer(text):
        update_values["onset"] = text
    if step == 1 and not is_unknown_answer(text):
        update_values["pattern"] = text

    if next_step >= len(QUESTIONS):
        update_values["completed"] = 1
        update_values["summary"] = make_visit_summary(visit["mainConcern"])
    update_visit(connection, visit_id, update_values)

    if next_step < len(QUESTIONS):
        assistant_text = question_text(QUESTIONS[next_step], visit["language"])
    elif next_step == len(QUESTIONS):
        assistant_text = (
            "Thank you. Your answers are saved for a doctor to review. A draft report has been saved; "
            "it does not diagnose or recommend treatment."
            if visit["language"] == "English"
            else "ধন্যবাদ। আপনার উত্তরগুলো ডাক্তারের পর্যালোচনার জন্য সংরক্ষণ করা হয়েছে। একটি খসড়া প্রতিবেদন সংরক্ষিত হয়েছে; এতে রোগ নির্ণয় বা চিকিৎসার পরামর্শ দেওয়া হয় না।"
        )
    else:
        assistant_text = (
            "Your update is saved and the doctor-review draft has been refreshed."
            if visit["language"] == "English"
            else "আপনার নতুন তথ্য সংরক্ষিত হয়েছে এবং ডাক্তারের পর্যালোচনার খসড়াটি হালনাগাদ হয়েছে।"
        )
    assistant_message = insert_message(connection, visit_id, "CARETAI", assistant_text)

    report = None
    if next_step >= len(QUESTIONS):
        fresh_visit = get_visit(connection, visit_id)
        assert fresh_visit is not None
        all_messages = list_messages(connection, visit_id)
        report = save_draft_report(connection, fresh_visit, all_messages)

    updated_visit = get_visit(connection, visit_id)
    return {
        "visit": updated_visit,
        "message": patient_message,
        "assistant_message": assistant_message,
        "progress": {"answered": min(next_step, len(QUESTIONS)), "total": len(QUESTIONS)},
        "next_question": assistant_text if next_step < len(QUESTIONS) else None,
        "draft_report": report,
    }


def make_visit_summary(main_concern: str) -> str:
    return (
        f'The patient/caregiver reported: "{main_concern}". '
        "Additional responses are preserved verbatim in the doctor-review draft, "
        "with unknown and unreported details identified."
    )


def build_draft_report(visit: dict[str, Any], messages: list[dict[str, Any]]) -> str:
    reporter = next(
        (message["author"] for message in messages if message["author"] in {"Patient", "Caregiver"}),
        "Patient/caregiver",
    )
    lines = [
        "DRAFT — PATIENT-REPORTED INFORMATION FOR DOCTOR REVIEW",
        "This is an organizational summary, not a diagnosis, prescription, or care decision.",
        "",
        f'Main concern ({reporter}): "{visit["mainConcern"]}"',
        "",
        "Responses to intake questions:",
    ]
    for item in visit["notMentioned"] or []:
        lines.append(f'- {item["label"]}: {item["value"]}')

    pending = [
        item
        for item in visit["notMentioned"] or []
        if item["value"] == "Not yet asked" or item["value"] == "Patient/caregiver said they do not know"
    ]
    if pending:
        lines.extend(["", "Unknown or not yet reported (keep visible for review):"])
        for item in pending:
            lines.append(f'- {item["label"]}: {item["value"]}')

    patient_texts = [
        message["text"]
        for message in messages
        if message["author"] in {"Patient", "Caregiver"}
    ]
    corrections = [text for text in patient_texts if CORRECTION_CUE.search(text)]
    if corrections:
        lines.extend(["", "Possible correction(s) signaled by the patient/caregiver; verify against the transcript:"])
        lines.extend(f'- "{text}"' for text in corrections)

    patient_confirmed_fields = (visit.get("review") or {}).get("patientCorrections") or {}
    if patient_confirmed_fields:
        lines.extend(["", "Patient-confirmed review fields (original transcript retained):"])
        lines.extend(f'- {label}: "{value}"' for label, value in patient_confirmed_fields.items())

    lines.extend(["", "Conversation transcript (chronological):"])
    for message in messages:
        lines.append(f'{message["author"]}: {message["text"]}')
    lines.extend(
        [
            "",
            "Doctor review: verify the history with the patient/caregiver and make all clinical, prescribing, and care decisions.",
        ]
    )
    return "\n".join(lines)


def save_draft_report(
    connection: sqlite3.Connection,
    visit: dict[str, Any],
    messages: list[dict[str, Any]],
) -> dict[str, Any]:
    from app.services.storage import insert_report, update_report

    update_visit(
        connection,
        visit["id"],
        {"summary": make_visit_summary(visit["mainConcern"])},
    )
    report_summary = build_draft_report(visit, messages)
    existing = connection.execute(
        "SELECT id FROM reports WHERE visit_id = ? AND status = 'Draft' ORDER BY id DESC LIMIT 1",
        (visit["id"],),
    ).fetchone()
    values = {
        "report_name": "Patient-reported visit draft",
        "status": "Draft",
        "summary": report_summary,
    }
    if existing:
        report = update_report(connection, existing["id"], values)
        assert report is not None
        return report
    return insert_report(connection, {"visit_id": visit["id"], **values})
