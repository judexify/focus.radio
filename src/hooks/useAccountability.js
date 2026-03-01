import { useEffect } from "react";
import { useAccountabilityStore } from "../store";

const ACTIVITY_MESSAGES = [
  "Someone just started a Deep session",
  "A listener joined from Tokyo",
  "Someone just completed a Focus block",
  "A new listener tuned in",
  'Someone set their intent: "ship the feature"',
  "A Deep session just ended — 90 min streak",
  "A Deep session just ended — 50 min streak",
  "A listener joined from Space",
  "Someone just locked in 6hrs now",
  "Someone is on their 3rd session today",
];

/**
 * useAccountability
 * Simulates real-time social presence.
 * Architecture is designed so you can swap the setInterval + random logic
 * for a real WebSocket connection (e.g. socket.on('activity', addActivity))
 * without changing any component code.
 */
export function useAccountability() {
  const { listenerCount, recentActivity, addActivity, updateListenerCount } =
    useAccountabilityStore();

  useEffect(() => {
    // Simulate listener count drift every 15s
    const countTimer = setInterval(() => {
      updateListenerCount(
        Math.max(20, listenerCount + Math.floor(Math.random() * 11) - 5),
      );
    }, 15000);

    // Simulate activity pulse every 8–20s
    let activityTimer;
    const scheduleActivity = () => {
      const delay = 8000 + Math.random() * 12000;
      activityTimer = setTimeout(() => {
        const msg =
          ACTIVITY_MESSAGES[
            Math.floor(Math.random() * ACTIVITY_MESSAGES.length)
          ];
        addActivity(msg);
        scheduleActivity();
      }, delay);
    };
    scheduleActivity();

    return () => {
      clearInterval(countTimer);
      clearTimeout(activityTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { listenerCount, recentActivity };
}
