import type { WorldId } from "./types";
import { TREE_TRUNK, WELL_AT, POND, TINY_HOLE, MOLE_AT, vWorld, pondU } from "./world3d/field";
import { live } from "./world3d/live";
import { FW, inRapids, landFeel } from "./world3d/lands";
import { roomZ } from "./world3d/dungeonLayout";
import { useGame } from "./store";
import { revealItem } from "./items";
import { takeCipher } from "./cipher";
import { sfx } from "./audio";

export type NimJobKind = "sniff" | "dig" | "crawl" | "fetch" | "track";

export type NimSpot = {
  id: string;
  kind: NimJobKind;
  world: WorldId | "any";
  x: number;
  z: number;
  r: number;
  /** Where she actually goes (hole, mound, item). */
  at?: { x: number; z: number };
  hole?: { x: number; z: number };
  plate?: { x: number; z: number };
  fetch?: { x: number; z: number };
  trail?: { x: number; z: number }[];
  /** Dig only after this sniff id. */
  needSniff?: string;
  coins?: number;
  cipher?: string;
  quest?: [string, number];
  line: string;
  notice: string;
};

const MILL = vWorld(2, -116);
const STALL = vWorld(18, -42);
const MANOR = { x: -48, z: -124 };
const PADDOCK = { x: 28, z: -84 };
const FARM = { x: 50, z: -98 };
const CACHE = { x: TREE_TRUNK.x + 9.2, z: TREE_TRUNK.z - 16.4 };

/** Sealed west alcove in Sun Hollow room 3 — player does not fit. */
export function foxVent() {
  const z = roomZ(3);
  return {
    z,
    wallX: -22.15,
    hole: { x: -22.15, z },
    innerPlate: { x: -27.2, z },
    playerPlate: { x: 7.4, z: z - 8.2 },
    chest: { x: -17.6, z: z + 6.2 },
    barsX: -16.2,
    innerMinX: -32.6,
    halfZ: 5.7,
  };
}

export function collideFoxChamber(nx: number, nz: number): { x: number; z: number } | null {
  if (!live.dungeon) return null;
  const v = foxVent();
  if (nx < v.wallX + 0.58 && nx > v.innerMinX && Math.abs(nz - v.z) < v.halfZ) {
    return { x: v.wallX + 0.64, z: nz };
  }
  return null;
}

export function nimSpots(): NimSpot[] {
  const vent = foxVent();
  return [
    {
      id: "yard-sniff",
      kind: "sniff",
      world: "meadow",
      x: TREE_TRUNK.x + 17,
      z: TREE_TRUNK.z + 5.4,
      r: 3.2,
      notice: "The dirt is chewing on something. I can hear it.",
      line: "I pointed with my nose. I am not drawing you a map.",
    },
    {
      id: "yard-dig",
      kind: "dig",
      world: "meadow",
      x: TREE_TRUNK.x + 17.4,
      z: TREE_TRUNK.z + 5.8,
      r: 2.4,
      needSniff: "yard-sniff",
      coins: 12,
      notice: "Fine. I will do the digging. You may watch and look important.",
      line: "Buried coins. Gran will say I stole them from the lamp. I did not.",
    },
    {
      id: "cache-sniff",
      kind: "sniff",
      world: "meadow",
      x: CACHE.x,
      z: CACHE.z,
      r: 3.4,
      notice: "Nothing is here. That is how you know something is here.",
      line: "There. Under the ordinary grass. Ordinary is a disguise.",
    },
    {
      id: "cache-dig",
      kind: "dig",
      world: "meadow",
      x: CACHE.x + 0.35,
      z: CACHE.z + 0.2,
      r: 2.2,
      needSniff: "cache-sniff",
      coins: 18,
      cipher: "nim",
      notice: "I will scratch. You will pretend the vale told you.",
      line: "A mark the dirt was keeping. I do not keep marks. I keep moving.",
    },
    {
      id: "root-crawl",
      kind: "crawl",
      world: "meadow",
      x: TREE_TRUNK.x - 1.6,
      z: TREE_TRUNK.z + 0.6,
      r: 2.2,
      hole: { x: TREE_TRUNK.x - 2.4, z: TREE_TRUNK.z + 0.2 },
      at: { x: TREE_TRUNK.x - 2.8, z: TREE_TRUNK.z - 1.4 },
      coins: 8,
      notice: "I fit. You do not. I am measuring, not bragging.",
      line: "A hollow in the root. Someone hid a coin from the rain. I unhid it.",
    },
    {
      id: "well-sniff",
      kind: "sniff",
      world: "meadow",
      x: WELL_AT.x + 1.6,
      z: WELL_AT.z - 1.2,
      r: 2.6,
      notice: "The grass by the well is lying.",
      line: "Not in the water. Next to it. People always look in the hole.",
    },
    {
      id: "well-dig",
      kind: "dig",
      world: "meadow",
      x: WELL_AT.x + 1.8,
      z: WELL_AT.z - 1.4,
      r: 2.0,
      needSniff: "well-sniff",
      coins: 10,
      cipher: "well",
      notice: "I will scratch. You will pretend you found it.",
      line: "A ring in the weeds. The well can keep its whisper.",
    },
    {
      id: "mill-crawl",
      kind: "crawl",
      world: "meadow",
      x: MILL.x + 3.2,
      z: MILL.z + 0.4,
      r: 2.4,
      hole: { x: MILL.x + 3.55, z: MILL.z + 0.2 },
      at: { x: MILL.x + 4.4, z: MILL.z - 0.8 },
      coins: 14,
      quest: ["millFox", 1],
      notice: "Under the wheel there is a mouth. A small one.",
      line: "A coin the mill counted and then forgot. I counted it back.",
    },
    {
      id: "woods-sniff",
      kind: "sniff",
      world: "meadow",
      x: FW.deer.x + 2.2,
      z: FW.deer.z - 1.4,
      r: 3.6,
      notice: "Something walked here and then became dirt.",
      line: "The tracks stop. The dirt does not. That is the whole poem.",
    },
    {
      id: "woods-dig",
      kind: "dig",
      world: "meadow",
      x: FW.deer.x + 2.6,
      z: FW.deer.z - 1.1,
      r: 2.2,
      needSniff: "woods-sniff",
      coins: 16,
      cipher: "woods-rings",
      notice: "I will dig. The deer already did some of the work.",
      line: "A mark under the moss. Four rings. Someone scratched the last one.",
    },
    {
      id: "creek-fetch",
      kind: "fetch",
      world: "meadow",
      x: POND.x + 8.4,
      z: POND.z + 6.2,
      r: 3.4,
      fetch: { x: POND.x + 14.6, z: POND.z + 9.4 },
      coins: 9,
      notice: "I can swim. I prefer not to. I am going anyway.",
      line: "A bottle on the far bank. You have longer arms. I have less dignity.",
    },
    {
      id: "manor-gap",
      kind: "crawl",
      world: "meadow",
      x: MANOR.x + 0.2,
      z: MANOR.z + 6.4,
      r: 2.2,
      hole: { x: MANOR.x, z: MANOR.z + 5.6 },
      at: { x: MANOR.x - 1.2, z: MANOR.z + 2.4 },
      coins: 20,
      quest: ["manorFox", 1],
      notice: "The boards forgot a fox-sized mistake.",
      line: "I went in. I came out. The house still will not have you. That was not the deal.",
    },
    {
      id: "paddock-fetch",
      kind: "fetch",
      world: "meadow",
      x: PADDOCK.x,
      z: PADDOCK.z,
      r: 3.0,
      fetch: { x: PADDOCK.x + 0.2, z: PADDOCK.z - 5.4 },
      coins: 6,
      notice: "Something is on the rail. I have hops. You have a fence.",
      line: "An apple the horse was saving. I am not sorry.",
    },
    {
      id: "stall-track",
      kind: "track",
      world: "meadow",
      x: STALL.x,
      z: STALL.z + 4,
      r: 3.2,
      trail: [
        { x: STALL.x - 4, z: STALL.z + 2 },
        { x: STALL.x - 10, z: STALL.z - 4 },
        { x: STALL.x - 16, z: STALL.z - 8 },
        { x: FARM.x - 18, z: FARM.z + 16 },
      ],
      coins: 11,
      quest: ["tessBread", 1],
      notice: "Someone ran with bread. The bread is louder than they think.",
      line: "The trail ended in grass. The coins did not. I am keeping none. I already ate.",
    },
    {
      id: "mole-dig",
      kind: "dig",
      world: "meadow",
      x: MOLE_AT.x + 3.8,
      z: MOLE_AT.z - 2.6,
      r: 2.2,
      coins: 15,
      notice: "The mound is a door. I have used doors like this.",
      line: "A cousin of the mole. They can keep the hole. I kept the coin.",
    },
    {
      id: "tiny-crawl",
      kind: "crawl",
      world: "meadow",
      x: TINY_HOLE.x,
      z: TINY_HOLE.z,
      r: 2.4,
      hole: { x: TINY_HOLE.x, z: TINY_HOLE.z },
      at: { x: TINY_HOLE.x + 0.8, z: TINY_HOLE.z - 0.6 },
      coins: 30,
      notice: "You do not fit. I checked twice. I will still go.",
      line: "A mouse house. They left a fat rupee. I did not become a mouse.",
    },
    {
      id: "hollow-vent",
      kind: "crawl",
      world: "cavern",
      x: vent.wallX + 2.1,
      z: vent.z,
      r: 2.8,
      hole: vent.hole,
      plate: vent.innerPlate,
      coins: 0,
      notice: "A mouth in the rock. Fox-sized. I dislike that I noticed.",
      line: "The floor on the other side wanted weight. I am not a crate. I sat anyway.",
    },
  ];
}

export function sniffed(id: string) {
  return Boolean(live.nimSniffed[id] || live.smashed[id]);
}

export function spotDone(id: string) {
  return Boolean(live.smashed[id]);
}

export function spotReady(s: NimSpot) {
  if (spotDone(s.id)) return false;
  if (s.kind === "dig" && s.needSniff && !sniffed(s.needSniff)) return false;
  if (s.needSniff && s.kind !== "dig" && !sniffed(s.needSniff)) return false;
  return true;
}

export function nearestNimSpot(x: number, z: number, world: WorldId, max = 4.2): NimSpot | null {
  let best: NimSpot | null = null;
  let bestD = max;
  for (const s of nimSpots()) {
    if (s.world !== "any" && s.world !== world) continue;
    if (!spotReady(s)) continue;
    const d = Math.hypot(x - s.x, z - s.z);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}

export function jobAskLabel(kind: NimJobKind | "plate"): string {
  if (kind === "sniff") return "Ask Nim to sniff";
  if (kind === "dig") return "Ask Nim to dig";
  if (kind === "crawl") return "Send Nim through";
  if (kind === "fetch") return "Ask Nim to fetch";
  if (kind === "track") return "Ask Nim to track";
  return "Ask Nim to sit";
}

export function nimHoleHits(): { x: number; z: number; r: number }[] {
  const out: { x: number; z: number; r: number }[] = [];
  for (const s of nimSpots()) {
    if (s.kind !== "crawl" || !s.hole) continue;
    if (spotDone(s.id) && !s.plate) continue;
    out.push({ x: s.hole.x, z: s.hole.z, r: 0.48 });
  }
  return out;
}

export function collideNimHoles(nx: number, nz: number): { x: number; z: number } | null {
  if (live.tinyT > 0) return null;
  let x = nx;
  let z = nz;
  let hit = false;
  for (const s of nimHoleHits()) {
    const dx = x - s.x;
    const dz = z - s.z;
    const d2 = dx * dx + dz * dz;
    const rr = s.r * s.r;
    if (d2 < rr && d2 > 1e-6) {
      const d = Math.sqrt(d2);
      x = s.x + (dx / d) * s.r;
      z = s.z + (dz / d) * s.r;
      hit = true;
    }
  }
  return hit ? { x, z } : null;
}

export function nearestFoe(x: number, z: number): { x: number; z: number; d: number } | null {
  let best: { x: number; z: number; d: number } | null = null;
  for (const p of Object.values(live.foeTrack)) {
    const d = Math.hypot(x - p.x, z - p.z);
    if (!best || d < best.d) best = { x: p.x, z: p.z, d };
  }
  return best;
}

export type NimDanger = "ice" | "sink" | "rapids" | "deep" | "night";

export function nimDangerAhead(x: number, z: number, yaw: number, moving: boolean): NimDanger | null {
  const ax = x - Math.sin(yaw) * 3.2;
  const az = z - Math.cos(yaw) * 3.2;
  const feel = landFeel(ax, az);
  if (feel.sink > 0.28 && moving) return "sink";
  if (feel.ice > 0.45 && moving) return "ice";
  if (inRapids(ax, az) && moving) return "rapids";
  if (pondU(ax, az) > 0.55 && moving) return "deep";
  if ((live.dusk > 0.7 || live.night) && (live.aggroIds?.size ?? 0) > 0) return "night";
  return null;
}

export function dangerLine(kind: NimDanger): string {
  if (kind === "sink") return "The ground wants a snack. We are the snack.";
  if (kind === "ice") return "This floor is lying about being a floor.";
  if (kind === "rapids") return "The water is in a hurry. I am not.";
  if (kind === "deep") return "I can swim. I prefer not to prove it.";
  return "Night has teeth. I counted them from here.";
}

export function startNimJob(id: string) {
  live.nimJob = id;
  live.nimJobT = 0;
}

export function clearNimJob() {
  live.nimJob = null;
  live.nimJobT = 0;
}

export function finishNimSpot(s: NimSpot) {
  if (live.smashed[s.id]) return false;
  live.smashed[s.id] = true;
  if (s.kind === "sniff") live.nimSniffed[s.id] = true;
  if (s.coins) {
    const c = useGame.getState().addCoins(s.coins);
    if (c > 0) revealItem("coin");
  }
  if (s.cipher) takeCipher(s.cipher);
  if (s.quest) useGame.getState().setQuest(s.quest[0], s.quest[1]);
  if (s.plate) {
    live.nimOnPlate = true;
    live.nimX = s.plate.x;
    live.nimZ = s.plate.z;
  }
  sfx.ok();
  live.listen = s.line;
  clearNimJob();
  return true;
}

export function jobTarget(s: NimSpot): { x: number; z: number } {
  if (s.kind === "fetch" && s.fetch) {
    if (live.nimJobT < 2.2) return s.fetch;
    return { x: live.x, z: live.z };
  }
  if (s.kind === "track" && s.trail && s.trail.length) {
    const i = Math.min(s.trail.length - 1, Math.floor(live.nimJobT / 1.15));
    return s.trail[i]!;
  }
  if (s.kind === "crawl") {
    if (live.nimJobT < 1.1 && s.hole) return s.hole;
    if (s.plate) return s.plate;
    if (s.at) return s.at;
    if (s.hole) return s.hole;
  }
  if (s.at) return s.at;
  return { x: s.x, z: s.z };
}

export function jobDuration(s: NimSpot) {
  if (s.kind === "sniff") return 2.6;
  if (s.kind === "dig") return 2.4;
  if (s.kind === "crawl") return s.plate ? 4.6 : 3.2;
  if (s.kind === "fetch") return 4.4;
  if (s.kind === "track") return 1.15 * (s.trail?.length ?? 3) + 0.8;
  return 2.5;
}

export function jobMood(s: NimSpot): "sniff" | "dig" | "crawl" | "fetch" | "track" | "hop" {
  if (s.kind === "sniff") return "sniff";
  if (s.kind === "dig") return "dig";
  if (s.kind === "crawl") return "crawl";
  if (s.kind === "fetch") return "fetch";
  return "track";
}

export function bothPlatesHeld(playerOn: boolean, nimOn: boolean) {
  return playerOn && nimOn;
}
