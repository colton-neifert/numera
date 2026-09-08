import { chromium } from "playwright";
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 20000 });
await page.waitForTimeout(400);
try {
  const skip = page.getByRole("button", { name: /skip/i }).first();
  if (await skip.count()) await skip.click({ force: true, timeout: 2000 });
} catch {}
await page.waitForFunction(() => Boolean(window.__gameTest), null, { timeout: 12000 });
await page.evaluate(() => window.__gameTest.boot());
await page.waitForFunction(() => window.__gameTest?.get?.()?.screen === "overworld", null, { timeout: 20000 });
await page.waitForTimeout(700);
await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.day = 0.38;
  live.house = null;
  live.hint = "";
  live.x = -18;
  live.z = -228;
  live.yaw = 2.6;
  live.holding = "sword";
  live.shotCam = { x: -6, y: 3.2, z: -210, lx: -22, ly: 1.4, lz: -232 };
});
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/village-boy.png", type: "png" });
console.log("ok boy");
await browser.close();
