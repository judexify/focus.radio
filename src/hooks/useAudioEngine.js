import { useEffect, useRef, useCallback } from "react";
import { useAudioStore } from "../store";

/**
 * useAudioEngine
 * Ambient sounds are ScriptProcessor-generated noise shapes:
 *   - rain: filtered white noise (bandpass ~800Hz)
 *   - café: layered brown noise + occasional transients
 *   - whiteNoise: flat white noise
 *   - fire: low-frequency crackle (pink noise + LFO tremolo)
 */

const STREAM_URL = "https://ice2.somafm.com/lush-128-mp3"; // SomaFM Lush — primary
const FALLBACK_STREAM = "https://streams.ilovemusic.de/iloveradio17.mp3"; // ilovemusic fallback
// const FALLBACK_OFFLINE_NOTE = 440; // A4 — simple drone if truly offline

export function useAudioEngine() {
  const ctxRef = useRef(null);
  const radioElRef = useRef(null);
  const radioSourceRef = useRef(null);
  const radioGainRef = useRef(null);
  const masterGainRef = useRef(null);
  const ambientNodesRef = useRef({});
  const ambientGainsRef = useRef({});
  const offlineLoopRef = useRef(null);
  const streamFailedRef = useRef(false);

  const {
    isPlaying,
    radioVolume,
    ambientVolumes,
    isAmbientPlaying,
    setStreamFailed,
    setPlaying,
    setAmbientPlaying,
  } = useAudioStore();

  // Bootstrap AudioContext
  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      masterGainRef.current = ctxRef.current.createGain();
      masterGainRef.current.connect(ctxRef.current.destination);
    }
    return ctxRef.current;
  }, []);

  //  Noise generators
  const createNoiseBuffer = useCallback((ctx, type = "white") => {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === "pink") {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      } else if (type === "brown") {
        b0 = (b0 + 0.02 * white) / 1.02;
        data[i] = b0 * 3.5;
      } else {
        data[i] = white;
      }
    }
    return buffer;
  }, []);

  const createAmbientSource = useCallback(
    (ctx, type) => {
      const noiseType =
        type === "rain"
          ? "pink"
          : type === "cafe"
            ? "brown"
            : type === "fire"
              ? "pink"
              : "white";
      const buffer = createNoiseBuffer(ctx, noiseType);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const gainNode = ctx.createGain();
      gainNode.gain.value = 0;

      if (type === "rain") {
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 800;
        filter.Q.value = 0.5;
        source.connect(filter);
        filter.connect(gainNode);
      } else if (type === "fire") {
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 400;
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 2.5;
        lfoGain.gain.value = 0.3;
        lfo.connect(lfoGain);
        lfoGain.connect(gainNode.gain);
        lfo.start();
        source.connect(filter);
        filter.connect(gainNode);
      } else {
        source.connect(gainNode);
      }

      gainNode.connect(masterGainRef.current);
      source.start();
      return { source, gainNode };
    },
    [createNoiseBuffer],
  );

  //  Radio
  const startRadio = useCallback(() => {
    const ctx = getCtx();

    if (!radioElRef.current) {
      const el = new Audio();
      el.crossOrigin = "anonymous";
      el.src = STREAM_URL;
      el.preload = "none";
      // Only treat hard errors as failure — NOT stalled/waiting events,
      // which fire constantly during normal stream buffering.
      // Try the fallback URL first; only go offline if that also fails.
      let triedFallback = false;
      el.addEventListener("error", () => {
        if (!triedFallback) {
          triedFallback = true;
          el.src = FALLBACK_STREAM;
          el.load();
          el.play().catch(() => {
            streamFailedRef.current = true;
            setStreamFailed(true);
            startOfflineLoop();
          });
        } else {
          streamFailedRef.current = true;
          setStreamFailed(true);
          startOfflineLoop();
        }
      });
      // stalled = buffering, NOT a failure — do not trigger offline mode
      radioElRef.current = el;
    }

    if (!radioSourceRef.current) {
      radioSourceRef.current = ctx.createMediaElementSource(radioElRef.current);
      radioGainRef.current = ctx.createGain();
      radioGainRef.current.gain.value = radioVolume;
      radioSourceRef.current.connect(radioGainRef.current);
      radioGainRef.current.connect(masterGainRef.current);
    }

    // play() rejection = autoplay policy, NOT a stream failure.
    // The 'error' event listener above handles actual stream failures.
    radioElRef.current.play().catch(() => {
      // Autoplay blocked — user must interact first. This is normal.
      // Do NOT set streamFailed here.
      console.warn("[audio] Autoplay blocked — waiting for user interaction");
    });
  }, [getCtx, radioVolume, setStreamFailed]);

  const startOfflineLoop = useCallback(() => {
    if (offlineLoopRef.current) return;
    const ctx = getCtx();
    // Gentle offline drone: sine wave chord (root + fifth)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const g = ctx.createGain();
    osc1.frequency.value = 110;
    osc2.frequency.value = 165;
    osc1.type = "sine";
    osc2.type = "sine";
    g.gain.value = 0.08;
    osc1.connect(g);
    osc2.connect(g);
    g.connect(masterGainRef.current);
    osc1.start();
    osc2.start();
    offlineLoopRef.current = { osc1, osc2, g };
  }, [getCtx]);

  //  Helper: ensure ambient nodes exist
  const bootstrapAmbient = useCallback(() => {
    const ctx = getCtx();
    ctx.resume();
    const AMBIENT_TYPES = ["rain", "cafe", "whiteNoise", "fire"];
    AMBIENT_TYPES.forEach((t) => {
      if (!ambientNodesRef.current[t]) {
        const nodes = createAmbientSource(ctx, t);
        ambientNodesRef.current[t] = nodes.source;
        ambientGainsRef.current[t] = nodes.gainNode;
      }
    });
  }, [getCtx, createAmbientSource]);

  // Radio play / pause
  useEffect(() => {
    if (!isPlaying) {
      radioElRef.current?.pause();
      // Only suspend context if ambient is also off
      if (!isAmbientPlaying) {
        ctxRef.current?.suspend();
      }
      return;
    }
    const ctx = getCtx();
    ctx.resume();
    if (!streamFailedRef.current) {
      startRadio();
    } else {
      startOfflineLoop();
    }
    // Ensure ambient nodes exist (they'll be silent if volumes are 0)
    bootstrapAmbient();
  }, [
    isPlaying,
    isAmbientPlaying,
    getCtx,
    startRadio,
    startOfflineLoop,
    bootstrapAmbient,
  ]);

  // Ambient play / pause (independent of radio)
  useEffect(() => {
    if (!isAmbientPlaying) {
      // Mute all ambient gains softly
      Object.values(ambientGainsRef.current).forEach((g) => {
        if (g) g.gain.setTargetAtTime(0, ctxRef.current?.currentTime ?? 0, 0.2);
      });
      // Suspend context if radio is also off
      if (!isPlaying) ctxRef.current?.suspend();
      return;
    }
    // Resume context and bootstrap nodes
    bootstrapAmbient();
    // Restore volumes from store
    Object.entries(ambientVolumes).forEach(([key, vol]) => {
      const g = ambientGainsRef.current[key];
      if (g) g.gain.setTargetAtTime(vol, ctxRef.current?.currentTime ?? 0, 0.1);
    });
  }, [isAmbientPlaying, isPlaying, ambientVolumes, bootstrapAmbient]);

  // Sync radio volume
  useEffect(() => {
    if (radioGainRef.current) {
      radioGainRef.current.gain.setTargetAtTime(
        radioVolume,
        ctxRef.current?.currentTime ?? 0,
        0.05,
      );
    }
    if (radioElRef.current && !streamFailedRef.current) {
      radioElRef.current.volume = 1; // gain node handles actual volume
    }
  }, [radioVolume]);

  //  Sync ambient volumes (only when ambient is active)
  useEffect(() => {
    if (!isAmbientPlaying) return;
    Object.entries(ambientVolumes).forEach(([key, vol]) => {
      const gainNode = ambientGainsRef.current[key];
      if (gainNode) {
        gainNode.gain.setTargetAtTime(
          vol,
          ctxRef.current?.currentTime ?? 0,
          0.1,
        );
      }
    });
  }, [ambientVolumes, isAmbientPlaying]);

  // Cleanup

  useEffect(() => {
    return () => {
      radioElRef.current?.pause();
      if (ctxRef.current?.state === "running") {
        ctxRef.current.suspend();
      }
    };
  }, []);

  const togglePlay = useCallback(() => {
    // Recreate AudioContext if it was somehow closed
    if (ctxRef.current?.state === "closed") {
      ctxRef.current = null;
      masterGainRef.current = null;
      radioSourceRef.current = null;
      radioGainRef.current = null;
    }
    // Resume if suspended (browser suspends ctx until user gesture)
    if (ctxRef.current?.state === "suspended") {
      ctxRef.current.resume();
    }
    setPlaying(!isPlaying);
  }, [isPlaying, setPlaying]);

  // Expose a stopForFocus helper — called when a timer session starts
  const stopForFocus = useCallback(() => {
    if (radioElRef.current) radioElRef.current.pause();
    if (ctxRef.current?.state === "running") ctxRef.current.suspend();
    setPlaying(false);
  }, [setPlaying]);

  const toggleAmbient = useCallback(() => {
    setAmbientPlaying(!isAmbientPlaying);
  }, [isAmbientPlaying, setAmbientPlaying]);

  return { togglePlay, stopForFocus, toggleAmbient };
}

/**
 * useMediaSession
 * Registers the app with the browser's Media Session API.
 * This is what makes your phone's lock screen / notification shade
 * show playback controls instead of you having to open Chrome.
 *
 * Works on: Chrome for Android, Safari iOS 15+, Edge
 * Falls back gracefully if not supported.
 */
export function useMediaSession() {
  const { isPlaying, setPlaying } = useAudioStore();
  // We read mode/elapsed from the timer store to update the "now playing" metadata
  // whenever the session changes.

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    // Set track metadata — shows on lock screen / notification
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: "focus.radio",
      artist: "lo-fi deep work",
      album: "focus session",
      // You can add artwork here if you have a public image URL:
      // artwork: [{ src: '/logo192.png', sizes: '192x192', type: 'image/png' }],
    });

    // Wire hardware / OS-level controls
    const setAction = (action, handler) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (_) {
        /* unsupported action — ignore */
      }
    };

    setAction("play", () => setPlaying(true));
    setAction("pause", () => setPlaying(false));
    setAction("stop", () => setPlaying(false));
    // Skip track buttons do nothing for a radio — ignore them
    setAction("nexttrack", null);
    setAction("previoustrack", null);

    return () => {
      // Clean up handlers on unmount
      ["play", "pause", "stop", "nexttrack", "previoustrack"].forEach((a) => {
        try {
          navigator.mediaSession.setActionHandler(a, null);
        } catch (_) {}
      });
    };
  }, [setPlaying]);

  // Keep playbackState in sync so the OS shows correct play/pause icon
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);
}
