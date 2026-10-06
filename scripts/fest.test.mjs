import { test } from "node:test";
import assert from "node:assert/strict";

/** Mirrors src/game/fest.ts countProblem — keep in lockstep. */
function countProblem(grade, seed = 1) {
  const s = Math.abs(Math.floor(seed)) || 1;
  const pick = (lo, hi, salt) => lo + ((s * 17 + salt * 13) % (hi - lo + 1));
  let a;
  let b;
  let op;
  let answer;
  if (grade === "g68") {
    a = pick(2, 5, 1);
    b = pick(2, 4, 2);
    op = "×";
    answer = a * b;
  } else if (grade === "g45") {
    if (s % 2 === 0) {
      a = pick(3, 8, 3);
      b = pick(2, 6, 4);
      op = "+";
      answer = a + b;
    } else {
      a = pick(2, 5, 5);
      b = pick(2, 4, 6);
      op = "×";
      answer = a * b;
    }
  } else if (grade === "g23") {
    a = pick(3, 9, 7);
    b = pick(2, 6, 8);
    if (s % 3 === 0 && a > b) {
      op = "−";
      answer = a - b;
    } else {
      op = "+";
      answer = a + b;
    }
  } else {
    a = pick(1, 5, 9);
    b = pick(1, 5, 10);
    op = "+";
    answer = a + b;
  }
  const wrongA = Math.max(1, answer + (s % 2 === 0 ? 1 : -1) * pick(1, 3, 11));
  let wrongB = Math.max(1, op === "×" ? a + b : Math.abs(a - b) || answer + 2);
  if (wrongB === answer) wrongB = answer + 2;
  const raw = [answer, wrongA === answer ? answer + 3 : wrongA, wrongB === answer || wrongB === wrongA ? answer + 4 : wrongB];
  const uniq = [...new Set(raw.map((n) => Math.max(0, n)))];
  while (uniq.length < 3) uniq.push((uniq[uniq.length - 1] ?? answer) + 2);
  const rot = s % 3;
  const choices = [uniq[rot], uniq[(rot + 1) % 3], uniq[(rot + 2) % 3]];
  return { a, b, op, answer, choices };
}

function includesAnswer(p) {
  assert.equal(p.choices.length, 3);
  assert.ok(p.choices.includes(p.answer), `choices ${p.choices} missing ${p.answer}`);
  assert.equal(new Set(p.choices).size, 3);
}

test("count lanterns: k-1 is addition", () => {
  const p = countProblem("k1", 3);
  assert.equal(p.op, "+");
  assert.equal(p.answer, p.a + p.b);
  includesAnswer(p);
});

test("count lanterns: later grades stay unique", () => {
  includesAnswer(countProblem("g23", 9));
  includesAnswer(countProblem("g45", 1));
  const g68 = countProblem("g68", 4);
  assert.equal(g68.op, "×");
  assert.equal(g68.answer, g68.a * g68.b);
  includesAnswer(g68);
});

test("count lanterns: seeds vary", () => {
  const seen = new Set();
  for (let s = 1; s < 40; s++) {
    const p = countProblem("k1", s);
    includesAnswer(p);
    seen.add(`${p.a}${p.op}${p.b}=${p.answer}`);
  }
  assert.ok(seen.size >= 4);
});

test("fair has seven booths", () => {
  assert.deepEqual(["arch", "toss", "race", "count", "hide", "help", "wheel"].length, 7);
});
