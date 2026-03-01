import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTimerStore, useAudioStore } from "../store";
import { useAudioEngine } from "../hooks/useAudioEngine";
import { VolumeX, Music, ArrowRight, Wrench, X } from "lucide-react";
import { useTimer } from "../hooks/useTimer";

// Clean URL map
const CLEAN_URLS = {
  youtube: "https://www.youtube.com/results?search_query=",
  "youtube.com": "https://www.youtube.com/results?search_query=",
  twitter: "https://twitter.com/search",
  "twitter.com": "https://twitter.com/search",
  x: "https://x.com/search",
  "x.com": "https://x.com/search",
  reddit: "https://www.reddit.com/search",
  "reddit.com": "https://www.reddit.com/search",
  instagram: "https://www.instagram.com/explore",
  "instagram.com": "https://www.instagram.com/explore",
  facebook: "https://www.facebook.com/search",
  "facebook.com": "https://www.facebook.com/search",
  tiktok: "https://www.tiktok.com/search",
  "tiktok.com": "https://www.tiktok.com/search",
};

function resolveUrl(raw) {
  const key = raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
  if (CLEAN_URLS[key]) return { url: CLEAN_URLS[key], clean: true };
  if (key.includes("."))
    return {
      url: raw.startsWith("http") ? raw : `https://${raw}`,
      clean: false,
    };
  return { url: `https://${key}.com`, clean: false };
}

function getDisplayName(raw) {
  return raw
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .toLowerCase();
}

// Breathing
function BreathingCircle({ onComplete }) {
  const [phase, setPhase] = useState("inhale");
  const [count, setCount] = useState(0);
  const TOTAL = 2;

  useEffect(() => {
    const phases = [
      { name: "inhale", ms: 4000 },
      { name: "hold", ms: 2000 },
      { name: "exhale", ms: 4000 },
    ];
    let idx = 0,
      cycles = 0;
    const advance = () => {
      idx = (idx + 1) % 3;
      if (idx === 0) {
        cycles++;
        setCount(cycles);
        if (cycles >= TOTAL) {
          onComplete();
          return;
        }
      }
      setPhase(phases[idx].name);
      t = setTimeout(advance, phases[idx].ms);
    };
    let t = setTimeout(advance, phases[0].ms);
    return () => clearTimeout(t);
  }, [onComplete]);

  const cfg = {
    inhale: { scale: 1.6, label: "Breathe in…", color: "#67e8f9" },
    hold: { scale: 1.6, label: "Hold…", color: "#818cf8" },
    exhale: { scale: 1.0, label: "Breathe out…", color: "#86efac" },
  }[phase];

  return (
    <div className="flex flex-col items-center gap-8 py-12">
      <div className="relative flex items-center justify-center">
        <motion.div
          className="absolute rounded-full opacity-20"
          style={{ width: 200, height: 200, background: cfg.color }}
          animate={{ scale: cfg.scale * 0.9 }}
          transition={{
            duration: phase === "hold" ? 0.2 : 4,
            ease: "easeInOut",
          }}
        />
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
            duration: phase === "hold" ? 0.2 : 4,
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
          className="text-white/70 text-lg font-light"
        >
          {cfg.label}
        </motion.p>
        <p className="text-white/30 text-xs font-mono">
          Breath {Math.min(count + 1, TOTAL)} of {TOTAL}
        </p>
      </div>
    </div>
  );
}

// Main
export default function FocusRitual({ onSessionSaved }) {
  const {
    status,
    mode,
    intent,
    MODES,
    sessionColor,
    customDuration,
    tools,
    setStatus,
    setIntent,
    setReflection,
    setTools,
    reset,
  } = useTimerStore();
  const { isPlaying, setPausedForFocus } = useAudioStore();
  const { stopForFocus } = useAudioEngine();
  const { start } = useTimer();

  const [localReflection, setLocalReflection] = useState("");
  const [stopMusic, setStopMusic] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [toolInput, setToolInput] = useState("");

  const modeConfig = MODES[mode];
  const activeColor = sessionColor || modeConfig?.color;

  // Add tool
  const addTool = () => {
    const raw = toolInput.trim();
    if (!raw) return;
    const name = getDisplayName(raw);
    const { url, clean } = resolveUrl(raw);
    const current = useTimerStore.getState().tools || [];
    if (current.find((t) => t.name === name)) {
      setToolInput("");
      return;
    }
    setTools([...current, { name, url, clean }]);
    setToolInput("");
  };

  const removeTool = (name) => {
    const current = useTimerStore.getState().tools || [];
    setTools(current.filter((t) => t.name !== name));
  };

  //  Handlers
  const handleIntentSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (!intent.trim()) return;
      // Auto-add whatever is still typed in the tool input
      const raw = toolInput.trim();
      if (raw) {
        const name = getDisplayName(raw);
        const { url, clean } = resolveUrl(raw);
        const current = useTimerStore.getState().tools || [];
        if (!current.find((t) => t.name === name)) {
          setTools([...current, { name, url, clean }]);
        }
      }
      if (stopMusic && isPlaying) {
        stopForFocus();
        setPausedForFocus(true);
      }
      setStatus("breathing");
    },
    [
      intent,
      toolInput,
      setTools,
      setStatus,
      stopMusic,
      isPlaying,
      stopForFocus,
      setPausedForFocus,
    ],
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
        tools: (useTimerStore.getState().tools || []).map((t) => t.name),
      });
      setLocalReflection("");
      setTools([]);
      setPausedForFocus(false);
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
      setTools,
    ],
  );

  return (
    <AnimatePresence mode="wait">
      {/*  Intent */}
      {status === "ritual" && (
        <motion.div
          key="intent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 space-y-4"
        >
          <div>
            <p className="text-xs uppercase tracking-widest text-white/30 font-mono">
              Set Your Intent
            </p>
            <p className="text-white/80 text-base font-light mt-1">
              What are you working on?
            </p>
          </div>

          {/* Intent input */}
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

          {/* Tools outside the form intentionally */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowTools((v) => !v)}
              className="flex items-center gap-2 text-xs font-mono text-white/60 hover:text-white/80 transition-colors"
            >
              <Wrench size={12} />
              <span className="uppercase tracking-widest">
                {showTools ? "hide tools" : "any tools you'll need?"}
              </span>
              {tools.length > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-mono"
                  style={{ background: `${activeColor}22`, color: activeColor }}
                >
                  {tools.length}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showTools && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden space-y-3"
                >
                  <div
                    className="rounded-xl p-3 space-y-1"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <p className="text-white/50 text-xs leading-relaxed">
                      Name the tools you'll actually need — they'll open during
                      your session.
                    </p>
                    <p
                      className="text-xs font-mono"
                      style={{ color: `${activeColor}88` }}
                    >
                      Instead of opening YouTube's homepage, you open the search
                      directly.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={toolInput}
                      onChange={(e) => setToolInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.stopPropagation();
                          addTool();
                        }
                      }}
                      placeholder="youtube, figma… press Enter to add"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2
                                 text-white/70 placeholder-white/20 text-sm focus:outline-none
                                 focus:border-white/20 transition-colors font-mono"
                    />
                  </div>

                  {tools.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tools.map((tool) => (
                        <div
                          key={tool.name}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono"
                          style={{
                            background: `${activeColor}15`,
                            border: `1px solid ${activeColor}33`,
                            color: activeColor,
                          }}
                        >
                          {tool.clean && (
                            <span className="text-[9px] uppercase opacity-60">
                              clean
                            </span>
                          )}
                          {tool.name}
                          <button
                            type="button"
                            onClick={() => removeTool(tool.name)}
                            className="opacity-50 hover:opacity-100 ml-0.5"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Music toggle */}
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
              <div className="flex items-center gap-2">
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
                className="w-9 h-5 rounded-full relative transition-all"
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

          {/* Submit */}
          <form onSubmit={handleIntentSubmit}>
            <button
              type="submit"
              disabled={!intent.trim()}
              className="w-full py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                background: activeColor + "33",
                color: activeColor,
                border: `1px solid ${activeColor}44`,
              }}
            >
              Begin Breathing Exercise <ArrowRight size={14} />
            </button>
          </form>
        </motion.div>
      )}

      {/*  Breathing */}
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

      {/* Reflection*/}
      {status === "reflection" && (
        <motion.div
          key="reflection"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 space-y-5"
        >
          <div>
            <p className="text-xs uppercase tracking-widest text-white/30 font-mono">
              Session Complete ✦
            </p>
            <p className="text-white/70 text-sm font-light mt-1">
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
                    tools: (useTimerStore.getState().tools || []).map(
                      (t) => t.name,
                    ),
                  });
                  setTools([]);
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
                  background: activeColor + "33",
                  color: activeColor,
                  border: `1px solid ${activeColor}44`,
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
