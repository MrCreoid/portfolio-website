"use client";

import Image from "next/image";
import { Fragment, useRef, useState } from "react";
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
import { usePortfolio } from "@/components/portfolio-provider";
import { useNavClick } from "@/components/layout/header";
import { SectionHead } from "@/components/layout/section-head";

/**
 * One <span> per character so each letter can be grabbed and flung.
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
          <span key={i} className={accent ? "h-letter accent" : "h-letter"}>
            {ch}
          </span>
        ),
      )}
    </>
  );
}

/** One scrolling band. The list is doubled so the loop is seamless. */
function Band({ words }: { words: string[] }) {
  return (
    <div className="marquee">
      <div className="marquee-track">
        {[0, 1].map((pass) =>
          words.map((word) => (
            <Fragment key={`${pass}-${word}`}>
              <span>{word}</span>
              <i>/</i>
            </Fragment>
          )),
        )}
      </div>
    </div>
  );
}

function Bubbles() {
  const { toast } = usePortfolio();
  const [popped, setPopped] = useState(0);
  const [state, setState] = useState<
    Record<number, "popped" | "reborn" | undefined>
  >({});

  const pop = (i: number) => (e: React.MouseEvent) => {
    if (state[i] === "popped") return;
    setState((s) => ({ ...s, [i]: "popped" }));
    setPopped((n) => {
      const next = n + 1;
      if (next % 25 === 0)
        toast(`${next} pops. your stress doesn't stand a chance`);
      return next;
    });
    floatBit(e.clientX, e.clientY - 10, "pop!");

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
      <div className="bubble-plate" data-reveal>
        <p className="bubble-label">
          <span>Stress-relief station</span>
          <em>
            free, unlimited refills · popped: <b>{popped}</b>
          </em>
        </p>
        <div className="bubbles" aria-label="Bubble wrap. Pop them.">
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
      aria-label="Curiosity — try clicking it a lot"
    >
      <span className="stat-num">∞</span>
      <span className="stat-label">curiosity</span>
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
      <div className="hero container">
        <div className="hero-rail" data-reveal>
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            <span className="eyebrow-swap">
              <span ref={eyebrowRef}>{EYEBROW_LINES[0]}</span>
            </span>
          </p>
        </div>

        {/* the composition: a small "I'M", the given name full-bleed, the
            surname indented so the block reads as three staggered steps */}
        <h1 className="hero-title">
          <span className="line line-1" data-reveal>
            <SplitText text="I'm" />
          </span>
          <span className="line line-2" data-reveal>
            <SplitText text="Pratyush" />
          </span>
          <span className="line line-3" data-reveal>
            <SplitText text="Garg" accent />
            <span className="hero-dot">.</span>
          </span>
        </h1>

        <div className="hero-body">
          <p className="hero-sub" data-reveal>
            B.Tech CS student who turns curiosity into code — building{" "}
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
                <span>Let&apos;s connect</span>
                <span className="arrow" aria-hidden="true">
                  →
                </span>
              </button>
              <button className="btn magnetic" onClick={nav("projects")}>
                <span>See the work</span>
              </button>
            </div>

            <button className="whisper-link" onClick={nav("about")} data-reveal>
              {/* nbsp: the arrow must never orphan onto its own line when the
                  column gets tight */}
              curious about the human behind the code?&nbsp;
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
            <li key={c}>{c}</li>
          ))}
        </ul>

        {/* The figure stands in the right half and bleeds off the page edge;
            the surname crosses its shoulder, so the two read as one lockup
            rather than a photo parked beside some type. Last in the DOM so the
            shared reveal stagger lands it after the name rather than before. */}
        <div className="hero-portrait" data-reveal>
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
        </div>
      </div>

      {/* two bands running against each other */}
      <div className="marquee-block" aria-hidden="true">
        <Band words={MARQUEE} />
        <Band words={[...MARQUEE].reverse()} />
      </div>

      <div className="container section">
        <SectionHead title="What I do" meta="Three things, mostly" />
        <div className="cols-3 is-ruled">
          {WHAT_I_DO.map((card, i) => (
            <article className="col-item" data-reveal key={card.title}>
              <span className="col-head">
                <span className="col-index">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <card.icon
                  className="col-mark"
                  size={18}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </span>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="container section">
        <SectionHead title="Selected work" meta="2025 — 2026" />
        <ul className="work-index">
          {PROJECTS.map((project, i) => (
            <li key={project.id}>
              <button
                className="work-row"
                onClick={nav("projects")}
                data-cursor
                data-reveal
              >
                <span className="work-no">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="work-title">{project.title}</span>
                <span className="work-tags">{project.tags.join(" · ")}</span>
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
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
          <ComboStat />
        </div>
      </div>

      <Bubbles />
    </>
  );
}
