"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion, rand } from "@/lib/fx";

const SESSION_KEY = "pg-intro";

/**
 * The ignition: particles stream in from the edges, assemble the mark, flash,
 * and a circular shockwave wipes the curtain away. Once per session.
 */
export function Preloader({ onDone }: { onDone: () => void }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nameRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  // the ignition effect must run exactly once, so it reads the callback
  // through a ref rather than depending on its identity
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const nameEl = nameRef.current;
    const ring = ringRef.current;
    if (!root || !canvas || !nameEl || !ring) return;

    const seen = sessionStorage.getItem(SESSION_KEY);
    if (seen || prefersReducedMotion()) {
      root.classList.add("is-gone");
      done.current();
      return;
    }
    sessionStorage.setItem(SESSION_KEY, "1");
    document.body.classList.add("is-locked");

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      root.classList.add("is-gone");
      document.body.classList.remove("is-locked");
      done.current();
      return;
    }

    const DPR = Math.min(devicePixelRatio || 1, 2);
    const W = (canvas.width = innerWidth * DPR);
    const H = (canvas.height = innerHeight * DPR);
    const cx = W / 2;
    const cy = H / 2;

    // target points traced along the mark's silhouette
    const SC = Math.min(W, H) * 0.16;
    const verts = [
      [0, -1.45],
      [0.62, -0.36],
      [0, 1.45],
      [-0.62, -0.36],
    ];
    const targets: { x: number; y: number }[] = [];
    const PER = 34;
    for (let v = 0; v < verts.length; v++) {
      const a = verts[v];
      const b = verts[(v + 1) % verts.length];
      for (let s = 0; s < PER; s++) {
        const f = s / PER;
        targets.push({
          x: cx + (a[0] + (b[0] - a[0]) * f) * SC,
          y: cy + (a[1] + (b[1] - a[1]) * f) * SC,
        });
      }
    }
    // a few interior sparks toward the core
    for (let i = 0; i < 26; i++)
      targets.push({ x: cx + rand(-SC * 0.4, SC * 0.4), y: cy + rand(-SC, SC) });

    const parts = targets.map((t) => {
      const edge = (Math.random() * 4) | 0;
      let x: number;
      let y: number;
      if (edge === 0) [x, y] = [rand(0, W), -20];
      else if (edge === 1) [x, y] = [W + 20, rand(0, H)];
      else if (edge === 2) [x, y] = [rand(0, W), H + 20];
      else [x, y] = [-20, rand(0, H)];
      return { x, y, tx: t.x, ty: t.y, seedX: x, seedY: y };
    });

    nameEl.style.left = innerWidth / 2 + "px";
    nameEl.style.top = innerHeight / 2 + SC / DPR + 60 + "px";
    ring.style.left = innerWidth / 2 + "px";
    ring.style.top = innerHeight / 2 + "px";

    let raf = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let cancelled = false;
    const t0 = performance.now();
    const ASSEMBLE = 1150;

    const reveal = () => {
      root.style.setProperty("--cx", innerWidth / 2 + "px");
      root.style.setProperty("--cy", innerHeight / 2 + "px");
      root.classList.add("is-revealing");
      nameEl.classList.remove("is-lit");
      timers.push(
        setTimeout(() => {
          document.body.classList.remove("is-locked");
          done.current();
        }, 50),
      );
      timers.push(setTimeout(() => root.classList.add("is-gone"), 750));
    };

    const ignite = () => {
      ring.animate(
        [
          { opacity: 0, transform: "translate(-50%,-50%) scale(0.2)" },
          { opacity: 1, transform: "translate(-50%,-50%) scale(1)", offset: 0.3 },
          {
            opacity: 0,
            transform: `translate(-50%,-50%) scale(${(Math.max(innerWidth, innerHeight) / 20) * 1.2})`,
          },
        ],
        { duration: 900, easing: "cubic-bezier(0.65,0,0.35,1)", fill: "forwards" },
      );

      const flash = parts.slice();
      const f0 = performance.now();
      const burst = (now: number) => {
        if (cancelled) return;
        const ft = (now - f0) / 360;
        ctx.clearRect(0, 0, W, H);
        const a = Math.max(0, 1 - ft);
        for (const pt of flash) {
          const ang = Math.atan2(pt.y - cy, pt.x - cx);
          const push = ft * 90 * DPR;
          ctx.beginPath();
          ctx.arc(
            pt.x + Math.cos(ang) * push,
            pt.y + Math.sin(ang) * push,
            2.2 * DPR * a,
            0,
            Math.PI * 2,
          );
          ctx.fillStyle = `rgba(255, 236, 205, ${a})`;
          ctx.fill();
        }
        if (ft < 1) raf = requestAnimationFrame(burst);
        else {
          ctx.clearRect(0, 0, W, H);
          reveal();
        }
      };
      raf = requestAnimationFrame(burst);
    };

    const frame = (now: number) => {
      if (cancelled) return;
      const t = now - t0;
      ctx.clearRect(0, 0, W, H);
      const p = Math.min(t / ASSEMBLE, 1);
      const e = 1 - Math.pow(1 - p, 3); // easeOutCubic

      for (const pt of parts) {
        pt.x = pt.seedX + (pt.tx - pt.seedX) * e;
        pt.y = pt.seedY + (pt.ty - pt.seedY) * e;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 1.7 * DPR, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 199, 5, 0.9)";
        ctx.fill();
      }

      // constellation links once they're mostly assembled
      if (p > 0.55) {
        ctx.strokeStyle = `rgba(255, 92, 36, ${(p - 0.55) * 0.5})`;
        ctx.lineWidth = DPR * 0.6;
        for (let i = 0; i < parts.length; i++) {
          const a = parts[i];
          const b = parts[(i + 1) % parts.length];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          if (dx * dx + dy * dy < (60 * DPR) ** 2) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      if (p > 0.4) nameEl.classList.add("is-lit");

      if (p < 1) raf = requestAnimationFrame(frame);
      else ignite();
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      document.body.classList.remove("is-locked");
    };
  }, []);

  return (
    <div className="preloader" ref={rootRef} aria-hidden="true">
      <canvas id="forge" ref={canvasRef} />
      <div className="forge-name" ref={nameRef}>
        PRATYUSH&nbsp;GARG
      </div>
      <div className="forge-ring" ref={ringRef} />
    </div>
  );
}
