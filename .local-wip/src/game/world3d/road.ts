/** The King's Road — Oakstead north to the castle. */
import { KEEP_Z, VX, VZ } from "./field";

export const KING_ROAD: [number, number][] = [
  [VX, VZ + 18],
  [2, VZ + 52],
  [0, VZ + 88],
  [1, -18],
  [-1, 28],
  [0, KEEP_Z - 22],
];

export const ROAD_CART = { x: 4.6, z: VZ + 54 };
export const ROAD_SHRINE = { x: -7.2, z: -16 };
export const ROAD_GATE = { x: 0, z: KEEP_Z - 22 };
export const ROAD_DUMMY = { x: 5.4, z: KEEP_Z - 11 };

export function alongRoad(i: number, u: number): { x: number; z: number } {
  const a = KING_ROAD[i]!;
  const b = KING_ROAD[Math.min(KING_ROAD.length - 1, i + 1)]!;
  return { x: a[0] + (b[0] - a[0]) * u, z: a[1] + (b[1] - a[1]) * u };
}

export function onKingRoad(x: number, z: number, half = 8) {
  let best = Infinity;
  for (let i = 0; i < KING_ROAD.length - 1; i++) {
    const a = KING_ROAD[i]!;
    const b = KING_ROAD[i + 1]!;
    const abx = b[0] - a[0];
    const abz = b[1] - a[1];
    const len2 = abx * abx + abz * abz || 1;
    let t = ((x - a[0]) * abx + (z - a[1]) * abz) / len2;
    t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(x - (a[0] + abx * t), z - (a[1] + abz * t));
    if (d < best) best = d;
  }
  return best < half;
}

export function stepKindAt(
  x: number,
  z: number,
  opts: { house: boolean; swim: boolean; path: number; keepZ: number },
): "grass" | "stone" | "dirt" | "wood" | "water" {
  if (opts.house) return "wood";
  if (opts.swim) return "water";
  if (Math.hypot(x, z - opts.keepZ) < 28) return "stone";
  if (opts.path > 0.18) return "dirt";
  return "grass";
}

export function bowSpeed(draw: number) {
  const u = Math.max(0, Math.min(1, draw));
  return 12 + 22 * u * u;
}
