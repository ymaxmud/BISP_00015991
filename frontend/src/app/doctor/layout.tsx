import DashboardLayout from "@/components/layout/DashboardLayout";

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout role="doctor">{children}</DashboardLayout>;
}
