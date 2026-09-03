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
          <span key={i} className={accent ? "h-letter accent" : "h-letter"}>
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
      aria-label="Curiosity. Try clicking it a lot"
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
        </div>
      </div>

      {/* two bands running against each other */}
      <div className="marquee-block" aria-hidden="true">
        <Band words={MARQUEE} name />
        <Band words={[...MARQUEE].reverse()} />
      </div>

      <div className="container section" data-scope>
        <SectionHead title="What I do" meta="Three things, mostly" />
        {/* wide enough, this becomes a pinned chapter: the three fields slide
            past horizontally while the page holds still. Below 900px the pin
            never mounts and the same DOM is read as stacked cards. */}
        <div className="chapter" data-chapter>
          <div className="chapter-meta" aria-hidden="true">
            <span className="chapter-bar">
              <span />
            </span>
            <span className="chapter-count">
              01 / {String(WHAT_I_DO.length).padStart(2, "0")}
            </span>
          </div>
          <div className="cols-3 is-ruled">
            {WHAT_I_DO.map((card, i) => (
              <article className="col-item" data-reveal="wipe" key={card.title}>
                <span className="col-ghost" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
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
                <p data-type>{card.body}</p>
              </article>
            ))}
          </div>
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
                data-cursor="open"
                data-reveal="wipe"
                data-shot={asset(`/assets/shots/${project.id}.webp`)}
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

      {/* the sign-off: a line of outline type that slides across the page as
          you scroll through it, with the one filled word in red */}
      <div className="outro" data-scope aria-label="Let's build something together">
        <div className="outro-track" data-drift="-46" aria-hidden="true">
          {[0, 1].map((k) => (
            <span key={k}>
              Let&apos;s build <em>something</em> together&nbsp;—&nbsp;
            </span>
          ))}
        </div>
        <div className="container outro-cta">
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
    </>
  );
}
