import assert from "node:assert/strict";
import { test } from "node:test";

const PATH = [
  { x: 96, z: -348, kind: "walk" },
  { x: 210, z: -300, kind: "walk" },
  { x: 400, z: -92, kind: "walk" },
  { x: 680, z: -66, kind: "swim" },
  { x: 1070, z: 44, kind: "swim" },
  { x: -110, z: 888, kind: "hide" },
  { x: -420, z: 240, kind: "walk" },
];

function wrap(i, n) {
  return ((i % n) + n) % n;
}

function step(state, dt, spd = 6.35) {
  if (state.mode === "hide") {
    state.hideT -= dt;
    if (state.hideT <= 0) {
      state.i = wrap(state.i + 1, PATH.length);
      state.u = 0;
      state.mode = PATH[state.i].kind === "swim" ? "swim" : "walk";
      state.hideT = 0;
      state.emerge = true;
    }
    return state;
  }
  const a = PATH[state.i];
  const b = PATH[wrap(state.i + 1, PATH.length)];
  const span = Math.hypot(b.x - a.x, b.z - a.z) || 1;
  state.u += (spd * dt) / span;
  if (state.u >= 1) {
    state.u -= 1;
    state.i = wrap(state.i + 1, PATH.length);
    if (PATH[state.i].kind === "hide") {
      state.mode = "hide";
      state.hideT = 72;
      state.u = 0;
    } else {
      state.mode = PATH[state.i].kind === "swim" ? "swim" : "walk";
    }
  }
  const pa = PATH[state.i];
  const pb = PATH[wrap(state.i + 1, PATH.length)];
  state.x = pa.x + (pb.x - pa.x) * state.u;
  state.z = pa.z + (pb.z - pa.z) * state.u;
  return state;
}

function collide(sx, sz, x, z, mode) {
  if (mode === "hide") return null;
  const dx = x - sx;
  const dz = z - sz;
  const d = Math.hypot(dx, dz);
  const r = mode === "swim" ? 10.4 : 13.2;
  if (d >= r || d < 0.0001) return null;
  const u = r / d;
  return { x: sx + dx * u, z: sz + dz * u };
}

test("circuit visits vale, water, and a hide", () => {
  assert.equal(PATH[0].kind, "walk");
  assert.ok(PATH.some((p) => p.kind === "swim"), "swims the river");
  assert.ok(PATH.some((p) => p.kind === "hide"), "vanishes behind the peak");
  assert.ok(PATH[0].z < -200, "starts south of town");
});

test("walking advances along the first ridge", () => {
  const s = { i: 0, u: 0, x: PATH[0].x, z: PATH[0].z, mode: "walk", hideT: 0, emerge: false };
  step(s, 20);
  assert.ok(s.x > PATH[0].x, "moves east along the vale");
  assert.equal(s.mode, "walk");
});

test("hide then emerge at the next land", () => {
  const hideI = PATH.findIndex((p) => p.kind === "hide");
  const s = { i: hideI, u: 0, x: PATH[hideI].x, z: PATH[hideI].z, mode: "hide", hideT: 2, emerge: false };
  step(s, 1);
  assert.equal(s.mode, "hide");
  step(s, 2);
  assert.equal(s.mode, "walk");
  assert.equal(s.i, wrap(hideI + 1, PATH.length));
  assert.equal(s.emerge, true);
});

test("body pushes the player out", () => {
  const hit = collide(0, 0, 1, 0, "walk");
  assert.ok(hit);
  assert.ok(Math.abs(Math.hypot(hit.x, hit.z) - 13.2) < 0.05);
  assert.equal(collide(0, 0, 1, 0, "hide"), null);
});

test("four pits, last one scraped — story contract", () => {
  const pits = ["cut", "cut", "cut", "blank"];
  assert.equal(pits.filter((p) => p === "cut").length, 3);
  assert.equal(pits[3], "blank");
});
