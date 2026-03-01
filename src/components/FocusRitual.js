import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTimerStore, useAudioStore } from "../store";
import { useAudioEngine } from "../hooks/useAudioEngine";
import { VolumeX, Music, ArrowRight } from "lucide-react";
import { useTimer } from "../hooks/useTimer";

//  Breathing Animation
function BreathingCircle({ onComplete }) {
  const [phase, setPhase] = useState("inhale"); // inhale | hold | exhale
  const [count, setCount] = useState(0);
  const TOTAL_CYCLES = 2; // 2 full breaths before start

  useEffect(() => {
    const phases = [
      { name: "inhale", duration: 4000 },
      { name: "hold", duration: 2000 },
      { name: "exhale", duration: 4000 },
    ];

    let phaseIndex = 0;
    let cycleCount = 0;

    const advance = () => {
      phaseIndex = (phaseIndex + 1) % 3;
      if (phaseIndex === 0) {
        cycleCount++;
        setCount(cycleCount);
        if (cycleCount >= TOTAL_CYCLES) {
          onComplete();
          return;
        }
      }
      setPhase(phases[phaseIndex].name);
      timerId = setTimeout(advance, phases[phaseIndex].duration);
    };

    let timerId = setTimeout(advance, phases[0].duration);
    return () => clearTimeout(timerId);
  }, [onComplete]);

  const PHASE_CONFIG = {
    inhale: { scale: 1.6, label: "Breathe in…", color: "#67e8f9" },
    hold: { scale: 1.6, label: "Hold…", color: "#818cf8" },
    exhale: { scale: 1.0, label: "Breathe out…", color: "#86efac" },
  };
  const cfg = PHASE_CONFIG[phase];

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-12">
      <div className="relative flex items-center justify-center">
        {/* Outer glow ring */}
        <motion.div
          className="absolute rounded-full opacity-20"
          style={{ width: 200, height: 200, background: cfg.color }}
          animate={{ scale: cfg.scale * 0.9 }}
          transition={{
            duration: phase === "inhale" ? 4 : phase === "exhale" ? 4 : 0.2,
            ease: "easeInOut",
          }}
        />
        {/* Main circle */}
        <motion.div
          className="rounded-full flex items-center justify-center"
          style={{
            width: 120,
            height: 120,
            background: `${cfg.color}22`,
            border: `1px solid ${cfg.color}55`,
          }}
          animate={{ scale: cfg.scale }}
          transition={{
            duration: phase === "inhale" ? 4 : phase === "exhale" ? 4 : 0.2,
            ease: "easeInOut",
          }}
        >
          <span className="text-3xl">○</span>
        </motion.div>
      </div>

      <div className="text-center space-y-1">
        <motion.p
          key={phase}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white/70 text-lg font-light tracking-wide"
        >
          {cfg.label}
        </motion.p>
        <p className="text-white/30 text-xs font-mono">
          Breath {Math.min(count + 1, TOTAL_CYCLES)} of {TOTAL_CYCLES}
        </p>
      </div>
    </div>
  );
}

// Main Ritual Component
export default function FocusRitual({ onSessionSaved }) {
  const {
    status,
    mode,
    intent,
    MODES,
    sessionColor,
    customDuration,
    setStatus,
    setIntent,
    setReflection,
    reset,
  } = useTimerStore();
  const { isPlaying, setPausedForFocus } = useAudioStore();
  const { stopForFocus } = useAudioEngine();
  const { start } = useTimer();
  const [localReflection, setLocalReflection] = useState("");
  const [stopMusic, setStopMusic] = useState(false);

  const handleIntentSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (!intent.trim()) return;
      if (stopMusic && isPlaying) {
        stopForFocus();
        setPausedForFocus(true);
      }
      setStatus("breathing");
    },
    [intent, setStatus, stopMusic, isPlaying, stopForFocus, setPausedForFocus],
  );

  const handleBreathingComplete = useCallback(() => {
    setStatus("running");
    start();
  }, [setStatus, start]);

  const handleReflectionSubmit = useCallback(
    (e) => {
      e.preventDefault();
      setReflection(localReflection);
      onSessionSaved?.({
        mode,
        intent,
        reflection: localReflection,
        color: sessionColor || null,
        customDuration: customDuration || null,
      });
      setLocalReflection("");
      setPausedForFocus(false); // clear banner after session ends
      reset();
    },
    [
      localReflection,
      mode,
      intent,
      sessionColor,
      customDuration,
      setReflection,
      onSessionSaved,
      reset,
      setPausedForFocus,
    ],
  );

  const modeConfig = MODES[mode];

  return (
    <AnimatePresence mode="wait">
      {/*  Intent Phase  */}
      {status === "ritual" && (
        <motion.div
          key="intent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 space-y-5"
        >
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-widest text-white/30 font-mono">
              Set Your Intent
            </p>
            <p className="text-white/80 text-base font-light">
              What are you working on?
            </p>
          </div>

          <form onSubmit={handleIntentSubmit} className="space-y-4">
            <textarea
              autoFocus
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder="e.g. Finish the product brief, deep-read chapter 3…"
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white/80
                         placeholder-white/20 text-sm resize-none focus:outline-none
                         focus:border-white/20 transition-colors"
            />
            {/* Stop music toggle — only shown if radio is playing */}
            {isPlaying && (
              <button
                type="button"
                onClick={() => setStopMusic((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all"
                style={{
                  background: stopMusic
                    ? "rgba(103,232,249,0.1)"
                    : "rgba(255,255,255,0.03)",
                  borderColor: stopMusic
                    ? "rgba(103,232,249,0.3)"
                    : "rgba(255,255,255,0.1)",
                }}
              >
                <div className="flex items-center gap-2 text-left">
                  {stopMusic ? (
                    <VolumeX size={16} className="text-cyan-400" />
                  ) : (
                    <Music size={16} className="text-white/50" />
                  )}
                  <div>
                    <p className="text-xs font-mono text-white/60 uppercase tracking-widest">
                      {stopMusic ? "Music will pause" : "Keep music playing"}
                    </p>
                    <p className="text-white/25 text-xs">tap to toggle</p>
                  </div>
                </div>
                <div
                  className="w-9 h-5 rounded-full relative transition-all flex-shrink-0"
                  style={{
                    background: stopMusic
                      ? "rgba(103,232,249,0.4)"
                      : "rgba(255,255,255,0.1)",
                  }}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                    style={{ left: stopMusic ? "18px" : "2px" }}
                  />
                </div>
              </button>
            )}

            <button
              type="submit"
              disabled={!intent.trim()}
              className="w-full py-3 rounded-xl text-sm font-medium transition-all
                         disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: modeConfig?.color + "33",
                color: modeConfig?.color,
                border: `1px solid ${modeConfig?.color}44`,
              }}
            >
              <span className="flex items-center justify-center gap-2">
                Begin Breathing Exercise <ArrowRight size={14} />
              </span>
            </button>
          </form>
        </motion.div>
      )}

      {/* Breathing Phase */}
      {status === "breathing" && (
        <motion.div
          key="breathing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6"
        >
          <p className="text-xs uppercase tracking-widest text-white/30 font-mono text-center mb-2">
            Centering
          </p>
          <BreathingCircle onComplete={handleBreathingComplete} />
        </motion.div>
      )}

      {/*  Reflection Phase  */}
      {status === "reflection" && (
        <motion.div
          key="reflection"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 space-y-5"
        >
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-widest text-white/30 font-mono">
              Session Complete ✦
            </p>
            <p className="text-white/70 text-sm font-light">
              You worked on:{" "}
              <span className="text-white/90 italic">"{intent}"</span>
            </p>
          </div>

          <form onSubmit={handleReflectionSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-white/40 font-mono">
                How did it go?
              </label>
              <textarea
                autoFocus
                value={localReflection}
                onChange={(e) => setLocalReflection(e.target.value)}
                placeholder="What did you accomplish? Any blockers?"
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white/80
                           placeholder-white/20 text-sm resize-none focus:outline-none
                           focus:border-white/20 transition-colors"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  onSessionSaved?.({
                    mode,
                    intent,
                    reflection: "",
                    color: sessionColor || null,
                    customDuration: customDuration || null,
                  });
                  reset();
                }}
                className="flex-1 py-2.5 rounded-xl text-sm text-white/40 border border-white/10 hover:border-white/20 transition-colors"
              >
                Skip
              </button>
              <button
                type="submit"
                className="flex-[2] py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: modeConfig?.color + "33",
                  color: modeConfig?.color,
                  border: `1px solid ${modeConfig?.color}44`,
                }}
              >
                Save Session
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
