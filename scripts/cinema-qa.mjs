import { chromium } from "playwright";

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const logs = [];
page.on("pageerror", (e) => logs.push("PAGE " + e.message));
page.on("console", (m) => {
  if (m.type() === "error") logs.push("ERR " + m.text().slice(0, 220));
});
await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(1000);
await page.getByText(/tap to start/i).first().click({ force: true, timeout: 8000 });
await page.waitForTimeout(800);
console.log("AFTER TAP", JSON.stringify((await page.locator("body").innerText()).slice(0, 400)));
await page.screenshot({ path: "/workspace/screenshots/cinema-files.png", type: "png" });
const erase = page.getByRole("button", { name: /^erase$/i }).first();
if (await erase.count()) {
  await erase.click({ force: true });
  await page.waitForTimeout(400);
}
const fileBtn = page.locator("button").filter({ hasText: /file 1|no file/i }).first();
await fileBtn.click({ force: true, timeout: 8000 });
await page.waitForTimeout(1400);
const storyTxt = (await page.locator("body").innerText()).slice(0, 500);
console.log("STORY", JSON.stringify(storyTxt));
await page.screenshot({ path: "/workspace/screenshots/story-twist-1.png", type: "png" });
await page.evaluate(() => {
  window.__forgeFast = true;
});
const skip = page.getByText(/skip story/i).first();
console.log("skip", await skip.count());
if (await skip.count()) await skip.click({ force: true });
await page.waitForTimeout(2000);
console.log("CINEMA1", JSON.stringify((await page.locator("body").innerText()).slice(0, 400)));
await page.screenshot({ path: "/workspace/screenshots/cinema-moon.png", type: "png" });
await page.waitForTimeout(4500);
console.log("CINEMA2", JSON.stringify((await page.locator("body").innerText()).slice(0, 280)));
await page.screenshot({ path: "/workspace/screenshots/cinema-line.png", type: "png" });
await page.waitForTimeout(5000);
console.log("CINEMA3", JSON.stringify((await page.locator("body").innerText()).slice(0, 280)));
await page.screenshot({ path: "/workspace/screenshots/cinema-grab.png", type: "png" });
await page.waitForTimeout(4000);
console.log("CINEMA4", JSON.stringify((await page.locator("body").innerText()).slice(0, 280)));
await page.screenshot({ path: "/workspace/screenshots/cinema-fang.png", type: "png" });
await page.waitForTimeout(4500);
console.log("CINEMA5", JSON.stringify((await page.locator("body").innerText()).slice(0, 280)));
await page.screenshot({ path: "/workspace/screenshots/cinema-you.png", type: "png" });
await page.waitForTimeout(4000);
console.log("CINEMA6", JSON.stringify((await page.locator("body").innerText()).slice(0, 280)));
await page.screenshot({ path: "/workspace/screenshots/cinema-run.png", type: "png" });
console.log("LOGS", logs.slice(0, 12).join("\n"));
await browser.close();
