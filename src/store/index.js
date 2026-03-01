import { create } from "zustand";
import { persist } from "zustand/middleware";

// Timer state — loaded synchronously at module init
// We load this before the store is created so the first render already has
// the correct restored values. No useEffect race condition.

const TIMER_KEY = "focusradio-timer-state";
const DEFAULT_MODES = {
  Deep: {
    duration: 90 * 60,
    label: "Deep Work",
    color: "#c084fc",
    bg: "#0d0010",
  },
  Focus: { duration: 50 * 60, label: "Focus", color: "#67e8f9", bg: "#001219" },
  Drift: { duration: 25 * 60, label: "Drift", color: "#86efac", bg: "#001a0d" },
};

function getInitialTimerState() {
  try {
    const raw = localStorage.getItem(TIMER_KEY);
    if (!raw) return {};
    const saved = JSON.parse(raw);
    const {
      status,
      mode,
      elapsed,
      intent,
      duration,
      customDuration,
      sessionColor,
      savedAt,
    } = saved;

    if (status !== "running" && status !== "paused") return {};

    const effectiveDuration =
      duration || customDuration || DEFAULT_MODES[mode]?.duration || 50 * 60;

    let newElapsed = elapsed || 0;
    if (status === "running") {
      const drift = Math.floor((Date.now() - savedAt) / 1000);
      newElapsed = elapsed + drift;
    }

    if (newElapsed >= effectiveDuration) {
      localStorage.removeItem(TIMER_KEY);
      return {};
    }

    return {
      mode: mode || "Focus",
      status: status === "running" ? "running" : "paused",
      elapsed: newElapsed,
      intent: intent || "",
      customDuration: customDuration || null,
      sessionColor: sessionColor || null,
      tools: saved.tools || [],
    };
  } catch (_) {
    return {};
  }
}

export function saveTimerState(data) {
  try {
    localStorage.setItem(
      TIMER_KEY,
      JSON.stringify({ ...data, savedAt: Date.now() }),
    );
  } catch (_) {}
}

export function clearTimerState() {
  try {
    localStorage.removeItem(TIMER_KEY);
  } catch (_) {}
}

//  Audio Store
export const useAudioStore = create((set) => ({
  isPlaying: false,
  pausedForFocus: false,
  isAmbientPlaying: false,
  radioVolume: 0.7,
  ambientVolumes: { rain: 0, cafe: 0, whiteNoise: 0, fire: 0 },
  streamFailed: false,
  currentTrack: "lofi-stream",

  setPlaying: (v) => set({ isPlaying: v }),
  setPausedForFocus: (v) => set({ pausedForFocus: v }),
  setAmbientPlaying: (v) => set({ isAmbientPlaying: v }),
  setRadioVolume: (v) => set({ radioVolume: Math.max(0, Math.min(1, v)) }),
  setAmbientVolume: (key, v) =>
    set((s) => ({
      ambientVolumes: {
        ...s.ambientVolumes,
        [key]: Math.max(0, Math.min(1, v)),
      },
    })),
  setStreamFailed: (v) => set({ streamFailed: v }),
}));

//  Timer Store
const restoredTimer = getInitialTimerState();

export const useTimerStore = create((set, get) => ({
  mode: restoredTimer.mode || "Focus",
  status: restoredTimer.status || "idle",
  elapsed: restoredTimer.elapsed || 0,
  intent: restoredTimer.intent || "",
  reflection: "",
  distractionShield: false,

  // Custom session options — survive reloads
  customDuration: restoredTimer.customDuration || null,
  sessionColor: restoredTimer.sessionColor || null,
  tools: restoredTimer.tools || [],

  MODES: DEFAULT_MODES,

  setMode: (m) =>
    set({
      mode: m,
      elapsed: 0,
      status: "idle",
      customDuration: null,
      sessionColor: null,
    }),
  setCustomDuration: (d) => set({ customDuration: d }),
  setSessionColor: (c) => set({ sessionColor: c }),
  setTools: (t) => set({ tools: t }),
  restoreTimer: (s) => set(s),
  setStatus: (s) => set({ status: s }),
  setElapsed: (e) => set({ elapsed: e }),
  setIntent: (i) => set({ intent: i }),
  clearIntent: () => set({ intent: "" }),
  setReflection: (r) => set({ reflection: r }),
  setDistractionShield: (v) => set({ distractionShield: v }),
  reset: () =>
    set({
      status: "idle",
      elapsed: 0,
      intent: "",
      reflection: "",
      customDuration: null,
      sessionColor: null,
      tools: [],
    }),
}));

// Journal Store (persisted)
export const useJournalStore = create(
  persist(
    (set) => ({
      entries: [],
      addEntry: (entry) =>
        set((s) => ({
          entries: [{ id: Date.now(), ...entry }, ...s.entries].slice(0, 500),
        })),
      clearEntries: () => set({ entries: [] }),
    }),
    { name: "lofi-journal" },
  ),
);

//Streak Store (persisted)
export const useStreakStore = create(
  persist(
    (set, get) => ({
      currentStreak: 0,
      longestStreak: 0,
      lastSessionDate: null,
      totalSessions: 0,
      weeklyGoal: 5,

      recordSession: () => {
        const today = new Date().toDateString();
        const s = get();
        const isConsecutive =
          s.lastSessionDate === new Date(Date.now() - 86400000).toDateString();
        const isSameDay = s.lastSessionDate === today;
        const newStreak = isSameDay
          ? s.currentStreak
          : isConsecutive
            ? s.currentStreak + 1
            : 1;
        set({
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, s.longestStreak),
          lastSessionDate: today,
          totalSessions: s.totalSessions + 1,
        });
      },

      checkAndResetStreak: () => {
        const s = get();
        if (!s.lastSessionDate) return;
        const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toDateString();
        if (s.lastSessionDate <= twoDaysAgo) set({ currentStreak: 0 });
      },
    }),
    { name: "lofi-streaks" },
  ),
);

//  Accountability Store
export const useAccountabilityStore = create((set) => ({
  listenerCount: Math.floor(Math.random() * 200) + 50,
  recentActivity: [],
  addActivity: (msg, own = false) =>
    set((s) => ({
      recentActivity: [{ msg, id: Date.now(), own }, ...s.recentActivity].slice(
        0,
        6,
      ),
    })),
  updateListenerCount: (n) => set({ listenerCount: n }),
}));

//  Burnout Store (persisted)
export const useBurnoutStore = create(
  persist(
    (set, get) => ({
      consecutiveSessions: 0,
      lastBreakTime: null,
      showReminder: false,
      reminderType: null,

      incrementSession: () => {
        const n = get().consecutiveSessions + 1;
        const reminderType =
          n === 3 ? "hydration" : n === 5 ? "stretch" : n >= 7 ? "rest" : null;
        set({
          consecutiveSessions: n,
          showReminder: !!reminderType,
          reminderType,
        });
      },
      dismissReminder: () =>
        set({
          showReminder: false,
          consecutiveSessions: 0,
          lastBreakTime: Date.now(),
        }),
    }),
    { name: "lofi-burnout" },
  ),
);
