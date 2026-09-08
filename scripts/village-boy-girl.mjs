import { chromium } from "playwright";

const who = process.argv[2] || "boy";
const out = process.argv[3] || `/workspace/screenshots/village-${who}.png`;
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(400);
const skip = page.getByRole("button", { name: /skip/i }).first();
if (await skip.count()) await skip.click({ force: true });
await page.waitForFunction(() => Boolean(window.__gameTest), null, { timeout: 15000 });
await page.evaluate((g) => {
  window.__gameTest.boot();
  window.__gameTest.set({ heroGender: g });
}, who);
await page.waitForFunction(() => window.__gameTest?.get?.()?.screen === "overworld", null, { timeout: 25000 });
await page.waitForTimeout(800);
await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.house = null;
  live.day = 0.38;
  live.hint = "";
  live.x = -10;
  live.z = -172;
  live.yaw = 0.35;
  live.holding = live.holding || "sword";
  live.shotCam = { x: -2, y: 2.15, z: -160, lx: -12, ly: 1.25, lz: -178 };
});
await page.waitForTimeout(500);
await page.screenshot({ path: out, type: "png" });
console.log("wrote", out);
await browser.close();
