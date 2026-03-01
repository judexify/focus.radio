import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useJournalStore } from "../store";
import { formatDuration } from "../utils/time";

const MODE_COLORS = { Deep: "#c084fc", Focus: "#67e8f9", Drift: "#86efac" };

// Aggregate journal entries by intent (work item)
function useWorkStats() {
  const { entries } = useJournalStore();

  return useMemo(() => {
    if (!entries.length) return [];

    const map = {};

    entries.forEach((e) => {
      const key = (e.intent || "(untitled)").trim().toLowerCase();
      const display = (e.intent || "(untitled)").trim();

      if (!map[key]) {
        map[key] = {
          intent: display,
          totalSeconds: 0,
          sessions: 0,
          modes: {},
          lastWorked: 0,
          reflections: [],
        };
      }

      map[key].totalSeconds += e.duration || 0;
      map[key].sessions += 1;
      map[key].modes[e.mode] =
        (map[key].modes[e.mode] || 0) + (e.duration || 0);
      map[key].lastWorked = Math.max(map[key].lastWorked, e.timestamp || 0);

      if (e.reflection) {
        map[key].reflections.push({ text: e.reflection, ts: e.timestamp });
      }
    });

    return Object.values(map).sort((a, b) => b.totalSeconds - a.totalSeconds);
  }, [entries]);
}

function RelativeTime({ ts }) {
  const now = Date.now();
  const diff = now - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);

  let label;
  if (m < 2) label = "just now";
  else if (h < 1) label = `${m}m ago`;
  else if (d < 1) label = `${h}h ago`;
  else if (d < 7) label = `${d}d ago`;
  else label = new Date(ts).toLocaleDateString();

  return <span className="text-white/25 font-mono text-xs">{label}</span>;
}

function ModeBar({ modes }) {
  const total = Object.values(modes).reduce((a, v) => a + v, 0);
  if (!total) return null;

  return (
    <div className="flex rounded-full overflow-hidden h-1 gap-px">
      {Object.entries(modes).map(([mode, sec]) => (
        <div
          key={mode}
          title={`${mode}: ${formatDuration(sec)}`}
          style={{
            width: `${(sec / total) * 100}%`,
            background: MODE_COLORS[mode] || "#888",
          }}
        />
      ))}
    </div>
  );
}

function WorkCard({ item, rank }) {
  const [expanded, setExpanded] = useState(false);
  const topMode =
    Object.entries(item.modes).sort((a, b) => b[1] - a[1])[0]?.[0] || "Focus";
  const color = MODE_COLORS[topMode] || "#67e8f9";

  // "Locked in" threshold: 3+ sessions or 2+ hours total
  const isLockedIn = item.sessions >= 3 || item.totalSeconds >= 7200;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.05 }}
      className="rounded-xl border border-white/8 overflow-hidden"
      style={{ background: `${color}0a` }}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full p-3.5 text-left space-y-2.5"
      >
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Rank badge */}
            <span
              className="text-xs font-mono flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: `${color}22`, color }}
            >
              {rank + 1}
            </span>

            <p className="text-white/80 text-sm truncate font-light leading-snug">
              {item.intent}
            </p>
          </div>

          {/* Locked in badge */}
          {isLockedIn && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-mono"
              style={{
                background: `${color}22`,
                color,
                border: `1px solid ${color}44`,
              }}
            >
              🔒 locked in
            </motion.span>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-mono text-sm" style={{ color }}>
            {formatDuration(item.totalSeconds)}
          </span>
          <span className="text-white/20 text-xs font-mono">
            {item.sessions} session{item.sessions !== 1 ? "s" : ""}
          </span>
          <RelativeTime ts={item.lastWorked} />
          <span className="ml-auto text-white/15 text-xs">
            {expanded ? "▲" : "▼"}
          </span>
        </div>

        {/* Mode breakdown bar */}
        <ModeBar modes={item.modes} />
      </button>

      {/* Expanded: mode breakdown + reflections */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-white/5">
              {/* Per-mode time */}
              <div className="pt-3 space-y-1.5">
                <p className="text-xs font-mono uppercase tracking-widest text-white/20 mb-2">
                  Time by mode
                </p>
                {Object.entries(item.modes).map(([m, sec]) => (
                  <div key={m} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: MODE_COLORS[m] || "#888" }}
                      />
                      <span className="text-xs font-mono text-white/40">
                        {m}
                      </span>
                    </div>
                    <span
                      className="text-xs font-mono"
                      style={{ color: MODE_COLORS[m] }}
                    >
                      {formatDuration(sec)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Reflections */}
              {item.reflections.length > 0 && (
                <div className="space-y-2 border-t border-white/5 pt-3">
                  <p className="text-xs font-mono uppercase tracking-widest text-white/20">
                    Notes
                  </p>
                  {item.reflections.slice(0, 3).map((r, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-white/15 mt-0.5">—</span>
                      <p className="text-white/45 text-xs leading-relaxed">
                        {r.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function WorkStats() {
  const stats = useWorkStats();
  const { entries } = useJournalStore();

  if (!entries.length) return null;

  const totalSeconds = stats.reduce((a, s) => a + s.totalSeconds, 0);
  const lockedInCount = stats.filter(
    (s) => s.sessions >= 3 || s.totalSeconds >= 7200,
  ).length;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/30 font-mono">
            Work Log
          </p>
          <p className="text-white/50 text-xs mt-0.5 font-light">
            Time tracked per project
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-mono text-white/60">
            {formatDuration(totalSeconds)}
          </p>
          <p className="text-xs text-white/20 font-mono">
            {stats.length} projects
          </p>
        </div>
      </div>

      {/* Locked in summary */}
      {lockedInCount > 0 && (
        <div
          className="rounded-xl p-3 flex items-center gap-3"
          style={{
            background: "rgba(103,232,249,0.07)",
            border: "1px solid rgba(103,232,249,0.15)",
          }}
        >
          <span className="text-xl">🔒</span>
          <div>
            <p className="text-white/70 text-sm">
              Locked in on{" "}
              <span className="text-cyan-400">{lockedInCount}</span> project
              {lockedInCount !== 1 ? "s" : ""}
            </p>
            <p className="text-white/25 text-xs font-mono">
              3+ sessions or 2h+ tracked
            </p>
          </div>
        </div>
      )}

      {/* Work cards list */}
      <div className="space-y-2">
        {stats.map((item, i) => (
          <WorkCard key={item.intent} item={item} rank={i} />
        ))}
      </div>
    </div>
  );
}
