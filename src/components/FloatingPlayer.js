import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { useAudioStore, useTimerStore } from "../store";
import { useAudioEngine } from "../hooks/useAudioEngine";
import { useTimer } from "../hooks/useTimer";
import { formatTime } from "../utils/time";

const MODE_COLORS = { Deep: "#c084fc", Focus: "#67e8f9", Drift: "#86efac" };

export default function FloatingPlayer() {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const constraintsRef = useRef(null);
  const dragControls = useDragControls();

  const { isPlaying, radioVolume, streamFailed, setRadioVolume } =
    useAudioStore();
  const { status, mode, elapsed, MODES } = useTimerStore();
  const { togglePlay } = useAudioEngine();
  const { pause, resume } = useTimer();

  const color = MODE_COLORS[mode] || "#67e8f9";
  const modeConfig = MODES[mode];
  const duration = modeConfig?.duration ?? 50 * 60;
  const remaining = Math.max(0, duration - elapsed);
  const progress = elapsed / duration;
  const isRunning = status === "running";
  const isPaused = status === "paused";
  const isActive = isRunning || isPaused;

  const handleTimerToggle = useCallback(() => {
    if (isRunning) pause();
    else if (isPaused) resume();
  }, [isRunning, isPaused, pause, resume]);

  if (dismissed) return null;

  return (
    <div
      ref={constraintsRef}
      className="fixed inset-0 z-40 pointer-events-none"
    >
      <motion.div
        drag
        dragControls={dragControls}
        dragConstraints={constraintsRef}
        dragElastic={0.08}
        dragMomentum={false}
        className="absolute pointer-events-auto"
        style={{ top: 12, left: "50%", x: "-50%" }}
      >
        <AnimatePresence mode="wait">
          {/* Collapsed pill */}
          {!expanded && (
            <motion.div
              key="pill"
              initial={{ scaleX: 0.7, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              exit={{ scaleX: 0.7, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={() => setExpanded(true)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-full cursor-pointer select-none"
              style={{
                background: "rgba(10,10,16,0.92)",
                border: `1px solid ${color}44`,
                backdropFilter: "blur(20px)",
                boxShadow: `0 0 20px ${color}22, 0 4px 24px rgba(0,0,0,0.5)`,
                minWidth: 180,
              }}
            >
              {/* Pulse dot */}
              <motion.span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: color }}
                animate={
                  isPlaying
                    ? { scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }
                    : { scale: 1, opacity: 0.4 }
                }
                transition={{ repeat: Infinity, duration: 2 }}
              />

              {/* Label */}
              <span className="text-xs font-mono text-white/60 flex-1 truncate">
                {streamFailed ? "offline drone" : "lo‑fi radio"}
              </span>

              {/* Timer countdown */}
              {isActive && (
                <span
                  className="text-xs font-mono tabular-nums"
                  style={{ color }}
                >
                  {formatTime(remaining)}
                </span>
              )}

              {/* Play / pause */}
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}22` }}
              >
                <span className="text-xs leading-none" style={{ color }}>
                  {isPlaying ? "⏸" : "▶"}
                </span>
              </motion.button>
            </motion.div>
          )}

          {/* Expanded island */}
          {expanded && (
            <motion.div
              key="island"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="rounded-3xl overflow-hidden select-none"
              style={{
                background: "rgba(8,8,14,0.96)",
                border: `1px solid ${color}33`,
                backdropFilter: "blur(24px)",
                boxShadow: `0 0 40px ${color}18, 0 8px 40px rgba(0,0,0,0.7)`,
                width: 280,
              }}
            >
              {/* Drag handle */}
              <div
                className="flex items-center justify-center py-2.5 cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="w-8 h-1 rounded-full bg-white/15" />
              </div>

              <div className="px-4 pb-4 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-mono uppercase tracking-widest text-white/25">
                      {streamFailed ? "⚡ offline mode" : "📻 lo‑fi radio"}
                    </p>
                    <p className="text-white/60 text-sm font-light mt-0.5">
                      {isPlaying ? "Now playing" : "Paused"}
                    </p>
                  </div>
                  <button
                    onClick={() => setExpanded(false)}
                    className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors text-sm leading-none"
                  >
                    ↓
                  </button>
                </div>

                {/* Session progress arc */}
                {isActive && (
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <svg
                        className="absolute inset-0 -rotate-90"
                        width="48"
                        height="48"
                      >
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          fill="none"
                          stroke="rgba(255,255,255,0.07)"
                          strokeWidth="2"
                        />
                        <motion.circle
                          cx="24"
                          cy="24"
                          r="20"
                          fill="none"
                          stroke={color}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 20}
                          animate={{
                            strokeDashoffset: 2 * Math.PI * 20 * (1 - progress),
                          }}
                          transition={{ duration: 0.5, ease: "linear" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span
                          className="text-[10px] font-mono"
                          style={{ color }}
                        >
                          {Math.round(progress * 100)}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p
                        className="font-mono tabular-nums text-lg leading-none"
                        style={{ color }}
                      >
                        {formatTime(remaining)}
                      </p>
                      <p className="text-white/25 text-xs font-mono mt-0.5">
                        {mode} · {isRunning ? "running" : "paused"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Audio play/pause + volume */}
                <div className="flex items-center gap-3">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={togglePlay}
                    className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `${color}22`,
                      border: `1px solid ${color}44`,
                    }}
                  >
                    <span className="text-lg leading-none" style={{ color }}>
                      {isPlaying ? "⏸" : "▶"}
                    </span>
                  </motion.button>

                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[10px] font-mono text-white/25 uppercase tracking-widest">
                        Volume
                      </span>
                      <span className="text-[10px] font-mono text-white/25">
                        {Math.round(radioVolume * 100)}
                      </span>
                    </div>
                    <div className="relative h-1 rounded-full bg-white/10">
                      <div
                        className="absolute h-full rounded-full pointer-events-none"
                        style={{
                          width: `${radioVolume * 100}%`,
                          background: color,
                        }}
                      />
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={radioVolume}
                        onChange={(e) =>
                          setRadioVolume(parseFloat(e.target.value))
                        }
                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Timer session toggle */}
                {isActive && (
                  <button
                    onClick={handleTimerToggle}
                    className="w-full py-2 rounded-xl text-xs font-mono transition-all border"
                    style={{
                      color,
                      borderColor: `${color}33`,
                      background: `${color}0f`,
                    }}
                  >
                    {isRunning ? "⏸  Pause session" : "▶  Resume session"}
                  </button>
                )}

                {/* Dismiss */}
                <button
                  onClick={() => {
                    setExpanded(false);
                    setDismissed(true);
                  }}
                  className="w-full text-center text-[10px] font-mono text-white/15 hover:text-white/30 transition-colors"
                >
                  hide floating player
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
