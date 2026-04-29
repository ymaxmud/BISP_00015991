"use client";

/**
 * Clinic admin analytics (route: `/org/analytics`).
 *
 * Clinic analytics.
 *
 * The charts are built from appointments and doctors. If the clinic has no
 * activity yet, there is nothing to chart.
 */
import { useEffect, useMemo, useState } from "react";
import { BarChart3, TrendingUp, Clock, Users } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import {
  AppointmentRecord,
  DoctorRecord,
  appointments as appointmentsApi,
  doctors as doctorsApi,
} from "@/lib/api";

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dayLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

export default function AnalyticsPage() {
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  // Keep today's date steady while this page is open.
  const [today] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadAnalytics() {
      // Pull the data once and build the charts from it.
      setLoading(true);
      setError("");
      const [appointmentResult, doctorResult] = await Promise.allSettled([
        appointmentsApi.list(),
        doctorsApi.list(),
      ]);
      if (!active) return;
      if (appointmentResult.status === "fulfilled") setAppointments(appointmentResult.value);
      if (doctorResult.status === "fulfilled") setDoctors(doctorResult.value);
      if (appointmentResult.status === "rejected" || doctorResult.status === "rejected") {
        setError("Could not load analytics data.");
      }
      setLoading(false);
    }
    void loadAnalytics();
    return () => {
      active = false;
    };
  }, []);

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6);

  const weekAppointments = appointments.filter((appointment) => {
    // Last seven days for the summary card.
    const date = new Date(appointment.appointment_time);
    return !Number.isNaN(date.getTime()) && date >= weekStart && date <= today;
  });

  const trendData = useMemo(() => {
    // One bar per day.
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return {
        day: dayLabel(date),
        appointments: appointments.filter((appointment) =>
          sameDay(new Date(appointment.appointment_time), date)
        ).length,
      };
    });
  }, [appointments]);

  const workloadData = useMemo(() => {
    const counts = new Map<string, number>();
    appointments
      .filter((appointment) => sameDay(new Date(appointment.appointment_time), today))
      .forEach((appointment) => {
        const name = appointment.doctor_name || `Doctor #${appointment.doctor_profile}`;
        counts.set(name, (counts.get(name) || 0) + 1);
      });
    return Array.from(counts.entries()).map(([doctor, patients]) => ({ doctor, patients }));
  }, [appointments, today]);

  const specialtyData = useMemo(() => {
    // If a doctor has no specialty yet, keep it as "Unspecified".
    const counts = new Map<string, number>();
    appointments.forEach((appointment) => {
      const labels = appointment.doctor_specialties?.length
        ? appointment.doctor_specialties
        : ["Unspecified"];
      labels.forEach((label) => counts.set(label, (counts.get(label) || 0) + 1));
    });
    const total = Array.from(counts.values()).reduce((sum, count) => sum + count, 0);
    return Array.from(counts.entries()).map(([name, count]) => ({
      name,
      value: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
  }, [appointments]);

  const maxAppt = Math.max(1, ...trendData.map((d) => d.appointments));
  const maxWorkload = Math.max(1, ...workloadData.map((d) => d.patients));

  return (
    <div>
      <div className="pl-12 md:pl-0 mb-6">
        <h1 className="text-2xl font-bold text-secondary">Analytics</h1>
        {error && <p className="text-sm text-amber-600 mt-2">{error}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total This Week" value={weekAppointments.length} trend="neutral" icon={<TrendingUp size={20} />} />
        <StatCard title="Avg Daily" value={(weekAppointments.length / 7).toFixed(1)} trend="neutral" icon={<BarChart3 size={20} />} />
        <StatCard title="Avg Wait Time" value="0 min" trend="neutral" icon={<Clock size={20} />} />
        <StatCard title="Active Doctors" value={doctors.filter((doctor) => doctor.is_active !== false).length} icon={<Users size={20} />} />
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-muted">
          Loading analytics...
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-muted">
          {/* Nothing to chart yet. */}
          No analytics yet. Charts will appear after real appointments are created.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-secondary mb-4">Appointment Trends</h2>
            <div className="flex items-end gap-2 h-48">
              {trendData.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-muted">{d.appointments}</span>
                  <div className="w-full bg-primary/80 rounded-t-md transition-all hover:bg-primary" style={{ height: `${(d.appointments / maxAppt) * 100}%` }} />
                  <span className="text-xs text-muted">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-secondary mb-4">Doctor Workload Today</h2>
            {workloadData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted">
                No appointments today.
              </div>
            ) : (
              <div className="space-y-3">
                {workloadData.map((d) => (
                  <div key={d.doctor} className="flex items-center gap-3">
                    <span className="text-sm text-muted w-32 truncate">{d.doctor}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                      <div className="h-full bg-primary rounded-full flex items-center justify-end pr-2" style={{ width: `${(d.patients / maxWorkload) * 100}%` }}>
                        <span className="text-xs text-white font-medium">{d.patients}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:col-span-2">
            <h2 className="font-semibold text-secondary mb-4">Specialty Demand</h2>
            {specialtyData.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-muted">
                No specialty data yet.
              </div>
            ) : (
              <div className="space-y-3">
                {specialtyData.map((s) => (
                  <div key={s.name} className="flex items-center gap-3">
                    <span className="text-sm text-secondary flex-1">{s.name}</span>
                    <span className="text-sm font-semibold text-secondary">{s.value}%</span>
                    <div className="w-32 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${s.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
