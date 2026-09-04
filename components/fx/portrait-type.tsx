"use client";

import { useEffect, useRef } from "react";
import { hasFinePointer, prefersReducedMotion } from "@/lib/fx";
import { useMounted } from "@/hooks/use-mounted";
import { FIGURE, FIGURE_SM } from "@/components/fx/portrait-figure";

/**
 * The portrait, set in type.
 *
 * A fixed grid committed to the repo rather than a render of the photograph.
 * The previous version sampled the image on every load and painted six to
 * eight thousand glyphs to a canvas: the negative space was a parameter, so it
 * came out even and mushy, and none of it could reflow.
 *
 * This is the photograph itself, run through a density ramp and frozen — the
 * whole figure, not an outline of one. It is plain text in a <pre>, which
 * means it scales with the container, reflows at any zoom, costs nothing to
 * paint, and is identical on every machine.
 *
 * Point at him and a light moves through the characters — that is the whole
 * interaction, and it is the only part of this that needs a pointer. The grid
 * itself is static text, so it is set on every screen: narrow ones get the
 * same plate re-sampled at a third of the density, because 111 columns in a
 * phone's width is a glyph three pixels wide. The photograph underneath is
 * what shows before this hydrates, and nothing else.
 */

const measure = (fig: string) => {
  const lines = fig.split("\n");
  /** The grid's own measure. The type is sized from the row count, because the
   *  figure is taller than it is wide and the height is what runs out first. */
  return { cols: Math.max(...lines.map((l) => l.length)), rows: lines.length };
};
const BIG = measure(FIGURE);
const SMALL = measure(FIGURE_SM);

export function PortraitType() {
  const on = useMounted();
  /* The torch is the only pointer-dependent part, and the plate-slip it runs
     with is motion. Neither is a reason to withhold the type itself. */
  const torch = on && hasFinePointer() && !prefersReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);

  /* The wrapper has to know, so it can hide the photograph underneath — and
     only once this has actually rendered, or the hero would be empty wherever
     the type never mounts. */
  useEffect(() => {
    const wrap = ref.current?.closest<HTMLElement>(".hero-portrait");
    wrap?.classList.add("has-type");
    return () => wrap?.classList.remove("has-type");
  });

  /* The torch. A second copy of the same grid, clipped to the glyphs and
     painted with a radial gradient that sits where the pointer is — so moving
     across him lights the characters in the page's own ink rather than trading
     the whole plate for a photograph. Two custom properties per frame, written
     once per rAF and only while the pointer is actually over him. */
  useEffect(() => {
    const el = ref.current;
    const wrap = el?.closest<HTMLElement>(".hero-portrait");
    if (!torch || !el || !wrap) return;

    /* The gradient paints on the lit plate's own box, so the pointer has to be
       measured against that box and not against the wrapper — the two are
       different sizes, and mixing them puts the light somewhere the pointer
       is not. */
    const lit = el.querySelector<HTMLElement>(".pt-lit");
    if (!lit) return;

    let frame = 0;
    let x = 0;
    let y = 0;
    const paint = () => {
      frame = 0;
      lit.style.setProperty("--px", `${x.toFixed(1)}px`);
      lit.style.setProperty("--py", `${y.toFixed(1)}px`);
    };
    const move = (e: PointerEvent) => {
      const r = lit.getBoundingClientRect();
      x = e.clientX - r.left;
      y = e.clientY - r.top;
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const enter = (e: PointerEvent) => {
      move(e);
      el.classList.add("is-lit");
    };
    const leave = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      el.classList.remove("is-lit");
    };

    wrap.addEventListener("pointerenter", enter);
    wrap.addEventListener("pointermove", move);
    wrap.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(frame);
      wrap.removeEventListener("pointerenter", enter);
      wrap.removeEventListener("pointermove", move);
      wrap.removeEventListener("pointerleave", leave);
      el.classList.remove("is-lit");
    };
  }, [torch]);

  if (!on) return null;

  return (
    <div className="portrait-type" ref={ref} aria-hidden="true">
      <pre className="pt-fig pt-lg" style={{ "--pt-rows": BIG.rows } as React.CSSProperties}>
        {FIGURE}
      </pre>
      {/* the same grid again, clipped to its own glyphs and lit from wherever
          the pointer is — the second plate, printed in register */}
      {torch && (
        <pre
          className="pt-fig pt-lg pt-lit"
          style={{ "--pt-rows": BIG.rows } as React.CSSProperties}
        >
          {FIGURE}
        </pre>
      )}
      {/* the narrow plate. One layer, no torch: there is no pointer to carry a
          light around with, and a tap is not a hover. */}
      <pre className="pt-fig pt-sm" style={{ "--pt-rows": SMALL.rows } as React.CSSProperties}>
        {FIGURE_SM}
      </pre>
      {/* The plate number a printer would trim off. The crop marks that used
          to flank it were pinned to the wrapper rather than to the grid, so
          the top-left one floated alone over the surname and read as a stray
          red corner rather than as a register mark. */}
      <span className="pt-meta">
        PG·01 <i className="pt-dim-lg">{`${BIG.cols}×${BIG.rows}`}</i>
        <i className="pt-dim-sm">{`${SMALL.cols}×${SMALL.rows}`}</i>
      </span>
    </div>
  );
}
