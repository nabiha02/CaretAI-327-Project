import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  getPatientProfile,
  type PatientProfileSeed,
} from "../data/doctorPatientData";

// Care Plans overview for the CARETAI doctor workspace.
//
// Each entry is a single doctor-approved care-plan item derived from the
// fictional demo records in doctorPatientData.ts (each profile's
// `doctorRecommendations` plus its recorded follow-up history and reports).
//
// Progress is only derived from recorded evidence:
//   · a follow-up marked Completed  → Completed (patient-reported)
//   · a report on file (Available)  → Completed (verified by report)
//   · a report the patient Shared   → Needs Review
//   · a follow-up past due (Overdue)→ Needs Review
//   · everything else               → Ongoing (no completion reported)
//
// Items are never marked complete just because they are old, and no clinical
// detail, prescription, or patient response is invented. AI-generated
// suggestions are never listed here as approved care. This is a frontend-only
// demo: state is held in the browser session and nothing is persisted or sent.

const DISCLAIMER = "This tool collects information for a doctor; it does not provide a diagnosis.";

type ProgressState = "ongoing" | "completed" | "needs-review";
type Verification = "patient" | "report" | null;
type Category = "Medication" | "Test" | "Diet" | "Instruction" | "Follow-up";

type PlanItem = {
  id: string;
  routeId: string;
  patientCode: string;
  patientName: string;
  initials: string;
  category: Category;
  title: string;
  detail: string;
  state: ProgressState;
  verification: Verification;
  evidence: string;
  relatedVisit: string | null;
  relatedDate: string | null;
  latestUpdate: { text: string; source: string; date: string | null } | null;
  needsReview: boolean;
  reviewNote: string | null;
};

const STATE_LABEL: Record<ProgressState, string> = {
  ongoing: "Ongoing",
  completed: "Completed",
  "needs-review": "Needs Review",
};

const CATEGORY_SLUG: Record<Category, string> = {
  Medication: "medication",
  Test: "test",
  Diet: "diet",
  Instruction: "instruction",
  "Follow-up": "follow-up",
};

const STATE_WEIGHT: Record<ProgressState, number> = {
  "needs-review": 0,
  ongoing: 1,
  completed: 2,
};

const CATEGORY_ORDER: Category[] = ["Medication", "Test", "Diet", "Instruction", "Follow-up"];

type CareIconName =
  | "search"
  | "arrow"
  | "check"
  | "info"
  | "shield"
  | "alert"
  | "calendar"
  | "chat"
  | "mic"
  | "pill"
  | "report"
  | "clipboard"
  | "heart"
  | "close"
  | "send"
  | "user"
  | "clock";

function CareIcon({ name, size = 16 }: { name: CareIconName; size?: number }) {
  const paths: Record<CareIconName, ReactNode> = {
    search: <><circle cx="11" cy="11" r="6" /><path d="m20 20-3.5-3.5" /></>,
    arrow: <path d="M5 12h13M13 6l6 6-6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></>,
    shield: <><path d="M12 3 5 6v5.2c0 4.5 2.8 7.8 7 9.8 4.2-2 7-5.3 7-9.8V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
    alert: <><path d="M12 4 2.5 20h19L12 4Z" /><path d="M12 10v4M12 17h.01" /></>,
    calendar: <><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M8 3v4M16 3v4M3.5 10h17" /></>,
    chat: <path d="M4 5h16v11H8l-4 4V5Z" />,
    mic: <><rect x="9" y="3" width="6" height="10" rx="3" /><path d="M6 11a6 6 0 0 0 12 0M12 17v3M9 20h6" /></>,
    pill: <><path d="m8.2 16.8 8.6-8.6a3.5 3.5 0 0 0-5-5l-8.6 8.6a3.5 3.5 0 0 0 5 5Z" /><path d="m8 7 5 5" /></>,
    report: <><path d="M6 3h9l3 3v15H6Z" /><path d="M15 3v4h4M9 11h6M9 15h6M9 18h4" /></>,
    clipboard: <><rect x="5" y="4.5" width="14" height="16" rx="2.2" /><path d="M9 4.5V3h6v1.5M8.5 10h7M8.5 14h7M8.5 17h4" /></>,
    heart: <><path d="M12 20s-7.5-4.4-7.5-10.2A4.3 4.3 0 0 1 12 6.9a4.3 4.3 0 0 1 7.5 2.9C19.5 15.6 12 20 12 20Z" /><path d="M8.5 12h2l1-2.2 1.3 4.1 1-1.9h1.7" /></>,
    close: <path d="M6 6l12 12M18 6 6 18" />,
    send: <path d="M4 12 20 5l-7 15-2.2-6.2L4 12Z" />,
    user: <><circle cx="12" cy="8" r="3.4" /><path d="M5.5 19c.6-3.4 2.9-5.2 6.5-5.2s5.9 1.8 6.5 5.2" /></>,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5v5l3 2" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths[name]}
    </svg>
  );
}

const CATEGORY_ICON: Record<Category, CareIconName> = {
  Medication: "pill",
  Test: "report",
  Diet: "heart",
  Instruction: "clipboard",
  "Follow-up": "calendar",
};

function formatDemoDate() {
  try {
    return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date());
  } catch {
    return "this demo session";
  }
}

function buildPlanItems(patients: PatientProfileSeed[]): PlanItem[] {
  const items: PlanItem[] = [];

  patients.forEach((seed) => {
    const profile = getPatientProfile(seed);
    if (profile.isGenericDemo) return;

    const rec = profile.doctorRecommendations;
    const identity = {
      routeId: seed.id,
      patientCode: seed.patientId,
      patientName: seed.name,
      initials: seed.initials,
    };

    rec.medications.forEach((medication, index) => {
      items.push({
        ...identity,
        id: `${seed.id}-med-${index}`,
        category: "Medication",
        title: medication.name,
        detail: `${medication.dose} · ${medication.schedule} · ${medication.duration} · ${medication.meal}`,
        state: "ongoing",
        verification: null,
        evidence: "No completion reported.",
        relatedVisit: null,
        relatedDate: null,
        latestUpdate: null,
        needsReview: false,
        reviewNote: null,
      });
    });

    rec.tests.forEach((test, index) => {
      const report = profile.reports.find(
        (candidate) => candidate.name.toLowerCase() === test.name.toLowerCase(),
      );

      let state: ProgressState = "ongoing";
      let verification: Verification = null;
      let evidence = "Requested — awaiting result.";
      let latestUpdate: PlanItem["latestUpdate"] = null;
      let needsReview = false;
      let reviewNote: string | null = null;

      if (report) {
        if (report.status === "Available") {
          state = "completed";
          verification = "report";
          evidence = `Report on file · ${report.date}`;
        } else if (report.status === "Shared") {
          state = "needs-review";
          needsReview = true;
          evidence = `Patient shared a report · ${report.date}`;
          reviewNote = "The patient shared a report for this item. Review it before the next step.";
          latestUpdate = { text: `Report shared by the patient: ${report.name}.`, source: "Patient-reported", date: report.date };
        } else {
          evidence = `Report ${report.status.toLowerCase()} · ${report.date}`;
        }
      }

      items.push({
        ...identity,
        id: `${seed.id}-test-${index}`,
        category: "Test",
        title: test.name,
        detail: test.instruction,
        state,
        verification,
        evidence,
        relatedVisit: null,
        relatedDate: report ? report.date : null,
        latestUpdate,
        needsReview,
        reviewNote,
      });
    });

    rec.diet.forEach((entry, index) => {
      items.push({
        ...identity,
        id: `${seed.id}-diet-${index}`,
        category: "Diet",
        title: entry,
        detail: "",
        state: "ongoing",
        verification: null,
        evidence: "No completion reported.",
        relatedVisit: null,
        relatedDate: null,
        latestUpdate: null,
        needsReview: false,
        reviewNote: null,
      });
    });

    if (rec.instructions.trim()) {
      items.push({
        ...identity,
        id: `${seed.id}-instruction`,
        category: "Instruction",
        title: "General care instructions",
        detail: rec.instructions,
        state: "ongoing",
        verification: null,
        evidence: "No completion reported.",
        relatedVisit: null,
        relatedDate: null,
        latestUpdate: null,
        needsReview: false,
        reviewNote: null,
      });
    }

    profile.followUpHistory.forEach((followUp, index) => {
      let state: ProgressState = "ongoing";
      let verification: Verification = null;
      let evidence = `Scheduled · due ${followUp.due}`;
      let latestUpdate: PlanItem["latestUpdate"] = null;
      let needsReview = false;
      let reviewNote: string | null = null;

      if (followUp.status === "Completed") {
        state = "completed";
        verification = "patient";
        evidence = `Follow-up marked complete · due ${followUp.due}`;
        latestUpdate = { text: followUp.note, source: "Patient-reported", date: followUp.due };
      } else if (followUp.status === "Overdue") {
        state = "needs-review";
        needsReview = true;
        evidence = `Follow-up overdue · due ${followUp.due}`;
        reviewNote = "This follow-up is past due and no patient response is recorded.";
      }

      items.push({
        ...identity,
        id: `${seed.id}-followup-${index}`,
        category: "Follow-up",
        title: `${followUp.visit} follow-up`,
        detail: followUp.note,
        state,
        verification,
        evidence,
        relatedVisit: followUp.visit,
        relatedDate: followUp.due,
        latestUpdate,
        needsReview,
        reviewNote,
      });
    });
  });

  return items.sort((a, b) => {
    if (STATE_WEIGHT[a.state] !== STATE_WEIGHT[b.state]) return STATE_WEIGHT[a.state] - STATE_WEIGHT[b.state];
    if (a.patientName !== b.patientName) return a.patientName.localeCompare(b.patientName);
    return CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
  });
}

export default function DoctorCarePlans({
  patients,
  onOpenPatient,
}: {
  patients: PatientProfileSeed[];
  onOpenPatient: (patientId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"All" | ProgressState>("All");
  const [requestTargetId, setRequestTargetId] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  const [requests, setRequests] = useState<Record<string, { message: string; sentAt: string }>>({});

  const items = useMemo(() => buildPlanItems(patients), [patients]);

  const counts = useMemo(() => {
    return {
      All: items.length,
      ongoing: items.filter((item) => item.state === "ongoing").length,
      completed: items.filter((item) => item.state === "completed").length,
      "needs-review": items.filter((item) => item.state === "needs-review").length,
    };
  }, [items]);

  const normalizedSearch = search.trim().toLowerCase();
  const visibleItems = items.filter((item) => {
    const matchesSearch = !normalizedSearch
      || item.patientName.toLowerCase().includes(normalizedSearch)
      || item.patientCode.toLowerCase().includes(normalizedSearch)
      || item.routeId.toLowerCase().includes(normalizedSearch)
      || item.title.toLowerCase().includes(normalizedSearch)
      || item.category.toLowerCase().includes(normalizedSearch)
      || item.detail.toLowerCase().includes(normalizedSearch);
    const matchesFilter = filter === "All" || item.state === filter;
    return matchesSearch && matchesFilter;
  });

  useEffect(() => {
    if (!requestTargetId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setRequestTargetId(null);
        setRequestMessage("");
        setRequestSent(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestTargetId]);

  const requestTarget = requestTargetId ? items.find((item) => item.id === requestTargetId) ?? null : null;

  const openRequest = (item: PlanItem) => {
    setRequestTargetId(item.id);
    setRequestMessage("");
    setRequestSent(false);
  };

  const closeRequest = () => {
    setRequestTargetId(null);
    setRequestMessage("");
    setRequestSent(false);
  };

  const sendRequest = () => {
    if (!requestTarget || !requestMessage.trim()) return;
    setRequests((current) => ({
      ...current,
      [requestTarget.id]: { message: requestMessage.trim(), sentAt: formatDemoDate() },
    }));
    setRequestSent(true);
  };

  const filterOptions: { key: "All" | ProgressState; label: string }[] = [
    { key: "All", label: "All Plans" },
    { key: "ongoing", label: "Ongoing" },
    { key: "completed", label: "Completed" },
    { key: "needs-review", label: "Needs Review" },
  ];

  const activeFilterLabel = filterOptions.find((option) => option.key === filter)?.label ?? "All Plans";

  return (
    <div className="doctor-careplans">
      <section className="doctor-intro">
        <div>
          <span>Individual plan items</span>
          <h1>Care Plans</h1>
          <p>Track each doctor-approved plan item, its progress, and any patient update.</p>
        </div>
        <div>
          <strong>{counts.All}</strong>
          <span>Plan items</span>
        </div>
      </section>

      <div className="doctor-careplans-legend">
        <span><i className="doctor-careplans-dot" /> Ongoing — treatment or instructions the patient is still following</span>
        <span><i className="doctor-careplans-dot doctor-careplans-dot--completed" /> Completed — recorded as finished by the patient or verified by a report</span>
        <span><i className="doctor-careplans-dot doctor-careplans-dot--review" /> Needs Review — a patient update or overdue step that needs the doctor</span>
      </div>

      <div className="doctor-directory-tools">
        <label className="doctor-search">
          <CareIcon name="search" size={16} />
          <input value={search} placeholder="Search by patient name, ID, or plan item..." onChange={(event) => setSearch(event.target.value)} />
          {search && <button type="button" aria-label="Clear search" onClick={() => setSearch("")}>×</button>}
        </label>
        <div className="doctor-directory-filters" role="group" aria-label="Filter care-plan items by progress">
          {filterOptions.map((option) => (
            <button
              className={filter === option.key ? "active" : ""}
              type="button"
              key={option.key}
              onClick={() => setFilter(option.key)}
            >
              {option.label} <b>{counts[option.key]}</b>
            </button>
          ))}
        </div>
      </div>

      <section className="doctor-patient-section">
        <div className="doctor-section-heading">
          <div>
            <h2>{activeFilterLabel}</h2>
            <p>{visibleItems.length} plan item{visibleItems.length === 1 ? "" : "s"}{search ? ` matching “${search}”` : " in this view"}</p>
          </div>
          <span>Open an item to view the patient profile</span>
        </div>

        {visibleItems.length ? (
          <div className="doctor-plan-grid">
            {visibleItems.map((item) => {
              const sent = requests[item.id];
              return (
                <article className="doctor-plan-item" key={item.id}>
                  <div
                    className="doctor-plan-item__main"
                    role="button"
                    tabIndex={0}
                    aria-label={`Open full profile for ${item.patientName}`}
                    onClick={() => onOpenPatient(item.routeId)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onOpenPatient(item.routeId);
                      }
                    }}
                  >
                    <div className="doctor-plan-item__top">
                      <div className="doctor-patient-avatar">{item.initials}</div>
                      <div className="doctor-plan-item__who">
                        <strong>{item.patientName}</strong>
                        <p>{item.patientCode}</p>
                      </div>
                      <span className={`doctor-plan-item__state doctor-plan-state--${item.state}`}>
                        <i />{STATE_LABEL[item.state]}
                      </span>
                    </div>

                    <div className="doctor-plan-item__body">
                      <div className="doctor-plan-item__labels">
                        <span className={`doctor-plan-item__category doctor-plan-item__category--${CATEGORY_SLUG[item.category]}`}>
                          <CareIcon name={CATEGORY_ICON[item.category]} size={11} /> {item.category}
                        </span>
                        <span className="doctor-plan-item__approved">
                          <CareIcon name="shield" size={11} /> Doctor-approved
                        </span>
                      </div>
                      <strong className="doctor-plan-item__title">{item.title}</strong>
                      {item.detail && <p className="doctor-plan-item__detail">{item.detail}</p>}
                      <p className="doctor-plan-item__evidence">{item.evidence}</p>
                      {item.verification === "report" && (
                        <p className="doctor-plan-item__verify"><CareIcon name="report" size={12} /> Completion verified by a report on file.</p>
                      )}
                      {item.verification === "patient" && (
                        <p className="doctor-plan-item__verify"><CareIcon name="user" size={12} /> Completion reported by the patient or caregiver.</p>
                      )}
                    </div>

                    {(item.relatedVisit || item.relatedDate) && (
                      <div className="doctor-plan-item__meta">
                        <span>
                          <CareIcon name="calendar" size={12} /> {item.relatedVisit ?? "Related date"}
                          {item.relatedVisit && item.relatedDate ? " · " : ""}
                          {item.relatedDate ?? ""}
                        </span>
                      </div>
                    )}

                    {item.latestUpdate && (
                      <div className="doctor-plan-item__update">
                        <span>Latest patient update</span>
                        <p>{item.latestUpdate.text}</p>
                        <small>
                          {item.latestUpdate.source}
                          {item.latestUpdate.date ? ` · ${item.latestUpdate.date}` : ""}
                        </small>
                      </div>
                    )}

                    {item.needsReview && item.reviewNote && (
                      <div className="doctor-plan-item__review">
                        <CareIcon name="alert" size={13} />
                        <span>{item.reviewNote}</span>
                      </div>
                    )}

                    <span className="doctor-plan-item__cta">Open patient profile <CareIcon name="arrow" size={12} /></span>
                  </div>

                  <div className="doctor-plan-item__footer">
                    {sent && (
                      <div className="doctor-plan-item__sent">
                        <span><CareIcon name="check" size={12} /> Update requested</span>
                        <p>{sent.message}</p>
                        <small>Sent in this demo · awaiting patient response.</small>
                      </div>
                    )}
                    <button className="doctor-btn doctor-btn--secondary doctor-plan-item__ask" type="button" onClick={() => openRequest(item)}>
                      <CareIcon name="chat" size={13} /> {sent ? "Ask again" : "Ask patient for update"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="doctor-empty-state">
            <span><CareIcon name="search" size={25} /></span>
            <strong>No plan items found</strong>
            <p>Try a different patient name or ID, or choose another progress filter.</p>
          </div>
        )}
      </section>

      <footer className="doctor-careplans-notes">
        <p>
          <CareIcon name="shield" size={13} />
          Only doctor-approved plan items are listed. AI-generated suggestions stay on the patient
          profile and are never treated as approved care.
        </p>
        <p>
          <CareIcon name="clock" size={13} />
          An item is only marked Completed when there is recorded evidence. Items are never closed
          just because they are older.
        </p>
        <p>
          <CareIcon name="alert" size={13} />
          Demo overview: progress is read from shared fictional mock data, and any update request is
          held in the browser session only. Nothing is persisted and no message is delivered to a
          real patient. {DISCLAIMER}
        </p>
      </footer>

      {requestTarget && (
        <div
          className="doctor-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeRequest();
          }}
        >
          <div className="doctor-careplan-modal" role="dialog" aria-modal="true" aria-labelledby="doctor-careplan-modal-title">
            <div className="doctor-careplan-modal__head">
              <span className="doctor-careplan-modal__icon"><CareIcon name="chat" size={18} /></span>
              <div>
                <h2 id="doctor-careplan-modal-title">Ask patient for an update</h2>
                <p>{requestTarget.patientName} · {requestTarget.patientCode}</p>
              </div>
              <button className="doctor-careplan-modal__close" type="button" aria-label="Close" onClick={closeRequest}>
                <CareIcon name="close" size={16} />
              </button>
            </div>

            <div className="doctor-careplan-modal__context">
              <span className={`doctor-plan-item__category doctor-plan-item__category--${CATEGORY_SLUG[requestTarget.category]}`}>
                <CareIcon name={CATEGORY_ICON[requestTarget.category]} size={11} /> {requestTarget.category}
              </span>
              <strong>{requestTarget.title}</strong>
              {requestTarget.detail && <p>{requestTarget.detail}</p>}
              {(requestTarget.relatedVisit || requestTarget.relatedDate) && (
                <small>
                  Related to {requestTarget.relatedVisit ?? "this item"}
                  {requestTarget.relatedVisit && requestTarget.relatedDate ? " · " : ""}
                  {requestTarget.relatedDate ?? ""}
                </small>
              )}
            </div>

            {requestSent ? (
              <>
                <div className="doctor-careplan-modal__sent" role="status">
                  <span><CareIcon name="check" size={16} /></span>
                  <div>
                    <strong>Update request sent</strong>
                    <p>{requests[requestTarget.id]?.message}</p>
                    <small>Sent in this demo · awaiting patient response. No message was delivered to a real patient.</small>
                  </div>
                </div>
                <div className="doctor-careplan-modal__actions">
                  <button className="doctor-btn doctor-btn--primary" type="button" onClick={closeRequest}>Done</button>
                </div>
              </>
            ) : (
              <>
                <label className="doctor-field doctor-field--wide">
                  <span>Your question or update request</span>
                  <textarea
                    autoFocus
                    rows={4}
                    value={requestMessage}
                    placeholder="Ask the patient to confirm progress, share a report, or answer a question about this plan item."
                    onChange={(event) => setRequestMessage(event.target.value)}
                  />
                </label>
                <p className="doctor-careplan-modal__note">
                  This is a frontend demo. The request is not delivered to a real patient and no
                  response is generated.
                </p>
                <div className="doctor-careplan-modal__actions">
                  <button className="doctor-btn doctor-btn--secondary" type="button" onClick={closeRequest}>Cancel</button>
                  <button className="doctor-btn doctor-btn--primary" type="button" disabled={!requestMessage.trim()} onClick={sendRequest}>
                    <CareIcon name="send" size={13} /> Send request
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
