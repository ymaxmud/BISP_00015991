"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Brain,
  AlertTriangle,
  CheckCircle,
  Shield,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { ai, appointments as appointmentsApi, intake as intakeApi } from "@/lib/api";

interface PatientContext {
  patient_name: string;
  age: number;
  gender: string;
  symptoms: string;
  duration: string;
  severity: string;
  history: string;
  allergies: string;
  medications: string;
}

interface CaseAnalysisResult {
  summary: string;
  extracted_facts: Record<string, string>;
  risk_level: string;
  safety_alerts: string[];
  suggestions: string[];
  triage_notes: string;
}

const riskStyles: Record<string, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
  critical: "bg-red-200 text-red-800",
};

const EMPTY_CONTEXT: PatientContext = {
  patient_name: "",
  age: 0,
  gender: "unknown",
  symptoms: "",
  duration: "",
  severity: "moderate",
  history: "",
  allergies: "",
  medications: "",
};

export default function AICasePage() {
  const params = useParams();
  const appointmentIdRaw = params?.appointmentId;
  const appointmentId = Array.isArray(appointmentIdRaw)
    ? appointmentIdRaw[0]
    : appointmentIdRaw;

  const [context, setContext] = useState<PatientContext>(EMPTY_CONTEXT);
  const [loadingContext, setLoadingContext] = useState(true);
  const [contextError, setContextError] = useState<string | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<CaseAnalysisResult | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  /* --- load patient context from appointment + intake ------------ */
  const loadContext = useCallback(async () => {
    if (!appointmentId) return;
    setLoadingContext(true);
    setContextError(null);
    try {
      const id = Number(appointmentId);
      const allAppointments = await appointmentsApi.list().catch(() => []);
      const list = Array.isArray(allAppointments) ? allAppointments : [];
      const appt = list.find((a: any) => Number(a?.id) === id);

      let intakeForm: any = null;
      try {
        const intakeRes = await intakeApi.get(id);
        if (Array.isArray(intakeRes) && intakeRes.length > 0) {
          intakeForm = intakeRes[0];
        } else if (intakeRes?.results?.length) {
          intakeForm = intakeRes.results[0];
        } else if (intakeRes && !Array.isArray(intakeRes)) {
          intakeForm = intakeRes;
        }
      } catch {
        intakeForm = null;
      }

      setContext({
        patient_name:
          appt?.patient_name ||
          appt?.patient_profile_detail?.user?.first_name ||
          `Patient #${appt?.patient_profile ?? "—"}`,
        age: Number(appt?.patient_age ?? appt?.age ?? 0) || 0,
        gender: appt?.patient_gender || appt?.gender || "unknown",
        symptoms: intakeForm?.symptoms || appt?.reason || "",
        duration: intakeForm?.duration || "",
        severity: intakeForm?.severity || "moderate",
        history: intakeForm?.history_text || "",
        allergies: intakeForm?.allergies_text || "",
        medications: intakeForm?.medications_text || "",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setContextError(msg);
    } finally {
      setLoadingContext(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    loadContext();
  }, [loadContext]);

  /* --- run the orchestrator -------------------------------------- */
  const runAnalysis = useCallback(async () => {
    setAnalyzing(true);
    setAnalyzeError(null);
    setResult(null);
    try {
      const data = await ai.caseAnalysis({
        patient_name: context.patient_name || "Patient",
        age: context.age || 0,
        gender: context.gender || "unknown",
        symptoms: context.symptoms || "",
        duration: context.duration || "",
        severity: context.severity || "moderate",
        history: context.history || "",
        allergies: context.allergies || "",
        medications: context.medications || "",
      });
      setResult(data as CaseAnalysisResult);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setAnalyzeError(msg);
    } finally {
      setAnalyzing(false);
    }
  }, [context]);

  const contextCards = useMemo(
    () => [
      { label: "Name", value: context.patient_name || "—" },
      { label: "Age", value: context.age ? `${context.age}y` : "—" },
      { label: "Gender", value: context.gender || "—" },
      { label: "Severity", value: context.severity || "—" },
    ],
    [context]
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary mb-2">
            AI Case Analysis
          </h1>
          <p className="text-muted">
            AI-powered clinical decision support for appointment #{appointmentId ?? "—"}
          </p>
        </div>
        <button
          onClick={loadContext}
          disabled={loadingContext}
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-foreground border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loadingContext ? "animate-spin" : ""} />
          Reload context
        </button>
      </div>

      {contextError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
          Couldn&apos;t load patient context: {contextError}
        </div>
      )}

      {/* Patient context */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-secondary mb-3">Patient Context</h2>
        {loadingContext ? (
          <div className="text-center py-4 text-muted text-sm">Loading…</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {contextCards.map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-muted uppercase">{label}</p>
                  <p className="text-sm font-medium text-secondary">{value}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted uppercase mb-1">Symptoms</p>
                <p className="text-secondary">{context.symptoms || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted uppercase mb-1">Duration</p>
                <p className="text-secondary">{context.duration || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted uppercase mb-1">Allergies</p>
                <p className="text-secondary">{context.allergies || "None known"}</p>
              </div>
              <div>
                <p className="text-xs text-muted uppercase mb-1">Current medications</p>
                <p className="text-secondary">{context.medications || "None"}</p>
              </div>
              {context.history && (
                <div className="md:col-span-2">
                  <p className="text-xs text-muted uppercase mb-1">History</p>
                  <p className="text-secondary">{context.history}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {analyzeError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
          {analyzeError}
        </div>
      )}

      {!result ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
          <Brain size={64} className="text-gray-200 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-secondary mb-3">
            Ready to Analyze
          </h3>
          <p className="text-muted mb-8 max-w-md mx-auto">
            Runs intake summary, risk triage, medication safety, and guideline
            support agents to generate a comprehensive analysis.
          </p>
          <button
            onClick={runAnalysis}
            disabled={analyzing || loadingContext || !context.symptoms}
            className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            {analyzing ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Running agents…
              </>
            ) : (
              <>
                <Brain size={18} /> Run Analysis
              </>
            )}
          </button>
          {!context.symptoms && !loadingContext && (
            <p className="text-xs text-muted mt-3">
              Add symptoms (via the intake form) to enable analysis.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-secondary mb-3">Summary</h3>
            <p className="text-sm text-muted leading-relaxed bg-gray-50 p-4 rounded-lg whitespace-pre-line">
              {result.summary}
            </p>
          </div>

          {result.extracted_facts && Object.keys(result.extracted_facts).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-semibold text-secondary mb-3">Extracted Facts</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(result.extracted_facts).map(([k, v]) => (
                  <div key={k} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-muted uppercase mb-1">{k}</p>
                    <p className="text-sm font-medium text-secondary">{String(v)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-secondary mb-3">Risk Level</h3>
            <span
              className={`inline-block px-6 py-3 rounded-xl text-lg font-bold ${
                riskStyles[result.risk_level] ?? "bg-gray-100 text-gray-700"
              }`}
            >
              {(result.risk_level || "unknown").toUpperCase()}
            </span>
          </div>

          {result.safety_alerts && result.safety_alerts.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-semibold text-secondary mb-3 flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-500" />
                Safety Alerts
              </h3>
              <div className="space-y-2">
                {result.safety_alerts.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100"
                  >
                    <Shield size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">{a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.suggestions && result.suggestions.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-semibold text-secondary mb-3">Suggestions</h3>
              <ol className="space-y-2">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="w-6 h-6 rounded-full bg-teal-50 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-muted">{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {result.triage_notes && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-semibold text-secondary mb-3">Triage Notes</h3>
              <pre className="text-sm text-muted bg-gray-50 p-4 rounded-lg whitespace-pre-wrap font-sans">
                {result.triage_notes}
              </pre>
            </div>
          )}

          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-sm text-amber-800">
              AI-generated insights for clinical decision support only. All findings
              require doctor review and approval before any clinical action is taken.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={runAnalysis}
              disabled={analyzing}
              className="px-6 py-3 border border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw size={16} className={analyzing ? "animate-spin" : ""} />
              Re-run
            </button>
            {!saved ? (
              <button
                onClick={() => setSaved(true)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center gap-2"
              >
                <CheckCircle size={18} /> Confirm & Save Analysis
              </button>
            ) : (
              <div className="px-6 py-3 bg-green-50 rounded-xl border border-green-200 text-green-700 font-semibold flex items-center gap-2">
                <CheckCircle size={18} /> Analysis confirmed
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
