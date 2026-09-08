import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("pageerror", (e) => console.log("PAGE", e.message));

const shotCanvas = async (path) => {
  await page.waitForTimeout(600);
  const dataUrl = await page.evaluate(() => {
    const all = [...document.querySelectorAll("canvas")];
    const c = all[all.length - 1];
    return c ? c.toDataURL("image/png") : "";
  });
  if (dataUrl && dataUrl.length > 80) {
    writeFileSync(path, Buffer.from(dataUrl.split(",")[1], "base64"));
    console.log("wrote", path, dataUrl.length);
  } else console.log("no canvas", path);
};

await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(500);
const skip = page.getByRole("button", { name: /skip/i }).first();
if (await skip.count()) await skip.click({ force: true });
await page.waitForFunction(() => Boolean(window.__gameTest), null, { timeout: 15000 });
await page.evaluate(() => window.__gameTest.boot());
await page.waitForFunction(() => window.__gameTest?.get?.()?.screen === "overworld", null, { timeout: 25000 });
await page.waitForTimeout(900);

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.house = null;
  live.day = 0.38;
  live.paused = false;
  live.hint = "";
  live.x = 6;
  live.z = -158;
  live.y = 2;
  live.shotCam = { x: 8, y: 9.6, z: -150, lx: -24, ly: 2.8, lz: -244 };
});
await shotCanvas("/workspace/screenshots/village-wide.png");

await page.evaluate(() => {
  window.__gameTest.set({ heroGender: "boy" });
  const live = window.__gameTest.live();
  live.x = -10;
  live.z = -172;
  live.yaw = 0.35;
  live.holding = "sword";
  live.shotCam = { x: -2, y: 2.15, z: -160, lx: -12, ly: 1.25, lz: -178 };
});
await shotCanvas("/workspace/screenshots/village-boy.png");

await page.evaluate(() => {
  window.__gameTest.set({ heroGender: "girl" });
  const live = window.__gameTest.live();
  live.holding = "boom";
});
await shotCanvas("/workspace/screenshots/village-girl.png");

await browser.close();
