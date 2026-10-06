import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";

mkdirSync("/workspace/screenshots", { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => {
  errors.push(e.message);
  console.log("PAGE", e.message);
});
page.on("console", (msg) => {
  if (msg.type() === "error") {
    const t = msg.text();
    if (!/Failed to load|favicon|og\.jpg/.test(t)) {
      errors.push(t);
      console.log("CONSOLE", t);
    }
  }
});

const canvasShot = async (path) => {
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
await page.waitForFunction(() => Boolean(window.__gameTest), null, { timeout: 15000 });
await page.evaluate(() => window.__gameTest.boot());
await page.waitForFunction(
  () => window.__gameTest?.get?.()?.screen === "overworld" && document.querySelector("canvas"),
  null,
  { timeout: 25000 },
);
await page.waitForTimeout(1200);

const sample = async (hour, label) => {
  await page.evaluate((h) => {
    const live = window.__gameTest.live();
    live.house = null;
    live.cave = false;
    live.dungeon = false;
    live.hint = "";
    live.day = (((h - 6) % 24) + 24) % 24 / 24;
    live.x = 2;
    live.z = -96;
    live.y = 6;
    live.yaw = 0.2;
    live.warpTo = { x: 2, z: -96 };
    live.hasSword = true;
    live.holding = "sword";
    live.shotCam = { x: 10, y: 8.4, z: -82, lx: 0, ly: 2.2, lz: -100 };
  }, hour);
  await page.waitForTimeout(1800);
  const info = await page.evaluate(() => {
    const live = window.__gameTest.live();
    const t = (live.day * 24 + 6) % 24;
    const shift = t >= 5.1 && t < 7.6 ? "dawn" : t >= 7.6 && t < 17.2 ? "day" : t >= 17.2 && t < 20.2 ? "dusk" : "night";
    const holt = live.npcPos.holt ?? null;
    const tess = live.npcPos.oak2 ?? null;
    const mira = live.npcPos.mira ?? null;
    const fire = { x: 0, z: -100 };
    const farm = { x: 50, z: -98 };
    const d = (a, b) => (a && b ? Math.hypot(a.x - b.x, a.z - b.z) : 99);
    const foes = Object.entries(live.foeTrack || {});
    const nightFoes = foes.filter(([id]) => id.startsWith("night-"));
    const aggro = [...(live.aggroIds || [])];
    return {
      t,
      shift,
      dusk: live.dusk,
      night: live.night,
      clockHour: live.clockHour,
      holt,
      tess,
      mira,
      holtToFire: d(holt, fire),
      holtToFarm: d(holt, farm),
      tessInside: Boolean(live.npcInside?.oak2),
      miraY: mira,
      nightFoeN: nightFoes.length,
      aggroN: aggro.length,
      banner: live.banner,
    };
  });
  const n = await canvasShot(`/workspace/screenshots/cycle-${label}.png`);
  await page.screenshot({ path: `/workspace/screenshots/cycle-${label}-hud.png` });
  console.log(label, JSON.stringify(info), "shot", n);
  return info;
};

const day = await sample(10, "day");
const dusk = await sample(18.4, "dusk");
const night = await sample(22, "night");

const farmNight = await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.day = ((22 - 6) % 24) / 24;
  live.x = 48;
  live.z = -96;
  live.warpTo = { x: 48, z: -96 };
  live.shotCam = { x: 62, y: 9, z: -84, lx: 50, ly: 2, lz: -98 };
});
await page.waitForTimeout(1400);
console.log("farm-night", await canvasShot("/workspace/screenshots/cycle-farm-night.png"));

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.day = ((10 - 6) % 24) / 24;
  live.x = 48;
  live.z = -96;
  live.warpTo = { x: 48, z: -96 };
  live.shotCam = { x: 62, y: 9, z: -84, lx: 50, ly: 2, lz: -98 };
});
await page.waitForTimeout(1400);
console.log("farm-day", await canvasShot("/workspace/screenshots/cycle-farm-day.png"));

console.log("ERRORS", errors.length, errors.slice(0, 6));
console.log("ASSERT day.shift", day.shift);
console.log("ASSERT night.shift", night.shift);
console.log("ASSERT dusk.shift", dusk.shift);
if (day.shift !== "day") throw new Error("day not day");
if (night.shift !== "night") throw new Error("night not night");
if (dusk.shift !== "dusk") throw new Error("dusk not dusk");
if (!night.night) throw new Error("live.night false at 22h");
if (day.night) throw new Error("live.night true at 10h");
await browser.close();
