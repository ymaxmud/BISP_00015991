"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Star, Clock, MapPin } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface Doctor {
  slug: string;
  name: string;
  specialties: string[];
  clinic: string;
  yearsExperience: number;
  rating: number;
  reviewCount: number;
  fee: number;
  avatarColor: string;
}

const doctors: Doctor[] = [
  {
    slug: "aziz-karimov",
    name: "Dr. Aziz Karimov",
    specialties: ["Cardiology", "Internal Medicine"],
    clinic: "Tashkent Medical Center",
    yearsExperience: 18,
    rating: 4.9,
    reviewCount: 214,
    fee: 150000,
    avatarColor: "bg-teal-500",
  },
  {
    slug: "malika-rashidova",
    name: "Dr. Malika Rashidova",
    specialties: ["Neurology"],
    clinic: "Avicenna Clinic",
    yearsExperience: 12,
    rating: 4.8,
    reviewCount: 167,
    fee: 120000,
    avatarColor: "bg-indigo-500",
  },
  {
    slug: "bobur-alimov",
    name: "Dr. Bobur Alimov",
    specialties: ["Pulmonology", "Allergology"],
    clinic: "Republic Specialized Center",
    yearsExperience: 22,
    rating: 4.7,
    reviewCount: 312,
    fee: 180000,
    avatarColor: "bg-amber-500",
  },
  {
    slug: "dilnoza-umarova",
    name: "Dr. Dilnoza Umarova",
    specialties: ["Dermatology"],
    clinic: "SkinCare Clinic Tashkent",
    yearsExperience: 8,
    rating: 4.9,
    reviewCount: 95,
    fee: 100000,
    avatarColor: "bg-rose-500",
  },
  {
    slug: "jasur-toshmatov",
    name: "Dr. Jasur Toshmatov",
    specialties: ["Gastroenterology"],
    clinic: "Tashkent Medical Center",
    yearsExperience: 15,
    rating: 4.6,
    reviewCount: 189,
    fee: 140000,
    avatarColor: "bg-emerald-500",
  },
  {
    slug: "nargiza-khodjaeva",
    name: "Dr. Nargiza Khodjaeva",
    specialties: ["General Practice", "Pediatrics"],
    clinic: "Family Health Polyclinic",
    yearsExperience: 10,
    rating: 4.8,
    reviewCount: 276,
    fee: 80000,
    avatarColor: "bg-sky-500",
  },
];

const specialtyOptions = [
  { value: "", label: "All Specialties" },
  { value: "Cardiology", label: "Cardiology" },
  { value: "Neurology", label: "Neurology" },
  { value: "Pulmonology", label: "Pulmonology" },
  { value: "Dermatology", label: "Dermatology" },
  { value: "Gastroenterology", label: "Gastroenterology" },
  { value: "General Practice", label: "General Practice" },
  { value: "Pediatrics", label: "Pediatrics" },
  { value: "Internal Medicine", label: "Internal Medicine" },
  { value: "Allergology", label: "Allergology" },
];

function getInitials(name: string): string {
  return name
    .replace("Dr. ", "")
    .split(" ")
    .map((n) => n[0])
    .join("");
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
      <span className="ml-1 text-sm font-medium text-foreground">{rating}</span>
    </div>
  );
}

export default function DoctorsPage() {
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("");

  const filtered = useMemo(() => {
    return doctors.filter((doc) => {
      const matchesSearch = doc.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesSpecialty =
        !specialty || doc.specialties.includes(specialty);
      return matchesSearch && matchesSpecialty;
    });
  }, [search, specialty]);

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
              Browse our network of verified healthcare professionals across Uzbekistan.
              Book consultations with top-rated specialists.
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
                <Search size={18} />
              </div>
              <Input
                placeholder="Search doctors by name..."
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

          {/* Results count */}
          <p className="text-sm text-muted mb-6">
            Showing {filtered.length} doctor{filtered.length !== 1 ? "s" : ""}
          </p>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((doctor) => (
              <Card key={doctor.slug} className="flex flex-col">
                <CardContent className="flex-1 flex flex-col gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex-shrink-0 h-14 w-14 rounded-full ${doctor.avatarColor} flex items-center justify-center text-white font-bold text-lg`}
                    >
                      {getInitials(doctor.name)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground text-lg leading-tight">
                        {doctor.name}
                      </h3>
                      <div className="flex items-center gap-1 mt-1 text-sm text-muted">
                        <MapPin size={13} />
                        <span className="truncate">{doctor.clinic}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {doctor.specialties.map((s) => (
                      <Badge key={s} variant="primary" size="sm">
                        {s}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-muted">
                      <Clock size={14} />
                      <span>{doctor.yearsExperience} yrs exp.</span>
                    </div>
                    <StarRating rating={doctor.rating} />
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted">
                    <span>{doctor.reviewCount} reviews</span>
                    <span className="font-semibold text-foreground">
                      {doctor.fee.toLocaleString()} UZS
                    </span>
                  </div>

                  <div className="mt-auto pt-2">
                    <Link href={`/doctors/${doctor.slug}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View Profile
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted text-lg">
                No doctors found matching your criteria.
              </p>
              <p className="text-sm text-muted mt-1">
                Try adjusting your search or filter.
              </p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
