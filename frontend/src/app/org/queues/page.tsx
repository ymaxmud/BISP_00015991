"use client";

/**
 * Clinic admin queue monitor (route: `/org/queues`).
 *
 * Queue monitor for the clinic.
 *
 * It groups active queue tickets by doctor.
 */
import { useEffect, useMemo, useState } from "react";
import { Clock, AlertTriangle, Users } from "lucide-react";
import Badge from "@/components/ui/Badge";
import {
  AppointmentRecord,
  QueueTicketRecord,
  appointments as appointmentsApi,
  queue as queueApi,
} from "@/lib/api";

const triageBadge: Record<string, "danger" | "warning" | "default"> = {
  urgent: "danger",
  priority: "warning",
  normal: "default",
};

export default function QueuesPage() {
  const [tickets, setTickets] = useState<QueueTicketRecord[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadQueues() {
      // Tickets have the status; appointments give us the names and reason.
      setLoading(true);
      setError("");
      const [ticketResult, appointmentResult] = await Promise.allSettled([
        queueApi.list(),
        appointmentsApi.list(),
      ]);
      if (!active) return;
      if (ticketResult.status === "fulfilled") setTickets(ticketResult.value);
      if (appointmentResult.status === "fulfilled") setAppointments(appointmentResult.value);
      if (ticketResult.status === "rejected" || appointmentResult.status === "rejected") {
        setError("Could not load queue data.");
      }
      setLoading(false);
    }
    void loadQueues();
    return () => {
      active = false;
    };
  }, []);

  const appointmentById = useMemo(() => {
    // ticket.appointment -> appointment details.
    return new Map(appointments.map((appointment) => [appointment.id, appointment]));
  }, [appointments]);

  // Summary cards use active tickets only.
  const activeTickets = tickets.filter((ticket) => ticket.queue_status !== "done");
  const totalWaiting = activeTickets.filter((ticket) => ticket.queue_status === "waiting").length;
  const avgWait =
    activeTickets.length > 0
      ? Math.round(
          activeTickets.reduce((sum, ticket) => sum + ticket.estimated_wait_minutes, 0) /
            activeTickets.length
        )
      : 0;
  const urgentCount = activeTickets.filter((ticket) => ticket.triage_level === "urgent").length;

  const groupedQueues = useMemo(() => {
    // Group by doctor so reception can see where the queue is building up.
    const groups = new Map<string, QueueTicketRecord[]>();
    activeTickets.forEach((ticket) => {
      const appointment = appointmentById.get(ticket.appointment);
      const doctor = appointment?.doctor_name || "Unassigned doctor";
      groups.set(doctor, [...(groups.get(doctor) || []), ticket]);
    });
    return Array.from(groups.entries()).map(([doctor, items]) => ({
      doctor,
      tickets: items.sort((a, b) => a.queue_number - b.queue_number),
    }));
  }, [activeTickets, appointmentById]);

  return (
    <div>
      <div className="pl-12 md:pl-0 mb-6">
        <h1 className="text-2xl font-bold text-secondary">Queue Monitor</h1>
        {error && <p className="text-sm text-amber-600 mt-2">{error}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center"><Users size={20} className="text-primary" /></div>
          <div><p className="text-sm text-muted">Total Waiting</p><p className="text-2xl font-bold text-secondary">{totalWaiting}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><Clock size={20} className="text-amber-600" /></div>
          <div><p className="text-sm text-muted">Avg Wait</p><p className="text-2xl font-bold text-secondary">{avgWait} min</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center"><AlertTriangle size={20} className="text-red-500" /></div>
          <div><p className="text-sm text-muted">Urgent Tickets</p><p className="text-lg font-bold text-secondary">{urgentCount}</p></div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-muted">
          Loading queue...
        </div>
      ) : groupedQueues.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-muted">
          {/* Quiet day, empty queue. */}
          No queue tickets yet. Patients will appear here after check-in.
        </div>
      ) : (
        <div className="space-y-6">
          {groupedQueues.map((group) => (
            <div key={group.doctor} className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-secondary">{group.doctor}</h2>
                  <p className="text-sm text-muted">Active queue</p>
                </div>
                <Badge variant="primary">{group.tickets.length} patients</Badge>
              </div>
              <div className="divide-y divide-gray-50">
                {group.tickets.map((ticket) => {
                  const appointment = appointmentById.get(ticket.appointment);
                  return (
                    <div key={ticket.id} className={`px-4 py-3 flex items-center justify-between ${ticket.estimated_wait_minutes > 30 ? "bg-amber-50/50" : ""}`}>
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-muted">{ticket.queue_number}</span>
                        <div>
                          <p className="text-sm font-medium text-secondary">
                            {appointment?.patient_name || "Patient"}
                          </p>
                          <p className="text-xs text-muted">
                            {appointment?.reason || "No complaint recorded"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={triageBadge[ticket.triage_level] || "default"} size="sm">{ticket.triage_level}</Badge>
                        <span className={`text-sm font-medium ${ticket.estimated_wait_minutes > 30 ? "text-amber-600" : "text-muted"}`}>{ticket.estimated_wait_minutes} min</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
