"use client";

import { useMemo, useState } from "react";
import {
  Brain,
  Zap,
  Shield,
  FileText,
  Layers,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Upload,
  Check,
  AlertTriangle,
  X,
  RefreshCw,
} from "lucide-react";
import { ai } from "@/lib/api";

type StepKey = "patient" | "medication" | "report" | "overall";

const STEPS: { key: StepKey; title: string; description: string; icon: any }[] = [
  {
    key: "patient",
    title: "Patient Information",
    description: "Symptoms, history, demographics",
    icon: Zap,
  },
  {
    key: "medication",
    title: "Medication Safety",
    description: "Interactions & allergies",
    icon: Shield,
  },
  {
    key: "report",
    title: "Report Analysis",
    description: "Upload PDF, Word, image",
    icon: FileText,
  },
  {
    key: "overall",
    title: "Overall Analysis",
    description: "Combined AI summary",
    icon: Layers,
  },
];

type PatientForm = {
  patient_name: string;
  age: string;
  gender: string;
  symptoms: string;
  duration: string;
  severity: string;
  history: string;
  allergies: string;
  medications: string;
};

type MedForm = {
  current: string;
  proposed: string;
  allergies: string;
};

export default function DoctorAIPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = STEPS[stepIndex].key;

  // These state blocks match the four-step flow on the page:
  // patient info -> medication check -> report analysis -> overall summary.
  const [patientForm, setPatientForm] = useState<PatientForm>({
    patient_name: "",
    age: "",
    gender: "male",
    symptoms: "",
    duration: "",
    severity: "moderate",
    history: "",
    allergies: "",
    medications: "",
  });

  const [medForm, setMedForm] = useState<MedForm>({
    current: "",
    proposed: "",
    allergies: "",
  });

  const [reportText, setReportText] = useState("");
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [reportUploadInfo, setReportUploadInfo] = useState<{
    filename: string;
    extracted_text: string;
  } | null>(null);

  // Each step stores its own result so the doctor can move back and forth
  // without losing what was already generated.
  const [caseResult, setCaseResult] = useState<any>(null);
  const [medResult, setMedResult] = useState<any>(null);
  const [reportResult, setReportResult] = useState<any>(null);

  // Loading and error states stay separate per step so one failure does not
  // make the whole page feel broken.
  const [caseLoading, setCaseLoading] = useState(false);
  const [medLoading, setMedLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [overallLoading, setOverallLoading] = useState(false);

  const [caseError, setCaseError] = useState("");
  const [medError, setMedError] = useState("");
  const [reportError, setReportError] = useState("");

  // The page behaves like a wizard, but we still let the doctor move back
  // and review previous steps.
  const goNext = () => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1));
  const goBack = () => setStepIndex((i) => Math.max(0, i - 1));
  const goTo = (i: number) => setStepIndex(i);

  const resetAll = () => {
    setStepIndex(0);
    setPatientForm({
      patient_name: "",
      age: "",
      gender: "male",
      symptoms: "",
      duration: "",
      severity: "moderate",
      history: "",
      allergies: "",
      medications: "",
    });
    setMedForm({ current: "", proposed: "", allergies: "" });
    setReportText("");
    setReportFile(null);
    setReportUploadInfo(null);
    setCaseResult(null);
    setMedResult(null);
    setReportResult(null);
    setCaseError("");
    setMedError("");
    setReportError("");
  };

  // Step 1 runs the big case-analysis endpoint. It also uses that result to
  // prefill the next medication step where possible.
  const runCaseAndContinue = async () => {
    setCaseError("");
    setCaseLoading(true);
    try {
      const data = await ai.caseAnalysis({
        patient_name: patientForm.patient_name || "Patient",
        age: parseInt(patientForm.age) || 30,
        gender: patientForm.gender,
        symptoms: patientForm.symptoms,
        duration: patientForm.duration,
        severity: patientForm.severity,
        history: patientForm.history,
        allergies: patientForm.allergies,
        medications: patientForm.medications,
      });
      setCaseResult(data);

      // This saves the doctor from typing the same med/allergy info twice.
      setMedForm((prev) => ({
        current: prev.current || patientForm.medications,
        proposed: prev.proposed,
        allergies: prev.allergies || patientForm.allergies,
      }));

      goNext();
    } catch (err: any) {
      setCaseError(err.message || "Failed to analyze case");
    } finally {
      setCaseLoading(false);
    }
  };

  // Step 2 isolates medication/allergy checking so it can be used on its own
  // even when the doctor only wants a quick safety answer.
  const runMedAndContinue = async () => {
    setMedError("");
    setMedLoading(true);
    try {
      const data = await ai.medicationSafety({
        current_medications: medForm.current
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        proposed_medications: medForm.proposed
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        allergies: medForm.allergies
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setMedResult(data);
      goNext();
    } catch (err: any) {
      setMedError(err.message || "Failed to check medication safety");
    } finally {
      setMedLoading(false);
    }
  };

  // Step 3 supports either pasted report text or a real uploaded file.
  // If a file is uploaded, the backend extracts the text first for us.
  const handleFilePick = (file: File | null) => {
    setReportFile(file);
    setReportUploadInfo(null);
    setReportError("");
    setReportResult(null);
  };

  const runReportAndContinue = async () => {
    setReportError("");
    setReportLoading(true);
    try {
      const patientContext = buildPatientContext(patientForm);

      if (reportFile) {
        const data = await ai.reportUpload(reportFile, patientContext);
        setReportUploadInfo({
          filename: data.filename,
          extracted_text: data.extracted_text,
        });
        setReportText(data.extracted_text || "");
        setReportResult(data.analysis);
      } else if (reportText.trim()) {
        const data = await ai.reportAnalysis({
          report_text: reportText,
          patient_context: patientContext,
        });
        setReportResult(data);
      } else {
        setReportError("Paste report text or upload a file first.");
        setReportLoading(false);
        return;
      }

      goNext();
    } catch (err: any) {
      setReportError(err.message || "Failed to analyze report");
    } finally {
      setReportLoading(false);
    }
  };

  // Report analysis is optional, so skipping it should still let the doctor
  // reach the combined summary page.
  const skipReportAndContinue = () => {
    setReportError("");
    setReportResult(null);
    goNext();
  };

  // From the final screen the doctor can refresh the AI outputs without
  // manually stepping through the whole wizard again.
  const rerunAll = async () => {
    setOverallLoading(true);
    try {
      await Promise.all([
        (async () => {
          try {
            const data = await ai.caseAnalysis({
              patient_name: patientForm.patient_name || "Patient",
              age: parseInt(patientForm.age) || 30,
              gender: patientForm.gender,
              symptoms: patientForm.symptoms,
              duration: patientForm.duration,
              severity: patientForm.severity,
              history: patientForm.history,
              allergies: patientForm.allergies,
              medications: patientForm.medications,
            });
            setCaseResult(data);
          } catch {
            /* If re-run fails, keep the previous successful result instead of blanking the screen. */
          }
        })(),
        (async () => {
          try {
            const data = await ai.medicationSafety({
              current_medications: medForm.current
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
              proposed_medications: medForm.proposed
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
              allergies: medForm.allergies
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            });
            setMedResult(data);
          } catch {
            /* Same idea here: better to keep older data than show nothing. */
          }
        })(),
      ]);
    } finally {
      setOverallLoading(false);
    }
  };

  // These flags control when each step has enough data to be worth running.
  const canRunCase = patientForm.symptoms.trim().length > 0;
  const canRunMed = medForm.proposed.trim().length > 0;
  const canRunReport = !!reportFile || reportText.trim().length > 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary flex items-center gap-2">
            <Brain className="text-primary" size={28} />
            AI Clinical Assistant
          </h1>
          <p className="text-muted mt-1 text-sm">
            Step-by-step decision support. Not a substitute for clinical judgment.
          </p>
        </div>
        <button
          onClick={resetAll}
          className="text-xs text-muted hover:text-primary inline-flex items-center gap-1"
        >
          <RefreshCw size={14} />
          Start over
        </button>
      </div>

      {/* The stepper shows progress and also lets the doctor revisit finished steps. */}
      <Stepper stepIndex={stepIndex} goTo={goTo} />

      {/* Only one step body is visible at a time, but each one keeps its own state. */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mt-6">
        {currentStep === "patient" && (
          <PatientStep
            form={patientForm}
            setForm={setPatientForm}
            onContinue={runCaseAndContinue}
            loading={caseLoading}
            canContinue={canRunCase}
            error={caseError}
          />
        )}
        {currentStep === "medication" && (
          <MedicationStep
            form={medForm}
            setForm={setMedForm}
            onContinue={runMedAndContinue}
            onBack={goBack}
            loading={medLoading}
            canContinue={canRunMed}
            error={medError}
          />
        )}
        {currentStep === "report" && (
          <ReportStep
            reportText={reportText}
            setReportText={setReportText}
            reportFile={reportFile}
            handleFilePick={handleFilePick}
            uploadInfo={reportUploadInfo}
            onContinue={runReportAndContinue}
            onSkip={skipReportAndContinue}
            onBack={goBack}
            loading={reportLoading}
            canContinue={canRunReport}
            error={reportError}
          />
        )}
        {currentStep === "overall" && (
          <OverallStep
            patient={patientForm}
            caseResult={caseResult}
            medResult={medResult}
            reportResult={reportResult}
            onBack={goBack}
            onRerun={rerunAll}
            rerunning={overallLoading}
            onReset={resetAll}
          />
        )}
      </div>
    </div>
  );
}

// The stepper is separated out so the main page component does not become
// impossible to read.
function Stepper({
  stepIndex,
  goTo,
}: {
  stepIndex: number;
  goTo: (i: number) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <ol className="grid grid-cols-1 md:grid-cols-4 gap-2">
        {STEPS.map((s, i) => {
          const isActive = i === stepIndex;
          const isDone = i < stepIndex;
          const Icon = s.icon;
          const clickable = i <= stepIndex;
          return (
            <li key={s.key}>
              <button
                onClick={() => clickable && goTo(i)}
                disabled={!clickable}
                className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  isActive
                    ? "border-primary bg-primary/5"
                    : isDone
                    ? "border-green-200 bg-green-50/50 hover:bg-green-50"
                    : "border-gray-100 bg-gray-50/50"
                } ${clickable ? "cursor-pointer" : "cursor-not-allowed opacity-70"}`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isActive
                      ? "bg-primary text-white"
                      : isDone
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isDone ? <Check size={16} /> : <Icon size={16} />}
                </div>
                <div className="min-w-0">
                  <div
                    className={`text-sm font-semibold truncate ${
                      isActive ? "text-primary" : "text-secondary"
                    }`}
                  >
                    {i + 1}. {s.title}
                  </div>
                  <div className="text-xs text-muted truncate">
                    {s.description}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// Step 1 is where we collect the context the AI needs to reason about the case.
function PatientStep({
  form,
  setForm,
  onContinue,
  loading,
  canContinue,
  error,
}: {
  form: PatientForm;
  setForm: (f: PatientForm) => void;
  onContinue: () => void;
  loading: boolean;
  canContinue: boolean;
  error: string;
}) {
  const update = (k: keyof PatientForm, v: string) =>
    setForm({ ...form, [k]: v });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-secondary">
          Patient Information
        </h2>
        <p className="text-sm text-muted">
          Enter the patient details and chief complaint. The AI will analyze
          this case in the background as you continue.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Patient Name">
          <input
            value={form.patient_name}
            onChange={(e) => update("patient_name", e.target.value)}
            className={inputCls}
            placeholder="Jane Doe"
          />
        </Field>
        <Field label="Age">
          <input
            type="number"
            value={form.age}
            onChange={(e) => update("age", e.target.value)}
            className={inputCls}
            placeholder="45"
          />
        </Field>
        <Field label="Gender">
          <select
            value={form.gender}
            onChange={(e) => update("gender", e.target.value)}
            className={inputCls}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Severity">
          <select
            value={form.severity}
            onChange={(e) => update("severity", e.target.value)}
            className={inputCls}
          >
            <option value="mild">Mild</option>
            <option value="moderate">Moderate</option>
            <option value="severe">Severe</option>
          </select>
        </Field>
      </div>

      <Field label="Symptoms (chief complaint)" required>
        <textarea
          value={form.symptoms}
          onChange={(e) => update("symptoms", e.target.value)}
          rows={3}
          className={inputCls}
          placeholder="e.g. Chest pain radiating to left arm, shortness of breath, sweating"
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Duration">
          <input
            value={form.duration}
            onChange={(e) => update("duration", e.target.value)}
            className={inputCls}
            placeholder="e.g. 3 days"
          />
        </Field>
        <Field label="Medical History">
          <input
            value={form.history}
            onChange={(e) => update("history", e.target.value)}
            className={inputCls}
            placeholder="Hypertension, diabetes..."
          />
        </Field>
        <Field label="Known Allergies">
          <input
            value={form.allergies}
            onChange={(e) => update("allergies", e.target.value)}
            className={inputCls}
            placeholder="Penicillin, latex..."
          />
        </Field>
        <Field label="Current Medications">
          <input
            value={form.medications}
            onChange={(e) => update("medications", e.target.value)}
            className={inputCls}
            placeholder="warfarin, lisinopril"
          />
        </Field>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="flex justify-end pt-2">
        <button
          onClick={onContinue}
          disabled={loading || !canContinue}
          className={primaryBtn}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <ArrowRight size={16} />
          )}
          {loading ? "Analyzing..." : "Continue"}
        </button>
      </div>
    </div>
  );
}

// ===========================================================================
// Step 2 — Medication Safety
// ===========================================================================
function MedicationStep({
  form,
  setForm,
  onContinue,
  onBack,
  loading,
  canContinue,
  error,
}: {
  form: MedForm;
  setForm: (f: MedForm) => void;
  onContinue: () => void;
  onBack: () => void;
  loading: boolean;
  canContinue: boolean;
  error: string;
}) {
  const update = (k: keyof MedForm, v: string) => setForm({ ...form, [k]: v });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-secondary">
          Medication Safety
        </h2>
        <p className="text-sm text-muted">
          Check for interactions and allergy conflicts before prescribing.
          Separate medications with commas.
        </p>
      </div>

      <Field label="Current Medications">
        <textarea
          value={form.current}
          onChange={(e) => update("current", e.target.value)}
          rows={2}
          className={inputCls}
          placeholder="warfarin, lisinopril, metformin"
        />
      </Field>

      <Field label="Proposed Medications" required>
        <textarea
          value={form.proposed}
          onChange={(e) => update("proposed", e.target.value)}
          rows={2}
          className={inputCls}
          placeholder="aspirin, ibuprofen"
        />
      </Field>

      <Field label="Known Allergies">
        <input
          value={form.allergies}
          onChange={(e) => update("allergies", e.target.value)}
          className={inputCls}
          placeholder="penicillin, sulfa"
        />
      </Field>

      {error && <ErrorBanner message={error} />}

      <div className="flex justify-between pt-2">
        <button onClick={onBack} className={secondaryBtn} disabled={loading}>
          <ArrowLeft size={16} />
          Back
        </button>
        <button
          onClick={onContinue}
          disabled={loading || !canContinue}
          className={primaryBtn}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <ArrowRight size={16} />
          )}
          {loading ? "Checking..." : "Continue"}
        </button>
      </div>
    </div>
  );
}

// ===========================================================================
// Step 3 — Report Analysis (text or file upload)
// ===========================================================================
function ReportStep({
  reportText,
  setReportText,
  reportFile,
  handleFilePick,
  uploadInfo,
  onContinue,
  onSkip,
  onBack,
  loading,
  canContinue,
  error,
}: {
  reportText: string;
  setReportText: (s: string) => void;
  reportFile: File | null;
  handleFilePick: (f: File | null) => void;
  uploadInfo: { filename: string; extracted_text: string } | null;
  onContinue: () => void;
  onSkip: () => void;
  onBack: () => void;
  loading: boolean;
  canContinue: boolean;
  error: string;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-secondary">
          Report Analysis
        </h2>
        <p className="text-sm text-muted">
          Upload a lab report (PDF, Word, or image) or paste the text directly.
          The AI will extract values and flag abnormal results.
        </p>
      </div>

      {/* File upload zone */}
      <label
        htmlFor="report-file"
        className="block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
      >
        <input
          id="report-file"
          type="file"
          accept=".pdf,.doc,.docx,.txt,image/*"
          className="hidden"
          onChange={(e) => handleFilePick(e.target.files?.[0] || null)}
        />
        {reportFile ? (
          <div className="flex items-center justify-center gap-3 text-secondary">
            <FileText className="text-primary" size={20} />
            <span className="font-medium text-sm">{reportFile.name}</span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleFilePick(null);
              }}
              className="text-muted hover:text-red-500"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="text-muted">
            <Upload size={28} className="mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-medium text-secondary">
              Click to upload a report
            </p>
            <p className="text-xs mt-1">PDF, Word, TXT or image</p>
          </div>
        )}
      </label>

      <div className="flex items-center gap-3 text-xs text-muted">
        <div className="flex-1 h-px bg-gray-100" />
        <span>or paste text manually</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      <Field label="Report Text">
        <textarea
          value={reportText}
          onChange={(e) => {
            setReportText(e.target.value);
          }}
          rows={8}
          className={`${inputCls} font-mono text-xs`}
          placeholder={`Hemoglobin: 10.2 g/dL\nWBC: 12,500 /uL\nGlucose: 250 mg/dL\nCreatinine: 2.1 mg/dL`}
          disabled={!!reportFile}
        />
      </Field>

      {uploadInfo && (
        <div className="text-xs text-muted bg-gray-50 rounded-lg p-3">
          Extracted from <span className="font-medium">{uploadInfo.filename}</span>
        </div>
      )}

      {error && <ErrorBanner message={error} />}

      <div className="flex justify-between pt-2 gap-3 flex-wrap">
        <button onClick={onBack} className={secondaryBtn} disabled={loading}>
          <ArrowLeft size={16} />
          Back
        </button>
        <div className="flex gap-2">
          <button
            onClick={onSkip}
            className={secondaryBtn}
            disabled={loading}
          >
            Skip
          </button>
          <button
            onClick={onContinue}
            disabled={loading || !canContinue}
            className={primaryBtn}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ArrowRight size={16} />
            )}
            {loading ? "Analyzing..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// Step 4 — Overall Analysis
// ===========================================================================
function OverallStep({
  patient,
  caseResult,
  medResult,
  reportResult,
  onBack,
  onRerun,
  rerunning,
  onReset,
}: {
  patient: PatientForm;
  caseResult: any;
  medResult: any;
  reportResult: any;
  onBack: () => void;
  onRerun: () => void;
  rerunning: boolean;
  onReset: () => void;
}) {
  const overall = useMemo(
    () => buildOverall(caseResult, medResult, reportResult),
    [caseResult, medResult, reportResult]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-secondary flex items-center gap-2">
            <Layers className="text-primary" size={20} />
            Overall Analysis
          </h2>
          <p className="text-sm text-muted">
            Combined view of all AI agents for{" "}
            <span className="font-medium text-secondary">
              {patient.patient_name || "this patient"}
            </span>
            {patient.age && `, age ${patient.age}`}.
          </p>
        </div>
        <button
          onClick={onRerun}
          disabled={rerunning}
          className={secondaryBtn}
        >
          {rerunning ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          Re-run all
        </button>
      </div>

      {/* Top-line risk banner */}
      <div
        className={`p-4 rounded-xl border ${riskBannerCls(overall.overallRisk)}`}
      >
        <div className="flex items-center gap-3">
          <AlertTriangle size={22} />
          <div>
            <div className="text-xs uppercase tracking-wide opacity-70">
              Overall risk
            </div>
            <div className="text-lg font-semibold">
              {overall.overallRisk.toUpperCase()}
            </div>
          </div>
        </div>
        {overall.headline && (
          <p className="text-sm mt-3">{overall.headline}</p>
        )}
      </div>

      {/* Three-column summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          icon={<Zap size={16} />}
          title="Case Analysis"
          empty={!caseResult}
        >
          {caseResult && (
            <>
              <RiskPill level={caseResult.risk_level} />
              <p className="text-xs text-gray-700 mt-2 line-clamp-4">
                {caseResult.summary}
              </p>
            </>
          )}
        </SummaryCard>

        <SummaryCard
          icon={<Shield size={16} />}
          title="Medication Safety"
          empty={!medResult}
        >
          {medResult && (
            <>
              <span
                className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                  medResult.safe
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {medResult.safe ? "Safe" : "Concerns found"}
              </span>
              <p className="text-xs text-gray-700 mt-2">
                {medResult.alerts?.length || 0} alert(s),{" "}
                {medResult.recommendations?.length || 0} recommendation(s)
              </p>
            </>
          )}
        </SummaryCard>

        <SummaryCard
          icon={<FileText size={16} />}
          title="Report Analysis"
          empty={!reportResult}
        >
          {reportResult && (
            <>
              <span
                className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                  (reportResult.abnormal_values?.length || 0) > 0
                    ? "bg-amber-100 text-amber-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {reportResult.abnormal_values?.length || 0} abnormal
              </span>
              <p className="text-xs text-gray-700 mt-2 line-clamp-4">
                {reportResult.summary}
              </p>
            </>
          )}
        </SummaryCard>
      </div>

      {/* Combined alerts */}
      {overall.alerts.length > 0 && (
        <Section title="Safety Alerts" icon={<AlertTriangle size={16} />} tone="amber">
          <ul className="space-y-2">
            {overall.alerts.map((a, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-amber-800"
              >
                <span className="text-amber-500 mt-0.5">•</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Combined recommendations */}
      {overall.recommendations.length > 0 && (
        <Section title="Recommendations" icon={<Check size={16} />} tone="primary">
          <ol className="space-y-2">
            {overall.recommendations.map((r, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-gray-700"
              >
                <span className="bg-primary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span>{r}</span>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* Abnormal values table */}
      {reportResult?.abnormal_values?.length > 0 && (
        <Section title="Abnormal Lab Values" icon={<FileText size={16} />} tone="red">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted border-b border-gray-100">
                  <th className="py-2 pr-4">Parameter</th>
                  <th className="py-2 pr-4">Value</th>
                  <th className="py-2 pr-4">Reference</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {reportResult.abnormal_values.map((v: any, i: number) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2 pr-4 font-medium text-secondary">
                      {v.parameter}
                    </td>
                    <td className="py-2 pr-4">
                      {v.value} {v.unit}
                    </td>
                    <td className="py-2 pr-4 text-muted">
                      {v.reference_range}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          v.status === "high"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {v.status?.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      <div className="flex justify-between pt-2 gap-3 flex-wrap">
        <button onClick={onBack} className={secondaryBtn}>
          <ArrowLeft size={16} />
          Back
        </button>
        <button onClick={onReset} className={primaryBtn}>
          <RefreshCw size={16} />
          New Patient
        </button>
      </div>

      <p className="text-xs text-muted border-t border-gray-100 pt-3">
        Disclaimer: This AI tool provides decision support only. Always exercise
        independent clinical judgment.
      </p>
    </div>
  );
}

// ===========================================================================
// Helpers
// ===========================================================================
function buildPatientContext(p: PatientForm): string {
  const parts = [];
  if (p.age) parts.push(`age ${p.age}`);
  if (p.gender) parts.push(p.gender);
  if (p.symptoms) parts.push(`symptoms: ${p.symptoms}`);
  if (p.history) parts.push(`history: ${p.history}`);
  return parts.join("; ");
}

function buildOverall(
  caseResult: any,
  medResult: any,
  reportResult: any
): {
  overallRisk: "low" | "moderate" | "high" | "critical";
  headline: string;
  alerts: string[];
  recommendations: string[];
} {
  const riskOrder = ["low", "moderate", "high", "critical"];
  let risk = "low";

  if (caseResult?.risk_level && riskOrder.includes(caseResult.risk_level)) {
    if (riskOrder.indexOf(caseResult.risk_level) > riskOrder.indexOf(risk)) {
      risk = caseResult.risk_level;
    }
  }
  if (medResult && medResult.safe === false) {
    if (riskOrder.indexOf("high") > riskOrder.indexOf(risk)) risk = "high";
  }
  if ((reportResult?.abnormal_values?.length || 0) > 0) {
    if (riskOrder.indexOf("moderate") > riskOrder.indexOf(risk))
      risk = "moderate";
  }

  const alerts: string[] = [];
  (caseResult?.safety_alerts || []).forEach((a: string) => alerts.push(a));
  (medResult?.alerts || []).forEach((a: any) => {
    const txt = a.description || a.message || a.type;
    if (txt) alerts.push(`${a.type ? a.type + ": " : ""}${a.description || a.message || ""}`.trim());
  });
  (reportResult?.abnormal_values || []).forEach((v: any) => {
    alerts.push(
      `${v.parameter} ${v.status === "high" ? "elevated" : "low"} at ${v.value} ${v.unit}`
    );
  });

  const recommendations: string[] = [];
  (caseResult?.suggestions || []).slice(0, 5).forEach((r: string) =>
    recommendations.push(r)
  );
  (medResult?.recommendations || []).slice(0, 5).forEach((r: string) =>
    recommendations.push(r)
  );
  (reportResult?.recommendations || []).slice(0, 5).forEach((r: string) =>
    recommendations.push(r)
  );

  const headlineParts = [];
  if (caseResult?.summary) headlineParts.push(caseResult.summary);
  if (reportResult?.summary) headlineParts.push(reportResult.summary);
  const headline = headlineParts.join(" ");

  return {
    overallRisk: risk as any,
    headline,
    alerts: dedupe(alerts).slice(0, 10),
    recommendations: dedupe(recommendations).slice(0, 12),
  };
}

function dedupe(arr: string[]): string[] {
  const seen = new Set<string>();
  return arr.filter((x) => {
    const key = x.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ===========================================================================
// Small presentational helpers
// ===========================================================================
const inputCls =
  "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-gray-50 disabled:text-gray-400";

const primaryBtn =
  "inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

const secondaryBtn =
  "inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-secondary mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
      {message}
    </div>
  );
}

function SummaryCard({
  icon,
  title,
  empty,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/40">
      <div className="flex items-center gap-2 text-secondary text-sm font-semibold mb-2">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      {empty ? (
        <p className="text-xs text-muted">Not run.</p>
      ) : (
        children
      )}
    </div>
  );
}

function Section({
  title,
  icon,
  tone,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  tone: "amber" | "primary" | "red";
  children: React.ReactNode;
}) {
  const toneCls =
    tone === "amber"
      ? "border-amber-200 bg-amber-50/40"
      : tone === "red"
      ? "border-red-200 bg-red-50/40"
      : "border-gray-100 bg-white";
  const titleCls =
    tone === "amber"
      ? "text-amber-700"
      : tone === "red"
      ? "text-red-700"
      : "text-secondary";
  return (
    <div className={`border rounded-xl p-4 ${toneCls}`}>
      <div className={`flex items-center gap-2 text-sm font-semibold mb-3 ${titleCls}`}>
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function RiskPill({ level }: { level: string }) {
  const cls =
    level === "critical"
      ? "bg-red-100 text-red-700"
      : level === "high"
      ? "bg-amber-100 text-amber-700"
      : level === "moderate"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-green-100 text-green-700";
  return (
    <span
      className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}
    >
      {(level || "low").toUpperCase()}
    </span>
  );
}

function riskBannerCls(level: string): string {
  switch (level) {
    case "critical":
      return "bg-red-50 border-red-200 text-red-800";
    case "high":
      return "bg-amber-50 border-amber-200 text-amber-800";
    case "moderate":
      return "bg-yellow-50 border-yellow-200 text-yellow-800";
    default:
      return "bg-green-50 border-green-200 text-green-800";
  }
}
