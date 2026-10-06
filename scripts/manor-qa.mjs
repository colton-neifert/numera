import { chromium } from "playwright";

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push("PAGE " + e.message));
page.on("console", (m) => {
  if (m.type() === "error" && !/ERR_CONNECTION_REFUSED|favicon/.test(m.text())) errors.push("CON " + m.text());
});

await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle", timeout: 45000 });
await page.waitForTimeout(700);
await page.mouse.click(640, 400);
await page.waitForTimeout(300);

const booted = await page.evaluate(() => {
  if (!window.__gameTest) return { ok: false };
  window.__gameTest.boot();
  return { ok: true };
});
console.log("boot", JSON.stringify(booted));
await page.waitForTimeout(2200);

const outside = await page.evaluate(() => {
  const t = window.__gameTest;
  t.set({ quests: { manorKey: 1 } });
  const live = t.live();
  live.house = null;
  live.doorUse = null;
  if (window.__controlsTest?.warp) window.__controlsTest.warp(-48, -116.8);
  return true;
});
console.log("outside", outside);
await page.waitForTimeout(900);
await page.screenshot({ path: "/workspace/screenshots/manor-outside.png", animations: "disabled" });

const entered = await page.evaluate(() => {
  const t = window.__gameTest;
  t.set({ quests: { manorKey: 1, manorOpen: 1 } });
  const live = t.live();
  live.warpTo = null;
  live.doorUse = { id: "manor", t: 0, dir: "in", opened: false };
  return true;
});
console.log("enter", entered);
await page.waitForTimeout(1600);

const inside = await page.evaluate(() => {
  const live = window.__gameTest.live();
  window.__controlsTest?.setShot?.({
    x: -48,
    y: live.y + 2.4,
    z: -120.6,
    lx: -48,
    ly: live.y + 1.2,
    lz: -125.2,
  });
  return { house: live.house, x: live.x, z: live.z, y: live.y, look: live.nearLook };
});
console.log("inside", JSON.stringify(inside));
await page.waitForTimeout(500);
await page.screenshot({ path: "/workspace/screenshots/manor-inside.png", animations: "disabled" });

const clockLook = await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.x = -46.45;
  live.z = -124.62;
  live.sit = false;
  live.nearChair = false;
  return { look: live.nearLook, lift: live.y };
});
await page.waitForTimeout(250);
await page.keyboard.press("KeyF");
await page.waitForTimeout(350);
const clock = await page.evaluate(() => {
  const live = window.__gameTest.live();
  window.__controlsTest?.setShot?.({
    x: -46.2,
    y: 4.2,
    z: -122.4,
    lx: -46.45,
    ly: 2.4,
    lz: -124.7,
  });
  return { look: live.nearLook, listen: live.listen, house: live.house };
});
console.log("clock", JSON.stringify({ clockLook, clock }));
await page.waitForTimeout(300);
await page.screenshot({ path: "/workspace/screenshots/manor-clock.png", animations: "disabled" });

const latch = await page.evaluate(() => {
  const live = window.__gameTest.live();
  window.__controlsTest?.setShot?.({
    x: -48.4,
    y: live.y + 2.2,
    z: -121.4,
    lx: -48.4,
    ly: live.y + 1.1,
    lz: -123.0,
  });
  live.x = -48.85;
  live.z = -122.85;
  live.sit = true;
  live.sitAt = { x: -48.85, z: -122.85, yaw: Math.PI / 2 };
  return true;
});
await page.waitForTimeout(1600);
const latched = await page.evaluate(() => {
  const live = window.__gameTest.live();
  return { listen: live.listen, sit: live.sit, house: live.house };
});
console.log("latch", JSON.stringify(latched));
await page.screenshot({ path: "/workspace/screenshots/manor-table.png", animations: "disabled" });

await page.evaluate(() => {
  const t = window.__gameTest;
  t.set({ quests: { manorKey: 1, manorOpen: 1, manorLatch: 1, manorClock: 1, manorPic: 1, manorBook: 1 } });
  const live = t.live();
  live.sit = false;
  live.x = -51.6;
  live.z = -124.1;
  window.__controlsTest?.setShot?.({
    x: -50.2,
    y: live.y + 2.1,
    z: -123.2,
    lx: -51.6,
    ly: live.y + 1.1,
    lz: -124.2,
  });
});
await page.waitForTimeout(500);
await page.keyboard.press("KeyF");
await page.waitForTimeout(400);
const desk = await page.evaluate(() => {
  const live = window.__gameTest.live();
  return { look: live.nearLook, listen: live.listen };
});
console.log("desk", JSON.stringify(desk));
await page.screenshot({ path: "/workspace/screenshots/manor-desk.png", animations: "disabled" });

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.x = -46.7;
  live.z = -127.4;
  window.__controlsTest?.setShot?.({
    x: -46.4,
    y: live.y + 4.6,
    z: -125.2,
    lx: -47.8,
    ly: live.y + 3.3,
    lz: -127.4,
  });
});
await page.waitForTimeout(600);
await page.screenshot({ path: "/workspace/screenshots/manor-loft.png", animations: "disabled" });

console.log("errors", errors);
await browser.close();
if (errors.length) process.exit(1);
