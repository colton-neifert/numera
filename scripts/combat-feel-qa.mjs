import { chromium } from "playwright";

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const logs = [];
page.on("pageerror", (e) => logs.push("PAGE " + e.message));

await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(800);
const skip = page.getByRole("button", { name: /skip/i }).first();
if (await skip.count()) await skip.click({ force: true }).catch(() => {});
const tap = page.getByRole("button", { name: /tap to start/i }).first();
if (await tap.count()) await tap.click({ force: true }).catch(() => {});
await page.waitForFunction(() => Boolean(window.__gameTest), null, { timeout: 20000 });
await page.evaluate(() => window.__gameTest.boot());
await page.waitForFunction(
  () => window.__gameTest?.get?.()?.screen === "overworld" && Boolean(window.__controlsTest),
  null,
  { timeout: 25000 },
);
await page.waitForTimeout(600);

const snap = async (label, fn) => {
  const info = await page.evaluate(fn);
  await page.waitForTimeout(1100);
  await page.screenshot({ path: `/workspace/screenshots/${label}.png` });
  const after = await page.evaluate(() => {
    const live = window.__gameTest.live();
    const foes = Object.keys(live.foeTrack || {});
    const near = foes.filter((id) => {
      const p = live.foeTrack[id];
      return p && Math.hypot(live.x - p.x, live.z - p.z) < 18;
    });
    return {
      x: +live.x.toFixed(1),
      z: +live.z.toFixed(1),
      aggro: [...(live.aggroIds || [])],
      near,
      listen: (live.listen || "").slice(0, 80),
      hint: (live.hint || "").slice(0, 80),
      hour: live.day,
      swinging: live.swinging,
      swingHit: live.swingHit,
    };
  });
  console.log(label, JSON.stringify({ info, after }));
  return after;
};

await snap("qa-village-safe", () => {
  const live = window.__gameTest.live();
  const g = window.__gameTest;
  g.set({ hasSword: true, hasShield: true, quests: { nim: 1 } });
  live.hasSword = true;
  live.hasShield = true;
  live.holding = "sword";
  live.house = null;
  live.paused = false;
  live.day = 0.22;
  live.warpTo = { x: 0, z: -100 };
  live.x = 0;
  live.z = -100;
  live.yaw = 0.4;
  return { where: "oakstead" };
});

await snap("qa-hopscotch", () => {
  const live = window.__gameTest.live();
  live.house = null;
  live.day = 0.22;
  live.warpTo = { x: 19.4, z: -88.6 };
  live.x = 19.4;
  live.z = -88.6;
  live.yaw = 0.2;
  return { where: "chalk" };
});

await snap("qa-sundial-day", () => {
  const live = window.__gameTest.live();
  live.house = null;
  live.listen = "";
  live.day = 0.22;
  live.warpTo = { x: 12, z: -196 };
  live.x = 12;
  live.z = -196;
  live.yaw = -1.1;
  return { where: "dial-day" };
});

await snap("qa-sundial-dusk", () => {
  const live = window.__gameTest.live();
  live.house = null;
  live.listen = "";
  live.day = 0.5;
  live.dusk = 0.7;
  live.warpTo = { x: 12, z: -196 };
  live.x = 12;
  live.z = -196;
  live.yaw = -1.1;
  return { where: "dial-dusk" };
});

await snap("qa-combat-east", () => {
  const live = window.__gameTest.live();
  live.house = null;
  live.day = 0.22;
  live.god = true;
  live.hasSword = true;
  live.holding = "sword";
  live.warpTo = { x: 140, z: -42 };
  live.x = 140;
  live.z = -42;
  live.yaw = -1.2;
  return { where: "meadow-e0" };
});

await page.keyboard.press("v");
await page.waitForTimeout(280);
await page.keyboard.press("v");
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/qa-combat-swing.png" });
const swing = await page.evaluate(() => {
  const live = window.__gameTest.live();
  return {
    swinging: live.swinging,
    swingHit: live.swingHit,
    slash: live.slash,
    spark: live.spark,
    hitStop: live.hitStop,
    knock: live.foeKnock?.["meadow-e0"] ?? null,
    hp: live.foeHp?.["meadow-e0"] ?? null,
    hint: live.hint,
  };
});
console.log("swing", JSON.stringify(swing));

if (logs.length) console.log("LOGS", logs.join(" | "));
await browser.close();
