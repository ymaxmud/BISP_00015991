"use client";

import { useState } from "react";
import { Save, UserCircle } from "lucide-react";

export default function DoctorProfilePage() {
  const [form, setForm] = useState({
    fullName: "Dr. Aziz Karimov", bio: "Board-certified cardiologist with 15 years of experience in interventional cardiology and preventive heart care.",
    years: 15, fee: "200000", languages: { en: true, ru: true, uz: true },
    specialties: { Cardiology: true, "Internal Medicine": false, "General Practice": false },
  });

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-secondary mb-6">Doctor Profile</h1>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center"><UserCircle size={40} className="text-primary" /></div>
          <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-muted hover:bg-gray-50">Upload Photo</button>
        </div>

        <div><label className="block text-sm font-medium text-secondary mb-1.5">Full Name</label><input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-primary" /></div>
        <div><label className="block text-sm font-medium text-secondary mb-1.5">Bio</label><textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4} className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-primary" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-secondary mb-1.5">Years of Experience</label><input type="number" value={form.years} onChange={(e) => setForm({ ...form, years: +e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-primary" /></div>
          <div><label className="block text-sm font-medium text-secondary mb-1.5">Consultation Fee (UZS)</label><input value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-primary" /></div>
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary mb-2">Languages</label>
          <div className="flex gap-4">{Object.entries(form.languages).map(([lang, checked]) => (
            <label key={lang} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={checked} onChange={(e) => setForm({ ...form, languages: { ...form.languages, [lang]: e.target.checked } })} className="accent-primary" />{lang === "en" ? "English" : lang === "ru" ? "Russian" : "Uzbek"}</label>
          ))}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary mb-2">Specialties</label>
          <div className="flex gap-4 flex-wrap">{Object.entries(form.specialties).map(([spec, checked]) => (
            <label key={spec} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={checked} onChange={(e) => setForm({ ...form, specialties: { ...form.specialties, [spec]: e.target.checked } })} className="accent-primary" />{spec}</label>
          ))}</div>
        </div>
        <button className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium flex items-center gap-2"><Save size={16} /> Save Profile</button>
      </div>
    </div>
  );
}
