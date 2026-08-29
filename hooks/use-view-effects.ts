"use client";

import { useEffect, useLayoutEffect } from "react";
import type { View } from "@/lib/data";
import { SPRING, hasFinePointer, prefersReducedMotion } from "@/lib/fx";

const $$ = <T extends Element = Element>(s: string, c: ParentNode = document) =>
  Array.from(c.querySelectorAll<T>(s));

/**
 * Staggered reveals + count-ups, re-run every time a view becomes active so a
 * revisit animates again — same behaviour the vanilla router had.
 *
 * Only what is actually on screen when the view opens gets the entrance
 * stagger. Everything below the fold waits for the reader to reach it, which is
 * the whole point of a reveal — the old version fired all of them at once into
 * an empty viewport, so four fifths of every page was already static by the
 * time you scrolled to it.
 */
export function useViewEnter(view: View, ready: boolean) {
  useLayoutEffect(() => {
    if (!ready) return;
    const root = document.getElementById(`view-${view}`);
    if (!root) return;

    const els = $$<HTMLElement>("[data-reveal]", root);
    els.forEach((el) => el.classList.remove("is-in"));
    void root.offsetHeight; // reflow so the transitions re-trigger

    if (prefersReducedMotion()) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }

    const fold = innerHeight * 0.92;
    const above = els.filter((el) => el.getBoundingClientRect().top < fold);
    const below = els.filter((el) => !above.includes(el));

    above.forEach((el, i) => {
      el.style.setProperty("--d", `${Math.min(i * 70, 560)}ms`);
      el.classList.add("is-in");
    });

    // below the fold: reveal on approach, in small groups so a row of cards
    // still lands as a stagger rather than all at once
    const seen = new WeakMap<Element, number>();
    let group = 0;
    let lastTop = -Infinity;
    for (const el of below) {
      const top = el.getBoundingClientRect().top;
      if (top - lastTop > 40) group = 0;
      else group += 1;
      lastTop = top;
      seen.set(el, group);
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          el.style.setProperty("--d", `${(seen.get(el) ?? 0) * 70}ms`);
          el.classList.add("is-in");
          io.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.01 },
    );
    below.forEach((el) => io.observe(el));

    // the count-ups have the same problem the reveals had: a number that ticks
    // 0 -> 47 while it is three screens below the fold has simply not happened
    const frames: number[] = [];
    const countUp = (el: HTMLElement) => {
      const target = Number(el.dataset.count);
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min((t - t0) / 1100, 1);
        el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) frames.push(requestAnimationFrame(tick));
      };
      frames.push(requestAnimationFrame(tick));
    };

    const counters = $$<HTMLElement>("[data-count]", root);
    const countIo = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          countUp(e.target as HTMLElement);
          countIo.unobserve(e.target);
        }
      },
      { threshold: 0.6 },
    );
    counters.forEach((el) => {
      el.textContent = "0";
      countIo.observe(el);
    });

    return () => {
      frames.forEach(cancelAnimationFrame);
      io.disconnect();
      countIo.disconnect();
    };
  }, [view, ready]);
}

/** Slides the pill under the active nav link. */
export function useNavIndicator(view: View, ready: boolean) {
  useLayoutEffect(() => {
    const move = () => {
      const indicator = document.querySelector<HTMLElement>(".nav-indicator");
      const active = document.querySelector<HTMLElement>(".nav-link.is-active");
      if (!indicator || !active) return;
      indicator.style.left = active.offsetLeft + "px";
      indicator.style.width = active.offsetWidth + "px";
      if (ready) indicator.classList.add("is-ready");
    };
    move();
    document.fonts?.ready.then(move);
    addEventListener("resize", move);
    return () => removeEventListener("resize", move);
  }, [view, ready]);
}

/** Cursor-following translate on `.magnetic` and 3D tilt on `.tilt`. */
export function useMagneticTilt() {
  useEffect(() => {
    if (!hasFinePointer() || prefersReducedMotion()) return;
    const cleanups: (() => void)[] = [];

    $$<HTMLElement>(".magnetic").forEach((el) => {
      const move = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width - 0.5) * 2;
        const y = ((e.clientY - r.top) / r.height - 0.5) * 2;
        el.style.translate = `${x * 9}px ${y * 9}px`;
        el.style.transition = "translate 0.1s ease-out";
      };
      const leave = () => {
        el.style.transition = `translate 0.5s ${SPRING}`;
        el.style.translate = "0px 0px";
      };
      el.addEventListener("mousemove", move);
      el.addEventListener("mouseleave", leave);
      cleanups.push(() => {
        el.removeEventListener("mousemove", move);
        el.removeEventListener("mouseleave", leave);
      });
    });

    $$<HTMLElement>(".tilt").forEach((el) => {
      const move = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(700px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
        el.style.transition = "transform 0.08s linear";
      };
      const leave = () => {
        el.style.transition = `transform 0.6s ${SPRING}`;
        el.style.transform = "perspective(700px) rotateY(0deg) rotateX(0deg)";
      };
      el.addEventListener("mousemove", move);
      el.addEventListener("mouseleave", leave);
      cleanups.push(() => {
        el.removeEventListener("mousemove", move);
        el.removeEventListener("mouseleave", leave);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);
}

/**
 * Tracks the cursor across the bento and feeds each cell its local pointer
 * position as --mx/--my, so a cell can react to where the cursor actually is
 * rather than merely that it is somewhere inside.
 */
export function useBentoSpotlight() {
  useEffect(() => {
    const grid = document.getElementById("bento");
    if (!grid || !hasFinePointer()) return;
    const cells = $$<HTMLElement>(".b-cell", grid);

    // rects are measured once on entry and on resize, and the writes are
    // batched into one frame: the old version forced a layout per cell per
    // mousemove, which is a reflow storm on the one interaction meant to feel
    // effortless
    let rects: DOMRect[] = [];
    let frame = 0;
    let px = 0;
    let py = 0;

    const measure = () => {
      rects = cells.map((c) => c.getBoundingClientRect());
    };
    const paint = () => {
      frame = 0;
      for (let i = 0; i < cells.length; i++) {
        const r = rects[i];
        if (!r) continue;
        cells[i].style.setProperty("--mx", px - r.left + "px");
        cells[i].style.setProperty("--my", py - r.top + "px");
      }
    };
    const move = (e: MouseEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const on = () => {
      measure();
      grid.classList.add("is-lit");
    };
    const off = () => grid.classList.remove("is-lit");

    grid.addEventListener("mousemove", move);
    grid.addEventListener("mouseenter", on);
    grid.addEventListener("mouseleave", off);
    addEventListener("scroll", measure, { passive: true });
    addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      grid.removeEventListener("mousemove", move);
      grid.removeEventListener("mouseenter", on);
      grid.removeEventListener("mouseleave", off);
      removeEventListener("scroll", measure);
      removeEventListener("resize", measure);
    };
  }, []);
}
