/* ============================================================
   Site content. Everything that used to be duplicated markup in index.html
   lives here — add a project by adding an object, not by copying a <div>.
   ▼ marks the spots meant to be edited.
   ============================================================ */
import {
  ChartColumn,
  Clapperboard,
  Code2,
  Guitar,
  MoonStar,
  Rocket,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { asset } from "@/lib/utils";
/** The tab title at rest. Per-view titles hang off it; so does the metadata. */
export const SITE_TITLE = "Pratyush Garg — Portfolio";
export const VIEWS = ["home", "about", "projects", "achievements", "contact"] as const;
export type View = (typeof VIEWS)[number];
export const NAV: { id: View; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "projects", label: "Projects" },
  { id: "achievements", label: "Achievements" },
  { id: "contact", label: "Contact" },
];
/** powers the copy button, the mailto form and the email social link */
export const EMAIL = "pratyushgarg527@gmail.com";
export const LINKS = {
  github: "https://github.com/MrCreoid",
  linkedin: "https://www.linkedin.com/in/devpratyushgarg/",
  letterboxd: "https://letterboxd.com/MrCreoid/",
  githubHandle: "github.com/MrCreoid",
  resume: asset("/assets/resume.pdf"),
};
/** Day and month only — the year is never needed and never shown. */
export const BIRTHDAY = { day: 27, month: 5 };
export const EYEBROW_LINES = [
  "open to internships & collabs",
  "fueled by curiosity, mostly",
  "probably debugging right now",
  "cinephile with a compiler",
  "building something at 2 a.m.",
];
export const TYPE_WORDS = [
  "websites",
  "web experiences",
  "data crunchers",
  "ideas into code",
];
export const MARQUEE = [
  "HTML",
  "CSS",
  "JavaScript",
  "Python",
  "NumPy",
  "Pandas",
  "C",
  "clean code",
  "dark mode enjoyer",
];
export const WHAT_I_DO = [
  {
    icon: Code2,
    title: "Web experiences",
    body: "Interactive, animated sites built by hand in HTML, CSS and JavaScript. No page builders. I'd rather write the thing than configure it.",
  },
  {
    icon: ChartColumn,
    title: "Data & Python",
    body: "Mostly NumPy and Pandas. Hand me a messy CSV and I'll happily lose an afternoon to it.",
  },
  {
    icon: Rocket,
    title: "Always learning",
    body: "Right now that means C, and the bits of JavaScript I'd been avoiding. Second year starts August 2026.",
  },
];
export const STATS = [
  { count: 47, suffix: "", label: "tabs open right now" },
  { count: 12, suffix: "+", label: "easter eggs hidden here" },
  { count: 90, suffix: "+", label: "animations on this site" },
];
/* ---------------- about ---------------- */
export const CHIPS = [
  "B.Tech CS · FoT DU",
  "Delhi, India",
  "night-owl coder",
  "fast learner",
];
/* Only milestones that are actually documented — no invented roles or dates.
   Ordered oldest → newest so the section reads as progression, and each entry
   carries what changed, not just what happened. */
export const TIMELINE = [
  {
    date: "2024 — 2025",
    title: "Vice President, Byte Club",
    body: "Ran events and workshops for a year, and spent it convincing people that coding is fun. It worked on at least a few of them.",
  },
  {
    date: "Aug 2025",
    title: "B.Tech Computer Science, Faculty of Technology, University of Delhi",
    body: "Started the degree. The coding habit was already there; college gave it deadlines, a syllabus, and other people who cared about it.",
  },
  {
    date: "2025 — 2026",
    title: "Started shipping, not just studying",
    body: "Attendance Tracker and Spent: two tools I built because I wanted them, then put in front of other people. I learned React and Firebase by needing them.",
  },
  {
    date: "Aug 2026",
    title: "Second year begins",
    body: "More C, more JavaScript, and more data work with NumPy and Pandas.",
  },
];
/* The skills index. Read as an archive table: a numeral, the entry, one line
   on what it actually means, and a standing. No posters, no reviews — the film
   conceit lives on Letterboxd, not in a competency list. */
export type Skill = { name: string; note: string; status: string };
export const SKILLS: Skill[] = [
  {
    name: "HTML & CSS",
    note: "Grid, flexbox and custom properties, written by hand. That includes the 4,000-line stylesheet behind this page.",
    status: "daily",
  },
  {
    name: "JavaScript",
    note: "The DOM, async, canvas, and the browser underneath the frameworks. Most of what moves on this site is plain JS.",
    status: "daily",
  },
  {
    name: "TypeScript",
    note: "Every project here is written in it. Mostly it stops me shipping my own typos.",
    status: "building",
  },
  {
    name: "React & Next.js",
    note: "Components, hooks and app-router builds. Spent and Attendance Tracker both run on this stack, so I learned it by needing it.",
    status: "building",
  },
  {
    name: "Python",
    note: "My first language and still the one I reach for when a problem is really a data problem.",
    status: "daily",
  },
  {
    name: "NumPy & Pandas",
    note: "Cleaning up data that arrives in whatever shape it likes, then getting an answer out of it.",
    status: "data",
  },
  {
    name: "C",
    note: "Pointers, memory, and what the machine is actually doing underneath. Humbling, most weeks.",
    status: "learning",
  },
  {
    name: "Git & GitHub",
    note: "Branches, rebases and the occasional merge conflict I brought on myself.",
    status: "daily",
  },
];
export const BEYOND = [
  {
    icon: Clapperboard,
    title: "Cinephile",
    body: "Movies and series, religiously. Ratings live on ",
    link: { label: "letterboxd · @MrCreoid ↗", href: LINKS.letterboxd },
  },
  {
    icon: Guitar,
    title: "Guitarist",
    body: "Riffs between builds. The guitar comes out exactly when the bugs start winning.",
  },
  {
    icon: MoonStar,
    title: "Night owl",
    body: "Best ideas arrive after midnight. Sleep schedule: genuinely figuring it out.",
  },
];
export const FLIP_FACTS = [
  "certified cinephile. movies and series, religiously",
  "plays guitar when the bugs win",
  "the master plan? genuinely figuring it out",
];
/* ---------------- projects ---------------- */
export type Project = {
  id: string;
  kind: string;
  featured?: boolean;
  title: string;
  body: string;
  tags: string[];
  cat: string;
  /** `public/assets/shots/<id>.webp`. Leave it off and the work-index row
   *  carries no image for the trail to throw — better than a 404 per hover. */
  shot?: boolean;
  /** powers the in-site preview window; "#" or empty renders the empty state */
  url: string;
  repo: string;
};
/** ▼▼ add a project by adding an object ▼▼ */
export const PROJECTS: Project[] = [
  {
    id: "mcp-vetter",
    shot: true,
    kind: "featured",
    featured: true,
    title: "MCP Vetting Agent",
    body: "An AI security auditor for AI tools. Hand it a third-party MCP server and it clones the repo, reads the tools it declares, then runs AST rules and Docker-sandboxed probes against it in parallel — findings mapped to the OWASP Agentic Top 10. If the verdict is HIGH it drafts the security issue and then stops, and waits for a person to say yes.",
    tags: ["Python", "TypeScript", "FastMCP", "Docker"],
    cat: "ai",
    url: "https://ui-blond-six.vercel.app/",
    repo: "https://github.com/hemv-857/mcp-vetter-agent",
  },
  {
    id: "portfolio",
    shot: true,
    kind: "project",
    title: "This portfolio",
    body: "The site you're reading. Next.js, TypeScript and a hand-written stylesheet, with view routing, a canvas constellation, physics toys, and more secrets than it admits to.",
    tags: ["Next.js", "TypeScript", "Tailwind CSS"],
    cat: "web",
    url: asset("/"),
    repo: "https://github.com/MrCreoid/portfolio-website",
  },
  {
    id: "attendance",
    shot: true,
    kind: "project",
    title: "Attendance Tracker",
    body: "An attendance tracker for college students. Set your weekly timetable once, then mark each class as it happens.",
    tags: ["React", "TypeScript", "Tailwind CSS", "Firebase"],
    cat: "web",
    url: "https://mrcreoid.github.io/attendance-tracker/",
    repo: "https://github.com/MrCreoid/attendance-tracker",
  },
  {
    id: "spent",
    shot: true,
    kind: "project",
    title: "Spent",
    body: "An expense and debt tracker that feels like a native iOS app. Works offline, installs as a PWA, syncs across devices.",
    tags: ["Next.js", "React", "Tailwind CSS", "Firebase"],
    cat: "web",
    url: "https://mrcreoid.github.io/spent/",
    repo: "https://github.com/MrCreoid/spent",
  },
];
export const PROJECT_FILTERS = ["all", "ai", "web"];
/* ---------------- achievements ---------------- */
export type Achievement = {
  kind: string;
  title: string;
  issuer: string;
  year: string;
  fallback: LucideIcon;
  featured?: boolean;
  /** drop the file in public/assets and point here (wrapped in asset()) to
   *  make the card open a lightbox */
  image?: string;
};
/** ▼▼ add an entry and the ruled rows come back on their own ▼▼ */
export const ACHIEVEMENTS: Achievement[] = [];
/* ---------------- contact ---------------- */
export const QUICK_CHIPS = [
  {
    label: "internship",
    msg: "Hi Pratyush! I'd like to talk about an internship. ",
  },
  { label: "collab", msg: "Hey! I have an idea we could build together. " },
  {
    label: "just saying hi",
    msg: "Hey Pratyush, just saying hi. Found your site and ",
  },
];
/* ---------------- secret typing game ---------------- */
export const GAME_LINES = [
  'print("hello, recruiter!")',
  'const dream = "genuinely figuring it out";',
  "May the force be with the compiler.",
  "Houston, we have a runtime error.",
  "It's not a bug, it's a plot twist.",
  "while (alive) { code(); chai(); repeat(); }",
  'git commit -m "fixed it for real this time"',
  "Do. Or do not. There is no try {}.",
  "df.groupby('mood').agg({'bugs': 'sum'})",
  "I'll be back. (me, closing the editor at 3 a.m.)",
];
