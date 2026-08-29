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
  resume: "/assets/resume.pdf",
};
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
    body: "Interactive, animated websites built with hand-written HTML, CSS and JavaScript. No shortcuts — every pixel placed on purpose.",
  },
  {
    icon: ChartColumn,
    title: "Data & Python",
    body: "NumPy and Pandas are my playground. I like taking messy data and turning it into something that actually says something.",
  },
  {
    icon: Rocket,
    title: "Always learning",
    body: "Currently sharpening C and going deeper into JavaScript. Second year starts August 2026 — the roadmap only gets bigger.",
  },
];
export const STATS = [
  { count: 47, suffix: "", label: "tabs open right now" },
  { count: 12, suffix: "+", label: "easter eggs hidden here" },
  { count: 60, suffix: "+", label: "animations on this site" },
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
    title: "B.Tech Computer Science, Faculty of Technology — University of Delhi",
    body: "First print(\"hello world\") in a DU lab. Coding stopped being a subject on a timetable somewhere around week three.",
    code: 'print("hello world")',
  },
  {
    date: "2025 — 2026",
    title: "Started shipping, not just studying",
    body: "Attendance Tracker and Spent — two tools built because I actually wanted them, then put in front of other people. React and Firebase learned by needing them.",
  },
  {
    date: "Aug 2026",
    title: "Second year begins",
    body: "Going deeper into C and JavaScript, and further into data with NumPy and Pandas.",
  },
];
/* The skills index. Read as an archive table: a numeral, the entry, one line
   on what it actually means, and a standing. No posters, no reviews — the film
   conceit lives on Letterboxd, not in a competency list. */
export type Skill = { name: string; note: string; status: string };
export const SKILLS: Skill[] = [
  {
    name: "HTML & CSS",
    note: "Semantic structure and modern layout — grid, flexbox, custom properties. Hand-written, including the 3,000-line stylesheet behind this page.",
    status: "daily",
  },
  {
    name: "JavaScript",
    note: "The DOM, async, canvas and the browser platform underneath the frameworks. Most of the interaction on this site is plain JS.",
    status: "daily",
  },
  {
    name: "TypeScript",
    note: "Types as a design tool rather than decoration. Every project below is written in it.",
    status: "building",
  },
  {
    name: "React & Next.js",
    note: "Components, hooks and app-router builds. Learned by needing them — Spent and Attendance Tracker both run on this stack.",
    status: "building",
  },
  {
    name: "Python",
    note: "My first language and still the one I reach for when a problem is really a data problem.",
    status: "daily",
  },
  {
    name: "NumPy & Pandas",
    note: "Taking messy data and turning it into something that actually says something.",
    status: "data",
  },
  {
    name: "C",
    note: "Pointers, memory and what the machine is genuinely doing underneath. Character-building, as the critics say.",
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
    body: "Movies & series, religiously. Ratings live on ",
    link: { label: "letterboxd · @MrCreoid ↗", href: LINKS.letterboxd },
  },
  {
    icon: Guitar,
    title: "Guitarist",
    body: "Riffs between builds. The guitar gets picked up exactly when the bugs start winning.",
  },
  {
    icon: MoonStar,
    title: "Night owl",
    body: "Best ideas arrive after midnight. Sleep schedule: genuinely figuring it out.",
  },
];
export const FLIP_FACTS = [
  "certified cinephile — movies & series, religiously",
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
  /** powers the in-site preview window; "#" or empty renders the empty state */
  url: string;
  repo: string;
};
/** ▼▼ add a project by adding an object ▼▼ */
export const PROJECTS: Project[] = [
  {
    id: "portfolio",
    kind: "project",
    title: "This portfolio",
    body: "The site you're looking at — React, TypeScript and a hand-written stylesheet. SPA routing, canvas constellation, physics toys and more secrets than it admits to.",
    tags: ["Next.js", "TypeScript", "Tailwind CSS"],
    cat: "web",
    url: "/",
    repo: "https://github.com/MrCreoid/portfolio-website",
  },
  {
    id: "attendance",
    kind: "featured",
    featured: true,
    title: "Attendance Tracker",
    body: "A premium, glassmorphic attendance-tracking dashboard built for college students. Set up your weekly timetable once and track attendance seamlessly.",
    tags: ["React", "TypeScript", "Tailwind CSS", "Firebase"],
    cat: "web",
    url: "https://mrcreoid.github.io/attendance-tracker/",
    repo: "https://github.com/MrCreoid/attendance-tracker",
  },
  {
    id: "spent",
    kind: "project",
    title: "Spent",
    body: "A fast, minimal expense & debt tracker that feels like a native iOS app. Local-first, installable as a PWA, and synced across devices.",
    tags: ["Next.js", "React", "Tailwind CSS", "Firebase"],
    cat: "web",
    url: "https://mrcreoid.github.io/spent/",
    repo: "https://github.com/MrCreoid/spent",
  },
];
export const PROJECT_FILTERS = ["all", "web"];
/* ---------------- achievements ---------------- */
export type Achievement = {
  kind: string;
  title: string;
  issuer: string;
  year: string;
  fallback: LucideIcon;
  featured?: boolean;
  /** drop the file in public/assets and point here to make the card open a lightbox */
  image?: string;
};
/** ▼▼ add an entry and the ruled rows come back on their own ▼▼ */
export const ACHIEVEMENTS: Achievement[] = [];
/* ---------------- contact ---------------- */
export const QUICK_CHIPS = [
  {
    label: "internship",
    msg: "Hi Pratyush! I'd love to talk about an internship opportunity — ",
  },
  { label: "collab", msg: "Hey! I have an idea we could build together — " },
  {
    label: "just saying hi",
    msg: "Hey Pratyush, just saying hi! Found your site and ",
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
  "I'll be back. — me, closing the editor at 3 a.m.",
];
