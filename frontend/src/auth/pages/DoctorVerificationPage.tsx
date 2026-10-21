import { useState } from "react";
import { Link } from "react-router";
import { getDemoAuthState } from "../services/demoAuth";
import { CaretaiBrand } from "../components/CaretaiBrand";
import "../styles/doctor-verification.css";

const statusContent = {
  pending: {
    label: "Pending Manual Review",
    heading: "Your credentials are awaiting review.",
    description:
      "Your doctor registration has been submitted. The CARETAI team will manually review your professional information before doctor-dashboard access is enabled.",
  },
  approved: {
    label: "Approved",
    heading: "Your credentials have been approved.",
    description:
      "Your professional information has completed manual review.",
  },
  rejected: {
    label: "Rejected / Resubmission Required",
    heading: "Your credentials need an update.",
    description:
      "The review team needs corrected professional information before doctor-dashboard access can be enabled.",
  },
  "resubmission-required": {
    label: "Rejected / Resubmission Required",
    heading: "Your credentials need an update.",
    description:
      "The review team needs corrected professional information before doctor-dashboard access can be enabled.",
  },
} as const;

function PendingStatusIcon() {
  return (
    <div className="doctor-verification-icon" aria-hidden="true">
      <span />
      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M24 7 11 12.5v9.7c0 8.4 5.1 14.6 13 18.3 7.9-3.7 13-9.9 13-18.3v-9.7L24 7Z" />
        <path d="M18.5 24h11M24 18.5v11" />
      </svg>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="m5 10.2 3.1 3.1 6.9-7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatSubmissionDate(value?: string) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function DoctorVerificationPage() {
  const [showCorrectionNote, setShowCorrectionNote] = useState(false);
  const session = getDemoAuthState();
  const status = session?.doctorReviewStatus ?? "pending";
  const record = session?.doctorProfile;
  const content = statusContent[status];
  const summary = [
    ["Doctor's name", session?.name || "Not provided"],
    ["Professional qualification", record?.qualification || "Not provided"],
    ["Registration authority", record?.licensingAuthority || "Not provided"],
    ["Registration number", record?.maskedLicenseNumber || "Not available"],
    ["Submitted", formatSubmissionDate(record?.submittedAt)],
  ];

  return (
    <main className="doctor-verification-page">
      <header className="doctor-verification-header">
        <CaretaiBrand />
        <span>Professional access is review-gated</span>
      </header>

      <section
        className={`doctor-verification-card doctor-verification-card--${status}`}
      >
        <div className="doctor-verification-hero">
          <PendingStatusIcon />
          <span className="doctor-verification-eyebrow">
            PROFESSIONAL VERIFICATION
          </span>
          <h1>{content.heading}</h1>
          <p>{content.description}</p>
        </div>

        <div className="doctor-verification-status" role="status">
          <div>
            <span>Current status</span>
            <strong>{content.label}</strong>
          </div>
          <span className="doctor-verification-status__pill">
            <i aria-hidden="true" />
            {status === "approved" ? "Approved" : status === "pending" ? "In review" : "Action needed"}
          </span>
        </div>

        <ol
          className="doctor-verification-progress"
          aria-label="Verification progress"
        >
          <li className="is-complete">
            <span>
              <CheckIcon />
            </span>
            <div>
              <strong>Registration submitted</strong>
              <small>Complete</small>
            </div>
          </li>
          <li className="is-complete">
            <span>
              <CheckIcon />
            </span>
            <div>
              <strong>Email verification</strong>
              <small>Complete · Demo state</small>
            </div>
          </li>
          <li className="is-pending">
            <span>3</span>
            <div>
              <strong>Professional review</strong>
              <small>Pending</small>
            </div>
          </li>
        </ol>

        <section
          className="doctor-verification-summary"
          aria-labelledby="submission-summary-title"
        >
          <header>
            <div>
              <span>SUBMISSION SUMMARY</span>
              <h2 id="submission-summary-title">Professional details</h2>
            </div>
            <small>Sensitive documents are not shown</small>
          </header>
          <dl>
            {summary.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd className={value.includes("Not ") ? "is-empty" : ""}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="doctor-verification-actions">
          <Link to="/">
            Return to CARETAI Home <span aria-hidden="true">→</span>
          </Link>
          <Link to="/logout">Sign Out</Link>
        </div>

        <div className="doctor-verification-correction">
          <button
            type="button"
            aria-expanded={showCorrectionNote}
            onClick={() => setShowCorrectionNote((current) => !current)}
          >
            Need to correct your details?
          </button>
          {showCorrectionNote && (
            <p role="status">
              Corrections and resubmissions will be handled by the review team
              when the manual-review workflow is available. No action is needed
              right now.
            </p>
          )}
        </div>
      </section>

      <footer>
        CARETAI · Doctor access is enabled only after professional review
      </footer>
    </main>
  );
}
