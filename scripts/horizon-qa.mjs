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

const shotCanvas = async (path) => {
  const dataUrl = await page.evaluate(() => {
    const all = [...document.querySelectorAll("canvas")];
    const c = all[all.length - 1];
    return c ? c.toDataURL("image/png") : "";
  });
  if (dataUrl && dataUrl.length > 80) {
    writeFileSync(path, Buffer.from(dataUrl.split(",")[1], "base64"));
    return dataUrl.length;
  }
  await page.screenshot({ path, timeout: 4000 });
  return 0;
};

await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
const skip = page.getByRole("button", { name: /skip/i }).first();
if (await skip.count()) await skip.click({ force: true }).catch(() => {});
await page.waitForFunction(() => Boolean(window.__gameTest), null, { timeout: 15000 });
await page.evaluate(() => window.__gameTest.boot());
await page.waitForFunction(() => window.__gameTest?.get?.()?.screen === "overworld" && Boolean(window.__controlsTest), null, { timeout: 25000 });
await page.waitForTimeout(900);

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
    grounded: c.getGrounded(),
    house: live.house,
    under: live.under,
    swim: live.swim,
    below: live.below,
  };
});
console.log("SPAWN", JSON.stringify(spawn));
await shotCanvas("/workspace/screenshots/enter-world.png");

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.house = null;
  live.houseY = 0;
  window.__controlsTest.warp(-22, -40);
});
await page.waitForTimeout(500);
await page.evaluate(() => {
  window.__controlsTest.setShot({ x: -24, y: 16.5, z: -28, lx: 48, ly: 26, lz: 490 });
});
await page.waitForTimeout(700);
await shotCanvas("/workspace/screenshots/watch-from-lookout.png");

await page.evaluate(() => {
  window.__controlsTest.setShot(null);
  window.__controlsTest.warp(20, 428);
});
await page.waitForTimeout(700);
await shotCanvas("/workspace/screenshots/watch-gorge.png");

await page.evaluate(() => {
  window.__controlsTest.setShot({ x: 8, y: 22, z: 410, lx: 48, ly: 18, lz: 490 });
});
await page.waitForTimeout(600);
await shotCanvas("/workspace/screenshots/watch-castle.png");

console.log("LOGS", JSON.stringify(logs.slice(0, 12)));
await browser.close();
