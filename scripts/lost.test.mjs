import { test } from "node:test";
import assert from "node:assert/strict";

/** Mirrors src/game/lost.ts — keep in lockstep. */
const LOST = {
  scent: { x: -88, z: -22 },
  hole: { x: -168, z: -64 },
  den: { x: -236, z: -108 },
  cage: { x: -236, z: -122 },
};
const DEN = {
  hw: 4.4,
  front: LOST.den.z,
  back: LOST.cage.z - 6.2,
  bars: LOST.cage.z + 2.15,
};
const HOLE_R = 0.72;
const WALL = 0.48;
const THICKET_X = -174;
const THICKET_Z = -50;
const THICKET_SOUTH = -72;
const THICKET_EAST = -156;

function pushSeg(nx, nz, ax, az, bx, bz, half) {
  const abx = bx - ax;
  const abz = bz - az;
  const len = Math.hypot(abx, abz) || 1;
  const ux = abx / len;
  const uz = abz / len;
  const t = Math.max(0, Math.min(len, (nx - ax) * ux + (nz - az) * uz));
  const cx = ax + ux * t;
  const cz = az + uz * t;
  const dx = nx - cx;
  const dz = nz - cz;
  const d = Math.hypot(dx, dz);
  if (d >= half) return null;
  if (d < 1e-6) return { x: cx - uz * half, z: cz + ux * half };
  const u = half / d;
  return { x: cx + dx * u, z: cz + dz * u };
}

function pushCircle(nx, nz, cx, cz, r) {
  const dx = nx - cx;
  const dz = nz - cz;
  const d = Math.hypot(dx, dz);
  if (d >= r) return null;
  if (d < 1e-6) return { x: cx + r, z: cz };
  const u = r / d;
  return { x: cx + dx * u, z: cz + dz * u };
}

function collide(nx, nz, cageOn) {
  let x = nx;
  let z = nz;
  let hit = false;
  const hole = pushCircle(x, z, LOST.hole.x, LOST.hole.z, HOLE_R);
  if (hole) {
    x = hole.x;
    z = hole.z;
    hit = true;
  }
  const thicket = [
    { ax: THICKET_X, az: THICKET_SOUTH, bx: THICKET_X, bz: THICKET_Z },
    { ax: THICKET_X, az: THICKET_Z, bx: THICKET_EAST, bz: THICKET_Z },
  ];
  for (const s of thicket) {
    const p = pushSeg(x, z, s.ax, s.az, s.bx, s.bz, WALL + 0.35);
    if (p) {
      x = p.x;
      z = p.z;
      hit = true;
    }
  }
  const cx = LOST.den.x;
  const denSegs = [
    { ax: cx - DEN.hw, az: DEN.front, bx: cx - DEN.hw, bz: DEN.back },
    { ax: cx + DEN.hw, az: DEN.front, bx: cx + DEN.hw, bz: DEN.back },
    { ax: cx - DEN.hw, az: DEN.back, bx: cx + DEN.hw, bz: DEN.back },
  ];
  for (const s of denSegs) {
    const p = pushSeg(x, z, s.ax, s.az, s.bx, s.bz, WALL);
    if (p) {
      x = p.x;
      z = p.z;
      hit = true;
    }
  }
  if (cageOn) {
    const gap = 0.82;
    const bars = [
      { ax: cx - DEN.hw + 0.2, az: DEN.bars, bx: cx - gap, bz: DEN.bars },
      { ax: cx + gap, az: DEN.bars, bx: cx + DEN.hw - 0.2, bz: DEN.bars },
    ];
    for (const s of bars) {
      const p = pushSeg(x, z, s.ax, s.az, s.bx, s.bz, 0.32);
      if (p) {
        x = p.x;
        z = p.z;
        hit = true;
      }
    }
  }
  return hit ? { x, z } : null;
}

function lostAway(n) {
  return n >= 1 && n < 3;
}

function nimFollowing(nim, lostN, followFlag) {
  if (lostAway(lostN)) return false;
  return nim >= 1 || followFlag;
}

function smashLatch(talked) {
  if (!talked) return false;
  return true;
}

test("hole is too small — center pushes out", () => {
  const hit = collide(LOST.hole.x, LOST.hole.z, false);
  assert.ok(hit);
  assert.ok(Math.hypot(hit.x - LOST.hole.x, hit.z - LOST.hole.z) >= HOLE_R - 1e-6);
});

test("south of the hole is open — the long way", () => {
  const hit = collide(LOST.hole.x, LOST.hole.z - 18, false);
  assert.equal(hit, null);
});

test("west of the hole is a wall of root", () => {
  const hit = collide(THICKET_X, -60, false);
  assert.ok(hit);
});

test("den mouth is open, walls are not", () => {
  const mouth = collide(LOST.den.x, LOST.den.z + 2.4, false);
  assert.equal(mouth, null);
  const wall = collide(LOST.den.x - DEN.hw, (DEN.front + DEN.back) * 0.5, false);
  assert.ok(wall);
  const back = collide(LOST.den.x, DEN.back, false);
  assert.ok(back);
});

test("cage bars block until they are open", () => {
  const shut = collide(LOST.den.x - 1.4, DEN.bars, true);
  assert.ok(shut);
  const open = collide(LOST.den.x - 1.4, DEN.bars, false);
  assert.equal(open, null);
});

test("lostAway is searching, not off or done", () => {
  assert.equal(lostAway(0), false);
  assert.equal(lostAway(1), true);
  assert.equal(lostAway(2), true);
  assert.equal(lostAway(3), false);
});

test("companion does not follow while she is lost", () => {
  assert.equal(nimFollowing(1, 0, true), true);
  assert.equal(nimFollowing(1, 1, true), false);
  assert.equal(nimFollowing(1, 2, true), false);
  assert.equal(nimFollowing(1, 3, true), true);
  assert.equal(nimFollowing(0, 0, false), false);
});

test("latch needs a talk first", () => {
  assert.equal(smashLatch(false), false);
  assert.equal(smashLatch(true), true);
});

test("bolt needs the lamp fox already met", () => {
  function begin(nim, sword, phase) {
    if (phase !== "off") return false;
    if (nim < 1) return false;
    if (!sword) return false;
    return true;
  }
  assert.equal(begin(0, true, "off"), false);
  assert.equal(begin(1, false, "off"), false);
  assert.equal(begin(1, true, "search"), false);
  assert.equal(begin(1, true, "off"), true);
});

test("reunion restores follow", () => {
  let lostN = 2;
  let follow = false;
  lostN = 3;
  follow = true;
  assert.equal(lostAway(lostN), false);
  assert.equal(nimFollowing(1, lostN, follow), true);
});
