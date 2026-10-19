import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { startDemoSession, updateDemoDoctorReviewStatus, type DemoRole } from "../services/demoAuth";
import { CaretaiBrand } from "../components/CaretaiBrand";
import "../styles/sign-in.css";

type FieldErrors = {
  role?: string;
  email?: string;
  password?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function EyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.6" />
      {hidden && <path d="m4 4 16 16" />}
    </svg>
  );
}

function ProductPreview() {
  return (
    <div className="sign-in-preview" aria-label="A conversation becoming structured visit information">
      <div className="sign-in-preview__glow" />
      <div className="sign-in-preview__conversation">
        <div className="sign-in-preview__header">
          <span>CONVERSATION</span>
          <i>Listening</i>
        </div>
        <div className="sign-in-preview__message sign-in-preview__message--ai">
          <small>CARETAI</small>
          <p>When did the cough begin?</p>
        </div>
        <div className="sign-in-preview__message sign-in-preview__message--person">
          <small>Caregiver</small>
          <p>About five days ago. It is worse at night.</p>
        </div>
      </div>

      <svg className="sign-in-preview__line" viewBox="0 0 150 110" preserveAspectRatio="none" aria-hidden="true">
        <path d="M2 12 C72 12 65 96 148 96" />
      </svg>

      <span className="sign-in-preview__chip sign-in-preview__chip--one">ABOUT 5 DAYS</span>
      <span className="sign-in-preview__chip sign-in-preview__chip--two">MOSTLY AT NIGHT</span>

      <div className="sign-in-preview__visit">
        <div className="sign-in-preview__header">
          <span>VISIT INFORMATION</span>
          <i>Organized</i>
        </div>
        <dl>
          <div><dt>Main concern</dt><dd>Cough</dd></div>
          <div><dt>Duration</dt><dd>About 5 days</dd></div>
          <div><dt>Pattern</dt><dd>Mostly at night</dd></div>
        </dl>
        <footer>
          <span>Ready for review</span>
          <b aria-hidden="true">✓</b>
        </footer>
      </div>
    </div>
  );
}

function ResetPasswordModal({ initialEmail, onClose }: { initialEmail: string; onClose: () => void }) {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeTimer = useRef<number | null>(null);

  const requestClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    closeTimer.current = window.setTimeout(onClose, 220);
  };

  useEffect(() => {
    inputRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  useEffect(() => () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  }, []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim();
    if (!emailPattern.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      setConfirmed(false);
      return;
    }
    setError("");
    setConfirmed(true);
  };

  return (
    <div className={`reset-modal ${isClosing ? "is-closing" : ""}`} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && requestClose()}>
      <section className="reset-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="reset-title">
        <button className="reset-modal__close" type="button" onClick={requestClose} aria-label="Close password reset">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
        <span className="reset-modal__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="5" y="10" width="14" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
          </svg>
        </span>
        <h2 id="reset-title">Reset your password</h2>
        <p>Enter the email address associated with your CARETAI account.</p>
        <form onSubmit={submit} noValidate>
          <label htmlFor="reset-email">Email address</label>
          <input
            ref={inputRef}
            id="reset-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (error) setError("");
            }}
            aria-invalid={Boolean(error)}
            aria-describedby="reset-email-error"
            placeholder="you@example.com"
          />
          <span className="sign-in-field__error" id="reset-email-error" aria-live="polite">{error}</span>
          {confirmed && (
            <div className="reset-modal__confirmation" role="status">
              <strong>Demo request received.</strong>
              <span>Actual email delivery will be enabled when authentication is connected.</span>
            </div>
          )}
          <button className="reset-modal__submit" type="submit">Continue <span aria-hidden="true">→</span></button>
        </form>
        <button className="reset-modal__return" type="button" onClick={requestClose}>Return to Sign In</button>
      </section>
    </div>
  );
}

export default function SignInPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<DemoRole | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [demoResult, setDemoResult] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const submitTimer = useRef<number | null>(null);
  const navigationTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (submitTimer.current) window.clearTimeout(submitTimer.current);
    if (navigationTimer.current) window.clearTimeout(navigationTimer.current);
  }, []);

  const validate = () => {
    const nextErrors: FieldErrors = {};
    if (!role) nextErrors.role = "Select the demo role you want to preview.";
    if (!emailPattern.test(email.trim())) nextErrors.email = "Enter a valid email address.";
    if (!password) nextErrors.password = "Enter your password.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading || !validate()) return;
    setIsLoading(true);
    setDemoResult(false);
    submitTimer.current = window.setTimeout(() => {
      if (!role) return;
      startDemoSession({ email, role });
      if (role === "doctor") {
        updateDemoDoctorReviewStatus(email.trim(), "approved");
      }
      setIsLoading(false);
      setDemoResult(true);
      navigationTimer.current = window.setTimeout(() => {
        navigate(
          role === "doctor"
            ? "/doctor/dashboard"
            : "/patient/dashboard",
        );
      }, 650);
    }, 700);
  };

  return (
    <main className="sign-in-page">
      <section className="sign-in-story">
        <CaretaiBrand />
        <div className="sign-in-story__copy">
          <span className="sign-in-eyebrow">Your connected care space</span>
          <h1>Your care story, <em>connected.</em></h1>
          <p>Pick up where you left off. Keep your visits, information, and follow-ups connected.</p>
        </div>
        <ProductPreview />
        <p className="sign-in-disclaimer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3 5 6v5.2c0 4.5 2.8 7.8 7 9.8 4.2-2 7-5.3 7-9.8V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg>
          Information support, not diagnosis.
        </p>
      </section>

      <section className="sign-in-panel">
        <div className="sign-in-panel__mobile-brand"><CaretaiBrand /></div>
        <div className="sign-in-card">
          <header>
            <span>DEMO MODE · FRONTEND ONLY</span>
            <h2>Try CARETAI</h2>
            <p>Choose a role to start a simulated session. No real account is authenticated.</p>
          </header>

          <form onSubmit={submit} noValidate>
            <fieldset className={`sign-in-role ${errors.role ? "has-error" : ""}`}>
              <legend>Demo role</legend>
              <div>
                {([
                  ["patient", "Patient"],
                  ["caregiver", "Caregiver"],
                  ["doctor", "Doctor"],
                ] as const).map(([value, label]) => (
                  <button
                    className={role === value ? "is-active" : ""}
                    key={value}
                    type="button"
                    onClick={() => {
                      setRole(value);
                      setDemoResult(false);
                      setErrors((current) => ({ ...current, role: undefined }));
                    }}
                    aria-pressed={role === value}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <span className="sign-in-field__error" aria-live="polite">{errors.role}</span>
            </fieldset>

            <div className={`sign-in-field ${errors.email ? "has-error" : ""}`}>
              <label htmlFor="sign-in-email">Email address</label>
              <input
                id="sign-in-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setDemoResult(false);
                  if (errors.email) setErrors((current) => ({ ...current, email: undefined }));
                }}
                aria-invalid={Boolean(errors.email)}
                aria-describedby="sign-in-email-error"
                placeholder="you@example.com"
              />
              <span className="sign-in-field__error" id="sign-in-email-error" aria-live="polite">{errors.email}</span>
            </div>

            <div className={`sign-in-field ${errors.password ? "has-error" : ""}`}>
              <div className="sign-in-field__label-row">
                <label htmlFor="sign-in-password">Demo password <small>(not checked or stored)</small></label>
                <button type="button" onClick={() => setResetOpen(true)}>Forgot password?</button>
              </div>
              <div className="sign-in-password">
                <input
                  id="sign-in-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setDemoResult(false);
                    if (errors.password) setErrors((current) => ({ ...current, password: undefined }));
                  }}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby="sign-in-password-error"
                  placeholder="Enter your password"
                />
                <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>
                  <EyeIcon hidden={showPassword} />
                </button>
              </div>
              <span className="sign-in-field__error" id="sign-in-password-error" aria-live="polite">{errors.password}</span>
            </div>

            {demoResult && (
              <div className="sign-in-demo-result" role="status">
                <span aria-hidden="true">✓</span>
                <p><strong>Demo session ready.</strong> Opening the role-appropriate preview. No real account was authenticated.</p>
              </div>
            )}

            <button className="sign-in-submit" type="submit" disabled={isLoading}>
              {isLoading ? <><span className="sign-in-spinner" /> Starting demo…</> : <>Start Demo Session <span aria-hidden="true">→</span></>}
            </button>
          </form>

          <p className="sign-in-account">Don&apos;t have an account? <Link to="/auth/sign-up">Create an account</Link></p>

          <div className="sign-in-reassurance">
            <span />
            <p>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3 5 6v5.2c0 4.5 2.8 7.8 7 9.8 4.2-2 7-5.3 7-9.8V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg>
              Your information is handled with care.
            </p>
          </div>
        </div>
        <p className="sign-in-panel__note">CARETAI · Clinical Analysis for Responsive Evaluation &amp; Tracking using AI</p>
      </section>

      {resetOpen && <ResetPasswordModal initialEmail={email} onClose={() => setResetOpen(false)} />}
    </main>
  );
}
