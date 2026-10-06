/** A real range. The rock is the border. The pass is the only easy way through. */
import { live } from "./live";

export const RANGE_Z = 300;
export const RANGE_X0 = -360;
export const RANGE_X1 = 360;
export const RANGE_HALF = 34;

export const PASS = [
  { x: -6, z: 258 },
  { x: 8, z: 276 },
  { x: 20, z: 294 },
  { x: 8, z: 312 },
  { x: 30, z: 332 },
  { x: 36, z: 348 },
];

export const CAVE = [
  { x: -188, z: 260 },
  { x: -176, z: 300 },
  { x: -194, z: 346 },
];

export const MINE = [
  { x: 170, z: 262 },
  { x: 158, z: 300 },
  { x: 174, z: 346 },
];

export const CLEFT = [
  { x: 248, z: 264 },
  { x: 236, z: 302 },
  { x: 252, z: 344 },
];

export const CHAMBER = { x: 20, z: 294, r: 12 };
export const CRYSTAL = { x: 42, z: 294 };
export const CLIMB_X = -108;
export const TRAIL_X = 98;

function segDist(x: number, z: number, ax: number, az: number, bx: number, bz: number) {
  const dx = bx - ax;
  const dz = bz - az;
  const len2 = dx * dx + dz * dz || 1;
  let t = ((x - ax) * dx + (z - az) * dz) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(x - (ax + dx * t), z - (az + dz * t));
}

export function pathDist(x: number, z: number, pts: { x: number; z: number }[]) {
  let best = 999;
  for (let i = 0; i < pts.length - 1; i++) best = Math.min(best, segDist(x, z, pts[i]!.x, pts[i]!.z, pts[i + 1]!.x, pts[i + 1]!.z));
  return best;
}

export function rangeLift(x: number, z: number) {
  if (Math.abs(x + 42) < 5 && z > 248 && z < 266) {
    const u = 1 - Math.abs(z - 256) / 10;
    return 5.5 * Math.max(0, u);
  }
  return 0;
}

function inTube(x: number, z: number, pts: { x: number; z: number }[], half: number) {
  return pathDist(x, z, pts) < half;
}

export function collideRange(nx: number, nz: number, crystal: boolean): { x: number; z: number } | null {
  if (inTube(nx, nz, PASS, 6.4) || Math.hypot(nx - CHAMBER.x, nz - CHAMBER.z) < CHAMBER.r) {
    if (Math.hypot(nx - 14, nz - 286) < 1.7) return { x: nx < 14 ? 11.6 : 16.4, z: nz };
    if (Math.hypot(nx - 22, nz - 300) < 2.5) return { x: nx, z: nz < 300 ? 296.8 : 303.2 };
    if (Math.abs(nz - CRYSTAL.z) < 2.4 && nx > 28 && nx < 44 && Math.abs(nx - CRYSTAL.x) > 2.2) {
      return { x: nx < CRYSTAL.x ? CRYSTAL.x - 2.4 : CRYSTAL.x + 2.4, z: nz };
    }
    return null;
  }
  if (inTube(nx, nz, CAVE, 5.2)) return null;
  if (inTube(nx, nz, CLEFT, 4.8)) return null;
  if (inTube(nx, nz, MINE, 5.2)) {
    if (!crystal && nz < 278) return { x: nx, z: Math.min(nz, 258) };
    return null;
  }
  if (Math.abs(nx + 42) < 6 && nz > 248 && nz < 266) return null;
  if (nx < RANGE_X0 - 6 || nx > RANGE_X1 + 6) return null;
  if (nz < RANGE_Z - RANGE_HALF - 1 || nz > RANGE_Z + RANGE_HALF + 1) return null;
  const z = nz < RANGE_Z ? RANGE_Z - RANGE_HALF - 0.7 : RANGE_Z + RANGE_HALF + 0.7;
  return { x: nx, z };
}

export function watchRangeGate() {
  if (live.realmWarp || live.roomWarp || live.house) return;
  const south = PASS[0]!;
  if (Math.hypot(live.x - south.x, live.z - south.z) < 6 && live.banner !== "The mountain pass") {
    live.banner = "The mountain pass";
    live.bannerMs = 1400;
  }
}
