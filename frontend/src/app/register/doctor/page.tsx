"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import {
  auth,
  billing,
  SpecialtyRecord as Specialty,
  specialties as specialtiesApi,
  SubscriptionPlanRecord as Plan,
} from "@/lib/api";
import WizardShell from "@/components/wizard/WizardShell";

const STEPS = [
  { title: "Account" },
  { title: "Professional identity" },
  { title: "Workplace" },
  { title: "Availability" },
  { title: "Public profile" },
  { title: "AI assistant" },
  { title: "Verification" },
  { title: "Subscription" },
];

const AI_FEATURES = [
  { key: "case_analysis", label: "Case analysis during consultations" },
  { key: "report_analysis", label: "Patient report analysis" },
  { key: "medication_safety", label: "Medication safety checks" },
  { key: "intake_summary", label: "Pre-visit intake summary" },
];

export default function DoctorRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [plans, setPlans] = useState<Plan[]>([]);
  const [specialtyList, setSpecialtyList] = useState<Specialty[]>([]);

  // Step 1 — account
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // Step 2 — professional
  const [position, setPosition] = useState("");
  const [specialtyIds, setSpecialtyIds] = useState<number[]>([]);
  const [yearsExperience, setYearsExperience] = useState("");
  const [education, setEducation] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");

  // Step 3 — workplace
  const [workplaceName, setWorkplaceName] = useState("");
  const [workplaceCity, setWorkplaceCity] = useState("");
  const [workplaceAddress, setWorkplaceAddress] = useState("");

  // Step 4 — availability
  const [duration, setDuration] = useState("30");
  const [fee, setFee] = useState("");
  const [acceptsNewPatients, setAcceptsNewPatients] = useState(true);
  const [workingHoursText, setWorkingHoursText] = useState(
    "Mon–Fri 09:00-17:00"
  );

  // Step 5 — public profile
  const [bio, setBio] = useState("");
  const [languages, setLanguages] = useState<string[]>(["en"]);
  const [services, setServices] = useState("");

  // Step 6 — AI features
  const [aiFlags, setAiFlags] = useState<Record<string, boolean>>({
    case_analysis: true,
    report_analysis: true,
    medication_safety: true,
    intake_summary: true,
  });

  // Step 7 — verification
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Step 8 — subscription
  const [planCode, setPlanCode] = useState("individual_doctor");
  const [cardLast4, setCardLast4] = useState("");

  useEffect(() => {
    billing
      .listPlans()
      .then((items) => {
        setPlans(
          items.filter((p) =>
            ["free_doctor", "individual_doctor"].includes(p.code)
          )
        );
      })
      .catch(() => setPlans([]));
    specialtiesApi
      .list()
      .then((items) => setSpecialtyList(items))
      .catch(() => setSpecialtyList([]));
  }, []);

  const validateStep = (current: number): string | null => {
    if (current === 0) {
      if (!firstName || !lastName || !email) return "Name and email required.";
      if (password.length < 8) return "Password must be at least 8 characters.";
      if (password !== confirm) return "Passwords do not match.";
    }
    if (current === 1 && specialtyIds.length === 0) {
      return "Select at least one specialty.";
    }
    if (current === 6 && !agreedToTerms) {
      return "You must agree to the terms to continue.";
    }
    return null;
  };

  const next = () => {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    if (!agreedToTerms) {
      setError("Please accept the terms.");
      setStep(6);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const payload = {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        phone,
        full_name: `${firstName} ${lastName}`.trim(),
        specialty_ids: specialtyIds,
        years_experience: parseInt(yearsExperience || "0", 10),
        education,
        license_number: licenseNumber,
        position,
        workplace_name: workplaceName,
        workplace_city: workplaceCity,
        workplace_address: workplaceAddress,
        consultation_duration_minutes: parseInt(duration || "30", 10),
        consultation_fee: fee ? parseFloat(fee) : 0,
        working_hours: { text: workingHoursText },
        accepts_new_patients: acceptsNewPatients,
        bio,
        languages,
        services: services
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        ai_feature_flags: aiFlags,
        agreed_to_terms: agreedToTerms,
        plan_code: planCode,
        payment_card_last4: cardLast4.slice(-4),
      };
      const data = await auth.registerDoctor(payload);
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("user_role", data.user.role);
      localStorage.setItem("user_data", JSON.stringify(data.user));
      router.push("/doctor/dashboard");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleSpecialty = (id: number) => {
    setSpecialtyIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    );
  };

  const toggleLanguage = (code: string) => {
    setLanguages((ls) =>
      ls.includes(code) ? ls.filter((x) => x !== code) : [...ls, code]
    );
  };

  return (
    <WizardShell title="Doctor registration" steps={STEPS} currentStep={step}>
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {step === 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="First name *">
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Last name *">
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Email *">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Phone">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Password *">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Confirm password *">
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <Field label="Position / role">
            <input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g. Senior Cardiologist"
              className={inputCls}
            />
          </Field>
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Specialties *
            </label>
            <div className="flex flex-wrap gap-2">
              {specialtyList.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSpecialty(s.id)}
                  className={`px-3 py-1.5 rounded-lg border text-sm ${
                    specialtyIds.includes(s.id)
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-200 text-muted"
                  }`}
                >
                  {s.name}
                </button>
              ))}
              {specialtyList.length === 0 && (
                <span className="text-sm text-muted">
                  No specialties available.
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Years of experience">
              <input
                type="number"
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="License number">
              <input
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Education">
            <textarea
              rows={3}
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="Medical school, residency, certifications"
              className={inputCls}
            />
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            If you practice independently, enter your own clinic name. If you join
            an existing clinic, the admin will link you.
          </p>
          <Field label="Workplace name">
            <input
              value={workplaceName}
              onChange={(e) => setWorkplaceName(e.target.value)}
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="City">
              <input
                value={workplaceCity}
                onChange={(e) => setWorkplaceCity(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Address">
              <input
                value={workplaceAddress}
                onChange={(e) => setWorkplaceAddress(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Consultation duration (minutes)">
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Consultation fee">
              <input
                type="number"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Working hours">
            <input
              value={workingHoursText}
              onChange={(e) => setWorkingHoursText(e.target.value)}
              placeholder="e.g. Mon–Fri 09:00-17:00"
              className={inputCls}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={acceptsNewPatients}
              onChange={(e) => setAcceptsNewPatients(e.target.checked)}
            />
            Accepting new patients
          </label>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <Field label="Short bio">
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="What should patients know about you?"
              className={inputCls}
            />
          </Field>
          <div>
            <div className="text-sm font-medium text-secondary mb-2">
              Languages
            </div>
            <div className="flex gap-2">
              {[
                { code: "en", label: "English" },
                { code: "ru", label: "Russian" },
                { code: "uz", label: "Uzbek" },
              ].map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => toggleLanguage(l.code)}
                  className={`px-3 py-1.5 rounded-lg border text-sm ${
                    languages.includes(l.code)
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-200 text-muted"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          <Field label="Services offered (comma separated)">
            <input
              value={services}
              onChange={(e) => setServices(e.target.value)}
              placeholder="e.g. Annual checkup, ECG, Stress test"
              className={inputCls}
            />
          </Field>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            Choose which AI features to enable for your practice.
          </p>
          {AI_FEATURES.map((f) => (
            <label
              key={f.key}
              className="flex items-center justify-between p-3 border border-gray-100 rounded-lg"
            >
              <span className="text-sm">{f.label}</span>
              <input
                type="checkbox"
                checked={aiFlags[f.key] || false}
                onChange={(e) =>
                  setAiFlags({ ...aiFlags, [f.key]: e.target.checked })
                }
              />
            </label>
          ))}
        </div>
      )}

      {step === 6 && (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Upload of ID and license documents can be completed from your
            dashboard after signup. Please review and accept the service
            agreements below.
          </p>
          <div className="p-4 bg-gray-50 rounded-lg text-xs text-muted">
            By creating an account you confirm that you are a licensed medical
            professional, agree to our Terms of Service and Privacy Policy, and
            understand that AI suggestions are decision support — not a
            substitute for clinical judgment.
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
            />
            I agree to the terms above.
          </label>
        </div>
      )}

      {step === 7 && (
        <div className="space-y-4">
          <p className="text-sm text-muted">Choose your plan.</p>
          <div className="grid md:grid-cols-2 gap-4">
            {plans.length === 0 && (
              <div className="text-sm text-muted">
                Loading plans…
              </div>
            )}
            {plans.map((p) => {
              const selected = planCode === p.code;
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPlanCode(p.code)}
                  className={`text-left p-5 rounded-xl border-2 transition ${
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-secondary">{p.name}</span>
                    {selected && <Check className="text-primary" size={18} />}
                  </div>
                  <div className="text-2xl font-bold text-secondary mb-2">
                    ${Number(p.price_monthly).toFixed(0)}
                    <span className="text-sm text-muted font-normal">/mo</span>
                  </div>
                  <p className="text-xs text-muted mb-2">{p.description || ""}</p>
                  <ul className="text-xs text-muted space-y-0.5">
                    {(p.features || []).slice(0, 4).map((f, i) => (
                      <li key={i}>• {f}</li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
          {planCode === "individual_doctor" && (
            <Field label="Card number (last 4 digits — mock payment)">
              <input
                value={cardLast4}
                onChange={(e) =>
                  setCardLast4(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                placeholder="1234"
                className={inputCls}
              />
            </Field>
          )}
        </div>
      )}

      <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={back}
          disabled={step === 0 || loading}
          className="px-4 py-2 text-sm text-muted hover:text-secondary disabled:opacity-40"
        >
          ← Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={next}
            className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium"
          >
            Continue →
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium inline-flex items-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Creating…" : "Create account"}
          </button>
        )}
      </div>
    </WizardShell>
  );
}

const inputCls =
  "w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-secondary mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
