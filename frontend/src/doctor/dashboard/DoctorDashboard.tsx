import { useMemo, type ReactNode } from "react";
import {
  buildAttentionQueue,
  buildRecentPatients,
  summarizeAttention,
  CATEGORY_LABEL,
  type AttentionCategory,
} from "../data/doctorDashboardData";
import type { PatientProfileSeed } from "../data/doctorPatientData";

// CARETAI doctor dashboard — the doctor's clinical work queue.
//
// Every row in this dashboard is derived from the fictional demo records in
// doctorPatientData.ts through the helpers in doctorDashboardData.ts. Nothing
// is invented here: a task exists only because a recorded visit, request,
// follow-up, or shared report says that it is waiting on the doctor.

const DISCLAIMER = "This tool collects information for a doctor; it does not provide a diagnosis.";

type DashboardIconName =
  | "visits"
  | "patients"
  | "reports"
  | "care"
  | "clipboard"
  | "search"
  | "info"
  | "calendar"
  | "arrow"
  | "check"
  | "user"
  | "link";

function DashboardIcon({ name, size = 16 }: { name: DashboardIconName; size?: number }) {
  const paths: Record<DashboardIconName, ReactNode> = {
    visits: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16M8 14h8M8 17h5" /></>,
    patients: <><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.5-3.2 2.5-5 5.5-5s5 1.8 5.5 5M16 7.5a2.5 2.5 0 0 1 0 5M16.5 15c2.3.2 3.7 1.6 4 4" /></>,
    reports: <><path d="M6 3h9l3 3v15H6Z" /><path d="M15 3v4h4M9 11h6M9 15h6M9 18h4" /></>,
    care: <><path d="M12 20s-7.5-4.4-7.5-10.2A4.3 4.3 0 0 1 12 6.9a4.3 4.3 0 0 1 7.5 2.9C19.5 15.6 12 20 12 20Z" /><path d="M8.5 12h2l1-2.2 1.3 4.1 1-1.9h1.7" /></>,
    clipboard: <><rect x="5" y="4.5" width="14" height="16" rx="2" /><path d="M9 4.5V3h6v1.5M8.5 10h7M8.5 14h7" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
    calendar: <><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M8 3v4M16 3v4M3.5 10h17" /></>,
    arrow: <path d="M5 12h13M14 8l4 4-4 4" />,
    check: <path d="m5 12 4 4L19 6" />,
    user: <><circle cx="12" cy="8" r="3.4" /><path d="M5.5 19c.6-3.4 2.9-5.2 6.5-5.2s5.9 1.8 6.5 5.2" /></>,
    link: <><path d="M9.5 14.5 14.5 9.5" /><path d="M8 12 5.8 14.2a2.6 2.6 0 0 0 3.7 3.7L11.7 16" /><path d="M16 12l2.2-2.2a2.6 2.6 0 0 0-3.7-3.7L12.3 8" /></>,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {paths[name]}
    </svg>
  );
}

export type QueueFilter = "all" | "review" | "info" | "followUp" | "carePlan";

const FILTER_CATEGORIES: Record<Exclude<QueueFilter, "all">, AttentionCategory[]> = {
  review: ["new-review", "under-review"],
  info: ["info-needed"],
  followUp: ["follow-up"],
  carePlan: ["care-plan"],
};

const CATEGORY_ICON: Record<AttentionCategory, DashboardIconName> = {
  "new-review": "clipboard",
  "under-review": "search",
  "info-needed": "info",
  "follow-up": "calendar",
  "care-plan": "care",
};

function formatToday(): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date());
  } catch {
    return "";
  }
}

export default function DoctorDashboard({
  patients,
  onOpenPatient,
  onNavigate,
  search,
  filter,
  onFilterChange,
  doctorFirstName,
}: {
  patients: PatientProfileSeed[];
  onOpenPatient: (patientId: string) => void;
  onNavigate: (route: string) => void;
  search: string;
  filter: QueueFilter;
  onFilterChange: (filter: QueueFilter) => void;
  doctorFirstName: string;
}) {
  const items = useMemo(() => buildAttentionQueue(patients), [patients]);
  const summary = useMemo(() => summarizeAttention(items), [items]);
  const recentPatients = useMemo(() => buildRecentPatients(patients, 5), [patients]);
  const today = useMemo(() => formatToday(), []);

  const normalizedSearch = search.trim().toLowerCase();
  const visibleItems = items.filter((item) => {
    const matchesFilter =
      filter === "all" || FILTER_CATEGORIES[filter].includes(item.category);
    const matchesSearch =
      !normalizedSearch ||
      item.patientName.toLowerCase().includes(normalizedSearch) ||
      item.patientCode.toLowerCase().includes(normalizedSearch) ||
      item.patientId.toLowerCase().includes(normalizedSearch) ||
      item.subject.toLowerCase().includes(normalizedSearch);
    return matchesFilter && matchesSearch;
  });

  const metrics: {
    key: Exclude<QueueFilter, "all">;
    icon: DashboardIconName;
    count: number;
    label: string;
    hint: string;
  }[] = [
    {
      key: "review",
      icon: "visits",
      count: summary.review,
      label: "Visits awaiting review",
      hint: "New visits and reviews in progress",
    },
    {
      key: "info",
      icon: "info",
      count: summary.info,
      label: "Patients awaiting information",
      hint: "A response is requested from the patient",
    },
    {
      key: "followUp",
      icon: "calendar",
      count: summary.followUp,
      label: "Follow-ups requiring attention",
      hint: "Scheduled follow-ups still open",
    },
    {
      key: "carePlan",
      icon: "care",
      count: summary.carePlan,
      label: "Care-plan updates to review",
      hint: "Shared reports and overdue plan steps",
    },
  ];

  const quickLinks: {
    label: string;
    hint: string;
    route: string;
    icon: DashboardIconName;
  }[] = [
    {
      label: "Visit Reviews",
      hint: "Work through the visit review queue",
      route: "/doctor/visits",
      icon: "visits",
    },
    {
      label: "Patients",
      hint: "Open the patient directory",
      route: "/doctor/patients",
      icon: "patients",
    },
    {
      label: "Reports",
      hint: "Check report status for your patients",
      route: "/doctor/reports",
      icon: "reports",
    },
    {
      label: "Care Plans",
      hint: "Track doctor-approved plan items",
      route: "/doctor/care-plans",
      icon: "care",
    },
  ];

  const openTask = (category: AttentionCategory, patientId: string) => {
    if (category === "care-plan") {
      onNavigate("/doctor/care-plans");
      return;
    }
    onOpenPatient(patientId);
  };

  return (
    <div className="doctor-dashboard">
      <section className="doctor-dashboard__bar">
        <div className="doctor-dashboard__bar-main">
          <span className="doctor-dashboard__bar-label">Your work queue</span>
          <strong>
            {summary.total} item{summary.total === 1 ? "" : "s"} need attention
          </strong>
          <p>
            {summary.patients} patient{summary.patients === 1 ? "" : "s"} with an open step ·
            listed by workflow priority
          </p>
        </div>
        <div className="doctor-dashboard__bar-meta">
          <span className="doctor-dashboard__greeting">
            <DashboardIcon name="user" size={13} /> Welcome back, Dr. {doctorFirstName}
          </span>
          {today && (
            <span className="doctor-dashboard__date">
              <DashboardIcon name="calendar" size={13} /> {today}
            </span>
          )}
        </div>
      </section>

      <section className="doctor-metrics" aria-label="Work overview">
        {metrics.map((metric) => (
          <button
            className={`doctor-metric doctor-metric--${metric.key} ${filter === metric.key ? "active" : ""}`}
            type="button"
            key={metric.key}
            aria-pressed={filter === metric.key}
            onClick={() => onFilterChange(filter === metric.key ? "all" : metric.key)}
          >
            <span className="doctor-metric__icon">
              <DashboardIcon name={metric.icon} size={17} />
            </span>
            <span className="doctor-metric__body">
              <strong>{metric.count}</strong>
              <span>{metric.label}</span>
              <small>{metric.hint}</small>
            </span>
          </button>
        ))}
      </section>

      <div className="doctor-dashboard-layout">
        <section className="doctor-queue" aria-label="Needs your attention">
          <div className="doctor-section-heading">
            <div>
              <h2>Needs Your Attention</h2>
              <p>
                {visibleItems.length} item{visibleItems.length === 1 ? "" : "s"}
                {filter === "all" ? " in your work queue" : " in this view"}
              </p>
            </div>
            {filter !== "all" && (
              <button className="doctor-queue__clear" type="button" onClick={() => onFilterChange("all")}>
                Show all
              </button>
            )}
          </div>

          {visibleItems.length ? (
            <div className="doctor-queue-list">
              {visibleItems.map((item) => (
                <article className="doctor-queue-item" key={item.id}>
                  <button
                    className="doctor-queue-item__main"
                    type="button"
                    aria-label={`Open the full profile for ${item.patientName}`}
                    onClick={() => onOpenPatient(item.patientId)}
                  >
                    <span className="doctor-queue-item__flag" data-category={item.category} aria-hidden />
                    <span className="doctor-patient-avatar">{item.initials}</span>
                    <span className="doctor-queue-item__body">
                      <span className="doctor-queue-item__who">
                        <strong>{item.patientName}</strong>
                        <em>{item.patientCode}</em>
                      </span>
                      <span className="doctor-queue-item__task">
                        <span className={`doctor-queue-tag doctor-queue-tag--${item.category}`}>
                          <DashboardIcon name={CATEGORY_ICON[item.category]} size={11} />
                          {CATEGORY_LABEL[item.category]}
                        </span>
                        <span className="doctor-queue-item__subject">{item.subject}</span>
                      </span>
                      <span className="doctor-queue-item__reason">{item.reason}</span>
                      <span className="doctor-queue-item__meta">
                        <span>{item.detail}</span>
                        {item.date && (
                          <span>
                            <DashboardIcon name="calendar" size={11} /> {item.dateLabel} {item.date}
                          </span>
                        )}
                      </span>
                      {item.related.length > 0 && (
                        <span className="doctor-queue-item__related">
                          <DashboardIcon name="link" size={11} /> Also open for this patient:{" "}
                          {item.related.join(" · ")}
                        </span>
                      )}
                    </span>
                  </button>

                  <div className="doctor-queue-item__side">
                    <span className={`doctor-status doctor-status--${item.statusSlug}`}>
                      <i />
                      {item.statusLabel}
                    </span>
                    <button
                      className="doctor-queue-item__action"
                      type="button"
                      onClick={() => openTask(item.category, item.patientId)}
                    >
                      {item.action} <DashboardIcon name="arrow" size={12} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="doctor-queue-empty">
              <span>
                <DashboardIcon name={filter === "all" ? "check" : "search"} size={22} />
              </span>
              <strong>
                {filter === "all"
                  ? "Nothing needs your attention right now."
                  : "No items in this view."}
              </strong>
              <p>
                {filter === "all"
                  ? "New visits, patient responses, follow-ups, and care-plan updates appear here as soon as they are recorded."
                  : "Choose Show all to see the full work queue."}
              </p>
            </div>
          )}
        </section>

        <aside className="doctor-side">
          <section className="doctor-side-card">
            <div className="doctor-side-card__head">
              <h3>Quick links</h3>
            </div>
            <div className="doctor-quicklinks">
              {quickLinks.map((link) => (
                <button type="button" key={link.route} onClick={() => onNavigate(link.route)}>
                  <span>
                    <DashboardIcon name={link.icon} size={16} />
                  </span>
                  <div>
                    <strong>{link.label}</strong>
                    <small>{link.hint}</small>
                  </div>
                  <DashboardIcon name="arrow" size={13} />
                </button>
              ))}
            </div>
          </section>

          <section className="doctor-side-card">
            <div className="doctor-side-card__head">
              <h3>Recently active</h3>
              <span>By latest visit</span>
            </div>
            <div className="doctor-recent">
              {recentPatients.map((patient) => (
                <button
                  className="doctor-recent-item"
                  type="button"
                  key={patient.patientId}
                  aria-label={`Open the full profile for ${patient.patientName}`}
                  onClick={() => onOpenPatient(patient.patientId)}
                >
                  <span className="doctor-patient-avatar doctor-patient-avatar--sm">
                    {patient.initials}
                  </span>
                  <span className="doctor-recent-item__body">
                    <strong>{patient.patientName}</strong>
                    <small>
                      {patient.patientCode} · Visit #{patient.visitNumber} · {patient.issue}
                    </small>
                  </span>
                  <span className="doctor-recent-item__date">{patient.visitDate}</span>
                </button>
              ))}
            </div>
            <button className="doctor-side-link" type="button" onClick={() => onNavigate("/doctor/patients")}>
              View all patients <DashboardIcon name="arrow" size={12} />
            </button>
          </section>
        </aside>
      </div>

      <p className="doctor-dashboard__disclaimer">
        <DashboardIcon name="info" size={13} /> {DISCLAIMER}
      </p>
    </div>
  );
}
