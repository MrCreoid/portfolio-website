"use client"

import { GrainGradient } from "@paper-design/shaders-react"

/* The field behind everything. Cozy mode does not filter this — a hue-rotate
   on a red gradient lands on magenta, which is the one colour a warm lamp-lit
   room cannot have. It is recoloured at the source instead. */
const RED = ["hsl(356, 100%, 58%)", "hsl(12, 96%, 52%)", "hsl(344, 90%, 40%)"]
const AMBER = ["hsl(38, 96%, 52%)", "hsl(28, 94%, 48%)", "hsl(45, 88%, 38%)"]

export function GradientBackground({ cozy = false }: { cozy?: boolean }) {
  return (
    <div className="absolute inset-0 -z-10">
      <GrainGradient
        style={{ height: "100%", width: "100%" }}
        colorBack="hsl(0, 0%, 0%)"
        softness={0.76}
        intensity={cozy ? 0.38 : 0.45}
        noise={0}
        shape="corners"
        offsetX={0}
        offsetY={0}
        scale={1}
        rotation={0}
        speed={1}
        colors={cozy ? AMBER : RED}
      />
    </div>
  )
}
