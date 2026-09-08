import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

mkdirSync("/workspace/screenshots", { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.setDefaultTimeout(12000);
const logs = [];
page.on("pageerror", (e) => logs.push("PAGE " + e.message));
page.on("console", (m) => {
  if (m.type() === "error") logs.push("CONSOLE " + m.text());
});

async function shot(path) {
  try {
    await page.screenshot({ path, timeout: 2500 });
    console.log("shot", path);
  } catch {
    console.log("screenshot skip", path);
  }
}

function deltas(frames) {
  const out = [];
  for (let i = 1; i < frames.length; i++) {
    const a = frames[i - 1];
    const b = frames[i];
    if (!a || !b) {
      out.push(null);
      continue;
    }
    out.push({
      dx: +(b.x - a.x).toFixed(3),
      dy: +(b.y - a.y).toFixed(3),
      dz: +(b.z - a.z).toFixed(3),
      dist: +Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z).toFixed(3),
    });
  }
  return out;
}

await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(1800);
const skip = page.getByRole("button", { name: /skip/i }).first();
if (await skip.count()) await skip.click({ force: true });
await page.waitForTimeout(400);
await page.waitForFunction(() => Boolean(window.__gameTest), null, { timeout: 8000 });
await page.evaluate(() => window.__gameTest.boot());
await page.waitForTimeout(1800);
await page.waitForFunction(() => Boolean(window.__controlsTest), null, { timeout: 10000 });
const got = page.getByRole("button", { name: /got it/i });
if (await got.count()) await got.click({ force: true }).catch(() => {});
await page.evaluate(() => window.__controlsTest.warp(14, -58));
await page.waitForTimeout(500);

const fireBomb = () =>
  page.evaluate(() => {
    const live = window.__gameTest.live();
    const fx = -Math.sin(live.yaw);
    const fz = -Math.cos(live.yaw);
    live.paused = false;
    live.house = null;
    live.bombs.length = 0;
    live.bombs.push({
      x: live.x + fx * 0.42,
      y: live.y + 1.08,
      z: live.z + fz * 0.42,
      vx: fx * 9.4,
      vy: 5.4,
      vz: fz * 9.4,
      fuse: 2.4,
      boom: false,
      spin: 0,
      bounce: 0,
    });
  });

await fireBomb();
const bomb = [];
for (let i = 0; i < 8; i++) {
  await page.waitForTimeout(80);
  bomb.push(
    await page.evaluate(() => {
      const b = window.__gameTest.live().bombs[0];
      return b ? { x: +b.x.toFixed(3), y: +b.y.toFixed(3), z: +b.z.toFixed(3) } : null;
    }),
  );
}

await page.evaluate(() => {
  const live = window.__gameTest.live();
  const fx = -Math.sin(live.yaw);
  const fz = -Math.cos(live.yaw);
  live.booms.length = 0;
  live.booms.push({
    x: live.x,
    y: live.y + 1.05,
    z: live.z,
    vx: fx * 13.5,
    vz: fz * 13.5,
    vy: 0.6,
    age: 0,
    back: false,
    spin: 0,
  });
});
const boom = [];
for (let i = 0; i < 8; i++) {
  await page.waitForTimeout(80);
  boom.push(
    await page.evaluate(() => {
      const b = window.__gameTest.live().booms[0];
      return b ? { x: +b.x.toFixed(3), y: +b.y.toFixed(3), z: +b.z.toFixed(3) } : null;
    }),
  );
}

await page.evaluate(() => {
  const live = window.__gameTest.live();
  const fx = -Math.sin(live.yaw);
  const fz = -Math.cos(live.yaw);
  live.arrows.length = 0;
  live.arrows.push({
    x: live.x,
    y: live.y + 1.2,
    z: live.z,
    vx: fx * 24,
    vy: 1.2,
    vz: fz * 24,
    age: 0,
    kind: "arrow",
  });
});
const arrow = [];
for (let i = 0; i < 6; i++) {
  await page.waitForTimeout(60);
  arrow.push(
    await page.evaluate(() => {
      const b = window.__gameTest.live().arrows[0];
      return b ? { x: +b.x.toFixed(3), y: +b.y.toFixed(3), z: +b.z.toFixed(3) } : null;
    }),
  );
}

await page.evaluate(() => {
  window.__gameTest.live().paused = true;
});
const z0 = await page.evaluate(() => window.__gameTest.live().arrows[0]?.z);
await page.waitForTimeout(300);
const z1 = await page.evaluate(() => window.__gameTest.live().arrows[0]?.z);
await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.paused = false;
  live.house = "yours";
});
await page.waitForTimeout(200);
const afterHouse = await page.evaluate(() => {
  const live = window.__gameTest.live();
  const n = { bombs: live.bombs.length, booms: live.booms.length, arrows: live.arrows.length };
  live.house = null;
  return n;
});

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.day = (17.6 - 6) / 24;
  live.yaw = Math.PI;
  window.__controlsTest.warp(10, -128);
});
await page.waitForTimeout(1500);
await shot("/workspace/screenshots/test-meadow.png");
await shot("/workspace/screenshots/meadow-valley.png");

const out = {
  bomb,
  bombStep: deltas(bomb),
  boom,
  boomStep: deltas(boom),
  arrow,
  arrowStep: deltas(arrow),
  pauseHeld: z0 === z1,
  afterHouse,
  logs,
};
writeFileSync("/workspace/screenshots/weapon-frames.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
await browser.close();
