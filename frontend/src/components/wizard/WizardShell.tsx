"use client";

import Link from "next/link";
import { Activity, Check } from "lucide-react";
import clsx from "clsx";

type WizardShellProps = {
  title: string;
  steps: { title: string; description?: string }[];
  currentStep: number;
  children: React.ReactNode;
};

export default function WizardShell({
  title,
  steps,
  currentStep,
  children,
}: WizardShellProps) {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Activity className="text-primary" size={28} />
            <span className="text-xl font-bold text-secondary">Avicenna</span>
          </Link>
          <Link href="/login" className="text-sm text-muted hover:text-primary">
            Already have an account?
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-secondary mb-2">{title}</h1>
        <p className="text-sm text-muted mb-6">
          Step {currentStep + 1} of {steps.length}: {steps[currentStep]?.title}
        </p>

        <div className="grid md:grid-cols-[220px_1fr] gap-6">
          <ol className="hidden md:block space-y-1 border border-gray-100 rounded-xl bg-white p-3 h-fit">
            {steps.map((s, i) => {
              const isActive = i === currentStep;
              const isDone = i < currentStep;
              return (
                <li
                  key={i}
                  className={clsx(
                    "flex items-start gap-3 p-2 rounded-lg text-sm",
                    isActive && "bg-primary/10 text-primary font-medium",
                    isDone && "text-secondary",
                    !isActive && !isDone && "text-muted"
                  )}
                >
                  <div
                    className={clsx(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold mt-0.5",
                      isDone && "bg-primary text-white",
                      isActive && "bg-primary text-white",
                      !isActive && !isDone && "bg-gray-100"
                    )}
                  >
                    {isDone ? <Check size={12} /> : i + 1}
                  </div>
                  <div>
                    <div>{s.title}</div>
                    {s.description && (
                      <div className="text-[11px] text-muted">
                        {s.description}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
