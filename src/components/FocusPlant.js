import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStreakStore, useTimerStore, useJournalStore } from "../store";

const STAGES = [
  {
    name: "seed",
    min: 0,
    title: "A seed, waiting.",
    desc: "Your consistency is its water. Complete your first session to watch it grow.",
    color: "#86efac",
    accent: "#4ade80",
  },
  {
    name: "sprout",
    min: 1,
    title: "Something is stirring.",
    desc: "A tiny sprout. It felt your first session. Keep showing up.",
    color: "#86efac",
    accent: "#4ade80",
  },
  {
    name: "seedling",
    min: 3,
    title: "Roots are forming.",
    desc: "Three sessions in. It's finding its footing, just like you.",
    color: "#67e8f9",
    accent: "#22d3ee",
  },
  {
    name: "young",
    min: 6,
    title: "Growing steadily.",
    desc: "Six sessions and counting. Your focus is becoming a habit.",
    color: "#67e8f9",
    accent: "#22d3ee",
  },
  {
    name: "growing",
    min: 11,
    title: "Really coming alive.",
    desc: "Over ten sessions of showing up. This plant believes in you — and so do we.",
    color: "#a5b4fc",
    accent: "#818cf8",
  },
  {
    name: "blooming",
    min: 20,
    title: "In full bloom.",
    desc: "Twenty sessions. You're locked in. The work is speaking for itself.",
    color: "#c084fc",
    accent: "#a855f7",
  },
  {
    name: "flourished",
    min: 35,
    title: "Absolutely flourishing.",
    desc: "Thirty-five sessions deep. A force of nature. This is who you are now.",
    color: "#f9a8d4",
    accent: "#ec4899",
  },
];

const WILTED_TITLE = "It's thirsty.";
const WILTED_DESC =
  "Your streak broke and the plant can feel it. One session is all it takes to revive it.";

function getStage(hours) {
  let s = STAGES[0];
  for (const stage of STAGES) {
    if (hours >= stage.min) s = stage;
  }
  return s;
}

//  SVG plant shapes
function Sway({ children, duration = 4, amount = 4, origin = "60px 116px" }) {
  return (
    <motion.g
      style={{ transformOrigin: origin }}
      animate={{ rotate: [-amount / 2, amount / 2] }}
      transition={{
        repeat: Infinity,
        repeatType: "mirror",
        duration,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.g>
  );
}

function Seed({ color }) {
  return (
    <g>
      <ellipse cx="60" cy="114" rx="30" ry="6" fill="rgba(255,255,255,0.07)" />
      <ellipse cx="60" cy="109" rx="8" ry="6" fill={color} opacity={0.6} />
    </g>
  );
}

function Sprout({ color, accent }) {
  return (
    <g>
      <ellipse cx="60" cy="114" rx="30" ry="6" fill="rgba(255,255,255,0.07)" />
      <Sway duration={3.5} amount={5}>
        <path
          d="M60 112 Q61 98 60 88"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse
          cx="65"
          cy="94"
          rx="8"
          ry="5"
          fill={accent}
          opacity={0.85}
          style={{ transformOrigin: "60px 94px" }}
        />
      </Sway>
    </g>
  );
}

function Seedling({ color, accent }) {
  return (
    <g>
      <ellipse cx="60" cy="114" rx="30" ry="6" fill="rgba(255,255,255,0.07)" />
      <Sway duration={4} amount={4}>
        <path
          d="M60 112 Q62 94 60 74"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <motion.path
          d="M60 92 Q44 84 41 72 Q53 77 60 92"
          fill={accent}
          opacity={0.82}
          animate={{ rotate: [-4, 4] }}
          style={{ transformOrigin: "60px 92px" }}
          transition={{ repeat: Infinity, repeatType: "mirror", duration: 4 }}
        />
        <motion.path
          d="M60 92 Q76 84 79 72 Q67 77 60 92"
          fill={color}
          opacity={0.82}
          animate={{ rotate: [4, -4] }}
          style={{ transformOrigin: "60px 92px" }}
          transition={{ repeat: Infinity, repeatType: "mirror", duration: 4 }}
        />
        <circle cx="60" cy="74" r="3.5" fill={accent} opacity={0.9} />
      </Sway>
    </g>
  );
}

function YoungPlant({ color, accent }) {
  return (
    <g>
      <ellipse cx="60" cy="114" rx="32" ry="6" fill="rgba(255,255,255,0.08)" />
      <Sway duration={4.5} amount={4}>
        <path
          d="M60 112 Q64 88 60 58"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        {[
          { cy: 90, dir: -1, fill: accent },
          { cy: 76, dir: 1, fill: color },
        ].map(({ cy, dir, fill }, i) => (
          <motion.g
            key={i}
            style={{ transformOrigin: `60px ${cy}px` }}
            animate={{ rotate: [dir * -4, dir * 4] }}
            transition={{
              repeat: Infinity,
              repeatType: "mirror",
              duration: 4 + i * 0.4,
            }}
          >
            <path
              d={`M60 ${cy} Q${60 + dir * 18} ${cy - 8} ${60 + dir * 28} ${cy - 18}`}
              stroke={color}
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d={`M${60 + dir * 28} ${cy - 18} Q${60 + dir * 40} ${cy - 28} ${60 + dir * 30} ${cy - 36} Q${60 + dir * 18} ${cy - 28} ${60 + dir * 28} ${cy - 18}`}
              fill={fill}
              opacity={0.88}
            />
          </motion.g>
        ))}
        <motion.path
          d="M60 58 Q46 44 49 30 Q60 44 60 58"
          fill={color}
          opacity={0.9}
          animate={{ rotate: [-4, 4] }}
          style={{ transformOrigin: "60px 58px" }}
          transition={{ repeat: Infinity, repeatType: "mirror", duration: 4.5 }}
        />
        <motion.path
          d="M60 58 Q74 44 71 30 Q60 44 60 58"
          fill={accent}
          opacity={0.9}
          animate={{ rotate: [4, -4] }}
          style={{ transformOrigin: "60px 58px" }}
          transition={{ repeat: Infinity, repeatType: "mirror", duration: 4.5 }}
        />
      </Sway>
    </g>
  );
}

function GrowingPlant({ color, accent, glowing }) {
  return (
    <g>
      <ellipse cx="60" cy="116" rx="34" ry="6" fill="rgba(255,255,255,0.09)" />
      <Sway duration={5} amount={3}>
        <path
          d="M60 114 Q66 86 60 44"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        {[
          { cy: 98, dir: -1, fill: accent },
          { cy: 82, dir: 1, fill: color },
          { cy: 68, dir: -1, fill: color },
          { cy: 54, dir: 1, fill: accent },
        ].map(({ cy, dir, fill }, i) => (
          <motion.g
            key={i}
            style={{ transformOrigin: `60px ${cy}px` }}
            animate={{ rotate: [dir * -3, dir * 3] }}
            transition={{
              repeat: Infinity,
              repeatType: "mirror",
              duration: 3.8 + i * 0.3,
            }}
          >
            <path
              d={`M60 ${cy} Q${60 + dir * 16} ${cy - 8} ${60 + dir * 26} ${cy - 18}`}
              stroke={color}
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d={`M${60 + dir * 26} ${cy - 18} Q${60 + dir * 38} ${cy - 28} ${60 + dir * 28} ${cy - 36} Q${60 + dir * 16} ${cy - 28} ${60 + dir * 26} ${cy - 18}`}
              fill={fill}
              opacity={0.88}
            />
          </motion.g>
        ))}
        {glowing && (
          <motion.circle
            cx="60"
            cy="44"
            r="6"
            fill={accent}
            animate={{ opacity: [0.5, 1, 0.5], r: [5, 7, 5] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        )}
        <circle cx="60" cy="44" r="4" fill={accent} opacity={0.9} />
      </Sway>
    </g>
  );
}

function BloomingPlant({ color, accent, glowing }) {
  const petalAngles = [0, 60, 120, 180, 240, 300];
  return (
    <g>
      <ellipse cx="60" cy="118" rx="36" ry="6" fill="rgba(255,255,255,0.09)" />
      <Sway duration={5} amount={3}>
        <path
          d="M60 116 Q67 84 60 36"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        {[
          { cy: 100, dir: -1, fill: accent },
          { cy: 84, dir: 1, fill: color },
          { cy: 70, dir: -1, fill: color },
          { cy: 56, dir: 1, fill: accent },
          { cy: 44, dir: -1, fill: accent },
        ].map(({ cy, dir, fill }, i) => (
          <motion.g
            key={i}
            style={{ transformOrigin: `60px ${cy}px` }}
            animate={{ rotate: [dir * -3, dir * 3] }}
            transition={{
              repeat: Infinity,
              repeatType: "mirror",
              duration: 3.8 + i * 0.25,
            }}
          >
            <path
              d={`M60 ${cy} Q${60 + dir * 18} ${cy - 9} ${60 + dir * 28} ${cy - 20}`}
              stroke={color}
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d={`M${60 + dir * 28} ${cy - 20} Q${60 + dir * 40} ${cy - 30} ${60 + dir * 30} ${cy - 38} Q${60 + dir * 18} ${cy - 30} ${60 + dir * 28} ${cy - 20}`}
              fill={fill}
              opacity={0.9}
            />
          </motion.g>
        ))}
        <g transform="translate(60,36)">
          {petalAngles.map((angle, i) => (
            <motion.ellipse
              key={i}
              cx={0}
              cy={-9}
              rx="4"
              ry="7"
              fill={accent}
              opacity={0.8}
              style={{ transformOrigin: "0px 0px", rotate: angle }}
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 3, delay: i * 0.15 }}
            />
          ))}
          <circle cx="0" cy="0" r="5" fill={glowing ? "#fef08a" : "#fde68a"} />
          {glowing && (
            <motion.circle
              cx="0"
              cy="0"
              r="8"
              fill="#fef08a"
              opacity={0.3}
              animate={{ r: [8, 16, 8], opacity: [0.3, 0, 0.3] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
            />
          )}
        </g>
      </Sway>
    </g>
  );
}

function FlourishedPlant({ color, accent, glowing }) {
  const petalAngles = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <g>
      <ellipse cx="60" cy="118" rx="40" ry="7" fill="rgba(255,255,255,0.1)" />
      <Sway duration={5.5} amount={3}>
        <path
          d="M60 116 Q68 80 60 28"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        {[
          { cy: 104, dir: -1, large: false },
          { cy: 90, dir: 1, large: true },
          { cy: 76, dir: -1, large: true },
          { cy: 62, dir: 1, large: false },
          { cy: 50, dir: -1, large: true },
          { cy: 38, dir: 1, large: false },
        ].map(({ cy, dir, large }, i) => (
          <motion.g
            key={i}
            style={{ transformOrigin: `60px ${cy}px` }}
            animate={{ rotate: [dir * -4, dir * 4] }}
            transition={{
              repeat: Infinity,
              repeatType: "mirror",
              duration: 3.5 + i * 0.25,
            }}
          >
            <path
              d={`M60 ${cy} Q${60 + dir * (large ? 22 : 15)} ${cy - 10} ${60 + dir * (large ? 34 : 24)} ${cy - 22}`}
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d={`M${60 + dir * (large ? 34 : 24)} ${cy - 22} Q${60 + dir * (large ? 46 : 34)} ${cy - 34} ${60 + dir * (large ? 36 : 26)} ${cy - 42} Q${60 + dir * (large ? 22 : 14)} ${cy - 32} ${60 + dir * (large ? 34 : 24)} ${cy - 22}`}
              fill={i % 2 === 0 ? accent : color}
              opacity={0.9}
            />
          </motion.g>
        ))}
        <g transform="translate(60,28)">
          {petalAngles.map((angle, i) => (
            <motion.ellipse
              key={i}
              cx={0}
              cy={-11}
              rx="5"
              ry="9"
              fill={accent}
              opacity={0.85}
              style={{ transformOrigin: "0px 0px", rotate: angle }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 3.5, delay: i * 0.1 }}
            />
          ))}
          <circle cx="0" cy="0" r="7" fill={glowing ? "#fef08a" : "#fde68a"} />
          {glowing && (
            <motion.circle
              cx="0"
              cy="0"
              r="10"
              fill="#fef08a"
              opacity={0.4}
              animate={{ r: [10, 22, 10], opacity: [0.4, 0, 0.4] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
            />
          )}
        </g>
      </Sway>
    </g>
  );
}

// Sparkle burst on session complete
function Sparkles({ color, accent }) {
  return (
    <>
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const dist = 28 + Math.random() * 16;
        return (
          <motion.circle
            key={i}
            r="3"
            fill={i % 2 === 0 ? color : accent}
            initial={{
              opacity: 1,
              scale: 0,
              cx: 60 + Math.cos(angle) * dist,
              cy: 70 + Math.sin(angle) * dist,
            }}
            animate={{
              opacity: 0,
              scale: 1.5,
              cx: 60 + Math.cos(angle) * (dist + 18),
              cy: 70 + Math.sin(angle) * (dist + 18),
            }}
            transition={{ duration: 0.9, delay: i * 0.06 }}
          />
        );
      })}
    </>
  );
}

// Main
export default function FocusPlant() {
  const { entries } = useJournalStore();
  const { currentStreak } = useStreakStore();
  const { status } = useTimerStore();

  // Total focused hours from all journal entries
  const totalSeconds = entries.reduce((sum, e) => sum + (e.duration || 0), 0);
  const totalHours = totalSeconds / 3600;
  const totalHoursDisplay =
    totalHours < 1
      ? `${Math.round(totalSeconds / 60)}m`
      : `${totalHours.toFixed(1)}h`;
  const [showSparkle, setShowSparkle] = useState(false);
  const [prevStatus, setPrevStatus] = useState(status);

  const stage = getStage(totalHours);
  const isWilted = totalSeconds > 0 && currentStreak === 0;
  const isActive = status === "running";

  const title = isWilted ? WILTED_TITLE : stage.title;
  const desc = isWilted ? WILTED_DESC : stage.desc;
  const color = stage.color;
  const accent = stage.accent;

  useEffect(() => {
    if (prevStatus === "running" && status === "reflection") {
      setShowSparkle(true);
      setTimeout(() => setShowSparkle(false), 1100);
    }
    setPrevStatus(status);
  }, [status, prevStatus]);

  const plantProps = { color, accent, glowing: isActive };

  return (
    <div className="flex flex-col items-center pt-4 pb-2 space-y-4">
      {/* Plant SVG */}
      <motion.div
        animate={{
          filter: isWilted
            ? "saturate(0.25) brightness(0.65)"
            : "saturate(1) brightness(1)",
        }}
        transition={{ duration: 1.5 }}
      >
        <svg width="120" height="128" viewBox="0 0 120 128" overflow="visible">
          {/* session glow */}
          {isActive && (
            <motion.ellipse
              cx="60"
              cy="90"
              rx="42"
              ry="36"
              fill={color}
              opacity={0.05}
              animate={{ opacity: [0.03, 0.09, 0.03], rx: [40, 46, 40] }}
              transition={{ repeat: Infinity, duration: 3 }}
            />
          )}

          {/* sparkle */}
          <AnimatePresence>
            {showSparkle && <Sparkles color={color} accent={accent} />}
          </AnimatePresence>

          {/* plant */}
          {stage.name === "seed" && <Seed {...plantProps} />}
          {stage.name === "sprout" && <Sprout {...plantProps} />}
          {stage.name === "seedling" && <Seedling {...plantProps} />}
          {stage.name === "young" && <YoungPlant {...plantProps} />}
          {stage.name === "growing" && <GrowingPlant {...plantProps} />}
          {stage.name === "blooming" && <BloomingPlant {...plantProps} />}
          {stage.name === "flourished" && <FlourishedPlant {...plantProps} />}
        </svg>
      </motion.div>

      {/* Always-visible descriptive text — no tooltip */}
      <motion.div
        key={title}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-1.5 px-4 max-w-xs"
      >
        <p className="text-sm font-light tracking-wide" style={{ color }}>
          {title}
        </p>
        <p className="text-white/35 text-xs leading-relaxed font-light">
          {desc}
        </p>
        {totalSeconds > 0 && (
          <p className="text-white/15 text-xs font-mono">
            {totalHoursDisplay} focused
            {currentStreak > 0 && ` · ${currentStreak} day streak`}
          </p>
        )}
      </motion.div>
    </div>
  );
}
