import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const logs = [];
page.on("pageerror", (e) => logs.push("PAGE " + e.message));
page.on("console", (m) => {
  if (m.type() === "error") logs.push("CONSOLE " + m.text().slice(0, 220));
});

await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(500);
const skip = page.getByRole("button", { name: /skip/i }).first();
if (await skip.count()) await skip.click({ force: true });
await page.waitForFunction(() => Boolean(window.__gameTest), null, { timeout: 20000 });
await page.evaluate(() => window.__gameTest.boot());
await page.waitForFunction(() => {
  const t = window.__gameTest?.get?.();
  const live = window.__gameTest?.live?.();
  return t?.screen === "overworld" && live && document.querySelector("canvas") && window.__controlsTest;
}, null, { timeout: 30000 });
await page.waitForTimeout(800);

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

async function grab(label) {
  const data = await page.evaluate(() => {
    const c = document.querySelector("canvas");
    if (!c) return null;
    return c.toDataURL("image/jpeg", 0.72);
  });
  if (data && data.startsWith("data:image")) {
    writeFileSync(`/workspace/screenshots/${label}.jpg`, Buffer.from(data.split(",")[1], "base64"));
  }
  const info = await page.evaluate(() => {
    const live = window.__gameTest.live();
    return {
      x: +live.x.toFixed(2),
      z: +live.z.toFixed(2),
      y: +live.y.toFixed(2),
      speed: +live.speed.toFixed(2),
      yaw: +live.yaw.toFixed(3),
      grounded: live.grounded,
      wetT: +live.wetT.toFixed(2),
      swim: live.swim,
      gfx: window.__gfx,
      hair: window.__gameTest.get()?.heroLook?.hair,
    };
  });
  console.log(label, JSON.stringify(info));
  return info;
}

async function shot(label, fn) {
  if (fn) await page.evaluate(fn);
  await page.waitForTimeout(700);
  return grab(label);
}

await shot("feel-grass", () => {
  const live = window.__gameTest.live();
  live.house = null;
  live.day = 0.28;
  live.warpTo = { x: 2, z: -108 };
  live.yaw = 0.4;
  live.speed = 0;
  window.__controlsTest.setPull(7.4);
});

await shot("feel-pond", () => {
  const live = window.__gameTest.live();
  live.house = null;
  live.warpTo = { x: -54, z: -128 };
  live.yaw = 1.15;
  live.speed = 0;
  window.__controlsTest.setPull(11);
});

await shot("feel-creek", () => {
  const live = window.__gameTest.live();
  live.house = null;
  live.warpTo = { x: -14, z: -132 };
  live.yaw = 0;
  live.speed = 0;
  window.__controlsTest.setPull(8.5);
});

await shot("feel-river", () => {
  const live = window.__gameTest.live();
  live.house = null;
  live.warpTo = { x: 78, z: -90 };
  live.yaw = 1.2;
  live.speed = 0;
  window.__controlsTest.setPull(14);
});

await shot("feel-elder", () => {
  const live = window.__gameTest.live();
  live.house = null;
  live.warpTo = { x: 8, z: -94 };
  live.yaw = 1.7;
  live.speed = 0;
  window.__controlsTest.setPull(4.6);
});

await shot("feel-hero", () => {
  const live = window.__gameTest.live();
  live.house = null;
  live.warpTo = { x: 0, z: -100 };
  live.yaw = 0.2;
  live.speed = 0;
  window.__controlsTest.setPull(3.2);
});

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.shotCam = null;
  live.house = null;
  live.warpTo = { x: 4, z: -70 };
  live.yaw = 0;
  live.speed = 0;
  window.__controlsTest.setPull(8);
  window.__controlsTest.setKeys([]);
  live.steerOverride = null;
});
await page.waitForTimeout(400);

const before = await page.evaluate(() => ({ x: window.__controlsTest.getX(), z: window.__controlsTest.getZ(), t: performance.now() }));
await page.evaluate(() => window.__controlsTest.setKeys(["KeyW"]));
await page.waitForTimeout(1000);
const afterWalk = await page.evaluate(() => ({
  x: window.__controlsTest.getX(),
  z: window.__controlsTest.getZ(),
  speed: window.__controlsTest.getSpeed(),
  y: window.__controlsTest.getY(),
  grounded: window.__controlsTest.getGrounded(),
  t: performance.now(),
}));
await page.evaluate(() => window.__controlsTest.setKeys([]));
const dist = Math.hypot(afterWalk.x - before.x, afterWalk.z - before.z);
const dt = (afterWalk.t - before.t) / 1000;
console.log("walk", JSON.stringify({ dist: +dist.toFixed(2), dt: +dt.toFixed(3), mps: +(dist / dt).toFixed(2), speed: +afterWalk.speed.toFixed(2), y: +afterWalk.y.toFixed(2), grounded: afterWalk.grounded }));
await grab("feel-walk");

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.yaw = 0;
  live.speed = 8;
  live.steerOverride = null;
  window.__controlsTest.setKeys(["KeyW"]);
});
await page.waitForTimeout(250);
const y0 = await page.evaluate(() => window.__controlsTest.getYaw());
await page.evaluate(() => {
  window.__controlsTest.setKeys(["KeyW", "KeyA"]);
});
await page.waitForTimeout(450);
const yA = await page.evaluate(() => window.__controlsTest.getYaw());
await page.evaluate(() => {
  window.__gameTest.live().yaw = 0;
  window.__controlsTest.setKeys(["KeyW", "KeyD"]);
});
await page.waitForTimeout(450);
const yD = await page.evaluate(() => window.__controlsTest.getYaw());
await page.evaluate(() => {
  window.__controlsTest.setKeys([]);
  window.__gameTest.live().steerOverride = null;
  window.__gameTest.live().speed = 0;
});
const dA = wrap(yA - y0);
const dD = wrap(yD - 0);
console.log("controls", JSON.stringify({ y0, yA, yD, dA: +dA.toFixed(3), dD: +dD.toFixed(3), aLeft: dA > 0.05, dRight: dD < -0.05 }));

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.warpTo = { x: -54, z: -128 };
  live.yaw = 1.1;
  window.__controlsTest.setPull(9);
});
await page.waitForTimeout(500);
await page.evaluate(() => window.__controlsTest.setKeys(["KeyW"]));
await page.waitForTimeout(800);
const wade = await page.evaluate(() => {
  const live = window.__gameTest.live();
  return { wetT: +live.wetT.toFixed(2), swim: live.swim, speed: +live.speed.toFixed(2), y: +live.y.toFixed(2) };
});
await page.evaluate(() => window.__controlsTest.setKeys([]));
console.log("wade", JSON.stringify(wade));
await grab("feel-wade");

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.warpTo = { x: 2, z: -108 };
});
await page.waitForTimeout(700);
const dry = await page.evaluate(() => {
  const live = window.__gameTest.live();
  return { wetT: +live.wetT.toFixed(2), y: +live.y.toFixed(2) };
});
console.log("dry-after", JSON.stringify(dry));

console.log("errors", JSON.stringify(logs.slice(0, 20)));
if (dA <= 0.05 || dD >= -0.05) {
  console.log("CONTROLS FAIL");
  process.exitCode = 1;
}
if (afterWalk.speed < 12) {
  console.log("SPEED FAIL");
  process.exitCode = 1;
}
await browser.close();
