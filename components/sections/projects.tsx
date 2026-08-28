"use client";

import { useState } from "react";
import { LINKS, PROJECTS, PROJECT_FILTERS, type Project } from "@/lib/data";
import { usePortfolio } from "@/components/portfolio-provider";

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
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
 * Decorative until it's wired to the real GitHub API. The levels come from a
 * cheap integer hash rather than Math.random so the server and the client agree
 * and the grid is painted on first render instead of popping in.
 */
const GH_LEVELS = Array.from({ length: 7 * 16 }, (_, i) => {
  const v = ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
  return v < 0.35 ? 0 : v < 0.6 ? 1 : v < 0.8 ? 2 : v < 0.93 ? 3 : 4;
});

function GithubGrid() {
  return (
    <div className="gh-grid" aria-hidden="true">
      {GH_LEVELS.map((g, i) => (
        <b key={i} style={{ "--g": g } as React.CSSProperties} />
      ))}
    </div>
  );
}

function ProjectCell({
  project,
  filtered,
}: {
  project: Project;
  filtered: boolean;
}) {
  const { openPreview } = usePortfolio();

  return (
    <article
      className={`b-cell ${project.featured ? "b-featured" : "b-proj"}${filtered ? " is-filtered" : ""}`}
      data-cat={project.cat}
      data-reveal
    >
      <span className="b-kind">{project.kind}</span>
      <h3>{project.title}</h3>
      <p>{project.body}</p>
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
          className="b-btn b-ghostbtn"
          href={project.repo}
          target="_blank"
          rel="noopener"
          data-cursor
        >
          <GithubIcon />
          code
        </a>
      </div>
    </article>
  );
}

export function Projects() {
  const [filter, setFilter] = useState("all");

  return (
    <div className="container section-top">
      <h2 className="section-title" data-reveal>
        <span className="section-num">06</span> Projects
      </h2>
      <p className="section-sub" data-reveal>
        Things I&apos;ve built — and the list is only getting longer.
      </p>

      <div className="b-filters" data-reveal role="group" aria-label="Filter projects">
        {PROJECT_FILTERS.map((f) => (
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

      <div className="bento" id="bento">
        {PROJECTS.map((p) => (
          <ProjectCell
            key={p.id}
            project={p}
            filtered={filter !== "all" && p.cat !== filter}
          />
        ))}

        <div className="b-cell b-stat" data-reveal>
          <span className="b-big">
            <span data-count="7">0</span>+
          </span>
          <span className="b-small">technologies in rotation</span>
        </div>

        <div className="b-cell b-now" data-reveal>
          <span className="b-label">{"// currently"}</span>
          <p>
            watching too many movies
            <br />
            &amp; building this very site
          </p>
        </div>

        <div className="b-cell b-building" data-reveal>
          <span className="b-label">$ status</span>
          <p className="b-code">
            compiling next_project<span className="b-blink">▋</span>
          </p>
          <p className="b-small">something&apos;s cooking — check back soon</p>
        </div>

        <div className="b-cell b-github" data-reveal>
          <span className="b-label">@github</span>
          <GithubGrid />
          {/* ▼ your GitHub profile URL + handle */}
          <a
            className="gh-link"
            href={LINKS.github}
            target="_blank"
            rel="noopener"
            data-cursor
          >
            {LINKS.githubHandle} ↗
          </a>
        </div>

        <div className="b-cell b-soon" data-reveal>
          <span className="b-big">+</span>
          <span className="b-small">
            your next project lives here — add an entry to PROJECTS in lib/data.ts
          </span>
        </div>
      </div>
    </div>
  );
}
