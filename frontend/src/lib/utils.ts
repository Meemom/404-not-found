import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatEUR(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompact(value: number): string {
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `€${(value / 1_000).toFixed(0)}K`;
  return `€${value}`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "critical":
    case "disrupted":
    case "delayed":
      return "text-warden-coral";
    case "at_risk":
    case "below_reorder":
      return "text-warden-amber";
    case "normal":
    case "healthy":
    case "on_track":
      return "text-warden-teal";
    default:
      return "text-warden-text-secondary";
  }
}

export function getStatusBg(status: string): string {
  switch (status) {
    case "critical":
    case "disrupted":
    case "delayed":
      return "bg-warden-coral/10 border-warden-coral/30";
    case "at_risk":
    case "below_reorder":
      return "bg-warden-amber/10 border-warden-amber/30";
    case "normal":
    case "healthy":
    case "on_track":
      return "bg-warden-teal/10 border-warden-teal/30";
    default:
      return "bg-warden-bg-elevated border-warden-border";
  }
}

export function getConfidenceColor(score: number): string {
  if (score >= 0.8) return "text-warden-teal";
  if (score >= 0.6) return "text-warden-amber";
  return "text-warden-coral";
}

export function getUrgencyColor(urgency: string): string {
  switch (urgency) {
    case "critical":
      return "bg-warden-coral/20 text-warden-coral border-warden-coral/40";
    case "high":
      return "bg-warden-amber/20 text-warden-amber border-warden-amber/40";
    case "medium":
      return "bg-warden-blue/20 text-warden-blue border-warden-blue/40";
    case "low":
      return "bg-warden-teal/20 text-warden-teal border-warden-teal/40";
    default:
      return "bg-warden-bg-elevated text-warden-text-secondary";
  }
}

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date("2026-03-03"); // Demo date
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date("2026-03-03T12:00:00Z");
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function hashStringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 60%, 45%)`;
}
