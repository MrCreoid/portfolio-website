"use client";

import { useEffect, useRef } from "react";
import { LINKS } from "@/lib/data";
import { pressRun, rand } from "@/lib/fx";
import { usePortfolio } from "@/components/portfolio-provider";

/**
 * Typed secrets: "pratyush" → the press run, "patty" → cozy mode,
 * "sudo" → gold cursor, a lone "R" → the résumé.
 */
export function useTypedSecrets() {
  const { toast, setCozy, cozy } = usePortfolio();
  // the keydown listener is registered once; this ref keeps it reading the
  // current cozy state without re-binding on every toggle
  const cozyRef = useRef(cozy);
  useEffect(() => {
    cozyRef.current = cozy;
  }, [cozy]);

  useEffect(() => {
    let keyBuffer = "";
    let resumeTimer: ReturnType<typeof setTimeout> | undefined;

    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)
        return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.length !== 1 || !/[a-z]/i.test(e.key)) return;

      const k = e.key.toLowerCase();
      keyBuffer = (keyBuffer + k).slice(-12);

      // typing any word cancels a pending lone-R résumé open
      if (k !== "r") clearTimeout(resumeTimer);
      if (k === "r") {
        clearTimeout(resumeTimer);
        resumeTimer = setTimeout(() => {
          toast("you found it. opening the résumé");
          setTimeout(() => open(LINKS.resume, "_blank"), 500);
        }, 750);
      }

      if (keyBuffer.endsWith("pratyush")) {
        keyBuffer = "";
        clearTimeout(resumeTimer);
        toast("the plates slipped. hold still.", 2600);
        pressRun();
        setTimeout(() => toast("registration corrected. nice find."), 2700);
      }
      if (keyBuffer.endsWith("patty")) {
        keyBuffer = "";
        const next = !cozyRef.current;
        setCozy(next);
        announceCozy(next, toast);
      }
      if (keyBuffer.endsWith("grid")) {
        keyBuffer = "";
        const on = document.body.classList.toggle("show-grid");
        toast(on ? "twelve columns. always were." : "grid off");
      }
      if (keyBuffer.endsWith("sudo")) {
        keyBuffer = "";
        toast("ah, a person of culture. permissions granted.");
        document.body.classList.add("sudo-gold");
        setTimeout(() => document.body.classList.remove("sudo-gold"), 4000);
      }
    };

    addEventListener("keydown", onKey);
    return () => {
      clearTimeout(resumeTimer);
      removeEventListener("keydown", onKey);
    };
  }, [toast, setCozy]);
}

/** Cozy mode's warm flash + the ☕🎬🎸 drifting up the screen. */
/** Fires the cozy-mode announcement + warm flash. Called from the toggle, not
 *  from an effect: an effect keyed on `cozy` re-announces itself whenever React
 *  remounts (StrictMode does this on every dev load). */
export function announceCozy(cozy: boolean, toast: (m: string, ms?: number) => void) {
  const flash = document.createElement("div");
  flash.className = "cozy-flash";
  document.body.appendChild(flash);
  void flash.offsetWidth;
  flash.classList.add("is-on");
  setTimeout(() => flash.remove(), 1400);

  toast(
    cozy
      ? "oh… you know me. welcome to the cozy corner"
      : "back to business",
    cozy ? 3600 : 2400,
  );
}

/** The ☕🎬🎸 drifting up the screen. Purely derived from `cozy`, so running it
 *  twice is harmless. */
export function useCozyMode() {
  const { cozy } = usePortfolio();

  useEffect(() => {
    if (!cozy) {
      document.querySelectorAll(".cozy-float").forEach((e) => e.remove());
      return;
    }
    const emojis = ["☕", "🎬", "🎸", "🍿", "🌙", "📺"];
    const drip = setInterval(() => {
      if (document.hidden) return;
      const e = document.createElement("span");
      e.className = "cozy-float";
      e.textContent = emojis[(Math.random() * emojis.length) | 0];
      e.style.left = rand(4, 94) + "vw";
      e.style.animationDuration = rand(9, 16) + "s";
      document.body.appendChild(e);
      setTimeout(() => e.remove(), 17000);
    }, 1400);

    return () => clearInterval(drip);
  }, [cozy]);
}

/** ↑↑↓↓←→←→BA → CRT mode + a Minecraft achievement. */
export function useKonami(onAchievement: () => void) {
  const { setCrt, crt, toast } = usePortfolio();
  // the listener is registered once; this keeps it reading the live value
  // without re-binding, and — more importantly — keeps the toast and the
  // achievement out of the state updater, which React replays during render
  const crtRef = useRef(crt);
  useEffect(() => {
    crtRef.current = crt;
  }, [crt]);

  useEffect(() => {
    const SEQ = [
      "arrowup",
      "arrowup",
      "arrowdown",
      "arrowdown",
      "arrowleft",
      "arrowright",
      "arrowleft",
      "arrowright",
      "b",
      "a",
    ];
    let pos = 0;

    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      pos = k === SEQ[pos] ? pos + 1 : k === SEQ[0] ? 1 : 0;
      if (pos !== SEQ.length) return;
      pos = 0;

      const next = !crtRef.current;
      crtRef.current = next;
      setCrt(next);

      if (next) {
        onAchievement();
        setTimeout(() => toast("CRT mode engaged. same code exits."), 1200);
      } else {
        toast("back to the future");
      }
    };

    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [setCrt, toast, onAchievement]);
}

/** A note for anyone who opens devtools. */
export function useConsoleGreeting() {
  useEffect(() => {
    console.log(
      "%cinspecting, are we? respect.",
      "font-size:15px; font-weight:bold; color:#ff5a5a;",
    );
    console.log(
      "%ctry typing my first name anywhere on the page.\nor add ?play to the URL. that's all the hints you get.\nPG (current status: genuinely figuring it out)",
      "color:#a89093;",
    );
  }, []);
}
