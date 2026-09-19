/** Surface water courses of the vale, as centre-lines. Shared by the water ribbons, the turf and the grass. */
export const RIVER: [number, number][] = [
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


export const WATER_RUNS: { pts: [number, number][]; half: number }[] = [
  { pts: RIVER, half: 4.7 },
  { pts: STREAM, half: 2.6 },
];

/** 1 at the centre-line, 0 at `reach` metres past the bank. */
export function waterU(x: number, z: number, reach = 2.4) {
  let best = 0;
  for (const run of WATER_RUNS) {
    const pts = run.pts;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i]!;
      const b = pts[i + 1]!;
      // Cheap reject on the segment's box.
      const pad = run.half + reach;
      if (x < Math.min(a[0], b[0]) - pad || x > Math.max(a[0], b[0]) + pad || z < Math.min(a[1], b[1]) - pad || z > Math.max(a[1], b[1]) + pad) continue;
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      let t = ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1);
      t = Math.max(0, Math.min(1, t));
      const d = Math.hypot(x - (a[0] + dx * t), z - (a[1] + dz * t));
      const u = 1 - Math.max(0, d - run.half * 0.6) / (run.half * 0.4 + reach);
      if (u > best) best = u;
    }
  }
  return Math.max(0, Math.min(1, best));
}
