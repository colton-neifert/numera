#!/usr/bin/env node
import { chromium } from "playwright";

const url = "http://127.0.0.1:8080/";
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader-webgl", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});

await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForFunction(() => typeof window.__gameTest?.boot === "function", { timeout: 20000 });
await page.evaluate(() => window.__gameTest.boot());
await page.waitForFunction(() => window.__gameTest?.get?.()?.screen === "overworld", { timeout: 15000 });
await page.waitForSelector("canvas", { timeout: 15000 });
await page.waitForTimeout(2500);

async function sample(label) {
  const stats = await page.evaluate(async () => {
    const live = window.__gameTest?.live?.();
    const g = window.__gameTest?.get?.();
    const t0 = performance.now();
    let n = 0;
    await new Promise((res) => {
      const tick = () => {
        n += 1;
        if (performance.now() - t0 > 2000) res(null);
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    const dt = performance.now() - t0;
    const three = window.__three;
    const info = three?.gl?.info?.render;
    const gpu = (() => {
      try {
        const gl = three?.gl?.getContext?.();
        const ext = gl?.getExtension?.("WEBGL_debug_renderer_info");
        return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl?.getParameter?.(gl.RENDERER);
      } catch {
        return null;
      }
    })();
    return {
      fps: Math.round((n / (dt / 1000)) * 10) / 10,
      frames: n,
      gfx: window.__gfx ?? live?.quality,
      gpu,
      screen: g?.screen,
      house: live?.house ?? null,
      x: Math.round((live?.x ?? 0) * 10) / 10,
      y: Math.round((live?.y ?? 0) * 10) / 10,
      z: Math.round((live?.z ?? 0) * 10) / 10,
      calls: info?.calls ?? null,
      triangles: info?.triangles ?? null,
    };
  });
  console.log(label, JSON.stringify(stats));
  return stats;
}

const inside = await sample("INSIDE");

await page.evaluate(() => {
  const live = window.__gameTest.live();
  live.house = null;
  live.houseY = 0;
  live.x = 8;
  live.z = -28;
  live.y = 1;
  live.yaw = 0.4;
  live.camLook = 0;
});
await page.waitForTimeout(2000);
const outside = await sample("OUTSIDE");

let shot = "skip";
try {
  await page.screenshot({ path: "/workspace/screenshots/glitch-meadow.png", timeout: 20000, type: "png" });
  shot = "ok";
} catch (e) {
  shot = String(e.message || e).slice(0, 180);
}
console.log("SHOT", shot);
console.log("ERRORS", errors.slice(0, 12));
await browser.close();

const ok = inside.screen === "overworld" && inside.fps >= 20 && outside.fps >= 18 && errors.length === 0 && shot === "ok";
process.exit(ok ? 0 : 2);
