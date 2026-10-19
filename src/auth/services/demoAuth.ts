export type DemoRole = "patient" | "caregiver" | "doctor";
export type DemoDoctorReviewStatus = "pending" | "approved" | "rejected" | "resubmission-required";

export type DemoDoctorProfile = {
  qualification?: string;
  licensingAuthority?: string;
  maskedLicenseNumber?: string;
  submittedAt?: string;
};

export type DemoAuthState = {
  version: 1;
  name: string;
  email: string;
  role: DemoRole;
  emailVerified: boolean;
  doctorReviewStatus: DemoDoctorReviewStatus | null;
  sessionActive: boolean;
  doctorProfile?: DemoDoctorProfile;
};

const storageKey = "caretai-demo-auth";
const legacyKeys = [
  "caretai-role",
  "caretai-verification-demo",
  "caretai-doctor-verification",
];

function isRole(value: unknown): value is DemoRole {
  return value === "patient" || value === "caregiver" || value === "doctor";
}

function isDoctorStatus(value: unknown): value is DemoDoctorReviewStatus {
  return value === "pending" || value === "approved" || value === "rejected" || value === "resubmission-required";
}

function writeState(state: DemoAuthState) {
  legacyKeys.forEach((key) => {
    window.sessionStorage.removeItem(key);
    window.localStorage.removeItem(key);
  });
  window.sessionStorage.setItem(storageKey, JSON.stringify(state));
  return state;
}

export function getDemoAuthState(): DemoAuthState | null {
  try {
    const stored = JSON.parse(
      window.sessionStorage.getItem(storageKey) ?? "null",
    ) as Partial<DemoAuthState> | null;

    if (
      !stored ||
      stored.version !== 1 ||
      typeof stored.name !== "string" ||
      typeof stored.email !== "string" ||
      !isRole(stored.role) ||
      typeof stored.emailVerified !== "boolean" ||
      typeof stored.sessionActive !== "boolean"
    ) {
      return null;
    }

    const doctorReviewStatus =
      stored.role === "doctor" && isDoctorStatus(stored.doctorReviewStatus)
        ? stored.doctorReviewStatus
        : stored.role === "doctor"
          ? "pending"
          : null;

    return {
      version: 1,
      name: stored.name,
      email: stored.email,
      role: stored.role,
      emailVerified: stored.emailVerified,
      doctorReviewStatus,
      sessionActive: stored.sessionActive,
      doctorProfile: stored.doctorProfile,
    };
  } catch {
    return null;
  }
}

function maskRegistrationNumber(value: string) {
  const compact = value.trim();
  if (!compact) return undefined;
  const visible = compact.slice(-4);
  return `${"•".repeat(Math.max(4, compact.length - visible.length))}${visible}`;
}

export function beginDemoRegistration(details: {
  name: string;
  email: string;
  role: DemoRole;
  doctorProfile?: {
    qualification: string;
    licensingAuthority: string;
    licenseNumber: string;
  };
}) {
  const doctorProfile =
    details.role === "doctor" && details.doctorProfile
      ? {
          qualification: details.doctorProfile.qualification.trim() || undefined,
          licensingAuthority:
            details.doctorProfile.licensingAuthority.trim() || undefined,
          maskedLicenseNumber: maskRegistrationNumber(
            details.doctorProfile.licenseNumber,
          ),
          submittedAt: new Date().toISOString(),
        }
      : undefined;

  return writeState({
    version: 1,
    name: details.name.trim(),
    email: details.email.trim(),
    role: details.role,
    emailVerified: false,
    doctorReviewStatus: details.role === "doctor" ? "pending" : null,
    sessionActive: false,
    doctorProfile,
  });
}

export function updateDemoEmail(email: string) {
  const current = getDemoAuthState();
  if (!current) return null;
  return writeState({
    ...current,
    email: email.trim(),
    emailVerified: false,
    sessionActive: false,
  });
}

export function verifyDemoEmail() {
  const current = getDemoAuthState();
  if (!current) return null;
  return writeState({
    ...current,
    emailVerified: true,
    sessionActive: true,
    doctorReviewStatus:
      current.role === "doctor"
        ? current.doctorReviewStatus ?? "pending"
        : null,
  });
}

export function startDemoSession(details: {
  email: string;
  role: DemoRole;
}) {
  const emailName = details.email.split("@")[0].replace(/[._-]+/g, " ").trim();
  const professionalStatus = details.role === "doctor"
    ? getProfessionalStatusForEmail(details.email.trim())
    : undefined;
  const doctorReviewStatus: DemoDoctorReviewStatus | null = details.role !== "doctor"
    ? null
    : professionalStatus === "Approved"
      ? "approved"
      : professionalStatus === "Rejected"
        ? "rejected"
        : professionalStatus === "Resubmission Required"
          ? "resubmission-required"
          : "pending";
  return writeState({
    version: 1,
    name: emailName || "Demo User",
    email: details.email.trim(),
    role: details.role,
    emailVerified: true,
    doctorReviewStatus,
    sessionActive: true,
  });
}

export function getActiveDemoRole(): DemoRole | null {
  const state = getDemoAuthState();
  return state?.sessionActive && state.emailVerified ? state.role : null;
}

export function updateDemoDoctorReviewStatus(
  email: string,
  status: DemoDoctorReviewStatus,
) {
  const current = getDemoAuthState();
  if (
    !current ||
    current.role !== "doctor" ||
    current.email.toLowerCase() !== email.toLowerCase()
  ) {
    return null;
  }
  return writeState({ ...current, doctorReviewStatus: status });
}

export function clearDemoSession() {
  window.sessionStorage.removeItem(storageKey);
  legacyKeys.forEach((key) => {
    window.sessionStorage.removeItem(key);
    window.localStorage.removeItem(key);
  });
}
import { getProfessionalStatusForEmail } from "../../admin/data/adminVerificationData";
