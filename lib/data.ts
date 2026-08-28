/* ============================================================
   Site content. Everything that used to be duplicated markup in index.html
   lives here — add a project by adding an object, not by copying a <div>.
   ▼ marks the spots meant to be edited.
   ============================================================ */

export const VIEWS = ["home", "about", "projects", "achievements", "contact"] as const;
export type View = (typeof VIEWS)[number];

export const NAV: { id: View; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "projects", label: "Projects" },
  { id: "achievements", label: "Achievements" },
  { id: "contact", label: "Contact" },
];

/** ▼ your email — powers the copy button, the mailto form and the email social link */
export const EMAIL = "pratyushgarg@example.com";

/** ▼ your profiles */
export const LINKS = {
  github: "#",
  linkedin: "#",
  letterboxd: "https://letterboxd.com/MrCreoid/",
  githubHandle: "github.com/yourhandle",
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
    icon: "⌨️",
    title: "Web experiences",
    body: "Interactive, animated websites built with hand-written HTML, CSS and JavaScript. No shortcuts — every pixel placed on purpose.",
  },
  {
    icon: "📊",
    title: "Data & Python",
    body: "NumPy and Pandas are my playground. I like taking messy data and turning it into something that actually says something.",
  },
  {
    icon: "🚀",
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
  "🎓 B.Tech CS · FoT DU",
  "📍 Delhi, India",
  "🌙 night-owl coder",
  "⚡ fast learner",
];

/** ▼▼ duplicate an entry per milestone ▼▼ */
export const TIMELINE = [
  {
    date: "2024 — 2025",
    title: "Vice President — Byte Club",
    body: "Ran events and workshops, and spent a year convincing people that coding is fun. It worked on at least a few.",
  },
  {
    date: "Aug 2025",
    title: "Started B.Tech CS — Faculty of Technology, DU",
    body: 'First print("hello world") in a DU lab. No looking back since.',
    code: 'print("hello world")',
  },
  {
    date: "2026",
    title: "Your next milestone here",
    body: "Add an entry to TIMELINE in lib/data.ts whenever something happens. Keep the flow going.",
  },
];

const devicon = (name: string, variant = "original") =>
  `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${name}/${name}-${variant}.svg`;

export const FILMS = [
  {
    title: "HTML & CSS",
    review: '"a timeless double feature — structure falls for style."',
    tag: "rewatched daily",
    posters: [devicon("html5"), devicon("css3")],
  },
  {
    title: "JavaScript",
    review: '"chaotic, brilliant, occasionally undefined. would import again."',
    tag: "now showing",
    posters: [devicon("javascript")],
  },
  {
    title: "Python",
    review: '"elegant pacing. zero semicolon jump-scares."',
    tag: "now showing",
    posters: [devicon("python")],
  },
  {
    title: "NumPy & Pandas",
    review: '"a gripping documentary about taming wild data."',
    tag: "double feature",
    posters: [devicon("numpy"), devicon("pandas")],
  },
  {
    title: "Git & GitHub",
    review: '"a time-travel thriller. the merge-conflict scene still haunts me."',
    tag: "daily driver",
    posters: [devicon("git")],
  },
  {
    title: "C",
    review:
      '"psychological horror. pointers everywhere. \'character-building\' — critics."',
    tag: "in the watchlist",
    posters: [devicon("c")],
  },
  {
    title: "VS Code",
    review: '"home."',
    tag: "long-running series",
    posters: [devicon("vscode")],
  },
];

export const BEYOND = [
  {
    icon: "🎬",
    title: "Cinephile",
    body: "Movies & series, religiously. Ratings live on ",
    link: { label: "letterboxd · @MrCreoid ↗", href: LINKS.letterboxd },
  },
  {
    icon: "🎸",
    title: "Guitarist",
    body: "Riffs between builds. The guitar gets picked up exactly when the bugs start winning.",
  },
  {
    icon: "🌌",
    title: "Night owl",
    body: "Best ideas arrive after midnight. Sleep schedule: genuinely figuring it out.",
  },
];

export const FLIP_FACTS = [
  { emoji: "🎬", text: "certified cinephile — movies & series, religiously" },
  { emoji: "🎸", text: "plays guitar when the bugs win" },
  { emoji: "🧭", text: "the master plan? genuinely figuring it out" },
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
    kind: "featured",
    featured: true,
    title: "This portfolio",
    body: "The site you're looking at — React, TypeScript and a hand-written stylesheet. SPA routing, canvas constellation, physics toys and more secrets than it admits to.",
    tags: ["Next.js", "TypeScript", "Tailwind CSS"],
    cat: "web",
    url: "/",
    repo: "#",
  },
  {
    id: "attendance",
    kind: "project",
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
  fallback: string;
  featured?: boolean;
  /** drop the file in public/assets and point here to make the card open a lightbox */
  image?: string;
};

/** ▼▼ edit / duplicate ▼▼ */
export const ACHIEVEMENTS: Achievement[] = [
  {
    kind: "Certificate",
    title: "Your Certificate Title",
    issuer: "Issued by — Organisation name",
    year: "2025",
    fallback: "🏆",
    featured: true,
    image: "/assets/certificate-1.jpg",
  },
  {
    kind: "Competition",
    title: "Competition Name",
    issuer: "What you did / where you placed",
    year: "2025",
    fallback: "⚔️",
  },
];

/* ---------------- contact ---------------- */

export const QUICK_CHIPS = [
  {
    label: "💼 internship",
    msg: "Hi Pratyush! I'd love to talk about an internship opportunity — ",
  },
  { label: "🤝 collab", msg: "Hey! I have an idea we could build together — " },
  {
    label: "👋 just saying hi",
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
