"use client";

/**
 * Patient reminders (route: `/patient/reminders`).
 *
 * This screen shows reminders from the account only. If none exist yet, we
 * leave the page quiet instead of showing example medicines.
 */
import { useEffect, useState } from "react";
import { Check, Pill, Calendar, Clock } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { ReminderRecord, reminders as remindersApi } from "@/lib/api";

const typeConfig: Record<string, { icon: React.ReactNode; badge: "info" | "warning" | "primary" }> = {
  medication: { icon: <Pill size={16} />, badge: "info" },
  follow_up: { icon: <Calendar size={16} />, badge: "warning" },
  appointment: { icon: <Clock size={16} />, badge: "primary" },
};

function formatReminderTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time not set";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<ReminderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    // Load the patient's reminders from the API. No starter medicine list.
    remindersApi
      .list()
      .then((items) => {
        if (active) setReminders(items);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Could not load reminders.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const today = reminders.filter((r) => r.reminder_type === "medication");
  const upcoming = reminders.filter((r) => r.reminder_type !== "medication");

  const markComplete = async (id: number) => {
    // Update the UI right away, then undo it if the API says no.
    const previous = reminders;
    setReminders((items) =>
      items.map((r) => (r.id === id ? { ...r, status: "completed" } : r))
    );
    try {
      await remindersApi.update(id, { status: "completed" });
    } catch {
      setReminders(previous);
      setError("Could not update the reminder. Please try again.");
    }
  };

  return (
    <div>
      <div className="pl-12 md:pl-0">
        <h1 className="text-2xl font-bold text-foreground mb-1">Reminders</h1>
        <p className="text-muted mb-8">Stay on track with your medications and appointments</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-gray-100 bg-white p-8 text-center text-muted">
          Loading reminders...
        </div>
      ) : reminders.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-8 text-center text-muted">
          {/* This is what a clean new account should look like. */}
          No reminders yet. Your medication and appointment reminders will appear here after they are created.
        </div>
      ) : (
        <>
          <h2 className="text-lg font-semibold text-secondary mb-4">Medication Reminders</h2>
          <div className="space-y-3 mb-10">
            {today.length === 0 && (
              <div className="rounded-xl border border-gray-100 bg-white p-5 text-sm text-muted">
                No medication reminders.
              </div>
            )}
            {today.map((r) => (
              <div
                key={r.id}
                className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${
                  r.status === "completed" ? "border-green-200 bg-green-50/50" : "border-gray-100 shadow-sm"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    r.status === "completed" ? "bg-green-100" : "bg-blue-50"
                  }`}
                >
                  {r.status === "completed" ? (
                    <Check size={20} className="text-green-600" />
                  ) : (
                    <Pill size={20} className="text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${r.status === "completed" ? "text-green-700 line-through" : "text-secondary"}`}>
                    {r.title}
                  </p>
                  <p className="text-sm text-muted">{formatReminderTime(r.scheduled_time)}</p>
                </div>
                {r.status !== "completed" && (
                  <button
                    onClick={() => markComplete(r.id)}
                    className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark"
                  >
                    Done
                  </button>
                )}
              </div>
            ))}
          </div>

          <h2 className="text-lg font-semibold text-secondary mb-4">Upcoming</h2>
          <div className="space-y-3">
            {upcoming.length === 0 && (
              <div className="rounded-xl border border-gray-100 bg-white p-5 text-sm text-muted">
                No appointment or follow-up reminders.
              </div>
            )}
            {upcoming.map((r) => {
              const cfg = typeConfig[r.reminder_type] || typeConfig.appointment;
              return (
                <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">{cfg.icon}</div>
                  <div className="flex-1">
                    <p className="font-medium text-secondary">{r.title}</p>
                    <p className="text-sm text-muted">{formatReminderTime(r.scheduled_time)}</p>
                  </div>
                  <Badge variant={cfg.badge}>{r.reminder_type.replace("_", " ")}</Badge>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
