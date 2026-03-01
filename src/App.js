import { Crosshair, BookOpen, Gamepad2 } from "lucide-react";
import React, { lazy, Suspense, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTimerStore, useBurnoutStore } from "./store";
import { useJournal } from "./hooks/useJournal";
import { getGreeting } from "./utils/time";

import AudioPlayer from "./components/AudioPlayer";
import FocusTimer from "./components/FocusTimer";
import FocusRitual from "./components/FocusRitual";
import DistractionShield from "./components/DistractionShield";
import BurnoutDetector from "./components/BurnoutDetector";
import StreakBadge from "./components/StreakBadge";
import AccountabilityPulse from "./components/AccountabilityPulse";
import GamesSection from "./components/GamesSection";
import WorkStats from "./components/WorkStats";
import FloatingPlayer from "./components/FloatingPlayer";
import InstallPrompt from "./components/InstallPrompt";
import WelcomeModal from "./components/WelcomeModal";
import FocusPlant from "./components/FocusPlant";
import { useMediaSession } from "./hooks/useMediaSession";
import { useAudioEngine } from "./hooks/useAudioEngine";
import { useTimer } from "./hooks/useTimer";

const FocusJournal = lazy(() => import("./components/FocusJournal"));
const FocusAnalytics = lazy(() => import("./components/FocusAnalytics"));

const GIFS = {
  idle: "https://media1.tenor.com/m/qV3Og0Ts8l4AAAAd/iu-sad.gif",
  deep: "https://media1.tenor.com/m/6ED1UQOCUS0AAAAd/walk-walking.gif",
  focus: "https://media1.tenor.com/m/qV3Og0Ts8l4AAAAd/iu-sad.gif",
  drift: "https://media1.tenor.com/m/qV3Og0Ts8l4AAAAd/iu-sad.gif",
  breathing: "https://media1.tenor.com/m/qV3Og0Ts8l4AAAAd/iu-sad.gif",
  reflection: "https://media1.tenor.com/m/6ED1UQOCUS0AAAAd/walk-walking.gif",
  paused: "https://media1.tenor.com/m/6ED1UQOCUS0AAAAd/walk-walking.gif",
};

function useActiveGif(status, mode) {
  if (status === "breathing" || status === "ritual") return GIFS.breathing;
  if (status === "reflection") return GIFS.reflection;
  if (status === "paused") return GIFS.paused;
  if (status === "running") {
    if (mode === "Deep") return GIFS.deep;
    if (mode === "Focus") return GIFS.focus;
    return GIFS.drift;
  }
  return GIFS.idle;
}

const TABS = [
  { id: "focus", label: "Focus", Icon: Crosshair },
  { id: "journal", label: "Journal", Icon: BookOpen },
  { id: "games", label: "Games", Icon: Gamepad2 },
];

function LoadingFallback() {
  return (
    <div className="rounded-2xl border border-white/5 p-5 animate-pulse h-32" />
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("focus");
  const { status, mode, MODES, sessionColor } = useTimerStore();
  const { incrementSession } = useBurnoutStore();
  const { saveSession } = useJournal();

  const isRitualOrBreathing = status === "ritual" || status === "breathing";
  const isRunningOrPaused = status === "running" || status === "paused";
  const isReflection = status === "reflection";
  const showTimerPanel = !isRitualOrBreathing && !isReflection;
  const modeConfig = MODES[mode];
  const activeColor = sessionColor || modeConfig?.color;
  const activeGif = useActiveGif(status, mode);

  const { togglePlay } = useAudioEngine();
  const { pause, resume } = useTimer();
  useMediaSession(togglePlay, pause, resume);

  const handleSessionSaved = useCallback(
    ({ intent, reflection, color, customDuration }) => {
      const duration = customDuration || MODES[mode]?.duration || 50 * 60;
      saveSession({ mode, duration, intent, reflection, color: color || null });
      incrementSession();
    },
    [mode, MODES, saveSession, incrementSession],
  );

  return (
    <div className="min-h-screen relative text-white overflow-x-hidden">
      {/* Background GIF */}
      <AnimatePresence>
        <motion.div
          key={activeGif}
          className="fixed inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
          style={{
            backgroundImage: `url("${activeGif}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            filter: "brightness(0.38) saturate(0.75)",
          }}
        />
      </AnimatePresence>

      {/* Gradient overlay */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 90% 45% at 50% 0%, ${activeColor}30 0%, transparent 60%),
            linear-gradient(180deg, rgba(5,5,8,0.35) 0%, rgba(5,5,8,0.55) 50%, rgba(5,5,8,0.80) 100%)
          `,
          transition: "background 1.2s ease",
        }}
      />

      {/* Grain */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.018] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "256px 256px",
        }}
      />

      {/* Floating island — always visible across all tabs */}
      <WelcomeModal />
      <FloatingPlayer />
      <InstallPrompt />
      <DistractionShield />
      <BurnoutDetector />

      <main className="relative z-10 max-w-md mx-auto px-4 pt-16 pb-20 space-y-4">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-end justify-between mb-2"
        >
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.35em] text-white/30 mb-1">
              {getGreeting()}
            </p>
            <h1
              className="text-2xl font-light tracking-tight"
              style={{
                fontFamily: "'Crimson Pro','Georgia',serif",
                color: "rgba(255,255,255,0.9)",
              }}
            >
              focus<span style={{ color: activeColor }}>.</span>radio
            </h1>
          </div>
          <StreakBadge />
        </motion.header>

        {/* Tab bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex gap-1.5 p-1 rounded-2xl border border-white/10"
          style={{
            background: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(12px)",
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative flex-1 py-2.5 rounded-xl text-sm font-mono transition-all duration-200 flex items-center justify-center gap-2"
                style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.35)" }}
              >
                {isActive && (
                  <motion.div
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: `${activeColor}22`,
                      border: `1px solid ${activeColor}44`,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
                <span className="relative z-10">
                  <tab.Icon size={16} strokeWidth={1.5} />
                </span>
                <span className="relative z-10 uppercase tracking-widest text-xs">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </motion.div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === "focus" && (
            <motion.div
              key="focus-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <AudioPlayer />
              {showTimerPanel && <FocusTimer />}
              {(isRitualOrBreathing || isReflection) && (
                <FocusRitual onSessionSaved={handleSessionSaved} />
              )}
              {!isRunningOrPaused && <AccountabilityPulse />}
              <Suspense fallback={<LoadingFallback />}>
                <FocusAnalytics />
              </Suspense>
              <FocusPlant />
            </motion.div>
          )}

          {activeTab === "journal" && (
            <motion.div
              key="journal-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <WorkStats />
              <Suspense fallback={<LoadingFallback />}>
                <FocusJournal />
              </Suspense>
            </motion.div>
          )}

          {activeTab === "games" && (
            <motion.div
              key="games-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <GamesSection />
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-xs text-white/10 font-mono pt-4">
          focus.radio · made for deep work
        </p>
      </main>
    </div>
  );
}
