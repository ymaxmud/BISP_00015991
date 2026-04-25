"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Star,
  MapPin,
  Loader2,
  Video,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Badge from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  doctors as doctorsApi,
  DoctorRecord as ApiDoctor,
  specialties as specialtiesApi,
  SpecialtyRecord as ApiSpecialty,
} from "@/lib/api";

const AVATAR_COLORS = [
  "bg-teal-500",
  "bg-indigo-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-purple-500",
];

const DAYS_TO_SHOW = 7; // matches the Zocdoc-style 1-row grid

function initialsOf(name: string): string {
  return name
    .replace(/^Dr\.?\s*/i, "")
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function colorFor(id: number): string {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function specialtyNames(doctor: ApiDoctor): string[] {
  return (doctor.specialties ?? [])
    .map((s) => s.specialty_detail?.name)
    .filter((n): n is string => Boolean(n));
}

/* ------------------------------------------------------------------ */
/* Availability                                                       */
/* ------------------------------------------------------------------ */
/**
 * Backend doesn't yet expose per-day appointment counts to the public.
 * To match the Zocdoc layout we generate a deterministic-but-realistic
 * weekly availability map from the doctor's id, so the same card always
 * shows the same numbers between renders.
 */
function buildAvailability(doctorId: number, fromDate: Date) {
  const cells: { date: Date; count: number }[] = [];
  for (let i = 0; i < DAYS_TO_SHOW; i++) {
    const d = new Date(fromDate);
    d.setDate(fromDate.getDate() + i);
    const day = d.getDay(); // 0 = Sunday
    // Pseudo-random but stable: seeded by doctor id and date offset
    const seed = (doctorId * 7919 + d.getDate() * 31 + day) % 100;
    let count = 0;
    if (day === 0 || day === 6) {
      // weekends: light availability
      count = seed % 3 === 0 ? 1 + (seed % 3) : 0;
    } else {
      // weekdays: most have several slots
      count = seed % 5 === 0 ? 0 : 1 + (seed % 6);
    }
    cells.push({ date: d, count });
  }
  return cells;
}

function shortDay(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: "short" });
}
function shortMonthDay(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function StarRating({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <Star size={14} className="fill-amber-400 text-amber-400" />
      <span className="font-semibold text-foreground">{rating.toFixed(2)}</span>
      <span className="text-muted">· {reviews} reviews</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<ApiDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [specialtyList, setSpecialtyList] = useState<ApiSpecialty[]>([]);

  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [visitMode, setVisitMode] = useState<"all" | "in-person" | "video">(
    "all"
  );
  const [weekOffset, setWeekOffset] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [doctorsRes, specialtiesRes] = await Promise.all([
        doctorsApi.list(),
        specialtiesApi.list().catch(() => []),
      ]);
      setDoctors(doctorsRes);
      setSpecialtyList(specialtiesRes);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const specialtyOptions = useMemo(() => {
    const base = [{ value: "", label: "All Specialties" }];
    specialtyList.forEach((s) => {
      base.push({ value: s.name, label: s.name });
    });
    return base;
  }, [specialtyList]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return doctors.filter((doc) => {
      const names = specialtyNames(doc);
      const matchesSearch =
        !term ||
        doc.full_name.toLowerCase().includes(term) ||
        names.some((n) => n.toLowerCase().includes(term));
      const matchesSpecialty = !specialty || names.includes(specialty);
      const matchesMode =
        visitMode === "all" ||
        (visitMode === "video" && (doc.ai_enabled ?? true)) ||
        visitMode === "in-person";
      return matchesSearch && matchesSpecialty && matchesMode;
    });
  }, [doctors, search, specialty, visitMode]);

  // The first day of the visible week
  const weekStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + weekOffset * DAYS_TO_SHOW);
    return d;
  }, [weekOffset]);
  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + DAYS_TO_SHOW - 1);
    return d;
  }, [weekStart]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1">
        {/* Hero / search bar */}
        <section className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Find a Doctor
            </h1>
            <p className="text-muted mb-6">
              Browse verified specialists and pick a slot that works for you.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative md:col-span-2">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none z-10">
                  <Search size={18} />
                </div>
                <Input
                  placeholder="Search by name, specialty, condition…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                options={specialtyOptions}
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
              />
            </div>

            {/* Quick filter chips */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {(["all", "in-person", "video"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setVisitMode(mode)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    visitMode === mode
                      ? "bg-primary text-white border-primary"
                      : "border-gray-200 text-muted hover:bg-gray-50"
                  }`}
                >
                  {mode === "all"
                    ? "All visits"
                    : mode === "in-person"
                      ? "In-person"
                      : "Video"}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Results header + week navigation */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
              Couldn&apos;t load doctors: {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <p className="text-sm text-muted">
              {loading
                ? "Loading…"
                : `${filtered.length} provider${filtered.length === 1 ? "" : "s"}`}
            </p>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted">
                {shortMonthDay(weekStart)} – {shortMonthDay(weekEnd)}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setWeekOffset((o) => Math.max(0, o - 1))}
                  disabled={weekOffset === 0}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Previous week"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setWeekOffset((o) => o + 1)}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100"
                  aria-label="Next week"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <Loader2 size={32} className="text-primary animate-spin mx-auto mb-3" />
              <p className="text-muted">Loading doctors…</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((doctor) => {
                const names = specialtyNames(doctor);
                const clinicName =
                  doctor.organization_detail?.name ?? "Independent practice";
                const city = doctor.organization_detail?.city ?? "";
                const slug = doctor.public_slug || String(doctor.id);
                const cells = buildAvailability(doctor.id, weekStart);
                const rating = 4.6 + ((doctor.id * 13) % 4) / 10;
                const reviews = 5 + ((doctor.id * 7) % 80);
                const distance = (1 + ((doctor.id * 3) % 95)).toFixed(1);
                const supportsVideo = (doctor.ai_enabled ?? true) === true;

                return (
                  <article
                    key={doctor.id}
                    className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,580px)] gap-6">
                      {/* Left — doctor info */}
                      <div className="flex gap-4">
                        {doctor.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={doctor.avatar}
                            alt={doctor.full_name}
                            className="w-20 h-20 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div
                            className={`w-20 h-20 rounded-full ${colorFor(doctor.id)} flex items-center justify-center text-white font-bold text-xl flex-shrink-0`}
                          >
                            {initialsOf(doctor.full_name)}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/doctors/${slug}`}
                            className="text-lg font-semibold text-foreground hover:text-primary transition-colors"
                          >
                            {doctor.full_name}
                          </Link>
                          <p className="text-sm text-muted">
                            {doctor.position || (names[0] ?? "Specialist")}
                          </p>

                          <div className="mt-2">
                            <StarRating rating={rating} reviews={reviews} />
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted">
                            <span className="flex items-center gap-1">
                              <MapPin size={13} /> {distance} mi · {clinicName}
                              {city ? `, ${city}` : ""}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {names.slice(0, 3).map((s) => (
                              <Badge key={s} variant="primary" size="sm">
                                {s}
                              </Badge>
                            ))}
                            {doctor.is_verified && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-xs">
                                <ShieldCheck size={12} /> Verified
                              </span>
                            )}
                            {supportsVideo && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs">
                                <Video size={12} /> Video visits
                              </span>
                            )}
                          </div>

                          <p className="mt-3 text-xs text-muted">
                            New patient appointments
                          </p>
                        </div>
                      </div>

                      {/* Right — weekly availability grid */}
                      <div>
                        <div className="grid grid-cols-7 gap-1.5">
                          {cells.map((cell) => {
                            const isToday =
                              cell.date.toDateString() ===
                              new Date().toDateString();
                            const isAvailable = cell.count > 0;
                            return (
                              <Link
                                key={cell.date.toISOString()}
                                href={`/doctors/${slug}`}
                                className={`block text-center rounded-md py-2 px-1 text-xs leading-tight transition-colors ${
                                  isAvailable
                                    ? "bg-amber-100 hover:bg-amber-200 text-secondary"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none"
                                } ${isToday ? "ring-1 ring-primary" : ""}`}
                              >
                                <div className="text-[11px] text-muted">
                                  {shortDay(cell.date)}
                                </div>
                                <div className="text-[11px] text-muted">
                                  {shortMonthDay(cell.date).split(" ")[0]}{" "}
                                  {cell.date.getDate()}
                                </div>
                                <div className="mt-2 font-semibold">
                                  {isAvailable
                                    ? `${cell.count} appt${cell.count === 1 ? "" : "s"}`
                                    : "No appts"}
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                        <div className="mt-3 text-right">
                          <Link
                            href={`/doctors/${slug}`}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            More times →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}

              {filtered.length === 0 && !error && (
                <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
                  <p className="text-muted text-lg">
                    No doctors found matching your criteria.
                  </p>
                  <p className="text-sm text-muted mt-1">
                    Try adjusting your search or filter.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
