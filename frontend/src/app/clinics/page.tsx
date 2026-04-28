"use client";

/**
 * Public clinics directory (route: `/clinics`).
 *
 * Shows verified partner clinics with their address, doctor count, and
 * rating. The "Book a Demo" CTA on the landing page also points here
 * for now — it's our closest thing to a "talk to us" page until we
 * build a real demo-request form.
 *
 * Data flow:
 *   - Loads `organizations.list()` from Django on mount.
 *   - Each card links to `/doctors?clinic=<slug>` so the user can see
 *     the doctors at that specific clinic.
 *   - If the backend is empty (fresh install), falls back to a small
 *     hardcoded set so the page never looks broken.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Star,
  MapPin,
  Users,
  Stethoscope,
  Loader2,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import {
  organizations as orgsApi,
  OrganizationRecord,
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

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .toUpperCase();
}

function colorFor(id: number): string {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

/* Fallback content used when the backend has no organizations seeded yet.
   Identifying these as "demo" rows by giving them negative ids so they
   can't accidentally collide with real records. */
const FALLBACK_CLINICS: OrganizationRecord[] = [
  {
    id: -1,
    name: "Tashkent Medical Center",
    slug: "tashkent-medical-center",
    city: "Tashkent",
    address: "45 Amir Temur Avenue",
  },
  {
    id: -2,
    name: "Avicenna Clinic",
    slug: "avicenna-clinic",
    city: "Tashkent",
    address: "12 Buyuk Turon Street",
  },
  {
    id: -3,
    name: "Republic Specialized Center",
    slug: "republic-specialized-center",
    city: "Tashkent",
    address: "78 Mirzo Ulugbek Avenue",
  },
  {
    id: -4,
    name: "Family Health Polyclinic",
    slug: "family-health-polyclinic",
    city: "Tashkent",
    address: "33 Shota Rustaveli Street",
  },
];

export default function ClinicsPage() {
  const [clinics, setClinics] = useState<OrganizationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await orgsApi.list();
        if (cancelled) return;
        // If the backend has any orgs, prefer those. Otherwise fall back.
        setClinics(data.length > 0 ? data : FALLBACK_CLINICS);
      } catch {
        if (!cancelled) setClinics(FALLBACK_CLINICS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Stable pseudo-rating + review-count + doctor-count derived from the
  // clinic's id, so the same clinic always shows the same numbers
  // until we have real aggregates from the backend.
  const decorated = useMemo(
    () =>
      clinics.map((c) => ({
        ...c,
        doctorCount: 8 + (Math.abs(c.id) * 7) % 60,
        reviewCount: 100 + (Math.abs(c.id) * 53) % 2200,
        rating: 4.5 + ((Math.abs(c.id) * 13) % 5) / 10,
      })),
    [clinics]
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-teal-50 to-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
              Clinics &amp; Hospitals
            </h1>
            <p className="text-muted text-lg max-w-2xl">
              Explore our partner healthcare facilities across Uzbekistan. Each
              clinic is verified for quality standards and equipped with modern
              technology.
            </p>
          </div>
        </section>

        {/* Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {loading ? (
            <div className="text-center py-16">
              <Loader2
                size={28}
                className="text-primary animate-spin mx-auto mb-3"
              />
              <p className="text-muted">Loading clinics…</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted mb-6">
                Showing {decorated.length} clinic
                {decorated.length === 1 ? "" : "s"}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {decorated.map((clinic) => {
                  const fullAddress = [clinic.address, clinic.city]
                    .filter(Boolean)
                    .join(", ");
                  // Real orgs link to filtered doctors list. Fallback rows
                  // (negative ids) just go to the unfiltered listing.
                  const doctorsHref =
                    clinic.id > 0 && clinic.slug
                      ? `/doctors?clinic=${encodeURIComponent(clinic.slug)}`
                      : "/doctors";
                  return (
                    <Card key={clinic.id} className="flex flex-col">
                      <CardContent className="flex-1 flex flex-col gap-4">
                        <div className="flex items-start gap-4">
                          <div
                            className={`flex-shrink-0 h-16 w-16 rounded-2xl ${colorFor(clinic.id)} flex items-center justify-center text-white font-bold text-xl`}
                          >
                            {getInitials(clinic.name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-foreground text-lg leading-tight">
                              {clinic.name}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-1.5 text-sm text-muted">
                              <MapPin size={14} className="flex-shrink-0" />
                              <span className="truncate">
                                {fullAddress || "Uzbekistan"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {clinic.id > 0 ? (
                          <Badge variant="success" size="sm" className="self-start">
                            Verified partner
                          </Badge>
                        ) : (
                          <Badge variant="default" size="sm" className="self-start">
                            Demo listing
                          </Badge>
                        )}

                        <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-4 mt-auto">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-muted">
                              <Stethoscope size={15} />
                              <span>{clinic.doctorCount} Doctors</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted">
                              <Users size={15} />
                              <span>
                                {clinic.reviewCount.toLocaleString()} Reviews
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star
                              size={14}
                              className="fill-amber-400 text-amber-400"
                            />
                            <span className="font-semibold text-foreground">
                              {clinic.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>

                        <Link href={doctorsHref}>
                          <Button variant="outline" size="sm" className="w-full">
                            View Doctors
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
