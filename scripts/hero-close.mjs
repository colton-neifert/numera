import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("pageerror", (e) => console.log("PAGE", e.message));

const canvasShot = async (path) => {
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
await page.waitForTimeout(700);
const skip = page.getByRole("button", { name: /skip/i }).first();
if (await skip.count()) await skip.click({ force: true });
await page.waitForFunction(() => Boolean(window.__gameTest), null, { timeout: 12000 });
await page.evaluate(() => window.__gameTest.boot());
await page.waitForFunction(() => window.__gameTest?.get?.()?.screen === "overworld" && document.querySelector("canvas"), null, { timeout: 25000 });
await page.waitForTimeout(1200);

await page.addStyleTag({
  content: `
    .dialog-box, .panel, [data-hud], button, .absolute.z-\\[80\\], .absolute.z-\\[90\\] { }
  `,
});
await page.evaluate(() => {
  for (const el of document.querySelectorAll("body > div, #root div")) {
    const s = getComputedStyle(el);
    if (s.position === "absolute" || s.position === "fixed") {
      if (!el.querySelector("canvas") && el.innerText && !el.querySelector("canvas")) {
        /* keep */
      }
    }
  }
  document.querySelectorAll("button, p, span, img").forEach((n) => {
    const el = n;
    if (el.closest("canvas")) return;
    if (el.tagName === "CANVAS") return;
  });
});

const BOY = {
  heroGender: "boy",
  heroLook: {
    hair: "#5c3a22", skin: "#e8b898", eyes: "#3a2418", eyeShape: "wide", lashes: "none",
    mouth: "smile", nose: "round", brows: "neutral", blush: "#c45c58", blushAmt: 0.55,
    tunic: "#3d8a42", pants: "#efe4cc", boots: "#5a3a22", cap: "",
  },
};
const GIRL = {
  heroGender: "girl",
  heroLook: {
    hair: "#5c3a22", skin: "#e8b898", eyes: "#3a2418", eyeShape: "wide", lashes: "long",
    mouth: "smile", nose: "round", brows: "neutral", blush: "#c45c58", blushAmt: 0.62,
    tunic: "#2f6a6a", pants: "#3a4a58", boots: "#5a3a22", cap: "",
  },
};

const orbit = (yaw) => {
  const x = -10, z = -160;
  const d = 3.9;
  return {
    x: x + Math.sin(yaw) * d,
    y: 9.2,
    z: z - Math.cos(yaw) * d,
    lx: x,
    ly: 8.4,
    lz: z,
  };
};

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.house = null;
  live.hint = "";
  live.lock = null;
  live.day = 0.38;
  live.x = -10;
  live.z = -160;
  live.yaw = 0;
  live.warpTo = { x: -10, z: -160 };
  live.hasSword = true;
  live.hasShield = true;
  live.holding = "sword";
});
await page.waitForTimeout(900);

const y = await page.evaluate(() => window.__gameTest.live().y);
console.log("player-y", y);

const views = [
  ["front", 0],
  ["side", Math.PI / 2],
  ["back", Math.PI],
];

for (const who of [
  { name: "boy", look: BOY, hold: "sword" },
  { name: "girl", look: GIRL, hold: "boom" },
]) {
  await page.evaluate(({ look, hold }) => {
    window.__gameTest.set(look);
    const live = window.__gameTest.live();
    live.holding = hold;
    live.hasSword = true;
    live.hasShield = true;
    live.x = -10;
    live.z = -160;
    live.yaw = 0;
  }, who);
  await page.waitForTimeout(350);
  for (const [id, yaw] of views) {
    await page.evaluate(({ cam, py }) => {
      const live = window.__gameTest.live();
      live.shotCam = { ...cam, y: py + 1.35, ly: py + 1.05 };
    }, { cam: orbit(yaw), py: y });
    await page.waitForTimeout(280);
    console.log(`${who.name}-${id}`, await canvasShot(`/workspace/screenshots/hero-${who.name}-${id}.png`));
  }
}

await page.evaluate(({ py }) => {
  const live = window.__gameTest.live();
  live.shotCam = {
    x: -6.2,
    y: py + 1.4,
    z: -156.5,
    lx: -11.5,
    ly: py + 1.05,
    lz: -163,
  };
}, { py: y });
await page.waitForTimeout(400);
console.log("tree-bush", await canvasShot("/workspace/screenshots/hero-tree-bush.png"));

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.shotCam = { x: 8, y: 9.6, z: -150, lx: -24, ly: 2.8, lz: -244 };
});
await page.waitForTimeout(900);
console.log("village-ref", await canvasShot("/workspace/screenshots/village-ref.png"));

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.charView = true;
  live.viewerYaw = 0.35;
  live.viewerPitch = 0.12;
  live.viewerDist = 4.8;
  live.viewerAnim = "idle";
  live.viewerWire = true;
});
await page.waitForTimeout(700);
await page.screenshot({ path: "/workspace/screenshots/hero-viewer.png" });
console.log("viewer-page", "ok");

await page.evaluate(() => {
  window.__gameTest.live().charView = false;
});
await browser.close();
