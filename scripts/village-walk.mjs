import { chromium } from "playwright";

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const logs = [];
page.on("pageerror", (e) => logs.push("PAGE " + e.message));
page.on("console", (m) => { if (m.type() === "error") logs.push("CONSOLE " + m.text()); });

await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(800);
const skip = page.getByRole("button", { name: /skip/i }).first();
if (await skip.count()) await skip.click({ force: true });
await page.waitForFunction(() => Boolean(window.__gameTest), null, { timeout: 12000 });
await page.evaluate(() => window.__gameTest.boot());
await page.waitForFunction(() => window.__gameTest?.get?.()?.screen === "overworld", null, { timeout: 25000 });
await page.waitForTimeout(1500);

const samples = [];
const pts = [
  [14, -58],
  [8, -88],
  [-4, -130],
  [6, -164],
  [1, -194],
  [2, -228],
  [-20, -236],
  [0, -134],
];
for (const [x, z] of pts) {
  const s = await page.evaluate(({ x, z }) => {
    const live = window.__gameTest.live();
    live.house = null;
    live.shotCam = null;
    live.warpTo = { x, z };
    live.x = x;
    live.z = z;
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve({
            x: live.x,
            z: live.z,
            y: live.y,
            house: live.house,
            swim: live.swim,
          });
        });
      });
    });
  }, { x, z });
  samples.push(s);
}

const door = await page.evaluate(() => {
  const live = window.__gameTest.live();
  const h = window.__gameTest.get?.();
  live.x = 0;
  live.z = -134.2;
  live.yaw = Math.PI;
  live.warpTo = { x: 0, z: -134.2 };
  return { nearHouse: live.nearHouse, x: live.x, z: live.z, y: live.y };
});

await page.waitForTimeout(400);
const after = await page.evaluate(() => {
  const live = window.__gameTest.live();
  return { nearHouse: live.nearHouse, house: live.house, y: live.y, x: live.x, z: live.z };
});

console.log(JSON.stringify({ samples, door, after, logs: logs.slice(0, 8) }, null, 2));
await browser.close();
