"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Calendar, Pill, Bell, Upload, Star, Users, Settings,
  ListOrdered, UserSearch, Brain, FileText, UserCircle, BarChart3,
  Building2, Menu, X, Activity,
} from "lucide-react";

const navItems: Record<string, { label: string; href: string; icon: React.ReactNode }[]> = {
  patient: [
    { label: "Dashboard", href: "/patient/dashboard", icon: <LayoutDashboard size={20} /> },
    { label: "Appointments", href: "/patient/appointments", icon: <Calendar size={20} /> },
    { label: "Prescriptions", href: "/patient/prescriptions", icon: <Pill size={20} /> },
    { label: "Reminders", href: "/patient/reminders", icon: <Bell size={20} /> },
    { label: "Uploads", href: "/patient/uploads", icon: <Upload size={20} /> },
    { label: "Reviews", href: "/patient/reviews", icon: <Star size={20} /> },
    { label: "Family", href: "/patient/family", icon: <Users size={20} /> },
    { label: "Settings", href: "/patient/settings", icon: <Settings size={20} /> },
  ],
  doctor: [
    { label: "Dashboard", href: "/doctor/dashboard", icon: <LayoutDashboard size={20} /> },
    { label: "Queue", href: "/doctor/queue", icon: <ListOrdered size={20} /> },
    { label: "Patients", href: "/doctor/patients", icon: <UserSearch size={20} /> },
    { label: "Prescriptions", href: "/doctor/prescriptions", icon: <Pill size={20} /> },
    { label: "AI Assistant", href: "/doctor/ai", icon: <Brain size={20} /> },
    { label: "Reports", href: "/doctor/reports", icon: <FileText size={20} /> },
    { label: "Profile", href: "/doctor/profile", icon: <UserCircle size={20} /> },
    { label: "Settings", href: "/doctor/settings", icon: <Settings size={20} /> },
  ],
  org: [
    { label: "Dashboard", href: "/org/dashboard", icon: <LayoutDashboard size={20} /> },
    { label: "Users", href: "/org/users", icon: <Users size={20} /> },
    { label: "Doctors", href: "/org/doctors", icon: <UserSearch size={20} /> },
    { label: "Appointments", href: "/org/appointments", icon: <Calendar size={20} /> },
    { label: "Queues", href: "/org/queues", icon: <ListOrdered size={20} /> },
    { label: "Analytics", href: "/org/analytics", icon: <BarChart3 size={20} /> },
    { label: "Reviews", href: "/org/reviews", icon: <Star size={20} /> },
    { label: "Settings", href: "/org/settings", icon: <Settings size={20} /> },
  ],
};

export default function DashboardSidebar({ role }: { role: "patient" | "doctor" | "org" }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = navItems[role] || [];

  const roleLabel = role === "org" ? "Clinic Admin" : role === "doctor" ? "Doctor" : "Patient";

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-100">
            <Link href="/" className="flex items-center gap-2">
              <Activity className="text-primary" size={24} />
              <span className="text-xl font-bold text-secondary">Avicenna</span>
            </Link>
            <p className="text-xs text-muted mt-1">{roleLabel} Portal</p>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-teal-50 text-primary"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Bottom */}
          <div className="p-4 border-t border-gray-100">
            <Link
              href="/"
              className="text-sm text-muted hover:text-gray-900 transition-colors"
            >
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
