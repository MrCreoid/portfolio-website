# Pratyush Garg — Portfolio

A dark, violet, animation-obsessed portfolio. Hand-written **HTML, CSS and vanilla JavaScript** — no frameworks, no build step. It behaves like a single-page app (YouTube-style: the URL never changes), with five views: **Home · About · Projects · Achievements · Contact**.

## Running it

Any static server works:

```bash
python3 -m http.server 5173
# then open http://localhost:5173
```

(Opening `index.html` directly also works, but the project preview window needs a server.)

## Structure

```
index.html        all five views in one file
css/styles.css    every animation and style
js/script.js      router, canvas, physics, easter eggs
assets/           photo.jpg, resume.pdf, certificate-1.jpg go here
```

---

## 🥚 The Easter Eggs

This site has layers. Here is the complete map — reading further spoils the fun.

### Typed anywhere on the page

| Type | What happens |
|---|---|
| `pratyush` | Purple **Matrix rain** takes over the screen for a few seconds, then dissolves. *"wake up, neo 🐇"* |
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
| Opening the browser console (F12) | A message for snoopers |
| Adding `?play` to the URL | A hidden **typing speed test** — code lines and movie quotes, live WPM + accuracy, best score saved |

### The sneaky résumé (3 ways)

1. **Home** — the full stop at the end of the hero paragraph is secretly a link (*"psst… my résumé"*)
2. **About** — the 📎 paperclip pinned to the photo
3. **Anywhere** — press the **R** key

### Toys (fiddle with everything)

| Where | Toy |
|---|---|
| Load | **The crystal forge** — on first visit, particles stream in and assemble the crystal, it ignites, and a shockwave reveals the site |
| Home | The **living amber crystal** — a glowing faceted gem rising from a rocky geode base, with an internal fire-line, rising embers, and a tiny secret violet gem hidden in the rocks. Hover to spin it up; a glow flows across it *from wherever your cursor touches*; hovering bends the background constellation into orbit around it (gravity well) |
| Home | **Charge the crystal** — click it repeatedly; a ring fills around it. **10 clicks = overcharge**: a screen-wide shockwave, a hidden star cracks out, and the crystal permanently changes color. Six hues to collect — amber → emerald → teal → sapphire → magenta → ruby — saved between visits |
| Home | After you **scroll down**, the crystal shrinks into the corner as a **companion orb** + back-to-top button |
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

## Personalizing

Search `index.html` for `▼` — every editable spot is marked:

- **Email** — `data-email` on the contact page (also used by the copy button + form)
- **GitHub / LinkedIn / Letterboxd** URLs
- **Journey timeline** — duplicate a `tl-item` block per milestone
- **Bento projects** — duplicate a `b-cell`; set `data-url` to the live site (powers the preview window), `data-cat` for the filter chips, and the repo link
- **GitHub cell** — put your real handle + profile URL
- **Achievements** — certificate title/issuer/year; drop `certificate-1.jpg` in `assets/` and clicking the card opens it in the lightbox

Files to drop into `assets/`: `photo.jpg` (4:5 portrait), `resume.pdf`, `certificate-1.jpg`.

---

Designed & built by **Pratyush Garg** · 2026 — B.Tech CS, Faculty of Technology, DU.
*Current status: genuinely figuring it out.*
