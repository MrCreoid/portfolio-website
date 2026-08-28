# Pratyush Garg — Portfolio

A dark, ember-warm, animation-obsessed portfolio behind a live WebGL `GrainGradient`
shader background. **Next.js 16 · React 19 · TypeScript · Tailwind v4 · shadcn/ui**,
with the original hand-written stylesheet carried over intact. It behaves like a
single-page app (YouTube-style: the URL never changes), with five views:
**Home · About · Projects · Achievements · Contact**.

## Running it

```bash
npm install
npm run dev     # http://localhost:3000
```

```bash
npm run build && npm run start   # production
npm run lint
```

## Structure

```
app/
  layout.tsx          fonts (next/font), metadata, favicon
  page.tsx            renders <Portfolio />
  globals.css         tailwind + shadcn tokens, then imports the stylesheet below
styles/
  portfolio.css       the hand-written visual system — every animation and style
components/
  ui/                 shadcn's home + the shader background + <FallbackImage>
  portfolio.tsx       app shell: mounts every view, overlay and effect hook
  portfolio-provider.tsx   view routing, toasts, cozy/CRT modes, overlays
  layout/             header, mobile menu, footer, bottom-secret
  sections/           hero · about · projects · achievements · contact
  fx/                 ambient background, custom cursor, preloader
  overlays/           toast, wipe transition, preview window, lightbox, typing game
hooks/
  use-view-effects.ts reveals, count-ups, nav indicator, magnetic/tilt, bento glow
  use-ambient.ts      cursor trail, particle constellation, DVD idle, tab pout
  use-toys.ts         typewriter, eyebrow rotator, grabbable letters, guitar string
  use-eggs.ts         typed secrets, cozy mode, konami, console greeting
lib/
  data.ts             ALL editable content — projects, timeline, skills, links
  fx.ts               confetti, floaty bits, matrix rain, particle palette
public/assets/        photo.jpg, resume.pdf, certificate-1.jpg go here
legacy/               the original vanilla HTML/CSS/JS site, still runnable
```

### How the two stylesheets coexist

`app/globals.css` imports Tailwind, shadcn's theme, then `styles/portfolio.css`
**unlayered**, so the portfolio's rules win over `@layer base` defaults. Tailwind is
fully available for new work — the shader background is written with it.

One gotcha worth knowing: shadcn also defines `--accent` and `--muted` on `:root`.
`portfolio.css` therefore declares its tokens on `html:root` (specificity 0,1,1) so
they stay authoritative without being duplicated. Don't downgrade that selector.

### The background

`components/ui/paper-design-shader-background.tsx` is `@paper-design/shaders-react`'s
`GrainGradient`, verbatim. It's `absolute inset-0 -z-10`, so `.bg-shader` in
`portfolio.css` provides the fixed, full-viewport parent plus a CSS radial-gradient
fallback for when WebGL is unavailable. `.bg-scrim` above it keeps body copy legible.

## Personalizing

Almost everything lives in **`lib/data.ts`** — marked with `▼`:

- **Email** — `EMAIL` (copy button, mailto form and the email social link all read it)
- **GitHub / LinkedIn / Letterboxd** — `LINKS`
- **Journey timeline** — add an object to `TIMELINE`
- **Projects** — add an object to `PROJECTS`; `url` powers the in-site preview
  window, `cat` powers the filter chips, `repo` is the code link
- **Achievements** — `ACHIEVEMENTS`; set `image` and drop the file in
  `public/assets/` to make the card open in the lightbox
- **Skills** — `FILMS`

Files to drop into `public/assets/`: `photo.jpg` (4:5 portrait), `resume.pdf`,
`certificate-1.jpg`. Until they exist the cards fall back to initials and emoji.

---

## 🥚 The Easter Eggs

This site has layers. Here is the complete map — reading further spoils the fun.

### Typed anywhere on the page

| Type | What happens |
|---|---|
| `pratyush` | **Matrix rain** takes over the screen for a few seconds, then dissolves. *"wake up, neo 🐇"* |
| `patty` | **Cozy mode** — the whole site melts into warm amber, ☕🎬🎸 float up the screen. Only people who know me know this one. Type it again to leave. |
| `sudo` | *"ah, a person of culture. permissions granted."* — the cursor turns gold for a few seconds |
| `↑↑↓↓←→←→BA` (Konami code) | **CRT mode** — green phosphor terminal, scanlines, flicker — plus a Minecraft **"Achievement Get! How Did We Get Here?"** toast. Same code exits. |

### Found by accident

| Trigger | What happens |
|---|---|
| Idle for 60 seconds | **DVD screensaver** — the PG logo bounces around the dimmed screen, changing color on every wall hit |
| Switching browser tabs | The tab title pouts: *"👀 come back…"* → *"still here. waiting."* |
| Scrolling to the absolute bottom and lingering | A secret line fades in: *"you scrolled all the way down here. we should talk."* |
| The **"do not click this"** link in the footer | Escalating scoldings — *"you had ONE job."* — and confetti surrender on the 5th click |
| Opening the browser console | A message for snoopers |
| Adding `?play` to the URL | A hidden **typing speed test** — code lines and movie quotes, live WPM + accuracy, best score saved |

### The sneaky résumé (3 ways)

1. **Home** — the full stop at the end of the hero paragraph is secretly a link (*"psst… my résumé"*)
2. **About** — the 📎 paperclip pinned to the photo
3. **Anywhere** — press the **R** key

### Toys (fiddle with everything)

| Where | Toy |
|---|---|
| Load | **The ignition** — on first visit, particles stream in from the edges, assemble the mark, ignite, and a shockwave reveals the site |
| Home | **Grab and fling the letters** of the name — they spring back with physics |
| Home | **Bubble-wrap strip** below the stats — pop them, they regenerate, the counter remembers |
| Home | Click the **∞ curiosity stat** rapidly — combo meter with milestones at ×5, ×10 (confetti), ×15, ×25 |
| Everywhere | **Comet stardust trail** behind the cursor |
| About | Click the photo — an **iris of light** expands from where you click and wipes the other side in (cinephile facts + Letterboxd) |
| About | **Pluck the guitar string** above the skills — it vibrates and throws music notes |
| About | Click a **film poster** in the Skills filmography — the logos backflip |
| Projects | The bento cells **glow where your cursor is**; borders light up as you pass |
| Projects | **▶ preview** opens projects in a mini in-site browser window — the portfolio can preview *itself*, recursively |

---

## The old site

`legacy/` holds the original hand-written HTML/CSS/JS version this was ported from.
It still runs on its own:

```bash
cd legacy && python3 -m http.server 5173
```

Nothing in the app imports from it — it's there for reference and for rollback.

---

Designed & built by **Pratyush Garg** · 2026 — B.Tech CS, Faculty of Technology, DU.
*Current status: genuinely figuring it out.*
