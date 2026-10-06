import assert from "node:assert/strict";
import { describe, it } from "node:test";

function stepKindAt(x, z, opts) {
  if (opts.house) return "wood";
  if (opts.swim) return "water";
  if (Math.hypot(x, z - opts.keepZ) < 28) return "stone";
  if (opts.path > 0.18) return "dirt";
  return "grass";
}

function bowSpeed(draw) {
  const u = Math.max(0, Math.min(1, draw));
  return 12 + 22 * u * u;
}

function onKingRoad(x, z, half, road) {
  let best = Infinity;
  for (let i = 0; i < road.length - 1; i++) {
    const a = road[i];
    const b = road[i + 1];
    const abx = b[0] - a[0];
    const abz = b[1] - a[1];
    const len2 = abx * abx + abz * abz || 1;
    let t = ((x - a[0]) * abx + (z - a[1]) * abz) / len2;
    t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(x - (a[0] + abx * t), z - (a[1] + abz * t));
    if (d < best) best = d;
  }
  return best < half;
}

describe("king's road and living world", () => {
  const road = [
    [0, -90],
    [2, -56],
    [0, -20],
    [1, 28],
    [0, 74],
  ];

  it("the road from the village reaches the keep gate", () => {
    assert.equal(onKingRoad(0, -90, 8, road), true);
    assert.equal(onKingRoad(0, 74, 8, road), true);
    assert.equal(onKingRoad(80, 0, 8, road), false);
  });

  it("footsteps change with the ground", () => {
    assert.equal(stepKindAt(0, 0, { house: true, swim: false, path: 0, keepZ: 96 }), "wood");
    assert.equal(stepKindAt(0, 96, { house: false, swim: false, path: 0, keepZ: 96 }), "stone");
    assert.equal(stepKindAt(0, 0, { house: false, swim: true, path: 0, keepZ: 96 }), "water");
    assert.equal(stepKindAt(0, 0, { house: false, swim: false, path: 0.5, keepZ: 96 }), "dirt");
    assert.equal(stepKindAt(20, 0, { house: false, swim: false, path: 0, keepZ: 96 }), "grass");
  });

  it("a drawn bow is faster than a tap", () => {
    assert.ok(bowSpeed(1) > bowSpeed(0.2) + 10);
    assert.equal(bowSpeed(0), 12);
  });
});
