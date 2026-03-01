import React, { useEffect, useRef, useState, useCallback } from "react";

const W = 600;
const H = 150;
const GROUND = H - 30;
const GRAVITY = 0.6;
const JUMP_V = -12;

function randomObstacle(x) {
  const type = Math.random() > 0.3 ? "cactus" : "bird";
  return {
    type,
    x,
    y: type === "cactus" ? GROUND - 30 : GROUND - 55 - Math.random() * 20,
    w: type === "cactus" ? 20 : 30,
    h: type === "cactus" ? 30 : 20,
  };
}

export default function DinoGame() {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const rafRef = useRef(null);
  const lastRef = useRef(0);
  const [score, setScore] = useState(0);
  const [dead, setDead] = useState(false);
  const [started, setStarted] = useState(false);
  const [hiScore, setHiScore] = useState(0);

  const initState = () => ({
    dino: {
      x: 70,
      y: GROUND - 40,
      vy: 0,
      h: 40,
      w: 30,
      onGround: true,
      ducking: false,
    },
    obstacles: [],
    speed: 4,
    score: 0,
    nextObstacle: 80,
    clouds: [
      { x: 100, y: 30, w: 60 },
      { x: 300, y: 20, w: 80 },
      { x: 500, y: 40, w: 50 },
    ],
    groundX: 0,
    running: true,
    dead: false,
  });

  const drawCloud = (ctx, cx, cy, cw) => {
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.ellipse(cx + cw * 0.5, cy, cw * 0.5, 12, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + cw * 0.3, cy + 4, cw * 0.35, 10, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + cw * 0.7, cy + 4, cw * 0.3, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const s = stateRef.current;
    if (!s) return;

    ctx.clearRect(0, 0, W, H);

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#050508");
    sky.addColorStop(1, "#0d0d1a");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Clouds
    s.clouds.forEach((c) => drawCloud(ctx, c.x, c.y, c.w));

    // Ground line
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, GROUND + 10);
    ctx.lineTo(W, GROUND + 10);
    ctx.stroke();

    // Ground dots
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    for (let i = 0; i < 20; i++) {
      const gx = (s.groundX + i * 30) % W;
      ctx.fillRect(gx, GROUND + 5, 15, 1);
    }

    // Dino (pixel art style)
    const d = s.dino;
    const dinoH = d.ducking ? 20 : d.h;
    const dinoY = d.ducking ? GROUND - 20 : d.y;

    ctx.fillStyle = "#67e8f9";
    ctx.beginPath();
    ctx.roundRect(d.x, dinoY, d.w, dinoH, 4);
    ctx.fill();

    // Eye
    ctx.fillStyle = "#050508";
    ctx.beginPath();
    ctx.arc(d.x + d.w - 6, dinoY + 7, 3, 0, Math.PI * 2);
    ctx.fill();

    // Legs (animated)
    if (d.onGround && s.running) {
      const legPhase = Math.sin(s.score * 0.3) > 0;
      ctx.fillStyle = "#67e8f9";
      ctx.fillRect(d.x + 4, dinoY + dinoH, 8, legPhase ? 8 : 4);
      ctx.fillRect(d.x + 16, dinoY + dinoH, 8, legPhase ? 4 : 8);
    }

    // Tail
    ctx.fillStyle = "#67e8f9";
    ctx.beginPath();
    ctx.roundRect(d.x - 10, dinoY + 10, 12, 8, 2);
    ctx.fill();

    // Obstacles
    s.obstacles.forEach((ob) => {
      if (ob.type === "cactus") {
        ctx.fillStyle = "#86efac";
        // Main stem
        ctx.beginPath();
        ctx.roundRect(ob.x + 6, ob.y, 8, ob.h, 2);
        ctx.fill();
        // Arms
        ctx.beginPath();
        ctx.roundRect(ob.x, ob.y + 8, ob.w, 6, 2);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(ob.x, ob.y + 4, 7, 10, 2);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(ob.x + ob.w - 7, ob.y + 4, 7, 10, 2);
        ctx.fill();
      } else {
        // Bird
        ctx.fillStyle = "#c084fc";
        ctx.beginPath();
        ctx.roundRect(ob.x, ob.y + 5, ob.w, ob.h - 10, 3);
        ctx.fill();
        // Wings
        const wingUp = Math.sin(s.score * 0.2) > 0;
        ctx.beginPath();
        ctx.roundRect(
          ob.x + 5,
          wingUp ? ob.y : ob.y + ob.h - 6,
          ob.w - 10,
          6,
          2,
        );
        ctx.fill();
        // Eye
        ctx.fillStyle = "#050508";
        ctx.beginPath();
        ctx.arc(ob.x + ob.w - 5, ob.y + 7, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Score
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.font = '12px "DM Mono", monospace';
    ctx.fillText(
      `HI ${String(hiScore).padStart(5, "0")}  ${String(Math.floor(s.score)).padStart(5, "0")}`,
      W - 180,
      20,
    );
  }, [hiScore]);

  const gameLoop = useCallback(
    (ts) => {
      lastRef.current = ts;
      const s = stateRef.current;
      if (!s || !s.running) return;

      // Speed up over time
      s.speed = Math.min(12, 4 + s.score / 300);
      s.score += s.speed * 0.05;
      setScore(Math.floor(s.score));

      // Dino physics
      const d = s.dino;
      if (!d.onGround) {
        d.vy += GRAVITY;
        d.y += d.vy;
        if (d.y >= GROUND - d.h) {
          d.y = GROUND - d.h;
          d.vy = 0;
          d.onGround = true;
        }
      }

      // Obstacles
      s.nextObstacle -= s.speed;
      if (s.nextObstacle <= 0) {
        s.obstacles.push(randomObstacle(W + 20));
        s.nextObstacle = 200 + Math.random() * 200;
      }
      s.obstacles = s.obstacles.filter((ob) => ob.x + ob.w > 0);
      s.obstacles.forEach((ob) => {
        ob.x -= s.speed;
      });

      // Clouds
      s.clouds.forEach((c) => {
        c.x -= s.speed * 0.3;
      });
      s.clouds = s.clouds.filter((c) => c.x + c.w > 0);
      if (s.clouds.length < 3) {
        s.clouds.push({
          x: W + 50,
          y: 15 + Math.random() * 35,
          w: 40 + Math.random() * 60,
        });
      }

      // Ground scroll
      s.groundX = (s.groundX - s.speed + 600) % 600;

      // Collision (AABB with padding)
      const pad = 6;
      const dinoRect = {
        x: d.x + pad,
        y: (d.ducking ? GROUND - 20 : d.y) + pad,
        w: d.w - pad * 2,
        h: (d.ducking ? 20 : d.h) - pad * 2,
      };
      for (const ob of s.obstacles) {
        const obRect = {
          x: ob.x + pad,
          y: ob.y + pad,
          w: ob.w - pad * 2,
          h: ob.h - pad * 2,
        };
        if (
          dinoRect.x < obRect.x + obRect.w &&
          dinoRect.x + dinoRect.w > obRect.x &&
          dinoRect.y < obRect.y + obRect.h &&
          dinoRect.y + dinoRect.h > obRect.y
        ) {
          s.running = false;
          s.dead = true;
          setDead(true);
          setHiScore((prev) => Math.max(prev, Math.floor(s.score)));
          draw();
          return;
        }
      }

      draw();
      rafRef.current = requestAnimationFrame(gameLoop);
    },
    [draw],
  );

  const startGame = useCallback(() => {
    stateRef.current = initState();
    setScore(0);
    setDead(false);
    setStarted(true);
    lastRef.current = performance.now();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  const jump = useCallback(() => {
    const d = stateRef.current?.dino;
    if (!d || !stateRef.current?.running) return;
    if (d.onGround) {
      d.vy = JUMP_V;
      d.onGround = false;
      d.ducking = false;
    }
  }, []);

  const duck = useCallback((on) => {
    const d = stateRef.current?.dino;
    if (d) d.ducking = on && d.onGround;
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      }
      if (e.code === "ArrowDown") {
        e.preventDefault();
        duck(true);
      }
    };
    const onKeyUp = (e) => {
      if (e.code === "ArrowDown") duck(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [jump, duck]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full">
        <span className="text-xs font-mono text-white/30 uppercase tracking-widest">
          Dino Run
        </span>
        <span className="text-xs font-mono text-white/50">
          Score: <span className="text-green-400">{score}</span>
          {hiScore > 0 && (
            <span className="text-white/20 ml-2">Best: {hiScore}</span>
          )}
        </span>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-white/10 w-full">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{ display: "block", width: "100%", height: "auto" }}
          onClick={jump}
        />

        {!started && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-3">
            <p className="text-white/60 text-sm font-mono">
              Space / ↑ to jump · ↓ to duck
            </p>
            <button
              onClick={startGame}
              className="px-6 py-2.5 rounded-xl text-sm font-mono border border-green-400/40 text-green-400 bg-green-400/10 hover:bg-green-400/20 transition-colors"
            >
              Start Running
            </button>
          </div>
        )}

        {dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3">
            <p className="text-white/80 text-lg font-mono">Game Over</p>
            <p className="text-white/40 text-sm font-mono">Score: {score}</p>
            <button
              onClick={startGame}
              className="px-6 py-2.5 rounded-xl text-sm font-mono border border-green-400/40 text-green-400 bg-green-400/10 hover:bg-green-400/20 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Mobile controls */}
      <div className="flex gap-3 w-full">
        <button
          onPointerDown={jump}
          className="flex-1 py-3 rounded-xl border border-white/10 bg-white/5 text-white/40 text-sm font-mono hover:bg-white/10 transition-colors active:scale-95 select-none"
        >
          ↑ Jump
        </button>
        <button
          onPointerDown={() => duck(true)}
          onPointerUp={() => duck(false)}
          className="flex-1 py-3 rounded-xl border border-white/10 bg-white/5 text-white/40 text-sm font-mono hover:bg-white/10 transition-colors active:scale-95 select-none"
        >
          ↓ Duck
        </button>
      </div>
    </div>
  );
}
