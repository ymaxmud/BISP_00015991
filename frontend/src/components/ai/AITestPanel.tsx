"use client";

/**
 * AITestPanel — small chat widget for the doctor dashboard.
 *
 * Lets a doctor ask the AI assistant a free-form clinical question and
 * see the answer inline. Hits /api/ai/assistant/ask which is the
 * generic Q&A endpoint added in ai-service/app/routers/assistant.py.
 *
 * Two visual states:
 *   - Empty: a textarea + "Ask Avicenna AI" button + 3 sample prompts.
 *   - Active: a scrolling thread of user/assistant turns, with a small
 *     "live LLM" badge when used_llm came back true (so it's obvious
 *     when the OpenAI key is wired up vs falling back to the rule path).
 *
 * Designed to drop into any dashboard column — it doesn't manage its
 * own width, just fills the parent.
 */
import { useEffect, useRef, useState } from "react";
import { Brain, Send, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { ai } from "@/lib/api";

type Turn = { role: "user" | "assistant"; content: string };

const SAMPLES: string[] = [
  "What HbA1c level indicates poorly-controlled type 2 diabetes?",
  "First-line treatment for community-acquired pneumonia in adults?",
  "Common red flags in a patient with sudden-onset chest pain?",
];

export default function AITestPanel() {
  const [question, setQuestion] = useState("");
  const [thread, setThread] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedLlm, setUsedLlm] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the thread to the bottom as new turns arrive.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thread, loading]);

  const ask = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setError(null);
    const nextThread: Turn[] = [...thread, { role: "user", content: trimmed }];
    setThread(nextThread);
    setQuestion("");
    setLoading(true);

    try {
      const res = await ai.ask({
        question: trimmed,
        // Send the prior turns so follow-ups have context.
        history: thread,
      });
      setUsedLlm(res.used_llm);
      setThread([...nextThread, { role: "assistant", content: res.answer }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    ask(question);
  };

  const reset = () => {
    setThread([]);
    setQuestion("");
    setError(null);
    setUsedLlm(null);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center">
            <Brain size={18} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-secondary text-sm">
              Ask Avicenna AI
            </h3>
            <p className="text-xs text-muted">
              {usedLlm === true
                ? "Live LLM • GPT-3.5 / Llama"
                : usedLlm === false
                  ? "Fallback mode (no API key)"
                  : "Clinical Q&A — try it now"}
            </p>
          </div>
        </div>
        {thread.length > 0 && (
          <button
            type="button"
            onClick={reset}
            title="Reset conversation"
            className="text-muted hover:text-secondary p-1.5"
          >
            <RefreshCw size={14} />
          </button>
        )}
      </div>

      {/* Body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-[200px] max-h-[420px]">
        {thread.length === 0 ? (
          <div>
            <p className="text-xs text-muted mb-3">Try a sample question:</p>
            <div className="flex flex-col gap-2">
              {SAMPLES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => ask(s)}
                  className="text-left text-sm text-secondary px-3 py-2 rounded-lg border border-gray-100 hover:border-primary/40 hover:bg-teal-50/30 transition-colors flex items-start gap-2"
                >
                  <Sparkles size={14} className="text-primary shrink-0 mt-0.5" />
                  <span>{s}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          thread.map((turn, i) => (
            <div
              key={i}
              className={`flex ${
                turn.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  turn.role === "user"
                    ? "bg-primary text-white"
                    : "bg-gray-50 text-secondary border border-gray-100"
                }`}
              >
                {turn.content}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2.5 text-sm text-muted flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Thinking…
            </div>
          </div>
        )}

        {error && (
          <div className="text-xs text-red-600 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-100 px-3 py-3 flex items-end gap-2"
      >
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends, Shift+Enter newlines — standard chat UX.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              ask(question);
            }
          }}
          rows={1}
          placeholder="Ask a clinical question…"
          className="flex-1 resize-none px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary max-h-32"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="p-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Send"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
