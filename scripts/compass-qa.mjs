import { chromium } from "playwright";

console.log("launch");
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.setDefaultTimeout(12000);
const logs = [];
page.on("pageerror", (e) => logs.push("PAGE " + e.message));
page.on("console", (m) => {
  if (m.type() === "error") logs.push("CONSOLE " + m.text());
});

console.log("goto");
await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
const skip = page.getByRole("button", { name: /skip/i }).first();
if (await skip.count()) await skip.click({ force: true }).catch(() => {});
console.log("wait gameTest");
await page.waitForFunction(() => Boolean(window.__gameTest), null, { timeout: 12000 });
console.log("boot");
await page.evaluate(() => window.__gameTest.boot());
await page.waitForFunction(() => window.__gameTest?.get?.()?.screen === "overworld", null, { timeout: 25000 });
console.log("overworld");
await page.evaluate(() => {
  window.__gameTest.set({ hasCompass: true });
  const live = window.__gameTest.live();
  live.paused = false;
  live.talking = false;
  live.sit = false;
});
await page.waitForFunction(() => Boolean(document.querySelector('[aria-label^="Compass"]')), null, { timeout: 8000 });
console.log("compass in dom");

const n0 = await page.evaluate(() => {
  const wrap = document.querySelector('[aria-label^="Compass"]');
  const n = [...wrap.querySelectorAll("text")].find((el) => el.textContent === "N");
  const r = n?.getBoundingClientRect();
  return r ? { x: Number(r.x.toFixed(1)), y: Number(r.y.toFixed(1)) } : null;
});

const headings = [];
const yaws = [
  ["N", 0],
  ["W", Math.PI / 2],
  ["S", Math.PI],
  ["E", -Math.PI / 2],
];
for (const [expect, yaw] of yaws) {
  await page.evaluate((y) => {
    window.__gameTest.live().yaw = y;
  }, yaw);
  await page.waitForTimeout(80);
  const info = await page.evaluate(() => {
    const wrap = document.querySelector('[aria-label^="Compass"]');
    const label = wrap?.querySelector("span")?.textContent ?? "";
    const gs = [...(wrap?.querySelectorAll("g") ?? [])];
    const face = gs[1]?.getAttribute("transform") ?? "";
    const n = [...wrap.querySelectorAll("text")].find((el) => el.textContent === "N");
    const r = n?.getBoundingClientRect();
    const svg = wrap.querySelector("svg")?.outerHTML ?? "";
    return {
      label,
      face,
      nx: Number((r?.x ?? 0).toFixed(1)),
      ny: Number((r?.y ?? 0).toFixed(1)),
      svg,
    };
  });
  headings.push({ expect, label: info.label, face: info.face, nx: info.nx, ny: info.ny });
  const { writeFileSync } = await import("node:fs");
  writeFileSync(`/workspace/screenshots/compass-${expect}.svg`, info.svg);
}

const nMoved = headings.some((h) => Math.abs(h.nx - n0.x) > 2 || Math.abs(h.ny - n0.y) > 2);
const labelsOk = headings.every((h) => h.label === h.expect);
const faceMoves = new Set(headings.map((h) => h.face)).size === 4;

console.log(JSON.stringify({ n0, headings: headings.map(({ svg, ...h }) => h), nMoved, labelsOk, faceMoves, logs: logs.slice(0, 8) }, null, 2));
if (!nMoved && labelsOk && faceMoves && logs.length === 0) console.log("PASS");
else console.log("FAIL");
await browser.close();
if (nMoved || !labelsOk || !faceMoves) process.exit(1);
