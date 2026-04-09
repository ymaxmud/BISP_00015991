"use client";

import Link from "next/link";
import { Activity, Briefcase, Building2, Stethoscope, UserRound } from "lucide-react";

const roles = [
  {
    href: "/register/patient",
    label: "I'm a Patient",
    description:
      "Create a personal health profile, book appointments, and get AI-assisted care.",
    icon: UserRound,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    href: "/register/doctor",
    label: "I'm a Doctor",
    description:
      "Build your public profile, enable AI case support, and accept patients independently.",
    icon: Stethoscope,
    color: "bg-sky-50 text-sky-600",
  },
  {
    href: "/register/clinic",
    label: "I manage a Clinic",
    description:
      "Onboard your clinic, add doctors under a single subscription, and run the admin dashboard.",
    icon: Building2,
    color: "bg-indigo-50 text-indigo-600",
  },
];

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 flex items-center justify-center">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Activity className="text-primary" size={32} />
            <span className="text-2xl font-bold text-secondary">Avicenna</span>
          </Link>
          <h1 className="text-3xl font-bold text-secondary">
            Create your account
          </h1>
          <p className="text-muted mt-2">Choose the role that best describes you.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Link
                key={role.href}
                href={role.href}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:border-primary hover:shadow-md transition"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${role.color}`}
                >
                  <Icon size={24} />
                </div>
                <h2 className="text-lg font-semibold text-secondary group-hover:text-primary transition">
                  {role.label}
                </h2>
                <p className="text-sm text-muted mt-2">{role.description}</p>
                <div className="inline-flex items-center gap-1 mt-4 text-primary text-sm font-medium">
                  Continue <Briefcase size={14} />
                </div>
              </Link>
            );
          })}
        </div>

        <p className="text-center text-sm text-muted mt-8">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary font-medium hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
