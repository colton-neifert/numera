import { playerMaxHp, WORLD_ORDER, DEFAULT_OUTFIT } from "./content";
import { SONGS } from "./songs";

/** Temporary test loadout. Set false before shipping a real start. */
export const TEST_ALL_GEAR = true;
/** Treat the file as a finished quest so every tool, song, and jewel is already earned. */
export const COMPLETE_SAVE = true;

export function testGearPatch() {
  if (!TEST_ALL_GEAR) return {};
  return {
    hasSword: true,
    hasAxe: true,
    hasBow: true,
    hasShield: true,
    hasSling: true,
    hasBoom: true,
    hasBombs: true,
    hasPole: true,
    holding: "sword" as const,
    arrows: 30,
    arrowsMax: 30,
    bombs: 30,
    bombsMax: 30,
    seeds: 30,
    seedsMax: 30,
  };
}

export function completeGamePatch() {
  const xp = 4200;
  const heartsExtra = 10;
  return {
    ...testGearPatch(),
    xp,
    hp: playerMaxHp(xp, DEFAULT_OUTFIT, heartsExtra),
    coins: 680,
    coinsMax: 999,
    hasHorse: true,
    horseName: "Star",
    horseFeed: 6,
    hasOcarina: true,
    hasCompass: true,
    hasPole: true,
    wood: 24,
    houseWood: 12,
    mushrooms: 8,
    apples: 8,
    rocks: 6,
    fish: 4,
    cooked: 4,
    innRoom: 3,
    innBed: "plush" as const,
    songs: SONGS.map((s) => s.id),
    gems: { emerald: true, ruby: true, sapphire: true },
    gemsPlaced: ["emerald", "ruby", "sapphire"] as ("emerald" | "ruby" | "sapphire")[],
    worldsCleared: [...WORLD_ORDER],
    heartsExtra,
    heartsFrom: ["emerald", "ruby", "sapphire", "keep", "grove", "lake", "crater", "grave", "waste", "echo"],
    quests: { ash: 5, rook: 3, mira: 2, horse: 2, mill: 2 },
    metNpcs: [
      "mira",
      "tallow",
      "nora",
      "pip",
      "nana",
      "pell",
      "cobb",
      "holt",
      "oak0",
      "oak1",
      "oak2",
      "oak3",
      "oak4",
      "oak5",
      "oak6",
      "ash",
      "dusk",
      "rook",
      "mill-man",
      "shopkeep",
      "pax",
      "tuck",
      "lila",
      "gil",
      "mae",
      "lark",
      "hal",
      "ink",
    ],
    seenItems: ["sword", "axe", "bow", "shield", "sling", "boom", "bombs", "ocarina", "compass", "pole", "horse"],
    openedChests: ["lc", "mc", "kc", "gc", "cc", "hc"],
  };
}
