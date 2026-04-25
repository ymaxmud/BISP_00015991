"use client";

import { useState, useRef, useEffect } from "react";
import {
  Calendar,
  Search,
  Eye,
  MoreHorizontal,
  Video,
  MapPin,
  Plus,
  Clock,
  Stethoscope,
  X,
  CalendarClock,
  XCircle,
  UserX,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatCard } from "@/components/ui/StatCard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AppointmentStatus =
  | "scheduled"
  | "in_consultation"
  | "completed"
  | "cancelled"
  | "no_show";

interface Appointment {
  id: number;
  time: string;
  date: string;
  patient: string;
  doctor: string;
  specialty: string;
  status: AppointmentStatus;
  type: "in-person" | "video";
  notes?: string;
  phone?: string;
  email?: string;
}

// ---------------------------------------------------------------------------
// Status config (same badge variants as before)
// ---------------------------------------------------------------------------

const statusConfig: Record<
  AppointmentStatus,
  { label: string; variant: "info" | "warning" | "success" | "danger" | "default" }
> = {
  scheduled: { label: "Scheduled", variant: "info" },
  in_consultation: { label: "In Consultation", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "danger" },
  no_show: { label: "No Show", variant: "default" },
};

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const initialAppointments: Appointment[] = [
  {
    id: 1,
    time: "08:00",
    date: "2026-04-05",
    patient: "Sardor Alimov",
    doctor: "Dr. Karimov",
    specialty: "Cardiology",
    status: "completed",
    type: "in-person",
    phone: "+998 90 123 4567",
    email: "sardor@email.com",
    notes: "Follow-up after ECG results. Blood pressure stable.",
  },
  {
    id: 2,
    time: "08:30",
    date: "2026-04-05",
    patient: "Nilufar Ergasheva",
    doctor: "Dr. Sultanova",
    specialty: "Pediatrics",
    status: "completed",
    type: "in-person",
    phone: "+998 91 234 5678",
    email: "nilufar@email.com",
    notes: "Child vaccination schedule review.",
  },
  {
    id: 3,
    time: "09:00",
    date: "2026-04-05",
    patient: "Timur Khasanov",
    doctor: "Dr. Rakhimov",
    specialty: "Orthopedics",
    status: "completed",
    type: "video",
    phone: "+998 93 345 6789",
    email: "timur@email.com",
    notes: "Post-surgery follow-up. Recovery on track.",
  },
  {
    id: 4,
    time: "09:30",
    date: "2026-04-05",
    patient: "Gulnara Toshmatova",
    doctor: "Dr. Yusupova",
    specialty: "Dermatology",
    status: "in_consultation",
    type: "in-person",
    phone: "+998 94 456 7890",
    email: "gulnara@email.com",
    notes: "Skin rash evaluation. Possible allergy.",
  },
  {
    id: 5,
    time: "10:00",
    date: "2026-04-05",
    patient: "Bekzod Umarov",
    doctor: "Dr. Karimov",
    specialty: "Cardiology",
    status: "in_consultation",
    type: "in-person",
    phone: "+998 95 567 8901",
    email: "bekzod@email.com",
    notes: "Initial cardiac assessment.",
  },
  {
    id: 6,
    time: "10:30",
    date: "2026-04-05",
    patient: "Malika Rashidova",
    doctor: "Dr. Nazarova",
    specialty: "General Practice",
    status: "scheduled",
    type: "video",
    phone: "+998 97 678 9012",
    email: "malika@email.com",
    notes: "Annual check-up.",
  },
  {
    id: 7,
    time: "11:00",
    date: "2026-04-05",
    patient: "Otabek Juraev",
    doctor: "Dr. Sultanova",
    specialty: "Pediatrics",
    status: "scheduled",
    type: "in-person",
    phone: "+998 90 789 0123",
    email: "otabek@email.com",
  },
  {
    id: 8,
    time: "11:30",
    date: "2026-04-05",
    patient: "Zarina Abdullayeva",
    doctor: "Dr. Rakhimov",
    specialty: "Orthopedics",
    status: "no_show",
    type: "in-person",
    phone: "+998 91 890 1234",
    email: "zarina@email.com",
  },
  {
    id: 9,
    time: "13:00",
    date: "2026-04-05",
    patient: "Farhod Kamolov",
    doctor: "Dr. Yusupova",
    specialty: "Dermatology",
    status: "scheduled",
    type: "in-person",
    phone: "+998 93 901 2345",
    email: "farhod@email.com",
    notes: "Mole inspection requested.",
  },
  {
    id: 10,
    time: "14:00",
    date: "2026-04-05",
    patient: "Dilorom Ismoilova",
    doctor: "Dr. Karimov",
    specialty: "Cardiology",
    status: "cancelled",
    type: "video",
    phone: "+998 94 012 3456",
    email: "dilorom@email.com",
    notes: "Patient requested cancellation due to travel.",
  },
];

const doctorOptions = [
  { value: "Dr. Karimov", label: "Dr. Karimov - Cardiology" },
  { value: "Dr. Sultanova", label: "Dr. Sultanova - Pediatrics" },
  { value: "Dr. Rakhimov", label: "Dr. Rakhimov - Orthopedics" },
  { value: "Dr. Yusupova", label: "Dr. Yusupova - Dermatology" },
  { value: "Dr. Nazarova", label: "Dr. Nazarova - General Practice" },
];

const doctorSpecialty: Record<string, string> = {
  "Dr. Karimov": "Cardiology",
  "Dr. Sultanova": "Pediatrics",
  "Dr. Rakhimov": "Orthopedics",
  "Dr. Yusupova": "Dermatology",
  "Dr. Nazarova": "General Practice",
};

const typeOptions = [
  { value: "in-person", label: "In-Person" },
  { value: "video", label: "Video Call" },
];

// ---------------------------------------------------------------------------
// Actions dropdown (click-outside aware)
// ---------------------------------------------------------------------------

function ActionsDropdown({
  appointment,
  onView,
  onReschedule,
  onCancel,
  onNoShow,
}: {
  appointment: Appointment;
  onView: () => void;
  onReschedule: () => void;
  onCancel: () => void;
  onNoShow: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const isFinal =
    appointment.status === "completed" ||
    appointment.status === "cancelled" ||
    appointment.status === "no_show";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="p-2 rounded-lg text-muted hover:text-primary hover:bg-teal-50 transition-colors"
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-gray-100 shadow-lg z-30 py-1 animate-fade-in">
          <button
            onClick={() => {
              onView();
              setOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-gray-50 transition-colors"
          >
            <Eye size={15} className="text-muted" />
            View Details
          </button>

          {!isFinal && (
            <>
              <button
                onClick={() => {
                  onReschedule();
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-gray-50 transition-colors"
              >
                <CalendarClock size={15} className="text-muted" />
                Reschedule
              </button>

              <button
                onClick={() => {
                  onCancel();
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <XCircle size={15} />
                Cancel
              </button>

              <button
                onClick={() => {
                  onNoShow();
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-gray-50 transition-colors"
              >
                <UserX size={15} className="text-muted" />
                Mark as No-Show
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function OrgAppointmentsPage() {
  // ---- State ----
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [dateFilter, setDateFilter] = useState("2026-04-05");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [viewAppointment, setViewAppointment] = useState<Appointment | null>(null);
  const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null);
  const [cancelAppointment, setCancelAppointment] = useState<Appointment | null>(null);
  const [noShowAppointment, setNoShowAppointment] = useState<Appointment | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  // Reschedule form
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  // New appointment form
  const [newPatient, setNewPatient] = useState("");
  const [newDoctor, setNewDoctor] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newType, setNewType] = useState<"in-person" | "video">("in-person");
  const [newNotes, setNewNotes] = useState("");

  // ---- Derived ----
  const statusCounts = appointments.reduce(
    (acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const filtered = appointments.filter((a) => {
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    const matchesSearch =
      searchQuery === "" ||
      a.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // ---- Handlers ----

  function updateStatus(id: number, status: AppointmentStatus) {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a)),
    );
  }

  function handleRescheduleSubmit() {
    if (!rescheduleAppointment || !rescheduleDate || !rescheduleTime) return;
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === rescheduleAppointment.id
          ? { ...a, date: rescheduleDate, time: rescheduleTime, status: "scheduled" as AppointmentStatus }
          : a,
      ),
    );
    setRescheduleAppointment(null);
    setRescheduleDate("");
    setRescheduleTime("");
  }

  function handleCancelConfirm() {
    if (!cancelAppointment) return;
    updateStatus(cancelAppointment.id, "cancelled");
    setCancelAppointment(null);
  }

  function handleNoShowConfirm() {
    if (!noShowAppointment) return;
    updateStatus(noShowAppointment.id, "no_show");
    setNoShowAppointment(null);
  }

  function handleNewAppointmentSubmit() {
    if (!newPatient || !newDoctor || !newDate || !newTime) return;
    const nextId = Math.max(...appointments.map((a) => a.id), 0) + 1;
    const created: Appointment = {
      id: nextId,
      patient: newPatient,
      doctor: newDoctor,
      specialty: doctorSpecialty[newDoctor] || "",
      date: newDate,
      time: newTime,
      type: newType,
      status: "scheduled",
      notes: newNotes || undefined,
    };
    setAppointments((prev) => [...prev, created]);
    resetNewForm();
  }

  function resetNewForm() {
    setShowNewForm(false);
    setNewPatient("");
    setNewDoctor("");
    setNewDate("");
    setNewTime("");
    setNewType("in-person");
    setNewNotes("");
  }

  // ---- Render ----
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pl-12 md:pl-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
          <p className="text-muted mt-1">
            Manage and monitor all clinic appointments
          </p>
        </div>
        <Button onClick={() => setShowNewForm(true)} className="shrink-0">
          <Plus size={16} />
          New Appointment
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total"
          value={appointments.length}
          icon={<Calendar size={20} />}
        />
        <StatCard
          title="Completed"
          value={statusCounts["completed"] || 0}
          icon={<CheckCircle2 size={20} />}
        />
        <StatCard
          title="In Consultation"
          value={statusCounts["in_consultation"] || 0}
          icon={<Stethoscope size={20} />}
        />
        <StatCard
          title="Cancelled"
          value={statusCounts["cancelled"] || 0}
          icon={<XCircle size={20} />}
        />
        <StatCard
          title="No-Show"
          value={statusCounts["no_show"] || 0}
          icon={<UserX size={20} />}
        />
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Calendar
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              placeholder="Search patient, doctor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === "all"
                ? "bg-teal-50 text-primary"
                : "bg-white text-muted border border-gray-200 hover:bg-gray-50"
            }`}
          >
            All ({appointments.length})
          </button>
          {Object.entries(statusConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === key
                  ? "bg-teal-50 text-primary"
                  : "bg-white text-muted border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {config.label} ({statusCounts[key] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">
                    Time
                  </th>
                  <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">
                    Patient
                  </th>
                  <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">
                    Doctor
                  </th>
                  <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">
                    Specialty
                  </th>
                  <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">
                    Type
                  </th>
                  <th className="text-right text-xs font-medium text-muted uppercase tracking-wider px-4 py-3 w-16">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((apt) => {
                  const status = statusConfig[apt.status];
                  return (
                    <tr
                      key={apt.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-foreground whitespace-nowrap">
                        {apt.time}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {apt.patient}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted">
                        {apt.doctor}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted">
                        {apt.specialty}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={status.variant} size="sm">
                          {status.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm text-muted whitespace-nowrap">
                          {apt.type === "video" ? (
                            <Video size={14} />
                          ) : (
                            <MapPin size={14} />
                          )}
                          {apt.type === "video" ? "Video" : "In-Person"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end">
                          <ActionsDropdown
                            appointment={apt}
                            onView={() => setViewAppointment(apt)}
                            onReschedule={() => {
                              setRescheduleAppointment(apt);
                              setRescheduleDate(apt.date);
                              setRescheduleTime(apt.time);
                            }}
                            onCancel={() => setCancelAppointment(apt)}
                            onNoShow={() => setNoShowAppointment(apt)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted text-sm">
              No appointments match the selected filter.
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================================================================= */}
      {/* VIEW DETAILS - Slide-out panel                                     */}
      {/* ================================================================= */}
      {viewAppointment && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setViewAppointment(null)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-md bg-white shadow-2xl animate-slide-in-right overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-foreground">
                Appointment Details
              </h2>
              <button
                onClick={() => setViewAppointment(null)}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* Status badge */}
              <div>
                <Badge
                  variant={statusConfig[viewAppointment.status].variant}
                  size="md"
                >
                  {statusConfig[viewAppointment.status].label}
                </Badge>
              </div>

              {/* Patient */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted uppercase tracking-wider">
                  Patient
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-primary font-semibold text-sm">
                    {viewAppointment.patient
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {viewAppointment.patient}
                    </p>
                    {viewAppointment.email && (
                      <p className="text-xs text-muted">{viewAppointment.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact */}
              {viewAppointment.phone && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted uppercase tracking-wider">
                    Phone
                  </p>
                  <p className="text-sm text-foreground">{viewAppointment.phone}</p>
                </div>
              )}

              {/* Doctor */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted uppercase tracking-wider">
                  Doctor
                </p>
                <p className="text-sm text-foreground">
                  {viewAppointment.doctor}
                </p>
                <p className="text-xs text-muted">{viewAppointment.specialty}</p>
              </div>

              {/* Date & time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted uppercase tracking-wider">
                    Date
                  </p>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Calendar size={14} className="text-muted" />
                    {viewAppointment.date}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted uppercase tracking-wider">
                    Time
                  </p>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Clock size={14} className="text-muted" />
                    {viewAppointment.time}
                  </div>
                </div>
              </div>

              {/* Type */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted uppercase tracking-wider">
                  Appointment Type
                </p>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  {viewAppointment.type === "video" ? (
                    <Video size={14} className="text-muted" />
                  ) : (
                    <MapPin size={14} className="text-muted" />
                  )}
                  {viewAppointment.type === "video" ? "Video Call" : "In-Person"}
                </div>
              </div>

              {/* Notes */}
              {viewAppointment.notes && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted uppercase tracking-wider">
                    Notes
                  </p>
                  <p className="text-sm text-foreground bg-gray-50 rounded-lg p-3">
                    {viewAppointment.notes}
                  </p>
                </div>
              )}

              {/* Quick actions */}
              {viewAppointment.status !== "completed" &&
                viewAppointment.status !== "cancelled" &&
                viewAppointment.status !== "no_show" && (
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setViewAppointment(null);
                        setRescheduleAppointment(viewAppointment);
                        setRescheduleDate(viewAppointment.date);
                        setRescheduleTime(viewAppointment.time);
                      }}
                    >
                      <CalendarClock size={14} />
                      Reschedule
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setViewAppointment(null);
                        setCancelAppointment(viewAppointment);
                      }}
                    >
                      <XCircle size={14} />
                      Cancel
                    </Button>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* RESCHEDULE MODAL                                                   */}
      {/* ================================================================= */}
      <Modal
        isOpen={!!rescheduleAppointment}
        onClose={() => {
          setRescheduleAppointment(null);
          setRescheduleDate("");
          setRescheduleTime("");
        }}
        title="Reschedule Appointment"
      >
        {rescheduleAppointment && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center text-primary font-semibold text-xs">
                {rescheduleAppointment.patient
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {rescheduleAppointment.patient}
                </p>
                <p className="text-xs text-muted">
                  {rescheduleAppointment.doctor} &middot;{" "}
                  {rescheduleAppointment.specialty}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="New Date"
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
              />
              <Input
                label="New Time"
                type="time"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRescheduleAppointment(null);
                  setRescheduleDate("");
                  setRescheduleTime("");
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleRescheduleSubmit}
                disabled={!rescheduleDate || !rescheduleTime}
              >
                <CalendarClock size={14} />
                Confirm Reschedule
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ================================================================= */}
      {/* CANCEL CONFIRMATION                                                */}
      {/* ================================================================= */}
      <Modal
        isOpen={!!cancelAppointment}
        onClose={() => setCancelAppointment(null)}
        title="Cancel Appointment"
        size="sm"
      >
        {cancelAppointment && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-2 rounded-full bg-red-50 text-red-500">
                <AlertTriangle size={20} />
              </div>
              <div>
                <p className="text-sm text-foreground">
                  Are you sure you want to cancel the appointment for{" "}
                  <span className="font-semibold">
                    {cancelAppointment.patient}
                  </span>{" "}
                  with{" "}
                  <span className="font-semibold">
                    {cancelAppointment.doctor}
                  </span>{" "}
                  at <span className="font-semibold">{cancelAppointment.time}</span>?
                </p>
                <p className="text-xs text-muted mt-1">
                  This action will mark the appointment as cancelled.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCancelAppointment(null)}
              >
                Keep Appointment
              </Button>
              <Button variant="danger" size="sm" onClick={handleCancelConfirm}>
                <XCircle size={14} />
                Cancel Appointment
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ================================================================= */}
      {/* NO-SHOW CONFIRMATION                                               */}
      {/* ================================================================= */}
      <Modal
        isOpen={!!noShowAppointment}
        onClose={() => setNoShowAppointment(null)}
        title="Mark as No-Show"
        size="sm"
      >
        {noShowAppointment && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-2 rounded-full bg-gray-100 text-gray-500">
                <UserX size={20} />
              </div>
              <div>
                <p className="text-sm text-foreground">
                  Mark{" "}
                  <span className="font-semibold">
                    {noShowAppointment.patient}
                  </span>
                  &apos;s appointment at{" "}
                  <span className="font-semibold">{noShowAppointment.time}</span>{" "}
                  as a no-show?
                </p>
                <p className="text-xs text-muted mt-1">
                  The patient did not attend their scheduled appointment.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNoShowAppointment(null)}
              >
                Go Back
              </Button>
              <Button size="sm" onClick={handleNoShowConfirm}>
                <UserX size={14} />
                Confirm No-Show
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ================================================================= */}
      {/* NEW APPOINTMENT MODAL                                              */}
      {/* ================================================================= */}
      <Modal
        isOpen={showNewForm}
        onClose={resetNewForm}
        title="New Appointment"
        size="lg"
      >
        <div className="space-y-5">
          <Input
            label="Patient Name"
            placeholder="Enter patient full name"
            value={newPatient}
            onChange={(e) => setNewPatient(e.target.value)}
          />

          <Select
            label="Doctor"
            placeholder="Select a doctor"
            options={doctorOptions}
            value={newDoctor}
            onChange={(e) => setNewDoctor(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
            <Input
              label="Time"
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
            />
          </div>

          <Select
            label="Appointment Type"
            options={typeOptions}
            value={newType}
            onChange={(e) => setNewType(e.target.value as "in-person" | "video")}
          />

          <Input
            label="Notes (optional)"
            placeholder="Add any notes..."
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={resetNewForm}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleNewAppointmentSubmit}
              disabled={!newPatient || !newDoctor || !newDate || !newTime}
            >
              <Plus size={14} />
              Create Appointment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
