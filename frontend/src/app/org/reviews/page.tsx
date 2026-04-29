"use client";

/**
 * Clinic admin reviews (route: `/org/reviews`).
 *
 * Reviews across the clinic.
 *
 * Nothing appears here until patients actually leave reviews.
 */
import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import {
  DoctorRecord,
  ReviewRecord,
  doctors as doctorsApi,
  reviews as reviewsApi,
} from "@/lib/api";

function normalizeReviews(data: unknown): ReviewRecord[] {
  // DRF may wrap the list in `results`; unwrap it once here.
  if (Array.isArray(data)) return data as ReviewRecord[];
  if (data && typeof data === "object" && Array.isArray((data as { results?: unknown }).results)) {
    return (data as { results: ReviewRecord[] }).results;
  }
  return [];
}

function formatDate(value?: string): string {
  if (!value) return "Date not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not recorded";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function OrgReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadReviews() {
      // Load reviews plus doctors, so ids can be shown as names.
      setLoading(true);
      setError("");
      const [reviewResult, doctorResult] = await Promise.allSettled([
        reviewsApi.list(),
        doctorsApi.list(),
      ]);
      if (!active) return;
      if (reviewResult.status === "fulfilled") setReviews(normalizeReviews(reviewResult.value));
      if (doctorResult.status === "fulfilled") setDoctors(doctorResult.value);
      if (reviewResult.status === "rejected" || doctorResult.status === "rejected") {
        setError("Could not load all review data.");
      }
      setLoading(false);
    }
    void loadReviews();
    return () => {
      active = false;
    };
  }, []);

  const doctorById = useMemo(() => {
    // doctor id -> doctor record.
    return new Map(doctors.map((doctor) => [doctor.id, doctor]));
  }, [doctors]);

  const doctorAvgs = useMemo(() => {
    // Build the rating cards from the reviews we just loaded.
    const groups = new Map<number, ReviewRecord[]>();
    reviews.forEach((review) => {
      groups.set(review.doctor_profile, [...(groups.get(review.doctor_profile) || []), review]);
    });
    return Array.from(groups.entries()).map(([doctorId, items]) => {
      const total = items.reduce((sum, review) => sum + review.rating, 0);
      return {
        doctor: doctorById.get(doctorId)?.full_name || `Doctor #${doctorId}`,
        avg: total / items.length,
        count: items.length,
      };
    });
  }, [doctorById, reviews]);

  return (
    <div>
      <div className="pl-12 md:pl-0 mb-6">
        <h1 className="text-2xl font-bold text-secondary">Reviews</h1>
        {error && <p className="text-sm text-amber-600 mt-2">{error}</p>}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-muted">
          Loading reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-muted">
          {/* No patient feedback yet. */}
          No reviews yet. Patient reviews will appear here after real visits.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {doctorAvgs.map((d) => (
              <div key={d.doctor} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <p className="font-semibold text-secondary">{d.doctor}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        className={s <= Math.round(d.avg) ? "text-amber-400 fill-amber-400" : "text-gray-200"}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-secondary">{d.avg.toFixed(1)}</span>
                  <span className="text-sm text-muted">({d.count} reviews)</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="p-4 border-b border-gray-100"><h2 className="font-semibold text-secondary">All Reviews</h2></div>
            <div className="divide-y divide-gray-50">
              {reviews.map((review) => {
                const doctor = doctorById.get(review.doctor_profile);
                return (
                  <div key={review.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-semibold text-secondary">
                          {review.patient_first_name || "Patient"}
                        </p>
                        <span className="text-xs text-muted">&rarr;</span>
                        <p className="text-sm text-muted">
                          {doctor?.full_name || `Doctor #${review.doctor_profile}`}
                        </p>
                      </div>
                      <span className="text-xs text-muted">{formatDate(review.created_at)}</span>
                    </div>
                    <div className="flex gap-0.5 mb-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={12}
                          className={s <= review.rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}
                        />
                      ))}
                    </div>
                    {review.comment && <p className="text-sm text-muted">{review.comment}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
