import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, PersonStanding, Moon, X } from "lucide-react";
import { useBurnoutStore } from "../store";

const REMINDER_CONFIG = {
  hydration: {
    Icon: Droplets,
    title: "Hydration check",
    body: "You've been deep in flow. Time for a glass of water.",
    color: "#67e8f9",
  },
  stretch: {
    Icon: PersonStanding,
    title: "Stretch break",
    body: "5 sessions in. Roll your shoulders, stand up, breathe.",
    color: "#86efac",
  },
  rest: {
    Icon: Moon,
    title: "Rest signal",
    body: "You've logged 7+ consecutive sessions. You've done great work — rest is part of the practice.",
    color: "#c084fc",
  },
};

export default function BurnoutDetector() {
  const { showReminder, reminderType, dismissReminder } = useBurnoutStore();
  const cfg = REMINDER_CONFIG[reminderType];

  return (
    <AnimatePresence>
      {showReminder && cfg && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90vw] max-w-sm"
        >
          <div
            className="rounded-2xl p-4 backdrop-blur-md border"
            style={{
              background: `${cfg.color}12`,
              borderColor: `${cfg.color}33`,
            }}
          >
            <div className="flex items-start gap-3">
              <cfg.Icon
                size={20}
                style={{ color: cfg.color }}
                className="flex-shrink-0 mt-0.5"
              />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium" style={{ color: cfg.color }}>
                  {cfg.title}
                </p>
                <p className="text-xs text-white/50 leading-relaxed">
                  {cfg.body}
                </p>
              </div>
              <button
                onClick={dismissReminder}
                aria-label="Dismiss"
                className="text-white/20 hover:text-white/50 transition-colors flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
