import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";
mkdirSync("/workspace/screenshots", { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("pageerror", (e) => console.log("PAGE", e.message));
await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
const skip = page.getByRole("button", { name: /skip/i }).first();
if (await skip.count()) await skip.click({ force: true }).catch(() => {});
await page.waitForFunction(() => Boolean(window.__gameTest), null, { timeout: 15000 });
await page.evaluate(() => window.__gameTest.boot());
await page.waitForFunction(
  () => window.__gameTest?.get?.()?.screen === "overworld" && Boolean(window.__controlsTest),
  null,
  { timeout: 25000 },
);
await page.waitForTimeout(800);

const dump = async (name, cam) => {
  await page.evaluate((c) => {
    const live = window.__gameTest.live();
    live.paused = false;
    live.talking = false;
    live.charView = false;
    window.__controlsTest.setShot(c);
  }, cam);
  await page.waitForTimeout(500);
  const dataUrl = await page.evaluate(() => {
    const c = [...document.querySelectorAll("canvas")].pop();
    return c.toDataURL("image/png");
  });
  writeFileSync(`/workspace/screenshots/${name}.png`, Buffer.from(dataUrl.split(",")[1], "base64"));
  const live = await page.evaluate(() => {
    const c = window.__controlsTest;
    const live = window.__gameTest.live();
    return { x: c.getX(), z: c.getZ(), y: c.getY(), house: live.house, shot: live.shotCam };
  });
  console.log(name, dataUrl.length, JSON.stringify(live));
};

await dump("enter-world", null);
await dump("village-square", { x: 4, y: 9.2, z: -92, lx: 2, ly: 6.4, lz: -108 });
await dump("deck-down", { x: -25.7, y: 12.4, z: -158, lx: -20, ly: 6.2, lz: -108 });
await dump("pond-look", { x: -40, y: 8, z: -118, lx: -54, ly: 5.5, lz: -130 });
await dump("watch-hill", { x: 20, y: 32, z: 430, lx: 48, ly: 28, lz: 490 });
await browser.close();
