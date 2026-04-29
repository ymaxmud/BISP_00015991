"use client";

/**
 * Patient prescriptions (route: `/patient/prescriptions`).
 *
 * Shows the patient's prescriptions from the API. New patients usually land on
 * the empty state first.
 */
import { useEffect, useState } from "react";
import { Pill } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { PrescriptionRecord, prescriptions as prescriptionsApi } from "@/lib/api";

function formatDate(value?: string): string {
  if (!value) return "Date not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not recorded";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [filter, setFilter] = useState<"all" | "doctor" | "ai_draft">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    // Only saved prescriptions belong here. If the API returns none, show none.
    prescriptionsApi
      .list()
      .then((items) => {
        if (active) setPrescriptions(items);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Could not load prescriptions.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered =
    filter === "all" ? prescriptions : prescriptions.filter((p) => p.source === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-8 pl-12 md:pl-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Prescriptions</h1>
          <p className="text-muted mt-1">Your current and past medications</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          {error}
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {[
          { value: "all", label: "All" },
          { value: "doctor", label: "Doctor issued" },
          { value: "ai_draft", label: "AI drafts" },
        ].map((item) => (
          <button
            key={item.value}
            onClick={() => setFilter(item.value as "all" | "doctor" | "ai_draft")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === item.value
                ? "bg-primary text-white"
                : "bg-gray-100 text-muted hover:bg-gray-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-100 bg-white p-8 text-center text-muted">
          Loading prescriptions...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-8 text-center text-muted">
          {/* Normal state until a doctor writes the first prescription. */}
          No prescriptions found. Prescriptions will appear here after a doctor creates them during a consultation.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                <Pill size={20} className="text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-secondary">{p.medication_name}</h3>
                    <p className="text-sm text-muted">
                      {p.dosage} &middot; {p.schedule}
                      {p.duration_days ? ` · ${p.duration_days} days` : ""}
                    </p>
                  </div>
                  <Badge variant={p.source === "ai_draft" ? "warning" : "success"}>
                    {p.source === "ai_draft" ? "AI draft" : "Doctor issued"}
                  </Badge>
                </div>
                {p.notes && <p className="text-sm text-muted mt-2">{p.notes}</p>}
                <p className="text-sm text-muted mt-2">Created on {formatDate(p.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
