"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GAME_LINES } from "@/lib/data";
import { findEgg } from "@/lib/eggs";
import { confetti, prefersReducedMotion } from "@/lib/fx";
import { usePortfolio } from "@/components/portfolio-provider";

const BEST_KEY = "pg-best-wpm";
const BOARD_KEY = "pg-wpm-board";
const BOARD_SIZE = 5;

type Score = { who: string; wpm: number; acc: number };

/** The table, newest-best-first, never longer than five. */
const readBoard = (): Score[] => {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(BOARD_KEY) || "[]");
    return Array.isArray(v) ? (v as Score[]).slice(0, BOARD_SIZE) : [];
  } catch {
    return [];
  }
};
const writeBoard = (rows: Score[]) => {
  try {
    localStorage.setItem(BOARD_KEY, JSON.stringify(rows.slice(0, BOARD_SIZE)));
  } catch {
    /* private mode: the round still counts, it just is not filed */
  }
};

/** The secret level: add ?play to the URL. */
export function TypingGame() {
  const { gameOpen, setGameOpen, gameOpenerRef, toast, cozy } = usePortfolio();
  const [target, setTarget] = useState(GAME_LINES[0]);
  const [typed, setTyped] = useState("");
  const [wpm, setWpm] = useState(0);
  const [acc, setAcc] = useState(100);
  const [best, setBest] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [board, setBoard] = useState<Score[]>([]);
  /** Set when the round earned a place — the table asks for three letters. */
  const [claiming, setClaiming] = useState<Score | null>(null);
  const [initials, setInitials] = useState("");

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
    setClaiming(null);
    setInitials("");
    startT.current = 0;
    mistakes.current = 0;
  }, []);

  /**
   * The single entry point for opening the game — it seeds the round rather
   * than leaving an effect to react to `gameOpen`, which would be a synchronous
   * setState inside an effect.
   */
  const openGame = useCallback(() => {
    findEgg("game");
    const stored = localStorage.getItem(BEST_KEY);
    setBest(stored ? Number(stored) : null);
    setBoard(readBoard());
    newLine();
    setGameOpen(true);
    setTimeout(() => inputRef.current?.focus(), 350);
  }, [newLine, setGameOpen]);

  /* the palette's "play the typing test" comes through here, so it gets a
     seeded round rather than whatever was left on screen last time */
  useEffect(() => {
    gameOpenerRef.current = openGame;
  }, [gameOpenerRef, openGame]);

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
        toast(`new personal best: ${finalWpm} wpm`);
      } else {
        confetti(innerWidth / 2, innerHeight / 2.5, 20, cozy);
      }
      // a place in the table is earned, and paid for in three letters
      const rows = readBoard();
      if (rows.length < BOARD_SIZE || finalWpm > rows[rows.length - 1].wpm) {
        setClaiming({ who: "", wpm: finalWpm, acc });
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
          type the line below. the clock starts on your first key
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

        {/* The table. Five rows, three letters each, kept in this browser —
            an arcade cabinet's memory, not a service. */}
        {(board.length > 0 || claiming) && (
          <div className="game-board">
            <p className="game-board-head">
              <span>rank</span>
              <span>who</span>
              <span>wpm</span>
              <span>acc</span>
            </p>
            {board.map((r, i) => (
              <p className="game-board-row" key={`${r.who}-${i}`}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <span>{r.who}</span>
                <span>{r.wpm}</span>
                <span>{r.acc}%</span>
              </p>
            ))}
            {claiming && (
              <form
                className="game-board-row is-claiming"
                onSubmit={(e) => {
                  e.preventDefault();
                  const who = (initials.trim() || "???").toUpperCase().slice(0, 3);
                  const rows = [...readBoard(), { ...claiming, who }]
                    .sort((a, b) => b.wpm - a.wpm)
                    .slice(0, BOARD_SIZE);
                  writeBoard(rows);
                  setBoard(rows);
                  setClaiming(null);
                  setInitials("");
                }}
              >
                <span>{String(board.length + 1).padStart(2, "0")}</span>
                <input
                  className="game-initials"
                  value={initials}
                  onChange={(e) =>
                    setInitials(e.target.value.replace(/[^a-z]/gi, "").slice(0, 3))
                  }
                  placeholder="AAA"
                  aria-label="Your initials, three letters"
                  maxLength={3}
                  autoFocus
                />
                <span>{claiming.wpm}</span>
                <span>{claiming.acc}%</span>
              </form>
            )}
          </div>
        )}

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
          {done && (
            <button
              className="btn btn-ghost"
              data-cursor
              onClick={() =>
                void navigator.clipboard
                  .writeText(`I typed ${wpm} wpm on pratyushgarg.dev`)
                  .then(
                    () => toast("copied. go on then, paste it somewhere"),
                    () => toast(`I typed ${wpm} wpm on pratyushgarg.dev`),
                  )
              }
            >
              <span>share ↗</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
