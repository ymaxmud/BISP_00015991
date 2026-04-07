"use client";

import { useState, useMemo, useCallback, Fragment } from "react";
import {
  Plus,
  Search,
  Edit,
  Eye,
  Star,
  Trash2,
  X,
  ChevronDown,
  Phone,
  Mail,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Doctor {
  id: number;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  status: "active" | "inactive";
  patientsToday: number;
  rating: number;
  avatar: string;
}

type ModalMode = "add" | "edit";

/* ------------------------------------------------------------------ */
/*  Initial mock data                                                  */
/* ------------------------------------------------------------------ */

const INITIAL_DOCTORS: Doctor[] = [
  {
    id: 1,
    name: "Dr. Aziz Karimov",
    email: "aziz.karimov@avicenna.uz",
    phone: "+998 90 123 4567",
    specialty: "Cardiology",
    status: "active",
    patientsToday: 8,
    rating: 4.8,
    avatar: "AK",
  },
  {
    id: 2,
    name: "Dr. Madina Yusupova",
    email: "madina.yusupova@avicenna.uz",
    phone: "+998 91 234 5678",
    specialty: "Dermatology",
    status: "active",
    patientsToday: 6,
    rating: 4.9,
    avatar: "MY",
  },
  {
    id: 3,
    name: "Dr. Bobur Rakhimov",
    email: "bobur.rakhimov@avicenna.uz",
    phone: "+998 93 345 6789",
    specialty: "Orthopedics",
    status: "active",
    patientsToday: 5,
    rating: 4.6,
    avatar: "BR",
  },
  {
    id: 4,
    name: "Dr. Dilnoza Sultanova",
    email: "dilnoza.sultanova@avicenna.uz",
    phone: "+998 94 456 7890",
    specialty: "Pediatrics",
    status: "active",
    patientsToday: 7,
    rating: 4.7,
    avatar: "DS",
  },
  {
    id: 5,
    name: "Dr. Javlon Mirzaev",
    email: "javlon.mirzaev@avicenna.uz",
    phone: "+998 95 567 8901",
    specialty: "Neurology",
    status: "inactive",
    patientsToday: 0,
    rating: 4.5,
    avatar: "JM",
  },
  {
    id: 6,
    name: "Dr. Sevara Nazarova",
    email: "sevara.nazarova@avicenna.uz",
    phone: "+998 97 678 9012",
    specialty: "General Practice",
    status: "active",
    patientsToday: 3,
    rating: 4.4,
    avatar: "SN",
  },
];

const ALL_SPECIALTIES = [
  "Cardiology",
  "Dermatology",
  "General Practice",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
];

/* ------------------------------------------------------------------ */
/*  Helper: derive avatar initials from a name                         */
/* ------------------------------------------------------------------ */

function initialsFromName(name: string): string {
  const parts = name.replace(/^Dr\.?\s*/i, "").trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] ?? "?").toUpperCase();
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          className={
            star <= Math.round(rating)
              ? "text-amber-400 fill-amber-400"
              : "text-gray-200"
          }
        />
      ))}
      <span className="text-sm text-muted ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

/* ---------- Status toggle ----------------------------------------- */

function StatusToggle({
  active,
  onChange,
}: {
  active: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={onChange}
      className={`
        relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
        transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1
        ${active ? "bg-teal-500" : "bg-gray-300"}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
          transition-transform duration-200 ease-in-out
          ${active ? "translate-x-5" : "translate-x-0"}
        `}
      />
    </button>
  );
}

/* ---------- Modal overlay ----------------------------------------- */

function ModalOverlay({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* panel */}
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200">
        {children}
      </div>
    </div>
  );
}

/* ---------- Delete confirmation dialog ----------------------------- */

function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm mx-4 bg-white rounded-xl shadow-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted">{message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Detail panel (view mode) ------------------------------- */

function DoctorDetail({
  doctor,
  onClose,
}: {
  doctor: Doctor;
  onClose: () => void;
}) {
  return (
    <Card className="border-teal-200 shadow-md">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-teal-50 text-primary flex items-center justify-center text-lg font-semibold">
              {doctor.avatar}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {doctor.name}
              </h3>
              <p className="text-sm text-muted">{doctor.specialty}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted uppercase tracking-wider">
              Email
            </p>
            <p className="text-sm text-foreground flex items-center gap-1.5">
              <Mail size={14} className="text-muted" />
              {doctor.email}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted uppercase tracking-wider">
              Phone
            </p>
            <p className="text-sm text-foreground flex items-center gap-1.5">
              <Phone size={14} className="text-muted" />
              {doctor.phone}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted uppercase tracking-wider">
              Status
            </p>
            <Badge
              variant={doctor.status === "active" ? "success" : "default"}
              size="sm"
            >
              {doctor.status === "active" ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted uppercase tracking-wider">
              Patients Today
            </p>
            <p className="text-sm font-medium text-foreground">
              {doctor.patientsToday}
            </p>
          </div>
          <div className="space-y-1 col-span-2">
            <p className="text-xs font-medium text-muted uppercase tracking-wider">
              Rating
            </p>
            <StarRating rating={doctor.rating} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page component                                                */
/* ------------------------------------------------------------------ */

export default function OrgDoctorsPage() {
  /* --- state ------------------------------------------------------- */
  const [doctors, setDoctors] = useState<Doctor[]>(INITIAL_DOCTORS);
  const [search, setSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("All");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("add");
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

  // View detail
  const [viewingDoctorId, setViewingDoctorId] = useState<number | null>(null);

  // Delete confirmation
  const [deletingDoctor, setDeletingDoctor] = useState<Doctor | null>(null);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formSpecialty, setFormSpecialty] = useState(ALL_SPECIALTIES[0]);
  const [formPhone, setFormPhone] = useState("");
  const [formStatus, setFormStatus] = useState<"active" | "inactive">("active");

  /* --- derived ----------------------------------------------------- */
  const specialties = useMemo(
    () => Array.from(new Set(doctors.map((d) => d.specialty))).sort(),
    [doctors]
  );

  const filtered = useMemo(() => {
    return doctors.filter((d) => {
      const matchesSearch =
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.specialty.toLowerCase().includes(search.toLowerCase());
      const matchesSpecialty =
        specialtyFilter === "All" || d.specialty === specialtyFilter;
      return matchesSearch && matchesSpecialty;
    });
  }, [doctors, search, specialtyFilter]);

  /* --- helpers ----------------------------------------------------- */
  const resetForm = useCallback(() => {
    setFormName("");
    setFormEmail("");
    setFormSpecialty(ALL_SPECIALTIES[0]);
    setFormPhone("");
    setFormStatus("active");
  }, []);

  const openAddModal = useCallback(() => {
    resetForm();
    setModalMode("add");
    setEditingDoctor(null);
    setModalOpen(true);
  }, [resetForm]);

  const openEditModal = useCallback((doctor: Doctor) => {
    setFormName(doctor.name);
    setFormEmail(doctor.email);
    setFormSpecialty(doctor.specialty);
    setFormPhone(doctor.phone);
    setFormStatus(doctor.status);
    setModalMode("edit");
    setEditingDoctor(doctor);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingDoctor(null);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!formName.trim() || !formEmail.trim()) return;

      if (modalMode === "add") {
        const newDoctor: Doctor = {
          id: Date.now(),
          name: formName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim(),
          specialty: formSpecialty,
          status: formStatus,
          patientsToday: 0,
          rating: 0,
          avatar: initialsFromName(formName),
        };
        setDoctors((prev) => [...prev, newDoctor]);
      } else if (editingDoctor) {
        setDoctors((prev) =>
          prev.map((d) =>
            d.id === editingDoctor.id
              ? {
                  ...d,
                  name: formName.trim(),
                  email: formEmail.trim(),
                  phone: formPhone.trim(),
                  specialty: formSpecialty,
                  status: formStatus,
                  avatar: initialsFromName(formName),
                }
              : d
          )
        );
      }

      closeModal();
    },
    [
      modalMode,
      editingDoctor,
      formName,
      formEmail,
      formPhone,
      formSpecialty,
      formStatus,
      closeModal,
    ]
  );

  const toggleStatus = useCallback((id: number) => {
    setDoctors((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, status: d.status === "active" ? "inactive" : "active" }
          : d
      )
    );
  }, []);

  const confirmDelete = useCallback(() => {
    if (!deletingDoctor) return;
    setDoctors((prev) => prev.filter((d) => d.id !== deletingDoctor.id));
    if (viewingDoctorId === deletingDoctor.id) setViewingDoctorId(null);
    setDeletingDoctor(null);
  }, [deletingDoctor, viewingDoctorId]);

  /* --- render ------------------------------------------------------ */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Doctors</h1>
          <p className="text-muted mt-1">
            Manage your clinic&apos;s medical staff
          </p>
        </div>
        <Button onClick={openAddModal}>
          <Plus size={16} />
          Add Doctor
        </Button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            placeholder="Search doctors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div className="relative">
          <select
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
          >
            <option value="All">All Specialties</option>
            {specialties.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
        </div>
      </div>

      {/* Detail panel (appears above table when viewing) */}
      {viewingDoctorId !== null && (
        <DoctorDetail
          doctor={doctors.find((d) => d.id === viewingDoctorId)!}
          onClose={() => setViewingDoctorId(null)}
        />
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-6 py-3">
                    Doctor
                  </th>
                  <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-6 py-3">
                    Specialty
                  </th>
                  <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-6 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-6 py-3">
                    Patients Today
                  </th>
                  <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-6 py-3">
                    Rating
                  </th>
                  <th className="text-right text-xs font-medium text-muted uppercase tracking-wider px-6 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((doctor) => (
                  <tr
                    key={doctor.id}
                    className={`hover:bg-gray-50/50 transition-colors ${
                      viewingDoctorId === doctor.id ? "bg-teal-50/40" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-teal-50 text-primary flex items-center justify-center text-sm font-semibold">
                          {doctor.avatar}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-foreground block">
                            {doctor.name}
                          </span>
                          <span className="text-xs text-muted">
                            {doctor.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">
                      {doctor.specialty}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <StatusToggle
                          active={doctor.status === "active"}
                          onChange={() => toggleStatus(doctor.id)}
                        />
                        <Badge
                          variant={
                            doctor.status === "active" ? "success" : "default"
                          }
                          size="sm"
                        >
                          {doctor.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {doctor.patientsToday}
                    </td>
                    <td className="px-6 py-4">
                      <StarRating rating={doctor.rating} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() =>
                            setViewingDoctorId(
                              viewingDoctorId === doctor.id
                                ? null
                                : doctor.id
                            )
                          }
                          title="View details"
                          className={`p-2 rounded-lg transition-colors ${
                            viewingDoctorId === doctor.id
                              ? "text-primary bg-teal-50"
                              : "text-muted hover:text-primary hover:bg-teal-50"
                          }`}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => openEditModal(doctor)}
                          title="Edit doctor"
                          className="p-2 rounded-lg text-muted hover:text-primary hover:bg-teal-50 transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => setDeletingDoctor(doctor)}
                          title="Delete doctor"
                          className="p-2 rounded-lg text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted text-sm">
              No doctors found matching your search.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Count */}
      <p className="text-xs text-muted text-right">
        Showing {filtered.length} of {doctors.length} doctors
      </p>

      {/* ---- Add / Edit Modal ---- */}
      <ModalOverlay open={modalOpen} onClose={closeModal}>
        <form onSubmit={handleSubmit}>
          {/* header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-foreground">
              {modalMode === "add" ? "Add New Doctor" : "Edit Doctor"}
            </h2>
            <button
              type="button"
              onClick={closeModal}
              className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* body */}
          <div className="px-6 py-5 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Dr. First Last"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="doctor@avicenna.uz"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Phone
              </label>
              <input
                type="tel"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+998 90 123 4567"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Specialty */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Specialty
              </label>
              <div className="relative">
                <select
                  value={formSpecialty}
                  onChange={(e) => setFormSpecialty(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                >
                  {ALL_SPECIALTIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                />
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Status
              </label>
              <div className="flex items-center gap-2">
                <StatusToggle
                  active={formStatus === "active"}
                  onChange={() =>
                    setFormStatus((s) =>
                      s === "active" ? "inactive" : "active"
                    )
                  }
                />
                <span className="text-sm text-muted">
                  {formStatus === "active" ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          {/* footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
            <Button type="button" variant="ghost" size="sm" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              {modalMode === "add" ? "Add Doctor" : "Save Changes"}
            </Button>
          </div>
        </form>
      </ModalOverlay>

      {/* ---- Delete Confirmation ---- */}
      <ConfirmDialog
        open={deletingDoctor !== null}
        title="Delete Doctor"
        message={`Are you sure you want to remove ${deletingDoctor?.name ?? "this doctor"}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingDoctor(null)}
      />
    </div>
  );
}
