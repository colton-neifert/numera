import { chromium } from "playwright";

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on("pageerror", (e) => console.log("PAGE", e.message.slice(0, 180)));

await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForFunction(() => Boolean(window.__gameTest), null, { timeout: 20000 });
await page.evaluate(() => window.__gameTest.boot());
await page.waitForFunction(() => {
  const t = window.__gameTest?.get?.();
  return t?.screen === "overworld" && document.querySelector("canvas");
}, null, { timeout: 30000 });
await page.waitForFunction(() => Boolean(window.__controlsTest), null, { timeout: 20000 });
await page.waitForTimeout(1800);
await page.addStyleTag({
  content: `.panel, .hud, [data-hud], header, nav { opacity: 0 !important; pointer-events: none !important; }
            button, .touch, .joy { opacity: 0 !important; }`,
});

const cams = [
  { name: "paint", x: 6, y: 10.2, z: -126, lx: -26, ly: 2.8, lz: -104 },
];

for (const cam of cams) {
  await page.evaluate((c) => {
    const live = window.__gameTest.live();
    live.day = 0.54;
    live.dusk = 0;
    live.night = false;
    live.house = null;
    live.hint = "";
    window.__controlsTest.setShot(c);
  }, cam);
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `/workspace/screenshots/village-paint-${cam.name}.png` });
  console.log("saved", cam.name);
}

await browser.close();
