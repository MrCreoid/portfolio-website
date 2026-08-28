"use client";

import { useRef } from "react";
import { GradientBackground } from "@/components/ui/paper-design-shader-background";
import { useCursor, useParticles } from "@/hooks/use-ambient";

/**
 * Everything behind the content.
 *
 * `.bg-shader` is fixed so the gradient stays put while the page scrolls, and
 * carries a CSS radial-gradient fallback for no-WebGL. <GradientBackground /> is
 * `absolute inset-0 -z-10`, which paints it over that fallback but under the
 * scrim, the noise and the page itself.
 */
export function Ambient() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useParticles(canvasRef);

  return (
    <>
      <div className="bg-shader" aria-hidden="true">
        <GradientBackground />
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
