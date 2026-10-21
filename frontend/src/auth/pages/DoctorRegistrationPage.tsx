import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link, useNavigate } from "react-router";
import { beginDemoRegistration } from "../services/demoAuth";
import { CaretaiBrand } from "../components/CaretaiBrand";
import "../styles/doctor-registration.css";

type DoctorValues = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  country: string;
  professionalTitle: string;
  qualification: string;
  specialty: string;
  licensingAuthority: string;
  licenseNumber: string;
  registrationCountry: string;
  yearsOfPractice: string;
  institution: string;
  accurateInformation: boolean;
  acceptedTerms: boolean;
};
type DoctorField = keyof DoctorValues;
type DoctorErrors = Partial<Record<DoctorField, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const maxFileSize = 10 * 1024 * 1024;
const allowedFileTypes = ["application/pdf", "image/jpeg", "image/png"];
const allowedExtensions = ["pdf", "jpg", "jpeg", "png"];
const stepFields: Record<number, DoctorField[]> = {
  1: ["fullName", "email", "password", "confirmPassword", "phone", "country"],
  2: ["professionalTitle", "qualification", "specialty", "licensingAuthority", "licenseNumber", "registrationCountry", "yearsOfPractice", "institution"],
  3: ["accurateInformation", "acceptedTerms"],
};
const initialValues: DoctorValues = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  country: "",
  professionalTitle: "",
  qualification: "",
  specialty: "",
  licensingAuthority: "",
  licenseNumber: "",
  registrationCountry: "",
  yearsOfPractice: "",
  institution: "",
  accurateInformation: false,
  acceptedTerms: false,
};

function ArrowIcon({ back = false }: { back?: boolean }) {
  return (
    <svg className={back ? "is-back" : ""} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h13m-4-4 4 4-4 4" />
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

function EyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.6" />
      {hidden && <path d="m4 4 16 16" />}
    </svg>
  );
}

function DoctorFieldControl({
  name,
  label,
  error,
  required,
  children,
}: {
  name: DoctorField;
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`doctor-register-field ${error ? "has-error" : ""}`}>
      <label htmlFor={`doctor-${name}`}>
        {label}
        {required ? <><span aria-hidden="true"> *</span><span className="doctor-register-sr-only"> (required)</span></> : <small>Optional</small>}
      </label>
      {children}
      <span className="doctor-register-field__error" id={`doctor-${name}-error`} aria-live="polite">{error}</span>
    </div>
  );
}

function CredentialJourney() {
  return (
    <div className="doctor-register-journey" aria-label="Doctor access verification journey">
      <header><span>PROFESSIONAL ACCESS</span><i>Three clear checks</i></header>
      <div className="doctor-register-journey__rail" aria-hidden="true"><span /></div>
      <div className="doctor-register-journey__items">
        <article><b>01</b><div><small>Account</small><strong>Confirm your email</strong><p>Establish ownership of your sign-in address.</p></div><CheckIcon /></article>
        <article><b>02</b><div><small>Credentials</small><strong>Professional review</strong><p>Medical credentials are reviewed separately.</p></div><span>Review</span></article>
        <article><b>03</b><div><small>Access</small><strong>Doctor workspace</strong><p>Granted only after both checks are complete.</p></div><span>Pending</span></article>
      </div>
      <footer>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3 5 6v5.2c0 4.5 2.8 7.8 7 9.8 4.2-2 7-5.3 7-9.8V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg>
        Email confirmation never replaces professional verification.
      </footer>
    </div>
  );
}

function formatFileSize(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function DoctorRegistrationPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [highestStep, setHighestStep] = useState(1);
  const [values, setValues] = useState<DoctorValues>(initialValues);
  const [errors, setErrors] = useState<DoctorErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submitTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (submitTimer.current) window.clearTimeout(submitTimer.current);
  }, []);

  const updateValue = (name: DoctorField, value: string | boolean) => {
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    updateValue(event.target.name as DoctorField, event.target.value);
  };

  const errorsForStep = (targetStep: number) => {
    const nextErrors: DoctorErrors = {};
    if (targetStep === 1) {
      if (!values.fullName.trim()) nextErrors.fullName = "Enter your full name.";
      if (!emailPattern.test(values.email.trim())) nextErrors.email = "Enter a valid email address.";
      if (!values.password) nextErrors.password = "Create a password.";
      else if (values.password.length < 8 || !/[A-Za-z]/.test(values.password) || !/\d/.test(values.password)) {
        nextErrors.password = "Use at least 8 characters with a letter and a number.";
      }
      if (!values.confirmPassword) nextErrors.confirmPassword = "Confirm your password.";
      else if (values.password !== values.confirmPassword) nextErrors.confirmPassword = "Passwords do not match.";
      if (!values.phone.trim()) nextErrors.phone = "Enter your phone number.";
      if (!values.country) nextErrors.country = "Select your country or location.";
    }
    if (targetStep === 2) {
      if (!values.professionalTitle.trim()) nextErrors.professionalTitle = "Enter your professional title.";
      if (!values.qualification.trim()) nextErrors.qualification = "Enter your medical qualification.";
      if (!values.licensingAuthority.trim()) nextErrors.licensingAuthority = "Enter the authority that issued your registration.";
      if (!values.licenseNumber.trim()) nextErrors.licenseNumber = "Enter your registration or license number.";
      if (!values.registrationCountry) nextErrors.registrationCountry = "Select the country where you are registered.";
      if (values.yearsOfPractice && (!/^\d+$/.test(values.yearsOfPractice) || Number(values.yearsOfPractice) > 80)) {
        nextErrors.yearsOfPractice = "Enter a whole number from 0 to 80.";
      }
    }
    if (targetStep === 3) {
      if (!values.accurateInformation) nextErrors.accurateInformation = "Confirm that your professional information is accurate.";
      if (!values.acceptedTerms) nextErrors.acceptedTerms = "Agree to the terms and privacy policy before continuing.";
    }
    return nextErrors;
  };

  const applyStepErrors = (targetStep: number, nextErrors: DoctorErrors) => {
    setErrors((current) => {
      const updated = { ...current };
      stepFields[targetStep].forEach((name) => delete updated[name]);
      return { ...updated, ...nextErrors };
    });
  };

  const focusFirstError = () => {
    window.setTimeout(() => {
      document.querySelector<HTMLElement>(
        ".doctor-register-field.has-error input, .doctor-register-field.has-error select, .doctor-register-consent.has-error input, .doctor-upload.has-error input",
      )?.focus();
    });
  };

  const continueToNextStep = () => {
    const nextErrors = errorsForStep(step);
    applyStepErrors(step, nextErrors);
    if (Object.keys(nextErrors).length) {
      focusFirstError();
      return;
    }
    const nextStep = Math.min(3, step + 1);
    setStep(nextStep);
    setHighestStep((current) => Math.max(current, nextStep));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const chooseStep = (nextStep: number) => {
    if (nextStep <= highestStep && !isLoading) {
      setStep(nextStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const validateFile = (file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!allowedExtensions.includes(extension) || (file.type && !allowedFileTypes.includes(file.type))) {
      return "Choose a PDF, JPG, or PNG file.";
    }
    if (file.size > maxFileSize) return "The selected file is larger than 10 MB.";
    if (file.size === 0) return "The selected file is empty.";
    return "";
  };

  const selectFile = (file?: File) => {
    if (!file) return;
    const error = validateFile(file);
    setFileError(error);
    setLicenseFile(error ? null : file);
  };

  const openFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files[0]);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;

    const allErrors = { ...errorsForStep(1), ...errorsForStep(2), ...errorsForStep(3) };
    setErrors(allErrors);
    const currentFileError = licenseFile ? validateFile(licenseFile) : "Add your license or registration certificate.";
    setFileError(currentFileError);

    if (Object.keys(allErrors).length || currentFileError) {
      const firstInvalidStep = Object.keys(errorsForStep(1)).length ? 1 : Object.keys(errorsForStep(2)).length ? 2 : 3;
      setStep(firstInvalidStep);
      setHighestStep((current) => Math.max(current, firstInvalidStep));
      focusFirstError();
      return;
    }

    setIsLoading(true);
    submitTimer.current = window.setTimeout(() => {
      beginDemoRegistration({
        name: values.fullName,
        email: values.email,
        role: "doctor",
        doctorProfile: {
          qualification: values.qualification,
          licensingAuthority: values.licensingAuthority,
          licenseNumber: values.licenseNumber,
        },
      });
      navigate("/auth/verify-email?role=doctor", {
        state: {
          email: values.email.trim(),
          accountType: "doctor",
          demoRegistration: true,
        },
      });
    }, 1000);
  };

  const passwordChecks = {
    length: values.password.length >= 8,
    letter: /[A-Za-z]/.test(values.password),
    number: /\d/.test(values.password),
  };

  return (
    <main className="doctor-register-page">
      <section className="doctor-register-story">
        <CaretaiBrand />
        <div className="doctor-register-story__copy">
          <span>VERIFIED PROFESSIONAL WORKSPACE</span>
          <h1>Clinical context, ready for your <em>review.</em></h1>
          <p>Join a workspace designed to keep patient-reported information clear while keeping clinical decisions with the doctor.</p>
        </div>
        <CredentialJourney />
        <p className="doctor-register-story__note">Professional access requires credential review.</p>
      </section>

      <section className="doctor-register-panel">
        <header className="doctor-register-panel__top">
          <div className="doctor-register-panel__mobile-brand"><CaretaiBrand /></div>
          <p>Already have an account? <Link to="/auth/sign-in">Sign In</Link></p>
        </header>

        <div className="doctor-register-card">
          <Link className="doctor-register-back" to="/auth/sign-up"><span aria-hidden="true">←</span> Back to account types</Link>
          <header className="doctor-register-intro">
            <span>DOCTOR REGISTRATION</span>
            <h2>Create your professional account.</h2>
            <p>Register to review patient-reported information and manage doctor-led care plans through CARETAI.</p>
          </header>

          <nav className="doctor-register-steps" aria-label="Registration progress">
            {[
              ["Personal", "Personal Details"],
              ["Professional", "Professional Details"],
              ["Verification", "Verification"],
            ].map(([shortLabel, label], index) => {
              const number = index + 1;
              const isComplete = step > number;
              return (
                <button
                  key={label}
                  className={`${step === number ? "is-active" : ""} ${isComplete ? "is-complete" : ""}`}
                  type="button"
                  onClick={() => chooseStep(number)}
                  disabled={number > highestStep || isLoading}
                  aria-current={step === number ? "step" : undefined}
                  aria-label={`Step ${number}: ${label}`}
                >
                  <span>{isComplete ? <CheckIcon /> : number}</span>
                  <b>{label}</b>
                  <small>{shortLabel}</small>
                </button>
              );
            })}
          </nav>

          <form onSubmit={submit} noValidate>
            {step === 1 && (
              <section className="doctor-register-section" key="personal" aria-labelledby="doctor-personal-title">
                <header><span>01</span><div><h3 id="doctor-personal-title">Personal details</h3><p>Your account and contact information.</p></div></header>
                <div className="doctor-register-grid">
                  <DoctorFieldControl name="fullName" label="Full name" error={errors.fullName} required>
                    <input id="doctor-fullName" name="fullName" autoComplete="name" value={values.fullName} onChange={handleInput} aria-invalid={Boolean(errors.fullName)} aria-describedby="doctor-fullName-error" placeholder="Your full name" />
                  </DoctorFieldControl>
                  <DoctorFieldControl name="email" label="Email address" error={errors.email} required>
                    <input id="doctor-email" name="email" type="email" inputMode="email" autoComplete="email" value={values.email} onChange={handleInput} aria-invalid={Boolean(errors.email)} aria-describedby="doctor-email-error" placeholder="doctor@example.com" />
                  </DoctorFieldControl>
                  <DoctorFieldControl name="password" label="Password" error={errors.password} required>
                    <div className="doctor-register-password">
                      <input id="doctor-password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={values.password} onChange={handleInput} aria-invalid={Boolean(errors.password)} aria-describedby="doctor-password-requirements doctor-password-error" placeholder="Create a secure password" />
                      <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}><EyeIcon hidden={showPassword} /></button>
                    </div>
                    <div className="doctor-register-requirements" id="doctor-password-requirements">
                      <span className={passwordChecks.length ? "is-met" : ""}><i><CheckIcon /></i> 8+ characters</span>
                      <span className={passwordChecks.letter ? "is-met" : ""}><i><CheckIcon /></i> One letter</span>
                      <span className={passwordChecks.number ? "is-met" : ""}><i><CheckIcon /></i> One number</span>
                    </div>
                  </DoctorFieldControl>
                  <DoctorFieldControl name="confirmPassword" label="Confirm password" error={errors.confirmPassword} required>
                    <div className="doctor-register-password">
                      <input id="doctor-confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" value={values.confirmPassword} onChange={handleInput} aria-invalid={Boolean(errors.confirmPassword)} aria-describedby="doctor-confirmPassword-error" placeholder="Enter it again" />
                      <button type="button" onClick={() => setShowConfirmPassword((current) => !current)} aria-label={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"} aria-pressed={showConfirmPassword}><EyeIcon hidden={showConfirmPassword} /></button>
                    </div>
                  </DoctorFieldControl>
                  <DoctorFieldControl name="phone" label="Phone number" error={errors.phone} required>
                    <input id="doctor-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" value={values.phone} onChange={handleInput} aria-invalid={Boolean(errors.phone)} aria-describedby="doctor-phone-error" placeholder="+880 1XXX XXXXXX" />
                  </DoctorFieldControl>
                  <DoctorFieldControl name="country" label="Country / location" error={errors.country} required>
                    <select id="doctor-country" name="country" autoComplete="country-name" value={values.country} onChange={handleInput} aria-invalid={Boolean(errors.country)} aria-describedby="doctor-country-error">
                      <option value="">Select your location</option><option>Bangladesh</option><option>India</option><option>United Kingdom</option><option>United States</option><option>Other</option>
                    </select>
                  </DoctorFieldControl>
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="doctor-register-section" key="professional" aria-labelledby="doctor-professional-title">
                <header><span>02</span><div><h3 id="doctor-professional-title">Professional details</h3><p>Tell us how and where you are registered to practice.</p></div></header>
                <div className="doctor-register-guidance">
                  Licensing systems differ by country. Enter the authority and registration number exactly as they appear on your professional documents.
                </div>
                <div className="doctor-register-grid">
                  <DoctorFieldControl name="professionalTitle" label="Professional title" error={errors.professionalTitle} required>
                    <input id="doctor-professionalTitle" name="professionalTitle" value={values.professionalTitle} onChange={handleInput} aria-invalid={Boolean(errors.professionalTitle)} aria-describedby="doctor-professionalTitle-error" placeholder="e.g. Dr." />
                  </DoctorFieldControl>
                  <DoctorFieldControl name="qualification" label="Medical qualification" error={errors.qualification} required>
                    <input id="doctor-qualification" name="qualification" value={values.qualification} onChange={handleInput} aria-invalid={Boolean(errors.qualification)} aria-describedby="doctor-qualification-error" placeholder="e.g. MBBS or equivalent" />
                  </DoctorFieldControl>
                  <DoctorFieldControl name="specialty" label="Specialty" error={errors.specialty}>
                    <input id="doctor-specialty" name="specialty" value={values.specialty} onChange={handleInput} aria-describedby="doctor-specialty-error" placeholder="e.g. Internal Medicine" />
                  </DoctorFieldControl>
                  <DoctorFieldControl name="licensingAuthority" label="Registration / licensing authority" error={errors.licensingAuthority} required>
                    <input id="doctor-licensingAuthority" name="licensingAuthority" value={values.licensingAuthority} onChange={handleInput} aria-invalid={Boolean(errors.licensingAuthority)} aria-describedby="doctor-licensingAuthority-error" placeholder="Official authority name" />
                  </DoctorFieldControl>
                  <DoctorFieldControl name="licenseNumber" label="Registration / license number" error={errors.licenseNumber} required>
                    <input id="doctor-licenseNumber" name="licenseNumber" autoComplete="off" value={values.licenseNumber} onChange={handleInput} aria-invalid={Boolean(errors.licenseNumber)} aria-describedby="doctor-licenseNumber-error" placeholder="As shown on your credential" />
                  </DoctorFieldControl>
                  <DoctorFieldControl name="registrationCountry" label="Country where registered" error={errors.registrationCountry} required>
                    <select id="doctor-registrationCountry" name="registrationCountry" value={values.registrationCountry} onChange={handleInput} aria-invalid={Boolean(errors.registrationCountry)} aria-describedby="doctor-registrationCountry-error">
                      <option value="">Select registration country</option><option>Bangladesh</option><option>India</option><option>United Kingdom</option><option>United States</option><option>Other</option>
                    </select>
                  </DoctorFieldControl>
                  <DoctorFieldControl name="yearsOfPractice" label="Years of practice" error={errors.yearsOfPractice}>
                    <input id="doctor-yearsOfPractice" name="yearsOfPractice" type="number" min="0" max="80" inputMode="numeric" value={values.yearsOfPractice} onChange={handleInput} aria-invalid={Boolean(errors.yearsOfPractice)} aria-describedby="doctor-yearsOfPractice-error" placeholder="e.g. 8" />
                  </DoctorFieldControl>
                  <DoctorFieldControl name="institution" label="Clinic, hospital, or institution" error={errors.institution}>
                    <input id="doctor-institution" name="institution" autoComplete="organization" value={values.institution} onChange={handleInput} aria-describedby="doctor-institution-error" placeholder="Current institution" />
                  </DoctorFieldControl>
                </div>
              </section>
            )}

            {step === 3 && (
              <section className="doctor-register-section doctor-register-section--verification" key="verification" aria-labelledby="doctor-verification-title">
                <header><span>03</span><div><h3 id="doctor-verification-title">Verify your professional credentials.</h3><p>Professional verification is required before doctor-dashboard access is granted.</p></div></header>

                <div
                  className={`doctor-upload ${isDragging ? "is-dragging" : ""} ${fileError ? "has-error" : ""} ${licenseFile ? "has-file" : ""}`}
                  onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
                  onDragOver={(event) => event.preventDefault()}
                  onDragLeave={(event) => {
                    const nextTarget = event.relatedTarget;
                    if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) setIsDragging(false);
                  }}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    id="doctor-license-file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={(event) => selectFile(event.target.files?.[0])}
                    aria-describedby="doctor-file-help doctor-file-error"
                  />
                  {licenseFile ? (
                    <div className="doctor-upload__selected">
                      <span><CheckIcon /></span>
                      <div><small>SELECTED LOCALLY — NOT UPLOADED</small><strong>{licenseFile.name}</strong><p>{formatFileSize(licenseFile.size)} · Ready for this demo</p></div>
                      <div className="doctor-upload__actions">
                        <button type="button" onClick={openFilePicker}>Replace</button>
                        <button type="button" onClick={() => { setLicenseFile(null); setFileError(""); }}>Remove</button>
                      </div>
                    </div>
                  ) : (
                    <div className="doctor-upload__empty">
                      <span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 16V4m-4 4 4-4 4 4" /><path d="M5 14v5h14v-5" /></svg>
                      </span>
                      <strong>Drop your license document here</strong>
                      <p id="doctor-file-help">PDF, JPG, or PNG · Maximum 10 MB</p>
                      <button type="button" onClick={openFilePicker}>Choose a file</button>
                    </div>
                  )}
                </div>
                <span className="doctor-upload__error" id="doctor-file-error" aria-live="polite">{fileError}</span>

                <div className="doctor-register-privacy">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3 5 6v5.2c0 4.5 2.8 7.8 7 9.8 4.2-2 7-5.3 7-9.8V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg>
                  <p><strong>Document privacy</strong> Professional documents are intended only for credential verification and should be transferred and stored securely. This prototype keeps the selected file in your browser and does not upload it.</p>
                </div>

                <div className="doctor-register-consents">
                  <label className={`doctor-register-consent ${errors.accurateInformation ? "has-error" : ""}`}>
                    <input type="checkbox" checked={values.accurateInformation} onChange={(event) => updateValue("accurateInformation", event.target.checked)} aria-invalid={Boolean(errors.accurateInformation)} aria-describedby="doctor-accurateInformation-error" />
                    <span aria-hidden="true"><CheckIcon /></span>
                    <p>I confirm that the professional information provided is accurate. <b aria-hidden="true">*</b></p>
                    <small id="doctor-accurateInformation-error" aria-live="polite">{errors.accurateInformation}</small>
                  </label>
                  <label className={`doctor-register-consent ${errors.acceptedTerms ? "has-error" : ""}`}>
                    <input type="checkbox" checked={values.acceptedTerms} onChange={(event) => updateValue("acceptedTerms", event.target.checked)} aria-invalid={Boolean(errors.acceptedTerms)} aria-describedby="doctor-acceptedTerms-error" />
                    <span aria-hidden="true"><CheckIcon /></span>
                    <p>I agree to the <a href="#terms">Terms of Use</a> and <a href="#privacy">Privacy Policy</a>. <b aria-hidden="true">*</b></p>
                    <small id="doctor-acceptedTerms-error" aria-live="polite">{errors.acceptedTerms}</small>
                  </label>
                </div>

                <div className="doctor-register-boundary">
                  <span>EMAIL VERIFICATION</span><p>Confirms ownership of your email address.</p>
                  <i aria-hidden="true" />
                  <span>PROFESSIONAL VERIFICATION</span><p>Separately reviews your submitted medical credentials.</p>
                  <strong>Email verification alone does not grant doctor-dashboard access.</strong>
                </div>
              </section>
            )}

            <div className="doctor-register-navigation">
              {step > 1 ? (
                <button className="doctor-register-secondary" type="button" onClick={() => chooseStep(step - 1)} disabled={isLoading}><ArrowIcon back /> Back</button>
              ) : <span />}
              {step < 3 ? (
                <button className="doctor-register-primary" type="button" onClick={continueToNextStep}>Continue <ArrowIcon /></button>
              ) : (
                <button className="doctor-register-primary" type="submit" disabled={isLoading}>
                  {isLoading ? <><span className="doctor-register-spinner" /> Preparing demo…</> : <>Submit Registration <ArrowIcon /></>}
                </button>
              )}
            </div>
            <p className="doctor-register-form-note">Frontend prototype only. No account, document upload, or credential review occurs.</p>
          </form>
        </div>
      </section>
    </main>
  );
}
