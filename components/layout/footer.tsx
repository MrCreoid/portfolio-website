"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { EGG_TOTAL, findEgg, foundEggs } from "@/lib/eggs";
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

/** How many of the hidden things this browser has walked into. It never says
 *  which — the undiscovered ones stay undiscovered. */
function EggCount() {
  /* Subscribing to storage rather than reading it in an effect: this is what
     useSyncExternalStore is for, it renders 0 on the server without a
     hydration mismatch, and findEgg's event moves the number the instant one
     is found. */
  const found = useSyncExternalStore(
    (onChange) => {
      addEventListener("pg-egg", onChange);
      return () => removeEventListener("pg-egg", onChange);
    },
    () => foundEggs().length,
    () => 0,
  );

  // nothing on the server, and nothing at all until at least one is found —
  // a 0/11 on first load is an instruction to go hunting, not a reward
  if (!found) return null;
  return (
    <span className="egg-count" title="Found by exploring. No hints.">
      Easter eggs found: <b>{found}</b> / {EGG_TOTAL}
    </span>
  );
}

export function Footer() {
  const { toast, cozy } = usePortfolio();
  const clicks = useRef(0);

  const doNotClick = (e: React.MouseEvent) => {
    clicks.current++;
    if (clicks.current <= 4) {
      toast(REPLIES[clicks.current - 1]);
    } else {
      findEgg("nope");
      confetti(e.clientX, e.clientY - 20, 50, cozy);
      toast("fine. you win.");
      clicks.current = 0;
    }
  };

  return (
    <footer className="footer">
      <span>Designed &amp; built by Pratyush Garg — 2026</span>
      <button className="dnc" onClick={doNotClick} data-cursor>
        do not click this
      </button>
      <span className="footer-hint">
        <EggCount />
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
