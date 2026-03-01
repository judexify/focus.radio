
This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

# focus.radio

A quiet place to do your best work. Lo-fi radio, ambient sounds, focus timers, a work journal, and a plant that grows with your consistency.

---

## Features

**Radio + Ambient**
- 24/7 lo-fi stream with offline drone fallback
- Independent ambient mixer — rain, café, static, hearth
- Ambient plays without the radio. Radio plays without ambient. Both have their own controls.

**Focus Timer**
- Three modes: Deep (90m), Focus (50m), Drift (25m)
- Custom durations from 25 minutes up to 6 hours
- Custom session colors — change the ring, gradient and page accent
- Breathing ritual before every session
- Sessions survive page reloads — timer keeps running even if you close and reopen the tab
- Distraction shield for Deep Work mode (fullscreen lockout)

**Work Journal**
- Every session logged with intent and reflection
- Partial sessions saved automatically if you end early
- Grouped by day with total time per day
- Session color carried through to journal entries

**Work Stats**
- Time tracked per project
- "Locked in" badge for projects with 3+ sessions or 2h+ logged

**Focus Plant**
- A tiny SVG plant that lives at the bottom of the Focus tab
- Grows through 7 stages based on total sessions completed
- Glows while a session is running, sparkles when one completes
- Wilts if your streak breaks. One session revives it.
- Your consistency is its water.

**Games**
- Snake and Dino Run for break time
- 5-minute stretch reminder

**PWA**
- Installable on Android, iOS and desktop
- Offline ambient audio (Web Audio API, no network needed)
- OS media controls via Media Session API
- Install prompt shown once, 5 seconds after first visit

---

## Stack

- React 18
- Zustand
- Framer Motion
- Tailwind CSS
- Lucide React
- Web Audio API
- Web Workers (timer runs off main thread)

---

## Running locally

```bash
npm install
npm start
```

To test PWA features (install prompt, service worker, offline):

```bash
npm run build
npx serve -s build
```

---

## Notes

The ambient sounds are generated entirely via Web Audio — noise buffers and oscillators. No audio files, no network required for ambience.

The timer state is saved to localStorage on every tick. If you reload mid-session, the app calculates how many seconds passed while the tab was closed and picks up from there.
