import type {
  Element,
  EnemyDef,
  GradeInfo,
  Outfit,
  OutfitId,
  Spell,
  Weapon,
  WeaponId,
  WorldId,
} from "./types";

export const APP_NAME = "Numera";

export const DEFAULT_NAME = "Scholar";

export function cleanName(raw: string): string {
  const cut = raw
    .replace(/[^A-Za-zÀ-ÿ' -]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12);
  return cut || DEFAULT_NAME;
}

export function talk(line: string, name: string): string {
  return line.replaceAll("{name}", cleanName(name));
}

export const GRADES: GradeInfo[] = [
  {
    id: "k1",
    label: "Spark",
    ages: "K–1",
    blurb: "Count, plus, and minus with numbers up to 10.",
  },
  {
    id: "g23",
    label: "Ember",
    ages: "Grades 2–3",
    blurb: "Two-digit plus and minus, then times tables.",
  },
  {
    id: "g45",
    label: "Flare",
    ages: "Grades 4–5",
    blurb: "Bigger multiply and divide, then two-step problems.",
  },
  {
    id: "g68",
    label: "Nova",
    ages: "Grades 6–8",
    blurb: "Integers, percents, and equations.",
  },
];

export const SPELLS: Spell[] = [
  { id: "leaf", name: "Leaf", kind: "attack", element: "leaf", power: 12, unlockLevel: 1, hint: "Green proof. Strong vs moth-wings." },
  { id: "fire", name: "Ember", kind: "attack", element: "fire", power: 14, unlockLevel: 1, hint: "Oak-fire. Strong vs moss and root." },
  { id: "ice", name: "Frost", kind: "attack", element: "ice", power: 14, unlockLevel: 1, hint: "Copper cold. Strong vs flame-hides." },
  { id: "storm", name: "Gale", kind: "attack", element: "storm", power: 16, unlockLevel: 1, hint: "Teal thunder. Strong vs stone." },
  { id: "mend", name: "Mend", kind: "heal", power: 16, unlockLevel: 4, hint: "Restore health." },
  { id: "ward", name: "Ward", kind: "guard", power: 0, unlockLevel: 6, hint: "Block the next incoming hit." },
];

export const ENEMIES: Record<string, EnemyDef> = {
  plusling: { id: "plusling", name: "Grey Lizard", sprite: "plusling", maxHp: 136, damage: 6, xp: 18, coins: 10, weak: "fire", resist: "ice" },
  timesprout: { id: "timesprout", name: "Grove Lizard", sprite: "timesprout", maxHp: 176, damage: 8, xp: 24, coins: 14, weak: "fire", resist: "leaf" },
  glyphite: { id: "glyphite", name: "Stone Lizard", sprite: "glyphite", maxHp: 208, damage: 10, xp: 30, coins: 18, weak: "storm", resist: "fire" },
  emberling: { id: "emberling", name: "Ash Lizard", sprite: "plusling", maxHp: 224, damage: 11, xp: 32, coins: 20, weak: "ice", resist: "fire" },
  driplet: { id: "driplet", name: "Bog Lizard", sprite: "plusling", maxHp: 232, damage: 11, xp: 34, coins: 20, weak: "storm", resist: "ice" },
  umbral: { id: "umbral", name: "Snow Fang", sprite: "glyphite", maxHp: 256, damage: 12, xp: 38, coins: 22, weak: "leaf", resist: "storm" },
  sandwight: { id: "sandwight", name: "Waste Lizard", sprite: "timesprout", maxHp: 264, damage: 12, xp: 40, coins: 24, weak: "storm", resist: "fire" },
  warden: { id: "warden", name: "Temple Warden", sprite: "boss", maxHp: 296, damage: 18, xp: 90, coins: 48, boss: true, weak: "leaf", resist: "storm" },
  remainder: { id: "remainder", name: "Lizard King", sprite: "boss", maxHp: 376, damage: 30, xp: 220, coins: 90, boss: true, weak: "leaf", resist: "storm" },
  leftover: { id: "leftover", name: "Last Shadow", sprite: "boss", maxHp: 496, damage: 32, xp: 280, coins: 140, boss: true, weak: "leaf", resist: "storm" },
  nag: { id: "nag", name: "Lizard King", sprite: "boss", maxHp: 376, damage: 30, xp: 220, coins: 90, boss: true, weak: "leaf", resist: "storm" },
  rook: { id: "rook", name: "ROOK", sprite: "boss", maxHp: 280, damage: 6, xp: 140, coins: 70, boss: true, weak: "storm", resist: "fire" },
};

export const WEAPONS: Weapon[] = [
  { id: "reed", name: "Reed Wand", kind: "wand", element: "leaf", atk: 0, price: 0, blurb: "Teaches Leaf. Strong vs Veyr. Soft vs ice-beasts." },
  { id: "oak", name: "Ember Oak", kind: "wand", element: "fire", atk: 3, price: 24, blurb: "Teaches Ember. Burns shades and roots. Soft vs stone." },
  { id: "copper", name: "Frost Copper", kind: "sword", element: "ice", atk: 5, price: 40, blurb: "Teaches Frost. Bites flame. Soft vs wet shades." },
  { id: "teal", name: "Storm Teal", kind: "sword", element: "storm", atk: 8, price: 70, blurb: "Teaches Gale. Splits stone. Soft vs Veyr’s wings." },
  { id: "axiom", name: "Axiom Staff", kind: "wand", element: "storm", atk: 12, price: 120, blurb: "Wakes Leaf, Ember, Frost, and Gale. Pick the weakness." },
];

export const ELEMENT_LABEL: Record<Element, string> = {
  leaf: "Leaf",
  fire: "Ember",
  ice: "Frost",
  storm: "Gale",
};

export const OUTFITS: Outfit[] = [
  { id: "academy", name: "Academy Tunic", hp: 0, price: 0, tunic: "#efe6d4", sash: "#3d8a82", blurb: "Cream cloth and a teal sash." },
  { id: "meadow", name: "Meadow Cloak", hp: 4, price: 20, tunic: "#c5d4a8", sash: "#3d6a3a", blurb: "Smells like cut grass and chalk." },
  { id: "ember", name: "Ember Vest", hp: 6, price: 35, tunic: "#e8c4a0", sash: "#b45c38", blurb: "Warm as a well-kept hearth." },
  { id: "keep", name: "Keep Robes", hp: 10, price: 55, tunic: "#c8c6c0", sash: "#5a6a78", blurb: "Stone-grey, window-teal." },
  { id: "royal", name: "Royal Sash", hp: 14, price: 90, tunic: "#e8dcc0", sash: "#c9a227", blurb: "The Vale’s old colors, mended." },
];

export const DEFAULT_WEAPON: WeaponId = "reed";
export const DEFAULT_OUTFIT: OutfitId = "academy";

export function weaponById(id: WeaponId): Weapon {
  return WEAPONS.find((w) => w.id === id) ?? WEAPONS[0]!;
}

export function outfitById(id: OutfitId): Outfit {
  return OUTFITS.find((o) => o.id === id) ?? OUTFITS[0]!;
}

export function playerMaxHp(xp: number, outfit: OutfitId, extraHearts = 0): number {
  const level = 1 + Math.floor(Math.max(0, xp) / 360);
  return 40 + level * 4 + outfitById(outfit).hp + extraHearts * 4;
}

export function levelFromXp(xp: number): number {
  return 1 + Math.floor(Math.max(0, xp) / 360);
}

export function xpIntoLevel(xp: number): { current: number; needed: number } {
  return { current: Math.max(0, xp) % 360, needed: 360 };
}

export const WORLD_ORDER: WorldId[] = [
  "meadow",
  "cavern",
  "marsh",
  "keep",
  "grove",
  "crater",
  "lake",
  "grave",
  "waste",
  "echo",
  "ridge",
  "spire",
  "fen",
  "hollow",
  "vault",
];

export const FIRST_ARC: WorldId[] = ["meadow", "cavern", "marsh", "keep"];
export const SECOND_ARC: WorldId[] = ["grove", "crater", "lake", "grave", "waste"];
export const THIRD_ARC: WorldId[] = ["ridge", "spire", "fen", "hollow"];
export const STORY_WORLDS: WorldId[] = [...FIRST_ARC, ...SECOND_ARC];

export function crystalGoal(): number {
  return WORLD_ORDER.length * 64;
}

export type GemId = "emerald" | "ruby" | "sapphire";

export const GEM_TEMPLE: Record<GemId, WorldId> = {
  emerald: "cavern",
  ruby: "crater",
  sapphire: "marsh",
};

export const GEM_META: Record<GemId, { name: string; color: string; blurb: string }> = {
  emerald: { name: "Sun Jewel", color: "#e07a28", blurb: "Keeps lizards out of the meadow." },
  ruby: { name: "Fire Jewel", color: "#d42838", blurb: "Keeps lizards out of the cave." },
  sapphire: { name: "Water Jewel", color: "#2a6ad8", blurb: "Keeps lizards out of the swamp." },
};

export const GEM_ORDER: GemId[] = ["emerald", "ruby", "sapphire"];

export function gemForWorld(world: WorldId): GemId | null {
  const hit = (Object.entries(GEM_TEMPLE) as [GemId, WorldId][]).find(([, w]) => w === world);
  return hit ? hit[0] : null;
}

export const WORLD_META: Record<
  WorldId,
  { name: string; region: string; enemy: keyof typeof ENEMIES; bg: string; sky: string; platform: string; stone: string }
> = {
  meadow: {
    name: "Oakstead",
    region: "Home",
    enemy: "plusling",
    bg: "/game/maps/overworld-meadow.jpg",
    sky: "#87b8d4",
    platform: "#6a8a48",
    stone: "the Sun Jewel",
  },
  cavern: {
    name: "Sun Hollow",
    region: "A dark mouth",
    enemy: "glyphite",
    bg: "/game/maps/overworld-cavern.jpg",
    sky: "#c4a070",
    platform: "#8a6a48",
    stone: "the Sun Jewel",
  },
  marsh: {
    name: "Reed Crypt",
    region: "A wet mouth",
    enemy: "driplet",
    bg: "/game/maps/overworld-marsh.jpg",
    sky: "#6aa0a8",
    platform: "#3d6a68",
    stone: "the Water Jewel",
  },
  grove: {
    name: "Green Forest",
    region: "Forest temple",
    enemy: "timesprout",
    bg: "/game/maps/overworld-grove.jpg",
    sky: "#6a8a68",
    platform: "#4a6a38",
    stone: "a hidden piece of his magic",
  },
  crater: {
    name: "Cinder Pit",
    region: "A sealed crag",
    enemy: "emberling",
    bg: "/game/maps/overworld-crater.jpg",
    sky: "#d47848",
    platform: "#8a4a28",
    stone: "the Fire Jewel",
  },
  lake: {
    name: "Blue Lake",
    region: "Water temple",
    enemy: "driplet",
    bg: "/game/maps/overworld-lake.jpg",
    sky: "#5a88c0",
    platform: "#3a6a88",
    stone: "a hidden piece of his magic",
  },
  grave: {
    name: "Night Grave",
    region: "Night temple",
    enemy: "umbral",
    bg: "/game/maps/overworld-grave.jpg",
    sky: "#4a4868",
    platform: "#3a3850",
    stone: "a hidden piece of his magic",
  },
  waste: {
    name: "Sand Land",
    region: "Sand temple",
    enemy: "sandwight",
    bg: "/game/maps/overworld-waste.jpg",
    sky: "#d4b06a",
    platform: "#c4a060",
    stone: "a hidden piece of his magic",
  },
  keep: {
    name: "The Castle",
    region: "Home of the jewels",
    enemy: "nag",
    bg: "/game/maps/overworld-keep.jpg",
    sky: "#6a7088",
    platform: "#5a5c58",
    stone: "the round hall — he makes fangs here",
  },
  echo: {
    name: "The Last Hall",
    region: "His last hiding spot",
    enemy: "leftover",
    bg: "/game/maps/overworld-echo.jpg",
    sky: "#b8a8d4",
    platform: "#6a5a88",
    stone: "stop the last bit of his magic",
  },
  ridge: {
    name: "High Ridge",
    region: "Hill temple",
    enemy: "timesprout",
    bg: "/game/maps/overworld-ridge.jpg",
    sky: "#7a9a68",
    platform: "#4a6a38",
    stone: "a leftover scrap of magic",
  },
  spire: {
    name: "Clock Tower",
    region: "Hour temple",
    enemy: "glyphite",
    bg: "/game/maps/overworld-spire.jpg",
    sky: "#6a7088",
    platform: "#5a5c58",
    stone: "a leftover scrap of magic",
  },
  fen: {
    name: "Glass Swamp",
    region: "Mirror temple",
    enemy: "driplet",
    bg: "/game/maps/overworld-fen.jpg",
    sky: "#5a88a8",
    platform: "#3a6a68",
    stone: "a leftover scrap of magic",
  },
  hollow: {
    name: "Thunder Hollow",
    region: "Storm temple",
    enemy: "emberling",
    bg: "/game/maps/overworld-hollow.jpg",
    sky: "#8a6048",
    platform: "#6a3a28",
    stone: "a leftover scrap of magic",
  },
  vault: {
    name: "Crown Cave",
    region: "The last scrap",
    enemy: "leftover",
    bg: "/game/maps/overworld-vault.jpg",
    sky: "#c4a060",
    platform: "#8a6a40",
    stone: "name this, and the valley can rest",
  },
  arena: {
    name: "The Arena",
    region: "A fight that does not end",
    enemy: "umbral",
    bg: "/game/maps/overworld-keep.jpg",
    sky: "#c4a060",
    platform: "#b89048",
    stone: "waves until it is quiet",
  },
};
