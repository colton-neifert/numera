export type MysteryState = {
  seed: number;
  on: string[];
  chest: number;
  merchantHour: number;
  helped?: boolean;
};

const COMMON = [
  "fogMornings",
  "windDays",
  "nightLantern",
  "shiftingChest",
  "wellWhisper",
  "wetPrints",
  "extraGossip",
  "movingCrate",
];
const UNCOMMON = [
  "merchant",
  "stormNights",
  "hollowDoor",
  "hiddenCave",
  "owlWatch",
  "dawnChoir",
  "lostLetter",
  "kidPair",
  "echoSteps",
  "cratePath",
];
const RARE = [
  "distantBeast",
  "ghostBench",
  "redFox",
  "crackedWall",
  "moonRupee",
  "stranger",
  "starfall",
  "hiddenRoom",
  "oldSong",
  "secondPath",
];
const LEGEND = ["afterRookBloom", "rareBug", "whiteStag", "skyCrack"];

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function rollMystery(seed = (Math.random() * 0xffffffff) >>> 0): MysteryState {
  const r = rng(seed);
  const on: string[] = [];
  for (const id of COMMON) if (r() < 0.56) on.push(id);
  for (const id of UNCOMMON) if (r() < 0.3) on.push(id);
  for (const id of RARE) if (r() < 0.11) on.push(id);
  for (const id of LEGEND) if (r() < 0.035) on.push(id);
  if (on.length < 6) {
    const rest = [...COMMON, ...UNCOMMON].filter((id) => !on.includes(id));
    while (on.length < 6 && rest.length) on.push(rest.splice(Math.floor(r() * rest.length), 1)[0]!);
  }
  return {
    seed,
    on,
    chest: Math.floor(r() * 4),
    merchantHour: 9 + Math.floor(r() * 8),
  };
}

export function hashSeed(name: string, extra = 1) {
  let h = 2166136261 ^ extra;
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function hasMystery(id: string, state?: MysteryState | null) {
  const m = state ?? currentMystery();
  return Boolean(m?.on.includes(id));
}

let cached: MysteryState | null = null;

export function currentMystery(): MysteryState | null {
  return cached;
}

export function setMystery(m: MysteryState | null) {
  cached = m;
}

export const MYSTERY_COUNT = COMMON.length + UNCOMMON.length + RARE.length + LEGEND.length;
