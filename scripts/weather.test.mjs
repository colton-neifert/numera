import { test } from "node:test";
import assert from "node:assert/strict";

/** Mirrors src/game/weather.ts — keep in lockstep. */
const KINDS = ["sun", "cloud", "rain", "storm", "fog", "snow"];

function weatherWeights(land, night, hour, prev) {
  const w = { sun: 38, cloud: 24, rain: 16, storm: 5, fog: 9, snow: 2 };
  if (land === "desert") {
    w.sun = 58;
    w.cloud = 28;
    w.rain = 2;
    w.storm = 1;
    w.fog = 3;
    w.snow = 0;
  } else if (land === "snow") {
    w.sun = 8;
    w.cloud = 14;
    w.rain = 0;
    w.storm = 8;
    w.fog = 12;
    w.snow = 52;
  } else if (land === "swamp") {
    w.sun = 10;
    w.cloud = 16;
    w.rain = 24;
    w.storm = 8;
    w.fog = 32;
    w.snow = 0;
  } else if (land === "forest") {
    w.fog += 12;
    w.rain += 8;
    w.sun -= 10;
  }
  if (night) {
    w.fog += 12;
    w.storm += 8;
    w.sun = Math.max(4, w.sun - 18);
  }
  if (hour >= 6 && hour < 10) w.fog += 14;
  if (prev === "rain") {
    w.fog += 10;
    w.cloud += 12;
    w.rain -= 8;
  }
  if (prev === "storm") {
    w.rain += 16;
    w.fog += 10;
    w.storm -= 3;
  }
  for (const k of Object.keys(w)) w[k] = Math.max(0, w[k]);
  return w;
}

function pickWeighted(w, roll) {
  const keys = Object.keys(w);
  let sum = 0;
  for (const k of keys) sum += w[k];
  let t = (((roll % 1) + 1) % 1) * sum;
  for (const k of keys) {
    t -= w[k];
    if (t <= 0) return k;
  }
  return keys[keys.length - 1];
}

function riverBoost(rain, storm) {
  return 1 + rain * 0.62 + storm * 0.28;
}

const DRY_BED = [
  [-28, -46],
  [-36, -68],
  [-44, -90],
  [-50, -110],
  [-54, -126],
];

function distSeg(x, z, ax, az, bx, bz) {
  const dx = bx - ax;
  const dz = bz - az;
  const len2 = dx * dx + dz * dz || 1;
  let t = ((x - ax) * dx + (z - az) * dz) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(x - (ax + dx * t), z - (az + dz * t));
}

function dryBedU(x, z) {
  let best = 0;
  const half = [2.4, 2.2, 2.3, 2.6];
  for (let i = 0; i < DRY_BED.length - 1; i++) {
    const a = DRY_BED[i];
    const b = DRY_BED[i + 1];
    const d = distSeg(x, z, a[0], a[1], b[0], b[1]);
    const u = 1 - d / (half[i] ?? 2.3);
    if (u > best) best = u;
  }
  if (best <= 0) return 0;
  return best * best * (3 - 2 * best);
}

function dryBedWet(x, z, flow) {
  if (flow < 0.08) return 0;
  const u = dryBedU(x, z);
  if (u <= 0) return 0;
  return Math.min(0.78, u * 0.62 * flow);
}

test("weather has the six kinds kids can see", () => {
  assert.deepEqual(KINDS, ["sun", "cloud", "rain", "storm", "fog", "snow"]);
});

test("desert almost never picks rain; snow land prefers snow", () => {
  const d = weatherWeights("desert", false, 12, "sun");
  assert.ok(d.sun > d.rain * 10, "desert should stay dry");
  assert.equal(d.snow, 0);
  const s = weatherWeights("snow", false, 12, "sun");
  assert.ok(s.snow > s.sun, "white crown stays white");
  assert.equal(s.rain, 0);
});

test("rain lifts the river; sun does not", () => {
  assert.equal(riverBoost(0, 0), 1);
  const wet = riverBoost(1, 1);
  assert.ok(wet > 1.8, `boost too small: ${wet}`);
  assert.ok(0.4 * wet > 0.55, "ford shallows become a swim");
});

test("the lookout gully is dry until rain, then it is a creek", () => {
  const mid = DRY_BED[2];
  assert.ok(dryBedU(mid[0], mid[1]) > 0.8, "gully should exist");
  assert.equal(dryBedWet(mid[0], mid[1], 0), 0);
  assert.ok(dryBedWet(mid[0], mid[1], 1) > 0.4, "rain should fill it");
  assert.ok(dryBedU(0, -100) < 0.05, "the square stays dry dirt");
});

test("fog mornings and storms are heavier at night", () => {
  const day = weatherWeights("vale", false, 14, "sun");
  const night = weatherWeights("vale", true, 22, "sun");
  assert.ok(night.fog > day.fog);
  assert.ok(night.storm > day.storm);
  const morn = weatherWeights("vale", false, 8, "sun");
  assert.ok(morn.fog > day.fog);
});

test("weighted pick covers every kind and stays in the table", () => {
  const w = weatherWeights("vale", false, 12, "sun");
  const seen = new Set();
  for (let i = 0; i < 40; i++) seen.add(pickWeighted(w, i / 40));
  assert.ok(seen.has("sun"));
  assert.ok(seen.has("rain"));
  for (const k of seen) assert.ok(KINDS.includes(k), k);
});
