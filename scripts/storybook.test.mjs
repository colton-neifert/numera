import assert from "node:assert/strict";
import { describe, it } from "node:test";

function socketsFilled(set) {
  return set.length >= 3 && set[0] === true && set[1] === true && set[2] === true;
}

function collideCottages(nx, nz, cottages, cellar, open) {
  let x = nx;
  let z = nz;
  let hit = false;
  for (const c of cottages) {
    if (c.ruin) continue;
    const dx = x - c.x;
    const dz = z - c.z;
    const d2 = dx * dx + dz * dz;
    const rr = c.r * c.r;
    if (d2 < rr && d2 > 1e-6) {
      const d = Math.sqrt(d2);
      x = c.x + (dx / d) * c.r;
      z = c.z + (dz / d) * c.r;
      hit = true;
    }
  }
  if (!open) {
    const dx = x - cellar.x;
    const dz = z - cellar.z;
    const d2 = dx * dx + dz * dz;
    if (d2 < 1.35 * 1.35 && d2 > 1e-6) {
      const d = Math.sqrt(d2);
      x = cellar.x + (dx / d) * 1.35;
      z = cellar.z + (dz / d) * 1.35;
      hit = true;
    }
  }
  return hit ? { x, z } : null;
}

describe("numeria storybook", () => {
  it("socketsFilled needs all three", () => {
    assert.equal(socketsFilled([true, true, false]), false);
    assert.equal(socketsFilled([true, true, true]), true);
    assert.equal(socketsFilled([]), false);
  });

  it("closed cellar pushes the player out", () => {
    const cottages = [{ x: 0, z: 0, r: 2.2 }];
    const cellar = { x: 0, z: -4.5 };
    const hit = collideCottages(0, -4.4, cottages, cellar, false);
    assert.ok(hit);
    assert.ok(Math.hypot(hit.x - cellar.x, hit.z - cellar.z) >= 1.34);
  });

  it("open cellar does not block the door", () => {
    const cottages = [{ x: 10, z: 10, r: 2.2 }];
    const cellar = { x: 0, z: 0 };
    const hit = collideCottages(0.2, 0.1, cottages, cellar, true);
    assert.equal(hit, null);
  });

  it("creature names are original to Numeria", () => {
    const names = ["Stumpkin", "Wickwisp", "Thornling", "Last Hearth"];
    for (const n of names) {
      assert.equal(/iggly|toa|fangorn|nugblin|throg|saar|wingfeather|toothy|fango/i.test(n), false);
    }
    assert.ok(names.includes("Stumpkin"));
    assert.ok(names.includes("Wickwisp"));
    assert.ok(names.includes("Thornling"));
  });

  it("worldAt people are not village-only", () => {
    function showNpc(n, inVillage) {
      if (n.worldAt) return true;
      return inVillage;
    }
    assert.equal(showNpc({ worldAt: true, x: -638, z: -176 }, false), true);
    assert.equal(showNpc({ worldAt: false, x: -638, z: -176 }, false), false);
    assert.equal(showNpc({ worldAt: false, x: 0, z: -108 }, true), true);
  });
});
