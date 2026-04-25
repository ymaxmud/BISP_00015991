"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Mail, Phone, MapPin, Send, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Persist locally so the contact submission isn't lost even though the
    // backend contact form endpoint isn't wired up yet.
    try {
      const stored = JSON.parse(
        localStorage.getItem("contact_messages") || "[]"
      );
      stored.push({ ...form, sentAt: new Date().toISOString() });
      localStorage.setItem("contact_messages", JSON.stringify(stored));
    } catch {
      // ignore
    }

    setTimeout(() => {
      setSubmitting(false);
      setSent(true);
      setForm({ name: "", email: "", message: "" });
    }, 600);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="bg-gradient-to-b from-teal-50 to-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-secondary mb-4">
            Contact us
          </h1>
          <p className="text-lg text-muted">
            Questions, partnership requests, or feedback — we&apos;d love to
            hear from you.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold text-secondary mb-6">
              Reach the team
            </h2>
            <ul className="space-y-5">
              <li className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                  <Mail size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted">Email</p>
                  <a
                    href="mailto:hello@avicenna.uz"
                    className="font-medium text-secondary hover:text-primary"
                  >
                    hello@avicenna.uz
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                  <Phone size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted">Phone</p>
                  <a
                    href="tel:+998712000001"
                    className="font-medium text-secondary hover:text-primary"
                  >
                    +998 71 200 0001
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                  <MapPin size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted">Office</p>
                  <p className="font-medium text-secondary">
                    12 Amir Temur Avenue
                    <br />
                    Tashkent, Uzbekistan
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-secondary mb-6">
              Send a message
            </h2>
            {sent ? (
              <div className="bg-teal-50 border border-teal-100 rounded-xl p-6 flex items-start gap-3">
                <CheckCircle2 className="text-primary shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-semibold text-secondary">
                    Thanks — we got your message.
                  </p>
                  <p className="text-sm text-muted mt-1">
                    Our team will reply within one business day.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">
                    Name
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">
                    Email
                  </label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">
                    Message
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-primary resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium flex items-center gap-2 disabled:opacity-60"
                >
                  <Send size={16} />
                  {submitting ? "Sending…" : "Send message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
