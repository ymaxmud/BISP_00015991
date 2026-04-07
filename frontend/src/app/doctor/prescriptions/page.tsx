"use client";

import { useState } from "react";
import { Pill, Search, Plus, Clock, CheckCircle, AlertTriangle } from "lucide-react";

const mockPrescriptions = [
  {
    id: 1, patient: "Sardor Umarov", medication: "Vitamin D",
    dosage: "1000 IU", schedule: "once daily", duration: "90 days",
    startDate: "2026-04-04", status: "active", source: "doctor",
  },
  {
    id: 2, patient: "Dilnoza Alimova", medication: "Enalapril",
    dosage: "20mg", schedule: "once daily", duration: "30 days",
    startDate: "2026-04-03", status: "active", source: "doctor",
  },
  {
    id: 3, patient: "Bobur Yusupov", medication: "Ibuprofen",
    dosage: "400mg", schedule: "twice daily with food", duration: "14 days",
    startDate: "2026-04-02", status: "active", source: "doctor",
  },
  {
    id: 4, patient: "Bobur Yusupov", medication: "Vitamin B12",
    dosage: "1000mcg", schedule: "once daily", duration: "30 days",
    startDate: "2026-04-02", status: "active", source: "doctor",
  },
  {
    id: 5, patient: "Gulnara Rashidova", medication: "Salbutamol Inhaler",
    dosage: "100mcg", schedule: "as needed (PRN)", duration: "ongoing",
    startDate: "2026-03-15", status: "active", source: "doctor",
  },
  {
    id: 6, patient: "Timur Nazarov", medication: "Warfarin",
    dosage: "5mg", schedule: "once daily", duration: "ongoing",
    startDate: "2026-01-10", status: "active", source: "doctor",
    alert: "INR monitoring required",
  },
];

export default function DoctorPrescriptionsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  const filtered = mockPrescriptions.filter((p) => {
    const matchSearch =
      p.patient.toLowerCase().includes(search.toLowerCase()) ||
      p.medication.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || p.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Prescriptions</h1>
          <p className="text-muted">Manage prescriptions you have issued</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
          <Plus size={18} />
          New Prescription
        </button>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by patient or medication..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "completed"] as const).map((f) => (
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
      </div>

      {/* Prescriptions table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Patient</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Medication</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Dosage</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Schedule</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Duration</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((rx) => (
              <tr key={rx.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-secondary text-sm">{rx.patient}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Pill size={16} className="text-primary" />
                    <span className="text-sm font-medium text-secondary">{rx.medication}</span>
                  </div>
                  {rx.alert && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertTriangle size={12} className="text-amber-500" />
                      <span className="text-xs text-amber-600">{rx.alert}</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{rx.dosage}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{rx.schedule}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{rx.duration}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      rx.status === "active"
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {rx.status === "active" ? <Clock size={12} /> : <CheckCircle size={12} />}
                    {rx.status === "active" ? "Active" : "Completed"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-muted">No prescriptions found</div>
        )}
      </div>
    </div>
  );
}
