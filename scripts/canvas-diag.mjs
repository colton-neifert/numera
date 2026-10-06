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
await page.waitForTimeout(1500);
const info = await page.evaluate(() => {
  const all = [...document.querySelectorAll("canvas")];
  return all.map((c) => ({
    w: c.width,
    h: c.height,
    cw: c.clientWidth,
    ch: c.clientHeight,
    display: getComputedStyle(c).display,
    vis: getComputedStyle(c).visibility,
    op: getComputedStyle(c).opacity,
    z: getComputedStyle(c).zIndex,
    data: c.toDataURL("image/png").length,
  }));
});
console.log("CANVAS", JSON.stringify(info, null, 2));
const dataUrl = await page.evaluate(() => {
  const all = [...document.querySelectorAll("canvas")];
  const c = all.sort((a, b) => b.width * b.height - a.width * a.height)[0];
  return c ? c.toDataURL("image/png") : "";
});
if (dataUrl && dataUrl.length > 80) {
  writeFileSync("/workspace/screenshots/enter-world.png", Buffer.from(dataUrl.split(",")[1], "base64"));
  console.log("WROTE", dataUrl.length);
}
const el = await page.$("canvas");
if (el) await el.screenshot({ path: "/workspace/screenshots/canvas-el.png" });
await page.screenshot({ path: "/workspace/screenshots/page-full.png", fullPage: true });
await browser.close();
