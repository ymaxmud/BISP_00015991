"use client";

import { Clock, AlertTriangle, Users } from "lucide-react";
import Badge from "@/components/ui/Badge";

const doctorQueues = [
  { doctor: "Dr. Karimov", specialty: "Cardiology", patients: [
    { name: "Bobur Yusupov", complaint: "Heart follow-up", triage: "urgent", wait: 5 },
    { name: "Sardor Umarov", complaint: "Chest pain", triage: "priority", wait: 18 },
    { name: "Timur Nazarov", complaint: "Warfarin review", triage: "normal", wait: 30 },
  ]},
  { doctor: "Dr. Rahimova", specialty: "Neurology", patients: [
    { name: "Dilnoza Alimova", complaint: "Headaches", triage: "priority", wait: 25 },
    { name: "Alisher Khamidov", complaint: "Numbness", triage: "normal", wait: 40 },
  ]},
  { doctor: "Dr. Toshmatov", specialty: "General Practice", patients: [
    { name: "Gulnara Rashidova", complaint: "Breathing difficulty", triage: "urgent", wait: 12 },
    { name: "Nargiza Sultanova", complaint: "Annual checkup", triage: "normal", wait: 35 },
    { name: "Malika Ergasheva", complaint: "Skin rash", triage: "normal", wait: 48 },
  ]},
];

const triageBadge: Record<string, "danger" | "warning" | "default"> = { urgent: "danger", priority: "warning", normal: "default" };
const totalWaiting = doctorQueues.reduce((a, d) => a + d.patients.length, 0);
const avgWait = Math.round(doctorQueues.flatMap((d) => d.patients).reduce((a, p) => a + p.wait, 0) / totalWaiting);
const bottleneck = doctorQueues.reduce((max, d) => d.patients.length > max.patients.length ? d : max, doctorQueues[0]);

export default function QueuesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary mb-6">Queue Monitor</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center"><Users size={20} className="text-primary" /></div>
          <div><p className="text-sm text-muted">Total Waiting</p><p className="text-2xl font-bold text-secondary">{totalWaiting}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><Clock size={20} className="text-amber-600" /></div>
          <div><p className="text-sm text-muted">Avg Wait</p><p className="text-2xl font-bold text-secondary">{avgWait} min</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center"><AlertTriangle size={20} className="text-red-500" /></div>
          <div><p className="text-sm text-muted">Bottleneck</p><p className="text-lg font-bold text-secondary">{bottleneck.doctor}</p></div>
        </div>
      </div>

      <div className="space-y-6">
        {doctorQueues.map((dq) => (
          <div key={dq.doctor} className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div><h2 className="font-semibold text-secondary">{dq.doctor}</h2><p className="text-sm text-muted">{dq.specialty}</p></div>
              <Badge variant="primary">{dq.patients.length} patients</Badge>
            </div>
            <div className="divide-y divide-gray-50">
              {dq.patients.map((p, i) => (
                <div key={i} className={`px-4 py-3 flex items-center justify-between ${p.wait > 30 ? "bg-amber-50/50" : ""}`}>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-muted">{i + 1}</span>
                    <div><p className="text-sm font-medium text-secondary">{p.name}</p><p className="text-xs text-muted">{p.complaint}</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={triageBadge[p.triage]} size="sm">{p.triage}</Badge>
                    <span className={`text-sm font-medium ${p.wait > 30 ? "text-amber-600" : "text-muted"}`}>{p.wait} min</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
