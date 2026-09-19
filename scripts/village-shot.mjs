import { chromium } from "playwright";

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("pageerror", (e) => console.log("PAGE", e.message));
await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForFunction(() => Boolean(window.__gameTest), null, { timeout: 15000 });
await page.evaluate(() => window.__gameTest.boot());
await page.waitForFunction(() => window.__gameTest?.get?.()?.screen === "overworld", null, { timeout: 20000 });
await page.waitForFunction(() => Boolean(window.__controlsTest), null, { timeout: 25000 });
await page.waitForTimeout(800);
await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.shotCam = { x: 8, y: 38, z: -48, lx: 0, ly: 3, lz: -108 };
  live.paused = true;
});
await page.waitForTimeout(1200);
await page.screenshot({ path: "/workspace/screenshots/village-aerial.png" });
await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.shotCam = { x: 14, y: 8.4, z: -72, lx: 2, ly: 3.2, lz: -108 };
});
await page.waitForTimeout(900);
await page.screenshot({ path: "/workspace/screenshots/village-eye.png" });
const info = await page.evaluate(() => {
  const live = window.__gameTest.live();
  const h = window.__controlsTest.getHeight;
  return {
    x: live.x,
    z: live.z,
    y: live.y,
    dusk: live.dusk,
    bg: document.body?.style?.background,
    inn: +h(-28.9, -145.4).toFixed(2),
    shop: +h(15.3, -74).toFixed(2),
    mill: +h(1.7, -136.9).toFixed(2),
    loft: +h(39.1, -118.2).toFixed(2),
  };
});
console.log("SHOT", JSON.stringify(info));
await browser.close();
