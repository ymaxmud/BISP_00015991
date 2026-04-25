"use client";

import { Star } from "lucide-react";

const reviews = [
  { id: 1, patient: "Sardor U.", doctor: "Dr. Toshmatov", rating: 5, comment: "Excellent doctor. Very thorough and caring. Would recommend to everyone.", date: "2026-03-20" },
  { id: 2, patient: "Dilnoza A.", doctor: "Dr. Toshmatov", rating: 4, comment: "Professional and clear explanations. Short wait time.", date: "2026-03-18" },
  { id: 3, patient: "Bobur Y.", doctor: "Dr. Rahimova", rating: 5, comment: "Dr. Rahimova is incredibly knowledgeable. Solved my issue immediately.", date: "2026-03-15" },
  { id: 4, patient: "Gulnara R.", doctor: "Dr. Karimov", rating: 5, comment: "Best cardiologist in Tashkent. Very attentive.", date: "2026-03-12" },
  { id: 5, patient: "Timur N.", doctor: "Dr. Karimov", rating: 4, comment: "Good doctor, but the wait was a bit long.", date: "2026-03-10" },
  { id: 6, patient: "Nargiza S.", doctor: "Dr. Rahimova", rating: 3, comment: "Doctor was good but the reception process was confusing.", date: "2026-03-08" },
  { id: 7, patient: "Alisher K.", doctor: "Dr. Toshmatov", rating: 5, comment: "Very friendly and explained everything clearly.", date: "2026-03-05" },
  { id: 8, patient: "Malika E.", doctor: "Dr. Karimov", rating: 4, comment: "Thorough examination and follow-up plan.", date: "2026-03-01" },
];

const doctorAvgs = [
  { doctor: "Dr. Karimov", avg: 4.3, count: 3 },
  { doctor: "Dr. Rahimova", avg: 4.0, count: 2 },
  { doctor: "Dr. Toshmatov", avg: 4.7, count: 3 },
];

export default function OrgReviewsPage() {
  return (
    <div>
      <div className="pl-12 md:pl-0 mb-6">
        <h1 className="text-2xl font-bold text-secondary">Reviews</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {doctorAvgs.map((d) => (
          <div key={d.doctor} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="font-semibold text-secondary">{d.doctor}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((s) => <Star key={s} size={14} className={s <= Math.round(d.avg) ? "text-amber-400 fill-amber-400" : "text-gray-200"} />)}</div>
              <span className="text-sm font-semibold text-secondary">{d.avg}</span>
              <span className="text-sm text-muted">({d.count} reviews)</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-4 border-b border-gray-100"><h2 className="font-semibold text-secondary">All Reviews</h2></div>
        <div className="divide-y divide-gray-50">
          {reviews.map((r) => (
            <div key={r.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-secondary">{r.patient}</p>
                  <span className="text-xs text-muted">&rarr;</span>
                  <p className="text-sm text-muted">{r.doctor}</p>
                </div>
                <span className="text-xs text-muted">{r.date}</span>
              </div>
              <div className="flex gap-0.5 mb-1">{[1, 2, 3, 4, 5].map((s) => <Star key={s} size={12} className={s <= r.rating ? "text-amber-400 fill-amber-400" : "text-gray-200"} />)}</div>
              <p className="text-sm text-muted">{r.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
