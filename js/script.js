/* ============================================================
   Pratyush Garg — Portfolio
   view router · cursor · particles · toys · easter eggs
   ============================================================ */

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (a, b) => a + Math.random() * (b - a);
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(pointer: fine)").matches;

const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

/* shared state */
let cozyActive = false;
const particleTheme = { dot: "rgba(167, 139, 250, 0.5)", line: "139, 92, 246" };
/* the crystal's gravity well — the particle field reads this */
const well = { x: 0, y: 0, active: false, strength: 0 };

/* ---------------- toast ---------------- */
const toastEl = $("#toast");
let toastTimer;
function toast(msg, ms = 2400) {
  toastEl.textContent = msg;
  toastEl.classList.add("is-show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("is-show"), ms);
}

/* ---------------- eyebrow rotator ---------------- */
(() => {
  const lines = [
    "open to internships & collabs",
    "fueled by curiosity, mostly",
    "probably debugging right now",
    "cinephile with a compiler",
    "building something at 2 a.m.",
  ];
  const el = $("#eyebrowLine");
  if (!el || reducedMotion) return;
  let i = 0;
  setInterval(() => {
    el.animate(
      [
        { transform: "translateY(0)", opacity: 1 },
        { transform: "translateY(-115%)", opacity: 0 },
      ],
      { duration: 320, easing: "ease-in", fill: "forwards" },
    ).onfinish = () => {
      i = (i + 1) % lines.length;
      el.textContent = lines[i];
      el.animate(
        [
          { transform: "translateY(115%)", opacity: 0 },
          { transform: "translateY(0)", opacity: 1 },
        ],
        {
          duration: 420,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "forwards",
        },
      );
    };
  }, 3600);
})();

/* ---------------- reveal system ---------------- */
function resetReveals(view) {
  $$("[data-reveal]", view).forEach((el) => el.classList.remove("is-in"));
}
function runReveals(view) {
  const els = $$("[data-reveal]", view);
  els.forEach((el) => el.classList.remove("is-in"));
  void view.offsetHeight; // reflow so transitions re-trigger on revisit
  els.forEach((el, i) => {
    el.style.setProperty("--d", `${Math.min(i * 70, 900)}ms`);
    el.classList.add("is-in");
  });
}

/* ---------------- counters ---------------- */
function runCounters(view) {
  $$("[data-count]", view).forEach((el) => {
    const target = +el.dataset.count;
    const t0 = performance.now();
    (function tick(t) {
      const p = Math.min((t - t0) / 1100, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  });
}

/* ---------------- view router (no URL change) ---------------- */
const transition = $("#transition");
const views = {
  home: $("#view-home"),
  about: $("#view-about"),
  projects: $("#view-projects"),
  achievements: $("#view-achievements"),
  contact: $("#view-contact"),
};
let currentView = "home";
let isAnimating = false;

async function goTo(name, cx, cy) {
  if (isAnimating || !views[name]) return;
  if (name === currentView) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  isAnimating = true;
  closeMenu();

  if (reducedMotion) {
    views[currentView].classList.remove("is-active");
    views[name].classList.add("is-active");
    window.scrollTo(0, 0);
    finishSwitch(name);
    isAnimating = false;
    return;
  }

  // the wipe circle grows out of wherever the click came from
  transition.style.setProperty("--cx", (cx ?? innerWidth / 2) + "px");
  transition.style.setProperty("--cy", (cy ?? innerHeight / 2) + "px");
  transition.classList.add("is-covering");
  await wait(640);

  views[currentView].classList.remove("is-active");
  views[name].classList.add("is-active");
  window.scrollTo(0, 0);
  resetReveals(views[name]);

  transition.classList.add("is-leaving");
  await wait(80);
  finishSwitch(name);
  await wait(580);

  transition.classList.remove("is-covering", "is-leaving");
  isAnimating = false;
}

function finishSwitch(name) {
  currentView = name;
  runReveals(views[name]);
  runCounters(views[name]);
  updateNavActive();
  moveIndicator();
}

document.addEventListener("click", (e) => {
  const trigger = e.target.closest("[data-nav]");
  if (!trigger) return;
  const r = trigger.getBoundingClientRect();
  goTo(trigger.dataset.nav, r.left + r.width / 2, r.top + r.height / 2);
});

/* ---------------- nav indicator ---------------- */
const indicator = $(".nav-indicator");
function updateNavActive() {
  $$(".nav-link").forEach((l) =>
    l.classList.toggle("is-active", l.dataset.nav === currentView),
  );
  $$(".m-link").forEach((l) =>
    l.classList.toggle("is-active", l.dataset.nav === currentView),
  );
}
function moveIndicator() {
  const active = $(".nav-link.is-active");
  if (!active || !indicator) return;
  indicator.style.left = active.offsetLeft + "px";
  indicator.style.width = active.offsetWidth + "px";
}
window.addEventListener("resize", moveIndicator);

/* ---------------- mobile menu ---------------- */
const burger = $("#burger");
const mobileMenu = $("#mobileMenu");
function closeMenu() {
  burger.classList.remove("is-open");
  mobileMenu.classList.remove("is-open");
  burger.setAttribute("aria-expanded", "false");
  document.body.classList.remove("is-locked");
}
burger.addEventListener("click", () => {
  const open = !mobileMenu.classList.contains("is-open");
  burger.classList.toggle("is-open", open);
  mobileMenu.classList.toggle("is-open", open);
  burger.setAttribute("aria-expanded", String(open));
  document.body.classList.toggle("is-locked", open);
});

/* ---------------- typewriter ---------------- */
const typeWords = [
  "websites",
  "web experiences",
  "data crunchers",
  "ideas into code",
];
const typeEl = $("#typewriter");
(async function typeLoop() {
  if (reducedMotion) {
    typeEl.textContent = typeWords[0];
    return;
  }
  let i = 0;
  for (;;) {
    const word = typeWords[i % typeWords.length];
    for (let c = 1; c <= word.length; c++) {
      typeEl.textContent = word.slice(0, c);
      await wait(65);
    }
    await wait(1700);
    for (let c = word.length; c >= 0; c--) {
      typeEl.textContent = word.slice(0, c);
      await wait(32);
    }
    await wait(350);
    i++;
  }
})();

/* ---------------- custom cursor + comet trail ---------------- */
if (finePointer && !reducedMotion) {
  const dot = $(".cursor-dot");
  const ring = $(".cursor-ring");
  let mx = innerWidth / 2,
    my = innerHeight / 2;
  let rx = mx,
    ry = my;
  let lastTrail = 0;
  let trailCount = 0;

  addEventListener("mousemove", (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px)`;

    // comet trail: small fading stardust behind the cursor
    const now = performance.now();
    if (now - lastTrail > 28 && trailCount < 40) {
      lastTrail = now;
      trailCount++;
      const bit = document.createElement("span");
      bit.className = "trail-bit";
      const size = rand(2.5, 5.5);
      bit.style.width = bit.style.height = size + "px";
      bit.style.transform = `translate(${mx + rand(-3, 3)}px, ${my + rand(-3, 3)}px)`;
      document.body.appendChild(bit);
      bit.animate(
        [
          { opacity: 0.8, scale: 1 },
          {
            opacity: 0,
            scale: 0.15,
            transform: `translate(${mx + rand(-18, 18)}px, ${my + rand(-4, 22)}px)`,
          },
        ],
        { duration: rand(420, 680), easing: "ease-out" },
      ).onfinish = () => {
        bit.remove();
        trailCount--;
      };
    }
  });

  // the ring drifts lazily behind the cursor
  (function follow() {
    rx += (mx - rx) * 0.07;
    ry += (my - ry) * 0.07;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(follow);
  })();

  const hoverSel =
    "a, button, [data-cursor], input, textarea, .film, .card, .ach-card, .proj-card";
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest(hoverSel)) document.body.classList.add("cursor-hover");
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest(hoverSel))
      document.body.classList.remove("cursor-hover");
  });
  addEventListener("mousedown", () =>
    document.body.classList.add("cursor-down"),
  );
  addEventListener("mouseup", () =>
    document.body.classList.remove("cursor-down"),
  );
} else {
  $(".cursor-dot")?.remove();
  $(".cursor-ring")?.remove();
}

/* ---------------- particles ---------------- */
if (!reducedMotion) {
  const canvas = $("#particles");
  const ctx = canvas.getContext("2d");
  const DPR = Math.min(devicePixelRatio || 1, 2);
  let W, H;
  const parts = [];
  const COUNT = innerWidth < 700 ? 36 : 70;
  const mouse = { x: -9999, y: -9999 };

  function size() {
    const oldW = W,
      oldH = H;
    W = canvas.width = innerWidth * DPR;
    H = canvas.height = innerHeight * DPR;
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    if (oldW)
      for (const p of parts) {
        p.hx = (p.hx / oldW) * W;
        p.hy = (p.hy / oldH) * H;
      }
  }
  size();
  addEventListener("resize", size);
  addEventListener("mousemove", (e) => {
    mouse.x = e.clientX * DPR;
    mouse.y = e.clientY * DPR;
  });

  // calm constellation: every particle has a home it never strays far from
  for (let i = 0; i < COUNT; i++) {
    const hx = Math.random() * W,
      hy = Math.random() * H;
    parts.push({
      hx,
      hy,
      x: hx,
      y: hy,
      phase: Math.random() * Math.PI * 2,
      r: (Math.random() * 1.6 + 0.6) * DPR,
    });
  }

  let running = true;
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running) requestAnimationFrame(frame);
  });

  function frame(t) {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    const LINK = 110 * DPR;
    const PUSH = 120 * DPR;

    for (const p of parts) {
      // barely-there breathing around home
      let tx = p.hx + Math.sin(t * 0.00022 + p.phase) * 5 * DPR;
      let ty = p.hy + Math.cos(t * 0.00018 + p.phase * 1.4) * 5 * DPR;

      // the cursor gently pushes them aside; they drift back home after
      const dx = tx - mouse.x,
        dy = ty - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < PUSH * PUSH && d2 > 0.01) {
        const d = Math.sqrt(d2);
        const f = (PUSH - d) / PUSH;
        tx += (dx / d) * f * 42 * DPR;
        ty += (dy / d) * f * 42 * DPR;
      }

      // the crystal's gravity well: bend nearby particles into orbit around it
      if (well.active) {
        const WELL_R = 230 * DPR;
        const wx = well.x * DPR - tx,
          wy = well.y * DPR - ty;
        const wd2 = wx * wx + wy * wy;
        if (wd2 < WELL_R * WELL_R && wd2 > 1) {
          const wd = Math.sqrt(wd2);
          const pull = (1 - wd / WELL_R) * well.strength;
          // inward pull + a tangential nudge so they swirl, not just collapse
          tx += (wx / wd) * pull * 60 * DPR;
          ty += (wy / wd) * pull * 60 * DPR;
          tx += (-wy / wd) * pull * 34 * DPR;
          ty += (wx / wd) * pull * 34 * DPR;
        }
      }

      p.x += (tx - p.x) * 0.045;
      p.y += (ty - p.y) * 0.045;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = particleTheme.dot;
      ctx.fill();
    }

    for (let i = 0; i < parts.length; i++) {
      for (let j = i + 1; j < parts.length; j++) {
        const a = parts[i],
          b = parts[j];
        const dx = a.x - b.x,
          dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < LINK * LINK) {
          ctx.strokeStyle = `rgba(${particleTheme.line}, ${(1 - Math.sqrt(d2) / LINK) * 0.14})`;
          ctx.lineWidth = DPR * 0.7;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* ---------------- magnetic + tilt ---------------- */
if (finePointer && !reducedMotion) {
  $$(".magnetic").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      const y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      el.style.translate = `${x * 9}px ${y * 9}px`;
      el.style.transition = "translate 0.1s ease-out";
    });
    el.addEventListener("mouseleave", () => {
      el.style.transition = `translate 0.5s ${SPRING}`;
      el.style.translate = "0px 0px";
    });
  });

  $$(".tilt").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(700px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
      el.style.transition = "transform 0.08s linear";
    });
    el.addEventListener("mouseleave", () => {
      el.style.transition = `transform 0.6s ${SPRING}`;
      el.style.transform = "perspective(700px) rotateY(0deg) rotateX(0deg)";
    });
  });
}

/* ---------------- confetti & floaty bits ---------------- */
function confetti(x, y, n = 24) {
  const colors = cozyActive
    ? ["#f59e0b", "#fbbf24", "#fb923c", "#fde68a"]
    : ["#8b5cf6", "#c084fc", "#a78bfa", "#7c3aed", "#e9d5ff"];
  for (let i = 0; i < n; i++) {
    const bit = document.createElement("span");
    bit.className = "confetti-bit";
    bit.style.left = x + "px";
    bit.style.top = y + "px";
    bit.style.background = colors[(Math.random() * colors.length) | 0];
    document.body.appendChild(bit);
    const ang = rand(0, Math.PI * 2);
    const v = rand(60, 240);
    bit.animate(
      [
        { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
        {
          transform: `translate(${Math.cos(ang) * v}px, ${Math.sin(ang) * v + 160}px) rotate(${rand(-360, 360)}deg)`,
          opacity: 0,
        },
      ],
      { duration: rand(700, 1300), easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    ).onfinish = () => bit.remove();
  }
}

function floatBit(x, y, text) {
  const b = document.createElement("span");
  b.className = "float-bit";
  b.textContent = text;
  b.style.left = x + "px";
  b.style.top = y + "px";
  document.body.appendChild(b);
  b.animate(
    [
      { transform: "translate(0,0) scale(0.7)", opacity: 1 },
      {
        transform: `translate(${rand(-30, 30)}px, -70px) scale(1.2)`,
        opacity: 0,
      },
    ],
    { duration: 800, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
  ).onfinish = () => b.remove();
}

/* ---------------- TOY: grabbable hero letters ---------------- */
(function bouncyLetters() {
  $$(".hero-title .line").forEach((line) => {
    const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
    const texts = [];
    let n;
    while ((n = walker.nextNode())) {
      if (n.textContent.trim() && !n.parentElement.closest(".hero-dot"))
        texts.push(n);
    }
    texts.forEach((node) => {
      // gradient text doesn't paint on inline-block children — re-apply per letter
      const inGrad = !!node.parentElement.closest(".grad");
      const frag = document.createDocumentFragment();
      for (const ch of node.textContent) {
        if (ch === " ") {
          frag.append(" ");
          continue;
        }
        const s = document.createElement("span");
        s.className = inGrad ? "h-letter grad" : "h-letter";
        s.textContent = ch;
        frag.append(s);
      }
      node.replaceWith(frag);
    });
  });

  $$(".h-letter").forEach((el) => {
    // per-letter state so simultaneous grabs never share or fight over data
    const st = {
      ox: 0,
      oy: 0,
      sx: 0,
      sy: 0,
      dx: 0,
      dy: 0,
      vx: 0,
      vy: 0,
      lastX: 0,
      lastY: 0,
      lastT: 0,
      flingTimer: null,
    };

    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      clearTimeout(st.flingTimer); // a re-grab cancels any pending spring-home
      el.setPointerCapture(e.pointerId);
      el.classList.add("is-grabbed");
      // resume from wherever the letter currently is (it may be mid-spring)
      const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
      st.ox = m.e;
      st.oy = m.f;
      st.dx = st.ox;
      st.dy = st.oy;
      st.sx = e.clientX;
      st.sy = e.clientY;
      st.vx = st.vy = 0;
      st.lastX = e.clientX;
      st.lastY = e.clientY;
      st.lastT = performance.now();
      el.style.transition = "none";
      el.style.transform = `translate(${st.ox}px, ${st.oy}px) rotate(${st.ox * 0.08}deg)`;
    });
    el.addEventListener("pointermove", (e) => {
      if (!el.classList.contains("is-grabbed")) return;
      st.dx = st.ox + (e.clientX - st.sx);
      st.dy = st.oy + (e.clientY - st.sy);
      const t = performance.now();
      const dt = Math.min(Math.max(t - st.lastT, 1), 60);
      st.vx = (e.clientX - st.lastX) / dt;
      st.vy = (e.clientY - st.lastY) / dt;
      st.lastX = e.clientX;
      st.lastY = e.clientY;
      st.lastT = t;
      el.style.transform = `translate(${st.dx}px, ${st.dy}px) rotate(${st.dx * 0.08}deg)`;
    });
    const release = () => {
      if (!el.classList.contains("is-grabbed")) return;
      el.classList.remove("is-grabbed");
      // stale velocity from a pause shouldn't launch the letter
      if (performance.now() - st.lastT > 80) st.vx = st.vy = 0;
      const fx = st.dx + Math.max(Math.min(st.vx * 60, 220), -220);
      const fy = st.dy + Math.max(Math.min(st.vy * 60, 220), -220);
      el.style.transition = "transform 0.09s ease-out";
      el.style.transform = `translate(${fx}px, ${fy}px) rotate(${fx * 0.1}deg)`;
      st.flingTimer = setTimeout(() => {
        el.style.transition = `transform 0.9s ${SPRING}`;
        el.style.transform = "translate(0,0) rotate(0deg)";
      }, 90);
    };
    el.addEventListener("pointerup", release);
    el.addEventListener("pointercancel", release);
    el.addEventListener("lostpointercapture", release);
  });
})();

/* ---------------- TOY: bubble wrap ---------------- */
(function bubbleWrap() {
  const wrap = $("#bubbles");
  const counter = $("#popCount");
  if (!wrap) return;
  let popped = 0;
  const COUNT = 16;

  for (let i = 0; i < COUNT; i++) {
    const b = document.createElement("button");
    b.className = "bubble";
    b.setAttribute("aria-label", "Pop");
    wrap.appendChild(b);

    b.addEventListener("click", (e) => {
      if (b.classList.contains("is-popped")) return;
      b.classList.add("is-popped");
      popped++;
      counter.textContent = popped;
      floatBit(e.clientX, e.clientY - 10, "pop!");
      if (popped % 25 === 0)
        toast(`${popped} pops. your stress doesn't stand a chance 🫧`);
      setTimeout(
        () => {
          b.classList.remove("is-popped");
          b.classList.add("is-reborn");
          setTimeout(() => b.classList.remove("is-reborn"), 650);
        },
        rand(3500, 7000),
      );
    });
  }
})();

/* ---------------- TOY: combo meter on ∞ ---------------- */
(function comboMeter() {
  const stat = $("#comboStat");
  const badge = $("#comboBadge");
  if (!stat) return;
  let combo = 0,
    decay;

  stat.addEventListener("click", (e) => {
    combo++;
    clearTimeout(decay);
    decay = setTimeout(() => {
      combo = 0;
      badge.classList.remove("is-on");
      stat.classList.remove("tier-1", "tier-2");
    }, 900);

    badge.textContent = `x${combo}`;
    badge.classList.remove("is-on");
    void badge.offsetWidth;
    badge.classList.add("is-on");
    floatBit(e.clientX + rand(-12, 12), e.clientY - 14, "+1");

    stat.classList.toggle("tier-1", combo >= 5);
    stat.classList.toggle("tier-2", combo >= 10);
    if (combo === 5) toast("ok, you found the combo meter 👀");
    if (combo === 10) {
      confetti(e.clientX, e.clientY, 26);
      toast("double digits! the crowd goes wild 🎬");
    }
    if (combo === 15) {
      confetti(innerWidth / 2, innerHeight / 3, 60);
      toast("“To infinity… and beyond!” 🚀", 3600);
    }
    if (combo === 25) toast("x25. legend. now go touch grass 🌱");
  });
})();

/* ---------------- TOY: photo coin-spin card ---------------- */
(function photoFlip() {
  const frame = $("#photoFlip");
  if (!frame) return;
  const front = $(".flip-front", frame);
  const back = $(".flip-back", frame);
  let busy = false;
  frame.addEventListener("click", (e) => {
    if (busy) return;
    busy = true;
    const toBack = !frame.classList.contains("show-back");
    if (reducedMotion) {
      frame.classList.toggle("show-back", toBack);
      busy = false;
      return;
    }
    const incoming = toBack ? back : front;
    const r = frame.getBoundingClientRect();
    let cx = ((e.clientX - r.left) / r.width) * 100;
    let cy = ((e.clientY - r.top) / r.height) * 100;
    if (!isFinite(cx)) cx = 50;
    if (!isFinite(cy)) cy = 45;

    // a ring of light expands from the touch point
    const ring = document.createElement("span");
    ring.className = "photo-ripple";
    ring.style.setProperty("--rx", cx + "%");
    ring.style.setProperty("--ry", cy + "%");
    frame.appendChild(ring);
    ring.animate(
      [
        { opacity: 0.95, transform: "translate(-50%,-50%) scale(0.15)" },
        { opacity: 0, transform: "translate(-50%,-50%) scale(30)" },
      ],
      { duration: 660, easing: "cubic-bezier(0.22,1,0.36,1)" },
    ).onfinish = () => ring.remove();

    // the incoming face irises in behind the ring
    incoming.style.zIndex = 6;
    incoming.animate(
      [
        { clipPath: `circle(0% at ${cx}% ${cy}%)` },
        { clipPath: `circle(150% at ${cx}% ${cy}%)` },
      ],
      { duration: 640, easing: "cubic-bezier(0.65,0,0.35,1)" },
    ).onfinish = () => {
      frame.classList.toggle("show-back", toBack);
      incoming.style.zIndex = "";
      busy = false;
    };
  });
  $(".paperclip", frame)?.addEventListener("click", (e) => e.stopPropagation());
  $(".lb-link", frame)?.addEventListener("click", (e) => e.stopPropagation());
})();

/* ---------------- TOY: guitar string ---------------- */
(function guitarString() {
  const box = $(".string-box");
  const path = $("#stringPath");
  if (!box || !path) return;

  const REST = 45;
  let cy = REST; // current control-point y
  let target = REST; // where the cursor is pulling it
  let holding = false; // cursor is bending the string
  let osc = null; // oscillation state after release

  function setPath(y) {
    path.setAttribute("d", `M 0 ${REST} Q 500 ${y} 1000 ${REST}`);
  }

  function pluck(amplitude) {
    osc = { a: Math.max(Math.min(amplitude, 70), -70), t: 0 };
    if (Math.abs(osc.a) > 6) {
      const r = box.getBoundingClientRect();
      const note = document.createElement("span");
      note.className = "music-note";
      note.textContent = ["♪", "♫", "♩"][(Math.random() * 3) | 0];
      note.style.left = r.left + r.width / 2 + rand(-80, 80) + "px";
      note.style.top = r.top + 20 + "px";
      document.body.appendChild(note);
      note.animate(
        [
          { transform: "translateY(0) rotate(0deg)", opacity: 1 },
          {
            transform: `translateY(-60px) rotate(${rand(-25, 25)}deg)`,
            opacity: 0,
          },
        ],
        { duration: 1100, easing: "ease-out" },
      ).onfinish = () => note.remove();
    }
  }

  function toLocalY(e) {
    const r = box.getBoundingClientRect();
    return ((e.clientY - r.top) / r.height) * 90;
  }

  box.addEventListener("pointermove", (e) => {
    const y = toLocalY(e);
    if (Math.abs(y - REST) < 32) {
      holding = true;
      osc = null;
      target = y;
    } else if (holding) {
      holding = false;
      pluck(cy - REST);
    }
  });
  box.addEventListener("pointerleave", () => {
    if (holding) {
      holding = false;
      pluck(cy - REST);
    }
  });

  (function vibrate() {
    if (holding) {
      cy += (target - cy) * 0.4;
    } else if (osc) {
      osc.t += 16;
      const decayed = osc.a * Math.exp(-osc.t / 350) * Math.cos(osc.t / 28);
      cy = REST + decayed;
      if (Math.abs(decayed) < 0.3) {
        osc = null;
        cy = REST;
      }
    } else {
      cy += (REST - cy) * 0.2;
    }
    setPath(cy);
    requestAnimationFrame(vibrate);
  })();
})();

/* ---------------- TOY: film poster wobble ---------------- */
document.addEventListener("click", (e) => {
  const poster = e.target.closest(".film-poster");
  if (!poster) return;
  poster.querySelectorAll("img").forEach((img, k) => {
    img.animate(
      [
        { transform: "translateY(0) rotate(0deg)" },
        {
          transform: `translateY(-${rand(40, 64)}px) rotate(${rand(120, 240)}deg)`,
          offset: 0.42,
        },
        { transform: "translateY(0) rotate(360deg)" },
      ],
      { duration: 720, delay: k * 70, easing: SPRING },
    );
  });
});

/* ---------------- EGG: matrix rain (type "pratyush") ---------------- */
let matrixOn = false;
function matrixRain(duration = 7000) {
  if (matrixOn || reducedMotion) return;
  matrixOn = true;
  toast("wake up, neo \u{1F407}", 3000);

  const c = document.createElement("canvas");
  c.className = "matrix-canvas";
  document.body.appendChild(c);
  const ctx = c.getContext("2d");
  const DPR = Math.min(devicePixelRatio || 1, 2);
  const W = (c.width = innerWidth * DPR);
  const H = (c.height = innerHeight * DPR);
  c.style.width = innerWidth + "px";
  c.style.height = innerHeight + "px";
  requestAnimationFrame(() => c.classList.add("is-on"));

  const FS = 15 * DPR;
  const cols = Math.ceil(W / FS);
  const drops = Array.from({ length: cols }, () => rand(-40, 0));
  const glyphs =
    "PRATYUSH01{}[]<>=+*/#$_アイウエオカキクケコサシスセソタチツテト";
  ctx.font = `${FS}px monospace`;

  let stopping = false;
  (function rain() {
    ctx.fillStyle = "rgba(8, 8, 13, 0.22)";
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < cols; i++) {
      const ch = glyphs[(Math.random() * glyphs.length) | 0];
      const y = drops[i] * FS;
      ctx.fillStyle = cozyActive
        ? "rgba(251, 191, 36, 0.95)"
        : "rgba(192, 132, 252, 0.95)";
      ctx.fillText(ch, i * FS, y);
      ctx.fillStyle = cozyActive
        ? "rgba(245, 158, 11, 0.4)"
        : "rgba(139, 92, 246, 0.4)";
      ctx.fillText(ch, i * FS, y - FS);
      drops[i]++;
      if (y > H && Math.random() > 0.975) drops[i] = rand(-25, 0);
    }
    if (!stopping) requestAnimationFrame(rain);
  })();

  setTimeout(() => {
    c.classList.remove("is-on");
    setTimeout(() => {
      stopping = true;
      c.remove();
      matrixOn = false;
    }, 700);
  }, duration);
}

/* ---------------- EGG: cozy mode (type "patty") ---------------- */
let cozyDrip = null;
const cozyFlash = document.createElement("div");
cozyFlash.className = "cozy-flash";
document.body.appendChild(cozyFlash);

function toggleCozy() {
  cozyActive = !cozyActive;
  document.body.classList.toggle("is-cozy", cozyActive);

  cozyFlash.classList.remove("is-on");
  void cozyFlash.offsetWidth;
  cozyFlash.classList.add("is-on");

  updateParticleTheme();
  if (cozyActive) {
    toast("oh… you know me know me 🧡 welcome to the cozy corner", 3600);
    const emojis = ["☕", "🎬", "🎸", "🍿", "🌙", "📺"];
    cozyDrip = setInterval(() => {
      if (document.hidden) return;
      const e = document.createElement("span");
      e.className = "cozy-float";
      e.textContent = emojis[(Math.random() * emojis.length) | 0];
      e.style.left = rand(4, 94) + "vw";
      e.style.animationDuration = rand(9, 16) + "s";
      document.body.appendChild(e);
      setTimeout(() => e.remove(), 17000);
    }, 1400);
  } else {
    toast("back to business 💜");
    clearInterval(cozyDrip);
    $$(".cozy-float").forEach((e) => e.remove());
  }
}

/* ---------------- secret keyboard listener ---------------- */
let keyBuffer = "";
let resumeTimer = null;
addEventListener("keydown", (e) => {
  const t = e.target;
  if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)
    return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key.length !== 1 || !/[a-z]/i.test(e.key)) return;

  const k = e.key.toLowerCase();
  keyBuffer = (keyBuffer + k).slice(-12);

  // typing any word cancels a pending lone-R résumé open
  if (k !== "r") clearTimeout(resumeTimer);
  if (k === "r") {
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => {
      toast("you found it — opening résumé 📄");
      setTimeout(() => open("assets/resume.pdf", "_blank"), 500);
    }, 750);
  }

  if (keyBuffer.endsWith("pratyush")) {
    keyBuffer = "";
    clearTimeout(resumeTimer);
    matrixRain();
  }
  if (keyBuffer.endsWith("patty")) {
    keyBuffer = "";
    toggleCozy();
  }
  if (keyBuffer.endsWith("sudo")) {
    keyBuffer = "";
    toast("ah, a person of culture. permissions granted. ✨");
    document.body.classList.add("sudo-gold");
    setTimeout(() => document.body.classList.remove("sudo-gold"), 4000);
  }
});

/* ---------------- EGG: typing speed test (?play in URL) ---------------- */
(function typingGame() {
  const game = $("#game");
  const textBox = $("#gameText");
  const input = $("#gameInput");
  const wpmEl = $("#gWpm"),
    accEl = $("#gAcc"),
    bestEl = $("#gBest");
  const BEST_KEY = "pg-best-wpm";

  const lines = [
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

  let target = "",
    startT = 0,
    mistakes = 0,
    done = false,
    lastLine = -1;

  function newLine() {
    let i;
    do {
      i = (Math.random() * lines.length) | 0;
    } while (i === lastLine);
    lastLine = i;
    target = lines[i];
    textBox.innerHTML = "";
    textBox.classList.remove("is-done");
    for (const ch of target) {
      const s = document.createElement("span");
      s.textContent = ch;
      textBox.appendChild(s);
    }
    textBox.children[0]?.classList.add("cur");
    input.value = "";
    startT = 0;
    mistakes = 0;
    done = false;
    wpmEl.textContent = "0";
    accEl.textContent = "100%";
  }

  function showBest() {
    const best = localStorage.getItem(BEST_KEY);
    bestEl.textContent = best ? `${best} wpm` : "—";
  }

  function openGame() {
    showBest();
    newLine();
    game.classList.add("is-open");
    game.setAttribute("aria-hidden", "false");
    setTimeout(() => input.focus(), 350);
  }
  function closeGame() {
    game.classList.remove("is-open");
    game.setAttribute("aria-hidden", "true");
  }

  input.addEventListener("input", () => {
    if (done) return;
    if (!startT && input.value.length) startT = performance.now();
    const typed = input.value;
    const spans = [...textBox.children];

    spans.forEach((s, i) => {
      s.classList.remove("ok", "bad", "cur");
      if (i < typed.length) {
        const correct = typed[i] === target[i];
        s.classList.add(correct ? "ok" : "bad");
      } else if (i === typed.length) {
        s.classList.add("cur");
      }
    });

    // count fresh mistakes only at the newest char
    if (typed.length && typed[typed.length - 1] !== target[typed.length - 1])
      mistakes++;

    const mins = (performance.now() - startT) / 60000;
    if (mins > 0) wpmEl.textContent = Math.round(typed.length / 5 / mins);
    const acc = Math.max(
      0,
      Math.round(((typed.length - mistakes) / Math.max(typed.length, 1)) * 100),
    );
    accEl.textContent = acc + "%";

    if (typed === target) {
      done = true;
      textBox.classList.add("is-done");
      const wpm = Math.round(
        target.length / 5 / ((performance.now() - startT) / 60000),
      );
      wpmEl.textContent = wpm;
      const best = +(localStorage.getItem(BEST_KEY) || 0);
      if (wpm > best) {
        localStorage.setItem(BEST_KEY, wpm);
        showBest();
        confetti(innerWidth / 2, innerHeight / 2.5, 50);
        toast(`new personal best — ${wpm} wpm 🔥`);
      } else {
        confetti(innerWidth / 2, innerHeight / 2.5, 20);
      }
    }
  });

  textBox.addEventListener("click", () => input.focus());
  $("#gameNew").addEventListener("click", () => {
    newLine();
    input.focus();
  });
  $("#gameClose").addEventListener("click", closeGame);
  game.addEventListener("click", (e) => {
    if (e.target === game) closeGame();
  });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && game.classList.contains("is-open")) closeGame();
  });

  // the secret door: anything "play"-ish in the URL
  const q = (location.search + location.hash).toLowerCase();
  if (q.includes("play") || q.includes("game")) {
    setTimeout(openGame, reducedMotion ? 400 : 2300);
  }
})();

/* ---------------- copy email ---------------- */
$("#copyEmail").addEventListener("click", async function () {
  const email = this.dataset.email;
  try {
    await navigator.clipboard.writeText(email);
    this.querySelector(".email-copy").textContent = "copied ✓";
    toast("Email copied to clipboard 📋");
    setTimeout(
      () => (this.querySelector(".email-copy").textContent = "copy"),
      2000,
    );
  } catch {
    toast("Couldn't copy — email: " + email);
  }
});

/* ---------------- contact form (mailto) ---------------- */
$("#contactForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const name = $("#fName").value.trim();
  const from = $("#fEmail").value.trim();
  const msg = $("#fMsg").value.trim();
  const to = $("#copyEmail").dataset.email;

  const btn = this.querySelector("button[type=submit]");
  btn.classList.add("is-sent");
  btn.querySelector(".btn-label").textContent = "Opening mail app…";
  toast("Opening your mail app ✈");

  const subject = encodeURIComponent(`Portfolio contact from ${name}`);
  const body = encodeURIComponent(`${msg}\n\n— ${name} (${from})`);
  setTimeout(() => {
    location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    setTimeout(() => {
      btn.classList.remove("is-sent");
      btn.querySelector(".btn-label").textContent = "Send message";
      this.reset();
    }, 2500);
  }, 600);
});

/* ---------------- preloader: the crystal forge ---------------- */
const preloader = $("#preloader");
const seenIntro = sessionStorage.getItem("pg-intro");
if (seenIntro) preloader.classList.add("is-gone");

function crystalForge() {
  return new Promise((resolve) => {
    const canvas = $("#forge");
    const ctx = canvas.getContext("2d");
    const DPR = Math.min(devicePixelRatio || 1, 2);
    const nameEl = $("#forgeName");
    const ring = $("#forgeRing");
    let W, H, cx, cy;

    function size() {
      W = canvas.width = innerWidth * DPR;
      H = canvas.height = innerHeight * DPR;
      cx = W / 2;
      cy = H / 2;
    }
    size();

    // target points traced along the crystal's diamond silhouette
    const SC = Math.min(W, H) * 0.16;
    const verts = [
      [0, -1.45],
      [0.62, -0.36],
      [0, 1.45],
      [-0.62, -0.36],
    ];
    const targets = [];
    const PER = 34;
    for (let v = 0; v < verts.length; v++) {
      const a = verts[v],
        b = verts[(v + 1) % verts.length];
      for (let s = 0; s < PER; s++) {
        const f = s / PER;
        targets.push({
          x: cx + (a[0] + (b[0] - a[0]) * f) * SC,
          y: cy + (a[1] + (b[1] - a[1]) * f) * SC,
        });
      }
    }
    // a few interior sparks toward the core
    for (let i = 0; i < 26; i++)
      targets.push({ x: cx + rand(-SC * 0.4, SC * 0.4), y: cy + rand(-SC, SC) });

    const parts = targets.map((t) => {
      const edge = (Math.random() * 4) | 0;
      let x, y;
      if (edge === 0) (x = rand(0, W)), (y = -20);
      else if (edge === 1) (x = W + 20), (y = rand(0, H));
      else if (edge === 2) (x = rand(0, W)), (y = H + 20);
      else (x = -20), (y = rand(0, H));
      return { x, y, tx: t.x, ty: t.y, seedX: x, seedY: y };
    });

    nameEl.style.left = innerWidth / 2 + "px";
    nameEl.style.top = innerHeight / 2 + SC / DPR + 60 + "px";
    ring.style.left = innerWidth / 2 + "px";
    ring.style.top = innerHeight / 2 + "px";

    const t0 = performance.now();
    const ASSEMBLE = 1150;

    (function frame(now) {
      const t = now - t0;
      ctx.clearRect(0, 0, W, H);
      const p = Math.min(t / ASSEMBLE, 1);
      const e = 1 - Math.pow(1 - p, 3); // easeOutCubic

      for (const pt of parts) {
        pt.x = pt.seedX + (pt.tx - pt.seedX) * e;
        pt.y = pt.seedY + (pt.ty - pt.seedY) * e;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 1.7 * DPR, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(192, 132, 252, 0.9)";
        ctx.fill();
      }
      // constellation links once they're mostly assembled
      if (p > 0.55) {
        ctx.strokeStyle = `rgba(139, 92, 246, ${(p - 0.55) * 0.5})`;
        ctx.lineWidth = DPR * 0.6;
        for (let i = 0; i < parts.length; i++) {
          const a = parts[i],
            b = parts[(i + 1) % parts.length];
          const dx = a.x - b.x,
            dy = a.y - b.y;
          if (dx * dx + dy * dy < (60 * DPR) ** 2) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      if (p > 0.4) nameEl.classList.add("is-lit");

      if (p < 1) {
        requestAnimationFrame(frame);
      } else {
        ignite();
      }
    })(t0);

    function ignite() {
      // bright pulse from the core
      ring.animate(
        [
          { opacity: 0, transform: "translate(-50%,-50%) scale(0.2)" },
          { opacity: 1, transform: "translate(-50%,-50%) scale(1)", offset: 0.3 },
          {
            opacity: 0,
            transform: `translate(-50%,-50%) scale(${(Math.max(innerWidth, innerHeight) / 20) * 1.2})`,
          },
        ],
        { duration: 900, easing: "cubic-bezier(0.65,0,0.35,1)", fill: "forwards" },
      );
      // white flash wash
      const flash = parts.slice();
      const f0 = performance.now();
      (function burst(now) {
        const ft = (now - f0) / 360;
        ctx.clearRect(0, 0, W, H);
        const a = Math.max(0, 1 - ft);
        for (const pt of flash) {
          const ang = Math.atan2(pt.y - cy, pt.x - cx);
          const push = ft * 90 * DPR;
          ctx.beginPath();
          ctx.arc(
            pt.x + Math.cos(ang) * push,
            pt.y + Math.sin(ang) * push,
            2.2 * DPR * a,
            0,
            Math.PI * 2,
          );
          ctx.fillStyle = `rgba(233, 213, 255, ${a})`;
          ctx.fill();
        }
        if (ft < 1) requestAnimationFrame(burst);
        else {
          ctx.clearRect(0, 0, W, H);
          reveal();
        }
      })(f0);
    }

    function reveal() {
      // circular shockwave wipes the curtain away from the crystal's birthplace
      preloader.style.setProperty("--cx", innerWidth / 2 + "px");
      preloader.style.setProperty("--cy", innerHeight / 2 + "px");
      preloader.classList.add("is-revealing");
      nameEl.classList.remove("is-lit");
      setTimeout(resolve, 50);
      setTimeout(() => preloader.classList.add("is-gone"), 750);
    }

    addEventListener("resize", size, { once: true });
  });
}

window.addEventListener("load", async () => {
  if (seenIntro || reducedMotion) {
    if (!reducedMotion) {
      /* still show a quick version on first paint of repeat visits */
    }
    preloader.classList.add("is-gone");
    finishSwitch("home");
    indicator.classList.add("is-ready");
    return;
  }
  sessionStorage.setItem("pg-intro", "1");
  document.body.classList.add("is-locked");
  await crystalForge();
  document.body.classList.remove("is-locked");
  finishSwitch("home");
  indicator.classList.add("is-ready");
  // the hero crystal "powers on" as it inherits the forge's energy
  $("#crystal")?.classList.add("just-forged");
});

/* keep nav indicator honest once fonts settle */
document.fonts?.ready.then(moveIndicator);

/* ---------------- for the snoopers ---------------- */
console.log(
  "%c👀 inspecting, are we? respect.",
  "font-size:15px; font-weight:bold; color:#a78bfa;",
);
console.log(
  "%ctry typing my first name anywhere on the page.\nor add ?play to the URL. that's all the hints you get.\n— PG (current status: genuinely figuring it out)",
  "color:#8d8aa0;",
);

/* ============================================================
   round 3: bento, preview window & more eggs
   ============================================================ */

/* ---------------- theme helper (crt > cozy > violet) ---------------- */
let crtActive = false;
function updateParticleTheme() {
  if (crtActive) {
    particleTheme.dot = "rgba(74, 222, 128, 0.5)";
    particleTheme.line = "34, 197, 94";
  } else if (cozyActive) {
    particleTheme.dot = "rgba(251, 191, 36, 0.45)";
    particleTheme.line = "245, 158, 11";
  } else {
    particleTheme.dot = "rgba(167, 139, 250, 0.5)";
    particleTheme.line = "139, 92, 246";
  }
}

/* ---------------- bento spotlight ---------------- */
(function bentoSpotlight() {
  const grid = $("#bento");
  if (!grid || !finePointer) return;
  const cells = $$(".b-cell", grid);
  grid.addEventListener("mousemove", (e) => {
    for (const cell of cells) {
      const r = cell.getBoundingClientRect();
      cell.style.setProperty("--mx", e.clientX - r.left + "px");
      cell.style.setProperty("--my", e.clientY - r.top + "px");
    }
  });
  grid.addEventListener("mouseenter", () => grid.classList.add("is-lit"));
  grid.addEventListener("mouseleave", () => grid.classList.remove("is-lit"));
})();

/* ---------------- project preview window ---------------- */
(function projectPreview() {
  const pv = $("#pv");
  if (!pv) return;
  const body = $(".pv-body", pv);
  const frame = $("#pvFrame");
  const urlEl = $("#pvUrl");
  const visit = $("#pvVisit");

  function openPreview(url, title) {
    pv.classList.add("is-open");
    pv.setAttribute("aria-hidden", "false");
    body.classList.remove("is-ready", "is-loading", "is-empty");
    if (!url || url === "#") {
      urlEl.textContent = "—";
      visit.style.display = "none";
      body.classList.add("is-empty");
      return;
    }
    visit.style.display = "";
    visit.href = url;
    urlEl.textContent = url.startsWith("http")
      ? url.replace(/^https?:\/\//, "")
      : `pratyush.dev/${title || url}`;
    body.classList.add("is-loading");
    frame.onload = () => {
      body.classList.remove("is-loading");
      body.classList.add("is-ready");
    };
    frame.src = url;
  }
  function closePreview() {
    pv.classList.remove("is-open");
    pv.setAttribute("aria-hidden", "true");
    setTimeout(() => {
      frame.src = "about:blank";
    }, 350);
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".b-preview");
    if (!btn) return;
    const cell = btn.closest(".b-cell");
    openPreview(
      cell.dataset.url,
      cell
        .querySelector("h3")
        ?.textContent.trim()
        .toLowerCase()
        .replace(/\s+/g, "-"),
    );
  });
  $("#pvClose").addEventListener("click", closePreview);
  pv.addEventListener("click", (e) => {
    if (e.target === pv) closePreview();
  });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && pv.classList.contains("is-open")) closePreview();
  });
})();

/* ---------------- EGG: konami → CRT mode + achievement ---------------- */
(function konami() {
  const SEQ = [
    "arrowup",
    "arrowup",
    "arrowdown",
    "arrowdown",
    "arrowleft",
    "arrowright",
    "arrowleft",
    "arrowright",
    "b",
    "a",
  ];
  let pos = 0;
  const mc = $("#mcToast");

  addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    pos = k === SEQ[pos] ? pos + 1 : k === SEQ[0] ? 1 : 0;
    if (pos !== SEQ.length) return;
    pos = 0;

    crtActive = !crtActive;
    document.body.classList.toggle("is-crt", crtActive);
    updateParticleTheme();

    if (crtActive) {
      mc.classList.add("is-show");
      setTimeout(() => mc.classList.remove("is-show"), 4200);
      setTimeout(() => toast("CRT mode engaged. same code exits. 📺"), 1200);
    } else {
      toast("back to the future 💜");
    }
  });
})();

/* ---------------- EGG: DVD screensaver after 60s idle ---------------- */
(function dvdScreensaver() {
  if (reducedMotion) return;
  const IDLE_MS = 60000;
  const COLORS = [
    "#c084fc",
    "#4ade80",
    "#fbbf24",
    "#60a5fa",
    "#f87171",
    "#f472b6",
  ];
  let idleTimer,
    overlay = null,
    raf = null;

  function start() {
    if (overlay || document.hidden) return;
    overlay = document.createElement("div");
    overlay.className = "dvd";
    overlay.innerHTML = `<span class="dvd-logo">PG</span><span class="dvd-hint">— move anything to wake the site —</span>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("is-on"));

    const logo = overlay.querySelector(".dvd-logo");
    let ci = 0;
    logo.style.color = COLORS[ci];
    let x = rand(40, innerWidth / 2),
      y = rand(40, innerHeight / 2);
    let vx = 2.4,
      vy = 2.1;

    (function bounce() {
      const w = logo.offsetWidth,
        h = logo.offsetHeight;
      x += vx;
      y += vy;
      let hit = false;
      if (x <= 0 || x + w >= innerWidth) {
        vx *= -1;
        hit = true;
        x = Math.max(0, Math.min(x, innerWidth - w));
      }
      if (y <= 0 || y + h >= innerHeight) {
        vy *= -1;
        hit = true;
        y = Math.max(0, Math.min(y, innerHeight - h));
      }
      if (hit) {
        ci = (ci + 1) % COLORS.length;
        logo.style.color = COLORS[ci];
      }
      logo.style.transform = `translate(${x}px, ${y}px)`;
      raf = requestAnimationFrame(bounce);
    })();
  }

  function stop() {
    if (!overlay) return;
    cancelAnimationFrame(raf);
    const o = overlay;
    overlay = null;
    o.classList.remove("is-on");
    setTimeout(() => o.remove(), 850);
  }

  function poke() {
    stop();
    clearTimeout(idleTimer);
    idleTimer = setTimeout(start, IDLE_MS);
  }
  ["mousemove", "keydown", "scroll", "pointerdown", "touchstart"].forEach(
    (ev) => addEventListener(ev, poke, { passive: true }),
  );
  poke();
})();

/* ---------------- EGG: tab-title pout ---------------- */
(function tabPout() {
  const original = document.title;
  let pout;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      document.title = "👀 come back…";
      pout = setTimeout(() => {
        document.title = "still here. waiting.";
      }, 15000);
    } else {
      clearTimeout(pout);
      document.title = original;
    }
  });
})();

/* ---------------- EGG: bottom-of-page secret ---------------- */
(function bottomSecret() {
  const el = $("#bottomSecret");
  if (!el) return;
  let holdTimer = null;
  addEventListener(
    "scroll",
    () => {
      const atBottom = innerHeight + scrollY >= document.body.offsetHeight - 4;
      if (atBottom && !el.classList.contains("is-shown")) {
        clearTimeout(holdTimer);
        holdTimer = setTimeout(() => {
          if (innerHeight + scrollY >= document.body.offsetHeight - 4) {
            el.classList.add("is-shown");
            el.setAttribute("aria-hidden", "false");
          }
        }, 700);
      } else if (!atBottom) {
        clearTimeout(holdTimer);
      }
    },
    { passive: true },
  );
})();

/* ---------------- EGG: do not click this ---------------- */
(function doNotClick() {
  const dnc = $("#dnc");
  if (!dnc) return;
  let clicks = 0;
  const replies = [
    "you had ONE job.",
    "seriously?",
    "stop.",
    "this is your last warning.",
  ];
  dnc.addEventListener("click", (e) => {
    clicks++;
    if (clicks <= 4) {
      toast(replies[clicks - 1]);
    } else {
      confetti(e.clientX, e.clientY - 20, 50);
      toast("fine. you win. 🏆");
      clicks = 0;
    }
  });
})();

/* ============================================================
   round 4: crystal & structure upgrades
   ============================================================ */

/* ---------------- the hero crystal (companion · charge · gravity · collection) ---------------- */
(function crystal() {
  const wrap = $("#crystal");
  if (!wrap || reducedMotion) return;
  const spin = $(".crystal", wrap);
  const tip = $(".orb-tip", wrap);

  // ---- color collection (persisted) ----
  // hue-rotate values applied to the amber (~45°) base, named by what they actually render
  const HUES = [0, 60, 130, 200, 260, 320];
  const HUE_NAMES = ["amber", "emerald", "teal", "sapphire", "magenta", "ruby"];
  let hueIdx = +(localStorage.getItem("pg-crystal-hue") || 0) % HUES.length;
  function applyHue() {
    wrap.style.setProperty("--hue", HUES[hueIdx] + "deg");
  }
  applyHue();

  // ---- charge ----
  let charge = 0;
  const MAX = 10;
  let overcharging = false;

  let angle = 0,
    speed = 0.35,
    targetSpeed = 0.35;
  let tilt = -10,
    targetTilt = -10;
  let hot = false;
  let companion = false;

  function setHot(on) {
    hot = on;
    wrap.classList.toggle("is-hot", on);
    targetSpeed = on ? 2.4 : 0.35;
    if (!on) targetTilt = -10;
    if (on) {
      const r = wrap.getBoundingClientRect();
      well.x = r.left + r.width / 2;
      well.y = r.top + r.height / 2;
    }
    well.active = on && !companion;
  }

  wrap.addEventListener("mouseenter", () => setHot(true));
  wrap.addEventListener("mouseleave", () => setHot(false));
  wrap.addEventListener("mousemove", (e) => {
    const r = wrap.getBoundingClientRect();
    // tilt toward the cursor
    targetTilt = -10 + ((e.clientY - r.top) / r.height - 0.5) * -26;
    // the glow flows from the exact point of contact
    wrap.style.setProperty("--cmx", ((e.clientX - r.left) / r.width) * 100 + "%");
    wrap.style.setProperty("--cmy", ((e.clientY - r.top) / r.height) * 100 + "%");
    // feed the gravity well its position (in CSS px)
    well.x = r.left + r.width / 2;
    well.y = r.top + r.height / 2;
  });

  wrap.addEventListener("click", (e) => {
    // companion mode: it's a back-to-top button
    if (companion) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (overcharging) return;

    charge = Math.min(charge + 1, MAX);
    wrap.style.setProperty("--charge", charge / MAX);
    targetSpeed = 6;
    setTimeout(() => (targetSpeed = hot ? 2.4 : 0.35), 500);
    confetti(e.clientX, e.clientY, 10 + charge * 2);

    if (charge >= MAX) overcharge();
    else if (charge === 1) toast("it stirs… keep going. ⟡", 1800);
    else if (charge === 5) toast("halfway charged ⚡", 1500);
  });

  function overcharge() {
    overcharging = true;
    wrap.classList.add("is-cracked");

    // screen-wide shockwave from the crystal
    const r = wrap.getBoundingClientRect();
    const cx = r.left + r.width / 2,
      cy = r.top + r.height / 2;
    const ripple = document.createElement("div");
    ripple.className = "surge-ripple";
    ripple.style.left = cx + "px";
    ripple.style.top = cy + "px";
    document.body.appendChild(ripple);
    ripple.animate(
      [
        { opacity: 1, transform: "translate(-50%,-50%) scale(0.2)" },
        { opacity: 0, transform: `translate(-50%,-50%) scale(${(Math.max(innerWidth, innerHeight) / 5) * 1})` },
      ],
      { duration: 900, easing: "cubic-bezier(0.22,1,0.36,1)" },
    ).onfinish = () => ripple.remove();
    confetti(cx, cy, 70);

    // the site briefly overclocks
    document.body.classList.add("is-surging");

    // advance the color collection
    hueIdx = (hueIdx + 1) % HUES.length;
    localStorage.setItem("pg-crystal-hue", hueIdx);
    const collected = +(localStorage.getItem("pg-crystal-seen") || 1);
    const newCount = Math.max(collected, hueIdx + 1);

    setTimeout(() => {
      applyHue();
      const done = newCount >= HUES.length;
      localStorage.setItem("pg-crystal-seen", newCount);
      toast(
        done
          ? "⟡ all 6 crystal hues collected. you absolute legend."
          : `⟡ overcharged — the crystal turned ${HUE_NAMES[hueIdx]}. (${hueIdx + 1}/6 hues found)`,
        4200,
      );
    }, 650);

    setTimeout(() => {
      document.body.classList.remove("is-surging");
      wrap.classList.remove("is-cracked");
      charge = 0;
      wrap.style.setProperty("--charge", 0);
      overcharging = false;
    }, 2600);
  }

  // ---- companion mode: shrink into the corner once you scroll past the hero ----
  addEventListener(
    "scroll",
    () => {
      if (currentView !== "home") return;
      const past = scrollY > innerHeight * 0.7;
      if (past !== companion) {
        companion = past;
        wrap.classList.toggle("is-companion", companion);
        well.active = false;
        if (tip) tip.textContent = "back to the top ↑";
      }
    },
    { passive: true },
  );

  // ---- the render loop ----
  let wellStrength = 0;
  (function loop() {
    speed += (targetSpeed - speed) * 0.06;
    tilt += (targetTilt - tilt) * 0.08;
    angle += speed;
    spin.style.transform = `rotateX(${tilt}deg) rotateY(${angle}deg)`;

    // ease the gravity well in/out so particles don't snap
    wellStrength += ((well.active ? 1 : 0) - wellStrength) * 0.08;
    well.strength = wellStrength;

    if (hot && !companion && Math.random() < 0.05) {
      const r = wrap.getBoundingClientRect();
      floatBit(r.left + rand(20, r.width - 20), r.top + rand(30, r.height - 60), "✦");
    }
    requestAnimationFrame(loop);
  })();
})();

/* ---------------- github heatmap (decorative until real) ---------------- */
(function ghGrid() {
  const grid = $("#ghGrid");
  if (!grid) return;
  for (let i = 0; i < 7 * 16; i++) {
    const b = document.createElement("b");
    const v = Math.random();
    b.style.setProperty(
      "--g",
      v < 0.35 ? 0 : v < 0.6 ? 1 : v < 0.8 ? 2 : v < 0.93 ? 3 : 4,
    );
    grid.appendChild(b);
  }
})();

/* ---------------- project filters ---------------- */
(function bentoFilters() {
  const filters = $$(".b-filter");
  if (!filters.length) return;
  filters.forEach((f) => {
    f.addEventListener("click", () => {
      filters.forEach((x) => x.classList.toggle("is-active", x === f));
      const pick = f.dataset.filter;
      $$(".b-cell[data-cat]").forEach((cell) => {
        cell.classList.toggle(
          "is-filtered",
          pick !== "all" && cell.dataset.cat !== pick,
        );
      });
    });
  });
})();

/* ---------------- certificate lightbox ---------------- */
(function certLightbox() {
  const lb = $("#lightbox");
  if (!lb) return;
  const img = $("#lbImg");
  const cap = $("#lbCap");

  function close() {
    lb.classList.remove("is-open");
    lb.setAttribute("aria-hidden", "true");
  }

  document.addEventListener("click", (e) => {
    const card = e.target.closest(".ach-card");
    if (!card || card.classList.contains("loading-card")) return;
    const src = card.querySelector(".ach-media img");
    if (!src) {
      toast("drop the certificate image into assets/ to view it here 🖼");
      return;
    }
    img.src = src.src;
    cap.textContent = card.querySelector("h3")?.textContent || "";
    lb.classList.add("is-open");
    lb.setAttribute("aria-hidden", "false");
  });
  $("#lbClose").addEventListener("click", close);
  lb.addEventListener("click", (e) => {
    if (e.target === lb) close();
  });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lb.classList.contains("is-open")) close();
  });
})();

/* ---------------- contact quick chips ---------------- */
(function quickChips() {
  const chips = $$(".qchip");
  if (!chips.length) return;
  const msg = $("#fMsg");
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.toggle("is-picked", c === chip));
      msg.value = chip.dataset.msg;
      msg.focus();
      msg.setSelectionRange(msg.value.length, msg.value.length);
    });
  });
})();
