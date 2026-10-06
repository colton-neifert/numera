import { chromium } from "playwright";

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const logs = [];
page.on("pageerror", (e) => logs.push("PAGE " + e.message));
page.on("console", (m) => {
  if (m.type() === "error") logs.push("CONSOLE " + m.text());
});

await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(1200);
const skip = page.getByRole("button", { name: /skip/i }).first();
if (await skip.count()) await skip.click({ force: true });
await page.waitForFunction(() => Boolean(window.__gameTest), null, { timeout: 15000 });
await page.evaluate(() => window.__gameTest.boot());
await page.waitForFunction(() => {
  const t = window.__gameTest?.get?.();
  const live = window.__gameTest?.live?.();
  return t?.screen === "overworld" && live && document.querySelector("canvas");
}, null, { timeout: 25000 });
await page.waitForTimeout(2200);

const views = [
  { name: "mouth", x: 90, z: -108, cam: { x: 72, y: 12, z: -138, lx: 90, ly: 3, lz: -110 } },
  { name: "ford", x: 470, z: -68, cam: { x: 452, y: 14, z: -104, lx: 478, ly: 3, lz: -78 } },
  { name: "isle", x: 612, z: -50, cam: { x: 590, y: 16, z: -92, lx: 612, ly: 3, lz: -64 } },
  { name: "sluice", x: 768, z: -28, cam: { x: 748, y: 12, z: -18, lx: 768, ly: 3, lz: -38 } },
  { name: "falls", x: 1016, z: -18, cam: { x: 990, y: 16, z: -36, lx: 1016, ly: 6, lz: -6 } },
  { name: "pool", x: 1072, z: 36, cam: { x: 1048, y: 14, z: 18, lx: 1072, ly: 3, lz: 46 } },
];

for (const v of views) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.evaluate((v) => {
      const live = window.__gameTest.live();
      live.house = null;
      live.cave = false;
      live.doorUse = null;
      live.mounted = false;
      live.day = 0.42;
      live.yaw = 0.35;
      live.speed = 0;
      live.lock = null;
      live.hint = "";
      live.x = v.x;
      live.z = v.z;
      live.y = 6;
      live.shotCam = v.cam;
      live.warpTo = { x: v.x, z: v.z };
    }, v);
    await page.waitForTimeout(900);
    const pos = await page.evaluate(() => {
      const live = window.__gameTest.live();
      return { x: live.x, z: live.z, y: live.y, house: live.house, swim: live.swim };
    });
    const d = Math.hypot(pos.x - v.x, pos.z - v.z);
    if (d < 12) break;
  }
  const pos = await page.evaluate(() => {
    const live = window.__gameTest.live();
    return { x: live.x, z: live.z, y: live.y, swim: live.swim, listen: live.listen, house: live.house };
  });
  await page.screenshot({ path: `/workspace/screenshots/river-${v.name}.png` });
  console.log(v.name, JSON.stringify(pos));
}

console.log("logs", JSON.stringify(logs.slice(0, 12)));
await browser.close();
