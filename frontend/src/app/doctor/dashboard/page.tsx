"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle,
  Play,
  Brain,
  Clock,
  ArrowRight,
  Stethoscope,
  FileText,
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

const queueData = [
  {
    id: 1,
    name: "Aziza Rahimova",
    complaint: "Persistent headache, 3 days",
    triage: "normal" as const,
    waitTime: "12 min",
    status: "waiting",
  },
  {
    id: 2,
    name: "Sardor Alimov",
    complaint: "Chest tightness, shortness of breath",
    triage: "urgent" as const,
    waitTime: "3 min",
    status: "waiting",
  },
  {
    id: 3,
    name: "Nilufar Karimova",
    complaint: "Follow-up: diabetes management",
    triage: "normal" as const,
    waitTime: "22 min",
    status: "waiting",
  },
  {
    id: 4,
    name: "Bobur Toshmatov",
    complaint: "Knee pain after injury",
    triage: "priority" as const,
    waitTime: "8 min",
    status: "waiting",
  },
  {
    id: 5,
    name: "Madina Yusupova",
    complaint: "Recurring abdominal pain",
    triage: "priority" as const,
    waitTime: "15 min",
    status: "waiting",
  },
];

const triageBadge: Record<string, { variant: "default" | "warning" | "danger"; label: string }> = {
  normal: { variant: "default", label: "Normal" },
  priority: { variant: "warning", label: "Priority" },
  urgent: { variant: "danger", label: "Urgent" },
};

const recentAnalyses = [
  {
    id: "a1",
    patientName: "Rustam Umarov",
    summary: "AI flagged potential drug interaction between Metformin and newly prescribed Ciprofloxacin.",
    riskLevel: "warning",
    time: "25 min ago",
  },
  {
    id: "a2",
    patientName: "Gulnora Sharipova",
    summary: "Lab results suggest early-stage thyroid dysfunction. TSH levels elevated at 8.2 mIU/L.",
    riskLevel: "info",
    time: "1 hr ago",
  },
  {
    id: "a3",
    patientName: "Sardor Alimov",
    summary: "Symptom pattern consistent with possible cardiac involvement. ECG recommended urgently.",
    riskLevel: "danger",
    time: "5 min ago",
  },
];

const riskBadgeVariant: Record<string, "warning" | "info" | "danger"> = {
  warning: "warning",
  info: "info",
  danger: "danger",
};

export default function DoctorDashboardPage() {
  const [queue] = useState(queueData);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, Dr. Karimov
        </h1>
        <p className="text-muted mt-1">
          Here is your overview for today. You have patients waiting.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Appointments"
          value={8}
          change="+2 from yesterday"
          trend="up"
          icon={<Calendar size={22} />}
        />
        <StatCard
          title="In Queue"
          value={5}
          change="3 new in last hour"
          trend="up"
          icon={<Users size={22} />}
        />
        <StatCard
          title="Urgent Cases"
          value={1}
          change="Needs attention"
          trend="down"
          icon={<AlertTriangle size={22} />}
        />
        <StatCard
          title="Completed Today"
          value={3}
          change="On track"
          trend="up"
          icon={<CheckCircle size={22} />}
        />
      </div>

      {/* Today's Queue */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Today&apos;s Queue</CardTitle>
            <Link href="/doctor/queue">
              <Button variant="ghost" size="sm">
                View Full Queue <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-medium text-muted">#</th>
                  <th className="text-left py-3 px-4 font-medium text-muted">Patient Name</th>
                  <th className="text-left py-3 px-4 font-medium text-muted">Chief Complaint</th>
                  <th className="text-left py-3 px-4 font-medium text-muted">Triage Level</th>
                  <th className="text-left py-3 px-4 font-medium text-muted">Wait Time</th>
                  <th className="text-left py-3 px-4 font-medium text-muted">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted">Action</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((patient) => {
                  const triage = triageBadge[patient.triage];
                  return (
                    <tr
                      key={patient.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-muted">{patient.id}</td>
                      <td className="py-3 px-4 font-medium text-foreground">
                        {patient.name}
                      </td>
                      <td className="py-3 px-4 text-muted">{patient.complaint}</td>
                      <td className="py-3 px-4">
                        <Badge variant={triage.variant} size="sm">
                          {triage.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted">
                        <span className="flex items-center gap-1">
                          <Clock size={14} /> {patient.waitTime}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 text-amber-600 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Waiting
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/doctor/consultation/${patient.id}`}>
                          <Button size="sm" variant="primary">
                            <Play size={14} /> Start
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent AI Analyses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain size={20} className="text-primary" />
              Recent AI Analyses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAnalyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground text-sm">
                        {analysis.patientName}
                      </span>
                      <Badge
                        variant={riskBadgeVariant[analysis.riskLevel]}
                        size="sm"
                      >
                        {analysis.riskLevel === "danger"
                          ? "High Risk"
                          : analysis.riskLevel === "warning"
                          ? "Moderate"
                          : "Low Risk"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted line-clamp-2">
                      {analysis.summary}
                    </p>
                    <p className="text-xs text-muted/70 mt-1">{analysis.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link href="/doctor/queue">
                <Button variant="outline" className="w-full justify-start gap-3 h-14">
                  <Users size={20} className="text-primary" />
                  <div className="text-left">
                    <p className="font-medium">View Queue</p>
                    <p className="text-xs text-muted">5 patients waiting</p>
                  </div>
                </Button>
              </Link>
              <Link href="/doctor/ai">
                <Button variant="outline" className="w-full justify-start gap-3 h-14">
                  <Brain size={20} className="text-primary" />
                  <div className="text-left">
                    <p className="font-medium">AI Assistant</p>
                    <p className="text-xs text-muted">Analyze cases</p>
                  </div>
                </Button>
              </Link>
              <Link href="/doctor/patients">
                <Button variant="outline" className="w-full justify-start gap-3 h-14">
                  <Stethoscope size={20} className="text-primary" />
                  <div className="text-left">
                    <p className="font-medium">Patient Records</p>
                    <p className="text-xs text-muted">Search and review</p>
                  </div>
                </Button>
              </Link>
              <Link href="/doctor/reports">
                <Button variant="outline" className="w-full justify-start gap-3 h-14">
                  <FileText size={20} className="text-primary" />
                  <div className="text-left">
                    <p className="font-medium">Reports</p>
                    <p className="text-xs text-muted">Lab and imaging</p>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
