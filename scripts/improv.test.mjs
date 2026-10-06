import assert from "node:assert/strict";
import { describe, it } from "node:test";

function wedgeFree(rockX, rockZ, homeX, homeZ) {
  return Math.hypot(rockX - homeX, rockZ - homeZ) > 1.75;
}

function canFreeSnap(vine, rockX, rockZ, homeX, homeZ) {
  return vine && wedgeFree(rockX, rockZ, homeX, homeZ);
}

function logCovers(log, gap) {
  return Math.abs(log.x - gap.x) < gap.hx + 0.4 && Math.abs(log.z - gap.z) < gap.hz + 0.55;
}

function inGapBox(px, pz, x, z, hx, hz) {
  return Math.abs(px - x) < hx && Math.abs(pz - z) < hz;
}

describe("numeria improv puzzles", () => {
  const home = { x: 6.3, z: 6.5 };

  it("the log stays pinned until vines AND wedge are gone", () => {
    assert.equal(canFreeSnap(false, home.x, home.z, home.x, home.z), false);
    assert.equal(canFreeSnap(true, home.x, home.z, home.x, home.z), false);
    assert.equal(canFreeSnap(false, home.x + 3, home.z, home.x, home.z), false);
    assert.equal(canFreeSnap(true, home.x + 3, home.z, home.x, home.z), true);
  });

  it("a log parallel to the banks does not cover the gap", () => {
    const gap = { x: 0, z: 0, hx: 4.3, hz: 1.12 };
    const parallel = { x: 5.1, z: 6.4 };
    assert.equal(logCovers(parallel, gap), false);
  });

  it("a log on the gap covers it", () => {
    const gap = { x: 0, z: 0, hx: 4.3, hz: 1.12 };
    assert.equal(logCovers({ x: 0.2, z: 0.1 }, gap), true);
  });

  it("the mouth of the creek is the unbridged gap", () => {
    assert.equal(inGapBox(0, 0, 0, 0, 4.3, 1.12), true);
    assert.equal(inGapBox(0, 6, 0, 0, 4.3, 1.12), false);
  });

  it("never names the shove", () => {
    const lines = [
      "The water has a mouth. The other bank has a box.",
      "It does not even lean.",
      "Green cords let go. The bark is still sitting like it was planted.",
      "A stick is keeping a door in the water from being a door.",
      "A log on a tilt. Soft things are growing under one end.",
    ];
    for (const line of lines) {
      assert.equal(/push the log|roll the log into|place the log/i.test(line), false);
    }
  });
});
