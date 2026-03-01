import { useMemo } from "react";
import { useJournalStore, useStreakStore } from "../store";

export function useJournal() {
  const { entries, addEntry } = useJournalStore();
  const { recordSession } = useStreakStore();

  const saveSession = ({ mode, duration, intent, reflection }) => {
    addEntry({
      timestamp: Date.now(),
      mode,
      duration,
      intent,
      reflection,
      date: new Date().toDateString(),
    });
    recordSession();
  };

  // Group entries by day for timeline view
  const groupedByDay = useMemo(() => {
    const map = {};
    entries.forEach((e) => {
      const day = new Date(e.timestamp).toDateString();
      if (!map[day]) map[day] = [];
      map[day].push(e);
    });
    return Object.entries(map).map(([day, items]) => ({ day, items }));
  }, [entries]);

  return { entries, saveSession, groupedByDay };
}

export function useAnalytics() {
  const { entries } = useJournalStore();
  const { currentStreak, longestStreak, totalSessions } = useStreakStore();

  return useMemo(() => {
    const now = Date.now();
    const DAY = 86400000;

    // Filter helpers
    const todayEntries = entries.filter((e) => now - e.timestamp < DAY);
    const weekEntries = entries.filter((e) => now - e.timestamp < 7 * DAY);

    const totalFocusToday = todayEntries.reduce(
      (a, e) => a + (e.duration || 0),
      0,
    );
    const totalFocusWeek = weekEntries.reduce(
      (a, e) => a + (e.duration || 0),
      0,
    );

    // Mode breakdown (week)
    const modeBreakdown = weekEntries.reduce((acc, e) => {
      acc[e.mode] = (acc[e.mode] || 0) + (e.duration || 0);
      return acc;
    }, {});

    // Best time of day (group by hour)
    const hourBuckets = Array(24).fill(0);
    entries.forEach((e) => {
      const h = new Date(e.timestamp).getHours();
      hourBuckets[h] += e.duration || 0;
    });
    const bestHour = hourBuckets.indexOf(Math.max(...hourBuckets));
    const bestTimeLabel =
      bestHour === 0
        ? "Midnight"
        : bestHour < 12
          ? `${bestHour}am`
          : bestHour === 12
            ? "Noon"
            : `${bestHour - 12}pm`;

    // Session lengths for longest single session
    const longestSession = entries.reduce(
      (a, e) => Math.max(a, e.duration || 0),
      0,
    );

    return {
      totalFocusToday,
      totalFocusWeek,
      modeBreakdown,
      bestTimeLabel,
      longestSession,
      currentStreak,
      longestStreak,
      totalSessions,
    };
  }, [entries, currentStreak, longestStreak, totalSessions]);
}
