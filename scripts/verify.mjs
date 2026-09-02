/**
 * The gate. Every Masterplan item has to walk through this before it counts as
 * verified: four widths screenshotted, the console read, reduced motion honoured,
 * and a scripted flick measured frame by frame.
 *
 *   node scripts/verify.mjs [--url=http://localhost:3000] [--tag=name] [--hash=about]
 *
 * Screenshots land in .verify/<tag>/. Exits non-zero on a console error, a page
 * error, or a scroll that drops frames.
 */
import { chromium, devices } from "playwright";
import { mkdir, rm } from "node:fs/promises";

const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const URL = arg("url", "http://localhost:3000");
const TAG = arg("tag", "baseline");
const HASH = arg("hash", "");
const OUT = `.verify/${TAG}`;

const WIDTHS = [
  { name: "1920", w: 1920, h: 1080 },
  { name: "1440", w: 1440, h: 900 },
  { name: "1024", w: 1024, h: 768 },
  { name: "390", w: 390, h: 844, mobile: true },
];

/** The preloader gates the content for ~3.1s. Nothing is measurable until it lifts. */
async function open(ctx, path = "") {
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(`console: ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  await page.goto(URL + path, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".preloader.is-gone", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(600);
  return { page, errors };
}

const problems = [];
const note = (s) => (console.log(s), s);

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
// Headless defaults to swiftshader, which software-rasterises the WebGL layers
// and makes every frame read ~266ms even at rest. ANGLE-on-Metal gives the real
// GPU back, so the numbers below mean something.
const browser = await chromium.launch({
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
});

// 1. the four widths, plus whatever the console has to say at each
for (const { name, w, h, mobile } of WIDTHS) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    ...(mobile ? { ...devices["iPhone 13"], viewport: { width: w, height: h } } : {}),
  });
  const { page, errors } = await open(ctx, HASH && `#${HASH}`);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/${name}-bottom.png` });
  errors.forEach((e) => problems.push(note(`  ✗ ${name}px  ${e}`)));
  console.log(`  · ${name}px captured${errors.length ? "" : ", console clean"}`);
  await ctx.close();
}

// 2. reduced motion: gentler, never blank. If the fold has no text, we broke it.
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const { page, errors } = await open(ctx);
  await page.screenshot({ path: `${OUT}/reduced-motion.png` });
  const chars = await page.evaluate(() => document.querySelector("main, body").innerText.trim().length);
  if (chars < 200) problems.push(note(`  ✗ reduced motion: only ${chars} chars of readable text`));
  errors.forEach((e) => problems.push(note(`  ✗ reduced-motion  ${e}`)));
  console.log(`  · reduced motion captured, ${chars} chars readable`);
  await ctx.close();
}

// 3. a fast flick, sampled three ways: absolute frame cost, cost relative to an
//    idle page (a scroll path that adds nothing shows up as ~1.0×), and time the
//    main thread spent blocked in long tasks — the Masterplan's actual bar.
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const { page, errors } = await open(ctx);
  const sample = (n) =>
    page.evaluate(
      (n) =>
        new Promise((r) => {
          const a = [];
          let last = performance.now(), i = 0;
          const tick = (t) => { a.push(t - last); last = t; if (++i < n) requestAnimationFrame(tick); else r(a.slice(5)); };
          requestAnimationFrame(tick);
        }),
      n,
    );
  const p95 = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length * 0.95)] ?? 0;

  const idle = await sample(80);
  await page.evaluate(() => {
    window.__long = 0;
    new PerformanceObserver((l) => l.getEntries().forEach((e) => (window.__long += e.duration)))
      .observe({ entryTypes: ["longtask"] });
    window.__f = [];
    let last = performance.now();
    const tick = (t) => { window.__f.push(t - last); last = t; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  const t0 = Date.now();
  await page.mouse.move(720, 450);
  for (let i = 0; i < 30; i++) await page.mouse.wheel(0, 380);
  await page.waitForTimeout(400);
  for (let i = 0; i < 30; i++) await page.mouse.wheel(0, -380);
  await page.waitForTimeout(700);
  const span = Date.now() - t0;
  const { frames, long } = await page.evaluate(() => ({ frames: window.__f.slice(5), long: window.__long }));

  const ratio = p95(frames) / (p95(idle) || 1);
  const blocked = (long / span) * 100;
  console.log(
    `  · scroll: ${frames.length} frames, p95 ${p95(frames).toFixed(0)}ms vs idle ${p95(idle).toFixed(0)}ms ` +
      `(${ratio.toFixed(2)}×), ${long.toFixed(0)}ms long tasks over ${span}ms (${blocked.toFixed(1)}% blocked)`,
  );
  if (p95(frames) > 20) problems.push(note(`  ✗ scroll p95 ${p95(frames).toFixed(1)}ms (want ≤20)`));
  if (ratio > 1.35) problems.push(note(`  ✗ scrolling costs ${ratio.toFixed(2)}× idle (want ≤1.35)`));
  if (blocked > 15) problems.push(note(`  ✗ main thread blocked ${blocked.toFixed(1)}% of the flick (want ≤15)`));
  errors.forEach((e) => problems.push(note(`  ✗ scroll  ${e}`)));
  await ctx.close();
}

await browser.close();
console.log(problems.length ? `\n${TAG}: ${problems.length} problem(s)` : `\n${TAG}: clean → ${OUT}/`);
process.exit(problems.length ? 1 : 0);
