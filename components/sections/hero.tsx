"use client";

import { Fragment, useRef, useState } from "react";
import { EYEBROW_LINES, LINKS, MARQUEE, STATS, WHAT_I_DO } from "@/lib/data";
import { confetti, floatBit, rand } from "@/lib/fx";
import { useEyebrowRotator, useGrabbableLetters, useTypewriter } from "@/hooks/use-toys";
import { usePortfolio } from "@/components/portfolio-provider";
import { useNavClick } from "@/components/layout/header";

/**
 * One <span> per character so each letter can be grabbed and flung.
 * The gradient doesn't paint on inline-block children, so `grad` is re-applied
 * per letter rather than inherited from the wrapper.
 */
function SplitText({ text, grad = false }: { text: string; grad?: boolean }) {
  return (
    <>
      {Array.from(text).map((ch, i) =>
        ch === " " ? (
          <Fragment key={i}> </Fragment>
        ) : (
          <span key={i} className={grad ? "h-letter grad" : "h-letter"}>
            {ch}
          </span>
        ),
      )}
    </>
  );
}

function Bubbles() {
  const { toast } = usePortfolio();
  const [popped, setPopped] = useState(0);
  const [state, setState] = useState<Record<number, "popped" | "reborn" | undefined>>({});

  const pop = (i: number) => (e: React.MouseEvent) => {
    if (state[i] === "popped") return;
    setState((s) => ({ ...s, [i]: "popped" }));
    setPopped((n) => {
      const next = n + 1;
      if (next % 25 === 0)
        toast(`${next} pops. your stress doesn't stand a chance 🫧`);
      return next;
    });
    floatBit(e.clientX, e.clientY - 10, "pop!");

    setTimeout(() => {
      setState((s) => ({ ...s, [i]: "reborn" }));
      setTimeout(() => setState((s) => ({ ...s, [i]: undefined })), 650);
    }, rand(3500, 7000));
  };

  return (
    <div className="container section bubble-section">
      <p className="bubble-label" data-reveal>
        stress-relief station{" "}
        <em>
          — free, unlimited refills · popped: <b>{popped}</b>
        </em>
      </p>
      <div className="bubbles" data-reveal aria-label="Bubble wrap. Pop them.">
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

    if (next === 5) toast("ok, you found the combo meter 👀");
    if (next === 10) {
      confetti(e.clientX, e.clientY, 26, cozy);
      toast("double digits! the crowd goes wild 🎬");
    }
    if (next === 15) {
      confetti(innerWidth / 2, innerHeight / 3, 60, cozy);
      toast("“To infinity… and beyond!” 🚀", 3600);
    }
    if (next === 25) toast("x25. legend. now go touch grass 🌱");
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
      <span key={pulse} className={`combo-badge${combo ? " is-on" : ""}`} aria-hidden="true">
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

  return (
    <>
      <div className="hero container">
        <p className="eyebrow" data-reveal>
          <span className="eyebrow-dot" />
          <span className="eyebrow-swap">
            <span ref={eyebrowRef}>{EYEBROW_LINES[0]}</span>
          </span>
        </p>

        <h1 className="hero-title">
          <span className="line" data-reveal>
            <SplitText text="I'm " />
            <span className="grad">
              <SplitText text="Pratyush" grad />
            </span>
          </span>
          <span className="line" data-reveal>
            <span className="grad">
              <SplitText text="Garg" grad />
            </span>
            <span className="hero-dot">.</span>
          </span>
        </h1>

        <p className="hero-sub" data-reveal>
          B.Tech CS student who turns curiosity into code — building&nbsp;
          <span className="type-wrap">
            <span ref={typeRef} />
            <span className="caret" />
          </span>
          <br />
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

        <div className="hero-cta" data-reveal>
          <button className="btn btn-primary magnetic" onClick={nav("contact")}>
            <span>Let&apos;s connect</span>
          </button>
          <button className="btn btn-ghost magnetic" onClick={nav("achievements")}>
            <span>See achievements</span>
          </button>
        </div>

        <button className="whisper-link" onClick={nav("about")} data-reveal>
          curious about the human behind the code?{" "}
          <span className="whisper-arrow">→</span>
        </button>

        <div className="scroll-hint" data-reveal aria-hidden="true">
          <span className="scroll-hint-track">
            <span className="scroll-hint-ball" />
          </span>
          <span className="scroll-hint-label">scroll</span>
        </div>
      </div>

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map((pass) =>
            MARQUEE.map((word) => (
              <Fragment key={`${pass}-${word}`}>
                <span>{word}</span>
                <i>✦</i>
              </Fragment>
            )),
          )}
        </div>
      </div>

      <div className="container section">
        <h2 className="section-title" data-reveal>
          <span className="section-num">01</span> What I do
        </h2>
        <div className="cards-3">
          {WHAT_I_DO.map((card) => (
            <article className="card tilt" data-reveal key={card.title}>
              <div className="card-icon">{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="container">
        <button className="teaser" onClick={nav("projects")} data-cursor data-reveal>
          <span className="teaser-left">
            <span className="b-kind">featured project</span>
            <span className="teaser-title">This portfolio</span>
            <span className="teaser-sub">hand-written, animated, full of secrets</span>
          </span>
          <span className="teaser-cta">
            see all projects <span className="whisper-arrow">→</span>
          </span>
        </button>
      </div>

      <div className="container section">
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
