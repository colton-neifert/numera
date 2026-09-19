// Visual QA for the key-art look. Usage: node scripts/look-shot.mjs <outDir> [tag]
import { chromium } from "playwright";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const out = process.argv[2] || "screenshots";
const tag = process.argv[3] || "look";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || (existsSync("/opt/pw-browsers/chromium-1194/chrome-linux/chrome") ? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" : undefined),
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const logs = [];
page.on("pageerror", (e) => logs.push("PAGE " + e.message));
page.on("console", (m) => {
  if (m.type() === "error") logs.push("CONSOLE " + m.text());
});
const shot = async (name) => {
  const dataUrl = await page.evaluate(() => window.__shot());
  writeFileSync(`${out}/${tag}-${name}.jpg`, Buffer.from(dataUrl.split(",")[1], "base64"));
  const fps = await page.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const tick = () => { n++; if (performance.now() - t0 > 1500) res((n / (performance.now() - t0)) * 1000); else requestAnimationFrame(tick); }; requestAnimationFrame(tick); }));
  console.log(name, dataUrl.length, "fps", fps.toFixed(1));
};
await page.goto("http://127.0.0.1:8080/" + (process.env.GFX ? `?gfx=${process.env.GFX}` : ""), { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(1500);
const skip = page.getByRole("button", { name: /skip/i }).first();
if (await skip.count()) await skip.click({ force: true });
await page.waitForFunction(() => Boolean(window.__gameTest), null, { timeout: 30000 });
await page.evaluate(() => window.__gameTest.boot());
await page.waitForFunction(
  () => {
    const t = window.__gameTest?.get?.();
    return t?.screen === "overworld" && window.__gameTest?.live?.() && document.querySelector("canvas");
  },
  null,
  { timeout: 60000 },
);
await page.waitForTimeout(4000);
if (!process.env.HUD) await page.addStyleTag({ content: `body *:not(canvas):not(:has(canvas)) { opacity: 0 !important; }` });

// cam offsets are relative to where the hero actually ends up (dx, dy, dz) and look target (lx, ly, lz).
const cams = {
  play: { x: 3, z: -92, yaw: Math.PI, day: 0.479, cam: null },
  keyart: { x: 22, z: 30, yaw: 0, day: 0.479, cam: { x: 1.7, y: 0.7, z: -6.4, lx: -1.2, ly: 2.2, lz: 30 } },
  hero: { x: 22, z: 30, yaw: 0.35, day: 0.479, cam: { x: 0.5, y: 1.25, z: -2.3, lx: 0, ly: 1.15, lz: 0 } },
  duo: { x: 22, z: 30, yaw: 0.25, day: 0.479, cam: { x: 1.0, y: 1.0, z: -3.6, lx: -0.4, ly: 1.2, lz: 4 } },
  vista: { x: -6, z: -20, yaw: Math.PI, day: 0.479, cam: { x: -18, y: 22, z: -40, lx: 6, ly: 6, lz: 116 } },
  map: { x: 0, z: -10, yaw: Math.PI, day: 0.479, cam: { x: 0, y: 330, z: -50, lx: 0, ly: 0, lz: 0 } },
  grove: { x: -30, z: 4, yaw: Math.PI, day: 0.479, cam: { x: -4, y: 1.6, z: -8, lx: 10, ly: 3.4, lz: 26 } },
  river: { x: 78, z: -40, yaw: Math.PI, day: 0.479, cam: { x: -3, y: 2.6, z: -8, lx: 10, ly: 0.5, lz: 30 } },
  pond: { x: -36, z: -118, yaw: Math.PI, day: 0.479, cam: { x: 4, y: 3.2, z: 6, lx: -18, ly: -0.5, lz: -12 } },
  dusk: { x: 3, z: -60, yaw: Math.PI, day: 0.72, cam: null },
  night: { x: 3, z: -60, yaw: Math.PI, day: 0.92, cam: null },
};
const only = process.argv[4] ? process.argv[4].split(",") : Object.keys(cams);
for (const name of only) {
  const c = cams[name];
  await page.evaluate((c) => {
    const live = window.__gameTest.live();
    Object.assign(live, { x: c.x, z: c.z, yaw: c.yaw, speed: 0, day: c.day, lock: null, hint: "", house: null });
    live.warpTo = { x: c.x, z: c.z };
    live.shotCam = null;
  }, c);
  await page.waitForTimeout(1200);
  if (c.cam) {
    await page.evaluate((c) => {
      const live = window.__gameTest.live();
      const k = c.cam;
      const gh = window.__groundAt?.(live.x + k.x, live.z + k.z) ?? live.y;
      live.shotCam = { x: live.x + k.x, y: Math.max(live.y + k.y, gh + 0.55), z: live.z + k.z, lx: live.x + k.lx, ly: live.y + k.ly, lz: live.z + k.lz };
      console.log("hero at", live.x.toFixed(1), live.y.toFixed(1), live.z.toFixed(1));
    }, c);
  }
  // Count real frames, not seconds: software GL can take seconds per frame.
  await page.evaluate((n) => new Promise((res) => { let k = 0; const t = () => (++k >= n ? res(0) : requestAnimationFrame(t)); requestAnimationFrame(t); }), Number(process.env.FRAMES || 6));
  await shot(name);
}
console.log("logs", JSON.stringify(logs.slice(0, 8)));
await browser.close();
