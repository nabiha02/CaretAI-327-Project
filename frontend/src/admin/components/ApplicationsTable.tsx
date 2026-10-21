import { AdminIcon } from "./AdminIcon";
import { StatusBadge } from "./StatusBadge";
import type { AdminDoctorApplication } from "../data/adminData";

export function ApplicationsTable({
  applications,
  onReview,
}: {
  applications: AdminDoctorApplication[];
  onReview: (id: string) => void;
}) {
  if (!applications.length) {
    return (
      <div className="admin-empty-state">
        <span><AdminIcon name="search" /></span>
        <strong>No applications found</strong>
        <p>Try a different search term or review the full verification queue.</p>
      </div>
    );
  }
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead><tr><th>Doctor</th><th>Specialty</th><th>Authority</th><th>Submitted</th><th>Status</th><th><span className="sr-only">Action</span></th></tr></thead>
        <tbody>
          {applications.map((doctor) => (
            <tr
              key={doctor.id}
              tabIndex={0}
              onClick={() => onReview(doctor.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") onReview(doctor.id);
              }}
            >
              <td><span className="admin-doctor-cell"><i>{doctor.initials}</i><strong>{doctor.name}</strong></span></td>
              <td>{doctor.specialty}</td>
              <td>{doctor.authority}</td>
              <td>{doctor.submitted}</td>
              <td><StatusBadge status={doctor.status} /></td>
              <td><button type="button" onClick={(event) => { event.stopPropagation(); onReview(doctor.id); }}>Review <AdminIcon name="arrow" size={13} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
