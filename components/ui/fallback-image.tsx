"use client";

import type { ImgHTMLAttributes } from "react";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "alt"> & {
  alt: string;
  /** Called when the file isn't there — render something else instead. */
  onMissing: () => void;
};

/**
 * An <img> for optional art (a photo or certificate the owner may not have
 * dropped in yet). The caller unmounts it on `onMissing` so the CSS fallback
 * underneath shows instead of the browser's broken-image alt text.
 *
 * `onError` alone is not enough: the markup is server-rendered, so the browser
 * can finish failing the request before React hydrates and attaches the
 * handler. The ref catches that case by asking the element directly.
 */
export function FallbackImage({ onMissing, alt, ...props }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      alt={alt}
      ref={(el) => {
        if (el?.complete && el.naturalWidth === 0) onMissing();
      }}
      onError={onMissing}
    />
  );
}
