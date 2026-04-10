"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  X,
  Search,
  Video,
  User,
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

// These types describe the data shape this page uses for cards, tabs, and modals.

type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no_show";
type TabKey = "upcoming" | "past" | "cancelled";

interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  clinic: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  type: "in-person" | "video";
  notes?: string;
}

// This page still uses seeded UI data, so the booking and viewing flow can be
// demonstrated even before the full backend integration is wired in.

const initialAppointments: Appointment[] = [
  {
    id: "apt-1",
    doctorName: "Dr. Anvar Karimov",
    specialty: "General Practitioner",
    clinic: "Avicenna Central Clinic",
    date: "April 8, 2026",
    time: "09:30 AM",
    status: "scheduled",
    type: "in-person",
  },
  {
    id: "apt-2",
    doctorName: "Dr. Nilufar Abdullayeva",
    specialty: "Dermatologist",
    clinic: "SkinCare Medical Center",
    date: "April 12, 2026",
    time: "02:00 PM",
    status: "scheduled",
    type: "video",
  },
  {
    id: "apt-3",
    doctorName: "Dr. Rustam Toshmatov",
    specialty: "Cardiologist",
    clinic: "HeartWell Hospital",
    date: "April 18, 2026",
    time: "11:00 AM",
    status: "scheduled",
    type: "in-person",
  },
  {
    id: "apt-4",
    doctorName: "Dr. Dilnoza Saidova",
    specialty: "Endocrinologist",
    clinic: "MedPlus Diagnostics",
    date: "March 20, 2026",
    time: "10:00 AM",
    status: "completed",
    type: "in-person",
    notes: "Blood sugar levels reviewed. Follow-up in 3 months.",
  },
  {
    id: "apt-5",
    doctorName: "Dr. Anvar Karimov",
    specialty: "General Practitioner",
    clinic: "Avicenna Central Clinic",
    date: "March 5, 2026",
    time: "03:30 PM",
    status: "completed",
    type: "in-person",
    notes: "Routine check-up completed. All vitals normal.",
  },
  {
    id: "apt-6",
    doctorName: "Dr. Sherzod Mirzayev",
    specialty: "Ophthalmologist",
    clinic: "ClearVision Eye Center",
    date: "February 22, 2026",
    time: "01:00 PM",
    status: "cancelled",
    type: "in-person",
  },
];

const statusConfig: Record<
  AppointmentStatus,
  { label: string; variant: "info" | "success" | "danger" | "default" }
> = {
  scheduled: { label: "Scheduled", variant: "info" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "danger" },
  no_show: { label: "No Show", variant: "default" },
};

const tabs: { key: TabKey; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "cancelled", label: "Cancelled" },
];

const doctorOptions = [
  { name: "Dr. Anvar Karimov", specialty: "General Practitioner", clinic: "Avicenna Central Clinic" },
  { name: "Dr. Nilufar Abdullayeva", specialty: "Dermatologist", clinic: "SkinCare Medical Center" },
  { name: "Dr. Rustam Toshmatov", specialty: "Cardiologist", clinic: "HeartWell Hospital" },
  { name: "Dr. Dilnoza Saidova", specialty: "Endocrinologist", clinic: "MedPlus Diagnostics" },
  { name: "Dr. Sherzod Mirzayev", specialty: "Ophthalmologist", clinic: "ClearVision Eye Center" },
  { name: "Dr. Madina Yusupova", specialty: "Dermatologist", clinic: "Avicenna Central Clinic" },
  { name: "Dr. Bobur Rakhimov", specialty: "Orthopedist", clinic: "Avicenna Central Clinic" },
];

const timeSlots = [
  "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [activeTab, setActiveTab] = useState<TabKey>("upcoming");
  const [searchQuery, setSearchQuery] = useState("");

  // Booking state is kept together here so the modal can reset cleanly after success.
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookDoctor, setBookDoctor] = useState("");
  const [bookDate, setBookDate] = useState("");
  const [bookTime, setBookTime] = useState("");
  const [bookType, setBookType] = useState<"in-person" | "video">("in-person");
  const [bookNotes, setBookNotes] = useState("");
  const [bookSuccess, setBookSuccess] = useState(false);

  // This stores which appointment is currently being confirmed for cancellation.
  const [cancelId, setCancelId] = useState<string | null>(null);

  // This controls the slide-out details panel on the right.
  const [viewApt, setViewApt] = useState<Appointment | null>(null);

  function filterByTab(tab: TabKey): Appointment[] {
    // First narrow by tab, then apply the search term to the smaller list.
    let result: Appointment[];
    switch (tab) {
      case "upcoming":
        result = appointments.filter((a) => a.status === "scheduled");
        break;
      case "past":
        result = appointments.filter(
          (a) => a.status === "completed" || a.status === "no_show"
        );
        break;
      case "cancelled":
        result = appointments.filter((a) => a.status === "cancelled");
        break;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.doctorName.toLowerCase().includes(q) ||
          a.specialty.toLowerCase().includes(q) ||
          a.clinic.toLowerCase().includes(q)
      );
    }
    return result;
  }

  const filtered = filterByTab(activeTab);
  const upcomingCount = appointments.filter((a) => a.status === "scheduled").length;
  const pastCount = appointments.filter((a) => a.status === "completed" || a.status === "no_show").length;
  const cancelledCount = appointments.filter((a) => a.status === "cancelled").length;
  const tabCounts: Record<TabKey, number> = { upcoming: upcomingCount, past: pastCount, cancelled: cancelledCount };

  function handleBookSubmit() {
    // Right now booking is local-only UI state. We build a new appointment card
    // in memory so the page still behaves like a real booking flow.
    if (!bookDoctor || !bookDate || !bookTime) return;
    const doc = doctorOptions.find((d) => d.name === bookDoctor);
    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      doctorName: bookDoctor,
      specialty: doc?.specialty || "",
      clinic: doc?.clinic || "",
      date: new Date(bookDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      time: bookTime,
      status: "scheduled",
      type: bookType,
      notes: bookNotes || undefined,
    };
    setAppointments((prev) => [newApt, ...prev]);
    setBookSuccess(true);
    setTimeout(() => {
      setShowBookModal(false);
      setBookSuccess(false);
      setBookDoctor("");
      setBookDate("");
      setBookTime("");
      setBookType("in-person");
      setBookNotes("");
    }, 1500);
  }

  function handleCancel(id: string) {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "cancelled" as AppointmentStatus } : a))
    );
    setCancelId(null);
  }

  return (
    <div className="space-y-6">
      {/* Page title plus the main booking action. */}
      <div className="flex items-center justify-between gap-4 pl-12 md:pl-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
          <p className="text-muted mt-1">Manage and view all your appointments.</p>
        </div>
        <Button size="md" onClick={() => setShowBookModal(true)} className="shrink-0">
          <Plus size={16} /> Book New
        </Button>
      </div>

      {/* Quick text search by doctor, specialty, or clinic. */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Search by doctor, specialty..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Tabs split the appointment list into the three main user states. */}
      <div className="flex gap-1 border-b border-gray-200 pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.key
                ? "border-teal-600 text-teal-600"
                : "border-transparent text-muted hover:text-foreground hover:border-gray-300"
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === tab.key ? "bg-teal-50 text-teal-600" : "bg-gray-100 text-muted"
            }`}>
              {tabCounts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Main appointment listing area. */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Calendar size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-muted font-medium">No appointments found</p>
          <p className="text-sm text-gray-400 mt-1">
            {searchQuery ? "Try a different search term." : "No appointments in this category."}
          </p>
          {activeTab === "upcoming" && (
            <Button size="sm" className="mt-4" onClick={() => setShowBookModal(true)}>
              <Plus size={14} /> Book an Appointment
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((apt) => {
            const badge = statusConfig[apt.status];
            return (
              <Card key={apt.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                        {apt.doctorName.split(" ").filter((_,i) => i > 0).map((n) => n[0]).join("").substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-base">
                          {apt.doctorName}
                        </p>
                        <p className="text-sm text-muted">{apt.specialty}</p>
                      </div>
                    </div>
                    <Badge variant={badge.variant} size="sm">
                      {badge.label}
                    </Badge>
                  </div>

                  <div className="space-y-2 mt-4">
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <MapPin size={14} className="flex-shrink-0" />
                      <span>{apt.clinic}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <Clock size={14} className="flex-shrink-0" />
                      <span>{apt.date} at {apt.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted">
                      {apt.type === "video" ? <Video size={14} /> : <User size={14} />}
                      <span>{apt.type === "video" ? "Video Call" : "In-Person"}</span>
                    </div>
                  </div>

                  {apt.status === "scheduled" && (
                    <div className="flex gap-2 mt-5">
                      <Link href={`/patient/intake/${apt.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          Fill Intake
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => setViewApt(apt)}>
                        Details
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setCancelId(apt.id)}>
                        Cancel
                      </Button>
                    </div>
                  )}

                  {apt.status === "completed" && (
                    <div className="flex gap-2 mt-5">
                      <Button variant="ghost" size="sm" onClick={() => setViewApt(apt)}>
                        Details
                      </Button>
                      <Link href="/patient/reviews" className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          Leave Review
                        </Button>
                      </Link>
                    </div>
                  )}

                  {apt.status === "cancelled" && (
                    <div className="flex gap-2 mt-5">
                      <Button variant="ghost" size="sm" onClick={() => setViewApt(apt)}>
                        Details
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Booking happens in a modal so the user does not leave the appointments page. */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowBookModal(false); setBookSuccess(false); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header. */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-foreground">Book New Appointment</h2>
              <button onClick={() => { setShowBookModal(false); setBookSuccess(false); }} className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>

            {bookSuccess ? (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Appointment Booked!</h3>
                <p className="text-sm text-muted">Your appointment has been successfully scheduled.</p>
              </div>
            ) : (
              <div className="px-6 py-5 space-y-5">
                {/* Doctor choice also determines the clinic/specialty hint shown below. */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Select Doctor <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={bookDoctor}
                    onChange={(e) => setBookDoctor(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                  >
                    <option value="">Choose a doctor...</option>
                    {doctorOptions.map((doc) => (
                      <option key={doc.name} value={doc.name}>
                        {doc.name} - {doc.specialty}
                      </option>
                    ))}
                  </select>
                  {bookDoctor && (
                    <p className="text-xs text-muted mt-1">
                      {doctorOptions.find((d) => d.name === bookDoctor)?.clinic}
                    </p>
                  )}
                </div>

                {/* Date selection for the visit. */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Preferred Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {/* Time slot buttons make picking feel faster than a dropdown. */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Preferred Time <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setBookTime(slot)}
                        className={`px-2 py-2 text-xs rounded-lg border transition-colors ${
                          bookTime === slot
                            ? "bg-primary text-white border-primary"
                            : "border-gray-200 text-muted hover:border-primary hover:text-primary"
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* In-person vs video appointment mode. */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Appointment Type
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setBookType("in-person")}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                        bookType === "in-person"
                          ? "bg-teal-50 border-primary text-primary"
                          : "border-gray-200 text-muted hover:border-gray-300"
                      }`}
                    >
                      <User size={16} /> In-Person
                    </button>
                    <button
                      onClick={() => setBookType("video")}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                        bookType === "video"
                          ? "bg-teal-50 border-primary text-primary"
                          : "border-gray-200 text-muted hover:border-gray-300"
                      }`}
                    >
                      <Video size={16} /> Video Call
                    </button>
                  </div>
                </div>

                {/* Optional context for the clinic about the reason for the visit. */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Notes (optional)
                  </label>
                  <textarea
                    value={bookNotes}
                    onChange={(e) => setBookNotes(e.target.value)}
                    placeholder="Describe your symptoms or reason for visit..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                </div>
              </div>
            )}

            {/* Modal actions. */}
            {!bookSuccess && (
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
                <Button variant="ghost" onClick={() => setShowBookModal(false)}>Cancel</Button>
                <Button
                  onClick={handleBookSubmit}
                  disabled={!bookDoctor || !bookDate || !bookTime}
                >
                  Book Appointment
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Separate confirmation so cancellation is not too easy to trigger by mistake. */}
      {cancelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCancelId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} className="text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Cancel Appointment?</h3>
            <p className="text-sm text-muted mb-6">
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setCancelId(null)}>
                Keep
              </Button>
              <Button variant="danger" className="flex-1" onClick={() => handleCancel(cancelId)}>
                Cancel Appointment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* The details panel slides in so the user can inspect one appointment
          without losing the main list context. */}
      {viewApt && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewApt(null)} />
          <div className="relative w-full max-w-md bg-white shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-foreground">Appointment Details</h2>
              <button onClick={() => setViewApt(null)} className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-6">
              <Badge variant={statusConfig[viewApt.status].variant} size="md">
                {statusConfig[viewApt.status].label}
              </Badge>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted uppercase tracking-wider">Doctor</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-primary font-semibold text-sm">
                    {viewApt.doctorName.split(" ").filter((_,i) => i > 0).map((n) => n[0]).join("").substring(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{viewApt.doctorName}</p>
                    <p className="text-xs text-muted">{viewApt.specialty}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted uppercase tracking-wider">Clinic</p>
                <p className="text-sm text-foreground flex items-center gap-2">
                  <MapPin size={14} className="text-muted" /> {viewApt.clinic}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted uppercase tracking-wider">Date</p>
                  <p className="text-sm text-foreground flex items-center gap-2">
                    <Calendar size={14} className="text-muted" /> {viewApt.date}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted uppercase tracking-wider">Time</p>
                  <p className="text-sm text-foreground flex items-center gap-2">
                    <Clock size={14} className="text-muted" /> {viewApt.time}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted uppercase tracking-wider">Type</p>
                <p className="text-sm text-foreground flex items-center gap-2">
                  {viewApt.type === "video" ? <Video size={14} className="text-muted" /> : <User size={14} className="text-muted" />}
                  {viewApt.type === "video" ? "Video Call" : "In-Person Visit"}
                </p>
              </div>

              {viewApt.notes && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted uppercase tracking-wider">Notes</p>
                  <p className="text-sm text-foreground bg-gray-50 rounded-lg p-3">{viewApt.notes}</p>
                </div>
              )}

              {viewApt.status === "scheduled" && (
                <div className="pt-2 space-y-2">
                  <Link href={`/patient/intake/${viewApt.id}`} className="block">
                    <Button variant="primary" className="w-full">Fill Intake Form</Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => { setViewApt(null); setCancelId(viewApt.id); }}
                  >
                    Cancel Appointment
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
