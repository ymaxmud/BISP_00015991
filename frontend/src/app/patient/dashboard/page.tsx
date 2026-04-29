"use client";

/**
 * Patient dashboard (route: `/patient/dashboard`).
 *
 * Landing screen after a patient logs in. Personal greeting (read
 * from `user_data` in localStorage), upcoming appointments,
 * reminders, and quick-action cards (Book, Find Doctor, Symptoms).
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Pill,
  Bell,
  CheckCircle2,
  Clock,
  ArrowRight,
  Upload,
  ClipboardList,
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import {
  AppointmentRecord,
  PrescriptionRecord,
  ReminderRecord,
  appointments,
  prescriptions,
  reminders,
} from "@/lib/api";

const statusBadge: Record<string, { label: string; variant: "info" | "success" | "danger" | "default" }> = {
  scheduled: { label: "Scheduled", variant: "info" },
  checked_in: { label: "Checked In", variant: "info" },
  in_queue: { label: "In Queue", variant: "info" },
  in_consultation: { label: "In Consultation", variant: "info" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "danger" },
  no_show: { label: "No Show", variant: "default" },
};

function dateTimeParts(value: string): { date: string; time: string } {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "Not scheduled", time: "" };
  return {
    date: date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
    time: date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  };
}

export default function PatientDashboardPage() {
  const [appointmentList, setAppointmentList] = useState<AppointmentRecord[]>([]);
  const [reminderList, setReminderList] = useState<ReminderRecord[]>([]);
  const [prescriptionList, setPrescriptionList] = useState<PrescriptionRecord[]>([]);
  const [dashboardNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [userName] = useState(() => {
    try {
      const raw = localStorage.getItem("user_data");
      if (raw) {
        const data = JSON.parse(raw);
        if (typeof data.first_name === "string" && data.first_name.trim()) {
          return data.first_name;
        }
      }
    } catch {}
    return "";
  });

  useEffect(() => {
    let active = true;
    async function loadDashboard() {
      // Pull the patient's own data. A new account normally returns empty
      // lists, and that is exactly what we want to show.
      setLoading(true);
      setLoadError("");
      const [apptResult, reminderResult, prescriptionResult] = await Promise.allSettled([
        appointments.list(),
        reminders.list(),
        prescriptions.list(),
      ]);
      if (!active) return;
      if (apptResult.status === "fulfilled") setAppointmentList(apptResult.value);
      if (reminderResult.status === "fulfilled") setReminderList(reminderResult.value);
      if (prescriptionResult.status === "fulfilled") setPrescriptionList(prescriptionResult.value);
      if ([apptResult, reminderResult, prescriptionResult].some((r) => r.status === "rejected")) {
        setLoadError("Some dashboard data could not be loaded.");
      }
      setLoading(false);
    }
    void loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  const upcomingAppointments = useMemo(() => {
    // Only upcoming appointments belong in this small preview.
    return appointmentList
      .filter((apt) => {
        const time = new Date(apt.appointment_time).getTime();
        return (
          !Number.isNaN(time) &&
          time >= dashboardNow &&
          !["cancelled", "completed", "no_show"].includes(apt.status)
        );
      })
      .sort(
        (a, b) =>
          new Date(a.appointment_time).getTime() -
          new Date(b.appointment_time).getTime()
      )
      .slice(0, 3);
  }, [appointmentList, dashboardNow]);

  const pendingReminderCount = reminderList.filter((r) => r.status === "pending").length;
  const completedVisitCount = appointmentList.filter((a) => a.status === "completed").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pl-12 md:pl-0">
        <h1 className="text-2xl font-bold text-foreground">
          {userName ? `Welcome back, ${userName}` : "Welcome back"}
        </h1>
        <p className="text-muted mt-1">
          {loading ? "Loading your health dashboard..." : "Here is your account overview."}
        </p>
        {loadError && <p className="text-sm text-amber-600 mt-2">{loadError}</p>}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Upcoming Appointments"
          value={upcomingAppointments.length}
          trend="neutral"
          icon={<Calendar size={22} />}
        />
        <StatCard
          title="Prescriptions"
          value={prescriptionList.length}
          trend="neutral"
          icon={<Pill size={22} />}
        />
        <StatCard
          title="Pending Reminders"
          value={pendingReminderCount}
          trend="neutral"
          icon={<Bell size={22} />}
        />
        <StatCard
          title="Completed Visits"
          value={completedVisitCount}
          trend="neutral"
          icon={<CheckCircle2 size={22} />}
        />
      </div>

      {/* Upcoming Appointments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Upcoming Appointments
          </h2>
          <Link href="/patient/appointments">
            <Button variant="ghost" size="sm">
              View All <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {!loading && upcomingAppointments.length === 0 && (
            <Card className="md:col-span-3">
              <CardContent className="pt-6 text-center text-muted">
                {/* First-time users should see this, not example appointments. */}
                No upcoming appointments yet. Book a visit when you are ready.
              </CardContent>
            </Card>
          )}
          {upcomingAppointments.map((apt) => {
            const badge = statusBadge[apt.status] || statusBadge.scheduled;
            const when = dateTimeParts(apt.appointment_time);
            return (
              <Card key={apt.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-foreground">
                        {apt.doctor_name || "Assigned doctor"}
                      </p>
                      <p className="text-sm text-muted">
                        {apt.doctor_specialties?.join(", ") || apt.organization_name || "Appointment"}
                      </p>
                    </div>
                    <Badge variant={badge.variant} size="sm">
                      {badge.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted mt-4">
                    <Clock size={14} />
                    <span>
                      {when.date}{when.time ? ` at ${when.time}` : ""}
                    </span>
                  </div>
                  <div className="mt-4">
                    <Link href={`/patient/intake/${apt.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/patient/appointments">
            <Card className="cursor-pointer group">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-100 transition-colors">
                  <Calendar size={22} />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    Book Appointment
                  </p>
                  <p className="text-sm text-muted">
                    Schedule a new visit
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/patient/uploads">
            <Card className="cursor-pointer group">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                  <Upload size={22} />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    Upload Report
                  </p>
                  <p className="text-sm text-muted">
                    Submit lab results or documents
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/patient/prescriptions">
            <Card className="cursor-pointer group">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
                  <ClipboardList size={22} />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    View Prescriptions
                  </p>
                  <p className="text-sm text-muted">
                    Check active medications
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
