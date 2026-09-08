import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("pageerror", (e) => console.log("PAGE", e.message));

const shot = async (path) => {
  const dataUrl = await page.evaluate(() => {
    const c = document.querySelector("canvas");
    return c ? c.toDataURL("image/png") : "";
  });
  if (dataUrl && dataUrl.length > 80) {
    writeFileSync(path, Buffer.from(dataUrl.split(",")[1], "base64"));
    return dataUrl.length;
  }
  return 0;
};

await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(800);
const skip = page.getByRole("button", { name: /skip/i }).first();
if (await skip.count()) await skip.click({ force: true });
await page.waitForFunction(() => Boolean(window.__gameTest), null, { timeout: 12000 });
await page.evaluate(() => window.__gameTest.boot());
await page.waitForFunction(() => {
  const t = window.__gameTest?.get?.();
  return t?.screen === "overworld" && document.querySelector("canvas");
}, null, { timeout: 25000 });
await page.waitForTimeout(2000);
await page.addStyleTag({ content: `.panel { opacity: 0 !important; }` });

const cams = [
  { name: "a", x: 24, y: 11.2, z: -148, lx: -16, ly: 3.4, lz: -248 },
  { name: "b", x: 30, y: 10.8, z: -160, lx: -18, ly: 3.0, lz: -250 },
  { name: "c", x: 18, y: 10.4, z: -156, lx: -20, ly: 3.2, lz: -246 },
  { name: "d", x: 8, y: 9.6, z: -150, lx: -24, ly: 2.8, lz: -244 },
];

for (const cam of cams) {
  await page.evaluate((c) => {
    const live = window.__gameTest.live();
    live.x = 8;
    live.z = -170;
    live.yaw = Math.PI;
    live.day = 0.38;
    live.house = null;
    live.hint = "";
    live.warpTo = { x: 8, z: -170 };
    live.shotCam = { x: c.x, y: c.y, z: c.z, lx: c.lx, ly: c.ly, lz: c.lz };
  }, cam);
  await page.waitForTimeout(1600);
  console.log(cam.name, await shot(`/workspace/screenshots/village-ref-${cam.name}.png`));
}

await browser.close();
