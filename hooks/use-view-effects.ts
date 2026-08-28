"use client";

import { useEffect, useLayoutEffect } from "react";
import type { View } from "@/lib/data";
import { SPRING, hasFinePointer, prefersReducedMotion } from "@/lib/fx";

const $$ = <T extends Element = Element>(s: string, c: ParentNode = document) =>
  Array.from(c.querySelectorAll<T>(s));

/**
 * Staggered reveals + count-ups, re-run every time a view becomes active so a
 * revisit animates again — same behaviour the vanilla router had.
 */
export function useViewEnter(view: View, ready: boolean) {
  useLayoutEffect(() => {
    if (!ready) return;
    const root = document.getElementById(`view-${view}`);
    if (!root) return;

    const els = $$<HTMLElement>("[data-reveal]", root);
    els.forEach((el) => el.classList.remove("is-in"));
    void root.offsetHeight; // reflow so the transitions re-trigger
    els.forEach((el, i) => {
      el.style.setProperty("--d", `${Math.min(i * 70, 900)}ms`);
      el.classList.add("is-in");
    });

    const frames: number[] = [];
    $$<HTMLElement>("[data-count]", root).forEach((el) => {
      const target = Number(el.dataset.count);
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min((t - t0) / 1100, 1);
        el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) frames.push(requestAnimationFrame(tick));
      };
      frames.push(requestAnimationFrame(tick));
    });

    return () => frames.forEach(cancelAnimationFrame);
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

/** Bento cells glow where the cursor is. */
export function useBentoSpotlight() {
  useEffect(() => {
    const grid = document.getElementById("bento");
    if (!grid || !hasFinePointer()) return;
    const cells = $$<HTMLElement>(".b-cell", grid);

    const move = (e: MouseEvent) => {
      for (const cell of cells) {
        const r = cell.getBoundingClientRect();
        cell.style.setProperty("--mx", e.clientX - r.left + "px");
        cell.style.setProperty("--my", e.clientY - r.top + "px");
      }
    };
    const on = () => grid.classList.add("is-lit");
    const off = () => grid.classList.remove("is-lit");

    grid.addEventListener("mousemove", move);
    grid.addEventListener("mouseenter", on);
    grid.addEventListener("mouseleave", off);
    return () => {
      grid.removeEventListener("mousemove", move);
      grid.removeEventListener("mouseenter", on);
      grid.removeEventListener("mouseleave", off);
    };
  }, []);
}
