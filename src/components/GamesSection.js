import React, { useState, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTimerStore } from "../store";
import GameTimeModal from "./GameTimeModal";

const SnakeGame = lazy(() => import("./games/SnakeGame"));
const DinoGame = lazy(() => import("./games/DinoGame"));

const GAME_TABS = [
  {
    id: "snake",
    label: "Snake",
    icon: "🐍",
    color: "#67e8f9",
    desc: "Arrow keys or WASD to move",
  },
  {
    id: "dino",
    label: "Dino Run",
    icon: "🦕",
    color: "#86efac",
    desc: "Space / ↑ to jump · ↓ to duck · tap on mobile",
  },
];

function GameLoading() {
  return (
    <div className="flex items-center justify-center h-48 text-white/20 text-sm font-mono animate-pulse">
      Loading game…
    </div>
  );
}

export default function GamesSection() {
  const [activeGame, setActiveGame] = useState("snake");
  const [gameRunning, setGameRunning] = useState(false);
  const [showStretch, setShowStretch] = useState(false);
  const { MODES, mode } = useTimerStore();
  const modeColor = MODES[mode]?.color ?? "#67e8f9";

  const handleStretch = () => {
    setGameRunning(false);
    setShowStretch(true);
    setTimeout(() => setShowStretch(false), 8000);
  };

  return (
    <div className="space-y-4">
      {/* Game time modal — fires after 5 mins */}
      <GameTimeModal
        isPlaying={gameRunning}
        onContinue={() => setGameRunning(true)}
        onStretch={handleStretch}
      />

      {/* Header */}
      <div className="text-center space-y-1 py-2">
        <p className="text-xs uppercase tracking-[0.35em] text-white/30 font-mono">
          Break Time
        </p>
        <p className="text-white/50 text-sm font-light">
          Step away for a few minutes · your focus will thank you
        </p>
      </div>

      {/* Stretch reminder banner */}
      <AnimatePresence>
        {showStretch && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl p-4 text-center"
            style={{
              background: "rgba(134,239,172,0.08)",
              border: "1px solid rgba(134,239,172,0.2)",
            }}
          >
            <p className="text-green-400 text-sm font-mono">
              🧘 Stretch time! Step away for a moment.
            </p>
            <p className="text-white/30 text-xs mt-1">
              Games will be here when you get back.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game tab switcher */}
      <div
        className="flex gap-2 p-1 rounded-2xl border border-white/10"
        style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(12px)" }}
      >
        {GAME_TABS.map((tab) => {
          const isActive = activeGame === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveGame(tab.id);
                setGameRunning(false);
              }}
              className="relative flex-1 py-3 rounded-xl transition-all duration-200 flex flex-col items-center gap-1"
              style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.3)" }}
            >
              {isActive && (
                <motion.div
                  layoutId="game-pill"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: `${tab.color}22`,
                    border: `1px solid ${tab.color}44`,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <span className="relative z-10 text-2xl leading-none">
                {tab.icon}
              </span>
              <span className="relative z-10 text-xs font-mono uppercase tracking-widest">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Hint */}
      <AnimatePresence mode="wait">
        <motion.p
          key={activeGame}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-center text-xs font-mono text-white/25"
        >
          {GAME_TABS.find((t) => t.id === activeGame)?.desc}
        </motion.p>
      </AnimatePresence>

      {/* Game canvas */}
      <div
        className="rounded-2xl border border-white/10 overflow-hidden p-4"
        style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(16px)" }}
        onPointerDown={() => setGameRunning(true)}
        onKeyDown={() => setGameRunning(true)}
      >
        <Suspense fallback={<GameLoading />}>
          <AnimatePresence mode="wait">
            {activeGame === "snake" && (
              <motion.div
                key="snake"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.18 }}
              >
                <SnakeGame />
              </motion.div>
            )}
            {activeGame === "dino" && (
              <motion.div
                key="dino"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.18 }}
              >
                <DinoGame />
              </motion.div>
            )}
          </AnimatePresence>
        </Suspense>
      </div>

      <p className="text-center text-xs text-white/15 font-mono pb-2">
        5-min breaks improve focus by up to 13% · enjoy the pause
      </p>
    </div>
  );
}
