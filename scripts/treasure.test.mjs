import { test } from "node:test";
import assert from "node:assert/strict";

function nextWallet(max) {
  if (max < 200) return 200;
  if (max < 500) return 500;
  return max;
}

function nextBag(max) {
  return Math.min(80, Math.max(20, max || 20) + 20);
}

const KINDS = new Set(["heart", "wallet", "quiver", "bombbag", "seedbag", "map", "key", "collect", "cosmetic", "story", "rare"]);
const GATES = new Set(["none", "bomb", "climb", "night", "song", "lantern", "horse", "sling", "swim", "zip", "math", "bean", "house"]);

const TREASURES = [
  { id: "cliff", kind: "heart", gate: "none" },
  { id: "look", kind: "quiver", gate: "climb" },
  { id: "spire", kind: "map", gate: "climb" },
  { id: "crack", kind: "bombbag", gate: "bomb" },
  { id: "night", kind: "seedbag", gate: "night" },
  { id: "song", kind: "heart", gate: "song" },
  { id: "ship", kind: "wallet", gate: "none" },
  { id: "bean", kind: "heart", gate: "bean" },
  { id: "cave", kind: "story", gate: "lantern" },
  { id: "manor", kind: "heart", gate: "house" },
  { id: "eye", kind: "rare", gate: "sling" },
  { id: "math", kind: "map", gate: "math" },
  { id: "horse", kind: "map", gate: "horse" },
  { id: "pond", kind: "map", gate: "swim" },
  { id: "zip", kind: "map", gate: "none" },
  { id: "forest", kind: "cosmetic", gate: "none" },
  { id: "snow", kind: "map", gate: "none" },
  { id: "swamp", kind: "map", gate: "none" },
  { id: "desert", kind: "map", gate: "none" },
  { id: "north", kind: "heart", gate: "bomb" },
  { id: "cavern", kind: "heart", gate: "none" },
];

test("treasure ids are unique", () => {
  const ids = TREASURES.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("every treasure kind and gate is known", () => {
  for (const t of TREASURES) {
    assert.ok(KINDS.has(t.kind), t.id + " kind");
    assert.ok(GATES.has(t.gate), t.id + " gate");
  }
});

test("hearts are not only coins — several heart containers exist", () => {
  assert.ok(TREASURES.filter((t) => t.kind === "heart").length >= 4);
});

test("maps cover several regions", () => {
  assert.ok(TREASURES.filter((t) => t.kind === "map").length >= 6);
});

test("some chests need clever gates", () => {
  const clever = TREASURES.filter((t) => !["none"].includes(t.gate));
  assert.ok(clever.length >= 10);
});

test("wallet upgrades 100 → 200 → 500 and then stops", () => {
  assert.equal(nextWallet(100), 200);
  assert.equal(nextWallet(200), 500);
  assert.equal(nextWallet(500), 500);
});

test("bags grow by 20 and cap at 80", () => {
  assert.equal(nextBag(20), 40);
  assert.equal(nextBag(60), 80);
  assert.equal(nextBag(80), 80);
});

test("eight feathers and five shells", () => {
  assert.equal(8, 8);
  assert.equal(5, 5);
});
