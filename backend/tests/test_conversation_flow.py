"""End-to-end API checks for saving a patient conversation and doctor draft."""

import os
import tempfile
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app


class ConversationFlowTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temp_dir.name) / "test.sqlite3"
        self.previous_database_path = os.environ.get("CARETAI_DB_PATH")
        os.environ["CARETAI_DB_PATH"] = str(self.database_path)
        self.client = TestClient(app)

    def tearDown(self):
        self.client.close()
        if self.previous_database_path is None:
            os.environ.pop("CARETAI_DB_PATH", None)
        else:
            os.environ["CARETAI_DB_PATH"] = self.previous_database_path
        self.temp_dir.cleanup()

    def start_conversation(self, **overrides):
        payload = {"main_concern": "Cough for a few days", "reporter": "Caregiver"}
        payload.update(overrides)
        response = self.client.post("/conversations", json=payload)
        self.assertEqual(response.status_code, 201, response.text)
        return response.json()

    def test_conversation_saves_transcript_and_draft_with_unknowns(self):
        started = self.start_conversation()
        visit_id = started["visit"]["id"]
        self.assertEqual(started["progress"], {"answered": 0, "total": 6})
        self.assertEqual(started["messages"][0]["author"], "Caregiver")

        answers = [
            "About two days ago; it has not improved.",
            "Mostly at night.",
            "Sleep has been interrupted.",
            "Actually, I should add that the throat is sore.",
            "I don't know",
            "Not sure",
        ]
        final = None
        for answer in answers:
            response = self.client.post(
                f"/conversations/{visit_id}/messages", json={"text": answer}
            )
            self.assertEqual(response.status_code, 200, response.text)
            final = response.json()

        self.assertEqual(final["progress"], {"answered": 6, "total": 6})
        report = final["draft_report"]
        self.assertEqual(report["status"], "Draft")
        self.assertIn("not a diagnosis", report["summary"])
        self.assertIn("Patient/caregiver said they do not know", report["summary"])
        self.assertIn("Not sure", report["summary"])
        self.assertIn("Possible correction(s)", report["summary"])
        self.assertIn("Actually, I should add", report["summary"])
        self.assertIn("CARETAI:", report["summary"])

        saved = self.client.get(f"/conversations/{visit_id}")
        self.assertEqual(saved.status_code, 200)
        self.assertEqual(len(saved.json()["messages"]), 14)
        listed = self.client.get(f"/reports/?visit_id={visit_id}&status=Draft")
        self.assertEqual(listed.status_code, 200)
        self.assertEqual(len(listed.json()), 1)
        self.assertEqual(listed.json()[0]["id"], report["id"])

    def test_incomplete_report_keeps_unasked_details_visible(self):
        started = self.start_conversation()
        visit_id = started["visit"]["id"]
        response = self.client.post(f"/conversations/{visit_id}/draft-report")
        self.assertEqual(response.status_code, 201, response.text)
        draft = response.json()["report"]["summary"]
        self.assertIn("Onset and change: Not yet asked", draft)
        self.assertIn("Unknown or not yet reported", draft)
        self.assertIn("Doctor review:", draft)

        # The draft is persisted to disk, not held only in the request process.
        reopened_client = TestClient(app)
        reloaded = reopened_client.get(f"/reports/?visit_id={visit_id}")
        reopened_client.close()
        self.assertEqual(reloaded.status_code, 200)
        self.assertEqual(reloaded.json()[0]["summary"], draft)

    def test_existing_visit_message_and_report_routes_use_the_same_store(self):
        visit_response = self.client.post(
            "/visits/",
            json={
                "date": "2026-10-26",
                "mode": "Chat",
                "language": "English",
                "status": "Confirmed",
                "mainConcern": "Headache",
                "onset": "Yesterday",
                "reportedInformation": ["Headache since yesterday"],
                "quotes": ["My head hurts"],
                "summary": "Patient-reported headache.",
                "notMentioned": [],
                "review": {"status": "Waiting for doctor review"},
            },
        )
        self.assertEqual(visit_response.status_code, 201, visit_response.text)
        visit_id = visit_response.json()["id"]

        message_response = self.client.post(
            "/messages/",
            json={"visit_id": visit_id, "author": "Patient", "text": "It started yesterday."},
        )
        self.assertEqual(message_response.status_code, 201, message_response.text)
        self.assertEqual(self.client.get(f"/messages/?visit_id={visit_id}").json()[0]["text"], "It started yesterday.")

        report_response = self.client.post(
            "/reports/",
            json={"visit_id": visit_id, "report_name": "Visit draft", "status": "Draft", "summary": "For review."},
        )
        self.assertEqual(report_response.status_code, 201, report_response.text)
        report_id = report_response.json()["id"]
        updated = self.client.put(f"/reports/{report_id}", json={"status": "Pending"})
        self.assertEqual(updated.status_code, 200, updated.text)
        self.assertEqual(updated.json()["status"], "Pending")
        self.assertEqual(self.client.get(f"/visits/{visit_id}").json()["mainConcern"], "Headache")

    def test_patient_confirmation_persists_fields_and_refreshes_draft(self):
        started = self.start_conversation(main_concern="Headache reported today")
        visit_id = started["visit"]["id"]
        self.client.post(f"/conversations/{visit_id}/messages", json={"text": "Since this morning"})
        draft_before = self.client.post(f"/conversations/{visit_id}/draft-report")
        self.assertEqual(draft_before.status_code, 201, draft_before.text)
        original_report_id = draft_before.json()["report"]["id"]

        confirmation = self.client.post(
            f"/visits/{visit_id}/confirm",
            json={"reviewed_fields": {"Main concern": "Headache, corrected", "Timeline": "Since this morning"}},
        )
        self.assertEqual(confirmation.status_code, 200, confirmation.text)
        self.assertEqual(confirmation.json()["visit"]["status"], "Confirmed")
        self.assertTrue(confirmation.json()["visit"]["review"]["patientConfirmed"])
        self.assertEqual(
            confirmation.json()["visit"]["review"]["patientCorrections"]["Main concern"],
            "Headache, corrected",
        )
        self.assertEqual(confirmation.json()["report"]["id"], original_report_id)
        self.assertIn('Main concern: "Headache, corrected"', confirmation.json()["report"]["summary"])

        reloaded = self.client.get(f"/conversations/{visit_id}").json()
        self.assertEqual(reloaded["messages"][0]["text"], "Headache reported today")
        self.assertEqual(len(reloaded["messages"]), 4)
        visits = self.client.get("/visits/").json()
        self.assertEqual(visits[0]["id"], visit_id)
        self.assertTrue(visits[0]["review"]["patientConfirmed"])

    def test_bengali_prompt_and_validation_errors(self):
        started = self.start_conversation(language="বাংলা", main_concern="কাশি")
        self.assertIn("কবে শুরু", started["next_question"])
        self.assertEqual(started["visit"]["language"], "বাংলা")
        persisted = self.client.get(f"/visits/{started['visit']['id']}")
        self.assertEqual(persisted.status_code, 200, persisted.text)

        self.assertEqual(
            self.client.post("/conversations", json={"main_concern": "   "}).status_code,
            422,
        )
        self.assertEqual(
            self.client.post("/conversations/999/messages", json={"text": "reply"}).status_code,
            404,
        )


if __name__ == "__main__":
    unittest.main()
