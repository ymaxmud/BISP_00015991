"use client";

import DashboardSidebar from "./DashboardSidebar";

export default function DashboardLayout({
  role,
  children,
}: {
  role: "patient" | "doctor" | "org";
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      <DashboardSidebar role={role} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
