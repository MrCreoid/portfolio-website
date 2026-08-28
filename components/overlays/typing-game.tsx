"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GAME_LINES } from "@/lib/data";
import { confetti, prefersReducedMotion } from "@/lib/fx";
import { usePortfolio } from "@/components/portfolio-provider";

const BEST_KEY = "pg-best-wpm";

/** The secret level: add ?play to the URL. */
export function TypingGame() {
  const { gameOpen, setGameOpen, toast, cozy } = usePortfolio();
  const [target, setTarget] = useState(GAME_LINES[0]);
  const [typed, setTyped] = useState("");
  const [wpm, setWpm] = useState(0);
  const [acc, setAcc] = useState(100);
  const [best, setBest] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const startT = useRef(0);
  const mistakes = useRef(0);
  const lastLine = useRef(-1);

  const newLine = useCallback(() => {
    let i: number;
    do {
      i = (Math.random() * GAME_LINES.length) | 0;
    } while (i === lastLine.current && GAME_LINES.length > 1);
    lastLine.current = i;
    setTarget(GAME_LINES[i]);
    setTyped("");
    setWpm(0);
    setAcc(100);
    setDone(false);
    startT.current = 0;
    mistakes.current = 0;
  }, []);

  /**
   * The single entry point for opening the game — it seeds the round rather
   * than leaving an effect to react to `gameOpen`, which would be a synchronous
   * setState inside an effect.
   */
  const openGame = useCallback(() => {
    const stored = localStorage.getItem(BEST_KEY);
    setBest(stored ? Number(stored) : null);
    newLine();
    setGameOpen(true);
    setTimeout(() => inputRef.current?.focus(), 350);
  }, [newLine, setGameOpen]);

  /* the secret door: anything "play"-ish in the URL */
  useEffect(() => {
    const q = (location.search + location.hash).toLowerCase();
    if (!q.includes("play") && !q.includes("game")) return;
    const t = setTimeout(openGame, prefersReducedMotion() ? 400 : 2300);
    return () => clearTimeout(t);
  }, [openGame]);

  useEffect(() => {
    if (!gameOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setGameOpen(false);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [gameOpen, setGameOpen]);

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (done) return;
    const value = e.target.value;
    if (!startT.current && value.length) startT.current = performance.now();
    setTyped(value);

    // count fresh mistakes only at the newest char
    if (value.length && value[value.length - 1] !== target[value.length - 1])
      mistakes.current++;

    const mins = (performance.now() - startT.current) / 60000;
    if (mins > 0) setWpm(Math.round(value.length / 5 / mins));
    setAcc(
      Math.max(
        0,
        Math.round(((value.length - mistakes.current) / Math.max(value.length, 1)) * 100),
      ),
    );

    if (value === target) {
      setDone(true);
      const finalWpm = Math.round(
        target.length / 5 / ((performance.now() - startT.current) / 60000),
      );
      setWpm(finalWpm);
      const stored = Number(localStorage.getItem(BEST_KEY) ?? 0);
      if (finalWpm > stored) {
        localStorage.setItem(BEST_KEY, String(finalWpm));
        setBest(finalWpm);
        confetti(innerWidth / 2, innerHeight / 2.5, 50, cozy);
        toast(`new personal best — ${finalWpm} wpm 🔥`);
      } else {
        confetti(innerWidth / 2, innerHeight / 2.5, 20, cozy);
      }
    }
  };

  return (
    <div
      className={`game${gameOpen ? " is-open" : ""}`}
      aria-hidden={!gameOpen}
      onClick={(e) => {
        if (e.target === e.currentTarget) setGameOpen(false);
      }}
    >
      <div className="game-box">
        <button
          className="game-close"
          onClick={() => setGameOpen(false)}
          aria-label="Close game"
        >
          ✕
        </button>
        <p className="game-kicker">{"// secret level unlocked"}</p>
        <h3>Typing Speed Test</h3>
        <p className="game-sub">
          type the line below — the clock starts on your first key
        </p>

        <div
          className={`game-text${done ? " is-done" : ""}`}
          onClick={() => inputRef.current?.focus()}
        >
          {Array.from(target).map((ch, i) => {
            const cls =
              i < typed.length
                ? typed[i] === ch
                  ? "ok"
                  : "bad"
                : i === typed.length
                  ? "cur"
                  : "";
            return (
              <span key={i} className={cls}>
                {ch}
              </span>
            );
          })}
        </div>

        <input
          className="game-input"
          ref={inputRef}
          value={typed}
          onChange={onInput}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label="Type here"
          tabIndex={gameOpen ? 0 : -1}
        />

        <div className="game-stats">
          <span>
            wpm <b>{wpm}</b>
          </span>
          <span>
            accuracy <b>{acc}%</b>
          </span>
          <span>
            best <b>{best ? `${best} wpm` : "—"}</b>
          </span>
        </div>

        <div className="game-actions">
          <button
            className="btn btn-ghost"
            onClick={() => {
              newLine();
              inputRef.current?.focus();
            }}
            data-cursor
          >
            <span>new line ↺</span>
          </button>
        </div>
      </div>
    </div>
  );
}
