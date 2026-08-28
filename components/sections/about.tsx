"use client";

import { useRef, useState } from "react";
import { BEYOND, CHIPS, FILMS, FLIP_FACTS, LINKS, TIMELINE } from "@/lib/data";
import { prefersReducedMotion } from "@/lib/fx";
import { useGuitarString } from "@/hooks/use-toys";
import { FallbackImage } from "@/components/ui/fallback-image";

/** Click the photo: a ring of light expands and the other face irises in. */
function PhotoCard() {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const frontRef = useRef<HTMLDivElement | null>(null);
  const backRef = useRef<HTMLDivElement | null>(null);
  const [showBack, setShowBack] = useState(false);
  // no photo dropped in yet -> stop rendering the <img> so the PG initials show
  // instead of the browser's broken-image alt text
  const [hasPhoto, setHasPhoto] = useState(true);
  const busy = useRef(false);

  const flip = (e: React.MouseEvent) => {
    const frame = frameRef.current;
    if (!frame || busy.current) return;
    busy.current = true;
    const toBack = !showBack;

    if (prefersReducedMotion()) {
      setShowBack(toBack);
      busy.current = false;
      return;
    }

    const incoming = (toBack ? backRef : frontRef).current;
    const r = frame.getBoundingClientRect();
    let cx = ((e.clientX - r.left) / r.width) * 100;
    let cy = ((e.clientY - r.top) / r.height) * 100;
    if (!isFinite(cx)) cx = 50;
    if (!isFinite(cy)) cy = 45;

    const ring = document.createElement("span");
    ring.className = "photo-ripple";
    ring.style.setProperty("--rx", cx + "%");
    ring.style.setProperty("--ry", cy + "%");
    frame.appendChild(ring);
    ring.animate(
      [
        { opacity: 0.95, transform: "translate(-50%,-50%) scale(0.15)" },
        { opacity: 0, transform: "translate(-50%,-50%) scale(30)" },
      ],
      { duration: 660, easing: "cubic-bezier(0.22,1,0.36,1)" },
    ).onfinish = () => ring.remove();

    if (!incoming) {
      setShowBack(toBack);
      busy.current = false;
      return;
    }
    incoming.style.zIndex = "6";
    incoming.animate(
      [
        { clipPath: `circle(0% at ${cx}% ${cy}%)` },
        { clipPath: `circle(150% at ${cx}% ${cy}%)` },
      ],
      { duration: 640, easing: "cubic-bezier(0.65,0,0.35,1)" },
    ).onfinish = () => {
      setShowBack(toBack);
      incoming.style.zIndex = "";
      busy.current = false;
    };
  };

  return (
    <div className="about-photo-col" data-reveal>
      <div
        className={`photo-frame${showBack ? " show-back" : ""}`}
        ref={frameRef}
        onClick={flip}
        data-cursor
      >
        {/* sneaky résumé #2: the paperclip */}
        <a
          className="paperclip"
          href={LINKS.resume}
          target="_blank"
          rel="noopener"
          data-cursor
          aria-label="Open résumé"
          onClick={(e) => e.stopPropagation()}
        >
          📎<span className="paperclip-tip">there&apos;s a résumé attached</span>
        </a>

        <div className="flipper">
          <div className="flip-front" ref={frontRef}>
            {/* ▼ drop your photo at public/assets/photo.jpg — initials show until you do */}
            <div className="photo-fallback">PG</div>
            {hasPhoto && (
              <FallbackImage
                src="/assets/photo.jpg"
                alt="Pratyush Garg"
                className="photo-img"
                onMissing={() => setHasPhoto(false)}
              />
            )}
            <span className="flip-hint">↻ flip me</span>
          </div>

          <div className="flip-back" ref={backRef}>
            <h4>the other side</h4>
            <ul>
              <li>
                {FLIP_FACTS[0].emoji} {FLIP_FACTS[0].text}
              </li>
              <li>
                🍿{" "}
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
                <li key={f.text}>
                  {f.emoji} {f.text}
                </li>
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
    <div className="string-box" ref={boxRef} data-reveal aria-hidden="true">
      <svg viewBox="0 0 1000 90" preserveAspectRatio="none">
        <path ref={pathRef} d="M 0 45 Q 500 45 1000 45" fill="none" />
      </svg>
      <span className="string-label">♪ this string is real — pluck it</span>
    </div>
  );
}

export function About() {
  return (
    <div className="container section-top">
      <h2 className="section-title" data-reveal>
        <span className="section-num">02</span> About me
      </h2>

      <div className="about-grid">
        <PhotoCard />

        <div className="about-text-col">
          <p className="about-lede" data-reveal>
            Hey, I&apos;m <strong>Pratyush</strong> — a Computer Science undergrad at
            the <strong>Faculty of Technology, Delhi University</strong>.
          </p>
          <p data-reveal>
            I&apos;ve just wrapped up my first year of B.Tech and I&apos;m heading into
            my second this August. Somewhere between my first{" "}
            <code>print(&quot;hello world&quot;)</code> and now, coding went from a
            subject to a genuine obsession.
          </p>
          <p data-reveal>
            These days I split my time between building things for the web, crunching
            data with Python, and wrestling with C — and honestly, I enjoy all three
            fights.
          </p>
          <div className="chips" data-reveal>
            {CHIPS.map((c) => (
              <span className="chip" key={c}>
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      <h2 className="section-title" data-reveal>
        <span className="section-num">03</span> Journey
      </h2>
      <div className="timeline" data-reveal>
        {TIMELINE.map((stop) => (
          <div className="tl-item" key={stop.title}>
            <span className="tl-dot" />
            <div className="tl-card">
              <span className="tl-date">{stop.date}</span>
              <h3>{stop.title}</h3>
              <p>
                {stop.code ? (
                  <>
                    First <code>{stop.code}</code> in a DU lab. No looking back since.
                  </>
                ) : (
                  stop.body
                )}
              </p>
            </div>
          </div>
        ))}
        <div className="tl-item tl-next">
          <span className="tl-dot" />
          <div className="tl-card">
            <span className="tl-date">soon</span>
            <h3>next stop — loading…</h3>
          </div>
        </div>
      </div>

      <GuitarString />

      <h2 className="section-title skills-title" data-reveal>
        <span className="section-num">04</span> Skills{" "}
        <span className="skills-note">— rated like films</span>
      </h2>
      <p className="film-note" data-reveal>
        proficiency, but make it letterboxd. every poster certified{" "}
        <b>RATED&nbsp;PG</b>.
      </p>

      <div className="filmography">
        {FILMS.map((film) => (
          <article className="film" data-reveal key={film.title}>
            <div className="film-poster">
              {film.posters.map((src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src} src={src} alt="" loading="lazy" />
              ))}
              <span className="pg-badge">RATED PG</span>
            </div>
            <div className="film-info">
              <h3>{film.title}</h3>
              <p className="film-review">{film.review}</p>
              <span className="film-tag">{film.tag}</span>
            </div>
          </article>
        ))}
      </div>

      <h2 className="section-title beyond-title" data-reveal>
        <span className="section-num">05</span> Beyond the code
      </h2>
      <div className="cards-3">
        {BEYOND.map((card) => (
          <article className="card tilt" data-reveal key={card.title}>
            <div className="card-icon">{card.icon}</div>
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
