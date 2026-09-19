import { chromium } from "playwright";

const log = (m) => process.stdout.write(String(m) + "\n");

async function bootPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.setDefaultTimeout(25000);
  page.on("pageerror", (e) => log("PAGE " + e.message));
  await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 25000 });
  await page.waitForTimeout(300);
  const skip = page.getByRole("button", { name: /skip/i }).first();
  if (await skip.count()) await skip.click({ force: true }).catch(() => {});
  await page.waitForFunction(() => Boolean(window.__gameTest), null, { timeout: 20000 });
  await page.evaluate(() => window.__gameTest.boot());
  await page.waitForFunction(
    () => window.__gameTest?.get?.()?.screen === "overworld" && window.__controlsTest,
    null,
    { timeout: 30000 },
  );
  await page.waitForTimeout(400);
  return page;
}

async function walkHill(browser, name, start) {
  log("start " + name);
  const page = await bootPage(browser);
  const before = await page.evaluate(({ start }) => {
    const live = window.__gameTest.live();
    const h = window.__controlsTest.getHeight;
    const e = 0.9;
    const dxs = h(start.x - e, start.z) - h(start.x + e, start.z);
    const dzs = h(start.x, start.z - e) - h(start.x, start.z + e);
    const steep = Math.hypot(dxs, dzs);
    const yaw = Math.atan2(dxs, dzs);
    live.god = true;
    live.engaged = false;
    live.house = null;
    live.sliding = false;
    live.slideU = 0;
    live.speed = 0;
    live.vx = 0;
    live.shieldUp = false;
    live.paused = false;
    live.doorMath = false;
    live.doorUse = null;
    live.chestOpen = null;
    live.getItem = null;
    live.sit = false;
    live.bedLie = false;
    live.sleepPhase = "";
    live.slingU = 0;
    live.climbing = null;
    live.lock = null;
    live.mounted = false;
    live.rolling = false;
    live.talking = false;
    live.steerOverride = 0;
    live.holding = "sword";
    live.yaw = yaw;
    live.camYaw = yaw;
    live.x = start.x;
    live.z = start.z;
    live.y = h(start.x, start.z) + 0.04;
    live.grounded = true;
    live.warpTo = null;
    window.__controlsTest.setKeys(["KeyW"]);
    if (window.__controlsTest.pump) window.__controlsTest.pump(55);
    return {
      x: +live.x.toFixed(2),
      z: +live.z.toFixed(2),
      y: +live.y.toFixed(2),
      yaw: +yaw.toFixed(3),
      steep: +steep.toFixed(3),
      playT: +live.playT.toFixed(2),
      freeze: live.engaged || live.doorMath || Boolean(live.house) || live.sit,
      hasPump: typeof window.__controlsTest.pump === "function",
    };
  }, { start });
  log("before " + JSON.stringify(before));
  await page.waitForTimeout(4500);
  const last = await Promise.race([
    page.evaluate(() => {
      const live = window.__gameTest.live();
      const c = window.__controlsTest;
      const out = {
        x: +live.x.toFixed(2),
        z: +live.z.toFixed(2),
        y: +live.y.toFixed(2),
        speed: +live.speed.toFixed(2),
        sliding: live.sliding,
        grounded: live.grounded,
        playT: +live.playT.toFixed(2),
        engaged: live.engaged,
        house: live.house,
        yaw: +live.yaw.toFixed(3),
      };
      c.setKeys([]);
      live.steerOverride = null;
      return out;
    }),
    page.waitForTimeout(8000).then(() => ({ hung: true })),
  ]);
  await page.close().catch(() => {});
  if (last?.hung) {
    log("hung " + name);
    return { name, before, last, along: 0, dy: 0, dt: 0, ok: false, hung: true };
  }
  const fx = -Math.sin(before.yaw);
  const fz = -Math.cos(before.yaw);
  const along = (last.x - before.x) * fx + (last.z - before.z) * fz;
  const dy = last.y - before.y;
  const dt = last.playT - before.playT;
  const ok = along > 3.2 && dy > -0.15 && !last.sliding && last.speed > 1.4;
  const out = { name, before, last, dy: +dy.toFixed(2), along: +along.toFixed(2), dt: +dt.toFixed(2), ok };
  log("done " + JSON.stringify(out));
  return out;
}

const hills = [
  ["keep-road", { x: 0, z: -40 }],
  ["keep-mid", { x: 0, z: 20 }],
  ["east-hill", { x: 48, z: -116 }],
  ["south-hill", { x: 6, z: -168 }],
  ["west-hill", { x: -64, z: -106 }],
];

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const results = [];
for (const [name, start] of hills) {
  results.push(await walkHill(browser, name, start));
}
const passed = results.filter((r) => r.ok).length;
log("SUMMARY " + JSON.stringify({ passed, n: results.length, results }));
await browser.close();
if (passed < results.length) process.exit(1);
