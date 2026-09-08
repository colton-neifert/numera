import { test } from "node:test";
import assert from "node:assert/strict";

function answersMatch(given, expected) {
  const a = given.trim().replace(/,/g, "").replace(/−/g, "-").replace(/\s+/g, "");
  const b = expected.trim().replace(/,/g, "").replace(/−/g, "-").replace(/\s+/g, "");
  if (!a) return false;
  if (a === b) return true;
  const na = Number(a);
  const nb = Number(b);
  if (Number.isFinite(na) && Number.isFinite(nb)) return Math.abs(na - nb) < 1e-6;
  return a.toLowerCase() === b.toLowerCase();
}

test("correct numeric answers match", () => {
  assert.equal(answersMatch("12", "12"), true);
  assert.equal(answersMatch("12.0", "12"), true);
  assert.equal(answersMatch(" 7 ", "7"), true);
});

test("incorrect answers do not match", () => {
  assert.equal(answersMatch("11", "12"), false);
  assert.equal(answersMatch("", "1"), false);
  assert.equal(answersMatch("abc", "12"), false);
});
