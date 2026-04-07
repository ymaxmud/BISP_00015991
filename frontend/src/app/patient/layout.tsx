import DashboardLayout from "@/components/layout/DashboardLayout";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout role="patient">{children}</DashboardLayout>;
}
