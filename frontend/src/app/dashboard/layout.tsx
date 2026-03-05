"use client";

import { useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { useWardenStore } from "@/lib/store";
import { getDashboardOverview, getCompanyProfile, getPendingActions } from "@/lib/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarOpen, setCompany, setDashboard, setPendingActions } =
    useWardenStore();

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [company, dashboard, actions] = await Promise.all([
          getCompanyProfile(),
          getDashboardOverview(),
          getPendingActions(),
        ]);
        setCompany(company);
        setDashboard(dashboard);
        setPendingActions(actions);
      } catch (err) {
        console.error("Failed to load initial data:", err);
      }
    }

    loadInitialData();

    // Poll dashboard every 30 seconds
    const interval = setInterval(async () => {
      try {
        const [dashboard, actions] = await Promise.all([
          getDashboardOverview(),
          getPendingActions(),
        ]);
        setDashboard(dashboard);
        setPendingActions(actions);
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [setCompany, setDashboard, setPendingActions]);

  return (
    <div className="flex h-screen bg-warden-bg-primary overflow-hidden">
      <Sidebar />
      <div
        className="flex-1 flex flex-col transition-all duration-300"
        style={{ marginLeft: sidebarOpen ? 256 : 64 }}
      >
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
