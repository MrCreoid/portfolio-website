/**
 * The section header. No numeral and no rule underneath it — a section is
 * announced by the size of its type and the air above it, not by a counter and
 * a hairline. `variant` shifts scale and alignment so no two read identically.
 * The title lives in an inner <span> because the reveal is a mask: the h2
 * clips, the span slides up.
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
      <h2 className="sec-title">
        <span>{title}</span>
      </h2>
      {meta && <span className="sec-meta">{meta}</span>}
    </header>
  );
}
