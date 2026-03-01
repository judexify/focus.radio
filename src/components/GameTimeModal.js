import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PersonStanding, ArrowRight } from "lucide-react";

const GAME_TIME_LIMIT = 5 * 60;

const STRETCH_TIPS = [
  "Roll your shoulders back 5 times each direction",
  "Stand up and touch your toes — hold for 10 seconds",
  "Neck rolls — slowly left, forward, right, back",
  "Wrist circles — 10 each direction",
  "Stand and do 10 jumping jacks",
  "Look away from your screen — stare at something 20ft away for 20 seconds",
];

export default function GameTimeModal({ isPlaying, onContinue, onStretch }) {
  const [secondsPlayed, setSecondsPlayed] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [tip] = useState(
    () => STRETCH_TIPS[Math.floor(Math.random() * STRETCH_TIPS.length)],
  );
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setSecondsPlayed((s) => {
          const next = s + 1;
          if (next >= GAME_TIME_LIMIT) setShowModal(true);
          return next;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying]);

  const fmt = (s) => {
    const m = Math.floor(s / 60),
      sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  const handleContinue = () => {
    setShowModal(false);
    setSecondsPlayed(0);
    onContinue?.();
  };
  const handleStretch = () => {
    setShowModal(false);
    setSecondsPlayed(0);
    onStretch?.();
  };

  return (
    <AnimatePresence>
      {showModal && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-xs rounded-3xl border border-white/10 overflow-hidden"
              style={{
                background: "rgba(8,8,14,0.98)",
                backdropFilter: "blur(24px)",
                boxShadow:
                  "0 0 60px rgba(134,239,172,0.1), 0 20px 60px rgba(0,0,0,0.9)",
              }}
            >
              {/* Header */}
              <div
                className="px-6 pt-7 pb-5 text-center"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(134,239,172,0.07) 0%, transparent 100%)",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex justify-center mb-3"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{
                      background: "rgba(134,239,172,0.1)",
                      border: "1px solid rgba(134,239,172,0.2)",
                    }}
                  >
                    <PersonStanding size={24} className="text-green-400" />
                  </div>
                </motion.div>
                <h2
                  className="text-lg font-light text-white/80 mb-1"
                  style={{ fontFamily: "'Crimson Pro','Georgia',serif" }}
                >
                  Hey, you've been playing for
                </h2>
                <p className="text-2xl font-mono text-green-400 mb-2">
                  {fmt(secondsPlayed)}
                </p>
                <p className="text-white/35 text-xs leading-relaxed">
                  Your body will thank you for a quick break.
                </p>
              </div>

              {/* Tip */}
              <div
                className="mx-5 my-4 p-3 rounded-xl"
                style={{
                  background: "rgba(134,239,172,0.06)",
                  border: "1px solid rgba(134,239,172,0.15)",
                }}
              >
                <p className="text-xs font-mono text-green-400/60 uppercase tracking-widest mb-1">
                  Quick stretch
                </p>
                <p className="text-white/50 text-sm leading-relaxed">{tip}</p>
              </div>

              {/* Buttons */}
              <div className="px-5 pb-6 space-y-2">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleStretch}
                  className="w-full py-3 rounded-2xl text-sm font-mono tracking-widest uppercase transition-all flex items-center justify-center gap-2"
                  style={{
                    background: "rgba(134,239,172,0.15)",
                    border: "1px solid rgba(134,239,172,0.3)",
                    color: "#86efac",
                  }}
                >
                  <PersonStanding size={15} /> Take a stretch break
                </motion.button>
                <button
                  onClick={handleContinue}
                  className="w-full py-2.5 rounded-2xl text-xs font-mono text-white/25 border border-white/8 hover:border-white/20 hover:text-white/40 transition-colors flex items-center justify-center gap-1.5"
                >
                  Keep playing <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
