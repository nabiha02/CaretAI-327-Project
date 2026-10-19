import type { ReactNode } from "react";

export type AdminIconName =
  | "activity"
  | "arrow"
  | "audit"
  | "bell"
  | "brand"
  | "calendar"
  | "check"
  | "chevron"
  | "collapse"
  | "dashboard"
  | "doctors"
  | "logout"
  | "menu"
  | "search"
  | "settings"
  | "shield"
  | "users";

export function AdminIcon({ name, size = 20 }: { name: AdminIconName; size?: number }) {
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
  const paths: Record<AdminIconName, ReactNode> = {
    activity: <><path d="M3 12h4l2-6 4 12 2-6h6" /><path d="M4 4h16v16H4Z" /></>,
    arrow: <path d="M5 12h13M14 8l4 4-4 4" />,
    audit: <><path d="M6 3h9l3 3v15H6Z" /><path d="M15 3v4h4M9 11h6M9 15h6M9 18h4" /></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8.5h18C21 16 18 16 18 9Z" /><path d="M10 21h4" /></>,
    brand: <><path d="M12 3.2c-2.8 0-5 2.1-5 4.7 0 1 .3 1.9.8 2.7C5.6 11.3 4 13.3 4 15.8c0 2.8 2.1 5 4.8 5 1.3 0 2.5-.5 3.3-1.4.8.9 2 1.4 3.3 1.4 2.7 0 4.8-2.2 4.8-5 0-2.5-1.6-4.5-3.8-5.2.5-.8.8-1.7.8-2.7 0-2.6-2.3-4.7-5.2-4.7Z" /><path d="M12 6.7v9.9M8.7 11.7h6.6" /></>,
    calendar: <><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M8 3v4M16 3v4M3.5 10h17" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m8 10 4 4 4-4" />,
    collapse: <path d="m14 6-6 6 6 6" />,
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    doctors: <><path d="M8 3v6a4 4 0 0 0 8 0V3M5 3h6M13 3h6" /><path d="M12 13v2a5 5 0 0 0 10 0v-1" /><circle cx="20" cy="11.5" r="2" /></>,
    logout: <><path d="M10 4H5.5v16H10M14 8l4 4-4 4M8 12h10" /></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19 13.5a7.5 7.5 0 0 0 0-3l2-1.5-2-3.4-2.4 1A8 8 0 0 0 14 5.1L13.5 2h-3L10 5.1a8 8 0 0 0-2.6 1.5l-2.4-1L3 9l2 1.5a7.5 7.5 0 0 0 0 3L3 15l2 3.4 2.4-1a8 8 0 0 0 2.6 1.5l.5 3.1h3l.5-3.1a8 8 0 0 0 2.6-1.5l2.4 1 2-3.4Z" /></>,
    shield: <><path d="M12 3 5 6v5.2c0 4.5 2.8 7.8 7 9.8 4.2-2 7-5.3 7-9.8V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.5-3.2 2.5-5 5.5-5s5 1.8 5.5 5M16 7.5a2.5 2.5 0 0 1 0 5M16.5 15c2.3.2 3.7 1.6 4 4" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}
