/* ============================================================
   Imperative effects shared across the site.

   These are the parts that were always imperative — canvas loops, particles
   appended to <body>, physics. React owns structure and state; this file owns
   pixels. Every entry point is browser-only and must be called from an effect.
   ============================================================ */

export const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

export const rand = (a: number, b: number) => a + Math.random() * (b - a);
export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** matchMedia at module scope would run during SSR — always call these lazily. */
export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const hasFinePointer = () =>
  typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;

/* ---------------- particle palette (crt > cozy > ember) ---------------- */

export type ParticleTheme = { dot: string; line: string };

/** Mutated in place so the running canvas loop picks changes up on its next frame. */
export const particleTheme: ParticleTheme = {
  dot: "rgba(255, 150, 60, 0.5)",
  line: "255, 92, 36",
};

export function setParticleTheme(crt: boolean, cozy: boolean) {
  if (crt) {
    particleTheme.dot = "rgba(74, 222, 128, 0.5)";
    particleTheme.line = "34, 197, 94";
  } else if (cozy) {
    particleTheme.dot = "rgba(251, 191, 36, 0.45)";
    particleTheme.line = "245, 158, 11";
  } else {
    particleTheme.dot = "rgba(255, 150, 60, 0.5)";
    particleTheme.line = "255, 92, 36";
  }
}

/* ---------------- confetti & floaty bits ---------------- */

export function confetti(x: number, y: number, n = 24, cozy = false) {
  const colors = cozy
    ? ["#f59e0b", "#fbbf24", "#fb923c", "#fde68a"]
    : ["#ff5c24", "#ffc705", "#ff963c", "#d6285a", "#ffecd0"];

  for (let i = 0; i < n; i++) {
    const bit = document.createElement("span");
    bit.className = "confetti-bit";
    bit.style.left = x + "px";
    bit.style.top = y + "px";
    bit.style.background = colors[(Math.random() * colors.length) | 0];
    document.body.appendChild(bit);
    const ang = rand(0, Math.PI * 2);
    const v = rand(60, 240);
    bit.animate(
      [
        { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
        {
          transform: `translate(${Math.cos(ang) * v}px, ${Math.sin(ang) * v + 160}px) rotate(${rand(-360, 360)}deg)`,
          opacity: 0,
        },
      ],
      { duration: rand(700, 1300), easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    ).onfinish = () => bit.remove();
  }
}

export function floatBit(x: number, y: number, text: string) {
  const b = document.createElement("span");
  b.className = "float-bit";
  b.textContent = text;
  b.style.left = x + "px";
  b.style.top = y + "px";
  document.body.appendChild(b);
  b.animate(
    [
      { transform: "translate(0,0) scale(0.7)", opacity: 1 },
      { transform: `translate(${rand(-30, 30)}px, -70px) scale(1.2)`, opacity: 0 },
    ],
    { duration: 800, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
  ).onfinish = () => b.remove();
}

/* ---------------- EGG: matrix rain (type "pratyush") ---------------- */

let matrixOn = false;

export function matrixRain(cozy: boolean, duration = 7000) {
  if (matrixOn || prefersReducedMotion()) return;
  matrixOn = true;

  const c = document.createElement("canvas");
  c.className = "matrix-canvas";
  document.body.appendChild(c);
  const ctx = c.getContext("2d")!;
  const DPR = Math.min(devicePixelRatio || 1, 2);
  const W = (c.width = innerWidth * DPR);
  const H = (c.height = innerHeight * DPR);
  c.style.width = innerWidth + "px";
  c.style.height = innerHeight + "px";
  requestAnimationFrame(() => c.classList.add("is-on"));

  const FS = 15 * DPR;
  const cols = Math.ceil(W / FS);
  const drops = Array.from({ length: cols }, () => rand(-40, 0));
  const glyphs = "PRATYUSH01{}[]<>=+*/#$_アイウエオカキクケコサシスセソタチツテト";
  ctx.font = `${FS}px monospace`;

  let stopping = false;
  (function rainFrame() {
    ctx.fillStyle = "rgba(7, 5, 6, 0.22)";
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < cols; i++) {
      const ch = glyphs[(Math.random() * glyphs.length) | 0];
      const y = drops[i] * FS;
      ctx.fillStyle = cozy ? "rgba(251, 191, 36, 0.95)" : "rgba(255, 199, 5, 0.95)";
      ctx.fillText(ch, i * FS, y);
      ctx.fillStyle = cozy ? "rgba(245, 158, 11, 0.4)" : "rgba(255, 92, 36, 0.4)";
      ctx.fillText(ch, i * FS, y - FS);
      drops[i]++;
      if (y > H && Math.random() > 0.975) drops[i] = rand(-25, 0);
    }
    if (!stopping) requestAnimationFrame(rainFrame);
  })();

  setTimeout(() => {
    c.classList.remove("is-on");
    setTimeout(() => {
      stopping = true;
      c.remove();
      matrixOn = false;
    }, 700);
  }, duration);
}
