"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Clock,
  Loader2,
  MapPin,
  Plus,
  Search,
  Video,
  X,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { AppointmentRecord, DoctorRecord, appointments, doctors } from "@/lib/api";

type TabKey = "upcoming" | "past" | "cancelled";

const statusConfig: Record<
  string,
  { label: string; variant: "info" | "success" | "danger" | "default" }
> = {
  scheduled: { label: "Scheduled", variant: "info" },
  checked_in: { label: "Checked In", variant: "info" },
  in_queue: { label: "In Queue", variant: "info" },
  in_consultation: { label: "In Consultation", variant: "info" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "danger" },
  no_show: { label: "No Show", variant: "default" },
};

function formatDateTime(value: string) {
  const date = new Date(value);
  return {
    date: date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

function doctorClinic(doctor: DoctorRecord): string {
  return doctor.organization_detail?.name || "Clinic";
}

function doctorSpecialty(doctor: DoctorRecord): string {
  return doctor.specialties?.[0]?.specialty_detail?.name || doctor.position || "Doctor";
}

export default function AppointmentsPage() {
  const [allAppointments, setAllAppointments] = useState<AppointmentRecord[]>([]);
  const [doctorOptions, setDoctorOptions] = useState<DoctorRecord[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentRecord | null>(
    null
  );

  const [bookDoctorId, setBookDoctorId] = useState("");
  const [bookDate, setBookDate] = useState("");
  const [bookTime, setBookTime] = useState("");
  const [bookType, setBookType] = useState("in-person");
  const [bookReason, setBookReason] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [appointmentData, doctorData] = await Promise.all([
          appointments.list(),
          doctors.list(),
        ]);
        if (!cancelled) {
          setAllAppointments(appointmentData);
          setDoctorOptions(doctorData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load appointments.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredAppointments = useMemo(() => {
    const now = new Date();
    const term = searchQuery.trim().toLowerCase();

    return allAppointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.appointment_time);
      const matchesTab =
        activeTab === "cancelled"
          ? appointment.status === "cancelled"
          : activeTab === "past"
            ? appointment.status === "completed" ||
              appointment.status === "no_show" ||
              appointmentDate < now
            : appointment.status !== "cancelled" &&
              appointment.status !== "completed" &&
              appointment.status !== "no_show";

      if (!matchesTab) return false;

      if (!term) return true;
      const doctor = (appointment.doctor_name || "").toLowerCase();
      const org = (appointment.organization_name || "").toLowerCase();
      const reason = (appointment.reason || "").toLowerCase();
      const specialty = (appointment.doctor_specialties || []).join(" ").toLowerCase();
      return (
        doctor.includes(term) ||
        org.includes(term) ||
        reason.includes(term) ||
        specialty.includes(term)
      );
    });
  }, [activeTab, allAppointments, searchQuery]);

  async function refreshAppointments() {
    const data = await appointments.list();
    setAllAppointments(data);
  }

  async function handleBookSubmit() {
    if (!bookDoctorId || !bookDate || !bookTime) {
      setError("Please choose a doctor, date, and time.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const appointmentTime = new Date(`${bookDate}T${bookTime}:00`).toISOString();
      await appointments.create({
        doctor_profile: Number(bookDoctorId),
        appointment_time: appointmentTime,
        appointment_type: bookType,
        reason: bookReason,
      });
      await refreshAppointments();
      setShowBookModal(false);
      setBookDoctorId("");
      setBookDate("");
      setBookTime("");
      setBookType("in-person");
      setBookReason("");
      setSuccess("Appointment booked successfully.");
      window.setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not book appointment.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(appointmentId: number) {
    try {
      setSaving(true);
      setError(null);
      await appointments.update(appointmentId, { status: "cancelled" });
      await refreshAppointments();
      if (selectedAppointment?.id === appointmentId) {
        setSelectedAppointment(null);
      }
      setSuccess("Appointment cancelled.");
      window.setTimeout(() => setSuccess(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel appointment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 pl-12 md:pl-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
          <p className="text-muted mt-1">
            View your real appointment history and book new visits.
          </p>
        </div>
        <Button onClick={() => setShowBookModal(true)}>
          <Plus size={16} />
          Book Appointment
        </Button>
      </div>

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-2 flex-wrap">
          {(["upcoming", "past", "cancelled"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "bg-primary text-white"
                  : "bg-white border border-gray-200 text-muted hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by doctor, specialty, or clinic..."
            className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="space-y-3">
          {loading ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-muted">
              <Loader2 className="mx-auto mb-3 animate-spin" size={24} />
              Loading appointments...
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-muted">
              No appointments found for this tab.
            </div>
          ) : (
            filteredAppointments.map((appointment) => {
              const dateParts = formatDateTime(appointment.appointment_time);
              const status = statusConfig[appointment.status] || {
                label: appointment.status,
                variant: "default" as const,
              };
              return (
                <button
                  key={appointment.id}
                  onClick={() => setSelectedAppointment(appointment)}
                  className={`w-full rounded-2xl border bg-white p-5 text-left transition-all ${
                    selectedAppointment?.id === appointment.id
                      ? "border-primary shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-secondary">
                          {appointment.doctor_name || `Doctor #${appointment.doctor_profile}`}
                        </h2>
                        <Badge variant={status.variant} size="sm">
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted">
                        {(appointment.doctor_specialties || []).join(", ") || "General appointment"}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted">
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={14} />
                          {dateParts.date}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock size={14} />
                          {dateParts.time}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          {appointment.appointment_type === "video" ? (
                            <Video size={14} />
                          ) : (
                            <MapPin size={14} />
                          )}
                          {appointment.organization_name || "Clinic"}
                        </span>
                      </div>
                    </div>

                    {appointment.status === "scheduled" && (
                      <Button
                        variant="ghost"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleCancel(appointment.id);
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          {selectedAppointment ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted uppercase tracking-wide">
                  Selected Appointment
                </p>
                <h2 className="mt-1 text-xl font-semibold text-secondary">
                  {selectedAppointment.doctor_name || `Doctor #${selectedAppointment.doctor_profile}`}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <DetailRow
                  label="Clinic"
                  value={selectedAppointment.organization_name || "Clinic"}
                />
                <DetailRow
                  label="Specialty"
                  value={
                    (selectedAppointment.doctor_specialties || []).join(", ") ||
                    "General appointment"
                  }
                />
                <DetailRow
                  label="Date and Time"
                  value={`${formatDateTime(selectedAppointment.appointment_time).date} at ${
                    formatDateTime(selectedAppointment.appointment_time).time
                  }`}
                />
                <DetailRow
                  label="Visit Type"
                  value={selectedAppointment.appointment_type || "In-person"}
                />
                <DetailRow
                  label="Status"
                  value={statusConfig[selectedAppointment.status]?.label || selectedAppointment.status}
                />
                <DetailRow
                  label="Reason"
                  value={selectedAppointment.reason || "No reason added"}
                />
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted">
              Select an appointment to see the details on the right.
            </div>
          )}
        </div>
      </div>

      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowBookModal(false)}
          />
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-secondary">Book Appointment</h2>
                <p className="text-sm text-muted">
                  Pick a doctor and choose a time that works for you.
                </p>
              </div>
              <button
                onClick={() => setShowBookModal(false)}
                className="rounded-lg p-2 text-muted hover:bg-gray-100 hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-secondary">
                  Doctor
                </label>
                <select
                  value={bookDoctorId}
                  onChange={(e) => setBookDoctorId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select a doctor</option>
                  {doctorOptions.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.full_name} · {doctorSpecialty(doctor)} · {doctorClinic(doctor)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-secondary">
                    Date
                  </label>
                  <input
                    type="date"
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-secondary">
                    Time
                  </label>
                  <input
                    type="time"
                    value={bookTime}
                    onChange={(e) => setBookTime(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-secondary">
                  Visit Type
                </label>
                <select
                  value={bookType}
                  onChange={(e) => setBookType(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="in-person">In-person</option>
                  <option value="video">Video</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-secondary">
                  Reason for Visit
                </label>
                <textarea
                  rows={4}
                  value={bookReason}
                  onChange={(e) => setBookReason(e.target.value)}
                  placeholder="Describe your symptoms or what you want to discuss."
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setShowBookModal(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={() => void handleBookSubmit()} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Booking...
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
    </div>
  );
}
