/* ============================================================
   How many of the hidden things a visitor has actually walked into.

   Ids only. The counter says "4 / 11" and nothing else — naming the ones you
   have not found is the same as telling you where they are, and the map lives
   in EASTER_EGGS.md, which is not in the repo.
   ============================================================ */

/** The ids that count toward the total. Order is irrelevant; length is not. */
export const EGG_IDS = [
  "editorial",
  "cozy",
  "sudo",
  "crt",
  "resume",
  "game",
  "dvd",
  "bottom",
  "nope",
  "bubbles",
  "birthday",
] as const;

export const EGG_TOTAL = EGG_IDS.length;

const KEY = "pg-eggs";

/** Storage can throw outright (Safari private mode), so every read is a try. */
export function foundEggs(): string[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? (v as string[]).filter((id) => EGG_IDS.includes(id as never)) : [];
  } catch {
    return [];
  }
}

/** Records a find. Returns true only the first time, so a caller can react. */
export function findEgg(id: (typeof EGG_IDS)[number]): boolean {
  const found = foundEggs();
  if (found.includes(id)) return false;
  try {
    localStorage.setItem(KEY, JSON.stringify([...found, id]));
    dispatchEvent(new CustomEvent("pg-egg"));
  } catch {
    /* nothing to do — the egg still fired, it just is not remembered */
  }
  return true;
}
