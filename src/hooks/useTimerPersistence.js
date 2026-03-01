import { useEffect } from "react";
import { useTimerStore } from "../store";
import { saveTimerState, clearTimerState } from "../store";

/**
 * useTimerPersistence — save-only.
 * Loading is handled synchronously in store/index.js at module init time,
 * so the store already has the right values before the first render.
 * This hook just keeps localStorage in sync on every change.
 */
export function useTimerPersistence() {
  const { status, mode, elapsed, intent, customDuration, sessionColor, MODES } =
    useTimerStore();

  useEffect(() => {
    if (!["running", "paused"].includes(status)) {
      clearTimerState();
      return;
    }
    const duration = customDuration || MODES[mode]?.duration || 50 * 60;
    saveTimerState({
      status,
      mode,
      elapsed,
      intent,
      duration,
      customDuration,
      sessionColor,
    });
  }, [status, mode, elapsed, intent, customDuration, sessionColor, MODES]);
}
