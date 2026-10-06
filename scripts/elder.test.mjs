import { test } from "node:test";
import assert from "node:assert/strict";

/** Mirrors src/game/world3d/elder.ts + lands.elderHill — keep in lockstep. */
const ET = { x: -212, z: 18 };
const ELDER = {
  outer: 13.2,
  inner: 10.05,
  shaft: 2.35,
  doorYaw: 1.98,
  doorHalf: 0.24,
  trunkH: 78,
};
const FLOORS = {
  roots: 0.52,
  hollow: 12.6,
  trunk: 28.4,
  loft: 43.2,
  branch: 57.6,
  canopy: 74.8,
};
const FLOOR_ORDER = ["roots", "hollow", "trunk", "loft", "branch", "canopy"];
const WINDOWS = [
  { id: "hollow-vale", y0: 13.1, y1: 17.8, yaw: 1.98, half: 0.2 },
  { id: "branch-east", y0: 57.2, y1: 62.2, yaw: 1.92, half: 0.3 },
];
const BRANCHES = [{ id: "east", yaw: 1.92, len: 17.4, w: 1.42, y: FLOORS.branch }];
const BELL_ORDER = [0, 1, 2, 3];
const KNOT_ORDER = [0, 1, 2, 3];

function elderHill(x, z) {
  const d = Math.hypot(x - ET.x, z - ET.z);
  if (d >= 44) return 0;
  const u = 1 - d / 44;
  const mound = u * u * (3 - 2 * u);
  return 6.6 * mound;
}

function angDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function elderAng(x, z) {
  return Math.atan2(x - ET.x, z - ET.z);
}

function elderRad(x, z) {
  return Math.hypot(x - ET.x, z - ET.z);
}

function offsetAt(yaw, r) {
  return { x: ET.x + Math.sin(yaw) * r, z: ET.z + Math.cos(yaw) * r };
}

function wallOpenAt(x, z, extra) {
  const ang = elderAng(x, z);
  if (extra < 7.2 && Math.abs(angDiff(ang, ELDER.doorYaw)) < ELDER.doorHalf) return true;
  for (const w of WINDOWS) {
    if (extra >= w.y0 - 0.55 && extra <= w.y1 + 0.45 && Math.abs(angDiff(ang, w.yaw)) < w.half) return true;
  }
  return false;
}

function onDonut(r, floor) {
  if (floor === "roots" || floor === "canopy") return r < ELDER.inner - 0.15;
  return r < ELDER.inner - 0.15 && r > ELDER.shaft;
}

function onBranchStrip(x, z, b) {
  const dx = x - ET.x;
  const dz = z - ET.z;
  const fx = Math.sin(b.yaw);
  const fz = Math.cos(b.yaw);
  const along = dx * fx + dz * fz;
  const side = -dx * fz + dz * fx;
  const start = ELDER.outer - 1.6;
  return along > start && along < start + b.len && Math.abs(side) < b.w;
}

function elderLiftAt(x, z, y, terrain) {
  const r = elderRad(x, z);
  if (r > ELDER.outer + 20) return 0;
  const extra = y - terrain;
  let lift = 0;
  for (const id of FLOOR_ORDER) {
    if (!onDonut(r, id)) continue;
    const h = FLOORS[id];
    if (extra + 0.55 >= h) lift = Math.max(lift, h);
  }
  for (const b of BRANCHES) {
    if (!onBranchStrip(x, z, b)) continue;
    if (extra + 0.7 >= b.y) lift = Math.max(lift, b.y);
  }
  return lift;
}

function collideElderAt(nx, nz, extra) {
  const r = Math.hypot(nx - ET.x, nz - ET.z);
  if (r > ELDER.outer + 4 && r > 22) return null;
  let x = nx;
  let z = nz;
  let hit = false;
  const inner = ELDER.inner;
  const outer = ELDER.outer;
  const inWall = r > inner - 0.28 && r < outer + 0.55;
  if (inWall && extra > -0.4 && extra < ELDER.trunkH + 4 && !wallOpenAt(nx, nz, extra)) {
    const ang = elderAng(nx, nz);
    const toIn = Math.abs(r - (inner - 0.35));
    const toOut = Math.abs(r - (outer + 0.58));
    const nr = toIn < toOut ? inner - 0.35 : outer + 0.58;
    x = ET.x + Math.sin(ang) * nr;
    z = ET.z + Math.cos(ang) * nr;
    hit = true;
  }
  return hit ? { x, z } : null;
}

function strikeBell(state, i) {
  if (state.done) return "have";
  const expect = BELL_ORDER[state.step.length];
  if (expect !== i) {
    state.step = [];
    return "reset";
  }
  state.step.push(i);
  if (state.step.length >= BELL_ORDER.length) {
    state.done = true;
    return "done";
  }
  return "ok";
}

test("floors climb roots to canopy", () => {
  let last = -1;
  for (const id of FLOOR_ORDER) {
    assert.ok(FLOORS[id] > last, id);
    last = FLOORS[id];
  }
  assert.ok(FLOORS.canopy > 70);
  assert.ok(FLOORS.canopy < ELDER.trunkH + 4);
});

test("hill is a landmark mound, gone at the rim", () => {
  assert.ok(elderHill(ET.x, ET.z) > 6);
  assert.equal(elderHill(ET.x + 50, ET.z), 0);
  assert.ok(elderHill(ET.x + 20, ET.z) > 1.5);
  assert.ok(elderHill(ET.x + 20, ET.z) < elderHill(ET.x, ET.z));
});

test("door is open, opposite bark is not", () => {
  const door = offsetAt(ELDER.doorYaw, (ELDER.inner + ELDER.outer) * 0.5);
  const back = offsetAt(ELDER.doorYaw + Math.PI, (ELDER.inner + ELDER.outer) * 0.5);
  assert.equal(wallOpenAt(door.x, door.z, 1.2), true);
  assert.equal(wallOpenAt(back.x, back.z, 1.2), false);
  assert.equal(collideElderAt(door.x, door.z, 1.2), null);
  assert.ok(collideElderAt(back.x, back.z, 1.2));
});

test("hollow window looks at the vale, bark beside it does not", () => {
  const win = offsetAt(1.98, (ELDER.inner + ELDER.outer) * 0.5);
  const side = offsetAt(1.98 + 1.2, (ELDER.inner + ELDER.outer) * 0.5);
  assert.equal(wallOpenAt(win.x, win.z, 15.2), true);
  assert.equal(wallOpenAt(side.x, side.z, 15.2), false);
});

test("standing on a donut lands, the shaft drops you", () => {
  const donut = offsetAt(0.4, 6.2);
  const hole = offsetAt(0.4, 0.4);
  const terrain = 10;
  assert.equal(elderLiftAt(donut.x, donut.z, terrain + 13, terrain), FLOORS.hollow);
  assert.equal(elderLiftAt(hole.x, hole.z, terrain + 13, terrain), FLOORS.roots);
  assert.equal(elderLiftAt(donut.x, donut.z, terrain + 1, terrain), FLOORS.roots);
});

test("east branch is a road at canopy-height, grass beside it is not", () => {
  const on = offsetAt(1.92, ELDER.outer + 8);
  const off = offsetAt(1.92 + Math.PI * 0.5, ELDER.outer + 8);
  const terrain = 10;
  assert.equal(elderLiftAt(on.x, on.z, terrain + 58, terrain), FLOORS.branch);
  assert.equal(elderLiftAt(off.x, off.z, terrain + 58, terrain), 0);
});

test("bells want north sun south blank", () => {
  const s = { step: [], done: false };
  assert.equal(strikeBell(s, 1), "reset");
  assert.equal(strikeBell(s, 0), "ok");
  assert.equal(strikeBell(s, 1), "ok");
  assert.equal(strikeBell(s, 2), "ok");
  assert.equal(strikeBell(s, 3), "done");
  assert.equal(strikeBell(s, 0), "have");
});

test("knots match the bells and forget a wrong step", () => {
  const s = { step: [], done: false };
  function push(i) {
    if (s.done) return "have";
    if (s.step[s.step.length - 1] === i) return "ok";
    const expect = KNOT_ORDER[s.step.length];
    if (expect !== i) {
      s.step = [];
      return "reset";
    }
    s.step.push(i);
    if (s.step.length >= KNOT_ORDER.length) {
      s.done = true;
      return "done";
    }
    return "ok";
  }
  assert.equal(push(0), "ok");
  assert.equal(push(2), "reset");
  assert.equal(push(0), "ok");
  assert.equal(push(1), "ok");
  assert.equal(push(2), "ok");
  assert.equal(push(3), "done");
});
