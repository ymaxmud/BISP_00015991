"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import { auth } from "@/lib/api";
import WizardShell from "@/components/wizard/WizardShell";

type FamilyMember = {
  first_name: string;
  last_name: string;
  relationship: string;
  dob: string;
  gender: string;
};

type ChronicOption = {
  code: string;
  label: string;
};

const CHRONIC_OPTIONS: ChronicOption[] = [
  { code: "diabetes", label: "Diabetes" },
  { code: "hypertension", label: "Hypertension" },
  { code: "heart_disease", label: "Heart disease" },
  { code: "asthma", label: "Asthma" },
  { code: "other", label: "Other" },
  { code: "none", label: "None" },
];

type Medication = { name: string; dosage: string };

const STEPS = [
  { title: "Account", description: "Basic info" },
  { title: "Family", description: "Household members" },
  { title: "Vitals", description: "Height & weight" },
  { title: "Lifestyle", description: "Habits" },
  { title: "Health history", description: "Conditions & meds" },
  { title: "Symptoms", description: "Pre-triage" },
  { title: "Health reports", description: "Optional upload" },
  { title: "Review", description: "Confirm & create" },
];

export default function PatientRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Account
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // Family
  const [family, setFamily] = useState<FamilyMember[]>([]);

  // Vitals
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");

  // Lifestyle
  const [smoking, setSmoking] = useState("");
  const [alcohol, setAlcohol] = useState("");
  const [activity, setActivity] = useState("");

  // Health history
  const [chronic, setChronic] = useState<string[]>([]);
  const [chronicOther, setChronicOther] = useState("");
  const [allergies, setAllergies] = useState("");
  const [takesMeds, setTakesMeds] = useState<null | boolean>(null);
  const [medications, setMedications] = useState<Medication[]>([
    { name: "", dosage: "" },
  ]);

  // Symptoms
  const [symptomText, setSymptomText] = useState("");
  const [symptomDuration, setSymptomDuration] = useState("");
  const [symptomSeverity, setSymptomSeverity] = useState("");

  // Health report
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [reportAnalysis, setReportAnalysis] = useState<any>(null);
  const [analysingReport, setAnalysingReport] = useState(false);

  const addFamilyMember = () =>
    setFamily((f) => [
      ...f,
      { first_name: "", last_name: "", relationship: "", dob: "", gender: "" },
    ]);
  const removeFamilyMember = (i: number) =>
    setFamily((f) => f.filter((_, idx) => idx !== i));

  const addMedication = () =>
    setMedications((m) => [...m, { name: "", dosage: "" }]);
  const removeMedication = (i: number) =>
    setMedications((m) => m.filter((_, idx) => idx !== i));

  const validateAccount = () => {
    if (!firstName.trim()) return "First name is required.";
    if (!email.trim()) return "Email is required.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirm) return "Passwords do not match.";
    return null;
  };

  const next = () => {
    if (step === 0) {
      const err = validateAccount();
      if (err) {
        setError(err);
        return;
      }
    }
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const analyseReport = async (file: File) => {
    setAnalysingReport(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const base = process.env.NEXT_PUBLIC_AI_URL || "/api/ai";
      const res = await fetch(`${base}/report-upload`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Failed to analyse report");
      }
      const data = await res.json();
      setReportAnalysis(data);
    } catch (e: any) {
      setError(e.message || "Could not analyse report");
    } finally {
      setAnalysingReport(false);
    }
  };

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      const conditions = chronic.includes("none")
        ? []
        : chronic.map((code) => ({
            code,
            label:
              code === "other"
                ? chronicOther || "Other condition"
                : CHRONIC_OPTIONS.find((c) => c.code === code)?.label || code,
          }));

      const payload: Record<string, unknown> = {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        phone,
        dob: dob || null,
        gender,
        family_members: family.filter((f) => f.first_name.trim()),
        height_cm: heightCm ? parseInt(heightCm, 10) : null,
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        smoking,
        alcohol,
        physical_activity: activity,
        chronic_conditions: conditions,
        allergies,
        medications:
          takesMeds === true
            ? medications.filter((m) => m.name.trim())
            : [],
        symptoms: symptomText
          ? [
              {
                description: symptomText,
                duration: symptomDuration,
                severity: symptomSeverity,
              },
            ]
          : [],
      };

      const data = await auth.registerPatient(payload);
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("user_role", data.user.role);
      localStorage.setItem("user_data", JSON.stringify(data.user));

      // Upload health report if one was attached — runs best-effort so the
      // user still lands on the dashboard even if the upload fails.
      if (reportFile) {
        try {
          const form = new FormData();
          form.append("file", reportFile);
          const token = data.access;
          await fetch("/api/v1/uploads/", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: form,
          });
        } catch {
          /* ignore */
        }
      }

      router.push("/patient/dashboard");
    } catch (e: any) {
      setError(e.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <WizardShell
      title="Patient registration"
      steps={STEPS}
      currentStep={step}
    >
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
            <Field label="Last name">
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
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Date of birth">
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Gender">
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className={inputCls}
            >
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
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
          <p className="text-sm text-muted">
            Optional — add household members so their history is linked to your file.
          </p>
          {family.map((fm, i) => (
            <div
              key={i}
              className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 border border-gray-100 rounded-lg"
            >
              <input
                placeholder="First name"
                value={fm.first_name}
                onChange={(e) => {
                  const c = [...family];
                  c[i].first_name = e.target.value;
                  setFamily(c);
                }}
                className={inputCls}
              />
              <input
                placeholder="Last name"
                value={fm.last_name}
                onChange={(e) => {
                  const c = [...family];
                  c[i].last_name = e.target.value;
                  setFamily(c);
                }}
                className={inputCls}
              />
              <input
                placeholder="Relationship"
                value={fm.relationship}
                onChange={(e) => {
                  const c = [...family];
                  c[i].relationship = e.target.value;
                  setFamily(c);
                }}
                className={inputCls}
              />
              <input
                type="date"
                value={fm.dob}
                onChange={(e) => {
                  const c = [...family];
                  c[i].dob = e.target.value;
                  setFamily(c);
                }}
                className={inputCls}
              />
              <div className="flex items-center gap-2">
                <select
                  value={fm.gender}
                  onChange={(e) => {
                    const c = [...family];
                    c[i].gender = e.target.value;
                    setFamily(c);
                  }}
                  className={inputCls}
                >
                  <option value="">Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeFamilyMember(i)}
                  className="text-red-500"
                  aria-label="Remove"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addFamilyMember}
            className="inline-flex items-center gap-1 text-sm text-primary"
          >
            <Plus size={14} /> Add family member
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Height (cm)">
            <input
              type="number"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Weight (kg)">
            <input
              type="number"
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <RadioGroup
            label="Smoking"
            value={smoking}
            onChange={setSmoking}
            options={[
              { value: "never", label: "Never" },
              { value: "occasionally", label: "Occasionally" },
              { value: "regularly", label: "Regularly" },
            ]}
          />
          <RadioGroup
            label="Alcohol"
            value={alcohol}
            onChange={setAlcohol}
            options={[
              { value: "never", label: "Never" },
              { value: "occasionally", label: "Occasionally" },
              { value: "regularly", label: "Regularly" },
            ]}
          />
          <RadioGroup
            label="Physical activity"
            value={activity}
            onChange={setActivity}
            options={[
              { value: "low", label: "Low" },
              { value: "moderate", label: "Moderate" },
              { value: "high", label: "High" },
            ]}
          />
        </div>
      )}

      {step === 4 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Chronic diseases (select all that apply)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CHRONIC_OPTIONS.map((c) => {
                const checked = chronic.includes(c.code);
                return (
                  <label
                    key={c.code}
                    className={`flex items-center gap-2 p-2 border rounded-lg text-sm cursor-pointer ${
                      checked
                        ? "border-primary bg-primary/5"
                        : "border-gray-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (c.code === "none") {
                          setChronic(e.target.checked ? ["none"] : []);
                          return;
                        }
                        const next = new Set(chronic.filter((x) => x !== "none"));
                        if (e.target.checked) next.add(c.code);
                        else next.delete(c.code);
                        setChronic(Array.from(next));
                      }}
                    />
                    {c.label}
                  </label>
                );
              })}
            </div>
            {chronic.includes("other") && (
              <input
                value={chronicOther}
                onChange={(e) => setChronicOther(e.target.value)}
                placeholder="Specify other condition"
                className={`${inputCls} mt-2`}
              />
            )}
          </div>
          <Field label="Allergies">
            <input
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="e.g. Penicillin, latex"
              className={inputCls}
            />
          </Field>
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Do you currently take any medications?
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setTakesMeds(false)}
                className={`px-4 py-2 rounded-lg border text-sm ${
                  takesMeds === false
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-gray-200"
                }`}
              >
                No
              </button>
              <button
                type="button"
                onClick={() => setTakesMeds(true)}
                className={`px-4 py-2 rounded-lg border text-sm ${
                  takesMeds === true
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-gray-200"
                }`}
              >
                Yes
              </button>
            </div>
            {takesMeds && (
              <div className="mt-3 space-y-2">
                {medications.map((m, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      placeholder="Medication name"
                      value={m.name}
                      onChange={(e) => {
                        const c = [...medications];
                        c[i].name = e.target.value;
                        setMedications(c);
                      }}
                      className={inputCls}
                    />
                    <input
                      placeholder="Dosage"
                      value={m.dosage}
                      onChange={(e) => {
                        const c = [...medications];
                        c[i].dosage = e.target.value;
                        setMedications(c);
                      }}
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={() => removeMedication(i)}
                      className="text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addMedication}
                  className="inline-flex items-center gap-1 text-sm text-primary"
                >
                  <Plus size={14} /> Add medication
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <Field label="Current symptoms">
            <textarea
              rows={3}
              value={symptomText}
              onChange={(e) => setSymptomText(e.target.value)}
              placeholder="Describe what you're feeling right now (optional)"
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Duration">
              <input
                value={symptomDuration}
                onChange={(e) => setSymptomDuration(e.target.value)}
                placeholder="e.g. 3 days"
                className={inputCls}
              />
            </Field>
            <Field label="Severity">
              <select
                value={symptomSeverity}
                onChange={(e) => setSymptomSeverity(e.target.value)}
                className={inputCls}
              >
                <option value="">Select</option>
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
            </Field>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Upload a recent lab report or medical document. It will be
            analysed by the AI assistant and shared with your appointed doctor.
          </p>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-8 cursor-pointer hover:border-primary">
            <Upload className="text-muted mb-2" size={28} />
            <span className="text-sm text-secondary">
              {reportFile ? reportFile.name : "Click to select a PDF or Word document"}
            </span>
            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setReportFile(f);
                  analyseReport(f);
                }
              }}
              className="hidden"
            />
          </label>
          {analysingReport && (
            <div className="text-sm text-muted flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Analysing report…
            </div>
          )}
          {reportAnalysis && (
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 text-sm">
              <div className="font-semibold text-secondary mb-1">
                AI report summary
              </div>
              <p className="text-muted mb-2">{reportAnalysis.analysis.summary}</p>
              {reportAnalysis.analysis.abnormal_values?.length > 0 && (
                <div>
                  <div className="font-medium text-secondary mb-1">
                    Abnormal values
                  </div>
                  <ul className="list-disc list-inside text-muted space-y-0.5">
                    {reportAnalysis.analysis.abnormal_values.map(
                      (av: any, i: number) => (
                        <li key={i}>
                          {av.parameter}: {av.value} {av.unit} ({av.status})
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {step === 7 && (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            Review your details and create your account.
          </p>
          <ReviewRow label="Name" value={`${firstName} ${lastName}`.trim()} />
          <ReviewRow label="Email" value={email} />
          <ReviewRow label="Phone" value={phone || "—"} />
          <ReviewRow label="Gender" value={gender || "—"} />
          <ReviewRow
            label="Height / Weight"
            value={`${heightCm || "—"} cm / ${weightKg || "—"} kg`}
          />
          <ReviewRow
            label="Lifestyle"
            value={`Smoking: ${smoking || "—"}, Alcohol: ${
              alcohol || "—"
            }, Activity: ${activity || "—"}`}
          />
          <ReviewRow
            label="Conditions"
            value={chronic.length ? chronic.join(", ") : "None"}
          />
          <ReviewRow
            label="Allergies"
            value={allergies || "None reported"}
          />
          <ReviewRow
            label="Family members"
            value={String(family.filter((f) => f.first_name).length)}
          />
          <ReviewRow label="Health report" value={reportFile?.name || "—"} />
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

function RadioGroup({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <div className="text-sm font-medium text-secondary mb-2">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`px-4 py-2 text-sm rounded-lg border ${
              value === o.value
                ? "border-primary bg-primary/5 text-primary"
                : "border-gray-200 text-muted"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm py-2 border-b border-gray-100">
      <span className="text-muted">{label}</span>
      <span className="text-secondary font-medium text-right max-w-[60%]">
        {value}
      </span>
    </div>
  );
}
