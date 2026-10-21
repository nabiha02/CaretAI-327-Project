import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { AdminIcon } from "../components/AdminIcon";
import { PlaceholderPage } from "../components/PlaceholderPage";
import { Dashboard } from "../dashboard/Dashboard";
import { VerificationQueue } from "../doctor-verification/VerificationQueue";
import { ApplicationReview } from "../doctor-verification/ApplicationReview";
import { adminNav } from "./adminNav";
import {
  clearDemoAdminSession,
  getDemoAdminSession,
} from "../data/adminSession";
import { getDoctorVerificationApplications } from "../data/adminVerificationData";
import "../styles/admin.css";

export default function AdminApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = getDemoAdminSession();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);
  const [verificationApplications, setVerificationApplications] = useState(
    getDoctorVerificationApplications,
  );

  useEffect(() => {
    if (location.pathname === "/admin" || location.pathname === "/admin/") {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    const syncApplications = () => setVerificationApplications(getDoctorVerificationApplications());
    window.addEventListener("caretai-verifications-changed", syncApplications);
    return () => window.removeEventListener("caretai-verifications-changed", syncApplications);
  }, []);

  const activeItem = adminNav.find((item) =>
    item.route === "/admin/dashboard"
      ? location.pathname === item.route
      : location.pathname.startsWith(item.route),
  ) ?? adminNav[0];
  const goTo = (route: string) => {
    navigate(route);
    setMobileOpen(false);
    setNotificationsOpen(false);
    setProfileOpen(false);
  };
  const signOut = () => {
    clearDemoAdminSession();
    navigate("/");
  };
  const dateLabel = new Intl.DateTimeFormat("en", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

  return (
    <div className={`admin-shell ${collapsed ? "admin-shell--collapsed" : ""}`}>
      <button className={`admin-sidebar-backdrop ${mobileOpen ? "is-open" : ""}`} type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
      <aside className={`admin-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div>
          <button className="admin-brand" type="button" onClick={() => goTo("/admin/dashboard")} aria-label="CARETAI admin overview">
            <span className="admin-brand-mark"><AdminIcon name="brand" size={23} /></span>
            <span className="admin-brand__copy"><strong>CARETAI</strong><small>Administration</small></span>
          </button>
          <nav className="admin-nav" aria-label="Admin navigation">
            {adminNav.map((item) => (
              <button className={activeItem.route === item.route ? "is-active" : ""} type="button" key={item.route} onClick={() => goTo(item.route)} title={collapsed ? item.label : undefined}>
                <AdminIcon name={item.icon} size={18} /><span>{item.label}</span>
                {item.label === "Doctor Verification" && <b>{verificationApplications.filter((application) => application.status === "Pending Manual Review").length}</b>}
              </button>
            ))}
          </nav>
        </div>
        <div className="admin-sidebar__bottom">
          <button className="admin-collapse" type="button" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            <AdminIcon name="collapse" size={16} /><span>Collapse sidebar</span>
          </button>
          <div className="admin-account">
            <span className="admin-avatar">FA</span>
            <span className="admin-account__copy"><strong>{session?.name ?? "Demo Admin"}</strong><small>Admin</small></span>
            <button type="button" onClick={signOut} aria-label="Sign out" title="Sign out"><AdminIcon name="logout" size={17} /></button>
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar__start">
            <button className="admin-menu-button" type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><AdminIcon name="menu" size={19} /></button>
            <label className="admin-search">
              <AdminIcon name="search" size={17} />
              <input value={search} onChange={(event) => { setSearch(event.target.value); if (location.pathname !== "/admin/dashboard") navigate("/admin/dashboard"); }} placeholder="Search doctors or applications..." aria-label="Search doctors or applications" />
              {search && <button type="button" aria-label="Clear search" onClick={() => setSearch("")}>×</button>}
            </label>
          </div>
          <div className="admin-topbar__actions">
            <span className="admin-date"><AdminIcon name="calendar" size={15} />{dateLabel}</span>
            <div className="admin-popover-control">
              <button className="admin-icon-button" type="button" aria-label={notificationsRead ? "Notifications" : "Notifications, 3 unread"} onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false); }}>
                <AdminIcon name="bell" size={18} />{!notificationsRead && <i />}
              </button>
              {notificationsOpen && (
                <div className="admin-popover admin-notifications">
                  <header><div><strong>Notifications</strong><span>{notificationsRead ? "All caught up" : "3 unread"}</span></div><button type="button" onClick={() => setNotificationsRead(true)}>Mark all read</button></header>
                  <button type="button" onClick={() => goTo("/admin/doctor-verification/dr-nusrat-jahan")}><i /><span><strong>New verification submitted</strong><small>Dr. Nusrat Jahan · 12 min ago</small></span></button>
                  <button type="button" onClick={() => goTo("/admin/activity")}><i /><span><strong>Weekly activity report ready</strong><small>Platform activity · 1 hour ago</small></span></button>
                </div>
              )}
            </div>
            <div className="admin-popover-control">
              <button className="admin-profile-button" type="button" onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false); }} aria-label="Open admin profile menu">
                <span className="admin-avatar">FA</span><span><strong>{session?.name ?? "Demo Admin"}</strong><small>Admin</small></span><AdminIcon name="chevron" size={14} />
              </button>
              {profileOpen && (
                <div className="admin-popover admin-profile-menu">
                  <div><strong>{session?.name ?? "Demo Admin"}</strong><span>{session?.email}</span><small>Frontend demo administrator</small></div>
                  <button type="button" onClick={() => goTo("/admin/settings")}><AdminIcon name="settings" size={15} />Settings</button>
                  <button type="button" onClick={signOut}><AdminIcon name="logout" size={15} />Sign out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {location.pathname === "/admin/dashboard"
          ? <Dashboard search={search} navigate={goTo} verificationApplications={verificationApplications} />
          : location.pathname === "/admin/doctor-verification"
            ? <VerificationQueue applications={verificationApplications} navigate={goTo} />
            : location.pathname.match(/^\/admin\/doctor-verification\/([^/]+)$/)
              ? <ApplicationReview
                  application={verificationApplications.find((application) => application.id === location.pathname.split("/").pop())}
                  reviewer={session?.name ?? "Demo Admin"}
                  navigate={goTo}
                  onApplicationsChange={setVerificationApplications}
                />
              : <PlaceholderPage navItem={activeItem} navigate={goTo} />}
      </main>
    </div>
  );
}
