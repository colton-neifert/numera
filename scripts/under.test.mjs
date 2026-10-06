import { test } from "node:test";
import assert from "node:assert/strict";

/** Mirrors src/game/world3d/under.ts walk math — keep in lockstep. */
const UR = {
  well: { x: 0, z: 0, r: 16.4 },
  glow: { x: -48, z: 8, r: 15.2 },
  mill: { x: 26, z: 8, r: 9.2 },
  count: { x: 2, z: 46, r: 13.4 },
  black: { x: 80, z: 4, r: 17.6 },
  root: { x: -98, z: 12, r: 17.2 },
  quiet: { x: -136, z: -8, r: 13.2 },
  ember: { x: 8, z: 96, r: 15.4 },
  sink: { x: 40, z: -54, r: 15.2 },
  bone: { x: 8, z: -98, r: 18.4 },
};

const TUNNELS = [
  { a: "well", b: "glow", w: 4.6 },
  { a: "well", b: "mill", w: 3.8 },
  { a: "well", b: "count", w: 4.4 },
  { a: "well", b: "black", w: 5.2 },
  { a: "glow", b: "root", w: 4.8 },
  { a: "root", b: "quiet", w: 4.2 },
  { a: "count", b: "ember", w: 4.6 },
  { a: "well", b: "sink", w: 4.8 },
  { a: "sink", b: "bone", w: 4.6 },
  { a: "black", b: "bone", w: 4.4 },
];

function capDist(x, z, ax, az, bx, bz) {
  const dx = bx - ax;
  const dz = bz - az;
  const len2 = dx * dx + dz * dz || 1;
  let t = ((x - ax) * dx + (z - az) * dz) / len2;
  t = Math.max(0, Math.min(1, t));
  const px = ax + dx * t;
  const pz = az + dz * t;
  return { d: Math.hypot(x - px, z - pz), t, px, pz };
}

function walkable(x, z) {
  for (const r of Object.values(UR)) {
    if (Math.hypot(x - r.x, z - r.z) < r.r - 0.35) return true;
  }
  for (const t of TUNNELS) {
    const a = UR[t.a];
    const b = UR[t.b];
    const hit = capDist(x, z, a.x, a.z, b.x, b.z);
    if (hit.d < t.w) return true;
  }
  return false;
}

test("each cavern is walkable at its center", () => {
  for (const r of Object.values(UR)) {
    assert.equal(walkable(r.x, r.z), true, r.x + "," + r.z);
  }
});

test("the graph connects well to river, woods, peak, and ruins", () => {
  assert.equal(walkable((UR.well.x + UR.black.x) / 2, (UR.well.z + UR.black.z) / 2), true);
  assert.equal(walkable((UR.glow.x + UR.root.x) / 2, (UR.glow.z + UR.root.z) / 2), true);
  assert.equal(walkable((UR.count.x + UR.ember.x) / 2, (UR.count.z + UR.ember.z) / 2), true);
  assert.equal(walkable((UR.sink.x + UR.bone.x) / 2, (UR.sink.z + UR.bone.z) / 2), true);
});

test("far void is not walkable", () => {
  assert.equal(walkable(400, 400), false);
  assert.equal(walkable(-400, 0), false);
});

test("ten caverns — not one cave", () => {
  assert.equal(Object.keys(UR).length, 10);
});

test("shortcuts dump you far from the door you used", () => {
  const shorts = [
    { inRegion: "bone", outHint: "south stones" },
    { inRegion: "quiet", outHint: "woods" },
    { inRegion: "ember", outHint: "mountain" },
    { inRegion: "black", outHint: "ford" },
  ];
  assert.equal(shorts.length, 4);
  assert.ok(Math.hypot(UR.bone.x - UR.well.x, UR.bone.z - UR.well.z) > 80);
  assert.ok(Math.hypot(UR.black.x - UR.well.x, UR.black.z - UR.well.z) > 60);
  assert.ok(Math.hypot(UR.root.x - UR.well.x, UR.root.z - UR.well.z) > 80);
});
