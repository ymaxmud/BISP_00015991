"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import { auth, billing, SubscriptionPlanRecord as Plan } from "@/lib/api";
import WizardShell from "@/components/wizard/WizardShell";

const STEPS = [
  { title: "Account" },
  { title: "Clinic info" },
  { title: "Operational setup" },
  { title: "Doctor management" },
  { title: "Subscription" },
  { title: "Mock payment" },
  { title: "Admin permissions" },
  { title: "Confirm" },
];

export default function ClinicRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plans, setPlans] = useState<Plan[]>([]);

  // Step 1 — admin account
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // Step 2 — clinic info
  const [clinicName, setClinicName] = useState("");
  const [clinicType, setClinicType] = useState("clinic");
  const [clinicCity, setClinicCity] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  const [clinicEmail, setClinicEmail] = useState("");
  const [clinicDescription, setClinicDescription] = useState("");

  // Step 3 — operational
  const [departments, setDepartments] = useState<string[]>([""]);
  const [workingHoursText, setWorkingHoursText] = useState(
    "Mon–Sat 08:00-20:00"
  );

  // Step 4 — doctor seats
  const [doctorEmails, setDoctorEmails] = useState<string[]>([""]);

  // Step 5 — subscription
  const [planCode, setPlanCode] = useState("clinic");

  // Step 6 — mock payment
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  // Step 7 — admin permissions
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    manage_doctors: true,
    manage_appointments: true,
    view_analytics: true,
    manage_billing: true,
  });

  // Step 8 — terms
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    billing
      .listPlans()
      .then((items) => {
        setPlans(
          items.filter((p) => ["individual_doctor", "clinic"].includes(p.code))
        );
      })
      .catch(() => setPlans([]));
  }, []);

  const selectedPlan = plans.find((p) => p.code === planCode);

  const validate = (s: number): string | null => {
    if (s === 0) {
      if (!firstName || !lastName || !email)
        return "Name and email required.";
      if (password.length < 8) return "Password must be at least 8 characters.";
      if (password !== confirm) return "Passwords do not match.";
    }
    if (s === 1) {
      if (!clinicName || !clinicCity) return "Clinic name and city required.";
    }
    if (s === 5 && planCode !== "free_doctor") {
      if (!cardHolder || cardNumber.length < 12 || !cardExpiry || cardCvc.length < 3)
        return "Please fill in the mock card details.";
    }
    return null;
  };

  const next = () => {
    const err = validate(step);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    if (!agreed) {
      setError("Please accept the terms.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const payload = {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        password,
        clinic_name: clinicName,
        clinic_type: clinicType,
        clinic_city: clinicCity,
        clinic_address: clinicAddress,
        clinic_phone: clinicPhone,
        clinic_email: clinicEmail,
        clinic_description: clinicDescription,
        departments: departments.filter((d) => d.trim()),
        working_hours: { text: workingHoursText },
        initial_doctor_emails: doctorEmails.filter((e) => e.trim()),
        plan_code: planCode,
        payment_card_last4: cardNumber.slice(-4),
        admin_permissions: permissions,
        agreed_to_terms: agreed,
      };
      const data = await auth.registerClinic(payload);
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("user_role", data.user.role);
      localStorage.setItem("user_data", JSON.stringify(data.user));
      router.push("/org/dashboard");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <WizardShell title="Clinic admin registration" steps={STEPS} currentStep={step}>
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
          <Field label="Admin email *">
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
          <Field label="Clinic name *">
            <input
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type">
              <select
                value={clinicType}
                onChange={(e) => setClinicType(e.target.value)}
                className={inputCls}
              >
                <option value="clinic">Clinic</option>
                <option value="hospital">Hospital</option>
              </select>
            </Field>
            <Field label="City *">
              <input
                value={clinicCity}
                onChange={(e) => setClinicCity(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Address">
            <input
              value={clinicAddress}
              onChange={(e) => setClinicAddress(e.target.value)}
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Clinic phone">
              <input
                value={clinicPhone}
                onChange={(e) => setClinicPhone(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Clinic email">
              <input
                type="email"
                value={clinicEmail}
                onChange={(e) => setClinicEmail(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Description">
            <textarea
              rows={3}
              value={clinicDescription}
              onChange={(e) => setClinicDescription(e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Departments
            </label>
            {departments.map((d, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  placeholder="e.g. Cardiology"
                  value={d}
                  onChange={(e) => {
                    const c = [...departments];
                    c[i] = e.target.value;
                    setDepartments(c);
                  }}
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() =>
                    setDepartments(departments.filter((_, idx) => idx !== i))
                  }
                  className="text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setDepartments([...departments, ""])}
              className="inline-flex items-center gap-1 text-sm text-primary"
            >
              <Plus size={14} /> Add department
            </button>
          </div>
          <Field label="Working hours">
            <input
              value={workingHoursText}
              onChange={(e) => setWorkingHoursText(e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Invite initial doctors by email. They will receive access once you
            finalize their profiles from the admin dashboard.
          </p>
          {doctorEmails.map((em, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="email"
                placeholder="doctor@example.com"
                value={em}
                onChange={(e) => {
                  const c = [...doctorEmails];
                  c[i] = e.target.value;
                  setDoctorEmails(c);
                }}
                className={inputCls}
              />
              <button
                type="button"
                onClick={() =>
                  setDoctorEmails(doctorEmails.filter((_, idx) => idx !== i))
                }
                className="text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setDoctorEmails([...doctorEmails, ""])}
            className="inline-flex items-center gap-1 text-sm text-primary"
          >
            <Plus size={14} /> Add doctor
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Plans with higher tiers allow more doctor seats under one clinic.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {plans.length === 0 && (
              <div className="text-sm text-muted">Loading plans…</div>
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
                  <div className="text-2xl font-bold text-secondary mb-1">
                    ${Number(p.price_monthly).toFixed(0)}
                    <span className="text-sm text-muted font-normal">/mo</span>
                  </div>
                  <div className="text-xs text-primary font-medium mb-2">
                    Up to {p.max_doctors} doctor
                    {p.max_doctors > 1 ? "s" : ""}
                  </div>
                  <p className="text-xs text-muted mb-2">{p.description || ""}</p>
                  <ul className="text-xs text-muted space-y-0.5">
                    {(p.features || []).slice(0, 5).map((f, i) => (
                      <li key={i}>• {f}</li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-900">
            Mock payment — no real card is charged. Card details are stored as
            last-4 digits only for the demo receipt.
          </div>
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
            <span className="text-sm text-muted">Plan total</span>
            <span className="text-lg font-semibold text-secondary">
              ${selectedPlan ? Number(selectedPlan.price_monthly).toFixed(2) : "0.00"}
              /mo
            </span>
          </div>
          <Field label="Cardholder name">
            <input
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Card number">
            <input
              value={cardNumber}
              onChange={(e) =>
                setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 19))
              }
              placeholder="4242 4242 4242 4242"
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Expiry (MM/YY)">
              <input
                value={cardExpiry}
                onChange={(e) => setCardExpiry(e.target.value.slice(0, 5))}
                placeholder="12/28"
                className={inputCls}
              />
            </Field>
            <Field label="CVC">
              <input
                value={cardCvc}
                onChange={(e) =>
                  setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                placeholder="123"
                className={inputCls}
              />
            </Field>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            Fine-tune the permissions for your admin account. You can change
            these at any time.
          </p>
          {Object.entries(permissions).map(([key, value]) => (
            <label
              key={key}
              className="flex items-center justify-between p-3 border border-gray-100 rounded-lg"
            >
              <span className="text-sm capitalize">
                {key.replace(/_/g, " ")}
              </span>
              <input
                type="checkbox"
                checked={value}
                onChange={(e) =>
                  setPermissions({ ...permissions, [key]: e.target.checked })
                }
              />
            </label>
          ))}
        </div>
      )}

      {step === 7 && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg text-xs text-muted">
            By creating your clinic account you agree to the Avicenna Terms of
            Service and Privacy Policy, and confirm the information above is
            accurate.
          </div>
          <Summary label="Admin" value={`${firstName} ${lastName} (${email})`} />
          <Summary label="Clinic" value={`${clinicName}, ${clinicCity}`} />
          <Summary
            label="Plan"
            value={
              selectedPlan
                ? `${selectedPlan.name} — $${Number(
                    selectedPlan.price_monthly
                  ).toFixed(0)}/mo, up to ${selectedPlan.max_doctors} doctors`
                : "—"
            }
          />
          <Summary
            label="Departments"
            value={departments.filter(Boolean).join(", ") || "—"}
          />
          <Summary
            label="Doctors invited"
            value={
              doctorEmails.filter((e) => e.trim()).length
                ? doctorEmails.filter(Boolean).join(", ")
                : "None"
            }
          />
          <label className="flex items-center gap-2 text-sm mt-2">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            I agree to the terms above.
          </label>
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
            disabled={loading || !agreed}
            className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium inline-flex items-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Creating…" : "Create clinic"}
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

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm py-2 border-b border-gray-100">
      <span className="text-muted">{label}</span>
      <span className="text-secondary font-medium text-right max-w-[60%]">
        {value}
      </span>
    </div>
  );
}
