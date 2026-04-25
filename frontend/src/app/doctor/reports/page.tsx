"use client";

import { useEffect, useMemo, useState } from "react";
import { Brain, Calendar, Eye, FileText, Loader2, User } from "lucide-react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { UploadRecord, uploads } from "@/lib/api";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const statusVariant: Record<string, "success" | "warning" | "danger" | "info"> = {
  valid: "success",
  pending: "warning",
  invalid: "danger",
};

export default function DoctorReportsPage() {
  const [reports, setReports] = useState<UploadRecord[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "valid" | "invalid">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadReports() {
      try {
        setLoading(true);
        setError(null);
        const data = await uploads.list();
        if (!cancelled) setReports(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load reports.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadReports();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return reports.filter((report) => filter === "all" || report.validation_status === filter);
  }, [filter, reports]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Patient Reports</h1>
          <p className="text-muted">
            These are the uploaded reports currently visible to your account.
          </p>
        </div>
        {loading && <Loader2 className="animate-spin text-muted" size={20} />}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(["all", "pending", "valid", "invalid"] as const).map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === item
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {item === "valid" ? "verified" : item}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-muted bg-white rounded-xl border border-gray-200">
            <FileText size={40} className="mx-auto mb-3 text-gray-300" />
            <p>No reports found for this filter.</p>
          </div>
        )}

        {filtered.map((report) => (
          <div
            key={report.id}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                  <FileText size={22} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-secondary truncate">
                    {report.file_name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted mt-1">
                    <span className="flex items-center gap-1">
                      <User size={14} />
                      {report.patient_name || `Patient #${report.patient_profile}`}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {formatDate(report.uploaded_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {report.mime_type || "Medical file"}
                    {report.appointment_time
                      ? ` · linked to visit ${formatDate(report.appointment_time)}`
                      : " · uploaded without an appointment link"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Badge
                  variant={statusVariant[report.validation_status] || "info"}
                  size="sm"
                >
                  {report.validation_status}
                </Badge>
                <div className="flex gap-2">
                  <a
                    href={report.file}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                  >
                    <Eye size={14} />
                    Open File
                  </a>
                  <Link
                    href="/doctor/ai"
                    className="flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-primary rounded-lg text-xs font-medium hover:bg-teal-100 transition-colors"
                  >
                    <Brain size={14} />
                    AI Workspace
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
