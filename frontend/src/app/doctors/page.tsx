"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Star, Clock, MapPin, Loader2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { doctors as doctorsApi, specialties as specialtiesApi } from "@/lib/api";

interface ApiSpecialty {
  id: number;
  name: string;
  slug?: string;
}

interface ApiDoctor {
  id: number;
  full_name: string;
  public_slug?: string;
  position?: string;
  avatar?: string | null;
  years_experience?: number;
  consultation_fee?: string | number;
  bio?: string;
  specialties?: {
    id: number;
    specialty_detail?: ApiSpecialty;
  }[];
  organization?: number;
  organization_detail?: {
    id: number;
    name?: string;
    city?: string;
  };
}

const AVATAR_COLORS = [
  "bg-teal-500",
  "bg-indigo-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-purple-500",
];

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

function formatFee(fee: string | number | undefined): string {
  const n = Number(fee);
  if (!n || Number.isNaN(n)) return "—";
  return `${n.toLocaleString()} UZS`;
}

function specialtyNames(doctor: ApiDoctor): string[] {
  return (doctor.specialties ?? [])
    .map((s) => s.specialty_detail?.name)
    .filter((n): n is string => Boolean(n));
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          className={
            star <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "text-gray-200"
          }
        />
      ))}
      <span className="ml-1 text-sm font-medium text-foreground">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<ApiDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [specialtyList, setSpecialtyList] = useState<ApiSpecialty[]>([]);

  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [doctorsRes, specialtiesRes] = await Promise.all([
        doctorsApi.list(),
        specialtiesApi.list().catch(() => []),
      ]);
      const list: ApiDoctor[] = Array.isArray(doctorsRes)
        ? doctorsRes
        : Array.isArray(doctorsRes?.results)
          ? doctorsRes.results
          : [];
      setDoctors(list);
      setSpecialtyList(Array.isArray(specialtiesRes) ? specialtiesRes : []);
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
      return matchesSearch && matchesSpecialty;
    });
  }, [doctors, search, specialty]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-teal-50 to-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
              Find a Doctor
            </h1>
            <p className="text-muted text-lg max-w-2xl">
              Browse our network of verified healthcare professionals across
              Uzbekistan. Book consultations with top-rated specialists.
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none z-10">
                <Search size={18} />
              </div>
              <Input
                placeholder="Search doctors by name or specialty..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full sm:w-64">
              <Select
                options={specialtyOptions}
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
              Couldn&apos;t load doctors: {error}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="text-center py-16">
              <Loader2 size={32} className="text-primary animate-spin mx-auto mb-3" />
              <p className="text-muted">Loading doctors…</p>
            </div>
          ) : (
            <>
              {/* Results count */}
              <p className="text-sm text-muted mb-6">
                Showing {filtered.length} doctor{filtered.length !== 1 ? "s" : ""}
              </p>

              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((doctor) => {
                  const names = specialtyNames(doctor);
                  const clinicName =
                    doctor.organization_detail?.name ?? "Independent practice";
                  const slug = doctor.public_slug || String(doctor.id);
                  return (
                    <Card key={doctor.id} className="flex flex-col">
                      <CardContent className="flex-1 flex flex-col gap-4">
                        <div className="flex items-start gap-4">
                          {doctor.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={doctor.avatar}
                              alt={doctor.full_name}
                              className="flex-shrink-0 h-14 w-14 rounded-full object-cover"
                            />
                          ) : (
                            <div
                              className={`flex-shrink-0 h-14 w-14 rounded-full ${colorFor(doctor.id)} flex items-center justify-center text-white font-bold text-lg`}
                            >
                              {initialsOf(doctor.full_name)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h3 className="font-semibold text-foreground text-lg leading-tight">
                              {doctor.full_name}
                            </h3>
                            <div className="flex items-center gap-1 mt-1 text-sm text-muted">
                              <MapPin size={13} />
                              <span className="truncate">{clinicName}</span>
                            </div>
                          </div>
                        </div>

                        {names.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {names.map((s) => (
                              <Badge key={s} variant="primary" size="sm">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1.5 text-muted">
                            <Clock size={14} />
                            <span>
                              {doctor.years_experience ?? 0} yrs exp.
                            </span>
                          </div>
                          <StarRating rating={4.8} />
                        </div>

                        <div className="flex items-center justify-between text-sm text-muted">
                          <span className="truncate">
                            {doctor.position || "Specialist"}
                          </span>
                          <span className="font-semibold text-foreground">
                            {formatFee(doctor.consultation_fee)}
                          </span>
                        </div>

                        <div className="mt-auto pt-2">
                          <Link href={`/doctors/${slug}`}>
                            <Button variant="outline" size="sm" className="w-full">
                              View Profile
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {filtered.length === 0 && !error && (
                <div className="text-center py-16">
                  <p className="text-muted text-lg">
                    No doctors found matching your criteria.
                  </p>
                  <p className="text-sm text-muted mt-1">
                    Try adjusting your search or filter.
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
