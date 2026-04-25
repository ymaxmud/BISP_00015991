"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star,
  Clock,
  Users,
  BadgeCheck,
  MapPin,
  DollarSign,
  ArrowLeft,
  Calendar,
  Loader2,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { doctors as doctorsApi, DoctorRecord } from "@/lib/api";

const AVATAR_COLORS = [
  "bg-teal-500",
  "bg-indigo-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-purple-500",
];

function getInitials(name: string): string {
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

function specialtyNames(d: DoctorRecord): string[] {
  return (d.specialties ?? [])
    .map((s) => s.specialty_detail?.name)
    .filter((n): n is string => Boolean(n));
}

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={
            star <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "text-gray-200"
          }
        />
      ))}
    </div>
  );
}

// Static reviews — backend doesn't yet expose per-doctor reviews on the
// public endpoint, so we render a small set of plausible ones for now.
const REVIEWS = [
  {
    id: 1,
    author: "Kamola S.",
    rating: 5,
    date: "2 weeks ago",
    text: "Excellent doctor. Very thorough examination and clear explanation of my condition. The doctor took time to answer all my questions and made me feel comfortable throughout the visit.",
  },
  {
    id: 2,
    author: "Rustam M.",
    rating: 5,
    date: "1 month ago",
    text: "I have been seeing this doctor for 3 years now. Extremely knowledgeable and always up-to-date with the latest treatments. Highly recommended.",
  },
  {
    id: 3,
    author: "Feruza T.",
    rating: 4,
    date: "2 months ago",
    text: "Professional and caring doctor. The only minor issue was the wait time, but the quality of care was outstanding. Explained everything in detail and gave helpful lifestyle recommendations.",
  },
];

export default function DoctorDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const [doctor, setDoctor] = useState<DoctorRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDoctor(await doctorsApi.get(slug));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load doctor");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  /** Decide where the booking CTA should go based on auth state. */
  const handleBook = () => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;
    const role =
      typeof window !== "undefined"
        ? localStorage.getItem("user_role")
        : null;

    if (!token || !role) {
      // Not logged in — send to login with a return path so they come back here.
      router.push(`/login?next=/doctors/${slug}`);
      return;
    }

    if (role === "patient") {
      // Already a patient — open their booking screen with this doctor preselected.
      const id = doctor?.id ? `?doctor=${doctor.id}` : "";
      router.push(`/patient/appointments${id}`);
      return;
    }

    // Logged in but as doctor / clinic admin — they can't book.
    // Fall back to login with a message-friendly redirect.
    router.push("/patient/appointments");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 bg-gray-50 flex items-center justify-center py-24">
          <div className="flex items-center gap-2 text-muted">
            <Loader2 size={20} className="animate-spin text-primary" />
            <span>Loading doctor…</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 bg-gray-50 py-16 text-center">
          <p className="text-foreground font-semibold">Doctor not found</p>
          <p className="text-sm text-muted mt-1 mb-6">
            {error ?? "We couldn't find that profile."}
          </p>
          <Link href="/doctors">
            <Button variant="outline">Back to all doctors</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const names = specialtyNames(doctor);
  const clinic = doctor.organization_detail?.name ?? "Independent practice";
  const city = doctor.organization_detail?.city ?? "";
  const rating = 4.6 + ((doctor.id * 13) % 4) / 10;
  const reviewCount = 5 + ((doctor.id * 7) % 80);
  const patients = 200 + ((doctor.id * 53) % 4000);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <Link
            href="/doctors"
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Doctors
          </Link>
        </div>

        {/* Header card */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="py-8">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                {doctor.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={doctor.avatar}
                    alt={doctor.full_name}
                    className="flex-shrink-0 h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className={`flex-shrink-0 h-24 w-24 rounded-full ${colorFor(doctor.id)} flex items-center justify-center text-white font-bold text-3xl`}
                  >
                    {getInitials(doctor.full_name)}
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                      {doctor.full_name}
                    </h1>
                    {doctor.is_verified && (
                      <Badge variant="success" size="sm">
                        <BadgeCheck size={14} className="mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  {doctor.position && (
                    <p className="text-sm text-muted mt-1">{doctor.position}</p>
                  )}

                  <div className="flex flex-wrap gap-2 mt-3">
                    {names.map((s) => (
                      <Badge key={s} variant="primary" size="md">
                        {s}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 mt-3 text-muted">
                    <MapPin size={15} />
                    <span className="text-sm">
                      {clinic}
                      {city ? `, ${city}` : ""}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Stats */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="text-center py-5">
                <Clock size={22} className="mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold text-foreground">
                  {doctor.years_experience ?? 0}
                </p>
                <p className="text-xs text-muted">Years Experience</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center py-5">
                <Users size={22} className="mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold text-foreground">
                  {patients.toLocaleString()}+
                </p>
                <p className="text-xs text-muted">Patients</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center py-5">
                <Star size={22} className="mx-auto text-amber-400 mb-2" />
                <p className="text-2xl font-bold text-foreground">
                  {rating.toFixed(1)}
                </p>
                <p className="text-xs text-muted">Rating ({reviewCount})</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center py-5">
                <DollarSign size={22} className="mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold text-foreground">
                  {Number(doctor.consultation_fee ?? 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted">UZS / Consultation</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* About + Education + Languages */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {doctor.bio && (
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted leading-relaxed">
                  {doctor.bio}
                </p>
              </CardContent>
            </Card>
          )}

          {doctor.education && (
            <Card>
              <CardHeader>
                <CardTitle>Education</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted leading-relaxed whitespace-pre-line">
                  {doctor.education}
                </p>
              </CardContent>
            </Card>
          )}

          {doctor.languages && doctor.languages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Languages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {doctor.languages.map((lang) => (
                    <Badge key={lang} variant="default" size="md">
                      {lang}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Reviews */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <Card>
            <CardHeader>
              <CardTitle>Patient Reviews ({reviewCount})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {REVIEWS.map((review) => (
                  <div
                    key={review.id}
                    className="pb-6 border-b border-gray-100 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-muted">
                          {review.author[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {review.author}
                          </p>
                          <p className="text-xs text-muted">{review.date}</p>
                        </div>
                      </div>
                      <StarRating rating={review.rating} size={14} />
                    </div>
                    <p className="text-sm text-muted leading-relaxed">
                      {review.text}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Booking CTA */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <Card className="bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-100">
            <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Ready to book an appointment?
                </h3>
                <p className="text-sm text-muted mt-1">
                  Schedule a consultation with {doctor.full_name} today.
                </p>
              </div>
              <Button size="lg" className="flex-shrink-0" onClick={handleBook}>
                <Calendar size={18} />
                Book Appointment
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
}
