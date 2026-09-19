import { chromium } from "playwright";

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("pageerror", (e) => console.log("PAGE", e.message));
await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForFunction(() => Boolean(window.__gameTest), null, { timeout: 15000 });
await page.evaluate(() => window.__gameTest.boot());
await page.waitForFunction(() => window.__gameTest?.get?.()?.screen === "overworld", null, { timeout: 20000 });
await page.waitForFunction(() => Boolean(window.__controlsTest), null, { timeout: 25000 }).catch(() => {});
await page.waitForTimeout(600);
const info = await page.evaluate(() => {
  const live = window.__gameTest.live();
  const t = window.__controlsTest;
  const h = t?.getHeight;
  const samples = {};
  if (h) {
    samples.village = +h(0, -108).toFixed(2);
    samples.house = +h(-16.8, -94.4).toFixed(2);
    samples.yours = +h(0, -80.8).toFixed(2);
    samples.keep = +h(0, -26).toFixed(2);
    samples.hillE = +h(78, -108).toFixed(2);
    samples.hillW = +h(-78, -108).toFixed(2);
    samples.hillS = +h(0, -190).toFixed(2);
  }
  return {
    world: window.__gameTest.get()?.world,
    x: +live.x.toFixed(2),
    z: +live.z.toFixed(2),
    y: +live.y.toFixed(2),
    grounded: live.grounded,
    house: live.house,
    dusk: live.dusk,
    day: live.day,
    samples,
  };
});
console.log("SPAWN", JSON.stringify(info));
await browser.close();
