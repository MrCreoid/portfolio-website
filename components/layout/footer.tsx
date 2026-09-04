"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
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
  "fine. you win.",
  "…you're still here.",
  "there is nothing else. genuinely.",
  "ok now I'm curious about you.",
  "one more and I'm asking properly.",
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

/** Whether this browser has already had the argument. */
const VOID_KEY = "pg-nope-void";

export function Footer() {
  const { toast, cozy } = usePortfolio();
  const [clicks, setClicks] = useState(0);
  const [asking, setAsking] = useState(false);
  /* The scar, subscribed to the same way EggCount subscribes to its count:
     false on the server, so it hydrates clean, and read straight back out of
     storage on every render after that. */
  const voided = useSyncExternalStore(
    (onChange) => {
      addEventListener("pg-nope", onChange);
      return () => removeEventListener("pg-nope", onChange);
    },
    () => {
      try {
        return localStorage.getItem(VOID_KEY) === "1";
      } catch {
        /* private mode: the argument is simply never remembered */
        return false;
      }
    },
    () => false,
  );
  const setVoided = (on: boolean) => {
    try {
      if (on) localStorage.setItem(VOID_KEY, "1");
      else localStorage.removeItem(VOID_KEY);
    } catch {
      /* nothing written down, so nothing to undo */
    }
    dispatchEvent(new Event("pg-nope"));
  };

  /* The replies used to arrive as toasts — the same channel as "email copied",
     for a joke that is about this one button. They are set into the button
     itself now: it is the thing being clicked, so it is the thing that answers,
     and the count stands next to it like a print run. */
  const doNotClick = (e: React.MouseEvent) => {
    if (voided) {
      setVoided(false);
      setClicks(0);
      toast("reprinted. as you were.");
      return;
    }
    const n = clicks + 1;
    setClicks(n);
    if (n === 5) {
      findEgg("nope");
      confetti(e.clientX, e.clientY - 20, 50, cozy);
    }
    /* Ten is where it stops scolding and starts negotiating. */
    if (n >= 10) {
      setClicks(0);
      setAsking(true);
    }
  };

  /* Both answers are yes, so both end the same way: the line is struck out and
     stamped, and it stays that way on this browser until somebody clicks it
     again to have it reprinted. */
  const settle = (reply: string) => () => {
    setAsking(false);
    setVoided(true);
    toast(reply);
  };

  return (
    <footer className="footer">
      <span>Designed &amp; built by Pratyush Garg — 2026</span>
      <button
        className={`dnc${voided ? " is-void" : ""}`}
        onClick={doNotClick}
        data-cursor
        aria-label={voided ? "do not click this — void. click to reprint." : "do not click this"}
      >
        <span className="dnc-line">
          {voided || !clicks ? "do not click this" : REPLIES[clicks - 1]}
        </span>
        {clicks > 0 && !voided && <span className="dnc-run">&times;{clicks}</span>}
      </button>
      {/* The negotiation. Both answers are yes, because the question was never
          really a question — it is the joke landing, not a decision. */}
      {asking && (
        <div className="nope-ask" role="dialog" aria-modal="true" aria-label="Are you sure?">
          <div className="nope-box">
            <p className="nope-kicker">{"// confirm"}</p>
            <h4>Are you sure?</h4>
            <p>You have clicked a thing that asked you not to, ten times.</p>
            <div className="nope-actions">
              <button className="btn btn-primary" autoFocus onClick={settle("thought so.")}>
                yes
              </button>
              <button className="btn" onClick={settle("also yes. same as the other one.")}>
                also yes
              </button>
            </div>
          </div>
        </div>
      )}
      <span className="footer-hint">
        <EggCount />
        {/* a keyboard hint is noise on a device with no keyboard */}
        <span className="footer-key">
          press <kbd>R</kbd>. no reason.
        </span>
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
      {/* the stamp a file gets when somebody has actually read it to the end */}
      <span className="read-stamp" aria-hidden="true">
        Read 100%
      </span>
      you scrolled all the way down here. we should talk.
      <button onClick={nav("contact")} data-cursor tabIndex={shown ? 0 : -1}>
        say hi →
      </button>
    </div>
  );
}
