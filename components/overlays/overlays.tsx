"use client";

import { FlaskConical } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePortfolio } from "@/components/portfolio-provider";

/** Esc closes whatever is on top. */
function useEscape(active: boolean, close: () => void) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [active, close]);
}

export function Toast() {
  const { toastMsg, toastShown } = usePortfolio();
  return (
    <div
      className={`toast${toastShown ? " is-show" : ""}`}
      role="status"
      aria-live="polite"
    >
      {toastMsg}
    </div>
  );
}

/** The wipe between views: five slats of ink drop in one after another with
 *  the destination's name across them, then lift away. Driven imperatively
 *  from `goTo` so the timing is exact. */
export function Transition() {
  const { transitionRef } = usePortfolio();
  return (
    <div className="transition" ref={transitionRef} aria-hidden="true">
      <div className="t-slats">
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="t-logo" />
      <div className="t-folio" />
    </div>
  );
}

/** Scroll telemetry, bottom-left: the view you are on and how far down it. */
export function Readout({ view }: { view: string }) {
  return (
    <div className="readout" aria-hidden="true">
      <span className="readout-view">{view}</span>
      <span className="readout-val">000</span>
      <span>%</span>
    </div>
  );
}

/** A mini in-site browser — the portfolio can preview itself, recursively. */
export function PreviewWindow() {
  const { preview, openPreview } = usePortfolio();
  // storing the loaded url rather than a boolean means opening a different
  // project shows the spinner again without an effect resetting state
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const open = Boolean(preview);
  const empty = !preview?.url || preview.url === "#";
  const loaded = Boolean(preview) && loadedUrl === preview!.url;

  const close = () => openPreview(null);
  useEscape(open, close);

  useEffect(() => {
    if (preview) return;
    // let the close transition finish before tearing the page down
    const t = setTimeout(() => {
      if (frameRef.current) frameRef.current.src = "about:blank";
    }, 350);
    return () => clearTimeout(t);
  }, [preview]);

  const label = !preview
    ? "—"
    : preview.url.startsWith("http")
      ? preview.url.replace(/^https?:\/\//, "")
      : `pratyush.dev/${preview.title || preview.url}`;

  return (
    <div
      className={`pv${open ? " is-open" : ""}`}
      aria-hidden={!open}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="pv-window">
        <div className="pv-bar">
          <span className="pv-dot pv-red" />
          <span className="pv-dot pv-yellow" />
          <span className="pv-dot pv-green" />
          <span className="pv-url">{empty ? "—" : label}</span>
          {!empty && (
            <a
              className="pv-visit"
              href={preview?.url}
              target="_blank"
              rel="noopener"
              data-cursor
            >
              visit ↗
            </a>
          )}
          <button
            className="pv-close"
            onClick={close}
            aria-label="Close preview"
            data-cursor
          >
            ✕
          </button>
        </div>

        <div
          className={`pv-body${empty ? " is-empty" : loaded ? " is-ready" : " is-loading"}`}
        >
          <div className="pv-loading">
            <span className="loading-dots">
              <i />
              <i />
              <i />
            </span>
            <span>spinning it up…</span>
          </div>
          <div className="pv-empty">
            no live preview yet. set <code>url</code> on the project in{" "}
            <code>lib/data.ts</code>
          </div>
          <iframe
            ref={frameRef}
            title="Project preview"
            src={open && !empty ? preview!.url : undefined}
            onLoad={() => preview && setLoadedUrl(preview.url)}
          />
        </div>
      </div>
    </div>
  );
}

export function Lightbox() {
  const { lightbox, openLightbox } = usePortfolio();
  const open = Boolean(lightbox);
  const close = () => openLightbox(null);
  useEscape(open, close);

  // hold the last target so the image stays put through the close transition.
  // rendering <img src=""> instead would make the browser re-request the page.
  const [shown, setShown] = useState(lightbox);
  if (lightbox && lightbox !== shown) setShown(lightbox);

  return (
    <div
      className={`lb${open ? " is-open" : ""}`}
      aria-hidden={!open}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <figure className="lb-fig">
        {shown && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shown.src} alt={shown.caption} />
            <figcaption>{shown.caption}</figcaption>
          </>
        )}
      </figure>
      <button className="lb-close" onClick={close} aria-label="Close viewer" data-cursor>
        ✕
      </button>
    </div>
  );
}

export function McToast({ shown }: { shown: boolean }) {
  return (
    <div className={`mc-toast${shown ? " is-show" : ""}`} aria-hidden={!shown}>
      <span className="mc-icon">
        <FlaskConical size={18} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <span className="mc-text">
        <b>Achievement Get!</b>How Did We Get Here?
      </span>
    </div>
  );
}

export function CrtOverlay() {
  return <div className="crt-overlay" aria-hidden="true" />;
}
