/**
 * Screenshots of the projects, for the hover trail on "Selected work".
 *
 *   node scripts/shots.mjs [--local=http://localhost:3000]
 *
 * Each PROJECTS[i].url is captured at 1280×800 and written to
 * public/assets/shots/<id>.webp, no wider than 640px, quality 72. "This
 * portfolio" points at the site's own root, so the local dev server has to be
 * running for that one — it is the only way to photograph this page.
 *
 * Playwright is a devDependency: this runs at authoring time, never at build.
 */
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const LOCAL = process.argv.find((a) => a.startsWith("--local="))?.slice(8) ?? "http://localhost:3000";
const OUT = "public/assets/shots";

// the project list has one home, and it is lib/data.ts — read the ids and urls
// back out of it rather than keeping a second copy here
const src = await readFile("lib/data.ts", "utf8");
const block = src.slice(src.indexOf("export const PROJECTS"), src.indexOf("export const PROJECT_FILTERS"));
const projects = [...block.matchAll(/id:\s*"([^"]+)"[\s\S]*?url:\s*(?:asset\("([^"]*)"\)|"([^"]*)")/g)].map((m) => ({
  id: m[1],
  url: m[2] === undefined ? m[3] : LOCAL + m[2],
}));
if (!projects.length) throw new Error("no projects found in lib/data.ts");

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });

for (const { id, url } of projects) {
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
  } catch {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  }
  // this site holds its own content behind an intro; everything else just needs
  // a beat for fonts and first paint
  await page.waitForSelector(".preloader.is-gone", { timeout: 6000 }).catch(() => {});
  await page.waitForTimeout(1800);
  // the dev server's own badge is not part of the site
  await page.addStyleTag({ content: "nextjs-portal,#__next-build-watcher{display:none!important}" }).catch(() => {});
  const png = await page.screenshot();
  await writeFile(
    `${OUT}/${id}.webp`,
    await sharp(png).resize({ width: 640, withoutEnlargement: true }).webp({ quality: 72 }).toBuffer(),
  );
  console.log(`  · ${id.padEnd(12)} ${url}`);
  await page.close();
}

await browser.close();
