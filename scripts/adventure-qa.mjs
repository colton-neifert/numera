import { chromium } from "playwright";
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push("PAGE " + e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push("CON " + m.text()); });
await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(800);
await page.mouse.click(640, 400);
await page.waitForTimeout(400);
const booted = await page.evaluate(() => {
  if (!window.__gameTest) return { ok: false, reason: "no __gameTest" };
  window.__gameTest.boot();
  return { ok: true, state: window.__gameTest.get() };
});
console.log("boot", JSON.stringify(booted));
await page.waitForTimeout(3500);
const after = await page.evaluate(() => {
  const t = window.__gameTest?.get?.() ?? null;
  const live = window.__gameTest?.live?.() ?? null;
  return {
    screen: t?.screen, world: t?.world, hp: t?.hp,
    x: live?.x, z: live?.z, y: live?.y,
    listen: live?.listen ?? "",
    hint: live?.hint ?? "",
    house: live?.house,
  };
});
console.log("after", JSON.stringify(after));
await page.screenshot({ path: "/workspace/screenshots/adventure-meadow.png", animations: "disabled" });
await page.keyboard.down("KeyW");
await page.waitForTimeout(2800);
await page.keyboard.up("KeyW");
await page.waitForTimeout(400);
const walk = await page.evaluate(() => {
  const live = window.__gameTest?.live?.() ?? null;
  return { x: live?.x, z: live?.z, listen: live?.listen, hint: live?.hint, house: live?.house };
});
console.log("walk", JSON.stringify(walk));
await page.screenshot({ path: "/workspace/screenshots/adventure-walk.png", animations: "disabled" });
console.log("errors", errors);
await browser.close();
if (errors.length) process.exit(1);
