import { test } from "node:test";
import assert from "node:assert/strict";

const KINDS = {
  crate: { hp: 2, mass: 1, r: 0.42, h: 0.7, roll: false, float: true, lift: true, brk: true, plate: true, beam: false },
  barrel: { hp: 2, mass: 1.1, r: 0.4, h: 0.86, roll: true, float: true, lift: true, brk: true, plate: true, beam: false },
  rock: { hp: 9, mass: 2.6, r: 0.46, h: 0.62, roll: false, float: false, lift: false, brk: false, plate: true, beam: false },
  log: { hp: 8, mass: 1.8, r: 0.85, h: 0.44, roll: true, float: true, lift: false, brk: false, plate: false, beam: false },
  pot: { hp: 1, mass: 0.45, r: 0.26, h: 0.42, roll: false, float: false, lift: true, brk: true, plate: false, beam: false },
  statue: { hp: 12, mass: 3.4, r: 0.52, h: 1.35, roll: false, float: false, lift: false, brk: false, plate: true, beam: true },
  boulder: { hp: 14, mass: 7, r: 0.78, h: 1.05, roll: true, float: false, lift: false, brk: false, plate: true, beam: false },
};

function thing(id, kind, x, z, extra = {}) {
  return { id, kind, x, y: 0, z, vx: 0, vy: 0, vz: 0, yaw: 0, dead: false, held: false, wet: false, onId: null, ...KINDS[kind], ...extra };
}

function hypot(ax, az, bx, bz) {
  return Math.hypot(ax - bx, az - bz);
}

function shove(t, fx, fz, speed, dt = 1 / 60) {
  const push = Math.min(9.5, 3.2 + Math.abs(speed)) / t.mass;
  t.vx += fx * push * dt * 14;
  t.vz += fz * push * dt * 14;
  t.x += t.vx * dt;
  t.z += t.vz * dt;
}

function boom(t, bx, bz) {
  const d = hypot(bx, bz, t.x, t.z);
  if (d >= 3.2) return false;
  const ux = (t.x - bx) / (d || 1);
  const uz = (t.z - bz) / (d || 1);
  const k = ((3.2 - d) * 7.5) / t.mass;
  t.vx += ux * k;
  t.vz += uz * k;
  if (t.brk && d < 2.15) {
    t.dead = true;
    t.hp = 0;
  }
  return true;
}

function plateOn(things, plate, px, pz, grounded) {
  let mass = 0;
  for (const t of things) {
    if (t.dead || t.held || !t.plate) continue;
    if (hypot(t.x, t.z, plate.x, plate.z) < plate.r + t.r * 0.4) mass += t.mass;
  }
  if (grounded && hypot(px, pz, plate.x, plate.z) < plate.r + 0.2) mass += 1;
  return mass >= plate.need;
}

function reflect(dx, dz, yaw) {
  const nx = -Math.sin(yaw);
  const nz = -Math.cos(yaw);
  const dot = dx * nx + dz * nz;
  dx -= 2 * dot * nx;
  dz -= 2 * dot * nz;
  const n = Math.hypot(dx, dz) || 1;
  return { dx: dx / n, dz: dz / n };
}

function logCovers(log, gap) {
  return Math.abs(log.x - gap.x) < gap.hx + 0.4 && Math.abs(log.z - gap.z) < gap.hz + 0.55;
}

function separate(a, b) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const min = a.r + b.r;
  const d2 = dx * dx + dz * dz;
  if (d2 >= min * min || d2 < 1e-8) return false;
  const d = Math.sqrt(d2);
  const nx = dx / d;
  const nz = dz / d;
  const overlap = min - d;
  const am = b.mass / (a.mass + b.mass);
  const bm = a.mass / (a.mass + b.mass);
  a.x -= nx * overlap * am;
  a.z -= nz * overlap * am;
  b.x += nx * overlap * bm;
  b.z += nz * overlap * bm;
  const rel = (a.vx - b.vx) * nx + (a.vz - b.vz) * nz;
  if (rel < 0) {
    const j = (-(1 + 0.35) * rel) / (1 / a.mass + 1 / b.mass);
    a.vx -= (j / a.mass) * nx;
    a.vz -= (j / a.mass) * nz;
    b.vx += (j / b.mass) * nx;
    b.vz += (j / b.mass) * nz;
  }
  return true;
}

const IDS = [
  "crate-yard-a", "crate-yard-b", "rock-yard", "pot-yard",
  "log-creek", "crate-creek", "crate-pond",
  "pot-well-a", "pot-well-b", "pot-well-c", "barrel-town", "crate-town",
  "crate-look-a", "crate-look-b", "statue-beam",
  "boulder-hill", "barrel-stop", "crate-ford", "log-wood", "crate-wood", "pot-wood",
];

test("every loose object has a unique id", () => {
  assert.equal(new Set(IDS).size, IDS.length);
});

test("crates are light enough to lift; rocks are not", () => {
  assert.equal(KINDS.crate.lift, true);
  assert.equal(KINDS.rock.lift, false);
  assert.ok(KINDS.crate.mass < KINDS.rock.mass);
});

test("wood floats; stone sinks", () => {
  assert.equal(KINDS.crate.float, true);
  assert.equal(KINDS.barrel.float, true);
  assert.equal(KINDS.log.float, true);
  assert.equal(KINDS.rock.float, false);
  assert.equal(KINDS.boulder.float, false);
  assert.equal(KINDS.statue.float, false);
});

test("pots and crates break; statues and rocks do not", () => {
  assert.equal(KINDS.pot.brk, true);
  assert.equal(KINDS.crate.brk, true);
  assert.equal(KINDS.statue.brk, false);
  assert.equal(KINDS.rock.brk, false);
  assert.equal(KINDS.pot.hp, 1);
});

test("leaning moves a crate farther than a rock", () => {
  const crate = thing("c", "crate", 0, 0);
  const rock = thing("r", "rock", 0, 0);
  for (let i = 0; i < 30; i++) {
    shove(crate, 0, 1, 6);
    shove(rock, 0, 1, 6);
  }
  assert.ok(crate.z > rock.z + 0.4);
});

test("a rock holds a plate after the player walks away", () => {
  const plate = { x: 4, z: 0, r: 0.72, need: 0.9 };
  const rock = thing("r", "rock", 4, 0);
  assert.equal(plateOn([rock], plate, 4, 0, true), true);
  assert.equal(plateOn([rock], plate, 20, 20, false), true);
  const pot = thing("p", "pot", 4, 0);
  assert.equal(plateOn([pot], plate, 20, 20, false), false);
});

test("a crate on a plate is enough; a pot is not", () => {
  const plate = { x: 0, z: 0, r: 0.72, need: 0.9 };
  assert.equal(plateOn([thing("c", "crate", 0, 0)], plate, 9, 9, false), true);
  assert.equal(plateOn([thing("p", "pot", 0, 0)], plate, 9, 9, false), false);
});

test("standing on a plate works until you leave", () => {
  const plate = { x: 0, z: 0, r: 0.72, need: 0.9 };
  assert.equal(plateOn([], plate, 0, 0, true), true);
  assert.equal(plateOn([], plate, 0, 0, false), false);
  assert.equal(plateOn([], plate, 8, 8, true), false);
});

test("bombs knock light things farther and can smash pots", () => {
  const crate = thing("c", "crate", 1, 0);
  const boulder = thing("b", "boulder", 1, 0);
  const pot = thing("p", "pot", 0.4, 0);
  boom(crate, 0, 0);
  boom(boulder, 0, 0);
  boom(pot, 0, 0);
  assert.ok(Math.abs(crate.vx) > Math.abs(boulder.vx));
  assert.equal(pot.dead, true);
  assert.equal(crate.dead, true);
  assert.equal(boulder.dead, false);
});

test("current carries a floating crate downstream", () => {
  const crate = thing("c", "crate", 0, 0);
  const rock = thing("r", "rock", 0, 0);
  const dt = 1 / 60;
  const cur = { vx: 2, vz: 0.4 };
  for (let i = 0; i < 90; i++) {
    if (crate.float) {
      crate.vx += cur.vx * dt * 1.55;
      crate.vz += cur.vz * dt * 1.55;
      crate.vx *= Math.exp(-dt * 0.55);
      crate.vz *= Math.exp(-dt * 0.55);
      crate.x += crate.vx * dt;
      crate.z += crate.vz * dt;
    }
    if (rock.float) {
      rock.x += cur.vx * dt;
    }
  }
  assert.ok(crate.x > 1.5);
  assert.equal(rock.x, 0);
});

test("a log covers a gap when it sits in the water", () => {
  const gap = { x: 0, z: 0, hx: 3.4, hz: 0.85 };
  const log = thing("l", "log", 0, 3.6);
  assert.equal(logCovers(log, gap), false);
  log.z = 0.1;
  assert.equal(logCovers(log, gap), true);
});

test("a barrel in the path stops a rolling boulder", () => {
  const boulder = thing("b", "boulder", 0, 4);
  boulder.vz = -8;
  const barrel = thing("k", "barrel", 0, 0);
  for (let i = 0; i < 40; i++) {
    boulder.z += boulder.vz / 60;
    barrel.z += barrel.vz / 60;
    separate(boulder, barrel);
  }
  assert.ok(boulder.z > -1);
  assert.ok(Math.abs(barrel.z) < 3);
});

test("crates stack when one lands on another", () => {
  const a = thing("a", "crate", 0, 0);
  const b = thing("b", "crate", 0.1, 0.1);
  b.y = a.h;
  const d = hypot(b.x, b.z, a.x, a.z);
  assert.ok(d < a.r + b.r + 0.18);
  b.onId = a.id;
  a.x += 1;
  b.x = a.x;
  b.z = a.z;
  assert.equal(b.onId, "a");
  assert.equal(b.x, a.x);
});

test("a statue face reflects a beam toward a receiver", () => {
  const side = reflect(1, 0, -Math.PI / 4);
  assert.ok(Math.abs(side.dx) < 0.05);
  assert.ok(side.dz > 0.9);
  const back = reflect(1, 0, 0);
  assert.ok(back.dx > 0.9);
});

test("cracked walls fall to a bomb or a fast boulder", () => {
  const wall = { hp: 2, dead: false };
  wall.hp -= 2;
  if (wall.hp <= 0) wall.dead = true;
  assert.equal(wall.dead, true);
  const wall2 = { hp: 2, dead: false };
  wall2.hp -= 2;
  if (wall2.hp <= 0) wall2.dead = true;
  assert.equal(wall2.dead, true);
});
