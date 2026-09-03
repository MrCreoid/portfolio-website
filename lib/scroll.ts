"use client";

import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { prefersReducedMotion } from "@/lib/fx";

/* ============================================================
   The scroll engine: one Lenis instance for inertia, GSAP's ScrollTrigger for
   anything scrubbed to it, and GSAP's ticker driving both so they never
   disagree about what frame it is. Everything scroll-linked imports from here.
   ============================================================ */

gsap.registerPlugin(ScrollTrigger, Flip);
export { Flip, gsap, ScrollTrigger };

let lenis: Lenis | null = null;

/** Null until `startLenis()` runs — and forever under reduced motion. */
export const getLenis = () => lenis;

export function startLenis() {
  if (lenis || prefersReducedMotion()) return lenis;
  // 0.14, not the floaty 0.08: a fast flick has to reverse the moment the
  // wheel does, or inertia reads as lag
  lenis = new Lenis({ lerp: 0.14, autoRaf: false });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis?.raf(t * 1000));
  // GSAP otherwise "helps" after a long frame by rewinding time, which reads
  // as a hitch on the one thing that has to stay glassy
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

/** Top of the page — instant by default, so a view swap lands clean. */
export function scrollTop(immediate = true) {
  if (lenis) lenis.scrollTo(0, { immediate, force: true });
  else window.scrollTo(0, 0);
}
