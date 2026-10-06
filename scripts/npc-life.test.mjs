import assert from "node:assert/strict";
import { describe, it } from "node:test";

function jitter(spot, id, hour) {
  const n = id.charCodeAt(0) + id.length * 13 + hour * 7;
  const a = (n % 360) * 0.01745;
  const r = 0.8 + (n % 5) * 0.22;
  return { x: spot.x + Math.cos(a) * r, z: spot.z + Math.sin(a) * r };
}

function errand(id, home, t) {
  const hour = Math.floor(t);
  const night = t >= 20.15 || t < 6.05;
  if (night) return home;
  const well = { x: -12, z: -100 };
  const square = { x: 0, z: -108 };
  if (id === "pax") return jitter(t < 12 ? well : square, id, hour);
  if (id === "ash") return jitter(square, id, hour);
  return null;
}

describe("npc village life", () => {
  it("sends villagers home after dark", () => {
    const home = { x: 10, z: -80 };
    const at = errand("pax", home, 21.4);
    assert.equal(at.x, home.x);
    assert.equal(at.z, home.z);
  });

  it("sends villagers out in the morning", () => {
    const home = { x: 10, z: -80 };
    const at = errand("pax", home, 9.2);
    assert.notEqual(at.x, home.x);
  });

  it("keeps destinations in town, not a tiny circle around spawn", () => {
    const home = { x: 10.4, z: -54.2 };
    const at = errand("pax", home, 10);
    const d = Math.hypot(at.x - home.x, at.z - home.z);
    assert.ok(d > 8, `expected a real walk, got ${d}`);
  });
});

describe("room fade", () => {
  it("fades out then in over about a second", () => {
    const fade = (t) => {
      if (t < 0.52) return Math.min(1, t / 0.52);
      if (t < 0.64) return 1;
      return Math.max(0, 1 - (t - 0.64) / 0.48);
    };
    assert.ok(fade(0.1) < 0.4);
    assert.equal(fade(0.55), 1);
    assert.ok(fade(1.2) < 0.05);
  });
});
