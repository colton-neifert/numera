import type { WorldId } from "../types";

export const DUNGEON_ROOM = 64;
export const HALL_HALF = 48;
export const DOOR_W = 8.4;
export const Z_MAX = 28.4;
export const DOOR_GAP = 4.4;
export const WALL_T = 1.42;

export function dungeonRoomCount(world: WorldId): number {
  if (world === "meadow" || world === "keep" || world === "arena") return 0;
  if (world === "cavern" || world === "marsh") return 12;
  return 14;
}

export function roomZ(i: number) {
  return 16 - i * DUNGEON_ROOM;
}

export function splitZ(i: number) {
  return 8.4 - i * DUNGEON_ROOM;
}

export function lastRoomZ(world: WorldId) {
  const n = dungeonRoomCount(world);
  return n > 0 ? roomZ(n - 1) : 0;
}

export function dungeonSpan(world: WorldId): { x: number; zMin: number; zMax: number } {
  const n = dungeonRoomCount(world);
  if (!n) return { x: 39.4, zMin: -43.2, zMax: 35.2 };
  if (world === "cavern") return { x: 68.4, zMin: Z_MAX - n * DUNGEON_ROOM + 1.35, zMax: 27.05 };
  return { x: HALL_HALF - 0.55, zMin: Z_MAX - n * DUNGEON_ROOM + 1.35, zMax: 27.05 };
}

export function roomCenters(n: number) {
  return Array.from({ length: n }, (_, i) => roomZ(i));
}

export type RoomShape = {
  halfW: number;
  east?: number;
  west?: number;
  alcoveHalf?: number;
  westOpen?: "n" | "s";
};

/** Sun Hollow — 12 rooms with a hub, two wings, and a later shortcut. */
export const CAVERN_SHAPE: RoomShape[] = [
  { halfW: 18 },
  { halfW: 47 },
  { halfW: 30, east: 38, west: 36, alcoveHalf: 14, westOpen: "n" },
  { halfW: 22 },
  { halfW: 20 },
  { halfW: 22 },
  { halfW: 20 },
  { halfW: 24, west: 34, alcoveHalf: 12, westOpen: "s" },
  { halfW: 22 },
  { halfW: 16 },
  { halfW: 18 },
  { halfW: 30 },
];

export type Wall = { x: number; z: number; w: number; d: number };

function wall(x: number, z: number, w: number, d: number): Wall {
  return { x, z, w, d };
}

function roomBand(i: number) {
  const z0 = i === 0 ? Z_MAX : splitZ(i - 1);
  const z1 = splitZ(i);
  return { z0, z1, zC: roomZ(i), zMid: (z0 + z1) * 0.5, depth: Math.abs(z0 - z1) };
}

function splitPair(z: number, half: number, gap = DOOR_GAP): Wall[] {
  const w = half - gap;
  if (w < 1.2) return [];
  const cx = (half + gap) * 0.5;
  return [wall(-cx, z, w, WALL_T), wall(cx, z, w, WALL_T)];
}

function sideRun(x: number, z0: number, z1: number): Wall {
  const mid = (z0 + z1) * 0.5;
  return wall(x, mid, WALL_T, Math.abs(z1 - z0) + WALL_T);
}

function alcoveBox(sign: 1 | -1, zC: number, halfW: number, extra: number, ah: number, skip?: "n" | "s"): Wall[] {
  const outer = sign * (halfW + extra);
  const depth = extra;
  const midX = sign * (halfW + extra * 0.5);
  const walls: Wall[] = [
    wall(outer + sign * WALL_T * 0.5, zC, WALL_T, ah * 2 + WALL_T),
  ];
  if (skip !== "s") walls.push(wall(midX, zC + ah + WALL_T * 0.5, depth + WALL_T, WALL_T));
  if (skip !== "n") walls.push(wall(midX, zC - ah - WALL_T * 0.5, depth + WALL_T, WALL_T));
  return walls;
}

export function cavernWalls(): Wall[] {
  const walls: Wall[] = [];
  const n = CAVERN_SHAPE.length;
  const first = CAVERN_SHAPE[0]!;
  const last = CAVERN_SHAPE[n - 1]!;
  walls.push(wall(0, Z_MAX, first.halfW * 2 + 2, WALL_T));
  walls.push(wall(0, splitZ(n - 1), last.halfW * 2 + 2, WALL_T));

  for (let i = 0; i < n; i++) {
    const s = CAVERN_SHAPE[i]!;
    const { z0, z1, zC } = roomBand(i);
    const ah = s.alcoveHalf ?? 12;
    const openE = (s.east ?? 0) > 0;
    const openW = (s.west ?? 0) > 0;

    if (!openE && !openW) {
      walls.push(sideRun(s.halfW + WALL_T * 0.5, z0, z1));
      walls.push(sideRun(-(s.halfW + WALL_T * 0.5), z0, z1));
    } else {
      const gapZ0 = zC + ah;
      const gapZ1 = zC - ah;
      walls.push(sideRun(s.halfW + WALL_T * 0.5, z0, gapZ0));
      walls.push(sideRun(s.halfW + WALL_T * 0.5, gapZ1, z1));
      walls.push(sideRun(-(s.halfW + WALL_T * 0.5), z0, gapZ0));
      walls.push(sideRun(-(s.halfW + WALL_T * 0.5), gapZ1, z1));
      if (openE) walls.push(...alcoveBox(1, zC, s.halfW, s.east!, ah));
      else {
        walls.push(wall(s.halfW + WALL_T * 0.5, zC, WALL_T, ah * 2));
      }
      if (openW) walls.push(...alcoveBox(-1, zC, s.halfW, s.west!, ah, s.westOpen));
      else {
        walls.push(wall(-(s.halfW + WALL_T * 0.5), zC, WALL_T, ah * 2));
      }
    }

    if (i < n - 1) {
      const next = CAVERN_SHAPE[i + 1]!;
      const z = splitZ(i);
      const narrow = Math.min(s.halfW, next.halfW);
      walls.push(...splitPair(z, narrow));
      if (s.halfW > narrow + 1) {
        const extra = s.halfW - narrow;
        const cx = narrow + extra * 0.5;
        walls.push(wall(cx, z + 0.85, extra + 0.5, WALL_T));
        walls.push(wall(-cx, z + 0.85, extra + 0.5, WALL_T));
      }
      if (next.halfW > narrow + 1) {
        const extra = next.halfW - narrow;
        const cx = narrow + extra * 0.5;
        walls.push(wall(cx, z - 0.85, extra + 0.5, WALL_T));
        walls.push(wall(-cx, z - 0.85, extra + 0.5, WALL_T));
      }
    }
  }

  // Shortcut hall: room 7 west alcove → hub west alcove (runs south, +Z).
  const hub = roomZ(2);
  const far = roomZ(7);
  const hx = -48;
  const hw = 5.6;
  const zSouth = hub - 14;
  const zNorth = far + 12;
  const mid = (zSouth + zNorth) * 0.5;
  const run = Math.abs(zSouth - zNorth);
  walls.push(wall(hx + hw, mid, WALL_T, run + WALL_T));
  walls.push(wall(hx - hw, mid, WALL_T, run + WALL_T));
  return walls;
}

export function cavernHalfW(i: number) {
  return CAVERN_SHAPE[i]?.halfW ?? 22;
}
