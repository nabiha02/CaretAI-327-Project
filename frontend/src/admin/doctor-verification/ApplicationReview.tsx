import { useEffect, useState } from "react";
import { AdminIcon } from "../components/AdminIcon";
import { StatusBadge } from "../components/StatusBadge";
import { DecisionDialog, type DecisionKind } from "./DecisionDialog";
import { formatAdminDate } from "../utils/formatAdminDate";
import {
  decideDoctorApplication,
  markReviewStarted,
  type DoctorVerificationApplication,
} from "../data/adminVerificationData";
import { updateDemoDoctorReviewStatus } from "../../auth/services/demoAuth";

export function ApplicationReview({
  application,
  reviewer,
  navigate,
  onApplicationsChange,
}: {
  application?: DoctorVerificationApplication;
  reviewer: string;
  navigate: (route: string) => void;
  onApplicationsChange: (applications: DoctorVerificationApplication[]) => void;
}) {
  const [checklist, setChecklist] = useState([false, false, false, false, false]);
  const [decision, setDecision] = useState<DecisionKind | null>(null);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!application) return;
    const updated = markReviewStarted(application.id, reviewer);
    onApplicationsChange(updated);
  }, [application?.id, reviewer]);

  if (!application) {
    return <div className="admin-placeholder"><button className="admin-back-button" type="button" onClick={() => navigate("/admin/doctor-verification")}>← Back to Verification Queue</button><section className="admin-panel"><div className="admin-empty-state"><span><AdminIcon name="search" /></span><strong>Application not found</strong><p>This demo record may be unavailable or the address may be incorrect.</p></div></section></div>;
  }
  const details = [
    ["Email", application.email],
    ["Phone", application.phone ?? "Not provided"],
    ["Location", application.location ?? "Not provided"],
    ["Qualification", application.qualification],
    ["Professional title", application.professionalTitle],
    ["Specialty", application.specialty],
    ["Registration authority", application.authority],
    ["Registration country", application.registrationCountry],
    ["Registration / license no.", application.registrationNumber],
    ["Experience", application.yearsOfExperience === undefined ? "Not provided" : `${application.yearsOfExperience} years`],
    ["Institution", application.institution ?? "Not provided"],
    ["Submitted", formatAdminDate(application.submittedAt, true)],
  ];
  const checklistLabels = [
    "Applicant identity and submitted details were reviewed.",
    "Registration details were checked against the stated authority.",
    "The credential document is legible.",
    "The submitted information is consistent.",
    "Further information is required.",
  ];
  const confirmDecision = (reason: string, notes: string) => {
    if (!decision) return;
    const status = decision === "approve" ? "Approved" : decision === "reject" ? "Rejected" : "Resubmission Required";
    const updated = decideDoctorApplication({ applicationId: application.id, status, reviewer, reason, notes });
    updateDemoDoctorReviewStatus(application.email, status === "Approved" ? "approved" : status === "Rejected" ? "rejected" : "resubmission-required");
    onApplicationsChange(updated);
    setDecision(null);
    setFeedback(`${application.name}'s application was ${status === "Resubmission Required" ? "updated to require resubmission" : status.toLowerCase()}.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="admin-placeholder admin-review-page">
      <button className="admin-back-button" type="button" onClick={() => navigate("/admin/doctor-verification")}>← Back to Verification Queue</button>
      {feedback && <div className="admin-feedback" role="status"><AdminIcon name="check" size={17} /><span><strong>Decision recorded</strong>{feedback}</span><button type="button" aria-label="Dismiss message" onClick={() => setFeedback("")}>×</button></div>}
      <section className="admin-review-header">
        <div className="admin-review-preview__identity"><span>{application.initials}</span><div><small>Doctor application · Demo</small><h1>{application.name}</h1><p>{application.specialty} · Submitted {formatAdminDate(application.submittedAt)}</p></div><StatusBadge status={application.status} /></div>
        <div className="admin-review-header__boundary"><AdminIcon name="shield" size={17} /><span><strong>Professional review record</strong>Email verification is tracked separately and does not verify clinical credentials.</span></div>
      </section>
      <div className="admin-review-layout">
        <div className="admin-review-main">
          <section className="admin-panel admin-review-section">
            <header className="admin-review-section__header"><span>01</span><div><h2>Applicant Information</h2><p>Submitted identity and professional registration details.</p></div></header>
            <div className="admin-detail-grid">{details.map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong>{label === "Email" && <span className={`admin-email-status ${application.emailStatus === "Verified" ? "is-verified" : ""}`}><i />{application.emailStatus}</span>}</div>)}</div>
          </section>
          <section className="admin-panel admin-review-section">
            <header className="admin-review-section__header"><span>02</span><div><h2>Credential Documents</h2><p>Private document metadata for this frontend demonstration.</p></div></header>
            {application.document ? <div className="admin-document-card"><span><AdminIcon name="audit" size={24} /></span><div><small>{application.document.type} DOCUMENT</small><strong>{application.document.name}</strong><p>{application.document.size} · Submitted with application</p></div><div className="admin-document-unavailable"><strong>Preview unavailable</strong><span>No local demo file is attached. Metadata is shown without exposing a document.</span></div></div> : <div className="admin-document-empty"><AdminIcon name="audit" size={25} /><strong>No document available in this demo</strong><p>No file content was retained or published for this fictional application.</p></div>}
          </section>
          <section className="admin-panel admin-review-section">
            <header className="admin-review-section__header"><span>03</span><div><h2>Review Checklist</h2><p>These selections record review activity; they do not independently verify credentials.</p></div></header>
            <div className="admin-checklist">{checklistLabels.map((label, index) => <label key={label}><input type="checkbox" checked={checklist[index]} onChange={(event) => setChecklist((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.checked : item))} /><span><AdminIcon name="check" size={13} /></span><strong>{label}</strong></label>)}</div>
          </section>
        </div>
        <aside className="admin-review-aside">
          <section className="admin-panel admin-decision-panel">
            <header><small>ADMIN DECISION</small><h2>Complete review</h2><p>Every decision is confirmed and added to the demo audit history.</p></header>
            <button className="admin-decision-button is-approve" type="button" onClick={() => setDecision("approve")}><AdminIcon name="check" size={17} /><span><strong>Approve Application</strong><small>Grant demo doctor access</small></span></button>
            <button className="admin-decision-button is-corrections" type="button" onClick={() => setDecision("corrections")}><AdminIcon name="audit" size={17} /><span><strong>Request Corrections</strong><small>Require clearer information</small></span></button>
            <button className="admin-decision-button is-reject" type="button" onClick={() => setDecision("reject")}><AdminIcon name="collapse" size={17} /><span><strong>Reject Application</strong><small>Keep doctor access blocked</small></span></button>
          </section>
          <section className="admin-panel admin-history-panel">
            <header><small>DEMO AUDIT LOG</small><h2>Application History</h2></header>
            <div className="admin-history">{[...application.history].reverse().map((event) => <article key={event.id}><i /><div><strong>{event.action}</strong><p>{event.reason}</p><small>{formatAdminDate(event.timestamp, true)} · {event.reviewer}</small></div></article>)}</div>
          </section>
        </aside>
      </div>
      {decision && <DecisionDialog application={application} kind={decision} onClose={() => setDecision(null)} onConfirm={confirmDecision} />}
    </div>
  );
}
