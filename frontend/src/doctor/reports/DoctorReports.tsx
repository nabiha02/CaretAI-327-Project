import { useMemo, useState, type ReactNode } from "react";
import { getPatientProfile, type PatientProfileSeed, type ProfileReport } from "../data/doctorPatientData";

// Reports dashboard for the CARETAI doctor workspace.
//
// Every report shown below comes from the existing fictional demo records in
// doctorPatientData.ts (each patient profile's `reports` array). The statuses are
// exactly the ones those records use — Available, Requested, Pending, Shared — so
// no "Draft" / "Finalized" state is invented. Consultation mode, date, and the
// concern/summary are the patient's latest recorded consultation context. No
// clinical findings are fabricated and no AI suggestions are shown as approved.

type ReportStatus = ProfileReport["status"];

const REPORT_STATUS_ORDER: ReportStatus[] = ["Available", "Requested", "Pending", "Shared"];

const DISCLAIMER = "This tool collects information for a doctor; it does not provide a diagnosis.";

type ReportItem = {
  id: string;
  patientId: string;
  patientName: string;
  initials: string;
  patientCode: string;
  reportName: string;
  date: string;
  status: ReportStatus;
  mode: string;
  language: string;
  summary: string;
  latestVisitDate: string;
  instruction?: string;
};

function nameSlug(value: string): string {
  return value.toLowerCase().split(" ").join("-");
}

function buildReportItems(patients: PatientProfileSeed[]): ReportItem[] {
  const items: ReportItem[] = [];

  patients.forEach((patient) => {
    const profile = getPatientProfile(patient);
    const consultation = profile.currentConsultation;
    const mainPoints = consultation.mainPoints.filter((point) => point.trim().length > 0);
    const summary = mainPoints.length ? mainPoints.join(" · ") : patient.issue;

    profile.reports.forEach((report) => {
      const instruction = profile.doctorRecommendations.tests.find((test) => test.name === report.name)?.instruction;
      items.push({
        id: `${patient.id}-report-${nameSlug(report.name)}`,
        patientId: patient.id,
        patientName: patient.name,
        initials: patient.initials,
        patientCode: patient.patientId,
        reportName: report.name,
        date: report.date,
        status: report.status,
        mode: consultation.mode,
        language: consultation.language,
        summary,
        latestVisitDate: consultation.date,
        instruction,
      });
    });
  });

  return items;
}

type ReportIconName = "search" | "reports" | "calendar" | "chat" | "mic" | "arrow" | "chevron" | "info" | "shield";

function ReportIcon({ name, size = 16 }: { name: ReportIconName; size?: number }) {
  const paths: Record<ReportIconName, ReactNode> = {
    search: <><circle cx="11" cy="11" r="6" /><path d="m20 20-3.5-3.5" /></>,
    reports: <><path d="M6 3h9l3 3v15H6Z" /><path d="M15 3v4h4M9 11h6M9 15h6M9 18h4" /></>,
    calendar: <><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M8 3v4M16 3v4M3.5 10h17" /></>,
    chat: <path d="M4 5h16v11H8l-4 4V5Z" />,
    mic: <><rect x="9" y="3" width="6" height="10" rx="3" /><path d="M6 11a6 6 0 0 0 12 0M12 17v3M9 20h6" /></>,
    arrow: <path d="M5 12h13M13 6l6 6-6 6" />,
    chevron: <path d="m9 6 6 6-6 6" />,
    info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></>,
    shield: <><path d="M12 3 5 6v5.2c0 4.5 2.8 7.8 7 9.8 4.2-2 7-5.3 7-9.8V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths[name]}
    </svg>
  );
}

export default function DoctorReports({
  patients,
  onOpenPatient,
}: {
  patients: PatientProfileSeed[];
  onOpenPatient: (patientId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ReportStatus | "All">("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const items = useMemo(() => buildReportItems(patients), [patients]);
  const availableStatuses = REPORT_STATUS_ORDER.filter((value) => items.some((item) => item.status === value));

  const normalizedSearch = search.trim().toLowerCase();
  const visibleItems = items.filter((item) => {
    const matchesSearch = !normalizedSearch
      || item.patientName.toLowerCase().includes(normalizedSearch)
      || item.patientCode.toLowerCase().includes(normalizedSearch)
      || item.patientId.toLowerCase().includes(normalizedSearch);
    const matchesStatus = status === "All" || item.status === status;
    return matchesSearch && matchesStatus;
  });

  const toggleExpanded = (id: string) => setExpandedId((current) => (current === id ? null : id));

  return (
    <div className="doctor-reports">
      <section className="doctor-intro">
        <div>
          <span>Clinical documents</span>
          <h1>Reports</h1>
          <p>Reports and documents recorded against your patients.</p>
        </div>
        <div>
          <strong>{items.length}</strong>
          <span>Report records</span>
        </div>
      </section>

      <div className="doctor-directory-tools">
        <label className="doctor-search">
          <ReportIcon name="search" size={16} />
          <input value={search} placeholder="Search by patient name or ID..." onChange={(event) => setSearch(event.target.value)} />
          {search && <button type="button" aria-label="Clear search" onClick={() => setSearch("")}>×</button>}
        </label>
        <div className="doctor-directory-filters" role="group" aria-label="Filter reports by status">
          <button className={status === "All" ? "active" : ""} type="button" onClick={() => setStatus("All")}>All Statuses <b>{items.length}</b></button>
          {availableStatuses.map((reportStatus) => (
            <button className={status === reportStatus ? "active" : ""} type="button" key={reportStatus} onClick={() => setStatus(reportStatus)}>
              {reportStatus} <b>{items.filter((item) => item.status === reportStatus).length}</b>
            </button>
          ))}
        </div>
      </div>

      <section className="doctor-patient-section">
        <div className="doctor-section-heading">
          <div>
            <h2>{status === "All" ? "All Reports" : status}</h2>
            <p>{visibleItems.length} report{visibleItems.length === 1 ? "" : "s"}{search ? ` matching “${search}”` : " in this view"}</p>
          </div>
          <span>Open a report to view the patient profile</span>
        </div>

        {visibleItems.length ? (
          <div className="doctor-patient-grid">
            {visibleItems.map((item) => {
              const expanded = expandedId === item.id;
              return (
                <article className="doctor-report-card" key={item.id}>
                  <div
                    className="doctor-report-card__main"
                    role="button"
                    tabIndex={0}
                    aria-label={`Open full profile for ${item.patientName}`}
                    onClick={() => onOpenPatient(item.patientId)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onOpenPatient(item.patientId);
                      }
                    }}
                  >
                    <div className="doctor-report-card__top">
                      <div className="doctor-patient-avatar">{item.initials}</div>
                      <div>
                        <strong>{item.patientName}</strong>
                        <p>{item.patientCode}</p>
                      </div>
                      <span className={`doctor-report__status doctor-report__status--${item.status.toLowerCase()}`}>{item.status}</span>
                    </div>

                    <div className="doctor-report-card__doc">
                      <span>Report</span>
                      <strong>{item.reportName}</strong>
                    </div>

                    <div className="doctor-report-card__context">
                      <span>Latest consultation context</span>
                      <p>{item.summary}</p>
                    </div>

                    <div className="doctor-report-card__meta">
                      <span><ReportIcon name="calendar" size={12} /> {item.date}</span>
                      <span><ReportIcon name={item.mode === "Voice" ? "mic" : "chat"} size={12} /> {item.mode} · {item.language}</span>
                    </div>

                    <span className="doctor-report-card__cta">View patient profile <ReportIcon name="arrow" size={13} /></span>
                  </div>

                  <button className="doctor-report-card__toggle" type="button" aria-expanded={expanded} onClick={() => toggleExpanded(item.id)}>
                    {expanded ? "Hide details" : "Show details"}
                    <ReportIcon name="chevron" size={13} />
                  </button>

                  {expanded && (
                    <div className="doctor-report-card__details">
                      <h4>Report details</h4>
                      <dl className="doctor-profile-kv">
                        <div><dt>Report</dt><dd>{item.reportName}</dd></div>
                        <div><dt>Report date</dt><dd>{item.date}</dd></div>
                        <div><dt>Status</dt><dd>{item.status}</dd></div>
                        <div><dt>Patient</dt><dd>{item.patientName} · {item.patientCode}</dd></div>
                        <div><dt>Latest visit</dt><dd>{item.latestVisitDate}</dd></div>
                        <div><dt>Latest visit mode</dt><dd>{item.mode} · {item.language}</dd></div>
                      </dl>
                      {item.instruction && (
                        <div className="doctor-report-card__detail-block">
                          <h4>Doctor-recommended instruction</h4>
                          <p>{item.instruction}</p>
                        </div>
                      )}
                      <p className="doctor-report-card__demo-note">
                        <ReportIcon name="info" size={13} />
                        Demo data: no report file content is attached or exposed in this frontend demonstration.
                      </p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="doctor-empty-state">
            <span><ReportIcon name="search" size={25} /></span>
            <strong>No reports found</strong>
            <p>Try a different patient name or ID, or choose another report status.</p>
          </div>
        )}
      </section>

      <p className="doctor-reports-disclaimer">
        <ReportIcon name="shield" size={13} /> {DISCLAIMER}
      </p>
    </div>
  );
}
