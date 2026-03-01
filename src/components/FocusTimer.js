import React, { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Square,
  Crosshair,
  Diamond,
  Play,
  Pause,
  RotateCcw,
  Check,
  ExternalLink,
} from "lucide-react";
import { useTimerStore, useAudioStore } from "../store";
import { useTimer } from "../hooks/useTimer";
import { useJournal } from "../hooks/useJournal";
import { formatTime } from "../utils/time";

const DURATION_OPTIONS = [
  { label: "25m", secs: 25 * 60 },
  { label: "50m", secs: 50 * 60 },
  { label: "90m", secs: 90 * 60 },
  { label: "2h", secs: 120 * 60 },
  { label: "2.5h", secs: 150 * 60 },
  { label: "3h", secs: 180 * 60 },
  { label: "4h", secs: 240 * 60 },
  { label: "5h", secs: 300 * 60 },
  { label: "6h", secs: 360 * 60 },
];

const COLOR_OPTIONS = [
  { label: "Cyan", hex: "#67e8f9" },
  { label: "Purple", hex: "#c084fc" },
  { label: "Green", hex: "#86efac" },
  { label: "Indigo", hex: "#818cf8" },
  { label: "Rose", hex: "#fb7185" },
  { label: "Amber", hex: "#fbbf24" },
  { label: "Orange", hex: "#fb923c" },
  { label: "Teal", hex: "#2dd4bf" },
  { label: "Sky", hex: "#38bdf8" },
  { label: "Lime", hex: "#a3e635" },
];

const MODE_ICONS = {
  Deep: <Square size={15} strokeWidth={1.5} />,
  Focus: <Crosshair size={15} strokeWidth={1.5} />,
  Drift: <Diamond size={15} strokeWidth={1.5} />,
};

const MODE_DEFAULTS = { Deep: 90 * 60, Focus: 50 * 60, Drift: 25 * 60 };

function CircularProgress({ progress, color, size = 220 }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg
      width={size}
      height={size}
      className="absolute inset-0"
      style={{ transform: "rotate(-90deg)" }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={1.5}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeDasharray={circ}
        animate={{ strokeDashoffset: circ * (1 - progress) }}
        transition={{ duration: 0.5, ease: "linear" }}
        style={{ filter: `drop-shadow(0 0 6px ${color})` }}
      />
    </svg>
  );
}

export default function FocusTimer() {
  const {
    mode,
    status,
    elapsed,
    intent,
    MODES,
    customDuration,
    sessionColor,
    tools,
    setMode,
    setStatus,
    setDistractionShield,
    setCustomDuration,
    setSessionColor,
  } = useTimerStore();
  const { setPausedForFocus } = useAudioStore();
  const { start, pause, resume, reset, duration } = useTimer();
  const { saveSession } = useJournal();

  const modeConfig = MODES[mode];
  const activeColor = sessionColor || modeConfig.color;
  const isCustomDuration =
    customDuration !== null && customDuration !== MODE_DEFAULTS[mode];
  const progress = elapsed / duration;
  const remaining = Math.max(0, duration - elapsed);
  const isIdle = status === "idle";
  const isRunning = status === "running";
  const isPaused = status === "paused";
  const isActive = isRunning || isPaused;

  // Read tools directly from store to always get latest
  const liveTools = useTimerStore((s) => s.tools) || [];

  useEffect(() => {
    setDistractionShield(mode === "Deep" && status === "running");
  }, [mode, status, setDistractionShield]);

  const handleReset = useCallback(() => {
    if (elapsed >= 60) {
      saveSession({
        mode,
        duration: elapsed,
        intent: intent || "",
        reflection: "",
        partial: true,
        color: sessionColor,
        customDuration,
      });
    }
    setPausedForFocus(false);
    reset();
  }, [
    elapsed,
    mode,
    intent,
    sessionColor,
    customDuration,
    saveSession,
    reset,
    setPausedForFocus,
  ]);

  const selectedDuration = customDuration || modeConfig.duration;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 space-y-5">
      {/* Mode selector */}
      {isIdle && (
        <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
          {Object.entries(MODES).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`flex-1 py-2 rounded-lg text-xs font-mono transition-all flex flex-col items-center gap-1 ${
                mode === key
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              <span
                style={{
                  color: mode === key ? sessionColor || cfg.color : undefined,
                }}
              >
                {MODE_ICONS[key]}
              </span>
              <span className="tracking-widest uppercase">{key}</span>
              <span className="text-white/30 text-[10px]">
                {cfg.duration / 60}m
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Timer face */}
      <div className="flex flex-col items-center">
        <div
          className="relative flex items-center justify-center"
          style={{ width: 220, height: 220 }}
        >
          <CircularProgress
            progress={isActive ? progress : 0}
            color={activeColor}
          />
          <div className="text-center space-y-1 z-10">
            <div
              className="font-mono text-5xl tracking-tighter tabular-nums"
              style={{
                color: activeColor,
                textShadow: `0 0 30px ${activeColor}55`,
              }}
            >
              {formatTime(remaining)}
            </div>
            <p className="text-white/30 text-xs font-mono uppercase tracking-widest">
              {isRunning
                ? "running"
                : isPaused
                  ? "paused"
                  : isIdle
                    ? modeConfig.label
                    : ""}
            </p>
            {isActive && isCustomDuration && (
              <p className="text-white/20 text-[10px] font-mono">
                {customDuration >= 3600
                  ? `${customDuration / 3600}h`
                  : `${customDuration / 60}m`}{" "}
                custom
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Duration picker */}
      {isIdle && (
        <div className="space-y-2">
          <p className="text-xs font-mono uppercase tracking-widest text-white/25">
            Duration
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {DURATION_OPTIONS.map(({ label, secs }) => {
              const isSelected = selectedDuration === secs;
              return (
                <motion.button
                  key={secs}
                  whileTap={{ scale: 0.92 }}
                  onClick={() =>
                    setCustomDuration(
                      secs === modeConfig.duration ? null : secs,
                    )
                  }
                  className="px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all"
                  style={{
                    background: isSelected
                      ? `${activeColor}22`
                      : "rgba(255,255,255,0.05)",
                    border: isSelected
                      ? `1px solid ${activeColor}66`
                      : "1px solid rgba(255,255,255,0.08)",
                    color: isSelected ? activeColor : "rgba(255,255,255,0.4)",
                  }}
                >
                  {label}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Color picker */}
      {isIdle && (
        <div className="space-y-2">
          <p className="text-xs font-mono uppercase tracking-widest text-white/25">
            Session color
          </p>
          <div className="flex gap-2 flex-wrap">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setSessionColor(null)}
              className="w-7 h-7 rounded-full border-2 flex items-center justify-center"
              style={{
                background: `conic-gradient(${COLOR_OPTIONS.map((c, i) => `${c.hex} ${(i / COLOR_OPTIONS.length) * 100}% ${((i + 1) / COLOR_OPTIONS.length) * 100}%`).join(", ")})`,
                borderColor: sessionColor === null ? "white" : "transparent",
                opacity: sessionColor === null ? 1 : 0.5,
              }}
            >
              {sessionColor === null && (
                <Check size={11} className="text-white drop-shadow" />
              )}
            </motion.button>
            {COLOR_OPTIONS.map(({ hex, label }) => {
              const sel = sessionColor === hex;
              return (
                <motion.button
                  key={hex}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSessionColor(sel ? null : hex)}
                  title={label}
                  className="w-7 h-7 rounded-full border-2 flex items-center justify-center"
                  style={{
                    background: hex,
                    borderColor: sel ? "white" : "transparent",
                    boxShadow: sel ? `0 0 10px ${hex}88` : "none",
                  }}
                >
                  {sel && <Check size={11} className="text-black" />}
                </motion.button>
              );
            })}
          </div>
          {sessionColor && (
            <p className="text-white/20 text-xs font-mono">
              Custom color ·{" "}
              <button
                onClick={() => setSessionColor(null)}
                className="text-white/30 hover:text-white/50 underline"
              >
                reset
              </button>
            </p>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        {isIdle && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setStatus("ritual")}
            className="flex-1 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
            style={{
              background: `${activeColor}22`,
              color: activeColor,
              border: `1px solid ${activeColor}44`,
            }}
          >
            <Play size={15} /> Start Session
          </motion.button>
        )}
        {isRunning && (
          <>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={pause}
              className="flex-1 py-3 rounded-xl text-sm text-white/60 border border-white/10 hover:border-white/20 transition-colors flex items-center justify-center gap-2"
            >
              <Pause size={15} /> Pause
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleReset}
              className="px-4 py-3 rounded-xl text-sm text-white/30 border border-white/10 hover:border-white/20 transition-colors"
            >
              <RotateCcw size={15} />
            </motion.button>
          </>
        )}
        {isPaused && (
          <>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={resume}
              className="flex-[2] py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
              style={{
                background: `${activeColor}22`,
                color: activeColor,
                border: `1px solid ${activeColor}44`,
              }}
            >
              <Play size={15} /> Resume
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleReset}
              className="flex-1 py-3 rounded-xl text-sm text-white/40 border border-white/10 flex items-center justify-center gap-2"
            >
              <RotateCcw size={14} /> End
            </motion.button>
          </>
        )}
      </div>

      {/* ── Tools tray ── */}
      {liveTools.length > 0 && (
        <div className="space-y-2 border-t border-white/5 pt-4">
          <p className="text-xs font-mono uppercase tracking-widest text-white/40">
            Your tools
          </p>
          <div className="flex flex-wrap gap-2">
            {liveTools.map((tool) => {
              const name = tool?.name || String(tool);
              const href = tool?.url || `https://${name.toLowerCase()}.com`;
              return (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono"
                  style={{
                    background: `${activeColor}18`,
                    border: `1px solid ${activeColor}40`,
                    color: activeColor,
                    textDecoration: "none",
                  }}
                >
                  {tool?.clean && (
                    <span className="text-[9px] uppercase opacity-50 mr-1">
                      clean
                    </span>
                  )}
                  {name}
                  <ExternalLink size={10} className="opacity-50" />
                </a>
              );
            })}
          </div>
        </div>
      )}

      {isActive && (
        <p className="text-center text-xs font-mono text-white/20">
          {formatTime(elapsed)} elapsed
          {elapsed >= 60 && (
            <span className="ml-2 text-white/15">
              · ending early saves progress
            </span>
          )}
        </p>
      )}
    </div>
  );
}
