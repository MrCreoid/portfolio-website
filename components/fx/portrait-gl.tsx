"use client";

import { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Texture, Triangle } from "ogl";
import { prefersReducedMotion } from "@/lib/fx";
import { useMounted } from "@/hooks/use-mounted";
import { gsap, ScrollTrigger } from "@/lib/scroll";
import { portraitPointer } from "@/hooks/use-toys";

const vertex = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

/* Ashima's 2D simplex, unchanged — it is the cheapest honest noise there is,
   and the idle distortion needs to be organic rather than sinusoidal. */
const fragment = /* glsl */ `
  precision highp float;

  uniform sampler2D tMap;
  uniform vec2 uMouse;
  uniform vec2 uSize;
  uniform vec3 uRed;
  uniform float uTime;
  uniform float uVelocity;
  uniform float uDissolve;
  uniform float uLit;
  varying vec2 vUv;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m; m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    float aspect = uSize.x / uSize.y;
    vec2 uv = vUv;

    // (a) idle — the plate is never quite still, at an amplitude you notice
    // only by its absence
    uv += vec2(
      snoise(vec2(uv.x * 3.0, uv.y * 3.0 - uTime * 0.07)),
      snoise(vec2(uv.y * 3.0 + 11.0, uv.x * 3.0 - uTime * 0.05))
    ) * 0.004;

    // (b) pointer — a thumb dragged through wet ink pushes the pixels aside
    vec2 d = uv - uMouse;
    float dist = length(vec2(d.x * aspect, d.y));
    float reach = smoothstep(0.36, 0.0, dist);
    uv += normalize(d + 1e-6) * reach * (0.014 + uVelocity * 0.055);

    // the misregister the CSS plates only ever faked: three samples, offset by
    // how fast the thumb is moving
    float split = (0.0016 + uVelocity * 0.018) * smoothstep(0.55, 0.0, dist);
    vec4 cr = texture2D(tMap, uv + vec2(split, 0.0));
    vec4 cg = texture2D(tMap, uv);
    vec4 cb = texture2D(tMap, uv - vec2(split, 0.0));
    vec3 rgb = vec3(cr.r, cg.g, cb.b);
    float alpha = max(cg.a, max(cr.a, cb.a) * 0.75);

    // graded to the ink plate; uLit releases the photograph's own colour
    float lum = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
    vec3 col = mix(vec3(lum), rgb, uLit);
    col = ((col - 0.5) * mix(1.16, 1.04, uLit) + 0.5) * mix(0.94, 1.0, uLit);

    // (c) scroll — the photograph becomes its own halftone: a rotated dot
    // screen whose dots are sized by luminance, red on ink
    if (uDissolve > 0.001) {
      float cells = uSize.x / 7.0;
      float a = 0.4014;
      mat2 rot = mat2(cos(a), -sin(a), sin(a), cos(a));
      vec2 grid = rot * vec2(vUv.x * aspect, vUv.y) * cells;
      float r = length(fract(grid) - 0.5);
      float radius = (1.0 - lum) * 0.62 * (1.0 - uDissolve * 0.45);
      float dot = smoothstep(radius, radius - 0.08, r);
      col = mix(col, uRed * dot, uDissolve);
      alpha = mix(alpha, alpha * dot, uDissolve);
    }

    gl_FragColor = vec4(col, alpha);
  }
`;

/* off `body`, not the root: the themes redefine `--red` on body, and the
   halftone has to dissolve into whatever ink the page is currently set in */
const readRed = () => {
  const hex = getComputedStyle(document.body).getPropertyValue("--red").trim();
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return [1, 0.13, 0.2];
  const n = parseInt(m[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * The portrait, as a shader. The same photograph as the `<img>` beneath it —
 * which stays in the DOM as the LCP element and as the fallback if WebGL or
 * the texture never arrives — but sampled by a fragment shader that keeps it
 * moving under a slow noise, pushes it aside under the pointer with a
 * velocity-proportional channel split, and dissolves it into a red halftone
 * screen as the hero leaves.
 *
 * Never mounted under reduced motion, and its ticker is unsubscribed whenever
 * the hero is off-screen.
 */
export function PortraitGL({ src }: { src: string }) {
  // matchMedia is unknowable on the server, so the canvas can only ever appear
  // after hydration — which is also when we learn whether it may appear at all
  const on = useMounted() && !prefersReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = canvas?.closest<HTMLElement>(".hero-portrait");
    const hero = document.querySelector<HTMLElement>(".hero");
    if (!on || !canvas || !wrap || !hero) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer({ canvas, alpha: true, dpr: Math.min(devicePixelRatio, 1.5) });
    } catch {
      return; // no WebGL — the <img> underneath is already the whole picture
    }
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);

    const uniforms = {
      tMap: { value: new Texture(gl) },
      uMouse: { value: [0.5, 0.5] },
      uSize: { value: [1, 1] },
      uRed: { value: readRed() },
      uTime: { value: 0 },
      uVelocity: { value: 0 },
      uDissolve: { value: 0 },
      uLit: { value: 0 },
    };
    const mesh = new Mesh(gl, {
      geometry: new Triangle(gl),
      program: new Program(gl, { vertex, fragment, uniforms, transparent: true }),
    });

    /* The canvas mirrors the <img>'s own box and crop rather than the wrapper's:
       at narrow widths the stylesheet insets and re-crops the photograph, and
       the plane has to land on it exactly at every breakpoint. */
    const img = wrap.querySelector("img");
    const size = () => {
      if (!img) return;
      const b = wrap.getBoundingClientRect();
      const r = img.getBoundingClientRect();
      if (!r.width || !r.height) return;
      Object.assign(canvas.style, {
        left: `${r.left - b.left}px`,
        top: `${r.top - b.top}px`,
        width: `${r.width}px`,
        height: `${r.height}px`,
        clipPath: getComputedStyle(img).clipPath,
      });
      renderer.setSize(r.width, r.height);
      uniforms.uSize.value = [r.width, r.height];
    };
    size();

    // the texture is the only thing that gates the reveal: until it is on the
    // GPU the canvas stays transparent and the <img> is what you are looking at
    let ready = false;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      uniforms.tMap.value.image = image;
      ready = true;
      size();
    };
    image.src = src;

    let dissolve = 0;
    const st = ScrollTrigger.create({
      trigger: hero,
      start: "top top",
      // the halftone is complete exactly as the hero's foot — and therefore the
      // marquee — reaches the top of the viewport
      end: "bottom top",
      onUpdate: (self) => (dissolve = self.progress),
    });

    let t0 = 0;
    const tick = (time: number) => {
      if (!ready) return;
      if (!t0) t0 = time;
      const u = uniforms;
      u.uTime.value = (time - t0) / 1000;
      u.uMouse.value = [
        lerp(u.uMouse.value[0], portraitPointer.x, 0.12),
        lerp(u.uMouse.value[1], 1 - portraitPointer.y, 0.12),
      ];
      u.uVelocity.value = lerp(u.uVelocity.value, portraitPointer.speed, 0.14);
      u.uLit.value = lerp(u.uLit.value, portraitPointer.lit, 0.09);
      u.uDissolve.value = lerp(u.uDissolve.value, dissolve, 0.18);
      // the pointer decays on its own: one flick should not leave the split on
      portraitPointer.speed *= 0.88;
      renderer.render({ scene: mesh });
      if (!wrap.classList.contains("has-gl")) wrap.classList.add("has-gl");
    };

    // off-screen is off: the hero is one of five views, and four of them are
    // display:none for most of a visit
    let running = false;
    const run = (want: boolean) => {
      if (want === running) return;
      running = want;
      if (want) gsap.ticker.add(tick);
      else gsap.ticker.remove(tick);
      wrap.dataset.gl = want ? "on" : "off";
    };
    const io = new IntersectionObserver(([e]) => run(e.isIntersecting), { threshold: 0 });
    io.observe(wrap);

    const ro = new ResizeObserver(size);
    ro.observe(wrap);
    if (img) ro.observe(img);

    return () => {
      run(false);
      io.disconnect();
      ro.disconnect();
      st.kill();
      image.onload = null;
      wrap.classList.remove("has-gl");
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [on, src]);

  if (!on) return null;
  return <canvas className="portrait-gl" ref={canvasRef} aria-hidden="true" />;
}
