import { chromium } from "playwright";
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const logs = [];
page.on("pageerror", (e) => logs.push("PAGE " + e.message + "\n" + (e.stack || "").slice(0, 500)));
page.on("console", (m) => {
  if (m.type() === "error") logs.push("CONSOLE " + m.text());
});
await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(1500);
const skip = page.getByRole("button", { name: /skip/i }).first();
if (await skip.count()) await skip.click({ force: true });
await page.waitForFunction(() => Boolean(window.__gameTest), null, { timeout: 8000 });
await page.evaluate(() => window.__gameTest.boot());
await page.waitForTimeout(5000);
const info = await page.evaluate(() => ({
  screen: window.__gameTest?.get?.(),
  hasControls: Boolean(window.__controlsTest),
  canvas: document.querySelectorAll("canvas").length,
  body: document.body.innerText.slice(0, 240),
}));
console.log(JSON.stringify({ info, logs }, null, 2));
await page.screenshot({ path: "/workspace/screenshots/boot-debug.png", timeout: 4000 }).catch((e) => console.log("shot fail", e.message));
await browser.close();
