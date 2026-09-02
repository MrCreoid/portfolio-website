"use client";

import { useRef } from "react";
import type { View } from "@/lib/data";
import { GradientBackground } from "@/components/ui/paper-design-shader-background";
import { prefersReducedMotion } from "@/lib/fx";
import { useCursor, useInk, useParticles } from "@/hooks/use-ambient";
import { useMounted } from "@/hooks/use-mounted";

/**
 * Everything behind the content, bottom to top: the shader field (with a CSS
 * radial fallback for no-WebGL), the scrim that keeps copy legible on it, the
 * ink plate the pointer paints on, the constellation, and the grain on top.
 *
 * The field runs at full strength on the hero, where it is the atmosphere,
 * and drops back hard on every other view so red returns to being ink rather
 * than ambient glow — `data-view` is what the stylesheet keys that off. Under
 * reduced motion the WebGL canvas is never mounted; the CSS fallback carries
 * the look on its own.
 */
export function Ambient({ view }: { view: View }) {
  const particlesRef = useRef<HTMLCanvasElement | null>(null);
  const inkRef = useRef<HTMLCanvasElement | null>(null);
  useParticles(particlesRef);
  useInk(inkRef);
  const mounted = useMounted();
  const shader = mounted && !prefersReducedMotion();

  return (
    <>
      <div className="bg-shader" data-view={view} aria-hidden="true">
        {shader && <GradientBackground />}
      </div>
      <div className="bg-scrim" aria-hidden="true" />
      <canvas id="ink" ref={inkRef} aria-hidden="true" />
      <canvas id="particles" ref={particlesRef} aria-hidden="true" />
      <div className="noise" aria-hidden="true" />
    </>
  );
}

export function Cursor() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  useCursor(rootRef);

  return (
    <div className="cursor" ref={rootRef} aria-hidden="true">
      <div className="cursor-dot" />
      <div className="cursor-ring">
        <span className="cursor-label" />
      </div>
    </div>
  );
}
