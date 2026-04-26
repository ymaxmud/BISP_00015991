"use client";

/**
 * Public clinics directory (route: `/clinics`).
 *
 * Shows verified partner clinics with their address, doctor count, and
 * rating. The "Book a Demo" CTA on the landing page also points here
 * for now — it's our closest thing to a "talk to us" page until we
 * build a real demo-request form.
 *
 * The list is currently static demo data because the backend's
 * `/organizations/` endpoint isn't yet pre-seeded for the demo —
 * swap in `organizations.list()` from `@/lib/api` when it is.
 */
import Link from "next/link";
import { Star, MapPin, Users, Stethoscope } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface Clinic {
  id: string;
  name: string;
  address: string;
  specialties: string[];
  doctorCount: number;
  rating: number;
  reviewCount: number;
  avatarColor: string;
}

const clinics: Clinic[] = [
  {
    id: "tashkent-medical-center",
    name: "Tashkent Medical Center",
    address: "45 Amir Temur Avenue, Tashkent 100047",
    specialties: ["Cardiology", "Neurology", "Internal Medicine", "Surgery"],
    doctorCount: 42,
    rating: 4.8,
    reviewCount: 1250,
    avatarColor: "bg-teal-500",
  },
  {
    id: "avicenna-clinic",
    name: "Avicenna Clinic",
    address: "12 Buyuk Turon Street, Tashkent 100015",
    specialties: ["General Practice", "Pediatrics", "Neurology", "Dermatology"],
    doctorCount: 28,
    rating: 4.7,
    reviewCount: 890,
    avatarColor: "bg-indigo-500",
  },
  {
    id: "republic-specialized-center",
    name: "Republic Specialized Center",
    address: "78 Mirzo Ulugbek Avenue, Tashkent 100170",
    specialties: ["Pulmonology", "Allergology", "Oncology", "Radiology"],
    doctorCount: 65,
    rating: 4.9,
    reviewCount: 2100,
    avatarColor: "bg-amber-500",
  },
  {
    id: "family-health-polyclinic",
    name: "Family Health Polyclinic",
    address: "33 Shota Rustaveli Street, Tashkent 100070",
    specialties: ["General Practice", "Pediatrics", "OB/GYN", "Dentistry"],
    doctorCount: 18,
    rating: 4.6,
    reviewCount: 540,
    avatarColor: "bg-rose-500",
  },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

export default function ClinicsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-teal-50 to-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
              Clinics & Hospitals
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {clinics.map((clinic) => (
              <Card key={clinic.id} className="flex flex-col">
                <CardContent className="flex-1 flex flex-col gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex-shrink-0 h-16 w-16 rounded-2xl ${clinic.avatarColor} flex items-center justify-center text-white font-bold text-xl`}
                    >
                      {getInitials(clinic.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground text-lg leading-tight">
                        {clinic.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1.5 text-sm text-muted">
                        <MapPin size={14} className="flex-shrink-0" />
                        <span className="truncate">{clinic.address}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {clinic.specialties.map((s) => (
                      <Badge key={s} variant="primary" size="sm">
                        {s}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-4 mt-auto">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-muted">
                        <Stethoscope size={15} />
                        <span>{clinic.doctorCount} Doctors</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted">
                        <Users size={15} />
                        <span>{clinic.reviewCount.toLocaleString()} Reviews</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star size={14} className="fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-foreground">
                        {clinic.rating}
                      </span>
                    </div>
                  </div>

                  <Link href="/doctors">
                    <Button variant="outline" size="sm" className="w-full">
                      View Doctors
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
