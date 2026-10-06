import assert from "node:assert/strict";
import { describe, it } from "node:test";

function radialDeadzone(x, y, dz = 0.18) {
  const m = Math.hypot(x, y);
  if (m < dz) return { x: 0, y: 0 };
  const scale = ((m - dz) / (1 - dz)) / m;
  return { x: x * scale, y: y * scale };
}

function padMoveFromStick(lx, ly) {
  const s = radialDeadzone(lx, ly, 0.18);
  return { steer: -s.x, throttle: -s.y };
}

function padLookFromStick(rx) {
  const s = radialDeadzone(rx, 0, 0.22);
  return -s.x;
}

describe("xbox pad mapping", () => {
  it("deadzone kills stick noise", () => {
    const s = radialDeadzone(0.05, 0.04, 0.18);
    assert.equal(s.x, 0);
    assert.equal(s.y, 0);
  });

  it("full left stick still reaches 1 after remap", () => {
    const s = radialDeadzone(-1, 0, 0.18);
    assert.ok(Math.abs(s.x + 1) < 1e-6);
  });

  it("stick left is player-visible left (+steer, same as A)", () => {
    const m = padMoveFromStick(-1, 0);
    assert.ok(m.steer > 0.9, `steer ${m.steer}`);
  });

  it("stick up is forward (+throttle, same as W)", () => {
    const m = padMoveFromStick(0, -1);
    assert.ok(m.throttle > 0.9, `throttle ${m.throttle}`);
  });

  it("right stick right looks right (negative look, same as T)", () => {
    const look = padLookFromStick(1);
    assert.ok(look < -0.7, `look ${look}`);
  });

  it("standard xbox button indices", () => {
    const PAD = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, VIEW: 8, MENU: 9 };
    assert.equal(PAD.A, 0);
    assert.equal(PAD.X, 2);
    assert.equal(PAD.RB, 5);
    assert.equal(PAD.MENU, 9);
  });
});
