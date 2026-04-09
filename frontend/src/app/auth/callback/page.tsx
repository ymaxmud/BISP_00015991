"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle } from "lucide-react";
import { auth } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";

function routeForRole(role: string): string {
  if (role === "doctor") return "/doctor/dashboard";
  if (role === "admin" || role === "superadmin") return "/org/dashboard";
  return "/patient/dashboard";
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const supabase = getSupabase();

        // Supabase SDK parses the URL hash/code and stores the session
        // automatically (detectSessionInUrl: true). Give it a tick.
        await new Promise((r) => setTimeout(r, 300));

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!session?.access_token) {
          throw new Error("No Supabase session — did you cancel sign-in?");
        }

        // Exchange the Supabase token for a Django JWT.
        const data = await auth.supabaseSync(session.access_token);
        if (cancelled) return;

        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        localStorage.setItem("user_role", data.user.role);
        localStorage.setItem("user_data", JSON.stringify(data.user));

        router.replace(routeForRole(data.user.role));
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Sign-in failed.");
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        {error ? (
          <>
            <AlertTriangle size={40} className="mx-auto text-red-500 mb-3" />
            <h1 className="text-lg font-semibold text-secondary mb-1">
              Sign-in failed
            </h1>
            <p className="text-sm text-muted mb-4">{error}</p>
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark"
            >
              Back to login
            </button>
          </>
        ) : (
          <>
            <Loader2
              size={40}
              className="mx-auto text-primary animate-spin mb-3"
            />
            <h1 className="text-lg font-semibold text-secondary">
              Finishing sign-in...
            </h1>
            <p className="text-sm text-muted mt-1">
              Exchanging your Google session with Avicenna.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
