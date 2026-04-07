"use client";

import { useState } from "react";
import { Star } from "lucide-react";

const pastReviews = [
  { id: 1, doctor: "Dr. Toshmatov", date: "2026-03-20", rating: 5, comment: "Excellent doctor. Very thorough and caring." },
  { id: 2, doctor: "Dr. Rahimova", date: "2026-03-01", rating: 4, comment: "Professional and clear explanations." },
];

export default function ReviewsPage() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div>
      <div className="pl-12 md:pl-0">
        <h1 className="text-2xl font-bold text-foreground mb-1">Reviews</h1>
        <p className="text-muted mb-8">Rate your doctors and share your experience</p>
      </div>

      {!submitted ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-10">
          <h2 className="font-semibold text-secondary mb-1">Rate your last visit</h2>
          <p className="text-sm text-muted mb-4">Dr. Karimov &middot; Cardiology &middot; Apr 5, 2026</p>
          <div className="flex gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)} onClick={() => setRating(star)}>
                <Star size={28} className={`transition-colors ${star <= (hover || rating) ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
              </button>
            ))}
          </div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Share your experience..." className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none mb-4" />
          <button onClick={() => setSubmitted(true)} className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium">Submit Review</button>
        </div>
      ) : (
        <div className="bg-green-50 rounded-2xl border border-green-200 p-8 mb-10 text-center">
          <p className="text-green-700 font-semibold">Thank you for your review!</p>
        </div>
      )}

      <h2 className="text-lg font-semibold text-secondary mb-4">Your Past Reviews</h2>
      <div className="space-y-4">
        {pastReviews.map((r) => (
          <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-secondary">{r.doctor}</p>
              <span className="text-sm text-muted">{r.date}</span>
            </div>
            <div className="flex gap-0.5 mb-2">
              {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={14} className={s <= r.rating ? "text-amber-400 fill-amber-400" : "text-gray-200"} />)}
            </div>
            <p className="text-sm text-muted">{r.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
