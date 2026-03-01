import { useEffect } from "react";
import { useAudioStore, useTimerStore } from "../store";

/**
 * useMediaSession
 *
 * Registers this app with the browser's Media Session API so the OS
 * can display and control playback from:
 *   - iPhone / Android lock screen
 *   - Mac menu bar (Now Playing widget)
 *   - Windows taskbar media controls
 *   - AirPods / headphone hardware buttons
 *   - Bluetooth device controls
 *
 * Must be called once at the App level after audio has started.
 */
export function useMediaSession(togglePlay, pause, resume) {
  const { isPlaying } = useAudioStore();
  const { status, mode, elapsed, MODES } = useTimerStore();

  const duration = MODES[mode]?.duration ?? 50 * 60;
  const remaining = Math.max(0, duration - elapsed);
  const isRunning = status === "running";
  const isPaused = status === "paused";

  // Set metadata (what shows on lock screen / Now Playing)
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: isRunning
        ? `${mode} Session — ${Math.floor(remaining / 60)}m left`
        : "focus.radio",
      artist: isPlaying ? "Lo-Fi Radio · Playing" : "Lo-Fi Radio · Paused",
      album: "focus.radio",
      artwork: [
        { src: "/icons/icon-96.png", sizes: "96x96", type: "image/png" },
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
    });
  }, [isPlaying, isRunning, mode, remaining]);

  // Register action handlers
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    // Play/pause radio
    navigator.mediaSession.setActionHandler("play", () => togglePlay());
    navigator.mediaSession.setActionHandler("pause", () => togglePlay());

    // Previous track = restart / reset session
    navigator.mediaSession.setActionHandler("previoustrack", () => {
      if (isPaused || isRunning) pause();
    });

    // Next track = resume session
    navigator.mediaSession.setActionHandler("nexttrack", () => {
      if (isPaused) resume();
    });

    // Seek (shown on lock screen as a progress bar)
    navigator.mediaSession.setActionHandler("seekto", null);

    return () => {
      ["play", "pause", "previoustrack", "nexttrack"].forEach((action) => {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {}
      });
    };
  }, [togglePlay, pause, resume, isRunning, isPaused]);

  // Update playback state so OS shows correct play/pause icon
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

  // Update position state (shows progress bar on lock screen)
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    if (!isRunning && !isPaused) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: duration,
        playbackRate: 1,
        position: elapsed,
      });
    } catch {}
  }, [elapsed, duration, isRunning, isPaused]);
}
