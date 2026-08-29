import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** The base path the site is served under — "/portfolio-website" on GitHub
 *  Project Pages, "" anywhere it owns the root.
 *
 *  `next/link` applies this itself. A hand-written `src`/`href` does not — and
 *  neither does `next/image` once `images.unoptimized` is set, because the src
 *  then bypasses the loader that would have added the prefix. So every path
 *  into /assets goes through `asset()`; miss one and it 404s in production
 *  while working perfectly on localhost. */
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const asset = (path: string) => `${BASE}${path}`;
