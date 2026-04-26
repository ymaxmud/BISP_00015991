"use client";

/**
 * Doctor's smart queue (route: `/doctor/queue`).
 *
 * This is the screen a doctor lives on during a clinic day. It shows
 * the next patient up, the rest of the queue sorted by triage urgency,
 * and four primary actions: Call Next, Start Consultation, Skip, and
 * Complete. Skipping a patient drops them to the bottom of the queue
 * but keeps them in the list.
 *
 * State today is local — the real wiring to `queue.list()` /
 * `queue.update()` and the ticket model in the backend will replace
 * the in-memory `patients` state when we move past the demo.
 */
import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  AlertTriangle,
  Users,
  Play,
  PhoneCall,
  SkipForward,
  X,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import Badge from "@/components/ui/Badge";

/* These types describe what the queue UI expects from each patient row. */

type TriageLevel = "urgent" | "priority" | "normal";
type PatientStatus = "waiting" | "called" | "in_consultation" | "completed";

interface Patient {
  id: number;
  num: number;
  patient: string;
  complaint: string;
  triage: TriageLevel;
  wait: number;
  status: PatientStatus;
  allergies: string;
  details: string;
}

/* This is demo queue data so the screen has something realistic to render. */

const initialQueue: Patient[] = [
  { id: 1, num: 1, patient: "Bobur Yusupov", complaint: "Follow-up for heart condition", triage: "urgent", wait: 5, status: "waiting", allergies: "Penicillin", details: "History of atrial fibrillation. On warfarin. Last echo showed EF 45%." },
  { id: 2, num: 2, patient: "Gulnara Rashidova", complaint: "Wheezing and breathing difficulty", triage: "urgent", wait: 12, status: "waiting", allergies: "None known", details: "Asthma since childhood. Recent exacerbation, using rescue inhaler 4x/day." },
  { id: 3, num: 3, patient: "Sardor Umarov", complaint: "Chest pain radiating to left arm", triage: "priority", wait: 18, status: "waiting", allergies: "Sulfa drugs", details: "Smoker, 20 pack-years. Family history of MI. BP elevated at triage 160/95." },
  { id: 4, num: 4, patient: "Dilnoza Alimova", complaint: "Recurring severe headaches", triage: "priority", wait: 25, status: "waiting", allergies: "Aspirin", details: "Migraines with aura 3x/week. Currently on topiramate. Reports vision changes." },
  { id: 5, num: 5, patient: "Timur Nazarov", complaint: "Warfarin dosage review", triage: "normal", wait: 30, status: "waiting", allergies: "None known", details: "INR last measured at 3.8 (target 2-3). Dose adjustment needed." },
  { id: 6, num: 6, patient: "Nargiza Sultanova", complaint: "Annual checkup", triage: "normal", wait: 35, status: "waiting", allergies: "Latex", details: "No active complaints. Due for lipid panel and HbA1c. BMI 28." },
  { id: 7, num: 7, patient: "Alisher Khamidov", complaint: "Back pain for 2 weeks", triage: "normal", wait: 42, status: "waiting", allergies: "None known", details: "Lower back pain radiating to right leg. No trauma. Worsens with sitting." },
  { id: 8, num: 8, patient: "Malika Ergasheva", complaint: "Skin rash on arms", triage: "normal", wait: 48, status: "waiting", allergies: "Iodine", details: "Bilateral forearm rash for 5 days. Itchy, raised. New detergent started recently." },
];

/* These constants control queue ordering, labels, and visual styles. */

const TRIAGE_ORDER: Record<TriageLevel, number> = { urgent: 0, priority: 1, normal: 2 };
const AVG_CONSULT_MIN = 12;

const triageStyles: Record<TriageLevel, { badge: "danger" | "warning" | "default"; label: string }> = {
  urgent: { badge: "danger", label: "Urgent" },
  priority: { badge: "warning", label: "Priority" },
  normal: { badge: "default", label: "Normal" },
};

const statusConfig: Record<PatientStatus, { color: string; animation: string; label: string }> = {
  waiting: { color: "bg-amber-400", animation: "", label: "Waiting" },
  called: { color: "bg-green-500", animation: "animate-pulse", label: "Called" },
  in_consultation: { color: "bg-blue-500", animation: "", label: "In Consultation" },
  completed: { color: "bg-gray-400", animation: "", label: "Completed" },
};

const triageBorder: Record<TriageLevel, string> = {
  urgent: "border-l-4 border-l-red-400",
  priority: "border-l-4 border-l-amber-400",
  normal: "border-l-4 border-l-transparent",
};

/* The page below is basically a small queue-management dashboard. */

export default function QueuePage() {
  const router = useRouter();
  const [queue, setQueue] = useState<Patient[]>(initialQueue);
  const [filter, setFilter] = useState<"all" | TriageLevel>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<number | null>(null);
  const [flashIds, setFlashIds] = useState<Set<number>>(new Set());

  /* Everything in this block is derived from the raw queue state.
     We memoise it so we are not recalculating the same sorting work on every render. */

  const sorted = useMemo(() => {
    return [...queue].sort((a, b) => {
      // Finished patients should stay at the bottom so active work stays visible first.
      if (a.status === "completed" && b.status !== "completed") return 1;
      if (b.status === "completed" && a.status !== "completed") return -1;
      // Someone already in consultation should also stay lower than people still waiting.
      if (a.status === "in_consultation" && b.status !== "in_consultation" && b.status !== "completed") return 1;
      if (b.status === "in_consultation" && a.status !== "in_consultation" && a.status !== "completed") return -1;
      // If a patient has already been called, keep them near the top.
      if (a.status === "called" && b.status !== "called") return -1;
      if (b.status === "called" && a.status !== "called") return 1;
      // After status rules, urgency decides the order.
      const triageDiff = TRIAGE_ORDER[a.triage] - TRIAGE_ORDER[b.triage];
      if (triageDiff !== 0) return triageDiff;
      // If urgency is the same, the longer-waiting patient should come first.
      return b.wait - a.wait;
    });
  }, [queue]);

  const filtered = useMemo(
    () => (filter === "all" ? sorted : sorted.filter((q) => q.triage === filter)),
    [sorted, filter]
  );

  const activePatients = queue.filter((q) => q.status !== "completed");
  const waitingPatients = queue.filter((q) => q.status === "waiting");
  const urgentCount = activePatients.filter((q) => q.triage === "urgent").length;
  const avgWait =
    waitingPatients.length > 0
      ? Math.round(waitingPatients.reduce((a, b) => a + b.wait, 0) / waitingPatients.length)
      : 0;

  const isQueueEmpty = activePatients.length === 0;

  /* Small helper functions for UI behavior and wait-time estimation. */

  const triggerFlash = useCallback((id: number) => {
    setFlashIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setFlashIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 1500);
  }, []);

  const estimateWait = useCallback(
    (patient: Patient): string => {
      if (patient.status === "completed") return "Done";
      if (patient.status === "in_consultation") return "Now";
      if (patient.status === "called") return "Next";

      // We estimate wait by counting how many active patients are still ahead
      // in the queue and multiplying by the average consultation time.
      const activeQueue = sorted.filter(
        (q) => q.status === "waiting" || q.status === "called"
      );
      const idx = activeQueue.findIndex((q) => q.id === patient.id);
      if (idx <= 0) return "< 5 min";
      const mins = idx * AVG_CONSULT_MIN;
      return `~${mins} min`;
    },
    [sorted]
  );

  /* User actions that change queue state live here. */

  const callNext = useCallback(() => {
    setQueue((prev) => {
      // We always call the highest-priority waiting patient first.
      const waitingSorted = [...prev]
        .filter((q) => q.status === "waiting")
        .sort((a, b) => {
          const t = TRIAGE_ORDER[a.triage] - TRIAGE_ORDER[b.triage];
          return t !== 0 ? t : b.wait - a.wait;
        });
      if (waitingSorted.length === 0) return prev;
      const nextId = waitingSorted[0].id;
      triggerFlash(nextId);
      return prev.map((q) => (q.id === nextId ? { ...q, status: "called" as PatientStatus } : q));
    });
  }, [triggerFlash]);

  const startConsultation = useCallback(
    (id: number) => {
      setQueue((prev) =>
        prev.map((q) => (q.id === id ? { ...q, status: "in_consultation" as PatientStatus } : q))
      );
      router.push(`/doctor/consultation/${id}`);
    },
    [router]
  );

  const completeConsultation = useCallback((id: number) => {
    setQueue((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status: "completed" as PatientStatus } : q))
    );
  }, []);

  const skipPatient = useCallback((id: number) => {
    setQueue((prev) => {
      const patient = prev.find((q) => q.id === id);
      if (!patient) return prev;
      // Skipping means the patient goes back into waiting state and loses
      // their current wait advantage, so they naturally drop lower in the sort.
      return prev.map((q) =>
        q.id === id ? { ...q, wait: 0, status: "waiting" as PatientStatus } : q
      );
    });
  }, []);

  const removePatient = useCallback((id: number) => {
    setQueue((prev) => prev.filter((q) => q.id !== id));
    setConfirmRemoveId(null);
  }, []);

  /* This helper keeps the JSX cleaner by putting all row-color logic in one place. */

  const getRowClasses = (q: Patient) => {
    const base = "transition-all duration-300";
    const border = triageBorder[q.triage];
    const flash = flashIds.has(q.id) ? "animate-flash-highlight" : "";

    if (q.status === "called") return `${base} ${border} bg-green-50/60 ${flash}`;
    if (q.status === "in_consultation") return `${base} ${border} bg-blue-50/40 ${flash}`;
    if (q.status === "completed") return `${base} ${border} bg-gray-50 opacity-60 ${flash}`;
    if (q.triage === "urgent") return `${base} ${border} hover:bg-red-50/30 ${flash}`;
    if (q.triage === "priority") return `${base} ${border} hover:bg-amber-50/30 ${flash}`;
    return `${base} ${border} hover:bg-gray-50/50 ${flash}`;
  };

  /* Everything below is just the actual rendered queue screen. */

  return (
    <div>
      {/* These keyframes are only for this page, so we keep them close to the component. */}
      <style jsx global>{`
        @keyframes flash-highlight {
          0% { background-color: rgba(20, 184, 166, 0.3); }
          50% { background-color: rgba(20, 184, 166, 0.15); }
          100% { background-color: transparent; }
        }
        .animate-flash-highlight {
          animation: flash-highlight 1.5s ease-out;
        }
        @keyframes urgent-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
        }
        .animate-urgent-pulse {
          animation: urgent-pulse 2s infinite;
        }
      `}</style>

      {/* Top actions and page title. */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4 pl-12 md:pl-0">
        <h1 className="text-2xl font-bold text-secondary">Smart Queue</h1>
        <button
          onClick={callNext}
          disabled={waitingPatients.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <PhoneCall size={16} />
          Call Next Patient
        </button>
      </div>

      {/* Quick queue summary cards. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
            <Users size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted">Total Waiting</p>
            <p className="text-2xl font-bold text-secondary">{waitingPatients.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <Clock size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-muted">Avg Wait Time</p>
            <p className="text-2xl font-bold text-secondary">{avgWait} min</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div
            className={`w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center ${
              urgentCount > 0 ? "animate-urgent-pulse" : ""
            }`}
          >
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div>
            <p className="text-sm text-muted">Urgent Cases</p>
            <p className="text-2xl font-bold text-secondary">{urgentCount}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(["all", "urgent", "priority", "normal"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-primary text-white"
                : "bg-gray-100 text-muted hover:bg-gray-200"
            }`}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== "all" && (
              <span className="ml-1.5 text-xs opacity-75">
                ({queue.filter((q) => q.triage === f && q.status !== "completed").length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Queue Empty State */}
      {isQueueEmpty ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-secondary mb-2">Queue is Empty</h2>
          <p className="text-muted">All patients have been processed. Great work!</p>
        </div>
      ) : (
        /* Queue Table */
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase w-8">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">
                  Patient
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase hidden md:table-cell">
                  Chief Complaint
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">
                  Triage
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase hidden sm:table-cell">
                  Est. Wait
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q, idx) => (
                <tr key={q.id}>
                  {/* Main row */}
                  <td colSpan={7} className="p-0">
                    <div className={`${getRowClasses(q)} border-b border-gray-50`}>
                      <div className="flex items-center">
                        {/* # */}
                        <div className="px-4 py-3 w-12 shrink-0">
                          <span className="font-semibold text-secondary text-sm">{idx + 1}</span>
                        </div>

                        {/* Status dot */}
                        <div className="px-4 py-3 w-28 shrink-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${statusConfig[q.status].color} ${statusConfig[q.status].animation}`}
                            />
                            <span className="text-xs text-muted hidden lg:inline">
                              {statusConfig[q.status].label}
                            </span>
                          </div>
                        </div>

                        {/* Patient name + expand toggle */}
                        <div className="px-4 py-3 flex-1 min-w-0">
                          <button
                            onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                            className="flex items-center gap-1.5 text-left group"
                          >
                            <span className="font-medium text-secondary truncate">
                              {q.patient}
                            </span>
                            <Info
                              size={14}
                              className="text-gray-300 group-hover:text-primary shrink-0 transition-colors"
                            />
                            {expandedId === q.id ? (
                              <ChevronUp size={14} className="text-gray-400 shrink-0" />
                            ) : (
                              <ChevronDown size={14} className="text-gray-400 shrink-0" />
                            )}
                          </button>
                        </div>

                        {/* Complaint */}
                        <div className="px-4 py-3 flex-1 min-w-0 hidden md:block">
                          <span className="text-sm text-muted truncate block">{q.complaint}</span>
                        </div>

                        {/* Triage badge */}
                        <div className="px-4 py-3 w-24 shrink-0">
                          <Badge variant={triageStyles[q.triage].badge} size="sm">
                            {triageStyles[q.triage].label}
                          </Badge>
                        </div>

                        {/* Est wait */}
                        <div className="px-4 py-3 w-24 shrink-0 hidden sm:block">
                          <span className="text-sm text-muted">{estimateWait(q)}</span>
                        </div>

                        {/* Actions */}
                        <div className="px-4 py-3 shrink-0 flex items-center justify-end gap-1.5">
                          {q.status === "waiting" && (
                            <>
                              <button
                                onClick={() => startConsultation(q.id)}
                                title="Start Consultation"
                                className="p-1.5 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
                              >
                                <Play size={14} />
                              </button>
                              <button
                                onClick={() => skipPatient(q.id)}
                                title="Skip - Move to End"
                                className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                              >
                                <SkipForward size={14} />
                              </button>
                              <button
                                onClick={() => setConfirmRemoveId(q.id)}
                                title="Remove from Queue"
                                className="p-1.5 rounded-lg bg-gray-100 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </>
                          )}
                          {q.status === "called" && (
                            <>
                              <button
                                onClick={() => startConsultation(q.id)}
                                title="Start Consultation"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-dark text-sm font-medium transition-colors"
                              >
                                <Play size={14} />
                                <span className="hidden lg:inline">Start</span>
                              </button>
                              <button
                                onClick={() => skipPatient(q.id)}
                                title="Skip - Move to End"
                                className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                              >
                                <SkipForward size={14} />
                              </button>
                            </>
                          )}
                          {q.status === "in_consultation" && (
                            <button
                              onClick={() => completeConsultation(q.id)}
                              title="Complete Consultation"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm font-medium transition-colors"
                            >
                              <CheckCircle size={14} />
                              <span className="hidden lg:inline">Complete</span>
                            </button>
                          )}
                          {q.status === "completed" && (
                            <span className="text-xs text-gray-400 italic">Done</span>
                          )}
                        </div>
                      </div>

                      {/* Expanded quick-info panel */}
                      {expandedId === q.id && (
                        <div className="px-4 pb-3 pt-0 ml-12 border-t border-gray-100 mt-0">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                            <div>
                              <p className="text-xs font-semibold text-muted uppercase mb-1">
                                Allergies
                              </p>
                              <p className="text-sm text-secondary">
                                {q.allergies === "None known" ? (
                                  <span className="text-gray-400">None known</span>
                                ) : (
                                  <span className="text-red-600 font-medium">{q.allergies}</span>
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-muted uppercase mb-1">
                                Wait Time
                              </p>
                              <p className="text-sm text-secondary">{q.wait} min in queue</p>
                            </div>
                            <div className="sm:col-span-2">
                              <p className="text-xs font-semibold text-muted uppercase mb-1">
                                Clinical Details
                              </p>
                              <p className="text-sm text-secondary">{q.details}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer with count */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-muted">
              Showing {filtered.length} of {queue.length} patients
            </span>
            <span className="text-xs text-muted">
              {queue.filter((q) => q.status === "completed").length} completed today
            </span>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {confirmRemoveId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-secondary mb-2">Remove Patient</h3>
            <p className="text-sm text-muted mb-6">
              Are you sure you want to remove{" "}
              <span className="font-medium text-secondary">
                {queue.find((q) => q.id === confirmRemoveId)?.patient}
              </span>{" "}
              from the queue? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmRemoveId(null)}
                className="px-4 py-2 rounded-lg bg-gray-100 text-muted hover:bg-gray-200 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => removePatient(confirmRemoveId)}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm font-medium transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
