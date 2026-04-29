"use client";

/**
 * Patient reviews (route: `/patient/reviews`).
 *
 * Reviews come from completed visits. If the patient has not finished a visit
 * yet, there is nothing to review.
 */
import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import {
  AppointmentRecord,
  ReviewRecord,
  appointments as appointmentsApi,
  reviews as reviewsApi,
} from "@/lib/api";

function normalizeReviews(data: unknown): ReviewRecord[] {
  // DRF sometimes wraps lists in `results`; keep that detail out of the page UI.
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

export default function ReviewsPage() {
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [pastReviews, setPastReviews] = useState<ReviewRecord[]>([]);
  const [appointmentId, setAppointmentId] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      // We need both lists: completed visits to review, and reviews already
      // written so we do not offer the same visit twice.
      setLoading(true);
      setError("");
      const [appointmentResult, reviewResult] = await Promise.allSettled([
        appointmentsApi.list(),
        reviewsApi.list(),
      ]);
      if (!active) return;
      if (appointmentResult.status === "fulfilled") setAppointments(appointmentResult.value);
      if (reviewResult.status === "fulfilled") setPastReviews(normalizeReviews(reviewResult.value));
      if (appointmentResult.status === "rejected" || reviewResult.status === "rejected") {
        setError("Could not load all review data.");
      }
      setLoading(false);
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const reviewedAppointmentIds = useMemo(
    () => new Set(pastReviews.map((review) => review.appointment).filter(Boolean)),
    [pastReviews]
  );

  // Only completed, unreviewed appointments are shown in the dropdown.
  const reviewableAppointments = appointments.filter(
    (appointment) =>
      appointment.status === "completed" && !reviewedAppointmentIds.has(appointment.id)
  );

  const selectedAppointment = reviewableAppointments.find(
    (appointment) => String(appointment.id) === appointmentId
  );

  const submitReview = async () => {
    // A review without an appointment is not useful, so block it here.
    if (!selectedAppointment || rating === 0) {
      setError("Choose a completed appointment and rating first.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const created = await reviewsApi.create({
        appointment: selectedAppointment.id,
        patient_profile: selectedAppointment.patient_profile,
        doctor_profile: selectedAppointment.doctor_profile,
        rating,
        comment,
      });
      setPastReviews((items) => [created as ReviewRecord, ...items]);
      setAppointmentId("");
      setRating(0);
      setComment("");
      setMessage("Review submitted.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not submit review.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="pl-12 md:pl-0">
        <h1 className="text-2xl font-bold text-foreground mb-1">Reviews</h1>
        <p className="text-muted mb-8">Rate your doctors after completed appointments</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-10 text-center text-muted">
          Loading reviews...
        </div>
      ) : reviewableAppointments.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-10">
          <h2 className="font-semibold text-secondary mb-3">Review a completed visit</h2>
          <select
            value={appointmentId}
            onChange={(e) => setAppointmentId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none mb-4"
          >
            <option value="">Select completed appointment</option>
            {reviewableAppointments.map((appointment) => (
              <option key={appointment.id} value={appointment.id}>
                {appointment.doctor_name || "Doctor"} - {formatDate(appointment.appointment_time)}
              </option>
            ))}
          </select>
          <div className="flex gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(star)}
                type="button"
              >
                <Star
                  size={28}
                  className={`transition-colors ${
                    star <= (hover || rating) ? "text-amber-400 fill-amber-400" : "text-gray-200"
                  }`}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Share your experience..."
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none mb-4"
          />
          <button
            onClick={submitReview}
            disabled={saving}
            className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium disabled:opacity-50"
          >
            {saving ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-10 text-center text-muted">
          {/* Clean state for a patient who has not completed a visit yet. */}
          No completed appointments are ready for review yet.
        </div>
      )}

      <h2 className="text-lg font-semibold text-secondary mb-4">Your Past Reviews</h2>
      <div className="space-y-4">
        {pastReviews.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-sm text-muted">
            You have not written any reviews yet.
          </div>
        )}
        {pastReviews.map((r) => {
          const appointment = appointments.find((item) => item.id === r.appointment);
          return (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-secondary">
                  {appointment?.doctor_name || `Doctor #${r.doctor_profile}`}
                </p>
                <span className="text-sm text-muted">{formatDate(r.created_at)}</span>
              </div>
              <div className="flex gap-0.5 mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={14}
                    className={s <= r.rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}
                  />
                ))}
              </div>
              {r.comment && <p className="text-sm text-muted">{r.comment}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
