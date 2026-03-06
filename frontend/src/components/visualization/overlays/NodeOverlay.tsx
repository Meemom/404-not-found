"use client";

import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface NodeOverlayProps {
  isOpen: boolean;
  nodeId: string | null;
  nodeType: string;
  nodeLabel: string;
  children: ReactNode;
  onClose: () => void;
}

export function NodeOverlay({
  isOpen,
  nodeId,
  nodeType,
  nodeLabel,
  children,
  onClose,
}: NodeOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />

          {/* Slide-up overlay */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
            }}
            className="fixed bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto rounded-t-3xl shadow-2xl z-50"
            style={{
              background: "var(--w-ob-surface)",
              borderTop: "1px solid var(--w-ob-border)",
            }}
          >
            {/* Header with close button */}
            <div
              className="sticky top-0 backdrop-blur pt-6 px-6 pb-4 flex items-center justify-between"
              style={{
                background: "var(--w-ob-surface)",
                borderBottom: "1px solid var(--w-ob-border)",
              }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full"
                    style={{
                      background: "var(--w-ob-bg-tint)",
                      border: "1px solid var(--w-ob-border)",
                    }}
                  >
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-xs font-semibold" style={{ color: "var(--w-ob-text-muted)" }}>
                      {nodeType}
                    </span>
                  </div>
                </div>
                <h2 className="text-2xl font-bold" style={{ color: "var(--w-ob-text)" }}>{nodeLabel}</h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="flex-shrink-0 p-2 rounded-lg transition-colors ml-4"
                style={{ color: "var(--w-ob-text-faint)" }}
              >
                <X size={24} />
              </motion.button>
            </div>

            {/* Content */}
            <div className="p-6">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}