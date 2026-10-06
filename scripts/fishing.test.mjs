import { test } from "node:test";
import assert from "node:assert/strict";

/** Mirrors src/game/fishing.ts — keep in lockstep. */
const FISH = {
  bluegill: { spots: ["pond", "far", "wild"], when: "any", food: true, secret: false, weight: 8 },
  perch: { spots: ["pond", "wild"], when: ["day", "dawn"], food: true, secret: false, weight: 6 },
  goldminnow: { spots: ["pond"], when: ["dusk"], food: true, secret: false, weight: 3 },
  trout: { spots: ["river", "pool"], when: "any", food: true, secret: false, weight: 7 },
  pike: { spots: ["river"], when: ["day"], food: true, secret: false, weight: 4 },
  salmon: { spots: ["pool"], when: ["dawn", "dusk"], food: true, secret: false, weight: 3 },
  mosscarp: { spots: ["forest"], when: ["day", "dawn"], food: true, secret: false, weight: 5 },
  ferneel: { spots: ["forest"], when: ["dusk", "night"], food: true, secret: false, weight: 4 },
  char: { spots: ["mount"], when: ["dawn"], food: true, secret: false, weight: 4 },
  icegoby: { spots: ["mount", "ice"], when: "any", food: true, secret: false, weight: 5 },
  mudskip: { spots: ["wild", "swamp"], when: ["day", "dusk"], food: true, secret: false, weight: 6 },
  moonfish: { spots: ["far", "moon", "pond"], when: ["night"], food: true, secret: false, weight: 3 },
  mireeel: { spots: ["swamp"], when: ["night", "dusk"], food: true, secret: false, weight: 4 },
  boot: { spots: ["well", "wild", "pond"], when: "any", food: false, secret: false, weight: 2 },
  bottle: { spots: ["far"], when: ["night"], food: false, secret: true, weight: 0 },
  numbered: { spots: ["pond"], when: ["dawn"], food: false, secret: true, weight: 0 },
};

function hourPart(h) {
  if (h >= 5.1 && h < 7.6) return "dawn";
  if (h >= 7.6 && h < 17.2) return "day";
  if (h >= 17.2 && h < 20.2) return "dusk";
  return "night";
}

function fishOpen(def, part) {
  return def.when === "any" || def.when.includes(part);
}

function pickFish(spot, hour, log, seed, quests) {
  const part = hourPart(hour);
  const has = (id) => log.includes(id);
  if (spot === "far" && part === "night" && !has("bottle") && seed % 100 < 22) return "bottle";
  if (spot === "pond" && part === "dawn" && (quests.fishBottle ?? 0) >= 1 && !has("numbered") && seed % 100 < 28) {
    return "numbered";
  }
  const pool = [];
  for (const [id, def] of Object.entries(FISH)) {
    if (def.secret) continue;
    if (!def.spots.includes(spot)) continue;
    if (!fishOpen(def, part)) continue;
    for (let i = 0; i < def.weight; i++) pool.push(id);
  }
  if (!pool.length) return spot === "well" ? "boot" : "bluegill";
  return pool[Math.abs(Math.floor(seed * 7.13 + hour * 13)) % pool.length];
}

function edibleCaught(log) {
  return log.filter((id) => FISH[id]?.food).length;
}

test("dusk pond can roll a gold minnow", () => {
  assert.equal(hourPart(18), "dusk");
  const hits = new Set();
  for (let s = 0; s < 400; s++) hits.add(pickFish("pond", 18, [], s, {}));
  assert.ok(hits.has("goldminnow"));
  assert.ok(!hits.has("bottle"));
  assert.ok(!hits.has("numbered"));
});

test("gold minnow does not appear at noon", () => {
  for (let s = 0; s < 200; s++) {
    assert.notEqual(pickFish("pond", 12, [], s, {}), "goldminnow");
  }
});

test("bottle only at the far pond at night", () => {
  let found = false;
  for (let s = 0; s < 400; s++) {
    if (pickFish("far", 22, [], s, {}) === "bottle") found = true;
    assert.notEqual(pickFish("pond", 22, [], s, {}), "bottle");
    assert.notEqual(pickFish("far", 12, [], s, {}), "bottle");
  }
  assert.ok(found);
});

test("numbered carp only at dawn pond after the bottle", () => {
  let found = false;
  for (let s = 0; s < 400; s++) {
    if (pickFish("pond", 6, [], s, { fishBottle: 1 }) === "numbered") found = true;
    assert.notEqual(pickFish("pond", 6, [], s, {}), "numbered");
    assert.notEqual(pickFish("pond", 12, [], s, { fishBottle: 1 }), "numbered");
  }
  assert.ok(found);
});

test("eight edible kinds is the angler heart gate", () => {
  const eight = ["bluegill", "perch", "trout", "pike", "mosscarp", "char", "icegoby", "mudskip"];
  assert.equal(edibleCaught(eight), 8);
  assert.equal(edibleCaught([...eight, "boot", "bottle"]), 8);
  assert.ok(edibleCaught(["bluegill", "boot"]) < 8);
});

test("every named water has a common fish", () => {
  for (const spot of ["pond", "river", "pool", "forest", "mount", "wild", "swamp", "ice", "well"]) {
    const id = pickFish(spot, 12, [], 3, {});
    assert.ok(FISH[id], spot);
  }
});
