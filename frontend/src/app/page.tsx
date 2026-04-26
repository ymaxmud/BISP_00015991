"use client";

/**
 * Landing page (route: `/`).
 *
 * Marketing-only — no API calls, just static content arranged into
 * sections: hero → "how it works" steps → feature cards → for-providers
 * pitch → final CTA → footer.
 *
 * Each block of content is a small array at the top of the file
 * (`steps`, `features`, `providerPoints`) so non-developers can edit
 * the copy without touching JSX.
 */
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  ClipboardList, UserCheck, Clock, HeartPulse,
  FileText, BarChart3, Brain, Check, ArrowRight,
  Shield, Star, Activity,
} from "lucide-react";

// "How it works" — 4 short steps shown as numbered cards in the hero strip.
const steps = [
  { icon: <ClipboardList size={28} />, title: "Describe Symptoms", desc: "Patients fill a structured intake form before the visit" },
  { icon: <UserCheck size={28} />, title: "Get Matched", desc: "AI suggests the right specialist based on symptoms" },
  { icon: <Clock size={28} />, title: "Skip the Wait", desc: "Smart queue prioritizes urgent cases automatically" },
  { icon: <HeartPulse size={28} />, title: "Better Care", desc: "Doctors see prepared summaries with AI risk flags" },
];

// Three feature cards under the hero. Big icons, short pitch.
const features = [
  { icon: <FileText size={32} />, title: "Smart Intake", desc: "Patients submit symptoms, history, and medications before arriving. Doctors get structured summaries instead of raw notes." },
  { icon: <BarChart3 size={32} />, title: "Queue Optimization", desc: "Triage-aware queue sorting. Urgent cases get fast-tracked. Clinics see doctor workload in real-time." },
  { icon: <Brain size={32} />, title: "AI Copilot", desc: "Medication safety checks, risk flags, and guideline-based suggestions — all doctor-approved before action." },
];

// Bullet list shown in the "for clinics" section. Sales pitch only.
const providerPoints = [
  "Reduce average wait time by up to 40%",
  "Route patients to the right specialist from the start",
  "Give doctors AI-prepared patient summaries",
  "Monitor clinic performance with real-time analytics",
  "Medication safety checks on every prescription",
];

const testimonials = [
  { name: "Dr. Aziz Karimov", clinic: "Avicenna Medical Center", text: "The AI-prepared summaries save me 10 minutes per patient. I can focus on the diagnosis instead of collecting basic information." },
  { name: "Dr. Nilufar Rahimova", clinic: "Tashkent Family Clinic", text: "The queue system has transformed our workflow. Urgent cases no longer wait behind routine checkups." },
  { name: "Sardor Umarov", clinic: "Clinic Administrator", text: "We reduced our average wait time from 45 minutes to under 20. Patient satisfaction scores have never been higher." },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* First impression section: headline, short value proposition, and the
          two actions a new visitor is most likely to care about. */}
      <section className="gradient-hero text-white py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Smarter Healthcare Starts{" "}
              <span className="text-teal-200">Before the Visit</span>
            </h1>
            <p className="text-lg md:text-xl text-teal-100 mb-10 leading-relaxed">
              AI-powered patient intake, intelligent queue management, and
              clinical decision support — designed for clinics and hospitals in
              Uzbekistan.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/find-doctor"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-teal-700 font-semibold rounded-xl hover:bg-teal-50 transition-colors"
              >
                Find a Doctor <ArrowRight className="ml-2" size={18} />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
              >
                For Clinics
              </Link>
            </div>
          </div>
          {/* Quick proof points so the hero feels grounded in outcomes, not
              just marketing words. */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
            {[
              { value: "40%", label: "Faster Consultations", icon: <Clock size={20} /> },
              { value: "3x", label: "Better Routing", icon: <UserCheck size={20} /> },
              { value: "AI", label: "Powered Safety", icon: <Shield size={20} /> },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-2">
                  {stat.icon}
                  <span className="text-3xl font-bold">{stat.value}</span>
                </div>
                <p className="text-teal-100">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Short step-by-step explanation for first-time visitors. */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">How It Works</h2>
            <p className="text-muted text-lg max-w-2xl mx-auto">Four simple steps from symptoms to better care</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={step.title} className="text-center group">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-teal-50 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  {step.icon}
                </div>
                <div className="text-xs font-semibold text-primary mb-2">Step {i + 1}</div>
                <h3 className="text-lg font-semibold text-secondary mb-2">{step.title}</h3>
                <p className="text-sm text-muted">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core product pillars. Each card answers a different "what does this do?" question. */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">Three Pillars of Avicenna</h2>
            <p className="text-muted text-lg max-w-2xl mx-auto">
              Each feature solves a real problem in the outpatient flow
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 rounded-xl bg-teal-50 text-primary flex items-center justify-center mb-6">
                  {f.icon}
                </div>
                <h3 className="text-xl font-semibold text-secondary mb-3">{f.title}</h3>
                <p className="text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* This section is aimed at clinics and hospitals evaluating the product. */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-3xl p-12 flex items-center justify-center">
              <div className="text-center">
                <Activity size={80} className="text-primary mx-auto mb-4" />
                <p className="text-primary font-semibold text-lg">Clinic Dashboard Preview</p>
                <p className="text-sm text-teal-600 mt-2">Real-time queue, analytics, and doctor workload</p>
              </div>
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-6">
                Built for Private Clinics in Uzbekistan
              </h2>
              <p className="text-muted mb-8 text-lg leading-relaxed">
                Avicenna is designed from the ground up for outpatient clinics
                in Tashkent. One platform replaces multiple tools for booking,
                queue management, and clinical support.
              </p>
              <ul className="space-y-4 mb-8">
                {providerPoints.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <Check className="text-primary mt-0.5 flex-shrink-0" size={20} />
                    <span className="text-secondary">{point}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/pricing"
                className="inline-flex items-center px-8 py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors"
              >
                Get Started <ArrowRight className="ml-2" size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof before the final signup push. */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">Trusted by Clinics</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-muted mb-6 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="font-semibold text-secondary">{t.name}</p>
                  <p className="text-sm text-muted">{t.clinic}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final call-to-action after the visitor has seen the full landing page story. */}
      <section className="gradient-hero text-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Clinic?</h2>
          <p className="text-teal-100 text-lg mb-10 max-w-2xl mx-auto">
            Join forward-thinking clinics in Uzbekistan that are already using
            Avicenna to deliver faster, safer, and smarter healthcare.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-teal-700 font-semibold rounded-xl hover:bg-teal-50 transition-colors"
            >
              Start Free Trial
            </Link>
            <Link
              href="/clinics"
              className="px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
            >
              Book a Demo
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
