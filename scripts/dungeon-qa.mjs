import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

mkdirSync("/workspace/screenshots", { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
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
  return 0;
};

await page.addInitScript(() => {
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
});

await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
const skip = page.getByRole("button", { name: /skip/i }).first();
if (await skip.count()) await skip.click({ force: true }).catch(() => {});
await page.waitForFunction(() => Boolean(window.__gameTest), null, { timeout: 15000 });
await page.evaluate(() => window.__gameTest.boot());
await page.waitForFunction(() => window.__gameTest?.get?.()?.screen === "overworld" && Boolean(window.__controlsTest), null, { timeout: 25000 });
await page.waitForTimeout(500);

await page.evaluate(() => {
  window.__gameTest.set({ hasSword: true, holding: "sword" });
  window.__gameTest.enter("cavern");
});
await page.waitForFunction(() => window.__gameTest?.get?.()?.world === "cavern" && Boolean(window.__controlsTest), null, { timeout: 20000 });
await page.waitForTimeout(900);

const before = await page.evaluate(() => {
  const c = window.__controlsTest;
  const live = window.__gameTest.live();
  live.paused = false;
  return { x: c.getX(), z: c.getZ(), y: c.getY?.(), hint: c.getHint?.() || live.hint, world: window.__gameTest.get().world };
});
await shotCanvas("/workspace/screenshots/dungeon-cavern.png");

await page.evaluate(() => {
  window.__controlsTest.setKeys(["KeyW"]);
  window.__controlsTest.pump(90);
});
await page.waitForTimeout(1600);
await page.evaluate(() => window.__controlsTest.setKeys([]));
await page.waitForTimeout(300);
const afterWalk = await page.evaluate(() => {
  const c = window.__controlsTest;
  return { x: Number(c.getX().toFixed(2)), z: Number(c.getZ().toFixed(2)), hint: c.getHint?.() || window.__gameTest.live().hint };
});
await shotCanvas("/workspace/screenshots/dungeon-door.png");

await page.evaluate(() => window.__controlsTest.warp(10.2, 20));
await page.waitForTimeout(400);
await page.evaluate(() => {
  window.__controlsTest.setKeys(["KeyW"]);
  window.__controlsTest.pump(40);
});
await page.waitForTimeout(800);
await page.evaluate(() => window.__controlsTest.setKeys([]));
await page.waitForTimeout(200);
const pushed = await page.evaluate(() => {
  const c = window.__controlsTest;
  return { x: Number(c.getX().toFixed(2)), z: Number(c.getZ().toFixed(2)), hint: c.getHint?.() || window.__gameTest.live().hint };
});
await shotCanvas("/workspace/screenshots/dungeon-blocks.png");

console.log(JSON.stringify({ before, afterWalk, pushed, errors: errors.slice(0, 12) }, null, 2));
await browser.close();
