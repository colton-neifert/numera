import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

mkdirSync("/workspace/screenshots", { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.setDefaultTimeout(12000);
const logs = [];
page.on("pageerror", (e) => logs.push("PAGEERROR " + e.message));
page.on("console", (m) => {
  if (m.type() === "error") logs.push("CONSOLE " + m.text());
});

await page.addInitScript(() => {
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
});

await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
await page.screenshot({ path: "/workspace/screenshots/qa-title.png" });

const skipBtn = page.locator("button").filter({ hasText: /skip/i }).first();
await skipBtn.waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
await skipBtn.click({ force: true }).catch(() => {});
await page.evaluate(() => {
  const btn = [...document.querySelectorAll("button")].find((n) => /skip/i.test((n.textContent || "").trim()));
  if (btn) btn.click();
});
await page.waitForTimeout(600);
await page.keyboard.press("Space");
await page.keyboard.press("Enter");
await page.mouse.click(640, 420);
await page.waitForTimeout(800);
await page.evaluate(() => {
  const t = [...document.querySelectorAll("p, button")].find((n) => /tap to start/i.test(n.textContent || ""));
  if (t) t.click();
});
await page.mouse.click(640, 500);
await page.waitForTimeout(700);
await page.screenshot({ path: "/workspace/screenshots/qa-files.png" });

if (await page.getByText("No file").count()) await page.getByText("No file").first().click();
else if (await page.getByText("File 1").count()) await page.getByText("File 1").first().click();
await page.waitForTimeout(400);

for (let i = 0; i < 4; i++) {
  const cont = page.getByRole("button", { name: /^continue$/i });
  if (await cont.count()) {
    if (await page.getByText(/Choose your year/i).count()) {
      const ember = page.getByRole("button", { name: /^ember$/i });
      if (await ember.count()) await ember.click();
    }
    await cont.first().click().catch(() => {});
    await page.waitForTimeout(350);
  }
}
await page.waitForTimeout(800);
await page.screenshot({ path: "/workspace/screenshots/qa-hub.png" });

const enter = page.getByRole("button", { name: /^enter$/i }).first();
if (await enter.count()) await enter.click();
await page.waitForTimeout(3500);
await page.screenshot({ path: "/workspace/screenshots/qa-house.png" });

const canvas = page.locator("canvas").first();
if (await canvas.count()) await canvas.click({ position: { x: 620, y: 340 } }).catch(() => {});
await page.waitForTimeout(200);

const probe = () =>
  page.evaluate(() => ({
    yaw: window.__controlsTest?.getYaw?.() ?? null,
    speed: window.__controlsTest?.getSpeed?.() ?? null,
    x: window.__controlsTest?.getX?.() ?? null,
    lock: window.__controlsTest?.getLock?.() ?? null,
    probe: Boolean(window.__controlsTest),
  }));

const setKeys = (codes) => page.evaluate((c) => window.__controlsTest?.setKeys?.(c), codes);

console.log("HOUSE", JSON.stringify(await probe()));

await setKeys(["KeyW"]);
await page.waitForTimeout(1600);
await setKeys([]);
await page.keyboard.press("KeyF");
await page.waitForTimeout(2200);
await page.screenshot({ path: "/workspace/screenshots/qa-yard.png" });
console.log("YARD", JSON.stringify(await probe()));

await setKeys(["KeyW"]);
await page.waitForTimeout(900);
const before = await probe();
await page.evaluate(() => {
  window.__controlsTest?.setKeys?.(["KeyW", "KeyA"]);
  window.__controlsTest?.setSteer?.(1);
});
await page.waitForTimeout(500);
const afterA = await probe();
await page.evaluate(() => {
  window.__controlsTest?.setKeys?.([]);
  window.__controlsTest?.setSteer?.(null);
});
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const dA = before.yaw == null || afterA.yaw == null ? null : wrap(afterA.yaw - before.yaw);
console.log(JSON.stringify({ before, afterA, dA, aLeft: dA != null && dA > 0.05 }));

await page.waitForTimeout(250);
await page.screenshot({ path: "/workspace/screenshots/qa-walk.png" });

await page.evaluate(() => window.__controlsTest?.openPack?.());
await page.waitForTimeout(800);
await page.screenshot({ path: "/workspace/screenshots/qa-map.png" });

console.log("LOGS", logs.slice(0, 25));
console.log("TEXT", JSON.stringify((await page.locator("body").innerText()).slice(0, 400)));
await browser.close();
