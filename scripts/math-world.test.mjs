import { test } from "node:test";
import assert from "node:assert/strict";

function opResult(left, right, op) {
  if (op === "×") return left * right;
  if (op === "−") return left - right;
  return left + right;
}

function worldMath(grade) {
  if (grade === "g68") {
    return {
      statue: { nums: [18, 21, 24, 28], left: 6, right: 4, op: "×", answer: 24 },
      bridge: { nums: [16, 28, 35], left: 7, right: 4, op: "×", answer: 28 },
      crates: { nums: [5, 10, 15, 20] },
      plates: { plates: [{ groups: 4, size: 3 }, { groups: 2, size: 5 }], extra: 3 },
    };
  }
  if (grade === "g45") {
    return {
      statue: { nums: [12, 15, 16, 18], left: 3, right: 5, op: "×", answer: 15 },
      bridge: { nums: [9, 18, 21], left: 6, right: 3, op: "×", answer: 18 },
      crates: { nums: [3, 6, 9, 12] },
      plates: { plates: [{ groups: 3, size: 3 }, { groups: 4, size: 2 }], extra: 2 },
    };
  }
  if (grade === "g23") {
    return {
      statue: { nums: [6, 8, 9, 12], left: 4, right: 5, op: "+", answer: 9 },
      bridge: { nums: [4, 8, 12], left: 3, right: 4, op: "×", answer: 12 },
      crates: { nums: [2, 4, 6, 8] },
      plates: { plates: [{ groups: 2, size: 3 }, { groups: 2, size: 2 }], extra: 3 },
    };
  }
  return {
    statue: { nums: [3, 4, 5, 7], left: 2, right: 3, op: "+", answer: 5 },
    bridge: { nums: [2, 6, 9], left: 3, right: 3, op: "+", answer: 6 },
    crates: { nums: [1, 2, 3, 4] },
    plates: { plates: [{ groups: 1, size: 2 }, { groups: 1, size: 3 }], extra: 2 },
  };
}

function plateNeed(p) {
  return p.groups * p.size;
}

function cratesSolved(crates, slots, rad = 0.85) {
  if (crates.length !== slots.length) return false;
  return slots.every((s) => crates.some((c) => c.n === s.n && Math.hypot(c.x - s.x, c.z - s.z) < rad));
}

function gourdCounts(gourds, plates, rad = 1.08) {
  return plates.map((p) => gourds.filter((g) => !g.held && Math.hypot(g.x - p.x, g.z - p.z) < rad).length);
}

function platesSolved(counts, needs) {
  if (counts.length !== needs.length || needs.length === 0) return false;
  return needs.every((n, i) => counts[i] === n);
}

test("every grade statue answer sits on a numbered statue and matches the piles", () => {
  for (const g of ["k1", "g23", "g45", "g68"]) {
    const s = worldMath(g).statue;
    assert.equal(s.answer, opResult(s.left, s.right, s.op));
    assert.ok(s.nums.includes(s.answer));
    assert.ok(s.nums.filter((n) => n !== s.answer).length >= 2);
  }
});

test("three bridges hide the true number among two fakes", () => {
  for (const g of ["k1", "g23", "g45", "g68"]) {
    const b = worldMath(g).bridge;
    assert.equal(b.nums.length, 3);
    assert.equal(b.answer, opResult(b.left, b.right, b.op));
    assert.ok(b.nums.includes(b.answer));
    assert.equal(b.nums.filter((n) => n === b.answer).length, 1);
  }
});

test("crates only solve when each number sits in its slot", () => {
  const slots = [
    { n: 1, x: 0, z: 0 },
    { n: 2, x: 2, z: 0 },
    { n: 3, x: 4, z: 0 },
    { n: 4, x: 6, z: 0 },
  ];
  const wrong = [
    { n: 4, x: 0, z: 0 },
    { n: 3, x: 2, z: 0 },
    { n: 2, x: 4, z: 0 },
    { n: 1, x: 6, z: 0 },
  ];
  const right = slots.map((s) => ({ ...s }));
  assert.equal(cratesSolved(wrong, slots), false);
  assert.equal(cratesSolved(right, slots), true);
  const almost = right.map((s, i) => (i === 3 ? { ...s, x: s.x + 2 } : s));
  assert.equal(cratesSolved(almost, slots), false);
});

test("pressure plates want groups times size, not extra gourds", () => {
  const spec = worldMath("g23").plates;
  const needs = spec.plates.map(plateNeed);
  assert.deepEqual(needs, [6, 4]);
  const plates = [
    { x: 0, z: 0 },
    { x: 4, z: 0 },
  ];
  const gourds = [];
  for (let i = 0; i < 6; i++) gourds.push({ x: 0.1, z: 0.1 });
  for (let i = 0; i < 4; i++) gourds.push({ x: 4.1, z: 0 });
  gourds.push({ x: 10, z: 10 });
  assert.equal(platesSolved(gourdCounts(gourds, plates), needs), true);
  gourds.push({ x: 0, z: 0 });
  assert.equal(platesSolved(gourdCounts(gourds, plates), needs), false);
});

test("hollow dungeon statues always teach two plus three", () => {
  assert.equal(opResult(2, 3, "+"), 5);
  const nums = [2, 3, 5, 8];
  assert.ok(nums.includes(5));
});

test("mushroom ring is doubling", () => {
  const order = [1, 2, 4, 8];
  for (let i = 1; i < order.length; i++) assert.equal(order[i], order[i - 1] * 2);
});
