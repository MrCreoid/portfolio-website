"use client";

import type { MouseEvent, ReactNode } from "react";
import { NAV, type View } from "@/lib/data";
import { usePortfolio } from "@/components/portfolio-provider";

/** Nav clicks pass their own centre so the wipe grows out of the button. */
export function useNavClick() {
  const { goTo } = usePortfolio();
  return (name: View) => (e: MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    goTo(name, r.left + r.width / 2, r.top + r.height / 2);
  };
}

/** A label that rolls up out of its own box on hover, a copy rolling in
 *  under it. The parent's :hover drives it, so it works inside any control. */
export function Roll({ children }: { children: ReactNode }) {
  return (
    <span className="roll">
      <span>{children}</span>
      <span aria-hidden="true">{children}</span>
    </span>
  );
}

export function Header() {
  const { view, menuOpen, setMenuOpen } = usePortfolio();
  const nav = useNavClick();

  return (
    <header className="header">
      <button className="logo" onClick={nav("home")} aria-label="Go to home">
        <span className="logo-mark">
          P<em>G</em>
        </span>
        <span className="logo-sub" data-scramble>
          Portfolio — 2026
        </span>
      </button>

      {/* the nav and the burger share column 3; only one is ever visible */}
      <nav className="nav" aria-label="Main">
        {NAV.map((item, i) => (
          <button
            key={item.id}
            className={`nav-link${view === item.id ? " is-active" : ""}`}
            onClick={nav(item.id)}
            aria-current={view === item.id ? "page" : undefined}
          >
            <i aria-hidden="true">0{i + 1}</i>
            <Roll>{item.label}</Roll>
          </button>
        ))}
        <span className="nav-indicator" aria-hidden="true" />
      </nav>

      <button
        className={`burger${menuOpen ? " is-open" : ""}`}
        onClick={() => setMenuOpen((o) => !o)}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
      >
        <span />
        <span />
      </button>

      {/* how far down the page you are, as a rule under the header */}
      <span className="progress-rule" aria-hidden="true" />
    </header>
  );
}

export function MobileMenu() {
  const { view, menuOpen } = usePortfolio();
  const nav = useNavClick();

  return (
    <div
      className={`mobile-menu${menuOpen ? " is-open" : ""}`}
      aria-hidden={!menuOpen}
    >
      {NAV.map((item, i) => (
        <button
          key={item.id}
          className={`m-link${view === item.id ? " is-active" : ""}`}
          onClick={nav(item.id)}
          tabIndex={menuOpen ? 0 : -1}
        >
          <i aria-hidden="true">0{i + 1}</i>
          {item.label}
        </button>
      ))}
    </div>
  );
}
