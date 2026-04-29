"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Send, FileText, AlertCircle, Loader2, Brain } from "lucide-react";
import {
  ApiRecord,
  ReportAnalysisRecord,
  UploadRecord,
  ai,
  uploads,
} from "@/lib/api";

type Message = { sender: "doctor" | "assistant"; text: string };

/**
 * Report intelligence page.
 *
 * Opens one uploaded report and runs AI on that report's extracted text.
 */
export default function ReportPage() {
  const params = useParams<{ reportId: string }>();
  const reportId = Number(params.reportId);
  const [report, setReport] = useState<UploadRecord | null>(null);
  const [analysis, setAnalysis] = useState<ReportAnalysisRecord | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadReport() {
      // Load the upload. If text extraction is missing, say that instead of
      // pretending there is report text.
      setLoading(true);
      setError("");
      try {
        const data = await uploads.get(reportId);
        if (active) setReport(data);
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : "Could not load report.");
      } finally {
        if (active) setLoading(false);
      }
    }
    if (Number.isFinite(reportId)) void loadReport();
    return () => {
      active = false;
    };
  }, [reportId]);

  const reportText = report?.extracted_text?.trim() || "";

  const runAnalysis = async () => {
    // No extracted text, no analysis.
    if (!reportText) {
      setError("This report does not have extracted text to analyze yet.");
      return;
    }
    setAnalyzing(true);
    setError("");
    try {
      const result = await ai.reportAnalysis({
        report_text: reportText,
        patient_context: report?.patient_name || "",
      });
      // Start chat after analysis so the conversation is about this report.
      setAnalysis(result);
      setMessages([
        {
          sender: "assistant",
          text: "Analysis complete. Ask a question about this report if you need more detail.",
        },
      ]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Report analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  const sendMessage = async () => {
    // Chat uses the same extracted report text as analysis.
    if (!input.trim() || !reportText) return;
    const question = input.trim();
    const nextMessages: Message[] = [...messages, { sender: "doctor", text: question }];
    setMessages(nextMessages);
    setInput("");
    setChatLoading(true);
    setError("");
    try {
      const result = await ai.reportChat({
        report_text: reportText,
        question,
        chat_history: nextMessages as unknown as ApiRecord[],
      });
      const answer =
        typeof result.answer === "string"
          ? result.answer
          : typeof result.response === "string"
          ? result.response
          : "I could not generate a specific answer for this report.";
      setMessages((items) => [...items, { sender: "assistant", text: answer }]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not chat with this report.");
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Report Intelligence</h1>
          <p className="text-sm text-muted">
            {report
              ? `${report.file_name} ${report.patient_name ? `for ${report.patient_name}` : ""}`
              : "Loading report..."}
          </p>
        </div>
        {loading && <Loader2 className="animate-spin text-muted" size={20} />}
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-secondary mb-4 flex items-center gap-2">
            <FileText size={18} /> Report Content
          </h2>
          {loading ? (
            <div className="text-sm text-muted">Loading report content...</div>
          ) : reportText ? (
            <pre className="text-sm text-muted bg-gray-50 p-4 rounded-lg whitespace-pre-wrap font-mono leading-relaxed">
              {reportText}
            </pre>
          ) : (
            <div className="text-sm text-muted bg-gray-50 p-4 rounded-lg">
              No extracted text is available for this file yet. Open the uploaded file or run extraction before AI analysis.
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-secondary">AI Analysis</h2>
              <button
                onClick={runAnalysis}
                disabled={analyzing || !reportText}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
              >
                {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
                Analyze
              </button>
            </div>

            {!analysis ? (
              <div className="text-sm text-muted">
                {/* Before analysis, keep this area quiet. */}
                Run analysis to inspect the uploaded report. Nothing is prefilled here.
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-muted uppercase mb-2">Key Findings</h3>
                  <ul className="space-y-1">
                    {analysis.key_findings.map((finding, index) => (
                      <li key={index} className="text-sm text-muted flex gap-2">
                        <span className="text-primary">&bull;</span>{finding}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-muted uppercase mb-2">Abnormal Values</h3>
                  <div className="space-y-2">
                    {analysis.abnormal_values.length === 0 && (
                      <p className="text-sm text-muted">No abnormal values returned.</p>
                    )}
                    {analysis.abnormal_values.map((item, index) => (
                      <div key={`${item.parameter || "value"}-${index}`} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <AlertCircle size={14} className="text-red-500" />
                          <span className="text-sm font-medium text-red-700">{item.parameter || "Value"}</span>
                        </div>
                        <div className="text-sm text-red-600">
                          {item.value || "Not specified"}
                          {item.reference_range ? <span className="text-red-400"> (ref: {item.reference_range})</span> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-muted uppercase mb-2">Recommendations</h3>
                  <ul className="space-y-1">
                    {analysis.recommendations.map((recommendation, index) => (
                      <li key={index} className="text-sm text-muted">{index + 1}. {recommendation}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100"><h2 className="font-semibold text-secondary">Ask About This Report</h2></div>
            <div className="p-4 h-64 overflow-y-auto space-y-3">
              {messages.length === 0 && (
                <div className="text-sm text-muted">
                  Analyze the report first, then ask follow-up questions about the uploaded content.
                </div>
              )}
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.sender === "doctor" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-4 py-2 rounded-xl text-sm ${message.sender === "doctor" ? "bg-primary text-white" : "bg-gray-100 text-secondary"}`}>
                    {message.text}
                  </div>
                </div>
              ))}
              {chatLoading && <div className="text-sm text-muted">Thinking...</div>}
            </div>
            <div className="p-4 border-t border-gray-100 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask about the report..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-primary text-sm"
              />
              <button onClick={sendMessage} disabled={!reportText || chatLoading} className="p-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50">
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
