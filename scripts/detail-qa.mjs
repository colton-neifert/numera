import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

mkdirSync("/workspace/screenshots", { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => {
  errors.push(e.message);
  console.log("PAGE", e.message);
});
page.on("console", (msg) => {
  if (msg.type() === "error") {
    const t = msg.text();
    if (!/Failed to load|favicon|og\.jpg/.test(t)) {
      errors.push(t);
      console.log("CONSOLE", t);
    }
  }
});

await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(800);
const skip = page.getByRole("button", { name: /skip/i }).first();
if (await skip.count()) await skip.click({ force: true });
await page.waitForFunction(() => Boolean(window.__gameTest), null, { timeout: 20000 });
await page.evaluate(() => window.__gameTest.boot());
await page.waitForFunction(
  () => window.__gameTest?.get?.()?.screen === "overworld" && document.querySelector("canvas"),
  null,
  { timeout: 25000 },
);
await page.waitForTimeout(1000);

const go = async (label, x, z, cam) => {
  await page.evaluate(
    ({ x, z, cam }) => {
      const live = window.__gameTest.live();
      live.house = null;
      live.cave = false;
      live.dungeon = false;
      live.hint = "";
      live.listen = "";
      live.day = 0.3;
      live.x = x;
      live.z = z;
      live.y = 6;
      live.yaw = 0.15;
      live.warpTo = { x, z };
      live.hasSword = true;
      live.holding = "sword";
      live.shotCam = cam;
    },
    { x, z, cam },
  );
  await page.waitForTimeout(2200);
  const pos = await page.evaluate(() => {
    const live = window.__gameTest.live();
    return { x: live.x, z: live.z, y: live.y };
  });
  const path = `/workspace/screenshots/detail-${label}.png`;
  await page.screenshot({ path, type: "png" });
  console.log(label, pos, path);
};

await go("square", 2, -96, { x: 12, y: 8.2, z: -78, lx: 0, ly: 1.8, lz: -108 });
await go("farm", 50, -98, { x: 62, y: 7.4, z: -84, lx: 50, ly: 1.6, lz: -100 });
await go("woods", -908, 26, { x: -888, y: 9.5, z: 48, lx: -908, ly: 2.2, lz: 18 });
await go("pond", -22, -128, { x: -4, y: 7.2, z: -108, lx: -22, ly: 1.4, lz: -132 });

console.log("errors", errors.length, errors.slice(0, 6));
await browser.close();
if (errors.length) process.exit(1);
