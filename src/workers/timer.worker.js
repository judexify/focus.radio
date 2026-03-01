/* eslint-disable no-restricted-globals */
// src/workers/timer.worker.js
// Runs off the main thread — immune to tab throttling and React re-render cycles.
// Communicates via postMessage: { type, payload }

let intervalId = null;
let startTime = null;
let elapsed = 0;
let duration = 0;
let tickRate = 500; // ms — slightly faster than 1s to compensate for drift

function tick() {
  const now = performance.now();
  const delta = now - startTime;
  startTime = now;
  elapsed += Math.round(delta / 1000); // accumulate whole seconds

  // Clamp to duration
  if (elapsed >= duration) {
    elapsed = duration;
    clearInterval(intervalId);
    intervalId = null;
    postMessage({ type: "TICK", payload: { elapsed, done: true } });
    return;
  }

  postMessage({ type: "TICK", payload: { elapsed, done: false } });
}

self.onmessage = (e) => {
  const { type, payload } = e.data;

  switch (type) {
    case "START": {
      duration = payload.duration;
      elapsed = payload.elapsed || 0;
      startTime = performance.now();
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(tick, tickRate);
      postMessage({ type: "STARTED" });
      break;
    }

    case "PAUSE": {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      postMessage({ type: "PAUSED", payload: { elapsed } });
      break;
    }

    case "RESUME": {
      elapsed = payload.elapsed || elapsed;
      duration = payload.duration || duration;
      startTime = performance.now();
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(tick, tickRate);
      postMessage({ type: "RESUMED" });
      break;
    }

    case "RESET": {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      elapsed = 0;
      startTime = null;
      postMessage({ type: "RESET_OK" });
      break;
    }

    case "PING": {
      postMessage({ type: "PONG", payload: { elapsed } });
      break;
    }

    default:
      break;
  }
};
