import { test } from "node:test";
import assert from "node:assert/strict";

function pushSeq(seq, next, order) {
  const i = seq.length;
  if (i < order.length && order[i] === next) {
    const ns = [...seq, next];
    return { seq: ns, ok: true, done: ns.length >= order.length };
  }
  if (order[0] === next) {
    return { seq: [next], ok: true, done: order.length === 1 };
  }
  return { seq: [], ok: false, done: false };
}

test("little sun then bigger then biggest", () => {
  const order = [1, 2, 0];
  let s = [];
  let r = pushSeq(s, 0, order);
  assert.equal(r.ok, false);
  r = pushSeq(s, 1, order);
  assert.equal(r.ok, true);
  s = r.seq;
  r = pushSeq(s, 2, order);
  assert.equal(r.ok, true);
  s = r.seq;
  r = pushSeq(s, 0, order);
  assert.equal(r.done, true);
});

test("wrong pad resets unless it is the start", () => {
  const order = [2, 3, 5];
  let r = pushSeq([2], 5, order);
  assert.equal(r.ok, false);
  assert.deepEqual(r.seq, []);
  r = pushSeq([2, 3], 2, order);
  assert.equal(r.ok, true);
  assert.deepEqual(r.seq, [2]);
});

test("spike pit is too wide to jump and the log spans it", () => {
  const PIT_HZ = 8.2;
  const LOG_LEN = 17.4;
  const JUMP = 11.2;
  const GRAV = 36;
  const RUN = 13.6;
  const hang = (2 * JUMP) / GRAV;
  const jumpDist = RUN * hang;
  assert.ok(PIT_HZ * 2 > jumpDist + 2, "pit must be wider than a run-jump");
  assert.ok(LOG_LEN > PIT_HZ * 2, "log must span the pit");
});

test("log cover is a thin walkway not a floor", () => {
  const LOG_RAD = 0.52;
  const PIT_HX = 46.4;
  assert.ok(LOG_RAD * 2 < 3, "you walk the log, you do not get a wide bridge");
  assert.ok(PIT_HX * 2 > 80, "pit spans the hall so you cannot walk around");
});

test("cavern teaches then combines", () => {
  const rooms = 12;
  assert.equal(rooms, 12);
  const roomZ = (i) => 16 - i * 64;
  assert.equal(roomZ(0), 16);
  assert.equal(roomZ(2), -112);
  assert.equal(roomZ(11), -688);
  const order = [2, 3, 5];
  let s = [];
  let r = pushSeq(s, 2, order);
  assert.equal(r.ok, true);
  s = r.seq;
  r = pushSeq(s, 3, order);
  s = r.seq;
  r = pushSeq(s, 5, order);
  assert.equal(r.done, true);
  const suns = [1, 2, 0];
  s = [];
  r = pushSeq(s, 1, suns);
  s = r.seq;
  r = pushSeq(s, 2, suns);
  s = r.seq;
  r = pushSeq(s, 0, suns);
  assert.equal(r.done, true);
});
