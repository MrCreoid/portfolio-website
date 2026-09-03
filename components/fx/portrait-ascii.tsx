"use client";

import { useEffect, useRef } from "react";
import { hasFinePointer, prefersReducedMotion } from "@/lib/fx";
import { useMounted } from "@/hooks/use-mounted";

/** Dark plate, so density climbs with luminance: a lit pixel gets a fat glyph. */
const RAMP = " .:-=+ox*#%@";

/**
 * The portrait as a wall of characters.
 *
 * At rest the hero does not lead with a photograph of me — it leads with type,
 * which is what the rest of the page is made of. The figure is there, sampled
 * into mono glyphs at one character per cell, printed in the page's own ink.
 * Point at him and the characters fade out and the photograph (the shader
 * plate, or the plain <img> behind it) resolves in its place.
 *
 * Painted once per size and once per theme, never per frame — it is a print,
 * not an animation. Only where the shader lives: a fine pointer with motion
 * allowed. Anywhere else the photograph is what you get, since there is no
 * hover to trade it for.
 */
export function PortraitAscii({ src }: { src: string }) {
  const on = useMounted() && hasFinePointer() && !prefersReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = canvas?.closest<HTMLElement>(".hero-portrait");
    const img = wrap?.querySelector("img");
    if (!on || !canvas || !wrap || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let photo: HTMLImageElement | null = null;
    let scheduled = 0;
    // the source is read once into a small offscreen grid; the expensive half
    // is the glyph pass, and that only reruns when the box or the ink changes
    let cells: { x: number; y: number; g: string; a: number }[] = [];
    let cols = 0;
    let rows = 0;

    /**
     * Sample the photograph down to one glyph per character cell.
     *
     * The luminance is stretched across the figure's own range rather than
     * used absolutely: he is a dark figure on a dark plate, and an absolute
     * ramp maps most of him to a space, which leaves a silhouette with a hole
     * in it. Inside the cut-out every cell gets a character — the alpha
     * channel is the mask, the luminance only decides which one.
     */
    const sample = (w: number, h: number) => {
      if (!photo) return;
      cols = Math.max(24, Math.min(120, Math.round(w / 7.5)));
      // a mono cell is about twice as tall as it is wide
      rows = Math.max(12, Math.round((cols * h) / w / 2.05));
      const off = document.createElement("canvas");
      off.width = cols;
      off.height = rows;
      const octx = off.getContext("2d", { willReadFrequently: true });
      if (!octx) return;
      octx.drawImage(photo, 0, 0, cols, rows);
      const { data } = octx.getImageData(0, 0, cols, rows);

      const found: { x: number; y: number; lum: number }[] = [];
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = (y * cols + x) * 4;
          // the photograph is a cut-out; the empty half of the box stays empty
          if (data[i + 3] < 90) continue;
          found.push({
            x,
            y,
            lum: (data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722) / 255,
          });
        }
      }
      cells = [];
      if (!found.length) return;

      // 4th and 96th percentile, so one specular highlight cannot flatten the
      // rest of the figure into the bottom two glyphs
      const sorted = found.map((c) => c.lum).sort((a, b) => a - b);
      const lo = sorted[Math.floor(sorted.length * 0.04)];
      const hi = sorted[Math.floor(sorted.length * 0.96)];
      const span = Math.max(hi - lo, 0.02);
      const last = RAMP.length - 1;

      for (const c of found) {
        const t = Math.max(0, Math.min(1, (c.lum - lo) / span));
        // index 1 upward: never a space inside the figure
        // the floor is high: paper glyphs sit over the field's brightest
        // corner, and anything under about half opacity washes out there
        cells.push({
          x: c.x,
          y: c.y,
          g: RAMP[Math.max(1, Math.round(t * last))],
          a: 0.66 + t * 0.34,
        });
      }
    };

    const paint = () => {
      const b = wrap.getBoundingClientRect();
      const r = img.getBoundingClientRect();
      if (!r.width || !r.height || !photo) return;

      const dpr = Math.min(devicePixelRatio || 1, 2);
      Object.assign(canvas.style, {
        left: `${r.left - b.left}px`,
        top: `${r.top - b.top}px`,
        width: `${r.width}px`,
        height: `${r.height}px`,
        clipPath: getComputedStyle(img).clipPath,
      });
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);

      sample(r.width, r.height);
      const cw = canvas.width / cols;
      const ch = canvas.height / rows;

      // the ink is whatever the page is currently set in, so the wall follows
      // cozy and CRT without knowing they exist
      const css = getComputedStyle(document.body);
      const ink = css.getPropertyValue("--paper").trim() || "#f2ece4";

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${Math.round(ch * 0.95)}px ${css.getPropertyValue("--font-mono") || "monospace"}`;
      ctx.textBaseline = "top";
      // One ink. The second plate was tried here and does not work: the cells
      // at the top of the range are also the fattest glyphs, so a threshold
      // that picks half a per cent of cells paints a sixth of the ink red and
      // the figure reads as blotches rather than a print.
      ctx.fillStyle = ink;
      for (const c of cells) {
        ctx.globalAlpha = c.a;
        ctx.fillText(c.g, c.x * cw, c.y * ch);
      }
      ctx.globalAlpha = 1;
      wrap.classList.add("has-ascii");
    };

    /** Off the critical path: 6–8k glyph draws is not a first-frame job. */
    const repaint = () => {
      cancelAnimationFrame(scheduled);
      scheduled = requestAnimationFrame(() => setTimeout(paint, 0));
    };

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      photo = image;
      repaint();
    };
    image.src = src;

    addEventListener("resize", repaint);
    // cozy and CRT swap the ink under it
    const themes = new MutationObserver(repaint);
    themes.observe(document.body, { attributeFilter: ["class"] });
    // and the type it is drawn in may not have arrived yet
    document.fonts?.ready.then(repaint);

    return () => {
      cancelAnimationFrame(scheduled);
      removeEventListener("resize", repaint);
      themes.disconnect();
      wrap.classList.remove("has-ascii");
    };
  }, [on, src]);

  if (!on) return null;
  return <canvas className="portrait-ascii" ref={canvasRef} aria-hidden="true" />;
}
