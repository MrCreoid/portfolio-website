/* ============================================================
   GradientBackground — @paper-design GrainGradient
   Vanilla port of paper-design-shader-background.tsx.
   This site has no React and no build step, so we mount the same
   shader with the framework-agnostic core (`@paper-design/shaders`)
   instead of the React wrapper. Same fragment shader, same params.
   ============================================================ */

import {
  ShaderMount,
  grainGradientFragmentShader,
  getShaderColorFromString,
  getShaderNoiseTexture,
  GrainGradientShapes,
  ShaderFitOptions,
  defaultObjectSizing,
} from "https://cdn.jsdelivr.net/npm/@paper-design/shaders@0.0.80/+esm";

const params = {
  colorBack: "hsl(0, 0%, 0%)",
  softness: 0.76,
  intensity: 0.45,
  noise: 0,
  shape: "corners",
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  rotation: 0,
  speed: 1,
  colors: ["hsl(14, 100%, 57%)", "hsl(45, 100%, 51%)", "hsl(340, 82%, 52%)"],
};

/**
 * Mounts the shader into `el` (which should already be sized/positioned).
 * Async because ShaderMount rejects a noise texture that hasn't decoded yet —
 * the React wrapper awaits the same decode before it constructs.
 */
export async function mountGradientBackground(el, overrides = {}) {
  const p = { ...defaultObjectSizing, ...params, ...overrides };
  const noiseTexture = getShaderNoiseTexture();
  await noiseTexture.decode();
  return new ShaderMount(
    el,
    grainGradientFragmentShader,
    {
      u_colorBack: getShaderColorFromString(p.colorBack),
      u_colors: p.colors.map(getShaderColorFromString),
      u_colorsCount: p.colors.length,
      u_softness: p.softness,
      u_intensity: p.intensity,
      u_noise: p.noise,
      u_shape: GrainGradientShapes[p.shape],
      u_noiseTexture: noiseTexture,
      u_fit: ShaderFitOptions[p.fit],
      u_scale: p.scale,
      u_rotation: p.rotation,
      u_offsetX: p.offsetX,
      u_offsetY: p.offsetY,
      u_originX: p.originX,
      u_originY: p.originY,
      u_worldWidth: p.worldWidth,
      u_worldHeight: p.worldHeight,
    },
    undefined,
    p.speed,
  );
}
