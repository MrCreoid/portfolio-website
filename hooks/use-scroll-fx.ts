"use client";

import { useEffect } from "react";
import type Lenis from "lenis";
import type { View } from "@/lib/data";
import { gsap, ScrollTrigger, getLenis, startLenis } from "@/lib/scroll";
import { prefersReducedMotion, splitWords } from "@/lib/fx";

const $$ = <T extends Element = HTMLElement>(s: string, c: ParentNode = document) =>
  Array.from(c.querySelectorAll<T>(s));

/**
 * The scroll chrome that lives outside any one view: Lenis itself, the header
 * that ducks on the way down and returns on the way up, the red progress rule
 * under it, the telemetry readout, and the velocity skew — the page shears
 * with the speed of the scroll and settles when it stops.
 */
export function useScrollChrome(ready: boolean) {
  useEffect(() => {
    if (!ready || prefersReducedMotion()) return;
    const lenis = startLenis();
    if (!lenis) return;

    const header = document.querySelector<HTMLElement>(".header");
    const rule = document.querySelector<HTMLElement>(".progress-rule");
    const val = document.querySelector<HTMLElement>(".readout-val");
    let hidden = false;
    let target = 0;
    let skew = 0;

    const onScroll = (l: Lenis) => {
      const down = l.direction === 1 && l.scroll > 120;
      if (down !== hidden) {
        hidden = down;
        header?.classList.toggle("is-hidden", down);
      }
      if (rule) rule.style.transform = `scaleX(${l.progress})`;
      if (val) val.textContent = String(Math.round(l.progress * 100)).padStart(3, "0");
      target = Math.max(-2.5, Math.min(2.5, l.velocity * 0.04));
    };
    // written straight onto the active view's transform: a custom property on
    // <html> invalidated every element's style once per frame
    const tick = () => {
      skew += (target - skew) * 0.2;
      target *= 0.85;
      if (Math.abs(skew) < 0.002 && target === 0) return;
      const view = document.querySelector<HTMLElement>(".view.is-active");
      if (view) view.style.transform = `skewY(${skew.toFixed(3)}deg)`;
    };

    lenis.on("scroll", onScroll);
    gsap.ticker.add(tick);
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(tick);
      document.querySelector<HTMLElement>(".view.is-active")?.style.removeProperty("transform");
      header?.classList.remove("is-hidden");
    };
  }, [ready]);
}

/**
 * Scroll-linked motion inside the active view, declared in the markup:
 *
 *   data-parallax="0.3"   moves against the scroll by 0.3 × 60vh across its
 *                         [data-scope] ancestor (negative lags behind)
 *   data-drift="-35"      slides horizontally from 10% to -35% of its width
 *   data-fade             fades to 20% as its scope leaves the top of the screen
 *   data-scrub-words      words resolve one by one as the reader reaches them
 *   data-rail             a rule that draws itself down its parent
 *   data-pass             gains .is-passed once the reader is past it
 *
 * Everything is scoped to the view and torn down when it goes, so the four
 * hidden views never own a trigger.
 */
export function useViewScrollFx(view: View, ready: boolean) {
  useEffect(() => {
    if (!ready || prefersReducedMotion()) return;
    const root = document.getElementById(`view-${view}`);
    if (!root) return;

    const scope = (el: Element) => el.closest("[data-scope]") ?? el;
    const across = (el: Element) => ({
      trigger: scope(el),
      start: "clamp(top bottom)",
      end: "clamp(bottom top)",
      scrub: true,
      invalidateOnRefresh: true,
    });

    const ctx = gsap.context(() => {
      for (const el of $$("[data-parallax]", root)) {
        const speed = parseFloat(el.dataset.parallax || "0.2");
        gsap.fromTo(
          el,
          { y: 0 },
          { y: () => -speed * innerHeight * 0.6, ease: "none", scrollTrigger: across(el) },
        );
      }
      for (const el of $$("[data-drift]", root)) {
        gsap.fromTo(
          el,
          { xPercent: 10 },
          { xPercent: parseFloat(el.dataset.drift || "-30"), ease: "none", scrollTrigger: across(el) },
        );
      }
      for (const el of $$("[data-fade]", root)) {
        gsap.to(el, {
          opacity: 0.2,
          ease: "none",
          scrollTrigger: { trigger: scope(el), start: "clamp(top top)", end: "bottom top", scrub: true },
        });
      }
      for (const el of $$("[data-scrub-words]", root)) {
        gsap.fromTo(
          splitWords(el),
          { opacity: 0.14 },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.04,
            // clamp: a paragraph near the foot of the page must still be
            // able to finish resolving before the scroll runs out
            scrollTrigger: { trigger: el, start: "top 88%", end: "clamp(top 45%)", scrub: true },
          },
        );
      }
      for (const el of $$("[data-rail]", root)) {
        gsap.fromTo(
          el,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: { trigger: el.parentElement, start: "top 72%", end: "bottom 60%", scrub: true },
          },
        );
      }
      for (const el of $$("[data-pass]", root)) {
        ScrollTrigger.create({ trigger: el, start: "top 62%", toggleClass: "is-passed" });
      }
    }, root);

    // the marquee runs on the scroll's own velocity: faster when you scroll
    // fast, backwards when you scroll up, barely moving when you stop
    const tracks = $$(".marquee-track", root);
    const pos = tracks.map(() => 0);
    let halves = tracks.map((t) => t.scrollWidth / 2);
    const measure = () => {
      halves = tracks.map((t) => t.scrollWidth / 2);
    };
    const tick = (_t: number, dt: number) => {
      const l = getLenis();
      const speed = 60 + Math.min(Math.abs(l?.velocity ?? 0) * 9, 900);
      const dir = l?.direction || 1;
      tracks.forEach((track, i) => {
        const half = halves[i];
        if (!half) return;
        const slow = track.parentElement?.matches(":hover") ? 0.22 : 1;
        const sign = (i % 2 ? 1 : -1) * dir;
        pos[i] = (pos[i] + (sign * speed * slow * dt) / 1000) % half;
        const x = pos[i] > 0 ? pos[i] - half : pos[i];
        track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      });
    };
    if (tracks.length) {
      gsap.ticker.add(tick);
      addEventListener("resize", measure);
    }

    // the view just became display:block — measure it once it has painted
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      cancelAnimationFrame(raf);
      ctx.revert();
      if (tracks.length) {
        gsap.ticker.remove(tick);
        removeEventListener("resize", measure);
        tracks.forEach((t) => (t.style.transform = ""));
      }
    };
  }, [view, ready]);
}
