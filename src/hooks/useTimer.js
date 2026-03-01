import { useEffect, useCallback, useRef } from "react";
import { useTimerStore, useAudioStore } from "../store";
import { useTimerPersistence } from "./useTimerPersistence";
import { clearTimerState } from "../store";

// Module-level singleton worker
let _worker = null;
function getWorker() {
  if (!_worker)
    _worker = new Worker(
      new URL("../workers/timer.worker.js", import.meta.url),
    );
  return _worker;
}

export function useTimer() {
  const {
    mode,
    elapsed,
    status,
    MODES,
    customDuration,
    setStatus,
    setElapsed,
  } = useTimerStore();
  const { isPlaying, setPlaying, setPausedForFocus } = useAudioStore();

  // Keeps localStorage in sync on every change
  useTimerPersistence();

  const duration = customDuration || MODES[mode]?.duration || 50 * 60;

  //  Boot worker on mount if store was restored as running
  // Because the store loads synchronously from localStorage, `status` and
  // `elapsed` already have the right values on the very first render.
  const workerBootedRef = useRef(false);
  useEffect(() => {
    if (workerBootedRef.current) return;
    if (status === "running") {
      workerBootedRef.current = true;
      getWorker().postMessage({
        type: "START",
        payload: { duration, elapsed },
      });
    } else if (status === "paused") {
      workerBootedRef.current = true;
      // Worker stays idle; elapsed is already correct in store
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Worker message handler
  useEffect(() => {
    const worker = getWorker();
    const onMessage = (e) => {
      const { type, payload } = e.data;
      if (type !== "TICK") return;

      setElapsed(payload.elapsed);

      if (payload.done) {
        if (isPlaying) {
          document.querySelector("audio")?.pause();
          setPlaying(false);
          setPausedForFocus(true);
        }
        clearTimerState();
        setStatus("reflection");
      }
    };
    worker.addEventListener("message", onMessage);
    return () => worker.removeEventListener("message", onMessage);
  }, [setElapsed, setStatus, isPlaying, setPlaying, setPausedForFocus]);

  // Controls
  const start = useCallback(() => {
    getWorker().postMessage({
      type: "START",
      payload: { duration, elapsed: 0 },
    });
    setStatus("running");
    setElapsed(0);
  }, [duration, setStatus, setElapsed]);

  const pause = useCallback(() => {
    getWorker().postMessage({ type: "PAUSE" });
    setStatus("paused");
  }, [setStatus]);

  const resume = useCallback(() => {
    getWorker().postMessage({ type: "RESUME", payload: { duration, elapsed } });
    setStatus("running");
  }, [duration, elapsed, setStatus]);

  const reset = useCallback(() => {
    getWorker().postMessage({ type: "RESET" });
    clearTimerState();
    setElapsed(0);
    setStatus("idle");
  }, [setElapsed, setStatus]);

  return { start, pause, resume, reset, duration };
}
