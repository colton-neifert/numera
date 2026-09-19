// Character close-ups from the /charlab page. Usage: node scripts/char-shot.mjs <outDir> <tag> [who:cam,who:cam…]
import { chromium } from "playwright";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const out = process.argv[2] || "screenshots";
const tag = process.argv[3] || "char";
const list = (process.argv[4] || "all:wide,hero:three,hero:face,hero:back,foe:three").split(",");
mkdirSync(out, { recursive: true });
const local = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || (existsSync(local) ? local : undefined),
  args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: 1100, height: 760 } });
page.on("pageerror", (e) => console.log("PAGE", e.message.slice(0, 300)));
for (const item of list) {
  const [who, cam] = item.split(":");
  await page.goto(`http://127.0.0.1:8080/charlab?who=${who}&cam=${cam}${process.env.FOE ? `&foe=${process.env.FOE}` : ""}${process.env.ANIM ? `&anim=${process.env.ANIM}` : ""}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("canvas", { timeout: 60000 });
  await page.evaluate(() => new Promise((res) => { let k = 0; const t = () => (++k >= 25 ? res(0) : requestAnimationFrame(t)); requestAnimationFrame(t); }));
  const url = await page.evaluate(() => document.querySelector("canvas").toDataURL("image/jpeg", 0.92));
  writeFileSync(`${out}/${tag}-${who}-${cam}.jpg`, Buffer.from(url.split(",")[1], "base64"));
  console.log(item, url.length);
}
await browser.close();
