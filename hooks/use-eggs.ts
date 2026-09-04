"use client";

import { useEffect, useRef } from "react";
import { BIRTHDAY, LINKS } from "@/lib/data";
import { refreshCursor } from "@/hooks/use-ambient";
import { findEgg } from "@/lib/eggs";
import { confetti, prefersReducedMotion, rand } from "@/lib/fx";
import { addEyebrowLine } from "@/hooks/use-toys";
import { usePortfolio } from "@/components/portfolio-provider";

/**
 * Typed secrets: "pratyush" → editorial mode, "patty" → cozy mode,
 * "theme" → the archive turns over, "sudo" → gold cursor, a lone "R" → the
 * résumé.
 */
export function useTypedSecrets() {
  const { toast, setCozy, cozy, flipPaper } = usePortfolio();
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
          findEgg("resume");
          toast("you found it. opening the résumé");
          setTimeout(() => open(LINKS.resume, "_blank"), 500);
        }, 750);
      }

      if (keyBuffer.endsWith("pratyush")) {
        keyBuffer = "";
        clearTimeout(resumeTimer);
        findEgg("editorial");
        editorialMode(toast);
      }
      if (keyBuffer.endsWith("patty")) {
        keyBuffer = "";
        findEgg("cozy");
        const next = !cozyRef.current;
        setCozy(next);
        announceCozy(next, toast);
      }
      if (keyBuffer.endsWith("theme")) {
        keyBuffer = "";
        findEgg("paper");
        // no pointer to reveal from, so it opens out of the middle
        flipPaper();
      }
      if (keyBuffer.endsWith("sudo")) {
        keyBuffer = "";
        findEgg("sudo");
        toast("ah, a person of culture. permissions granted.");
        document.body.classList.add("sudo-gold");
        refreshCursor();
        setTimeout(() => {
          document.body.classList.remove("sudo-gold");
          // the verb has to come back on its own, not on the next thing you
          // happen to point at
          refreshCursor();
        }, 4000);
      }
    };

    addEventListener("keydown", onKey);
    return () => {
      clearTimeout(resumeTimer);
      removeEventListener("keydown", onKey);
    };
  }, [toast, setCozy, flipPaper]);
}

/**
 * Editorial mode — the reward for typing the name is the job.
 *
 * Every heading, paragraph and list item in the view you are on becomes
 * editable, dashed in red the way a proof is marked up, and a rule at the foot
 * says what is going on. Rewrite the headline, rename the projects, put
 * something rude in the lede. Nothing is saved and nothing is sent: it is your
 * copy of the archive for as long as the tab is open, and Esc (or a reload)
 * hands it back.
 *
 * Not a two-second effect you watch — the toys on this site are the ones you
 * get to keep playing with.
 */
const PROOF = "h2, h3, h4, p, li, blockquote, dd, figcaption";

function editorialMode(toast: (m: string, ms?: number) => void) {
  if (document.body.classList.contains("is-editorial")) return;
  const view = document.querySelector(".view.is-active");
  if (!view) return;

  // the hero name is fifteen separate <i>s driven by the marquee Flip, and the
  // split-glyph headings are spans with their own stagger — neither survives
  // having a caret put in it, so the proof stops at whole blocks of copy
  const marked = Array.from(view.querySelectorAll<HTMLElement>(PROOF)).filter(
    (el) => !el.closest(".chars, .marquee, .h-letter, .receipt") && el.textContent?.trim(),
  );
  marked.forEach((el) => {
    el.contentEditable = "true";
    el.spellcheck = false;
  });

  const bar = document.createElement("div");
  bar.className = "proof-bar";
  bar.innerHTML =
    '<span><b>Editorial mode</b> — the archive is yours. Nothing is saved.</span>' +
    "<span>esc to hand it back</span>";
  document.body.append(bar);
  document.body.classList.add("is-editorial");
  requestAnimationFrame(() => bar.classList.add("is-on"));
  toast("you have the pen. rewrite anything.", 4000);

  const off = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    marked.forEach((el) => {
      el.contentEditable = "false";
      el.blur();
    });
    document.body.classList.remove("is-editorial");
    bar.classList.remove("is-on");
    setTimeout(() => bar.remove(), 400);
    removeEventListener("keydown", off);
    toast("back to my words, then.");
  };
  addEventListener("keydown", off);
}

/**
 * Once a year, and only for the person whose birthday it is — the visitor gets
 * a page that is quietly pleased with itself and a line in the rotation.
 */
export function useBirthday() {
  const { cozy } = usePortfolio();
  useEffect(() => {
    const now = new Date();
    if (now.getDate() !== BIRTHDAY.day || now.getMonth() + 1 !== BIRTHDAY.month) return;
    const year = String(now.getFullYear());
    try {
      if (localStorage.getItem("pg-bday") === year) return;
      localStorage.setItem("pg-bday", year);
    } catch {
      /* private mode: it fires every load, which is the harmless failure */
    }
    findEgg("birthday");
    addEyebrowLine("it's my birthday, apparently");
    const t = setTimeout(() => confetti(innerWidth / 2, innerHeight / 3, 44, cozy), 3400);
    return () => clearTimeout(t);
  }, [cozy]);
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

/**
 * The set switching on.
 *
 * A tube does not simply become green: a hot line snaps across the middle,
 * holds for a beat, then opens vertically into the picture, and the overscan
 * settles. Leaving CRT runs it backwards — the picture collapses to that same
 * line and blinks out. One gesture, under a second, and it only ever plays on
 * a deliberate press of the code (or the palette's own toggle), never on load.
 *
 * The overlay is the only thing that moves. Squashing the page itself would
 * mean a transform on the active view, and a transformed ancestor takes every
 * `position: fixed` layer on the site down with it.
 */
export function crtSwitch(on: boolean) {
  if (prefersReducedMotion()) return;
  document.querySelectorAll(".crt-boot").forEach((e) => e.remove());
  const el = document.createElement("div");
  el.className = `crt-boot ${on ? "is-on" : "is-off"}`;
  el.innerHTML = '<i class="crt-wash"></i><i class="crt-line"></i>';
  document.body.append(el);
  setTimeout(() => el.remove(), 1000);
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

      findEgg("crt");
      const next = !crtRef.current;
      crtRef.current = next;
      // the tube first, then the mode it reveals
      crtSwitch(next);
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
