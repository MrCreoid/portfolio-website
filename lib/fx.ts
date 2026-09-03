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
  dot: "rgba(255, 90, 90, 0.5)",
  line: "255, 34, 51",
};

export function setParticleTheme(crt: boolean, cozy: boolean) {
  if (crt) {
    particleTheme.dot = "rgba(74, 222, 128, 0.5)";
    particleTheme.line = "34, 197, 94";
  } else if (cozy) {
    particleTheme.dot = "rgba(251, 191, 36, 0.45)";
    particleTheme.line = "245, 158, 11";
  } else {
    particleTheme.dot = "rgba(255, 90, 90, 0.5)";
    particleTheme.line = "255, 34, 51";
  }
}

/* ---------------- confetti & floaty bits ---------------- */

export function confetti(x: number, y: number, n = 24, cozy = false) {
  const colors = cozy
    ? ["#f59e0b", "#fbbf24", "#fb923c", "#fde68a"]
    : ["#ff2233", "#ff7d6b", "#ff5a5a", "#7d0b1e", "#ffe0dd"];

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

/* ---------------- text: word splitting & the scramble ---------------- */

/**
 * Wraps every word inside `el` in <span class="w" style="--i:n"> without
 * disturbing the inline elements around them (a <strong> keeps its words).
 * Idempotent — the stylesheet and the scroll hooks both call it.
 */
export function splitWords(el: HTMLElement): HTMLElement[] {
  if (!el.dataset.split) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode as Text);
    let i = 0;
    for (const n of nodes) {
      const frag = document.createDocumentFragment();
      for (const part of n.data.split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) {
          frag.append(part);
          continue;
        }
        const w = document.createElement("span");
        w.className = "w";
        w.style.setProperty("--i", String(i++));
        w.textContent = part;
        frag.append(w);
      }
      n.replaceWith(frag);
    }
    el.dataset.split = "1";
  }
  return Array.from(el.querySelectorAll<HTMLElement>(".w"));
}

const GLYPHS = "!<>-_\\/[]{}—=+*^?#01";

/** Decodes the element's own text out of noise, left to right. */
export function scramble(el: HTMLElement, ms = 420) {
  if (el.dataset.busy) return;
  const text = el.dataset.text ?? (el.dataset.text = el.textContent ?? "");
  el.dataset.busy = "1";
  const t0 = performance.now();
  const tick = (t: number) => {
    const p = Math.min((t - t0) / ms, 1);
    const fixed = Math.floor(p * text.length);
    let out = "";
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      out +=
        i < fixed || ch === " "
          ? ch
          : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = out;
    if (p < 1) requestAnimationFrame(tick);
    else {
      el.textContent = text;
      delete el.dataset.busy;
    }
  };
  requestAnimationFrame(tick);
}
