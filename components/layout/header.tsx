"use client";

import type { MouseEvent } from "react";
import { NAV, type View } from "@/lib/data";
import { usePortfolio } from "@/components/portfolio-provider";

/** Nav clicks pass their own centre so the wipe circle grows out of the button. */
export function useNavClick() {
  const { goTo } = usePortfolio();
  return (name: View) => (e: MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    goTo(name, r.left + r.width / 2, r.top + r.height / 2);
  };
}

export function Header() {
  const { view, menuOpen, setMenuOpen } = usePortfolio();
  const nav = useNavClick();

  return (
    <header className="header">
      <button className="logo magnetic" onClick={nav("home")} aria-label="Go to home">
        <span className="logo-mark">
          P<em>G</em>
        </span>
      </button>

      <nav className="nav" aria-label="Main">
        {NAV.map((item) => (
          <button
            key={item.id}
            className={`nav-link${view === item.id ? " is-active" : ""}`}
            onClick={nav(item.id)}
            aria-current={view === item.id ? "page" : undefined}
          >
            {item.label}
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
      {NAV.map((item) => (
        <button
          key={item.id}
          className={`m-link${view === item.id ? " is-active" : ""}`}
          onClick={nav(item.id)}
          tabIndex={menuOpen ? 0 : -1}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
