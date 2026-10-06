import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const logs = [];
page.on("pageerror", (e) => logs.push("PAGE " + e.message));
page.on("console", (m) => {
  if (m.type() === "error") logs.push("CONSOLE " + m.text());
});

const shotCanvas = async (path) => {
  const dataUrl = await page.evaluate(() => {
    const all = [...document.querySelectorAll("canvas")];
    const c = all[all.length - 1];
    return c ? c.toDataURL("image/png") : "";
  });
  if (dataUrl && dataUrl.length > 80) {
    writeFileSync(path, Buffer.from(dataUrl.split(",")[1], "base64"));
    return dataUrl.length;
  }
  return 0;
};

await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(800);
const skip = page.getByRole("button", { name: /skip/i }).first();
if (await skip.count()) await skip.click({ force: true });
await page.waitForFunction(() => Boolean(window.__gameTest), null, { timeout: 12000 });
await page.evaluate(() => window.__gameTest.boot());
await page.waitForFunction(() => {
  const t = window.__gameTest?.get?.();
  const live = window.__gameTest?.live?.();
  return t?.screen === "overworld" && live && document.querySelector("canvas");
}, null, { timeout: 25000 });
await page.waitForTimeout(1200);
console.log("boot-logs", JSON.stringify(logs.slice(0, 8)));

await page.evaluate(() => {
  const live = window.__gameTest.live();
  window.__gameTest.set({ quests: { nim: 1, lefthome: 1 }, hasSword: true });
  live.nimFollow = true;
  live.x = 10;
  live.z = -8;
  live.yaw = 0.5;
  live.nimX = 8.4;
  live.nimZ = -6.6;
  live.nimMood = "walk";
  live.house = null;
  live.hint = "";
  live.listen = "";
  live.warpTo = { x: 10, z: -8 };
});
await page.waitForTimeout(700);
await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.shotCam = { x: 5.2, y: 1.65, z: -2.4, lx: 9.6, ly: 0.55, lz: -7.6 };
});
await page.waitForTimeout(1400);
await page.addStyleTag({ content: `.panel { opacity: 0 !important; }` });
await page.screenshot({ path: "/workspace/screenshots/fang-world.png" });
console.log("world-first", 1);

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.shotCam = null;
  live.nimFollow = true;
  live.charView = true;
  live.viewerAnim = "walk";
  live.viewerWire = false;
  live.studioLight = "afternoon";
  live.viewerYaw = 0.35;
  live.viewerPitch = 0.12;
  live.viewerDist = 3.4;
});
await page.waitForTimeout(500);
const fangBtn = page.getByRole("button", { name: /show fang/i }).first();
if (await fangBtn.count()) await fangBtn.click({ force: true });
const spinBtn = page.getByRole("button", { name: /spin/i }).first();
if (await spinBtn.count()) {
  const on = await spinBtn.evaluate((el) => el.className.includes("e8d48a"));
  if (on) await spinBtn.click({ force: true });
}
await page.waitForTimeout(800);

const views = [
  { id: "front", yaw: 0.15, pitch: 0.12, dist: 3.2 },
  { id: "side", yaw: Math.PI / 2, pitch: 0.08, dist: 3.4 },
  { id: "back", yaw: Math.PI, pitch: 0.12, dist: 3.3 },
  { id: "three", yaw: 0.7, pitch: 0.18, dist: 3.5 },
];
for (const v of views) {
  await page.evaluate((v) => {
    const live = window.__gameTest.live();
    live.viewFang = true;
    live.viewerAnim = "walk";
    live.viewerYaw = v.yaw;
    live.viewerPitch = v.pitch;
    live.viewerDist = v.dist;
    live.studioLight = "afternoon";
  }, v);
  await page.waitForTimeout(700);
  console.log(v.id, await shotCanvas(`/workspace/screenshots/fang-${v.id}.png`));
}

console.log("errors", JSON.stringify(logs.slice(0, 12)));
await browser.close();
