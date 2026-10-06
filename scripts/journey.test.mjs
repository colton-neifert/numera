import { test } from "node:test";
import assert from "node:assert/strict";

const RANK = ["home", "vale", "strange", "hollow", "river", "woods", "peak", "mire", "keep", "far", "last"];

function chapterOf(s) {
  const c = s.cleared ?? [];
  if (c.includes("vault") || c.includes("echo")) return "last";
  if (["echo", "ridge", "spire", "fen", "hollow", "vault"].some((w) => c.includes(w))) return "last";
  if (["grove", "crater", "lake", "grave", "waste"].some((w) => c.includes(w))) return "far";
  if (c.includes("keep") || (s.gemsPlaced ?? []).length >= 3) return "keep";
  if (s.gems?.emerald && s.gems?.ruby && s.gems?.sapphire) return "keep";
  if (c.includes("marsh") || s.gems?.sapphire || (s.places ?? []).includes("mirefen")) return "mire";
  if (s.claws || (s.places ?? []).includes("summit") || (s.places ?? []).includes("stoneback")) return "peak";
  if ((s.places ?? []).includes("whisperwood") || (s.places ?? []).includes("quiet-hollow") || c.includes("grove")) return "woods";
  if ((s.places ?? []).includes("silverrun")) return "river";
  if (c.includes("cavern") || s.hasSling || s.gems?.emerald || (s.places ?? []).includes("cavern")) return "hollow";
  if ((s.cipherN ?? 0) >= 1) return "strange";
  if (s.leftHome || (s.places ?? []).includes("oakstead") || (s.places ?? []).includes("vale")) return "vale";
  return "home";
}

function nextRoad(s) {
  if (!s.leftHome && s.house === "yours") return "Eat. Then the ladder.";
  if (!s.hasSword) return "Ash";
  if ((s.cipherN ?? 0) < 1) return "cloth";
  if (!s.gems?.emerald && !(s.cleared ?? []).includes("cavern")) return "dark mouth";
  if (!(s.places ?? []).includes("lookout") && !(s.places ?? []).includes("silverrun")) return "lookout";
  if (!s.gems?.sapphire) return "wet hole";
  if (!s.gems?.ruby) return "crag";
  if ((s.gemsPlaced ?? []).length < 3) return "castle";
  return "far";
}

const blank = {
  house: null,
  leftHome: false,
  cipherN: 0,
  cleared: [],
  gems: {},
  gemsPlaced: [],
  hasSword: false,
  hasSling: false,
  hasHorse: false,
  claws: false,
  places: [],
  quests: {},
};

test("new save starts at home", () => {
  assert.equal(chapterOf({ ...blank, house: "yours" }), "home");
});

test("leaving home opens the vale chapter", () => {
  assert.equal(chapterOf({ ...blank, leftHome: true }), "vale");
});

test("first cipher is the strange chapter", () => {
  assert.equal(chapterOf({ ...blank, leftHome: true, cipherN: 1 }), "strange");
});

test("sun hollow is the first real dungeon chapter", () => {
  assert.equal(chapterOf({ ...blank, leftHome: true, cipherN: 2, hasSling: true }), "hollow");
  assert.equal(chapterOf({ ...blank, cleared: ["cavern"], gems: { emerald: true } }), "hollow");
});

test("visiting the river or woods is a later chapter than the cave", () => {
  const river = chapterOf({ ...blank, places: ["silverrun"], gems: { emerald: true } });
  const woods = chapterOf({ ...blank, places: ["whisperwood"], gems: { emerald: true } });
  assert.equal(river, "river");
  assert.equal(woods, "woods");
  assert.ok(RANK.indexOf(woods) > RANK.indexOf("hollow"));
});

test("three jewels point at the castle", () => {
  assert.equal(
    chapterOf({
      ...blank,
      gems: { emerald: true, ruby: true, sapphire: true },
    }),
    "keep",
  );
});

test("far countries come after the keep", () => {
  assert.equal(chapterOf({ ...blank, cleared: ["keep", "grove"] }), "far");
});

test("the last hall is the last chapter", () => {
  assert.equal(chapterOf({ ...blank, cleared: ["keep", "grove", "echo"] }), "last");
});

test("chapters only move forward", () => {
  let s = { ...blank, house: "yours" };
  const seen = [];
  seen.push(chapterOf(s));
  s = { ...s, leftHome: true, house: null };
  seen.push(chapterOf(s));
  s = { ...s, cipherN: 1 };
  seen.push(chapterOf(s));
  s = { ...s, hasSling: true };
  seen.push(chapterOf(s));
  s = { ...s, places: ["silverrun"] };
  seen.push(chapterOf(s));
  s = { ...s, places: ["silverrun", "whisperwood"] };
  seen.push(chapterOf(s));
  s = { ...s, claws: true };
  seen.push(chapterOf(s));
  s = { ...s, gems: { emerald: true, ruby: true, sapphire: true } };
  seen.push(chapterOf(s));
  s = { ...s, cleared: ["keep"] };
  seen.push(chapterOf(s));
  s = { ...s, cleared: ["keep", "grove"] };
  seen.push(chapterOf(s));
  s = { ...s, cleared: ["keep", "grove", "echo"] };
  seen.push(chapterOf(s));
  for (let i = 1; i < seen.length; i++) {
    assert.ok(RANK.indexOf(seen[i]) >= RANK.indexOf(seen[i - 1]), `${seen[i - 1]} -> ${seen[i]}`);
  }
});

test("the next road starts small", () => {
  assert.match(nextRoad({ ...blank, house: "yours" }), /ladder/i);
  assert.match(nextRoad({ ...blank, leftHome: true, house: null }), /Ash/);
  assert.match(nextRoad({ ...blank, leftHome: true, hasSword: true }), /cloth/);
  assert.match(nextRoad({ ...blank, leftHome: true, hasSword: true, cipherN: 1 }), /dark mouth/);
});
