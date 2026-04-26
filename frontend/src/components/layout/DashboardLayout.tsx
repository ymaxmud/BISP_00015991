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
 * The role check happens client-side because the JWT lives in localStorage,
 * which we can't read on the server. We render a small "Checking access…"
 * placeholder while the effect runs so the wrong role can never see even
 * a flash of the protected content.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "./DashboardSidebar";

type Role = "patient" | "doctor" | "org";

// Where to send a logged-in user who lands on the wrong section.
const HOME_FOR: Record<Role, string> = {
  patient: "/patient/dashboard",
  doctor: "/doctor/dashboard",
  org: "/org/dashboard",
};

export default function DashboardLayout({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const userRole = localStorage.getItem("user_role") as Role | null;

    // Not logged in → send to login
    if (!token || !userRole) {
      router.replace("/login");
      return;
    }

    // Logged in with wrong role → redirect to their own dashboard
    if (userRole !== role) {
      router.replace(HOME_FOR[userRole] ?? "/login");
      return;
    }

    setAuthorized(true);
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
