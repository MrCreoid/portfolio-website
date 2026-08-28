"use client";

import { useState } from "react";
import { ACHIEVEMENTS, type Achievement } from "@/lib/data";
import { usePortfolio } from "@/components/portfolio-provider";
import { FallbackImage } from "@/components/ui/fallback-image";

function AchievementCard({ item }: { item: Achievement }) {
  const { openLightbox, toast } = usePortfolio();
  // an image that 404s removes itself, so track whether one is actually there
  const [hasImage, setHasImage] = useState(Boolean(item.image));

  const open = () => {
    if (hasImage && item.image) {
      openLightbox({ src: item.image, caption: item.title });
    } else {
      toast("drop the certificate image into public/assets to view it here 🖼");
    }
  };

  return (
    <article
      className={`ach-card tilt${item.featured ? " featured" : ""}`}
      data-reveal
      onClick={open}
    >
      <div className="ach-media">
        <div className="ach-media-fallback">{item.fallback}</div>
        {hasImage && item.image && (
          <FallbackImage
            src={item.image}
            alt={`${item.title} certificate`}
            onMissing={() => setHasImage(false)}
          />
        )}
        <span className="ach-shine" />
      </div>
      <div className="ach-body">
        <span className="ach-kind">{item.kind}</span>
        <h3>{item.title}</h3>
        <p>{item.issuer}</p>
        <span className="ach-year">{item.year}</span>
      </div>
    </article>
  );
}

export function Achievements() {
  return (
    <div className="container section-top">
      <h2 className="section-title" data-reveal>
        <span className="section-num">07</span> Achievements
      </h2>
      <p className="section-sub" data-reveal>
        The trophy shelf. Small for now — watch this space.
      </p>

      <div className="ach-grid">
        {ACHIEVEMENTS.map((a) => (
          <AchievementCard item={a} key={a.title} />
        ))}

        <article className="ach-card loading-card" data-reveal>
          <div className="ach-body center">
            <span className="loading-dots">
              <i />
              <i />
              <i />
            </span>
            <h3>Next achievement</h3>
            <p>currently compiling…</p>
          </div>
        </article>
      </div>
    </div>
  );
}
