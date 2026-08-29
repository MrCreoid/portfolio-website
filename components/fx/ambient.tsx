"use client";

import { useRef } from "react";
import type { View } from "@/lib/data";
import { GradientBackground } from "@/components/ui/paper-design-shader-background";
import { prefersReducedMotion } from "@/lib/fx";
import { useCursor, useParticles } from "@/hooks/use-ambient";
import { useMounted } from "@/hooks/use-mounted";

/**
 * Everything behind the content.
 *
 * `.bg-shader` is fixed so the gradient stays put while the page scrolls, and
 * carries a CSS radial-gradient fallback for no-WebGL. <GradientBackground /> is
 * `absolute inset-0 -z-10`, which paints it over that fallback but under the
 * scrim, the noise and the page itself.
 *
 * The field runs at full strength on the hero, where it is the atmosphere, and
 * drops back hard on every other view so red returns to being ink rather than
 * ambient glow — `data-view` is what the stylesheet keys that off. Under
 * reduced motion the WebGL canvas is never mounted at all; the CSS fallback
 * underneath carries the look on its own.
 */
export function Ambient({ view }: { view: View }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useParticles(canvasRef);
  const mounted = useMounted();
  const shader = mounted && !prefersReducedMotion();

  return (
    <>
      <div className="bg-shader" data-view={view} aria-hidden="true">
        {shader && <GradientBackground />}
      </div>
      <div className="bg-scrim" aria-hidden="true" />
      <div className="noise" aria-hidden="true" />
      <canvas id="particles" ref={canvasRef} aria-hidden="true" />
    </>
  );
}

export function Cursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  useCursor(dotRef, ringRef);

  return (
    <>
      <div className="cursor-dot" ref={dotRef} aria-hidden="true" />
      <div className="cursor-ring" ref={ringRef} aria-hidden="true" />
    </>
  );
}
