"use client";

import { useEffect } from "react";
import type Lenis from "lenis";
import type { View } from "@/lib/data";
import { Flip, gsap, ScrollTrigger, getLenis, startLenis } from "@/lib/scroll";
import { prefersReducedMotion, splitWords } from "@/lib/fx";

const $$ = <T extends Element = HTMLElement>(s: string, c: ParentNode = document) =>
  Array.from(c.querySelectorAll<T>(s));

/** How far a doubled marquee track travels before it repeats.
 *
 *  Not `scrollWidth / 2`: the track is a flex row with a gap, and `scrollWidth`
 *  has no trailing gap after the last item — so the naive half is short by half
 *  a gap, and the band jumps back by that much on every cycle. */
const repeatWidth = (track: HTMLElement) =>
  (track.scrollWidth + (parseFloat(getComputedStyle(track).columnGap) || 0)) / 2;

/**
 * One edge of ink travelling through a paragraph.
 *
 * The words are laid end to end in reading order — each line's own width added
 * to the ones above it — and the scroll drives a single head along that path.
 * A word behind the head is inked, one ahead of it is not, and the one the head
 * is crossing carries the edge itself, so the fill is continuous rather than
 * stepped word by word.
 *
 * Geometry comes from layout offsets rather than rects: the paragraph may be
 * carrying a parallax transform, and offsets are the one measure that ignores
 * it. Only the words whose fill actually changed are written, which on any
 * given frame is the one or two under the head.
 */
const inkFill = (el: HTMLElement) => {
  const words = splitWords(el);
  if (!words.length) return;

  let starts: number[] = [];
  let widths: number[] = [];
  let total = 1;
  const last: number[] = new Array(words.length).fill(-1);

  const measure = () => {
    const geo = words.map((w) => ({ t: w.offsetTop, l: w.offsetLeft, w: w.offsetWidth }));
    // reading order, and a new line wherever the top steps down
    const order = geo.map((_, i) => i).sort((a, b) => geo[a].t - geo[b].t || geo[a].l - geo[b].l);
    starts = new Array(words.length).fill(0);
    widths = geo.map((g) => g.w || 1);
    let cum = 0;
    for (let i = 0; i < order.length; ) {
      const top = geo[order[i]].t;
      let j = i;
      while (j < order.length && geo[order[j]].t - top < 4) j++;
      const line = order.slice(i, j);
      const left = Math.min(...line.map((k) => geo[k].l));
      let right = left;
      for (const k of line) {
        starts[k] = cum + (geo[k].l - left);
        right = Math.max(right, geo[k].l + geo[k].w);
      }
      cum += right - left;
      i = j;
    }
    total = cum || 1;
    last.fill(-1);
  };

  const state = { p: 0 };
  const paint = () => {
    const head = state.p * total;
    for (let i = 0; i < words.length; i++) {
      const v = Math.round(Math.max(0, Math.min(1, (head - starts[i]) / widths[i])) * 100);
      if (v === last[i]) continue;
      last[i] = v;
      words[i].style.setProperty("--fill", `${v}%`);
    }
  };

  measure();
  /* A paragraph that is already on screen when the view opens has no scroll
     above it to fill with — both ends of the trigger clamp to zero and the
     head never leaves the first word, so the lede of "About" simply sat there
     in half-tone waiting for a scroll that had already happened. If there is
     no runway, the paragraph is one you are reading now: it is inked. */
  if (el.getBoundingClientRect().top < innerHeight * 0.85) {
    state.p = 1;
    paint();
    return;
  }
  paint();
  gsap.to(state, {
    p: 1,
    ease: "none",
    onUpdate: paint,
    scrollTrigger: {
      trigger: el,
      // Both ends are clamped into the scroll, and the far one is a distance
      // rather than a second position: a paragraph already on screen when the
      // view opens has both positions behind it, and two clamped positions
      // collapse onto scroll 0 — a zero-length trigger that never moves.
      start: "clamp(top 88%)",
      end: "clamp(+=55%)",
      scrub: true,
      invalidateOnRefresh: true,
      onRefresh: measure,
    },
  });
};

/**
 * The scroll chrome that lives outside any one view: Lenis itself, the header
 * that ducks on the way down and returns on the way up, the red progress rule
 * under it, and the telemetry readout.
 */
export function useScrollChrome(ready: boolean) {
  useEffect(() => {
    if (!ready || prefersReducedMotion()) return;
    const lenis = startLenis();
    if (!lenis) return;

    const header = document.querySelector<HTMLElement>(".header");
    const rule = document.querySelector<HTMLElement>(".progress-rule");
    const val = document.querySelector<HTMLElement>(".readout-val");
    let hidden = false;

    const onScroll = (l: Lenis) => {
      const down = l.direction === 1 && l.scroll > 120;
      if (down !== hidden) {
        hidden = down;
        header?.classList.toggle("is-hidden", down);
      }
      if (rule) rule.style.transform = `scaleX(${l.progress})`;
      if (val) val.textContent = String(Math.round(l.progress * 100)).padStart(3, "0");
    };
    /* The velocity skew is gone. It wrote a skewY() onto the whole active view
       every frame from the scroll speed, which sheared every line of type on
       the page as you moved — the single loudest "interaction demo" signal
       here, a full-page repaint per frame, and the thing that made the site
       hardest to read once a reader had zoomed in. */

    lenis.on("scroll", onScroll);
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      lenis.off("scroll", onScroll);
      header?.classList.remove("is-hidden");
    };
  }, [ready]);
}

/**
 * Scroll-linked motion inside the active view, declared in the markup:
 *
 *   data-parallax="0.3"   moves against the scroll by 0.3 × 60vh across its
 *                         [data-scope] ancestor (negative lags behind)
 *   data-drift="-35"      slides horizontally from 10% to -35% of its width
 *   data-fade             fades to 20% as its scope leaves the top of the screen
 *   data-scrub-words      words resolve one by one as the reader reaches them
 *   data-rail             a rule that draws itself down its parent
 *   data-pass             gains .is-passed once the reader is past it
 *
 * Everything is scoped to the view and torn down when it goes, so the four
 * hidden views never own a trigger.
 */
export function useViewScrollFx(view: View, ready: boolean) {
  useEffect(() => {
    if (!ready || prefersReducedMotion()) return;
    const root = document.getElementById(`view-${view}`);
    if (!root) return;

    const scope = (el: Element) => el.closest("[data-scope]") ?? el;
    const across = (el: Element) => ({
      trigger: scope(el),
      start: "clamp(top bottom)",
      end: "clamp(bottom top)",
      scrub: true,
      invalidateOnRefresh: true,
    });

    const ctx = gsap.context(() => {
      for (const el of $$("[data-parallax]", root)) {
        const speed = parseFloat(el.dataset.parallax || "0.2");
        gsap.fromTo(
          el,
          { y: 0 },
          { y: () => -speed * innerHeight * 0.6, ease: "none", scrollTrigger: across(el) },
        );
      }
      for (const el of $$("[data-drift]", root)) {
        gsap.fromTo(
          el,
          // not a positive start: a track many times the width of the viewport
          // parks its left edge hundreds of pixels in, and the band arrives
          // with its left half empty
          { xPercent: -4 },
          { xPercent: parseFloat(el.dataset.drift || "-30"), ease: "none", scrollTrigger: across(el) },
        );
      }
      for (const el of $$("[data-fade]", root)) {
        gsap.to(el, {
          opacity: 0.2,
          ease: "none",
          scrollTrigger: { trigger: scope(el), start: "clamp(top top)", end: "bottom top", scrub: true },
        });
      }
      for (const el of $$("[data-scrub-words]", root)) {
        gsap.fromTo(
          splitWords(el),
          // 0.14 was a word you could see was there but could not read — the
          // effect was costing the reader the paragraph. It resolves from
          // half-tone to full now, which is the same gesture and still legible
          // at every point in it.
          { opacity: 0.55 },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.04,
            // clamp: a paragraph near the foot of the page must still be
            // able to finish resolving before the scroll runs out
            scrollTrigger: { trigger: el, start: "top 88%", end: "clamp(top 45%)", scrub: true },
          },
        );
      }
      for (const el of $$("[data-rail]", root)) {
        gsap.fromTo(
          el,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: { trigger: el.parentElement, start: "top 72%", end: "bottom 60%", scrub: true },
          },
        );
      }
      for (const el of $$("[data-ink]", root)) {
        inkFill(el);
      }
      // the line down the left rule: one draw across the whole view, from
      // the top of the page to where the footer takes over
      const line = $$(".view-line > i", root);
      if (line.length) {
        gsap.fromTo(
          line,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: true },
          },
        );
      }
      /* The field is the hero's atmosphere and nothing beyond it.
         `data-view` already drops it on the other four views, but the home
         view is four screens tall and the wash was following the reader all
         the way down — which turns the second plate into ambient glow across
         the whole page, the one thing the design contract rules out. It burns
         off with the hero and the paper goes back to being near-black. */
      const field = document.querySelector<HTMLElement>(".bg-shader");
      const heroEl = root.querySelector<HTMLElement>(".hero");
      if (field && heroEl) {
        gsap.fromTo(
          field,
          { opacity: 1 },
          {
            opacity: 0.16,
            ease: "none",
            scrollTrigger: { trigger: heroEl, start: "top top", end: "bottom top", scrub: true },
          },
        );
      }
      for (const el of $$("[data-pass]", root)) {
        // a latch, not a toggle: toggleClass ends at "bottom top", so anything
        // that scrolled off the top lost the class it had just earned
        ScrollTrigger.create({
          trigger: el,
          start: "top 62%",
          onEnter: () => el.classList.add("is-passed"),
          onLeaveBack: () => el.classList.remove("is-passed"),
        });
      }
    }, root);

    // the marquee runs on the scroll's own velocity: faster when you scroll
    // fast, backwards when you scroll up, barely moving when you stop
    const tracks = $$(".marquee-track", root);
    const pos = tracks.map(() => 0);
    let halves = tracks.map(repeatWidth);
    const measure = () => {
      halves = tracks.map(repeatWidth);
    };
    const tick = (_t: number, dt: number) => {
      const l = getLenis();
      const speed = 60 + Math.min(Math.abs(l?.velocity ?? 0) * 9, 900);
      // idle: the band gives up on the reader and drifts the other way for a
      // beat every eight seconds, then goes back to its own direction
      const idling = document.body.classList.contains("is-idle");
      const dir = (l?.direction || 1) * (idling && (_t / 1000) % 8 > 6 ? -1 : 1);
      tracks.forEach((track, i) => {
        const half = halves[i];
        if (!half) return;
        const slow = track.parentElement?.matches(":hover") ? 0.22 : 1;
        const sign = (i % 2 ? 1 : -1) * dir;
        pos[i] = (pos[i] + (sign * speed * slow * dt) / 1000) % half;
        const x = pos[i] > 0 ? pos[i] - half : pos[i];
        track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      });
    };
    if (tracks.length) {
      gsap.ticker.add(tick);
      addEventListener("resize", measure);
    }

    // the view just became display:block — measure it once it has painted
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      cancelAnimationFrame(raf);
      ctx.revert();
      if (tracks.length) {
        gsap.ticker.remove(tick);
        removeEventListener("resize", measure);
        tracks.forEach((t) => (t.style.transform = ""));
      }
    };
  }, [view, ready]);
}

/**
 * The name becomes the marquee.
 *
 * As the hero leaves, the fifteen letters of "I'M PRATYUSH GARG" lift off their
 * lines, fly, and land on the fifteen empty slots at the head of the red band —
 * which then carries them along with everything else. Scroll back up and they
 * fly home.
 *
 * The geometry is measured once per refresh with GSAP's `Flip.fit`, and only
 * the two things that move afterwards are tracked per frame: the band's own
 * translation, and the parallax on the title's three lines. Neither costs a
 * layout read.
 */
export function useNameToMarquee(active: boolean) {
  useEffect(() => {
    if (!active || prefersReducedMotion()) return;
    /* Only where the composition it belongs to exists. Below the stack
       breakpoint the hero is a single column with the figure in a band of his
       own, and the flight path runs straight across the two calls to action —
       fifteen glyphs scattered over the buttons read as debris, not as a name
       taking off. The name stays where it is on a phone. */
    if (!matchMedia("(min-width: 46.0625em)").matches) return;
    const title = document.querySelector<HTMLElement>(".hero-title");
    const hero = document.querySelector<HTMLElement>(".hero");
    const track = document.querySelector<HTMLElement>(".marquee-track");
    if (!title || !hero || !track) return;

    const letters = $$(".h-letter > i", title);
    // the band is doubled for the loop, so only the first copy of each slot is
    // a landing site — the second is there to keep the two halves identical
    const slots = $$(".m-t", track).slice(0, letters.length);
    const lines = $$(".line", title);
    if (letters.length !== slots.length || !letters.length) return;

    type Fit = { x: number; y: number; scaleX: number; scaleY: number };
    let fits: Fit[] = [];
    let lineOf: number[] = [];
    let baseY: number[] = [];
    let trackX0 = 0;
    let half = 1;
    let ready = false;
    /** Whole band repeats already taken off the letters' travel. Only ever
     *  changed at the two ends of the flight — see `apply`. */
    let wrapK = 0;

    /** The inline transform the marquee driver wrote this frame — read from the
     *  attribute, never from getComputedStyle, so nothing is recalculated. */
    const trackX = () => Number(/translate3d\(([-\d.]+)px/.exec(track.style.transform)?.[1] ?? 0);
    const lineY = (i: number) => Number(gsap.getProperty(lines[i], "y")) || 0;

    const measure = () => {
      // Flip.fit reads boxes, so the letters have to be standing at home
      gsap.set(letters, { clearProps: "transform" });
      lineOf = letters.map((el) => lines.indexOf(el.closest(".line") as HTMLElement));
      baseY = lines.map((_, i) => lineY(i));
      trackX0 = trackX();
      half = repeatWidth(track) || 1;
      wrapK = 0;
      wasHome = false;
      wasFlying = false;
      // no `absolute` here: Flip applies position:absolute to the element as a
      // side effect even in getVars mode, and fifteen absolutely positioned
      // glyphs collapse their spans to nothing and stack on the line's origin
      fits = letters.map(
        (el, i) => Flip.fit(el, slots[i], { scale: true, getVars: true }) as Fit,
      );
      ready = fits.every((f) => f && isFinite(f.x) && isFinite(f.y));
      apply();
    };

    const state = { p: 0 };
    // 0.02 per letter, so the last one leaves a beat after the first
    const STAGGER = 0.02;
    const span = 1 - STAGGER * (letters.length - 1);

    let wasHome = false;
    let wasFlying = false;
    /** The grab physics' element: the span the glyph sits in. */
    const spans = letters.map((el) => el.parentElement as HTMLElement);
    const apply = () => {
      if (!ready) return;
      const p = state.p;
      /* The band repeats every half its width, so a letter that would travel a
         full repeat can continue on the next copy of its slot instead. That
         swap is only invisible at the two ends of the flight — landed, the two
         copies are the same glyph in the same place; home, nothing is drawn.
         Wrapping mid-air teleports the letter `half * p` pixels sideways, which
         is the glitch you get by scrolling up and down: the band reverses with
         you (see the marquee driver's `l.direction`), so its travel walks back
         and forth across one wrap boundary and crosses it again and again. */
      const raw = trackX() - trackX0;
      if (p < 0.0005 || p > 0.999) wrapK += Math.round((raw - wrapK) / half) * half;
      // at rest the letters are home and nothing needs writing — this runs on
      // every frame the home view is on screen, which is most of them
      if (p < 0.0005) {
        if (wasHome) return;
        wasHome = true;
        wasFlying = false;
        gsap.set(letters, { clearProps: "transform" });
        title.classList.remove("is-flying");
        return;
      }
      wasHome = false;
      if (!wasFlying) {
        wasFlying = true;
        /* A letter flung a moment ago is still springing home on its own
           transition, on the span that wraps the glyph the flight is about to
           drive. Left alone it takes off from wherever the spring had got to,
           which reads as one letter out of formation. Grabbed letters are
           somebody's hand — those are left where they are. */
        for (const el of spans) {
          if (el.classList.contains("is-grabbed")) continue;
          el.style.transition = "";
          el.style.transform = "";
        }
      }
      title.classList.add("is-flying");
      const dx = raw - wrapK;
      const drifts = lines.map((_, i) => lineY(i) - baseY[i]);

      letters.forEach((el, i) => {
        const f = fits[i];
        const t = Math.max(0, Math.min(1, (p - i * STAGGER) / span));
        const drift = drifts[lineOf[i]];
        // the stagger belongs to the flight itself. The band's travel and the
        // title's parallax are the page moving underneath all fifteen at once,
        // so they carry the shared progress — stagger them and the name splays
        // apart in mid-air instead of flying as a name.
        gsap.set(el, {
          x: f.x * t + dx * p,
          y: f.y * t - drift * p,
          scaleX: 1 + (f.scaleX - 1) * t,
          scaleY: 1 + (f.scaleY - 1) * t,
          force3D: true,
        });
      });
    };

    const tween = gsap.to(state, {
      p: 1,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "40% top",
        end: "bottom top",
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    });

    gsap.ticker.add(apply);
    ScrollTrigger.addEventListener("refresh", measure);
    const raf = requestAnimationFrame(measure);

    return () => {
      cancelAnimationFrame(raf);
      gsap.ticker.remove(apply);
      ScrollTrigger.removeEventListener("refresh", measure);
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(letters, { clearProps: "transform" });
      title.classList.remove("is-flying");
    };
  }, [active]);
}
