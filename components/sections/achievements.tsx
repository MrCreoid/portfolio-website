"use client";

import { useState } from "react";
import { ACHIEVEMENTS, type Achievement } from "@/lib/data";
import { usePortfolio } from "@/components/portfolio-provider";
import { FallbackImage } from "@/components/ui/fallback-image";
import { SectionHead } from "@/components/layout/section-head";

function AchievementRow({ item }: { item: Achievement }) {
  const { openLightbox } = usePortfolio();
  // an image that 404s removes itself, so track whether one is actually there
  const [hasImage, setHasImage] = useState(Boolean(item.image));

  /* A row with no scan behind it is not a control. It used to open a toast
     addressed to the site's author — "drop the certificate image into
     public/assets" — which is a note to me, shown to a visitor. */
  const open = hasImage && item.image
    ? () => openLightbox({ src: item.image!, caption: item.title })
    : undefined;

  /* The row is an <article>, not a <button> — a heading can't legally live
     inside one. The whole row is still clickable when there is something to
     open; the trailing button is what the keyboard actually lands on. */
  return (
    <article
      className={`ach-card${item.featured ? " featured" : ""}`}
      /* not a class: `useViewEnter` writes `is-in` onto this element and a
         re-render rewriting className would wipe it */
      data-openable={open ? "" : undefined}
      data-reveal
      data-cursor={open ? "" : undefined}
      onClick={open}
    >
      <span className="ach-year">{item.year}</span>

      <span className="ach-media">
        <item.fallback className="ach-media-fallback" strokeWidth={1.3} aria-hidden="true" />
        {hasImage && item.image && (
          <FallbackImage
            src={item.image}
            alt={`${item.title} certificate`}
            onMissing={() => setHasImage(false)}
          />
        )}
      </span>

      <div className="ach-body">
        <span className="ach-kind">{item.kind}</span>
        <h3>{item.title}</h3>
        <p>{item.issuer}</p>
      </div>

      {open ? (
        <button
          className="ach-view"
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
        >
          View the scan <span className="whisper-arrow">↗</span>
        </button>
      ) : (
        <span className="ach-view is-none">no scan filed</span>
      )}
    </article>
  );
}

export function Achievements() {
  return (
    <div className="container section-top">
      <SectionHead
        title="Achievements"
        variant="margin"
        meta="The shelf. Empty is honest."
      />

      {ACHIEVEMENTS.length === 0 ? (
        /* An archive with nothing filed yet still shows its rules — the shelf
           reads as empty on purpose rather than as a section left unfinished. */
        <>
          <div className="ach-empty" data-reveal>
            <span className="ach-empty-no">00</span>
            <div className="ach-empty-body">
              <span className="ach-empty-kind">No entries filed</span>
              <p>
                Nothing filed yet. Certificates and placements go here as they
                happen. <em>Watch this space</em>.
              </p>
              <p className="ach-empty-note">
                Currently applying to: everything interesting.
              </p>
            </div>
            <span className="ach-empty-year">2026</span>
          </div>
          {/* the rest of the shelf, still empty */}
          <div className="ach-slots" aria-hidden="true" />
        </>
      ) : (
        <>
          <p className="sec-note" data-reveal>
            Small for now. <em>Watch this space</em>.
          </p>
          <div className="ach-list">
            {ACHIEVEMENTS.map((a) => (
              <AchievementRow item={a} key={a.title} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
