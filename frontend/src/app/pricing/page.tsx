"use client";

/**
 * Pricing page (route: `/pricing`).
 *
 * Three self-serve tiers shown side by side, then an Enterprise banner
 * underneath for sales-led deals.
 *
 * Where the data comes from: we fetch `billing.listPlans()` from the
 * Django backend and merge it with the hardcoded `FALLBACK_PLANS`
 * constant. The merge always ensures all 3 tiers render, even if the
 * backend is partially seeded — see the `plans` useMemo for the
 * exact merge logic.
 *
 * Each card's CTA points at the matching registration wizard:
 *   - free_doctor / individual_doctor → /register/doctor
 *   - clinic                          → /register/clinic
 *   - enterprise                      → mailto:sales@avicenna.uz
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Check, X, Loader2, Sparkles } from "lucide-react";
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
    // Always render all three tiers in the marketing page, even if the
    // backend's /billing/plans/ table is partially seeded — otherwise the
    // grid renders as a single lonely card.
    const ORDER = ["free_doctor", "individual_doctor", "clinic"] as const;
    const apiByCode = new Map<string, ApiPlan>();
    if (apiPlans) {
      for (const p of apiPlans) {
        if (p.is_active !== false) apiByCode.set(p.code, p);
      }
    }
    const fallbackByCode = new Map(FALLBACK_PLANS.map((p) => [p.code, p]));
    return ORDER.map((code) => {
      const fromApi = apiByCode.get(code);
      if (fromApi) return apiPlanToDisplay(fromApi);
      return fallbackByCode.get(code) ?? FALLBACK_PLANS[0];
    });
  }, [apiPlans]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <div className="text-center mb-14">
            <h1 className="text-3xl sm:text-4xl font-bold text-secondary mb-4">
              Plans for every doctor &amp; clinic
            </h1>
            <p className="text-base sm:text-lg text-muted max-w-2xl mx-auto">
              Start free, upgrade to the Individual plan for the full AI
              clinical assistant, or scale up to the Clinic plan as you grow.
            </p>
          </div>

          {loading && (
            <div className="text-center mb-6" role="status">
              <Loader2 size={20} className="text-primary animate-spin mx-auto" />
              <span className="sr-only">Loading plans…</span>
            </div>
          )}

          {/* 3 main plans — equal weight, generous spacing */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10 pt-3">
            {plans.map((plan) => (
              <div
                key={plan.code}
                className={`relative bg-white rounded-2xl p-7 flex flex-col border transition-shadow ${
                  plan.popular
                    ? "border-primary shadow-lg"
                    : "border-gray-100 shadow-sm hover:shadow-md"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full whitespace-nowrap shadow-sm flex items-center gap-1">
                    <Sparkles size={12} />
                    Most Popular
                  </div>
                )}

                <h3 className="text-xl font-bold text-secondary">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted mt-1 mb-5 min-h-[2.5rem]">
                  {plan.description}
                </p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-secondary">
                    {plan.price}
                  </span>
                  <span className="text-muted">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f, idx) => (
                    <li
                      key={`${f.text}-${idx}`}
                      className="flex items-start gap-3 text-sm"
                    >
                      {f.included ? (
                        <Check
                          size={16}
                          className="text-primary flex-shrink-0 mt-0.5"
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

          {/* Enterprise — separate, wider banner so it's clearly a different
              tier (custom pricing, sales contact, not a self-serve checkout) */}
          <div className="bg-gradient-to-r from-secondary via-secondary to-teal-900 text-white rounded-2xl p-8 sm:p-10 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-center shadow-md">
            <div>
              <p className="text-xs font-semibold tracking-widest text-teal-200 uppercase mb-2">
                Enterprise
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold mb-2">
                For hospitals &amp; multi-branch organizations
              </h3>
              <p className="text-sm text-gray-300 max-w-xl">
                Unlimited doctors, multi-department support, hospital-grade
                analytics, dedicated support, and custom integrations.
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 text-sm text-gray-200">
                {[
                  "Unlimited doctors",
                  "Multi-department",
                  "API access",
                  "Dedicated support",
                ].map((f) => (
                  <span key={f} className="inline-flex items-center gap-1.5">
                    <Check size={14} className="text-teal-300" />
                    {f}
                  </span>
                ))}
              </div>
            </div>
            <a
              href="mailto:sales@avicenna.uz"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-secondary font-semibold rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              Contact Sales
            </a>
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
