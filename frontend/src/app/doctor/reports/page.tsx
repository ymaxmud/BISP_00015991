"use client";

import { useState } from "react";
import { FileText, Upload, Calendar, User, Eye, Brain } from "lucide-react";
import Link from "next/link";

const mockReports = [
  {
    id: 1, patient: "Sardor Umarov", type: "Blood Test", date: "2026-04-04",
    status: "reviewed", summary: "CBC with differential, lipid panel",
  },
  {
    id: 2, patient: "Dilnoza Alimova", type: "ECG Report", date: "2026-04-03",
    status: "pending", summary: "12-lead ECG, routine screening",
  },
  {
    id: 3, patient: "Bobur Yusupov", type: "Lab Report", date: "2026-04-02",
    status: "reviewed", summary: "Metabolic panel, HbA1c, renal function",
  },
  {
    id: 4, patient: "Timur Nazarov", type: "Coagulation Panel", date: "2026-03-28",
    status: "flagged", summary: "PT/INR monitoring for warfarin therapy",
  },
  {
    id: 5, patient: "Gulnara Rashidova", type: "Pulmonary Function", date: "2026-03-25",
    status: "reviewed", summary: "Spirometry, peak flow measurements",
  },
];

export default function DoctorReportsPage() {
  const [filter, setFilter] = useState<"all" | "pending" | "reviewed" | "flagged">("all");

  const filtered = mockReports.filter(
    (r) => filter === "all" || r.status === filter
  );

  const statusColor = (status: string) => {
    switch (status) {
      case "reviewed": return "bg-green-50 text-green-700";
      case "pending": return "bg-amber-50 text-amber-700";
      case "flagged": return "bg-red-50 text-red-700";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Patient Reports</h1>
          <p className="text-muted">View and analyze uploaded patient reports</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(["all", "pending", "reviewed", "flagged"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === f
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Reports list */}
      <div className="space-y-3">
        {filtered.map((report) => (
          <div
            key={report.id}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center">
                  <FileText size={22} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-secondary">{report.type}</h3>
                  <div className="flex items-center gap-3 text-sm text-muted mt-1">
                    <span className="flex items-center gap-1">
                      <User size={14} />
                      {report.patient}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {report.date}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{report.summary}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColor(report.status)}`}
                >
                  {report.status}
                </span>
                <div className="flex gap-2">
                  <Link
                    href={`/doctor/reports/${report.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                  >
                    <Eye size={14} />
                    View
                  </Link>
                  <Link
                    href={`/doctor/reports/${report.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-primary rounded-lg text-xs font-medium hover:bg-teal-100 transition-colors"
                  >
                    <Brain size={14} />
                    AI Analyze
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted">
            <FileText size={40} className="mx-auto mb-3 text-gray-300" />
            <p>No reports found</p>
          </div>
        )}
      </div>
    </div>
  );
}
