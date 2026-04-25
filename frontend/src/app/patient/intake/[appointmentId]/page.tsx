"use client";

import { useState } from "react";
import { CheckCircle, ChevronRight } from "lucide-react";

const steps = ["Symptoms", "Medical Context", "Review & Submit"];
const durations = ["Less than a day", "1-3 days", "3-7 days", "1-2 weeks", "More than 2 weeks"];
const severities = ["mild", "moderate", "severe", "critical"];

export default function IntakePage() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ symptoms: "", duration: "", severity: "", conditions: "", allergies: "", medications: "" });

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="text-green-500" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-secondary mb-3">Intake Form Submitted</h2>
        <p className="text-muted">Your doctor will review this information before your appointment. You may be contacted if additional information is needed.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-secondary mb-2">Pre-Visit Information</h1>
      <p className="text-muted mb-8">Help your doctor prepare by sharing your symptoms and medical context.</p>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-10">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${i <= step ? "bg-primary text-white" : "bg-gray-100 text-gray-400"}`}>{i + 1}</div>
            <span className={`text-sm hidden sm:inline ${i <= step ? "text-secondary font-medium" : "text-gray-400"}`}>{s}</span>
            {i < steps.length - 1 && <ChevronRight size={16} className="text-gray-300 mx-1" />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1.5">Describe your symptoms</label>
              <textarea value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} rows={4} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="What symptoms are you experiencing?" />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1.5">Duration</label>
              <select value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white">
                <option value="">Select duration</option>
                {durations.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1.5">Severity</label>
              <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white">
                <option value="">Select severity</option>
                {severities.map((s) => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1.5">Existing conditions</label>
              <textarea value={form.conditions} onChange={(e) => setForm({ ...form, conditions: e.target.value })} rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="e.g., Diabetes, Hypertension..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1.5">Allergies</label>
              <textarea value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} rows={2} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="e.g., Penicillin, Aspirin..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1.5">Current medications</label>
              <textarea value={form.medications} onChange={(e) => setForm({ ...form, medications: e.target.value })} rows={2} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="e.g., Metformin 500mg, Lisinopril 10mg..." />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-secondary mb-4">Review your information</h3>
            {[
              ["Symptoms", form.symptoms],
              ["Duration", form.duration],
              ["Severity", form.severity],
              ["Existing conditions", form.conditions],
              ["Allergies", form.allergies],
              ["Current medications", form.medications],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-muted">{label}</span>
                <span className="text-sm text-secondary font-medium text-right max-w-xs">{value || "Not provided"}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between mt-8">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} className="px-6 py-2.5 border border-gray-200 text-secondary rounded-lg hover:bg-gray-50">Back</button>
          ) : <div />}
          {step < 2 ? (
            <button onClick={() => setStep(step + 1)} className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium">Continue</button>
          ) : (
            <button onClick={() => setSubmitted(true)} className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium">Submit Intake Form</button>
          )}
        </div>
      </div>
    </div>
  );
}
