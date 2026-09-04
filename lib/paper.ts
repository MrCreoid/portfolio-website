"use client";

/**
 * Which way up the reader keeps the archive.
 *
 * A store rather than a piece of component state, for the same reason the egg
 * counter is one: the value lives in `localStorage`, which the server cannot
 * see. `useSyncExternalStore` renders the server's answer during hydration and
 * the browser's on the frame after, so there is no mismatch to warn about and
 * no `setState` inside an effect to cascade off.
 */
const KEY = "pg-paper";

let paper = false;
const listeners = new Set<() => void>();

/** Read once, at module scope, on the client only. */
if (typeof window !== "undefined") {
  try {
    paper = localStorage.getItem(KEY) === "1";
  } catch {
    /* private mode: the archive simply opens on ink every time */
  }
}

export const subscribePaper = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const readPaper = () => paper;
export const serverPaper = () => false;

/** Flip it, remember it, and tell everyone reading. */
export function togglePaper() {
  paper = !paper;
  try {
    localStorage.setItem(KEY, paper ? "1" : "0");
  } catch {
    /* it still turns over, it just is not remembered */
  }
  for (const fn of listeners) fn();
  return paper;
}
