import type { IconName } from "../types";

export const navItems: { label: string; icon: IconName }[] = [
  { label: "Home", icon: "home" },
  { label: "My Visits", icon: "visits" },
  { label: "Start a Visit", icon: "plus" },
  { label: "Care Plan", icon: "care" },
  { label: "Patient Profile", icon: "user" },
  { label: "Settings", icon: "settings" },
];

export const patientRoutes: Record<string, string> = {
  Home: "/patient/dashboard",
  "My Visits": "/patient/visits",
  "Start a Visit": "/patient/start-visit",
  "Care Plan": "/patient/care-plan",
  "Patient Profile": "/patient/profile",
  Settings: "/patient/settings",
  Notifications: "/patient/notifications",
};
