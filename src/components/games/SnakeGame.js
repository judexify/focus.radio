import React, { useEffect, useRef, useState, useCallback } from "react";

const CELL = 20;
const COLS = 20;
const ROWS = 20;
const W = CELL * COLS;
const H = CELL * ROWS;

const DIR = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
};

function randomFood(snake) {
  while (true) {
    const pos = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    };

    if (!snake.some((s) => s.x === pos.x && s.y === pos.y)) {
      return pos;
    }
  }
}

export default function SnakeGame() {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    snake: [{ x: 10, y: 10 }],
    dir: { x: 1, y: 0 },
    nextDir: { x: 1, y: 0 },
    food: { x: 5, y: 5 },
    score: 0,
    running: false,
    dead: false,
  });
  const rafRef = useRef(null);
  const lastTickRef = useRef(0);
  const [score, setScore] = useState(0);
  const [dead, setDead] = useState(false);
  const [started, setStarted] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { snake, food } = stateRef.current;

    // Background
    ctx.fillStyle = "#0a0a12";
    ctx.fillRect(0, 0, W, H);

    // Grid dots
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        ctx.fillRect(x * CELL + CELL / 2 - 1, y * CELL + CELL / 2 - 1, 2, 2);
      }
    }

    // Food
    const gf = ctx.createRadialGradient(
      food.x * CELL + CELL / 2,
      food.y * CELL + CELL / 2,
      2,
      food.x * CELL + CELL / 2,
      food.y * CELL + CELL / 2,
      CELL / 2,
    );
    gf.addColorStop(0, "#f0abfc");
    gf.addColorStop(1, "#c084fc44");
    ctx.fillStyle = gf;
    ctx.beginPath();
    ctx.arc(
      food.x * CELL + CELL / 2,
      food.y * CELL + CELL / 2,
      CELL / 2 - 2,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    // Snake
    snake.forEach((seg, i) => {
      const alpha =
        0.4 + (i === 0 ? 0.6 : ((snake.length - i) / snake.length) * 0.5);
      ctx.fillStyle = i === 0 ? "#67e8f9" : `rgba(103,232,249,${alpha})`;
      const pad = i === 0 ? 1 : 2;
      ctx.beginPath();
      ctx.roundRect(
        seg.x * CELL + pad,
        seg.y * CELL + pad,
        CELL - pad * 2,
        CELL - pad * 2,
        4,
      );
      ctx.fill();

      // Eyes on head
      if (i === 0) {
        ctx.fillStyle = "#0a0a12";
        ctx.beginPath();
        ctx.arc(seg.x * CELL + 5, seg.y * CELL + 6, 2, 0, Math.PI * 2);
        ctx.arc(seg.x * CELL + CELL - 5, seg.y * CELL + 6, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }, []);

  const tick = useCallback(
    (ts) => {
      const SPEED = 120; // ms per tick
      if (ts - lastTickRef.current >= SPEED) {
        lastTickRef.current = ts;
        const s = stateRef.current;
        if (!s.running) return;

        s.dir = s.nextDir;
        const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y };

        // Wall collision
        if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
          s.running = false;
          s.dead = true;
          setDead(true);
          return;
        }

        // Self collision
        if (s.snake.some((seg) => seg.x === head.x && seg.y === head.y)) {
          s.running = false;
          s.dead = true;
          setDead(true);
          return;
        }

        s.snake.unshift(head);

        if (head.x === s.food.x && head.y === s.food.y) {
          s.score += 1;
          setScore(s.score);
          s.food = randomFood(s.snake);
        } else {
          s.snake.pop();
        }
      }

      draw();
      rafRef.current = requestAnimationFrame(tick);
    },
    [draw],
  );

  const startGame = useCallback(() => {
    const initSnake = [{ x: 10, y: 10 }];
    stateRef.current = {
      snake: initSnake,
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },
      food: randomFood(initSnake),
      score: 0,
      running: true,
      dead: false,
    };
    setScore(0);
    setDead(false);
    setStarted(true);
    lastTickRef.current = 0;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  // Keyboard controls
  useEffect(() => {
    const onKey = (e) => {
      const d = DIR[e.key];
      if (!d) return;
      e.preventDefault();
      const cur = stateRef.current.dir;
      // Prevent reversing
      if (d.x === -cur.x && d.y === -cur.y) return;
      stateRef.current.nextDir = d;
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Initial draw
  useEffect(() => {
    draw();
  }, [draw]);

  // D-pad for mobile
  const dpad = (key) => {
    const d = DIR[key];
    if (!d) return;
    const cur = stateRef.current.dir;
    if (d.x === -cur.x && d.y === -cur.y) return;
    stateRef.current.nextDir = d;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full">
        <span className="text-xs font-mono text-white/30 uppercase tracking-widest">
          Snake
        </span>
        <span className="text-xs font-mono text-white/50">
          Score: <span className="text-cyan-400">{score}</span>
        </span>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-white/10">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{ display: "block", width: W, height: H }}
        />

        {!started && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-4">
            <p className="text-white/60 text-sm font-mono">
              Arrow keys or WASD to move
            </p>
            <button
              onClick={startGame}
              className="px-6 py-2.5 rounded-xl text-sm font-mono border border-cyan-400/40 text-cyan-400 bg-cyan-400/10 hover:bg-cyan-400/20 transition-colors"
            >
              Start Game
            </button>
          </div>
        )}

        {dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3">
            <p className="text-white/80 text-lg font-mono">Game Over</p>
            <p className="text-white/40 text-sm font-mono">Score: {score}</p>
            <button
              onClick={startGame}
              className="px-6 py-2.5 rounded-xl text-sm font-mono border border-cyan-400/40 text-cyan-400 bg-cyan-400/10 hover:bg-cyan-400/20 transition-colors"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* Mobile D-pad */}
      <div className="grid grid-cols-3 gap-1 mt-1">
        {[
          [null, "ArrowUp", null],
          ["ArrowLeft", null, "ArrowRight"],
          [null, "ArrowDown", null],
        ].map((row, ri) =>
          row.map((key, ci) =>
            key ? (
              <button
                key={`${ri}-${ci}`}
                onPointerDown={() => dpad(key)}
                className="w-10 h-10 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors active:scale-95 text-lg select-none"
              >
                {key === "ArrowUp"
                  ? "↑"
                  : key === "ArrowDown"
                    ? "↓"
                    : key === "ArrowLeft"
                      ? "←"
                      : "→"}
              </button>
            ) : (
              <div key={`${ri}-${ci}`} className="w-10 h-10" />
            ),
          ),
        )}
      </div>
    </div>
  );
}
