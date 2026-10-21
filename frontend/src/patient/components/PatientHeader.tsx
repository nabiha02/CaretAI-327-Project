import { useState } from "react";
import { Icon } from "./Icon";

export function PatientHeader({
  title,
  unreadCount,
  readIds,
  notificationsOpen,
  onToggleNotifications,
  onMenu,
  onNavigate,
  onOpenNotification,
  onLogout,
}: {
  title: string;
  unreadCount: number;
  readIds: number[];
  notificationsOpen: boolean;
  onToggleNotifications: () => void;
  onMenu: () => void;
  onNavigate: (label: string) => void;
  onOpenNotification: (id: number, destination: string, category: string) => void;
  onLogout: () => void;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  return (
    <header className="patient-global-header">
      <div className="patient-global-header__left">
        <button className="mobile-menu-button" type="button" aria-label="Open navigation" onClick={onMenu}><span /><span /><span /></button>
        <div><span>Patient portal</span><strong>{title}</strong></div>
      </div>
      <div className="patient-global-header__actions">
        <div className="notification-control">
          <button className="icon-button" type="button" aria-label={`Notifications, ${unreadCount} unread`} aria-expanded={notificationsOpen} onClick={onToggleNotifications}>
            <Icon name="bell" size={20} />
            {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
          </button>
          {notificationsOpen && (
            <div className="notification-menu patient-notification-menu">
              <div className="notification-menu__heading"><strong>Notifications</strong><span>{unreadCount} unread</span></div>
              <button type="button" onClick={() => onOpenNotification(1, "/patient/care-plan", "Care Plan")}>{!readIds.includes(1) && <i className="notification-menu__unread" />}<span className="notification-menu__icon"><Icon name="care" size={16} /></span><div><strong>Care plan updated</strong><p>Your doctor added new recommendations.</p><small>2 hours ago</small></div></button>
              <button type="button" onClick={() => onOpenNotification(2, "/patient/follow-up", "Follow-up")}>{!readIds.includes(2) && <i className="notification-menu__unread" />}<span className="notification-menu__icon"><Icon name="calendar" size={16} /></span><div><strong>Follow-up reminder</strong><p>Your recommended follow-up is coming up.</p><small>Yesterday</small></div></button>
              <button className="notification-menu__view-all" type="button" onClick={() => onNavigate("Notifications")}>View All Notifications <Icon name="arrow" size={13} /></button>
            </div>
          )}
        </div>
        <div className="profile-control">
          <button className="avatar avatar--top avatar--button" type="button" aria-label="Open profile menu" aria-expanded={profileOpen} onClick={() => setProfileOpen(!profileOpen)}>CH</button>
          {profileOpen && <div className="profile-menu"><div><strong>Chaiti</strong><span>Caregiver</span></div><button type="button" onClick={() => onNavigate("Patient Profile")}><Icon name="user" size={15} /> Patient Profile</button><button type="button" onClick={() => onNavigate("Settings")}><Icon name="settings" size={15} /> Settings</button><button type="button" onClick={onLogout}><Icon name="logout" size={15} /> Log out</button></div>}
        </div>
      </div>
    </header>
  );
}
