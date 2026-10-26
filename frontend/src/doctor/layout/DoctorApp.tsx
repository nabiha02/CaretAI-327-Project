import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import DoctorDashboard from "../dashboard/DoctorDashboard";
import DoctorPatientProfile from "../patients/DoctorPatientProfile";
import DoctorVisitReviews from "../consultation-review/DoctorVisitReviews";
import DoctorReports from "../reports/DoctorReports";
import DoctorCarePlans from "../care-plans/DoctorCarePlans";
import type { QueueFilter } from "../dashboard/DoctorDashboard";
import { listVisits, type ApiVisitSummary } from "../../app/api";

type DoctorIconName =
  | "brand"
  | "dashboard"
  | "patients"
  | "visits"
  | "reports"
  | "care"
  | "bell"
  | "settings"
  | "logout"
  | "search"
  | "arrow"
  | "clock"
  | "clipboard"
  | "check"
  | "info"
  | "calendar"
  | "menu";

function DoctorIcon({ name, size = 20 }: { name: DoctorIconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  const paths: Record<DoctorIconName, ReactNode> = {
    brand: <><path d="M12 3.2c-2.8 0-5 2.1-5 4.7 0 1 .3 1.9.8 2.7C5.6 11.3 4 13.3 4 15.8c0 2.8 2.1 5 4.8 5 1.3 0 2.5-.5 3.3-1.4.8.9 2 1.4 3.3 1.4 2.7 0 4.8-2.2 4.8-5 0-2.5-1.6-4.5-3.8-5.2.5-.8.8-1.7.8-2.7 0-2.6-2.3-4.7-5.2-4.7Z" /><path d="M12 6.7v9.9M8.7 11.7h6.6" /></>,
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    patients: <><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.5-3.2 2.5-5 5.5-5s5 1.8 5.5 5M16 7.5a2.5 2.5 0 0 1 0 5M16.5 15c2.3.2 3.7 1.6 4 4" /></>,
    visits: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16M8 14h8M8 17h5" /></>,
    reports: <><path d="M6 3h9l3 3v15H6Z" /><path d="M15 3v4h4M9 11h6M9 15h6M9 18h4" /></>,
    care: <><path d="M12 20s-7.5-4.4-7.5-10.2A4.3 4.3 0 0 1 12 6.9a4.3 4.3 0 0 1 7.5 2.9C19.5 15.6 12 20 12 20Z" /><path d="M8.5 12h2l1-2.2 1.3 4.1 1-1.9h1.7" /></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8.5h18C21 16 18 16 18 9Z" /><path d="M10 21h4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19 13.5a7.5 7.5 0 0 0 0-3l2-1.5-2-3.4-2.4 1a8 8 0 0 0-2.6-1.5L13.5 2h-4L9 5.1a8 8 0 0 0-2.6 1.5l-2.4-1L2 9l2 1.5a7.5 7.5 0 0 0 0 3L2 15l2 3.4 2.4-1A8 8 0 0 0 9 18.9l.5 3.1h4l.5-3.1a8 8 0 0 0 2.6-1.5l2.4 1 2-3.4Z" /></>,
    logout: <><path d="M10 4H5.5v16H10M14 8l4 4-4 4M8 12h10" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>,
    arrow: <path d="M5 12h13M14 8l4 4-4 4" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    clipboard: <><rect x="5" y="4.5" width="14" height="16" rx="2" /><path d="M9 4.5V3h6v1.5M8.5 10h7M8.5 14h7" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
    calendar: <><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M8 3v4M16 3v4M3.5 10h17" /></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

// The doctor account this demo workspace is signed in as. Kept in one place so
// the sidebar, the profile menu, and the dashboard greeting never drift apart.
const DOCTOR_FULL_NAME = "Dr. Sarah Rahman";
const DOCTOR_FIRST_NAME = "Sarah";
const DOCTOR_INITIALS = "SR";

type WorkflowStatus = "New / Pending" | "Under Review" | "More Information Needed" | "Care Plan Confirmed" | "Follow-up Needed";

type DoctorPatient = {
  id: string;
  patientId: string;
  name: string;
  initials: string;
  age: string;
  ageGroup: string;
  phone: string;
  issue: string;
  visit: number;
  visitDate: string;
  mode: "Chat" | "Voice";
  language: "বাংলা" | "English";
  status: WorkflowStatus;
  request?: string;
  followupDate?: string;
};

const doctorPatients: DoctorPatient[] = [
  { id: "ayan-ahmed", patientId: "CA-0001", name: "Ayan Ahmed", initials: "AA", age: "8 years", ageGroup: "Child", phone: "+880 1711-000001", issue: "Cough, mostly at night", visit: 4, visitDate: "Sep 28, 2026", mode: "Chat", language: "বাংলা", status: "New / Pending" },
  { id: "nabila-islam", patientId: "CA-0014", name: "Nabila Islam", initials: "NI", age: "34 years", ageGroup: "Adult", phone: "+880 1711-000014", issue: "Persistent tiredness", visit: 2, visitDate: "Sep 28, 2026", mode: "Voice", language: "বাংলা", status: "New / Pending" },
  { id: "hasan-karim", patientId: "CA-0021", name: "Hasan Karim", initials: "HK", age: "45 years", ageGroup: "Adult", phone: "+880 1711-000021", issue: "Reduced appetite", visit: 1, visitDate: "Sep 27, 2026", mode: "Chat", language: "English", status: "New / Pending" },
  { id: "samiha-noor", patientId: "CA-0028", name: "Samiha Noor", initials: "SN", age: "16 years", ageGroup: "Adolescent", phone: "+880 1711-000028", issue: "Difficulty sleeping", visit: 3, visitDate: "Sep 26, 2026", mode: "Chat", language: "বাংলা", status: "New / Pending" },
  { id: "maya-rahman", patientId: "CA-0006", name: "Maya Rahman", initials: "MR", age: "67 years", ageGroup: "Older Adult", phone: "+880 1711-000006", issue: "Difficulty sleeping and reduced appetite", visit: 6, visitDate: "Sep 27, 2026", mode: "Voice", language: "বাংলা", status: "Under Review" },
  { id: "arif-hossain", patientId: "CA-0011", name: "Arif Hossain", initials: "AH", age: "52 years", ageGroup: "Adult", phone: "+880 1711-000011", issue: "Reported lower back discomfort", visit: 2, visitDate: "Sep 24, 2026", mode: "Chat", language: "English", status: "Under Review" },
  { id: "rafi-ahmed", patientId: "CA-0003", name: "Rafi Ahmed", initials: "RA", age: "10 years", ageGroup: "Child", phone: "+880 1711-000003", issue: "Recurring headache", visit: 3, visitDate: "Sep 25, 2026", mode: "Chat", language: "বাংলা", status: "More Information Needed", request: "Recent temperature readings" },
  { id: "salma-akter", patientId: "CA-0019", name: "Salma Akter", initials: "SA", age: "29 years", ageGroup: "Adult", phone: "+880 1711-000019", issue: "Intermittent nausea", visit: 2, visitDate: "Sep 23, 2026", mode: "Voice", language: "বাংলা", status: "More Information Needed", request: "Timing of symptoms relative to meals" },
  { id: "tanvir-khan", patientId: "CA-0024", name: "Tanvir Khan", initials: "TK", age: "39 years", ageGroup: "Adult", phone: "+880 1711-000024", issue: "Reported dizziness", visit: 1, visitDate: "Sep 22, 2026", mode: "Chat", language: "English", status: "More Information Needed", request: "Recent blood pressure readings, if available" },
  { id: "laila-begum", patientId: "CA-0009", name: "Laila Begum", initials: "LB", age: "61 years", ageGroup: "Older Adult", phone: "+880 1711-000009", issue: "Follow-up on appetite changes", visit: 5, visitDate: "Sep 19, 2026", mode: "Chat", language: "বাংলা", status: "Care Plan Confirmed" },
  { id: "omar-faruk", patientId: "CA-0017", name: "Omar Faruk", initials: "OF", age: "48 years", ageGroup: "Adult", phone: "+880 1711-000017", issue: "Sleep pattern changes", visit: 4, visitDate: "Sep 18, 2026", mode: "Voice", language: "English", status: "Care Plan Confirmed" },
  { id: "rina-sultana", patientId: "CA-0022", name: "Rina Sultana", initials: "RS", age: "56 years", ageGroup: "Adult", phone: "+880 1711-000022", issue: "Follow-up on tiredness", visit: 3, visitDate: "Sep 16, 2026", mode: "Chat", language: "বাংলা", status: "Care Plan Confirmed" },
  { id: "fatema-begum", patientId: "CA-0005", name: "Fatema Begum", initials: "FB", age: "72 years", ageGroup: "Older Adult", phone: "+880 1711-000005", issue: "Follow-up after previous consultation", visit: 5, visitDate: "Sep 20, 2026", mode: "Chat", language: "বাংলা", status: "Follow-up Needed", followupDate: "October 15, 2026" },
  { id: "imran-chowdhury", patientId: "CA-0012", name: "Imran Chowdhury", initials: "IC", age: "43 years", ageGroup: "Adult", phone: "+880 1711-000012", issue: "Follow-up on recurring cough", visit: 4, visitDate: "Sep 17, 2026", mode: "Voice", language: "English", status: "Follow-up Needed", followupDate: "October 12, 2026" },
  { id: "jannat-ara", patientId: "CA-0026", name: "Jannat Ara", initials: "JA", age: "31 years", ageGroup: "Adult", phone: "+880 1711-000026", issue: "Follow-up on sleep changes", visit: 2, visitDate: "Sep 14, 2026", mode: "Chat", language: "বাংলা", status: "Follow-up Needed", followupDate: "October 18, 2026" },
];

const workflowTabs: { status: WorkflowStatus; icon: DoctorIconName; description: string }[] = [
  { status: "New / Pending", icon: "clipboard", description: "Waiting for review" },
  { status: "Under Review", icon: "search", description: "Review in progress" },
  { status: "More Information Needed", icon: "info", description: "Patient response needed" },
  { status: "Care Plan Confirmed", icon: "check", description: "Review completed" },
  { status: "Follow-up Needed", icon: "calendar", description: "Follow-up required" },
];

const doctorNav: { label: string; route: string; icon: DoctorIconName }[] = [
  { label: "Dashboard", route: "/doctor/dashboard", icon: "dashboard" },
  { label: "Patients", route: "/doctor/patients", icon: "patients" },
  { label: "Visit Reviews", route: "/doctor/visits", icon: "visits" },
  { label: "Reports", route: "/doctor/reports", icon: "reports" },
  { label: "Care Plans", route: "/doctor/care-plans", icon: "care" },
  { label: "Notifications", route: "/doctor/notifications", icon: "bell" },
  { label: "Settings", route: "/doctor/settings", icon: "settings" },
];

export default function DoctorApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const [attentionFilter, setAttentionFilter] = useState<QueueFilter>("all");
  const [search, setSearch] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [directorySearch, setDirectorySearch] = useState("");
  const [directoryStatus, setDirectoryStatus] = useState<WorkflowStatus | "All">("All");
  const [savedVisits, setSavedVisits] = useState<ApiVisitSummary[] | null>(null);
  const [savedVisitsError, setSavedVisitsError] = useState("");

  useEffect(() => {
    let mounted = true;
    listVisits()
      .then((visits) => { if (mounted) { setSavedVisits(visits); setSavedVisitsError(""); } })
      .catch((error: Error) => { if (mounted) { setSavedVisits(null); setSavedVisitsError(error.message); } });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (location.pathname === "/doctor" || location.pathname === "/doctor/") navigate("/doctor/dashboard", { replace: true });
  }, [location.pathname, navigate]);

  const activeNav = location.pathname.startsWith("/doctor/patients")
    ? "Patients"
    : location.pathname.startsWith("/doctor/visits")
      ? "Visit Reviews"
      : location.pathname.startsWith("/doctor/reports")
        ? "Reports"
        : location.pathname.startsWith("/doctor/care-plans")
          ? "Care Plans"
          : location.pathname.startsWith("/doctor/notifications")
            ? "Notifications"
            : location.pathname.startsWith("/doctor/settings")
              ? "Settings"
              : "Dashboard";

  const navigateDoctor = (route: string) => {
    navigate(route);
    setMobileNavOpen(false);
    setNotificationsOpen(false);
    setProfileOpen(false);
  };

  const selectedPatientId = location.pathname.match(/^\/doctor\/patients\/([^/]+)$/)?.[1];  const selectedPatient = selectedPatientId ? doctorPatients.find((patient) => patient.id === selectedPatientId) : null;
  const sectionTitle = activeNav === "Dashboard" ? "Doctor Dashboard" : activeNav;

  const normalizedDirectorySearch = directorySearch.trim().toLowerCase();
  const directoryPatients = doctorPatients.filter((patient) => {
    const matchesSearch = !normalizedDirectorySearch
      || patient.name.toLowerCase().includes(normalizedDirectorySearch)
      || patient.patientId.toLowerCase().includes(normalizedDirectorySearch);
    const matchesStatus = directoryStatus === "All" || patient.status === directoryStatus;
    return matchesSearch && matchesStatus;
  });

  const openPatient = (id: string) => navigateDoctor(`/doctor/patients/${id}`);

  return (
    <div className="doctor-shell">
      <button className={`doctor-nav-backdrop ${mobileNavOpen ? "open" : ""}`} type="button" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />
      <aside className={`doctor-sidebar ${mobileNavOpen ? "doctor-sidebar--open" : ""}`}>
        <div>
          <button className="doctor-brand" type="button" onClick={() => navigateDoctor("/doctor/dashboard")}>
            <span><DoctorIcon name="brand" size={24} /></span>
            <div><strong>CARETAI</strong><small>Clinical review workspace</small></div>
          </button>
          <nav className="doctor-nav" aria-label="Doctor navigation">
            {doctorNav.map((item) => <button className={activeNav === item.label ? "active" : ""} type="button" key={item.label} onClick={() => navigateDoctor(item.route)}><DoctorIcon name={item.icon} size={18} /><span>{item.label}</span></button>)}
          </nav>
        </div>
        <div className="doctor-account"><div className="doctor-avatar">{DOCTOR_INITIALS}</div><div><strong>{DOCTOR_FULL_NAME}</strong><span>Doctor</span></div><button type="button" aria-label="Log out" onClick={() => setLogoutOpen(true)}><DoctorIcon name="logout" size={17} /></button></div>
      </aside>

      <main className="doctor-main">
        <header className="doctor-header">
          <div className="doctor-header__title"><button type="button" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><DoctorIcon name="menu" size={19} /></button><div><strong>{sectionTitle}</strong><p>{activeNav === "Dashboard" ? "Review visits, follow up with patients, and manage care plans." : "CARETAI doctor workspace"}</p></div></div>
          <div className="doctor-header__actions">
            <label className="doctor-search"><DoctorIcon name="search" size={16} /><input value={search} placeholder="Search patients..." onChange={(event) => { setSearch(event.target.value); if (location.pathname !== "/doctor/dashboard") navigate("/doctor/dashboard"); }} />{search && <button type="button" aria-label="Clear search" onClick={() => setSearch("")}>×</button>}</label>
            <div className="doctor-notification-control"><button className="doctor-icon-button" type="button" aria-label="Notifications, 3 unread" onClick={() => setNotificationsOpen(!notificationsOpen)}><DoctorIcon name="bell" size={19} /><span>3</span></button>{notificationsOpen && <div className="doctor-notification-menu"><div><strong>Notifications</strong><span>3 unread</span></div><button type="button" onClick={() => navigateDoctor("/doctor/patients/ayan-ahmed")}><i /><span><strong>New visit confirmed</strong><p>Ayan Ahmed · Visit #4</p></span></button><button type="button" onClick={() => { setAttentionFilter("info"); navigateDoctor("/doctor/dashboard"); }}><i /><span><strong>Patient information received</strong><p>Rafi Ahmed responded to your request.</p></span></button><button type="button" onClick={() => navigateDoctor("/doctor/notifications")}>View all notifications <DoctorIcon name="arrow" size={12} /></button></div>}</div>
            <div className="doctor-profile-control"><button className="doctor-avatar doctor-avatar--button" type="button" aria-label="Open doctor profile" onClick={() => setProfileOpen(!profileOpen)}>{DOCTOR_INITIALS}</button>{profileOpen && <div className="doctor-profile-menu"><div><strong>{DOCTOR_FULL_NAME}</strong><span>Doctor</span></div><button type="button" onClick={() => navigateDoctor("/doctor/settings")}><DoctorIcon name="settings" size={15} /> Settings</button><button type="button" onClick={() => setLogoutOpen(true)}><DoctorIcon name="logout" size={15} /> Log out</button></div>}</div>
          </div>
        </header>

        {location.pathname === "/doctor/dashboard" && (
          <DoctorDashboard
            patients={doctorPatients}
            onOpenPatient={openPatient}
            onNavigate={navigateDoctor}
            search={search}
            filter={attentionFilter}
            onFilterChange={setAttentionFilter}
            doctorFirstName={DOCTOR_FIRST_NAME}
          />
        )}

        {selectedPatientId && (
          <div className="doctor-section-page">
            {selectedPatient ? <><button className="doctor-profile-back" type="button" onClick={() => navigateDoctor("/doctor/dashboard")}><DoctorIcon name="arrow" size={13} /> Back to Dashboard</button><DoctorPatientProfile key={selectedPatient.id} patient={selectedPatient} /></> : <div className="doctor-empty-state"><strong>Patient not found</strong><p>The selected patient record is unavailable.</p></div>}
          </div>
        )}

        {activeNav === "Patients" && !selectedPatientId && (
          <div className="doctor-patients-directory">
            <section className="doctor-intro"><div><span>Patient directory</span><h1>All Patients</h1><p>Browse every patient in your clinical review workspace.</p></div><div><strong>{doctorPatients.length}</strong><span>Total patients</span></div></section>

            <div className="doctor-directory-tools">
              <label className="doctor-search"><DoctorIcon name="search" size={16} /><input value={directorySearch} placeholder="Search by name or patient ID..." onChange={(event) => setDirectorySearch(event.target.value)} />{directorySearch && <button type="button" aria-label="Clear search" onClick={() => setDirectorySearch("")}>×</button>}</label>
              <div className="doctor-directory-filters" role="group" aria-label="Filter patients by workflow status">
                <button className={directoryStatus === "All" ? "active" : ""} type="button" onClick={() => setDirectoryStatus("All")}>All Statuses <b>{doctorPatients.length}</b></button>
                {workflowTabs.map((tab) => <button className={directoryStatus === tab.status ? "active" : ""} type="button" key={tab.status} onClick={() => setDirectoryStatus(tab.status)}>{tab.status} <b>{doctorPatients.filter((patient) => patient.status === tab.status).length}</b></button>)}
              </div>
            </div>

            <section className="doctor-patient-section">
              <div className="doctor-section-heading"><div><h2>{directoryStatus === "All" ? "All Patients" : directoryStatus}</h2><p>{directoryPatients.length} patient{directoryPatients.length === 1 ? "" : "s"}{directorySearch ? ` matching “${directorySearch}”` : " in this view"}</p></div><span>Click a patient to open their full profile</span></div>
              {directoryPatients.length ? <div className="doctor-patient-grid">{directoryPatients.map((patient) => <article className="doctor-patient-card doctor-patient-card--clickable" role="button" tabIndex={0} key={patient.id} aria-label={`Open full profile for ${patient.name}`} onClick={() => openPatient(patient.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openPatient(patient.id); } }}><div className="doctor-patient-card__top"><div className="doctor-patient-avatar">{patient.initials}</div><div><strong>{patient.name}</strong><p>{patient.age} · {patient.ageGroup}</p><span>{patient.patientId}</span></div><span className={`doctor-status doctor-status--${patient.status.toLowerCase().split(" ").join("-").split("/").join("")}`}><i />{patient.status === "New / Pending" ? "Pending Review" : patient.status}</span></div><div className="doctor-current-issue"><span>Current Issue</span><strong>{patient.issue}</strong></div><div className="doctor-visit-meta"><span><DoctorIcon name="visits" size={13} /> Visit #{patient.visit} · {patient.visitDate}</span><span>{patient.mode} · {patient.language}</span></div>{patient.request && <div className="doctor-request-note"><DoctorIcon name="info" size={14} /><div><strong>Information requested</strong><p>Doctor requested: {patient.request}</p></div></div>}{patient.followupDate && <div className="doctor-followup-note"><DoctorIcon name="calendar" size={14} /><div><strong>Follow-up for Visit #{patient.visit}</strong><p>Due: {patient.followupDate}</p></div></div>}<span className="doctor-detail-button">Check Full Details <DoctorIcon name="arrow" size={13} /></span></article>)}</div> : <div className="doctor-empty-state"><span><DoctorIcon name="search" size={25} /></span><strong>No patients found</strong><p>Try a different name or patient ID, or choose another workflow status.</p></div>}
            </section>
          </div>
        )}

        {activeNav === "Visit Reviews" && !selectedPatientId && (
          <DoctorVisitReviews patients={doctorPatients} savedVisits={savedVisits} apiError={savedVisitsError} onOpenPatient={openPatient} />
        )}

        {activeNav === "Reports" && !selectedPatientId && (
          <DoctorReports patients={doctorPatients} onOpenPatient={openPatient} />
        )}

        {activeNav === "Care Plans" && !selectedPatientId && (
          <DoctorCarePlans patients={doctorPatients} onOpenPatient={openPatient} />
        )}

        {activeNav !== "Dashboard" && activeNav !== "Patients" && activeNav !== "Visit Reviews" && activeNav !== "Reports" && activeNav !== "Care Plans" && !selectedPatientId && (
          <div className="doctor-section-page"><span className="doctor-section-page__icon"><DoctorIcon name={doctorNav.find((item) => item.label === activeNav)?.icon ?? "dashboard"} size={24} /></span><h1>{activeNav}</h1><p>This doctor workspace section is connected and ready for its dedicated CARETAI workflow.</p><button type="button" onClick={() => navigateDoctor("/doctor/dashboard")}>Return to Dashboard <DoctorIcon name="arrow" size={13} /></button></div>
        )}
      </main>

      {logoutOpen && <div className="doctor-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setLogoutOpen(false); }}><div className="doctor-logout-modal" role="dialog" aria-modal="true" aria-labelledby="doctor-logout-title"><span><DoctorIcon name="logout" size={21} /></span><h2 id="doctor-logout-title">Log out of CARETAI?</h2><p>Your clinical review session will end securely.</p><div><button type="button" onClick={() => setLogoutOpen(false)}>Cancel</button><button type="button" onClick={() => navigate("/logout")}>Log out</button></div></div></div>}
    </div>
  );
}
