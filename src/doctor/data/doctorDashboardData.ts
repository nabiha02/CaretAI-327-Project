import { getPatientProfile, type PatientProfileSeed } from "./doctorPatientData";

// Doctor dashboard work-queue derivation.
//
// Everything below is read from the existing fictional demo records in
// doctorPatientData.ts and the workflow status already held on every patient
// card in DoctorApp.tsx. Nothing here invents clinical history, patient
// responses, or due dates: a row exists only because the underlying record
// already says so.
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
  date: string | null;
  reason: string;
  action: string;
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

// Display priority: visits first, then missing information, follow-ups, and
// finally care-plan items that need the doctor. This matches the order the
// dashboard presents its work.
const CATEGORY_ORDER: AttentionCategory[] = [
  "new-review",
  "under-review",
  "info-needed",
  "follow-up",
  "care-plan",
];

export function workflowSlug(status: string): string {
  return status.toLowerCase().split(" ").join("-").split("/").join("");
}

export function buildAttentionQueue(patients: PatientProfileSeed[]): AttentionItem[] {
  const workflowItems: AttentionItem[] = [];

  patients.forEach((patient) => {
    const base = {
      patientId: patient.id,
      patientName: patient.name,
      initials: patient.initials,
      patientCode: patient.patientId,
      visitNumber: patient.visit,
    };

    switch (patient.status) {
      case "New / Pending":
        workflowItems.push({
          ...base,
          id: `${patient.id}-new-review`,
          category: "new-review",
          date: patient.visitDate,
          reason: "New visit submitted and waiting for your review.",
          action: "Review visit",
        });
        break;
      case "Under Review":
        workflowItems.push({
          ...base,
          id: `${patient.id}-under-review`,
          category: "under-review",
          date: patient.visitDate,
          reason: "Review started and still in progress.",
          action: "Continue review",
        });
        break;
      case "More Information Needed":
        workflowItems.push({
          ...base,
          id: `${patient.id}-info-needed`,
          category: "info-needed",
          date: patient.visitDate,
          reason: patient.request
            ? `Awaiting patient information: ${patient.request}.`
            : "Additional information has been requested from the patient.",
          action: "Open profile",
        });
        break;
      case "Follow-up Needed":
        workflowItems.push({
          ...base,
          id: `${patient.id}-follow-up`,
          category: "follow-up",
          date: patient.followupDate ?? patient.visitDate,
          reason: "Follow-up required for this patient.",
          action: "Open profile",
        });
        break;
      default:
        break;
    }
  });

  const carePlanItems: AttentionItem[] = [];
  patients.forEach((patient) => {
    const profile = getPatientProfile(patient);
    if (profile.isGenericDemo) return;

    const recommendedTests = new Set(
      profile.doctorRecommendations.tests.map((test) => test.name.toLowerCase()),
    );

    profile.reports.forEach((report, index) => {
      if (report.status === "Shared" && recommendedTests.has(report.name.toLowerCase())) {
        carePlanItems.push({
          id: `${patient.id}-care-report-${index}`,
          category: "care-plan",
          patientId: patient.id,
          patientName: patient.name,
          initials: patient.initials,
          patientCode: patient.patientId,
          visitNumber: patient.visit,
          date: report.date,
          reason: `Patient shared the “${report.name}” report for review.`,
          action: "Review care plan",
        });
      }
    });

    profile.followUpHistory.forEach((followUp, index) => {
      if (followUp.status === "Overdue") {
        carePlanItems.push({
          id: `${patient.id}-care-followup-${index}`,
          category: "care-plan",
          patientId: patient.id,
          patientName: patient.name,
          initials: patient.initials,
          patientCode: patient.patientId,
          visitNumber: patient.visit,
          date: followUp.due,
          reason: `${followUp.visit} follow-up is past due with no patient response recorded.`,
          action: "Review care plan",
        });
      }
    });
  });

  return [...workflowItems, ...carePlanItems].sort((a, b) => {
    const priority = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
    if (priority !== 0) return priority;
    return a.patientName.localeCompare(b.patientName);
  });
}

export type AttentionCounts = {
  review: number;
  info: number;
  followUp: number;
  carePlan: number;
  total: number;
};

export function countAttention(items: AttentionItem[]): AttentionCounts {
  return {
    review: items.filter((item) => item.category === "new-review" || item.category === "under-review").length,
    info: items.filter((item) => item.category === "info-needed").length,
    followUp: items.filter((item) => item.category === "follow-up").length,
    carePlan: items.filter((item) => item.category === "care-plan").length,
    total: items.length,
  };
}

export function buildRecentPatients(patients: PatientProfileSeed[], limit = 5): RecentPatient[] {
  return [...patients]
    .sort((a, b) => (new Date(b.visitDate).getTime() || 0) - (new Date(a.visitDate).getTime() || 0))
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
