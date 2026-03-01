import React, { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CloudRain,
  Coffee,
  Radio,
  Flame,
  Play,
  Pause,
  VolumeX,
  Volume2,
  Wind,
} from "lucide-react";
import { useAudioStore, useTimerStore } from "../store";
import { useAudioEngine } from "../hooks/useAudioEngine";

const AMBIENT_CHANNELS = [
  { key: "rain", label: "Rain", Icon: CloudRain },
  { key: "cafe", label: "Café", Icon: Coffee },
  { key: "whiteNoise", label: "Static", Icon: Wind },
  { key: "fire", label: "Hearth", Icon: Flame },
];

function VolumeSlider({ value, onChange, accent = "#67e8f9", disabled }) {
  return (
    <div
      className={`relative w-full h-1 rounded-full bg-white/10 cursor-pointer group ${disabled ? "opacity-30 pointer-events-none" : ""}`}
    >
      <div
        className="absolute h-full rounded-full transition-all duration-75"
        style={{ width: `${value * 100}%`, background: accent }}
      />
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="absolute inset-0 w-full opacity-0 cursor-pointer"
        aria-label="volume"
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg"
        style={{ left: `calc(${value * 100}% - 6px)` }}
      />
    </div>
  );
}

export default function AudioPlayer() {
  const {
    isPlaying,
    radioVolume,
    ambientVolumes,
    streamFailed,
    pausedForFocus,
    isAmbientPlaying,
    setRadioVolume,
    setAmbientVolume,
    setPausedForFocus,
  } = useAudioStore();
  const { status } = useTimerStore();
  const { togglePlay, toggleAmbient } = useAudioEngine();

  // Auto-pick a random ambient channel if none have volume when turning on
  const handleToggleAmbient = () => {
    const hasAnyVolume = Object.values(ambientVolumes).some((v) => v > 0);
    if (!isAmbientPlaying && !hasAnyVolume) {
      const keys = ["rain", "cafe", "whiteNoise", "fire"];
      const pick = keys[Math.floor(Math.random() * keys.length)];
      setAmbientVolume(pick, 0.6);
    }
    toggleAmbient();
  };

  const isSessionActive = status === "running" || status === "paused";

  const handleResume = () => {
    setPausedForFocus(false);
    togglePlay();
  };

  const handleAmbient = useCallback(
    (key, val) => setAmbientVolume(key, val),
    [setAmbientVolume],
  );

  // How many ambient channels are active
  const activeAmbientCount = Object.values(ambientVolumes).filter(
    (v) => v > 0,
  ).length;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 space-y-5">
      {/* Paused-for-focus banner */}
      {pausedForFocus && !isPlaying && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between px-3 py-2.5 rounded-xl"
          style={{
            background: "rgba(103,232,249,0.07)",
            border: "1px solid rgba(103,232,249,0.2)",
          }}
        >
          <div className="flex items-center gap-2">
            <VolumeX size={16} className="text-cyan-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-mono text-cyan-400/80 uppercase tracking-widest">
                Music paused for focus
              </p>
              {isSessionActive && (
                <p className="text-white/25 text-xs">session in progress</p>
              )}
            </div>
          </div>
          <button
            onClick={handleResume}
            className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg transition-colors"
            style={{
              background: "rgba(103,232,249,0.15)",
              color: "#67e8f9",
              border: "1px solid rgba(103,232,249,0.25)",
            }}
          >
            <Play size={11} /> Resume
          </button>
        </motion.div>
      )}

      {/* ── Radio section*/}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <Radio size={12} className="text-white/40" />
            <p className="text-xs uppercase tracking-widest text-white/40 font-mono">
              {streamFailed ? "Offline Mode" : "Lo-Fi Radio"}
            </p>
          </div>
          <p className="text-white/70 text-sm font-light">
            {streamFailed ? "Ambient drone active" : "24/7 chill stream"}
          </p>
        </div>

        <motion.button
          onClick={togglePlay}
          whileTap={{ scale: 0.92 }}
          className="relative w-12 h-12 rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #67e8f9 0%, #818cf8 100%)",
          }}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={isPlaying ? "pause" : "play"}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-black flex items-center justify-center"
            >
              {isPlaying ? (
                <Pause size={18} strokeWidth={2.5} />
              ) : (
                <Play size={18} strokeWidth={2.5} />
              )}
            </motion.span>
          </AnimatePresence>
          {isPlaying && (
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ border: "1px solid rgba(103,232,249,0.5)" }}
              animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
            />
          )}
        </motion.button>
      </div>

      {/* Radio volume */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <Volume2 size={12} className="text-white/40" />
            <span className="text-xs text-white/40 font-mono uppercase tracking-widest">
              Radio
            </span>
          </div>
          <span className="text-xs text-white/40 font-mono">
            {Math.round(radioVolume * 100)}
          </span>
        </div>
        <VolumeSlider
          value={radioVolume}
          onChange={setRadioVolume}
          accent="#67e8f9"
        />
      </div>

      <div className="border-t border-white/5" />

      {/*  Ambient section  */}
      <div className="space-y-3">
        {/* Ambient header with its own play toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-white/30 font-mono">
              Ambient Mix
            </p>
            <p className="text-white/25 text-xs font-light mt-0.5">
              {isAmbientPlaying
                ? activeAmbientCount > 0
                  ? `${activeAmbientCount} layer${activeAmbientCount !== 1 ? "s" : ""} active`
                  : "playing — set a layer below"
                : "plays independently of radio"}
            </p>
          </div>

          {/* Ambient play/pause pill */}
          <motion.button
            onClick={handleToggleAmbient}
            whileTap={{ scale: 0.92 }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
            style={{
              background: isAmbientPlaying
                ? "rgba(129,140,248,0.2)"
                : "rgba(255,255,255,0.05)",
              border: isAmbientPlaying
                ? "1px solid rgba(129,140,248,0.4)"
                : "1px solid rgba(255,255,255,0.1)",
            }}
            aria-label={isAmbientPlaying ? "Stop ambient" : "Play ambient"}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={isAmbientPlaying ? "pause" : "play"}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="flex items-center"
                style={{
                  color: isAmbientPlaying ? "#818cf8" : "rgba(255,255,255,0.3)",
                }}
              >
                {isAmbientPlaying ? (
                  <Pause size={13} strokeWidth={2.5} />
                ) : (
                  <Play size={13} strokeWidth={2.5} />
                )}
              </motion.span>
            </AnimatePresence>
            <span
              className="text-xs font-mono"
              style={{
                color: isAmbientPlaying ? "#818cf8" : "rgba(255,255,255,0.3)",
              }}
            >
              {isAmbientPlaying ? "on" : "off"}
            </span>

            {isAmbientPlaying && (
              <motion.span
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{ border: "1px solid rgba(129,140,248,0.4)" }}
                animate={{ scale: [1, 1.12], opacity: [0.6, 0] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
              />
            )}
          </motion.button>
        </div>

        {/* Ambient lofi sound channel */}
        <div className="space-y-3">
          {AMBIENT_CHANNELS.map(({ key, label, Icon }) => {
            const vol = ambientVolumes[key];
            const isActive = vol > 0 && isAmbientPlaying;
            return (
              <div key={key} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <motion.span
                      animate={{
                        color: isActive ? "#818cf8" : "rgba(255,255,255,0.35)",
                      }}
                    >
                      <Icon size={13} />
                    </motion.span>
                    <span className="font-mono text-xs text-white/60">
                      {label}
                    </span>
                    {isActive && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-1.5 h-1.5 rounded-full bg-indigo-400 opacity-80"
                      />
                    )}
                  </div>
                  <span className="text-xs text-white/30 font-mono">
                    {Math.round(vol * 100)}
                  </span>
                </div>
                <VolumeSlider
                  value={vol}
                  onChange={(v) => {
                    handleAmbient(key, v);
                    // Auto-start ambient when user moves a slider
                    if (v > 0 && !isAmbientPlaying) toggleAmbient();
                  }}
                  accent="#818cf8"
                  disabled={false}
                />
              </div>
            );
          })}
        </div>

        {/* when ambient is off but sliders have values */}
        {!isAmbientPlaying && activeAmbientCount > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-white/20 text-xs font-mono text-center"
          >
            Press play above to hear your ambient mix
          </motion.p>
        )}
      </div>
    </div>
  );
}
