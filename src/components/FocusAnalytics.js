import React, { memo } from "react";
import { useAnalytics } from "../hooks/useJournal";
import { formatDuration } from "../utils/time";

const StatCard = memo(function StatCard({
  label,
  value,
  sub,
  color = "#67e8f9",
}) {
  return (
    <div
      className="rounded-xl p-3 border border-white/5 flex flex-col gap-1"
      style={{ background: `${color}08` }}
    >
      <p className="text-xs font-mono uppercase tracking-widest text-white/30">
        {label}
      </p>
      <p className="text-xl font-mono" style={{ color }}>
        {value}
      </p>
      {sub && <p className="text-xs text-white/20">{sub}</p>}
    </div>
  );
});

function ModeBar({ breakdown }) {
  const total = Object.values(breakdown).reduce((a, v) => a + v, 0);
  if (!total) return null;

  const COLORS = { Deep: "#c084fc", Focus: "#67e8f9", Drift: "#86efac" };

  return (
    <div className="space-y-2">
      <p className="text-xs font-mono uppercase tracking-widest text-white/30">
        This Week
      </p>
      <div className="flex rounded-full overflow-hidden h-2 gap-0.5">
        {Object.entries(breakdown).map(([mode, sec]) => (
          <div
            key={mode}
            style={{
              width: `${(sec / total) * 100}%`,
              background: COLORS[mode] || "#888",
            }}
          />
        ))}
      </div>
      <div className="flex gap-3">
        {Object.entries(breakdown).map(([mode, sec]) => (
          <div key={mode} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: COLORS[mode] }}
            />
            <span className="text-xs text-white/40 font-mono">
              {mode} {formatDuration(sec)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FocusAnalytics() {
  const {
    totalFocusToday,
    totalFocusWeek,
    modeBreakdown,
    bestTimeLabel,
    longestSession,
    currentStreak,
    longestStreak,
    totalSessions,
  } = useAnalytics();

  if (totalSessions === 0) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 space-y-4">
      <p className="text-xs uppercase tracking-widest text-white/30 font-mono">
        Analytics
      </p>

      <div className="grid grid-cols-2 gap-2">
        <StatCard
          label="Today"
          value={formatDuration(totalFocusToday)}
          sub="focused"
          color="#67e8f9"
        />
        <StatCard
          label="This Week"
          value={formatDuration(totalFocusWeek)}
          sub="total"
          color="#818cf8"
        />
        <StatCard
          label="Streak"
          value={`${currentStreak}d`}
          sub={`Best: ${longestStreak}d`}
          color="#c084fc"
        />
        <StatCard
          label="Peak Time"
          value={bestTimeLabel}
          sub="most productive"
          color="#86efac"
        />
      </div>

      {Object.keys(modeBreakdown).length > 0 && (
        <ModeBar breakdown={modeBreakdown} />
      )}

      <div className="border-t border-white/5 pt-3">
        <p className="text-xs text-white/20 font-mono text-center">
          {totalSessions} sessions · longest {formatDuration(longestSession)}
        </p>
      </div>
    </div>
  );
}
