"use client";

import { useState } from "react";
import { Brain, AlertTriangle, CheckCircle, Shield } from "lucide-react";
import Badge from "@/components/ui/Badge";

const patient = { name: "Sardor Umarov", age: 36, gender: "Male", symptoms: "Chest pain radiating to left arm", severity: "severe", allergies: "Penicillin", medications: "None" };

const analysisResult = {
  summary: "Intake summary for Sardor Umarov, age 36. Presents with: chest pain radiating to left arm, shortness of breath (duration: 2 days, severity: severe). No known medications. Known allergy: Penicillin. Surgical history: Appendectomy 2015. ATTENTION: 2 urgency indicator(s) detected. Review flagged items before proceeding.",
  facts: { "Patient": "Sardor Umarov", "Age": "36", "Gender": "Male", "Chief Complaint": "Chest pain radiating to left arm", "Duration": "2 days", "Severity": "Severe", "Allergies": "Penicillin", "Current Medications": "None", "Surgical History": "Appendectomy 2015" },
  risk_level: "high",
  alerts: [
    "Chest pain may indicate acute coronary syndrome",
    "High severity rating reported: severe",
    "Acute onset reported — lower threshold for escalation",
  ],
  suggestions: [
    "12-lead ECG",
    "Troponin I/T (serial if initial is negative)",
    "Complete blood count (CBC)",
    "Basic metabolic panel (BMP)",
    "Chest X-ray",
    "Cardiology consultation",
    "Repeat troponin at 3 and 6 hours",
    "Stress test or coronary CT angiography for intermediate risk",
  ],
  triage_notes: "Triage risk score: 7 -> urgency 'critical'. 3 red flag(s) identified. Patient-reported severity is high.\n\nSuggested questions: Is the chest pain exertional or at rest?; Does the pain radiate to the arm, jaw, or back?; Any associated shortness of breath, diaphoresis, or nausea?",
};

const riskColors: Record<string, string> = { low: "bg-green-100 text-green-700", medium: "bg-amber-100 text-amber-700", high: "bg-red-100 text-red-700", critical: "bg-red-200 text-red-800" };

export default function AICasePage() {
  const [analyzed, setAnalyzed] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-secondary mb-2">AI Case Analysis</h1>
      <p className="text-muted mb-6">AI-powered clinical decision support for this patient</p>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-secondary mb-3">Patient Context</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries({ Name: patient.name, Age: `${patient.age}y`, Gender: patient.gender, Severity: patient.severity }).map(([k, v]) => (
            <div key={k}><p className="text-xs text-muted uppercase">{k}</p><p className="text-sm font-medium text-secondary">{v}</p></div>
          ))}
        </div>
      </div>

      {!analyzed ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
          <Brain size={64} className="text-gray-200 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-secondary mb-3">Ready to Analyze</h3>
          <p className="text-muted mb-8 max-w-md mx-auto">Run all AI agents (intake summary, risk triage, medication safety, guideline support) to generate a comprehensive analysis.</p>
          <button onClick={() => setAnalyzed(true)} className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark">Run Analysis</button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-secondary mb-3">Summary</h3>
            <p className="text-sm text-muted leading-relaxed bg-gray-50 p-4 rounded-lg">{analysisResult.summary}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-secondary mb-3">Extracted Facts</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(analysisResult.facts).map(([k, v]) => (
                <div key={k} className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-muted uppercase mb-1">{k}</p><p className="text-sm font-medium text-secondary">{v}</p></div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-secondary mb-3">Risk Level</h3>
            <span className={`inline-block px-6 py-3 rounded-xl text-lg font-bold ${riskColors[analysisResult.risk_level]}`}>
              {analysisResult.risk_level.toUpperCase()}
            </span>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-secondary mb-3 flex items-center gap-2"><AlertTriangle size={18} className="text-red-500" /> Safety Alerts</h3>
            <div className="space-y-2">
              {analysisResult.alerts.map((a, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                  <Shield size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{a}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-secondary mb-3">Suggestions</h3>
            <ol className="space-y-2">
              {analysisResult.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-sm"><span className="w-6 h-6 rounded-full bg-teal-50 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span><span className="text-muted">{s}</span></li>
              ))}
            </ol>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-secondary mb-3">Triage Notes</h3>
            <pre className="text-sm text-muted bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">{analysisResult.triage_notes}</pre>
          </div>

          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-sm text-amber-800">AI-generated insights for clinical decision support only. All findings require doctor review and approval before any clinical action is taken.</p>
          </div>

          {!saved ? (
            <button onClick={() => setSaved(true)} className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center gap-2"><CheckCircle size={18} /> Confirm & Save Analysis</button>
          ) : (
            <div className="p-4 bg-green-50 rounded-xl border border-green-200 text-green-700 font-semibold flex items-center gap-2"><CheckCircle size={18} /> Analysis confirmed and saved</div>
          )}
        </div>
      )}
    </div>
  );
}
