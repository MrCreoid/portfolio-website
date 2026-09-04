import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — not filed · Pratyush Garg",
};

/**
 * The page that isn't here, in the archive's own voice.
 *
 * A static export writes this to `404.html`, which is exactly the file GitHub
 * Pages serves for an unknown path — so the same component covers both the
 * app-router miss and the host's own. It is deliberately plain: no canvases,
 * no cursor, no preloader. Someone who lands here mistyped a URL and wants a
 * way back, not a second performance.
 */
export default function NotFound() {
  return (
    <main className="nf">
      <span className="nf-folio">404</span>
      <h1 className="nf-title">
        Not <em>filed</em>.
      </h1>
      <p className="nf-note">
        The page you wanted was never in this archive. It may have been renamed,
        or it may never have existed — the shelf does not keep minutes.
      </p>
      <Link className="nf-home" href="/">
        Back to the front <span aria-hidden="true">→</span>
      </Link>
      <span className="nf-meta">Pratyush Garg — Portfolio 2026</span>
    </main>
  );
}
