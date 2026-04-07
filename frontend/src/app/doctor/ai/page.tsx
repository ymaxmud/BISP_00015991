"use client";

import { useState } from "react";
import { Brain, Zap, Shield, FileText, ArrowRight, Loader2 } from "lucide-react";
import { ai } from "@/lib/api";

export default function DoctorAIPage() {
  const [activeTab, setActiveTab] = useState<"case" | "medication" | "report">("case");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Case analysis form
  const [caseForm, setCaseForm] = useState({
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

  // Medication safety form
  const [medForm, setMedForm] = useState({
    current: "",
    proposed: "",
    allergies: "",
  });

  // Report analysis form
  const [reportText, setReportText] = useState("");

  const runCaseAnalysis = async () => {
    setLoading(true);
    setResult(null);
    try {
      const data = await ai.caseAnalysis({
        patient_name: caseForm.patient_name || "Patient",
        age: parseInt(caseForm.age) || 30,
        gender: caseForm.gender,
        symptoms: caseForm.symptoms,
        duration: caseForm.duration,
        severity: caseForm.severity,
        history: caseForm.history,
        allergies: caseForm.allergies,
        medications: caseForm.medications,
      });
      setResult({ type: "case", data });
    } catch (err: any) {
      setResult({ type: "error", data: err.message });
    }
    setLoading(false);
  };

  const runMedSafety = async () => {
    setLoading(true);
    setResult(null);
    try {
      const data = await ai.medicationSafety({
        current_medications: medForm.current.split(",").map((s) => s.trim()).filter(Boolean),
        proposed_medications: medForm.proposed.split(",").map((s) => s.trim()).filter(Boolean),
        allergies: medForm.allergies.split(",").map((s) => s.trim()).filter(Boolean),
      });
      setResult({ type: "medication", data });
    } catch (err: any) {
      setResult({ type: "error", data: err.message });
    }
    setLoading(false);
  };

  const runReportAnalysis = async () => {
    setLoading(true);
    setResult(null);
    try {
      const data = await ai.reportAnalysis({ report_text: reportText });
      setResult({ type: "report", data });
    } catch (err: any) {
      setResult({ type: "error", data: err.message });
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary flex items-center gap-2">
          <Brain className="text-primary" size={28} />
          AI Clinical Assistant
        </h1>
        <p className="text-muted mt-1">
          Rule-based decision support tools. Not a substitute for clinical judgment.
        </p>
      </div>

      {/* Tool tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-3">
        {[
          { key: "case" as const, label: "Case Analysis", icon: <Zap size={16} /> },
          { key: "medication" as const, label: "Medication Safety", icon: <Shield size={16} /> },
          { key: "report" as const, label: "Report Analysis", icon: <FileText size={16} /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setResult(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input panel */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {activeTab === "case" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-secondary">Patient Information</h3>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Patient Name" value={caseForm.patient_name} onChange={(e) => setCaseForm({ ...caseForm, patient_name: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary" />
                <input placeholder="Age" type="number" value={caseForm.age} onChange={(e) => setCaseForm({ ...caseForm, age: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary" />
              </div>
              <select value={caseForm.gender} onChange={(e) => setCaseForm({ ...caseForm, gender: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary">
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              <textarea placeholder="Symptoms..." value={caseForm.symptoms} onChange={(e) => setCaseForm({ ...caseForm, symptoms: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Duration (e.g., 3 days)" value={caseForm.duration} onChange={(e) => setCaseForm({ ...caseForm, duration: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary" />
                <select value={caseForm.severity} onChange={(e) => setCaseForm({ ...caseForm, severity: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary">
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
              </div>
              <input placeholder="Medical History" value={caseForm.history} onChange={(e) => setCaseForm({ ...caseForm, history: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary" />
              <input placeholder="Allergies" value={caseForm.allergies} onChange={(e) => setCaseForm({ ...caseForm, allergies: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary" />
              <input placeholder="Current Medications" value={caseForm.medications} onChange={(e) => setCaseForm({ ...caseForm, medications: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary" />
              <button onClick={runCaseAnalysis} disabled={loading || !caseForm.symptoms} className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                {loading ? "Analyzing..." : "Run Case Analysis"}
              </button>
            </div>
          )}

          {activeTab === "medication" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-secondary">Medication Safety Check</h3>
              <textarea placeholder="Current medications (comma-separated)&#10;e.g., warfarin, lisinopril, metformin" value={medForm.current} onChange={(e) => setMedForm({ ...medForm, current: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary" />
              <textarea placeholder="Proposed medications (comma-separated)&#10;e.g., aspirin, ibuprofen" value={medForm.proposed} onChange={(e) => setMedForm({ ...medForm, proposed: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary" />
              <input placeholder="Allergies (comma-separated)" value={medForm.allergies} onChange={(e) => setMedForm({ ...medForm, allergies: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary" />
              <button onClick={runMedSafety} disabled={loading || !medForm.proposed} className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                {loading ? "Checking..." : "Check Safety"}
              </button>
            </div>
          )}

          {activeTab === "report" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-secondary">Lab Report Analysis</h3>
              <textarea placeholder="Paste lab report text here...&#10;&#10;e.g., Hemoglobin: 10.2 g/dL&#10;WBC: 12,500 /uL&#10;Glucose: 250 mg/dL&#10;Creatinine: 2.1 mg/dL" value={reportText} onChange={(e) => setReportText(e.target.value)} rows={10} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary font-mono" />
              <button onClick={runReportAnalysis} disabled={loading || !reportText} className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                {loading ? "Analyzing..." : "Analyze Report"}
              </button>
            </div>
          )}
        </div>

        {/* Results panel */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-secondary mb-4">Analysis Results</h3>
          {!result && !loading && (
            <div className="text-center py-12 text-muted">
              <Brain size={40} className="mx-auto mb-3 text-gray-300" />
              <p>Run an analysis to see results here</p>
            </div>
          )}
          {loading && (
            <div className="text-center py-12">
              <Loader2 size={32} className="mx-auto mb-3 text-primary animate-spin" />
              <p className="text-muted">Processing...</p>
            </div>
          )}
          {result?.type === "error" && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{result.data}</div>
          )}
          {result?.type === "case" && (
            <div className="space-y-4 text-sm">
              <div className={`p-3 rounded-lg font-medium ${
                result.data.risk_level === "critical" ? "bg-red-50 text-red-700" :
                result.data.risk_level === "high" ? "bg-amber-50 text-amber-700" :
                "bg-green-50 text-green-700"
              }`}>
                Risk Level: {result.data.risk_level?.toUpperCase()}
              </div>
              <div><h4 className="font-semibold mb-1">Summary</h4><p className="text-gray-700">{result.data.summary}</p></div>
              {result.data.safety_alerts?.length > 0 && (
                <div><h4 className="font-semibold mb-1 text-amber-600">Safety Alerts</h4>
                  <ul className="space-y-1">{result.data.safety_alerts.map((a: string, i: number) => <li key={i} className="text-amber-700 flex items-start gap-1"><AlertTriangleIcon />{a}</li>)}</ul>
                </div>
              )}
              {result.data.suggestions?.length > 0 && (
                <div><h4 className="font-semibold mb-1">Suggestions</h4>
                  <ul className="space-y-1">{result.data.suggestions.slice(0, 10).map((s: string, i: number) => <li key={i} className="flex items-start gap-2"><span className="bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span><span className="text-gray-700">{s}</span></li>)}</ul>
                </div>
              )}
            </div>
          )}
          {result?.type === "medication" && (
            <div className="space-y-4 text-sm">
              <div className={`p-3 rounded-lg font-medium ${result.data.safe ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {result.data.safe ? "No safety concerns detected" : "Safety concerns found"}
              </div>
              {result.data.alerts?.length > 0 && (
                <div>{result.data.alerts.map((a: any, i: number) => (
                  <div key={i} className="p-3 bg-amber-50 rounded-lg mb-2">
                    <p className="font-medium text-amber-700">{a.type}: {a.description || a.message}</p>
                  </div>
                ))}</div>
              )}
              {result.data.recommendations?.length > 0 && (
                <div><h4 className="font-semibold mb-1">Recommendations</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">{result.data.recommendations.map((r: string, i: number) => <li key={i}>{r}</li>)}</ul>
                </div>
              )}
            </div>
          )}
          {result?.type === "report" && (
            <div className="space-y-4 text-sm">
              {result.data.key_findings?.length > 0 && (
                <div><h4 className="font-semibold mb-1">Key Findings</h4>
                  <ul className="space-y-1">{result.data.key_findings.map((f: any, i: number) => (
                    <li key={i} className={`p-2 rounded ${f.status === "abnormal" ? "bg-red-50" : "bg-green-50"}`}>
                      <span className="font-medium">{f.parameter || f.name}:</span> {f.value} {f.unit} {f.status === "abnormal" && <span className="text-red-600 text-xs ml-1">(abnormal)</span>}
                    </li>
                  ))}</ul>
                </div>
              )}
              {result.data.recommendations?.length > 0 && (
                <div><h4 className="font-semibold mb-1">Recommendations</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">{result.data.recommendations.map((r: string, i: number) => <li key={i}>{r}</li>)}</ul>
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-muted mt-6 border-t border-gray-100 pt-3">
            Disclaimer: This AI tool provides decision support only. Always exercise independent clinical judgment.
          </p>
        </div>
      </div>
    </div>
  );
}

function AlertTriangleIcon() {
  return <span className="flex-shrink-0 mt-0.5">&#9888;</span>;
}
