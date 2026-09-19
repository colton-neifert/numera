import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const logs = [];
page.on("pageerror", (e) => logs.push("PAGE " + e.message));
page.on("console", (m) => {
  if (m.type() === "error") logs.push("CONSOLE " + m.text().slice(0, 180));
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

const LOOK = {
  heroGender: "boy",
  heroLook: {
    hair: "#6a4224",
    skin: "#f2c8a8",
    eyes: "#6a3a18",
    eyeShape: "wide",
    lashes: "none",
    mouth: "cat",
    nose: "round",
    brows: "neutral",
    blush: "#e8a090",
    blushAmt: 0.34,
    tunic: "#348c3c",
    pants: "#efe6d4",
    boots: "#6a4228",
    cap: "",
    hairStyle: "fluffy",
  },
};

await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(800);
const skip = page.getByRole("button", { name: /skip/i }).first();
if (await skip.count()) await skip.click({ force: true });
await page.waitForFunction(() => Boolean(window.__gameTest), null, { timeout: 15000 });
await page.evaluate(() => window.__gameTest.boot());
await page.waitForFunction(() => {
  const t = window.__gameTest?.get?.();
  return t?.screen === "overworld" && document.querySelector("canvas");
}, null, { timeout: 25000 });
await page.waitForTimeout(800);
console.log("boot", JSON.stringify(logs.slice(0, 8)));

await page.evaluate((look) => {
  window.__gameTest.set(look);
  const live = window.__gameTest.live();
  live.charView = true;
  live.viewerAnim = "idle";
  live.viewerWire = false;
  live.viewerYaw = 0;
  live.viewerPitch = 0.06;
  live.viewerDist = 2.35;
  live.hasSword = true;
  live.hasShield = true;
  live.holding = "sword";
}, LOOK);
await page.waitForTimeout(900);
await page.evaluate(() => {
  const click = (re) => {
    const b = [...document.querySelectorAll("button")].find((el) => re.test(el.textContent || ""));
    b?.click();
  };
  click(/spin 360/i);
  click(/^Front$/);
});
await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.viewerYaw = 0;
  live.viewerPitch = 0.06;
  live.viewerDist = 2.35;
});
await page.waitForTimeout(500);
console.log("face-cat", await shotCanvas("/workspace/screenshots/hero-face-cat.png"));

await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((el) => el.textContent === "Bolt");
  b?.click();
});
await page.waitForTimeout(400);
console.log("face-bolt", await shotCanvas("/workspace/screenshots/hero-face-bolt.png"));

await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((el) => /Pikachu/i.test(el.textContent || ""));
  b?.click();
});
await page.waitForTimeout(300);

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.charView = false;
  live.house = null;
  live.day = 0.42;
  live.x = 3;
  live.z = -92;
  live.yaw = 0;
  live.warpTo = { x: 3, z: -92 };
  live.shotCam = { x: 3.2, y: 3.6, z: -96.2, lx: 3, ly: 1.35, lz: -92 };
});
await page.waitForTimeout(1400);
console.log("overworld-face", await shotCanvas("/workspace/screenshots/hero-face-overworld.png"));
console.log("errors", JSON.stringify(logs.slice(0, 12)));
await browser.close();
