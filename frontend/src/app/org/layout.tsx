import DashboardLayout from "@/components/layout/DashboardLayout";

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout role="org">{children}</DashboardLayout>;
}
