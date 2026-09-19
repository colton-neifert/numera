import { chromium } from "playwright";

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.setDefaultTimeout(20000);
const logs = [];
page.on("pageerror", (e) => logs.push("PAGE " + e.message));

await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
const skip = page.getByRole("button", { name: /skip/i }).first();
if (await skip.count()) await skip.click({ force: true }).catch(() => {});
await page.waitForFunction(() => Boolean(window.__gameTest), null, { timeout: 15000 });
await page.evaluate(() => window.__gameTest.boot());
await page.waitForFunction(
  () => window.__gameTest?.get?.()?.screen === "overworld" && Boolean(window.__controlsTest),
  null,
  { timeout: 25000 },
);
await page.waitForTimeout(500);

const fight = await page.evaluate(() => {
  const g = window.__gameTest;
  const live = g.live();
  live.paused = false;
  live.talking = false;
  live.house = null;
  live.doorMath = false;
  live.god = true;
  live.engaged = false;
  g.set({ hasSword: true, holding: "sword", grade: "k1", mathRung: 0, mathStreak: 0 });
  live.holding = "sword";
  live.hasSword = true;
  window.__controlsTest.warp(18, -38.6);
  live.x = 18;
  live.z = -38.6;
  live.yaw = 0;
  live.swinging = false;
  live.slash = null;
  return { combat: g.get().combat, quiz: g.get().quiz };
});

await page.locator("canvas").first().click({ force: true }).catch(() => {});
await page.keyboard.press("v");
await page.waitForTimeout(500);
await page.keyboard.press("v");
await page.waitForTimeout(500);

const after = await page.evaluate(() => {
  const g = window.__gameTest;
  const live = g.live();
  return {
    combat: g.get().combat,
    quiz: g.get().quiz,
    foeHp: live.foeHp["meadow-e0"] ?? null,
    hitT: live.foeHitT["meadow-e0"] ?? null,
    hint: live.hint,
    defeated: g.get().defeated?.meadow ?? [],
    hp: g.get().hp,
    x: live.x,
    z: live.z,
    track: live.foeTrack["meadow-e0"] ?? null,
  };
});

await page.evaluate(() => {
  window.__gameTest.set({ grade: "k1", mathRung: 0 });
  window.__gameTest.startQuiz();
});
await page.waitForTimeout(300);
const quizTxt = await page.locator("body").innerText();
const sparkQuiz = /They wait|Prove|Spark|plus|minus|count|\+|\u2212|−/i.test(quizTxt);
const hasTimes = /×|times/i.test(quizTxt);

await page.evaluate(() => {
  const s = window.__gameTest;
  if (s.get().quiz) s.quiz(true);
});
await page.waitForTimeout(200);

await page.evaluate(() => {
  const g = window.__gameTest;
  const live = g.live();
  g.set({ doorQuiz: null, grade: "k1", mathRung: 0 });
  live.talking = false;
  live.doorMath = false;
  live.pendingTalk = null;
  live.paused = false;
});
await page.waitForTimeout(150);
await page.evaluate(() => {
  const btn = [...document.querySelectorAll("button")].find((n) => /backpack/i.test(n.textContent || ""));
  if (btn) btn.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
});
await page.waitForTimeout(400);
const packQuiz = await page.evaluate(() => window.__gameTest.get().quiz);
const packTxt = await page.locator("body").innerText();
const packPrompt = /backpack|Prove you can open/i.test(packTxt);

await page.screenshot({ path: "/workspace/screenshots/field-fight.png", timeout: 4000 }).catch(() => {});
console.log(
  JSON.stringify(
    {
      fight,
      after,
      sparkQuiz,
      hasTimes,
      packQuiz,
      packPrompt,
      logs: logs.slice(0, 6),
    },
    null,
    2,
  ),
);
await browser.close();
