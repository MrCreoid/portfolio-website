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

/** Panel copy that types itself in as its panel arrives.
 *
 *  A tween rather than a timer loop so gsap.context() can revert it when the
 *  view unmounts mid-sentence. The paragraph's full height is measured and
 *  pinned before the first character is cleared — otherwise the panel would
 *  grow line by line and shove the title around as the sentence lands. */
const proxies = new WeakMap<Element, { n: number }>();
const typeIn = (p: HTMLElement) => {
  const full = (p.dataset.full ??= p.textContent ?? "");
  // measured from the full sentence every time, so a resize between passes
  // re-reserves at the new measure rather than holding the old one
  p.style.minHeight = "";
  p.textContent = full;
  p.style.minHeight = `${p.offsetHeight}px`;
  let o = proxies.get(p);
  if (o) gsap.killTweensOf(o);
  else proxies.set(p, (o = { n: 0 }));
  o.n = 0;
  p.textContent = "";
  gsap.to(o, {
    n: full.length,
    duration: full.length * 0.018,
    ease: "none",
    onUpdate: () => (p.textContent = full.slice(0, Math.round(o!.n))),
  });
};

/** The pinned horizontal chapter.
 *
 *  Only above 900px: below it the section stays the stacked grid it already is
 *  and nothing here mounts. The page is held for 250% of a viewport while the
 *  three panels travel one panel-width each, snapping to whole panels. */
const chapter = (root: HTMLElement, mm: gsap.MatchMedia) => {
  for (const el of $$("[data-chapter]", root)) {
    const panels = $$(".col-item", el);
    const count = el.querySelector<HTMLElement>(".chapter-count");
    const bar = el.querySelector<HTMLElement>(".chapter-bar > span");
    if (panels.length < 2) continue;
    const last = panels.length - 1;
    const total = String(panels.length).padStart(2, "0");

    mm.add("(min-width: 56.25em)", () => {
      let at = -1;
      const step = (i: number) => {
        if (i === at) return;
        at = i;
        if (count) count.textContent = `${String(i + 1).padStart(2, "0")} / ${total}`;
        const p = panels[i].querySelector<HTMLElement>("[data-type]");
        if (p) typeIn(p);
      };

      const tween = gsap.to(panels, {
        xPercent: -100 * last,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          pin: true,
          // not position:fixed — the active view carries a per-frame velocity
          // skew, and a transformed ancestor is what a fixed child is fixed to.
          // Transform pinning translates the element instead, which survives it.
          pinType: "transform",
          // not flush to the top edge — the section's own head stays in frame
          // above the pinned strip, so the chapter reads as part of the section
          start: "top 18%",
          // anticipatePin: the pin is applied a frame early, so a fast flick
          // does not paint one frame of the unpinned position on the way in
          anticipatePin: 1,
          scrub: 1,
          end: "+=250%",
          snap: { snapTo: 1 / last, duration: 0.3, ease: "power2.inOut" },
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (bar) bar.style.transform = `scaleX(${self.progress.toFixed(3)})`;
            step(Math.round(self.progress * last));
          },
        },
      });

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        for (const p of $$<HTMLElement>("[data-type]", el)) {
          p.style.minHeight = "";
          if (p.dataset.full) p.textContent = p.dataset.full;
        }
      };
    });
  }
};

/**
 * The scroll chrome that lives outside any one view: Lenis itself, the header
 * that ducks on the way down and returns on the way up, the red progress rule
 * under it, the telemetry readout, and the velocity skew — the page shears
 * with the speed of the scroll and settles when it stops.
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
    let target = 0;
    let skew = 0;

    const onScroll = (l: Lenis) => {
      const down = l.direction === 1 && l.scroll > 120;
      if (down !== hidden) {
        hidden = down;
        header?.classList.toggle("is-hidden", down);
      }
      if (rule) rule.style.transform = `scaleX(${l.progress})`;
      if (val) val.textContent = String(Math.round(l.progress * 100)).padStart(3, "0");
      target = Math.max(-2.5, Math.min(2.5, l.velocity * 0.04));
    };
    // written straight onto the active view's transform: a custom property on
    // <html> invalidated every element's style once per frame
    const tick = () => {
      skew += (target - skew) * 0.2;
      target *= 0.85;
      if (Math.abs(skew) < 0.002 && target === 0) return;
      const view = document.querySelector<HTMLElement>(".view.is-active");
      if (view) view.style.transform = `skewY(${skew.toFixed(3)}deg)`;
    };

    lenis.on("scroll", onScroll);
    gsap.ticker.add(tick);
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(tick);
      document.querySelector<HTMLElement>(".view.is-active")?.style.removeProperty("transform");
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
          { xPercent: 10 },
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
          { opacity: 0.14 },
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
      for (const el of $$("[data-pass]", root)) {
        ScrollTrigger.create({ trigger: el, start: "top 62%", toggleClass: "is-passed" });
      }
    }, root);

    const mm = gsap.matchMedia();
    chapter(root, mm);

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
      const dir = l?.direction || 1;
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
      mm.revert();
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
      wasHome = false;
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
    const apply = () => {
      if (!ready) return;
      const p = state.p;
      // at rest the letters are home and nothing needs writing — this runs on
      // every frame the home view is on screen, which is most of them
      if (p < 0.0005) {
        if (wasHome) return;
        wasHome = true;
        gsap.set(letters, { clearProps: "transform" });
        title.classList.remove("is-flying");
        return;
      }
      wasHome = false;
      title.classList.add("is-flying");
      // the band repeats every half its width, so a landed letter that would
      // travel a full repeat simply continues on the next copy of its slot
      const raw = trackX() - trackX0;
      const dx = ((((raw + half / 2) % half) + half) % half) - half / 2;
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
