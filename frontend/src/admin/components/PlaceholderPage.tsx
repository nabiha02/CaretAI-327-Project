import { AdminIcon } from "./AdminIcon";
import { StatusBadge } from "./StatusBadge";
import type { AdminNavItem } from "../layout/adminNav";
import type { AdminVerificationStatus } from "../data/adminData";

export function PlaceholderPage({ navItem, navigate }: { navItem: AdminNavItem; navigate: (route: string) => void; }) {
  return (
    <div className="admin-placeholder">
      <section className="admin-page-intro">
        <div><span>Admin workspace</span><h1>{navItem.label}</h1><p>This connected section is ready for its dedicated CARETAI administration workflow.</p></div>
      </section>
      <section className="admin-placeholder__card">
        <span className="admin-placeholder__icon"><AdminIcon name={navItem.icon} size={25} /></span>
        <h2>{navItem.label}</h2>
        <p>The route, navigation state, and responsive layout are in place. Functional tools for this area will be added in the next implementation phase.</p>
        {navItem.label === "Doctor Verification" && (
          <div className="admin-status-samples" aria-label="Supported verification statuses">
            {(["Pending Manual Review", "Approved", "Rejected", "Resubmission Required"] as AdminVerificationStatus[]).map((status) => <StatusBadge status={status} key={status} />)}
          </div>
        )}
        <button className="admin-secondary-button" type="button" onClick={() => navigate("/admin/dashboard")}>Return to overview <AdminIcon name="arrow" size={13} /></button>
      </section>
    </div>
  );
}
