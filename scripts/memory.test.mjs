import { test } from "node:test";
import assert from "node:assert/strict";

/** Mirrors src/game/world3d/memory.ts — keep in lockstep. */
const MOSAIC = [0, 1, 2, 3];
const WATCH_ORDER = [0, 2, 1, 3];
const WELL_ORDER = [1, 0, 2, 3];
const CLOTH_ORDER = [0, 1, 3, 2];
const CAIRN_ORDER = [1, 3, 2, 0];
const WELL_PIPS = [2, 1, 3, 0];
const CAIRN_RINGS = [1, 3, 2, 0];
const DOOR = { x: -1138, z: -191.4 };
const CHEST_Z = -188.6;
const SHRINE_HW = 2.55;
const SHRINE_HALF = 0.48;
const SHRINE_GAP = 0.95;

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

function collide(nx, nz, open) {
  const cx = DOOR.x;
  const front = DOOR.z;
  const back = CHEST_Z + 1.85;
  const segs = [
    { ax: cx - SHRINE_HW, az: front - 0.2, bx: cx - SHRINE_HW, bz: back },
    { ax: cx + SHRINE_HW, az: front - 0.2, bx: cx + SHRINE_HW, bz: back },
    { ax: cx - SHRINE_HW, az: back, bx: cx + SHRINE_HW, bz: back },
  ];
  if (open) {
    segs.push({ ax: cx - SHRINE_HW, az: front, bx: cx - SHRINE_GAP, bz: front });
    segs.push({ ax: cx + SHRINE_GAP, az: front, bx: cx + SHRINE_HW, bz: front });
  } else {
    segs.push({ ax: cx - SHRINE_HW, az: front, bx: cx + SHRINE_HW, bz: front });
  }
  let x = nx;
  let z = nz;
  let hit = false;
  for (const s of segs) {
    const p = pushSeg(x, z, s.ax, s.az, s.bx, s.bz, SHRINE_HALF);
    if (p) {
      x = p.x;
      z = p.z;
      hit = true;
    }
  }
  return hit ? { x, z } : null;
}

function same(a, b) {
  return a.length === b.length && a.every((n, i) => n === b[i]);
}

function push(order, step, id) {
  if (step.done) return "have";
  if (step.seq.length && step.seq[step.seq.length - 1] === id) return "ok";
  const expect = order[step.seq.length];
  if (expect !== id) {
    step.seq = [];
    return "reset";
  }
  step.seq.push(id);
  if (step.seq.length >= order.length) {
    step.done = true;
    return "done";
  }
  return "ok";
}

test("memory orders are unique and not the mosaic diamond", () => {
  const all = [WATCH_ORDER, WELL_ORDER, CLOTH_ORDER, CAIRN_ORDER];
  for (const o of all) {
    assert.equal(o.length, 4);
    assert.ok(!same(o, MOSAIC), `order ${o} copied mosaic`);
    const set = new Set(o);
    assert.equal(set.size, 4, `order ${o} repeats`);
  }
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      assert.ok(!same(all[i], all[j]), `${all[i]} equals ${all[j]}`);
    }
  }
});

test("well order is count, not north-east-south-west", () => {
  assert.deepEqual(
    WELL_ORDER.map((id) => WELL_PIPS[id]),
    [1, 2, 3, 0],
  );
  assert.ok(!same(WELL_ORDER, MOSAIC));
});

test("lookout west-to-east is the cairn strike order", () => {
  assert.deepEqual(CAIRN_RINGS.slice(), CAIRN_ORDER.slice());
});

test("wrong step resets; correct sequence opens", () => {
  const step = { seq: [], done: false };
  assert.equal(push(WATCH_ORDER, step, 0), "ok");
  assert.equal(push(WATCH_ORDER, step, 1), "reset");
  assert.deepEqual(step.seq, []);
  assert.equal(push(WATCH_ORDER, step, 0), "ok");
  assert.equal(push(WATCH_ORDER, step, 2), "ok");
  assert.equal(push(WATCH_ORDER, step, 1), "ok");
  assert.equal(push(WATCH_ORDER, step, 3), "done");
  assert.equal(step.done, true);
  assert.equal(push(WATCH_ORDER, step, 0), "have");
});

test("standing on the same pad twice does not reset", () => {
  const step = { seq: [], done: false };
  assert.equal(push(CLOTH_ORDER, step, 0), "ok");
  assert.equal(push(CLOTH_ORDER, step, 0), "ok");
  assert.deepEqual(step.seq, [0]);
  assert.equal(push(CLOTH_ORDER, step, 1), "ok");
  assert.equal(push(CLOTH_ORDER, step, 3), "ok");
  assert.equal(push(CLOTH_ORDER, step, 2), "done");
});

test("ruin door blocks until the road order is solved", () => {
  const hit = collide(DOOR.x, DOOR.z, false);
  assert.ok(hit);
  assert.ok(Math.abs(hit.z - DOOR.z) >= SHRINE_HALF - 1e-6);
  assert.equal(collide(DOOR.x, DOOR.z, true), null);
  const around = collide(DOOR.x + SHRINE_HW, DOOR.z + 1.4, false);
  assert.ok(around, "side wall stops a walk-around");
  assert.equal(collide(DOOR.x, DOOR.z + 12, false), null);
});

test("well sequence E-N-S-W is not mosaic N-E-S-W", () => {
  const step = { seq: [], done: false };
  assert.equal(push(WELL_ORDER, step, 0), "reset");
  assert.equal(push(WELL_ORDER, step, 1), "ok");
  assert.equal(push(WELL_ORDER, step, 0), "ok");
  assert.equal(push(WELL_ORDER, step, 2), "ok");
  assert.equal(push(WELL_ORDER, step, 3), "done");
});

test("cairn mixed diamond fails if you walk north-east-south-west", () => {
  const step = { seq: [], done: false };
  const keepNesw = [2, 0, 3, 1];
  assert.equal(push(CAIRN_ORDER, step, keepNesw[0]), "reset");
  assert.equal(push(CAIRN_ORDER, step, 1), "ok");
  assert.equal(push(CAIRN_ORDER, step, 3), "ok");
  assert.equal(push(CAIRN_ORDER, step, 2), "ok");
  assert.equal(push(CAIRN_ORDER, step, 0), "done");
});
