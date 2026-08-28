"use client";

import { useCallback, useRef, useState } from "react";
import { confetti } from "@/lib/fx";
import { useBottomSecret } from "@/hooks/use-ambient";
import { usePortfolio } from "@/components/portfolio-provider";
import { useNavClick } from "@/components/layout/header";

const REPLIES = [
  "you had ONE job.",
  "seriously?",
  "stop.",
  "this is your last warning.",
];

export function Footer() {
  const { toast, cozy } = usePortfolio();
  const clicks = useRef(0);

  const doNotClick = (e: React.MouseEvent) => {
    clicks.current++;
    if (clicks.current <= 4) {
      toast(REPLIES[clicks.current - 1]);
    } else {
      confetti(e.clientX, e.clientY - 20, 50, cozy);
      toast("fine. you win. 🏆");
      clicks.current = 0;
    }
  };

  return (
    <footer className="footer">
      <span>Designed &amp; built by Pratyush Garg · 2026</span>
      <button className="dnc" onClick={doNotClick} data-cursor>
        do not click this
      </button>
      <span className="footer-hint">
        press <kbd>R</kbd> anywhere… if you&apos;re curious
      </span>
    </footer>
  );
}

/** Revealed only by scrolling to the absolute bottom and lingering. */
export function BottomSecret() {
  const [shown, setShown] = useState(false);
  const nav = useNavClick();
  useBottomSecret(useCallback(() => setShown(true), []));

  return (
    <div className={`bottom-secret${shown ? " is-shown" : ""}`} aria-hidden={!shown}>
      you scrolled all the way down here. we should talk.
      <button onClick={nav("contact")} data-cursor tabIndex={shown ? 0 : -1}>
        say hi →
      </button>
    </div>
  );
}
