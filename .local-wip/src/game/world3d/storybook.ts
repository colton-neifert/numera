/** Original Numeria storybook oddities — Whisperwood contrast + village life.
 *  Not copies of anyone else's creatures. */
import { live } from "./live";
import { FW } from "./lands";

export const HEARTH = { x: -782, z: -228 };

export const COTTAGES: { x: number; z: number; r: number; ruin?: boolean }[] = [
  { x: HEARTH.x - 4.4, z: HEARTH.z + 1.8, r: 2.35 },
  { x: HEARTH.x + 5.2, z: HEARTH.z + 0.4, r: 2.05, ruin: true },
  { x: HEARTH.x - 0.2, z: HEARTH.z - 5.8, r: 2.25 },
];

export const CELLAR = { x: HEARTH.x - 0.15, z: HEARTH.z - 4.55 };

export const MOSS = [
  { x: HEARTH.x + 11.4, z: HEARTH.z + 6.8 },
  { x: HEARTH.x - 10.2, z: HEARTH.z + 8.6 },
  { x: HEARTH.x + 3.8, z: HEARTH.z - 13.2 },
] as const;

export const SOCKETS = [
  { x: HEARTH.x - 0.95, z: HEARTH.z + 3.55 },
  { x: HEARTH.x + 0.95, z: HEARTH.z + 3.55 },
  { x: HEARTH.x, z: HEARTH.z + 4.75 },
] as const;

export const STUMPS = [
  { x: FW.trail.x + 8.4, z: FW.trail.z + 6.2 },
  { x: FW.fern.x - 4.6, z: FW.fern.z + 3.4 },
  { x: FW.birch.x + 10.2, z: FW.birch.z - 8.1 },
  { x: FW.sun.x + 16.4, z: FW.sun.z - 12.6 },
] as const;

export const THORN = { x: FW.trail.x + 14, z: FW.trail.z - 7.2 };

export const WICK_HOME = { x: FW.pool.x + 2.4, z: FW.pool.z + 1.2 };

export function socketsFilled(set: boolean[]) {
  return set.length >= 3 && set[0] === true && set[1] === true && set[2] === true;
}

export function hearthOpen() {
  return Boolean(live.smashed["hearth-open"]);
}

export function collideStorybook(nx: number, nz: number): { x: number; z: number } | null {
  let x = nx;
  let z = nz;
  let hit = false;
  for (const c of COTTAGES) {
    if (c.ruin) continue;
    const dx = x - c.x;
    const dz = z - c.z;
    const d2 = dx * dx + dz * dz;
    const rr = c.r * c.r;
    if (d2 < rr && d2 > 1e-6) {
      const d = Math.sqrt(d2);
      x = c.x + (dx / d) * c.r;
      z = c.z + (dz / d) * c.r;
      hit = true;
    }
  }
  if (!hearthOpen()) {
    const dx = x - CELLAR.x;
    const dz = z - CELLAR.z;
    const d2 = dx * dx + dz * dz;
    if (d2 < 1.35 * 1.35 && d2 > 1e-6) {
      const d = Math.sqrt(d2);
      x = CELLAR.x + (dx / d) * 1.35;
      z = CELLAR.z + (dz / d) * 1.35;
      hit = true;
    }
  }
  return hit ? { x, z } : null;
}
