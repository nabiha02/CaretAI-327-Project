import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";
import { AdminIcon } from "../components/AdminIcon";
import { StatCard } from "../components/StatCard";
import { StatusBadge } from "../components/StatusBadge";
import { formatAdminDate } from "../utils/formatAdminDate";
import type { DoctorVerificationApplication } from "../data/adminVerificationData";

export function VerificationQueue({
  applications,
  navigate,
}: {
  applications: DoctorVerificationApplication[];
  navigate: (route: string) => void;
}) {
  const location = useLocation();
  const requestedStatus = new URLSearchParams(location.search).get("status");
  const initialStatus = requestedStatus === "pending" ? "Pending Manual Review" : "All statuses";
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [specialty, setSpecialty] = useState("All specialties");
  const [sort, setSort] = useState("newest");
  const [visible, setVisible] = useState(5);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 300);
    return () => window.clearTimeout(timer);
  }, []);

  const specialties = [...new Set(applications.map((item) => item.specialty))].sort();
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return applications
      .filter((item) => status === "All statuses" || item.status === status)
      .filter((item) => specialty === "All specialties" || item.specialty === specialty)
      .filter((item) => !normalized || [
        item.name,
        item.email,
        item.registrationNumber,
      ].some((value) => value.toLowerCase().includes(normalized)))
      .sort((a, b) => sort === "newest"
        ? Date.parse(b.submittedAt) - Date.parse(a.submittedAt)
        : Date.parse(a.submittedAt) - Date.parse(b.submittedAt));
  }, [applications, query, sort, specialty, status]);
  const counts = {
    pending: applications.filter((item) => item.status === "Pending Manual Review").length,
    approved: applications.filter((item) => item.status === "Approved").length,
    rejected: applications.filter((item) => item.status === "Rejected").length,
    corrections: applications.filter((item) => item.status === "Resubmission Required").length,
  };
  const setStatusFilter = (next: string) => {
    setStatus(next);
    setVisible(5);
  };

  if (loading) {
    return (
      <div className="admin-dashboard" aria-busy="true" aria-label="Loading verification queue">
        <div className="admin-skeleton admin-skeleton--heading" />
        <div className="admin-stats-grid">{Array.from({ length: 4 }, (_, index) => <div className="admin-skeleton admin-skeleton--card" key={index} />)}</div>
        <div className="admin-skeleton admin-skeleton--panel" />
      </div>
    );
  }

  return (
    <div className="admin-dashboard admin-verification-queue">
      <section className="admin-page-intro">
        <div><span>Credential review workspace</span><h1>Doctor Verification</h1><p>Review professional credentials before granting doctor access.</p></div>
        <div className="admin-demo-pill"><i />Demo workflow · Not real-world verification</div>
      </section>
      <section className="admin-stats-grid" aria-label="Application status summary">
        <StatCard label="Pending Review" value={counts.pending} detail="Awaiting manual review" icon="shield" onClick={() => setStatusFilter("Pending Manual Review")} />
        <StatCard label="Approved" value={counts.approved} detail="Doctor access granted" icon="check" onClick={() => setStatusFilter("Approved")} />
        <StatCard label="Rejected" value={counts.rejected} detail="Doctor access blocked" icon="collapse" onClick={() => setStatusFilter("Rejected")} />
        <StatCard label="Resubmission Required" value={counts.corrections} detail="Corrections requested" icon="audit" onClick={() => setStatusFilter("Resubmission Required")} />
      </section>
      <section className="admin-panel admin-queue-panel">
        <header className="admin-panel__header">
          <div><h2>Verification applications</h2><p>{filtered.length} of {applications.length} fictional demo records</p></div>
          {(query || status !== "All statuses" || specialty !== "All specialties") && <button type="button" onClick={() => { setQuery(""); setStatus("All statuses"); setSpecialty("All specialties"); }}>Clear filters</button>}
        </header>
        <div className="admin-queue-filters">
          <label className="admin-filter-search"><span className="sr-only">Search applications</span><AdminIcon name="search" size={16} /><input value={query} onChange={(event) => { setQuery(event.target.value); setVisible(5); }} placeholder="Search name, email, or registration number" /></label>
          <label><span>Status</span><select value={status} onChange={(event) => setStatusFilter(event.target.value)}><option>All statuses</option><option>Pending Manual Review</option><option>Approved</option><option>Rejected</option><option>Resubmission Required</option></select></label>
          <label><span>Specialty</span><select value={specialty} onChange={(event) => { setSpecialty(event.target.value); setVisible(5); }}><option>All specialties</option>{specialties.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Submitted</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
        </div>
        {filtered.length ? (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table admin-verification-table">
                <thead><tr><th>Doctor</th><th>Specialty</th><th>Registration Authority</th><th>Registration Number</th><th>Submitted Date</th><th>Email Status</th><th>Professional Verification</th><th>Action</th></tr></thead>
                <tbody>{filtered.slice(0, visible).map((doctor) => (
                  <tr key={doctor.id} tabIndex={0} onClick={() => navigate(`/admin/doctor-verification/${doctor.id}`)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") navigate(`/admin/doctor-verification/${doctor.id}`); }}>
                    <td><span className="admin-doctor-cell"><i>{doctor.initials}</i><span><strong>{doctor.name}</strong><small>{doctor.email}</small></span></span></td>
                    <td>{doctor.specialty}</td><td>{doctor.authority}</td><td><code>{doctor.registrationNumber}</code></td><td>{formatAdminDate(doctor.submittedAt)}</td>
                    <td><span className={`admin-email-status ${doctor.emailStatus === "Verified" ? "is-verified" : ""}`}><i />{doctor.emailStatus}</span></td>
                    <td><StatusBadge status={doctor.status} /></td>
                    <td><button type="button" onClick={(event) => { event.stopPropagation(); navigate(`/admin/doctor-verification/${doctor.id}`); }}>Review Application <AdminIcon name="arrow" size={13} /></button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <footer className="admin-load-more"><span>Showing {Math.min(visible, filtered.length)} of {filtered.length}</span>{visible < filtered.length && <button className="admin-secondary-button" type="button" onClick={() => setVisible((current) => current + 5)}>Load more applications</button>}</footer>
          </>
        ) : <div className="admin-empty-state"><span><AdminIcon name="search" /></span><strong>No applications match these filters</strong><p>Clear a filter or search for a different doctor, email, or registration number.</p></div>}
      </section>
    </div>
  );
}
