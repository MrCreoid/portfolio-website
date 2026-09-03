"use client";

import { RotateCw, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { EMAIL, LINKS, QUICK_CHIPS } from "@/lib/data";
import { code39 } from "@/lib/barcode";
import { usePortfolio } from "@/components/portfolio-provider";
import { GithubIcon } from "@/components/sections/projects";
import { Roll } from "@/components/layout/header";
import { Chars, SectionHead } from "@/components/layout/section-head";

type Status = "idle" | "sending" | "sent" | "error";
type Filed = { name: string; email: string; ref: string; at: string };

/* One question at a time. A form is a conversation, and three fields stacked
   in a column is an interrogation. */
const STEPS = [
  { name: "name", ask: "who are you?", label: "Your name", type: "text" },
  { name: "email", ask: "where do I reply?", label: "Your email", type: "email" },
  { name: "message", ask: "what's on your mind?", label: "Your message", type: "textarea" },
] as const;

/** PG-2026-XXXX. Not a database id — a filing reference, which is the point. */
const makeRef = () =>
  `PG-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const filedAt = () =>
  new Date()
    .toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false,
    })
    .replace(",", "")
    .toUpperCase();

/* Set NEXT_PUBLIC_WEB3FORMS_KEY to post the form for real. Without it the form
   still works — it falls back to opening the visitor's mail client. The key is
   public by design; the address it delivers to is not in this bundle. */
const ACCESS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_KEY;

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="2.5" y="4.5" width="19" height="15" />
      <path d="m3 6 9 7 9-7" />
    </svg>
  );
}

export function Contact() {
  const { toast } = usePortfolio();
  const [copyLabel, setCopyLabel] = useState("copy");
  const [picked, setPicked] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [step, setStep] = useState(0);
  const [vals, setVals] = useState({ name: "", email: "", message: "" });
  const [err, setErr] = useState("");
  const [filed, setFiled] = useState<Filed | null>(null);

  const fieldRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const typing = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => () => clearInterval(typing.current), []);

  /* The caret follows the conversation — but only once it is a conversation.
     All five views are mounted at all times, so focusing from an effect on
     mount aims at a field inside a `display: none` section and lands on the
     body; and arriving at the view is no reason to seize the caret anyway. It
     moves on the transition, after the frame that renders the next field. */
  const focusField = () => requestAnimationFrame(() => fieldRef.current?.focus());

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopyLabel("copied ✓");
      toast("Email copied to clipboard");
      setTimeout(() => setCopyLabel("copy"), 2000);
    } catch {
      toast("Couldn't copy. Email: " + EMAIL);
    }
  };

  /* a chip does not paste — it writes the opening line for you, at the speed
     of someone thinking about it */
  const pickChip = (i: number) => {
    setPicked(i);
    const full = QUICK_CHIPS[i].msg;
    clearInterval(typing.current);
    let n = 0;
    setVals((v) => ({ ...v, message: "" }));
    typing.current = setInterval(() => {
      n++;
      setVals((v) => ({ ...v, message: full.slice(0, n) }));
      if (n >= full.length) clearInterval(typing.current);
    }, 16);
    fieldRef.current?.focus();
  };


  /** What is wrong with the current answer, or "" if nothing is. */
  const problem = useCallback(
    (i: number) => {
      const v = vals[STEPS[i].name].trim();
      if (!v) return `${STEPS[i].label} — I do need this one.`;
      if (STEPS[i].name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v))
        return "That address doesn't look like one. Check it?";
      return "";
    },
    [vals],
  );

  const send = useCallback(async () => {
    const name = vals.name.trim();
    const from = vals.email.trim();
    const msg = vals.message.trim();
    const subject = `Portfolio contact from ${name}`;

    // no endpoint configured yet — hand off to the mail client so the form is
    // never a dead end, and upgrade the moment a key exists
    if (!ACCESS_KEY) {
      toast("Opening your mail app");
      location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
        `${msg}\n\n— ${name} (${from})`,
      )}`;
      return;
    }

    setStatus("sending");
    setErr("");
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: ACCESS_KEY,
          subject,
          from_name: name,
          name,
          email: from,
          message: msg,
        }),
      });
      const json = (await res.json()) as { success?: boolean };
      if (!res.ok || !json.success) throw new Error("rejected");
      setFiled({ name, email: from, ref: makeRef(), at: filedAt() });
      setStatus("sent");
    } catch {
      setStatus("error");
      setErr("That didn't go through.");
    }
  }, [toast, vals]);

  /* Enter is the only control the flow needs: it answers the question and
     asks the next one, and on the last one it files. */
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const bad = problem(step);
    if (bad) {
      setErr(bad);
      fieldRef.current?.focus();
      return;
    }
    setErr("");
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      focusField();
      return;
    }
    void send();
  };

  const restart = () => {
    setVals({ name: "", email: "", message: "" });
    setPicked(null);
    setFiled(null);
    setErr("");
    setStep(0);
    setStatus("idle");
    focusField();
  };

  const current = STEPS[step];
  const bar = code39(filed?.ref ?? "");

  return (
    <div className="container section-top">
      <SectionHead title="Contact" variant="light" meta="Inbox: open" />

      <h3 className="contact-big" data-reveal data-cursor="blend" aria-label="Let's build something together.">
        <span className="line-1">
          <Chars text="Let's build" />
        </span>
        <span className="line-2">
          <Chars text="something " />
          <span className="accent">
            <Chars text="together." />
          </span>
        </span>
      </h3>

      <div className="contact-grid">
        <div className="contact-left">
          <p data-reveal data-words>
            Got something worth a late night? Tell me about it. The inbox is
            always open.
          </p>

          <button
            className="email-row magnetic"
            onClick={copyEmail}
            data-reveal
            data-cursor="copy"
          >
            <span className="email-text">{EMAIL}</span>
            <span className="email-copy">{copyLabel}</span>
          </button>

          <div className="socials" data-reveal>
            <a
              className="social"
              href={LINKS.github}
              target="_blank"
              rel="noopener"
              aria-label="GitHub"
              data-cursor
            >
              <GithubIcon size={20} />
            </a>
            <a
              className="social"
              href={LINKS.linkedin}
              target="_blank"
              rel="noopener"
              aria-label="LinkedIn"
              data-cursor
            >
              <LinkedInIcon />
            </a>
            <a
              className="social"
              href={`mailto:${EMAIL}`}
              aria-label="Email"
              data-cursor
            >
              <MailIcon />
            </a>
          </div>

          <dl className="contact-meta" data-reveal>
            <div>
              <dt>Based in</dt>
              <dd data-scramble>Delhi, India — GMT+5:30</dd>
            </div>
            <div>
              <dt>Open to</dt>
              <dd data-scramble>Internships · collaborations</dd>
            </div>
            <div>
              <dt>Replies in</dt>
              <dd data-scramble>A day or two, usually</dd>
            </div>
          </dl>
        </div>

        {status === "sent" && filed ? (
          /* The archive metaphor doing real work: the message is filed, and
             what comes back is the docket — line items, a reference number,
             and that number as a real barcode rather than a picture of one.
             No `data-reveal`: the reveal observer was wired up long before
             this plate existed, so it would sit at opacity 0 forever — and a
             receipt has to be there the instant it prints. */
          <div className="receipt" role="status">
            <span className="rc-stamp" aria-hidden="true">
              Filed
            </span>
            <p className="rc-kicker">{"// acknowledgement of receipt"}</p>
            <h4>Message received.</h4>
            <dl className="rc-lines">
              <div>
                <dt>from</dt>
                <dd>
                  {filed.name} &lt;{filed.email}&gt;
                </dd>
              </div>
              <div>
                <dt>subject</dt>
                <dd>Portfolio contact from {filed.name}</dd>
              </div>
              <div>
                <dt>filed at</dt>
                <dd>{filed.at}</dd>
              </div>
              <div>
                <dt>ref no.</dt>
                <dd>{filed.ref}</dd>
              </div>
            </dl>
            <svg
              className="rc-bar"
              viewBox={`0 0 ${bar.width} 40`}
              preserveAspectRatio="none"
              role="img"
              aria-label={`Barcode of reference ${filed.ref}`}
            >
              {bar.bars.map((b) => (
                <rect key={b.x} x={b.x} y="0" width={b.w} height="40" />
              ))}
            </svg>
            <span className="rc-ref">{filed.ref}</span>
            <p className="rc-note">
              I read everything, and usually reply within a day or two.
            </p>
            <button className="rc-again" onClick={restart} data-cursor>
              Send another <span className="whisper-arrow">→</span>
            </button>
          </div>
        ) : (
          <form className="contact-form" onSubmit={submit} data-reveal noValidate>
            <p className="cf-ask">
              <b>{String(step + 1).padStart(2, "0")}</b>
              <span>{current.ask}</span>
              <i aria-hidden="true">of {String(STEPS.length).padStart(2, "0")}</i>
            </p>
            <span className="cf-rule" aria-hidden="true">
              <i style={{ transform: `scaleX(${(step + 1) / STEPS.length})` }} />
            </span>

            {current.type === "textarea" ? (
              <>
                <div className="quick-chips" role="group" aria-label="Quick message starters">
                  {QUICK_CHIPS.map((chip, i) => (
                    <button
                      type="button"
                      key={chip.label}
                      className={`qchip${picked === i ? " is-picked" : ""}`}
                      onClick={() => pickChip(i)}
                      data-cursor
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
                <div className="field">
                  <textarea
                    id="fMsg"
                    name="message"
                    ref={fieldRef as React.RefObject<HTMLTextAreaElement>}
                    rows={5}
                    placeholder=" "
                    value={vals.message}
                    disabled={status === "sending"}
                    onChange={(e) => setVals((v) => ({ ...v, message: e.target.value }))}
                    /* Enter belongs to the paragraph here, so the shortcut
                       files instead */
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        if (!problem(step)) void send();
                      }
                    }}
                  />
                  <label htmlFor="fMsg">{current.label}</label>
                </div>
              </>
            ) : (
              <div className="field">
                <input
                  id={`f-${current.name}`}
                  name={current.name}
                  type={current.type}
                  ref={fieldRef as React.RefObject<HTMLInputElement>}
                  placeholder=" "
                  autoComplete={current.name === "email" ? "email" : "name"}
                  value={vals[current.name]}
                  onChange={(e) =>
                    setVals((v) => ({ ...v, [current.name]: e.target.value }))
                  }
                />
                <label htmlFor={`f-${current.name}`}>{current.label}</label>
              </div>
            )}

            {(err || status === "error") && (
              <p className="form-error" role="alert">
                {err || "That didn't go through."}
                {status === "error" && (
                  <>
                    {" "}
                    Try again, or mail me directly at{" "}
                    <a href={`mailto:${EMAIL}`} data-cursor>
                      {EMAIL}
                    </a>
                    .
                  </>
                )}
              </p>
            )}

            <div className="cf-actions">
              {step > 0 && (
                <button
                  className="cf-back"
                  type="button"
                  onClick={() => {
                    setErr("");
                    setStep(step - 1);
                    focusField();
                  }}
                  data-cursor
                >
                  <span className="whisper-arrow">←</span> back
                </button>
              )}
              <button
                className={`btn btn-primary magnetic${status === "sending" ? " is-sending" : ""}`}
                type="submit"
                disabled={status === "sending"}
              >
                <Roll>
                  {status === "sending"
                    ? "Filing…"
                    : step < STEPS.length - 1
                      ? "Next"
                      : status === "error"
                        ? "Try again"
                        : "Send message"}
                </Roll>
                {status === "sending" ? (
                  <RotateCw className="btn-spin" size={15} strokeWidth={2} aria-hidden="true" />
                ) : step < STEPS.length - 1 ? (
                  <span className="arrow" aria-hidden="true">
                    →
                  </span>
                ) : status === "error" ? (
                  <RotateCw className="btn-plane" size={15} strokeWidth={2} aria-hidden="true" />
                ) : (
                  <>
                    <Send className="btn-plane" size={15} strokeWidth={2} aria-hidden="true" />
                    <span className="arrow" aria-hidden="true">
                      →
                    </span>
                  </>
                )}
              </button>
            </div>
            <p className="cf-hint" aria-hidden="true">
              {step < STEPS.length - 1 ? "↵ next" : "⌘↵ send"}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
