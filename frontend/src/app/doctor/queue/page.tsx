"use client";

/**
 * Doctor's smart queue (route: `/doctor/queue`).
 *
 * Doctor queue.
 *
 * The rows here come from queue tickets. No tickets means the queue is empty.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  AlertTriangle,
  Users,
  Play,
  PhoneCall,
  SkipForward,
  CheckCircle,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import {
  AppointmentRecord,
  QueueTicketRecord,
  appointments as appointmentsApi,
  queue as queueApi,
} from "@/lib/api";

type TriageLevel = "urgent" | "priority" | "normal";
type QueueFilter = "all" | TriageLevel;

const TRIAGE_ORDER: Record<TriageLevel, number> = { urgent: 0, priority: 1, normal: 2 };

const triageStyles: Record<TriageLevel, { badge: "danger" | "warning" | "default"; label: string }> = {
  urgent: { badge: "danger", label: "Urgent" },
  priority: { badge: "warning", label: "Priority" },
  normal: { badge: "default", label: "Normal" },
};

const statusConfig: Record<string, { color: string; label: string }> = {
  waiting: { color: "bg-amber-400", label: "Waiting" },
  called: { color: "bg-green-500", label: "Called" },
  in_progress: { color: "bg-blue-500", label: "In Consultation" },
  done: { color: "bg-gray-400", label: "Done" },
};

function normalizeTriage(value: string): TriageLevel {
  return value === "urgent" || value === "priority" ? value : "normal";
}

export default function QueuePage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<QueueTicketRecord[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [filter, setFilter] = useState<QueueFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadQueue = useCallback(async () => {
    // Tickets need appointment details for names and reasons, so load both.
    setLoading(true);
    setError("");
    const [ticketResult, appointmentResult] = await Promise.allSettled([
      queueApi.list(),
      appointmentsApi.list(),
    ]);
    if (ticketResult.status === "fulfilled") setTickets(ticketResult.value);
    if (appointmentResult.status === "fulfilled") setAppointments(appointmentResult.value);
    if (ticketResult.status === "rejected" || appointmentResult.status === "rejected") {
      setError("Could not load the full queue.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  const appointmentById = useMemo(() => {
    // ticket.appointment -> patient name and reason.
    return new Map(appointments.map((appointment) => [appointment.id, appointment]));
  }, [appointments]);

  const sorted = useMemo(() => {
    // Keep the order close to how a clinic works: called first, urgent before
    // normal, then the queue number.
    return [...tickets].sort((a, b) => {
      if (a.queue_status === "done" && b.queue_status !== "done") return 1;
      if (b.queue_status === "done" && a.queue_status !== "done") return -1;
      if (a.queue_status === "called" && b.queue_status !== "called") return -1;
      if (b.queue_status === "called" && a.queue_status !== "called") return 1;
      const triageDiff =
        TRIAGE_ORDER[normalizeTriage(a.triage_level)] -
        TRIAGE_ORDER[normalizeTriage(b.triage_level)];
      if (triageDiff !== 0) return triageDiff;
      return a.queue_number - b.queue_number;
    });
  }, [tickets]);

  const filtered = useMemo(
    () =>
      filter === "all"
        ? sorted
        : sorted.filter((ticket) => normalizeTriage(ticket.triage_level) === filter),
    [sorted, filter]
  );

  const activeTickets = tickets.filter((ticket) => ticket.queue_status !== "done");
  const waitingTickets = tickets.filter((ticket) => ticket.queue_status === "waiting");
  const urgentCount = activeTickets.filter((ticket) => ticket.triage_level === "urgent").length;
  const avgWait =
    waitingTickets.length > 0
      ? Math.round(
          waitingTickets.reduce((sum, ticket) => sum + ticket.estimated_wait_minutes, 0) /
            waitingTickets.length
        )
      : 0;

  const updateTicket = useCallback(async (id: number, data: Record<string, unknown>) => {
    // Save every move to the API so other screens see the same queue.
    setUpdatingId(id);
    setError("");
    try {
      const updated = await queueApi.update(id, data);
      setTickets((items) => items.map((ticket) => (ticket.id === id ? updated : ticket)));
      return updated;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not update the queue.");
      return null;
    } finally {
      setUpdatingId(null);
    }
  }, []);

  const callNext = useCallback(async () => {
    // Call urgent patients first. If urgency is the same, keep reception order.
    const next = [...waitingTickets].sort((a, b) => {
      const triageDiff =
        TRIAGE_ORDER[normalizeTriage(a.triage_level)] -
        TRIAGE_ORDER[normalizeTriage(b.triage_level)];
      return triageDiff !== 0 ? triageDiff : a.queue_number - b.queue_number;
    })[0];
    if (next) await updateTicket(next.id, { queue_status: "called" });
  }, [updateTicket, waitingTickets]);

  const startConsultation = useCallback(
    async (ticket: QueueTicketRecord) => {
      // Mark the ticket before opening the consultation page.
      await updateTicket(ticket.id, { queue_status: "in_progress" });
      router.push(`/doctor/consultation/${ticket.appointment}`);
    },
    [router, updateTicket]
  );

  const completeConsultation = useCallback(
    async (ticket: QueueTicketRecord) => {
      await updateTicket(ticket.id, { queue_status: "done" });
    },
    [updateTicket]
  );

  const skipPatient = useCallback(
    async (ticket: QueueTicketRecord) => {
      await updateTicket(ticket.id, {
        queue_status: "waiting",
        estimated_wait_minutes: 0,
      });
    },
    [updateTicket]
  );

  const activeFiltered = filtered.filter((ticket) => ticket.queue_status !== "done");

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4 pl-12 md:pl-0">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Smart Queue</h1>
          {error && <p className="text-sm text-amber-600 mt-1">{error}</p>}
        </div>
        <button
          onClick={callNext}
          disabled={waitingTickets.length === 0 || updatingId !== null}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <PhoneCall size={16} />
          Call Next Patient
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
            <Users size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted">Total Waiting</p>
            <p className="text-2xl font-bold text-secondary">{waitingTickets.length}</p>
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
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div>
            <p className="text-sm text-muted">Urgent Cases</p>
            <p className="text-2xl font-bold text-secondary">{urgentCount}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {(["all", "urgent", "priority", "normal"] as const).map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === item
                ? "bg-primary text-white"
                : "bg-gray-100 text-muted hover:bg-gray-200"
            }`}
          >
            {item === "all" ? "All" : item.charAt(0).toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center text-muted">
          Loading queue...
        </div>
      ) : activeTickets.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-secondary mb-2">Queue is Empty</h2>
          {/* Empty really means empty here. */}
          <p className="text-muted">Patients will appear here after queue tickets are created.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Patient</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase hidden md:table-cell">Chief Complaint</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Triage</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase hidden sm:table-cell">Wait</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeFiltered.map((ticket) => {
                const appointment = appointmentById.get(ticket.appointment);
                const triage = triageStyles[normalizeTriage(ticket.triage_level)];
                const status = statusConfig[ticket.queue_status] || statusConfig.waiting;
                return (
                  <tr key={ticket.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-semibold text-secondary">{ticket.queue_number}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${status.color}`} />
                        <span className="text-xs text-muted">{status.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-secondary">
                      {appointment?.patient_name || "Patient"}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted hidden md:table-cell">
                      {appointment?.reason || "No complaint recorded"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={triage.badge} size="sm">
                        {triage.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted hidden sm:table-cell">
                      {ticket.estimated_wait_minutes} min
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {ticket.queue_status !== "in_progress" && (
                          <button
                            onClick={() => startConsultation(ticket)}
                            disabled={updatingId === ticket.id}
                            title="Start Consultation"
                            className="p-1.5 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
                          >
                            <Play size={14} />
                          </button>
                        )}
                        {ticket.queue_status === "in_progress" ? (
                          <button
                            onClick={() => completeConsultation(ticket)}
                            disabled={updatingId === ticket.id}
                            title="Complete Consultation"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            <CheckCircle size={14} />
                            <span className="hidden lg:inline">Complete</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => skipPatient(ticket)}
                            disabled={updatingId === ticket.id}
                            title="Skip patient"
                            className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors disabled:opacity-50"
                          >
                            <SkipForward size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {activeFiltered.length === 0 && (
            <div className="p-8 text-center text-muted">No queue tickets match this filter.</div>
          )}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-muted">
              Showing {activeFiltered.length} of {activeTickets.length} active tickets
            </span>
            <span className="text-xs text-muted">
              {tickets.filter((ticket) => ticket.queue_status === "done").length} completed
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
