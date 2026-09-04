"use client"

import { GrainGradient } from "@paper-design/shaders-react"

/* The field behind everything. Cozy mode does not filter this — a hue-rotate
   on a red gradient lands on magenta, which is the one colour a warm lamp-lit
   room cannot have. It is recoloured at the source instead.

   The middle stop used to sit at hue 12, which is orange: at this intensity it
   washed the top third of the hero in rust and pulled the whole page off the
   two-plate palette. All three stops are inside the red the rest of the site
   is printed in now, and the field is dimmer — it is atmosphere behind the
   name, not a light source. */
const RED = ["hsl(356, 96%, 52%)", "hsl(4, 88%, 42%)", "hsl(346, 86%, 32%)"]
const AMBER = ["hsl(38, 96%, 52%)", "hsl(28, 94%, 48%)", "hsl(45, 88%, 38%)"]
/* On paper the field is ink soaking into the sheet, not light behind it: the
   ground is the paper itself and the stops are the second plate, thinned. */
const INK_ON_PAPER = ["hsl(356, 72%, 62%)", "hsl(348, 60%, 52%)", "hsl(344, 48%, 44%)"]

export function GradientBackground({ cozy = false, paper = false }: { cozy?: boolean; paper?: boolean }) {
  return (
    <div className="absolute inset-0 -z-10">
      <GrainGradient
        style={{ height: "100%", width: "100%" }}
        colorBack={paper ? "hsl(35, 40%, 95%)" : "hsl(0, 0%, 0%)"}
        softness={paper ? 0.86 : 0.76}
        intensity={paper ? 0.3 : cozy ? 0.34 : 0.36}
        noise={0}
        shape="corners"
        offsetX={0}
        offsetY={0}
        scale={1}
        rotation={0}
        speed={cozy ? 0.5 : 1}
        colors={paper ? INK_ON_PAPER : cozy ? AMBER : RED}
      />
    </div>
  )
}
