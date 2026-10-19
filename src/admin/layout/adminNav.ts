import type { AdminIconName } from "../components/AdminIcon";

export type AdminNavItem = { label: string; route: string; icon: AdminIconName };

export const adminNav: AdminNavItem[] = [
  { label: "Overview", route: "/admin/dashboard", icon: "dashboard" },
  { label: "Doctor Verification", route: "/admin/doctor-verification", icon: "shield" },
  { label: "Doctor Management", route: "/admin/doctors", icon: "doctors" },
  { label: "User Management", route: "/admin/users", icon: "users" },
  { label: "Platform Activity", route: "/admin/activity", icon: "activity" },
  { label: "Audit Logs", route: "/admin/audit-logs", icon: "audit" },
  { label: "Settings", route: "/admin/settings", icon: "settings" },
];
