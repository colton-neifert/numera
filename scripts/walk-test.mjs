import { chromium } from "playwright";

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
page.on("pageerror", (e) => console.log("PAGE", e.message));
await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 20000 });
await page.getByText(/tap to skip|tap to start|select a file/i).first().waitFor({ timeout: 8000 }).catch(() => {});
if (await page.getByText(/tap to skip/i).count()) await page.getByText(/tap to skip/i).click({ force: true });
await page.waitForTimeout(300);
if (await page.getByRole("button", { name: /tap to start/i }).count()) {
  await page.getByRole("button", { name: /tap to start/i }).click({ force: true });
}
await page.waitForTimeout(300);
if (await page.getByText("No file").count()) await page.getByText("No file").first().click({ force: true });
await page.waitForTimeout(300);
if (await page.getByRole("button", { name: /^play$/i }).count()) {
  await page.getByRole("button", { name: /^play$/i }).first().click({ force: true });
}
await page.getByRole("button", { name: /^backpack$/i }).waitFor({ timeout: 10000 });
await page.waitForTimeout(800);
const before = await page.locator("body").innerText();
console.log("BEFORE", JSON.stringify(before.slice(0, 220)));
console.log("fairy?", /\?|valley is safe|how to play|ask for a clue/i.test(before));
await page.keyboard.down("KeyW");
await page.waitForTimeout(1200);
await page.keyboard.up("KeyW");
const after = await page.locator("body").innerText();
console.log("AFTER", JSON.stringify(after.slice(0, 180)));
await page.screenshot({ path: "/workspace/screenshots/walk.png", timeout: 5000, animations: "disabled" }).catch((e) => console.log("shot", e.message));
await browser.close();
