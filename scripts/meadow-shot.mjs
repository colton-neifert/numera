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
await page.waitForTimeout(2000);

const boot = await page.evaluate(() => {
  const t = window.__gameTest.get();
  const live = window.__gameTest.live();
  return { screen: t.screen, world: t.world, x: live.x, z: live.z, y: live.y };
});
console.log("boot", JSON.stringify(boot));
console.log("logs", JSON.stringify(logs.slice(0, 8)));

await page.addStyleTag({
  content: `.panel { opacity: 0 !important; }`,
});

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.x = 14;
  live.z = -58;
  live.yaw = Math.PI;
  live.speed = 0;
  live.day = 0.479;
  live.lock = null;
  live.hint = "";
  live.house = null;
  live.warpTo = { x: 14, z: -58 };
  live.shotCam = { x: 78, y: 22, z: -70, lx: 0, ly: 18, lz: -26 };
});
await page.waitForTimeout(2000);
console.log("profile-len", await shot("/workspace/screenshots/meadow-profile.png"));

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.x = -18;
  live.z = -148;
  live.yaw = Math.PI;
  live.day = 0.479;
  live.warpTo = { x: -18, z: -148 };
  live.shotCam = { x: -20, y: 16, z: -172, lx: 6, ly: 18, lz: -48 };
});
await page.waitForTimeout(2000);
console.log("compose-len", await shot("/workspace/screenshots/meadow-compose.png"));
console.log("compose-len2", await shot("/workspace/screenshots/test-meadow.png"));

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.x = 14;
  live.z = -58;
  live.yaw = Math.PI;
  live.day = 0.479;
  live.warpTo = { x: 14, z: -58 };
  live.shotCam = { x: 14, y: 10, z: -72, lx: 0, ly: 26, lz: -26 };
});
await page.waitForTimeout(1600);
console.log("valley-len", await shot("/workspace/screenshots/meadow-valley.png"));

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.x = -38;
  live.z = -128;
  live.yaw = 0.3;
  live.day = 0.479;
  live.warpTo = { x: -38, z: -128 };
  live.shotCam = { x: -58, y: 12, z: -148, lx: -30, ly: 10, lz: -118 };
});
await page.waitForTimeout(1400);
console.log("cottages-len", await shot("/workspace/screenshots/meadow-cottages.png"));

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.x = 0;
  live.z = -202;
  live.yaw = 0;
  live.day = 0.2;
  live.warpTo = { x: 0, z: -202 };
  live.shotCam = { x: 8, y: 6, z: -188, lx: 0, ly: 1.4, lz: -202 };
});
await page.waitForTimeout(1400);
console.log("fire-len", await shot("/workspace/screenshots/village-fire.png"));

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.x = 8;
  live.z = -122;
  live.yaw = Math.PI;
  live.day = 0.479;
  live.warpTo = { x: 8, z: -122 };
  live.shotCam = null;
  live.lock = { id: "focus", kind: "focus", x: 8, z: -114 };
});
await page.waitForTimeout(1200);
console.log("lock-len", await shot("/workspace/screenshots/meadow-lock.png"));

const end = await page.evaluate(() => {
  const live = window.__gameTest.live();
  return { x: live.x, y: live.y, z: live.z, lock: Boolean(live.lock) };
});
console.log("end", JSON.stringify(end));
await browser.close();
