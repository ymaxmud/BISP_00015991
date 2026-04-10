"use client";

import { useState } from "react";
import {
  Calendar,
  Stethoscope,
  Clock,
  UserX,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const appointmentTrends = [
  { day: "Mon", appointments: 32 },
  { day: "Tue", appointments: 28 },
  { day: "Wed", appointments: 35 },
  { day: "Thu", appointments: 24 },
  { day: "Fri", appointments: 40 },
  { day: "Sat", appointments: 18 },
  { day: "Sun", appointments: 12 },
];

const doctorWorkload = [
  { name: "Dr. Karimov", patients: 8 },
  { name: "Dr. Yusupova", patients: 6 },
  { name: "Dr. Rakhimov", patients: 5 },
  { name: "Dr. Sultanova", patients: 7 },
  { name: "Dr. Mirzaev", patients: 4 },
  { name: "Dr. Nazarova", patients: 3 },
];

const flaggedPatients = [
  {
    id: 1,
    name: "Sardor Alimov",
    reason: "Missed 3 consecutive appointments",
    urgency: "danger" as const,
    doctor: "Dr. Karimov",
  },
  {
    id: 2,
    name: "Nilufar Ergasheva",
    reason: "Blood pressure readings abnormally high",
    urgency: "warning" as const,
    doctor: "Dr. Sultanova",
  },
  {
    id: 3,
    name: "Timur Khasanov",
    reason: "Post-surgery follow-up overdue by 5 days",
    urgency: "danger" as const,
    doctor: "Dr. Rakhimov",
  },
];

export default function OrgDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted mt-1">
          Overview of your clinic operations for today
        </p>
      </div>

      {/* Top-line clinic health metrics for a quick daily overview. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Appointments Today"
          value={24}
          change="+12% from yesterday"
          trend="up"
          icon={<Calendar size={22} />}
        />
        <StatCard
          title="Active Doctors"
          value={6}
          change="All present"
          trend="up"
          icon={<Stethoscope size={22} />}
        />
        <StatCard
          title="Average Wait Time"
          value="18 min"
          change="-3 min from last week"
          trend="down"
          icon={<Clock size={22} />}
        />
        <StatCard
          title="No-Show Rate"
          value="8.3%"
          change="+1.2% from last week"
          trend="up"
          icon={<UserX size={22} />}
        />
      </div>

      {/* Charts add a little trend detail beyond the headline numbers. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Appointment Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={appointmentTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 13 }} />
                  <YAxis tick={{ fontSize: 13 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="appointments"
                    stroke="#0d9488"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#0d9488" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Doctor Workload</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={doctorWorkload} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 13 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={110}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="patients"
                    fill="#0d9488"
                    radius={[0, 6, 6, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* This section pulls urgent follow-up cases into one obvious place. */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              Flagged Patients
            </CardTitle>
            <button className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ChevronRight size={14} />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-gray-100">
            {flaggedPatients.map((patient) => (
              <div
                key={patient.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {patient.name}
                  </p>
                  <p className="text-xs text-muted">{patient.reason}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted">{patient.doctor}</span>
                  <Badge variant={patient.urgency} size="sm">
                    {patient.urgency === "danger" ? "Urgent" : "Warning"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
