"use client";

import { useState } from "react";
import { Send, FileText, AlertCircle } from "lucide-react";

const reportText = `LABORATORY REPORT
Patient: Sardor Umarov | Date: 2026-03-25
---------------------------------------------
Complete Blood Count:
  Hemoglobin: 14.2 g/dL (Ref: 13.0-17.5)
  WBC: 8.5 x10³/μL (Ref: 4.0-11.0)
  Platelets: 245 x10³/μL (Ref: 150-400)

Metabolic Panel:
  Glucose: 118 mg/dL (Ref: 70-100)  ** HIGH **
  Creatinine: 1.0 mg/dL (Ref: 0.6-1.2)
  Sodium: 141 mEq/L (Ref: 136-145)
  Potassium: 4.2 mEq/L (Ref: 3.5-5.0)

Lipid Panel:
  Total Cholesterol: 228 mg/dL (Ref: <200) ** HIGH **

Cardiac Markers:
  Troponin I: 0.03 ng/mL (Ref: <0.04)

HbA1c: 6.1% (Ref: <5.7%) ** HIGH **`;

const aiAnalysis = {
  findings: ["Glucose elevated at 118 mg/dL (fasting reference: 70-100)", "Total Cholesterol elevated at 228 mg/dL (desirable: <200)", "HbA1c elevated at 6.1% (normal: <5.7%, pre-diabetic range: 5.7-6.4%)", "Troponin I within normal limits at 0.03", "CBC values within normal range"],
  abnormal: [
    { param: "Glucose", value: "118 mg/dL", ref: "70-100", status: "high" },
    { param: "Cholesterol", value: "228 mg/dL", ref: "<200", status: "high" },
    { param: "HbA1c", value: "6.1%", ref: "<5.7%", status: "high" },
  ],
  recommendations: ["Repeat fasting glucose to confirm", "Lifestyle counseling for pre-diabetes", "Lipid management: consider dietary changes", "Follow-up HbA1c in 3 months", "Troponin is normal — reassuring for cardiac evaluation"],
};

const initialMessages = [
  { sender: "assistant", text: "Report analysis complete. I found 3 abnormal values. How can I help you interpret these results?" },
];

export default function ReportPage() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    const q = input;
    setMessages((prev) => [...prev, { sender: "doctor", text: q }]);
    setInput("");
    setTimeout(() => {
      let answer = "Based on the report, the values should be interpreted in the context of the patient's symptoms and history.";
      if (q.toLowerCase().includes("glucose") || q.toLowerCase().includes("sugar")) answer = "Glucose is elevated at 118 mg/dL (reference: 70-100). Combined with HbA1c of 6.1%, this suggests pre-diabetic state. Recommend fasting glucose repeat and lifestyle counseling.";
      else if (q.toLowerCase().includes("cholesterol")) answer = "Total cholesterol is 228 mg/dL, above the desirable level of 200. Consider dietary modifications and recheck in 3-6 months. Statin therapy may be considered based on cardiovascular risk.";
      else if (q.toLowerCase().includes("troponin") || q.toLowerCase().includes("heart")) answer = "Troponin I is 0.03 ng/mL, which is within normal limits (<0.04). This is reassuring and does not suggest acute myocardial injury at this time.";
      setMessages((prev) => [...prev, { sender: "assistant", text: answer }]);
    }, 500);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-secondary mb-6">Report Intelligence</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report text */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-secondary mb-4 flex items-center gap-2"><FileText size={18} /> Report Content</h2>
          <pre className="text-sm text-muted bg-gray-50 p-4 rounded-lg whitespace-pre-wrap font-mono leading-relaxed">{reportText}</pre>
        </div>

        {/* AI Analysis + Chat */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-secondary mb-4">AI Analysis</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-muted uppercase mb-2">Key Findings</h3>
                <ul className="space-y-1">{aiAnalysis.findings.map((f, i) => <li key={i} className="text-sm text-muted flex gap-2"><span className="text-primary">&bull;</span>{f}</li>)}</ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-muted uppercase mb-2">Abnormal Values</h3>
                <div className="space-y-2">{aiAnalysis.abnormal.map((a) => (
                  <div key={a.param} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2"><AlertCircle size={14} className="text-red-500" /><span className="text-sm font-medium text-red-700">{a.param}</span></div>
                    <div className="text-sm text-red-600">{a.value} <span className="text-red-400">(ref: {a.ref})</span></div>
                  </div>
                ))}</div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-muted uppercase mb-2">Recommendations</h3>
                <ul className="space-y-1">{aiAnalysis.recommendations.map((r, i) => <li key={i} className="text-sm text-muted">{i + 1}. {r}</li>)}</ul>
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100"><h2 className="font-semibold text-secondary">Ask About This Report</h2></div>
            <div className="p-4 h-64 overflow-y-auto space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.sender === "doctor" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-4 py-2 rounded-xl text-sm ${m.sender === "doctor" ? "bg-primary text-white" : "bg-gray-100 text-secondary"}`}>{m.text}</div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100 flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Ask about the report..." className="flex-1 px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-primary text-sm" />
              <button onClick={sendMessage} className="p-2 bg-primary text-white rounded-lg hover:bg-primary-dark"><Send size={18} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
