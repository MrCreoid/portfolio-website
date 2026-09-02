# MASTERPLAN — taking The Archive from "very good" to "unfair"

A build plan for pratyushgarg.dev, written to be handed to any AI model or engineer.
Every item is self-contained: what to build, why it earns its place, exactly how, and
how to prove it works. Do them in tiers; inside a tier, any order.

---

## 0. Read this first (orientation for whoever executes the plan)

**Stack.** Next.js 16 app router, `output: "export"` (static, GitHub Pages, no server —
no route handlers, no server actions), React 19, TypeScript, one hand-written stylesheet
`styles/portfolio.css` (~4,200 lines, the design system lives there), Tailwind only as a
base layer. Installed and in use: `motion` (bento hover), `gsap` + `ScrollTrigger`,
`lenis`, `animejs` v4, `@paper-design/shaders-react` (hero gradient), `lucide-react`.

**Architecture.** Five "views" (`home / about / projects / achievements / contact`) are
all mounted; one is `.is-active`, the rest `display: none`. Switching runs the slat wipe
in `components/portfolio-provider.tsx` → `goTo()`. Scroll-linked motion is declared with
data attributes and wired once per view in `hooks/use-scroll-fx.ts`
(`data-parallax`, `data-drift`, `data-fade`, `data-scrub-words`, `data-rail`,
`data-pass`, `data-scope`). Entrance reveals are `data-reveal` (fade/translate) and
`data-reveal="wipe"` (clip-path), fired by `hooks/use-view-effects.ts`. The cursor's
moods are in `hooks/use-ambient.ts` (`body[data-cur]`); the ink canvas too. Imperative
one-offs (confetti, scramble, splitWords) live in `lib/fx.ts`. Content is `lib/data.ts`.

**The design contract — do not break it.**
- Editorial brutalism: radius is zero everywhere (`* { border-radius: 0 }`). Nothing round, ever.
- Three voices: Archivo (display/body), Instrument Serif (editorial), JetBrains Mono (labels, numbers).
- Red (`--red`) is a printer's second plate — rules, numerals, one word per headline. Never a glow.
- No emoji anywhere (lucide icons only). The single exception is the cozy-mode drift in `hooks/use-eggs.ts`.
- No generic "AI website" tells: no gradient text, no glassmorphism cards, no `<hr>` dividers, no pill buttons, no 3-column icon-feature grids with rounded cards.
- Every animation ships with `prefers-reduced-motion` handling and `(hover: hover) and (pointer: fine)` gating where it is pointer-driven. Reduced motion means gentler, not nothing — the content must always be readable.
- Transform/opacity/clip-path only for motion. Never animate `width/height/top/left` per frame. Never write a CSS custom property onto `<html>` per frame (it invalidates the whole document — this was the cause of the scroll lag).
- Curves: use the tokens (`--ease-out`, `--ease-out-hard`, `--ease-slam`, `--ease-spring`). Don't invent beziers.
- Commit messages: plain, no AI attribution trailers.

**Verification for every item.** `npx tsc --noEmit && npx eslint . && npx next build`
must pass; the browser console must be empty; screenshot at 1440px and 390px; test with
reduced motion emulated; a fast wheel flick up/down must stay at 60fps (check the
Performance panel — no long tasks over 16ms while scrolling).

**Item template.** Each item below has: **What · Why · How · Done when.** Treat "How" as
a spec, not a suggestion — where it names a file, value or library, use it.

---

## 1. Tier S — the signature moments (the ones people screenshot)

### 1.1 The portrait as a shader
**What.** Replace the static `<img>` portrait in the hero with a WebGL plane that shows the
same photograph, and give it three behaviours: (a) idle — a slow liquid distortion driven
by simplex noise, barely visible; (b) pointer — the pixels under the cursor are pushed
aside like a thumb on wet ink, with the red/cyan channel split we already fake in CSS done
properly in the fragment shader (`texture2D` sampled three times with an offset that is
proportional to pointer velocity); (c) scroll — as the hero leaves, the image dissolves
into a **halftone dot screen** (dot size from luminance, red dots on ink) and reassembles
on the way back.
**Why.** This is the one image on the site. A shader portrait is the difference between a
portfolio and a piece.
**How.** Use `ogl` (≈ 30 KB, no React wrapper needed) inside a client component
`components/fx/portrait-gl.tsx`; keep the existing `<Image>` as the fallback and for
LCP (render both; fade the canvas in when the texture loads). Uniforms:
`uTime`, `uMouse` (lerped), `uVelocity` (lerped, clamp 0–1), `uDissolve` (0–1 from a
ScrollTrigger scrub across `.hero`). Keep the current alpha hit-test for the
`is-lit` colour release — the shader reads a `uLit` uniform for saturation. Render at
`min(devicePixelRatio, 1.5)`. Pause the RAF when the hero is off-screen (IntersectionObserver).
Reduced motion: never mount the canvas.
**Done when.** 60fps on a 2020 MacBook Air, texture loads without a flash, the
halftone dissolve is complete by the time the marquee reaches the top of the viewport.

### 1.2 Real fluid ink
**What.** Swap the 2D ink canvas (`#ink`) for a WebGL Navier–Stokes fluid simulation. Red
dye on black, viscous, slow-dissipating, so a swipe leaves a smoke-like plume that curls.
Click = a splat with a burst of velocity. View transitions inject a full-width splat from
the click origin (the provider already stores `--cx/--cy`).
**Why.** The 2D version reads as "glow". A fluid sim reads as ink in water, which is the
site's whole metaphor.
**How.** `webgl-fluid-enhanced` (npm) mounted on a fixed canvas under the content,
`pointer-events: none`, driven manually: because the canvas can't receive events, call its
`splat(x, y, dx, dy, color)` from the existing global `pointermove` in `useInk`. Config:
`SIM_RESOLUTION 128, DYE_RESOLUTION 512, DENSITY_DISSIPATION 1.6, VELOCITY_DISSIPATION 1.2,
PRESSURE 0.7, CURL 18, SPLAT_RADIUS 0.18, COLORFUL false`, palette `[--red, --red-2]` read
from `particleTheme` so cozy/CRT recolour it. Blend with `mix-blend-mode: screen`. Stop
the sim when `document.hidden`. Under 900px width use `DYE_RESOLUTION 256`. Delete the 2D
implementation once this is in.
**Done when.** A fast swipe leaves a plume that keeps moving for ~2 seconds; the
"Let's connect" click leaves a splat that the slats wipe over.

### 1.3 The name becomes the marquee
**What.** As the user scrolls past the fold, the fifteen letters of `I'M PRATYUSH GARG.`
lift off their lines, fly, and land inside the red marquee band as the first fifteen
words — then the band starts moving with them in it. Scroll back up and they fly home.
**Why.** It connects the two signature elements into one gesture; nobody has this.
**How.** GSAP `Flip` plugin (already available in `gsap`). Add fifteen hidden target
`<span>`s at the start of the first `.marquee-track`. On a ScrollTrigger over `.hero`
(`start: "40% top", end: "bottom top", scrub: 0.6`), tween each `.h-letter > i` with
`Flip.fit(letter, target, { scale: true, absolute: true })` inside a `gsap.timeline` with
stagger 0.02. Disable the letter grab physics while progress > 0 (add `.is-flying` on
`.hero-title`; the pointer handlers early-return on it).
**Done when.** Letters land exactly on the marquee baseline at every viewport width
(measure at 1920 / 1440 / 1024 / 390) and the marquee's velocity driver keeps working.

### 1.4 "What I do" as a pinned horizontal chapter
**What.** Pin the "What I do" section for 250vh of scroll. The three entries slide in
horizontally one at a time, each accompanied by its numeral at 40vw set behind it,
a progress rule "01 / 03" at the top-right, and one full sentence of serif copy that
types itself (reuse `useTypewriter` logic, faster: 18ms/char).
**Why.** The home page currently has only vertical rhythm. One horizontal chapter breaks
it and makes the scroll feel authored.
**How.** ScrollTrigger `pin: true, scrub: 1, end: "+=250%"` on a `.chapter` wrapper;
`xPercent: -100 * (n-1)` on the track; snap `1/(n-1)`. Below 900px: no pin, plain
stacked cards with the existing wipe reveal. Keep the section's existing markup so the
mobile branch is the same DOM.
**Done when.** Pin has no jump on enter/leave, header hide/show still works during the
pin, and the readout percentage keeps climbing.

### 1.5 Project rows with an image trail
**What.** Hovering a row in "Selected work" spawns a floating screenshot that follows the
cursor with lag and skews with pointer velocity; moving fast leaves a trail of 4–5
staggered copies that fade. Clicking goes to the project.
**Why.** The rows are the strongest typography on the site but they show nothing. This is
the classic Awwwards move, done with real screenshots.
**How.** First generate screenshots: a script `scripts/shots.mjs` (Playwright, not a
dependency — run with `npx playwright`) that captures each `PROJECTS[i].url` at 1280×800
to `public/assets/shots/<id>.webp` (quality 72, max 640px wide). Then
`components/fx/image-trail.tsx`: one `<div class="trail">` with N=5 `<img>` layers,
pointer position lerped at 0.18, `rotate` from velocity.x × 0.06 clamped ±8deg, each
older copy 60ms behind and 0.15 dimmer. Only on `(hover: hover) and (pointer: fine)`.
**Done when.** Trail never causes layout, images are preloaded on row enter, and the
"This portfolio" row shows a screenshot of this site (capture localhost during the build).

### 1.6 The archive scrollbar
**What.** Replace the native scrollbar with a fixed rail on the right: a 2px rule with a
red thumb, tick marks for every section head in the current view with their labels in
mono (rotated 90°, appear on hover), the current one highlighted. Draggable; clicking a
tick calls `lenis.scrollTo(section)`.
**Why.** The readout tells you where you are; this shows the whole document's shape.
**How.** `components/layout/rail.tsx`; measure section offsets on `ScrollTrigger.refresh`;
thumb position from `lenis.progress`; `html { scrollbar-width: none }` +
`::-webkit-scrollbar { display: none }` only when the rail is mounted (fine pointer,
≥ 900px). Keyboard: the rail is `role="scrollbar"` with `aria-valuenow`.
**Done when.** Dragging the thumb scrolls smoothly, ticks realign after a view change,
native scrollbar returns on touch devices.

---

## 2. Tier A — motion and interaction upgrades

### 2.1 Variable-width type that breathes
**What.** Load Archivo as a variable font with the `wdth` axis (Next: `Archivo({ axes: ["wdth"] })`).
Section titles reveal from `wdth 62` to `100` as they rise (add `font-variation-settings`
to the `.ch` transition). On hover, the letter under the cursor and its two neighbours
stretch to `wdth 118` — like the title is being pinched.
**Why.** The type is the design; making it elastic makes the design alive.
**How.** CSS only for reveal. For hover: one delegated `pointermove` on `.sec-title`
sets `--wdth` per glyph from distance to the pointer (exponential falloff, radius 90px);
throttle to rAF. Never on the hero title (it already has grab + ripple).
**Done when.** No layout shift on reveal (titles are `overflow: visible`, the box width
must be measured at `wdth 100`).

### 2.2 The lede fills with ink on scroll
**What.** `.about-lede` and the outro paragraph fill from paper-grey to full paper as you
scroll — not per word (already done) but as a continuous fill line moving through the
text like a thermometer.
**How.** `background: linear-gradient(90deg, var(--paper) var(--fill), var(--paper-4) 0)`
with `background-clip: text; color: transparent`, `--fill` scrubbed 0→100% per line
(split into lines with `splitWords` + `offsetTop` grouping). Use for exactly these two
places; word-scrub stays elsewhere.

### 2.3 Slats v2
**What.** The view transition slats are cut on a 6° diagonal (`clip-path: polygon`), and
the destination label arrives scrambled (`scramble()` from `lib/fx.ts`, 380ms) with the
view's folio number ("02 / 05") in mono under it. On leave, the slats lift in reverse
order (last down, first up).
**Done when.** Transition total stays ≤ 1.6s and `goTo` timings are updated to match.

### 2.4 Letters with real physics
**What.** Flung letters collide with each other, the header's bottom rule and the viewport
floor; they tumble, come to rest, and spring home 1.2s after the last one stops. Shake the
window (resize wiggle) or press `Esc` to reset instantly.
**How.** `matter-js` (only on home, lazy `import()` on first grab). One body per letter
sized from its rect; render by writing `transform` on `.h-letter` each engine tick; when
all bodies sleep, tween them home with the existing SPRING curve and remove the world.
**Done when.** No jitter on release, bodies never escape the viewport, reduced motion
keeps the old snap-back.

### 2.5 The bento cells breathe with the spotlight
**What.** The `--mx/--my` spotlight is there; add: the cell under the pointer tilts
(`rotateX/Y` ±4°, perspective 1200px) and its `.b-no` numeral parallaxes opposite to the
pointer by 12px; the red plate rises from the *side the pointer entered from*.
**How.** In `useBentoSpotlight`, record entry direction per cell (compare pointer to rect
on `mouseenter`) and set `data-from="top|bottom|left|right"`; CSS `transform-origin` per
side on `.b-plate`.

### 2.6 A timeline that prints
**What.** Each timeline card prints when the rail reaches it: the date stamps (already),
then the title and body reveal line-by-line with a moving clip edge, then the `<code>`
line types itself. 600ms per card total.
**How.** ScrollTrigger `toggleClass` is already there (`is-passed`); add CSS
`clip-path: inset(0 0 100% 0)` → `inset(0)` on `.tl-card h3`, `p`, `code` with 120ms
steps, and a `steps(n)` animation on `.tl-code` using `--n` = character count.

### 2.7 Stats that are true
**What.** Replace the two fake numbers with live ones from the GitHub REST API (no auth,
cached in `localStorage` for 6h): public repos, commits in the last year (from the
events endpoint, approximate), and stars. Keep "∞ curiosity". The labels stay in the
site's voice ("commits this year, allegedly").
**How.** `lib/github.ts` fetch in a `useEffect`, fall back to `STATS` in `lib/data.ts`
if the request fails or rate-limits; the count-up already handles any number.

### 2.8 The form as a conversation
**What.** The contact form shows one field at a time in a 3-step flow with a mono
progress ("01 — who are you?"); Enter advances; the message field pre-composes from the
chips with the typewriter; on send, a **receipt** prints: a paper plate, monospaced
line items (from / subject / filed at / ref no. `PG-2026-XXXX`), a real SVG barcode of
the ref number, and a red "FILED" stamp that slams in (`--ease-slam`, 240ms, scale
1.6→1).
**How.** Keep `web3forms` submit; the receipt replaces `.form-filed`. Barcode: encode the
ref as Code 39 bars with `<rect>`s in a 20-line helper — no library.
**Done when.** Keyboard-only completion works, errors are announced with `role="alert"`,
and the receipt is printable (see 3.6).

### 2.9 Command palette
**What.** `⌘K` / `Ctrl K` opens a brutalist list: go to view, copy email, open résumé,
toggle cozy / CRT / grid / sound, "play typing test", "show the eggs I've found".
Type to filter; arrow keys; Enter. **No open/close animation** (a keyboard-triggered,
many-times-a-day control does not animate).
**How.** `components/overlays/palette.tsx`, a `<dialog>` with `showModal()`, the same
1px-rule list style as the skills index. Fuzzy filter is a 10-line subsequence match.

### 2.10 Idle life
**What.** After 20s without input the page starts living on its own: the eyebrow rotates
faster, the hero letters do a slow wave every 8s, the marquee reverses direction
briefly, the readout blinks "idle". Any input stops it. (DVD still takes over at 60s.)
**How.** One `useIdle(ms)` hook in `hooks/use-ambient.ts` toggling `body.is-idle`; CSS
and a small anime.js loop keyed on it.

### 2.11 Global drawn line
**What.** A single red SVG path runs down the left rule of every view (from the header
to the footer) and draws itself with the scroll — the timeline rail becomes one segment
of it. Section heads have a small square "station" on the line that fills when passed.
**How.** One `<svg>` per view with a vertical path; `stroke-dashoffset` scrubbed by
ScrollTrigger; stations are `[data-pass]` elements (already implemented).

### 2.12 Marquee words are alive
**What.** Each marquee word is hoverable: the word inverts (done) and a tooltip plate
above it shows one fact ("CSS — 4,200 lines behind this page"). Dragging the band
scrubs it (pointer capture, velocity carries on release).
**How.** Facts in `lib/data.ts` as `MARQUEE_FACTS: Record<string, string>`; drag in the
marquee driver in `use-scroll-fx.ts` (add a `dragVelocity` term that decays at 0.94).

---

## 3. Tier B — system, polish, text

### 3.1 Real URLs for views
**What.** `#about`, `#projects`… in the address bar; back/forward switch views through
the slat transition; deep links open the right view after the preloader.
**How.** `history.pushState` in `goTo`, `popstate` → `goTo(view, cx, cy)` without pushing;
initial view from `location.hash` in the provider (default home). Update `metadata`
`title` per view (`document.title` in an effect).
**Done when.** Refresh on `#contact` lands on contact; browser back goes home.

### 3.2 Hide the native cursor properly
**What.** The custom cursor currently draws on top of the native one. Set `cursor: none`
on `body` for fine pointers, restore `cursor: text` on inputs/textarea and `grab` on
`.h-letter` (the custom cursor shows a "grab" label there instead).
**Done when.** No double cursor anywhere, including over the iframe preview (set
`cursor: auto` on `.pv-body`).

### 3.3 Preloader counts real progress
**What.** The 0→100 counter tracks actual readiness: 0–40 fonts (`document.fonts.ready`),
40–80 the portrait (`img.decode()`), 80–100 the shader mount. Minimum on-screen time
stays 1.4s so it never flashes; maximum 4s then it opens regardless.
**How.** Replace the timer curve in `components/fx/preloader.tsx` with a target that
the counter eases toward (`count += (target - count) * 0.08` per frame).

### 3.4 Paper mode (light theme) with a real page flip
**What.** Hold the logo for 600ms (or `⌘K → paper`) and the archive inverts: paper
background, ink type, red unchanged. The switch is a circular reveal from the logo using
the View Transitions API (`document.startViewTransition`), falling back to a crossfade.
**How.** A second token block `body.is-paper { --ink: #f2ece4; --paper: #080506; … }`;
every colour already reads tokens. Persist in `localStorage`. The shader and ink layers
get `mix-blend-mode: multiply` in paper mode.
**Done when.** Every view passes WCAG AA in paper mode (check the red-on-paper labels —
use `--red-deep` for small text there).

### 3.5 Performance pass
**What.** Lighthouse ≥ 95 performance on mobile with everything on.
**How.** Preload the portrait (`<link rel="preload" as="image">` via `priority` — verify
it's emitted); lazy-`import()` gsap plugins, anime.js and the fluid sim after `ready`;
`requestIdleCallback` for the particle constellation; cap the ink/fluid canvas DPR at 1.5;
`content-visibility: auto` on `.section` blocks below the fold; subset the three fonts to
latin; ensure no `will-change` on more than ~20 elements at once (audit the `.h-letter > i`
set — remove `will-change` after the entrance completes).

### 3.6 Print stylesheet = résumé
**What.** `⌘P` on any view prints a one-page résumé: name, contact, the skills index,
the timeline, the three projects — mono labels, paper white, red rules. Also reachable
as `?print`.
**How.** `@media print` block at the end of `portfolio.css`: hide chrome/eggs/canvases,
`display: block` all views, reorder with `order` in a flex column, page-break rules.

### 3.7 Open Graph card + favicon set
**What.** A 1200×630 OG image in the site's look (ink, the name at display scale, red
rule, "The Archive — Portfolio 2026") at `public/og.png`; Twitter card meta; a proper
`favicon.svg` + `apple-touch-icon.png` (the PG mark, square, no radius).
**How.** Generate the PNG once with Playwright from a local HTML file (`scripts/og.html`);
add `openGraph` and `twitter` to `metadata` in `app/layout.tsx`.

### 3.8 A 404 that belongs to the archive
**What.** `app/not-found.tsx`: "404 — NOT FILED", the DVD logo bouncing behind it, a
mono line "the page you wanted was never in this archive", one button home. Also handles
GitHub Pages' `404.html` (static export writes it).

### 3.9 Sound, opt-in
**What.** A footer toggle "sound: off". When on: a 40ms click (synthesised with
`OscillatorNode`, square wave, 1.2kHz → 200Hz sweep) on button press, a 90ms filtered
noise "stamp" on the slat transition, a barely audible sub-hum that rises while the
pointer is over the hero title. Nothing plays before the first user gesture.
**How.** `lib/sound.ts` with one `AudioContext` created lazily; volume 0.08 max;
persist the toggle; never on touch devices' first load.

### 3.10 Copy pass (specific rewrites, keep the voice: dry, first person, no hype)
- Hero sub: keep the typewriter; change the frame to
  "Second-year CS at DU. I build **web experiences / data crunchers / ideas into code** — mostly after midnight."
- Section metas: "Three things, mostly" → "Three things, mostly. In that order."; "The trophy shelf" → "The shelf. Empty is honest."
- Outro: "Got an idea, an internship, or just want to talk code? The inbox is open." → "Have a problem that needs a night owl? The inbox is open — and the reply is usually faster than my sleep schedule."
- Contact colophon "Replies in: A day or two, usually" → "Replies in: a day. Two if the bug won."
- Achievements empty state: add a second line "Currently applying to: everything interesting."
- Footer hint: `press R anywhere… if you're curious` → `press R. no reason.`
- Toasts: read every string in `hooks/use-eggs.ts`, `components/sections/hero.tsx`, `footer.tsx` and cut any that explain the joke.

### 3.11 A11y audit items
Skip link to `main`; `aria-live="polite"` on `.toast`; the slats' `aria-hidden` is
right but focus must move to the new view's `h2` after a transition; `.cursor` root gets
`inert`; every `data-cursor` label element keeps its own accessible name; the marquee
gets `aria-hidden` (it does) but the tech list must exist once in readable form (add a
visually-hidden `<ul>`); form fields get `autocomplete`; reduced motion turns the fluid
sim, letters physics and sound off.

### 3.12 Real Achievements data
Ask the owner for entries (title, issuer, year, image). Until then, add one honest row:
"Vice President, Byte Club — 2024–2025" as `kind: "role"` so the ruled rows render.

### 3.13 Grain v2
Replace the SVG-turbulence `.noise` layer (a 200%-size fixed element animated with
`steps(10)`) with a 128×128 tiled canvas re-seeded each frame at 12fps, `mix-blend-mode:
overlay`, opacity 0.06. Cheaper and it doesn't repeat.

---

## 4. Easter eggs — new, and upgrades to the existing ones

The rule for eggs: each one is discoverable by a *kind* of person (a coder, a cinephile,
a keyboard user, someone who reads footers), rewards them in under two seconds, never
blocks the site, and is reversible. Track found eggs in `localStorage` (`pg-eggs`) so
the command palette can show "7 / 26 found" — that number itself is the meta-egg.

### 4.1 New
1. **`theme`** typed → paper mode flips (see 3.4) with the circular reveal from the last click.
2. **`hire`** typed → jumps to contact, pre-fills "I want to hire you because " with the typewriter, confetti in red squares only.
3. **`chai`** typed → the readout swaps to a 5-minute countdown "chai break", the marquee crawls at 10%, the eyebrow says "brb". Any key ends it.
4. **`rm -rf`** typed → a mono terminal line at the bottom "deleting archive… 34%… 78%…", every section shakes, at 99% "permission denied. nice try." and everything snaps back.
5. **`iddqd`** typed → "god mode": every hover state on the page turns on at once for 4s (add `body.is-god` that forces `:hover` rules via a duplicated selector list).
6. **Konami improvement** → before scanlines, a 1.2s boot sequence in the corner: "PG-DOS 2.6 / 640K OK / loading archive.sys" in green mono, then the flicker starts.
7. **Long-press the red dot after GARG** → the dot detaches and rolls (physics from 2.4) down the page into the marquee, where it becomes the separator between two words. Reload restores it.
8. **Select all (`⌘A`)** → selection colour goes paper-on-red and a toast "reading everything? respect." — once per session.
9. **`⌘P` / print** → the résumé stylesheet (3.6) — the egg is that printing works at all.
10. **Visiting between 01:00 and 05:00 local time** → eyebrow line "you too, huh?", the night-owl entry in "Beyond the code" gets a red rule, readout shows the hour.
11. **Shake on mobile** (`devicemotion` > 18 m/s²) → hero letters fall and pile at the bottom of the hero (2.4), tap to reset.
12. **Click the readout percentage 5×** → a receipt prints: pixels scrolled this session, views visited, eggs found, "time on site", with a barcode (2.8's helper).
13. **Hover the ∞ stat for 3 seconds** → it rotates 90° into an 8, toast "close enough".
14. **Drag a bento cell out of the grid** → it snaps back with a red "FILED" stamp slam.
15. **`?ref=linkedin` / `?ref=github` in the URL** → eyebrow greets the source ("hi, linkedin"), and contact's chips reorder to "internship" first.
16. **Type your own name?** No — but typing **`who`** → a toast with the visitor's browser, OS and local time in mono, "that's all I know. promise."
17. **Console API** → `pg.help()` lists `pg.cozy() pg.crt() pg.paper() pg.grid() pg.eggs() pg.stats()`; calling `pg.secret()` prints the first letter of every hidden word.
18. **Clicking the logo 7 times** → the year in "Portfolio — 2026" counts down to the site's first commit date and back.
19. **Idle 2 minutes** (after DVD) → the screensaver alternates every 30s between the DVD logo and a slow starfield made of the marquee words in mono.
20. **Birthday** (owner to set the date in `lib/data.ts`) → red-square confetti on load, eyebrow "it's my birthday, apparently", once per year per browser.

### 4.2 Upgrades to existing eggs
- **Typing game (`?play`)** → local leaderboard with 3-letter initials (brutalist arcade table), lines include one real line from this site's own source, a "share" that copies "I typed 87 wpm on pratyushgarg.dev" to the clipboard.
- **Bubble wrap** → pop all 16 within 5s = "speedrun" toast and the plate turns paper with red bubbles for the next round; a per-session best time in the label.
- **"do not click this"** → the 10th click opens a brutalist fake dialog: "Are you sure? [yes] [also yes]" — both close it with a different toast.
- **Bottom secret** → add a red "READ 100%" stamp that slams next to the line the first time it's revealed.
- **Guitar string** → plucking plays a real note (Web Audio, sound opt-in from 3.9), pitch from pluck position, and the music-note glyphs become tiny red squares (no glyphs that look like emoji).
- **Photo flip** → the back gains a "last watched" line pulled from Letterboxd RSS at build time (a script writes `lib/letterboxd.json`), with the film title in serif italic.
- **DVD screensaver** → count corner hits in `localStorage`; a corner hit fires confetti and a toast "corner. {n} total."; the logo's colour cycles through the site's palette only (paper, red, red-2, red-deep) — no rainbow.
- **Matrix rain (`pratyush`)** → the glyph set is the site's own words and the visitor's name if they typed `who` before; ends with the letters forming "PG" in the centre for 600ms.
- **Cozy mode (`patty`)** → add a lamp: a warm radial that follows the pointer at 40% opacity, and the shader slows to half speed. Keep the emoji drift (the one allowed exception).
- **`sudo`** → gold cursor stays, and for 4s every `data-cursor` label reads "root".
- **R for résumé** → the résumé opens in the in-site preview window (`openPreview`) instead of a new tab, with a "download" button in the bar.

---

## 5. Suggested order

1. Scroll performance is fixed (done: per-frame transform is written to the view, not a
   custom property on `<html>`; Lenis lerp 0.14). Re-verify after every Tier S item.
2. Tier S in this order: 1.6 rail (cheap, changes how the whole page feels) → 1.1 portrait
   shader → 1.2 fluid → 1.5 image trail → 1.3 name→marquee → 1.4 pinned chapter.
3. Tier B 3.1 (URLs) and 3.2 (cursor) early — they are correctness, not flair.
4. Tier A in any order; 2.9 palette before the eggs, since the eggs report into it.
5. Eggs last, in batches of five, each batch behind a build + console check.

Ship each item as its own commit with a one-line message in the site's voice
("The portrait is a shader now", "The name flies into the marquee").
