"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  ChevronDown,
  ChevronUp,
  Shield,
  Truck,
  Mail,
  AlertTriangle,
} from "lucide-react";
import { useWardenStore } from "@/lib/store";
import {
  getPendingActions,
  getAllActions,
  approveAction,
  dismissAction,
} from "@/lib/api";
import { formatEUR, getUrgencyColor } from "@/lib/utils";
import type { PendingAction } from "@/lib/types";

const typeIcons: Record<string, React.ReactNode> = {
  expedite: <Truck size={16} />,
  email: <Mail size={16} />,
  reorder: <Shield size={16} />,
  alert: <AlertTriangle size={16} />,
};

function ActionCard({
  action,
  onApprove,
  onDismiss,
}: {
  action: PendingAction;
  onApprove: () => void;
  onDismiss: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isPending = action.status === "pending";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`warden-card border p-4 ${
        isPending
          ? "border-warden-amber/20"
          : action.status === "approved"
          ? "border-warden-teal/20 opacity-70"
          : "border-warden-border opacity-50"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
            isPending
              ? "bg-warden-amber/10 text-warden-amber"
              : action.status === "approved"
              ? "bg-warden-teal/10 text-warden-teal"
              : "bg-white/5 text-warden-text-tertiary"
          }`}
        >
          {typeIcons[action.type] || <Zap size={16} />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-warden-text-primary">
                {action.title}
              </h3>
              <p className="text-[11px] text-warden-text-tertiary mt-0.5">
                {action.description}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Urgency badge */}
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${getUrgencyColor(
                  action.urgency
                )}`}
              >
                {action.urgency}
              </span>
              {/* Confidence */}
              <span className="font-data text-xs text-warden-text-secondary">
                {action.confidence}%
              </span>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-2 text-[10px] text-warden-text-tertiary">
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {new Date(action.created_at).toLocaleDateString()}
            </span>
            {action.estimated_cost_eur && (
              <span>
                Cost: <span className="font-data">{formatEUR(action.estimated_cost_eur)}</span>
              </span>
            )}
            {action.estimated_saving_eur && (
              <span>
                Saves:{" "}
                <span className="font-data text-warden-teal">
                  {formatEUR(action.estimated_saving_eur)}
                </span>
              </span>
            )}
          </div>

          {/* Expandable detail */}
          {action.detail && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-[10px] text-warden-text-tertiary hover:text-warden-amber transition-colors mt-2"
            >
              {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              {expanded ? "Hide details" : "Show details"}
            </button>
          )}
          <AnimatePresence>
            {expanded && action.detail && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <p className="text-xs text-warden-text-secondary mt-2 p-3 bg-warden-bg-primary rounded-lg border border-warden-border/50 leading-relaxed">
                  {action.detail}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action buttons */}
          {isPending && (
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={onApprove}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-warden-teal/10 text-warden-teal text-xs font-medium rounded-lg hover:bg-warden-teal/20 border border-warden-teal/30 transition-colors"
              >
                <CheckCircle size={12} /> Approve
              </button>
              <button
                onClick={onDismiss}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-white/5 text-warden-text-tertiary text-xs font-medium rounded-lg hover:bg-white/10 border border-warden-border transition-colors"
              >
                <XCircle size={12} /> Dismiss
              </button>
            </div>
          )}

          {/* Status badges for non-pending */}
          {!isPending && (
            <div className="flex items-center gap-1.5 mt-2">
              {action.status === "approved" ? (
                <span className="flex items-center gap-1 text-[10px] text-warden-teal font-medium">
                  <CheckCircle size={10} /> Approved
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-warden-text-tertiary font-medium">
                  <XCircle size={10} /> Dismissed
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function ActionsPage() {
  const { pendingActions, setPendingActions, updatePendingAction } =
    useWardenStore();
  const [allActions, setAllActions] = useState<PendingAction[]>([]);
  const [tab, setTab] = useState<"pending" | "all">("pending");

  useEffect(() => {
    getPendingActions().then(setPendingActions).catch(console.error);
    getAllActions().then(setAllActions).catch(console.error);
  }, [setPendingActions]);

  const handleApprove = async (id: string) => {
    try {
      const updated = await approveAction(id);
      updatePendingAction(id, updated);
      setAllActions((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "approved" } : a))
      );
    } catch (err) {
      console.error("Failed to approve:", err);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      const updated = await dismissAction(id);
      updatePendingAction(id, updated);
      setAllActions((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "dismissed" } : a))
      );
    } catch (err) {
      console.error("Failed to dismiss:", err);
    }
  };

  const displayActions = tab === "pending" ? pendingActions : allActions;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warden-amber/10 border border-warden-amber/30 flex items-center justify-center">
            <Zap size={20} className="text-warden-amber" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-warden-text-primary">
              Action Queue
            </h1>
            <p className="text-[11px] text-warden-text-tertiary">
              {pendingActions.length} pending actions awaiting review
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-warden-bg-elevated rounded-xl border border-warden-border w-fit">
        {(["pending", "all"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
              tab === t
                ? "bg-warden-amber/10 text-warden-amber border border-warden-amber/30"
                : "text-warden-text-tertiary hover:text-warden-text-secondary"
            }`}
          >
            {t === "pending"
              ? `Pending (${pendingActions.length})`
              : `All (${allActions.length})`}
          </button>
        ))}
      </div>

      {/* Actions list */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {displayActions.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              onApprove={() => handleApprove(action.id)}
              onDismiss={() => handleDismiss(action.id)}
            />
          ))}
        </AnimatePresence>

        {displayActions.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-12 h-12 rounded-full bg-warden-teal/10 flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={24} className="text-warden-teal" />
            </div>
            <p className="text-sm text-warden-text-secondary">
              {tab === "pending"
                ? "No pending actions — you're all caught up"
                : "No actions recorded yet"}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
