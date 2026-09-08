import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("pageerror", (e) => console.log("PAGE", e.message));

const canvasShot = async (path) => {
  const dataUrl = await page.evaluate(() => {
    const all = [...document.querySelectorAll("canvas")];
    const c = all[all.length - 1];
    return c ? c.toDataURL("image/png") : "";
  });
  if (dataUrl && dataUrl.length > 80) {
    writeFileSync(path, Buffer.from(dataUrl.split(",")[1], "base64"));
    return dataUrl.length;
  }
  return 0;
};

await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(700);
const skip = page.getByRole("button", { name: /skip/i }).first();
if (await skip.count()) await skip.click({ force: true });
await page.waitForFunction(() => Boolean(window.__gameTest), null, { timeout: 12000 });
await page.evaluate(() => window.__gameTest.boot());
await page.waitForFunction(() => window.__gameTest?.get?.()?.screen === "overworld" && document.querySelector("canvas"), null, { timeout: 25000 });
await page.waitForTimeout(1400);

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.house = null;
  live.hint = "";
  live.day = 0.38;
  live.x = -10;
  live.z = -168;
  live.yaw = 0.2;
  live.warpTo = { x: -10, z: -168 };
  live.hasSword = true;
  live.hasShield = true;
  live.holding = "sword";
  live.shotCam = { x: 8, y: 9.6, z: -150, lx: -24, ly: 2.8, lz: -244 };
});
await page.waitForTimeout(900);
console.log("village-afternoon", await canvasShot("/workspace/screenshots/light-village.png"));

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.day = 0.92;
  live.shotCam = { x: 8, y: 9.6, z: -150, lx: -24, ly: 2.8, lz: -244 };
});
await page.waitForTimeout(700);
console.log("village-night", await canvasShot("/workspace/screenshots/light-village-night.png"));

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.day = 0.38;
  live.charView = true;
  live.studioLight = "afternoon";
  live.viewerWire = false;
  live.viewerYaw = 0.45;
  live.viewerPitch = 0.1;
  live.viewerDist = 4.6;
});
await page.waitForTimeout(700);
await page.screenshot({ path: "/workspace/screenshots/light-studio.png" });
console.log("studio ok");
await browser.close();
