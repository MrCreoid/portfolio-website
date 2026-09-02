/** One <span> per glyph, indexed so the stylesheet can stagger them. Each
 *  word is its own unbreakable box, so lines still wrap between words and
 *  never between letters. */
export function Chars({ text }: { text: string }) {
  let i = 0;
  return (
    <span className="chars" aria-hidden="true">
      {text.split(" ").map((word, w) => (
        <span key={w}>
          {w > 0 && " "}
          <span className="cw">
            {Array.from(word).map((ch) => (
              <span
                className="ch"
                key={i}
                style={{ "--i": i++ } as React.CSSProperties}
              >
                {ch}
              </span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
}

/**
 * The section header. No numeral and no rule underneath it — a section is
 * announced by the size of its type and the air above it, not by a counter and
 * a hairline. `variant` shifts scale and alignment so no two read identically.
 * The title is split into glyphs: the h2 clips, and each glyph rises out of
 * the overflow a beat after the one before it.
 */
export function SectionHead({
  title,
  meta,
  variant,
}: {
  title: string;
  meta?: string;
  /** "margin" indents the title off the left edge; "light" pulls the scale
   *  down and hangs the title to the right. */
  variant?: "margin" | "light";
}) {
  const cls = [
    "sec-head",
    variant === "margin" && "head-margin",
    variant === "light" && "head-light",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={cls} data-reveal>
      <h2 className="sec-title" aria-label={title}>
        <Chars text={title} />
      </h2>
      {meta && (
        <span className="sec-meta" data-scramble>
          {meta}
        </span>
      )}
    </header>
  );
}
