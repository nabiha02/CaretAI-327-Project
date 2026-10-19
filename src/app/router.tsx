import type { ReactNode } from "react";
import { createBrowserRouter, Navigate, redirect } from "react-router";
import AdminAccessPage from "../admin/access/AdminAccessPage";
import AdminApp from "../admin/layout/AdminApp";
import { getDemoAdminSession } from "../admin/data/adminSession";
import DoctorApp from "../doctor/layout/DoctorApp";
import DoctorRegistrationPage from "../auth/pages/DoctorRegistrationPage";
import DoctorVerificationPage from "../auth/pages/DoctorVerificationPage";
import {
  clearDemoSession,
  getActiveDemoRole,
  getDemoAuthState,
} from "../auth/services/demoAuth";
import LandingPage from "../landing/pages/LandingPage";
import PatientApp from "../patient/layout/PatientApp";
import PatientRegistrationPage from "../auth/pages/PatientRegistrationPage";
import SignInPage from "../auth/pages/SignInPage";
import SignUpRolePage from "../auth/pages/SignUpRolePage";
import VerifyEmailPage from "../auth/pages/VerifyEmailPage";

function ProtectedRoute({ area, children }: { area: "patient" | "doctor"; children: ReactNode }) {
  const role = getActiveDemoRole();
  const session = getDemoAuthState();
  if (!role) return <Navigate to="/" replace />;
  if (area === "patient" && role !== "patient" && role !== "caregiver") {
    return <Navigate to="/" replace />;
  }
  if (area === "doctor" && role !== "doctor") return <Navigate to="/" replace />;
  if (area === "doctor" && session?.doctorReviewStatus !== "approved") {
    return <Navigate to="/auth/doctor-verification" replace />;
  }
  return children;
}

function ProtectedAdminRoute({ children }: { children: ReactNode }) {
  if (!getDemoAdminSession()) {
    return <Navigate to="/admin/demo-access" replace />;
  }
  return children;
}

function DoctorVerificationRoute() {
  const session = getDemoAuthState();
  if (
    !session?.sessionActive ||
    !session.emailVerified ||
    session.role !== "doctor"
  ) {
    return <Navigate to="/" replace />;
  }
  return <DoctorVerificationPage />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    children: [
      { index: true, Component: LandingPage },
      { path: "auth/sign-in", Component: SignInPage },
      { path: "auth/sign-up", Component: SignUpRolePage },
      { path: "auth/sign-up/patient", Component: PatientRegistrationPage },
      { path: "auth/sign-up/doctor", Component: DoctorRegistrationPage },
      { path: "auth/verify-email", Component: VerifyEmailPage },
      { path: "auth/doctor-verification", Component: DoctorVerificationRoute },
      { path: "admin/demo-access", Component: AdminAccessPage },
      { path: "admin/*", element: <ProtectedAdminRoute><AdminApp /></ProtectedAdminRoute> },
      { path: "patient/*", element: <ProtectedRoute area="patient"><PatientApp /></ProtectedRoute> },
      { path: "doctor/*", element: <ProtectedRoute area="doctor"><DoctorApp /></ProtectedRoute> },
      {
        path: "logout",
        loader: () => {
          clearDemoSession();
          return redirect("/");
        },
      },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
