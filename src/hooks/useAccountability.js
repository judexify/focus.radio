import { useEffect, useRef } from "react";
import { useAccountabilityStore, useTimerStore } from "../store";

// ── Dynamic message generators ────────────────────────────────────────────────
const CITIES = [
  "Tokyo",
  "Lagos",
  "London",
  "São Paulo",
  "Berlin",
  "Nairobi",
  "Seoul",
  "Cairo",
  "Toronto",
  "Jakarta",
  "Taiwan",
];
const INTENTS = [
  '"finishing the landing page"',
  '"reading chapter 4"',
  '"shipping the feature"',
  '"debugging this thing"',
  '"writing the essay"',
  '"deep reading"',
  '"studying for finals"',
  '"building in public"',
];
const MODES = ["Deep Work", "Focus", "Drift"];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateAmbientMessage() {
  const type = rand(1, 8);
  switch (type) {
    case 1:
      return `Someone in ${pick(CITIES)} just started a ${pick(MODES)} session`;
    case 2:
      return `A listener joined from ${pick(CITIES)}`;
    case 3:
      return `Someone just completed a ${rand(25, 90)}m session`;
    case 4:
      return `Someone set their intent: ${pick(INTENTS)}`;
    case 5:
      return `${rand(2, 8)} people are on their ${rand(2, 5)}th session today`;
    case 6:
      return `Someone is on a ${rand(3, 12)} day streak`;
    case 7:
      return `A ${pick(MODES)} session just ended in ${pick(CITIES)}`;
    case 8:
      return `${rand(3, 15)} people started sessions in the last hour`;
    default:
      return `Someone in ${pick(CITIES)} is locked in`;
  }
}

const MODE_LABELS = { Deep: "Deep Work", Focus: "Focus", Drift: "Drift" };

export function useAccountability() {
  const { listenerCount, recentActivity, addActivity, updateListenerCount } =
    useAccountabilityStore();
  const { status, mode, intent } = useTimerStore();
  const prevStatusRef = useRef(status);

  // Your own session events
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;

    if (prev !== "running" && status === "running") {
      const label = MODE_LABELS[mode] || mode;
      const msg = intent?.trim()
        ? `You started a ${label} session · "${intent.trim()}"`
        : `You started a ${label} session`;
      addActivity(msg, true);
    }
    if (prev === "running" && status === "reflection") {
      addActivity(`You completed a ${MODE_LABELS[mode] || mode} session`, true);
    }
    if (prev === "running" && status === "paused") {
      addActivity("You paused your session", true);
    }
    if (prev === "paused" && status === "running") {
      addActivity("You resumed your session", true);
    }
  }, [status, mode, intent, addActivity]);

  // ── Simulated ambient activity ────────────────────────────────────────────
  useEffect(() => {
    const countTimer = setInterval(() => {
      updateListenerCount(Math.max(20, listenerCount + rand(-5, 5)));
    }, 15000);

    let activityTimer;
    const scheduleNext = () => {
      const delay = rand(10000, 22000);
      activityTimer = setTimeout(() => {
        addActivity(generateAmbientMessage(), false);
        scheduleNext();
      }, delay);
    };
    scheduleNext();

    return () => {
      clearInterval(countTimer);
      clearTimeout(activityTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { listenerCount, recentActivity };
}
