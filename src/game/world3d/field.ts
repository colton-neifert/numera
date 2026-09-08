import type { WorldId } from "../types";
import { LEVELS } from "../phaser/levels";
import { live } from "./live";

/** Oakstead sits a walk south of the keep — not in its yard. */
export const VX = 0;
export const VZ = -210;
export const VR = 145;
const OLD_VZ = -82;
const TOWN_SPREAD = 2.2;

export function vWorld(x: number, z: number) {
  return { x: VX + x * TOWN_SPREAD, z: VZ + (z - OLD_VZ) * TOWN_SPREAD };
}

const ORCHARD_TREE_OLD = { x: -24.2, z: -80.8 };
export const ORCHARD_TREE = vWorld(ORCHARD_TREE_OLD.x, ORCHARD_TREE_OLD.z);
/** Ladder stands clear of the canopy so Mira’s head never sits in the leaves. */
export const ORCHARD_LADDER = {
  x: ORCHARD_TREE.x + 3.55,
  z: ORCHARD_TREE.z + 0.35,
};
/** Ground spot in front of the rails — never on the rungs. */
export const ORCHARD_STAND = {
  x: ORCHARD_TREE.x + 5.4,
  z: ORCHARD_TREE.z + 1.35,
};

export const ECHO_GLADE = { x: 3600, z: 480 };
export const COW_PAD = { x: -5600, z: -200 };
export const FAIRY_RING = { x: 5900, z: 1500 };
export const PICNIC_AT = { x: 580, z: 4900 };
export const FAR_POND = { x: -1960, z: 4680 };
export const LONELY_CHEST = { x: 7060, z: -2860 };
export const KEEP_OUT = { x: 5100, z: -1640 };
export const PIG_AT = { x: 1120, z: -4060 };
export const BALLOON_AT = { x: -3080, z: 1920 };
export const BOTTLE_AT = { x: FAR_POND.x + 10.4, z: FAR_POND.z + 3.2 };
export const GOAT_AT = { x: -4440, z: -3400 };
export const SHROOM_AT = { x: 3920, z: 3540 };
export const BEE_AT = vWorld(-22, -78);
export const CRATE_AT = vWorld(6, -110);
export const BELL_AT = vWorld(3.2, -72);
export const KITE_AT = { x: 2700, z: -4960 };
export const RABBIT_AT = { x: -1120, z: 2480 };
export const CAMP_AT = { x: -6600, z: 1680 };
export const SHEEP_AT = { x: 1920, z: 2300 };
export const SNOW_AT = { x: -580, z: 7900 };
export const STAR_HILL = { x: 4720, z: 3840 };
export const GIANT_AT = { x: -3460, z: 5620 };
export const ICE_AT = { x: SNOW_AT.x + 22, z: SNOW_AT.z - 12 };
export const OWL_AT = { x: 40, z: 160 };
export const BUSH_AT = { x: 5760, z: -330 };
export const TALK_TREE = { x: 355, z: 40 };
export const FLAG_AT = { x: 8040, z: 2550 };
export const DESERT_AT = { x: 8500, z: -4760 };
export const LOG_AT = { x: -2550, z: -3840 };


export function heightAt(x: number, z: number): number {
  if (live.dungeon || live.flat) return 0;
  if (live.house) return live.houseY || 0;
  const hill = (cx: number, cz: number, r: number, h: number) => {
    const d = Math.hypot(x - cx, z - cz);
    if (d >= r) return 0;
    const u = 1 - d / r;
    return u * u * (3 - 2 * u) * h;
  };
  const plateau = (cx: number, cz: number, rIn: number, rOut: number, h: number) => {
    const d = Math.hypot(x - cx, z - cz);
    if (d >= rOut) return 0;
    if (d <= rIn) return h;
    const u = 1 - (d - rIn) / Math.max(0.01, rOut - rIn);
    return u * u * (3 - 2 * u) * h;
  };
  let y =
    Math.sin(x * 0.016) * 3.4 +
    Math.cos(z * 0.013) * 3.8 +
    Math.sin(x * 0.038 + z * 0.029) * 1.85 +
    Math.cos(x * 0.007 + z * 0.009) * 2.6 +
    Math.sin(x * 0.055 - z * 0.041) * 0.85;
  // Keep sits on a steep hill. Spawn (14,-58) is at the foot so y stays < 12.
  y += plateau(0, -26, 14, 42, 22);
  y += hill(0, 18, 48, 10);
  y += hill(-36, -118, 26, 9.5);
  y += hill(-50, -108, 18, 5.2);
  y += hill(-22, -132, 20, 6.4);
  y += hill(68, -64, 34, 5.2);
  y += hill(-78, -36, 30, 4.2);
  y += hill(96, -18, 34, 5.4);
  y += hill(-28, -148, 22, 4.2);
  y += hill(54, -148, 28, 4.0);
  y += hill(120, 36, 36, 6.2);
  y += hill(-110, 28, 32, 5.2);
  y += hill(0, 48, 44, 9.4);
  y += hill(18, -88, 16, 3.2);
  y += hill(-62, -155, 22, 5.6);
  y += hill(58, -140, 28, 6.4);
  y += hill(24, -176, 20, 3.6);
  y += hill(-14, -96, 18, 4.4);
  // Rolling countryside behind Oakstead (north of the village).
  y += hill(-78, -345, 52, 10.5);
  y += hill(88, -360, 48, 9.6);
  y += hill(-8, -410, 64, 13.5);
  y += hill(-108, -268, 30, 5.8);
  y += hill(108, -248, 26, 5.2);
  y += hill(-86, -218, 22, 4.0);
  y += hill(64, -278, 24, 4.4);
  y += plateau(VX, VZ, VR * 0.42, VR + 28, 1.15);
  if (z > -200 && z < 40) {
    const cx = 44 + Math.sin((z + 90) * 0.022) * 10;
    const d = Math.abs(x - cx);
    const bank = 32;
    if (d < bank) {
      const u = 1 - d / bank;
      y -= u * u * 14.2;
    }
  }
  {
    const d = Math.hypot(x - 32, z + 76);
    const wobble = 1 + 0.18 * Math.sin(x * 0.48) + 0.14 * Math.cos(z * 0.4);
    if (d < 9.4 * wobble) {
      const u = 1 - d / (9.4 * wobble);
      y -= u * u * 5.6;
    }
  }
  y += hill(ECHO_GLADE.x, ECHO_GLADE.z, 32, 2.5);
  y += hill(COW_PAD.x, COW_PAD.z, 36, 1.8);
  y += hill(FAIRY_RING.x, FAIRY_RING.z, 28, 2.2);
  y += hill(PICNIC_AT.x, PICNIC_AT.z, 26, 2.4);
  y += hill(FAR_POND.x, FAR_POND.z, 34, 1.6);
  y += hill(LONELY_CHEST.x, LONELY_CHEST.z, 30, 2.8);
  y += hill(KEEP_OUT.x, KEEP_OUT.z, 22, 1.9);
  y += hill(PIG_AT.x, PIG_AT.z, 24, 1.7);
  y += hill(BALLOON_AT.x, BALLOON_AT.z, 26, 2.4);
  y += hill(GOAT_AT.x, GOAT_AT.z, 26, 2.0);
  y += hill(SHROOM_AT.x, SHROOM_AT.z, 22, 1.6);
  y += hill(KITE_AT.x, KITE_AT.z, 28, 2.6);
  y += hill(RABBIT_AT.x, RABBIT_AT.z, 22, 1.5);
  y += hill(CAMP_AT.x, CAMP_AT.z, 26, 2.1);
  y += hill(SHEEP_AT.x, SHEEP_AT.z, 24, 1.8);
  y += hill(SNOW_AT.x, SNOW_AT.z, 36, 3.4);
  y += hill(STAR_HILL.x, STAR_HILL.z, 30, 3.0);
  y += hill(GIANT_AT.x, GIANT_AT.z, 24, 1.7);
  y += hill(ICE_AT.x, ICE_AT.z, 20, 0.6);
  y += hill(OWL_AT.x, OWL_AT.z, 22, 2.2);
  y += hill(BUSH_AT.x, BUSH_AT.z, 20, 1.6);
  y += hill(FLAG_AT.x, FLAG_AT.z, 26, 3.6);
  y += hill(DESERT_AT.x, DESERT_AT.z, 40, 1.2);
  y += hill(BELL_AT.x, BELL_AT.z, 18, 1.4);
  y += hill(LOG_AT.x, LOG_AT.z, 22, 1.6);
  {
    const dv = Math.hypot(x - VX, z - VZ);
    const span = VR + 18;
    if (dv < span) {
      const u = 1 - dv / span;
      const s = u * u * (3 - 2 * u);
      y = y * (1 - 0.68 * s) + 2.55 * 0.68 * s;
    }
  }
  const pu = pondU(x, z);
  if (pu > 0) {
    const villagePond = Math.hypot(x - POND.x, z - POND.z) < POND.r * 1.65;
    y -= pu * pu * (villagePond ? 2.35 : 4.4);
  }
  y = flattenHousePads(x, z, y);
  const pth = pathU(x, z);
  if (pth > 0) y -= pth * 0.14;
  return y;
}

export const WATER_Y = 0.1;
const pondHome = vWorld(-16.2, -100.4);
export const POND = { x: pondHome.x, z: pondHome.z, r: 14.2 };
export const DOCK = { x: POND.x + POND.r * 1.24, z: POND.z + 3.35 };
export const POLE_CHEST = { x: DOCK.x + 1.35, z: DOCK.z + 0.95 };

export function pondU(x: number, z: number) {
  const wobble = 1 + 0.2 * Math.sin(x * 0.42) + 0.16 * Math.cos(z * 0.37);
  const d = Math.hypot(x - POND.x, z - POND.z);
  const a = Math.max(0, 1 - d / (POND.r * wobble));
  const d2 = Math.hypot(x - FAR_POND.x, z - FAR_POND.z);
  const b = Math.max(0, 1 - d2 / 11);
  const poolW = 1 + 0.2 * Math.sin(x * 0.5) + 0.16 * Math.cos(z * 0.41);
  const d3 = Math.hypot(x - 32, z + 76);
  const c = Math.max(0, 1 - d3 / (8.6 * poolW));
  return Math.max(a, b, c);
}

export function pondSurfaceY() {
  return 0.58;
}

function distSeg(x: number, z: number, ax: number, az: number, bx: number, bz: number) {
  const dx = bx - ax;
  const dz = bz - az;
  const len2 = dx * dx + dz * dz || 1;
  let t = ((x - ax) * dx + (z - az) * dz) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(x - (ax + dx * t), z - (az + dz * t));
}

/** Winding dirt path from spawn through Oakstead, plus door / pond / fountain branches. */
export const PATH_RUNS: { pts: [number, number][]; half: number }[] = (() => {
  const home = vWorld(-24, -66);
  const yours = vWorld(0, -50);
  const ash = vWorld(16, -52);
  const cabin = vWorld(24, -66);
  const shop = vWorld(18, -42);
  const oak0 = vWorld(-14, -74);
  const oak5 = vWorld(-6, -92);
  const oak4 = vWorld(8, -96);
  const fire: [number, number] = [VX, VZ + 8];
  return [
    {
      half: 2.35,
      pts: [
        [14, -58],
        [12.4, -72],
        [8.2, -88],
        [2.4, -102],
        [-6.8, -116],
        [-4.2, -130],
        [3.6, -146],
        [9.4, -164],
        [6.2, -180],
        [1.4, -194],
        [0.2, -206],
        [1.6, -218],
        [2.0, -228],
      ],
    },
    { half: 1.55, pts: [[-4.2, -130], [0, -134.8], [yours.x, yours.z + 5.1]] },
    { half: 1.45, pts: [[-6.8, -116], [home.x + 8, home.z + 10], [home.x, home.z + 5.2]] },
    { half: 1.42, pts: [[1.4, -194], fire] },
    { half: 1.5, pts: [[2.0, -228], [POND.x + 8.4, POND.z + 6.2], [POND.x + 4.2, POND.z + 2.4]] },
    { half: 1.4, pts: [[0.2, -206], [-10, -214]] },
    { half: 1.48, pts: [[6.2, -180], [28, -186]] },
    { half: 1.4, pts: [[3.6, -146], [ash.x, ash.z + 7.4]] },
    { half: 1.38, pts: [[9.4, -164], [cabin.x, cabin.z + 5.2]] },
    { half: 1.35, pts: [[-6.8, -116], [oak0.x, oak0.z + 4.4]] },
    { half: 1.35, pts: [[1.6, -218], [oak5.x, oak5.z + 4.4]] },
    { half: 1.35, pts: [[2.0, -228], [oak4.x, oak4.z + 4.4]] },
    { half: 1.4, pts: [[shop.x - 6, -128], [shop.x, shop.z + 6.8]] },
  ];
})();

export function pathU(x: number, z: number) {
  let best = 0;
  for (const run of PATH_RUNS) {
    const pts = run.pts;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i]!;
      const b = pts[i + 1]!;
      const d = distSeg(x, z, a[0], a[1], b[0], b[1]);
      const u = 1 - d / run.half;
      if (u > best) best = u;
    }
  }
  if (best <= 0) return 0;
  return best * best * (3 - 2 * best);
}

type Pad = { x: number; z: number; hx: number; hz: number; y: number; blend: number };
const PAD_SPECS: { ox: number; oz: number; w: number; d: number }[] = [
  { ox: -24, oz: -66, w: 10.8, d: 9.6 },
  { ox: 0, oz: -50, w: 10.8, d: 9.6 },
  { ox: 16, oz: -52, w: 16.4, d: 14.6 },
  { ox: 24, oz: -66, w: 10.8, d: 9.6 },
  { ox: 18, oz: -42, w: 14.8, d: 13.2 },
  { ox: -14, oz: -74, w: 9.2, d: 8.4 },
  { ox: -4, oz: -64, w: 9.2, d: 8.4 },
  { ox: 14, oz: -74, w: 9.2, d: 8.4 },
  { ox: -24, oz: -88, w: 9.2, d: 8.4 },
  { ox: 8, oz: -96, w: 9.2, d: 8.4 },
  { ox: -6, oz: -92, w: 9.2, d: 8.4 },
  { ox: 22, oz: -90, w: 9.2, d: 8.4 },
  { ox: -36, oz: -78, w: 9.2, d: 8.4 },
  { ox: 34, oz: -98, w: 9.2, d: 8.4 },
  { ox: 2, oz: -116, w: 10.4, d: 9.6 },
  { ox: -34, oz: -126, w: 16.4, d: 14.2 },
  { ox: 32, oz: -112, w: 32, d: 28 },
  { ox: 46, oz: -94, w: 11.2, d: 10.4 },
];

let HOUSE_PADS: Pad[] | null = null;
let skipPads = false;
export function housePads(): Pad[] {
  if (HOUSE_PADS) return HOUSE_PADS;
  HOUSE_PADS = PAD_SPECS.map((s) => {
    const p = vWorld(s.ox, s.oz);
    return {
      x: p.x,
      z: p.z,
      hx: s.w * 0.5 + 0.9,
      hz: s.d * 0.5 + 0.95,
      y: 0,
      blend: 3.4,
    };
  });
  skipPads = true;
  for (const p of HOUSE_PADS) p.y = heightAt(p.x, p.z);
  skipPads = false;
  return HOUSE_PADS;
}

export function flattenHousePads(x: number, z: number, y: number) {
  if (skipPads) return y;
  let out = y;
  for (const p of housePads()) {
    const dx = Math.abs(x - p.x) - p.hx;
    const dz = Math.abs(z - p.z) - p.hz;
    if (dx <= 0 && dz <= 0) {
      out = p.y;
      continue;
    }
    const d = Math.hypot(Math.max(0, dx), Math.max(0, dz));
    if (d < p.blend) {
      const u = 1 - d / p.blend;
      const s = u * u * (3 - 2 * u);
      out = out * (1 - s) + p.y * s;
    }
  }
  return out;
}

/** Thin fence AABBs. Gaps are the path gates — do not close them. */
export const FENCE_HITS: { cx: number; cz: number; hx: number; hz: number }[] = [
  { cx: -20.4, cz: -148, hx: 23.6, hz: 0.16 },
  { cx: 29.6, cz: -148, hx: 20.4, hz: 0.16 },
  { cx: -62, cz: -188, hx: 0.16, hz: 22 },
  { cx: 58, cz: -200, hx: 0.16, hz: 18 },
  { cx: vWorld(-24, -66).x - 7.4, cz: vWorld(-24, -66).z - 0.7, hx: 0.16, hz: 5.9 },
  { cx: vWorld(-24, -66).x, cz: vWorld(-24, -66).z - 6.6, hx: 7.4, hz: 0.16 },
  { cx: 0, cz: vWorld(0, -50).z - 6.4, hx: 7.1, hz: 0.16 },
  { cx: vWorld(0, -50).x - 7.1, cz: vWorld(0, -50).z - 0.9, hx: 0.16, hz: 5.5 },
  { cx: vWorld(0, -50).x + 7.1, cz: vWorld(0, -50).z - 0.9, hx: 0.16, hz: 5.5 },
  { cx: POND.x - 16, cz: POND.z + 10.5, hx: 8, hz: 0.16 },
];

export type TreeSpot = { x: number; z: number; s: number; r: number; h: number };

function seeded(start = 1) {
  let n = start;
  return () => {
    n = (n * 16807) % 2147483647;
    return (n - 1) / 2147483646;
  };
}

export function treeSpots(): TreeSpot[] {
  const list: TreeSpot[] = [];
  const rnd = seeded();
  for (let i = 0; i < 220 && list.length < 80; i++) {
    const a = rnd() * Math.PI * 2;
    const rad = 20 + rnd() * 9800;
    const x = Math.cos(a) * rad;
    const z = Math.sin(a) * rad - 10;
    if (Math.hypot(x, z + 26) < 22) continue;
    if (Math.hypot(x - VX, z - VZ) < VR + 14) continue;
    if (pondU(x, z) > 0.08) continue;
    if (z < VZ - 40 && Math.abs(x) < 12) continue;
    if (z > VZ && z < -16 && Math.abs(x) < 16) continue;
    list.push({
      x,
      z,
      s: 1.35 + rnd() * 1.15,
      r: rnd() * Math.PI,
      h: 0.92 + rnd() * 0.55,
    });
  }
  list.push(
    { x: 92, z: -380, s: 3.4, r: 0.4, h: 1.35 },
    { x: -98, z: -360, s: 3.1, r: 1.1, h: 1.28 },
    { x: 28, z: -430, s: 3.6, r: 2.2, h: 1.4 },
    { x: 120, z: -40, s: 2.8, r: 0.8, h: 1.22 },
    { x: -118, z: -18, s: 2.9, r: 1.6, h: 1.18 },
  );
  return list;
}

export const TREES = treeSpots();

export type RockSpot = { x: number; z: number; s: number; r: number; k: number };

export function rockSpots(): RockSpot[] {
  const list: RockSpot[] = [];
  const rnd = seeded(3);
  for (let i = 0; i < 160; i++) {
    const a = rnd() * Math.PI * 2;
    const rad = 22 + rnd() * 8500;
    const x = Math.cos(a) * rad;
    const z = Math.sin(a) * rad - 8;
    if (Math.hypot(x, z + 26) < 18) continue;
    if (Math.hypot(x - VX, z - VZ) < VR + 14) continue;
    if (z > VZ && z < -16 && Math.abs(x) < 16) continue;
    list.push({
      x,
      z,
      s: 0.38 + rnd() * 0.22,
      r: rnd() * Math.PI,
      k: rnd(),
    });
  }
  const boulders: { x: number; z: number; s: number; r: number }[] = [
    { x: 62.4, z: -8.6, s: 2.15, r: 0.4 },
    { x: -64.2, z: 8.4, s: 1.92, r: 1.35 },
    { x: 142.2, z: 36.4, s: 2.05, r: 0.6 },
    { x: -154.6, z: 48.2, s: 2.22, r: 1.1 },
    { x: 310, z: -40, s: 2.35, r: 0.9 },
    { x: -320, z: 70, s: 2.18, r: 1.4 },
    { x: 248.6, z: -128.4, s: 2.32, r: 1.6 },
    { x: 418.2, z: 74.6, s: 2.22, r: 1.25 },
    { x: 88.4, z: 214.2, s: 2.05, r: 0.5 },
    { x: 94.6, z: 220.8, s: 1.95, r: 1.1 },
    { x: 82.2, z: 226.4, s: 2.12, r: 0.8 },
    { x: -92.4, z: 348.2, s: 2.28, r: 1.3 },
    { x: -605, z: -22, s: 2.08, r: 0.7 },
    { x: 648, z: 158, s: 1.95, r: 1.2 },
    { x: 74, z: 538, s: 2.12, r: 0.4 },
    { x: 776, z: -304, s: 2.25, r: 1.5 },
    { x: -206, z: 498, s: 1.88, r: 0.9 },
  ];
  for (const b of boulders) {
    if (Math.hypot(b.x, b.z + 26) < 16) continue;
    if (Math.hypot(b.x - VX, b.z - VZ) < VR + 6) continue;
    list.push({ x: b.x, z: b.z, s: b.s, r: b.r, k: 0.82 });
  }
  return list;
}

export const ROCKS = rockSpots();
export const blownRocks = new Set<string>();

export function rockKey(x: number, z: number) {
  return `${x.toFixed(1)},${z.toFixed(1)}`;
}

export function rockGone(x: number, z: number) {
  return blownRocks.has(rockKey(x, z));
}

export function rockRadius(s: number) {
  return 0.62 * s;
}

export function rockHeight(s: number) {
  return Math.max(0.22, 0.58 * s);
}

export function climbOnRocks(x: number, z: number) {
  let h = 0;
  for (const r of ROCKS) {
    if (r.s < 1.1 || rockGone(r.x, r.z)) continue;
    const rad = rockRadius(r.s);
    if (Math.hypot(x - r.x, z - r.z) < rad * 0.78) h = Math.max(h, rockHeight(r.s));
  }
  return h;
}

export const LOGS: { x: number; z: number; s: number; r: number }[] = [
  { x: 28.4, z: 18.2, s: 1, r: 0.4 },
  { x: -34.2, z: 12.6, s: 0.92, r: 1.1 },
  { x: 48.6, z: -22.4, s: 1.08, r: -0.5 },
  { x: -56.2, z: -18.8, s: 0.86, r: 0.8 },
  { x: 102.4, z: 28.2, s: 1.12, r: 0.2 },
];

export const SHROOMS: { x: number; z: number; s: number }[] = [
  { x: 26.4, z: 16.2, s: 1 },
  { x: -30.8, z: 10.4, s: 0.9 },
  { x: 44.2, z: -18.6, s: 1.1 },
];

export type GrassTuft = { id: string; x: number; z: number };

export function fieldPebbles(world: WorldId): { id: string; x: number; z: number }[] {
  const list: { id: string; x: number; z: number }[] = [];
  const rnd = seeded(world.length * 19 + 3);
  const count = world === "meadow" ? 10 : 6;
  for (let i = 0; i < count * 2 && list.length < count; i++) {
    const a = rnd() * Math.PI * 2;
    const rad = 6 + rnd() * (world === "meadow" ? 34 : 16);
    const x = Math.cos(a) * rad + (world === "meadow" ? -6 : 2);
    const z = Math.sin(a) * rad + (world === "meadow" ? 10 : 10);
    if (pondU(x, z) > 0.12) continue;
    if (Math.hypot(x, z + 26) < 16) continue;
    if (Math.hypot(x - VX, z - VZ) < VR + 8) continue;
    list.push({ id: `pb-${world}-${list.length}`, x, z });
  }
  return list;
}

export function pickShrooms(world: WorldId): { id: string; x: number; z: number; s: number }[] {
  if (world !== "meadow") {
    return [
      { id: `sh-${world}-0`, x: 6.4, z: 10.2, s: 1 },
      { id: `sh-${world}-1`, x: -7.8, z: -3.4, s: 0.9 },
    ];
  }
  const list: { id: string; x: number; z: number; s: number }[] = [];
  TREES.forEach((t, i) => {
    if (i % 7 !== 0) return;
    if (Math.hypot(t.x, t.z + 26) < 20) return;
    if (Math.hypot(t.x - VX, t.z - VZ) < VR + 4) return;
    list.push({
      id: `sh-t${i}`,
      x: t.x + 0.7 * t.s,
      z: t.z + 0.55 * t.s,
      s: 0.85 + (i % 3) * 0.1,
    });
  });
  const extras = [
    { id: "sh-r0", x: 62.4 + 1.2, z: -8.6, s: 0.9 },
    { id: "sh-h0", x: vWorld(-24, -66).x + 2.2, z: vWorld(-24, -66).z + 2.4, s: 0.8 },
  ];
  return [...list.slice(0, 18), ...extras];
}

export const pickedShrooms = new Set<string>();

export function grassWhisps(world: WorldId): { x: number; z: number }[] {
  if (world === "grave" || world === "cavern" || world === "echo" || world === "keep") return [];
  const list: { x: number; z: number }[] = [];
  const rnd = seeded(17 + world.length * 11);
  const count = world === "meadow" ? 110 : 32;
  for (let i = 0; i < count * 2 && list.length < count; i++) {
    const a = rnd() * Math.PI * 2;
    const rad = 10 + rnd() * (world === "meadow" ? 1800 : 56);
    const x = Math.cos(a) * rad;
    const z = Math.sin(a) * rad - 8;
    if (pondU(x, z) > 0.12) continue;
    if (Math.hypot(x - VX, z - VZ) < VR + 14) continue;
    if (Math.hypot(x, z + 26) < 16) continue;
    if (z > VZ && z < -16 && Math.abs(x) < 16) continue;
    list.push({ x, z });
  }
  return list;
}

export function grassTufts(world: WorldId): GrassTuft[] {
  if (world === "grave") return [];
  const list: GrassTuft[] = [];
  const rnd = seeded(11 + world.length * 13);
  const count = world === "meadow" ? 110 : 28;
  for (let i = 0; i < count * 3 && list.length < count; i++) {
    const a = rnd() * Math.PI * 2;
    const rad = 8 + rnd() * (world === "meadow" ? 2000 : 48);
    const x = Math.cos(a) * rad;
    const z = Math.sin(a) * rad - 6;
    if (pondU(x, z) > 0.12) continue;
    if (Math.hypot(x - VX, z - VZ) < VR + 14) continue;
    if (Math.hypot(x, z + 26) < 16) continue;
    if (z > VZ && z < -16 && Math.abs(x) < 16) continue;
    list.push({ id: `g-${world}-${list.length}`, x, z });
  }
  return list;
}

export function isDungeon(world: WorldId) {
  return world !== "meadow" && world !== "keep" && world !== "arena";
}

export function isDeepDungeon(world: WorldId) {
  return isDungeon(world) && world !== "cavern" && world !== "marsh";
}

export function isBossKind(kind: string) {
  return kind === "remainder" || kind === "leftover" || kind === "nag" || kind === "rook";
}

export function spawnOnField(
  world: WorldId,
  resume: { x: number; y: number } | null,
): { x: number; z: number } {
  if (world === "meadow") {
    if (
      resume &&
      Number.isFinite(resume.x) &&
      Number.isFinite(resume.y) &&
      Math.abs(resume.x) < 250 &&
      resume.y < 4 &&
      resume.y > -400
    ) {
      return { x: resume.x, z: resume.y };
    }
    return { x: 14, z: -58 };
  }
  if (resume && Number.isFinite(resume.x) && Number.isFinite(resume.y) && Math.abs(resume.x) < 15000 && Math.abs(resume.y) < 16000) {
    return { x: resume.x, z: resume.y };
  }
  if (world === "arena") return { x: 0, z: 12 };
  if (world === "keep") return { x: 0, z: 8.4 };
  if (isDungeon(world)) return { x: 0, z: 22.2 };
  return { x: 0, z: 12.4 };
}

export type FieldSpot = { id: string; kind: string; x: number; z: number };
export type CrystalSpot = { id: string; x: number; z: number };

function xzFromLevel(world: WorldId, x2: number) {
  const w = LEVELS[world].width;
  const t = x2 / w;
  if (isDeepDungeon(world)) return { x: (t - 0.5) * 36, z: 20 - t * 6000 };
  if (isDungeon(world)) return { x: (t - 0.5) * 36, z: 20 - t * 4500 };
  return { x: (t - 0.42) * 78, z: 22 - t * 62 };
}

export function fieldActors(world: WorldId): {
  enemies: FieldSpot[];
  crystals: CrystalSpot[];
  gate: { x: number; z: number };
} {
  if (world === "arena") {
    const n = 12;
    return {
      enemies: Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        return { id: `arena-e${i}`, kind: "plusling", x: Math.cos(a) * 18.2, z: Math.sin(a) * 18.2 };
      }),
      crystals: [],
      gate: { x: 0, z: -16 },
    };
  }
  if (world === "keep") {
    return {
      enemies: [{ id: "keep-boss", kind: "remainder", x: 0, z: -9.2 }],
      crystals: [
        { id: "keep-c0", x: -6.4, z: 8.6 },
        { id: "keep-c1", x: 6.4, z: 8.6 },
        { id: "keep-c2", x: 0, z: 10.2 },
      ],
      gate: { x: 0, z: 14 },
    };
  }
  if (world === "meadow") {
    return {
      enemies: [
        { id: "meadow-e0", kind: "plusling", x: 22.4, z: 16.2 },
        { id: "meadow-e1", kind: "plusling", x: -26.8, z: 8.4 },
        { id: "meadow-e2", kind: "plusling", x: 38.6, z: -18.2 },
        { id: "meadow-e3", kind: "plusling", x: -42.2, z: -12.6 },
        { id: "meadow-e4", kind: "plusling", x: 220, z: 80 },
        { id: "meadow-e5", kind: "plusling", x: -240, z: 120 },
        { id: "meadow-e6", kind: "plusling", x: 480, z: -200 },
        { id: "meadow-e7", kind: "plusling", x: -520, z: -280 },
        { id: "meadow-e8", kind: "plusling", x: 860, z: 340 },
        { id: "meadow-e9", kind: "plusling", x: -900, z: 400 },
        { id: "meadow-e10", kind: "plusling", x: 1400, z: -600 },
        { id: "meadow-e11", kind: "plusling", x: -1500, z: 700 },
        { id: "meadow-e12", kind: "plusling", x: 2800, z: 400 },
        { id: "meadow-e13", kind: "plusling", x: -3000, z: -500 },
        { id: "meadow-e14", kind: "plusling", x: 4200, z: -1400 },
        { id: "meadow-e15", kind: "plusling", x: -4400, z: 1600 },
        { id: "meadow-e16", kind: "plusling", x: 5600, z: 800 },
        { id: "meadow-e17", kind: "plusling", x: -5800, z: -900 },
      ],
      crystals: [
        { id: "meadow-c0", x: 16.4, z: 24.2 },
        { id: "meadow-c1", x: -18.6, z: 20.4 },
        { id: "meadow-c2", x: 32.2, z: -8.6 },
        { id: "meadow-c3", x: -28.4, z: -22.2 },
        { id: "meadow-c4", x: 8.2, z: 36.4 },
        { id: "meadow-c5", x: -48.2, z: 6.4 },
        { id: "meadow-c6", x: 54.6, z: 12.8 },
        { id: "meadow-c7", x: -8.4, z: 44.2 },
        { id: "meadow-c8", x: 280, z: 90 },
        { id: "meadow-c9", x: -310, z: 140 },
        { id: "meadow-c10", x: 640, z: -180 },
        { id: "meadow-c11", x: -700, z: 260 },
        { id: "meadow-c12", x: 1100, z: 500 },
        { id: "meadow-c13", x: -1200, z: -400 },
        { id: "meadow-c14", x: 1700, z: -800 },
        { id: "meadow-c15", x: -1800, z: 900 },
        { id: "meadow-c16", x: 2600, z: 600 },
        { id: "meadow-c17", x: -2800, z: -700 },
        { id: "meadow-c18", x: 3800, z: -1200 },
        { id: "meadow-c19", x: -4000, z: 1400 },
        { id: "meadow-c20", x: 5200, z: 400 },
        { id: "meadow-c21", x: -5400, z: 200 },
        { id: "meadow-c22", x: 6400, z: -1800 },
        { id: "meadow-c23", x: -6600, z: 2200 },
      ],
      gate: { x: 0, z: -70 },
    };
  }
  const level = LEVELS[world];
  const enemies: FieldSpot[] = level.enemies.map((e) => ({
    id: e.id,
    kind: e.kind,
    ...xzFromLevel(world, e.x),
  }));
  if (isDeepDungeon(world)) {
    enemies.push({ id: `${world}-warden`, kind: "warden", x: 0, z: 16 - 119 * 52 });
  }
  return {
    enemies,
    crystals: level.crystals.map((c) => ({ id: c.id, ...xzFromLevel(world, c.x) })),
    gate: xzFromLevel(world, level.gate.x),
  };
}

export function postgameEchoes(world: WorldId): FieldSpot[] {
  if (world === "arena" || world === "keep") return [];
  const kind = world === "meadow" ? "plusling" : world === "grove" ? "timesprout" : "glyphite";
  return [
    { id: `${world}-echo0`, kind, x: 14.2, z: 10.4 },
    { id: `${world}-echo1`, kind, x: -16.8, z: -8.2 },
  ];
}

export const WORLD_TINT: Record<
  WorldId,
  { grass: string; leaf: string; fog: string; sky: [number, number, number] }
> = {
  meadow: { grass: "#9ab84a", leaf: "#5a8a3c", fog: "#dce8c8", sky: [48, 58, 72] },
  cavern: { grass: "#4a3a28", leaf: "#3a2a18", fog: "#2a2018", sky: [20, 8, 2] },
  marsh: { grass: "#3a6a48", leaf: "#2a5a38", fog: "#7ab0a0", sky: [22, 42, 28] },
  grove: { grass: "#2a5a28", leaf: "#1a4a1c", fog: "#4a6a48", sky: [16, 32, 8] },
  crater: { grass: "#5a2a18", leaf: "#3a1a10", fog: "#c06030", sky: [90, 22, 4] },
  lake: { grass: "#4a7a58", leaf: "#2a5a38", fog: "#88c4e0", sky: [18, 32, 70] },
  grave: { grass: "#e6eef4", leaf: "#c8d4dc", fog: "#c4d2de", sky: [78, 62, 18] },
  waste: { grass: "#d4b06a", leaf: "#8a6a30", fog: "#f0d8a0", sky: [95, 58, 10] },
  keep: { grass: "#6a7a58", leaf: "#3a5a38", fog: "#90a8c0", sky: [30, 28, 55] },
  echo: { grass: "#5a4a70", leaf: "#3a2a58", fog: "#8878b0", sky: [40, 16, 70] },
  ridge: { grass: "#3a6a30", leaf: "#2a4a20", fog: "#6a8a58", sky: [22, 40, 12] },
  spire: { grass: "#5a5c58", leaf: "#3a3c40", fog: "#90a0b0", sky: [28, 26, 48] },
  fen: { grass: "#3a6a58", leaf: "#2a4a48", fog: "#80c0c8", sky: [16, 48, 52] },
  hollow: { grass: "#4a2818", leaf: "#3a1810", fog: "#c07040", sky: [80, 28, 8] },
  vault: { grass: "#3a2a48", leaf: "#2a1a38", fog: "#6a5088", sky: [36, 12, 58] },
  arena: { grass: "#6a7a48", leaf: "#4a6a30", fog: "#a8c090", sky: [40, 50, 18] },
};
