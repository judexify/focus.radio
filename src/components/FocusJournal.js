import React, { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Square,
  Crosshair,
  Diamond,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useJournal } from "../hooks/useJournal";
import { formatDuration, formatRelativeDay } from "../utils/time";

const MODE_COLORS = { Deep: "#c084fc", Focus: "#67e8f9", Drift: "#86efac" };
const MODE_ICONS = {
  Deep: <Square size={14} strokeWidth={1.5} />,
  Focus: <Crosshair size={14} strokeWidth={1.5} />,
  Drift: <Diamond size={14} strokeWidth={1.5} />,
};

const JournalEntry = memo(function JournalEntry({ entry }) {
  const [open, setOpen] = useState(false);
  // Use saved session color if present, amber for partial, else mode default
  const modeDefault = MODE_COLORS[entry.mode] || "#67e8f9";
  const color = entry.color || (entry.partial ? "#fbbf24" : modeDefault);
  const time = new Date(entry.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      layout
      className="border border-white/5 rounded-xl overflow-hidden"
      style={{ background: `${color}08` }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 p-3 text-left"
      >
        <span style={{ color }} className="flex-shrink-0">
          {MODE_ICONS[entry.mode]}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-white/70 text-sm truncate">
            {entry.intent || "(no intent set)"}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-white/30 text-xs font-mono">
              {time} · {formatDuration(entry.duration)}
            </p>
            {entry.partial && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full text-white/30 border border-white/10">
                partial
              </span>
            )}
          </div>
        </div>
        <span
          className="text-xs font-mono px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ color, background: `${color}22` }}
        >
          {entry.mode}
        </span>
        <span
          className="text-white/20 flex-shrink-0"
          style={{ color: "rgba(255,255,255,0.2)" }}
        >
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 border-t border-white/5 space-y-2 pt-2">
              {entry.intent && (
                <div>
                  <p className="text-xs text-white/20 font-mono uppercase tracking-widest mb-1">
                    Intent
                  </p>
                  <p className="text-white/50 text-sm">{entry.intent}</p>
                </div>
              )}
              {entry.reflection && (
                <div>
                  <p className="text-xs text-white/20 font-mono uppercase tracking-widest mb-1">
                    Reflection
                  </p>
                  <p className="text-white/60 text-sm leading-relaxed">
                    {entry.reflection}
                  </p>
                </div>
              )}
              {entry.partial && !entry.reflection && (
                <p className="text-white/20 text-xs font-mono italic">
                  Session ended early — no reflection logged
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default function FocusJournal() {
  const { groupedByDay } = useJournal();

  if (groupedByDay.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
        <p className="text-xs uppercase tracking-widest text-white/30 font-mono mb-2">
          Journal
        </p>
        <p className="text-white/30 text-sm text-center py-6">
          Complete your first session to start your journal.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 space-y-4">
      <p className="text-xs uppercase tracking-widest text-white/30 font-mono">
        Session Journal
      </p>
      <div className="space-y-5">
        {groupedByDay.map(({ day, items }) => (
          <div key={day} className="space-y-2">
            <p className="text-xs text-white/20 font-mono uppercase tracking-widest">
              {formatRelativeDay(day)}
              <span className="ml-2 text-white/10">
                {formatDuration(
                  items.reduce((a, e) => a + (e.duration || 0), 0),
                )}
              </span>
            </p>
            <div className="space-y-1.5">
              {items.map((entry) => (
                <JournalEntry key={entry.id} entry={entry} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
