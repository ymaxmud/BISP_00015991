"use client";

import Link from "next/link";
import {
  Star,
  Clock,
  Users,
  BadgeCheck,
  MapPin,
  DollarSign,
  ArrowLeft,
  Calendar,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

const doctor = {
  slug: "aziz-karimov",
  name: "Dr. Aziz Karimov",
  specialties: ["Cardiology", "Internal Medicine"],
  clinic: "Tashkent Medical Center",
  address: "45 Amir Temur Avenue, Tashkent 100047",
  yearsExperience: 18,
  patients: 3200,
  rating: 4.9,
  reviewCount: 214,
  fee: 150000,
  avatarColor: "bg-teal-500",
  verified: true,
  bio: "Dr. Aziz Karimov is a board-certified cardiologist with over 18 years of clinical experience. He graduated from Tashkent Medical Academy and completed his residency at the Republican Specialized Cardiology Center. Dr. Karimov specializes in interventional cardiology, heart failure management, and preventive cardiac care. He has published over 30 research papers in international medical journals and is a member of the European Society of Cardiology.",
  education: [
    "Tashkent Medical Academy, MD (2004)",
    "Republican Specialized Cardiology Center, Residency (2008)",
    "Seoul National University Hospital, Fellowship in Interventional Cardiology (2010)",
  ],
  languages: ["Uzbek", "Russian", "English"],
};

const reviews = [
  {
    id: 1,
    author: "Kamola S.",
    rating: 5,
    date: "2 weeks ago",
    text: "Excellent doctor. Very thorough examination and clear explanation of my condition. Dr. Karimov took time to answer all my questions and made me feel comfortable throughout the visit.",
  },
  {
    id: 2,
    author: "Rustam M.",
    rating: 5,
    date: "1 month ago",
    text: "I have been seeing Dr. Karimov for my heart condition for 3 years now. He is extremely knowledgeable and always up-to-date with the latest treatments. Highly recommended.",
  },
  {
    id: 3,
    author: "Feruza T.",
    rating: 4,
    date: "2 months ago",
    text: "Professional and caring doctor. The only minor issue was the wait time, but the quality of care was outstanding. He explained everything in detail and gave helpful lifestyle recommendations.",
  },
];

function getInitials(name: string): string {
  return name
    .replace("Dr. ", "")
    .split(" ")
    .map((n) => n[0])
    .join("");
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

export default function DoctorProfilePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 bg-gray-50">
        {/* Easy way back to the doctor listing without forcing a browser back action. */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <Link
            href="/doctors"
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Doctors
          </Link>
        </div>

        {/* Top profile card with the details most patients look for first:
            name, specialties, clinic, and trust signals. */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="py-8">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div
                  className={`flex-shrink-0 h-24 w-24 rounded-full ${doctor.avatarColor} flex items-center justify-center text-white font-bold text-3xl`}
                >
                  {getInitials(doctor.name)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                      {doctor.name}
                    </h1>
                    {doctor.verified && (
                      <Badge variant="success" size="sm">
                        <BadgeCheck size={14} className="mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {doctor.specialties.map((s) => (
                      <Badge key={s} variant="primary" size="md">
                        {s}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 mt-3 text-muted">
                    <MapPin size={15} />
                    <span className="text-sm">{doctor.clinic}</span>
                  </div>
                  <p className="text-xs text-muted mt-1 ml-5">
                    {doctor.address}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Quick factual stats for confidence and booking context. */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="text-center py-5">
                <Clock size={22} className="mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold text-foreground">
                  {doctor.yearsExperience}
                </p>
                <p className="text-xs text-muted">Years Experience</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center py-5">
                <Users size={22} className="mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold text-foreground">
                  {doctor.patients.toLocaleString()}+
                </p>
                <p className="text-xs text-muted">Patients</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center py-5">
                <Star size={22} className="mx-auto text-amber-400 mb-2" />
                <p className="text-2xl font-bold text-foreground">
                  {doctor.rating}
                </p>
                <p className="text-xs text-muted">
                  Rating ({doctor.reviewCount})
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center py-5">
                <DollarSign size={22} className="mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold text-foreground">
                  {doctor.fee.toLocaleString()}
                </p>
                <p className="text-xs text-muted">UZS / Consultation</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Longer profile details for users who want to read before booking. */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted leading-relaxed">{doctor.bio}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Education</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {doctor.education.map((edu, i) => (
                  <li key={i} className="text-sm text-muted flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                    {edu}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

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
        </section>

        {/* Reviews sit in their own section so they read like social proof,
            not just another bullet inside the doctor bio. */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <Card>
            <CardHeader>
              <CardTitle>
                Patient Reviews ({doctor.reviewCount})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {reviews.map((review) => (
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

        {/* Final booking prompt after the patient has read profile and reviews. */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <Card className="bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-100">
            <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Ready to book an appointment?
                </h3>
                <p className="text-sm text-muted mt-1">
                  Schedule a consultation with {doctor.name} today.
                </p>
              </div>
              <Button size="lg" className="flex-shrink-0">
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
