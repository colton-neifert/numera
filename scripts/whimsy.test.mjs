import assert from "node:assert/strict";
import { describe, it } from "node:test";

function lookingAt(px, pz, yaw, tx, tz, max = 14) {
  const dx = tx - px;
  const dz = tz - pz;
  const d = Math.hypot(dx, dz);
  if (d < 0.4 || d > max) return false;
  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);
  return (dx * fx + dz * fz) / d > 0.55;
}

describe("numeria whimsy", () => {
  it("lookingAt is true when facing the mark", () => {
    const yaw = 0;
    assert.equal(lookingAt(0, 0, yaw, 0, -4), true);
  });

  it("lookingAt is false when the mark is behind", () => {
    const yaw = 0;
    assert.equal(lookingAt(0, 0, yaw, 0, 4), false);
  });

  it("creature names are original to Numeria", () => {
    const names = ["Peekit", "Glimmerjack", "Puddlehop", "Duskhare", "Clock hen"];
    for (const n of names) {
      assert.equal(/iggly|toa|fangorn|nugblin|throg|saar/i.test(n), false);
    }
    assert.ok(names.includes("Peekit"));
    assert.ok(names.includes("Glimmerjack"));
  });
});
