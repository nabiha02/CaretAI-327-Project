export type ProfessionalVerificationStatus =
  | "Pending Manual Review"
  | "Approved"
  | "Rejected"
  | "Resubmission Required";

export type EmailVerificationStatus = "Verified" | "Pending";

export type CredentialDocument = {
  name: string;
  type: "PDF" | "JPG" | "PNG";
  size: string;
  previewUrl?: string;
};

export type VerificationAuditEvent = {
  id: string;
  applicationId: string;
  action:
    | "Application submitted"
    | "Email verified"
    | "Review started"
    | "Application approved"
    | "Application rejected"
    | "Corrections requested";
  reviewer: string;
  timestamp: string;
  reason?: string;
};

export type DoctorVerificationApplication = {
  id: string;
  name: string;
  initials: string;
  email: string;
  emailStatus: EmailVerificationStatus;
  phone?: string;
  location?: string;
  qualification: string;
  professionalTitle: string;
  specialty: string;
  authority: string;
  registrationCountry: string;
  registrationNumber: string;
  yearsOfExperience?: number;
  institution?: string;
  submittedAt: string;
  status: ProfessionalVerificationStatus;
  document?: CredentialDocument;
  history: VerificationAuditEvent[];
  decision?: {
    reviewer: string;
    timestamp: string;
    notes?: string;
    reason?: string;
  };
};

const submitted = (
  applicationId: string,
  timestamp: string,
  emailVerified = true,
): VerificationAuditEvent[] => {
  const events: VerificationAuditEvent[] = [
    {
      id: `${applicationId}-submitted`,
      applicationId,
      action: "Application submitted",
      reviewer: "System",
      timestamp,
    },
  ];
  if (emailVerified) {
    events.push({
      id: `${applicationId}-email`,
      applicationId,
      action: "Email verified",
      reviewer: "System",
      timestamp: new Date(new Date(timestamp).getTime() + 18 * 60 * 1000).toISOString(),
    });
  }
  return events;
};

// Fictional frontend-only records. Document metadata is illustrative; no credential
// document content is stored in browser storage or exposed through a public URL.
export const initialDoctorVerificationApplications: DoctorVerificationApplication[] = [
  {
    id: "dr-nusrat-jahan",
    name: "Dr. Nusrat Jahan",
    initials: "NJ",
    email: "nusrat.jahan@example.test",
    emailStatus: "Verified",
    phone: "+880 1712 345 678",
    location: "Dhaka, Bangladesh",
    qualification: "MBBS, FCPS (Medicine)",
    professionalTitle: "Consultant Physician",
    specialty: "Internal Medicine",
    authority: "Bangladesh Medical & Dental Council",
    registrationCountry: "Bangladesh",
    registrationNumber: "A-78421",
    yearsOfExperience: 9,
    institution: "Meadowbrook Medical Centre",
    submittedAt: "2026-09-28T08:42:00.000Z",
    status: "Pending Manual Review",
    document: { name: "medical-registration.pdf", type: "PDF", size: "1.8 MB" },
    history: submitted("dr-nusrat-jahan", "2026-09-28T08:42:00.000Z"),
  },
  {
    id: "dr-farhan-kabir",
    name: "Dr. Farhan Kabir",
    initials: "FK",
    email: "farhan.kabir@example.test",
    emailStatus: "Verified",
    phone: "+880 1811 740 255",
    location: "Chattogram, Bangladesh",
    qualification: "MBBS, DCH",
    professionalTitle: "Pediatric Medical Officer",
    specialty: "Pediatrics",
    authority: "Bangladesh Medical & Dental Council",
    registrationCountry: "Bangladesh",
    registrationNumber: "A-66390",
    yearsOfExperience: 6,
    institution: "Harbour Children’s Clinic",
    submittedAt: "2026-09-28T06:15:00.000Z",
    status: "Pending Manual Review",
    document: { name: "bmdc-certificate.jpg", type: "JPG", size: "2.4 MB" },
    history: submitted("dr-farhan-kabir", "2026-09-28T06:15:00.000Z"),
  },
  {
    id: "dr-samira-haque",
    name: "Dr. Samira Haque",
    initials: "SH",
    email: "samira.haque@example.test",
    emailStatus: "Verified",
    phone: "+880 1914 332 101",
    location: "Sylhet, Bangladesh",
    qualification: "MBBS, MRCGP",
    professionalTitle: "General Practitioner",
    specialty: "Family Medicine",
    authority: "Bangladesh Medical & Dental Council",
    registrationCountry: "Bangladesh",
    registrationNumber: "A-59117",
    yearsOfExperience: 11,
    institution: "Northgate Family Practice",
    submittedAt: "2026-09-27T11:30:00.000Z",
    status: "Resubmission Required",
    document: { name: "registration-scan.png", type: "PNG", size: "3.1 MB" },
    history: [
      ...submitted("dr-samira-haque", "2026-09-27T11:30:00.000Z"),
      {
        id: "dr-samira-haque-review",
        applicationId: "dr-samira-haque",
        action: "Review started",
        reviewer: "Farzana Ahmed",
        timestamp: "2026-09-27T14:08:00.000Z",
      },
      {
        id: "dr-samira-haque-corrections",
        applicationId: "dr-samira-haque",
        action: "Corrections requested",
        reviewer: "Farzana Ahmed",
        timestamp: "2026-09-27T14:22:00.000Z",
        reason: "Please provide a clearer scan showing the registration expiry date.",
      },
    ],
  },
  {
    id: "dr-mahmud-alam",
    name: "Dr. Mahmud Alam",
    initials: "MA",
    email: "mahmud.alam@example.test",
    emailStatus: "Pending",
    location: "Rajshahi, Bangladesh",
    qualification: "MBBS, MD (Cardiology)",
    professionalTitle: "Associate Consultant",
    specialty: "Cardiology",
    authority: "Bangladesh Medical & Dental Council",
    registrationCountry: "Bangladesh",
    registrationNumber: "A-81004",
    yearsOfExperience: 8,
    submittedAt: "2026-09-26T09:05:00.000Z",
    status: "Pending Manual Review",
    history: submitted("dr-mahmud-alam", "2026-09-26T09:05:00.000Z", false),
  },
  {
    id: "dr-adnan-chowdhury",
    name: "Dr. Adnan Chowdhury",
    initials: "AC",
    email: "adnan.chowdhury@example.test",
    emailStatus: "Verified",
    phone: "+880 1610 882 496",
    location: "Dhaka, Bangladesh",
    qualification: "MBBS, MS (Orthopaedics)",
    professionalTitle: "Orthopaedic Surgeon",
    specialty: "Orthopaedics",
    authority: "Bangladesh Medical & Dental Council",
    registrationCountry: "Bangladesh",
    registrationNumber: "A-48863",
    yearsOfExperience: 14,
    institution: "Crescent Orthopaedic Hospital",
    submittedAt: "2026-09-24T07:20:00.000Z",
    status: "Approved",
    document: { name: "professional-license.pdf", type: "PDF", size: "920 KB" },
    history: [
      ...submitted("dr-adnan-chowdhury", "2026-09-24T07:20:00.000Z"),
      {
        id: "dr-adnan-chowdhury-review",
        applicationId: "dr-adnan-chowdhury",
        action: "Review started",
        reviewer: "Farzana Ahmed",
        timestamp: "2026-09-24T10:02:00.000Z",
      },
      {
        id: "dr-adnan-chowdhury-approved",
        applicationId: "dr-adnan-chowdhury",
        action: "Application approved",
        reviewer: "Farzana Ahmed",
        timestamp: "2026-09-24T10:18:00.000Z",
      },
    ],
  },
  {
    id: "dr-tahmina-rahman",
    name: "Dr. Tahmina Rahman",
    initials: "TR",
    email: "tahmina.rahman@example.test",
    emailStatus: "Verified",
    location: "Khulna, Bangladesh",
    qualification: "MBBS, FCPS (Dermatology)",
    professionalTitle: "Dermatologist",
    specialty: "Dermatology",
    authority: "Bangladesh Medical & Dental Council",
    registrationCountry: "Bangladesh",
    registrationNumber: "A-73905",
    yearsOfExperience: 7,
    institution: "Willow Skin Centre",
    submittedAt: "2026-09-22T12:40:00.000Z",
    status: "Rejected",
    document: { name: "license-copy.pdf", type: "PDF", size: "1.1 MB" },
    history: [
      ...submitted("dr-tahmina-rahman", "2026-09-22T12:40:00.000Z"),
      {
        id: "dr-tahmina-rahman-review",
        applicationId: "dr-tahmina-rahman",
        action: "Review started",
        reviewer: "Farzana Ahmed",
        timestamp: "2026-09-23T08:10:00.000Z",
      },
      {
        id: "dr-tahmina-rahman-rejected",
        applicationId: "dr-tahmina-rahman",
        action: "Application rejected",
        reviewer: "Farzana Ahmed",
        timestamp: "2026-09-23T08:31:00.000Z",
        reason: "The registration number could not be matched to the stated authority.",
      },
    ],
  },
  {
    id: "dr-riya-sen",
    name: "Dr. Riya Sen",
    initials: "RS",
    email: "riya.sen@example.test",
    emailStatus: "Verified",
    location: "Kolkata, India",
    qualification: "MBBS, DGO",
    professionalTitle: "Obstetrician and Gynaecologist",
    specialty: "Obstetrics & Gynaecology",
    authority: "West Bengal Medical Council",
    registrationCountry: "India",
    registrationNumber: "WBMC-70218",
    yearsOfExperience: 10,
    submittedAt: "2026-09-20T05:55:00.000Z",
    status: "Approved",
    history: [
      ...submitted("dr-riya-sen", "2026-09-20T05:55:00.000Z"),
      {
        id: "dr-riya-sen-approved",
        applicationId: "dr-riya-sen",
        action: "Application approved",
        reviewer: "Farzana Ahmed",
        timestamp: "2026-09-21T09:12:00.000Z",
      },
    ],
  },
  {
    id: "dr-imran-hossain",
    name: "Dr. Imran Hossain",
    initials: "IH",
    email: "imran.hossain@example.test",
    emailStatus: "Verified",
    phone: "+880 1718 955 220",
    location: "Dhaka, Bangladesh",
    qualification: "MBBS, MD (Neurology)",
    professionalTitle: "Neurology Registrar",
    specialty: "Neurology",
    authority: "Bangladesh Medical & Dental Council",
    registrationCountry: "Bangladesh",
    registrationNumber: "A-82573",
    yearsOfExperience: 5,
    institution: "Lakeside Teaching Hospital",
    submittedAt: "2026-09-18T10:25:00.000Z",
    status: "Pending Manual Review",
    document: { name: "registration-card.png", type: "PNG", size: "1.6 MB" },
    history: submitted("dr-imran-hossain", "2026-09-18T10:25:00.000Z"),
  },
];

const storageKey = "caretai-demo-doctor-verifications";

export function getDoctorVerificationApplications() {
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(storageKey) ?? "null");
    if (!Array.isArray(stored)) return initialDoctorVerificationApplications;
    return stored as DoctorVerificationApplication[];
  } catch {
    return initialDoctorVerificationApplications;
  }
}

export function getProfessionalStatusForEmail(email: string) {
  return getDoctorVerificationApplications().find(
    (application) => application.email.toLowerCase() === email.toLowerCase(),
  )?.status;
}

function save(applications: DoctorVerificationApplication[]) {
  window.sessionStorage.setItem(storageKey, JSON.stringify(applications));
  window.dispatchEvent(new Event("caretai-verifications-changed"));
  return applications;
}

export function markReviewStarted(applicationId: string, reviewer: string) {
  const applications = getDoctorVerificationApplications();
  const application = applications.find((item) => item.id === applicationId);
  if (!application || application.history.some((event) => event.action === "Review started")) {
    return applications;
  }
  return save(applications.map((item) => item.id === applicationId
    ? {
        ...item,
        history: [...item.history, {
          id: `${item.id}-review-${Date.now()}`,
          applicationId: item.id,
          action: "Review started" as const,
          reviewer,
          timestamp: new Date().toISOString(),
        }],
      }
    : item));
}

export function decideDoctorApplication(details: {
  applicationId: string;
  status: Exclude<ProfessionalVerificationStatus, "Pending Manual Review">;
  reviewer: string;
  reason?: string;
  notes?: string;
}) {
  const applications = getDoctorVerificationApplications();
  const action = details.status === "Approved"
    ? "Application approved"
    : details.status === "Rejected"
      ? "Application rejected"
      : "Corrections requested";
  const timestamp = new Date().toISOString();
  return save(applications.map((item) => item.id === details.applicationId
    ? {
        ...item,
        status: details.status,
        decision: {
          reviewer: details.reviewer,
          timestamp,
          reason: details.reason,
          notes: details.notes,
        },
        history: [...item.history, {
          id: `${item.id}-decision-${Date.now()}`,
          applicationId: item.id,
          action,
          reviewer: details.reviewer,
          timestamp,
          reason: details.reason || details.notes,
        }],
      }
    : item));
}
