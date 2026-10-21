import { useMemo, useState, type ReactNode } from "react";
import { getPatientProfile, type PatientProfileSeed } from "../data/doctorPatientData";

// Visit Reviews queue for the CARETAI doctor workspace.
//
// Every item below is derived from the existing fictional demo records in
// doctorPatientData.ts. Nothing here invents clinical history: each review item
// reuses a real date, mode, concern, and summary from an existing visit record,
// or from a follow-up note that explicitly reports a caregiver response. Patient
// workflow status is used only to describe the review state of that patient's
// current visit, which is exactly how the dashboard already models it.

type ReviewStatus = "New / Pending" | "Under Review" | "More Information Needed" | "Reviewed";
type ReviewKind = "current" | "previous" | "follow-up";

type VisitReviewItem = {
  id: string;
  patientId: string;
  patientName: string;
  initials: string;
  patientCode: string;
  visitNumber: number;
  kind: ReviewKind;
  label: string;
  date: string;
  mode: string;
  language: string;
  concern: string;
  summary: string;
  status: ReviewStatus;
  reviewedBy?: string;
  linkedVisitNumber?: number;
};

const REVIEW_STATUSES: ReviewStatus[] = ["New / Pending", "Under Review", "More Information Needed", "Reviewed"];

const STATUS_SLUG: Record<ReviewStatus, string> = {
  "New / Pending": "new-pending",
  "Under Review": "under-review",
  "More Information Needed": "more-information-needed",
  Reviewed: "reviewed",
};

function reviewStatusFromWorkflow(status: string): ReviewStatus {
  switch (status) {
    case "Under Review":
      return "Under Review";
    case "More Information Needed":
      return "More Information Needed";
    case "Care Plan Confirmed":
    case "Follow-up Needed":
      return "Reviewed";
    default:
      return "New / Pending";
  }
}

function reviewStatusFromString(review: string): { status: ReviewStatus; reviewedBy?: string } {
  if (review.toLowerCase().startsWith("reviewed")) {
    const parts = review.split(" by ");
    return { status: "Reviewed", reviewedBy: parts.length > 1 ? parts[1] : undefined };
  }
  return { status: "New / Pending" };
}

// A follow-up only counts as a reviewable response when the record explicitly
// reports the caregiver or patient telling us something. Otherwise it is only a
// scheduled/overdue follow-up and no response is claimed.
function isReportedResponse(note: string): boolean {
  const lower = note.toLowerCase();
  return lower.startsWith("caregiver reported") || lower.startsWith("patient reported");
}

function visitNumberFromLabel(label: string): number {
  const digits = label.replace(/[^0-9]/g, "");
  return digits ? Number(digits) : 0;
}

function buildVisitReviews(patients: PatientProfileSeed[]): VisitReviewItem[] {
  const items: VisitReviewItem[] = [];

  patients.forEach((patient) => {
    const profile = getPatientProfile(patient);
    const consultation = profile.currentConsultation;
    const mainPoints = consultation.mainPoints.filter((point) => point.trim().length > 0);

    items.push({
      id: `${patient.id}-current`,
      patientId: patient.id,
      patientName: patient.name,
      initials: patient.initials,
      patientCode: patient.patientId,
      visitNumber: patient.visit,
      kind: "current",
      label: "Current visit",
      date: consultation.date,
      mode: consultation.mode,
      language: consultation.language,
      concern: mainPoints[0] ?? patient.issue,
      summary: mainPoints.length ? mainPoints.join(" · ") : patient.issue,
      status: reviewStatusFromWorkflow(patient.status),
    });

    profile.previousVisits.forEach((visit) => {
      const derived = reviewStatusFromString(visit.review);
      items.push({
        id: `${patient.id}-visit-${visit.id}`,
        patientId: patient.id,
        patientName: patient.name,
        initials: patient.initials,
        patientCode: patient.patientId,
        visitNumber: visit.id,
        kind: "previous",
        label: `Visit #${visit.id}`,
        date: visit.date,
        mode: visit.mode,
        language: visit.language,
        concern: visit.concern,
        summary: visit.summary,
        status: derived.status,
        reviewedBy: derived.reviewedBy,
      });

      const reportedFollowUp = profile.followUpHistory.find(
        (followUp) => visitNumberFromLabel(followUp.visit) === visit.id && isReportedResponse(followUp.note),
      );
      if (reportedFollowUp) {
        items.push({
          id: `${patient.id}-followup-${visit.id}`,
          patientId: patient.id,
          patientName: patient.name,
          initials: patient.initials,
          patientCode: patient.patientId,
          visitNumber: visit.id,
          kind: "follow-up",
          label: "Follow-up response",
          date: reportedFollowUp.due,
          mode: visit.mode,
          language: visit.language,
          concern: `Caregiver response for Visit #${visit.id}`,
          summary: reportedFollowUp.note,
          status: "New / Pending",
          linkedVisitNumber: visit.id,
        });
      }
    });
  });

  return items.sort((a, b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0));
}

type ReviewIconName = "search" | "patients" | "calendar" | "chat" | "mic" | "arrow" | "info" | "sparkle" | "link";

function ReviewIcon({ name, size = 16 }: { name: ReviewIconName; size?: number }) {
  const paths: Record<ReviewIconName, ReactNode> = {
    search: <><circle cx="11" cy="11" r="6" /><path d="m20 20-3.5-3.5" /></>,
    patients: <><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.5-3 2.5-4.6 5.5-4.6s5 1.6 5.5 4.6" /><path d="M16 6.2a3 3 0 0 1 0 5.6M18.5 19c-.2-1.6-.7-2.9-1.6-3.8" /></>,
    calendar: <><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M8 3v4M16 3v4M3.5 10h17" /></>,
    chat: <path d="M4 5h16v11H8l-4 4V5Z" />,
    mic: <><rect x="9" y="3" width="6" height="10" rx="3" /><path d="M6 11a6 6 0 0 0 12 0M12 17v3M9 20h6" /></>,
    arrow: <path d="M5 12h13M13 6l6 6-6 6" />,
    info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></>,
    sparkle: <><path d="M12 4v5M12 15v5M4 12h5M15 12h5" /><path d="m7 7 3 3M14 14l3 3M17 7l-3 3M10 14l-3 3" /></>,
    link: <><path d="M9.5 14.5 14.5 9.5" /><path d="M8 12 5.8 14.2a2.6 2.6 0 0 0 3.7 3.7L11.7 16" /><path d="M16 12l2.2-2.2a2.6 2.6 0 0 0-3.7-3.7L12.3 8" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths[name]}
    </svg>
  );
}

export default function DoctorVisitReviews({
  patients,
  onOpenPatient,
}: {
  patients: PatientProfileSeed[];
  onOpenPatient: (patientId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ReviewStatus | "All">("All");

  const items = useMemo(() => buildVisitReviews(patients), [patients]);

  const normalizedSearch = search.trim().toLowerCase();
  const visibleItems = items.filter((item) => {
    const matchesSearch = !normalizedSearch
      || item.patientName.toLowerCase().includes(normalizedSearch)
      || item.patientCode.toLowerCase().includes(normalizedSearch)
      || item.patientId.toLowerCase().includes(normalizedSearch);
    const matchesStatus = status === "All" || item.status === status;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="doctor-visit-reviews">
      <section className="doctor-intro">
        <div>
          <span>Clinical review queue</span>
          <h1>Visit Reviews</h1>
          <p>Review reported visits and follow-up responses across your patients.</p>
        </div>
        <div>
          <strong>{items.length}</strong>
          <span>Review items</span>
        </div>
      </section>

      <div className="doctor-directory-tools">
        <label className="doctor-search">
          <ReviewIcon name="search" size={16} />
          <input value={search} placeholder="Search by patient name or ID..." onChange={(event) => setSearch(event.target.value)} />
          {search && <button type="button" aria-label="Clear search" onClick={() => setSearch("")}>×</button>}
        </label>
        <div className="doctor-directory-filters" role="group" aria-label="Filter reviews by status">
          <button className={status === "All" ? "active" : ""} type="button" onClick={() => setStatus("All")}>All Statuses <b>{items.length}</b></button>
          {REVIEW_STATUSES.map((reviewStatus) => (
            <button className={status === reviewStatus ? "active" : ""} type="button" key={reviewStatus} onClick={() => setStatus(reviewStatus)}>
              {reviewStatus} <b>{items.filter((item) => item.status === reviewStatus).length}</b>
            </button>
          ))}
        </div>
      </div>

      <section className="doctor-patient-section">
        <div className="doctor-section-heading">
          <div>
            <h2>{status === "All" ? "All Reviews" : status}</h2>
            <p>{visibleItems.length} item{visibleItems.length === 1 ? "" : "s"}{search ? ` matching “${search}”` : " in this view"}</p>
          </div>
          <span>Open a review to view the full patient profile</span>
        </div>

        {visibleItems.length ? (
          <div className="doctor-patient-grid">
            {visibleItems.map((item) => (
              <article
                className="doctor-review-card"
                role="button"
                tabIndex={0}
                key={item.id}
                aria-label={`Open full profile for ${item.patientName}`}
                onClick={() => onOpenPatient(item.patientId)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpenPatient(item.patientId);
                  }
                }}
              >
                <div className="doctor-review-card__top">
                  <div className="doctor-patient-avatar">{item.initials}</div>
                  <div>
                    <strong>{item.patientName}</strong>
                    <p>{item.patientCode}</p>
                  </div>
                  <span className={`doctor-review-status doctor-review-status--${STATUS_SLUG[item.status]}`}><i />{item.status}</span>
                </div>

                <div className="doctor-review-card__concern">
                  <span>{item.label} · Visit #{item.visitNumber}</span>
                  <strong>{item.concern}</strong>
                </div>

                <p className="doctor-review-card__summary">{item.summary}</p>

                <div className="doctor-review-card__meta">
                  <span><ReviewIcon name="calendar" size={12} /> {item.date}</span>
                  <span><ReviewIcon name={item.mode === "Voice" ? "mic" : "chat"} size={12} /> {item.mode} · {item.language}</span>
                </div>

                {item.kind === "follow-up" && item.linkedVisitNumber && (
                  <div className="doctor-review-card__note doctor-review-card__note--followup">
                    <ReviewIcon name="link" size={13} />
                    Follow-up response for Visit #{item.linkedVisitNumber}. The original visit report is unchanged.
                  </div>
                )}

                {item.reviewedBy && (
                  <div className="doctor-review-card__note doctor-review-card__note--reviewed">
                    <ReviewIcon name="info" size={13} />
                    Reviewed by {item.reviewedBy}
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="doctor-empty-state">
            <span><ReviewIcon name="search" size={25} /></span>
            <strong>No reviews found</strong>
            <p>Try a different patient name or ID, or choose another review status.</p>
          </div>
        )}
      </section>
    </div>
  );
}
