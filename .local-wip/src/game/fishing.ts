import { FAR_POND, ICE_AT, MOON_POND, POND, WELL_AT, WILD_POND } from "./world3d/field";
import { FW, LANDS, MW, RV } from "./world3d/lands";
import { live } from "./world3d/live";
import { useGame } from "./store";
import { revealItem, type GetId } from "./items";
import { takeCipher } from "./cipher";
import { sfx } from "./audio";
import { underFishId } from "./world3d/under";

export type DayPart = "dawn" | "day" | "dusk" | "night";
export type FishId =
  | "bluegill"
  | "perch"
  | "goldminnow"
  | "trout"
  | "pike"
  | "salmon"
  | "mosscarp"
  | "ferneel"
  | "char"
  | "icegoby"
  | "mudskip"
  | "moonfish"
  | "mireeel"
  | "boot"
  | "bottle"
  | "numbered"
  | "glowfish";

export type FishDef = {
  id: FishId;
  name: string;
  color: string;
  belly: string;
  size: number;
  spots: string[];
  when: DayPart[] | "any";
  weight: number;
  wait: [number, number];
  bite: number;
  speed: number;
  sweetW: number;
  food: boolean;
  coins?: number;
  get: GetId;
  title: string;
  blurb: string;
  secret?: boolean;
};

export const FISH: Record<FishId, FishDef> = {
  bluegill: {
    id: "bluegill",
    name: "Bluegill",
    color: "#3a7a88",
    belly: "#d8c890",
    size: 0.85,
    spots: ["pond", "far", "wild"],
    when: "any",
    weight: 8,
    wait: [1.6, 3.4],
    bite: 1.05,
    speed: 3.4,
    sweetW: 0.26,
    food: true,
    get: "fish",
    title: "You caught a Bluegill!",
    blurb: "Round and stubborn. Eat it, cook it, or sell it.",
  },
  perch: {
    id: "perch",
    name: "Pond Perch",
    color: "#6a8a38",
    belly: "#e8d8a0",
    size: 1,
    spots: ["pond", "wild"],
    when: ["day", "dawn"],
    weight: 6,
    wait: [1.8, 3.8],
    bite: 0.95,
    speed: 3.8,
    sweetW: 0.22,
    food: true,
    get: "fish",
    title: "You caught a Pond Perch!",
    blurb: "Striped. It thought the dock was a tree.",
  },
  goldminnow: {
    id: "goldminnow",
    name: "Gold Minnow",
    color: "#c9a227",
    belly: "#efe6d4",
    size: 0.62,
    spots: ["pond"],
    when: ["dusk"],
    weight: 3,
    wait: [2.4, 4.6],
    bite: 0.82,
    speed: 4.6,
    sweetW: 0.16,
    food: true,
    coins: 8,
    get: "goldminnow",
    title: "You caught a Gold Minnow!",
    blurb: "It flashes like a coin. Finn would want to see this.",
  },
  trout: {
    id: "trout",
    name: "Silverrun Trout",
    color: "#7aa8b0",
    belly: "#efe6d4",
    size: 1.05,
    spots: ["river", "pool", "black"],
    when: "any",
    weight: 7,
    wait: [1.7, 3.6],
    bite: 1.0,
    speed: 3.9,
    sweetW: 0.2,
    food: true,
    get: "fish",
    title: "You caught a Silverrun Trout!",
    blurb: "The river keeps its name. This one almost kept yours.",
  },
  pike: {
    id: "pike",
    name: "River Pike",
    color: "#4a6a48",
    belly: "#c4c8a0",
    size: 1.28,
    spots: ["river"],
    when: ["day"],
    weight: 4,
    wait: [2.2, 4.4],
    bite: 0.78,
    speed: 5.1,
    sweetW: 0.14,
    food: true,
    get: "fish",
    title: "You caught a River Pike!",
    blurb: "Teeth. Attitude. Dinner.",
  },
  salmon: {
    id: "salmon",
    name: "Falls Salmon",
    color: "#c45c58",
    belly: "#efe0c8",
    size: 1.35,
    spots: ["pool"],
    when: ["dawn", "dusk"],
    weight: 3,
    wait: [2.6, 5.0],
    bite: 0.74,
    speed: 5.4,
    sweetW: 0.12,
    food: true,
    coins: 12,
    get: "fish",
    title: "You caught a Falls Salmon!",
    blurb: "It came up the hard way. So did you.",
  },
  mosscarp: {
    id: "mosscarp",
    name: "Moss Carp",
    color: "#3a6a38",
    belly: "#c4d0a0",
    size: 1.12,
    spots: ["forest"],
    when: ["day", "dawn"],
    weight: 5,
    wait: [2.0, 4.2],
    bite: 0.92,
    speed: 4.0,
    sweetW: 0.2,
    food: true,
    get: "fish",
    title: "You caught a Moss Carp!",
    blurb: "Green on purpose. The woods grow extra on it.",
  },
  ferneel: {
    id: "ferneel",
    name: "Fern Eel",
    color: "#2a4a30",
    belly: "#8aaa70",
    size: 1.18,
    spots: ["forest"],
    when: ["dusk", "night"],
    weight: 4,
    wait: [2.3, 4.8],
    bite: 0.8,
    speed: 4.8,
    sweetW: 0.15,
    food: true,
    get: "fish",
    title: "You caught a Fern Eel!",
    blurb: "It tried to be a vine. It was not a vine.",
  },
  char: {
    id: "char",
    name: "Stoneback Char",
    color: "#6a4a48",
    belly: "#e8c8b0",
    size: 1.08,
    spots: ["mount"],
    when: ["dawn"],
    weight: 4,
    wait: [2.4, 4.8],
    bite: 0.84,
    speed: 4.5,
    sweetW: 0.16,
    food: true,
    get: "fish",
    title: "You caught a Stoneback Char!",
    blurb: "Cold water. Warm spots. It liked the mountain more than you did.",
  },
  icegoby: {
    id: "icegoby",
    name: "Ice Goby",
    color: "#88b8d0",
    belly: "#f0f4f8",
    size: 0.7,
    spots: ["mount", "ice"],
    when: "any",
    weight: 5,
    wait: [1.8, 3.6],
    bite: 1.0,
    speed: 3.6,
    sweetW: 0.24,
    food: true,
    get: "fish",
    title: "You caught an Ice Goby!",
    blurb: "It was already cold. You did not make it worse.",
  },
  mudskip: {
    id: "mudskip",
    name: "Mudskip",
    color: "#6a5a38",
    belly: "#c4b890",
    size: 0.78,
    spots: ["wild", "swamp"],
    when: ["day", "dusk"],
    weight: 6,
    wait: [1.5, 3.2],
    bite: 1.1,
    speed: 3.5,
    sweetW: 0.24,
    food: true,
    get: "fish",
    title: "You caught a Mudskip!",
    blurb: "It walked on the bank. Then it remembered it was a fish.",
  },
  moonfish: {
    id: "moonfish",
    name: "Moon Fish",
    color: "#d8f0ff",
    belly: "#f6f1e6",
    size: 1.02,
    spots: ["far", "moon", "pond"],
    when: ["night"],
    weight: 3,
    wait: [2.5, 5.2],
    bite: 0.8,
    speed: 4.7,
    sweetW: 0.15,
    food: true,
    coins: 10,
    get: "fish",
    title: "You caught a Moon Fish!",
    blurb: "It glowed in your hands. Then it was just a fish again.",
  },
  mireeel: {
    id: "mireeel",
    name: "Mire Eel",
    color: "#3a4a38",
    belly: "#6a7a50",
    size: 1.22,
    spots: ["swamp"],
    when: ["night", "dusk"],
    weight: 4,
    wait: [2.2, 4.6],
    bite: 0.82,
    speed: 4.9,
    sweetW: 0.14,
    food: true,
    get: "fish",
    title: "You caught a Mire Eel!",
    blurb: "The fen did not want to let go. Neither did it.",
  },
  boot: {
    id: "boot",
    name: "Old Boot",
    color: "#4a3220",
    belly: "#6a4a28",
    size: 0.9,
    spots: ["well", "wild", "pond"],
    when: "any",
    weight: 2,
    wait: [1.4, 2.8],
    bite: 1.2,
    speed: 2.8,
    sweetW: 0.32,
    food: false,
    coins: 2,
    get: "fish",
    title: "You fished up a Boot!",
    blurb: "Not a fish. There is a rupee in the heel, which is almost an apology.",
  },
  bottle: {
    id: "bottle",
    name: "Whispering Bottle",
    color: "#6a8890",
    belly: "#d8e8ea",
    size: 0.95,
    spots: ["far"],
    when: ["night"],
    weight: 0,
    wait: [3.2, 5.8],
    bite: 0.7,
    speed: 5.6,
    sweetW: 0.11,
    food: false,
    get: "bottleletter",
    title: "You fished up a Bottle!",
    blurb: "A letter is folded inside. The ink runs at the last line.",
    secret: true,
  },
  numbered: {
    id: "numbered",
    name: "Numbered Carp",
    color: "#c9a227",
    belly: "#efe6d4",
    size: 1.42,
    spots: ["pond"],
    when: ["dawn"],
    weight: 0,
    wait: [3.4, 6.2],
    bite: 0.68,
    speed: 5.8,
    sweetW: 0.1,
    food: false,
    coins: 40,
    get: "numbered",
    title: "You caught a Numbered Carp!",
    blurb: "Four marks on its scales. Someone counted this on purpose.",
    secret: true,
  },
  glowfish: {
    id: "glowfish",
    name: "Glowfish",
    color: "#3ec8a0",
    belly: "#d8fff0",
    size: 0.92,
    spots: ["black", "glow"],
    when: "any",
    weight: 6,
    wait: [1.8, 3.6],
    bite: 0.92,
    speed: 4.1,
    sweetW: 0.18,
    food: true,
    coins: 18,
    get: "fish",
    title: "You caught a Glowfish!",
    blurb: "It kept a piece of the Below in its scales. The river down there has no sky.",
  },
};

export const FISH_SPOTS: { id: string; x: number; z: number; r: number }[] = [
  { id: "pond", x: POND.x, z: POND.z, r: 16 },
  { id: "far", x: FAR_POND.x, z: FAR_POND.z, r: 13 },
  { id: "wild", x: WILD_POND.x, z: WILD_POND.z, r: 18 },
  { id: "river", x: RV.dock.x, z: RV.dock.z, r: 10 },
  { id: "river", x: RV.isle.x, z: RV.isle.z, r: 9 },
  { id: "river", x: RV.lily.x, z: RV.lily.z, r: 8 },
  { id: "pool", x: RV.pool.x, z: RV.pool.z, r: 12 },
  { id: "forest", x: FW.pool.x, z: FW.pool.z, r: 10 },
  { id: "mount", x: MW.pool.x, z: MW.pool.z, r: 10 },
  { id: "well", x: WELL_AT.x, z: WELL_AT.z, r: 2.4 },
  { id: "ice", x: ICE_AT.x, z: ICE_AT.z, r: 5 },
  { id: "moon", x: MOON_POND.x, z: MOON_POND.z, r: 12 },
  { id: "swamp", x: LANDS.swamp.x + 18, z: LANDS.swamp.z - 12, r: 11 },
];

export function hourPart(h: number): DayPart {
  if (h >= 5.1 && h < 7.6) return "dawn";
  if (h >= 7.6 && h < 17.2) return "day";
  if (h >= 17.2 && h < 20.2) return "dusk";
  return "night";
}

export function fishOpen(def: FishDef, part: DayPart) {
  return def.when === "any" || def.when.includes(part);
}

export function edibleCaught(log: string[]) {
  return log.filter((id) => FISH[id as FishId]?.food).length;
}

export function nearFishSpot(x: number, z: number) {
  if (live.below) {
    const id = underFishId(x, z);
    if (!id) return null;
    return { id, x, z, r: 8, d: 0 };
  }
  let best: { id: string; x: number; z: number; r: number; d: number } | null = null;
  for (const s of FISH_SPOTS) {
    const d = Math.hypot(x - s.x, z - s.z);
    if (d < s.r && (!best || d < best.d)) best = { ...s, d };
  }
  return best;
}

export function pickFish(
  spot: string,
  hour: number,
  log: string[],
  seed: number,
  quests: Record<string, number>,
): FishDef {
  const part = hourPart(hour);
  const has = (id: FishId) => log.includes(id);
  if (spot === "far" && part === "night" && !has("bottle") && seed % 100 < 22) return FISH.bottle;
  if (spot === "pond" && part === "dawn" && (quests.fishBottle ?? 0) >= 1 && !has("numbered") && seed % 100 < 28) {
    return FISH.numbered;
  }

  const pool: FishDef[] = [];
  for (const def of Object.values(FISH)) {
    if (def.secret) continue;
    if (!def.spots.includes(spot)) continue;
    if (!fishOpen(def, part)) continue;
    if (def.id === "boot" && spot === "pond" && seed % 100 > 8) continue;
    for (let i = 0; i < def.weight; i++) pool.push(def);
  }
  if (!pool.length) {
    if (spot === "well") return FISH.boot;
    return FISH.bluegill;
  }
  const i = Math.abs(Math.floor(seed * 7.13 + hour * 13)) % pool.length;
  return pool[i]!;
}

export function applyCatch(kind: FishId) {
  const def = FISH[kind];
  const g = useGame.getState();
  const log = g.fishLog ?? [];
  const first = !log.includes(kind);
  const nextLog = first ? [...log, kind] : log;
  const quests = { ...(g.quests ?? {}) };
  let fish = g.fish ?? 0;
  if (def.food) fish = Math.min(16, fish + 1);
  if (kind === "bottle") quests.fishBottle = 1;
  if (kind === "numbered") quests.fishCarp = 1;
  useGame.setState({ fish, fishLog: nextLog, quests });
  if (def.coins) g.addCoins(def.coins);
  if (kind === "bottle") takeCipher("fish-bottle", true);
  if (kind === "numbered") takeCipher("numbered-carp", true);
  live.getTitle = def.title;
  live.getBlurb = def.blurb;
  revealItem(def.get, true);
  const kinds = edibleCaught(nextLog);
  let heart = false;
  if (first && kinds >= 8 && g.grantHeartContainer("angler")) {
    heart = true;
    live.listen = "Eight kinds. A new heart.";
  }
  return { first, heart, def };
}

export function cancelFish() {
  live.fishAct = null;
  live.fishT = 0;
  live.fishKind = null;
  live.fishSpot = null;
  live.fishPull = false;
  live.fishNeedle = 0.5;
  live.nearFish = false;
}

export function beginCast(spot: string, hour: number) {
  const g = useGame.getState();
  const def = pickFish(spot, hour, g.fishLog ?? [], (live.playT * 1000 + live.x * 13 + live.z * 7) | 0, g.quests ?? {});
  live.fishAct = "wind";
  live.fishT = 0;
  live.fishKind = def.id;
  live.fishSpot = spot;
  live.fishPull = false;
  live.fishNeedle = 0.12;
  live.fishSweet = 0.58 + (def.size - 1) * 0.08;
  live.fishSweetW = def.sweetW;
  live.fishBiteAt = def.wait[0] + Math.random() * (def.wait[1] - def.wait[0]);
  const fx = -Math.sin(live.yaw);
  const fz = -Math.cos(live.yaw);
  live.castX = live.x + fx * 3.5;
  live.castZ = live.z + fz * 3.5;
  sfx.swing();
}
