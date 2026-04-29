"use client";

/**
 * Clinic admin dashboard (route: `/org/dashboard`).
 *
 * Clinic dashboard.
 *
 * A clinic with no activity should look quiet. The numbers and charts below
 * come from appointments, doctors, and queue tickets.
 */
import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Stethoscope,
  Clock,
  UserX,
  AlertTriangle,
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  AppointmentRecord,
  DoctorRecord,
  QueueTicketRecord,
  appointments as appointmentsApi,
  doctors as doctorsApi,
  queue as queueApi,
} from "@/lib/api";

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dayLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

export default function OrgDashboardPage() {
  const [chartsReady, setChartsReady] = useState(false);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [tickets, setTickets] = useState<QueueTicketRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      // Recharts behaves better after the browser has painted once.
      setChartsReady(true);
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadDashboard() {
      // Load the three lists this dashboard is built from.
      setLoading(true);
      setError("");
      const [appointmentResult, doctorResult, queueResult] = await Promise.allSettled([
        appointmentsApi.list(),
        doctorsApi.list(),
        queueApi.list(),
      ]);
      if (!active) return;
      if (appointmentResult.status === "fulfilled") setAppointments(appointmentResult.value);
      if (doctorResult.status === "fulfilled") setDoctors(doctorResult.value);
      if (queueResult.status === "fulfilled") setTickets(queueResult.value);
      if ([appointmentResult, doctorResult, queueResult].some((result) => result.status === "rejected")) {
        setError("Some dashboard data could not be loaded.");
      }
      setLoading(false);
    }
    void loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  // Top cards are just simple counts from the loaded lists.
  const today = new Date();
  const todayAppointments = appointments.filter((appointment) =>
    isSameDay(new Date(appointment.appointment_time), today)
  );
  const noShowCount = appointments.filter((appointment) => appointment.status === "no_show").length;
  const noShowRate =
    appointments.length > 0 ? `${((noShowCount / appointments.length) * 100).toFixed(1)}%` : "0%";
  const activeQueueTickets = tickets.filter((ticket) => ticket.queue_status !== "done");
  const avgWait =
    activeQueueTickets.length > 0
      ? Math.round(
          activeQueueTickets.reduce((sum, ticket) => sum + ticket.estimated_wait_minutes, 0) /
            activeQueueTickets.length
        )
      : 0;

  const appointmentTrends = useMemo(() => {
    // Last seven days, counted from appointments.
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return {
        day: dayLabel(date),
        appointments: appointments.filter((appointment) =>
          isSameDay(new Date(appointment.appointment_time), date)
        ).length,
      };
    });
  }, [appointments]);

  const doctorWorkload = useMemo(() => {
    // Count today's appointments per doctor.
    const counts = new Map<string, number>();
    todayAppointments.forEach((appointment) => {
      const name = appointment.doctor_name || `Doctor #${appointment.doctor_profile}`;
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([name, patients]) => ({ name, patients }));
  }, [todayAppointments]);

  const urgentTickets = activeQueueTickets.filter((ticket) => ticket.triage_level === "urgent");

  return (
    <div className="space-y-8">
      <div className="pl-12 md:pl-0">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted mt-1">
          {loading ? "Loading clinic operations..." : "Overview of your clinic operations for today"}
        </p>
        {error && <p className="text-sm text-amber-600 mt-2">{error}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Appointments Today"
          value={todayAppointments.length}
          trend="neutral"
          icon={<Calendar size={22} />}
        />
        <StatCard
          title="Active Doctors"
          value={doctors.filter((doctor) => doctor.is_active !== false).length}
          trend="neutral"
          icon={<Stethoscope size={22} />}
        />
        <StatCard
          title="Average Wait Time"
          value={`${avgWait} min`}
          trend="neutral"
          icon={<Clock size={22} />}
        />
        <StatCard
          title="No-Show Rate"
          value={noShowRate}
          trend="neutral"
          icon={<UserX size={22} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Appointment Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {chartsReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={appointmentTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 13 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 13 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="appointments"
                      stroke="#0d9488"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#0d9488" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full rounded-lg bg-gray-50 animate-pulse" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Doctor Workload Today</CardTitle>
          </CardHeader>
          <CardContent>
            {doctorWorkload.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-muted">
                {/* New or quiet clinic: no workload to chart. */}
                No doctor workload data for today.
              </div>
            ) : (
              <div className="h-72">
                {chartsReady ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={doctorWorkload} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 13 }} />
                      <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="patients" fill="#0d9488" radius={[0, 6, 6, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full rounded-lg bg-gray-50 animate-pulse" />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            Urgent Queue Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          {urgentTickets.length === 0 ? (
            <div className="py-8 text-center text-muted">
              {/* No urgent tickets right now is a good thing. */}
              No urgent queue tickets right now.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {urgentTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Queue #{ticket.queue_number}
                    </p>
                    <p className="text-xs text-muted">
                      Estimated wait: {ticket.estimated_wait_minutes} min
                    </p>
                  </div>
                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                    Urgent
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
