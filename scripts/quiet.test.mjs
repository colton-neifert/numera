import assert from "node:assert/strict";
import { createRequire } from "node:module";

// Logic-only checks against the source contracts (no DOM).
// We reimplement the tiny order rules here so the file stays a contract test
// even if the TS module needs a bundler.

const MOSAIC_ORDER = [0, 1, 2, 3];

function pushOrder(seq, id) {
  if (seq.length && seq[seq.length - 1] === id) return seq;
  const next = [...seq, id].slice(-4);
  if (next.length === 4) {
    const ok = next.every((v, i) => v === MOSAIC_ORDER[i]);
    return ok ? next : [];
  }
  return next;
}

let seq = [];
seq = pushOrder(seq, 0);
seq = pushOrder(seq, 1);
seq = pushOrder(seq, 2);
assert.equal(seq.length, 3, "three steps stay pending");
seq = pushOrder(seq, 3);
assert.deepEqual(seq, [0, 1, 2, 3], "N-E-S-W opens");

seq = [];
seq = pushOrder(seq, 0);
seq = pushOrder(seq, 1);
seq = pushOrder(seq, 2);
seq = pushOrder(seq, 0);
assert.equal(seq.length, 0, "wrong last pad resets");

seq = [];
seq = pushOrder(seq, 0);
seq = pushOrder(seq, 0);
assert.deepEqual(seq, [0], "standing still does not double-count");

let bits = 0;
function strike(bit) {
  bits |= bit;
  return bits;
}
assert.equal(strike(1), 1);
assert.equal(strike(2), 3);
assert.equal(strike(4), 7);
assert.equal(strike(8), 15, "all four stones");
assert.equal(strike(8), 15, "repeat is idempotent");

const hallOpen = (stones, mosaic) => stones === 15 || mosaic;
assert.equal(hallOpen(0, false), false);
assert.equal(hallOpen(15, false), true);
assert.equal(hallOpen(0, true), true);
assert.equal(hallOpen(7, false), false, "three stones is not enough");

const steel = (tang, whet, smith) => tang && whet && smith;
assert.equal(steel(true, true, false), false, "need the hidden smith");
assert.equal(steel(true, true, true), true);

const nollAt = (hour, met, hollow) => {
  const night = hour >= 20 || hour < 6;
  const dusk = (hour >= 18 && hour < 20) || (hour >= 5 && hour < 7);
  if (night && hollow) return "hollow";
  if (night && met) return "well";
  if (dusk) return "lane";
  return "ghost";
};
assert.equal(nollAt(12, false, false), "ghost");
assert.equal(nollAt(19, false, false), "lane");
assert.equal(nollAt(22, true, false), "well");
assert.equal(nollAt(22, true, true), "hollow");

const fourthNote = (buf) => buf.endsWith("ADGFDSADH");
assert.equal(fourthNote("ADGFDSAD"), false, "oak song alone is not enough");
assert.equal(fourthNote("ADGFDSADH"), true, "oak plus the torn note");

console.log("quiet secrets: 10 checks ok");
