import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";

mkdirSync("/workspace/screenshots", { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const logs = [];
page.on("pageerror", (e) => logs.push("PAGE " + e.message));
page.on("console", (m) => {
  if (m.type() === "error") logs.push("CONSOLE " + m.text());
});

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
await page.waitForTimeout(1200);

const spawn = await page.evaluate(() => {
  const c = window.__controlsTest;
  const live = window.__gameTest.live();
  live.paused = false;
  live.talking = false;
  live.sit = false;
  live.charView = false;
  return {
    x: Number(c.getX().toFixed(2)),
    z: Number(c.getZ().toFixed(2)),
    y: Number(c.getY().toFixed(2)),
    yaw: Number(c.getYaw().toFixed(2)),
    grounded: c.getGrounded(),
    house: live.house,
    under: live.under,
    swim: live.swim,
    listen: live.listen || "",
  };
});
console.log("SPAWN", JSON.stringify(spawn));
await page.screenshot({ path: "/workspace/screenshots/enter-world.png", timeout: 4000 });

await page.evaluate(() => {
  window.__controlsTest.setKeys(["KeyW"]);
});
await page.waitForTimeout(700);
await page.evaluate(() => window.__controlsTest.setKeys([]));
const walk = await page.evaluate(() => {
  const c = window.__controlsTest;
  return { x: Number(c.getX().toFixed(2)), z: Number(c.getZ().toFixed(2)), y: Number(c.getY().toFixed(2)), speed: Number(c.getSpeed().toFixed(2)) };
});
console.log("WALK", JSON.stringify(walk));
await page.screenshot({ path: "/workspace/screenshots/deck-walk.png", timeout: 4000 });

await page.evaluate(() => {
  window.__controlsTest.setShot(null);
  window.__controlsTest.warp(-40, -128);
});
await page.waitForTimeout(700);
await page.screenshot({ path: "/workspace/screenshots/pond-isle.png", timeout: 4000 });

await page.evaluate(() => {
  window.__controlsTest.warp(3, -158);
});
await page.waitForTimeout(600);
await page.screenshot({ path: "/workspace/screenshots/mill-ladder.png", timeout: 4000 });

await page.evaluate(() => {
  window.__controlsTest.setShot(null);
  window.__controlsTest.warp(-32, -40);
});
await page.waitForTimeout(700);
await page.evaluate(() => {
  window.__controlsTest.setShot({ x: -24, y: 18, z: -48, lx: 48, ly: 36, lz: 490 });
});
await page.waitForTimeout(800);
await page.screenshot({ path: "/workspace/screenshots/watch-from-lookout.png", timeout: 4000 });

await page.evaluate(() => {
  window.__controlsTest.setShot({ x: 8, y: 28, z: 430, lx: 48, ly: 32, lz: 490 });
});
await page.waitForTimeout(700);
await page.screenshot({ path: "/workspace/screenshots/watch-castle.png", timeout: 4000 });

await page.evaluate(() => {
  window.__controlsTest.setShot({ x: -54, y: 14, z: -118, lx: -55, ly: 6, lz: -130 });
});
await page.waitForTimeout(600);
await page.screenshot({ path: "/workspace/screenshots/pond-hut-close.png", timeout: 4000 });

console.log("LOGS", JSON.stringify(logs.slice(0, 12)));
await browser.close();
