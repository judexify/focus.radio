import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio,
  Crosshair,
  BookOpen,
  Gamepad2,
  Lock,
  ArrowRight,
} from "lucide-react";

const FEATURES = [
  {
    Icon: Radio,
    label: "Lo-Fi Radio",
    desc: "Streaming radio + ambient mixer (rain, café, fire)",
  },
  {
    Icon: Crosshair,
    label: "Focus Timer",
    desc: "Deep, Focus and Drift modes with breathing rituals",
  },
  {
    Icon: BookOpen,
    label: "Work Journal",
    desc: "Logs every session with your intent and reflection",
  },
  {
    Icon: Gamepad2,
    label: "Break Games",
    desc: "Snake and Dino Run for 5-minute brain resets",
  },
  {
    Icon: Lock,
    label: "Locked In",
    desc: "Tracks which projects you spend the most time on",
  },
];

export default function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("focusradio-welcome-seen");
    if (!seen) {
      const t = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const handleClose = () => {
    sessionStorage.setItem("focusradio-welcome-seen", "1");
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-sm rounded-3xl border border-white/10 overflow-hidden"
              style={{
                background: "rgba(8,8,14,0.98)",
                backdropFilter: "blur(24px)",
                boxShadow:
                  "0 0 60px rgba(103,232,249,0.12), 0 20px 60px rgba(0,0,0,0.9)",
              }}
            >
              {/* Hero */}
              <div
                className="px-6 pt-8 pb-6 text-center"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(103,232,249,0.08) 0%, transparent 100%)",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 20,
                    delay: 0.15,
                  }}
                  className="flex items-center justify-center mb-4"
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{
                      background: "rgba(103,232,249,0.1)",
                      border: "1px solid rgba(103,232,249,0.2)",
                    }}
                  >
                    <Radio size={26} className="text-cyan-400" />
                  </div>
                </motion.div>
                <h1
                  className="text-2xl font-light mb-2"
                  style={{
                    fontFamily: "'Crimson Pro','Georgia',serif",
                    color: "rgba(255,255,255,0.9)",
                  }}
                >
                  focus<span className="text-cyan-400">.</span>radio
                </h1>
                <p className="text-white/40 text-sm font-light leading-relaxed">
                  A quiet place to do your best work.
                  <br />
                  Lo-fi music, focus timers, and a journal — all in one.
                </p>
              </div>

              {/* Features */}
              <div className="px-6 py-4 space-y-3">
                {FEATURES.map(({ Icon, label, desc }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.07 }}
                    className="flex items-center gap-3"
                  >
                    <span
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: "rgba(103,232,249,0.08)",
                        border: "1px solid rgba(103,232,249,0.15)",
                      }}
                    >
                      <Icon size={16} className="text-cyan-400/70" />
                    </span>
                    <div>
                      <p className="text-white/70 text-xs font-mono uppercase tracking-widest">
                        {label}
                      </p>
                      <p className="text-white/35 text-xs font-light">{desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <div className="px-6 pb-6 pt-2">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleClose}
                  className="w-full py-3.5 rounded-2xl text-sm font-mono tracking-widest uppercase transition-all flex items-center justify-center gap-2"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(103,232,249,0.2) 0%, rgba(129,140,248,0.2) 100%)",
                    border: "1px solid rgba(103,232,249,0.3)",
                    color: "#67e8f9",
                  }}
                >
                  Start Focusing <ArrowRight size={14} />
                </motion.button>
                <p className="text-center text-white/15 text-xs font-mono mt-3">
                  Your data stays on your device · no account needed
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
