import { live, parseDinnerInvite, formatHour, afterMeal, blankDine } from "./world3d/live";
import { sfx } from "./audio";
import { DEFAULT_LOOK, lookForGender, type HeroLookPick } from "./looks";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  gemForWorld,
  DEFAULT_OUTFIT,
  DEFAULT_WEAPON,
  SECOND_ARC,
  THIRD_ARC,
  SPELLS,
  WEAPONS,
  WORLD_ORDER,
  outfitById,
  playerMaxHp,
  weaponById,
  type GemId,
} from "./content";
import type {
  Encounter,
  GradeBand,
  OutfitId,
  Screen,
  Spell,
  SpellId,
  WeaponId,
  WorldId,
} from "./types";
import { startRung, adjustRung, clampRung } from "./math";

function quizNeed(kind: string) {
  if (kind === "boss") return 2;
  return 1;
}
const QUIZ_CHAIN = new Set(["door", "chest", "talk", "read", "boss", "climb", "wake"]);
import { writeNpcReply } from "@/lib/mailAi";
import { nextLetter, replyIdFor, craftReply, WRITE_TO, type CustomLetter } from "./mail";
import { rollMystery, setMystery, type MysteryState } from "./mystery";

export type CombatPhase = "windup" | "solve" | "cast" | "enemy" | "ended";
export type StrikeStyle = "slash" | "jump" | "spin";
export type StrikeTag = "hit" | "crit" | "dodge" | "fumble" | null;

type CombatState = {
  encounter: Encounter;
  playerHp: number;
  enemyHp: number;
  ward: boolean;
  phase: CombatPhase;
  selected?: SpellId;
  style: StrikeStyle;
  tag: StrikeTag;
  triesLeft: number;
  log: string;
  coinsWon: number;
};

type GameStore = {
  screen: Screen;
  grade: GradeBand;
  mathRung: number;
  mathStreak: number;
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
  currentWorld: WorldId | null;
  resumeAt: { x: number; y: number } | null;
  combat: CombatState | null;
  doorQuiz: { houseId: string; tries: number; kind: "door" | "chest" | "heart" | "fish" | "shake" | "shroom" | "talk" | "read" | "climb" | "pack" | "wake" | "mail" | "menu" | "host" | "boss"; need?: number } | null;
  lastResult: "win" | "lose" | null;
  heroName: string;
  heroGender: "boy" | "girl";
  heroLook: HeroLookPick;
  metNpcs: string[];
  hasSword: boolean;
  hasAxe: boolean;
  hasBow: boolean;
  hasShield: boolean;
  hasSling: boolean;
  hasBoom: boolean;
  hasBombs: boolean;
  wood: number;
  houseWood: number;
  holding: "sword" | "axe" | "bow" | "sling" | "boom" | "bomb" | "shield" | "pole" | "none";
  mushrooms: number;
  apples: number;
  rocks: number;
  arrows: number;
  arrowsMax: number;
  bombs: number;
  bombsMax: number;
  seeds: number;
  seedsMax: number;
  coinsMax: number;
  hasHorse: boolean;
  horseName: string;
  horseFeed: number;
  hasOcarina: boolean;
  hasCompass: boolean;
  hasPole: boolean;
  fish: number;
  cooked: number;
  innRoom: number;
  innBed: "" | "hard" | "comfy" | "plush";
  songs: string[];
  seenItems: string[];
  gems: Record<GemId, boolean>;
  gemsPlaced: GemId[];
  openedChests: string[];
  heartsExtra: number;
  heartsFrom: string[];
  quests: Record<string, number>;
  mailGot: string[];
  mailSent: string[];
  mailWait: string[];
  mailCustom: CustomLetter[];
  mystery: MysteryState | null;
  setGrade: (grade: GradeBand) => void;
  noteMath: (correct: boolean) => void;
  setQuest: (id: string, n: number) => void;
  sendMail: (npcId: string, body?: string) => void;
  addMailReply: (letter: CustomLetter) => void;
  setHeroName: (name: string) => void;
  setHeroGender: (g: "boy" | "girl") => void;
  setHeroLook: (look: Partial<HeroLookPick>) => void;
  markMetNpc: (id: string) => void;
  openChest: (id: string) => boolean;
  grantSword: () => void;
  grantAxe: () => void;
  grantBow: () => void;
  grantSling: () => void;
  grantBoom: () => void;
  grantBombs: () => void;
  grantCompass: () => void;
  grantPole: () => void;
  addFish: () => void;
  cookFish: (max?: number) => number;
  eatFish: () => void;
  eatCooked: () => void;
  rentInn: (kind: "hard" | "comfy" | "plush") => boolean;
  eatMeal: (kind: "sandwich" | "stew" | "fish" | "cooked" | "steak" | "eggs") => boolean;
  buyShield: () => boolean;
  buyHearts: () => boolean;
  buyQuiver: () => boolean;
  buyBombBag: () => boolean;
  buySeedBag: () => boolean;
  buyGoldQuiver: () => boolean;
  buyWallet: () => boolean;
  buyHorseFeed: () => boolean;
  sellGood: (kind: "apple" | "mushroom" | "wood" | "fish" | "cooked" | "seeds" | "rocks", all?: boolean) => number;
  addWood: (n?: number) => void;
  holdTool: (id: "sword" | "axe" | "bow" | "sling" | "boom" | "bomb" | "shield" | "pole") => void;
  healGrass: () => void;
  healAll: () => void;
  hurtField: (n: number, raw?: boolean) => void;
  addMushroom: () => void;
  eatMushroom: () => void;
  addApple: () => void;
  eatApple: () => void;
  addRock: () => void;
  throwRock: () => boolean;
  addCoins: (n: number) => number;
  addArrows: (n: number) => number;
  addBombs: (n: number) => number;
  addSeeds: (n: number) => number;
  spendArrow: () => boolean;
  spendBomb: () => boolean;
  spendSeed: () => boolean;
  grantHorse: () => void;
  setHorseName: (name: string) => void;
  grantOcarina: () => void;
  learnSong: (id: string) => void;
  grantGem: (id: GemId) => void;
  grantHeartContainer: (id: string) => boolean;
  drinkTonic: () => boolean;
  refillTonic: () => boolean;
  placeGem: (id: GemId) => void;
  discover: (id: string) => boolean;
  goHub: () => void;
  goMarket: () => void;
  enterWorld: (world: WorldId) => void;
  startEncounter: (encounter: Encounter, at: { x: number; y: number }, style?: StrikeStyle) => void;
  startDoorQuiz: (houseId: string, kind?: "door" | "chest" | "heart" | "fish" | "shake" | "shroom" | "talk" | "read" | "climb" | "wake" | "mail" | "menu" | "host" | "boss" | "pack") => void;
  startHeartQuiz: () => void;
  startFishQuiz: () => void;
  startHarvestQuiz: (kind: "shake" | "shroom" | "talk" | "read" | "climb", id: string) => void;
  startPackQuiz: () => void;
  cancelQuiz: () => void;
  solveDoor: (correct: boolean) => void;
  collectCrystal: (world: WorldId, id: string) => void;
  markDefeated: (world: WorldId, id: string) => void;
  clearWorld: (world: WorldId) => void;
  leaveOverworld: () => void;
  solveTry: (correct: boolean) => void;
  chooseSpell: (id: SpellId) => void;
  finishCast: () => void;
  finishEnemy: () => void;
  abandonCombat: () => void;
  healAtHub: () => void;
  buyWeapon: (id: WeaponId) => boolean;
  buyOutfit: (id: OutfitId) => boolean;
  equipWeapon: (id: WeaponId) => void;
  equipOutfit: (id: OutfitId) => void;
  toggleMute: () => void;
};

export function unlockedSpells(xp: number, ownedWeapons: WeaponId[] = ["reed"]): Spell[] {
  const level = 1 + Math.floor(Math.max(0, xp) / 36);
  const master = ownedWeapons.includes("axiom");
  const elements = new Set(
    WEAPONS.filter((w) => ownedWeapons.includes(w.id) || master).map((w) => w.element),
  );
  if (master) {
    elements.add("leaf");
    elements.add("fire");
    elements.add("ice");
    elements.add("storm");
  }
  return SPELLS.filter((s) => {
    if (s.kind !== "attack") return s.unlockLevel <= Math.min(12, level);
    return Boolean(s.element && elements.has(s.element));
  });
}

function sendHomeFromDeath() {
  live.passedOut = true;
  live.wakeHome = true;
  live.wakeT = 0;
  live.rookFight = false;
  live.bossTitle = null;
  live.bossDying = false;
  live.talking = false;
  live.pendingTalk = null;
  live.talkNpc = null;
  live.paused = false;
  live.doorMath = false;
  live.slash = null;
  live.mounted = false;
  live.down = 0;
  live.dine = null;
  live.sit = false;
  live.cave = false;
  live.pit = 0;
  sfx.over();
}

export const useGame = create<GameStore>()(
  persist(
    (set, get) => ({
      screen: "title",
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
      defeated: {
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
      },
      collected: {
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
      },
      currentWorld: null,
      resumeAt: null,
      combat: null,
      doorQuiz: null,
      lastResult: null,
      heroName: "",
      heroGender: "boy",
      heroLook: { ...DEFAULT_LOOK },
      metNpcs: [],
      hasSword: false,
      hasAxe: false,
      hasBow: false,
      hasShield: false,
      hasSling: false,
      hasBoom: false,
      hasBombs: false,
      wood: 0,
      houseWood: 0,
      holding: "none",
      mushrooms: 0,
      apples: 0,
      rocks: 0,
      arrows: 0,
      arrowsMax: 20,
      bombs: 0,
      bombsMax: 20,
      seeds: 0,
      seedsMax: 20,
      coinsMax: 100,
      hasHorse: false,
      horseName: "",
      horseFeed: 0,
      hasOcarina: false,
      hasCompass: false,
      hasPole: false,
      fish: 0,
      cooked: 0,
      innRoom: 0,
      innBed: "",
      songs: [],
      seenItems: [],
      gems: { emerald: false, ruby: false, sapphire: false },
      gemsPlaced: [],
      openedChests: [],
      heartsExtra: 0,
      heartsFrom: [],
      quests: {},
      mailGot: [],
      mailSent: [],
      mailWait: [],
      mailCustom: [],
      mystery: null,
      setGrade: (grade) => set({ grade, mathRung: startRung(grade), mathStreak: 0 }),
      noteMath: (correct) => {
        const { grade, mathRung, mathStreak } = get();
        set(adjustRung(grade, mathRung ?? startRung(grade), mathStreak ?? 0, correct));
      },
      setQuest: (id, n) => set({ quests: { ...(get().quests ?? {}), [id]: n } }),
      sendMail: (npcId, body) => {
        const name = get().heroName || "Scholar";
        const who = WRITE_TO.find((p) => p.id === npcId);
        const from = who?.name ?? "Friend";
        const wait = get().mailWait ?? [];
        const custom = [...(get().mailCustom ?? [])];
        const sent = get().mailSent ?? [];
        const text = (body ?? "").trim();
        const id = text ? `reply-${npcId}-${Date.now()}` : replyIdFor(npcId);
        if (!id) {
          live.hint = "They would not know what to say back.";
          live.mailSend = false;
          return;
        }
        set({
          mailSent: sent.includes(npcId) ? sent : [...sent, npcId],
          mailWait: wait.includes(id) ? wait : [...wait, id],
          mailCustom: custom,
        });
        live.mailSend = false;
        live.talking = false;
        const invite = text ? parseDinnerInvite(text) : null;
        if (invite && npcId !== "pell") {
          live.dinner = { who: invite.all ? "all" : npcId, hour: invite.hour, arrived: false, left: false, all: invite.all };
          live.hint = invite.all
            ? `Letter sent. The whole town will wait at Pell’s at ${formatHour(invite.hour)}.`
            : `Letter sent. They will wait at Pell’s at ${formatHour(invite.hour)}. Watch a clock.`;
        } else {
          live.hint = "The letter is gone. They will write back.";
        }
        sfx.ok();
        if (text) {
          void writeNpcReply({ data: { from, name, body: text } }).then((res) => {
            const lines = res.ok ? res.lines : craftReply(from, name, text);
            useGame.getState().addMailReply({ id, from, lines });
          });
        }
      },
      addMailReply: (letter) => {
        const custom = [...(get().mailCustom ?? [])];
        if (custom.some((c) => c.id === letter.id)) return;
        const wait = get().mailWait ?? [];
        set({
          mailCustom: [...custom, letter],
          mailWait: wait.includes(letter.id) ? wait : [...wait, letter.id],
        });
      },
      setHeroName: (name) => set({ heroName: name.trim().slice(0, 12) }),
      setHeroGender: (g) => set({ heroGender: g, heroLook: lookForGender(g) }),
      setHeroLook: (look) => set({ heroLook: { ...get().heroLook, ...look } }),
      markMetNpc: (id) => {
        const met = get().metNpcs;
        const quests = { ...(get().quests ?? {}) };
        if (id === "rook") quests.rook = Math.min(3, (quests.rook ?? 0) + 1);
        if (met.includes(id)) {
          if (id === "rook") set({ quests });
          return;
        }
        set({ metNpcs: [...met, id], quests });
      },
      openChest: (id: string) => {
        const list = get().openedChests ?? [];
        if (list.includes(id)) return false;
        set({ openedChests: [...list, id] });
        return true;
      },
      grantSword: () => set({ hasSword: true, holding: "sword" }),
      grantAxe: () => set({ hasAxe: true, holding: "axe" }),
      grantBow: () =>
        set({
          hasBow: true,
          holding: "bow",
          arrows: Math.max(get().arrows ?? 0, 10),
          arrowsMax: get().arrowsMax ?? 20,
        }),
      grantSling: () =>
        set({
          hasSling: true,
          holding: "sling",
          seeds: Math.max(get().seeds ?? 0, 15),
          seedsMax: get().seedsMax ?? 20,
        }),
      grantBoom: () => set({ hasBoom: true, holding: "boom" }),
      grantBombs: () =>
        set({
          hasBombs: true,
          holding: "bomb",
          bombs: Math.max(get().bombs ?? 0, 10),
          bombsMax: get().bombsMax ?? 20,
        }),
      grantCompass: () => set({ hasCompass: true }),
      grantPole: () => set({ hasPole: true }),
      addFish: () => set({ fish: Math.min(12, (get().fish ?? 0) + 1) }),
      cookFish: (max = 3) => {
        const fish = get().fish ?? 0;
        if (fish < 1) return 0;
        const n = Math.min(3, Math.max(1, max), fish);
        set({ fish: fish - n, cooked: (get().cooked ?? 0) + n });
        return n;
      },
      eatFish: () => {
        const fish = get().fish ?? 0;
        if (fish < 1) return;
        const { hp, xp, outfit } = get();
        const max = playerMaxHp(xp, outfit, get().heartsExtra ?? 0);
        set({ fish: fish - 1, hp: Math.min(max, hp + 4) });
        afterMeal();
      },
      eatCooked: () => {
        const cooked = get().cooked ?? 0;
        if (cooked < 1) return;
        const { hp, xp, outfit } = get();
        const max = playerMaxHp(xp, outfit, get().heartsExtra ?? 0);
        set({ cooked: cooked - 1, hp: Math.min(max, hp + 8) });
        afterMeal();
      },
      rentInn: (kind) => {
        const price = kind === "plush" ? 45 : kind === "comfy" ? 20 : 8;
        const coins = get().coins;
        if (coins < price) return false;
        const room = kind === "plush" ? 1 : kind === "comfy" ? 3 : 5;
        set({ coins: coins - price, innRoom: room, innBed: kind });
        live.hint = `Room ${room}. Stairs on the right, then a landing, then left.`;
        return true;
      },
      eatMeal: (kind) => {
        const { coins, hp, xp, outfit, fish, cooked } = get();
        const max = playerMaxHp(xp, outfit, get().heartsExtra ?? 0);
        if (kind === "sandwich") {
          if (coins < 10) return false;
          set({ coins: coins - 10, hp: Math.min(max, hp + 4) });
          afterMeal();
          return true;
        }
        if (kind === "stew") {
          if (coins < 18) return false;
          set({ coins: coins - 18, hp: Math.min(max, hp + 8) });
          afterMeal();
          return true;
        }
        if (kind === "steak") {
          if (coins < 24) return false;
          set({ coins: coins - 24, hp: Math.min(max, hp + 12) });
          afterMeal();
          return true;
        }
        if (kind === "eggs") {
          if (coins < 16) return false;
          set({ coins: coins - 16, hp: Math.min(max, hp + 8) });
          afterMeal();
          return true;
        }
        if (kind === "fish") {
          if ((fish ?? 0) < 1) return false;
          get().eatFish();
          return true;
        }
        if ((cooked ?? 0) < 1) return false;
        get().eatCooked();
        return true;
      },
      buyShield: () => {
        if (get().hasShield || get().coins < 80) return false;
        set({ hasShield: true, coins: get().coins - 80 });
        live.hasShield = true;
        return true;
      },
      buyHearts: () => {
        const { coins, hp, xp, outfit } = get();
        if (coins < 20) return false;
        const max = playerMaxHp(xp, outfit, get().heartsExtra ?? 0);
        if (hp >= max) return false;
        set({ coins: coins - 20, hp: Math.min(max, hp + 4) });
        return true;
      },
      buyQuiver: () => {
        const { coins, hasBow, arrowsMax } = get();
        const cap = arrowsMax ?? 20;
        if (!hasBow || coins < 50 || cap >= 80) return false;
        set({ coins: coins - 50, arrowsMax: cap + 20 });
        return true;
      },
      buyBombBag: () => {
        const { coins, hasBombs, bombsMax } = get();
        const cap = bombsMax ?? 20;
        if (!hasBombs || coins < 50 || cap >= 80) return false;
        set({ coins: coins - 50, bombsMax: cap + 20 });
        return true;
      },
      buySeedBag: () => {
        const { coins, hasSling, seedsMax } = get();
        const cap = seedsMax ?? 20;
        if (!hasSling || coins < 40 || cap >= 80) return false;
        set({ coins: coins - 40, seedsMax: cap + 20 });
        return true;
      },
      buyGoldQuiver: () => {
        const { coins, hasBow, arrowsMax } = get();
        if (!hasBow || coins < 120 || (arrowsMax ?? 20) >= 80) return false;
        set({ coins: coins - 120, arrowsMax: 80 });
        return true;
      },
      buyWallet: () => {
        const { coins, coinsMax } = get();
        if ((coinsMax ?? 100) >= 200 || coins < 100) return false;
        set({ coins: coins - 100, coinsMax: 200 });
        return true;
      },
      buyHorseFeed: () => {
        const { coins, hasHorse, horseFeed } = get();
        const n = horseFeed ?? 0;
        if (!hasHorse || n >= 2) return false;
        const cost = n === 0 ? 80 : 150;
        if (coins < cost) return false;
        set({ coins: coins - cost, horseFeed: n + 1 });
        return true;
      },
      sellGood: (kind, all = false) => {
        const g = get();
        const n0 =
          kind === "cooked"
            ? g.cooked ?? 0
            : kind === "fish"
              ? g.fish ?? 0
              : kind === "wood"
                ? g.wood ?? 0
                : kind === "mushroom"
                  ? g.mushrooms ?? 0
                  : kind === "apple"
                    ? g.apples ?? 0
                    : kind === "seeds"
                      ? g.seeds ?? 0
                      : g.rocks ?? 0;
        if (n0 < 1) return 0;
        const price =
          kind === "cooked" ? 14 : kind === "fish" ? 8 : kind === "wood" ? 5 : kind === "mushroom" ? 4 : kind === "apple" ? 3 : kind === "seeds" ? 2 : 1;
        const room = (g.coinsMax ?? 100) - (g.coins ?? 0);
        if (room < price) {
          live.hint = room <= 0 ? "Pax shrugs. Your wallet is full." : "Your wallet cannot take another rupee.";
          return 0;
        }
        const n = Math.min(all ? n0 : 1, Math.floor(room / price));
        if (kind === "cooked") set({ cooked: n0 - n });
        else if (kind === "fish") set({ fish: n0 - n });
        else if (kind === "wood") set({ wood: n0 - n });
        else if (kind === "mushroom") set({ mushrooms: n0 - n });
        else if (kind === "apple") set({ apples: n0 - n });
        else if (kind === "seeds") set({ seeds: n0 - n });
        else set({ rocks: n0 - n });
        get().addCoins(n * price);
        const word =
          kind === "cooked"
            ? "cooked fish"
            : kind === "fish"
              ? "fish"
              : kind === "wood"
                ? "firewood"
                : kind === "mushroom"
                  ? "mushrooms"
                  : kind === "apple"
                    ? "apples"
                    : kind === "seeds"
                      ? "seeds"
                      : "rocks";
        live.hint = n === 1 ? `Pax bought one. He’ll sell it on.` : `Pax bought ${n} ${word}.`;
        return n;
      },
      addWood: (n = 1) => set({ wood: (get().wood ?? 0) + n }),
      holdTool: (id) => {
        if (id === "sword" && !get().hasSword) return;
        if (id === "axe" && !get().hasAxe) return;
        if (id === "bow" && !get().hasBow) return;
        if (id === "sling" && !get().hasSling) return;
        if (id === "boom" && !get().hasBoom) return;
        if (id === "bomb" && !get().hasBombs) return;
        if (id === "shield" && !get().hasShield) return;
        if (id === "pole" && !get().hasPole) return;
        set({ holding: id });
      },
      healGrass: () => {
        const { hp, xp, outfit } = get();
        const max = playerMaxHp(xp, outfit, get().heartsExtra ?? 0);
        if (hp >= max) return;
        set({ hp: Math.min(max, hp + 4) });
      },
      healAll: () => {
        const { xp, outfit } = get();
        const max = playerMaxHp(xp, outfit, get().heartsExtra ?? 0);
        set({ hp: max });
      },
      hurtField: (n, raw = false) => {
        if (live.god) return;
        if (!raw && live.watch > 0) {
          live.watch = 0;
          sfx.block();
          live.hint = "Wren’s Watch held.";
          return;
        }
        if (!raw && live.shieldUp && get().hasShield) {
          sfx.block();
          return;
        }
        live.heroFlash = 1;
        live.trauma = Math.min(1, live.trauma + 0.55);
        const hp = Math.max(0, get().hp - n);
        if (hp <= 0) {
          sendHomeFromDeath();
          set({ hp: 0, combat: null, doorQuiz: null });
          return;
        }
        set({ hp });
      },
      addMushroom: () => set({ mushrooms: (get().mushrooms ?? 0) + 1 }),
      addApple: () => set({ apples: (get().apples ?? 0) + 1 }),
      eatMushroom: () => {
        const mushrooms = get().mushrooms ?? 0;
        if (mushrooms < 1) return;
        const { hp, xp, outfit } = get();
        const max = playerMaxHp(xp, outfit, get().heartsExtra ?? 0);
        set({
          mushrooms: mushrooms - 1,
          hp: Math.min(max, hp + 4),
        });
        afterMeal();
      },
      eatApple: () => {
        const apples = get().apples ?? 0;
        if (apples < 1) return;
        const { hp, xp, outfit } = get();
        const max = playerMaxHp(xp, outfit, get().heartsExtra ?? 0);
        set({
          apples: apples - 1,
          hp: Math.min(max, hp + 4),
        });
        afterMeal();
        live.appleAte += 1;
        if (live.appleAte === 5) {
          live.hint = "You burped. Birds left.";
          sfx.miss();
        }
      },
      addRock: () => set({ rocks: (get().rocks ?? 0) + 1 }),
      throwRock: () => {
        const rocks = get().rocks ?? 0;
        if (rocks < 1) return false;
        set({ rocks: rocks - 1 });
        return true;
      },
      addCoins: (n) => {
        const coins = get().coins ?? 0;
        const max = get().coinsMax ?? 100;
        const add = Math.max(0, n);
        const next = Math.min(max, coins + add);
        const got = next - coins;
        set({ coins: next });
        if (got > 0) sfx.coin();
        return got;
      },
      addArrows: (n) => {
        const cur = get().arrows ?? 0;
        const max = get().arrowsMax ?? 20;
        const next = Math.min(max, cur + Math.max(0, n));
        set({ arrows: next });
        return next - cur;
      },
      addBombs: (n) => {
        const cur = get().bombs ?? 0;
        const max = get().bombsMax ?? 20;
        const next = Math.min(max, cur + Math.max(0, n));
        set({ bombs: next });
        return next - cur;
      },
      addSeeds: (n) => {
        const cur = get().seeds ?? 0;
        const max = get().seedsMax ?? 20;
        const next = Math.min(max, cur + Math.max(0, n));
        set({ seeds: next });
        return next - cur;
      },
      spendArrow: () => {
        const n = get().arrows ?? 0;
        if (n < 1) return false;
        set({ arrows: n - 1 });
        return true;
      },
      spendBomb: () => {
        const n = get().bombs ?? 0;
        if (n < 1) return false;
        set({ bombs: n - 1 });
        return true;
      },
      spendSeed: () => {
        const n = get().seeds ?? 0;
        if (n < 1) return false;
        set({ seeds: n - 1 });
        return true;
      },
      grantHorse: () => set({ hasHorse: true }),
      setHorseName: (name) => set({ horseName: name.trim().slice(0, 12) || "Rowan" }),
      grantOcarina: () => set({ hasOcarina: true }),
      learnSong: (id) => {
        const ok = ["oak", "sun", "horse", "time", "lull", "storm"];
        if (!ok.includes(id)) return;
        const songs = get().songs ?? [];
        if (songs.includes(id)) return;
        set({ songs: [...songs, id] });
      },
      grantGem: (id) => {
        const gems = { ...get().gems, [id]: true };
        const before = 1 + Math.floor(Math.max(0, get().xp) / 360);
        const xp = get().xp + 180;
        const after = 1 + Math.floor(xp / 360);
        const extra = get().heartsExtra ?? 0;
        const max = playerMaxHp(xp, get().outfit, extra);
        set({ gems, xp, hp: after > before ? max : Math.min(get().hp, max) });
        if (after > before) {
          live.hint = "A new heart.";
          sfx.heal();
        }
      },
      grantHeartContainer: (id) => {
        const from = get().heartsFrom ?? [];
        if (from.includes(id)) return false;
        const extra = (get().heartsExtra ?? 0) + 1;
        const max = playerMaxHp(get().xp, get().outfit, extra);
        set({
          heartsFrom: [...from, id],
          heartsExtra: extra,
          hp: max,
        });
        return true;
      },
      drinkTonic: () => {
        if ((get().quests?.tonic ?? 0) !== 2) return false;
        const max = playerMaxHp(get().xp, get().outfit, get().heartsExtra ?? 0);
        set({ hp: max, quests: { ...(get().quests ?? {}), tonic: 1 } });
        return true;
      },
      refillTonic: () => {
        const { coins, quests } = get();
        if ((quests?.tonic ?? 0) !== 1 || coins < 10) return false;
        set({ coins: coins - 10, quests: { ...(quests ?? {}), tonic: 2 } });
        return true;
      },
      placeGem: (id) => {
        if (!get().gems[id] || get().gemsPlaced.includes(id)) return;
        const gemsPlaced = [...get().gemsPlaced, id];
        set({ gemsPlaced });
        void import("./audio").then((a) => {
          a.playCeremony(gemsPlaced.length >= 3 ? "all" : id);
        });
      },
      discover: (id) => {
        const seen = get().seenItems ?? [];
        if (seen.includes(id)) return false;
        set({ seenItems: [...seen, id] });
        return true;
      },
      goHub: () =>
        set({
          screen: "hub",
          currentWorld: null,
          combat: null,
          resumeAt: null,
          lastResult: null,
        }),
      goMarket: () => set({ screen: "hub", combat: null }),
      enterWorld: (world) =>
        set({
          screen: "overworld",
          currentWorld: world,
          resumeAt: null,
          lastResult: null,
        }),
      startDoorQuiz: (houseId, kind = "door") => {
        live.doorMath = true;
        set({ doorQuiz: { houseId, tries: 2, kind, need: quizNeed(kind) } });
      },
      startHeartQuiz: () => {
        const { hp, xp, outfit } = get();
        if (hp >= playerMaxHp(xp, outfit, get().heartsExtra ?? 0)) return;
        live.doorMath = true;
        set({ doorQuiz: { houseId: "heart", tries: 99, kind: "heart" } });
      },
      startFishQuiz: () => {
        if (!get().hasPole) return;
        live.doorMath = true;
        set({ doorQuiz: { houseId: "fish", tries: 2, kind: "fish" } });
      },
      startHarvestQuiz: (kind, id) => {
        live.doorMath = true;
        set({ doorQuiz: { houseId: id, tries: 2, kind } });
      },
      startPackQuiz: () => {
        if (get().doorQuiz) return;
        if (live.talking || live.doorMath) return;
        live.doorMath = true;
        live.paused = true;
        set({ doorQuiz: { houseId: "pack", tries: 2, kind: "pack" } });
      },
      cancelQuiz: () => {
        const q = get().doorQuiz;
        live.doorMath = false;
        live.paused = false;
        set({ doorQuiz: null });
        if (q?.kind === "boss") {
          get().hurtField(12, true);
          live.hint = "Rook does not wait.";
          sfx.hit();
        }
      },
      solveDoor: (correct) => {
        const q = get().doorQuiz;
        if (!q) return;
        if (correct && QUIZ_CHAIN.has(q.kind) && (q.need ?? 1) > 1) {
          const left = (q.need ?? 1) - 1;
          live.hint = left === 1 ? "One more proof." : `${left} more.`;
          sfx.ok();
          set({ doorQuiz: { houseId: q.houseId, tries: 2, kind: q.kind, need: left } });
          return;
        }
        if (q.kind === "pack") {
          if (correct) {
            live.doorMath = false;
            live.paused = true;
            live.openPack = true;
            set({ doorQuiz: null });
            sfx.open();
          } else if (q.tries <= 1) {
            live.doorMath = false;
            live.paused = false;
            set({ doorQuiz: null });
            live.hint = "The backpack stays shut.";
            sfx.miss();
          } else {
            set({ doorQuiz: { houseId: q.houseId, tries: q.tries - 1, kind: "pack" } });
          }
          return;
        }
        if (q.kind === "heart") {
          if (correct) {
            live.doorMath = false;
            live.paused = false;
            const { hp, xp, outfit } = get();
            const max = playerMaxHp(xp, outfit, get().heartsExtra ?? 0);
            set({ doorQuiz: null, hp: Math.min(max, hp + 4) });
            live.hint = "A heart returns.";
            sfx.heart();
          } else {
            set({ doorQuiz: { houseId: q.houseId, tries: Math.max(1, q.tries - 1), kind: "heart" } });
          }
          return;
        }
        if (q.kind === "fish") {
          if (correct) {
            live.doorMath = false;
            live.paused = false;
            set({ doorQuiz: null });
            live.fishAct = "bite";
            live.fishT = 0;
            live.hint = "A bite!";
            sfx.fish();
            sfx.splash();
          } else if (q.tries <= 1) {
            live.doorMath = false;
            live.paused = false;
            set({ doorQuiz: null });
            live.fishAct = null;
            live.fishT = 0;
            live.fishCool = 4;
            live.hint = "The fish got away.";
            sfx.miss();
          } else {
            set({ doorQuiz: { houseId: q.houseId, tries: q.tries - 1, kind: "fish" } });
          }
          return;
        }
        if (q.kind === "shake" || q.kind === "shroom") {
          if (correct) {
            live.doorMath = false;
            live.paused = false;
            if (q.kind === "shake") live.provedShake.add(q.houseId);
            else live.provedShroom.add(q.houseId);
            set({ doorQuiz: null });
            live.hint = q.kind === "shake" ? "Now hit F to shake the tree." : "Now hit F to pick the mushroom.";
            sfx.ok();
          } else if (q.tries <= 1) {
            live.doorMath = false;
            live.paused = false;
            set({ doorQuiz: null });
            live.hint = q.kind === "shake" ? "The apples hold on." : "The mushroom stays put.";
            sfx.miss();
          } else {
            set({ doorQuiz: { houseId: q.houseId, tries: q.tries - 1, kind: q.kind } });
          }
          return;
        }
        if (q.kind === "mail") {
          if (correct) {
            live.doorMath = false;
            live.paused = false;
            set({ doorQuiz: null });
            const g = get();
            const got = g.mailGot ?? [];
            const wait = g.mailWait ?? [];
            const custom = g.mailCustom ?? [];
            const letter = nextLetter(got, wait, g.metNpcs ?? [], g.worldsCleared ?? [], custom);
            if (letter) {
              set({
                mailGot: [...got, letter.id],
                mailWait: wait.filter((id) => id !== letter.id),
              });
              live.letter = { from: letter.from, lines: letter.lines(g.heroName || "Scholar") };
            } else {
              live.letter = null;
            }
            live.mailAct = "open";
            live.mailT = 0;
            live.mailReady = true;
            sfx.open();
          } else if (q.tries <= 1) {
            live.doorMath = false;
            live.paused = false;
            set({ doorQuiz: null });
            live.hint = "The mailbox stays shut.";
            sfx.miss();
          } else {
            set({ doorQuiz: { houseId: q.houseId, tries: q.tries - 1, kind: "mail" } });
          }
          return;
        }
        if (q.kind === "menu") {
          if (correct) {
            live.doorMath = false;
            live.paused = false;
            set({ doorQuiz: null });
            live.menuOpen = true;
            if (live.dine) live.dine.phase = "order";
            live.hint = "The menu opens.";
            sfx.open();
          } else if (q.tries <= 1) {
            live.doorMath = false;
            live.paused = false;
            set({ doorQuiz: null });
            live.hint = "The menu stays shut.";
            sfx.miss();
            get().hurtField(4, true);
          } else {
            live.hint = "Wrong. The menu bites.";
            get().hurtField(4, true);
            set({ doorQuiz: { houseId: q.houseId, tries: q.tries - 1, kind: "menu" } });
          }
          return;
        }
        if (q.kind === "host") {
          if (correct) {
            live.doorMath = false;
            live.paused = false;
            set({ doorQuiz: null });
            live.dine = blankDine({
              phase: "host",
              guest: live.dinner?.arrived && !live.dinner.left ? live.dinner.who : null,
              guests: live.dinner?.all && live.dinner.arrived && !live.dinner.left
                ? ["cobb", "oak0", "oak1", "oak2", "oak4", "oak5", "holt", "oak6"]
                : live.dinner?.arrived && !live.dinner.left && live.dinner.who && live.dinner.who !== "all"
                  ? [live.dinner.who]
                  : [],
              hostX: live.x,
              hostZ: live.z,
            });
            live.talking = true;
            live.hint = "Pell: How many people for?";
            sfx.select();
          } else if (q.tries <= 1) {
            live.doorMath = false;
            live.paused = false;
            set({ doorQuiz: null });
            live.hint = "Pell waits until you prove it.";
            sfx.miss();
          } else {
            set({ doorQuiz: { houseId: q.houseId, tries: q.tries - 1, kind: "host" } });
          }
          return;
        }
        if (q.kind === "talk" || q.kind === "read") {
          if (correct) {
            live.doorMath = false;
            live.paused = false;
            set({ doorQuiz: null });
            live.pendingTalk = q.houseId;
            live.talking = true;
            sfx.select();
          } else if (q.tries <= 1) {
            live.doorMath = false;
            live.paused = false;
            set({ doorQuiz: null });
            live.hint = q.kind === "read" ? "The words stay shut." : "They wait until you prove it.";
            sfx.miss();
          } else {
            set({ doorQuiz: { houseId: q.houseId, tries: q.tries - 1, kind: q.kind } });
          }
          return;
        }
        if (q.kind === "boss") {
          if (correct) {
            live.doorMath = false;
            live.paused = false;
            live.rookWound = 56;
            set({ doorQuiz: null });
            live.hint = "The proof cuts.";
            sfx.hit();
          } else if (q.tries <= 1) {
            live.doorMath = false;
            live.paused = false;
            set({ doorQuiz: null });
            get().hurtField(6, true);
            live.hint = "Rook does not wait.";
            sfx.hit();
          } else {
            live.hint = "Wrong. He is still growing.";
            set({ doorQuiz: { houseId: q.houseId, tries: q.tries - 1, kind: "boss" } });
          }
          return;
        }
        if (q.kind === "climb") {
          if (correct) {
            live.doorMath = false;
            live.paused = false;
            live.climbOut = true;
            set({ doorQuiz: null });
            live.hint = "The light takes you.";
            sfx.ok();
          } else if (q.tries <= 1) {
            live.doorMath = false;
            live.paused = false;
            set({ doorQuiz: null });
            live.hint = "The hole stays shut. Try again.";
            sfx.miss();
          } else {
            set({ doorQuiz: { houseId: q.houseId, tries: q.tries - 1, kind: "climb" } });
          }
          return;
        }
        if (correct) {
          live.doorMath = false;
          if (q.kind === "chest") {
            live.chestUnlock = q.houseId;
            live.hint = "The lock yields.";
          } else {
            live.doorUse = { id: q.houseId, t: 0, dir: "in", opened: false };
            live.doorReach = true;
            live.hint = "The lock yields.";
          }
          set({ doorQuiz: null });
          return;
        }
        const tries = q.tries - 1;
        if (tries <= 0) {
          live.doorMath = false;
          live.hint = q.kind === "chest" ? "The chest stays shut. Try again." : "The door stays shut. Try again.";
          set({ doorQuiz: null });
          return;
        }
        live.hint = q.kind === "chest" ? "Wrong. The chest bites back." : "Wrong. The lock bites.";
        get().hurtField(4, true);
        set({ doorQuiz: { houseId: q.houseId, tries, kind: q.kind } });
      },
      startEncounter: () => {
        live.engaged = false;
      },
      collectCrystal: (world, id) => {
        const collected = { ...get().collected };
        const list = new Set(collected[world] ?? []);
        if (list.has(id)) return;
        list.add(id);
        collected[world] = [...list];
        const xp = get().xp + 6;
        const maxHp = playerMaxHp(xp, get().outfit, get().heartsExtra ?? 0);
        set({ collected, xp, hp: Math.min(maxHp, get().hp + 2), coins: Math.min(get().coinsMax ?? 100, get().coins + 2) });
      },
      markDefeated: (world, id) => {
        const defeated = { ...get().defeated };
        const list = new Set(defeated[world] ?? []);
        list.add(id);
        defeated[world] = [...list];
        set({ defeated });
      },
      clearWorld: (world) => {
        const already = get().worldsCleared.includes(world);
        const worldsCleared = Array.from(new Set([...get().worldsCleared, world]));
        const bonus = world === "echo" && !already ? 200 : world === "keep" && !already ? 80 : 0;
        const horse = get().hasHorse;
        const gem = gemForWorld(world);
        const gems = { ...get().gems };
        if (gem && !already) gems[gem] = true;
        set({
          worldsCleared,
          coins: Math.min(get().coinsMax ?? 100, get().coins + bonus),
          hasHorse: horse,
          gems,
          screen: "hub",
          currentWorld: null,
          resumeAt: null,
        });
      },
      leaveOverworld: () =>
        set({ screen: "hub", currentWorld: null, resumeAt: null }),
      solveTry: (correct) => {
        const combat = get().combat;
        if (!combat || combat.phase !== "solve") return;
        if (correct) {
          set({
            combat: {
              ...combat,
              phase: "cast",
              triesLeft: 2,
              tag: null,
              log: combat.style === "spin" ? "The proof holds. Spin!" : combat.style === "jump" ? "The proof holds. Jump strike!" : "The proof holds. Slice!",
            },
          });
          return;
        }
        const left = combat.triesLeft - 1;
        if (left > 0) {
          set({
            combat: {
              ...combat,
              triesLeft: left,
              log: "Not yet. One more try.",
            },
          });
          return;
        }
        live.fight.tag = "fumble";
        set({
          combat: {
            ...combat,
            phase: "enemy",
            triesLeft: 2,
            tag: "fumble",
            log: "FUMBLE! The sword misses. The lizard’s turn.",
          },
        });
      },
      chooseSpell: (id) => {
        const combat = get().combat;
        if (!combat || combat.phase !== "solve") return;
        set({ combat: { ...combat, selected: id } });
      },
      finishCast: () => {
        const { combat, xp, weapon, outfit } = get();
        if (!combat || combat.phase !== "cast") return;
        const gear = weaponById(weapon);
        const lv = 1 + Math.floor(Math.max(0, xp) / 360);
        let power = 8 + gear.atk + (lv - 1) * 2;
        if (combat.style === "spin") power *= 2;
        if (combat.style === "jump") power *= 2;
        const roll = Math.random();
        let tag: StrikeTag = "hit";
        let mark = "";
        if (roll < 0.14) {
          tag = "crit";
          power *= 2;
          mark = " CRITICAL!";
        } else if (roll < 0.3) {
          tag = "dodge";
          power = Math.max(1, Math.round(power * 0.4));
          mark = " They dodge — a glancing blow.";
        }
        live.fight.tag = tag;
        const enemyHp = Math.max(0, combat.enemyHp - power);
        const log = `You hit for ${power}.${mark}`;
        const foe = combat.encounter.enemy;

        if (enemyHp <= 0) {
          const gained = foe.xp;
          const loot = foe.coins ?? 10;
          const nextXp = xp + gained;
          const before = 1 + Math.floor(Math.max(0, xp) / 360);
          const after = 1 + Math.floor(Math.max(0, nextXp) / 360);
          const maxHp = playerMaxHp(nextXp, outfit, get().heartsExtra ?? 0);
          if (after > before) {
            live.hint = "A new heart.";
            sfx.heal();
          }
          set({
            xp: nextXp,
            hp: after > before ? maxHp : Math.min(maxHp, combat.playerHp),
            coins: Math.min(get().coinsMax ?? 100, get().coins + loot),
            lastResult: "win",
            combat: {
              ...combat,
              enemyHp: 0,
              tag,
              phase: "ended",
              coinsWon: loot,
              log: `${log} ${foe.name} falls. +${loot} rupees.`,
            },
          });
          return;
        }

        set({
          hp: combat.playerHp,
          combat: {
            ...combat,
            enemyHp,
            tag,
            phase: "enemy",
            log: `${log} The lizard runs in.`,
          },
        });
      },
      finishEnemy: () => {
        const { combat } = get();
        if (!combat || combat.phase !== "enemy") return;
        const enemy = combat.encounter.enemy;
        let incoming = enemy.damage;
        let tag: StrikeTag = combat.tag === "fumble" ? "hit" : "hit";
        let extra = "";
        if (combat.tag === "fumble") {
          incoming = enemy.damage;
          extra = " You fumbled — they scratch you.";
        } else {
          const roll = Math.random();
          if (roll < 0.14) {
            tag = "crit";
            incoming *= 2;
            extra = " CRITICAL! It really hurts.";
          } else if (roll < 0.32) {
            tag = "dodge";
            incoming = Math.max(1, Math.round(incoming * 0.35));
            extra = " You dodge — only a nick.";
          }
        }
        live.fight.tag = tag;
        if (live.shieldUp && get().hasShield) {
          if (tag === "crit") {
            incoming = Math.max(1, Math.round(enemy.damage * 0.25));
            extra = " The Hero’s Shield takes the worst of it.";
          } else {
            incoming = 0;
            extra = " The Hero’s Shield catches the scratch.";
            tag = "dodge";
            live.fight.tag = "dodge";
          }
        } else if (get().hasShield) incoming = Math.max(1, Math.round(incoming * 0.55));
        const playerHp = Math.max(0, combat.playerHp - incoming);
        const log = `${combat.log} ${enemy.name} scratches for ${incoming}.${extra}`;

        if (playerHp <= 0) {
          sendHomeFromDeath();
          set({
            hp: 0,
            lastResult: "lose",
            screen: "overworld",
            currentWorld: get().currentWorld ?? "meadow",
            combat: null,
          });
          return;
        }

        set({
          hp: playerHp,
          combat: {
            ...combat,
            playerHp,
            tag,
            phase: "windup",
            triesLeft: 2,
            log: `${log} Your turn.`,
          },
        });
      },
      abandonCombat: () => {
        const { lastResult, combat, currentWorld } = get();
        if (lastResult === "win" && combat && currentWorld) {
          get().markDefeated(currentWorld, combat.encounter.enemyInstanceId);
        }
        live.engaged = false;
        live.fight.foeId = null;
        live.fight.heroAct = "idle";
        live.fight.foeAct = "idle";
        live.fight.tag = null;
        live.jumpAtk = false;
        set({
          screen: currentWorld ? "overworld" : "hub",
          combat: null,
          resumeAt: lastResult === "lose" ? null : get().resumeAt,
          lastResult: null,
        });
      },
      healAtHub: () => {
        set({ hp: playerMaxHp(get().xp, get().outfit, get().heartsExtra ?? 0) });
      },
      buyWeapon: (id) => {
        const item = weaponById(id);
        const { coins, ownedWeapons } = get();
        if (ownedWeapons.includes(id) || coins < item.price) return false;
        set({
          coins: coins - item.price,
          ownedWeapons: [...ownedWeapons, id],
          weapon: id,
        });
        return true;
      },
      buyOutfit: (id) => {
        const item = outfitById(id);
        const { coins, ownedOutfits, xp, hp } = get();
        if (ownedOutfits.includes(id) || coins < item.price) return false;
        const nextHp = Math.min(playerMaxHp(xp, id, get().heartsExtra ?? 0), hp + item.hp);
        set({
          coins: coins - item.price,
          ownedOutfits: [...ownedOutfits, id],
          outfit: id,
          hp: nextHp,
        });
        return true;
      },
      equipWeapon: (id) => {
        if (!get().ownedWeapons.includes(id)) return;
        set({ weapon: id });
      },
      equipOutfit: (id) => {
        if (!get().ownedOutfits.includes(id)) return;
        const max = playerMaxHp(get().xp, id, get().heartsExtra ?? 0);
        set({ outfit: id, hp: Math.min(get().hp, max) });
      },
      toggleMute: () => set({ muted: !get().muted }),
    }),
    {
      name: "numera-save-v1",
      partialize: (s) => ({
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
        heroGender: s.heroGender,
        heroLook: s.heroLook,
        metNpcs: s.metNpcs,
        hasSword: s.hasSword,
        hasAxe: s.hasAxe,
        hasBow: s.hasBow,
        hasShield: s.hasShield,
        hasSling: s.hasSling,
        hasBoom: s.hasBoom,
        hasBombs: s.hasBombs,
        wood: s.wood,
        houseWood: s.houseWood,
        holding: s.holding,
        mushrooms: s.mushrooms,
        apples: s.apples,
        rocks: s.rocks,
        arrows: s.arrows,
        arrowsMax: s.arrowsMax,
        bombs: s.bombs,
        bombsMax: s.bombsMax,
        seeds: s.seeds,
        seedsMax: s.seedsMax,
        coinsMax: s.coinsMax,
        hasHorse: s.hasHorse,
        horseName: s.horseName ?? "",
        horseFeed: s.horseFeed ?? 0,
        hasOcarina: s.hasOcarina,
        hasCompass: s.hasCompass,
        hasPole: s.hasPole,
        fish: s.fish,
        cooked: s.cooked,
        songs: s.songs,
        seenItems: s.seenItems,
        gems: s.gems,
        gemsPlaced: s.gemsPlaced,
        openedChests: s.openedChests,
        heartsExtra: s.heartsExtra,
        heartsFrom: s.heartsFrom,
        quests: s.quests,
        mailGot: s.mailGot,
        mailSent: s.mailSent,
        mailWait: s.mailWait,
        mailCustom: s.mailCustom,
        mystery: s.mystery,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as typeof current;
        return {
          ...current,
          ...p,
          heroLook: lookForGender(p.heroGender === "girl" ? "girl" : "boy"),
          mathRung: clampRung((p.grade as GradeBand) ?? current.grade, typeof p.mathRung === "number" ? p.mathRung : undefined),
          mathStreak: typeof p.mathStreak === "number" ? p.mathStreak : 0,
          houseWood: typeof p.houseWood === "number" ? p.houseWood : 0,
          horseFeed: typeof p.horseFeed === "number" ? p.horseFeed : 0,
          horseName: typeof p.horseName === "string" ? p.horseName : "",
          hasHorse: Boolean(p.horseName),
        };
      },
    },
  ),
);

export function worldUnlocked(
  world: WorldId,
  cleared: WorldId[],
  gems?: Record<GemId, boolean>,
): boolean {
  if (world === "meadow") return true;
  if (world === "cavern") return cleared.includes("meadow");
  if (world === "marsh") return cleared.includes("cavern");
  if (world === "keep") return Boolean(gems?.emerald && gems?.ruby && gems?.sapphire);
  if ((SECOND_ARC as readonly string[]).includes(world)) {
    if (!cleared.includes("keep")) return false;
    const i = SECOND_ARC.indexOf(world as (typeof SECOND_ARC)[number]);
    return i <= 0 || cleared.includes(SECOND_ARC[i - 1]!);
  }
  if (world === "echo") return SECOND_ARC.every((w) => cleared.includes(w));
  if ((THIRD_ARC as readonly string[]).includes(world)) {
    if (!cleared.includes("echo")) return false;
    const i = THIRD_ARC.indexOf(world as (typeof THIRD_ARC)[number]);
    return i <= 0 || cleared.includes(THIRD_ARC[i - 1]!);
  }
  if (world === "vault") return THIRD_ARC.every((w) => cleared.includes(w));
  if (world === "arena") return cleared.includes("keep");
  const idx = WORLD_ORDER.indexOf(world);
  if (idx <= 0) return true;
  return cleared.includes(WORLD_ORDER[idx - 1]!);
}
