"use client";

import { useEffect, type RefObject } from "react";
import {
  SPRING,
  hasFinePointer,
  particleTheme,
  prefersReducedMotion,
  rand,
} from "@/lib/fx";

/** Custom cursor dot + lazy ring + the comet stardust trail. */
export function useCursor(
  dotRef: RefObject<HTMLDivElement | null>,
  ringRef: RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring || !hasFinePointer() || prefersReducedMotion()) return;

    let mx = innerWidth / 2;
    let my = innerHeight / 2;
    let rx = mx;
    let ry = my;
    let lastTrail = 0;
    let trailCount = 0;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px)`;

      const now = performance.now();
      if (now - lastTrail > 28 && trailCount < 40) {
        lastTrail = now;
        trailCount++;
        const bit = document.createElement("span");
        bit.className = "trail-bit";
        const size = rand(2.5, 5.5);
        bit.style.width = bit.style.height = size + "px";
        bit.style.transform = `translate(${mx + rand(-3, 3)}px, ${my + rand(-3, 3)}px)`;
        document.body.appendChild(bit);
        bit.animate(
          [
            { opacity: 0.8, scale: "1" },
            {
              opacity: 0,
              scale: "0.15",
              transform: `translate(${mx + rand(-18, 18)}px, ${my + rand(-4, 22)}px)`,
            },
          ],
          { duration: rand(420, 680), easing: "ease-out" },
        ).onfinish = () => {
          bit.remove();
          trailCount--;
        };
      }
    };

    const follow = () => {
      rx += (mx - rx) * 0.07;
      ry += (my - ry) * 0.07;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      raf = requestAnimationFrame(follow);
    };
    raf = requestAnimationFrame(follow);

    const hoverSel =
      "a, button, [data-cursor], input, textarea, .film, .card, .ach-card, .proj-card";
    const over = (e: MouseEvent) => {
      if ((e.target as Element).closest?.(hoverSel))
        document.body.classList.add("cursor-hover");
    };
    const out = (e: MouseEvent) => {
      if ((e.target as Element).closest?.(hoverSel))
        document.body.classList.remove("cursor-hover");
    };
    const down = () => document.body.classList.add("cursor-down");
    const up = () => document.body.classList.remove("cursor-down");

    addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", over);
    document.addEventListener("mouseout", out);
    addEventListener("mousedown", down);
    addEventListener("mouseup", up);

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", over);
      document.removeEventListener("mouseout", out);
      removeEventListener("mousedown", down);
      removeEventListener("mouseup", up);
    };
  }, [dotRef, ringRef]);
}

/** The calm constellation: particles breathe around a home point and link up. */
export function useParticles(canvasRef: RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion()) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const DPR = Math.min(devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;
    const parts: {
      hx: number;
      hy: number;
      x: number;
      y: number;
      phase: number;
      r: number;
    }[] = [];
    const COUNT = innerWidth < 700 ? 36 : 70;
    const mouse = { x: -9999, y: -9999 };

    const size = () => {
      const oldW = W;
      const oldH = H;
      W = canvas.width = innerWidth * DPR;
      H = canvas.height = innerHeight * DPR;
      canvas.style.width = innerWidth + "px";
      canvas.style.height = innerHeight + "px";
      if (oldW)
        for (const p of parts) {
          p.hx = (p.hx / oldW) * W;
          p.hy = (p.hy / oldH) * H;
        }
    };
    size();

    for (let i = 0; i < COUNT; i++) {
      const hx = Math.random() * W;
      const hy = Math.random() * H;
      parts.push({
        hx,
        hy,
        x: hx,
        y: hy,
        phase: Math.random() * Math.PI * 2,
        r: (Math.random() * 1.6 + 0.6) * DPR,
      });
    }

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX * DPR;
      mouse.y = e.clientY * DPR;
    };

    let running = true;
    let raf = 0;

    const frame = (t: number) => {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      const LINK = 110 * DPR;
      const PUSH = 120 * DPR;

      for (const p of parts) {
        // barely-there breathing around home
        let tx = p.hx + Math.sin(t * 0.00022 + p.phase) * 5 * DPR;
        let ty = p.hy + Math.cos(t * 0.00018 + p.phase * 1.4) * 5 * DPR;

        // the cursor gently pushes them aside; they drift back home after
        const dx = tx - mouse.x;
        const dy = ty - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < PUSH * PUSH && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const f = (PUSH - d) / PUSH;
          tx += (dx / d) * f * 42 * DPR;
          ty += (dy / d) * f * 42 * DPR;
        }

        p.x += (tx - p.x) * 0.045;
        p.y += (ty - p.y) * 0.045;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = particleTheme.dot;
        ctx.fill();
      }

      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          const a = parts[i];
          const b = parts[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            ctx.strokeStyle = `rgba(${particleTheme.line}, ${(1 - Math.sqrt(d2) / LINK) * 0.14})`;
            ctx.lineWidth = DPR * 0.7;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onVisibility = () => {
      running = !document.hidden;
      if (running) raf = requestAnimationFrame(frame);
    };

    addEventListener("resize", size);
    addEventListener("mousemove", onMove);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      removeEventListener("resize", size);
      removeEventListener("mousemove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [canvasRef]);
}

/** After 60s idle the PG logo bounces around the dimmed screen. */
export function useDvdScreensaver() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const IDLE_MS = 60000;
    const COLORS = ["#ffc705", "#4ade80", "#fbbf24", "#60a5fa", "#f87171", "#f472b6"];

    let idleTimer: ReturnType<typeof setTimeout>;
    let overlay: HTMLDivElement | null = null;
    let raf = 0;

    const start = () => {
      if (overlay || document.hidden) return;
      overlay = document.createElement("div");
      overlay.className = "dvd";
      overlay.innerHTML = `<span class="dvd-logo">PG</span><span class="dvd-hint">— move anything to wake the site —</span>`;
      document.body.appendChild(overlay);
      const node = overlay;
      requestAnimationFrame(() => node.classList.add("is-on"));

      const logo = node.querySelector<HTMLElement>(".dvd-logo")!;
      let ci = 0;
      logo.style.color = COLORS[ci];
      let x = rand(40, innerWidth / 2);
      let y = rand(40, innerHeight / 2);
      let vx = 2.4;
      let vy = 2.1;

      const bounce = () => {
        const w = logo.offsetWidth;
        const h = logo.offsetHeight;
        x += vx;
        y += vy;
        let hit = false;
        if (x <= 0 || x + w >= innerWidth) {
          vx *= -1;
          hit = true;
          x = Math.max(0, Math.min(x, innerWidth - w));
        }
        if (y <= 0 || y + h >= innerHeight) {
          vy *= -1;
          hit = true;
          y = Math.max(0, Math.min(y, innerHeight - h));
        }
        if (hit) {
          ci = (ci + 1) % COLORS.length;
          logo.style.color = COLORS[ci];
        }
        logo.style.transform = `translate(${x}px, ${y}px)`;
        raf = requestAnimationFrame(bounce);
      };
      bounce();
    };

    const stop = () => {
      if (!overlay) return;
      cancelAnimationFrame(raf);
      const o = overlay;
      overlay = null;
      o.classList.remove("is-on");
      setTimeout(() => o.remove(), 850);
    };

    const poke = () => {
      stop();
      clearTimeout(idleTimer);
      idleTimer = setTimeout(start, IDLE_MS);
    };

    const events = ["mousemove", "keydown", "scroll", "pointerdown", "touchstart"];
    events.forEach((ev) => addEventListener(ev, poke, { passive: true }));
    poke();

    return () => {
      clearTimeout(idleTimer);
      stop();
      events.forEach((ev) => removeEventListener(ev, poke));
    };
  }, []);
}

/** The tab title pouts while you're away. */
export function useTabPout() {
  useEffect(() => {
    const original = document.title;
    let pout: ReturnType<typeof setTimeout>;
    const onChange = () => {
      if (document.hidden) {
        document.title = "👀 come back…";
        pout = setTimeout(() => {
          document.title = "still here. waiting.";
        }, 15000);
      } else {
        clearTimeout(pout);
        document.title = original;
      }
    };
    document.addEventListener("visibilitychange", onChange);
    return () => {
      clearTimeout(pout);
      document.removeEventListener("visibilitychange", onChange);
      document.title = original;
    };
  }, []);
}

/** Scroll to the absolute bottom and linger to reveal the secret line. */
export function useBottomSecret(onReveal: () => void) {
  useEffect(() => {
    let holdTimer: ReturnType<typeof setTimeout> | null = null;
    let shown = false;

    const onScroll = () => {
      const atBottom = innerHeight + scrollY >= document.body.offsetHeight - 4;
      if (atBottom && !shown) {
        if (holdTimer) clearTimeout(holdTimer);
        holdTimer = setTimeout(() => {
          if (innerHeight + scrollY >= document.body.offsetHeight - 4) {
            shown = true;
            onReveal();
          }
        }, 700);
      } else if (!atBottom && holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
    };

    addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (holdTimer) clearTimeout(holdTimer);
      removeEventListener("scroll", onScroll);
    };
  }, [onReveal]);
}

/** Clicking a film poster backflips its logos. */
export function useFilmPosterWobble() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const poster = (e.target as Element).closest?.(".film-poster");
      if (!poster) return;
      poster.querySelectorAll("img").forEach((img, k) => {
        img.animate(
          [
            { transform: "translateY(0) rotate(0deg)" },
            {
              transform: `translateY(-${rand(40, 64)}px) rotate(${rand(120, 240)}deg)`,
              offset: 0.42,
            },
            { transform: "translateY(0) rotate(360deg)" },
          ],
          { duration: 720, delay: k * 70, easing: SPRING },
        );
      });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
}
