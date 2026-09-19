import { chromium } from "playwright";

console.log("launch");
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.setDefaultTimeout(15000);
const logs = [];
page.on("pageerror", (e) => logs.push("PAGE " + e.message));

console.log("goto");
await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
const skip = page.getByRole("button", { name: /skip/i }).first();
if (await skip.count()) await skip.click({ force: true }).catch(() => {});
await page.waitForFunction(() => Boolean(window.__gameTest), null, { timeout: 15000 });
console.log("boot");
await page.evaluate(() => window.__gameTest.boot());
await page.waitForFunction(() => window.__gameTest?.get?.()?.screen === "overworld", null, { timeout: 25000 });
await page.waitForFunction(() => Boolean(window.__controlsTest), null, { timeout: 25000 });
console.log("overworld");

const spots = [
  ["echo", 380, 48],
  ["crater", 640, -260],
  ["marsh", 252, -462],
  ["snow", -70, 680],
  ["desert", 710, -450],
  ["camp", -620, 170],
];

const placed = await page.evaluate((spots) => {
  const live = window.__gameTest.live();
  live.paused = false;
  live.talking = false;
  live.sit = false;
  const out = [];
  for (const [name, x, z] of spots) {
    live.x = x;
    live.z = z;
    out.push({ name, x: live.x, z: live.z });
  }
  live.warpTo = { x: 0, z: 1200 };
  live.x = 0;
  live.z = 1200;
  return out;
}, spots);
console.log("placed", JSON.stringify(placed));

await page.waitForTimeout(500);
const edge = await page.evaluate(() => {
  const x = window.__controlsTest.getX();
  const z = window.__controlsTest.getZ();
  return { x: Number(x.toFixed(1)), z: Number(z.toFixed(1)), r: Number(Math.hypot(x, z + 80).toFixed(1)) };
});
console.log("edgeClamp", JSON.stringify(edge));

const placeOk = placed.every((p) => Math.hypot(p.x - spots.find((s) => s[0] === p.name)[1], p.z - spots.find((s) => s[0] === p.name)[2]) < 1);
const edgeOk = edge.r > 900 && edge.r < 1100;
const allOk = placeOk && edgeOk;
console.log(JSON.stringify({ placeOk, edge, edgeOk, logs: logs.slice(0, 8), allOk }));
if (allOk) console.log("PASS");
else console.log("FAIL");
await browser.close();
if (!allOk) process.exit(1);
