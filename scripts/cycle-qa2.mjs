import { chromium } from "playwright";

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("pageerror", (e) => console.log("PAGE", e.message));

await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(700);
const skip = page.getByRole("button", { name: /skip/i }).first();
if (await skip.count()) await skip.click({ force: true });
await page.waitForFunction(() => Boolean(window.__gameTest), null, { timeout: 15000 });
await page.evaluate(() => window.__gameTest.boot());
await page.waitForFunction(
  () => window.__gameTest?.get?.()?.screen === "overworld" && document.querySelector("canvas"),
  null,
  { timeout: 25000 },
);
await page.waitForTimeout(1000);

async function go(hour, x, z, cam, name) {
  await page.evaluate(({ h, x, z, cam }) => {
    const live = window.__gameTest.live();
    live.house = null;
    live.day = (((h - 6) % 24) + 24) % 24 / 24;
    live.x = x;
    live.z = z;
    live.y = 6;
    live.yaw = 0.15;
    live.warpTo = { x, z };
    live.shotCam = cam;
    live.hasSword = true;
  }, { h: hour, x, z, cam });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `/workspace/screenshots/${name}.png` });
  const info = await page.evaluate(() => {
    const live = window.__gameTest.live();
    return {
      night: live.night,
      dusk: +live.dusk.toFixed(2),
      holt: live.npcPos.holt,
      tessIn: Boolean(live.npcInside.oak2),
      oak3In: Boolean(live.npcInside.oak3),
      noraIn: Boolean(live.npcInside.nora),
      mira: live.npcPos.mira,
    };
  });
  console.log(name, JSON.stringify(info));
}

await go(10, 48, -96, { x: 64, y: 10, z: -80, lx: 50, ly: 1.6, lz: -98 }, "cycle-farm-day");
await go(22, 48, -96, { x: 64, y: 10, z: -80, lx: 50, ly: 1.6, lz: -98 }, "cycle-farm-night");
await go(22, 2, -96, { x: 14, y: 7.2, z: -84, lx: 0, ly: 1.8, lz: -100 }, "cycle-fire-night");
await go(10, 2, -96, { x: 14, y: 7.2, z: -84, lx: 0, ly: 1.8, lz: -100 }, "cycle-fire-day");
await go(22, -24, -40, { x: -12, y: 12, z: -22, lx: -32, ly: 6, lz: -44 }, "cycle-moon-night");
await go(22, -30, 20, { x: -20, y: 8, z: 36, lx: -38, ly: 2, lz: 8 }, "cycle-woods-night");

await browser.close();
console.log("ok");
