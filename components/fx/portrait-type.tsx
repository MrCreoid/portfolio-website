"use client";

import { useEffect, useRef } from "react";
import { hasFinePointer, prefersReducedMotion } from "@/lib/fx";
import { useMounted } from "@/hooks/use-mounted";

/**
 * The portrait, set in type.
 *
 * A fixed grid committed to the repo rather than a render of the photograph.
 * The previous version sampled the image on every load and painted six to
 * eight thousand glyphs to a canvas: the negative space was a parameter, so it
 * came out even and mushy, and none of it could reflow.
 *
 * This is the silhouette's own outline with a half-tone lattice inside it, so
 * most of the figure is air and the edge does the reading. It is plain text in
 * a <pre>, which means it scales with the container, reflows at any zoom, costs
 * nothing to paint, and is identical on every machine.
 *
 * Point at him and it trades itself for the photograph underneath.
 */
const FIGURE = [
  "                          ###",
  "                       ### : #####",
  "                     ## : : : : : ##",
  "                     # : + : : : : #",
  "                    # : : : : : : : #",
  "                     # + : + : : : #",
  "                      # # : : : : #",
  "                      ## + + : : #",
  "                        # + : : #",
  "                    #### + : : : ###",
  "                   ## # # + : : : : ##",
  "                 ##: # # # + : # # : :###",
  "              ### : : : : : # # : : : : :###",
  "            ## : : : : : : : : : : : : : : :#",
  "            # : : : : : : : : : : : : : : : :#",
  "           # : : : : : : : : : : : : : : : : #",
  "           #: : : : : : : : : : : : : : : : :#",
  "           # : : : : : : : : : : : : : + : : #",
  "           #: : : : : : : : : : : : + + # # : #",
  "           # # # + : + : # # # # # # # # # + :#",
  "           ## # # # # + + # # # # # # # # : :#",
  "           # # # # + + # # # + + # # + + + :#",
  "            ### # # # + # # : + + + : : : ##",
  "              ## : : : : : : : : : : : : #",
  "                # : : : : : : : : : : : :#",
].join("\n");

/** The widest line — the type is sized so exactly this many columns fit. */
const COLS = Math.max(...FIGURE.split("\n").map((l) => l.length));
const ROWS = FIGURE.split("\n").length;

export function PortraitType() {
  // same conditions as the shader it covers: there has to be a pointer to
  // trade the type back for the photograph with
  const on = useMounted() && hasFinePointer() && !prefersReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);

  /* the wrapper has to know, so it can hide the photograph underneath — and
     only once this has actually rendered, or the hero would be empty wherever
     the type never mounts */
  useEffect(() => {
    const wrap = ref.current?.closest(".hero-portrait");
    wrap?.classList.add("has-type");
    return () => wrap?.classList.remove("has-type");
  });

  if (!on) return null;

  return (
    <div
      className="portrait-type"
      ref={ref}
      style={{ "--pt-cols": COLS } as React.CSSProperties}
      aria-hidden="true"
    >
      <pre className="pt-fig">{FIGURE}</pre>
      {/* the crop marks and the plate number a printer would trim off */}
      <span className="pt-crop pt-tl" />
      <span className="pt-crop pt-br" />
      <span className="pt-meta">
        PG·01 <i>{`${COLS}×${ROWS}`}</i>
      </span>
    </div>
  );
}
