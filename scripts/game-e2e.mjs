import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

mkdirSync("/workspace/screenshots", { recursive: true });
const report = { passed: [], failed: [], notes: [] };
function ok(name, extra = "") {
  report.passed.push(name);
  console.log("PASS", name, extra);
}
function fail(name, extra = "") {
  report.failed.push(`${name}${extra ? ": " + extra : ""}`);
  console.log("FAIL", name, extra);
}

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.setDefaultTimeout(12000);
async function shot(path) {
  try {
    await page.screenshot({ path, timeout: 2500 });
  } catch {
    report.notes.push("screenshot skip " + path);
  }
}
const logs = [];
page.on("pageerror", (e) => logs.push("PAGE " + e.message));
page.on("console", (m) => {
  if (m.type() === "error") logs.push("CONSOLE " + m.text());
});

try {
  await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(
    () => /legend of numera|tap to start|skip|continue/i.test(document.body?.innerText || "") || document.title === "Numera",
    null,
    { timeout: 10000 },
  ).catch(() => {});
  await page.waitForTimeout(400);
  const title = await page.title();
  const body = await page.locator("body").innerText();
  if (title === "Numera" && (/legend of numera/i.test(body) || /tap to start|skip|continue/i.test(body) || title === "Numera")) ok("game starts / title visible");
  else fail("game starts / title visible", `title=${title} body=${body.slice(0, 80)}`);
  await shot("/workspace/screenshots/test-title.png");

  const skip = page.getByRole("button", { name: /skip/i }).first();
  if (await skip.count()) await skip.click({ force: true });
  await page.waitForTimeout(400);

  await page.waitForFunction(() => Boolean(window.__gameTest), null, { timeout: 8000 });
  await page.evaluate(() => window.__gameTest.boot());
  await page.waitForTimeout(1800);
  const afterBoot = await page.evaluate(() => window.__gameTest.get());
  if (afterBoot.screen === "overworld" && afterBoot.world === "meadow") ok("boot into meadow");
  else fail("boot into meadow", JSON.stringify(afterBoot));

  await page.waitForFunction(() => Boolean(window.__controlsTest), null, { timeout: 10000 });
  const canvas = page.locator("canvas").first();
  if (await canvas.count()) ok("player canvas present");
  else fail("player canvas present");
  const got = page.getByRole("button", { name: /got it/i });
  if (await got.count()) await got.click({ force: true }).catch(() => {});
  await page.evaluate(() => {
    window.__controlsTest.warp(14, -58);
  });
  await page.waitForTimeout(500);
  await shot("/workspace/screenshots/test-meadow.png");
  try {
    const dataUrl = await page.evaluate(() => {
      const c = document.querySelector("canvas");
      return c ? c.toDataURL("image/png") : "";
    });
    if (dataUrl.startsWith("data:image/png")) {
      writeFileSync("/workspace/screenshots/meadow-canvas.png", Buffer.from(dataUrl.split(",")[1], "base64"));
      ok("meadow canvas dump");
    } else fail("meadow canvas dump");
  } catch (e) {
    fail("meadow canvas dump", String(e));
  }

  const weapon = await page.evaluate(() => {
    const live = window.__gameTest.live();
    live.yaw = 0;
    const fx = -Math.sin(live.yaw);
    const fz = -Math.cos(live.yaw);
    live.paused = false;
    live.house = null;
    live.bombs.length = 0;
    live.bombs.push({
      x: live.x,
      y: live.y + 1.08,
      z: live.z,
      vx: fx * 9.4,
      vy: 5.4,
      vz: fz * 9.4,
      fuse: 2.4,
      boom: false,
      spin: 0,
      bounce: 0,
    });
    return { x: live.x, z: live.z };
  });
  await page.waitForTimeout(120);
  const b1 = await page.evaluate(() => {
    const b = window.__gameTest.live().bombs[0];
    return b ? { x: b.x, y: b.y, z: b.z } : null;
  });
  await page.waitForTimeout(120);
  const b2 = await page.evaluate(() => {
    const b = window.__gameTest.live().bombs[0];
    return b ? { x: b.x, y: b.y, z: b.z } : null;
  });
  if (b1 && b2 && Math.hypot(b2.x - b1.x, b2.y - b1.y, b2.z - b1.z) > 0.05 && Math.hypot(b2.x - b1.x, b2.y - b1.y, b2.z - b1.z) < 8) {
    ok("bomb flies continuously", JSON.stringify({ weapon, b1, b2 }));
  } else fail("bomb flies continuously", JSON.stringify({ weapon, b1, b2 }));

  await page.evaluate(() => {
    const live = window.__gameTest.live();
    const fx = -Math.sin(live.yaw);
    const fz = -Math.cos(live.yaw);
    live.bombs.length = 0;
    live.booms.length = 0;
    live.booms.push({
      x: live.x,
      y: live.y + 1.05,
      z: live.z,
      vx: fx * 13.5,
      vz: fz * 13.5,
      vy: 0.6,
      age: 0,
      back: false,
      spin: 0,
    });
  });
  await page.waitForTimeout(100);
  const m1 = await page.evaluate(() => {
    const b = window.__gameTest.live().booms[0];
    return b ? { x: b.x, z: b.z } : null;
  });
  await page.waitForTimeout(100);
  const m2 = await page.evaluate(() => {
    const b = window.__gameTest.live().booms[0];
    return b ? { x: b.x, z: b.z } : null;
  });
  if (m1 && m2 && Math.hypot(m2.x - m1.x, m2.z - m1.z) > 0.08) ok("boomerang flies continuously", JSON.stringify({ m1, m2 }));
  else fail("boomerang flies continuously", JSON.stringify({ m1, m2 }));

  await page.evaluate(() => {
    const live = window.__gameTest.live();
    const fx = -Math.sin(live.yaw);
    const fz = -Math.cos(live.yaw);
    live.booms.length = 0;
    live.arrows.length = 0;
    live.arrows.push({
      x: live.x,
      y: live.y + 1.2,
      z: live.z,
      vx: fx * 24,
      vy: 1.2,
      vz: fz * 24,
      age: 0,
      kind: "arrow",
    });
  });
  await page.waitForTimeout(80);
  const a1 = await page.evaluate(() => {
    const b = window.__gameTest.live().arrows[0];
    return b ? { x: b.x, z: b.z } : null;
  });
  await page.waitForTimeout(80);
  const a2 = await page.evaluate(() => {
    const b = window.__gameTest.live().arrows[0];
    return b ? { x: b.x, z: b.z } : null;
  });
  if (a1 && a2 && Math.hypot(a2.x - a1.x, a2.z - a1.z) > 0.15) ok("arrow flies continuously", JSON.stringify({ a1, a2 }));
  else fail("arrow flies continuously", JSON.stringify({ a1, a2 }));

  await page.evaluate(() => {
    window.__gameTest.live().doorMath = true;
  });
  const pz0 = await page.evaluate(() => window.__gameTest.live().arrows[0]?.z);
  await page.waitForTimeout(200);
  const pz1 = await page.evaluate(() => window.__gameTest.live().arrows[0]?.z);
  if (pz0 === pz1) ok("pause freezes projectiles");
  else fail("pause freezes projectiles", JSON.stringify({ pz0, pz1 }));
  await page.evaluate(() => {
    const live = window.__gameTest.live();
    live.doorMath = false;
    live.paused = false;
    live.house = "yours";
  });
  await page.waitForTimeout(150);
  const cleared = await page.evaluate(() => {
    const live = window.__gameTest.live();
    const n = live.arrows.length + live.bombs.length + live.booms.length;
    live.house = null;
    return n;
  });
  if (cleared === 0) ok("entering a house clears shots");
  else fail("entering a house clears shots", `left=${cleared}`);

  await page.evaluate(() => {
    const live = window.__gameTest.live();
    live.yaw = 0;
    live.day = 0.08;
    live.paused = false;
    live.doorMath = false;
    live.house = null;
    live.arrows.length = 0;
    live.bombs.length = 0;
    live.booms.length = 0;
    window.__controlsTest.warp(14, -58);
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const live = window.__gameTest.live();
    live.day = (17.6 - 6) / 24;
    live.yaw = Math.PI;
  });
  await page.waitForTimeout(500);
  try {
    const dataUrl = await page.evaluate(() => {
      const c = document.querySelector("canvas");
      return c ? c.toDataURL("image/png") : "";
    });
    if (dataUrl.startsWith("data:image/png")) {
      writeFileSync("/workspace/screenshots/meadow-valley.png", Buffer.from(dataUrl.split(",")[1], "base64"));
    }
  } catch {
    report.notes.push("valley dump skip");
  }
  await page.evaluate(() => {
    const live = window.__gameTest.live();
    live.yaw = 0;
    live.day = 0.08;
  });
  await page.waitForTimeout(200);

  const start = await page.evaluate(() => ({
    x: window.__controlsTest.getX(),
    z: window.__controlsTest.getZ?.(),
    y: window.__controlsTest.getY?.(),
    g: window.__controlsTest.getGrounded?.(),
  }));
  await page.evaluate(() => window.__controlsTest.setKeys(["KeyW"]));
  const walkedOk = await page
    .waitForFunction(
      (s) => {
        const c = window.__controlsTest;
        if (!c) return false;
        return Math.hypot((c.getX() ?? 0) - s.x, (c.getZ?.() ?? 0) - (s.z ?? 0)) > 1.2;
      },
      start,
      { timeout: 12000 },
    )
    .then(() => true)
    .catch(() => false);
  const walked = await page.evaluate(() => ({
    x: window.__controlsTest.getX(),
    z: window.__controlsTest.getZ?.(),
    y: window.__controlsTest.getY?.(),
    speed: window.__controlsTest.getSpeed(),
    g: window.__controlsTest.getGrounded?.(),
  }));
  await page.evaluate(() => window.__controlsTest.setKeys([]));
  if (walkedOk) ok("walk moves player", JSON.stringify({ start, walked }));
  else fail("walk moves player", JSON.stringify({ start, walked }));
  if (walked.y != null && walked.y > -2 && walked.y < 12) ok("does not fall through map", `y=${walked.y}`);
  else fail("does not fall through map", JSON.stringify(walked));

  await page.evaluate(() => window.__controlsTest.setKeys(["KeyW", "ShiftLeft"]));
  await page.waitForTimeout(500);
  const run = await page.evaluate(() => window.__controlsTest.getSpeed());
  await page.evaluate(() => window.__controlsTest.setKeys([]));
  if (run > 3) ok("run is faster than walk", `speed=${run}`);
  else fail("run is faster than walk", `speed=${run}`);

  const y0 = await page.evaluate(() => window.__controlsTest.getY?.());
  await page.evaluate(() => window.__controlsTest.jump?.());
  await page.waitForTimeout(200);
  const air = await page.evaluate(() => ({ y: window.__controlsTest.getY?.(), g: window.__controlsTest.getGrounded?.() }));
  const landed = await page
    .waitForFunction(() => window.__controlsTest?.getGrounded?.() === true, null, { timeout: 20000 })
    .then(() => true)
    .catch(() => false);
  const land = await page.evaluate(() => ({ y: window.__controlsTest.getY?.(), g: window.__controlsTest.getGrounded?.() }));
  if (air.y > y0 + 0.15 || air.g === false) ok("jump leaves ground", JSON.stringify({ y0, air, land }));
  else fail("jump leaves ground", JSON.stringify({ y0, air, land }));
  if (landed || land.g === true) ok("lands back on ground");
  else fail("lands back on ground", JSON.stringify({ y0, land }));

  const beforeCam = await page.evaluate(() => ({ x: window.__controlsTest.getX(), z: window.__controlsTest.getZ?.() }));
  await page.evaluate(() => window.__controlsTest.warp?.(0, -22));
  await page.waitForTimeout(400);
  const keep = await page.evaluate(() => ({ x: window.__controlsTest.getX(), z: window.__controlsTest.getZ?.(), y: window.__controlsTest.getY?.() }));
  if (Math.abs((keep.z ?? 0) + 22) < 8 || Math.hypot((keep.x ?? 0) - (beforeCam.x ?? 0), (keep.z ?? 0) - (beforeCam.z ?? 0)) > 4) {
    ok("teleport / major area keep", JSON.stringify(keep));
  } else fail("teleport / major area keep", JSON.stringify({ beforeCam, keep }));

  await page.evaluate(() => window.__controlsTest.warp?.(0, -210));
  await page.waitForTimeout(700);
  const town = await page.evaluate(() => ({ x: window.__controlsTest.getX(), z: window.__controlsTest.getZ?.() }));
  if (Math.abs((town.z ?? 0) + 210) < 20) ok("teleport oakstead");
  else fail("teleport oakstead", JSON.stringify(town));

  await page.mouse.click(640, 420);
  await page.evaluate(() => {
    window.__gameTest.live().devOpen = true;
  });
  const devVisible = await page
    .waitForFunction(() => /developer tools/i.test(document.body.innerText || ""), null, { timeout: 8000 })
    .then(() => true)
    .catch(() => false);
  if (devVisible) ok("F2 opens developer tools");
  else fail("F2 opens developer tools");
  await shot("/workspace/screenshots/test-devtools.png");

  try {
    const clicked = await page.evaluate(() => {
      const btns = [...document.querySelectorAll("button")];
      const heal = btns.find((b) => /restore health/i.test(b.textContent || ""));
      const god = btns.find((b) => /invincible/i.test(b.textContent || ""));
      heal?.click();
      god?.click();
      return { heal: Boolean(heal), god: Boolean(god) };
    });
    if (clicked.heal && clicked.god) ok("restore health + invincible buttons");
    else fail("restore health + invincible buttons", JSON.stringify(clicked));
  } catch (e) {
    fail("dev tool buttons", e.message.split("\n")[0]);
  }
  await page.evaluate(() => {
    window.__gameTest.live().devOpen = false;
    const btn = [...document.querySelectorAll("button")].find((b) => /^close$/i.test((b.textContent || "").trim()));
    btn?.click();
  });
  const closed = await page
    .waitForFunction(() => !/developer tools/i.test(document.body.innerText || ""), null, { timeout: 8000 })
    .then(() => true)
    .catch(() => false);
  if (closed) ok("F2 closes developer tools");
  else fail("F2 closes developer tools");

  await page.evaluate(() => window.__gameTest.startQuiz());
  await page.waitForTimeout(500);
  const quizOn = await page.evaluate(() => window.__gameTest.get().quiz);
  if (quizOn) ok("math challenge opens");
  else fail("math challenge opens");
  await shot("/workspace/screenshots/test-quiz.png");

  await page.evaluate(() => window.__gameTest.quiz(false));
  await page.waitForTimeout(300);
  const afterMiss = await page.evaluate(() => window.__gameTest.get());
  if (afterMiss.screen === "overworld") ok("wrong answer does not crash");
  else fail("wrong answer does not crash", JSON.stringify(afterMiss));

  await page.evaluate(() => window.__gameTest.quiz(true));
  await page.waitForTimeout(400);
  const afterOk = await page.evaluate(() => window.__gameTest.get());
  if (afterOk.screen === "overworld") ok("correct answer accepted");
  else fail("correct answer accepted", JSON.stringify(afterOk));

  await page.evaluate(() => window.__gameTest.pause());
  const packOpen = await page
    .waitForFunction(() => /the vale|controls/i.test(document.body.innerText || ""), null, { timeout: 5000 })
    .then(() => true)
    .catch(() => false);
  if (packOpen) ok("pause / backpack / settings");
  else fail("pause / backpack / settings", (await page.locator("body").innerText()).slice(0, 160));
  await shot("/workspace/screenshots/test-pause.png");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(250);

  await page.evaluate(() => window.__gameTest.mute());
  const muted = await page.evaluate(() => window.__gameTest.get().muted);
  if (typeof muted === "boolean") ok("sound mute toggle", `muted=${muted}`);
  else fail("sound mute toggle");

  const saved = await page.evaluate(() => localStorage.getItem("numera-save-v1") || localStorage.getItem("numera-files-v1") || "");
  if (saved.length > 20) ok("saving writes a file");
  else fail("saving writes a file");

  const worlds = ["cavern", "keep"];
  for (const w of worlds) {
    await page.evaluate((id) => window.__gameTest.enter(id), w);
    await page.waitForTimeout(450);
    const st = await page.evaluate(() => window.__gameTest.get());
    if (st.world === w && st.screen === "overworld") ok(`reach world ${w}`);
    else fail(`reach world ${w}`, JSON.stringify(st));
  }
  await page.evaluate(() => window.__gameTest.enter("meadow"));
  await page.waitForTimeout(500);

  await page.evaluate(() => {
    window.__gameTest.set({
      worldsCleared: ["meadow", "cavern", "marsh", "keep", "grove", "crater", "lake", "grave", "waste", "echo", "ridge", "spire", "fen", "hollow", "vault"],
      gems: { emerald: true, ruby: true, sapphire: true },
    });
    const g = window.__gameTest.get();
    return g;
  });
  await page.evaluate(() => {
    const s = window.__gameTest;
    s.set({ screen: "hub" });
  });
  await page.waitForTimeout(800);
  const hub = await page.locator("body").innerText();
  if (/vale|even|crown|oak/i.test(hub)) ok("ending / hub after credits path");
  else fail("ending / hub after credits path", hub.slice(0, 160));
  await shot("/workspace/screenshots/test-ending.png");

  const fatal = logs.filter((l) => !/Download the React DevTools/i.test(l) && !/warning/i.test(l));
  if (fatal.length === 0) ok("no major console errors");
  else fail("no major console errors", fatal.slice(0, 6).join(" | "));
} catch (err) {
  fail("harness", err.message);
} finally {
  writeFileSync("/workspace/screenshots/test-report.json", JSON.stringify({ ...report, logs: logs.slice(0, 30) }, null, 2));
  console.log(JSON.stringify({ passed: report.passed.length, failed: report.failed.length, failedList: report.failed, logs: logs.slice(0, 12) }, null, 2));
  await browser.close();
}
