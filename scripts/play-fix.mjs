import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.setDefaultTimeout(15000);
const logs = [];
page.on("pageerror", (e) => logs.push("PAGE " + e.message));
page.on("console", (m) => {
  if (m.type() === "error") logs.push("CONSOLE " + m.text());
});

const shotCanvas = async (path) => {
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
const skip = page.getByRole("button", { name: /skip/i }).first();
if (await skip.count()) await skip.click({ force: true }).catch(() => {});
await page.waitForFunction(() => Boolean(window.__gameTest), null, { timeout: 12000 });
await page.evaluate(() => window.__gameTest.boot());
await page.waitForFunction(() => window.__gameTest?.get?.()?.screen === "overworld" && Boolean(window.__controlsTest), null, { timeout: 25000 });
await page.waitForTimeout(700);

const spawn = await page.evaluate(() => {
  const c = window.__controlsTest;
  const live = window.__gameTest.live();
  live.paused = false;
  live.talking = false;
  live.sit = false;
  live.charView = false;
  live.hasSword = true;
  live.holding = "sword";
  window.__gameTest.set({ hasSword: true, holding: "sword" });
  return { x: c.getX(), z: c.getZ(), y: Number(c.getY().toFixed(2)), grounded: c.getGrounded(), yaw: c.getYaw() };
});
console.log("SPAWN", JSON.stringify(spawn));

const heights = await page.evaluate(() => {
  const h = window.__controlsTest.getHeight;
  const pts = [
    ["spawn", 14, -58],
    ["hill", 8, -48],
    ["keep", 0, -26],
    ["keepFoot", 0, -48],
    ["village", 2, -210],
    ["pond", -35, -230],
  ];
  return pts.map(([n, x, z]) => ({ n, x, z, y: Number(h(x, z).toFixed(2)) }));
});
console.log("HEIGHTS", JSON.stringify(heights));

await page.evaluate(() => {
  window.__controlsTest.setKeys(["KeyW"]);
});
await page.waitForTimeout(400);
await page.evaluate(() => window.__controlsTest.setKeys([]));
const walk = await page.evaluate(() => {
  const c = window.__controlsTest;
  return { x: Number(c.getX().toFixed(2)), z: Number(c.getZ().toFixed(2)), y: Number(c.getY().toFixed(2)), g: c.getGrounded(), speed: Number(c.getSpeed().toFixed(2)) };
});
console.log("WALK", JSON.stringify(walk));

const keep = heights.find((s) => s.n === "keep");
const spawnH = heights.find((s) => s.n === "spawn");
const village = heights.find((s) => s.n === "village");
const walked = Math.hypot(walk.x - spawn.x, walk.z - spawn.z) > 0.2 || walk.speed > 0.3;
const keepHigh = keep && spawnH && keep.y > spawnH.y + 8;
const grounded = spawn.grounded && walk.g;
console.log("SUMMARY", JSON.stringify({ grounded, walked, keepHigh, keep, spawnH, village, walk, logs: logs.slice(0, 8) }));
if (grounded && keepHigh) console.log("PASS");
else console.log("FAIL");

await page.screenshot({ path: "/workspace/screenshots/qa-walk.png", timeout: 4000 }).catch((e) => console.log("shot", e.message));
await browser.close();
