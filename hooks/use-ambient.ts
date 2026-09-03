"use client";

import { useEffect, type RefObject } from "react";
import type WebGLFluidEnhanced from "webgl-fluid-enhanced";
import { findEgg } from "@/lib/eggs";
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

    /* The square used to balloon on contact — a 74px plate under the pointer
       covers the very control it is labelling. It stays close to its resting
       size instead; `blend` is the only one that has to be big, because it is
       the thing inverting the display type it crosses. */
    const size = () =>
      mode === "blend" ? 70 : mode === "label" ? 52 : mode === "hover" ? 34 : 30;

    const update = (target: EventTarget | null) => {
      const t = target instanceof Element ? target : null;
      const blend = t?.closest<HTMLElement>('[data-cursor="blend"]');
      const tagged = t?.closest<HTMLElement>("[data-cursor]");
      /* JSX writes a valueless `data-cursor` out as `data-cursor="true"`, so
         every bare one of them was putting the square into label mode with the
         word TRUE across it. A bare tag means "this is interactive", nothing
         more. */
      const raw = tagged?.dataset.cursor;
      const word = raw && raw !== "true" ? raw : undefined;
      const stick = t?.closest<HTMLElement>(STICK);
      const small =
        stick && stick.offsetWidth <= 480 && stick.offsetHeight <= 140 ? stick : null;

      if (blend) mode = "blend";
      else if (word && word !== "blend") mode = "label";
      else if (small) mode = "stick";
      else if (t?.closest(HOVER)) mode = "hover";
      else mode = "idle";

      stuck = mode === "stick" ? small : null;
      // the blended square carries its word too, so the name reads as one
      // territory rather than flickering between a plate and a square
      const text = mode === "label" ? (word ?? "") : mode === "blend" ? (blend?.dataset.word ?? "") : "";
      if (mode === "label" || mode === "blend") label.textContent = text;
      document.body.dataset.cur = mode;
      // the stylesheet needs the verb, not just the mood: OPEN sits over the
      // project cells, which fill with the cursor's own red on hover
      if (text) document.body.dataset.word = text.toLowerCase();
      else delete document.body.dataset.word;
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

const FORCE = 6000;

/* The sim wants hue and saturation from the palette and takes its intensity
   from `brightness` — handing it a colour directly is not an option here, since
   it reads hex as 0–255 and then multiplies by ten, which saturates the plume
   to white on the first splat. White is not what red is for. */
const hex = (css: string) =>
  "#" +
  (css.match(/[\d.]+/g) ?? ["255", "34", "51"])
    .slice(0, 3)
    .map((n) => Math.round(Number(n)).toString(16).padStart(2, "0"))
    .join("");

/** The second plate, in the two tints cozy and CRT already recolour. */
const palette = () => [hex(particleTheme.line), hex(particleTheme.dot)];

let fluid: WebGLFluidEnhanced | null = null;
let plate: HTMLCanvasElement | null = null;
/** The live config factory, kept so a theme change can re-apply it. Without
 *  this the dye stayed the red it was built with until the window resized. */
let inkConfig: (() => Parameters<WebGLFluidEnhanced["setConfig"]>[0]) | null = null;

/** Called when cozy or CRT flips: the palette comes from `particleTheme`, so
 *  the sim only needs telling that it moved. */
export function refreshInk() {
  if (fluid && inkConfig) fluid.setConfig(inkConfig());
}

/** One splat, in client coordinates. The sim reads x against the backing store
 *  and y against the CSS box — its own inconsistency, not ours. */
export function inkSplat(x: number, y: number, dx = 0, dy = 0) {
  if (!fluid || !plate || !plate.clientWidth) return;
  fluid.splatAtLocation(x * (plate.width / plate.clientWidth), y, dx, dy);
}

/** A ring of splats thrown outward — a click, or the origin of a view change.
 *  They are spaced around the origin rather than stacked on it: sixteen splats
 *  on one texel is not a burst, it is a white hole. */
export function inkBurst(x: number, y: number, n = 8, force = 0.4, spread = 26) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rand(-0.25, 0.25);
    const v = force * FORCE * rand(0.6, 1);
    inkSplat(x + Math.cos(a) * spread, y + Math.sin(a) * spread, Math.cos(a) * v, -Math.sin(a) * v);
  }
}

/**
 * Ink in water, for real: a Navier–Stokes fluid simulation carrying red dye on
 * black. The pointer drags velocity through it, so a fast swipe leaves a plume
 * that keeps curling for a couple of seconds after the pointer has gone; a
 * click throws a burst outward; a view change splats from wherever you clicked.
 *
 * The canvas cannot receive events — it sits under everything with
 * `pointer-events: none` — so every splat is driven by hand from the one
 * pointer listener here.
 */
export function useInk(ref: RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    const layer = host?.parentElement;
    if (!canvas || !host || !layer || prefersReducedMotion()) return;

    let dead = false;
    const small = matchMedia("(max-width: 900px)");
    // the dye grid is the expensive half; a phone gets a quarter of the texels
    const config = () => ({
      simResolution: 128,
      dyeResolution: small.matches ? 256 : 512,
      densityDissipation: 1.6,
      velocityDissipation: 1.2,
      pressure: 0.7,
      curl: 18,
      splatRadius: 0.18,
      colorful: false,
      colorPalette: palette(),
      // ink, not neon: the dye has to stay a red plate at full accumulation
      brightness: 0.26,
      hover: false,
      backgroundColor: "#000000",
      // red is a second plate, never a glow — the two effects that would make
      // it one are off
      bloom: false,
      sunrays: false,
    });

    // ~60KB of shader source nobody needs before the first frame
    import("webgl-fluid-enhanced").then(({ default: Fluid }) => {
      if (dead) return;
      fluid = new Fluid(host);
      plate = canvas;
      inkConfig = config;
      fluid.setConfig(config());
      fluid.start();
      layer.dataset.ink = "on";
    });

    /* Nothing is drawn by the pointer at all now — not by moving it and not by
       clicking. The ink fires from `goTo` alone, so it marks a change of view
       and nothing else. A splat under every click on the page turned a
       deliberate mark into background noise. */
    const onResize = () => fluid?.setConfig(config());

    // a hidden tab has no reason to be integrating a fluid
    const onVisibility = () => {
      if (!fluid) return;
      if (document.hidden) fluid.stop();
      else fluid.start();
      layer.dataset.ink = document.hidden ? "off" : "on";
    };

    addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      dead = true;
      fluid?.stop();
      fluid = null;
      plate = null;
      inkConfig = null;
      removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ref]);
}

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
      findEgg("dvd");
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

/**
 * The page starts living on its own.
 *
 * Twenty seconds without a word from you and body.is-idle goes on: the readout
 * blinks, the eyebrow hurries, the name waves, the band drifts backwards for a
 * moment. Any input takes it straight back off. The screensaver still has the
 * minute mark to itself.
 */
export function useIdle(ms = 20000) {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let timer: ReturnType<typeof setTimeout>;
    const sleep = () => document.body.classList.add("is-idle");
    const wake = () => {
      if (document.body.classList.contains("is-idle")) {
        document.body.classList.remove("is-idle");
      }
      clearTimeout(timer);
      timer = setTimeout(sleep, ms);
    };
    const events = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart", "scroll"];
    events.forEach((e) => addEventListener(e, wake, { passive: true }));
    wake();
    return () => {
      clearTimeout(timer);
      document.body.classList.remove("is-idle");
      events.forEach((e) => removeEventListener(e, wake));
    };
  }, [ms]);
}

/** The tab title pouts while you're away. */
export function useTabPout() {
  useEffect(() => {
    // read when the tab is left, not at mount: the title carries the current
    // view now, and a mount-time copy would put you back on the home page
    let original = document.title;
    let pout: ReturnType<typeof setTimeout>;
    const onChange = () => {
      if (document.hidden) {
        original = document.title;
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
      if (document.hidden) document.title = original;
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
            findEgg("bottom");
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
