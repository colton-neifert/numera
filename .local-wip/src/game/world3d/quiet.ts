/** Unmarked optional secrets. No map pins. Discovery only. */
import { live } from "./live";
import { useGame } from "../store";
import { heightAt, WELL_AT, TREE_HOME, GHOST_BENCH } from "./field";
import { FW, MW, RV, QH } from "./lands";
import type { Ladder } from "./climb";

export type QuietRoom = "" | "roots" | "hall";

export const Q = {
  hollow: QH,
  well: WELL_AT,
  mosaic: { x: 52, z: -1310 },
  tang: { x: 68, z: -1296 },
  whet: { x: MW.eastledge.x + 1.6, z: MW.eastledge.z - 2.2 },
  ghost: GHOST_BENCH,
  duskPath: { x: -180, z: -40 },
  stoneVale: { x: TREE_HOME.x + 9.4, z: TREE_HOME.z - 26 },
  stoneWood: { x: FW.ruin.x - 6.2, z: FW.ruin.z + 5.4 },
  stoneRiver: { x: RV.isle2.x - 1.2, z: RV.isle2.z + 1.6 },
  stonePeak: { x: MW.westpeak.x - 4.2, z: MW.westpeak.z + 3.6 },
};

export const STONES = [
  { id: 0, bit: 1, x: Q.stoneVale.x, z: Q.stoneVale.z, pip: 1, land: "vale" },
  { id: 1, bit: 2, x: Q.stoneWood.x, z: Q.stoneWood.z, pip: 2, land: "wood" },
  { id: 2, bit: 4, x: Q.stoneRiver.x, z: Q.stoneRiver.z, pip: 3, land: "river" },
  { id: 3, bit: 8, x: Q.stonePeak.x, z: Q.stonePeak.z, pip: 0, land: "peak" },
] as const;

/** Diamond, same as Gran’s cloth. N, E, S, W. Last pad is blank. */
export const MOSAIC = [
  { id: 0, x: Q.mosaic.x, z: Q.mosaic.z + 3.4, pip: 1 },
  { id: 1, x: Q.mosaic.x + 3.4, z: Q.mosaic.z, pip: 2 },
  { id: 2, x: Q.mosaic.x, z: Q.mosaic.z - 3.4, pip: 3 },
  { id: 3, x: Q.mosaic.x - 3.4, z: Q.mosaic.z, pip: 0 },
] as const;

export const MOSAIC_ORDER = [0, 1, 2, 3];

export const HOLLOW_HOMES = [
  { id: "quill", x: QH.x - 6.4, z: QH.z + 4.2, yaw: 0.4, w: 3.4, d: 3.1, h: 3.2, color: "#6a4a28" },
  { id: "sedge", x: QH.x + 7.2, z: QH.z + 1.6, yaw: -0.5, w: 3.1, d: 2.9, h: 2.9, color: "#5a3a22" },
  { id: "maren", x: QH.x + 2.4, z: QH.z - 8.6, yaw: 2.6, w: 3.6, d: 3.2, h: 3.1, color: "#4a3220" },
  { id: "ivo", x: QH.x - 8.8, z: QH.z - 5.2, yaw: 1.1, w: 2.6, d: 2.5, h: 2.4, color: "#5a4630" },
] as const;

export const HALL = {
  door: { x: Q.mosaic.x, z: Q.mosaic.z - 8.4 },
  hub: { x: Q.mosaic.x, z: Q.mosaic.z - 18 },
  east: { x: Q.mosaic.x + 14, z: Q.mosaic.z - 18 },
  west: { x: Q.mosaic.x - 14, z: Q.mosaic.z - 18 },
  boss: { x: Q.mosaic.x, z: Q.mosaic.z - 38 },
  gold: { x: Q.mosaic.x + 8.4, z: Q.mosaic.z - 38 },
};

const HALL_WALLS: { ax: number; az: number; bx: number; bz: number; half: number }[] = [
  { ax: HALL.hub.x - 7.4, az: HALL.hub.z - 7.4, bx: HALL.hub.x + 7.4, bz: HALL.hub.z - 7.4, half: 0.7 },
  { ax: HALL.hub.x - 7.4, az: HALL.hub.z + 7.4, bx: HALL.hub.x + 7.4, bz: HALL.hub.z + 7.4, half: 0.7 },
  { ax: HALL.hub.x - 7.4, az: HALL.hub.z - 7.4, bx: HALL.hub.x - 7.4, bz: HALL.hub.z + 7.4, half: 0.7 },
  { ax: HALL.hub.x + 7.4, az: HALL.hub.z - 7.4, bx: HALL.hub.x + 7.4, bz: HALL.hub.z + 7.4, half: 0.7 },
  { ax: HALL.east.x - 6.2, az: HALL.east.z - 6.2, bx: HALL.east.x + 6.2, bz: HALL.east.z - 6.2, half: 0.65 },
  { ax: HALL.east.x - 6.2, az: HALL.east.z + 6.2, bx: HALL.east.x + 6.2, bz: HALL.east.z + 6.2, half: 0.65 },
  { ax: HALL.east.x - 6.2, az: HALL.east.z - 6.2, bx: HALL.east.x - 6.2, bz: HALL.east.z + 6.2, half: 0.65 },
  { ax: HALL.east.x + 6.2, az: HALL.east.z - 6.2, bx: HALL.east.x + 6.2, bz: HALL.east.z + 6.2, half: 0.65 },
  { ax: HALL.west.x - 6.2, az: HALL.west.z - 6.2, bx: HALL.west.x + 6.2, bz: HALL.west.z - 6.2, half: 0.65 },
  { ax: HALL.west.x - 6.2, az: HALL.west.z + 6.2, bx: HALL.west.x + 6.2, bz: HALL.west.z + 6.2, half: 0.65 },
  { ax: HALL.west.x - 6.2, az: HALL.west.z - 6.2, bx: HALL.west.x - 6.2, bz: HALL.west.z + 6.2, half: 0.65 },
  { ax: HALL.west.x + 6.2, az: HALL.west.z - 6.2, bx: HALL.west.x + 6.2, bz: HALL.west.z + 6.2, half: 0.65 },
  { ax: HALL.boss.x - 9.6, az: HALL.boss.z - 9.6, bx: HALL.boss.x + 9.6, bz: HALL.boss.z - 9.6, half: 0.75 },
  { ax: HALL.boss.x - 9.6, az: HALL.boss.z + 9.6, bx: HALL.boss.x + 9.6, bz: HALL.boss.z + 9.6, half: 0.75 },
  { ax: HALL.boss.x - 9.6, az: HALL.boss.z - 9.6, bx: HALL.boss.x - 9.6, bz: HALL.boss.z + 9.6, half: 0.75 },
  { ax: HALL.boss.x + 9.6, az: HALL.boss.z - 9.6, bx: HALL.boss.x + 9.6, bz: HALL.boss.z + 9.6, half: 0.75 },
];

export const ROOT_EXITS = {
  up: { x: WELL_AT.x, z: WELL_AT.z, to: "well" as const },
  west: { x: WELL_AT.x - 20.4, z: WELL_AT.z, to: "wood" as const, out: { x: FW.pool.x + 4, z: FW.pool.z } },
  east: { x: WELL_AT.x + 20.4, z: WELL_AT.z, to: "river" as const, out: { x: RV.bankcave.x, z: RV.bankcave.z + 4 } },
  south: { x: WELL_AT.x, z: WELL_AT.z - 20.4, to: "mosaic" as const, out: { x: Q.mosaic.x, z: Q.mosaic.z + 6 } },
};

let room: QuietRoom = "";
let hallKey = false;
let hallEast = false;
let crackGone = false;
let tangWall = false;
let mosaicStep: number[] = [];
let hallStep: number[] = [];

export function quietRoom(): QuietRoom {
  return room;
}

export function setQuietRoom(next: QuietRoom) {
  room = next;
  live.cave = next !== "" || live.cave;
  if (next === "") {
    if (!live.house) live.cave = false;
  } else {
    live.cave = true;
  }
}

export function qn(id: string) {
  return useGame.getState().quests?.[id] ?? 0;
}

export function setQ(id: string, n: number) {
  useGame.getState().setQuest(id, n);
}

export function hasSteel() {
  return qn("qSteel") >= 1;
}

export function hallOpen() {
  return qn("qStones") >= 1 || qn("qMosaic") >= 1;
}

export function hallHasKey() {
  return hallKey || qn("qHallKey") >= 1;
}

export function takeHallKey() {
  hallKey = true;
  setQ("qHallKey", 1);
}

export function hallEastDone() {
  return hallEast || qn("qHallEast") >= 1;
}

export function markHallEast() {
  hallEast = true;
  setQ("qHallEast", 1);
}

export function crackOpen() {
  return crackGone || qn("qCrack") >= 1;
}

export function smashCrack() {
  crackGone = true;
  setQ("qCrack", 1);
}

export function tangWallOpen() {
  return tangWall || qn("qTangWall") >= 1;
}

export function smashTangWall() {
  tangWall = true;
  setQ("qTangWall", 1);
}

export function stoneBits() {
  return qn("qStone") | 0;
}

export function strikeStone(bit: number) {
  const next = stoneBits() | bit;
  setQ("qStone", next);
  if (next === 15 && qn("qStones") < 1) setQ("qStones", 1);
  return next;
}

export function mosaicPush(id: number) {
  if (mosaicStep.length && mosaicStep[mosaicStep.length - 1] === id) return mosaicStep.slice();
  mosaicStep = [...mosaicStep, id].slice(-4);
  const ok =
    mosaicStep.length === 4 &&
    mosaicStep[0] === MOSAIC_ORDER[0] &&
    mosaicStep[1] === MOSAIC_ORDER[1] &&
    mosaicStep[2] === MOSAIC_ORDER[2] &&
    mosaicStep[3] === MOSAIC_ORDER[3];
  if (ok) setQ("qMosaic", 1);
  if (mosaicStep.length === 4 && !ok) mosaicStep = [];
  return mosaicStep.slice();
}

export function mosaicNow() {
  return mosaicStep.slice();
}

export function hallPush(id: number) {
  if (hallStep.length && hallStep[hallStep.length - 1] === id) return hallStep.slice();
  hallStep = [...hallStep, id].slice(-4);
  const ok =
    hallStep.length === 4 &&
    hallStep[0] === MOSAIC_ORDER[0] &&
    hallStep[1] === MOSAIC_ORDER[1] &&
    hallStep[2] === MOSAIC_ORDER[2] &&
    hallStep[3] === MOSAIC_ORDER[3];
  if (ok) markHallEast();
  if (hallStep.length === 4 && !ok) hallStep = [];
  return hallStep.slice();
}

export function resetMosaic() {
  mosaicStep = [];
  hallStep = [];
}

export function inHollow(x: number, z: number, pad = 0) {
  return Math.hypot(x - QH.x, z - QH.z) < 42 + pad;
}

export function nollAt(hour?: number) {
  const h = hour ?? live.clockHour;
  const night = h >= 20 || h < 6;
  const dusk = (h >= 18 && h < 20) || (h >= 5 && h < 7);
  const met = qn("qNoll") >= 1;
  const hollow = qn("qHollow") >= 1;
  if (night && hollow) return { x: QH.x + 1.2, z: QH.z + 10.4, yaw: Math.PI };
  if (night && met) return { x: WELL_AT.x + 1.6, z: WELL_AT.z - 1.2, yaw: 0.2 };
  if (dusk) return { x: Q.duskPath.x, z: Q.duskPath.z, yaw: -1.2 };
  return { x: Q.ghost.x, z: Q.ghost.z, yaw: 2.4 };
}

export function quietFloor(): number | null {
  if (room === "roots") return heightAt(WELL_AT.x, WELL_AT.z) - 4.35;
  if (room === "hall") return heightAt(Q.mosaic.x, Q.mosaic.z) + 0.12;
  return null;
}

function pushSeg(
  x: number,
  z: number,
  ax: number,
  az: number,
  bx: number,
  bz: number,
  half: number,
): { x: number; z: number } | null {
  const dx = bx - ax;
  const dz = bz - az;
  const len2 = dx * dx + dz * dz || 1;
  let t = ((x - ax) * dx + (z - az) * dz) / len2;
  t = Math.max(0, Math.min(1, t));
  const px = ax + dx * t;
  const pz = az + dz * t;
  const ex = x - px;
  const ez = z - pz;
  const d = Math.hypot(ex, ez);
  if (d >= half || d < 1e-6) return null;
  const s = half / d;
  return { x: px + ex * s, z: pz + ez * s };
}

function pushWalls(
  nx: number,
  nz: number,
  walls: { ax: number; az: number; bx: number; bz: number; half: number }[],
  gaps?: { x: number; z: number; r: number }[],
) {
  let x = nx;
  let z = nz;
  let hit = false;
  for (const w of walls) {
    const midX = (w.ax + w.bx) * 0.5;
    const midZ = (w.az + w.bz) * 0.5;
    if (gaps && gaps.some((g) => Math.hypot(midX - g.x, midZ - g.z) < g.r)) continue;
    const p = pushSeg(x, z, w.ax, w.az, w.bx, w.bz, w.half);
    if (p) {
      x = p.x;
      z = p.z;
      hit = true;
    }
  }
  return hit ? { x, z } : null;
}

export function collideQuiet(nx: number, nz: number): { x: number; z: number } | null {
  if (live.house) return null;
  if (room === "hall") {
    const gaps = [
      { x: HALL.hub.x + 7.4, z: HALL.hub.z, r: 2.4 },
      { x: HALL.hub.x - 7.4, z: HALL.hub.z, r: 2.4 },
      { x: HALL.hub.x, z: HALL.hub.z - 7.4, r: hallHasKey() ? 2.6 : 0.2 },
      { x: HALL.hub.x, z: HALL.hub.z + 7.4, r: 2.6 },
      { x: HALL.east.x - 6.2, z: HALL.east.z, r: 2.4 },
      { x: HALL.west.x + 6.2, z: HALL.west.z, r: 2.4 },
      { x: HALL.boss.x, z: HALL.boss.z + 9.6, r: hallHasKey() ? 2.8 : 0.2 },
      { x: HALL.gold.x - 2, z: HALL.gold.z, r: qn("qRemain") >= 1 ? 3 : 0.2 },
    ];
    const a = pushWalls(nx, nz, HALL_WALLS, gaps);
    if (a) return a;
    if (live.bossFight) {
      const p = live.foeTrack["quiet-remain"];
      if (p) {
        const dx = nx - p.x;
        const dz = nz - p.z;
        const d2 = dx * dx + dz * dz;
        if (d2 < 1.7 * 1.7 && d2 > 1e-6) {
          const d = Math.sqrt(d2);
          return { x: p.x + (dx / d) * 1.7, z: p.z + (dz / d) * 1.7 };
        }
      }
    }
    return null;
  }
  if (room === "roots") {
    const hubR = 4.2;
    const dHub = Math.hypot(nx - WELL_AT.x, nz - WELL_AT.z);
    const inArm =
      (Math.abs(nz - WELL_AT.z) < 2.05 && Math.abs(nx - WELL_AT.x) < 22) ||
      (Math.abs(nx - WELL_AT.x) < 2.05 && nz < WELL_AT.z + 4 && nz > WELL_AT.z - 22);
    if (dHub < hubR || inArm) return null;
    const dx = nx - WELL_AT.x;
    const dz = nz - WELL_AT.z;
    const d = Math.hypot(dx, dz) || 1;
    if (Math.abs(dx) > Math.abs(dz)) return { x: WELL_AT.x + Math.sign(dx) * 2.05, z: nz };
    return { x: nx, z: WELL_AT.z + (dz > 0 ? 2.05 : -2.05) };
  }
  let x = nx;
  let z = nz;
  let hit = false;
  if (inHollow(nx, nz, 4)) {
    for (const h of HOLLOW_HOMES) {
      const dx = x - h.x;
      const dz = z - h.z;
      const hx = h.w * 0.5 + 0.45;
      const hz = h.d * 0.5 + 0.45;
      if (Math.abs(dx) < hx && Math.abs(dz) < hz) {
        if (hx - Math.abs(dx) < hz - Math.abs(dz)) x = h.x + Math.sign(dx || 1) * hx;
        else z = h.z + Math.sign(dz || 1) * hz;
        hit = true;
      }
    }
  }
  return hit ? { x, z } : null;
}

export function quietLadders(): Ladder[] {
  if (room === "roots") {
    return [{ id: "rootup", x: WELL_AT.x, z: WELL_AT.z, yaw: 0, h: 5.4, half: 0.7 }];
  }
  return [];
}

export function hydrateQuiet() {
  hallKey = qn("qHallKey") >= 1;
  hallEast = qn("qHallEast") >= 1;
  crackGone = qn("qCrack") >= 1;
  tangWall = qn("qTangWall") >= 1;
  room = "";
}

export function swordReach() {
  return hasSteel() ? 1.85 : 1.5;
}

export function swordHit() {
  return hasSteel() ? 2 : 1;
}

export function lanternTrail(): { x: number; z: number }[] {
  const a = FW.ruin;
  const b = QH;
  const n = 7;
  const out: { x: number; z: number }[] = [];
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1);
    out.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t });
  }
  return out;
}
