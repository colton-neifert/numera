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
await page.waitForTimeout(400);

await page.evaluate(() => {
  window.__gameTest.set({ hasSword: true, holding: "sword" });
  window.__gameTest.enter("cavern");
});
await page.waitForFunction(() => window.__gameTest?.get?.()?.world === "cavern" && Boolean(window.__controlsTest), null, { timeout: 20000 });
await page.waitForTimeout(800);

const spawn = await page.evaluate(() => {
  const c = window.__controlsTest;
  return { x: Number(c.getX().toFixed(2)), z: Number(c.getZ().toFixed(2)), y: Number((c.getY?.() ?? 0).toFixed(2)) };
});
await shotCanvas("/workspace/screenshots/dungeon-entrance.png");

await page.evaluate(() => window.__controlsTest.warp(7.5, 20));
await page.waitForTimeout(350);
await page.evaluate(() => {
  window.__controlsTest.setKeys(["KeyW"]);
});
await page.waitForTimeout(900);
await page.evaluate(() => window.__controlsTest.setKeys([]));
const afterPush = await page.evaluate(() => {
  const live = window.__gameTest.live();
  return { x: Number(window.__controlsTest.getX().toFixed(2)), z: Number(window.__controlsTest.getZ().toFixed(2)), plates: live.dungFlags?.plates, hint: live.hint };
});
await shotCanvas("/workspace/screenshots/dungeon-blocks.png");

await page.evaluate(() => window.__controlsTest.warp(0, -48));
await page.waitForTimeout(700);
await shotCanvas("/workspace/screenshots/dungeon-pit.png");

await page.evaluate(() => window.__controlsTest.warp(0, -112));
await page.waitForTimeout(700);
const hub = await page.evaluate(() => {
  const c = window.__controlsTest;
  return { x: Number(c.getX().toFixed(2)), z: Number(c.getZ().toFixed(2)) };
});
await shotCanvas("/workspace/screenshots/dungeon-hub.png");

await page.evaluate(() => window.__controlsTest.warp(0, -304));
await page.waitForTimeout(700);
await shotCanvas("/workspace/screenshots/dungeon-eyes.png");

await page.evaluate(() => window.__controlsTest.warp(0, -688));
await page.waitForTimeout(800);
await shotCanvas("/workspace/screenshots/dungeon-boss.png");

const report = { spawn, afterPush, hub, errors: errors.slice(0, 16) };
writeFileSync("/workspace/screenshots/dungeon-first.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
