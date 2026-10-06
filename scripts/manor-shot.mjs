import { chromium } from "playwright";
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("pageerror", (e) => console.log("PAGE", e.message));
await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(600);
await page.mouse.click(640, 400);
await page.waitForTimeout(300);
await page.evaluate(() => window.__gameTest?.boot());
await page.waitForTimeout(1800);
await page.evaluate(() => {
  const t = window.__gameTest;
  t.set({ quests: { manorKey: 1, manorOpen: 1, manorLatch: 1 } });
  const live = t.live();
  live.warpTo = null;
  live.doorUse = { id: "manor", t: 1.1, dir: "in", opened: true };
});
await page.waitForTimeout(400);
await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.house = "manor";
  live.x = -48;
  live.z = -123.2;
  live.doorUse = null;
  window.__controlsTest?.setShot?.({
    x: -48.1, y: 5.1, z: -120.4,
    lx: -48.2, ly: 2.4, lz: -124.6,
  });
});
await page.waitForTimeout(700);
try { await page.screenshot({ path: "/workspace/screenshots/manor-inside.png", timeout: 4000 }); } catch (e) { console.log("inside shot", e.message); }
await page.evaluate(() => {
  window.__controlsTest?.setShot?.({
    x: -46.3, y: 4.5, z: -122.2,
    lx: -46.5, ly: 3.1, lz: -124.6,
  });
});
await page.waitForTimeout(400);
try { await page.screenshot({ path: "/workspace/screenshots/manor-clock.png", timeout: 4000 }); } catch (e) { console.log("clock shot", e.message); }
await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.x = -51.6;
  live.z = -124.1;
  window.__controlsTest?.setShot?.({
    x: -50.0, y: 4.0, z: -122.6,
    lx: -51.7, ly: 1.6, lz: -124.3,
  });
});
await page.waitForTimeout(400);
try { await page.screenshot({ path: "/workspace/screenshots/manor-desk.png", timeout: 4000 }); } catch (e) { console.log("desk shot", e.message); }
await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.x = -46.8;
  live.z = -127.2;
  window.__controlsTest?.setShot?.({
    x: -46.2, y: 6.4, z: -124.8,
    lx: -47.6, ly: 4.6, lz: -127.3,
  });
});
await page.waitForTimeout(400);
try { await page.screenshot({ path: "/workspace/screenshots/manor-loft.png", timeout: 4000 }); } catch (e) { console.log("loft shot", e.message); }
const s = await page.evaluate(() => {
  const live = window.__gameTest.live();
  return { house: live.house, x: live.x, z: live.z };
});
console.log("done", JSON.stringify(s));
await browser.close();
