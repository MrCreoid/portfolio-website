"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { EMAIL, LINKS, NAV } from "@/lib/data";
import { EGGS, foundEggs } from "@/lib/eggs";
import { announceCozy } from "@/hooks/use-eggs";
import { usePortfolio } from "@/components/portfolio-provider";

type Cmd = { label: string; meta: string; run: () => void; keep?: boolean };

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
 */
export function Palette() {
  const { goTo, toast, cozy, setCozy, crt, setCrt, playGame } = usePortfolio();
  const ref = useRef<HTMLDialogElement | null>(null);
  const [q, setQ] = useState("");
  const [at, setAt] = useState(0);
  // non-null puts the box on its second page: the egg ledger
  const [eggs, setEggs] = useState<string[] | null>(null);

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
    setEggs(null);
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
    { label: "Open résumé", meta: "pdf", run: () => void open(LINKS.resume, "_blank") },
    {
      label: `${cozy ? "Leave" : "Enter"} cozy mode`,
      meta: "warm",
      run: () => {
        setCozy(!cozy);
        announceCozy(!cozy, toast);
      },
    },
    {
      label: `${crt ? "Leave" : "Enter"} CRT mode`,
      meta: "phosphor",
      run: () => {
        setCrt(!crt);
        toast(crt ? "back to the future" : "CRT mode engaged. same code exits.");
      },
    },
    {
      label: "Toggle the grid",
      meta: "12 columns",
      run: () => {
        const on = document.body.classList.toggle("show-grid");
        toast(on ? "twelve columns. always were." : "grid off");
      },
    },
    { label: "Play the typing test", meta: "secret level", run: playGame },
    {
      label: "The eggs I've found",
      meta: `${foundEggs().length} / ${EGGS.length}`,
      keep: true,
      run: () => {
        setEggs(foundEggs());
        setQ("");
        setAt(0);
      },
    },
  ];

  const shown = cmds.filter((c) => fuzzy(q.toLowerCase(), (c.label + " " + c.meta).toLowerCase()));
  const sel = Math.min(at, shown.length - 1);

  const run = (c: Cmd | undefined) => {
    if (!c) return;
    // close first: goTo's slat wipe wants the top layer to itself
    if (!c.keep) ref.current?.close();
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
        {eggs ? (
          <>
            <p className="pal-kicker">{`// ${eggs.length} of ${EGGS.length} found`}</p>
            <ul className="pal-list is-eggs">
              {EGGS.map((egg) => {
                const got = eggs.includes(egg.id);
                return (
                  <li className={`pal-row${got ? " is-found" : ""}`} key={egg.id}>
                    <span className="pal-label">{got ? egg.name : "▮▮▮▮ ▮▮▮▮▮▮"}</span>
                    <span className="pal-meta">{got ? "found" : egg.hint}</span>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <>
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
          </>
        )}
        <p className="pal-foot">
          {/* the ledger is a page to read, not a list to run */}
          {!eggs && <span>↑↓ move</span>}
          {!eggs && <span>↵ run</span>}
          <span>esc close</span>
        </p>
      </div>
    </dialog>
  );
}
