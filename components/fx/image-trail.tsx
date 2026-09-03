"use client";

import { useEffect, useRef } from "react";
import { hasFinePointer, prefersReducedMotion } from "@/lib/fx";
import { useMounted } from "@/hooks/use-mounted";
import { gsap } from "@/lib/scroll";

const LAYERS = 5;
/** Each copy reads the pointer's position from this much further in the past. */
const DELAY = 60;
const LERP = 0.18;
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

/**
 * The rows of "Selected work" are the best typography on the page and they show
 * nothing. Hovering one now throws a screenshot of that project after the
 * cursor: five copies of it, each reading the pointer from 60ms further back
 * than the one in front, skewed by how fast the pointer is moving.
 *
 * Fixed and pointer-transparent, so it can never affect layout or take a click.
 * Fine pointers only; never under reduced motion.
 */
export function ImageTrail({ scope }: { scope: string }) {
  const on = useMounted() && hasFinePointer() && !prefersReducedMotion();
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const list = document.querySelector<HTMLElement>(scope);
    if (!on || !root || !list) return;

    const layers = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
    const trail: { x: number; y: number; t: number }[] = [];
    let px = 0;
    let py = 0;
    let vx = 0;
    let live = false;
    let primed = false;
    let offAt = 0;

    /** The whole set, fetched once the pointer first reaches the list. */
    const prime = () => {
      if (primed) return;
      primed = true;
      for (const row of list.querySelectorAll<HTMLElement>("[data-shot]")) {
        if (row.dataset.shot) new Image().src = row.dataset.shot;
      }
    };

    const enter = (e: PointerEvent) => {
      const row = (e.target as HTMLElement).closest<HTMLElement>("[data-shot]");
      if (!row?.dataset.shot) return;
      prime();
      for (const img of layers) img.src = row.dataset.shot;
      px = e.clientX;
      py = e.clientY;
      trail.length = 0;
      if (!live) {
        live = true;
        gsap.ticker.add(tick);
      }
      offAt = 0;
      root.classList.add("is-on");
    };

    const leave = (e: PointerEvent) => {
      if ((e.relatedTarget as HTMLElement | null)?.closest?.("[data-shot]")) return;
      offAt = performance.now();
      root.classList.remove("is-on");
    };

    const move = (e: PointerEvent) => {
      vx = e.clientX - px;
      px = e.clientX;
      py = e.clientY;
    };

    const tick = () => {
      const now = performance.now();
      trail.unshift({ x: px, y: py, t: now });
      if (trail.length > 90) trail.pop();
      vx *= 0.86;
      const rotate = clamp(vx * 0.06, -8, 8);

      layers.forEach((img, i) => {
        // the position this copy is chasing is the one the pointer held 60ms
        // per copy ago — the same path, just later
        const want = trail.find((p) => now - p.t >= i * DELAY) ?? trail[trail.length - 1];
        const state = (img as HTMLImageElement & { _x?: number; _y?: number });
        state._x = (state._x ?? want.x) + (want.x - (state._x ?? want.x)) * LERP;
        state._y = (state._y ?? want.y) + (want.y - (state._y ?? want.y)) * LERP;
        img.style.transform = `translate3d(${state._x.toFixed(1)}px, ${state._y.toFixed(1)}px, 0) translate(-50%, -50%) rotate(${(rotate * (1 - i * 0.12)).toFixed(2)}deg)`;
      });

      // nothing to animate once it has faded out
      if (offAt && now - offAt > 400) {
        live = false;
        gsap.ticker.remove(tick);
      }
    };

    list.addEventListener("pointerover", enter);
    list.addEventListener("pointerout", leave);
    list.addEventListener("pointermove", move);
    return () => {
      gsap.ticker.remove(tick);
      list.removeEventListener("pointerover", enter);
      list.removeEventListener("pointerout", leave);
      list.removeEventListener("pointermove", move);
      root.classList.remove("is-on");
    };
  }, [on, scope]);

  if (!on) return null;
  return (
    <div className="trail" ref={rootRef} aria-hidden="true">
      {Array.from({ length: LAYERS }, (_, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} alt="" style={{ opacity: 1 - i * 0.15, zIndex: LAYERS - i }} />
      ))}
    </div>
  );
}
