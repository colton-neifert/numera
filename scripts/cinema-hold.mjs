import { chromium } from "playwright";
import { mkdirSync } from "fs";

mkdirSync("/workspace/screenshots", { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const logs = [];
page.on("pageerror", (e) => logs.push("PAGE " + e.message));
page.on("console", (m) => {
  if (m.type() === "error") logs.push("ERR " + m.text().slice(0, 220));
});
await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(1000);
const tap = page.getByText(/tap to start/i).first();
if (await tap.count()) await tap.click({ force: true });
await page.waitForTimeout(500);
await page.keyboard.press("Enter");
await page.waitForFunction(() => typeof window.__titlePhase === "function", { timeout: 15000 });
await page.evaluate(() => {
  window.__titlePhase("cinema");
});
await page.waitForTimeout(1200);
const body = await page.locator("body").innerText();
console.log("AFTER CINEMA", JSON.stringify(body.slice(0, 280)));

const shots = [
  [18.6, "cinema-hang"],
  [20.9, "cinema-slam"],
  [21.8, "cinema-glow"],
  [23.2, "cinema-steam"],
  [24.6, "cinema-stomp"],
  [32.4, "cinema-hang2"],
];
for (const [t, name] of shots) {
  await page.evaluate((n) => {
    window.__forgeT = n;
  }, t);
  await page.waitForTimeout(800);
  await page.screenshot({ path: `/workspace/screenshots/${name}.png`, type: "png" });
  const cap = (await page.locator("body").innerText()).slice(0, 160);
  console.log("shot", name, t, JSON.stringify(cap));
}
console.log("LOGS", logs.slice(0, 16).join("\n"));
await browser.close();
