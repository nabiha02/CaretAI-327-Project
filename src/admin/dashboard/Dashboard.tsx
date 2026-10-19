import { useEffect, useMemo, useState } from "react";
import { AdminIcon } from "../components/AdminIcon";
import { StatCard } from "../components/StatCard";
import { ApplicationsTable } from "../components/ApplicationsTable";
import { formatAdminDate } from "../utils/formatAdminDate";
import {
  adminActivity,
  adminMetrics,
  adminUserBreakdown,
  type AdminDoctorApplication,
} from "../data/adminData";
import type { DoctorVerificationApplication } from "../data/adminVerificationData";

export function Dashboard({
  search,
  navigate,
  verificationApplications,
}: {
  search: string;
  navigate: (route: string) => void;
  verificationApplications: DoctorVerificationApplication[];
}) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 380);
    return () => window.clearTimeout(timer);
  }, []);
  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();
    const pendingApplications: AdminDoctorApplication[] = verificationApplications
      .filter((doctor) => doctor.status === "Pending Manual Review")
      .map((doctor) => ({
        id: doctor.id,
        name: doctor.name,
        initials: doctor.initials,
        specialty: doctor.specialty,
        authority: doctor.authority,
        submitted: formatAdminDate(doctor.submittedAt),
        status: doctor.status,
      }));
    if (!query) return pendingApplications;
    return pendingApplications.filter((doctor) =>
      [doctor.name, doctor.specialty, doctor.authority, doctor.status]
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [search, verificationApplications]);

  if (loading) {
    return (
      <div className="admin-dashboard" aria-busy="true" aria-label="Loading admin overview">
        <div className="admin-skeleton admin-skeleton--heading" />
        <div className="admin-stats-grid">{Array.from({ length: 4 }, (_, index) => <div className="admin-skeleton admin-skeleton--card" key={index} />)}</div>
        <div className="admin-skeleton admin-skeleton--panel" />
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <section className="admin-page-intro">
        <div>
          <span>Administration workspace</span>
          <h1>Admin Overview</h1>
          <p>Manage professional verification, user access, and platform activity.</p>
        </div>
        <div className="admin-demo-pill"><i />Demo data · Frontend only</div>
      </section>

      <section className="admin-stats-grid" aria-label="Platform summary">
        <StatCard label="Total Doctors" value={adminMetrics.totalDoctors} detail="5 added this month" icon="doctors" onClick={() => navigate("/admin/doctors?filter=all")} />
        <StatCard label="Pending Verifications" value={verificationApplications.filter((application) => application.status === "Pending Manual Review").length} detail="Applications needing review" icon="shield" onClick={() => navigate("/admin/doctor-verification?status=pending")} />
        <StatCard label="Verified Doctors" value={adminMetrics.verifiedDoctors} detail="85.2% of all doctors" icon="check" onClick={() => navigate("/admin/doctors?status=approved")} />
        <StatCard label="Total Registered Users" value={adminMetrics.totalUsers} detail="62 joined this month" icon="users" onClick={() => navigate("/admin/users?filter=all")} />
      </section>

      <div className="admin-content-grid">
        <section className="admin-panel admin-panel--applications">
          <header className="admin-panel__header">
            <div><h2>Pending Doctor Verifications</h2><p>Professional applications awaiting administrator review.</p></div>
            <button type="button" onClick={() => navigate("/admin/doctor-verification")}>View all applications <AdminIcon name="arrow" size={13} /></button>
          </header>
          {search && <div className="admin-search-context">Showing application matches for “{search}”</div>}
          <ApplicationsTable applications={filteredApplications} onReview={(id) => navigate(`/admin/doctor-verification/${id}`)} />
        </section>

        <section className="admin-panel admin-panel--activity">
          <header className="admin-panel__header">
            <div><h2>Recent Platform Activity</h2><p>Latest demo events across CARETAI.</p></div>
            <button type="button" onClick={() => navigate("/admin/activity")}>View all</button>
          </header>
          <div className="admin-activity-list">
            {adminActivity.slice(0, 4).map((event) => (
              <article className="admin-activity-item" key={event.id}>
                <span className={`admin-activity-item__icon admin-activity-item__icon--${event.type}`}>
                  <AdminIcon name={event.type === "approval" ? "check" : event.type === "submission" ? "shield" : "users"} size={15} />
                </span>
                <div><strong>{event.title}</strong><p>{event.detail}</p><time>{event.time}</time></div>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-panel admin-panel--users">
          <header className="admin-panel__header">
            <div><h2>User Overview</h2><p>Registered accounts by role.</p></div>
            <span>{adminMetrics.totalUsers.toLocaleString()} total</span>
          </header>
          <div className="admin-user-chart" aria-label="81% patients, 5% doctors, 14% caregivers">
            {adminUserBreakdown.map((item) => <i className={`admin-user-chart__${item.tone}`} style={{ flex: item.percent }} key={item.label} />)}
          </div>
          <div className="admin-user-legend">
            {adminUserBreakdown.map((item) => (
              <button type="button" key={item.label} onClick={() => navigate(`/admin/users?role=${item.label.toLowerCase()}`)}>
                <i className={`admin-user-chart__${item.tone}`} />
                <span><strong>{item.value.toLocaleString()}</strong><small>{item.label} · {item.percent}%</small></span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
