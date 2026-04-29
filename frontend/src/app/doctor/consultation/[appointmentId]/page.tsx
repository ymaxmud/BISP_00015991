"use client";

/**
 * Doctor consultation workspace (route: `/doctor/consultation/[appointmentId]`).
 *
 * The screen a doctor opens when seeing a patient. Three tabs:
 *
 *   1. Notes — assessment + plan textareas, doctor's free-text record.
 *   2. Prescriptions — quick form to add medications to the visit.
 *   3. AI Assistant — calls /api/ai/case-analysis with the patient
 *      context and renders the LLM's risk assessment, alerts, and
 *      suggestions. This is the headline AI feature.
 *
 * The patient summary is loaded from the appointment/intake data for this
 * visit. If something was not recorded, we show that plainly.
 */

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  Brain,
  FileText,
  Pill,
  Save,
  CheckCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import {
  ai,
  ApiRecord,
  AppointmentRecord,
  CaseAnalysisRecord,
  appointments,
  intake,
} from "@/lib/api";

const RISK_BADGE: Record<string, "danger" | "warning" | "info" | "success"> = {
  critical: "danger",
  high: "danger",
  moderate: "warning",
  low: "info",
};

export default function ConsultationPage() {
  const params = useParams<{ appointmentId: string }>();
  const appointmentId = Number(params.appointmentId);
  const [tab, setTab] = useState<"notes" | "prescriptions" | "ai">("notes");
  const [appointment, setAppointment] = useState<AppointmentRecord | null>(null);
  const [intakeForm, setIntakeForm] = useState<ApiRecord | null>(null);
  const [loadingContext, setLoadingContext] = useState(true);
  const [contextError, setContextError] = useState("");
  const [notes, setNotes] = useState({ assessment: "", plan: "" });
  const [meds, setMeds] = useState<
    { name: string; dosage: string; schedule: string; days: string }[]
  >([]);
  const [medForm, setMedForm] = useState({
    name: "",
    dosage: "",
    schedule: "",
    days: "",
  });

  // AI state
  const [aiResult, setAiResult] = useState<CaseAnalysisRecord | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadContext() {
      // The URL gives us the appointment id; this loads the visit details.
      setLoadingContext(true);
      setContextError("");
      try {
        const [appointmentData, intakeData] = await Promise.all([
          appointments.get(appointmentId),
          intake.get(appointmentId).catch(() => []),
        ]);
        if (!active) return;
        setAppointment(appointmentData);
        setIntakeForm(intakeData[0] || null);
      } catch (err: unknown) {
        if (active) {
          setContextError(err instanceof Error ? err.message : "Could not load appointment context.");
        }
      } finally {
        if (active) setLoadingContext(false);
      }
    }
    if (Number.isFinite(appointmentId)) void loadContext();
    return () => {
      active = false;
    };
  }, [appointmentId]);

  const patientContext = useMemo(() => {
    // One small object for the page to read from. Missing fields stay obvious.
    const symptoms = String(intakeForm?.symptoms || appointment?.reason || "").trim();
    const severity = String(intakeForm?.severity || "").trim();
    return {
      name: appointment?.patient_name || "Patient",
      complaint: symptoms || "No complaint recorded",
      duration: String(intakeForm?.duration || "Not recorded"),
      severity: severity || "not recorded",
      allergies: String(intakeForm?.allergies_text || "").trim(),
      medications: String(intakeForm?.medications_text || "").trim(),
      history: String(intakeForm?.history_text || "").trim(),
    };
  }, [appointment, intakeForm]);

  const patientInitials = patientContext.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "P";

  const addMed = () => {
    // Local draft for this screen. Saving prescriptions can be wired here later.
    if (!medForm.name) return;
    setMeds([...meds, medForm]);
    setMedForm({ name: "", dosage: "", schedule: "", days: "" });
  };

  const runAnalysis = async () => {
    // Run AI only after the appointment has loaded.
    if (!appointment) {
      setAiError("Load a real appointment before running AI analysis.");
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await ai.caseAnalysis({
        patient_name: patientContext.name,
        symptoms: patientContext.complaint,
        duration: patientContext.duration,
        severity: patientContext.severity,
        history: patientContext.history,
        allergies: patientContext.allergies,
        medications: patientContext.medications,
      });
      setAiResult(result);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAiLoading(false);
    }
  };

  const tabs = [
    { key: "notes", label: "Notes", icon: <FileText size={16} /> },
    { key: "prescriptions", label: "Prescriptions", icon: <Pill size={16} /> },
    { key: "ai", label: "AI Assistant", icon: <Brain size={16} /> },
  ] as const;

  // The AI service returns risk_level as a string like "high" / "moderate".
  // Map to a Badge variant for color, defaulting to info if it's missing.
  const riskVariant: "danger" | "warning" | "info" | "success" =
    (aiResult && RISK_BADGE[String(aiResult.risk_level).toLowerCase()]) || "info";

  return (
    <div>
      {/* Patient header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 flex items-center justify-between pl-12 md:pl-0">
        <div className="flex items-center gap-4 pl-3 md:pl-3">
          <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center font-bold text-primary">
            {patientInitials}
          </div>
          <div>
            <h1 className="font-bold text-secondary">{patientContext.name}</h1>
            <p className="text-sm text-muted">
              {/* Intake complaint wins; appointment reason is the fallback. */}
              {loadingContext ? "Loading appointment context..." : patientContext.complaint}
            </p>
            {contextError && <p className="text-xs text-amber-600 mt-1">{contextError}</p>}
          </div>
        </div>
        {patientContext.severity !== "not recorded" && (
          <Badge variant={patientContext.severity === "critical" || patientContext.severity === "severe" ? "danger" : "warning"}>
            {patientContext.severity}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Patient summary */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-secondary">Patient Summary</h2>
          <div>
            <p className="text-xs text-muted uppercase mb-1">Chief Complaint</p>
            <p className="text-sm text-secondary">{patientContext.complaint}</p>
          </div>
          <div className="flex gap-4">
            <div>
              <p className="text-xs text-muted uppercase mb-1">Duration</p>
              <p className="text-sm">{patientContext.duration}</p>
            </div>
            <div>
              <p className="text-xs text-muted uppercase mb-1">Severity</p>
              <Badge variant={patientContext.severity === "not recorded" ? "default" : "warning"} size="sm">
                {patientContext.severity}
              </Badge>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted uppercase mb-1">Allergies</p>
            <div className="flex gap-1 flex-wrap">
              {patientContext.allergies ? patientContext.allergies.split(",").map((a) => (
                <span
                  key={a}
                  className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-md font-medium"
                >
                  {a.trim()}
                </span>
              )) : <span className="text-sm text-muted">Not recorded</span>}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted uppercase mb-1">
              Current Medications
            </p>
            <p className="text-sm text-secondary">
              {patientContext.medications || "Not recorded"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted uppercase mb-1">Medical History</p>
            <p className="text-sm text-secondary">{patientContext.history || "Not recorded"}</p>
          </div>
        </div>

        {/* Right: Workspace */}
        <div className="lg:col-span-2">
          <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center ${
                  tab === t.key
                    ? "bg-white text-primary shadow-sm"
                    : "text-muted hover:text-secondary"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            {tab === "notes" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">
                    Assessment
                  </label>
                  <textarea
                    value={notes.assessment}
                    onChange={(e) =>
                      setNotes({ ...notes, assessment: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-primary"
                    placeholder="Clinical assessment..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">
                    Plan
                  </label>
                  <textarea
                    value={notes.plan}
                    onChange={(e) =>
                      setNotes({ ...notes, plan: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-primary"
                    placeholder="Treatment plan..."
                  />
                </div>
                <button className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium flex items-center gap-2">
                  <Save size={16} /> Save Notes
                </button>
              </div>
            )}

            {tab === "prescriptions" && (
              <div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <input
                    value={medForm.name}
                    onChange={(e) =>
                      setMedForm({ ...medForm, name: e.target.value })
                    }
                    placeholder="Medication name"
                    className="px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-primary text-sm"
                  />
                  <input
                    value={medForm.dosage}
                    onChange={(e) =>
                      setMedForm({ ...medForm, dosage: e.target.value })
                    }
                    placeholder="Dosage"
                    className="px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-primary text-sm"
                  />
                  <input
                    value={medForm.schedule}
                    onChange={(e) =>
                      setMedForm({ ...medForm, schedule: e.target.value })
                    }
                    placeholder="Schedule"
                    className="px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-primary text-sm"
                  />
                  <input
                    type="number"
                    value={medForm.days}
                    onChange={(e) =>
                      setMedForm({ ...medForm, days: e.target.value })
                    }
                    placeholder="Days"
                    className="px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-primary text-sm"
                  />
                </div>
                <button
                  onClick={addMed}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark mb-6"
                >
                  Add Medication
                </button>
                {meds.length > 0 ? (
                  <div className="space-y-2">
                    {meds.map((m, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <span className="font-medium text-sm">{m.name}</span>
                          <span className="text-sm text-muted ml-2">
                            {m.dosage} · {m.schedule}
                            {m.days ? ` · ${m.days}d` : ""}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted text-center py-8">
                    No medications added yet
                  </p>
                )}
              </div>
            )}

            {tab === "ai" && (
              <div>
                {/* Three states: empty, loading/error, results. */}
                {!aiResult && !aiLoading && (
                  <div className="text-center py-12">
                    <Brain size={48} className="text-gray-200 mx-auto mb-4" />
                    <h3 className="font-semibold text-secondary mb-2">
                      AI Case Analysis
                    </h3>
                    <p className="text-sm text-muted mb-6 max-w-md mx-auto">
                      Run AI analysis on this patient&apos;s case to get a risk
                      assessment, safety alerts, and clinical suggestions
                      grounded in their symptoms and history.
                    </p>
                    {aiError && (
                      <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 max-w-md mx-auto mb-4">
                        {aiError}
                      </p>
                    )}
                    <button
                      onClick={runAnalysis}
                      className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark"
                    >
                      Analyze Case
                    </button>
                  </div>
                )}

                {aiLoading && (
                  <div className="text-center py-16">
                    <Loader2
                      size={28}
                      className="text-primary animate-spin mx-auto mb-3"
                    />
                    <p className="text-sm text-muted">
                      Avicenna AI is reviewing the case…
                    </p>
                  </div>
                )}

                {aiResult && !aiLoading && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-secondary">
                        Analysis result
                      </h3>
                      <button
                        type="button"
                        onClick={runAnalysis}
                        className="text-sm text-muted hover:text-primary inline-flex items-center gap-1.5"
                      >
                        <RefreshCw size={13} /> Re-run
                      </button>
                    </div>

                    {aiResult.summary && (
                      <div>
                        <h4 className="text-xs font-medium text-muted uppercase tracking-wider mb-1">
                          Summary
                        </h4>
                        <p className="text-sm text-secondary bg-gray-50 p-4 rounded-lg leading-relaxed">
                          {aiResult.summary}
                        </p>
                      </div>
                    )}

                    {aiResult.risk_level && (
                      <div>
                        <h4 className="text-xs font-medium text-muted uppercase tracking-wider mb-1">
                          Risk level
                        </h4>
                        <Badge variant={riskVariant} size="md">
                          {String(aiResult.risk_level).toUpperCase()}
                        </Badge>
                      </div>
                    )}

                    {aiResult.safety_alerts && aiResult.safety_alerts.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                          Safety alerts
                        </h4>
                        <div className="space-y-2">
                          {aiResult.safety_alerts.map((a, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-100"
                            >
                              <AlertTriangle
                                size={16}
                                className="text-red-500 mt-0.5 flex-shrink-0"
                              />
                              <p className="text-sm text-red-700">{a}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {aiResult.suggestions &&
                      aiResult.suggestions.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                            Suggestions
                          </h4>
                          <ol className="space-y-1.5">
                            {aiResult.suggestions.map((s, i) => (
                              <li
                                key={i}
                                className="text-sm text-secondary flex gap-2"
                              >
                                <span className="font-semibold text-primary">
                                  {i + 1}.
                                </span>
                                {s}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <p className="text-xs text-amber-700">
                        AI-generated insights for clinical decision support
                        only. Doctor review and approval required.
                      </p>
                    </div>

                    <button className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center gap-2">
                      <CheckCircle size={16} /> Confirm &amp; Save
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <button className="w-full mt-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
            <CheckCircle size={18} /> Complete Consultation
          </button>
        </div>
      </div>
    </div>
  );
}
