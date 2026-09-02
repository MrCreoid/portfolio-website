"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/fx";

const SESSION_KEY = "pg-intro";
const HOLD = 1900;
const SETTLE = 170;
const WIPE = 1000;

/* the count runs fast, hesitates twice the way a real load does, and lands */
const curve = (p: number) => {
  const e = 1 - Math.pow(1 - p, 3);
  return e + Math.sin(p * Math.PI * 3) * 0.035 * (1 - p);
};

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
    const count = (t: number) => {
      const p = Math.min((t - t0) / (HOLD - 140), 1);
      const v = Math.round(Math.max(0, Math.min(1, curve(p))) * 100);
      if (numRef.current) numRef.current.textContent = String(v).padStart(3, "0");
      if (barRef.current) barRef.current.style.transform = `scaleX(${v / 100})`;
      if (p < 1) raf = requestAnimationFrame(count);
    };
    raf = requestAnimationFrame(count);

    const timers = [
      setTimeout(() => {
        root.classList.add("is-exiting");
        done.current();
      }, HOLD),
      setTimeout(() => {
        root.classList.add("is-revealing");
        sessionStorage.setItem(SESSION_KEY, "1");
      }, HOLD + SETTLE),
      setTimeout(() => root.classList.add("is-gone"), HOLD + SETTLE + WIPE),
    ];

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
