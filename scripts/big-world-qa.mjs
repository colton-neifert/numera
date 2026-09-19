import { chromium } from "playwright";

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.setDefaultTimeout(20000);
const logs = [];
page.on("pageerror", (e) => {
  logs.push("PAGE " + e.message);
  console.log("PAGE", e.message.slice(0, 240));
});
page.on("console", (m) => {
  if (m.type() === "error") {
    logs.push("ERR " + m.text().slice(0, 220));
    console.log("ERR", m.text().slice(0, 180));
  }
});

await page.addInitScript(() => {
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
});

console.log("goto");
await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
console.log("loaded", await page.title());
const skip = page.getByText(/tap to skip|tap to start/i).first();
if (await skip.count()) {
  await skip.click({ force: true }).catch(() => {});
  console.log("clicked start/skip");
}
await page.waitForFunction(() => Boolean(window.__gameTest), null, { timeout: 20000 });
console.log("gameTest");
await page.evaluate(() => window.__gameTest.boot());
console.log("booted", await page.evaluate(() => window.__gameTest.get().screen));
await page.waitForFunction(() => window.__gameTest?.get?.()?.screen === "overworld", null, { timeout: 25000 });
console.log("overworld wait canvas");
await page.waitForFunction(() => Boolean(window.__controlsTest), null, { timeout: 25000 });
console.log("controls", await page.evaluate(() => ({ x: window.__controlsTest.getX(), z: window.__controlsTest.getZ() })));
await page.waitForTimeout(400);

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.paused = false;
  live.talking = false;
  live.sit = false;
  live.mounted = false;
  live.lock = null;
  live.hideBarrel = false;
  live.house = null;
  live.balloonRide = false;
  live.balloonH = 0;
  live.glideT = 0;
  live.sawVale = true;
  live.wheelT = 0;
  live.duckRide = false;
  live.sheepRide = -1;
  live.wagonRide = false;
  live.yaw = 0;
  live.speed = 0;
  window.__controlsTest.warp(200, 200);
});
await page.waitForTimeout(250);
await page.keyboard.press("g");
await page.waitForTimeout(180);

const before = await page.evaluate(() => {
  const c = window.__controlsTest;
  const live = window.__gameTest.live();
  live.yaw = 0;
  live.speed = 0;
  live.mounted = false;
  live.lock = null;
  return { x: c.getX(), z: c.getZ(), yaw: c.getYaw(), cam: c.getCamYaw?.() ?? 0 };
});
console.log("before", JSON.stringify(before));

await page.evaluate(() => window.__controlsTest.setKeys(["KeyW", "KeyA"]));
await page.waitForTimeout(1100);
await page.evaluate(() => window.__controlsTest.setKeys([]));
await page.waitForTimeout(80);

const after = await page.evaluate(() => {
  const c = window.__controlsTest;
  return { x: c.getX(), z: c.getZ(), yaw: c.getYaw(), cam: c.getCamYaw?.() ?? 0, speed: c.getSpeed() };
});
const yawDelta = wrap(after.yaw - before.yaw);
const xDelta = after.x - before.x;
const aOk = yawDelta > 0.08 && xDelta < -0.04;
console.log("after", JSON.stringify({ after, yawDelta, xDelta, aOk }));

const beforeFly = { x: 400, z: 400 };
await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.paused = false;
  live.talking = false;
  live.doorMath = false;
  live.balloonRide = true;
  live.balloonH = 12;
  live.balloonAirT = 0;
  live.balloonFrom = { x: 400, z: 400 };
  live.balloonTo = { x: -200, z: 400 };
  live.warpTo = null;
  live.yaw = 0;
  live.speed = 0;
  live.mounted = false;
  live.lock = null;
  live.x = 400;
  live.z = 400;
  live.qaPumps = 90;
});
await page.waitForTimeout(400);
const afterFly = await page.evaluate(() => {
  const c = window.__controlsTest;
  const live = window.__gameTest.live();
  return { x: c.getX(), z: c.getZ(), yaw: c.getYaw(), speed: c.getSpeed(), ride: live.balloonRide, air: Number(live.balloonAirT.toFixed(2)) };
});
const flyX = afterFly.x - beforeFly.x;
const flyOk = flyX < -40 && afterFly.ride === true;
console.log("fly", JSON.stringify({ beforeFly, afterFly, flyX, flyOk }));
await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.balloonRide = false;
  live.balloonH = 0;
});

const spots = [
  ["wind", -1080, 90],
  ["moon", 1080, 720],
  ["hat", 260, -1120],
  ["cart", -920, -860],
  ["geyser", 1480, -220],
  ["light", 80, -1720],
  ["ring", 420, 2480],
  ["giant", -2200, -180],
  ["lookout", -32, -44],
  ["balloon", 2.2, -120],
  ["fork", 6, -186],
  ["whale", -3180, 880],
  ["cloud", -160, 3460],
  ["ice", -60, -3360],
  ["ship", 3380, -400],
  ["socks", -4100, -2360],
  ["clock", 2720, -3180],
  ["flowers", 4180, 1540],
  ["snore", -2920, 3180],
  ["arch", 1540, 4180],
  ["ants", -3520, -2680],
  ["birds", 540, 4560],
  ["shoe", 4560, -720],
  ["bread", -4800, 920],
  ["edge", 36, 6680],
  ["stairs", 5600, 2100],
  ["chess", -1680, 5380],
  ["ducklake", 5080, -2580],
  ["door", -5380, -1180],
  ["compass", 2780, 5180],
  ["piano", -6200, 1800],
  ["spoon", 7200, -1400],
  ["boat", 120, 7900],
  ["cat", -7200, -2200],
  ["wish", 6400, 4200],
  ["cup", 8800, 800],
  ["umb", -8800, 400],
  ["slide", 280, -8800],
  ["bighat", -280, 9200],
  ["sandwich", 2400, -6400],
  ["bounce", -2400, 6400],
  ["card", 7600, 5200],
];
const land = await page.evaluate((spots) => {
  const clamp = window.__controlsTest.clamp;
  if (!clamp) return { missing: true, rows: [] };
  return {
    missing: false,
    rows: spots.map(([name, x, z]) => {
      const p = clamp(x, z);
      const miss = Math.hypot(p.x - x, p.z - z);
      return { name, miss: Number(miss.toFixed(1)), got: [Number(p.x.toFixed(1)), Number(p.z.toFixed(1))] };
    }),
  };
}, spots);
console.log("land", JSON.stringify(land));

const edgePos = await page.evaluate(() => {
  const clamp = window.__controlsTest.clamp;
  const p = clamp ? clamp(0, 40000) : { x: 0, z: 3300 };
  return { x: Number(p.x.toFixed(1)), z: Number(p.z.toFixed(1)), r: Number(Math.hypot(p.x, p.z + 80).toFixed(1)) };
});
console.log("edge", JSON.stringify(edgePos));

const landOk = !land.missing && land.rows.every((p) => p.miss < 8);
const edgeOk = edgePos.r > 22000 && edgePos.r < 26000;
const noErr = logs.length === 0;
const allOk = aOk && flyOk && landOk && edgeOk && noErr;
console.log(JSON.stringify({ aOk, flyOk, land, landOk, edgePos, edgeOk, logs: logs.slice(0, 8), allOk }));
console.log(allOk ? "PASS" : "FAIL");
await browser.close();
if (!allOk) process.exit(1);
