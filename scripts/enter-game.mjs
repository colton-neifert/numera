import { chromium } from "playwright";

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("pageerror", (e) => console.log("PAGE", e.message));
await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(1200);
await page.mouse.click(640, 520);
await page.waitForTimeout(500);
const tap = page.getByRole("button", { name: /tap to start/i });
if (await tap.count()) await tap.click({ force: true });
await page.waitForTimeout(400);
const nofile = page.getByText("No file").first();
if (await nofile.count()) await nofile.click({ force: true });
await page.waitForTimeout(400);
const play = page.getByRole("button", { name: /^play$/i }).first();
if (await play.count()) await play.click({ force: true });
await page.waitForTimeout(2000);
const t = await page.locator("body").innerText();
console.log("AFTER PLAY", JSON.stringify(t.slice(0, 400)));
console.log("howto", /how to play/i.test(t));
console.log("select file", /select a file/i.test(t));
try {
  await page.screenshot({ path: "/workspace/screenshots/enter-world.png", timeout: 4000, animations: "disabled" });
} catch (e) {
  console.log("shot fail", e.message);
}
await browser.close();
