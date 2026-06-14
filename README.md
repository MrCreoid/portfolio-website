# Pratyush Garg — Portfolio

A dark, violet, animation-obsessed portfolio. Hand-written **HTML, CSS and vanilla JavaScript** — no frameworks, no build step. It behaves like a single-page app (YouTube-style: the URL never changes), with five views: **Home · About · Projects · Achievements · Contact**.

🔗 Live at **[pratyushgarg.xyz](https://pratyushgarg.xyz)**

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
js/script.js      router, canvas and interactions
assets/           photo.jpg, resume.pdf, certificate-1.jpg go here
```

## Personalizing

Search `index.html` for `▼` — every editable spot is marked:

- **Email** — `data-email` on the contact page (also used by the copy button + form)
- **GitHub / LinkedIn / Letterboxd** URLs
- **Journey timeline** — duplicate a `tl-item` block per milestone
- **Bento projects** — duplicate a `b-cell`; set `data-url` to the live site (powers the preview window), `data-cat` for the filter chips, and the repo link
- **GitHub cell** — put your real handle + profile URL
- **Achievements** — certificate title/issuer/year; drop `certificate-1.jpg` in `assets/` and clicking the card opens it in the lightbox

Files to drop into `assets/`: `photo.jpg` (4:5 portrait), `resume.pdf`, `certificate-1.jpg`.

> Tip: the site is full of little hidden surprises. Half the fun is finding them. 🙂

---

Designed & built by **Pratyush Garg** · 2026 — B.Tech CS, Faculty of Technology, DU.
*Current status: genuinely figuring it out.*
