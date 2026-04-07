"use client";

import { BarChart3, TrendingUp, Clock, Users } from "lucide-react";
import StatCard from "@/components/ui/StatCard";

const trendData = [
  { day: "Mon", appointments: 18 }, { day: "Tue", appointments: 24 }, { day: "Wed", appointments: 22 },
  { day: "Thu", appointments: 28 }, { day: "Fri", appointments: 20 }, { day: "Sat", appointments: 15 }, { day: "Sun", appointments: 8 },
];

const workloadData = [
  { doctor: "Dr. Karimov", patients: 8 }, { doctor: "Dr. Rahimova", patients: 6 },
  { doctor: "Dr. Toshmatov", patients: 10 }, { doctor: "Dr. Abdullaev", patients: 5 },
  { doctor: "Dr. Sultanova", patients: 7 }, { doctor: "Dr. Khamidov", patients: 4 },
];

const specialtyData = [
  { name: "Cardiology", value: 30, color: "#0d9488" }, { name: "Neurology", value: 22, color: "#14b8a6" },
  { name: "General Practice", value: 28, color: "#f59e0b" }, { name: "Pulmonology", value: 12, color: "#3b82f6" },
  { name: "Other", value: 8, color: "#ef4444" },
];

const waitData = [
  { day: "Mon", wait: 22 }, { day: "Tue", wait: 18 }, { day: "Wed", wait: 25 },
  { day: "Thu", wait: 15 }, { day: "Fri", wait: 20 }, { day: "Sat", wait: 12 }, { day: "Sun", wait: 10 },
];

const maxAppt = Math.max(...trendData.map((d) => d.appointments));
const maxWorkload = Math.max(...workloadData.map((d) => d.patients));
const maxWait = Math.max(...waitData.map((d) => d.wait));

export default function AnalyticsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary mb-6">Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total This Week" value="135" change="+12%" trend="up" icon={<TrendingUp size={20} />} />
        <StatCard title="Avg Daily" value="19.3" change="-3%" trend="down" icon={<BarChart3 size={20} />} />
        <StatCard title="Avg Wait Time" value="18 min" change="-15%" trend="up" icon={<Clock size={20} />} />
        <StatCard title="Active Doctors" value="6" icon={<Users size={20} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointment Trends */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-secondary mb-4">Appointment Trends</h2>
          <div className="flex items-end gap-2 h-48">
            {trendData.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-muted">{d.appointments}</span>
                <div className="w-full bg-primary/80 rounded-t-md transition-all hover:bg-primary" style={{ height: `${(d.appointments / maxAppt) * 100}%` }} />
                <span className="text-xs text-muted">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Doctor Workload */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-secondary mb-4">Doctor Workload (Today)</h2>
          <div className="space-y-3">
            {workloadData.map((d) => (
              <div key={d.doctor} className="flex items-center gap-3">
                <span className="text-sm text-muted w-28 truncate">{d.doctor}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div className="h-full bg-primary rounded-full flex items-center justify-end pr-2" style={{ width: `${(d.patients / maxWorkload) * 100}%` }}>
                    <span className="text-xs text-white font-medium">{d.patients}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Specialty Demand */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-secondary mb-4">Specialty Demand</h2>
          <div className="space-y-3">
            {specialtyData.map((s) => (
              <div key={s.name} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-sm text-secondary flex-1">{s.name}</span>
                <span className="text-sm font-semibold text-secondary">{s.value}%</span>
                <div className="w-24 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${s.value}%`, backgroundColor: s.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wait Time Trends */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-secondary mb-4">Wait Time Trends (minutes)</h2>
          <div className="flex items-end gap-2 h-48">
            {waitData.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-muted">{d.wait}</span>
                <div className="w-full bg-amber-400/80 rounded-t-md transition-all hover:bg-amber-500" style={{ height: `${(d.wait / maxWait) * 100}%` }} />
                <span className="text-xs text-muted">{d.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
