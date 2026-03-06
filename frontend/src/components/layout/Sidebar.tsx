"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Globe2,
  GitBranch,
  CheckSquare,
  Brain,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWardenStore } from "@/lib/store";
import { CompanyAvatar } from "./CompanyAvatar";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/copilot", label: "Co-Pilot", icon: MessageSquare },
  { href: "/dashboard/globe", label: "Supply Globe", icon: Globe2 },
  { href: "/dashboard/cascade", label: "Cascade", icon: GitBranch },
  { href: "/dashboard/actions", label: "Actions", icon: CheckSquare },
  { href: "/dashboard/memory", label: "Memory", icon: Brain },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, company, pendingActions } =
    useWardenStore();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen flex flex-col border-r border-warden-border bg-warden-bg-secondary transition-all duration-300",
        sidebarOpen ? "w-64" : "w-[68px]"
      )}
    >
      {/* Logo + Company */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-warden-border">
        <CompanyAvatar
          initials={company?.avatar?.initials || "AG"}
          color={company?.avatar?.color || "#2D5A8E"}
          size="sm"
          animated
        />
        {sidebarOpen && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-warden-text-primary truncate">
              {company?.name || "AutoParts GmbH"}
            </span>
            <span className="text-[10px] text-warden-text-tertiary truncate">
              {company?.industry || "Automotive Parts"}
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname?.startsWith(item.href);
          const Icon = item.icon;
          const hasBadge =
            item.href === "/dashboard/actions" && pendingActions.length > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                isActive
                  ? "bg-warden-bg-elevated text-warden-text-primary border border-warden-border-accent"
                  : "text-warden-text-secondary hover:text-warden-text-primary hover:bg-warden-bg-elevated/50 border border-transparent"
              )}
            >
              <Icon
                size={20}
                className={cn(
                  "shrink-0 transition-colors",
                  isActive
                    ? "text-warden-amber"
                    : "text-warden-text-tertiary group-hover:text-warden-text-secondary"
                )}
              />
              {sidebarOpen && <span>{item.label}</span>}
              {hasBadge && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold bg-warden-pink text-white rounded-full">
                  {pendingActions.filter((a) => a.status === "pending").length}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Warden branding */}
      <div className="px-4 py-3 border-t border-warden-border">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-warden-amber shrink-0" />
          {sidebarOpen && (
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-gradient-amber">
                WARDEN
              </span>
              <span className="text-[10px] text-warden-text-tertiary">
                Supply Chain Co-Pilot
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute -right-3 top-20 w-6 h-6 bg-warden-bg-elevated border border-warden-border rounded-full flex items-center justify-center text-warden-text-tertiary hover:text-warden-text-primary hover:border-warden-border-accent transition-all"
      >
        {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>
    </aside>
  );
}
