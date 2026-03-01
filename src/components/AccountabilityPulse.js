import React, { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccountability } from "../hooks/useAccountability";

const ActivityItem = memo(function ActivityItem({ item }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-2 py-1"
    >
      <span
        className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0"
        style={{ boxShadow: "0 0 4px #4ade80" }}
      />
      <p className="text-xs text-white/30 truncate">{item.msg}</p>
    </motion.div>
  );
});

export default function AccountabilityPulse() {
  const { listenerCount, recentActivity } = useAccountability();

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 space-y-3">
      {/* Listener count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.span
            className="w-2 h-2 rounded-full bg-green-400"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            style={{ boxShadow: "0 0 6px #4ade80" }}
          />
          <span className="text-xs font-mono text-white/40 uppercase tracking-widest">
            Live
          </span>
        </div>
        <div className="text-right">
          <span className="text-sm font-mono text-white/60">
            {listenerCount.toLocaleString()}
          </span>
          <span className="text-xs text-white/20 ml-1">focused</span>
        </div>
      </div>

      {/* Activity feed */}
      <div className="min-h-[60px] space-y-0.5">
        <AnimatePresence initial={false}>
          {recentActivity.slice(0, 3).map((item) => (
            <ActivityItem key={item.id} item={item} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
