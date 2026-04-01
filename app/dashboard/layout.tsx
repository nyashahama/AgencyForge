import { MockDashboardProvider } from "./components/mock-state";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MockDashboardProvider>{children}</MockDashboardProvider>;
}
