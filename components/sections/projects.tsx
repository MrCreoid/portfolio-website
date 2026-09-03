"use client";

import { useEffect, useRef, useState } from "react";
import { LINKS, PROJECTS, type Project } from "@/lib/data";
import { usePortfolio } from "@/components/portfolio-provider";
import { SectionHead } from "@/components/layout/section-head";

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true">
      <path d="M8 5.14v13.72L19 12 8 5.14z" />
    </svg>
  );
}

export function GithubIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

/**
 * One bento cell. The featured project gets the tall box and a display-scale
 * title; the rest run at body scale — the grid is deliberately uneven so the
 * eye lands on the big cell first and reads the others as supporting work.
 *
 * There are no project screenshots in the repo, so the cells are typographic
 * rather than image-led.
 */
function ProjectCell({ project, index }: { project: Project; index: number }) {
  const { openPreview } = usePortfolio();

  return (
    <article
      className={`b-cell ${project.featured ? "b-featured" : "b-proj"}`}
      data-cat={project.cat}
      data-cursor="open"
      data-reveal="wipe"
    >
      {/* the red plate wipes up from the bottom edge on hover — a second
          printing plate, not a glow */}
      <span className="b-plate" aria-hidden="true" />
      {/* the folio number, set huge and faint in the corner */}
      <span className="b-no" aria-hidden="true">
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="b-cell-in">
        {project.featured && (
          <span className="b-kind" data-scramble>
            Featured
          </span>
        )}
        <h3 className="b-title">{project.title}</h3>
        <p className="b-body">{project.body}</p>

        <ul className="b-tags">
          {project.tags.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>

        <div className="b-actions">
          <button
            className="b-btn b-preview"
            data-cursor
            onClick={() =>
              openPreview({
                url: project.url,
                title: project.title.toLowerCase().replace(/\s+/g, "-"),
              })
            }
          >
            <PlayIcon />
            preview
          </button>
          <a
            className="b-btn"
            href={project.repo}
            target="_blank"
            rel="noopener"
            data-cursor
          >
            <GithubIcon />
            code
          </a>
        </div>
      </div>
    </article>
  );
}

const byFeatured = (a: Project, b: Project) =>
  Number(Boolean(b.featured)) - Number(Boolean(a.featured));

export function Projects() {
  const [filter, setFilter] = useState("all");
  const cats = Array.from(new Set(PROJECTS.map((p) => p.cat)));
  // a filter bar with one real category can never change anything — don't ship
  // a control that does nothing. It returns on its own once a second cat exists.
  const showFilters = cats.length > 1;
  const filters = ["all", ...cats];

  /* Filtering removes the cell from the output rather than hiding it in CSS.
     The grid used to name fixed slots and `display: none` the misses, which
     left a hole wherever a filtered cell had been — and filtering to a
     category the featured project is not in emptied the tall slot entirely.
     An auto-fit track list has nothing to leave a hole in. */
  const shown = [...PROJECTS].sort(byFeatured).filter((p) => filter === "all" || p.cat === filter);

  /* A cell brought back by a filter has to be visible at once.
     `useViewEnter` reveals what is above the fold and hands the rest to an
     IntersectionObserver that unobserves each element as it fires — so a cell
     rendered after that pass is never observed, and stays at opacity 0 clipped
     to a single pixel: invisible, and untouchable by the pointer. Changing a
     filter is a deliberate act on content already on screen; the result should
     simply be there. The first run is skipped so the page's own entrance
     stagger still plays. */
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    document
      .querySelectorAll<HTMLElement>("#bento [data-reveal]")
      .forEach((el) => el.classList.add("is-in"));
  }, [filter]);

  return (
    <div className="container section-top">
      <SectionHead title="Projects" meta="Selected work — 2025–2026" />
      <p className="sec-note" data-reveal data-words>
        Things I&apos;ve built. The list is <em>only getting longer</em>.
      </p>

      {showFilters && (
        <div className="b-filters" data-reveal role="group" aria-label="Filter projects">
          {filters.map((f) => (
            <button
              key={f}
              className={`b-filter${filter === f ? " is-active" : ""}`}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              data-cursor
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* keeps the id the edge-origin hook looks for */}
      <div className="bento" id="bento" data-shown={shown.length}>
        {shown.map((p, i) => (
          <ProjectCell key={p.id} project={p} index={i} />
        ))}

        {/* real link, real handle — no invented contribution graph */}
        <a
          className="b-cell b-github"
          href={LINKS.github}
          target="_blank"
          rel="noopener"
          data-reveal="wipe"
          data-cursor="github"
        >
          <span className="b-github-in">
            <GithubIcon size={18} />
            <span className="b-github-handle">{LINKS.githubHandle}</span>
          </span>
          <span className="b-github-cta">
            the rest of the work lives here <span className="whisper-arrow">↗</span>
          </span>
        </a>
      </div>
    </div>
  );
}
