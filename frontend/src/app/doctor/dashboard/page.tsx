"use client";

/**
 * Doctor dashboard (route: `/doctor/dashboard`).
 *
 * Doctor dashboard.
 *
 * Everything here comes from the doctor's account. If the account is fresh,
 * this page should simply be quiet.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle,
  Play,
  Brain,
  Clock,
  ArrowRight,
  Stethoscope,
  FileText,
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import AITestPanel from "@/components/ai/AITestPanel";
import {
  AppointmentRecord,
  QueueTicketRecord,
  appointments as appointmentsApi,
  queue as queueApi,
} from "@/lib/api";

const triageBadge: Record<string, { variant: "default" | "warning" | "danger"; label: string }> = {
  normal: { variant: "default", label: "Normal" },
  priority: { variant: "warning", label: "Priority" },
  urgent: { variant: "danger", label: "Urgent" },
};

const statusLabel: Record<string, string> = {
  waiting: "Waiting",
  called: "Called",
  in_progress: "In Consultation",
  done: "Done",
};

function isToday(value: string): boolean {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export default function DoctorDashboardPage() {
  const [appointmentList, setAppointmentList] = useState<AppointmentRecord[]>([]);
  const [tickets, setTickets] = useState<QueueTicketRecord[]>([]);
  const [doctorName] = useState(() => {
    // This is just for the greeting. Medical/clinic data still comes from APIs.
    try {
      if (typeof window === "undefined") return "";
      const raw = localStorage.getItem("user_data");
      if (!raw) return "";
      const user = JSON.parse(raw) as { first_name?: string; last_name?: string };
      return [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
    } catch {
      return "";
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadDashboard() {
      // Load the two lists this page needs. Empty results mean zero cards.
      setLoading(true);
      setError("");
      const [appointmentResult, queueResult] = await Promise.allSettled([
        appointmentsApi.list(),
        queueApi.list(),
      ]);
      if (!active) return;
      if (appointmentResult.status === "fulfilled") setAppointmentList(appointmentResult.value);
      if (queueResult.status === "fulfilled") setTickets(queueResult.value);
      if (appointmentResult.status === "rejected" || queueResult.status === "rejected") {
        setError("Some dashboard data could not be loaded.");
      }
      setLoading(false);
    }
    void loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  const appointmentById = useMemo(() => {
    // Queue tickets point to appointments, so keep a quick lookup for names and reasons.
    return new Map(appointmentList.map((appointment) => [appointment.id, appointment]));
  }, [appointmentList]);

  // Summary cards are calculated from the loaded lists above.
  const activeTickets = tickets.filter((ticket) => ticket.queue_status !== "done");
  const waitingTickets = tickets.filter((ticket) => ticket.queue_status === "waiting");
  const urgentCount = activeTickets.filter((ticket) => ticket.triage_level === "urgent").length;
  const todayAppointments = appointmentList.filter((appointment) =>
    isToday(appointment.appointment_time)
  );
  const completedToday = todayAppointments.filter(
    (appointment) => appointment.status === "completed"
  ).length;

  return (
    <div className="space-y-8">
      <div className="pl-12 md:pl-0">
        <h1 className="text-2xl font-bold text-foreground">
          {doctorName ? `Welcome back, Dr. ${doctorName}` : "Welcome back"}
        </h1>
        <p className="text-muted mt-1">
          {loading ? "Loading your dashboard..." : "Here is your overview for today."}
        </p>
        {error && <p className="text-sm text-amber-600 mt-2">{error}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Appointments"
          value={todayAppointments.length}
          trend="neutral"
          icon={<Calendar size={22} />}
        />
        <StatCard
          title="In Queue"
          value={waitingTickets.length}
          trend="neutral"
          icon={<Users size={22} />}
        />
        <StatCard
          title="Urgent Cases"
          value={urgentCount}
          trend={urgentCount > 0 ? "down" : "neutral"}
          icon={<AlertTriangle size={22} />}
        />
        <StatCard
          title="Completed Today"
          value={completedToday}
          trend="neutral"
          icon={<CheckCircle size={22} />}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Today&apos;s Queue</CardTitle>
            <Link href="/doctor/queue">
              <Button variant="ghost" size="sm">
                View Full Queue <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-muted">Loading queue...</div>
          ) : activeTickets.length === 0 ? (
            <div className="py-10 text-center text-muted">
              {/* Leave this blank for a new doctor. */}
              No patients are waiting in your queue.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 font-medium text-muted">#</th>
                    <th className="text-left py-3 px-4 font-medium text-muted">Patient Name</th>
                    <th className="text-left py-3 px-4 font-medium text-muted">Chief Complaint</th>
                    <th className="text-left py-3 px-4 font-medium text-muted">Triage Level</th>
                    <th className="text-left py-3 px-4 font-medium text-muted">Wait Time</th>
                    <th className="text-left py-3 px-4 font-medium text-muted">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTickets.map((ticket) => {
                    const appointment = appointmentById.get(ticket.appointment);
                    const triage = triageBadge[ticket.triage_level] || triageBadge.normal;
                    return (
                      <tr
                        key={ticket.id}
                        className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-muted">{ticket.queue_number}</td>
                        <td className="py-3 px-4 font-medium text-foreground">
                          {appointment?.patient_name || "Patient"}
                        </td>
                        <td className="py-3 px-4 text-muted">
                          {appointment?.reason || "No complaint recorded"}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={triage.variant} size="sm">
                            {triage.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-muted">
                          <span className="flex items-center gap-1">
                            <Clock size={14} /> {ticket.estimated_wait_minutes} min
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 text-amber-600 text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            {statusLabel[ticket.queue_status] || ticket.queue_status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Link href={`/doctor/consultation/${ticket.appointment}`}>
                            <Button size="sm" variant="primary">
                              <Play size={14} /> Start
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AITestPanel />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain size={20} className="text-primary" />
              Recent AI Analyses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center text-muted">
              {/* This fills only after the doctor runs an analysis. */}
              No AI analyses yet. Case analyses will appear here after you run them.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link href="/doctor/queue">
                <Button variant="outline" className="w-full justify-start gap-3 h-14">
                  <Users size={20} className="text-primary" />
                  <div className="text-left">
                    <p className="font-medium">View Queue</p>
                    <p className="text-xs text-muted">{waitingTickets.length} waiting</p>
                  </div>
                </Button>
              </Link>
              <Link href="/doctor/ai">
                <Button variant="outline" className="w-full justify-start gap-3 h-14">
                  <Brain size={20} className="text-primary" />
                  <div className="text-left">
                    <p className="font-medium">AI Assistant</p>
                    <p className="text-xs text-muted">Analyze cases</p>
                  </div>
                </Button>
              </Link>
              <Link href="/doctor/patients">
                <Button variant="outline" className="w-full justify-start gap-3 h-14">
                  <Stethoscope size={20} className="text-primary" />
                  <div className="text-left">
                    <p className="font-medium">Patient Records</p>
                    <p className="text-xs text-muted">Search and review</p>
                  </div>
                </Button>
              </Link>
              <Link href="/doctor/reports">
                <Button variant="outline" className="w-full justify-start gap-3 h-14">
                  <FileText size={20} className="text-primary" />
                  <div className="text-left">
                    <p className="font-medium">Reports</p>
                    <p className="text-xs text-muted">Lab and imaging</p>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
