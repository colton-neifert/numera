/** Surface water courses of the vale, as centre-lines. Shared by the water ribbons, the turf and the grass. */
export const RIVER: [number, number][] = [
  [86, 54],
  [86, 40],
  [92, 8],
  [90, -28],
  [88, -62],
  [94, -96],
  [98, -132],
  [92, -168],
  [84, -200],
  [70, -268],
  [48, -340],
  [28, -420],
  [18, -520],
  [12, -680],
  [8, -900],
  [14, -1400],
  [40, -2200],
  [80, -3200],
];

export const STREAM: [number, number][] = [
  [78, 28],
  [82, -8],
  [80, -44],
  [84, -80],
  [88, -118],
  [86, -154],
];

/** Brook between the treehouse and Oakstead. */
export const CREEK = { z: -136.4, x0: -30, x1: -2, half: 1.85 };

/** Short outlet from the village pond. Stops in open grass, clear of every house. */
export const TOWN_DRAIN: [number, number][] = [
  [-94, -174],
  [-86, -168],
  [-80, -164],
];

export const WATER_RUNS: { pts: [number, number][]; half: number }[] = [
  { pts: RIVER, half: 3.35 },
  { pts: STREAM, half: 1.85 },
  { pts: TOWN_DRAIN, half: 1.25 },
];

function distSeg(x: number, z: number, ax: number, az: number, bx: number, bz: number) {
  const dx = bx - ax;
  const dz = bz - az;
  const len2 = dx * dx + dz * dz || 1;
  let t = ((x - ax) * dx + (z - az) * dz) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(x - (ax + dx * t), z - (az + dz * t));
}

/** 1 at the centre-line, 0 at `reach` metres past the bank. */
export function waterU(x: number, z: number, reach = 2.4) {
  let best = 0;
  for (const run of WATER_RUNS) {
    const pts = run.pts;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i]!;
      const b = pts[i + 1]!;
      const pad = run.half + reach;
      if (x < Math.min(a[0], b[0]) - pad || x > Math.max(a[0], b[0]) + pad || z < Math.min(a[1], b[1]) - pad || z > Math.max(a[1], b[1]) + pad) continue;
      const d = distSeg(x, z, a[0], a[1], b[0], b[1]);
      const u = 1 - Math.max(0, d - run.half * 0.55) / (run.half * 0.45 + reach);
      if (u > best) best = u;
    }
  }
  return Math.max(0, Math.min(1, best));
}

/** 1 in the creek channel, 0 on the grassy bank. */
export function creekU(x: number, z: number) {
  if (x < CREEK.x0 - 1.2 || x > CREEK.x1 + 1.2) return 0;
  const dz = Math.abs(z - CREEK.z);
  return Math.max(0, Math.min(1, 1 - dz / (CREEK.half + 1.15)));
}

/** How much to sink the earth so water sits in a bed, not on the grass. */
export function waterCarve(x: number, z: number) {
  const wu = waterU(x, z, 1.7);
  let y = wu > 0 ? wu * wu * 1.62 : 0;
  const cu = creekU(x, z);
  if (cu > 0) y = Math.max(y, cu * cu * 1.35);
  return y;
}
