import { useState } from "react";
import { AdminIcon } from "../components/AdminIcon";
import type { DoctorVerificationApplication } from "../data/adminVerificationData";

export type DecisionKind = "approve" | "reject" | "corrections";

export function DecisionDialog({
  application,
  kind,
  onClose,
  onConfirm,
}: {
  application: DoctorVerificationApplication;
  kind: DecisionKind;
  onClose: () => void;
  onConfirm: (reason: string, notes: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const requiresReason = kind !== "approve";
  const title = kind === "approve" ? "Approve Application" : kind === "reject" ? "Reject Application" : "Request Corrections";
  const copy = kind === "approve"
    ? `Approval grants ${application.name} access to CARETAI doctor features in this demo.`
    : kind === "reject"
      ? `${application.name} will remain blocked from doctor features.`
      : `${application.name} will remain blocked until corrections are submitted and approved.`;
  const submit = () => {
    if (requiresReason && !reason.trim()) {
      setError(kind === "reject" ? "A rejection reason is required." : "Describe the missing, unclear, or inconsistent information.");
      return;
    }
    onConfirm(reason.trim(), notes.trim());
  };
  return (
    <div className="admin-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="decision-title">
        <header><span className={`admin-dialog__icon is-${kind}`}><AdminIcon name={kind === "approve" ? "check" : kind === "reject" ? "collapse" : "audit"} /></span><div><small>Confirm admin decision</small><h2 id="decision-title">{title}</h2></div></header>
        <p>{copy}</p>
        {requiresReason && <label><span>{kind === "reject" ? "Rejection reason" : "Required corrections"} <b>*</b></span><textarea value={reason} onChange={(event) => { setReason(event.target.value); setError(""); }} rows={4} placeholder={kind === "reject" ? "Explain why this application cannot be approved" : "Specify what the applicant needs to correct or provide"} aria-invalid={Boolean(error)} />{error && <small className="admin-field-error">{error}</small>}</label>}
        <label><span>{kind === "approve" ? "Review notes" : "Additional notes"} <small>Optional</small></span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Add an internal note for this demo audit record" /></label>
        <div className="admin-dialog__notice"><AdminIcon name="shield" size={16} />This frontend action is not real-world credential verification.</div>
        <footer><button type="button" className="admin-dialog__cancel" onClick={onClose}>Cancel</button><button type="button" className={`admin-dialog__confirm is-${kind}`} onClick={submit}>Confirm {title}</button></footer>
      </section>
    </div>
  );
}
