import { getPatientProfile, type PatientProfileSeed } from "./doctorPatientData";

// CARETAI doctor dashboard work-queue derivation.
//
// Everything in this module is read from the existing fictional demo records in
// doctorPatientData.ts and from the workflow status already held on every
// patient card in DoctorApp.tsx. Nothing here invents clinical history,
// patient responses, findings, or due dates: a row exists only because the
// underlying record already says so.
//
// Care-plan rows reuse exactly the recorded-evidence rules of the Care Plans
// page (a patient-shared test report, or a follow-up that is past due). AI
// suggestions are never treated as approved care and are never queued here.

export type AttentionCategory =
  | "new-review"
  | "under-review"
  | "info-needed"
  | "follow-up"
  | "care-plan";

export type AttentionItem = {
  id: string;
  category: AttentionCategory;
  patientId: string;
  patientName: string;
  initials: string;
  patientCode: string;
  visitNumber: number;
  /** The date exactly as it is written on the underlying record. */
  date: string | null;
  /** What the date belongs to, e.g. "Visit" or "Due". */
  dateLabel: string;
  /** The record the task is about, e.g. "Visit #4". */
  subject: string;
  /** Why the task is waiting on the doctor. */
  reason: string;
  /** Extra recorded context shown on the row. */
  detail: string;
  /** Workflow status of the patient, or the care-plan state for plan rows. */
  statusLabel: string;
  /** Slug used for the status badge in the doctor workspace. */
  statusSlug: string;
  /** Label of the button that opens the task. */
  action: string;
  /** Other open tasks for the same patient, so nothing is silently doubled. */
  related: string[];
};

export type RecentPatient = {
  patientId: string;
  patientName: string;
  initials: string;
  patientCode: string;
  visitNumber: number;
  visitDate: string;
  status: string;
  issue: string;
};

export type AttentionSummary = {
  /** New visits plus reviews that are still in progress. */
  review: number;
  /** Distinct patients waiting on additional information. */
  info: number;
  /** Scheduled follow-ups that are still open. */
  followUp: number;
  /** Care-plan items that need the doctor (shared report or overdue step). */
  carePlan: number;
  /** Every open task in the queue. */
  total: number;
  /** Distinct patients that have at least one open task. */
  patients: number;
};

// Display priority: visits first, then missing information, follow-ups, and
// finally care-plan items that need the doctor. This matches the order the
// dashboard presents its work and the metric strip above it.
const CATEGORY_ORDER: AttentionCategory[] = [
  "new-review",
  "under-review",
  "info-needed",
  "follow-up",
  "care-plan",
];

export const CATEGORY_LABEL: Record<AttentionCategory, string> = {
  "new-review": "New visit",
  "under-review": "Under review",
  "info-needed": "Info needed",
  "follow-up": "Follow-up",
  "care-plan": "Care plan",
};

// The labels are the ones the rest of the doctor workspace already uses for
// the same workflow status (see the patient cards and the patient profile).
const WORKFLOW_LABEL: Record<string, string> = {
  "New / Pending": "Pending Review",
  "Under Review": "Under Review",
  "More Information Needed": "More Information Needed",
  "Care Plan Confirmed": "Care Plan Confirmed",
  "Follow-up Needed": "Follow-up Needed",
};

// The care-plan tracker already marks a shared report and an overdue step as
// "Needs Review"; the dashboard reuses that state name and colour.
const PLAN_STATE_LABEL = "Needs Review";
const PLAN_STATE_SLUG = "needs-review";

export function workflowSlug(status: string): string {
  return status
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function workflowLabel(status: string): string {
  return WORKFLOW_LABEL[status] ?? status;
}

/**
 * Reads a date that is written on a record. Records in this project use both
 * "Sep 28, 2026" and "September 28, 2026", and a few dates carry a prefix
 * such as "Requested September 25, 2026". Anything that cannot be read returns
 * 0 so sorting stays stable instead of guessing a date.
 */
export function parseRecordDate(value?: string | null): number {
  if (!value) return 0;
  const cleaned = value.trim();
  if (!cleaned) return 0;

  const direct = new Date(cleaned);
  if (!Number.isNaN(direct.getTime())) return direct.getTime();

  const match = cleaned.match(/([A-Za-z]{3,9})\s+(\d{1,2}),\s*(\d{4})/);
  if (match) {
    const parsed = new Date(`${match[1]} ${match[2]}, ${match[3]}`);
    if (!Number.isNaN(parsed.getTime())) return parsed.getTime();
  }

  return 0;
}

function visitContext(patient: PatientProfileSeed): string {
  return `${patient.issue} · ${patient.mode} · ${patient.language}`;
}

function buildWorkflowItems(patients: PatientProfileSeed[]): AttentionItem[] {
  const items: AttentionItem[] = [];

  patients.forEach((patient) => {
    const base = {
      patientId: patient.id,
      patientName: patient.name,
      initials: patient.initials,
      patientCode: patient.patientId,
      visitNumber: patient.visit,
      statusLabel: workflowLabel(patient.status),
      statusSlug: workflowSlug(patient.status),
      detail: visitContext(patient),
      related: [] as string[],
    };

    switch (patient.status) {
      case "New / Pending":
        items.push({
          ...base,
          id: `${patient.id}-new-review`,
          category: "new-review",
          date: patient.visitDate,
          dateLabel: "Visit",
          subject: `Visit #${patient.visit}`,
          reason: "Submitted by the patient and waiting for your review.",
          action: "Review visit",
        });
        break;
      case "Under Review":
        items.push({
          ...base,
          id: `${patient.id}-under-review`,
          category: "under-review",
          date: patient.visitDate,
          dateLabel: "Visit",
          subject: `Visit #${patient.visit}`,
          reason: "Review started and still in progress.",
          action: "Continue review",
        });
        break;
      case "More Information Needed":
        items.push({
          ...base,
          id: `${patient.id}-info-needed`,
          category: "info-needed",
          date: patient.visitDate,
          dateLabel: "Visit",
          subject: `Visit #${patient.visit}`,
          reason: patient.request
            ? `Waiting for the patient to send: ${patient.request}.`
            : "Additional information has been requested from the patient.",
          action: "Open patient",
        });
        break;
      case "Follow-up Needed":
        items.push({
          ...base,
          id: `${patient.id}-follow-up`,
          category: "follow-up",
          date: patient.followupDate ?? patient.visitDate,
          dateLabel: patient.followupDate ? "Due" : "Visit",
          subject: `Follow-up for Visit #${patient.visit}`,
          reason: "Follow-up is due and no completion has been recorded.",
          action: "Open patient",
        });
        break;
      default:
        break;
    }
  });

  return items;
}

function buildCarePlanItems(patients: PatientProfileSeed[]): AttentionItem[] {
  const items: AttentionItem[] = [];

  patients.forEach((patient) => {
    const profile = getPatientProfile(patient);
    if (profile.isGenericDemo) return;

    const base = {
      patientId: patient.id,
      patientName: patient.name,
      initials: patient.initials,
      patientCode: patient.patientId,
      visitNumber: patient.visit,
      statusLabel: PLAN_STATE_LABEL,
      statusSlug: PLAN_STATE_SLUG,
      detail: visitContext(patient),
      related: [] as string[],
    };

    const recommendedTests = new Set(
      profile.doctorRecommendations.tests.map((test) => test.name.toLowerCase()),
    );

    profile.reports.forEach((report, index) => {
      if (report.status === "Shared" && recommendedTests.has(report.name.toLowerCase())) {
        items.push({
          ...base,
          id: `${patient.id}-care-report-${index}`,
          category: "care-plan",
          date: report.date,
          dateLabel: "Shared",
          subject: `${report.name} report`,
          reason: "The patient shared this report for your review.",
          action: "Review care plan",
        });
      }
    });

    profile.followUpHistory.forEach((followUp, index) => {
      if (followUp.status === "Overdue") {
        items.push({
          ...base,
          id: `${patient.id}-care-followup-${index}`,
          category: "care-plan",
          date: followUp.due,
          dateLabel: "Due",
          subject: `${followUp.visit} follow-up`,
          reason: "Past due with no patient response recorded.",
          action: "Review care plan",
        });
      }
    });
  });

  return items;
}

/**
 * Orders the queue the way a doctor works through it: the workflow category
 * first, then how long the task has been waiting. New submissions are read
 * newest first; everything the doctor is waiting on (a patient response, a
 * due follow-up, a plan step) is read longest waiting first.
 */
function compareItems(a: AttentionItem, b: AttentionItem): number {
  const categoryDiff = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
  if (categoryDiff !== 0) return categoryDiff;

  const aTime = parseRecordDate(a.date);
  const bTime = parseRecordDate(b.date);
  if (aTime !== bTime) {
    const newestFirst = a.category === "new-review" || a.category === "under-review";
    return newestFirst ? bTime - aTime : aTime - bTime;
  }

  return a.patientName.localeCompare(b.patientName);
}

export function buildAttentionQueue(patients: PatientProfileSeed[]): AttentionItem[] {
  const items = [...buildWorkflowItems(patients), ...buildCarePlanItems(patients)].sort(compareItems);

  // A patient can hold more than one open task (for example a requested
  // response and an overdue plan step). The relationship is recorded on the
  // row so the same patient is never presented as unrelated separate work.
  const byPatient = new Map<string, AttentionItem[]>();
  items.forEach((item) => {
    const group = byPatient.get(item.patientId);
    if (group) group.push(item);
    else byPatient.set(item.patientId, [item]);
  });

  byPatient.forEach((group) => {
    if (group.length < 2) return;
    group.forEach((item) => {
      item.related = group
        .filter((other) => other.id !== item.id)
        .map((other) => `${CATEGORY_LABEL[other.category]} · ${other.subject}`);
    });
  });

  return items;
}

export function summarizeAttention(items: AttentionItem[]): AttentionSummary {
  const infoPatients = new Set(
    items.filter((item) => item.category === "info-needed").map((item) => item.patientId),
  );

  return {
    review: items.filter((item) => item.category === "new-review" || item.category === "under-review").length,
    info: infoPatients.size,
    followUp: items.filter((item) => item.category === "follow-up").length,
    carePlan: items.filter((item) => item.category === "care-plan").length,
    total: items.length,
    patients: new Set(items.map((item) => item.patientId)).size,
  };
}

export function buildRecentPatients(patients: PatientProfileSeed[], limit = 5): RecentPatient[] {
  return [...patients]
    .sort((a, b) => parseRecordDate(b.visitDate) - parseRecordDate(a.visitDate))
    .slice(0, limit)
    .map((patient) => ({
      patientId: patient.id,
      patientName: patient.name,
      initials: patient.initials,
      patientCode: patient.patientId,
      visitNumber: patient.visit,
      visitDate: patient.visitDate,
      status: patient.status,
      issue: patient.issue,
    }));
}
