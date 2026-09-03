"use client";

import { useRef, useState } from "react";
import { BEYOND, CHIPS, FLIP_FACTS, LINKS, SKILLS, TIMELINE } from "@/lib/data";
import { Paperclip } from "lucide-react";
import { asset } from "@/lib/utils";
import { useGuitarString } from "@/hooks/use-toys";
import { FallbackImage } from "@/components/ui/fallback-image";
import { SectionHead } from "@/components/layout/section-head";

/** Click the photo and the card turns over on its vertical axis. */
function PhotoCard() {
  const [showBack, setShowBack] = useState(false);
  // no photo dropped in yet -> stop rendering the <img> so the PG initials show
  // instead of the browser's broken-image alt text
  const [hasPhoto, setHasPhoto] = useState(true);

  return (
    <div className="about-photo-col" data-reveal>
      {/* sneaky résumé #2: the paperclip. It lives outside the frame because
          the frame clips its own overflow for the flip, and a paperclip that
          does not hang over the edge is not reading as a paperclip. */}
      <a
        className="paperclip"
        href={LINKS.resume}
        target="_blank"
        rel="noopener"
        data-cursor
        aria-label="Open résumé"
      >
        <Paperclip size={26} strokeWidth={1.6} aria-hidden="true" />
        <span className="paperclip-tip">there&apos;s a résumé attached</span>
      </a>

      <div
        className={`photo-frame tilt${showBack ? " show-back" : ""}`}
        onClick={() => setShowBack((b) => !b)}
        data-cursor="flip"
      >
        <div className="flipper">
          <div className="flip-front">
            {/* ▼ drop your photo at public/assets/photo.jpeg */}
            <div className="photo-fallback">PG</div>
            {hasPhoto && (
              <FallbackImage
                src={asset("/assets/photo.jpeg")}
                alt="Pratyush Garg"
                className="photo-img"
                onMissing={() => setHasPhoto(false)}
              />
            )}
            <span className="flip-hint">↻ flip me</span>
          </div>

          <div className="flip-back">
            <h4>The other side</h4>
            <ul>
              <li>{FLIP_FACTS[0]}</li>
              <li>
                <a
                  className="lb-link"
                  href={LINKS.letterboxd}
                  target="_blank"
                  rel="noopener"
                  data-cursor
                  onClick={(e) => e.stopPropagation()}
                >
                  letterboxd · @MrCreoid&nbsp;↗
                </a>
              </li>
              {FLIP_FACTS.slice(1).map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <span className="flip-hint">↻ spin back</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function GuitarString() {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  useGuitarString(boxRef, pathRef);

  return (
    <div className="string-box" ref={boxRef} data-reveal data-cursor="pluck" aria-hidden="true">
      <svg viewBox="0 0 1000 90" preserveAspectRatio="none">
        <path ref={pathRef} d="M 0 45 Q 500 45 1000 45" fill="none" />
      </svg>
      <span className="string-label">this string is real. pluck it</span>
    </div>
  );
}

export function About() {
  return (
    <div className="container section-top">
      <SectionHead title="About" meta="Who is writing this" />

      <div className="about-grid">
        <div className="about-text-col">
          <p className="about-lede" data-reveal data-ink>
            Hey, I&apos;m <strong>Pratyush</strong>, a Computer Science undergrad at
            the <strong>Faculty of Technology, Delhi University</strong>.
          </p>
          <p data-reveal data-scrub-words>
            I&apos;ve just finished my first year of B.Tech and start my second this
            August. Coding was a habit well before it showed up on a timetable, and
            college hasn&apos;t managed to make it feel like homework.
          </p>
          <p data-reveal data-scrub-words>
            These days the time goes three ways: building for the web, crunching data
            in Python, and wrestling with C. I enjoy all three fights.
          </p>
          <ul className="chips" data-reveal>
            {CHIPS.map((c) => (
              <li className="chip" key={c} data-scramble>
                {c}
              </li>
            ))}
          </ul>
        </div>

        <PhotoCard />
      </div>

      <SectionHead title="Journey" variant="margin" meta="So far" />
      <div className="timeline">
        <span className="tl-rail" data-rail aria-hidden="true" />
        {TIMELINE.map((stop) => (
          <div className="tl-item" key={stop.title} data-reveal="wipe" data-pass>
            <span className="tl-dot" aria-hidden="true" />
            <span className="tl-date" data-scramble>
              {stop.date}
            </span>
            <div className="tl-card">
              <h3>{stop.title}</h3>
              <p>{stop.body}</p>
            </div>
          </div>
        ))}
      </div>

      <GuitarString />

      <SectionHead title="Skills" variant="light" meta="What I work in" />

      {/* the index: numeral, entry, one line of what it means, a standing */}
      <ol className="skills">
        {SKILLS.map((skill, i) => (
          <li className="skill" data-reveal="wipe" key={skill.name}>
            <span className="skill-no">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="skill-name">{skill.name}</h3>
            <p className="skill-note">{skill.note}</p>
            <span className="skill-status" data-scramble>
              {skill.status}
            </span>
          </li>
        ))}
      </ol>

      <SectionHead title="Beyond the code" meta="Off the clock" />
      <div className="cols-3 is-ruled" data-scope>
        {BEYOND.map((card, i) => (
          <article className="col-item" data-reveal="wipe" key={card.title}>
            <span className="col-ghost" data-parallax={String(0.05 + i * 0.04)} aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="col-head">
              <span className="col-index">{String(i + 1).padStart(2, "0")}</span>
              <card.icon
                className="col-mark"
                size={18}
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </span>
            <h3>{card.title}</h3>
            <p>
              {card.body}
              {card.link && (
                <a
                  className="lb-link"
                  href={card.link.href}
                  target="_blank"
                  rel="noopener"
                  data-cursor
                >
                  {card.link.label}
                </a>
              )}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
