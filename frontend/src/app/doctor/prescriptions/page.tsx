"use client";

/**
 * Doctor prescriptions (route: `/doctor/prescriptions`).
 *
 * Doctor prescriptions.
 *
 * This list starts empty until the doctor writes something during a visit.
 */
import { useEffect, useState } from "react";
import { Pill, Search, Plus, Clock, FileText, AlertTriangle } from "lucide-react";
import { PrescriptionRecord, prescriptions as prescriptionsApi } from "@/lib/api";

function formatDate(value?: string): string {
  if (!value) return "Date not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not recorded";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function DoctorPrescriptionsPage() {
  const [items, setItems] = useState<PrescriptionRecord[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "doctor" | "ai_draft">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    // Load only what this doctor has actually written.
    prescriptionsApi
      .list()
      .then((data) => {
        if (active) setItems(data);
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

  const filtered = items.filter((p) => {
    // Search the loaded rows. No rows means no table content.
    const matchSearch = p.medication_name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || p.source === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 pl-12 md:pl-0">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Prescriptions</h1>
          <p className="text-muted">Manage prescriptions you have issued</p>
        </div>
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-muted rounded-lg text-sm font-medium cursor-not-allowed"
          title="Create prescriptions from a consultation."
        >
          {/* Prescriptions belong to visits, so this page does not create one from scratch. */}
          <Plus size={18} />
          New Prescription
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by medication..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>
        <div className="flex gap-2">
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
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted">Loading prescriptions...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted">
            {/* First state for a doctor who has not written prescriptions yet. */}
            No prescriptions found. Create prescriptions from a real consultation.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Medication</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Dosage</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Schedule</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Duration</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Source</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((rx) => (
                <tr key={rx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Pill size={16} className="text-primary" />
                      <span className="text-sm font-medium text-secondary">{rx.medication_name}</span>
                    </div>
                    {rx.notes && (
                      <div className="flex items-center gap-1 mt-1">
                        <AlertTriangle size={12} className="text-amber-500" />
                        <span className="text-xs text-amber-600">{rx.notes}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{rx.dosage}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{rx.schedule}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {rx.duration_days ? `${rx.duration_days} days` : "Not set"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {rx.source === "ai_draft" ? <FileText size={12} /> : <Clock size={12} />}
                      {rx.source === "ai_draft" ? "AI Draft" : "Doctor"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDate(rx.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
