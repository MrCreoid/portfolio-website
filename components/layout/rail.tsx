"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { View } from "@/lib/data";
import { prefersReducedMotion } from "@/lib/fx";
import { ScrollTrigger, getLenis } from "@/lib/scroll";

/* Only where there's a cursor to hover it with and room to put it. Touch keeps
   its native scrollbar — a 2px rule is not a thumb you can find with a thumb. */
const RAIL = "(hover: hover) and (pointer: fine) and (min-width: 900px)";

type Tick = { label: string; at: number };

const limit = () => Math.max(1, document.documentElement.scrollHeight - innerHeight);
const clamp = (n: number) => Math.max(0, Math.min(1, n));

/**
 * The archive rail. The readout tells you how far down you are; this shows the
 * shape of the whole document — one hairline down the right edge, a red thumb
 * on it, and a tick for every section head in the view you're reading, labelled
 * in mono on its side. Drag the rule, click a tick, or arrow it with the
 * keyboard. It replaces the native scrollbar, and only ever on a fine pointer.
 */
export function Rail({ view, ready }: { view: View; ready: boolean }) {
  const [on, setOn] = useState(false);
  const [ticks, setTicks] = useState<Tick[]>([]);
  const railRef = useRef<HTMLDivElement | null>(null);
  const thumbRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const mq = matchMedia(RAIL);
    const sync = () => setOn(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  /* The native scrollbar goes only while the rail is actually there to replace it. */
  useEffect(() => {
    document.documentElement.classList.toggle("has-rail", on && ready);
    return () => document.documentElement.classList.remove("has-rail");
  }, [on, ready]);

  const scrollToY = useCallback((y: number, immediate = false) => {
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y, { immediate, force: true });
    else scrollTo({ top: y, behavior: immediate || prefersReducedMotion() ? "auto" : "smooth" });
  }, []);

  useEffect(() => {
    if (!on || !ready) return;
    const rail = railRef.current;
    const thumb = thumbRef.current;
    if (!rail || !thumb) return;

    /* A tick sits at the progress the page will be at once that head is at the
       top — so clicking one lands the thumb exactly on it. */
    const measure = () => {
      const root = document.getElementById(`view-${view}`);
      if (!root) return;
      const max = limit();
      setTicks(
        Array.from(root.querySelectorAll<HTMLElement>(".sec-head")).map((el) => ({
          label: el.querySelector("h2")?.getAttribute("aria-label") ?? "",
          at: clamp((el.getBoundingClientRect().top + scrollY) / max),
        })),
      );
    };

    const update = () => {
      const p = clamp(scrollY / limit());
      thumb.style.transform = `translateY(${(p * (rail.clientHeight - thumb.offsetHeight)).toFixed(1)}px)`;
      rail.setAttribute("aria-valuenow", String(Math.round(p * 100)));
      const marks = Array.from(rail.querySelectorAll<HTMLElement>(".rail-tick"));
      let current = -1;
      marks.forEach((m, i) => {
        if (p + 0.004 >= parseFloat(m.dataset.at || "0")) current = i;
      });
      marks.forEach((m, i) => m.classList.toggle("is-current", i === current));
    };

    // Lenis owns the scroll when it exists; under reduced motion it never
    // starts, and the native event is the only signal there is
    const lenis = getLenis();
    if (lenis) lenis.on("scroll", update);
    else addEventListener("scroll", update, { passive: true });
    ScrollTrigger.addEventListener("refresh", measure);
    addEventListener("resize", measure);
    // the view has only just become display:block — let it paint, then measure
    const raf = requestAnimationFrame(() => {
      measure();
      update();
    });

    return () => {
      cancelAnimationFrame(raf);
      if (lenis) lenis.off("scroll", update);
      else removeEventListener("scroll", update);
      ScrollTrigger.removeEventListener("refresh", measure);
      removeEventListener("resize", measure);
    };
  }, [on, ready, view]);

  // the ticks only exist after a measure, so the thumb has to be placed again
  useEffect(() => {
    railRef.current?.querySelectorAll<HTMLElement>(".rail-tick").forEach((m) => {
      m.style.setProperty("--at", m.dataset.at || "0");
    });
  }, [ticks]);

  const drag = (clientY: number) => {
    const rail = railRef.current;
    const thumb = thumbRef.current;
    if (!rail || !thumb) return;
    const r = rail.getBoundingClientRect();
    const travel = r.height - thumb.offsetHeight;
    scrollToY(clamp((clientY - r.top - thumb.offsetHeight / 2) / travel) * limit(), true);
  };

  const key = (e: React.KeyboardEvent) => {
    const step: Record<string, number> = {
      ArrowDown: 0.05, ArrowUp: -0.05, PageDown: 0.25, PageUp: -0.25,
    };
    const max = limit();
    if (e.key in step) scrollToY(clamp(scrollY / max + step[e.key]) * max);
    else if (e.key === "Home") scrollToY(0);
    else if (e.key === "End") scrollToY(max);
    else return;
    e.preventDefault();
  };

  if (!on) return null;

  return (
    <div
      className="rail"
      ref={railRef}
      role="scrollbar"
      aria-controls="main"
      aria-orientation="vertical"
      aria-label="Scroll position"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
      tabIndex={0}
      onKeyDown={key}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest(".rail-tick")) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        drag(e.clientY);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) drag(e.clientY);
      }}
    >
      {ticks.map((t, i) => (
        <button
          key={`${t.label}-${i}`}
          className="rail-tick"
          data-at={t.at}
          style={{ "--at": t.at } as React.CSSProperties}
          onClick={() => scrollToY(t.at * limit())}
          tabIndex={-1}
        >
          <i>{t.label}</i>
        </button>
      ))}
      <span className="rail-thumb" ref={thumbRef} aria-hidden="true" />
    </div>
  );
}
