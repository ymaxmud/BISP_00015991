"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Check, X, Loader2 } from "lucide-react";
import { billing, SubscriptionPlanRecord as ApiPlan } from "@/lib/api";

interface DisplayPlan {
  code: string;
  name: string;
  description: string;
  price: string;
  period: string;
  features: { text: string; included: boolean }[];
  cta: string;
  ctaHref: string;
  popular: boolean;
}

function formatPrice(amount: string | number, currency = "USD"): string {
  const n = Number(amount);
  if (!n || Number.isNaN(n)) return "Free";
  return currency === "USD" ? `$${n.toFixed(0)}` : `${n.toFixed(0)} ${currency}`;
}

/* Fallback plans used if the billing API can't be reached (e.g. the user is
   browsing the marketing site before the backend is running). */
const FALLBACK_PLANS: DisplayPlan[] = [
  {
    code: "free_doctor",
    name: "Free doctor",
    description: "For individual doctors who just want a public profile",
    price: "Free",
    period: "",
    features: [
      { text: "1 doctor profile", included: true },
      { text: "Public directory listing", included: true },
      { text: "Patient intake forms", included: true },
      { text: "Community support", included: true },
      { text: "AI clinical assistant", included: false },
      { text: "Analytics dashboard", included: false },
    ],
    cta: "Get Started",
    ctaHref: "/register/doctor",
    popular: false,
  },
  {
    code: "individual_doctor",
    name: "Individual doctor",
    description: "For solo practitioners who want the full AI assistant",
    price: "$15",
    period: "/month",
    features: [
      { text: "1 doctor profile", included: true },
      { text: "Public directory listing", included: true },
      { text: "Patient intake forms", included: true },
      { text: "AI clinical assistant", included: true },
      { text: "Medication safety checks", included: true },
      { text: "Lab report analysis", included: true },
    ],
    cta: "Start Individual Plan",
    ctaHref: "/register/doctor",
    popular: true,
  },
  {
    code: "clinic",
    name: "Clinic",
    description: "For growing clinics with multiple doctors",
    price: "$99",
    period: "/month",
    features: [
      { text: "Up to 10 doctors", included: true },
      { text: "Smart queue management", included: true },
      { text: "AI clinical assistant for all doctors", included: true },
      { text: "Analytics dashboard", included: true },
      { text: "Admin tools & user management", included: true },
      { text: "Priority support", included: true },
    ],
    cta: "Start Clinic Plan",
    ctaHref: "/register/clinic",
    popular: false,
  },
];

const ENTERPRISE_PLAN: DisplayPlan = {
  code: "enterprise",
  name: "Enterprise",
  description: "For hospitals and multi-branch organizations",
  price: "Custom",
  period: "",
  features: [
    { text: "Unlimited doctors", included: true },
    { text: "Multi-department support", included: true },
    { text: "Full platform access", included: true },
    { text: "Dedicated support", included: true },
    { text: "Hospital-grade analytics", included: true },
    { text: "API access & custom integrations", included: true },
  ],
  cta: "Contact Sales",
  ctaHref: "mailto:sales@avicenna.uz",
  popular: false,
};

function apiPlanToDisplay(plan: ApiPlan): DisplayPlan {
  const price = Number(plan.price_monthly);
  const isFree = !price || Number.isNaN(price);
  const ctaHref =
    plan.code === "clinic" ? "/register/clinic" : "/register/doctor";
  const cta =
    plan.code === "clinic"
      ? "Start Clinic Plan"
      : plan.code === "individual_doctor"
        ? "Start Individual Plan"
        : "Get Started";

  const feats = Array.isArray(plan.features) && plan.features.length > 0
    ? plan.features.map((f) => ({ text: f, included: true }))
    : [];

  // Always inject structural features so the card is self-explanatory
  const structural: { text: string; included: boolean }[] = [
    {
      text:
        plan.max_doctors === 1
          ? "1 doctor"
          : `Up to ${plan.max_doctors} doctors`,
      included: true,
    },
    { text: "AI clinical assistant", included: !!plan.ai_enabled },
  ];

  return {
    code: plan.code,
    name: plan.name,
    description: plan.description || "",
    price: isFree ? "Free" : formatPrice(plan.price_monthly, plan.currency),
    period: isFree ? "" : "/month",
    features: [...structural, ...feats],
    cta,
    ctaHref,
    popular: plan.code === "individual_doctor",
  };
}

export default function PricingPage() {
  const [apiPlans, setApiPlans] = useState<ApiPlan[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await billing.listPlans();
        if (!cancelled) setApiPlans(data);
      } catch {
        if (!cancelled) setApiPlans(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const plans = useMemo<DisplayPlan[]>(() => {
    if (apiPlans && apiPlans.length > 0) {
      const active = apiPlans.filter((p) => p.is_active !== false);
      const order: Record<string, number> = {
        free_doctor: 0,
        individual_doctor: 1,
        clinic: 2,
      };
      const sorted = [...active].sort(
        (a, b) => (order[a.code] ?? 99) - (order[b.code] ?? 99)
      );
      return [...sorted.map(apiPlanToDisplay), ENTERPRISE_PLAN];
    }
    return [...FALLBACK_PLANS, ENTERPRISE_PLAN];
  }, [apiPlans]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-secondary mb-4">
              Plans for Every Doctor & Clinic
            </h1>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              Start free, upgrade to the Individual plan for the full AI clinical
              assistant, or scale up to the Clinic plan as you grow.
            </p>
          </div>

          {loading && (
            <div className="text-center mb-6">
              <Loader2 size={20} className="text-primary animate-spin mx-auto" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.code}
                className={`bg-white rounded-2xl p-8 border ${
                  plan.popular
                    ? "border-primary shadow-lg ring-2 ring-primary/20 relative"
                    : "border-gray-100 shadow-sm"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-xs font-semibold rounded-full whitespace-nowrap">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-secondary">{plan.name}</h3>
                <p className="text-sm text-muted mt-1 mb-4 min-h-[2.5rem]">
                  {plan.description}
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-secondary">
                    {plan.price}
                  </span>
                  <span className="text-muted">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, idx) => (
                    <li
                      key={`${f.text}-${idx}`}
                      className="flex items-start gap-3 text-sm"
                    >
                      {f.included ? (
                        <Check
                          size={16}
                          className="text-green-500 flex-shrink-0 mt-0.5"
                        />
                      ) : (
                        <X
                          size={16}
                          className="text-gray-300 flex-shrink-0 mt-0.5"
                        />
                      )}
                      <span
                        className={
                          f.included ? "text-secondary" : "text-gray-400"
                        }
                      >
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.ctaHref}
                  className={`block w-full text-center py-3 rounded-lg font-semibold transition-colors ${
                    plan.popular
                      ? "bg-primary text-white hover:bg-primary-dark"
                      : "border border-gray-200 text-secondary hover:bg-gray-50"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-muted mt-10">
            All paid plans are billed monthly. Cancel anytime. Taxes may apply.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
