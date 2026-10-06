import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

mkdirSync("/workspace/screenshots", { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const logs = [];
page.on("pageerror", (e) => logs.push("PAGE " + e.message));
page.on("console", (m) => {
  if (m.type() === "error") logs.push("CONSOLE " + m.text());
});

await page.addInitScript(() => {
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
});

await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
const skip = page.getByRole("button", { name: /skip/i }).first();
if (await skip.count()) await skip.click({ force: true }).catch(() => {});
await page.waitForFunction(() => Boolean(window.__gameTest), null, { timeout: 15000 });
await page.evaluate(() => window.__gameTest.boot());
await page.waitForFunction(() => {
  const t = window.__gameTest?.get?.();
  const live = window.__gameTest?.live?.();
  return t?.screen === "overworld" && live && window.__controlsTest && document.querySelector("canvas");
}, null, { timeout: 25000 });
await page.waitForTimeout(1800);

async function warpTo(x, z) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.evaluate(({ x, z }) => {
      const live = window.__gameTest.live();
      live.house = null;
      live.cave = false;
      live.doorUse = null;
      live.mounted = false;
      live.day = 0.42;
      live.yaw = 0.02;
      live.speed = 0;
      live.lock = null;
      live.hint = "";
      live.listen = "";
      live.climbing = null;
      window.__controlsTest.warp(x, z);
      window.__controlsTest.setShot(null);
    }, { x, z });
    await page.waitForTimeout(700);
    const pos = await page.evaluate(() => {
      const live = window.__gameTest.live();
      return { x: live.x, z: live.z, y: live.y };
    });
    if (Math.hypot(pos.x - x, pos.z - z) < 14) return pos;
  }
  return page.evaluate(() => {
    const live = window.__gameTest.live();
    return { x: live.x, z: live.z, y: live.y };
  });
}

async function aimNorthUp() {
  await page.evaluate(() => {
    const live = window.__gameTest.live();
    const y = live.y;
    window.__controlsTest.setShot({
      x: live.x,
      y: y + 5.2,
      z: live.z - 16,
      lx: live.x + 6,
      ly: y + 14,
      lz: live.z + 42,
    });
  });
  await page.waitForTimeout(450);
}

const views = [
  { name: "gate", x: 22, z: 442 },
  { name: "goat", x: -48, z: 528 },
  { name: "camp", x: -64, z: 746 },
  { name: "falls", x: 162, z: 620 },
  { name: "needles", x: 96, z: 708 },
  { name: "vine", x: 4, z: 770 },
  { name: "tower", x: -36, z: 872 },
  { name: "summit", x: 30, z: 996 },
];

for (const v of views) {
  const pos = await warpTo(v.x, v.z);
  await aimNorthUp();
  const extra = await page.evaluate(() => {
    const live = window.__gameTest.live();
    return { listen: live.listen, swim: live.swim, y: +live.y.toFixed(1) };
  });
  await page.screenshot({ path: `/workspace/screenshots/mount-${v.name}.png`, animations: "disabled" });
  console.log(v.name, JSON.stringify({ x: +pos.x.toFixed(1), z: +pos.z.toFixed(1), ...extra }));
}

await warpTo(-64, 746);
await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.yaw = Math.PI;
  window.__controlsTest.setShot(null);
  window.__controlsTest.setKeys(["KeyW"]);
});
await page.waitForTimeout(1800);
const walked = await page.evaluate(() => {
  window.__controlsTest.setKeys([]);
  const live = window.__gameTest.live();
  return { x: +live.x.toFixed(1), z: +live.z.toFixed(1), y: +live.y.toFixed(1) };
});
console.log("walk-north-from-camp", JSON.stringify(walked));

await page.evaluate(() => {
  window.__gameTest.set({ quests: { claws: 1, "map-mount": 1 } });
});
await warpTo(-48, 768);
await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.yaw = 0.1;
  window.__controlsTest.setShot(null);
  window.__controlsTest.setKeys(["KeyW"]);
});
await page.waitForTimeout(5200);
const climb = await page.evaluate(() => {
  window.__controlsTest.setKeys([]);
  const live = window.__gameTest.live();
  return {
    x: +live.x.toFixed(1),
    z: +live.z.toFixed(1),
    y: +live.y.toFixed(1),
    climbing: live.climbing,
    listen: live.listen,
  };
});
await page.screenshot({ path: "/workspace/screenshots/mount-claws-vine.png", animations: "disabled" });
console.log("claws-vine", JSON.stringify(climb));

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.warpTo = null;
  live.house = null;
  live.cave = true;
  live.x = 48;
  live.z = 768.2;
  live.y = 20;
  live.climbing = null;
  window.__controlsTest.setShot({
    x: 48,
    y: 22.4,
    z: 772,
    lx: 48,
    ly: 20.6,
    lz: 766,
  });
});
await page.waitForTimeout(700);
const cave = await page.evaluate(() => {
  const live = window.__gameTest.live();
  return { x: +live.x.toFixed(1), z: +live.z.toFixed(1), y: +live.y.toFixed(1), cave: live.cave };
});
await page.screenshot({ path: "/workspace/screenshots/mount-cave.png", animations: "disabled" });
console.log("cave", JSON.stringify(cave));

console.log("logs", JSON.stringify(logs.slice(0, 16)));
await browser.close();
