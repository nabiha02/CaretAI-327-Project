import { useRef, useState, type ReactNode } from "react";
import {
  getPatientProfile,
  type ApprovedRecommendations,
  type PatientProfileSeed,
  type ProfileMedication,
} from "../data/doctorPatientData";

type ProfileIconName =
  | "user"
  | "phone"
  | "shield"
  | "heart"
  | "pill"
  | "alert"
  | "clipboard"
  | "chat"
  | "mic"
  | "report"
  | "calendar"
  | "sparkle"
  | "check"
  | "edit"
  | "chevron"
  | "plus"
  | "trash"
  | "info";

function ProfileIcon({ name, size = 18 }: { name: ProfileIconName; size?: number }) {
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
  const paths: Record<ProfileIconName, ReactNode> = {
    user: <><circle cx="12" cy="8" r="3.4" /><path d="M5.5 19c.6-3.4 2.9-5.2 6.5-5.2s5.9 1.8 6.5 5.2" /></>,
    phone: <path d="M6 3h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5V18a3 3 0 0 1-3 3A15 15 0 0 1 3 6a3 3 0 0 1 3-3Z" />,
    shield: <><path d="M12 3 5 6v5.2c0 4.5 2.8 7.8 7 9.8 4.2-2 7-5.3 7-9.8V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
    heart: <><path d="M12 20s-7.5-4.4-7.5-10.2A4.3 4.3 0 0 1 12 6.9a4.3 4.3 0 0 1 7.5 2.9C19.5 15.6 12 20 12 20Z" /><path d="M8.5 12h2l1-2.2 1.3 4.1 1-1.9h1.7" /></>,
    pill: <><path d="m8.2 16.8 8.6-8.6a3.5 3.5 0 0 0-5-5l-8.6 8.6a3.5 3.5 0 0 0 5 5Z" /><path d="m8 7 5 5" /></>,
    alert: <><path d="M12 4 2.5 20h19L12 4Z" /><path d="M12 10v4M12 17h.01" /></>,
    clipboard: <><rect x="5" y="4.5" width="14" height="16" rx="2.2" /><path d="M9 4.5V3h6v1.5M8.5 10h7M8.5 14h7M8.5 17h4" /></>,
    chat: <path d="M4 5h16v11H8l-4 4V5Z" />,
    mic: <><rect x="9" y="3" width="6" height="10" rx="3" /><path d="M6 11a6 6 0 0 0 12 0M12 17v3M9 20h6" /></>,
    report: <><path d="M6 3h9l3 3v15H6Z" /><path d="M15 3v4h4M9 11h6M9 15h6M9 18h4" /></>,
    calendar: <><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M8 3v4M16 3v4M3.5 10h17" /></>,
    sparkle: <><path d="M12 4v5M12 15v5M4 12h5M15 12h5" /><path d="m7 7 3 3M14 14l3 3M17 7l-3 3M10 14l-3 3" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    edit: <><path d="M4 20h4l10-10-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></>,
    chevron: <path d="m9 6 6 6-6 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    trash: <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6" />,
    info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

const DISCLAIMER = "This tool collects information for a doctor; it does not provide a diagnosis.";

type ProfileTab = "overview" | "history" | "details" | "care";

function cloneRecommendations(value: ApprovedRecommendations): ApprovedRecommendations {
  return JSON.parse(JSON.stringify(value)) as ApprovedRecommendations;
}

function statusSlug(status: string) {
  return status.toLowerCase().split(" ").join("-").split("/").join("");
}

type NextAction = { tone: "request" | "followup" | "done" | "review"; icon: ProfileIconName; label: string; text: string };

// The next step is derived only from the patient's existing workflow status and
// the request / follow-up fields already on the record. No clinical decision is invented.
function nextActionFor(patient: PatientProfileSeed): NextAction | null {
  if (patient.request) {
    return { tone: "request", icon: "alert", label: "Information requested", text: patient.request };
  }
  if (patient.followupDate) {
    return { tone: "followup", icon: "calendar", label: "Follow-up", text: `Due ${patient.followupDate}` };
  }
  switch (patient.status) {
    case "New / Pending":
      return { tone: "review", icon: "info", label: "Next step", text: "Review the latest visit." };
    case "Under Review":
      return { tone: "review", icon: "info", label: "Next step", text: "Continue the review." };
    case "More Information Needed":
      return { tone: "request", icon: "alert", label: "Next step", text: "Awaiting additional patient information." };
    case "Care Plan Confirmed":
      return { tone: "done", icon: "check", label: "Status", text: "Care plan confirmed. No action requested." };
    case "Follow-up Needed":
      return { tone: "followup", icon: "calendar", label: "Next step", text: "Follow-up required." };
    default:
      return null;
  }
}

function ReviewTag({ children }: { children: ReactNode }) {
  return <span className="doctor-profile-tag">{children}</span>;
}

function EmptyRow({ text }: { text: string }) {
  return <p className="doctor-profile-empty">{text}</p>;
}

export default function DoctorPatientProfile({ patient }: { patient: PatientProfileSeed }) {
  const profile = getPatientProfile(patient);
  const [tab, setTab] = useState<ProfileTab>("overview");
  const [approved, setApproved] = useState<ApprovedRecommendations>(() =>
    cloneRecommendations(profile.doctorRecommendations),
  );
  const [draft, setDraft] = useState<ApprovedRecommendations>(() =>
    cloneRecommendations(profile.doctorRecommendations),
  );
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [openVisits, setOpenVisits] = useState<number[]>([]);
  const savedTimer = useRef<number | null>(null);

  const beginEdit = () => {
    setDraft(cloneRecommendations(approved));
    setEditing(true);
    setSaved(false);
  };

  const cancelEdit = () => {
    setDraft(cloneRecommendations(approved));
    setEditing(false);
  };

  const saveRecommendations = () => {
    setApproved(cloneRecommendations(draft));
    setEditing(false);
    setSaved(true);
    if (savedTimer.current) window.clearTimeout(savedTimer.current);
    savedTimer.current = window.setTimeout(() => setSaved(false), 3200);
  };

  const toggleVisit = (id: number) =>
    setOpenVisits((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );

  const updateMedication = (index: number, key: keyof ProfileMedication, value: string) =>
    setDraft((current) => ({
      ...current,
      medications: current.medications.map((medication, position) =>
        position === index ? { ...medication, [key]: value } : medication,
      ),
    }));

  const updateTest = (index: number, key: "name" | "instruction" | "status", value: string) =>
    setDraft((current) => ({
      ...current,
      tests: current.tests.map((test, position) =>
        position === index ? { ...test, [key]: value } : test,
      ),
    }));

  const updateDiet = (index: number, value: string) =>
    setDraft((current) => ({
      ...current,
      diet: current.diet.map((item, position) => (position === index ? value : item)),
    }));

  const hasApproved =
    approved.medications.length ||
    approved.tests.length ||
    approved.diet.length ||
    approved.instructions;

  const nextAction = nextActionFor(patient);

  const tabs: { key: ProfileTab; label: string; count?: number }[] = [
    { key: "overview", label: "Overview" },
    { key: "history", label: "Visit History", count: profile.previousVisits.length },
    { key: "details", label: "Visit Details" },
    { key: "care", label: "Care Plan" },
  ];

  return (
    <div className="doctor-profile">
      {profile.isGenericDemo && (
        <div className="doctor-profile__banner">
          <ProfileIcon name="alert" size={17} />
          <div>
            <strong>Fictional demo profile</strong>
            <p>
              No detailed records are available for this patient. This explicit demo profile is
              shown so the full clinical layout can be explored.
            </p>
          </div>
        </div>
      )}

      <section className="doctor-profile-header">
        <div className="doctor-patient-avatar">{profile.initials}</div>
        <div className="doctor-profile-header__identity">
          <span>{profile.patientId} · Fictional demo record</span>
          <h1>{profile.name}</h1>
          <p>{profile.age} · {profile.ageGroup} · {profile.gender} · {profile.phone}</p>
        </div>
        <span className={`doctor-status doctor-status--${statusSlug(patient.status)}`}>
          <i />
          {patient.status === "New / Pending" ? "Pending Review" : patient.status}
        </span>
      </section>

      <section className="doctor-profile-strip" aria-label="Patient overview">
        <div className="doctor-profile-strip__item">
          <span>Current concern</span>
          <strong>{patient.issue}</strong>
        </div>
        <div className="doctor-profile-strip__item">
          <span>Latest visit</span>
          <strong><ProfileIcon name={patient.mode === "Voice" ? "mic" : "chat"} size={12} /> Visit #{patient.visit} · {patient.visitDate}</strong>
          <p>{patient.mode} · {patient.language}</p>
        </div>
        {nextAction && (
          <div className={`doctor-profile-strip__action doctor-profile-strip__action--${nextAction.tone}`}>
            <ProfileIcon name={nextAction.icon} size={15} />
            <div>
              <span>{nextAction.label}</span>
              <p>{nextAction.text}</p>
            </div>
          </div>
        )}
      </section>

      <nav className="doctor-profile-tabs" role="tablist" aria-label="Patient profile sections">
        {tabs.map((item) => (
          <button
            className={tab === item.key ? "active" : ""}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            key={item.key}
            onClick={() => setTab(item.key)}
          >
            {item.label}
            {item.count !== undefined && <b>{item.count}</b>}
          </button>
        ))}
      </nav>

      {tab === "overview" && (
        <div className="doctor-profile-panel" role="tabpanel" aria-label="Overview">
          <section className="doctor-card">
            <div className="doctor-card__head">
              <span className="doctor-card__icon"><ProfileIcon name="user" size={17} /></span>
              <div>
                <h2>Patient information</h2>
                <p>Identity and caregiver contact recorded for this fictional demo</p>
              </div>
            </div>

            <div className="doctor-profile-subsection">
              <h3>Patient</h3>
              <dl className="doctor-profile-kv">
                <div><dt>Date of birth</dt><dd>{profile.dateOfBirth}</dd></div>
                <div><dt>Age</dt><dd>{profile.age}</dd></div>
                <div><dt>Gender</dt><dd>{profile.gender}</dd></div>
                <div><dt>Blood group</dt><dd>{profile.bloodGroup}</dd></div>
                <div><dt>Preferred language</dt><dd>{profile.preferredLanguage}</dd></div>
                <div><dt>Address</dt><dd>{profile.address}</dd></div>
              </dl>
            </div>

            <div className="doctor-profile-subsection">
              <h3>Caregiver</h3>
              <dl className="doctor-profile-kv">
                <div><dt>Name</dt><dd>{profile.caregiver.name}</dd></div>
                <div><dt>Relationship</dt><dd>{profile.caregiver.relationship}</dd></div>
                <div><dt>Phone</dt><dd>{profile.caregiver.phone}</dd></div>
                <div><dt>Email</dt><dd>{profile.caregiver.email}</dd></div>
              </dl>
            </div>
          </section>

          <section className="doctor-card">
            <div className="doctor-card__head">
              <span className="doctor-card__icon"><ProfileIcon name="clipboard" size={17} /></span>
              <div>
                <h2>Medical background</h2>
                <p>Fictional demo history, conditions, allergies, and medications</p>
              </div>
            </div>

            <div className="doctor-profile-grid doctor-profile-grid--2 doctor-profile-subgrid">
              <div className="doctor-profile-subsection">
                <h3>Existing conditions</h3>
                {profile.existingConditions.length ? (
                  <div className="doctor-chip-row">
                    {profile.existingConditions.map((condition) => (
                      <span className="doctor-chip" key={condition.name}>
                        {condition.name} · {condition.since}
                        <b className={`doctor-chip__state doctor-chip__state--${condition.status.toLowerCase()}`}>
                          {condition.status}
                        </b>
                      </span>
                    ))}
                  </div>
                ) : (
                  <EmptyRow text="No existing conditions recorded in this fictional demo." />
                )}
              </div>

              <div className="doctor-profile-subsection">
                <h3>Allergies</h3>
                {profile.allergies.length ? (
                  <div className="doctor-profile-list">
                    {profile.allergies.map((allergy) => (
                      <article className={`doctor-allergy doctor-allergy--${allergy.severity.toLowerCase()}`} key={allergy.substance}>
                        <div>
                          <strong>{allergy.substance}</strong>
                          <p>{allergy.reaction}</p>
                        </div>
                        <span>{allergy.severity}</span>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyRow text="No known allergies recorded in this fictional demo." />
                )}
              </div>
            </div>

            <div className="doctor-profile-grid doctor-profile-grid--2 doctor-profile-subgrid">
              <div className="doctor-profile-subsection">
                <h3>Current medications</h3>
                {profile.currentMedications.length ? (
                  <div className="doctor-profile-list">
                    {profile.currentMedications.map((medication) => (
                      <article className="doctor-profile-med" key={medication.name}>
                        <div className="doctor-profile-med__top">
                          <strong>{medication.name}</strong>
                          <span>{medication.schedule}</span>
                        </div>
                        <p>
                          {medication.dose} · {medication.duration} · {medication.meal}
                        </p>
                        <small>{medication.instruction}</small>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyRow text="No current medications recorded in this fictional demo." />
                )}
              </div>

              <div className="doctor-profile-subsection">
                <h3>Past medications</h3>
                {profile.pastMedications.length ? (
                  <div className="doctor-profile-list">
                    {profile.pastMedications.map((medication) => (
                      <article className="doctor-profile-med doctor-profile-med--muted" key={medication.name}>
                        <div className="doctor-profile-med__top">
                          <strong>{medication.name}</strong>
                          <span>{medication.period}</span>
                        </div>
                        <p>{medication.reason}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyRow text="No past medications recorded in this fictional demo." />
                )}
              </div>
            </div>

            <div className="doctor-profile-subsection">
              <h3>Medical history</h3>
              <ul className="doctor-profile-history">
                {profile.medicalHistory.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="doctor-ai-card">
            <div className="doctor-card__head">
              <span className="doctor-card__icon doctor-card__icon--ai"><ProfileIcon name="sparkle" size={17} /></span>
              <div>
                <h2>AI-generated visit summary</h2>
                <p><span className="doctor-ai-badge"><ProfileIcon name="sparkle" size={11} /> AI-generated</span></p>
              </div>
            </div>
            <p className="doctor-profile-summary">{profile.aiVisitSummary}</p>
            <p className="doctor-ai-note">
              AI-organized from the reported conversation. This is not a diagnosis and must be reviewed by a doctor.
            </p>
          </section>
        </div>
      )}

      {tab === "history" && (
        <div className="doctor-profile-panel" role="tabpanel" aria-label="Visit History">
          <section className="doctor-card">
            <div className="doctor-card__head">
              <span className="doctor-card__icon"><ProfileIcon name="report" size={17} /></span>
              <div>
                <h2>Previous visits</h2>
                <p>{profile.previousVisits.length} historical {profile.previousVisits.length === 1 ? "record" : "records"} in this fictional demo</p>
              </div>
            </div>
            {profile.previousVisits.length ? (
              <div className="doctor-profile-visits">
                {profile.previousVisits.map((visit) => {
                  const open = openVisits.includes(visit.id);
                  return (
                    <article className={`doctor-visit ${open ? "doctor-visit--open" : ""}`} key={visit.id}>
                      <button className="doctor-visit__toggle" type="button" aria-expanded={open} onClick={() => toggleVisit(visit.id)}>
                        <span className="doctor-visit__icon"><ProfileIcon name={visit.mode === "Voice" ? "mic" : "chat"} size={16} /></span>
                        <div>
                          <strong>Visit #{visit.id} · {visit.concern}</strong>
                          <p>{visit.date} · {visit.mode} · {visit.language}</p>
                        </div>
                        <ProfileIcon name="chevron" size={15} />
                      </button>
                      {open && (
                        <div className="doctor-visit__body">
                          <p className="doctor-visit__summary">{visit.summary}</p>
                          <div className="doctor-chip-row">
                            {visit.mainPoints.map((point) => (
                              <span className="doctor-chip" key={point}>{point}</span>
                            ))}
                          </div>
                          <div className="doctor-visit__review"><ReviewTag>{visit.review}</ReviewTag></div>
                          {visit.recommendations && (
                            <div className="doctor-visit__recs">
                              <h4>Doctor recommendations at this visit</h4>
                              {visit.recommendations.medications.length > 0 && (
                                <p><strong>Medications:</strong> {visit.recommendations.medications.map((m) => `${m.name} · ${m.schedule} · ${m.duration}`).join("; ")}</p>
                              )}
                              {visit.recommendations.tests.length > 0 && (
                                <p><strong>Tests:</strong> {visit.recommendations.tests.map((t) => `${t.name} · ${t.status}`).join("; ")}</p>
                              )}
                              {visit.recommendations.diet.length > 0 && (
                                <p><strong>Diet:</strong> {visit.recommendations.diet.join(" ")}</p>
                              )}
                              <p><strong>Instructions:</strong> {visit.recommendations.instructions}</p>
                            </div>
                          )}
                          {visit.followUp && (
                            <p className="doctor-visit__followup"><strong>Follow-up:</strong> {visit.followUp.date} — {visit.followUp.instruction}</p>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <EmptyRow text="No previous visits recorded for this fictional demo profile." />
            )}
          </section>

          <section className="doctor-card">
            <div className="doctor-card__head">
              <span className="doctor-card__icon"><ProfileIcon name="calendar" size={17} /></span>
              <div>
                <h2>Follow-up history</h2>
                <p>Recommended and completed follow-ups</p>
              </div>
            </div>
            {profile.followUpHistory.length ? (
              <div className="doctor-profile-list">
                {profile.followUpHistory.map((followUp) => (
                  <article className="doctor-followup" key={`${followUp.visit}-${followUp.due}`}>
                    <div>
                      <strong>{followUp.visit} · {followUp.due}</strong>
                      <p>{followUp.note}</p>
                    </div>
                    <span className={`doctor-followup__status doctor-followup__status--${followUp.status.toLowerCase()}`}>{followUp.status}</span>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyRow text="No follow-up history recorded for this fictional demo profile." />
            )}
          </section>
        </div>
      )}

      {tab === "details" && (
        <div className="doctor-profile-panel" role="tabpanel" aria-label="Visit Details">
          <section className="doctor-card">
            <div className="doctor-card__head">
              <span className="doctor-card__icon"><ProfileIcon name={profile.currentConsultation.mode === "Voice" ? "mic" : "chat"} size={17} /></span>
              <div>
                <h2>Current consultation</h2>
                <p>{profile.currentConsultation.date} · {profile.currentConsultation.mode} · {profile.currentConsultation.language}</p>
              </div>
            </div>
            <div className="doctor-profile-subsection">
              <h3>Major points reported</h3>
              <div className="doctor-chip-row">
                {profile.currentConsultation.mainPoints.map((point) => (
                  <span className="doctor-chip doctor-chip--point" key={point}>{point}</span>
                ))}
              </div>
            </div>
            <button className="doctor-profile-toggle" type="button" aria-expanded={transcriptOpen} onClick={() => setTranscriptOpen((current) => !current)}>
              <ProfileIcon name="chat" size={15} />
              {transcriptOpen ? "Hide full conversation" : "View full conversation"}
              <ProfileIcon name="chevron" size={14} />
            </button>
            {transcriptOpen && (
              <div className="doctor-conversation" role="log" aria-label="Full conversation transcript">
                {profile.currentConsultation.conversation.map((message, index) => (
                  <div className={`doctor-message ${message.author === "Caregiver" ? "doctor-message--caregiver" : ""}`} key={`${message.author}-${index}`}>
                    <span>{message.author}</span>
                    <p>{message.text}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="doctor-card">
            <div className="doctor-card__head">
              <span className="doctor-card__icon"><ProfileIcon name="report" size={17} /></span>
              <div>
                <h2>Reports</h2>
                <p>Test and document status in this fictional demo</p>
              </div>
            </div>
            {profile.reports.length ? (
              <div className="doctor-profile-list">
                {profile.reports.map((report) => (
                  <article className="doctor-report" key={report.name}>
                    <div>
                      <strong>{report.name}</strong>
                      <p>{report.date}</p>
                    </div>
                    <span className={`doctor-report__status doctor-report__status--${report.status.toLowerCase()}`}>{report.status}</span>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyRow text="No reports recorded for this fictional demo profile." />
            )}
          </section>

          <section className="doctor-ai-card">
            <div className="doctor-card__head">
              <span className="doctor-card__icon doctor-card__icon--ai"><ProfileIcon name="sparkle" size={17} /></span>
              <div>
                <h2>AI suggestions</h2>
                <p><span className="doctor-ai-badge"><ProfileIcon name="sparkle" size={11} /> For doctor review</span></p>
              </div>
            </div>
            <div className="doctor-profile-list">
              {profile.aiSuggestions.map((suggestion) => (
                <article className="doctor-suggestion" key={suggestion.text}>
                  <span className="doctor-suggestion__category">{suggestion.category}</span>
                  <p>{suggestion.text}</p>
                </article>
              ))}
            </div>
            <p className="doctor-ai-note">
              These are prompts for the doctor to consider. CARETAI does not diagnose or prescribe. All
              clinical decisions remain with the doctor.
            </p>
          </section>
        </div>
      )}

      {tab === "care" && (
        <div className="doctor-profile-panel" role="tabpanel" aria-label="Care Plan">
          <section className="doctor-approved-card">
            <div className="doctor-approved-head">
              <span className="doctor-card__icon doctor-card__icon--approved"><ProfileIcon name="shield" size={17} /></span>
              <div>
                <h2>Doctor-approved care plan</h2>
                <p>
                  <span className="doctor-approved-badge"><ProfileIcon name="check" size={11} /> Doctor-approved</span>
                  <span className="doctor-approved-meta">Updated by {approved.updatedBy} · {approved.updatedAt}</span>
                </p>
              </div>
              {!editing && (
                <button className="doctor-btn doctor-btn--secondary" type="button" onClick={beginEdit}>
                  <ProfileIcon name="edit" size={14} /> Edit recommendations
                </button>
              )}
            </div>

            {saved && (
              <div className="doctor-saved-confirmation" role="status">
                <ProfileIcon name="check" size={15} /> Recommendations saved. (Demo — kept in this session only.)
              </div>
            )}

            {editing ? (
              <div className="doctor-editor">
                <div className="doctor-editor__group">
                  <h3>Medications</h3>
                  {draft.medications.map((medication, index) => (
                    <div className="doctor-editor__row" key={`medication-${index}`}>
                      <label className="doctor-field"><span>Name</span><input value={medication.name} onChange={(event) => updateMedication(index, "name", event.target.value)} /></label>
                      <label className="doctor-field"><span>Dose</span><input value={medication.dose} onChange={(event) => updateMedication(index, "dose", event.target.value)} /></label>
                      <label className="doctor-field"><span>Schedule</span><input value={medication.schedule} onChange={(event) => updateMedication(index, "schedule", event.target.value)} /></label>
                      <label className="doctor-field"><span>Duration</span><input value={medication.duration} onChange={(event) => updateMedication(index, "duration", event.target.value)} /></label>
                      <label className="doctor-field"><span>Meal</span><input value={medication.meal} onChange={(event) => updateMedication(index, "meal", event.target.value)} /></label>
                      <label className="doctor-field doctor-field--wide"><span>Instruction</span><input value={medication.instruction} onChange={(event) => updateMedication(index, "instruction", event.target.value)} /></label>
                      <button className="doctor-btn doctor-btn--danger doctor-editor__remove" type="button" onClick={() => setDraft((current) => ({ ...current, medications: current.medications.filter((_, position) => position !== index) }))}>
                        <ProfileIcon name="trash" size={13} /> Remove
                      </button>
                    </div>
                  ))}
                  <button className="doctor-btn doctor-btn--secondary" type="button" onClick={() => setDraft((current) => ({ ...current, medications: [...current.medications, { name: "", dose: "", schedule: "", duration: "", meal: "", instruction: "" }] }))}>
                    <ProfileIcon name="plus" size={13} /> Add medication
                  </button>
                </div>

                <div className="doctor-editor__group">
                  <h3>Tests</h3>
                  {draft.tests.map((test, index) => (
                    <div className="doctor-editor__row doctor-editor__row--compact" key={`test-${index}`}>
                      <label className="doctor-field"><span>Name</span><input value={test.name} onChange={(event) => updateTest(index, "name", event.target.value)} /></label>
                      <label className="doctor-field"><span>Status</span><input value={test.status} onChange={(event) => updateTest(index, "status", event.target.value)} /></label>
                      <label className="doctor-field doctor-field--wide"><span>Instruction</span><input value={test.instruction} onChange={(event) => updateTest(index, "instruction", event.target.value)} /></label>
                      <button className="doctor-btn doctor-btn--danger doctor-editor__remove" type="button" onClick={() => setDraft((current) => ({ ...current, tests: current.tests.filter((_, position) => position !== index) }))}>
                        <ProfileIcon name="trash" size={13} /> Remove
                      </button>
                    </div>
                  ))}
                  <button className="doctor-btn doctor-btn--secondary" type="button" onClick={() => setDraft((current) => ({ ...current, tests: [...current.tests, { name: "", instruction: "", status: "" }] }))}>
                    <ProfileIcon name="plus" size={13} /> Add test
                  </button>
                </div>

                <div className="doctor-editor__group">
                  <h3>Diet guidance</h3>
                  {draft.diet.map((item, index) => (
                    <div className="doctor-editor__row doctor-editor__row--single" key={`diet-${index}`}>
                      <label className="doctor-field doctor-field--wide"><span>Item {index + 1}</span><input value={item} onChange={(event) => updateDiet(index, event.target.value)} /></label>
                      <button className="doctor-btn doctor-btn--danger doctor-editor__remove" type="button" onClick={() => setDraft((current) => ({ ...current, diet: current.diet.filter((_, position) => position !== index) }))}>
                        <ProfileIcon name="trash" size={13} /> Remove
                      </button>
                    </div>
                  ))}
                  <button className="doctor-btn doctor-btn--secondary" type="button" onClick={() => setDraft((current) => ({ ...current, diet: [...current.diet, ""] }))}>
                    <ProfileIcon name="plus" size={13} /> Add diet item
                  </button>
                </div>

                <div className="doctor-editor__group">
                  <h3>Instructions &amp; follow-up</h3>
                  <label className="doctor-field doctor-field--wide">
                    <span>Doctor's instructions</span>
                    <textarea rows={3} value={draft.instructions} onChange={(event) => setDraft((current) => ({ ...current, instructions: event.target.value }))} />
                  </label>
                  <div className="doctor-editor__row doctor-editor__row--compact">
                    <label className="doctor-field"><span>Follow-up date</span><input value={draft.followUp.date} onChange={(event) => setDraft((current) => ({ ...current, followUp: { ...current.followUp, date: event.target.value } }))} /></label>
                    <label className="doctor-field doctor-field--wide"><span>Follow-up guidance</span><input value={draft.followUp.instruction} onChange={(event) => setDraft((current) => ({ ...current, followUp: { ...current.followUp, instruction: event.target.value } }))} /></label>
                  </div>
                </div>

                <div className="doctor-editor-actions">
                  <button className="doctor-btn doctor-btn--secondary" type="button" onClick={cancelEdit}>Cancel</button>
                  <button className="doctor-btn doctor-btn--primary" type="button" onClick={saveRecommendations}><ProfileIcon name="check" size={14} /> Save recommendations</button>
                </div>
              </div>
            ) : (
              <div className="doctor-approved-body">
                <div className="doctor-approved-section">
                  <h3>Medications</h3>
                  {approved.medications.length ? (
                    <div className="doctor-profile-list">
                      {approved.medications.map((medication, index) => (
                        <article className="doctor-profile-med" key={`${medication.name}-${index}`}>
                          <div className="doctor-profile-med__top">
                            <strong>{medication.name || "Untitled medication"}</strong>
                            <span>{medication.schedule}</span>
                          </div>
                          <p>{medication.dose} · {medication.duration} · {medication.meal}</p>
                          <small>{medication.instruction}</small>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <EmptyRow text="No medications added to the care plan." />
                  )}
                </div>

                <div className="doctor-approved-section">
                  <h3>Tests</h3>
                  {approved.tests.length ? (
                    <div className="doctor-profile-list">
                      {approved.tests.map((test, index) => (
                        <article className="doctor-report" key={`${test.name}-${index}`}>
                          <div>
                            <strong>{test.name || "Untitled test"}</strong>
                            <p>{test.instruction}</p>
                          </div>
                          <span className="doctor-report__status doctor-report__status--recommended">{test.status}</span>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <EmptyRow text="No tests added to the care plan." />
                  )}
                </div>

                <div className="doctor-approved-section">
                  <h3>Diet guidance</h3>
                  {approved.diet.length ? (
                    <ul className="doctor-profile-history">
                      {approved.diet.map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyRow text="No diet guidance added to the care plan." />
                  )}
                </div>

                <div className="doctor-approved-section">
                  <h3>Doctor's instructions</h3>
                  <p className="doctor-profile-summary">{approved.instructions || "No instructions recorded."}</p>
                  <p className="doctor-approved-followup">
                    <strong>Follow-up:</strong> {approved.followUp.date} — {approved.followUp.instruction}
                  </p>
                </div>

                {!hasApproved && (
                  <EmptyRow text="No doctor-approved recommendations recorded yet. Use Edit to add them." />
                )}
              </div>
            )}
          </section>
        </div>
      )}

      <footer className="doctor-profile-footer">
        <ProfileIcon name="shield" size={13} /> {DISCLAIMER}
      </footer>
    </div>
  );
}
