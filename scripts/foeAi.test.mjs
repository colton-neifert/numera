import assert from "node:assert/strict";
import { describe, it } from "node:test";

function styleOf(kind) {
  if (kind === "timesprout") return "circle";
  if (kind === "driplet" || kind === "emberling") return "lunge";
  if (kind === "glyphite" || kind === "warden") return "guard";
  if (kind === "sandwight" || kind === "umbral") return "skitter";
  return "rush";
}

function villageSafe(foeX, foeZ, heroX, heroZ, inV) {
  return inV(foeX, foeZ) || inV(heroX, heroZ);
}

function hitKnock(dx, dz, d, power = 7.6) {
  const n = Math.max(0.001, d);
  return { vx: -(dx / n) * power, vz: -(dz / n) * power, t: 0.3 };
}

function stepFoe(s, opt) {
  const dt = opt.dt;
  const dx = opt.hx - s.x;
  const dz = opt.hz - s.z;
  const d = Math.hypot(dx, dz);
  if (opt.safe) {
    s.aggro = false;
    s.pose = "walk";
    return s;
  }
  if (d < 13.6) s.aggro = true;
  if (d > 22) s.aggro = false;
  if (!s.aggro) {
    s.pose = "walk";
    return s;
  }
  if (opt.style === "lunge") {
    s.lungeT -= dt;
    if (s.lungeT <= 0) s.lungeT = 1.42;
    s.pose = s.lungeT > 0.95 ? "hiss" : "chase";
    return s;
  }
  if (opt.style === "guard") {
    s.pose = d < 2.6 ? "chase" : "guard";
    return s;
  }
  const n = Math.max(0.001, d);
  s.x += (dx / n) * 2.45 * dt * opt.hunt;
  s.z += (dz / n) * 2.45 * dt * opt.hunt;
  s.pose = d < 4.2 ? "chase" : "walk";
  return s;
}

const VX = 0;
const VZ = -108;
const VR = 80;
const inVillage = (x, z) => Math.hypot(x - VX, z - VZ) < VR;

describe("foe manners", () => {
  it("kinds keep different styles", () => {
    assert.equal(styleOf("plusling"), "rush");
    assert.equal(styleOf("timesprout"), "circle");
    assert.equal(styleOf("driplet"), "lunge");
    assert.equal(styleOf("glyphite"), "guard");
    assert.equal(styleOf("sandwight"), "skitter");
    assert.equal(styleOf("emberling"), "lunge");
    assert.equal(styleOf("umbral"), "skitter");
  });

  it("oakstead lizards do not aggro", () => {
    const s = { x: 10, z: -100, yaw: 0, pose: "walk", aggro: true, patrolT: 0, lungeT: 0 };
    stepFoe(s, {
      style: "rush",
      dt: 0.16,
      hx: 4,
      hz: -104,
      seed: 1,
      playT: 2,
      homeX: 10,
      homeZ: -100,
      safe: villageSafe(s.x, s.z, 4, -104, inVillage),
      hide: false,
      hunt: 1,
    });
    assert.equal(s.aggro, false);
  });

  it("meadow-e0 and e1 sit outside the square", () => {
    assert.equal(inVillage(142, -42), false);
    assert.equal(inVillage(-148, -36), false);
    assert.equal(inVillage(18, -40), true);
    assert.equal(inVillage(-16, -38), true);
  });

  it("a hit knocks the lizard away from the hero", () => {
    const k = hitKnock(4, 0, 4, 8);
    assert.ok(k.vx < -7);
    assert.ok(Math.abs(k.vz) < 1e-9);
    assert.ok(k.t > 0.2);
  });

  it("rush closes distance, lunge winds up", () => {
    const rush = { x: 0, z: 0, yaw: 0, pose: "walk", aggro: false, patrolT: 0, lungeT: 0 };
    stepFoe(rush, {
      style: "rush",
      dt: 0.2,
      hx: 8,
      hz: 0,
      seed: 0,
      playT: 1,
      homeX: 0,
      homeZ: 0,
      safe: false,
      hide: false,
      hunt: 1,
    });
    assert.ok(rush.x > 0.3);
    const lunge = { x: 0, z: 0, yaw: 0, pose: "walk", aggro: false, patrolT: 0, lungeT: 1.2 };
    stepFoe(lunge, {
      style: "lunge",
      dt: 0.05,
      hx: 6,
      hz: 0,
      seed: 2,
      playT: 1,
      homeX: 0,
      homeZ: 0,
      safe: false,
      hide: false,
      hunt: 1,
    });
    assert.equal(lunge.pose, "hiss");
  });
});

function sunDir(t) {
  const ang = ((t - 6) / 12) * Math.PI;
  return { x: Math.cos(ang), y: Math.max(0.06, Math.sin(ang)), z: 0.22 };
}

function sunShadowTip(len, t) {
  const s = sunDir(t);
  const reach = len * (0.18 / Math.max(0.18, s.y));
  return { x: -s.x * reach, z: -s.z * reach };
}

describe("sundial", () => {
  it("dusk sun is west so the shadow walks east", () => {
    const dusk = sunDir(18);
    assert.ok(dusk.x < -0.8);
    const tip = sunShadowTip(6.6, 18);
    assert.ok(tip.x > 5.5, `shadow ${tip.x}`);
    assert.ok(Math.hypot(tip.x - 6.6, tip.z + 1.45) < 1.55);
  });

  it("noon sun is high so the shadow is short", () => {
    const noon = sunDir(12);
    assert.ok(noon.y > 0.9);
  });
});
