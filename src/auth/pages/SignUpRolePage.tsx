import { useState, type ReactNode } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router";
import { CaretaiBrand } from "../components/CaretaiBrand";
import "../styles/sign-up.css";

type SignUpRole = "patient" | "doctor";

function RoleIcon({ role }: { role: SignUpRole }) {
  if (role === "doctor") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 3v6a4 4 0 0 0 8 0V3M3 3h4m4 0h4" />
        <path d="M9 13v1.5a4.5 4.5 0 0 0 9 0v-1" />
        <circle cx="18" cy="11" r="2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="3.3" />
      <path d="M5.5 20c.5-3.3 3-5.5 6.5-5.5s6 2.2 6.5 5.5" />
      <path d="M18.8 5.5v4M16.8 7.5h4" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h13m-4-4 4 4-4 4" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3 5 6v5.2c0 4.5 2.8 7.8 7 9.8 4.2-2 7-5.3 7-9.8V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function RoleCard({
  role,
  title,
  label,
  description,
  children,
  selected,
  onSelect,
}: {
  role: SignUpRole;
  title: string;
  label: string;
  description: string;
  children: ReactNode;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Link
      className={`sign-up-role-card sign-up-role-card--${role} ${selected ? "is-selected" : ""}`}
      to={`/auth/sign-up/${role}`}
      onPointerDown={onSelect}
      onFocus={onSelect}
      aria-label={`Continue as ${title}`}
    >
      <div className="sign-up-role-card__top">
        <span className="sign-up-role-card__icon"><RoleIcon role={role} /></span>
        <span className="sign-up-role-card__number">{role === "patient" ? "01" : "02"}</span>
      </div>
      <div className="sign-up-role-card__copy">
        <span className="sign-up-role-card__label">{label}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <span className="sign-up-role-card__action">
        {children}
        <ArrowIcon />
      </span>
    </Link>
  );
}

export default function SignUpRolePage() {
  const location = useLocation();
  const requestedRole = new URLSearchParams(location.search).get("role");
  const [selectedRole, setSelectedRole] = useState<SignUpRole | null>(null);

  if (requestedRole === "patient" || requestedRole === "doctor") {
    return <Navigate to={`/auth/sign-up/${requestedRole}`} replace />;
  }

  return (
    <main className="sign-up-page">
      <header className="sign-up-header">
        <CaretaiBrand />
        <p>Already have an account? <Link to="/auth/sign-in">Sign In</Link></p>
      </header>

      <section className="sign-up-main">
        <div className="sign-up-intro">
          <span>GET STARTED WITH CARETAI</span>
          <h1>Let&apos;s get you started.</h1>
          <p>Choose how you&apos;ll use CARETAI. We&apos;ll personalize your experience around your role.</p>
        </div>

        <div className="sign-up-role-grid">
          <RoleCard
            role="patient"
            title="Patient / Caregiver"
            label="For individuals and families"
            description="Share health-related information, review visit summaries, keep track of past visits, and access your doctor's care plan."
            selected={selectedRole === "patient"}
            onSelect={() => setSelectedRole("patient")}
          >
            Continue as Patient / Caregiver
          </RoleCard>
          <RoleCard
            role="doctor"
            title="Doctor"
            label="Professional verification required"
            description="Review patient-reported information, follow changes across visits, request additional details, and manage doctor-issued care plans."
            selected={selectedRole === "doctor"}
            onSelect={() => setSelectedRole("doctor")}
          >
            Continue as Doctor
          </RoleCard>
        </div>
      </section>

      <footer className="sign-up-footer">
        <ShieldIcon />
        <p>CARETAI organizes information for doctor review. It does not provide a diagnosis.</p>
      </footer>
    </main>
  );
}

export function RegistrationPlaceholder() {
  const { role } = useParams();

  if (role !== "patient" && role !== "doctor") {
    return <Navigate to="/auth/sign-up" replace />;
  }

  const isDoctor = role === "doctor";
  return (
    <main className="registration-placeholder">
      <header className="sign-up-header">
        <CaretaiBrand />
        <p>Already have an account? <Link to="/auth/sign-in">Sign In</Link></p>
      </header>
      <section className="registration-placeholder__card">
        <span className="registration-placeholder__icon"><RoleIcon role={role} /></span>
        <span className="registration-placeholder__eyebrow">
          {isDoctor ? "DOCTOR REGISTRATION" : "PATIENT / CAREGIVER REGISTRATION"}
        </span>
        <h1>{isDoctor ? "Doctor registration is coming next." : "Patient registration is coming next."}</h1>
        <p>
          {isDoctor
            ? "This will be your professional account setup and verification screen. Authentication is not connected yet."
            : "This will be your personal account setup screen. Authentication is not connected yet."}
        </p>
        <Link className="registration-placeholder__back" to="/auth/sign-up">
          <span aria-hidden="true">←</span> Back to role selection
        </Link>
      </section>
      <footer className="sign-up-footer">
        <ShieldIcon />
        <p>CARETAI organizes information for doctor review. It does not provide a diagnosis.</p>
      </footer>
    </main>
  );
}
