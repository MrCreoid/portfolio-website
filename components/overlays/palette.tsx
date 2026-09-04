"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { EMAIL, LINKS, NAV } from "@/lib/data";
import { usePortfolio } from "@/components/portfolio-provider";

type Cmd = { label: string; meta: string; run: () => void };

/** Subsequence match, the whole fuzzy filter: "gpr" finds "go to projects". */
function fuzzy(q: string, s: string) {
  let i = -1;
  for (const c of q) {
    i = s.indexOf(c, i + 1);
    if (i < 0) return false;
  }
  return true;
}

/**
 * ⌘K / Ctrl K. A keyboard control opened many times a day does not get an
 * open/close animation — it is simply there, on the frame you asked for it.
 *
 * It lists what the site can do, not what it is hiding. No mode is in here —
 * cozy, CRT and paper are all found, and a palette row naming one turns the
 * nicest things in the page into a dropdown. The typing test is the single
 * exception: it is a place to go, not a mode you leave the page in.
 */
export function Palette() {
  const { goTo, toast, playGame } = usePortfolio();
  const ref = useRef<HTMLDialogElement | null>(null);
  const [q, setQ] = useState("");
  const [at, setAt] = useState(0);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key.toLowerCase() !== "k" || !(e.metaKey || e.ctrlKey)) return;
      e.preventDefault();
      const d = ref.current;
      if (!d) return;
      if (d.open) d.close();
      else d.showModal();
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  const reset = useCallback(() => {
    setQ("");
    setAt(0);
  }, []);

  const cmds: Cmd[] = [
    ...NAV.map((n) => ({
      label: `Go to ${n.label}`,
      meta: n.id === "home" ? "/" : `#${n.id}`,
      run: () => void goTo(n.id),
    })),
    {
      label: "Copy email",
      meta: EMAIL,
      run: () =>
        void navigator.clipboard.writeText(EMAIL).then(
          () => toast("Email copied to clipboard"),
          () => toast("Couldn't copy. Email: " + EMAIL),
        ),
    },
    { label: "Open résumé", meta: "linkedin", run: () => void open(LINKS.resume, "_blank") },
    { label: "Play the typing test", meta: "secret level", run: playGame },
  ];

  const shown = cmds.filter((c) => fuzzy(q.toLowerCase(), (c.label + " " + c.meta).toLowerCase()));
  const sel = Math.min(at, shown.length - 1);

  const run = (c: Cmd | undefined) => {
    if (!c) return;
    // close first: goTo's slat wipe wants the top layer to itself
    ref.current?.close();
    c.run();
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!shown.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAt((n) => (Math.min(n, shown.length - 1) + 1) % shown.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAt((n) => (Math.min(n, shown.length - 1) + shown.length - 1) % shown.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(shown[sel]);
    }
  };

  return (
    <dialog
      className="pal"
      ref={ref}
      onClose={reset}
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close();
      }}
    >
      <div className="pal-box">
        <input
          className="pal-input"
          value={q}
          autoFocus
          placeholder="type a command"
          aria-label="Command"
          onChange={(e) => {
            setQ(e.target.value);
            setAt(0);
          }}
          onKeyDown={onKey}
        />
        <ul className="pal-list">
          {shown.map((c, i) => (
            <li
              className={`pal-row${i === sel ? " is-on" : ""}`}
              key={c.label}
              onPointerMove={() => setAt(i)}
              onClick={() => run(c)}
            >
              <span className="pal-label">{c.label}</span>
              <span className="pal-meta">{c.meta}</span>
            </li>
          ))}
          {!shown.length && <li className="pal-empty">nothing by that name.</li>}
        </ul>
        <p className="pal-foot">
          <span>↑↓ move</span>
          <span>↵ run</span>
          <span>esc close</span>
        </p>
      </div>
    </dialog>
  );
}
