import { Navigate, useNavigate } from "react-router";
import { getDemoAdminSession, startDemoAdminSession } from "../data/adminSession";
import "../styles/admin.css";

export default function AdminAccessPage() {
  const navigate = useNavigate();
  if (getDemoAdminSession()) return <Navigate to="/admin/dashboard" replace />;

  return (
    <main className="admin-access">
      <section className="admin-access__card" aria-labelledby="admin-access-title">
        <div className="admin-access__brand" aria-label="CARETAI administration">
          <span className="admin-brand-mark">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3.2c-2.8 0-5 2.1-5 4.7 0 1 .3 1.9.8 2.7C5.6 11.3 4 13.3 4 15.8c0 2.8 2.1 5 4.8 5 1.3 0 2.5-.5 3.3-1.4.8.9 2 1.4 3.3 1.4 2.7 0 4.8-2.2 4.8-5 0-2.5-1.6-4.5-3.8-5.2.5-.8.8-1.7.8-2.7 0-2.6-2.3-4.7-5.2-4.7Z" />
              <path d="M12 6.7v9.9M8.7 11.7h6.6" />
            </svg>
          </span>
          <span><strong>CARETAI</strong><small>Administration</small></span>
        </div>
        <span className="admin-access__label">Development access</span>
        <h1 id="admin-access-title">Admin demo workspace</h1>
        <p>Preview the administrative experience with fictional records. This frontend-only session does not provide real account permissions or backend security.</p>
        <div className="admin-access__notice">
          <strong>Demo environment</strong>
          <span>No clinical data or credentials are used.</span>
        </div>
        <button
          className="admin-primary-button"
          type="button"
          onClick={() => {
            startDemoAdminSession();
            navigate("/admin/dashboard");
          }}
        >
          Enter Admin Demo
          <span aria-hidden="true">→</span>
        </button>
        <button className="admin-text-button" type="button" onClick={() => navigate("/")}>
          Return to CARETAI home
        </button>
      </section>
    </main>
  );
}
