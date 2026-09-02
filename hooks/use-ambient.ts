"use client";

import { useEffect, type RefObject } from "react";
import {
  SPRING,
  hasFinePointer,
  particleTheme,
  prefersReducedMotion,
  rand,
} from "@/lib/fx";

/**
 * The cursor: a red dot on the pointer, a square ring that lags behind it,
 * and four moods the ring can be in —
 *
 *   hover   over anything interactive: red, bigger, turned 45°
 *   stick   over a small control: the ring snaps to the control's own box and
 *           follows it, so the button looks held rather than pointed at
 *   label   over a [data-cursor="word"]: a red plate with the verb in it
 *   blend   over the biggest type: a paper square that inverts the letters
 *           beneath it (mix-blend difference)
 *
 * The mood is recomputed on every mouseover from the thing under the pointer,
 * so it can never get stuck in a state the pointer has left. It is written to
 * body[data-cur] — not data-cursor, which the lookup itself walks up to.
 */
export function useCursor(rootRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !hasFinePointer() || prefersReducedMotion()) return;
    const dot = root.querySelector<HTMLElement>(".cursor-dot");
    const ring = root.querySelector<HTMLElement>(".cursor-ring");
    const label = root.querySelector<HTMLElement>(".cursor-label");
    if (!dot || !ring || !label) return;

    const STICK = "a, button, input, .nav-link, .social, .b-btn, .qchip, .b-filter, .bubble";
    const HOVER = "a, button, [data-cursor], input, textarea, .col-item, .ach-card, .b-cell, .skill, .tl-item, .marquee";

    let mx = innerWidth / 2;
    let my = innerHeight / 2;
    let rx = mx;
    let ry = my;
    let rw = 30;
    let rh = 30;
    let mode = "idle";
    let stuck: HTMLElement | null = null;
    let lastTrail = 0;
    let trailCount = 0;
    let raf = 0;

    const size = () =>
      mode === "blend" ? 96 : mode === "label" ? 74 : mode === "hover" ? 46 : 30;

    const update = (target: EventTarget | null) => {
      const t = target instanceof Element ? target : null;
      const blend = t?.closest<HTMLElement>('[data-cursor="blend"]');
      const tagged = t?.closest<HTMLElement>("[data-cursor]");
      const word = tagged?.dataset.cursor;
      const stick = t?.closest<HTMLElement>(STICK);
      const small =
        stick && stick.offsetWidth <= 480 && stick.offsetHeight <= 140 ? stick : null;

      if (blend) mode = "blend";
      else if (word && word !== "blend") mode = "label";
      else if (small) mode = "stick";
      else if (t?.closest(HOVER)) mode = "hover";
      else mode = "idle";

      stuck = mode === "stick" ? small : null;
      if (mode === "label") label.textContent = word ?? "";
      document.body.dataset.cur = mode;
    };

    let lastTarget: EventTarget | null = null;
    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px)`;
      // mouseover is the primary signal; this catches a pointer that lands on
      // something new without one (synthetic input, a page shifting under it)
      if (e.target !== lastTarget) {
        lastTarget = e.target;
        update(e.target);
      }

      if (mode !== "idle" && mode !== "hover") return;
      const now = performance.now();
      if (now - lastTrail > 34 && trailCount < 24) {
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
      let tx = mx;
      let ty = my;
      let tw = size();
      let th = tw;
      if (stuck) {
        const r = stuck.getBoundingClientRect();
        // the ring holds the control, leaning a little toward the pointer
        tx = r.left + r.width / 2 + (mx - (r.left + r.width / 2)) * 0.18;
        ty = r.top + r.height / 2 + (my - (r.top + r.height / 2)) * 0.18;
        tw = r.width + 14;
        th = r.height + 14;
      }
      const k = stuck ? 0.22 : 0.14;
      rx += (tx - rx) * k;
      ry += (ty - ry) * k;
      rw += (tw - rw) * 0.2;
      rh += (th - rh) * 0.2;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      ring.style.width = rw + "px";
      ring.style.height = rh + "px";
      raf = requestAnimationFrame(follow);
    };
    raf = requestAnimationFrame(follow);

    const over = (e: MouseEvent) => update(e.target);
    const out = (e: MouseEvent) => {
      if (!e.relatedTarget) update(null);
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
      delete document.body.dataset.cur;
    };
  }, [rootRef]);
}

/**
 * Ink in water. The pointer leaves red ink behind it on a canvas under the
 * page: each move drops a few blots along its path, sized by how fast it was
 * going, and every frame the whole plate fades a little while the blots drift
 * and spread. A click drops a splat; a scroll bleeds ink from wherever the
 * pointer is resting. The canvas is drawn at half resolution and blurred in
 * CSS, which is what turns discs into ink.
 */
export function useInk(ref: RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const c = ref.current;
    if (!c || prefersReducedMotion()) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    const SCALE = 0.5;
    type Blot = { x: number; y: number; r: number; vx: number; vy: number; life: number };
    const blots: Blot[] = [];
    let W = 0;
    let H = 0;
    let px = -1;
    let py = -1;
    let lastY = scrollY;
    let raf = 0;
    let running = true;

    const size = () => {
      W = c.width = Math.ceil(innerWidth * SCALE);
      H = c.height = Math.ceil(innerHeight * SCALE);
    };
    size();

    const drop = (x: number, y: number, r: number, vx = 0, vy = 0) => {
      if (blots.length > 260) blots.shift();
      blots.push({ x, y, r, vx, vy, life: 1 });
    };

    const onMove = (e: PointerEvent) => {
      const x = e.clientX * SCALE;
      const y = e.clientY * SCALE;
      if (px < 0) {
        px = x;
        py = y;
        return;
      }
      const dx = x - px;
      const dy = y - py;
      const sp = Math.hypot(dx, dy);
      if (sp < 0.6) return;
      const n = Math.min(Math.ceil(sp / 5), 6);
      for (let i = 1; i <= n; i++) {
        drop(
          px + (dx * i) / n,
          py + (dy * i) / n,
          3 + Math.min(sp, 60) * 0.26,
          dx * 0.02 + rand(-0.3, 0.3),
          dy * 0.02 + rand(-0.3, 0.3),
        );
      }
      px = x;
      py = y;
    };
    const onDown = (e: PointerEvent) => {
      const x = e.clientX * SCALE;
      const y = e.clientY * SCALE;
      for (let i = 0; i < 22; i++) {
        const a = rand(0, Math.PI * 2);
        const v = rand(0.6, 3.2);
        drop(x, y, rand(4, 11), Math.cos(a) * v, Math.sin(a) * v);
      }
    };
    const onScroll = () => {
      const d = Math.abs(scrollY - lastY);
      lastY = scrollY;
      if (px < 0 || d < 2) return;
      drop(px + rand(-6, 6), py + rand(-6, 6), 3 + Math.min(d, 80) * 0.14, rand(-0.4, 0.4), rand(-0.4, 0.4));
    };

    const frame = () => {
      if (!running) return;
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.075)";
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      const rgb = particleTheme.line;
      for (let i = blots.length - 1; i >= 0; i--) {
        const b = blots[i];
        b.x += b.vx;
        b.y += b.vy;
        b.vx *= 0.95;
        b.vy *= 0.95;
        b.r += 0.35;
        b.life -= 0.02;
        if (b.life <= 0) {
          blots.splice(i, 1);
          continue;
        }
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        g.addColorStop(0, `rgba(${rgb}, ${(0.24 * b.life).toFixed(3)})`);
        g.addColorStop(1, `rgba(${rgb}, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onVisibility = () => {
      running = !document.hidden;
      if (running) raf = requestAnimationFrame(frame);
    };

    addEventListener("resize", size);
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("pointerdown", onDown, { passive: true });
    addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      removeEventListener("resize", size);
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerdown", onDown);
      removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ref]);
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
      overlay.innerHTML = `<span class="dvd-logo">PG</span><span class="dvd-hint">move anything to wake the site</span>`;
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
        document.title = "come back…";
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
