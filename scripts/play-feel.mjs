import { chromium } from "playwright";

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const logs = [];
page.on("pageerror", (e) => logs.push("PAGE " + e.message));
page.on("console", (m) => {
  if (m.type() === "error") logs.push("CONSOLE " + m.text());
});

await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(600);
const skip = page.getByRole("button", { name: /skip/i }).first();
if (await skip.count()) await skip.click({ force: true });
await page.waitForFunction(() => Boolean(window.__gameTest), null, { timeout: 15000 });
await page.evaluate(() => window.__gameTest.boot());
await page.waitForFunction(() => {
  const t = window.__gameTest?.get?.();
  const live = window.__gameTest?.live?.();
  return t?.screen === "overworld" && live && document.querySelector("canvas");
}, null, { timeout: 25000 });
await page.waitForTimeout(800);

const snap = async (label, fn) => {
  const info = await page.evaluate(fn);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `/workspace/screenshots/${label}.png` });
  const after = await page.evaluate(() => {
    const live = window.__gameTest.live();
    return {
      x: +live.x.toFixed(2),
      z: +live.z.toFixed(2),
      y: +live.y.toFixed(2),
      stillT: +live.stillT.toFixed(2),
      dusk: +live.dusk.toFixed(2),
      mood: live.nimMood,
      nimYaw: +live.nimYaw.toFixed(2),
      ripples: live.ripples?.length ?? 0,
      house: live.house,
      listen: live.listen || "",
    };
  });
  console.log(label, JSON.stringify({ info, after }));
};

await snap("feel-home", () => {
  const live = window.__gameTest.live();
  window.__gameTest.set({ quests: { nim: 1, lefthome: 1 }, hasSword: true });
  live.nimFollow = true;
  live.house = null;
  live.warpTo = { x: -24, z: -148 };
  live.yaw = 0;
  return { warped: "ladder" };
});

await snap("feel-creek", () => {
  const live = window.__gameTest.live();
  live.house = null;
  live.warpTo = { x: -14, z: -128 };
  live.yaw = 0;
  live.speed = 0;
  return { warped: "path-creek" };
});

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.speed = 0;
  live.stillT = 2.4;
});
await page.waitForTimeout(700);
const creekLook = await page.evaluate(() => {
  const live = window.__gameTest.live();
  return { mood: live.nimMood, yaw: +live.nimYaw.toFixed(2), stillT: +live.stillT.toFixed(2), x: +live.x.toFixed(1), z: +live.z.toFixed(1) };
});
console.log("creek-still", JSON.stringify(creekLook));
await page.screenshot({ path: "/workspace/screenshots/feel-creek-still.png" });

await snap("feel-pond", () => {
  const live = window.__gameTest.live();
  live.house = null;
  live.warpTo = { x: -54, z: -128 };
  live.yaw = 1.2;
  return { warped: "pond" };
});

await snap("feel-lookout", () => {
  const live = window.__gameTest.live();
  live.house = null;
  live.warpTo = { x: -32, z: -44 };
  live.yaw = 0;
  live.stillT = 1.2;
  return { warped: "lookout" };
});

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.stillT = 2;
  live.speed = 0;
});
await page.waitForTimeout(1200);
await page.screenshot({ path: "/workspace/screenshots/feel-lookout-whoa.png" });
const look = await page.evaluate(() => {
  const live = window.__gameTest.live();
  return { peekT: live.peekT, shot: Boolean(live.shotCam), listen: live.listen || "", stillT: +live.stillT.toFixed(2) };
});
console.log("lookout-whoa", JSON.stringify(look));

console.log("errors", JSON.stringify(logs.slice(0, 12)));
await browser.close();
