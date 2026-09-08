import { chromium } from "playwright";

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
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
await page.getByRole("button", { name: /^backpack$/i }).click({ force: true });
await page.getByRole("button", { name: /next item/i }).waitFor({ timeout: 4000 });
await page.screenshot({ path: "/workspace/screenshots/backpack.png", timeout: 5000, animations: "disabled" });
await page.getByRole("button", { name: /next item/i }).click({ force: true });
await page.waitForTimeout(250);
await page.screenshot({ path: "/workspace/screenshots/backpack-2.png", timeout: 4000, animations: "disabled" });
console.log("ok", JSON.stringify((await page.locator("body").innerText()).slice(0, 200)));
await browser.close();
