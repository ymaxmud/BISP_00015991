"use client";

/**
 * Public doctors directory (route: `/doctors`).
 *
 * Loosely modeled on Zocdoc — each doctor gets a horizontal card with
 * their name, specialty, rating, distance, and a strip of 7 day-cells
 * showing how many open slots that day. Clicking a slot (or "More
 * times") jumps to the detail page where booking happens.
 *
 * Data flow:
 *   - On mount we hit `doctors.list()` (Django) and `specialties.list()`
 *     in parallel and stash both in state.
 *   - Search + specialty + visit-mode filters all run client-side in
 *     a `useMemo`; backend doesn't need to know.
 *   - Availability numbers come from each doctor's actual working_hours
 *     (see `buildAvailability`). Booked-appointment subtraction is a
 *     follow-up — the public directory is anonymous and the appointments
 *     endpoint requires auth.
 *
 * On `lg+` screens a sticky OpenStreetMap iframe appears in a sidebar
 * on the right. On smaller viewports it's hidden.
 */
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Star,
  MapPin,
  Loader2,
  Video,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  X,
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
 * Compute open slots per day from a doctor's actual working_hours.
 *
 * `working_hours` is stored on the backend as a JSON object keyed by
 * lowercased day-of-week, with each value being a list of [start, end]
 * "HH:MM" pairs. Example:
 *   { "mon": ["09:00", "17:00"], "tue": ["09:00", "13:00"] }
 *
 * If a doctor hasn't set their hours yet, we fall back to a sensible
 * default (Mon-Fri 09:00-17:00). For each visible day we compute the
 * total slot count = work_window_minutes / consultation_duration.
 *
 * Note: we don't yet subtract booked appointments — the appointments
 * endpoint requires auth and the public directory is anonymous. This
 * still beats the old deterministic-hash placeholder because the
 * numbers actually reflect each doctor's real schedule.
 */

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

const DEFAULT_HOURS: Record<string, [string, string][]> = {
  mon: [["09:00", "17:00"]],
  tue: [["09:00", "17:00"]],
  wed: [["09:00", "17:00"]],
  thu: [["09:00", "17:00"]],
  fri: [["09:00", "17:00"]],
  sat: [],
  sun: [],
};

function parseTime(t: string): number {
  const [h, m] = t.split(":").map((s) => parseInt(s, 10));
  if (Number.isNaN(h)) return 0;
  return h * 60 + (Number.isNaN(m) ? 0 : m);
}

function slotsForDay(
  hours: [string, string][],
  durationMinutes: number
): number {
  if (!hours || hours.length === 0 || durationMinutes <= 0) return 0;
  let total = 0;
  for (const [start, end] of hours) {
    const window = Math.max(0, parseTime(end) - parseTime(start));
    total += Math.floor(window / durationMinutes);
  }
  return total;
}

function buildAvailability(doctor: ApiDoctor, fromDate: Date) {
  // Coerce the JSON blob to the [start, end] tuple shape we expect. Any
  // weird value falls back to "no hours set" (= 0 slots).
  const raw = (doctor.working_hours as Record<string, [string, string][]>) || {};
  const hasAny = Object.values(raw).some(
    (v) => Array.isArray(v) && v.length > 0
  );
  const hours = hasAny ? raw : DEFAULT_HOURS;
  const duration = doctor.consultation_duration_minutes || 30;

  const cells: { date: Date; count: number }[] = [];
  for (let i = 0; i < DAYS_TO_SHOW; i++) {
    const d = new Date(fromDate);
    d.setDate(fromDate.getDate() + i);
    const dayKey = DAY_KEYS[d.getDay()];
    const dayHours = (hours[dayKey] || []) as [string, string][];
    cells.push({ date: d, count: slotsForDay(dayHours, duration) });
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

// Inner component because we use `useSearchParams` — App Router requires
// it to be inside a <Suspense> boundary (otherwise prerendering fails
// the same way it did on /login).
function DoctorsPageInner() {
  const searchParams = useSearchParams();
  // Pre-filters seeded from the URL: /doctors?specialty=Cardiology or
  // /doctors?clinic=avicenna-clinic, set when arriving from the symptom
  // checker or the clinics page.
  const initialSpecialty = searchParams.get("specialty") ?? "";
  const initialClinicSlug = searchParams.get("clinic") ?? "";

  const [doctors, setDoctors] = useState<ApiDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [specialtyList, setSpecialtyList] = useState<ApiSpecialty[]>([]);

  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState(initialSpecialty);
  const [clinicSlug, setClinicSlug] = useState(initialClinicSlug);
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

  // Resolve the clinic slug (from the URL) to the actual clinic name
  // shown in the active-filter pill, by peeking at the first matching
  // doctor's organization_detail.
  const activeClinicName = useMemo(() => {
    if (!clinicSlug) return null;
    for (const d of doctors) {
      if (d.organization_detail?.slug === clinicSlug) {
        return d.organization_detail.name;
      }
    }
    return clinicSlug;
  }, [clinicSlug, doctors]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return doctors.filter((doc) => {
      const names = specialtyNames(doc);
      const matchesSearch =
        !term ||
        doc.full_name.toLowerCase().includes(term) ||
        names.some((n) => n.toLowerCase().includes(term));
      const matchesSpecialty = !specialty || names.includes(specialty);
      const matchesClinic =
        !clinicSlug || doc.organization_detail?.slug === clinicSlug;
      const matchesMode =
        visitMode === "all" ||
        (visitMode === "video" && (doc.ai_enabled ?? true)) ||
        visitMode === "in-person";
      return matchesSearch && matchesSpecialty && matchesClinic && matchesMode;
    });
  }, [doctors, search, specialty, clinicSlug, visitMode]);

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

            {/* Quick filter chips + active-URL-filter pills */}
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

              {/* Pre-applied filter from query string — show as a removable pill */}
              {specialty && (
                <button
                  type="button"
                  onClick={() => setSpecialty("")}
                  className="px-3 py-1.5 rounded-full text-sm border border-teal-200 bg-teal-50 text-primary inline-flex items-center gap-1.5 hover:bg-teal-100"
                >
                  Specialty: {specialty}
                  <X size={13} />
                </button>
              )}
              {clinicSlug && (
                <button
                  type="button"
                  onClick={() => setClinicSlug("")}
                  className="px-3 py-1.5 rounded-full text-sm border border-teal-200 bg-teal-50 text-primary inline-flex items-center gap-1.5 hover:bg-teal-100"
                >
                  Clinic: {activeClinicName ?? clinicSlug}
                  <X size={13} />
                </button>
              )}
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
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] gap-6">
              <div className="space-y-4">
              {filtered.map((doctor) => {
                const names = specialtyNames(doctor);
                const clinicName =
                  doctor.organization_detail?.name ?? "Independent practice";
                const city = doctor.organization_detail?.city ?? "";
                const slug = doctor.public_slug || String(doctor.id);
                const cells = buildAvailability(doctor, weekStart);
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
                                    ? "bg-teal-50 hover:bg-teal-100 text-secondary border border-teal-100"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none"
                                } ${isToday ? "ring-2 ring-primary" : ""}`}
                              >
                                <div className="text-[11px] text-muted">
                                  {shortDay(cell.date)}
                                </div>
                                <div className="text-[11px] text-muted">
                                  {shortMonthDay(cell.date).split(" ")[0]}{" "}
                                  {cell.date.getDate()}
                                </div>
                                <div
                                  className={`mt-2 font-semibold ${
                                    isAvailable ? "text-primary" : ""
                                  }`}
                                >
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

              {/* Map column — sticky on desktop, hidden on mobile */}
              <aside className="hidden lg:block">
                <div className="sticky top-6 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      Map view
                    </span>
                    <a
                      href="https://www.openstreetmap.org/?mlat=41.2995&mlon=69.2401#map=12/41.2995/69.2401"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Expand map
                    </a>
                  </div>
                  <iframe
                    title="Doctor locations map"
                    src="https://www.openstreetmap.org/export/embed.html?bbox=69.1500%2C41.2400%2C69.3700%2C41.3700&layer=mapnik&marker=41.2995%2C69.2401"
                    className="w-full h-[520px] border-0"
                    loading="lazy"
                  />
                  <div className="px-4 py-3 text-xs text-muted">
                    Showing clinics around Tashkent. Pin shows the central
                    metro area; individual clinic locations vary.
                  </div>
                </div>
              </aside>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

// Lightweight skeleton shown while Suspense waits for the search params.
function DoctorsPageSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 size={28} className="text-primary animate-spin" />
    </div>
  );
}

export default function DoctorsPage() {
  return (
    <Suspense fallback={<DoctorsPageSkeleton />}>
      <DoctorsPageInner />
    </Suspense>
  );
}
