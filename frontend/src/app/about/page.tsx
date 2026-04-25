import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Heart, Stethoscope, Globe2, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "About | Avicenna",
  description:
    "Avicenna is an AI-powered healthcare platform built for clinics in Uzbekistan and Central Asia.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="bg-gradient-to-b from-teal-50 to-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-secondary mb-4">
            About Avicenna
          </h1>
          <p className="text-lg text-muted leading-relaxed">
            We are building the modern operating system for healthcare in
            Uzbekistan — combining smart triage, electronic records, and an
            AI clinical assistant in a single platform.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl font-bold text-secondary mb-4">
              Our mission
            </h2>
            <p className="text-muted leading-relaxed mb-4">
              Healthcare in Central Asia deserves the same quality of digital
              tools that clinics in Europe and North America rely on every
              day. Avicenna gives doctors the time and context to focus on the
              patient in front of them — not on paperwork.
            </p>
            <p className="text-muted leading-relaxed">
              We work alongside clinical partners across Tashkent, Samarkand,
              and Bukhara to make sure every workflow we ship makes a real
              difference at the bedside.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-secondary mb-4">
              Our values
            </h2>
            <ul className="space-y-4">
              {[
                {
                  icon: <Heart className="text-primary" size={20} />,
                  title: "Patient-first",
                  body: "Every feature must improve patient outcomes or save clinical time.",
                },
                {
                  icon: <Stethoscope className="text-primary" size={20} />,
                  title: "Clinically accountable",
                  body: "AI advises; clinicians decide. Always.",
                },
                {
                  icon: <ShieldCheck className="text-primary" size={20} />,
                  title: "Privacy by default",
                  body: "Patient data is encrypted in transit and at rest, never sold.",
                },
                {
                  icon: <Globe2 className="text-primary" size={20} />,
                  title: "Locally relevant",
                  body: "Built for Uzbek, Russian, and English speaking clinical teams.",
                },
              ].map((item) => (
                <li key={item.title} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center shrink-0 mt-0.5">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary">{item.title}</h3>
                    <p className="text-sm text-muted">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
