"use client";

import { RotateCw, Send } from "lucide-react";
import { useRef, useState } from "react";
import { EMAIL, LINKS, QUICK_CHIPS } from "@/lib/data";
import { usePortfolio } from "@/components/portfolio-provider";
import { GithubIcon } from "@/components/sections/projects";
import { Roll } from "@/components/layout/header";
import { Chars, SectionHead } from "@/components/layout/section-head";

type Status = "idle" | "sending" | "sent" | "error";

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
  const msgRef = useRef<HTMLTextAreaElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

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

  const pickChip = (i: number) => {
    setPicked(i);
    const msg = msgRef.current;
    if (!msg) return;
    msg.value = QUICK_CHIPS[i].msg;
    msg.focus();
    msg.setSelectionRange(msg.value.length, msg.value.length);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const from = String(data.get("email") ?? "").trim();
    const msg = String(data.get("message") ?? "").trim();

    // no endpoint configured yet — hand off to the mail client so the form is
    // never a dead end, and upgrade the moment a key exists
    if (!ACCESS_KEY) {
      toast("Opening your mail app");
      const subject = encodeURIComponent(`Portfolio contact from ${name}`);
      const body = encodeURIComponent(`${msg}\n\n— ${name} (${from})`);
      location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: ACCESS_KEY,
          subject: `Portfolio contact from ${name}`,
          from_name: name,
          name,
          email: from,
          message: msg,
        }),
      });
      const json = (await res.json()) as { success?: boolean };
      if (!res.ok || !json.success) throw new Error("rejected");
      setStatus("sent");
      setPicked(null);
      form.reset();
    } catch {
      setStatus("error");
    }
  };

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

        {status === "sent" ? (
          /* the archive metaphor doing real work: the message is filed, and the
             plate keeps the same rules the form sat on */
          <div className="form-filed" data-reveal role="status">
            <span className="filed-stamp">Filed</span>
            <h4>Message received.</h4>
            <p>
              It&apos;s in my inbox. I read everything and usually reply within a
              day or two.
            </p>
            <button
              className="filed-again"
              onClick={() => setStatus("idle")}
              data-cursor
            >
              Send another <span className="whisper-arrow">→</span>
            </button>
          </div>
        ) : (
          <form className="contact-form" ref={formRef} onSubmit={submit} data-reveal>
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

            <div className="field" data-reveal>
              <input
                type="text"
                id="fName"
                name="name"
                required
                placeholder=" "
                disabled={status === "sending"}
              />
              <label htmlFor="fName">Your name</label>
            </div>
            <div className="field" data-reveal>
              <input
                type="email"
                id="fEmail"
                name="email"
                required
                placeholder=" "
                disabled={status === "sending"}
              />
              <label htmlFor="fEmail">Your email</label>
            </div>
            <div className="field" data-reveal>
              <textarea
                id="fMsg"
                name="message"
                ref={msgRef}
                rows={4}
                required
                placeholder=" "
                disabled={status === "sending"}
              />
              <label htmlFor="fMsg">Your message</label>
            </div>

            {status === "error" && (
              <p className="form-error" role="alert">
                That didn&apos;t go through. Try again, or mail me directly at{" "}
                <a href={`mailto:${EMAIL}`} data-cursor>
                  {EMAIL}
                </a>
                .
              </p>
            )}

            <button
              className={`btn btn-primary magnetic${status === "sending" ? " is-sending" : ""}`}
              type="submit"
              disabled={status === "sending"}
              data-reveal
            >
              <Roll>
                {status === "sending"
                  ? "Sending…"
                  : status === "error"
                    ? "Try again"
                    : "Send message"}
              </Roll>
              {status === "sending" ? (
                <RotateCw className="btn-spin" size={15} strokeWidth={2} aria-hidden="true" />
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
          </form>
        )}
      </div>
    </div>
  );
}
