import React, { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Square } from "lucide-react";
import { useTimerStore } from "../store";
import { useTimer } from "../hooks/useTimer";
import { formatTime } from "../utils/time";

export default function DistractionShield() {
  const { distractionShield, mode, status, elapsed, MODES, sessionColor } =
    useTimerStore();
  const modeColor = MODES[mode]?.color;
  const activeColor = sessionColor || modeColor;
  const { pause, resume, reset } = useTimer();

  const modeConfig = MODES[mode];
  const duration = modeConfig?.duration ?? 90 * 60;
  const remaining = Math.max(0, duration - elapsed);
  const progress = elapsed / duration;

  // Keyboard handler
  const handleKey = useCallback(
    (e) => {
      if (!distractionShield) return;
      if (e.code === "Space") {
        e.preventDefault();
        status === "running" ? pause() : resume();
      }
      if (e.code === "Escape") {
        if (window.confirm("End Deep Work session?")) reset();
      }
    },
    [distractionShield, status, pause, resume, reset],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  // Request fullscreen on mount
  useEffect(() => {
    if (distractionShield && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    return () => {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [distractionShield]);

  return (
    <AnimatePresence>
      {distractionShield && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{ background: MODES[mode]?.bg ?? "#0d0010" }}
          tabIndex={0}
        >
          {/* Subtle grain overlay */}
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: "200px 200px",
            }}
          />

          <div className="relative text-center space-y-8">
            {/* Mode badge */}
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs font-mono uppercase tracking-[0.4em] text-white/20"
            >
              <span className="inline-flex items-center gap-1.5">
                <Square size={10} strokeWidth={1.5} className="inline" /> Deep
                Work
              </span>
            </motion.p>

            {/* Giant timer */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="font-mono tabular-nums select-none"
              style={{
                fontSize: "clamp(72px, 18vw, 160px)",
                color: activeColor,
                textShadow: `0 0 60px ${activeColor}33`,
                letterSpacing: "-0.05em",
              }}
            >
              {formatTime(remaining)}
            </motion.div>

            {/* Thin progress bar */}
            <div className="w-48 mx-auto h-px bg-white/10 rounded-full">
              <motion.div
                className="h-full rounded-full"
                style={{ background: activeColor }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.5, ease: "linear" }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-8">
              <button
                onClick={status === "running" ? pause : resume}
                className="text-white/30 hover:text-white/60 transition-colors text-sm font-mono tracking-widest uppercase"
              >
                {status === "running" ? "Pause  [Space]" : "Resume [Space]"}
              </button>
              <span className="text-white/10">|</span>
              <button
                onClick={() => {
                  if (window.confirm("End session?")) reset();
                }}
                className="text-white/20 hover:text-white/40 transition-colors text-sm font-mono tracking-widest uppercase"
              >
                Exit [Esc]
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
