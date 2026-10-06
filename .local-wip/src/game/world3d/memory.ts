/** Clue in one place. Lock in another. The lock never writes the order. */
import { live } from "./live";
import { useGame } from "../store";
import { WELL_AT, LAUNDRY_AT, LOOK_AT, TREE_HOME } from "./field";
import { FW, RV, MW } from "./lands";

export type MemKind = "watch" | "well" | "cloth" | "cairn";

export const MOSAIC_REF = [0, 1, 2, 3] as const;

/** Home-road faces, west to east: sun, wave, leaf, blank. Not N-E-S-W. */
export const WATCH_SYMS = ["sun", "leaf", "wave", "blank"] as const;
export const WATCH_ORDER = [0, 2, 1, 3] as const;

/** Well rim pips N,E,S,W. Step fewest-to-most, blank last: E, N, S, W. */
export const WELL_PIPS = [2, 1, 3, 0] as const;
export const WELL_ORDER = [1, 0, 2, 3] as const;

/** Nana’s line, west to east: gold, red, empty pin, green. */
export const CLOTH_COLS = ["gold", "red", "empty", "green"] as const;
export const CLOTH_ORDER = [0, 1, 3, 2] as const;

/** Lookout stacks west to east: 1, 3, 2, 0 rings. Strike that count order. */
export const CAIRN_RINGS = [1, 3, 2, 0] as const;
export const CAIRN_ORDER = [1, 3, 2, 0] as const;

export const MEM = {
  watchClue: { x: TREE_HOME.x + 8.4, z: TREE_HOME.z + 26.2 },
  watchDoor: { x: FW.ruin.x, z: FW.ruin.z + 6.6 },
  watchChest: { x: FW.ruin.x, z: FW.ruin.z + 9.4 },
  wellClue: WELL_AT,
  wellLock: { x: RV.ford.x + 9.2, z: RV.ford.z + 15.4 },
  wellChest: { x: RV.ford.x + 9.2, z: RV.ford.z + 19.2 },
  clothClue: LAUNDRY_AT,
  clothLock: { x: MW.camp.x + 11.6, z: MW.camp.z + 1.8 },
  clothChest: { x: MW.camp.x + 11.6, z: MW.camp.z + 6.4 },
  cairnClue: { x: LOOK_AT.x - 5.4, z: LOOK_AT.z - 7.2 },
  cairnLock: { x: 14.6, z: 58.4 },
  cairnChest: { x: 14.6, z: 62.2 },
};

function row(cx: number, cz: number, n: number, span: number, alongX = true) {
  const out: { id: number; x: number; z: number }[] = [];
  const step = n === 1 ? 0 : span / (n - 1);
  const origin = -span * 0.5;
  for (let i = 0; i < n; i++) {
    const o = origin + i * step;
    out.push({ id: i, x: alongX ? cx + o : cx, z: alongX ? cz : cz + o });
  }
  return out;
}

function diamond(cx: number, cz: number, r: number) {
  return [
    { id: 0, x: cx, z: cz + r },
    { id: 1, x: cx + r, z: cz },
    { id: 2, x: cx, z: cz - r },
    { id: 3, x: cx - r, z: cz },
  ];
}

function square(cx: number, cz: number, r: number, ids: number[]) {
  const spots = [
    { x: cx - r, z: cz + r },
    { x: cx + r, z: cz + r },
    { x: cx - r, z: cz - r },
    { x: cx + r, z: cz - r },
  ];
  return ids.map((id, i) => ({ id, x: spots[i]!.x, z: spots[i]!.z }));
}

/** West → east on the home road. Symbols follow WATCH_SYMS. */
export const WATCH_STATUES = row(MEM.watchClue.x, MEM.watchClue.z, 4, 13.2, true).map((p, i) => ({
  ...p,
  id: WATCH_ORDER[i]!,
  sym: WATCH_SYMS[WATCH_ORDER[i]!]!,
}));

/** Shuffled 2×2 in front of the ruin mouth. Same four faces. Not a line. */
export const WATCH_TILES = square(MEM.watchDoor.x, MEM.watchDoor.z - 2.35, 1.15, [1, 3, 0, 2]).map((p) => ({
  ...p,
  sym: WATCH_SYMS[p.id]!,
}));

export const WELL_RIM = diamond(WELL_AT.x, WELL_AT.z, 1.22).map((p) => ({
  ...p,
  pip: WELL_PIPS[p.id]!,
}));

/** Blank NESW posts. No pips. Count was on the well. */
export const WELL_POSTS = diamond(MEM.wellLock.x, MEM.wellLock.z, 3.05);

export const CLOTH_LINE = [-0.84, -0.28, 0.28, 0.84].map((ox, i) => ({
  id: CLOTH_ORDER[i]!,
  ox,
  col: CLOTH_COLS[CLOTH_ORDER[i]!]!,
}));

/** Square of the same four colors, mixed. Gold NE of empty. */
export const CLOTH_PADS = square(MEM.clothLock.x, MEM.clothLock.z, 2.05, [2, 0, 3, 1]).map((p) => ({
  ...p,
  col: CLOTH_COLS[p.id]!,
}));

export const CAIRN_STACKS = row(MEM.cairnClue.x, MEM.cairnClue.z, 4, 9.6, true).map((p, i) => ({
  ...p,
  id: CAIRN_RINGS[i]!,
  rings: CAIRN_RINGS[i]!,
}));

/** Keep-road copies the stacks in a diamond. Rings visible. Order is not. */
export const KEEP_PILLARS = diamond(MEM.cairnLock.x, MEM.cairnLock.z, 3.15).map((p, i) => {
  const rings = [2, 0, 3, 1][i]!;
  return { id: rings, x: p.x, z: p.z, rings };
});

const QUEST: Record<MemKind, string> = {
  watch: "memWatch",
  well: "memWell",
  cloth: "memCloth",
  cairn: "memCairn",
};

const ORDER: Record<MemKind, readonly number[]> = {
  watch: WATCH_ORDER,
  well: WELL_ORDER,
  cloth: CLOTH_ORDER,
  cairn: CAIRN_ORDER,
};

const step: Record<MemKind, number[]> = {
  watch: [],
  well: [],
  cloth: [],
  cairn: [],
};

const done: Record<MemKind, boolean> = {
  watch: false,
  well: false,
  cloth: false,
  cairn: false,
};

function qn(id: string) {
  return useGame.getState().quests?.[id] ?? 0;
}

function setQ(id: string, n: number) {
  useGame.getState().setQuest(id, n);
}

export function hydrateMemory() {
  (Object.keys(QUEST) as MemKind[]).forEach((k) => {
    done[k] = qn(QUEST[k]) >= 1;
    if (done[k]) step[k] = ORDER[k].slice();
    else step[k] = [];
  });
}

export function memOpen(kind: MemKind) {
  return done[kind] || qn(QUEST[kind]) >= 1;
}

export function memNow(kind: MemKind) {
  return step[kind].slice();
}

export function memPush(kind: MemKind, id: number): "ok" | "done" | "reset" | "have" {
  if (done[kind] || qn(QUEST[kind]) >= 1) {
    done[kind] = true;
    return "have";
  }
  const cur = step[kind];
  if (cur.length && cur[cur.length - 1] === id) return "ok";
  const expect = ORDER[kind][cur.length];
  if (expect !== id) {
    step[kind] = [];
    return "reset";
  }
  cur.push(id);
  if (cur.length >= ORDER[kind].length) {
    done[kind] = true;
    setQ(QUEST[kind], 1);
    return "done";
  }
  return "ok";
}

export function watchOpen() {
  return memOpen("watch");
}

export function wellOpen() {
  return memOpen("well");
}

export function clothOpen() {
  return memOpen("cloth");
}

export function cairnOpen() {
  return memOpen("cairn");
}

const SHRINE_HW = 2.55;
const SHRINE_HALF = 0.48;
const SHRINE_GAP = 0.95;

function pushSeg(
  nx: number,
  nz: number,
  ax: number,
  az: number,
  bx: number,
  bz: number,
  half: number,
): { x: number; z: number } | null {
  const abx = bx - ax;
  const abz = bz - az;
  const len = Math.hypot(abx, abz) || 1;
  const ux = abx / len;
  const uz = abz / len;
  const t = Math.max(0, Math.min(len, (nx - ax) * ux + (nz - az) * uz));
  const cx = ax + ux * t;
  const cz = az + uz * t;
  const dx = nx - cx;
  const dz = nz - cz;
  const d = Math.hypot(dx, dz);
  if (d >= half) return null;
  if (d < 1e-6) return { x: cx - uz * half, z: cz + ux * half };
  const u = half / d;
  return { x: cx + dx * u, z: cz + dz * u };
}

export function collideMemoryAt(nx: number, nz: number, open: boolean): { x: number; z: number } | null {
  const cx = MEM.watchDoor.x;
  const front = MEM.watchDoor.z;
  const back = MEM.watchChest.z + 1.85;
  const segs: { ax: number; az: number; bx: number; bz: number }[] = [
    { ax: cx - SHRINE_HW, az: front - 0.2, bx: cx - SHRINE_HW, bz: back },
    { ax: cx + SHRINE_HW, az: front - 0.2, bx: cx + SHRINE_HW, bz: back },
    { ax: cx - SHRINE_HW, az: back, bx: cx + SHRINE_HW, bz: back },
  ];
  if (open) {
    segs.push({ ax: cx - SHRINE_HW, az: front, bx: cx - SHRINE_GAP, bz: front });
    segs.push({ ax: cx + SHRINE_GAP, az: front, bx: cx + SHRINE_HW, bz: front });
  } else {
    segs.push({ ax: cx - SHRINE_HW, az: front, bx: cx + SHRINE_HW, bz: front });
  }
  let x = nx;
  let z = nz;
  let hit = false;
  for (const s of segs) {
    const p = pushSeg(x, z, s.ax, s.az, s.bx, s.bz, SHRINE_HALF);
    if (p) {
      x = p.x;
      z = p.z;
      hit = true;
    }
  }
  return hit ? { x, z } : null;
}

export function collideMemory(nx: number, nz: number): { x: number; z: number } | null {
  if (live.house || live.below) return null;
  return collideMemoryAt(nx, nz, watchOpen());
}

export function memOrders() {
  return {
    mosaic: MOSAIC_REF.slice(),
    watch: WATCH_ORDER.slice(),
    well: WELL_ORDER.slice(),
    cloth: CLOTH_ORDER.slice(),
    cairn: CAIRN_ORDER.slice(),
  };
}
