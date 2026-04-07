"use client";

import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Check, X } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "For individual doctors getting started",
    features: [
      { text: "Up to 2 doctors", included: true },
      { text: "Basic booking system", included: true },
      { text: "Patient intake forms", included: true },
      { text: "Community support", included: true },
      { text: "Smart queue management", included: false },
      { text: "AI copilot", included: false },
      { text: "Analytics dashboard", included: false },
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Professional",
    price: "$99",
    period: "/month",
    description: "For growing clinics that want the full platform",
    features: [
      { text: "Up to 10 doctors", included: true },
      { text: "Smart booking system", included: true },
      { text: "Patient intake forms", included: true },
      { text: "Priority support", included: true },
      { text: "Smart queue management", included: true },
      { text: "AI copilot for doctors", included: true },
      { text: "Analytics dashboard", included: true },
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For hospitals and multi-branch organizations",
    features: [
      { text: "Unlimited doctors", included: true },
      { text: "Multi-department support", included: true },
      { text: "Full platform access", included: true },
      { text: "Dedicated support", included: true },
      { text: "Hospital-grade analytics", included: true },
      { text: "API access", included: true },
      { text: "Custom integrations", included: true },
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-secondary mb-4">Plans for Every Clinic</h1>
            <p className="text-lg text-muted max-w-2xl mx-auto">Start free and scale as you grow. All plans include core booking and intake features.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div key={plan.name} className={`bg-white rounded-2xl p-8 border ${plan.popular ? "border-primary shadow-lg ring-2 ring-primary/20 relative" : "border-gray-100 shadow-sm"}`}>
                {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-xs font-semibold rounded-full">Most Popular</div>}
                <h3 className="text-xl font-bold text-secondary">{plan.name}</h3>
                <p className="text-sm text-muted mt-1 mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-secondary">{plan.price}</span>
                  <span className="text-muted">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-center gap-3 text-sm">
                      {f.included ? <Check size={16} className="text-green-500 flex-shrink-0" /> : <X size={16} className="text-gray-300 flex-shrink-0" />}
                      <span className={f.included ? "text-secondary" : "text-gray-400"}>{f.text}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register" className={`block w-full text-center py-3 rounded-lg font-semibold transition-colors ${plan.popular ? "bg-primary text-white hover:bg-primary-dark" : "border border-gray-200 text-secondary hover:bg-gray-50"}`}>{plan.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
