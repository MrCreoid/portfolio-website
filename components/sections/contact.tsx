"use client";

import { useRef, useState } from "react";
import { EMAIL, LINKS, QUICK_CHIPS } from "@/lib/data";
import { usePortfolio } from "@/components/portfolio-provider";
import { GithubIcon } from "@/components/sections/projects";

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      <path d="m3 6 9 7 9-7" />
    </svg>
  );
}

export function Contact() {
  const { toast } = usePortfolio();
  const [copyLabel, setCopyLabel] = useState("copy");
  const [picked, setPicked] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const msgRef = useRef<HTMLTextAreaElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopyLabel("copied ✓");
      toast("Email copied to clipboard 📋");
      setTimeout(() => setCopyLabel("copy"), 2000);
    } catch {
      toast("Couldn't copy — email: " + EMAIL);
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

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const from = String(data.get("email") ?? "").trim();
    const msg = String(data.get("message") ?? "").trim();

    setSending(true);
    toast("Opening your mail app ✈");

    const subject = encodeURIComponent(`Portfolio contact from ${name}`);
    const body = encodeURIComponent(`${msg}\n\n— ${name} (${from})`);
    setTimeout(() => {
      location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
      setTimeout(() => {
        setSending(false);
        setPicked(null);
        formRef.current?.reset();
      }, 2500);
    }, 600);
  };

  return (
    <div className="container section-top">
      <h2 className="section-title" data-reveal>
        <span className="section-num">08</span> Contact
      </h2>
      <h3 className="contact-big" data-reveal>
        Let&apos;s build
        <br />
        something <span className="grad">together.</span>
      </h3>

      <div className="contact-grid">
        <div className="contact-left">
          <p data-reveal>
            Got an idea, an opportunity, or just want to talk code? My inbox is always
            open.
          </p>

          <button
            className="email-row magnetic"
            onClick={copyEmail}
            data-reveal
            data-cursor
          >
            <span className="email-text">{EMAIL}</span>
            <span className="email-copy">{copyLabel}</span>
          </button>

          <div className="socials" data-reveal>
            <a
              className="social magnetic"
              href={LINKS.github}
              target="_blank"
              rel="noopener"
              aria-label="GitHub"
              data-cursor
            >
              <GithubIcon size={22} />
            </a>
            <a
              className="social magnetic"
              href={LINKS.linkedin}
              target="_blank"
              rel="noopener"
              aria-label="LinkedIn"
              data-cursor
            >
              <LinkedInIcon />
            </a>
            <a
              className="social magnetic"
              href={`mailto:${EMAIL}`}
              aria-label="Email"
              data-cursor
            >
              <MailIcon />
            </a>
          </div>
        </div>

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

          <div className="field">
            <input type="text" id="fName" name="name" required placeholder=" " />
            <label htmlFor="fName">Your name</label>
          </div>
          <div className="field">
            <input type="email" id="fEmail" name="email" required placeholder=" " />
            <label htmlFor="fEmail">Your email</label>
          </div>
          <div className="field">
            <textarea
              id="fMsg"
              name="message"
              ref={msgRef}
              rows={4}
              required
              placeholder=" "
            />
            <label htmlFor="fMsg">Your message</label>
          </div>

          <button
            className={`btn btn-primary magnetic${sending ? " is-sent" : ""}`}
            type="submit"
            disabled={sending}
          >
            <span className="btn-label">
              {sending ? "Opening mail app…" : "Send message"}
            </span>
            <span className="btn-plane">✈</span>
          </button>
        </form>
      </div>
    </div>
  );
}
