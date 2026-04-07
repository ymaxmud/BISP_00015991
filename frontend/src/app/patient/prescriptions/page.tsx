"use client";

import { useState } from "react";
import { Pill } from "lucide-react";
import Badge from "@/components/ui/Badge";

const prescriptions = [
  { id: 1, medication: "Enalapril", dosage: "20mg", schedule: "Once daily", duration: 30, doctor: "Dr. Toshmatov", status: "active", date: "2026-03-28" },
  { id: 2, medication: "Vitamin D", dosage: "1000 IU", schedule: "Once daily", duration: 90, doctor: "Dr. Toshmatov", status: "active", date: "2026-03-20" },
  { id: 3, medication: "Ibuprofen", dosage: "400mg", schedule: "Twice daily with food", duration: 14, doctor: "Dr. Rahimova", status: "active", date: "2026-03-15" },
  { id: 4, medication: "Vitamin B12", dosage: "1000mcg", schedule: "Once daily", duration: 30, doctor: "Dr. Rahimova", status: "active", date: "2026-03-15" },
  { id: 5, medication: "Amoxicillin", dosage: "500mg", schedule: "Three times daily", duration: 7, doctor: "Dr. Toshmatov", status: "completed", date: "2026-02-10" },
];

export default function PrescriptionsPage() {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? prescriptions : prescriptions.filter((p) => p.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-8 pl-12 md:pl-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Prescriptions</h1>
          <p className="text-muted mt-1">Your current and past medications</p>
        </div>
      </div>
      <div className="flex gap-2 mb-6">
        {["all", "active", "completed"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? "bg-primary text-white" : "bg-gray-100 text-muted hover:bg-gray-200"}`}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
        ))}
      </div>
      <div className="space-y-4">
        {filtered.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
              <Pill size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-secondary">{p.medication}</h3>
                  <p className="text-sm text-muted">{p.dosage} &middot; {p.schedule} &middot; {p.duration} days</p>
                </div>
                <Badge variant={p.status === "active" ? "success" : "default"}>{p.status}</Badge>
              </div>
              <p className="text-sm text-muted mt-2">Prescribed by {p.doctor} on {p.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
