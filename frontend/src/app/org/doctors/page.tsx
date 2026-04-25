"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Eye,
  X,
  ChevronDown,
  Trash2,
  Upload,
  RefreshCw,
  AlertCircle,
  Check,
  BriefcaseBusiness,
  GraduationCap,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import {
  doctors as doctorsApi,
  specialties as specialtiesApi,
  SpecialtyRecord,
} from "@/lib/api";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SpecialtyDetail {
  id: number;
  name: string;
  slug?: string;
}

interface DoctorSpecialtyLink {
  id: number;
  specialty: number;
  specialty_detail?: SpecialtyDetail;
}

interface WorkingHistoryEntry {
  position: string;
  organization: string;
  start_year: string;
  end_year: string;
}

interface DoctorRecord {
  id: number;
  user?: number;
  organization?: number | null;
  full_name: string;
  gender?: string;
  position?: string;
  avatar?: string | null;
  years_experience?: number;
  education?: string;
  license_number?: string;
  bio?: string;
  languages?: string[];
  services?: string[];
  working_history?: WorkingHistoryEntry[] | unknown[];
  consultation_fee?: string | number;
  consultation_duration_minutes?: number;
  is_public?: boolean;
  is_active?: boolean;
  is_verified?: boolean;
  public_slug?: string;
  specialties?: DoctorSpecialtyLink[];
  ai_enabled?: boolean;
}

type Specialty = SpecialtyRecord;

interface NewDoctorForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  position: string;
  years_experience: string;
  education: string;
  license_number: string;
  bio: string;
  specialty_ids: number[];
  languages: string;
  services: string;
  consultation_fee: string;
  consultation_duration_minutes: string;
  working_history: WorkingHistoryEntry[];
  is_public: boolean;
  avatar: File | null;
}

const EMPTY_FORM: NewDoctorForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  gender: "",
  position: "",
  years_experience: "0",
  education: "",
  license_number: "",
  bio: "",
  specialty_ids: [],
  languages: "",
  services: "",
  consultation_fee: "0",
  consultation_duration_minutes: "30",
  working_history: [{ position: "", organization: "", start_year: "", end_year: "" }],
  is_public: true,
  avatar: null,
};

function initialsFromName(name: string): string {
  const parts = name.replace(/^Dr\.?\s*/i, "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return "?";
}

function doctorSpecialtyNames(doctor: DoctorRecord): string {
  if (!doctor.specialties || doctor.specialties.length === 0) return "—";
  return doctor.specialties
    .map((s) => s.specialty_detail?.name)
    .filter(Boolean)
    .join(", ") || "—";
}

/* ------------------------------------------------------------------ */
/*  Modal overlay                                                      */
/* ------------------------------------------------------------------ */

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200">
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Doctor detail panel                                                */
/* ------------------------------------------------------------------ */

function DoctorDetail({
  doctor,
  onClose,
}: {
  doctor: DoctorRecord;
  onClose: () => void;
}) {
  const history = (doctor.working_history as WorkingHistoryEntry[]) || [];
  return (
    <Card className="border-teal-200 shadow-md">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {doctor.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={doctor.avatar}
                alt={doctor.full_name}
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-teal-50 text-primary flex items-center justify-center text-lg font-semibold">
                {initialsFromName(doctor.full_name)}
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-foreground">{doctor.full_name}</h3>
              <p className="text-sm text-muted">
                {doctor.position || doctorSpecialtyNames(doctor)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={doctor.is_public ? "success" : "default"} size="sm">
                  {doctor.is_public ? "Public" : "Private"}
                </Badge>
                {doctor.is_verified && (
                  <Badge variant="primary" size="sm">
                    Verified
                  </Badge>
                )}
                {doctor.ai_enabled && (
                  <Badge variant="info" size="sm">
                    AI enabled
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted uppercase tracking-wider">
              Specialties
            </p>
            <p className="text-sm text-foreground">{doctorSpecialtyNames(doctor)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted uppercase tracking-wider">
              Years of experience
            </p>
            <p className="text-sm text-foreground">{doctor.years_experience ?? 0}</p>
          </div>
          {doctor.education && (
            <div className="space-y-1 sm:col-span-2">
              <p className="text-xs font-medium text-muted uppercase tracking-wider flex items-center gap-1">
                <GraduationCap size={12} /> Education
              </p>
              <p className="text-sm text-foreground whitespace-pre-line">{doctor.education}</p>
            </div>
          )}
          {doctor.license_number && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted uppercase tracking-wider">
                License number
              </p>
              <p className="text-sm text-foreground">{doctor.license_number}</p>
            </div>
          )}
          {doctor.languages && doctor.languages.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted uppercase tracking-wider">
                Languages
              </p>
              <p className="text-sm text-foreground">{doctor.languages.join(", ")}</p>
            </div>
          )}
          {doctor.bio && (
            <div className="space-y-1 sm:col-span-2">
              <p className="text-xs font-medium text-muted uppercase tracking-wider">Bio</p>
              <p className="text-sm text-foreground whitespace-pre-line">{doctor.bio}</p>
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2 flex items-center gap-1">
              <BriefcaseBusiness size={12} /> Working history
            </p>
            <ul className="space-y-2">
              {history.map((entry, idx) => (
                <li key={idx} className="text-sm">
                  <span className="font-medium text-foreground">
                    {entry.position || "—"}
                  </span>{" "}
                  <span className="text-muted">at {entry.organization || "—"}</span>{" "}
                  <span className="text-muted">
                    ({entry.start_year || "?"} – {entry.end_year || "present"})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function OrgDoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [viewingDoctorId, setViewingDoctorId] = useState<number | null>(null);

  const [form, setForm] = useState<NewDoctorForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  /* --- loaders --------------------------------------------------- */
  const loadDoctors = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const data = await doctorsApi.list();
      setDoctors(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setListError(msg);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSpecialties = useCallback(async () => {
    try {
      const data = await specialtiesApi.list();
      setSpecialties(Array.isArray(data) ? data : []);
    } catch {
      setSpecialties([]);
    }
  }, []);

  useEffect(() => {
    loadDoctors();
    loadSpecialties();
  }, [loadDoctors, loadSpecialties]);

  /* --- derived --------------------------------------------------- */
  const filtered = useMemo(() => {
    return doctors.filter((d) => {
      const term = search.toLowerCase();
      const matchesSearch =
        !term ||
        d.full_name.toLowerCase().includes(term) ||
        (d.position ?? "").toLowerCase().includes(term) ||
        doctorSpecialtyNames(d).toLowerCase().includes(term);
      const matchesSpecialty =
        specialtyFilter === "All" ||
        (d.specialties || []).some(
          (s) => s.specialty_detail?.name === specialtyFilter
        );
      return matchesSearch && matchesSpecialty;
    });
  }, [doctors, search, specialtyFilter]);

  /* --- form helpers --------------------------------------------- */
  const resetForm = useCallback(() => {
    setForm(EMPTY_FORM);
    setSaveError(null);
  }, []);

  const openAddModal = useCallback(() => {
    resetForm();
    setSuccessMsg(null);
    setModalOpen(true);
  }, [resetForm]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const updateField = useCallback(
    <K extends keyof NewDoctorForm>(key: K, value: NewDoctorForm[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const toggleSpecialty = useCallback((id: number) => {
    setForm((prev) => {
      const exists = prev.specialty_ids.includes(id);
      return {
        ...prev,
        specialty_ids: exists
          ? prev.specialty_ids.filter((sid) => sid !== id)
          : [...prev.specialty_ids, id],
      };
    });
  }, []);

  const updateHistoryEntry = useCallback(
    (index: number, field: keyof WorkingHistoryEntry, value: string) => {
      setForm((prev) => {
        const next = [...prev.working_history];
        next[index] = { ...next[index], [field]: value };
        return { ...prev, working_history: next };
      });
    },
    []
  );

  const addHistoryEntry = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      working_history: [
        ...prev.working_history,
        { position: "", organization: "", start_year: "", end_year: "" },
      ],
    }));
  }, []);

  const removeHistoryEntry = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      working_history: prev.working_history.filter((_, i) => i !== index),
    }));
  }, []);

  /* --- submit ---------------------------------------------------- */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSaveError(null);

      if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim()) {
        setSaveError("First name, last name, and email are required.");
        return;
      }

      setSaving(true);
      try {
        // Filter out blank working_history rows so we don't pollute the record
        const cleanHistory = form.working_history.filter(
          (h) => h.position.trim() || h.organization.trim()
        );
        const languages = form.languages
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        const services = form.services
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        const fd = new FormData();
        fd.append("first_name", form.first_name.trim());
        fd.append("last_name", form.last_name.trim());
        fd.append("email", form.email.trim());
        if (form.phone.trim()) fd.append("phone", form.phone.trim());
        if (form.gender) fd.append("gender", form.gender);
        if (form.position.trim()) fd.append("position", form.position.trim());
        if (form.bio.trim()) fd.append("bio", form.bio.trim());
        fd.append("years_experience", form.years_experience || "0");
        if (form.education.trim()) fd.append("education", form.education.trim());
        if (form.license_number.trim())
          fd.append("license_number", form.license_number.trim());
        form.specialty_ids.forEach((id) =>
          fd.append("specialty_ids", String(id))
        );
        languages.forEach((l) => fd.append("languages", l));
        services.forEach((s) => fd.append("services", s));
        fd.append("working_history", JSON.stringify(cleanHistory));
        fd.append("consultation_fee", form.consultation_fee || "0");
        fd.append(
          "consultation_duration_minutes",
          form.consultation_duration_minutes || "30"
        );
        fd.append("is_public", form.is_public ? "true" : "false");
        if (form.avatar) fd.append("avatar", form.avatar);

        const result = await doctorsApi.adminAdd(fd);
        const newDoctor: DoctorRecord | undefined = result?.doctor;
        const tempPassword: string | undefined = result?.temporary_password;

        if (newDoctor) {
          setDoctors((prev) => [newDoctor, ...prev]);
        } else {
          // Fallback: reload the list
          loadDoctors();
        }

        setSuccessMsg(
          tempPassword
            ? `Doctor added successfully. Temporary password: ${tempPassword}`
            : "Doctor added successfully."
        );
        closeModal();
        resetForm();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setSaveError(msg);
      } finally {
        setSaving(false);
      }
    },
    [form, closeModal, resetForm, loadDoctors]
  );

  /* --- render ---------------------------------------------------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Doctors</h1>
          <p className="text-muted mt-1">
            Manage your clinic&apos;s medical staff. New doctors are automatically
            published to the public doctors directory.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadDoctors} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
          <Button onClick={openAddModal}>
            <Plus size={16} />
            Add Doctor
          </Button>
        </div>
      </div>

      {/* Success banner */}
      {successMsg && (
        <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          <Check size={16} className="mt-0.5" />
          <div className="flex-1">{successMsg}</div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-green-700 hover:text-green-900"
          >
            <X size={14} />
          </button>
        </div>
      )}

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
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
        </div>
      </div>

      {/* List error */}
      {listError && (
        <Card className="border-red-100 bg-red-50">
          <CardContent className="text-sm text-red-700 flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5" />
            Couldn&apos;t load doctors: {listError}
          </CardContent>
        </Card>
      )}

      {/* Detail panel */}
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
                    Experience
                  </th>
                  <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-6 py-3">
                    Visibility
                  </th>
                  <th className="text-right text-xs font-medium text-muted uppercase tracking-wider px-6 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-muted text-sm">
                      Loading doctors…
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-muted text-sm">
                      No doctors found. Click &ldquo;Add Doctor&rdquo; to onboard your first one.
                    </td>
                  </tr>
                )}
                {!loading &&
                  filtered.map((doctor) => (
                    <tr
                      key={doctor.id}
                      className={`hover:bg-gray-50/50 transition-colors ${
                        viewingDoctorId === doctor.id ? "bg-teal-50/40" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {doctor.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={doctor.avatar}
                              alt={doctor.full_name}
                              className="w-9 h-9 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-teal-50 text-primary flex items-center justify-center text-sm font-semibold">
                              {initialsFromName(doctor.full_name)}
                            </div>
                          )}
                          <div>
                            <span className="text-sm font-medium text-foreground block">
                              {doctor.full_name}
                            </span>
                            <span className="text-xs text-muted">
                              {doctor.position || "Doctor"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted">
                        {doctorSpecialtyNames(doctor)}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted">
                        {doctor.years_experience ?? 0} yrs
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={doctor.is_public ? "success" : "default"}
                          size="sm"
                        >
                          {doctor.is_public ? "Public" : "Private"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() =>
                              setViewingDoctorId(
                                viewingDoctorId === doctor.id ? null : doctor.id
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
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted text-right">
        Showing {filtered.length} of {doctors.length} doctors
      </p>

      {/* ---- Add Doctor Modal ---- */}
      <ModalOverlay open={modalOpen} onClose={closeModal}>
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Add New Doctor</h2>
              <p className="text-xs text-muted mt-0.5">
                A temporary password will be generated and shown on success.
              </p>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-6">
            {saveError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle size={16} className="mt-0.5" />
                <div>{saveError}</div>
              </div>
            )}

            {/* Photo */}
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Profile photo</h3>
              <label className="flex items-center gap-4 cursor-pointer">
                <div className="w-16 h-16 rounded-full bg-teal-50 text-primary flex items-center justify-center text-lg font-semibold overflow-hidden">
                  {form.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={URL.createObjectURL(form.avatar)}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initialsFromName(`${form.first_name} ${form.last_name}`)
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-primary hover:text-primary-dark">
                  <Upload size={16} />
                  {form.avatar ? "Change photo" : "Upload photo"}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    updateField("avatar", e.target.files?.[0] ?? null)
                  }
                />
              </label>
            </section>

            {/* Basic info */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Basic info</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    First name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.first_name}
                    onChange={(e) => updateField("first_name", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Last name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.last_name}
                    onChange={(e) => updateField("last_name", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="+998 90 123 4567"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Gender
                  </label>
                  <select
                    value={form.gender}
                    onChange={(e) => updateField("gender", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Position / title
                  </label>
                  <input
                    type="text"
                    value={form.position}
                    onChange={(e) => updateField("position", e.target.value)}
                    placeholder="Senior Cardiologist"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            </section>

            {/* Specialties */}
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Specialties</h3>
              {specialties.length === 0 ? (
                <p className="text-xs text-muted">
                  No specialties available. Add specialties from the catalog first.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {specialties.map((spec) => {
                    const selected = form.specialty_ids.includes(spec.id);
                    return (
                      <button
                        key={spec.id}
                        type="button"
                        onClick={() => toggleSpecialty(spec.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                          selected
                            ? "bg-teal-50 border-primary text-primary"
                            : "bg-white border-gray-200 text-muted hover:border-gray-300"
                        }`}
                      >
                        {spec.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Professional details */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                Professional details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Years of experience
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.years_experience}
                    onChange={(e) => updateField("years_experience", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Consultation fee
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.consultation_fee}
                    onChange={(e) => updateField("consultation_fee", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Slot duration (min)
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={form.consultation_duration_minutes}
                    onChange={(e) =>
                      updateField("consultation_duration_minutes", e.target.value)
                    }
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Education
                </label>
                <textarea
                  rows={2}
                  value={form.education}
                  onChange={(e) => updateField("education", e.target.value)}
                  placeholder="MD, Tashkent Medical Academy (2010)"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    License number
                  </label>
                  <input
                    type="text"
                    value={form.license_number}
                    onChange={(e) => updateField("license_number", e.target.value)}
                    placeholder="UZ-MED-12345"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Languages (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={form.languages}
                    onChange={(e) => updateField("languages", e.target.value)}
                    placeholder="Uzbek, Russian, English"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Services offered (comma-separated)
                </label>
                <input
                  type="text"
                  value={form.services}
                  onChange={(e) => updateField("services", e.target.value)}
                  placeholder="ECG, Echocardiography, Stress testing"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Bio
                </label>
                <textarea
                  rows={3}
                  value={form.bio}
                  onChange={(e) => updateField("bio", e.target.value)}
                  placeholder="Short bio shown on the public profile"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </section>

            {/* Working history */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Working history</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addHistoryEntry}
                >
                  <Plus size={14} /> Add entry
                </Button>
              </div>
              <div className="space-y-3">
                {form.working_history.map((entry, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-gray-100 bg-gray-50/50 p-3 space-y-2"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Position (e.g. Cardiologist)"
                        value={entry.position}
                        onChange={(e) =>
                          updateHistoryEntry(idx, "position", e.target.value)
                        }
                        className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                      <input
                        type="text"
                        placeholder="Organization / hospital"
                        value={entry.organization}
                        onChange={(e) =>
                          updateHistoryEntry(idx, "organization", e.target.value)
                        }
                        className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Start year"
                        value={entry.start_year}
                        onChange={(e) =>
                          updateHistoryEntry(idx, "start_year", e.target.value)
                        }
                        className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                      <input
                        type="text"
                        placeholder="End year (or 'present')"
                        value={entry.end_year}
                        onChange={(e) =>
                          updateHistoryEntry(idx, "end_year", e.target.value)
                        }
                        className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                      {form.working_history.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeHistoryEntry(idx)}
                          className="p-2 rounded-lg text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Remove entry"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Visibility */}
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Visibility</h3>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_public}
                  onChange={(e) => updateField("is_public", e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <div className="text-sm font-medium text-foreground">
                    Publish to public doctors directory
                  </div>
                  <div className="text-xs text-muted">
                    Patients will be able to discover and book with this doctor on the
                    public website.
                  </div>
                </div>
              </label>
            </section>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
            <Button type="button" variant="ghost" size="sm" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Adding…" : "Add Doctor"}
            </Button>
          </div>
        </form>
      </ModalOverlay>
    </div>
  );
}
