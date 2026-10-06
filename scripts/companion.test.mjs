import { test } from "node:test";
import assert from "node:assert/strict";

function nimTalkLines(name, met, cipherN, dungeon = false, night = false) {
  if (!met) {
    return [
      {
        speaker: "Nim",
        text: `You are ${name}. The lamp said so. I have been in it long enough to listen.`,
        picks: [
          { label: "Who are you?" },
          { label: "You can come.", say: ["I can smell what the dirt is hiding. I can fit where you cannot. Ask. I will sit on a floor if it is heavy. I will not draw a map of it."] },
          { label: "Stay with Gran.", say: ["No. Roofs are boring. Bram can watch. I am worse at watching and better at coming."] },
        ],
      },
    ];
  }
  if (cipherN >= 8) {
    return [
      { speaker: "Nim", text: `You are collecting the leftover, ${name}. Do not look at me like I am it.` },
      { speaker: "Nim", text: "Three jewels. A scraped fourth. I had a name. I am keeping it until the sky makes sense." },
    ];
  }
  if (dungeon) {
    return [
      { speaker: "Nim", text: "This rock is counting. I can hear it. That does not mean I will do the work." },
      { speaker: "Nim", text: "If a floor wants weight, ask. If a wall wants a number, look at the wall." },
    ];
  }
  if (night) {
    return [{ speaker: "Nim", text: "The hole in the sky is not the moon. I checked. Several times. The lamp was a better ceiling." }];
  }
  return [
    {
      speaker: "Nim",
      text: `I am still here, ${name}. I have not become a moth.`,
      picks: [{ label: "Any ideas?" }, { label: "Are you scared?" }, { label: "Go home." }],
    },
  ];
}

function considerNim(ctx) {
  if (!ctx.follow) return null;
  if (ctx.boss) return "I will be the brave one who is over here.";
  if (ctx.foeNear || (ctx.fangD < 5.5 && ctx.fangD > 0.2)) {
    return ctx.low
      ? "That one has teeth. You have fewer hearts than usual. I am concerned. I am also not going first."
      : "Something with teeth. I counted them. I stopped at too many.";
  }
  if (ctx.danger === "sink") return "The ground wants a snack. We are the snack.";
  if (ctx.danger === "ice") return "This floor is lying about being a floor.";
  if (ctx.jobNear === "sniff") return "The dirt is keeping a secret. I can hear it chewing.";
  if (ctx.jobNear === "crawl") return "I fit. You do not. I am not bragging. I am measuring.";
  if (ctx.food) return "That is for people. I will still be involved.";
  if (ctx.afterTalk === "gran") return "She is counting the road. I counted it too. It is the same road.";
  if (ctx.afterTalk === "ink") return "He painted a leftover until it stood up. I stood up. We are not discussing it.";
  if (ctx.nearStatue) return "The wall is already doing the work. The stones are waiting to be wrong.";
  if (ctx.nearBridge) return "Three planks. I can swim. That is not a hint. That is a complaint.";
  if (ctx.nearCrate) return "Smallest on the left. I am not lining them up. I have a tail.";
  if (ctx.nearGourd) return "The plates have groups. Count the groups, not my patience.";
  if (ctx.nearPlate) return "A heavy floor. I will sit if you ask. I will not sit if you shove.";
  if (ctx.cipherN >= 8) return "I had a name for the last one. I am still not saying it.";
  return null;
}

function spoilsMath(line) {
  return /push statue \d|the answer is \d|choose \d|plank \d/.test(line.toLowerCase());
}

function askFox(q, met) {
  if (!/(fox|nim|companion|shelf|sniff|dig|crawl)/.test(q)) return null;
  if (met) return "Walk up to dirt that bothers her, a hole you do not fit, or a floor that wants weight, then press F. She sniffs, digs, crawls, fetches, and tracks. She will not tell you which stone is true. That was the deal.";
  return "Gran keeps a lamp on so the tree is a star. The shelf under it is not empty.";
}

function jobAskLabel(kind) {
  if (kind === "sniff") return "Ask Nim to sniff";
  if (kind === "dig") return "Ask Nim to dig";
  if (kind === "crawl") return "Send Nim through";
  if (kind === "fetch") return "Ask Nim to fetch";
  if (kind === "track") return "Ask Nim to track";
  return "Ask Nim to sit";
}

function bothPlatesHeld(playerOn, nimOn) {
  return playerOn && nimOn;
}

function spotReady(s, sniffed, done) {
  if (done[s.id]) return false;
  if (s.needSniff && !sniffed[s.needSniff] && !done[s.needSniff]) return false;
  return true;
}

test("first meet is a fox with a name, not a tutorial fairy", () => {
  const lines = nimTalkLines("Colton", false, 0);
  assert.equal(lines[0].speaker, "Nim");
  assert.match(lines[0].text, /lamp/);
  const labels = lines[0].picks.map((p) => p.label);
  assert.deepEqual(labels, ["Who are you?", "You can come.", "Stay with Gran."]);
  const deal = lines[0].picks[1].say.join(" ");
  assert.match(deal, /smell what the dirt is hiding/);
  assert.match(deal, /fit where you cannot/);
  assert.match(deal, /sit on a floor if it is heavy/);
  assert.match(deal, /Ask/);
});

test("Nim disagrees when told to stay home", () => {
  const stay = nimTalkLines("Colton", false, 0)[0].picks[2].say.join(" ");
  assert.match(stay, /^No\./);
  const later = nimTalkLines("Colton", true, 0);
  assert.ok(later[0].picks.some((p) => p.label === "Go home."));
});

test("story role is the leftover, not a quest arrow", () => {
  const late = nimTalkLines("Colton", true, 8);
  assert.match(late.map((l) => l.text).join(" "), /leftover|fourth/i);
  const ink = considerNim({ follow: true, afterTalk: "ink", fangD: 99, cipherN: 0 });
  assert.match(ink, /leftover/);
  assert.equal(considerNim({ follow: true, cipherN: 8, fangD: 99 }), "I had a name for the last one. I am still not saying it.");
});

test("danger lines warn without giving orders", () => {
  const fang = considerNim({ follow: true, fangD: 3, low: true, cipherN: 0 });
  assert.match(fang, /teeth/);
  assert.match(fang, /concerned/);
  assert.equal(considerNim({ follow: true, boss: true, fangD: 99, cipherN: 0 }), "I will be the brave one who is over here.");
  assert.match(considerNim({ follow: true, danger: "sink", fangD: 99, cipherN: 0 }), /snack/);
  assert.match(considerNim({ follow: true, danger: "ice", fangD: 99, cipherN: 0 }), /lying/);
});

test("she notices jobs the player cannot do alone", () => {
  assert.match(considerNim({ follow: true, jobNear: "sniff", fangD: 99, cipherN: 0 }), /chewing/);
  assert.match(considerNim({ follow: true, jobNear: "crawl", fangD: 99, cipherN: 0 }), /fit/);
  assert.match(considerNim({ follow: true, food: true, fangD: 99, cipherN: 0 }), /involved/);
});

test("puzzle comments never say which number to use", () => {
  const lines = [
    considerNim({ follow: true, nearStatue: true, fangD: 99, cipherN: 0 }),
    considerNim({ follow: true, nearBridge: true, fangD: 99, cipherN: 0 }),
    considerNim({ follow: true, nearCrate: true, fangD: 99, cipherN: 0 }),
    considerNim({ follow: true, nearGourd: true, fangD: 99, cipherN: 0 }),
    considerNim({ follow: true, nearPlate: true, fangD: 99, cipherN: 0 }),
  ];
  for (const line of lines) {
    assert.ok(line);
    assert.equal(spoilsMath(line), false);
    assert.equal(/\b\d+\b/.test(line.replace("three", "")), false);
  }
});

test("she is silent until she is travelling", () => {
  assert.equal(considerNim({ follow: false, nearStatue: true, fangD: 1, boss: true, cipherN: 8 }), null);
});

test("hint about the fox does not spoil the stones", () => {
  const before = askFox("where is the fox", false);
  const after = askFox("nim companion", true);
  assert.match(before, /shelf/);
  assert.match(after, /sniffs, digs, crawls/);
  assert.equal(spoilsMath(before), false);
  assert.equal(spoilsMath(after), false);
  assert.equal(askFox("sword", false), null);
});

test("command labels tell you to ask her, not a menu of numbers", () => {
  assert.equal(jobAskLabel("sniff"), "Ask Nim to sniff");
  assert.equal(jobAskLabel("crawl"), "Send Nim through");
  assert.equal(jobAskLabel("dig"), "Ask Nim to dig");
  for (const kind of ["sniff", "dig", "crawl", "fetch", "track", "plate"]) {
    assert.equal(/\d/.test(jobAskLabel(kind)), false);
  }
});

test("buried cache stays hidden until she sniffs", () => {
  const sniff = { id: "cache-sniff", kind: "sniff" };
  const dig = { id: "cache-dig", kind: "dig", needSniff: "cache-sniff" };
  assert.equal(spotReady(sniff, {}, {}), true);
  assert.equal(spotReady(dig, {}, {}), false);
  assert.equal(spotReady(dig, { "cache-sniff": true }, {}), true);
  assert.equal(spotReady(dig, {}, { "cache-dig": true }), false);
});

test("fox-vent bars need both weights", () => {
  assert.equal(bothPlatesHeld(true, false), false);
  assert.equal(bothPlatesHeld(false, true), false);
  assert.equal(bothPlatesHeld(true, true), true);
});
