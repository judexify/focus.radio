import React, { memo } from "react";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { useStreakStore } from "../store";

export default memo(function StreakBadge() {
  const { currentStreak, longestStreak, totalSessions } = useStreakStore();

  if (totalSessions === 0) return null;

  return (
    <div className="flex items-center gap-3">
      {currentStreak > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/10"
        >
          <Flame size={13} className="text-amber-400" />
          <span className="text-xs font-mono text-amber-400">
            {currentStreak} day streak
          </span>
        </motion.div>
      )}
      <span className="text-xs font-mono text-white/20">
        {totalSessions} sessions · best {longestStreak}d
      </span>
    </div>
  );
});
