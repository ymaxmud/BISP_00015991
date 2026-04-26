"use client";

/**
 * Patient reminders (route: `/patient/reminders`).
 *
 * Medication and appointment reminders. Toggling a reminder on/off
 * is a local-only flip for now — real wiring goes to the
 * `reminders.*` API once we add reminder push delivery.
 */
import { useState } from "react";
import { Check, Pill, Calendar, Clock } from "lucide-react";
import Badge from "@/components/ui/Badge";

const initialReminders = [
  { id: 1, title: "Take Enalapril 20mg", type: "medication", time: "08:00 AM", status: "pending" },
  { id: 2, title: "Take Vitamin D 1000 IU", type: "medication", time: "09:00 AM", status: "pending" },
  { id: 3, title: "Take Ibuprofen 400mg", type: "medication", time: "12:00 PM", status: "completed" },
  { id: 4, title: "Follow-up with Dr. Karimov", type: "follow_up", time: "Apr 19, 2026", status: "pending" },
  { id: 5, title: "Annual checkup reminder", type: "appointment", time: "May 15, 2026", status: "pending" },
  { id: 6, title: "Take Vitamin B12 1000mcg", type: "medication", time: "08:00 AM tomorrow", status: "pending" },
];

const typeConfig: Record<string, { icon: React.ReactNode; badge: "info" | "warning" | "primary" }> = {
  medication: { icon: <Pill size={16} />, badge: "info" },
  follow_up: { icon: <Calendar size={16} />, badge: "warning" },
  appointment: { icon: <Clock size={16} />, badge: "primary" },
};

export default function RemindersPage() {
  const [reminders, setReminders] = useState(initialReminders);
  const today = reminders.filter((r) => r.type === "medication");
  const upcoming = reminders.filter((r) => r.type !== "medication");

  const markComplete = (id: number) => {
    setReminders(reminders.map((r) => r.id === id ? { ...r, status: "completed" } : r));
  };

  return (
    <div>
      <div className="pl-12 md:pl-0">
        <h1 className="text-2xl font-bold text-foreground mb-1">Reminders</h1>
        <p className="text-muted mb-8">Stay on track with your medications and appointments</p>
      </div>

      <h2 className="text-lg font-semibold text-secondary mb-4">Today&apos;s Medications</h2>
      <div className="space-y-3 mb-10">
        {today.map((r) => (
          <div key={r.id} className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${r.status === "completed" ? "border-green-200 bg-green-50/50" : "border-gray-100 shadow-sm"}`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${r.status === "completed" ? "bg-green-100" : "bg-blue-50"}`}>
              {r.status === "completed" ? <Check size={20} className="text-green-600" /> : <Pill size={20} className="text-blue-600" />}
            </div>
            <div className="flex-1">
              <p className={`font-medium ${r.status === "completed" ? "text-green-700 line-through" : "text-secondary"}`}>{r.title}</p>
              <p className="text-sm text-muted">{r.time}</p>
            </div>
            {r.status !== "completed" && (
              <button onClick={() => markComplete(r.id)} className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark">Done</button>
            )}
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-secondary mb-4">Upcoming</h2>
      <div className="space-y-3">
        {upcoming.map((r) => {
          const cfg = typeConfig[r.type];
          return (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">{cfg.icon}</div>
              <div className="flex-1">
                <p className="font-medium text-secondary">{r.title}</p>
                <p className="text-sm text-muted">{r.time}</p>
              </div>
              <Badge variant={cfg.badge}>{r.type.replace("_", " ")}</Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}
