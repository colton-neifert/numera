import type { WorldId } from "../types";
import { useGame } from "../store";

export type Block = { id: string; x: number; z: number };
export type Plate = { id: string; x: number; z: number };
export type SwitchSpot = { id: string; x: number; z: number };
export type Door = { id: string; x: number; z: number; w: number; need: "plates" | "switch" | "key" | "switch2" };
export type KeySpot = { id: string; x: number; z: number; need: "plates" | "switch" | "none" };
export type ChestSpot = { id: string; x: number; z: number; need: "key" | "plates" | "none"; coins: number; item?: "sword" | "axe" | "ocarina" | "bow" | "sling" | "boom" | "bombs" | "heart" | "compass" };

const BIG_LOOT = new Set(["sword", "axe", "ocarina", "bow", "sling", "boom", "bombs", "compass"]);

export function chestTier(ch: { item?: string; coins?: number }): "big" | "small" {
  return ch.item && BIG_LOOT.has(ch.item) ? "big" : "small";
}

function fourHall(p: string, hint: string, coins: number, switchFirst = false): PuzzleSpec {
  return {
    hint,
    blocks: [
      { id: `${p}b1`, x: switchFirst ? -14.2 : 8.2, z: switchFirst ? 2.4 : 18.4 },
      { id: `${p}b2`, x: switchFirst ? -9.2 : 13.4, z: switchFirst ? 2.4 : 18.4 },
    ],
    plates: [
      { id: `${p}p1`, x: switchFirst ? -14.2 : 8.2, z: switchFirst ? -4.4 : 12.2 },
      { id: `${p}p2`, x: switchFirst ? -9.2 : 13.4, z: switchFirst ? -4.4 : 12.2 },
    ],
    switches: [
      { id: `${p}s`, x: switchFirst ? 22.4 : -22.4, z: switchFirst ? 16.4 : -14.6 },
      { id: `${p}s2`, x: -22.4, z: -108.2 },
    ],
    doors: [
      { id: `${p}d`, x: 0, z: 8, w: 8.2, need: switchFirst ? "switch" : "plates" },
      { id: `${p}d2`, x: 0, z: -38, w: 8.2, need: switchFirst ? "plates" : "switch" },
      { id: `${p}d3`, x: 0, z: -86, w: 8.2, need: "key" },
      { id: `${p}d4`, x: 0, z: -134, w: 8.2, need: "switch2" },
    ],
    keys: [{ id: `${p}k`, x: 22.4, z: -62.4, need: switchFirst ? "plates" : "switch" }],
    chests: [
      { id: `${p}c`, x: 14.4, z: -168.2, need: "key", coins },
      { id: `${p}c2`, x: -22.4, z: -154.2, need: "none", coins: 12, item: "heart" },
      { id: `${p}c3`, x: 22.4, z: -214.4, need: "none", coins: 18 },
      { id: `${p}c4`, x: -28.4, z: -246.2, need: "none", coins: 8, item: "heart" },
    ],
  };
}

export type PuzzleSpec = {
  hint: string;
  blocks: Block[];
  plates: Plate[];
  switches: SwitchSpot[];
  doors: Door[];
  keys: KeySpot[];
  chests: ChestSpot[];
};

export const PUZZLES: Record<WorldId, PuzzleSpec> = {
  meadow: {
    hint: "A note on a tree. Then Mira’s song. Play it at the Sun Shrine — or push both stones onto the gold plates — and go in for the orange jewel.",
    blocks: [
      { id: "mb", x: -87.8, z: 25.6 },
      { id: "mb2", x: -76.2, z: 26.0 },
    ],
    plates: [
      { id: "mp", x: -87.8, z: 32.2 },
      { id: "mp2", x: -76.2, z: 32.2 },
    ],
    switches: [],
    doors: [{ id: "md", x: -82, z: 30.1, w: 4.6, need: "plates" }],
    keys: [],
    chests: [
      { id: "msword", x: 18.6, z: -26.4, need: "none", coins: 0, item: "sword" },
      { id: "mocarina", x: 4.4, z: 10.2, need: "none", coins: 0, item: "ocarina" },
      { id: "maxe", x: -19.4, z: 8.2, need: "none", coins: 0, item: "axe" },
    ],
  },
  grove: {
    hint: "Two stones. Eye left. Key right. A second eye after the key. The grove’s leftover waits in the last hall.",
    blocks: [
      { id: "gb1", x: 10.2, z: 18.4 },
      { id: "gb2", x: 16.4, z: 18.4 },
    ],
    plates: [
      { id: "gp1", x: 10.2, z: 12.4 },
      { id: "gp2", x: 16.4, z: 12.4 },
    ],
    switches: [
      { id: "gs", x: -22.4, z: -14.6 },
      { id: "gs2", x: -22.4, z: -108.2 },
    ],
    doors: [
      { id: "gd", x: 0, z: 8, w: 8.2, need: "plates" },
      { id: "gd2", x: 0, z: -38, w: 8.2, need: "switch" },
      { id: "gd3", x: 0, z: -86, w: 8.2, need: "key" },
      { id: "gd4", x: 0, z: -134, w: 8.2, need: "switch2" },
    ],
    keys: [{ id: "gk", x: 22.4, z: -62.4, need: "switch" }],
    chests: [
      { id: "gc", x: -14.4, z: -168.2, need: "key", coins: 0, item: "bow" },
      { id: "gc2", x: -22.4, z: -154.2, need: "none", coins: 12, item: "heart" },
    ],
  },
  keep: {
    hint: "Set the three jewels in the holes in front of the castle, {name}. Then the Lizard King.",
    blocks: [],
    plates: [],
    switches: [{ id: "ks", x: 9.4, z: -5.2 }],
    doors: [{ id: "kd", x: 9.4, z: -10.4, w: 2.8, need: "key" }],
    keys: [{ id: "kk", x: 9.4, z: -7.4, need: "switch" }],
    chests: [{ id: "kc", x: 9.4, z: -12.6, need: "key", coins: 28 }],
  },
  cavern: {
    hint: "Stone on the gold plate. Eye left. Key right. A second eye in the deep. The red gem waits at the end.",
    blocks: [{ id: "cb", x: 10.4, z: 18.4 }],
    plates: [{ id: "cp", x: 10.4, z: 12.2 }],
    switches: [
      { id: "cs", x: -22.4, z: -14.6 },
      { id: "cs2", x: -22.4, z: -108.2 },
    ],
    doors: [
      { id: "cd", x: 0, z: 8, w: 8.2, need: "plates" },
      { id: "cd2", x: 0, z: -38, w: 8.2, need: "switch" },
      { id: "cd3", x: 0, z: -86, w: 8.2, need: "key" },
      { id: "cd4", x: 0, z: -134, w: 8.2, need: "switch2" },
    ],
    keys: [{ id: "ck", x: 22.4, z: -62.4, need: "switch" }],
    chests: [{ id: "cc", x: -14.4, z: -168.2, need: "key", coins: 6, item: "sling" }],
  },
  marsh: {
    hint: "Two stones on two plates. Then the eye. Then the key. A second eye in the reeds. The blue gem waits in the last hall.",
    blocks: [
      { id: "wb1", x: 8.2, z: 18.4 },
      { id: "wb2", x: 13.4, z: 18.4 },
    ],
    plates: [
      { id: "wp1", x: 8.2, z: 12.2 },
      { id: "wp2", x: 13.4, z: 12.2 },
    ],
    switches: [
      { id: "ws", x: -22.4, z: -14.6 },
      { id: "ws2", x: -22.4, z: -108.2 },
    ],
    doors: [
      { id: "wd", x: 0, z: 8, w: 8.2, need: "plates" },
      { id: "wd2", x: 0, z: -38, w: 8.2, need: "switch" },
      { id: "wd3", x: 0, z: -86, w: 8.2, need: "key" },
      { id: "wd4", x: 0, z: -134, w: 8.2, need: "switch2" },
    ],
    keys: [{ id: "wk", x: 22.4, z: -62.4, need: "switch" }],
    chests: [{ id: "wc", x: 14.4, z: -168.2, need: "key", coins: 0, item: "bombs" }],
  },
  crater: {
    hint: "Eye of fire first, on the right. Then two stones. Then the key. A second eye after the key. The crater is a long burn.",
    blocks: [
      { id: "fb1", x: -14.2, z: 2.4 },
      { id: "fb2", x: -9.2, z: 2.4 },
    ],
    plates: [
      { id: "fp1", x: -14.2, z: -4.4 },
      { id: "fp2", x: -9.2, z: -4.4 },
    ],
    switches: [
      { id: "fs", x: 22.4, z: 16.4 },
      { id: "fs2", x: -22.4, z: -108.2 },
    ],
    doors: [
      { id: "fd", x: 0, z: 8, w: 8.2, need: "switch" },
      { id: "fd2", x: 0, z: -38, w: 8.2, need: "plates" },
      { id: "fd3", x: 0, z: -86, w: 8.2, need: "key" },
      { id: "fd4", x: 0, z: -134, w: 8.2, need: "switch2" },
    ],
    keys: [{ id: "fk", x: 22.4, z: -62.4, need: "plates" }],
    chests: [
      { id: "fc", x: 14.4, z: -168.2, need: "key", coins: 24 },
      { id: "fc2", x: -22.4, z: -154.2, need: "none", coins: 10, item: "heart" },
    ],
  },
  lake: {
    hint: "Two proofs on the water. Then the eye. Then the key. A second eye in the deep. The lake divides last.",
    blocks: [
      { id: "lb1", x: 8.2, z: 18.4 },
      { id: "lb2", x: 13.4, z: 18.4 },
    ],
    plates: [
      { id: "lp1", x: 8.2, z: 12.2 },
      { id: "lp2", x: 13.4, z: 12.2 },
    ],
    switches: [
      { id: "ls", x: -22.4, z: -14.6 },
      { id: "ls2", x: -22.4, z: -108.2 },
    ],
    doors: [
      { id: "ld", x: 0, z: 8, w: 8.2, need: "plates" },
      { id: "ld2", x: 0, z: -38, w: 8.2, need: "switch" },
      { id: "ld3", x: 0, z: -86, w: 8.2, need: "key" },
      { id: "ld4", x: 0, z: -134, w: 8.2, need: "switch2" },
    ],
    keys: [{ id: "lk", x: -22.4, z: -62.4, need: "switch" }],
    chests: [
      { id: "lc", x: -14.4, z: -168.2, need: "key", coins: 0, item: "boom" },
      { id: "lc2", x: -22.4, z: -154.2, need: "none", coins: 14, item: "heart" },
    ],
  },
  grave: {
    hint: "Night-eye on the right. Two stones in the next hall. Key after that. A second eye in the dark. The grave is long.",
    blocks: [
      { id: "nb1", x: -14.2, z: 2.4 },
      { id: "nb2", x: -9.2, z: 2.4 },
    ],
    plates: [
      { id: "np1", x: -14.2, z: -4.4 },
      { id: "np2", x: -9.2, z: -4.4 },
    ],
    switches: [
      { id: "ns", x: 22.4, z: 16.4 },
      { id: "ns2", x: -22.4, z: -108.2 },
    ],
    doors: [
      { id: "nd", x: 0, z: 8, w: 8.2, need: "switch" },
      { id: "nd2", x: 0, z: -38, w: 8.2, need: "plates" },
      { id: "nd3", x: 0, z: -86, w: 8.2, need: "key" },
      { id: "nd4", x: 0, z: -134, w: 8.2, need: "switch2" },
    ],
    keys: [{ id: "nk", x: 22.4, z: -62.4, need: "plates" }],
    chests: [
      { id: "nc", x: 14.4, z: -168.2, need: "key", coins: 26 },
      { id: "nc2", x: -22.4, z: -154.2, need: "none", coins: 12, item: "heart" },
    ],
  },
  waste: {
    hint: "Two sands, two plates. Eye-switch. Key. A second eye in the dunes. The waste is a cruel product.",
    blocks: [
      { id: "sb1", x: 8.2, z: 18.4 },
      { id: "sb2", x: 13.4, z: 18.4 },
    ],
    plates: [
      { id: "sp1", x: 8.2, z: 12.2 },
      { id: "sp2", x: 13.4, z: 12.2 },
    ],
    switches: [
      { id: "ss", x: -22.4, z: -14.6 },
      { id: "ss2", x: -22.4, z: -108.2 },
    ],
    doors: [
      { id: "sd", x: 0, z: 8, w: 8.2, need: "plates" },
      { id: "sd2", x: 0, z: -38, w: 8.2, need: "switch" },
      { id: "sd3", x: 0, z: -86, w: 8.2, need: "key" },
      { id: "sd4", x: 0, z: -134, w: 8.2, need: "switch2" },
    ],
    keys: [{ id: "sk", x: 22.4, z: -62.4, need: "switch" }],
    chests: [
      { id: "sc", x: -14.4, z: -168.2, need: "key", coins: 28 },
      { id: "sc2", x: -22.4, z: -154.2, need: "none", coins: 16, item: "heart" },
    ],
  },
  echo: {
    hint: "Two plates. Then the eye. Then the key. A second eye. The leftover waits in the last hall.",
    blocks: [
      { id: "eb1", x: 8.2, z: 18.4 },
      { id: "eb2", x: 13.4, z: 18.4 },
    ],
    plates: [
      { id: "ep1", x: 8.2, z: 12.2 },
      { id: "ep2", x: 13.4, z: 12.2 },
    ],
    switches: [
      { id: "es", x: -22.4, z: -14.6 },
      { id: "es2", x: -22.4, z: -108.2 },
    ],
    doors: [
      { id: "ed", x: 0, z: 8, w: 8.2, need: "plates" },
      { id: "ed2", x: 0, z: -38, w: 8.2, need: "switch" },
      { id: "ed3", x: 0, z: -86, w: 8.2, need: "key" },
      { id: "ed4", x: 0, z: -134, w: 8.2, need: "switch2" },
    ],
    keys: [{ id: "ek", x: 22.4, z: -62.4, need: "switch" }],
    chests: [
      { id: "ec", x: 14.4, z: -168.2, need: "key", coins: 80 },
      { id: "ec2", x: -22.4, z: -154.2, need: "none", coins: 20, item: "heart" },
    ],
  },
  ridge: fourHall("rd", "Two stones. Eye. Key. A second eye on the ridge — lizards drop. Then the warden.", 22),
  spire: fourHall("sp", "Eye of hours first. Then stones. Then the key. A second eye. Then the warden.", 24, true),
  fen: fourHall("fn", "Two stones on the glass. Eye. Key. A second eye — lizards drop. Then the warden.", 26),
  hollow: fourHall("hl", "Eye of thunder first. Then stones. Key. Second eye. Then the warden in the fire.", 28, true),
  vault: fourHall("vt", "Two plates. Eye. Key. A second eye. The borrowed count waits in the last hall.", 90),
  arena: {
    hint: "The hour turns. Cut the ring. Waves do not wait.",
    blocks: [],
    plates: [],
    switches: [],
    doors: [],
    keys: [],
    chests: [],
  },
};

for (const [id, p] of Object.entries(PUZZLES) as [WorldId, PuzzleSpec][]) {
  if (id === "meadow" || id === "keep" || id === "arena") continue;
  const deep = id !== "cavern" && id !== "marsh";
  const end = deep ? -6000 : -4500;
  if (!p.chests.some((c) => c.z < -200)) {
    p.chests.push(
      { id: `${id}-far`, x: 24.4, z: -214.4, need: "none", coins: 16 },
      { id: `${id}-deep`, x: -30.4, z: -246.2, need: "none", coins: 10, item: "heart" },
    );
  }
  let n = 0;
  for (let z = -300; z >= end; z -= 140) {
    p.chests.push({
      id: `${id}-hall${n}`,
      x: n % 2 ? 22.4 : -22.4,
      z,
      need: "none",
      coins: 8 + (n % 5) * 4,
      item: n % 4 === 2 ? "heart" : undefined,
    });
    n += 1;
  }
}

export type PuzzleRuntime = {
  blocks: Block[];
  platesOn: boolean;
  switchOn: boolean;
  switch2On: boolean;
  hasKey: boolean;
  unlocked: boolean;
  opened: Set<string>;
  hint: string;
};

export function chestSaveId(world: WorldId, id: string) {
  return `${world}:${id}`;
}

const OPENED = new Set<string>();

export function isChestOpen(saveId: string) {
  if (OPENED.has(saveId)) return true;
  if ((useGame.getState().openedChests ?? []).includes(saveId)) {
    OPENED.add(saveId);
    return true;
  }
  return false;
}

export function markChestOpen(saveId: string) {
  OPENED.add(saveId);
  useGame.getState().openChest(saveId);
}

export function chestAlreadyLooted(world: WorldId, ch: ChestSpot) {
  const saveId = chestSaveId(world, ch.id);
  if (isChestOpen(saveId)) return true;
  const g = useGame.getState();
  if (ch.item === "sword" && g.hasSword) return true;
  if (ch.item === "axe" && g.hasAxe) return true;
  if (ch.item === "ocarina" && g.hasOcarina) return true;
  if (ch.item === "bow" && g.hasBow) return true;
  if (ch.item === "sling" && g.hasSling) return true;
  if (ch.item === "boom" && g.hasBoom) return true;
  if (ch.item === "bombs" && g.hasBombs) return true;
  if (ch.item === "compass" && g.hasCompass) return true;
  return false;
}

export function makeRuntime(world: WorldId): PuzzleRuntime {
  const spec = PUZZLES[world];
  return {
    blocks: spec.blocks.map((b) => ({ ...b })),
    platesOn: false,
    switchOn: false,
    switch2On: false,
    hasKey: false,
    unlocked: false,
    opened: new Set(spec.chests.filter((c) => chestAlreadyLooted(world, c)).map((c) => c.id)),
    hint: spec.hint,
  };
}

export function platesSatisfied(rt: PuzzleRuntime, spec: PuzzleSpec): boolean {
  if (!spec.plates.length) return false;
  return spec.plates.every((p) => rt.blocks.some((b) => Math.hypot(b.x - p.x, b.z - p.z) < 0.95));
}

export function doorOpen(rt: PuzzleRuntime, door: Door): boolean {
  if (rt.unlocked) return true;
  if (door.need === "plates") return rt.platesOn;
  if (door.need === "switch") return rt.switchOn;
  if (door.need === "switch2") return rt.switch2On;
  if (door.need === "key") return rt.hasKey || rt.unlocked;
  return false;
}

export function keyVisible(rt: PuzzleRuntime, key: KeySpot): boolean {
  if (rt.hasKey || rt.opened.has(key.id)) return false;
  if (key.need === "none") return true;
  if (key.need === "plates") return rt.platesOn;
  return rt.switchOn;
}

export function collideDoors(rt: PuzzleRuntime, spec: PuzzleSpec, nx: number, nz: number): boolean {
  for (const d of spec.doors) {
    if (doorOpen(rt, d)) continue;
    if (Math.abs(nx - d.x) < d.w * 0.45 && Math.abs(nz - d.z) < 0.7) return true;
  }
  return false;
}

export function nearestBlock(rt: PuzzleRuntime, px: number, pz: number, max = 1.35) {
  let best: Block | null = null;
  let bestD = max;
  for (const b of rt.blocks) {
    const d = Math.hypot(px - b.x, pz - b.z);
    if (d < bestD) {
      best = b;
      bestD = d;
    }
  }
  return best;
}

export function collideBlocks(rt: PuzzleRuntime, nx: number, nz: number, skipId?: string | null): { x: number; z: number } | null {
  for (const b of rt.blocks) {
    if (skipId && b.id === skipId) continue;
    const dx = nx - b.x;
    const dz = nz - b.z;
    const rad = 0.95;
    const d2 = dx * dx + dz * dz;
    if (d2 < rad * rad && d2 > 0.0001) {
      const d = Math.sqrt(d2);
      return { x: b.x + (dx / d) * rad, z: b.z + (dz / d) * rad };
    }
  }
  return null;
}

export function shoveBlock(b: Block, ux: number, uz: number, dist: number) {
  b.x += ux * dist;
  b.z += uz * dist;
  b.x = Math.max(-36, Math.min(36, b.x));
  b.z = Math.max(-6100, Math.min(28, b.z));
}
