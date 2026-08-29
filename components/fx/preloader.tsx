"use client";

import { useEffect, useRef, useState } from "react";
import { useMounted } from "@/hooks/use-mounted";
import LiquidLoading from "@/components/ui/liquid-loader";
import { prefersReducedMotion } from "@/lib/fx";

const SESSION_KEY = "pg-intro";
const HOLD = 1900;
const SETTLE = 170;
const WIPE = 760;

/**
 * The intro: the liquid loader runs while the site settles, then the curtain
 * wipes up off the top edge. Once per session, and skipped outright under
 * reduced-motion — the loader is decorative, so it must never gate the content.
 *
 * The three beats are deliberately separated. The old version called `onDone`
 * and started the wipe in the same tick, so the page's whole entrance — 58
 * reveal targets measured, observers wired, the scroll lock released — ran as
 * one synchronous lump *during* the clip-path transition, which is what made
 * it stall and then snap open. Now the loader stops animating and fades, the
 * site builds itself behind the curtain while nothing else is moving, and only
 * then does the curtain lift.
 */
export function Preloader({ onDone }: { onDone: () => void }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const mounted = useMounted();
  const [stopped, setStopped] = useState(false);
  // derived rather than set from inside the effect: a returning visitor never
  // starts the wave at all, instead of starting it and switching it off
  const skip =
    mounted &&
    (sessionStorage.getItem(SESSION_KEY) !== null || prefersReducedMotion());
  const running = mounted && !skip && !stopped;
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
    // the scroll lock is owned by <Site>, which knows about the mobile menu too

    const timers = [
      // 1. stop the wave and fade it out; hand the page over so it can lay
      //    itself out under the curtain, with the loader no longer re-rendering
      //    seven bars every 32ms against it
      setTimeout(() => {
        root.classList.add("is-exiting");
        setStopped(true);
        done.current();
      }, HOLD),
      // 2. once that work has settled, lift the curtain on a quiet main thread
      setTimeout(() => {
        root.classList.add("is-revealing");
        sessionStorage.setItem(SESSION_KEY, "1");
      }, HOLD + SETTLE),
      setTimeout(() => root.classList.add("is-gone"), HOLD + SETTLE + WIPE),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="preloader" ref={rootRef} aria-hidden="true">
      <div className="forge-stack">
        <LiquidLoading running={running} />
        <div className="forge-name is-lit">PRATYUSH&nbsp;GARG</div>
      </div>
    </div>
  );
}
