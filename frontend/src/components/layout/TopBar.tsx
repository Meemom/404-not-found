"use client";

import { Bell, Activity, Clock, MessageSquare } from "lucide-react";
import { useWardenStore } from "@/lib/store";
import { formatCompact } from "@/lib/utils";
import Link from "next/link";

export function TopBar() {
  const { dashboard, agentActive } = useWardenStore();

  return (
    <header className="sticky top-0 z-30 h-14 bg-warden-bg-secondary/80 backdrop-blur-xl border-b border-warden-border flex items-center justify-between px-6">
      {/* Left: Risk score */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              (dashboard?.risk_score ?? 0) > 60
                ? "bg-warden-coral animate-pulse"
                : (dashboard?.risk_score ?? 0) > 30
                ? "bg-warden-amber"
                : "bg-warden-teal"
            }`}
          />
          <span className="text-xs text-warden-text-tertiary uppercase tracking-wider font-medium">
            Risk Score
          </span>
          <span className="font-data text-lg font-bold text-warden-text-primary">
            {dashboard?.risk_score ?? "--"}/100
          </span>
        </div>

        <div className="h-6 w-px bg-warden-border" />

        <div className="flex items-center gap-2">
          <span className="text-xs text-warden-text-tertiary uppercase tracking-wider font-medium">
            Revenue at Risk
          </span>
          <span className="font-data text-lg font-bold text-warden-amber">
            {dashboard ? formatCompact(dashboard.revenue_at_risk_eur) : "--"}
          </span>
        </div>
      </div>

      {/* Right: Status indicators + actions */}
      <div className="flex items-center gap-4">
        {/* Agent active indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warden-teal/10 border border-warden-teal/30">
          <Activity size={12} className="text-warden-teal animate-pulse" />
          <span className="text-[11px] font-medium text-warden-teal">
            {agentActive ? "Agent Active" : "Agent Idle"}
          </span>
        </div>

        {/* Alerts */}
        <button className="relative p-2 rounded-lg hover:bg-warden-bg-elevated transition-colors">
          <Bell size={18} className="text-warden-text-secondary" />
          {(dashboard?.active_alerts ?? 0) > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-warden-coral text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {dashboard?.active_alerts}
            </span>
          )}
        </button>

        {/* Ask Warden */}
        <Link
          href="/dashboard/copilot"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-warden-amber/20 to-warden-amber/5 border border-warden-amber/30 rounded-lg hover:border-warden-amber/50 transition-all group"
        >
          <MessageSquare
            size={14}
            className="text-warden-amber group-hover:text-warden-amber-glow transition-colors"
          />
          <span className="text-xs font-medium text-warden-amber group-hover:text-warden-amber-glow transition-colors">
            Ask Warden
          </span>
        </Link>

        {/* Last updated */}
        <div className="flex items-center gap-1.5 text-warden-text-tertiary">
          <Clock size={12} />
          <span className="text-[10px]">
            {dashboard?.last_updated
              ? new Date(dashboard.last_updated).toLocaleTimeString()
              : "Syncing..."}
          </span>
        </div>
      </div>
    </header>
  );
}
