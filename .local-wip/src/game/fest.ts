import { live, gameClock } from "./world3d/live";
import { VX, VZ, VR, WELL_AT, vWorld, ORCHARD_TREE } from "./world3d/field";
import { revealItem } from "./items";
import { sfx } from "./audio";
import type { GradeBand } from "./types";
import { useGame } from "./store";

const FARM_AT = { x: 50, z: -98 };
const FIRE_PIT = { x: VX, z: VZ + 8 };
const FOUNTAIN = { x: VX + 2, z: VZ - 18 };
const MILL_AT = vWorld(2, -116);
const PADDOCK = { x: VX + 28, z: VZ + 24 };

function inVillage(x: number, z: number) {
  return Math.hypot(x - VX, z - VZ) < VR;
}

/** Oakstead’s yearly fair. The last leaf is still green. */

export type FestGame = "arch" | "toss" | "race" | "count" | "hide" | "help" | "wheel";

export const FEST_GAMES: FestGame[] = ["arch", "toss", "race", "count", "hide", "help", "wheel"];

export const FEST_SPOTS = {
  arch: { x: VX + 16.4, z: VZ + 7.2 },
  toss: { x: VX - 12.2, z: VZ + 5.4 },
  race: { x: FOUNTAIN.x, z: FOUNTAIN.z + 2.4 },
  well: { x: WELL_AT.x, z: WELL_AT.z },
  count: { x: VX - 3.4, z: VZ - 8.6 },
  wheel: { x: VX + 9.2, z: VZ + 1.6 },
  table: { x: FIRE_PIT.x + 4.6, z: FIRE_PIT.z + 1.2 },
  crate: { x: FARM_AT.x - 2.2, z: FARM_AT.z + 2.8 },
  board: { x: VX + 3.4, z: VZ + 4.8 },
};

export const FEST_RIBBONS: { id: string; x: number; z: number; color: string; hint: string }[] = [
  { id: "well", x: WELL_AT.x + 0.6, z: WELL_AT.z - 0.4, color: "#c42828", hint: "Tied to the well." },
  { id: "mill", x: MILL_AT.x + 2.8, z: MILL_AT.z + 0.4, color: "#2a6ad8", hint: "The mill wheel wears a ribbon." },
  { id: "paddock", x: PADDOCK.x - 5.4, z: PADDOCK.z - 1.2, color: "#e8d48a", hint: "A gold scrap on the paddock rail." },
  { id: "orchard", x: ORCHARD_TREE.x + 1.4, z: ORCHARD_TREE.z + 1.1, color: "#3d7a48", hint: "Mira’s tree kept one." },
  { id: "inn", x: VX + 21.4, z: VZ - 5.2, color: "#a83888", hint: "The inn rail has a purple one." },
];

export function festDark(): boolean {
  const g = useGame.getState();
  const c = (g.worldsCleared ?? []) as string[];
  if (c.includes("keep") || c.includes("echo") || c.includes("vault")) return true;
  if ((g.gemsPlaced ?? []).length >= 3) return true;
  if (["grove", "crater", "lake", "grave", "waste", "ridge", "spire", "fen", "hollow"].some((w) => c.includes(w))) return true;
  return false;
}

export function festReady(): boolean {
  if (festDark()) return false;
  const g = useGame.getState();
  if (!g.hasSword) return false;
  if ((g.quests?.lefthome ?? 0) < 1) return false;
  const places = g.placesSeen ?? [];
  return places.includes("oakstead") || inVillage(live.x, live.z);
}

export function festPhase(): 0 | 1 | 2 | 3 {
  const n = useGame.getState().quests?.fest ?? 0;
  if (n >= 3) return 3;
  if (n >= 2) return 2;
  if (n >= 1) return 1;
  return 0;
}

/** Decorations and games. On for the whole early adventure once the town hung lanterns. */
export function festOn(): boolean {
  return festPhase() === 2 && !festDark();
}

/** Extra glow, dancers, lamps. Dusk and night feel like a real fair. */
export function festGlow(): boolean {
  if (!festOn()) return false;
  const t = gameClock().t;
  return t >= 17.0 || t < 7.8;
}

export function festGameDone(id: FestGame): boolean {
  return (useGame.getState().quests?.[`fest_${id}`] ?? 0) >= 1;
}

export function festScore(): number {
  return FEST_GAMES.filter(festGameDone).length;
}

export function duskOrNight(): boolean {
  const t = gameClock().t;
  return t >= 17.2 || t < 7.6;
}

export function beginFest(force = false) {
  const g = useGame.getState();
  if (festDark() && !force) return false;
  if (festPhase() === 2) return false;
  g.setQuest("fest", 2);
  live.miraUp = false;
  live.banner = "The Last Leaf Fair";
  live.bannerSub = "Oakstead hung lanterns. The leaf is still green.";
  sfx.ok();
  live.listen = "Lanterns. Bunting. The square is loud on purpose.";
  return true;
}

export function announceFest() {
  const g = useGame.getState();
  if ((g.quests?.fest ?? 0) >= 1) return false;
  g.setQuest("fest", 1);
  return true;
}

export function endFest(why: "door" | "dawn" | "done" = "door") {
  const g = useGame.getState();
  if ((g.quests?.fest ?? 0) < 2) return false;
  g.setQuest("fest", 3);
  live.miraUp = true;
  if (why === "door") live.listen = live.listen || "The lanterns came down. Nobody said why.";
  return true;
}

export function markFestGame(id: FestGame, coins: number, listen: string) {
  const g = useGame.getState();
  const key = `fest_${id}`;
  if ((g.quests?.[key] ?? 0) >= 1) {
    live.listen = listen;
    return false;
  }
  g.setQuest(key, 1);
  if (coins > 0) {
    const n = g.addCoins(coins);
    if (n > 0) revealItem("coin");
  }
  sfx.ok();
  live.listen = listen;
  maybeFestPrizes();
  return true;
}

export function maybeFestPrizes() {
  const g = useGame.getState();
  const n = festScore();
  if (n >= 4 && (g.quests?.festCrown ?? 0) < 1) {
    g.setQuest("festCrown", 1);
    live.hat = "leaf";
    live.getItem = "leafcrown";
    live.getTitle = "You got a Leaf Crown!";
    live.getBlurb = "Oakstead hung it on you. The last leaf is still green.";
    revealItem("leafcrown", true);
  }
  if (n >= 6 && g.grantHeartContainer("leaf-fair")) {
    live.getItem = "container";
    live.getTitle = "You got a Heart Container!";
    live.getBlurb = "The fair paid you in a gold heart. Every heart filled.";
    revealItem("container", true);
    g.setQuest("festHeart", 1);
  }
}

export type CountProb = {
  a: number;
  b: number;
  op: "+" | "−" | "×";
  answer: number;
  choices: [number, number, number];
};

export function countProblem(grade: GradeBand, seed = 1): CountProb {
  const s = Math.abs(Math.floor(seed)) || 1;
  const pick = (lo: number, hi: number, salt: number) => lo + ((s * 17 + salt * 13) % (hi - lo + 1));
  let a: number;
  let b: number;
  let op: CountProb["op"];
  let answer: number;
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
  if (wrongA === answer) {
    /* keep */
  }
  const raw = [answer, wrongA === answer ? answer + 3 : wrongA, wrongB === answer || wrongB === wrongA ? answer + 4 : wrongB];
  const uniq = [...new Set(raw.map((n) => Math.max(0, n)))];
  while (uniq.length < 3) uniq.push((uniq[uniq.length - 1] ?? answer) + 2);
  const rot = s % 3;
  const choices = [uniq[rot]!, uniq[(rot + 1) % 3]!, uniq[(rot + 2) % 3]!] as [number, number, number];
  return { a, b, op, answer, choices };
}

export function tickFest() {
  if (live.house || live.dungeon || live.cave || live.below) return;
  if (festDark()) {
    if (festPhase() === 2) endFest("door");
    return;
  }
  if (!festReady()) return;
  const phase = festPhase();
  if (phase === 0) announceFest();
  if (phase === 1 && inVillage(live.x, live.z) && (duskOrNight() || useGame.getState().gems?.emerald)) {
    beginFest();
  }
}

export type FestGoal = { x: number; z: number; sit?: boolean; hide?: boolean; yaw?: number };

/** NPCs leave their jobs and fill the square. Mira comes down. */
export function festGoal(id: string): FestGoal | null {
  if (!festOn()) return null;
  const fire = FIRE_PIT;
  switch (id) {
    case "holt":
      return { x: fire.x + 5.2, z: fire.z + 0.4 };
    case "bramble":
      return { x: fire.x + 5.8, z: fire.z - 1.6 };
    case "cobb":
      return { x: FEST_SPOTS.count.x + 1.4, z: FEST_SPOTS.count.z + 1.1 };
    case "flint":
      return { x: FEST_SPOTS.arch.x - 3.4, z: FEST_SPOTS.arch.z + 0.6, sit: true };
    case "mill-man":
    case "oak4":
      return { x: fire.x - 4.8, z: fire.z + 2.2 };
    case "oak5":
      return { x: fire.x - 3.2, z: fire.z - 2.6 };
    case "oak6":
      return { x: FEST_SPOTS.toss.x + 2.2, z: FEST_SPOTS.toss.z };
    case "oak0":
      return { x: fire.x + 2.4, z: fire.z + 3.6 };
    case "oak1":
      return { x: fire.x - 1.8, z: fire.z + 3.2, sit: true, yaw: Math.PI };
    case "oak2":
    case "tess":
      return { x: FEST_SPOTS.race.x + 1.2, z: FEST_SPOTS.race.z };
    case "oak3":
      return { x: WELL_AT.x + 2.4, z: WELL_AT.z + 1.6 };
    case "tallow":
      return { x: fire.x + 1.4, z: fire.z - 3.4 };
    case "ash":
      if (live.ashFollow) return null;
      return { x: FEST_SPOTS.arch.x - 2.2, z: FEST_SPOTS.arch.z - 1.4 };
    case "nora":
      return { x: fire.x + 4.2, z: fire.z + 2.8 };
    case "pell":
      return { x: FEST_SPOTS.table.x, z: FEST_SPOTS.table.z };
    case "mira":
      return { x: fire.x - 0.4, z: fire.z - 3.8 };
    case "fern":
      return { x: FEST_SPOTS.board.x + 0.6, z: FEST_SPOTS.board.z - 1.2 };
    case "reed":
      return { x: fire.x + 3.1, z: fire.z - 2.4, sit: true };
    case "finn":
      return null;
    default:
      return null;
  }
}

export function festTalk(who: string, name: string): string | null {
  if (festDark()) {
    if (festPhase() >= 2) return `${name}. The lanterns came down. I do not want to talk about why.`;
    return null;
  }
  const phase = festPhase();
  if (phase === 0 && !festReady()) return null;
  const n = festScore();
  const bits: Record<string, string> = {
    Fern:
      phase < 2
        ? "Tonight is the Last Leaf Fair. I pinned it. I always pin it. Come back when the lamps are on."
        : n >= 6
          ? "You did the booths. I pinned a gold heart. I do not pin gold hearts."
          : "The Last Leaf Fair. Archery east. Pots west. Tess will race you. Cobb counts lanterns. Pell wants a crate. Ribbons hide. The wheel is a liar.",
    Cole:
      phase < 2
        ? `The fair is after dusk, ${name}. I like the quiet before it.`
        : "I am sitting. That is my fair activity. Do not make me race Tess.",
    Tess:
      phase < 2
        ? "THE FAIR!! Tonight we race around the well!! I have been stretching!!"
        : "Race me!! Fountain, well, fountain!! Sprint or I win forever!!",
    Ash:
      phase < 2
        ? "The fair hangs targets east of the square. Bring a sling. Or a bow. Or a rock if you are stubborn."
        : "Five hanging marks. Hit them. I will not clap unless you hit all five.",
    Pell:
      phase < 2
        ? "I am making too much stew. That is how I know the fair is coming."
        : "A crate of pies is still at Holt’s rows. The table is empty without it.",
    Holt:
      phase < 2
        ? "I packed four pie crates. Cobb will count three. He always does."
        : "Take the crate if you can lift it. I packed four. Do not drop one.",
    Cobb:
      phase < 2
        ? "The count booth has three lanterns. People step on the wrong one. I keep score."
        : "Three lanterns. One answer. The fourth lantern does not light. I did not hang a fourth. Someone did.",
    Mira:
      phase < 2
        ? "I will come down when the lanterns go up. The apples can count themselves for one night."
        : `${name}. I came down. The leaf is still green. Eat something that is not an apple.`,
    Wren: phase === 2 ? "Wipe your feet. Then dance. Then wipe your feet again." : "",
    Flint: phase === 2 ? "I am watching the targets. I will not smith tonight. The anvil can wait." : "",
    Bramble: phase === 2 ? "The rows can keep. I brought pies. Do not tell Cobb how many." : "",
    Tallow: phase === 2 ? "Ribbons!! Five colors!! I hid them so good even I forgot one!!" : "",
    Nora: phase === 2 ? "Bread for the fair. Do not throw it at the pots. Tess already tried." : "",
    Reed: phase === 2 ? "Wood for the fire. The fire is already too big. I brought more anyway." : "",
    Finn: phase === 2 ? "The pond is quieter. Everyone is in the square. The fish noticed." : "",
    Brin: phase === 2 ? "Tess says she will win. I counted. She is probably right. I hate it." : "",
    Pip: phase === 2 ? "Fair!! Fair!! Nana look at the lamps!!" : "",
    Nana: phase === 2 ? "A good night, if they do not set the mill on fire." : "",
  };
  const text = bits[who];
  return text || null;
}
