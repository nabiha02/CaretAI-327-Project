import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router";
import {
  getDemoAuthState,
  updateDemoEmail,
  verifyDemoEmail,
  type DemoRole,
} from "../services/demoAuth";
import { CaretaiBrand } from "../components/CaretaiBrand";
import "../styles/verify-email.css";

type VerificationState = {
  email?: string;
  accountType?: DemoRole;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const demoEmail = "demo@example.com";

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  const visibleLength = Math.min(2, name.length);
  return `${name.slice(0, visibleLength)}${"*".repeat(Math.max(3, name.length - visibleLength))}@${domain}`;
}

function EnvelopeIllustration({ complete }: { complete: boolean }) {
  return (
    <div className={`email-verification-illustration ${complete ? "is-complete" : ""}`} aria-hidden="true">
      <span className="email-verification-illustration__orbit" />
      <svg viewBox="0 0 160 130" fill="none">
        <path className="email-verification-illustration__back" d="M28 47.5 80 17l52 30.5v58H28v-58Z" />
        <rect className="email-verification-illustration__letter" x="42" y="28" width="76" height="66" rx="7" />
        <path className="email-verification-illustration__line" d="M58 48h44M58 61h31" />
        <path className="email-verification-illustration__flap" d="m29 51 51 39 51-39" />
        <path className="email-verification-illustration__front" d="m28 54 52 38 52-38v51H28V54Z" />
        <path className="email-verification-illustration__check" d="m65 70 10 10 21-23" />
      </svg>
    </div>
  );
}

function ChangeEmailModal({
  email,
  onClose,
  onSave,
}: {
  email: string;
  onClose: () => void;
  onSave: (email: string) => void;
}) {
  const [nextEmail, setNextEmail] = useState(email === demoEmail ? "" : email);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = nextEmail.trim();
    if (!emailPattern.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    onSave(normalizedEmail);
  };

  return (
    <div className="email-change-modal" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="email-change-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="change-email-title">
        <button className="email-change-modal__close" type="button" onClick={onClose} aria-label="Close change email form">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
        <span className="email-change-modal__eyebrow">ACCOUNT EMAIL</span>
        <h2 id="change-email-title">Change email address</h2>
        <p>Update the address used in this frontend demonstration.</p>
        <form onSubmit={submit} noValidate>
          <label htmlFor="verification-new-email">New email address</label>
          <input
            ref={inputRef}
            id="verification-new-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={nextEmail}
            onChange={(event) => {
              setNextEmail(event.target.value);
              if (error) setError("");
            }}
            aria-invalid={Boolean(error)}
            aria-describedby="verification-email-error"
            placeholder="you@example.com"
          />
          <span className="email-change-modal__error" id="verification-email-error" aria-live="polite">{error}</span>
          <div>
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Save Email</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function VerifyEmailPage() {
  const location = useLocation();
  const routeState = (location.state ?? {}) as VerificationState;
  const queryRole = new URLSearchParams(location.search).get("role");
  const stored = getDemoAuthState();
  const role: DemoRole | undefined =
    queryRole === "patient" || queryRole === "caregiver" || queryRole === "doctor"
      ? queryRole
      : routeState.accountType === "patient" || routeState.accountType === "caregiver" || routeState.accountType === "doctor"
        ? routeState.accountType
        : stored?.role;
  const initialEmail = typeof routeState.email === "string" && emailPattern.test(routeState.email)
    ? routeState.email
    : stored?.email && emailPattern.test(stored.email)
      ? stored.email
      : demoEmail;

  const [email, setEmail] = useState(initialEmail);
  const [feedback, setFeedback] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [complete, setComplete] = useState(
    Boolean(stored?.emailVerified && stored.sessionActive),
  );
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setInterval(() => setCooldown((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const resend = () => {
    setFeedback("Email delivery will be enabled when account authentication is connected.");
    setCooldown(5);
  };

  const saveEmail = (nextEmail: string) => {
    setEmail(nextEmail);
    updateDemoEmail(nextEmail);
    setFeedback("Demo email address updated. No email was sent.");
    setComplete(false);
    setModalOpen(false);
  };

  const simulateVerification = () => {
    if (!verifyDemoEmail()) {
      setFeedback("Start a demo registration before simulating verification.");
      return;
    }
    setFeedback("");
    setComplete(true);
  };

  return (
    <main className="email-verification-page">
      <header className="email-verification-header">
        <CaretaiBrand />
        <p>Already have an account? <Link to="/auth/sign-in">Sign In</Link></p>
      </header>

      <section className={`email-verification-card ${complete ? "is-complete" : ""}`}>
        <EnvelopeIllustration complete={complete} />
        <span className="email-verification-card__eyebrow">ACCOUNT SECURITY</span>

        {!complete ? (
          <div className="email-verification-card__content">
            <h1>Verify your email address.</h1>
            <p>Email verification helps us confirm that you can access the email address associated with your CARETAI account.</p>

            <div className="email-verification-address">
              <span>Verification address</span>
              <strong>{maskEmail(email)}</strong>
            </div>

            <div className="email-verification-status" role="status">
              <span aria-hidden="true" />
              <div><strong>Waiting for email verification</strong><small>Frontend demonstration · No email has been sent</small></div>
            </div>

            <div className="email-verification-notice">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></svg>
              <p><strong>This is a frontend demonstration.</strong> Actual email delivery and account verification will be enabled when authentication is connected.</p>
            </div>

            <div className="email-verification-actions">
              <button type="button" onClick={resend} disabled={cooldown > 0}>
                {cooldown ? `Try again in ${cooldown}s` : "Resend Verification Email"}
              </button>
              <button type="button" onClick={() => setModalOpen(true)}>Change Email Address</button>
            </div>
            {feedback && <p className="email-verification-feedback" role="status">{feedback}</p>}

            <button className="email-verification-simulate" type="button" onClick={simulateVerification}>
              Simulate email verification <span aria-hidden="true">→</span>
            </button>
          </div>
        ) : (
          <div className="email-verification-success" role="status">
            <span className="email-verification-success__label">FRONTEND SIMULATION</span>
            <h1>Email verification complete <em>— Demo</em></h1>
            {role === "doctor" ? (
              <>
                <p>Your professional credentials still require a separate review.</p>
                <div className="email-verification-doctor-note">
                  <strong>Professional access remains pending</strong>
                  <span>Email verification never approves credentials or grants verified-doctor status.</span>
                </div>
                <Link
                  className="email-verification-continue"
                  to="/auth/doctor-verification"
                >
                  Continue to Professional Verification <span aria-hidden="true">→</span>
                </Link>
              </>
            ) : role === "patient" || role === "caregiver" ? (
              <>
                <p>Your account can continue to the next setup step.</p>
                <small>This is a frontend simulation. No account was authenticated.</small>
                <Link
                  className="email-verification-continue"
                  to="/patient/dashboard"
                >
                  Continue <span aria-hidden="true">→</span>
                </Link>
              </>
            ) : (
              <>
                <p>This demonstration is complete, but no account role was provided.</p>
                <small>No account was verified or authenticated.</small>
                <Link className="email-verification-continue" to="/auth/sign-up">Return to Registration <span aria-hidden="true">→</span></Link>
              </>
            )}
          </div>
        )}

        <Link className="email-verification-back" to="/auth/sign-in"><span aria-hidden="true">←</span> Back to Sign In</Link>
      </section>

      <footer>CARETAI · Connected care, clearly told</footer>
      {modalOpen && <ChangeEmailModal email={email} onClose={() => setModalOpen(false)} onSave={saveEmail} />}
    </main>
  );
}
