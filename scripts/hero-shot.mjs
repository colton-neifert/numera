import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
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
await page.waitForTimeout(800);
const skip = page.getByRole("button", { name: /skip/i }).first();
if (await skip.count()) await skip.click({ force: true });
await page.waitForFunction(() => Boolean(window.__gameTest), null, { timeout: 12000 });
await page.evaluate(() => window.__gameTest.boot());
await page.waitForFunction(() => {
  const t = window.__gameTest?.get?.();
  const live = window.__gameTest?.live?.();
  return t?.screen === "overworld" && live && document.querySelector("canvas");
}, null, { timeout: 25000 });
await page.waitForTimeout(1500);
console.log("boot-logs", JSON.stringify(logs.slice(0, 10)));

const BOY = {
  heroGender: "boy",
  heroLook: {
    hair: "#5c3a22",
    skin: "#e8b898",
    eyes: "#3a2418",
    eyeShape: "wide",
    lashes: "none",
    mouth: "smile",
    nose: "round",
    brows: "neutral",
    blush: "#c45c58",
    blushAmt: 0.55,
    tunic: "#3d8a42",
    pants: "#efe4cc",
    boots: "#5a3a22",
    cap: "",
  },
};
const GIRL = {
  heroGender: "girl",
  heroLook: {
    hair: "#5c3a22",
    skin: "#e8b898",
    eyes: "#3a2418",
    eyeShape: "wide",
    lashes: "long",
    mouth: "smile",
    nose: "round",
    brows: "neutral",
    blush: "#c45c58",
    blushAmt: 0.62,
    tunic: "#2f6a6a",
    pants: "#3a4a58",
    boots: "#5a3a22",
    cap: "",
  },
};

const VIEWS = [
  { id: "front", yaw: 0, pitch: 0.1, dist: 4.4 },
  { id: "side", yaw: Math.PI / 2, pitch: 0.08, dist: 4.4 },
  { id: "back", yaw: Math.PI, pitch: 0.1, dist: 4.4 },
];

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.charView = true;
  live.viewerAnim = "idle";
  live.viewerWire = false;
  live.viewerYaw = 0;
  live.viewerPitch = 0.1;
  live.viewerDist = 4.4;
});
await page.waitForTimeout(600);

for (const who of [
  { name: "boy", look: BOY },
  { name: "girl", look: GIRL },
]) {
  await page.evaluate((look) => {
    window.__gameTest.set(look);
    const live = window.__gameTest.live();
    live.hasSword = true;
    live.hasShield = true;
    live.holding = look.heroGender === "girl" ? "boom" : "sword";
    live.viewerAnim = "idle";
  }, who.look);
  await page.waitForTimeout(400);
  for (const v of VIEWS) {
    await page.evaluate((cam) => {
      const live = window.__gameTest.live();
      live.viewerYaw = cam.yaw;
      live.viewerPitch = cam.pitch;
      live.viewerDist = cam.dist;
    }, v);
    await page.waitForTimeout(350);
    console.log(`${who.name}-${v.id}`, await shotCanvas(`/workspace/screenshots/hero-${who.name}-${v.id}.png`));
  }
}

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.viewerWire = true;
  live.viewerYaw = 0.55;
  live.viewerPitch = 0.18;
  live.viewerDist = 5.2;
  live.viewerAnim = "idle";
});
await page.waitForTimeout(400);
console.log("wire", await shotCanvas("/workspace/screenshots/hero-wireframe.png"));

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.charView = false;
  live.viewerWire = false;
  live.viewerAnim = "idle";
});
await page.waitForTimeout(400);

await page.evaluate((look) => {
  window.__gameTest.set(look);
  const live = window.__gameTest.live();
  live.charView = false;
  live.house = null;
  live.day = 0.38;
  live.x = -12;
  live.z = -168;
  live.yaw = 0.4;
  live.warpTo = { x: -12, z: -168 };
  live.hasSword = true;
  live.hasShield = true;
  live.holding = "sword";
  live.shotCam = { x: -4, y: 2.4, z: -158, lx: -16, ly: 1.4, lz: -176 };
}, BOY);
await page.waitForTimeout(1800);
console.log("village-boy", await shotCanvas("/workspace/screenshots/hero-village-boy.png"));

await page.evaluate((look) => {
  window.__gameTest.set(look);
  const live = window.__gameTest.live();
  live.holding = "boom";
  live.yaw = -0.3;
}, GIRL);
await page.waitForTimeout(800);
console.log("village-girl", await shotCanvas("/workspace/screenshots/hero-village-girl.png"));

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.shotCam = { x: 8, y: 9.6, z: -150, lx: -24, ly: 2.8, lz: -244 };
  live.day = 0.38;
});
await page.waitForTimeout(1500);
console.log("village-ref", await shotCanvas("/workspace/screenshots/village-ref.png"));

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.shotCam = { x: -8, y: 2.2, z: -160, lx: -14, ly: 1.3, lz: -174 };
  live.speed = 3.4;
  live.viewerAnim = "walk";
});
await page.waitForTimeout(700);
console.log("walk", await shotCanvas("/workspace/screenshots/hero-walk.png"));

console.log("logs", JSON.stringify(logs.slice(0, 12)));
await browser.close();
