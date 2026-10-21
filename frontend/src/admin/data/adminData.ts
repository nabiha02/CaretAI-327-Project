export type AdminVerificationStatus =
  | "Pending Manual Review"
  | "Approved"
  | "Rejected"
  | "Resubmission Required";

export type AdminDoctorApplication = {
  id: string;
  name: string;
  initials: string;
  specialty: string;
  authority: string;
  submitted: string;
  status: AdminVerificationStatus;
};

export type AdminActivity = {
  id: string;
  title: string;
  detail: string;
  time: string;
  type: "submission" | "approval" | "registration";
};

// Frontend demo data. Replace this module with server-authorized Supabase queries.
export const adminMetrics = {
  totalDoctors: 128,
  pendingVerifications: 14,
  verifiedDoctors: 109,
  totalUsers: 2847,
};

export const adminDoctorApplications: AdminDoctorApplication[] = [
  {
    id: "dr-nusrat-jahan",
    name: "Dr. Nusrat Jahan",
    initials: "NJ",
    specialty: "Internal Medicine",
    authority: "BMDC",
    submitted: "Sep 28, 2026",
    status: "Pending Manual Review",
  },
  {
    id: "dr-farhan-kabir",
    name: "Dr. Farhan Kabir",
    initials: "FK",
    specialty: "Pediatrics",
    authority: "BMDC",
    submitted: "Sep 28, 2026",
    status: "Pending Manual Review",
  },
  {
    id: "dr-samira-haque",
    name: "Dr. Samira Haque",
    initials: "SH",
    specialty: "Family Medicine",
    authority: "BMDC",
    submitted: "Sep 27, 2026",
    status: "Resubmission Required",
  },
  {
    id: "dr-mahmud-alam",
    name: "Dr. Mahmud Alam",
    initials: "MA",
    specialty: "Cardiology",
    authority: "BMDC",
    submitted: "Sep 26, 2026",
    status: "Pending Manual Review",
  },
];

export const adminActivity: AdminActivity[] = [
  {
    id: "activity-1",
    title: "Credentials submitted",
    detail: "Dr. Nusrat Jahan submitted professional documents for review.",
    time: "12 minutes ago",
    type: "submission",
  },
  {
    id: "activity-2",
    title: "Application approved",
    detail: "Admin Farzana approved Dr. Adnan Chowdhury’s application.",
    time: "48 minutes ago",
    type: "approval",
  },
  {
    id: "activity-3",
    title: "New patient registered",
    detail: "A new patient account completed email verification.",
    time: "2 hours ago",
    type: "registration",
  },
  {
    id: "activity-4",
    title: "Caregiver joined",
    detail: "A caregiver account was added to the platform.",
    time: "3 hours ago",
    type: "registration",
  },
];

export const adminUserBreakdown = [
  { label: "Patients", value: 2314, percent: 81, tone: "teal" },
  { label: "Doctors", value: 128, percent: 5, tone: "blue" },
  { label: "Caregivers", value: 405, percent: 14, tone: "sand" },
] as const;
