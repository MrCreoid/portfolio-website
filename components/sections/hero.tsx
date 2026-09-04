"use client";

import Image from "next/image";
import { Fragment, useEffect, useRef, useState, type CSSProperties } from "react";
import {
  CHIPS,
  EYEBROW_LINES,
  LINKS,
  MARQUEE,
  PROJECTS,
  STATS,
  WHAT_I_DO,
} from "@/lib/data";
import { confetti, floatBit, rand } from "@/lib/fx";
import { asset } from "@/lib/utils";
import {
  useEyebrowRotator,
  useGrabbableLetters,
  usePortraitAlphaHover,
  useTypewriter,
} from "@/hooks/use-toys";
import { findEgg } from "@/lib/eggs";
import { useMounted } from "@/hooks/use-mounted";
import { PortraitType } from "@/components/fx/portrait-type";
import { PortraitGL } from "@/components/fx/portrait-gl";
import { usePortfolio } from "@/components/portfolio-provider";
import { Roll, useNavClick } from "@/components/layout/header";
import { SectionHead } from "@/components/layout/section-head";

/**
 * One <span> per character so each letter can be grabbed and flung; the
 * glyph itself sits in an inner <i> that the entrance and the hover ripple
 * animate, so the physics and the flourish never share a transform.
 * `accent` re-applies the red per letter — an inline-block child doesn't
 * inherit the colour trick the wrapper used to do with a gradient.
 */
function SplitText({
  text,
  accent = false,
}: {
  text: string;
  accent?: boolean;
}) {
  return (
    <>
      {Array.from(text).map((ch, i) =>
        ch === " " ? (
          <Fragment key={i}> </Fragment>
        ) : (
          <span
            key={i}
            className={accent ? "h-letter accent" : "h-letter"}
            style={{ "--wi": i } as CSSProperties}
          >
            <i>{ch}</i>
          </span>
        ),
      )}
    </>
  );
}

/** The name, as it reads once the hero letters have landed in the band. */
export const HERO_NAME = "I'M PRATYUSH GARG";

/** Fifteen empty slots at the head of the band — one per letter of the name.
 *  They hold the space and the type size; the letters themselves fly in from
 *  the hero and land on them. */
function NameSlots() {
  return (
    <span className="m-name" aria-hidden="true">
      {Array.from(HERO_NAME).map((ch, i) =>
        ch === " " ? (
          <Fragment key={i}> </Fragment>
        ) : (
          <span className="m-t" key={i}>
            {ch}
          </span>
        ),
      )}
    </span>
  );
}

/** One scrolling band. The list is doubled so the loop is seamless — which is
 *  also why the name slots are repeated: both halves must be identical. */
function Band({ words, name = false }: { words: string[]; name?: boolean }) {
  return (
    <div className="marquee">
      <div className="marquee-track">
        {[0, 1].map((pass) => (
          <Fragment key={pass}>
            {name && (
              <Fragment>
                <NameSlots />
                <i>/</i>
              </Fragment>
            )}
            {words.map((word) => (
              <Fragment key={`${pass}-${word}`}>
                <span>{word}</span>
                <i>/</i>
              </Fragment>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

const POPS_KEY = "pg-pops";

/**
 * The one tactile toy on the page, and the only one that keeps score.
 *
 * Two numbers: this sitting, and everything this browser has ever popped. The
 * lifetime figure is written back on a trailing timer rather than on every
 * pop — sixteen squares in a row is sixteen synchronous localStorage writes
 * otherwise, and the whole point of the thing is that it feels immediate.
 *
 * `postPop` is the single seam a shared, server-side count would go through.
 */
const readPops = () => {
  try {
    return Number(localStorage.getItem(POPS_KEY)) || 0;
  } catch {
    return 0;
  }
};

const postPop = (n: number) => {
  try {
    localStorage.setItem(POPS_KEY, String(n));
  } catch {
    /* private mode: the session count still works, the lifetime one does not */
  }
};

function Bubbles() {
  const { toast, cozy } = usePortfolio();
  const mounted = useMounted();
  const [popped, setPopped] = useState(0);
  const [state, setState] = useState<
    Record<number, "popped" | "reborn" | undefined>
  >({});
  const flush = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  /* The speedrun: all sixteen inside five seconds. `runStart` is the first pop
     of the current sheet, `live` the squares popped since. A sheet that beats
     the clock is reprinted the other way up — paper stock, red bubbles — for
     the next round, which is the only prize worth having. */
  const runStart = useRef(0);
  const live = useRef(0);
  const [best, setBest] = useState<number | null>(null);
  const [inverted, setInverted] = useState(false);

  /* The lifetime total this browser arrived with, read exactly once in a lazy
     initialiser. An effect that reads storage and calls setState is the
     cascading render the lint rule exists to stop; the display is gated on
     `mounted`, so the first client render still matches the server's. */
  const [base] = useState(() => (typeof window === "undefined" ? 0 : readPops()));
  const lifetime = base + popped;

  useEffect(() => () => clearTimeout(flush.current), []);

  const pop = (i: number) => (e: React.MouseEvent) => {
    if (state[i] === "popped") return;
    setState((s) => ({ ...s, [i]: "popped" }));
    // one write after the flurry stops, not one per square
    clearTimeout(flush.current);
    flush.current = setTimeout(() => postPop(base + popped + 1), 400);
    /* The count is derived here rather than inside the updater. React may
       replay an updater during render, and `findEgg` dispatches the event the
       footer's counter subscribes to — so the sixteenth pop was setting state
       on another component mid-render, which React rightly complains about. */
    const next = popped + 1;
    setPopped(next);
    if (next === 16) findEgg("bubbles");
    if (next % 25 === 0) toast(`${next} pops. your stress doesn't stand a chance`);
    floatBit(e.clientX, e.clientY - 10, "pop!");

    /* one sheet, sixteen squares, five seconds */
    const now = performance.now();
    if (!runStart.current || live.current >= 16) {
      runStart.current = now;
      live.current = 0;
    }
    live.current += 1;
    if (live.current === 16) {
      const secs = (now - runStart.current) / 1000;
      runStart.current = 0;
      if (secs <= 5) {
        setBest((b) => (b === null || secs < b ? secs : b));
        setInverted((v) => !v);
        confetti(e.clientX, e.clientY - 20, 40, cozy);
        toast(`speedrun. sixteen in ${secs.toFixed(2)}s — have a fresh sheet`, 4000);
      } else {
        setBest((b) => (b === null || secs < b ? secs : b));
      }
    }

    setTimeout(
      () => {
        setState((s) => ({ ...s, [i]: "reborn" }));
        setTimeout(() => setState((s) => ({ ...s, [i]: undefined })), 650);
      },
      rand(3500, 7000),
    );
  };

  return (
    <div className="container section bubble-section">
      {/* housed on a plate with its own rules, so it reads as a module of the
          archive rather than sixteen loose squares floating above the footer */}
      {/* The reprint is a data attribute, not a class. `useViewEnter` adds
          `is-in` to every [data-reveal] imperatively, and a React re-render
          that rewrites `className` wipes it — the plate then sits at opacity 0
          forever. Attributes React does not own are safe to sit beside it. */}
      <div className="bubble-plate" data-inverted={inverted || undefined} data-reveal>
        <p className="bubble-label">
          <span>Stress-relief station</span>
          <em>
            this sitting: <b>{popped}</b>
            {mounted && lifetime > popped && (
              <> · all time: <b>{lifetime}</b></>
            )}
            {best !== null && (
              <> · best sheet: <b>{best.toFixed(2)}s</b></>
            )}
          </em>
        </p>
        <div className="bubbles" aria-label="Bubble wrap. Pop them." data-cursor="pop">
          {Array.from({ length: 16 }, (_, i) => (
            <button
              key={i}
              className={`bubble${state[i] === "popped" ? " is-popped" : ""}${state[i] === "reborn" ? " is-reborn" : ""}`}
              aria-label="Pop"
              onClick={pop(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ComboStat() {
  const { toast, cozy } = usePortfolio();
  const [combo, setCombo] = useState(0);
  const [pulse, setPulse] = useState(0);
  const decay = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const click = (e: React.MouseEvent) => {
    const next = combo + 1;
    setCombo(next);
    setPulse((p) => p + 1);
    clearTimeout(decay.current);
    decay.current = setTimeout(() => setCombo(0), 900);

    floatBit(e.clientX + rand(-12, 12), e.clientY - 14, "+1");

    if (next === 5) toast("ok, you found the combo meter");
    if (next === 10) {
      confetti(e.clientX, e.clientY, 26, cozy);
      toast("double digits! the crowd goes wild");
    }
    if (next === 15) {
      confetti(innerWidth / 2, innerHeight / 3, 60, cozy);
      toast("“To infinity… and beyond!”", 3600);
    }
    if (next === 25) toast("x25. legend. now go touch grass");
  };

  return (
    <button
      className={`stat stat-combo${combo >= 5 ? " tier-1" : ""}${combo >= 10 ? " tier-2" : ""}`}
      onClick={click}
      data-cursor
      aria-label="Still learning. Try clicking it a lot"
    >
      <span className="stat-num">∞</span>
      <span className="stat-label">still learning</span>
      {/* keyed on the click count so the badge animation restarts every press */}
      <span
        key={pulse}
        className={`combo-badge${combo ? " is-on" : ""}`}
        aria-hidden="true"
      >
        {combo ? `x${combo}` : ""}
      </span>
    </button>
  );
}

export function Hero() {
  const typeRef = useRef<HTMLSpanElement | null>(null);
  const eyebrowRef = useRef<HTMLSpanElement | null>(null);
  const nav = useNavClick();

  useTypewriter(typeRef);
  useEyebrowRotator(eyebrowRef);
  useGrabbableLetters();
  usePortraitAlphaHover();

  return (
    <>
      <div className="hero container" data-scope>
        <div className="hero-rail" data-reveal data-parallax="0.06">
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            <span className="eyebrow-swap">
              <span ref={eyebrowRef}>{EYEBROW_LINES[0]}</span>
            </span>
          </p>
        </div>

        {/* the composition: a small "I'M", the given name full-bleed, the
            surname indented so the block reads as three staggered steps */}
        <h1 className="hero-title" data-cursor="blend" data-word="grab">
          <span className="line line-1" data-parallax="0.1">
            <SplitText text="I'm" />
          </span>
          <span className="line line-2" data-parallax="0.18">
            <SplitText text="Pratyush" />
          </span>
          <span className="line line-3" data-parallax="0.3">
            <SplitText text="Garg" accent />
            <span className="hero-dot">.</span>
          </span>
        </h1>

        <div className="hero-body" data-parallax="0.05">
          <p className="hero-sub" data-reveal>
            B.Tech CS student, building{" "}
            <span className="type-wrap">
              <span ref={typeRef} />
              <span className="caret" />
            </span>{" "}
            one late night at a time
            {/* sneaky résumé link: the full stop is the link */}
            <a
              className="secret-dot"
              href={LINKS.resume}
              target="_blank"
              rel="noopener"
              data-cursor
              aria-label="Open résumé"
            >
              <span className="secret-tip">psst… my résumé</span>.
            </a>
          </p>

          <div className="hero-aside">
            <div className="hero-cta" data-reveal>
              <button
                className="btn btn-primary magnetic"
                onClick={nav("contact")}
              >
                <Roll>Let&apos;s connect</Roll>
                <span className="arrow" aria-hidden="true">
                  →
                </span>
              </button>
              <button className="btn magnetic" onClick={nav("projects")}>
                <Roll>See the work</Roll>
              </button>
            </div>

            <button className="whisper-link" onClick={nav("about")} data-reveal>
              {/* nbsp: the arrow must never orphan onto its own line when the
                  column gets tight */}
              who writes all this, anyway?&nbsp;
              <span className="whisper-arrow">→</span>
            </button>

            <div className="scroll-hint" data-reveal aria-hidden="true">
              <span className="scroll-hint-track">
                <span className="scroll-hint-ball" />
              </span>
              <span className="scroll-hint-label">scroll</span>
            </div>
          </div>
        </div>

        <ul className="hero-facts" data-reveal>
          {CHIPS.map((c) => (
            <li key={c} data-scramble>
              {c}
            </li>
          ))}
        </ul>

        {/* The figure stands in the right half and bleeds off the page edge;
            the surname crosses its shoulder, so the two read as one lockup
            rather than a photo parked beside some type. Last in the DOM so the
            shared reveal stagger lands it after the name rather than before. */}
        <div className="hero-portrait" data-reveal data-parallax="-0.14">
          {/* one plate, desaturated in CSS — hover lets its own colour back in
              rather than crossfading a second copy of the same photograph */}
          <Image
            src={asset("/assets/portrait-color.webp")}
            alt="Pratyush Garg"
            width={1139}
            height={1182}
            sizes="(max-width: 900px) 80vw, 46vw"
            priority
          />
          {/* the misregistered plates: two more prints of the same photograph,
              one red and one cyan, that slide against the pointer while he is
              lit — the way a two-colour print goes off-register */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="portrait-ghost ghost-r" src={asset("/assets/portrait-color.webp")} alt="" aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="portrait-ghost ghost-c" src={asset("/assets/portrait-color.webp")} alt="" aria-hidden="true" />
          {/* and over all of it, the same photograph again as a shader */}
          <PortraitGL src={asset("/assets/portrait-color.webp")} />
          {/* which the type covers until you point at him */}
          <PortraitType />
        </div>
      </div>

      {/* two bands running against each other */}
      <div className="marquee-block" aria-hidden="true">
        <Band words={MARQUEE} name />
        <Band words={[...MARQUEE].reverse()} />
      </div>
      {/* the bands are decoration and are hidden from assistive tech, so the
          list they are made of has to exist somewhere it can be read */}
      <h2 className="vh">What I work in</h2>
      <ul className="vh">
        {MARQUEE.map((word) => (
          <li key={word}>{word}</li>
        ))}
      </ul>

      <div className="container section">
        <SectionHead title="What I do" meta="Three things, mostly. In that order." />
        {/* an index, not three pages: numeral, name, one line of what it
            means, the mark on the right — the same shape the skills and the
            work are set in, and all three readable without scrolling */}
        <ol className="wid">
          {WHAT_I_DO.map((card, i) => (
            <li className="wid-row" data-reveal="wipe" key={card.title}>
              <span className="wid-no">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="wid-name">{card.title}</h3>
              <p className="wid-note">{card.body}</p>
              <card.icon
                className="wid-mark"
                size={20}
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </li>
          ))}
        </ol>
      </div>

      <div className="container section">
        <SectionHead title="Selected work" meta="2025 — 2026" />
        <ul className="work-index">
          {PROJECTS.map((project, i) => (
            <li key={project.id}>
              <button
                className="work-row"
                onClick={nav("projects")}
                data-cursor="open"
                data-reveal="wipe"
                data-shot={
                  project.shot ? asset(`/assets/shots/${project.id}.webp`) : undefined
                }
              >
                <span className="work-no">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="work-title">{project.title}</span>
                <span className="work-tags" data-scramble>
                  {project.tags.join(" · ")}
                </span>
                <span className="work-go" aria-hidden="true">
                  →
                </span>
              </button>
            </li>
          ))}
        </ul>
        <button
          className="work-all"
          onClick={nav("projects")}
          data-cursor
          data-reveal
        >
          See all projects <span className="whisper-arrow">→</span>
        </button>
      </div>

      {/* the stats break the container and run edge to edge */}
      <div className="bleed section">
        <div className="stats" data-reveal>
          {STATS.map((s) => (
            <div className="stat" key={s.label}>
              <span className="stat-num">
                <span data-count={s.count}>0</span>
                {s.suffix}
              </span>
              <span className="stat-label" data-scramble>
                {s.label}
              </span>
            </div>
          ))}
          <ComboStat />
        </div>
      </div>

      <Bubbles />

      {/* the sign-off: one line, set solid and standing still. It used to be
          outlined type on a track that slid past as you scrolled, which is a
          wall rather than a sentence — you could not read it without waiting
          for it. */}
      <div className="outro">
        <div className="container">
          <div className="outro-head">
            <h2 className="outro-line" data-reveal>
              Let&apos;s Build Something <em>Useful</em>.
            </h2>
            {/* The end of a printed document is where it says how it was
                printed. It also fills the half of this line that was empty,
                and answers the question the stats row raises two screens
                up — 6,100 lines of what, exactly. */}
            <dl className="colophon" data-reveal>
              <div>
                <dt>Built with</dt>
                <dd>Next.js · TypeScript · GSAP · Lenis</dd>
              </div>
              <div>
                <dt>Set in</dt>
                <dd>Archivo · Instrument Serif · JetBrains Mono</dd>
              </div>
              <div>
                <dt>Styled in</dt>
                <dd>Hand-written CSS. No component kit.</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>
                  <a href={LINKS.github} target="_blank" rel="noopener" data-cursor>
                    {LINKS.githubHandle} ↗
                  </a>
                </dd>
              </div>
            </dl>
          </div>
          <div className="outro-cta">
            <p data-reveal data-ink>
              Got an idea, an internship, or a bug you want to argue about? The inbox
              is open, and replies are usually quick.
            </p>
            <button className="btn btn-primary magnetic" onClick={nav("contact")} data-reveal>
              <Roll>Say hello</Roll>
              <span className="arrow" aria-hidden="true">
                →
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
