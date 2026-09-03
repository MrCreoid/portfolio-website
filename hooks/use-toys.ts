"use client";

import { useEffect, type RefObject } from "react";
import { animate, stagger, utils } from "animejs";
import { EYEBROW_LINES, TYPE_WORDS } from "@/lib/data";
import { SPRING, hasFinePointer, prefersReducedMotion, rand, wait } from "@/lib/fx";

/** The hero sub-line types itself, forever. */
export function useTypewriter(ref: RefObject<HTMLSpanElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.textContent = TYPE_WORDS[0];
      return;
    }

    let alive = true;
    (async () => {
      let i = 0;
      while (alive) {
        const word = TYPE_WORDS[i % TYPE_WORDS.length];
        for (let c = 1; c <= word.length && alive; c++) {
          el.textContent = word.slice(0, c);
          await wait(65);
        }
        await wait(1700);
        for (let c = word.length; c >= 0 && alive; c--) {
          el.textContent = word.slice(0, c);
          await wait(32);
        }
        await wait(350);
        i++;
      }
    })();

    return () => {
      alive = false;
    };
  }, [ref]);
}

/** The status line above the name swaps itself out every few seconds. */
export function useEyebrowRotator(ref: RefObject<HTMLSpanElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let i = 0;
    let tick = 0;

    // while the page is idle the line turns over twice as often — the site
    // filling its own silence rather than waiting on you
    const id = setInterval(() => {
      if (!document.body.classList.contains("is-idle") && tick++ % 2) return;
      el.animate(
        [
          { transform: "translateY(0)", opacity: 1 },
          { transform: "translateY(-115%)", opacity: 0 },
        ],
        { duration: 320, easing: "ease-in", fill: "forwards" },
      ).onfinish = () => {
        i = (i + 1) % EYEBROW_LINES.length;
        el.textContent = EYEBROW_LINES[i];
        el.animate(
          [
            { transform: "translateY(115%)", opacity: 0 },
            { transform: "translateY(0)", opacity: 1 },
          ],
          { duration: 420, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" },
        );
      };
      // halved, so the skipped tick above keeps the waking rate at 3.6s
    }, 1800);

    return () => clearInterval(id);
  }, [ref]);
}

/** matter-js is ~90kB and only earns it once somebody actually grabs a letter,
 *  so the module is pulled on the first pointerdown and cached from then on. */
let matterPromise: Promise<typeof import("matter-js")> | null = null;
const loadMatter = () =>
  (matterPromise ??= import("matter-js").then(
    (m) => (m as unknown as { default?: typeof import("matter-js") }).default ?? m,
  ));

/**
 * Grab a letter of the name and fling it — and it is a real object from then
 * on. It falls, it tumbles, it lands on the floor of the window, and anything
 * it hits on the way comes loose too: every letter is in the simulation, but
 * asleep and static until something knocks it awake, so touching one letter
 * does not drop the whole name.
 *
 * The world exists only while it is being played with. 1.2s after the last
 * body stops moving — or on Esc, a scroll, or a shake of the window — the
 * letters spring back to the baseline and the engine is thrown away.
 *
 * Reduced motion keeps the old behaviour: a drag, a flick, a snap back.
 */
export function useGrabbableLetters() {
  useEffect(() => {
    // the full stop belongs to the name as much as the letters do — left out,
    // it hangs in the air on its own once everything around it has fallen
    const letters = Array.from(
      document.querySelectorAll<HTMLElement>(".h-letter, .h-dot"),
    );
    if (!letters.length) return;
    const flat = prefersReducedMotion();

    /* a letter in transit to the marquee belongs to the Flip, not to us */
    const busy = (el: HTMLElement) => Boolean(el.parentElement?.closest(".is-flying"));

    /* `ox/oy` is the grab point inside the letter, so it never jumps to its
       own centre. `sx/sy`+`bx/by` and the running velocity are what the drag
       runs on before matter-js has finished loading — the first grab has to
       feel the same as every one after it. */
    type Held = {
      i: number;
      x: number;
      y: number;
      ox: number;
      oy: number;
      sx: number;
      sy: number;
      bx: number;
      by: number;
      vx: number;
      vy: number;
      lx: number;
      ly: number;
      lt: number;
    };
    type World = {
      M: typeof import("matter-js");
      engine: import("matter-js").Engine;
      bodies: import("matter-js").Body[];
      home: { x: number; y: number }[];
      raf: number;
      prev: number;
      still: number;
      wake: Set<import("matter-js").Body>;
    };

    let world: World | null = null;
    let held: Held | null = null;
    /* a letter let go of before the engine arrived — the world starts it at
       the speed the hand actually threw it */
    let flick: { i: number; vx: number; vy: number } | null = null;
    let building = false;
    let dead = false;

    /* ---- the flat path: the pre-physics drag, kept for reduced motion ---- */
    const flatState = { ox: 0, oy: 0, sx: 0, sy: 0, dx: 0, dy: 0, el: null as HTMLElement | null };
    let flatTimer: ReturnType<typeof setTimeout> | undefined;

    /* ---- home ---- */

    const settle = () => {
      if (!world) return;
      cancelAnimationFrame(world.raf);
      world = null;
      held = null;
      letters.forEach((el) => {
        el.style.transition = `transform 0.9s ${SPRING}`;
        el.style.transform = "translate(0px, 0px) rotate(0deg)";
        el.classList.remove("is-grabbed");
      });
      // once the spring has landed the inline styles are noise, and clearing
      // them is what lets the next grab measure a clean layout rect
      clearTimeout(flatTimer);
      flatTimer = setTimeout(() => {
        letters.forEach((el) => {
          el.style.transition = "";
          el.style.transform = "";
        });
      }, 950);
    };

    /* ---- the world ---- */

    const build = async () => {
      if (world || building || dead) return;
      building = true;
      const M = await loadMatter();
      building = false;
      if (world || dead) return;

      // where each letter is *now* (it may be mid-spring), and where its
      // baseline actually is — the body starts at the first, goes home to
      // the second
      const offset = letters.map((el) => {
        const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
        return { x: m.e, y: m.f };
      });
      letters.forEach((el) => {
        el.style.transition = "none";
        el.style.transform = "none";
      });
      const home = letters.map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
      });

      const engine = M.Engine.create({ enableSleeping: true });
      engine.gravity.scale = 0.0016;

      // the body is the ink, not the line box — a glyph's box is far taller
      // and a shade wider than the letter you can see, and bodies that start
      // out overlapping shove each other apart the instant the world starts
      const bodies = home.map((h, i) => {
        const body = M.Bodies.rectangle(
          h.x + offset[i].x,
          h.y + offset[i].y,
          h.w * 0.84,
          h.h * 0.62,
          {
            label: "letter",
            restitution: 0.26,
            friction: 0.4,
            frictionAir: 0.014,
            density: 0.0018,
            sleepThreshold: 40,
          },
        );
        // NOT `isStatic` in the options: Bodies.rectangle applies that flag
        // before Body.setStatic ever runs, so the setter sees a body that is
        // already static and never files the mass it is meant to give back.
        // The body then un-statics with mass Infinity and goes NaN on the
        // first step. Made dynamic and frozen afterwards, it thaws correctly.
        M.Body.setStatic(body, true);
        return body;
      });

      // the box the letters are allowed to exist in: the floor and sides of
      // the window, and a slab filling everything above the header's rule.
      // Slabs rather than lines — a thin wall is a wall a fast body misses.
      const W = innerWidth;
      const H = innerHeight;
      const T = 400;
      const lid = document.querySelector(".header")?.getBoundingClientRect().bottom ?? 0;
      const wall = (x: number, y: number, w: number, h: number) =>
        M.Bodies.rectangle(x, y, w, h, { isStatic: true, friction: 0.6, restitution: 0.1 });
      // the body is the ink, and a glyph hangs well below its own box, so the
      // floor stands off the bottom edge by enough that a letter lands ON the
      // window rather than half through it. Tune this, not the body height —
      // the body height is what keeps neighbours from overlapping at rest.
      const drop = Math.max(...home.map((h) => h.h)) * 0.2;
      const walls = [
        wall(W / 2, H - drop + T / 2, W * 3, T), // floor
        wall(-T / 2, H / 2, T, H * 3), // left
        wall(W + T / 2, H / 2, T, H * 3), // right
        wall(W / 2, lid - T / 2, W * 3, T), // the header's underside
      ];

      M.Composite.add(engine.world, [...bodies, ...walls]);

      world = { M, engine, bodies, home, raf: 0, prev: performance.now(), still: 0, wake: new Set() };

      // a moving letter knocks a resting one loose — this is the only way a
      // letter you never touched joins the pile
      M.Events.on(engine, "collisionStart", (ev) => {
        if (!world) return;
        for (const pair of ev.pairs) {
          for (const [hit, rest] of [
            [pair.bodyA, pair.bodyB],
            [pair.bodyB, pair.bodyA],
          ]) {
            if (hit.isStatic || rest.label !== "letter" || !rest.isStatic) continue;
            if (hit.speed < 1.2) continue;
            world.wake.add(rest);
          }
        }
      });

      if (held) M.Body.setStatic(bodies[held.i], false);
      if (flick) {
        const b = bodies[flick.i];
        M.Body.setStatic(b, false);
        // the drag measures px per millisecond; a matter step is one frame
        M.Body.setVelocity(b, { x: flick.vx * 16.7, y: flick.vy * 16.7 });
        flick = null;
      }
      world.raf = requestAnimationFrame(tick);
    };

    const tick = () => {
      if (!world) return;
      const { M, engine, bodies, home } = world;
      const now = performance.now();
      const dt = Math.min(now - world.prev, 33);
      world.prev = now;

      // the held body is driven, not pulled: its position is the pointer's,
      // and its velocity is whatever that move implied — which is exactly the
      // velocity it should leave with, so a release never snaps
      if (held) {
        const b = bodies[held.i];
        const x = held.x - held.ox;
        const y = held.y - held.oy;
        M.Sleeping.set(b, false);
        M.Body.setVelocity(b, { x: x - b.position.x, y: y - b.position.y });
        M.Body.setPosition(b, { x, y });
        M.Body.setAngularVelocity(b, 0);
      }

      M.Engine.update(engine, dt);

      // waking happens between steps: setStatic mid-solve corrupts the pair
      if (world.wake.size) {
        world.wake.forEach((b) => M.Body.setStatic(b, false));
        world.wake.clear();
      }

      let moving = Boolean(held);
      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        if (b.isStatic) continue;
        letters[i].style.transform = `translate(${b.position.x - home[i].x}px, ${
          b.position.y - home[i].y
        }px) rotate(${b.angle}rad)`;
        if (!b.isSleeping && b.speed > 0.14) moving = true;
      }

      world.still = moving ? 0 : world.still + dt;
      if (world.still > 1200) {
        settle();
        return;
      }
      world.raf = requestAnimationFrame(tick);
    };

    /* ---- pointer ---- */

    const cleanups: (() => void)[] = [];

    letters.forEach((el, i) => {
      const down = (e: PointerEvent) => {
        if (busy(el)) return;
        e.preventDefault();
        el.setPointerCapture(e.pointerId);
        el.classList.add("is-grabbed");

        if (flat) {
          clearTimeout(flatTimer);
          const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
          Object.assign(flatState, {
            el,
            ox: m.e,
            oy: m.f,
            sx: e.clientX,
            sy: e.clientY,
            dx: m.e,
            dy: m.f,
          });
          el.style.transition = "none";
          return;
        }

        clearTimeout(flatTimer);
        const r = el.getBoundingClientRect();
        const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
        held = {
          i,
          x: e.clientX,
          y: e.clientY,
          ox: e.clientX - (r.left + r.width / 2),
          oy: e.clientY - (r.top + r.height / 2),
          sx: e.clientX,
          sy: e.clientY,
          bx: m.e,
          by: m.f,
          vx: 0,
          vy: 0,
          lx: e.clientX,
          ly: e.clientY,
          lt: performance.now(),
        };
        el.style.transition = "none";
        if (world) world.M.Body.setStatic(world.bodies[i], false);
        else void build();
      };

      const move = (e: PointerEvent) => {
        if (!el.classList.contains("is-grabbed")) return;
        if (flat) {
          flatState.dx = flatState.ox + (e.clientX - flatState.sx);
          flatState.dy = flatState.oy + (e.clientY - flatState.sy);
          el.style.transform = `translate(${flatState.dx}px, ${flatState.dy}px)`;
          return;
        }
        if (!held) return;
        held.x = e.clientX;
        held.y = e.clientY;
        const t = performance.now();
        const dt = Math.min(Math.max(t - held.lt, 1), 60);
        held.vx = (e.clientX - held.lx) / dt;
        held.vy = (e.clientY - held.ly) / dt;
        held.lx = e.clientX;
        held.ly = e.clientY;
        held.lt = t;
        // until the engine is up the drag is drawn by hand, so the first grab
        // of the session is not the one that feels dead
        if (!world) {
          el.style.transform = `translate(${held.bx + (e.clientX - held.sx)}px, ${
            held.by + (e.clientY - held.sy)
          }px)`;
        }
      };

      const release = () => {
        if (!el.classList.contains("is-grabbed")) return;
        el.classList.remove("is-grabbed");
        if (flat) {
          el.style.transition = `transform 0.5s ${SPRING}`;
          el.style.transform = "translate(0px, 0px)";
          return;
        }
        if (held?.i !== i) return;
        if (!world) {
          // a stale reading from a pause must not launch the letter
          const stale = performance.now() - held.lt > 80;
          const cap = (v: number) => Math.max(Math.min(v, 2.5), -2.5);
          flick = stale ? null : { i, vx: cap(held.vx), vy: cap(held.vy) };
        }
        held = null;
      };

      el.addEventListener("pointerdown", down);
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", release);
      el.addEventListener("pointercancel", release);
      el.addEventListener("lostpointercapture", release);
      cleanups.push(() => {
        el.removeEventListener("pointerdown", down);
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerup", release);
        el.removeEventListener("pointercancel", release);
        el.removeEventListener("lostpointercapture", release);
      });
    });

    /* ---- everything that ends it early ---- */

    // Esc puts the name back. So does a shake of the window: the walls are
    // measured once, so any resize has to end the world anyway — which makes
    // wiggling it the reset it looks like it should be.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") settle();
    };
    // and scrolling hands the letters to the marquee Flip, which cannot share
    // a transform with a physics body
    const onScroll = () => {
      if (world && scrollY > 24) settle();
    };
    addEventListener("keydown", onKey);
    addEventListener("resize", settle);
    addEventListener("scroll", onScroll, { passive: true });

    return () => {
      dead = true;
      cleanups.forEach((fn) => fn());
      removeEventListener("keydown", onKey);
      removeEventListener("resize", settle);
      removeEventListener("scroll", onScroll);
      clearTimeout(flatTimer);
      if (world) cancelAnimationFrame(world.raf);
      world = null;
    };
  }, []);
}

/**
 * The name's glyphs. On entering the home view they rise out of the baseline
 * one after another; from then on, hovering any letter sends a ripple through
 * all of them, outward from the one under the pointer. The glyph is the inner
 * <i> — the outer span belongs to the grab physics, so the two never fight
 * over one transform.
 */
export function useHeroLetters(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const title = document.querySelector<HTMLElement>(".hero-title");
    if (!title) return;
    title.classList.add("is-lit");
    if (prefersReducedMotion()) return;

    const glyphs = Array.from(
      title.querySelectorAll<HTMLElement>(".h-letter > i, .hero-dot"),
    );
    animate(glyphs, {
      translateY: ["1.15em", "0em"],
      rotate: [9, 0],
      opacity: [0, 1],
      duration: 1150,
      ease: "outExpo",
      delay: stagger(26, { start: 240 }),
    });

    let last = 0;
    const ripple = (from: number) => () => {
      const now = performance.now();
      if (now - last < 90) return;
      last = now;
      animate(glyphs, {
        translateY: [
          { to: "-0.14em", duration: 170, ease: "outQuad" },
          { to: "0em", duration: 820, ease: "outElastic(1, .55)" },
        ],
        delay: stagger(28, { from }),
      });
    };
    const letters = glyphs.map((g, i) => {
      const el = g.parentElement ?? g;
      const fn = ripple(i);
      el.addEventListener("mouseenter", fn);
      return () => el.removeEventListener("mouseenter", fn);
    });

    return () => {
      letters.forEach((off) => off());
      utils.remove(glyphs);
      title.classList.remove("is-lit");
    };
  }, [active]);
}

/** A real string: bend it with the cursor, let go, it oscillates and decays. */
export function useGuitarString(
  boxRef: RefObject<HTMLDivElement | null>,
  pathRef: RefObject<SVGPathElement | null>,
) {
  useEffect(() => {
    const box = boxRef.current;
    const path = pathRef.current;
    if (!box || !path) return;

    const REST = 45;
    let cy = REST; // current control-point y
    let target = REST; // where the cursor is pulling it
    let holding = false; // cursor is bending the string
    let osc: { a: number; t: number } | null = null; // oscillation after release
    let raf = 0;

    const setPath = (y: number) =>
      path.setAttribute("d", `M 0 ${REST} Q 500 ${y} 1000 ${REST}`);

    const pluck = (amplitude: number) => {
      osc = { a: Math.max(Math.min(amplitude, 70), -70), t: 0 };
      if (Math.abs(osc.a) > 6) {
        const r = box.getBoundingClientRect();
        const note = document.createElement("span");
        note.className = "music-note";
        note.textContent = ["♪", "♫", "♩"][(Math.random() * 3) | 0];
        note.style.left = r.left + r.width / 2 + rand(-80, 80) + "px";
        note.style.top = r.top + 20 + "px";
        document.body.appendChild(note);
        note.animate(
          [
            { transform: "translateY(0) rotate(0deg)", opacity: 1 },
            { transform: `translateY(-60px) rotate(${rand(-25, 25)}deg)`, opacity: 0 },
          ],
          { duration: 1100, easing: "ease-out" },
        ).onfinish = () => note.remove();
      }
    };

    const toLocalY = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      return ((e.clientY - r.top) / r.height) * 90;
    };

    const onMove = (e: PointerEvent) => {
      const y = toLocalY(e);
      if (Math.abs(y - REST) < 32) {
        holding = true;
        osc = null;
        target = y;
      } else if (holding) {
        holding = false;
        pluck(cy - REST);
      }
    };

    const onLeave = () => {
      if (holding) {
        holding = false;
        pluck(cy - REST);
      }
    };

    const vibrate = () => {
      if (holding) {
        cy += (target - cy) * 0.4;
      } else if (osc) {
        osc.t += 16;
        const decayed = osc.a * Math.exp(-osc.t / 350) * Math.cos(osc.t / 28);
        cy = REST + decayed;
        if (Math.abs(decayed) < 0.3) {
          osc = null;
          cy = REST;
        }
      } else {
        cy += (REST - cy) * 0.2;
      }
      setPath(cy);
      raf = requestAnimationFrame(vibrate);
    };
    raf = requestAnimationFrame(vibrate);

    box.addEventListener("pointermove", onMove);
    box.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      box.removeEventListener("pointermove", onMove);
      box.removeEventListener("pointerleave", onLeave);
    };
  }, [boxRef, pathRef]);
}

/**
 * Colours the hero portrait only while the pointer is genuinely over him.
 *
 * The element is a rectangle but the photograph inside it is an alpha cut-out,
 * so a plain :hover lit it up from the empty corners of the box. This samples
 * the image's alpha channel at the pointer instead: the frame is drawn once
 * into a small offscreen canvas, and each move reads one pixel from it.
 */
/** What the alpha hit-test knows about the pointer, published for the shader
 *  portrait to read each frame. One listener, two consumers — the CSS plates
 *  and the WebGL plane are never fed by two competing handlers. */
export const portraitPointer = { x: 0.5, y: 0.5, speed: 0, lit: 0 };

export function usePortraitAlphaHover() {
  useEffect(() => {
    const wrap = document.querySelector<HTMLElement>(".hero-portrait");
    const img = wrap?.querySelector("img");
    if (!wrap || !img || !hasFinePointer()) return;

    // a low-res copy is plenty — we only ever ask "is there anything here?"
    const W = 160;
    let ctx: CanvasRenderingContext2D | null = null;
    let data: Uint8ClampedArray | null = null;

    const build = () => {
      if (!img.naturalWidth) return;
      const c = document.createElement("canvas");
      c.width = W;
      c.height = Math.round((img.naturalHeight / img.naturalWidth) * W);
      ctx = c.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, c.width, c.height);
      try {
        data = ctx.getImageData(0, 0, c.width, c.height).data;
      } catch {
        data = null; // tainted canvas — fall back to never lighting up
      }
    };

    if (img.complete) build();
    else img.addEventListener("load", build, { once: true });

    const move = (e: MouseEvent) => {
      const r = img.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width;
      const ny = (e.clientY - r.top) / r.height;
      // how hard the thumb is moving, in element widths per event
      portraitPointer.speed = Math.min(1, Math.hypot(nx - portraitPointer.x, ny - portraitPointer.y) * 7);
      portraitPointer.x = nx;
      portraitPointer.y = ny;
      if (!data || !ctx) return;
      // the two colour plates slide against the pointer while he is lit
      wrap.style.setProperty("--gx", (nx * 2 - 1).toFixed(3));
      wrap.style.setProperty("--gy", (ny * 2 - 1).toFixed(3));
      const x = Math.floor(nx * W);
      const y = Math.floor(ny * ctx.canvas.height);
      if (x < 0 || y < 0 || x >= W || y >= ctx.canvas.height) return;
      const alpha = data[(y * W + x) * 4 + 3];
      const lit = alpha > 40;
      portraitPointer.lit = lit ? 1 : 0;
      wrap.classList.toggle("is-lit", lit);
    };
    const leave = () => {
      portraitPointer.lit = 0;
      portraitPointer.speed = 0;
      wrap.classList.remove("is-lit");
    };

    wrap.addEventListener("mousemove", move);
    wrap.addEventListener("mouseleave", leave);
    return () => {
      wrap.removeEventListener("mousemove", move);
      wrap.removeEventListener("mouseleave", leave);
      img.removeEventListener("load", build);
    };
  }, []);
}
