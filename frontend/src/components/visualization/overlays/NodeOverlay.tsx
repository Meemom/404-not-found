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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
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
            className="fixed bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto bg-gradient-to-b from-slate-900 to-slate-800 border-t border-slate-700 rounded-t-3xl shadow-2xl z-50"
          >
            {/* Header with close button */}
            <div className="sticky top-0 bg-gradient-to-b from-slate-900 to-slate-900/80 backdrop-blur pt-6 px-6 pb-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-700/50 border border-slate-600">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-xs font-semibold text-slate-300">
                      {nodeType}
                    </span>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white">{nodeLabel}</h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="flex-shrink-0 p-2 hover:bg-slate-700 rounded-lg transition-colors ml-4"
              >
                <X size={24} className="text-slate-400" />
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
