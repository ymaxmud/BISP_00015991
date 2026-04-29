"use client";

/**
 * Clinic-wide appointment table.
 *
 * Appointment table for the clinic.
 *
 * The table starts empty until the clinic actually has bookings.
 */
import { useEffect, useMemo, useState } from "react";
import { Calendar, Clock, Plus, Search, Stethoscope, X } from "lucide-react";
import Badge from "@/components/ui/Badge";
import {
  AppointmentRecord,
  DoctorRecord,
  PatientProfileRecord,
  appointments as appointmentsApi,
  doctors as doctorsApi,
  patients as patientsApi,
} from "@/lib/api";

const STATUS_BADGE: Record<string, "info" | "warning" | "success" | "danger" | "default"> = {
  scheduled: "info",
  checked_in: "warning",
  in_queue: "warning",
  in_consultation: "warning",
  completed: "success",
  cancelled: "danger",
  no_show: "default",
};

function patientName(patient: PatientProfileRecord): string {
  return [patient.first_name, patient.last_name].filter(Boolean).join(" ").trim() || `Patient #${patient.id}`;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time not set";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isToday(value: string): boolean {
  const date = new Date(value);
  const now = new Date();
  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export default function OrgAppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [patients, setPatients] = useState<PatientProfileRecord[]>([]);
  // Keep "now" steady for the summary count.
  const [nowTimestamp] = useState(() => Date.now());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [doctorId, setDoctorId] = useState("");
  const [patientId, setPatientId] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    // Table rows plus the data needed by the create form.
    setLoading(true);
    setError("");
    const [appointmentResult, doctorResult, patientResult] = await Promise.allSettled([
      appointmentsApi.list(),
      doctorsApi.list(),
      patientsApi.list(),
    ]);
    if (appointmentResult.status === "fulfilled") setAppointments(appointmentResult.value);
    if (doctorResult.status === "fulfilled") setDoctors(doctorResult.value);
    if (patientResult.status === "fulfilled") setPatients(patientResult.value);
    if ([appointmentResult, doctorResult, patientResult].some((result) => result.status === "rejected")) {
      setError("Could not load all appointment data.");
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredAppointments = useMemo(() => {
    // Search and filter the loaded appointments.
    const term = search.trim().toLowerCase();
    return appointments.filter((appointment) => {
      const matchesSearch =
        !term ||
        (appointment.patient_name || "").toLowerCase().includes(term) ||
        (appointment.doctor_name || "").toLowerCase().includes(term) ||
        (appointment.reason || "").toLowerCase().includes(term);
      const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [appointments, search, statusFilter]);

  const todayCount = appointments.filter((appointment) => isToday(appointment.appointment_time)).length;
  const upcomingCount = appointments.filter((appointment) => {
    const time = new Date(appointment.appointment_time).getTime();
    return (
      !Number.isNaN(time) &&
      time >= nowTimestamp &&
      !["cancelled", "completed", "no_show"].includes(appointment.status)
    );
  }).length;
  const completedCount = appointments.filter((appointment) => appointment.status === "completed").length;
  const cancelledCount = appointments.filter((appointment) => appointment.status === "cancelled").length;

  const createAppointment = async () => {
    // A booking needs an existing patient and doctor.
    if (!doctorId || !patientId || !appointmentTime) {
      setError("Choose patient, doctor, and appointment time.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const created = await appointmentsApi.create({
        doctor_profile: Number(doctorId),
        patient_profile: Number(patientId),
        appointment_time: appointmentTime,
        reason,
      });
      setAppointments((items) => [created, ...items]);
      setShowCreate(false);
      setDoctorId("");
      setPatientId("");
      setAppointmentTime("");
      setReason("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not create appointment.");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (appointment: AppointmentRecord, status: string) => {
    // Save status changes immediately so every dashboard stays in sync.
    setError("");
    try {
      const updated = await appointmentsApi.update(appointment.id, { status });
      setAppointments((items) =>
        items.map((item) => (item.id === appointment.id ? updated : item))
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not update appointment.");
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pl-12 md:pl-0">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Appointments</h1>
          <p className="text-muted">Clinic-wide appointment schedule</p>
          {error && <p className="text-sm text-amber-600 mt-2">{error}</p>}
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark"
        >
          <Plus size={16} />
          New Appointment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard icon={<Calendar size={20} />} label="Today" value={todayCount} />
        <SummaryCard icon={<Clock size={20} />} label="Upcoming" value={upcomingCount} />
        <SummaryCard icon={<Stethoscope size={20} />} label="Completed" value={completedCount} />
        <SummaryCard icon={<X size={20} />} label="Cancelled" value={cancelledCount} />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient, doctor, or reason..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="all">All statuses</option>
            {Object.keys(STATUS_BADGE).map((status) => (
              <option key={status} value={status}>{status.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted">Loading appointments...</div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-8 text-center text-muted">
            {/* No bookings yet. */}
            No appointments found. Create one when a real patient books a visit.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-muted">Time</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Patient</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Doctor</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Reason</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-secondary">{formatDateTime(appointment.appointment_time)}</td>
                    <td className="px-4 py-3 text-secondary">{appointment.patient_name || `Patient #${appointment.patient_profile}`}</td>
                    <td className="px-4 py-3 text-secondary">{appointment.doctor_name || `Doctor #${appointment.doctor_profile}`}</td>
                    <td className="px-4 py-3 text-muted">{appointment.reason || "No reason recorded"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_BADGE[appointment.status] || "default"} size="sm">
                        {appointment.status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!["completed", "cancelled", "no_show"].includes(appointment.status) && (
                        <button
                          onClick={() => updateStatus(appointment, "cancelled")}
                          className="text-xs font-medium text-red-600 hover:underline"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-secondary">New Appointment</h2>
              <button onClick={() => setShowCreate(false)} className="text-muted hover:text-secondary">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <Field label="Patient">
                <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className={inputCls}>
                  <option value="">Select patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>{patientName(patient)}</option>
                  ))}
                </select>
              </Field>
              <Field label="Doctor">
                <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className={inputCls}>
                  <option value="">Select doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>{doctor.full_name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Appointment time">
                <input
                  type="datetime-local"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Reason">
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className={inputCls}
                  placeholder="Reason for visit"
                />
              </Field>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 text-muted text-sm font-medium hover:bg-gray-200"
              >
                Close
              </button>
              <button
                onClick={createAppointment}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark disabled:opacity-50"
              >
                {saving ? "Saving..." : "Create appointment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-primary">{icon}</div>
      <div>
        <p className="text-sm text-muted">{label}</p>
        <p className="text-2xl font-bold text-secondary">{value}</p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-secondary mb-1.5">{label}</span>
      {children}
    </label>
  );
}
