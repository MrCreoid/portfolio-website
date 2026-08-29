"use client";

import { useState } from "react";
import { ACHIEVEMENTS, type Achievement } from "@/lib/data";
import { usePortfolio } from "@/components/portfolio-provider";
import { FallbackImage } from "@/components/ui/fallback-image";
import { SectionHead } from "@/components/layout/section-head";

function AchievementRow({ item }: { item: Achievement }) {
  const { openLightbox, toast } = usePortfolio();
  // an image that 404s removes itself, so track whether one is actually there
  const [hasImage, setHasImage] = useState(Boolean(item.image));

  const open = () => {
    if (hasImage && item.image) {
      openLightbox({ src: item.image, caption: item.title });
    } else {
      toast("drop the certificate image into public/assets to view it here");
    }
  };

  /* The row is an <article>, not a <button> — a heading can't legally live
     inside one. The whole row is still clickable; the trailing button is what
     the keyboard actually lands on. */
  return (
    <article
      className={`ach-card${item.featured ? " featured" : ""}`}
      data-reveal
      data-cursor
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

      <button
        className="ach-view"
        onClick={(e) => {
          e.stopPropagation();
          open();
        }}
      >
        {hasImage ? `View ${item.title} ↗` : "No scan yet"}
      </button>
    </article>
  );
}

export function Achievements() {
  return (
    <div className="container section-top">
      <SectionHead
        title="Achievements"
        variant="margin"
        meta="The trophy shelf"
      />

      {ACHIEVEMENTS.length === 0 ? (
        /* An archive with nothing filed yet still shows its rules — the shelf
           reads as empty on purpose rather than as a section left unfinished. */
        <div className="ach-empty" data-reveal>
          <span className="ach-empty-no">00</span>
          <div className="ach-empty-body">
            <span className="ach-empty-kind">No entries filed</span>
            <p>
              Nothing filed yet. Certificates and placements land here as they
              happen — <em>watch this space</em>.
            </p>
          </div>
          <span className="ach-empty-year">2026</span>
        </div>
      ) : (
        <>
          <p className="sec-note" data-reveal>
            Small for now — <em>watch this space</em>.
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
