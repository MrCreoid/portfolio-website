/* ============================================================
   The secret map, and which of it a given visitor has actually walked into.
   Ids are what gets stored, so rewriting a label never costs anyone their
   progress. The palette is the only thing that reads it back.
   ============================================================ */

export const EGGS: { id: string; name: string; hint: string }[] = [
  { id: "matrix", name: "Matrix rain", hint: "type my first name" },
  { id: "cozy", name: "Cozy mode", hint: "type what my friends call me" },
  { id: "sudo", name: "The gold cursor", hint: "ask for permission" },
  { id: "grid", name: "The twelve columns", hint: "type what all of this sits on" },
  { id: "crt", name: "CRT mode", hint: "a cheat code older than me" },
  { id: "resume", name: "The sneaky résumé", hint: "one letter, pressed alone" },
  { id: "game", name: "The typing test", hint: "the URL would like to ?play" },
  { id: "dvd", name: "The screensaver", hint: "walk away for a minute" },
  { id: "bottom", name: "The line at the bottom", hint: "scroll further than you should" },
  { id: "nope", name: "The link that begged you not to", hint: "the footer. five times." },
];

const KEY = "pg-eggs";

/** Storage can throw outright (Safari private mode), so every read is a try. */
export function foundEggs(): string[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? (v as string[]) : [];
  } catch {
    return [];
  }
}

export function findEgg(id: string) {
  const found = foundEggs();
  if (found.includes(id)) return;
  try {
    localStorage.setItem(KEY, JSON.stringify([...found, id]));
  } catch {
    /* nothing to do — the egg still fired, it just isn't remembered */
  }
}
