import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router";
import { beginDemoRegistration } from "../services/demoAuth";
import { CaretaiBrand } from "../components/CaretaiBrand";
import "../styles/patient-registration.css";

type AccountRole = "patient" | "caregiver";
type FormValues = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  dateOfBirth: string;
  country: string;
  language: "English" | "বাংলা";
  phone: string;
  acceptedTerms: boolean;
  relationship: string;
  patientName: string;
  patientDateOfBirth: string;
  patientAgeGroup: string;
};
type FieldName = keyof FormValues;
type FieldErrors = Partial<Record<FieldName, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const initialValues: FormValues = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  dateOfBirth: "",
  country: "",
  language: "English",
  phone: "",
  acceptedTerms: false,
  relationship: "",
  patientName: "",
  patientDateOfBirth: "",
  patientAgeGroup: "",
};

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h13m-4-4 4 4-4 4" />
    </svg>
  );
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.6" />
      {hidden && <path d="m4 4 16 16" />}
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 12 4 4 8-8" />
    </svg>
  );
}

function TimelinePreview() {
  return (
    <div className="patient-register-preview" aria-label="A preview of a connected care timeline">
      <div className="patient-register-preview__header">
        <span>YOUR CONNECTED CARE</span>
        <i>Private space</i>
      </div>
      <div className="patient-register-preview__line" aria-hidden="true"><span /></div>
      <div className="patient-register-preview__steps">
        <article>
          <span className="patient-register-preview__dot">01</span>
          <div><small>Today</small><strong>Account created</strong><p>Your care space is ready.</p></div>
        </article>
        <article>
          <span className="patient-register-preview__dot">02</span>
          <div><small>When you need it</small><strong>Share what&apos;s changed</strong><p>A guided conversation, in your words.</p></div>
        </article>
        <article>
          <span className="patient-register-preview__dot">03</span>
          <div><small>Over time</small><strong>Keep visits connected</strong><p>A clearer story for you and your doctor.</p></div>
        </article>
      </div>
      <footer><CheckIcon /> Designed for patients and the people who care for them.</footer>
    </div>
  );
}

function Field({
  name,
  label,
  error,
  required,
  children,
}: {
  name: FieldName;
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`patient-register-field ${error ? "has-error" : ""}`}>
      <label htmlFor={`register-${name}`}>
        {label} {required && <span aria-hidden="true">*</span>}
        {required && <span className="patient-register-sr-only"> (required)</span>}
      </label>
      {children}
      <span className="patient-register-field__error" id={`register-${name}-error`} aria-live="polite">{error}</span>
    </div>
  );
}

export default function PatientRegistrationPage() {
  const [role, setRole] = useState<AccountRole>("patient");
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const submitTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (submitTimer.current) window.clearTimeout(submitTimer.current);
  }, []);

  const updateValue = (name: FieldName, value: string | boolean) => {
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
    setSubmittedEmail("");
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    updateValue(name as FieldName, value);
  };

  const validate = () => {
    const nextErrors: FieldErrors = {};
    const today = new Date().toISOString().slice(0, 10);

    if (!values.fullName.trim()) nextErrors.fullName = `Enter ${role === "caregiver" ? "your" : "a"} full name.`;
    if (!emailPattern.test(values.email.trim())) nextErrors.email = "Enter a valid email address.";
    if (!values.password) nextErrors.password = "Create a password.";
    else if (values.password.length < 8 || !/[A-Za-z]/.test(values.password) || !/\d/.test(values.password)) {
      nextErrors.password = "Use at least 8 characters with a letter and a number.";
    }
    if (!values.confirmPassword) nextErrors.confirmPassword = "Confirm your password.";
    else if (values.password !== values.confirmPassword) nextErrors.confirmPassword = "Passwords do not match.";
    if (!values.dateOfBirth) nextErrors.dateOfBirth = "Enter the account holder's date of birth.";
    else if (values.dateOfBirth > today) nextErrors.dateOfBirth = "Date of birth cannot be in the future.";
    if (!values.country) nextErrors.country = "Select your country or location.";
    if (!values.acceptedTerms) nextErrors.acceptedTerms = "You must agree before continuing.";

    if (role === "caregiver") {
      if (!values.relationship) nextErrors.relationship = "Select your relationship to the patient.";
      if (!values.patientName.trim()) nextErrors.patientName = "Enter the patient's full name.";
      if (!values.patientDateOfBirth) nextErrors.patientDateOfBirth = "Enter the patient's date of birth.";
      else if (values.patientDateOfBirth > today) nextErrors.patientDateOfBirth = "Date of birth cannot be in the future.";
      if (!values.patientAgeGroup) nextErrors.patientAgeGroup = "Select the patient's age group.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      window.setTimeout(() => {
        const firstInvalid = document.querySelector<HTMLElement>(".patient-register-field.has-error input, .patient-register-field.has-error select, .patient-register-terms.has-error input");
        firstInvalid?.focus();
      });
    }
    return Object.keys(nextErrors).length === 0;
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading || !validate()) return;
    setIsLoading(true);
    submitTimer.current = window.setTimeout(() => {
      beginDemoRegistration({
        name: values.fullName,
        email: values.email,
        role,
      });
      setIsLoading(false);
      setSubmittedEmail(values.email.trim());
    }, 900);
  };

  const chooseRole = (nextRole: AccountRole) => {
    setRole(nextRole);
    setSubmittedEmail("");
    if (nextRole === "patient") {
      setErrors((current) => ({
        ...current,
        relationship: undefined,
        patientName: undefined,
        patientDateOfBirth: undefined,
        patientAgeGroup: undefined,
      }));
    }
  };

  const passwordChecks = {
    length: values.password.length >= 8,
    letter: /[A-Za-z]/.test(values.password),
    number: /\d/.test(values.password),
  };

  return (
    <main className="patient-register-page">
      <section className="patient-register-story">
        <CaretaiBrand />
        <div className="patient-register-story__copy">
          <span className="patient-register-eyebrow">A calm place for your care</span>
          <h1>Care makes more sense when the story stays <em>connected.</em></h1>
          <p>Set up a private space for visits, follow-ups, and the people supporting you along the way.</p>
        </div>
        <TimelinePreview />
        <p className="patient-register-disclaimer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3 5 6v5.2c0 4.5 2.8 7.8 7 9.8 4.2-2 7-5.3 7-9.8V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg>
          No medical information is needed to create your account.
        </p>
      </section>

      <section className="patient-register-panel">
        <header className="patient-register-panel__top">
          <div className="patient-register-panel__mobile-brand"><CaretaiBrand /></div>
          <p>Already have an account? <Link to="/auth/sign-in">Sign In</Link></p>
        </header>

        <div className="patient-register-card">
          <Link className="patient-register-back" to="/auth/sign-up"><span aria-hidden="true">←</span> Back to account types</Link>
          <header className="patient-register-card__intro">
            <span>PATIENT &amp; CAREGIVER ACCOUNT</span>
            <h2>Let&apos;s get to know you.</h2>
            <p>Create your account to keep visits and care information connected.</p>
          </header>

          <form onSubmit={submit} noValidate>
            <fieldset className="patient-register-role">
              <legend>I&apos;m creating this account as</legend>
              <div>
                <button className={role === "patient" ? "is-active" : ""} type="button" onClick={() => chooseRole("patient")} aria-pressed={role === "patient"}>
                  <span>Patient</span><small>For my own care</small>
                </button>
                <button className={role === "caregiver" ? "is-active" : ""} type="button" onClick={() => chooseRole("caregiver")} aria-pressed={role === "caregiver"}>
                  <span>Caregiver</span><small>Supporting someone else</small>
                </button>
              </div>
            </fieldset>

            <section className="patient-register-section" aria-labelledby="account-details-title">
              <header>
                <span>01</span>
                <div>
                  <h3 id="account-details-title">{role === "caregiver" ? "Your details" : "Account details"}</h3>
                  <p>{role === "caregiver" ? "These details belong to you, the account holder." : "The essentials for your private care space."}</p>
                </div>
              </header>
              <div className="patient-register-grid">
                <Field name="fullName" label={role === "caregiver" ? "Caregiver's full name" : "Full name"} error={errors.fullName} required>
                  <input id="register-fullName" name="fullName" autoComplete="name" value={values.fullName} onChange={handleInput} aria-invalid={Boolean(errors.fullName)} aria-describedby="register-fullName-error" placeholder={role === "caregiver" ? "Your full name" : "Your full name"} />
                </Field>
                <Field name="email" label="Email address" error={errors.email} required>
                  <input id="register-email" name="email" type="email" inputMode="email" autoComplete="email" value={values.email} onChange={handleInput} aria-invalid={Boolean(errors.email)} aria-describedby="register-email-error" placeholder="you@example.com" />
                </Field>
                <Field name="password" label="Password" error={errors.password} required>
                  <div className="patient-register-password">
                    <input id="register-password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={values.password} onChange={handleInput} aria-invalid={Boolean(errors.password)} aria-describedby="register-password-requirements register-password-error" placeholder="Create a secure password" />
                    <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}><EyeIcon hidden={showPassword} /></button>
                  </div>
                  <div className="patient-register-requirements" id="register-password-requirements">
                    <span className={passwordChecks.length ? "is-met" : ""}><i><CheckIcon /></i> 8+ characters</span>
                    <span className={passwordChecks.letter ? "is-met" : ""}><i><CheckIcon /></i> One letter</span>
                    <span className={passwordChecks.number ? "is-met" : ""}><i><CheckIcon /></i> One number</span>
                  </div>
                </Field>
                <Field name="confirmPassword" label="Confirm password" error={errors.confirmPassword} required>
                  <div className="patient-register-password">
                    <input id="register-confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" value={values.confirmPassword} onChange={handleInput} aria-invalid={Boolean(errors.confirmPassword)} aria-describedby="register-confirmPassword-error" placeholder="Enter it again" />
                    <button type="button" onClick={() => setShowConfirmPassword((current) => !current)} aria-label={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"} aria-pressed={showConfirmPassword}><EyeIcon hidden={showConfirmPassword} /></button>
                  </div>
                </Field>
                <Field name="dateOfBirth" label={role === "caregiver" ? "Your date of birth" : "Date of birth"} error={errors.dateOfBirth} required>
                  <input id="register-dateOfBirth" name="dateOfBirth" type="date" autoComplete="bday" max={new Date().toISOString().slice(0, 10)} value={values.dateOfBirth} onChange={handleInput} aria-invalid={Boolean(errors.dateOfBirth)} aria-describedby="register-dateOfBirth-error" />
                </Field>
                <Field name="country" label="Country / location" error={errors.country} required>
                  <select id="register-country" name="country" autoComplete="country-name" value={values.country} onChange={handleInput} aria-invalid={Boolean(errors.country)} aria-describedby="register-country-error">
                    <option value="">Select your location</option>
                    <option>Bangladesh</option>
                    <option>India</option>
                    <option>United Kingdom</option>
                    <option>United States</option>
                    <option>Other</option>
                  </select>
                </Field>
                <Field name="phone" label="Phone number (optional)" error={errors.phone}>
                  <input id="register-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" value={values.phone} onChange={handleInput} aria-describedby="register-phone-error" placeholder="+880 1XXX XXXXXX" />
                </Field>
                <div className="patient-register-field">
                  <span className="patient-register-field__label">Preferred language</span>
                  <div className="patient-register-language" role="group" aria-label="Preferred language">
                    {(["English", "বাংলা"] as const).map((language) => (
                      <button key={language} className={values.language === language ? "is-active" : ""} type="button" onClick={() => updateValue("language", language)} aria-pressed={values.language === language}>{language}</button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <div className={`patient-register-caregiver ${role === "caregiver" ? "is-open" : ""}`} aria-hidden={role !== "caregiver"}>
              <section className="patient-register-section" aria-labelledby="patient-details-title">
                <header>
                  <span>02</span>
                  <div>
                    <h3 id="patient-details-title">Who are you caring for?</h3>
                    <p>Keep their details separate from your account information.</p>
                  </div>
                </header>
                <div className="patient-register-note">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></svg>
                  You are the account holder. The details below belong to the patient you support.
                </div>
                <div className="patient-register-grid">
                  <Field name="relationship" label="Relationship to patient" error={errors.relationship} required>
                    <select id="register-relationship" name="relationship" value={values.relationship} onChange={handleInput} disabled={role !== "caregiver"} aria-invalid={Boolean(errors.relationship)} aria-describedby="register-relationship-error">
                      <option value="">Select relationship</option>
                      <option>Parent</option><option>Guardian</option><option>Spouse</option><option>Child</option><option>Other</option>
                    </select>
                  </Field>
                  <Field name="patientName" label="Patient's full name" error={errors.patientName} required>
                    <input id="register-patientName" name="patientName" autoComplete="off" value={values.patientName} onChange={handleInput} disabled={role !== "caregiver"} aria-invalid={Boolean(errors.patientName)} aria-describedby="register-patientName-error" placeholder="Their full name" />
                  </Field>
                  <Field name="patientDateOfBirth" label="Patient's date of birth" error={errors.patientDateOfBirth} required>
                    <input id="register-patientDateOfBirth" name="patientDateOfBirth" type="date" max={new Date().toISOString().slice(0, 10)} value={values.patientDateOfBirth} onChange={handleInput} disabled={role !== "caregiver"} aria-invalid={Boolean(errors.patientDateOfBirth)} aria-describedby="register-patientDateOfBirth-error" />
                  </Field>
                  <Field name="patientAgeGroup" label="Patient's age group" error={errors.patientAgeGroup} required>
                    <select id="register-patientAgeGroup" name="patientAgeGroup" value={values.patientAgeGroup} onChange={handleInput} disabled={role !== "caregiver"} aria-invalid={Boolean(errors.patientAgeGroup)} aria-describedby="register-patientAgeGroup-error">
                      <option value="">Select age group</option><option>Child</option><option>Adult</option><option>Older Adult</option>
                    </select>
                  </Field>
                </div>
              </section>
            </div>

            <label className={`patient-register-terms ${errors.acceptedTerms ? "has-error" : ""}`}>
              <input type="checkbox" checked={values.acceptedTerms} onChange={(event) => updateValue("acceptedTerms", event.target.checked)} aria-invalid={Boolean(errors.acceptedTerms)} aria-describedby="register-acceptedTerms-error" />
              <span aria-hidden="true"><CheckIcon /></span>
              <p>I agree to the <a href="#terms">Terms of Use</a> and <a href="#privacy">Privacy Policy</a>. <b aria-hidden="true">*</b></p>
              <small id="register-acceptedTerms-error" aria-live="polite">{errors.acceptedTerms}</small>
            </label>

            {submittedEmail && (
              <div className="patient-register-success" role="status">
                <span><CheckIcon /></span>
                <div>
                  <small>DEMO SUCCESS</small>
                  <h3>Your registration details are ready.</h3>
                  <p>No account has been created. Email verification will be enabled when authentication is connected.</p>
                  <Link to={`/auth/verify-email?role=${role}`} state={{ email: submittedEmail, accountType: role }}>Continue to verification preview <ArrowIcon /></Link>
                </div>
              </div>
            )}

            <button className="patient-register-submit" type="submit" disabled={isLoading || Boolean(submittedEmail)}>
              {isLoading
                ? <><span className="patient-register-spinner" /> Preparing demo…</>
                : submittedEmail
                  ? <><CheckIcon /> Demo ready</>
                  : <>Create Account <ArrowIcon /></>}
            </button>
            <p className="patient-register-form-note">Frontend prototype only. Your details are not sent to an authentication service.</p>
          </form>
        </div>
      </section>
    </main>
  );
}
