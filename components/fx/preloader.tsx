"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/fx";

const SESSION_KEY = "pg-intro";
/** On screen for at least this long, so it never flashes… */
const MIN = 1400;
/** …and never longer than this, whatever is still loading. */
const MAX = 4000;
const SETTLE = 170;
const WIPE = 1000;

/* What the counter is actually counting. The old version was a cubic with a
   sine wobble on it — a number performing a load rather than reporting one,
   which is the kind of thing you can feel is a lie. */
const FONTS = 40;
const PORTRAIT = 80;

/**
 * The intro: a counter in display type climbs to 100 while the site settles
 * behind five slats of ink; then the slats lift, one after another, off the
 * top edge. Once per session, and skipped outright under reduced motion — the
 * loader is decorative, so it must never gate the content.
 *
 * The beats are separated on purpose. `onDone` fires at HOLD so the page can
 * lay itself out (reveal targets measured, observers wired, the scroll lock
 * released) with nothing else moving, and only then do the slats go.
 */
export function Preloader({ onDone }: { onDone: () => void }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const numRef = useRef<HTMLSpanElement | null>(null);
  const barRef = useRef<HTMLElement | null>(null);
  // the intro must run exactly once, so it reads the callback through a ref
  // rather than depending on its identity
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    if (sessionStorage.getItem(SESSION_KEY) || prefersReducedMotion()) {
      root.classList.add("is-gone");
      done.current();
      return;
    }
    // NB: the "already seen" flag is written when the intro *finishes*, not
    // here. StrictMode mounts effects twice in dev, and setting it up front
    // made the second mount skip the animation entirely.

    const t0 = performance.now();
    let raf = 0;
    let count = 0;
    /** Where the counter is climbing to — moved by real readiness, not a clock. */
    let target = 0;
    let opened = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    /* Three things gate the page: the three families the type is set in, the
       one photograph, and the layout settling once both are in. Each is worth
       a stretch of the count, and the number eases toward whichever stretch
       has been reached — so a fast connection runs it up in one motion and a
       slow one visibly waits on the thing that is actually slow. */
    document.fonts?.ready.then(() => {
      target = Math.max(target, FONTS);
    });

    const portrait = document.querySelector<HTMLImageElement>(".hero-portrait img");
    const decoded = portrait
      ? (portrait.decode?.() ?? Promise.resolve()).catch(() => {})
      : Promise.resolve();
    void decoded.then(() => {
      target = Math.max(target, PORTRAIT);
    });

    void Promise.all([document.fonts?.ready, decoded]).then(() =>
      // one frame after both, so the first real layout is behind us
      requestAnimationFrame(() => {
        target = 100;
      }),
    );

    const open = () => {
      if (opened) return;
      opened = true;
      root.classList.add("is-exiting");
      done.current();
      timers.push(
        setTimeout(() => {
          root.classList.add("is-revealing");
          sessionStorage.setItem(SESSION_KEY, "1");
        }, SETTLE),
        setTimeout(() => root.classList.add("is-gone"), SETTLE + WIPE),
      );
    };

    const tick = (t: number) => {
      const elapsed = t - t0;
      count += (target - count) * 0.08;
      const v = Math.min(100, Math.round(count));
      if (numRef.current) numRef.current.textContent = String(v).padStart(3, "0");
      if (barRef.current) barRef.current.style.transform = `scaleX(${v / 100})`;
      // the floor stops it flashing past; the ceiling stops a stalled asset
      // from holding the page hostage
      if ((v >= 100 && elapsed >= MIN) || elapsed >= MAX) {
        if (numRef.current) numRef.current.textContent = "100";
        if (barRef.current) barRef.current.style.transform = "scaleX(1)";
        open();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="preloader" ref={rootRef} aria-hidden="true">
      <div className="pre-slats">
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="pre-grid" />
      <div className="pre-body">
        <span className="pre-tag">
          Pratyush Garg <em>Portfolio — 2026</em>
        </span>
        <span className="pre-status">
          <i />
          opening the archive
        </span>
        <div className="pre-count">
          <span ref={numRef}>000</span>
          <em>%</em>
        </div>
        <div className="pre-bar">
          <i ref={barRef} />
        </div>
      </div>
    </div>
  );
}
