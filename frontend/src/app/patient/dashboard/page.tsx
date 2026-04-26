"use client";

/**
 * Patient dashboard (route: `/patient/dashboard`).
 *
 * Landing screen after a patient logs in. Personal greeting (read
 * from `user_data` in localStorage), upcoming appointments,
 * reminders, and quick-action cards (Book, Find Doctor, Symptoms).
 */
import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Pill,
  Bell,
  CheckCircle2,
  Clock,
  ArrowRight,
  Upload,
  ClipboardList,
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

const upcomingAppointments = [
  {
    id: "apt-1",
    doctorName: "Dr. Anvar Karimov",
    specialty: "General Practitioner",
    date: "April 8, 2026",
    time: "09:30 AM",
    status: "scheduled" as const,
  },
  {
    id: "apt-2",
    doctorName: "Dr. Nilufar Abdullayeva",
    specialty: "Dermatologist",
    date: "April 12, 2026",
    time: "02:00 PM",
    status: "scheduled" as const,
  },
  {
    id: "apt-3",
    doctorName: "Dr. Rustam Toshmatov",
    specialty: "Cardiologist",
    date: "April 18, 2026",
    time: "11:00 AM",
    status: "scheduled" as const,
  },
];

const statusBadge: Record<string, { label: string; variant: "info" | "success" | "danger" | "default" }> = {
  scheduled: { label: "Scheduled", variant: "info" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "danger" },
  no_show: { label: "No Show", variant: "default" },
};

export default function PatientDashboardPage() {
  const [userName] = useState(() => {
    try {
      const raw = localStorage.getItem("user_data");
      if (raw) {
        const data = JSON.parse(raw);
        if (typeof data.first_name === "string" && data.first_name.trim()) {
          return data.first_name;
        }
      }
    } catch {}
    return "Sardor";
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pl-12 md:pl-0">
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {userName}
        </h1>
        <p className="text-muted mt-1">
          Here is an overview of your health dashboard.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Upcoming Appointments"
          value={3}
          change="+1 this week"
          trend="up"
          icon={<Calendar size={22} />}
        />
        <StatCard
          title="Active Prescriptions"
          value={5}
          trend="neutral"
          icon={<Pill size={22} />}
        />
        <StatCard
          title="Pending Reminders"
          value={2}
          change="2 today"
          trend="up"
          icon={<Bell size={22} />}
        />
        <StatCard
          title="Completed Visits"
          value={12}
          change="+3 this month"
          trend="up"
          icon={<CheckCircle2 size={22} />}
        />
      </div>

      {/* Upcoming Appointments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Upcoming Appointments
          </h2>
          <Link href="/patient/appointments">
            <Button variant="ghost" size="sm">
              View All <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {upcomingAppointments.map((apt) => {
            const badge = statusBadge[apt.status];
            return (
              <Card key={apt.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-foreground">
                        {apt.doctorName}
                      </p>
                      <p className="text-sm text-muted">{apt.specialty}</p>
                    </div>
                    <Badge variant={badge.variant} size="sm">
                      {badge.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted mt-4">
                    <Clock size={14} />
                    <span>
                      {apt.date} at {apt.time}
                    </span>
                  </div>
                  <div className="mt-4">
                    <Link href={`/patient/intake/${apt.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/patient/appointments">
            <Card className="cursor-pointer group">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-100 transition-colors">
                  <Calendar size={22} />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    Book Appointment
                  </p>
                  <p className="text-sm text-muted">
                    Schedule a new visit
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/patient/uploads">
            <Card className="cursor-pointer group">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                  <Upload size={22} />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    Upload Report
                  </p>
                  <p className="text-sm text-muted">
                    Submit lab results or documents
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/patient/prescriptions">
            <Card className="cursor-pointer group">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
                  <ClipboardList size={22} />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    View Prescriptions
                  </p>
                  <p className="text-sm text-muted">
                    Check active medications
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
