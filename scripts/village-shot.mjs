import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const logs = [];
page.on("pageerror", (e) => logs.push("PAGE " + e.message));
page.on("console", (m) => {
  if (m.type() === "error") logs.push("CONSOLE " + m.text());
});

const shot = async (path) => {
  const dataUrl = await page.evaluate(() => {
    const c = document.querySelector("canvas");
    return c ? c.toDataURL("image/png") : "";
  });
  if (dataUrl && dataUrl.length > 80) {
    writeFileSync(path, Buffer.from(dataUrl.split(",")[1], "base64"));
    return dataUrl.length;
  }
  return 0;
};

await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(1000);
const skip = page.getByRole("button", { name: /skip/i }).first();
if (await skip.count()) await skip.click({ force: true });
await page.waitForFunction(() => Boolean(window.__gameTest), null, { timeout: 12000 });
await page.evaluate(() => window.__gameTest.boot());
await page.waitForFunction(() => {
  const t = window.__gameTest?.get?.();
  const live = window.__gameTest?.live?.();
  return t?.screen === "overworld" && live && document.querySelector("canvas");
}, null, { timeout: 25000 });
await page.waitForTimeout(2500);

const boot = await page.evaluate(() => {
  const t = window.__gameTest.get();
  const live = window.__gameTest.live();
  return { screen: t.screen, world: t.world, x: live.x, z: live.z, y: live.y };
});
console.log("boot", JSON.stringify(boot));
console.log("logs", JSON.stringify(logs.slice(0, 12)));

await page.addStyleTag({ content: `.panel { opacity: 0 !important; }` });

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.x = 8;
  live.z = -130;
  live.yaw = Math.PI;
  live.speed = 0;
  live.day = 0.38;
  live.lock = null;
  live.hint = "";
  live.house = null;
  live.warpTo = { x: 8, z: -130 };
  live.shotCam = { x: 16, y: 8.6, z: -172, lx: -22, ly: 2.8, lz: -246 };
});
await page.waitForTimeout(2800);
console.log("ref-len", await shot("/workspace/screenshots/village-ref.png"));

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.x = 2;
  live.z = -202;
  live.yaw = 0;
  live.day = 0.38;
  live.warpTo = { x: 2, z: -202 };
  live.shotCam = { x: 4, y: 4.2, z: -188, lx: 0, ly: 3.2, lz: -230 };
});
await page.waitForTimeout(1800);
console.log("fire-len", await shot("/workspace/screenshots/village-fire.png"));

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.x = -20;
  live.z = -236;
  live.day = 0.38;
  live.warpTo = { x: -20, z: -236 };
  live.shotCam = { x: -8, y: 8.4, z: -220, lx: -36, ly: 2.6, lz: -250 };
});
await page.waitForTimeout(1800);
console.log("pond-len", await shot("/workspace/screenshots/village-pond.png"));

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.x = 14;
  live.z = -58;
  live.yaw = Math.PI;
  live.day = 0.38;
  live.warpTo = { x: 14, z: -58 };
  live.shotCam = { x: 18, y: 6.2, z: -48, lx: 8, ly: 2.4, lz: -110 };
});
await page.waitForTimeout(1800);
console.log("path-len", await shot("/workspace/screenshots/village-path.png"));

console.log("logs-end", JSON.stringify(logs.slice(0, 16)));
await browser.close();
