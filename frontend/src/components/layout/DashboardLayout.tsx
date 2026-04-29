"use client";

/**
 * The shell for every authenticated screen.
 *
 * Two jobs:
 *   1. Make sure the visitor is allowed to be on the page. Three rules:
 *        - no token → bounce to /login
 *        - wrong role for this section → bounce to their own dashboard
 *        - right role → render the children
 *   2. Lay out the sidebar + scrollable main area.
 *
 * Role mapping note:
 *   Backend uses 4 user roles (patient, doctor, admin, superadmin) but
 *   the frontend has 3 dashboard sections (patient, doctor, org). Both
 *   `admin` and `superadmin` belong in the `org` section, so we collapse
 *   the backend role into a "section" before comparing. Without this
 *   mapping, clinic admins would sign up successfully and then get
 *   instantly bounced to /login.
 *
 * The role check runs client-side because the JWT lives in localStorage,
 * which we can't read on the server. We render a small "Checking access…"
 * placeholder while the effect runs so the wrong role can never see
 * even a flash of the protected content.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "./DashboardSidebar";

// Frontend section, which is what each dashboard layout asks for.
type Section = "patient" | "doctor" | "org";

// Backend roles (mirrors accounts/models.py User.Role).
type BackendRole = "patient" | "doctor" | "admin" | "superadmin";

/** Translate a backend role into the frontend section it belongs to. */
function sectionForRole(role: string | null): Section | null {
  if (role === "patient") return "patient";
  if (role === "doctor") return "doctor";
  if (role === "admin" || role === "superadmin") return "org";
  return null;
}

// Where to send a logged-in user who lands on the wrong section.
const HOME_FOR: Record<Section, string> = {
  patient: "/patient/dashboard",
  doctor: "/doctor/dashboard",
  org: "/org/dashboard",
};

export default function DashboardLayout({
  role,
  children,
}: {
  role: Section;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let frame: number | null = null;
    const token = localStorage.getItem("access_token");
    const rawRole = localStorage.getItem("user_role") as BackendRole | null;
    const userSection = sectionForRole(rawRole);

    // Not logged in (or unrecognized role) → send to login
    if (!token || !userSection) {
      router.replace("/login");
      return;
    }

    // Logged in with wrong role → redirect to their own dashboard
    if (userSection !== role) {
      router.replace(HOME_FOR[userSection]);
      return;
    }

    frame = window.requestAnimationFrame(() => {
      setAuthorized(true);
    });

    return () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [role, router]);

  if (!authorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-muted">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Checking access…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <DashboardSidebar role={role} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
