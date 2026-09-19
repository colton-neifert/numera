import { DEFAULT_OUTFIT, DEFAULT_WEAPON, playerMaxHp, type GemId } from "./content";
import { DEFAULT_LOOK, type HeroLookPick } from "./looks";
import { useGame } from "./store";
import type { GradeBand, OutfitId, WeaponId, WorldId } from "./types";
import { startRung, clampRung } from "./math";
import { rollMystery, hashSeed, setMystery, type MysteryState } from "./mystery";

export type SaveData = {
  grade: GradeBand;
  mathRung?: number;
  mathStreak?: number;
  xp: number;
  hp: number;
  coins: number;
  muted: boolean;
  weapon: WeaponId;
  outfit: OutfitId;
  ownedWeapons: WeaponId[];
  ownedOutfits: OutfitId[];
  worldsCleared: WorldId[];
  defeated: Record<WorldId, string[]>;
  collected: Record<WorldId, string[]>;
  heroName: string;
  heroGender: "boy" | "girl";
  heroLook: HeroLookPick;
  metNpcs: string[];
  hasSword: boolean;
  hasAxe: boolean;
  hasBow: boolean;
  hasShield: boolean;
  hasSling?: boolean;
  hasBoom?: boolean;
  hasBombs?: boolean;
  wood: number;
  houseWood?: number;
  holding: "sword" | "axe" | "bow" | "sling" | "boom" | "bomb" | "shield" | "pole" | "none";
  mushrooms: number;
  apples: number;
  rocks: number;
  arrows?: number;
  arrowsMax?: number;
  bombs?: number;
  bombsMax?: number;
  seeds?: number;
  seedsMax?: number;
  coinsMax?: number;
  hasHorse: boolean;
  horseName?: string;
  hasOcarina: boolean;
  hasCompass?: boolean;
  songs: string[];
  seenItems: string[];
  gems: Record<GemId, boolean>;
  gemsPlaced: GemId[];
  openedChests?: string[];
  quests?: Record<string, number>;
  mailGot?: string[];
  mailSent?: string[];
  mailWait?: string[];
  mailCustom?: { id: string; from: string; lines: string[] }[];
  mystery?: MysteryState | null;
};

export type FileSlot =
  | { empty: true }
  | { empty: false; name: string; hearts: number; worlds: number; hasSword: boolean; data: SaveData };

const KEY = "numera-files-v1";
const ACTIVE = "numera-active-slot";
const COUNT = 3;

const EMPTY_MAP = {
  meadow: [],
  cavern: [],
  marsh: [],
  grove: [],
  crater: [],
  lake: [],
  grave: [],
  waste: [],
  keep: [],
  echo: [],
  ridge: [],
  spire: [],
  fen: [],
  hollow: [],
  vault: [],
  arena: [],
} as Record<WorldId, string[]>;

export function emptySave(name = ""): SaveData {
  return {
    grade: "g23",
    mathRung: startRung("g23"),
    mathStreak: 0,
    xp: 0,
    hp: playerMaxHp(0, DEFAULT_OUTFIT),
    coins: 20,
    muted: false,
    weapon: DEFAULT_WEAPON,
    outfit: DEFAULT_OUTFIT,
    ownedWeapons: [DEFAULT_WEAPON],
    ownedOutfits: [DEFAULT_OUTFIT],
    worldsCleared: [],
    defeated: { ...EMPTY_MAP },
    collected: { ...EMPTY_MAP },
    heroName: name,
    heroGender: "boy",
    heroLook: { ...DEFAULT_LOOK },
    metNpcs: [],
    hasSword: true,
    hasAxe: true,
    hasBow: true,
    hasShield: true,
    hasSling: true,
    hasBoom: true,
    hasBombs: true,
    wood: 0,
    houseWood: 0,
    holding: "boom",
    mushrooms: 0,
    apples: 0,
    rocks: 0,
    arrows: 20,
    arrowsMax: 20,
    bombs: 20,
    bombsMax: 20,
    seeds: 20,
    seedsMax: 20,
    coinsMax: 100,
    hasHorse: false,
    horseName: "",
    hasOcarina: false,
    hasCompass: false,
    songs: [],
    seenItems: [],
    gems: { emerald: false, ruby: false, sapphire: false },
    gemsPlaced: [],
    openedChests: [],
    quests: {},
    mailGot: [],
    mailSent: [],
    mailWait: [],
    mailCustom: [],
    mystery: rollMystery(),
  };
}

function blankSlots(): FileSlot[] {
  return [{ empty: true }, { empty: true }, { empty: true }];
}

export function readSlots(): FileSlot[] {
  if (typeof localStorage === "undefined") return blankSlots();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return migrateOld();
    const parsed = JSON.parse(raw) as FileSlot[];
    while (parsed.length < COUNT) parsed.push({ empty: true });
    return parsed.slice(0, COUNT);
  } catch {
    return blankSlots();
  }
}

function migrateOld(): FileSlot[] {
  const slots = blankSlots();
  try {
    const old = localStorage.getItem("numera-save-v1");
    if (!old) return slots;
    const parsed = JSON.parse(old) as { state?: SaveData };
    const s = parsed.state;
    if (s?.heroName) {
      slots[0] = metaFrom(s);
    }
  } catch {
    /* ignore */
  }
  writeSlots(slots);
  return slots;
}

function writeSlots(slots: FileSlot[]) {
  localStorage.setItem(KEY, JSON.stringify(slots));
}

export function activeSlot(): number {
  if (typeof localStorage === "undefined") return 0;
  const n = Number(localStorage.getItem(ACTIVE) ?? "0");
  return Number.isFinite(n) ? Math.max(0, Math.min(COUNT - 1, n)) : 0;
}

export function setActiveSlot(i: number) {
  localStorage.setItem(ACTIVE, String(i));
}

function metaFrom(data: SaveData): FileSlot {
  return {
    empty: false,
    name: data.heroName || "Scholar",
    hearts: Math.max(1, Math.round((data.hp || 12) / 4)),
    worlds: data.worldsCleared?.length ?? 0,
    hasSword: Boolean(data.hasSword),
    data,
  };
}

export function snapshotSave(): SaveData {
  const s = useGame.getState();
  return {
    grade: s.grade,
    mathRung: s.mathRung,
    mathStreak: s.mathStreak,
    xp: s.xp,
    hp: s.hp,
    coins: s.coins,
    muted: s.muted,
    weapon: s.weapon,
    outfit: s.outfit,
    ownedWeapons: s.ownedWeapons,
    ownedOutfits: s.ownedOutfits,
    worldsCleared: s.worldsCleared,
    defeated: s.defeated,
    collected: s.collected,
    heroName: s.heroName,
    heroGender: s.heroGender ?? "boy",
    heroLook: { ...DEFAULT_LOOK, ...(s.heroLook ?? {}), cap: "", hair: DEFAULT_LOOK.hair, pants: DEFAULT_LOOK.pants, eyeShape: "round" },
    metNpcs: s.metNpcs,
    hasSword: s.hasSword,
    hasAxe: s.hasAxe,
    hasBow: Boolean(s.hasBow),
    hasShield: Boolean(s.hasShield),
    hasSling: Boolean(s.hasSling),
    hasBoom: Boolean(s.hasBoom),
    hasBombs: Boolean(s.hasBombs),
    wood: s.wood,
    houseWood: s.houseWood ?? 0,
    holding: s.holding,
    mushrooms: s.mushrooms,
    apples: s.apples,
    rocks: s.rocks,
    arrows: s.arrows ?? 0,
    arrowsMax: s.arrowsMax ?? 20,
    bombs: s.bombs ?? 0,
    bombsMax: s.bombsMax ?? 20,
    seeds: s.seeds ?? 0,
    seedsMax: s.seedsMax ?? 20,
    coinsMax: s.coinsMax ?? 100,
    hasHorse: Boolean(s.hasHorse),
    horseName: s.horseName ?? "",
    hasOcarina: s.hasOcarina ?? false,
    hasCompass: Boolean(s.hasCompass),
    songs: s.songs ?? [],
    seenItems: s.seenItems,
    gems: s.gems ?? { emerald: false, ruby: false, sapphire: false },
    gemsPlaced: s.gemsPlaced ?? [],
    openedChests: s.openedChests ?? [],
    quests: s.quests ?? {},
    mailGot: s.mailGot ?? [],
    mailSent: s.mailSent ?? [],
    mailWait: s.mailWait ?? [],
    mailCustom: s.mailCustom ?? [],
    mystery: s.mystery ?? null,
  };
}

export function writeActive() {
  if (typeof localStorage === "undefined") return;
  const slots = readSlots();
  const i = activeSlot();
  const data = snapshotSave();
  if (!data.heroName) {
    slots[i] = { empty: true };
  } else {
    slots[i] = metaFrom(data);
  }
  writeSlots(slots);
}

export function loadSlot(i: number) {
  setActiveSlot(i);
  const slot = readSlots()[i];
  const data = !slot || slot.empty ? emptySave() : slot.data;
  useGame.setState({
    ...data,
    heroGender: data.heroGender === "girl" ? "girl" : "boy",
    heroLook: { ...DEFAULT_LOOK, ...(data.heroLook ?? {}), cap: "", hair: DEFAULT_LOOK.hair, pants: DEFAULT_LOOK.pants, eyeShape: "round" },
    hasOcarina: Boolean(data.hasOcarina),
    hasBow: Boolean(data.hasBow),
    hasShield: Boolean(data.hasShield),
    hasSling: Boolean(data.hasSling),
    hasBoom: Boolean(data.hasBoom),
    hasBombs: Boolean(data.hasBombs),
    hasCompass: Boolean(data.hasCompass),
    hasHorse: Boolean(data.hasHorse),
    horseName: data.horseName ?? "",
    arrows: data.arrows ?? 0,
    arrowsMax: data.arrowsMax ?? 20,
    bombs: data.bombs ?? 0,
    bombsMax: data.bombsMax ?? 20,
    seeds: data.seeds ?? 0,
    seedsMax: data.seedsMax ?? 20,
    coinsMax: data.coinsMax ?? 100,
    songs: data.songs ?? [],
    gems: data.gems ?? { emerald: false, ruby: false, sapphire: false },
    gemsPlaced: data.gemsPlaced ?? [],
    openedChests: data.openedChests ?? [],
    quests: data.quests ?? {},
    mathRung: clampRung(data.grade ?? "g23", typeof data.mathRung === "number" ? data.mathRung : undefined),
    mathStreak: typeof data.mathStreak === "number" ? data.mathStreak : 0,
    mailGot: data.mailGot ?? [],
    mailSent: data.mailSent ?? [],
    mailWait: data.mailWait ?? [],
    mailCustom: data.mailCustom ?? [],
    mystery: data.mystery ?? rollMystery(hashSeed(data.heroName || "Scholar", 11)),
    defeated: { ...EMPTY_MAP, ...data.defeated },
    collected: { ...EMPTY_MAP, ...data.collected },
    houseWood: data.houseWood ?? 0,
    screen: "title",
    currentWorld: null,
    resumeAt: null,
    combat: null,
    lastResult: null,
  });
}

export function eraseSlot(i: number) {
  const slots = readSlots();
  slots[i] = { empty: true };
  writeSlots(slots);
  if (activeSlot() === i) loadSlot(i);
}

export function patchSlotHero(i: number, name: string, gender: "boy" | "girl", look: HeroLookPick) {
  const slots = readSlots();
  const slot = slots[i];
  if (!slot || slot.empty) return;
  const data: SaveData = {
    ...slot.data,
    heroName: name,
    heroGender: gender,
    heroLook: { ...DEFAULT_LOOK, ...look, cap: "", hair: DEFAULT_LOOK.hair, pants: DEFAULT_LOOK.pants, eyeShape: "round" },
  };
  slots[i] = metaFrom(data);
  writeSlots(slots);
  if (activeSlot() === i) {
    useGame.setState({ heroName: name, heroGender: gender, heroLook: data.heroLook });
  }
}

export function continueSlot() {
  const i = activeSlot();
  const slot = readSlots()[i];
  if (!slot || slot.empty) {
    useGame.setState({ screen: "title" });
    return;
  }
  const data = slot.data;
  useGame.setState({
    ...data,
    heroGender: data.heroGender === "girl" ? "girl" : "boy",
    heroLook: { ...DEFAULT_LOOK, ...(data.heroLook ?? {}), cap: "", hair: DEFAULT_LOOK.hair, pants: DEFAULT_LOOK.pants, eyeShape: "round" },
    hasOcarina: Boolean(data.hasOcarina),
    hasBow: Boolean(data.hasBow),
    hasShield: Boolean(data.hasShield),
    hasSling: Boolean(data.hasSling),
    hasBoom: Boolean(data.hasBoom),
    hasBombs: Boolean(data.hasBombs),
    hasCompass: Boolean(data.hasCompass),
    hasHorse: Boolean(data.hasHorse),
    horseName: data.horseName ?? "",
    arrows: data.arrows ?? 0,
    arrowsMax: data.arrowsMax ?? 20,
    bombs: data.bombs ?? 0,
    bombsMax: data.bombsMax ?? 20,
    seeds: data.seeds ?? 0,
    seedsMax: data.seedsMax ?? 20,
    coinsMax: data.coinsMax ?? 100,
    songs: data.songs ?? [],
    gems: data.gems ?? { emerald: false, ruby: false, sapphire: false },
    gemsPlaced: data.gemsPlaced ?? [],
    openedChests: data.openedChests ?? [],
    quests: data.quests ?? {},
    mathRung: clampRung(data.grade ?? "g23", typeof data.mathRung === "number" ? data.mathRung : undefined),
    mathStreak: typeof data.mathStreak === "number" ? data.mathStreak : 0,
    mailGot: data.mailGot ?? [],
    mailSent: data.mailSent ?? [],
    mailWait: data.mailWait ?? [],
    mailCustom: data.mailCustom ?? [],
    mystery: data.mystery ?? rollMystery(hashSeed(data.heroName || "Scholar", 11)),
    defeated: { ...EMPTY_MAP, ...data.defeated },
    collected: { ...EMPTY_MAP, ...data.collected },
    houseWood: data.houseWood ?? 0,
    hp: Math.max(4, data.hp || playerMaxHp(data.xp, data.outfit)),
    screen: "hub",
    currentWorld: null,
    resumeAt: null,
    combat: null,
    lastResult: null,
  });
}

export function startNew(i: number, name: string, grade: GradeBand, gender: "boy" | "girl", look?: HeroLookPick) {
  setActiveSlot(i);
  const data = emptySave(name);
  data.grade = grade;
  data.mathRung = startRung(grade);
  data.mathStreak = 0;
  data.heroGender = gender;
  if (look) data.heroLook = look;
  useGame.setState({
    ...data,
    screen: "hub",
    currentWorld: null,
    resumeAt: null,
    combat: null,
    lastResult: null,
  });
  if (data.mystery) setMystery(data.mystery);
  writeActive();
}
