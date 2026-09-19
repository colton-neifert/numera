/** Distinct overworld lands. No import from field.ts — field imports this. */

export type LandId = "vale" | "forest" | "river" | "mount" | "desert" | "swamp" | "snow" | "ruins";

export type LandDef = {
  id: LandId;
  name: string;
  sub: string;
  x: number;
  z: number;
  r: number;
  grass: [number, number, number];
  fog: string;
  sky: string;
  sun: string;
  gnd: string;
  bed: "field" | "forest" | "water" | "desert" | "swamp" | "mountain" | "snow" | "ruins" | "night";
  sign: string;
};

export const LANDS: Record<LandId, LandDef> = {
  vale: {
    id: "vale",
    name: "Green Vale",
    sub: "Oakstead’s hills",
    x: 0,
    z: -108,
    r: 360,
    grass: [0.42, 0.54, 0.25],
    fog: "#f0c898",
    sky: "#f2b878",
    sun: "#ffb060",
    gnd: "#7a8a42",
    bed: "field",
    sign: "Vale",
  },
  forest: {
    id: "forest",
    name: "Whisperwood",
    sub: "West of town",
    x: -920,
    z: -60,
    r: 540,
    grass: [0.16, 0.32, 0.14],
    fog: "#3a5840",
    sky: "#6a8860",
    sun: "#c8e0a0",
    gnd: "#2a4a28",
    bed: "forest",
    sign: "Woods",
  },
  river: {
    id: "river",
    name: "Silverrun",
    sub: "East water",
    x: 820,
    z: -70,
    r: 500,
    grass: [0.28, 0.48, 0.32],
    fog: "#a8d0c8",
    sky: "#b8e0e8",
    sun: "#fff4d0",
    gnd: "#4a7a58",
    bed: "water",
    sign: "River",
  },
  mount: {
    id: "mount",
    name: "Stoneback",
    sub: "North crags",
    x: 30,
    z: 780,
    r: 520,
    grass: [0.42, 0.42, 0.38],
    fog: "#c0b8a8",
    sky: "#d8d0c0",
    sun: "#fff0d8",
    gnd: "#6a6858",
    bed: "mountain",
    sign: "Peaks",
  },
  desert: {
    id: "desert",
    name: "Goldwaste",
    sub: "Southeast dunes",
    x: 1180,
    z: -780,
    r: 580,
    grass: [0.78, 0.62, 0.34],
    fog: "#e8c888",
    sky: "#f0d090",
    sun: "#ffd080",
    gnd: "#c4a05a",
    bed: "desert",
    sign: "Dunes",
  },
  swamp: {
    id: "swamp",
    name: "Mirefen",
    sub: "Southwest bog",
    x: -1020,
    z: -820,
    r: 540,
    grass: [0.22, 0.36, 0.24],
    fog: "#4a6a58",
    sky: "#6a8870",
    sun: "#c0d8a8",
    gnd: "#3a5a40",
    bed: "swamp",
    sign: "Fen",
  },
  snow: {
    id: "snow",
    name: "White Crown",
    sub: "Far north ice",
    x: -50,
    z: 1580,
    r: 560,
    grass: [0.88, 0.92, 0.96],
    fog: "#d0e0f0",
    sky: "#c8dcf0",
    sun: "#f4f8ff",
    gnd: "#d8e4ee",
    bed: "snow",
    sign: "Snow",
  },
  ruins: {
    id: "ruins",
    name: "Old Numer",
    sub: "South stones",
    x: 40,
    z: -1380,
    r: 520,
    grass: [0.46, 0.42, 0.32],
    fog: "#b8a888",
    sky: "#d0c4a0",
    sun: "#e8d8b0",
    gnd: "#7a6a48",
    bed: "ruins",
    sign: "Ruins",
  },
};

export const LAND_ORDER: LandId[] = ["vale", "forest", "river", "mount", "desert", "swamp", "snow", "ruins"];

function hill(x: number, z: number, cx: number, cz: number, r: number, h: number) {
  const d = Math.hypot(x - cx, z - cz);
  if (d >= r) return 0;
  const u = 1 - d / r;
  return u * u * (3 - 2 * u) * h;
}

function plateau(x: number, z: number, cx: number, cz: number, rIn: number, rOut: number, h: number) {
  const d = Math.hypot(x - cx, z - cz);
  if (d >= rOut) return 0;
  if (d <= rIn) return h;
  const u = 1 - (d - rIn) / Math.max(0.01, rOut - rIn);
  return u * u * (3 - 2 * u) * h;
}

function distSeg(x: number, z: number, ax: number, az: number, bx: number, bz: number) {
  const dx = bx - ax;
  const dz = bz - az;
  const len2 = dx * dx + dz * dz || 1;
  let t = ((x - ax) * dx + (z - az) * dz) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(x - (ax + dx * t), z - (az + dz * t));
}

/** Silverrun — a long eastward river from the vale pond. */
export const RIVER_RUN: [number, number][] = [
  [-48, -128],
  [90, -118],
  [260, -96],
  [480, -78],
  [720, -68],
  [960, -88],
  [1180, -36],
  [1380, 40],
];

export function riverU(x: number, z: number) {
  let best = 0;
  for (let i = 0; i < RIVER_RUN.length - 1; i++) {
    const a = RIVER_RUN[i]!;
    const b = RIVER_RUN[i + 1]!;
    const half = 7.2 + (i % 3) * 1.4;
    const d = distSeg(x, z, a[0], a[1], b[0], b[1]);
    const u = 1 - d / half;
    if (u > best) best = u;
  }
  if (best <= 0) return 0;
  return best * best * (3 - 2 * best);
}

export function landW(x: number, z: number, id: LandId) {
  const L = LANDS[id];
  const d = Math.hypot(x - L.x, z - L.z);
  if (d >= L.r) return 0;
  const u = 1 - d / L.r;
  return u * u * (3 - 2 * u);
}

export function landAt(x: number, z: number): LandDef {
  const dv = Math.hypot(x - LANDS.vale.x, z - LANDS.vale.z);
  if (dv < 220) return LANDS.vale;
  let best: LandDef = LANDS.vale;
  let bestW = landW(x, z, "vale") + (dv < 340 ? 0.35 : 0);
  for (const id of LAND_ORDER) {
    if (id === "vale") continue;
    const w = landW(x, z, id);
    if (w > bestW) {
      bestW = w;
      best = LANDS[id];
    }
  }
  return best;
}

export type LandFeel = {
  id: LandId;
  speed: number;
  ice: number;
  sink: number;
  windX: number;
  windZ: number;
  sand: number;
};

export function landFeel(x: number, z: number): LandFeel {
  const L = landAt(x, z);
  const w = landW(x, z, L.id);
  const feel: LandFeel = { id: L.id, speed: 1, ice: 0, sink: 0, windX: 0, windZ: 0, sand: 0 };
  if (L.id === "swamp") {
    feel.speed = 1 - 0.38 * w;
    feel.sink = 0.55 * w;
  } else if (L.id === "desert") {
    feel.speed = 1 - 0.22 * w;
    feel.sand = w;
  } else if (L.id === "snow") {
    feel.ice = 0.82 * w;
    feel.speed = 1 + 0.08 * w;
  } else if (L.id === "mount") {
    feel.speed = 1 - 0.12 * w;
    feel.windX = Math.sin(x * 0.01 + z * 0.008) * 2.4 * w;
    feel.windZ = Math.cos(x * 0.008) * 1.6 * w;
  } else if (L.id === "forest") {
    feel.speed = 1 - 0.08 * w;
  } else if (L.id === "ruins") {
    feel.speed = 1 - 0.04 * w;
  }
  const ru = riverU(x, z);
  if (ru > 0.2) feel.speed *= 1 - ru * 0.35;
  return feel;
}

export function landsLift(x: number, z: number): number {
  let y = 0;
  const F = LANDS.forest;
  y += hill(x, z, F.x, F.z, 220, 8.4);
  y += hill(x, z, F.x - 180, F.z + 90, 160, 11.2);
  y += hill(x, z, F.x + 140, F.z - 120, 150, 9.6);
  y += hill(x, z, F.x - 80, F.z - 200, 140, 10.4);
  y += hill(x, z, F.x + 200, F.z + 160, 170, 12.2);
  {
    const d = Math.hypot(x - F.x, z - (F.z + 20));
    if (d < 70) {
      const u = 1 - d / 70;
      y -= u * u * 4.2;
    }
  }

  const R = LANDS.river;
  y += hill(x, z, R.x, R.z + 180, 160, 7.4);
  y += hill(x, z, R.x, R.z - 200, 150, 6.8);
  {
    const ru = riverU(x, z);
    if (ru > 0) y -= ru * ru * 3.6;
  }

  const M = LANDS.mount;
  y += plateau(x, z, M.x, M.z, 40, 160, 28);
  y += hill(x, z, M.x, M.z, 210, 22);
  y += hill(x, z, M.x - 160, M.z + 40, 120, 18);
  y += hill(x, z, M.x + 150, M.z - 30, 110, 16);
  y += hill(x, z, M.x + 40, M.z + 180, 130, 20);
  y += hill(x, z, M.x - 40, M.z - 160, 100, 14);

  const D = LANDS.desert;
  {
    const w = landW(x, z, "desert");
    if (w > 0.02) {
      y += Math.sin(x * 0.018) * Math.cos(z * 0.014) * 6.4 * w;
      y += Math.sin(x * 0.041 + z * 0.02) * 3.2 * w;
      y -= 2.2 * w;
    }
  }
  y += plateau(x, z, D.x + 40, D.z - 20, 22, 48, 9.4);

  const S = LANDS.swamp;
  {
    const w = landW(x, z, "swamp");
    if (w > 0.02) y -= 3.8 * w;
  }
  y += hill(x, z, S.x + 90, S.z - 70, 80, 4.6);
  y += hill(x, z, S.x - 110, S.z + 80, 70, 4.2);
  y += hill(x, z, S.x + 40, S.z + 140, 90, 5.0);
  {
    const d = Math.hypot(x - S.x, z - S.z);
    if (d < 90) {
      const u = 1 - d / 90;
      y -= u * u * 3.4;
    }
  }

  const N = LANDS.snow;
  y += plateau(x, z, N.x, N.z, 80, 220, 26);
  y += hill(x, z, N.x, N.z, 260, 18);
  y += hill(x, z, N.x - 140, N.z + 80, 120, 16);
  y += hill(x, z, N.x + 130, N.z - 60, 110, 14);

  const U = LANDS.ruins;
  y += plateau(x, z, U.x, U.z, 70, 180, 8.4);
  {
    const d = Math.hypot(x - U.x, z - U.z);
    if (d < 48) {
      const u = 1 - d / 48;
      y -= u * u * 5.2;
    }
  }
  y += hill(x, z, U.x - 160, U.z - 40, 80, 7.2);
  y += hill(x, z, U.x + 150, U.z + 50, 76, 6.8);

  return y;
}

export function landTint(x: number, z: number): [number, number, number] {
  const vale = LANDS.vale.grass;
  let r = vale[0];
  let g = vale[1];
  let b = vale[2];
  let wSum = 0.18;
  for (const id of LAND_ORDER) {
    if (id === "vale") continue;
    const w = landW(x, z, id);
    if (w <= 0.01) continue;
    const c = LANDS[id].grass;
    r += c[0] * w;
    g += c[1] * w;
    b += c[2] * w;
    wSum += w;
  }
  r /= wSum;
  g /= wSum;
  b /= wSum;
  const ru = riverU(x, z);
  if (ru > 0.08) {
    const t = Math.min(1, ru * 1.25);
    r = r * (1 - t) + 0.16 * t;
    g = g * (1 - t) + 0.38 * t;
    b = b * (1 - t) + 0.42 * t;
  }
  const L = landAt(x, z);
  if (L.id === "snow") {
    const w = landW(x, z, "snow");
    r = r * (1 - w) + 0.9 * w;
    g = g * (1 - w) + 0.93 * w;
    b = b * (1 - w) + 0.96 * w;
  }
  if (L.id === "mount") {
    const w = landW(x, z, "mount");
    const peak = Math.min(1, Math.max(0, (Math.hypot(x - LANDS.mount.x, z - LANDS.mount.z) < 80 ? 0.55 : 0) + w * 0.4));
    r = r * (1 - peak) + 0.72 * peak;
    g = g * (1 - peak) + 0.7 * peak;
    b = b * (1 - peak) + 0.68 * peak;
  }
  return [r, g, b];
}

export type LandFoe = { id: string; kind: string; x: number; z: number };

export function landFoes(): LandFoe[] {
  const pack = (id: LandId, kind: string, n: number, rad: number): LandFoe[] => {
    const L = LANDS[id];
    const out: LandFoe[] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + id.length * 0.31;
      const d = 40 + (i % 4) * (rad / 5);
      out.push({
        id: `land-${id}-${i}`,
        kind,
        x: L.x + Math.cos(a) * d,
        z: L.z + Math.sin(a) * d,
      });
    }
    return out;
  };
  return [
    ...pack("forest", "timesprout", 6, 220),
    ...pack("river", "driplet", 5, 180),
    ...pack("mount", "glyphite", 5, 200),
    ...pack("desert", "sandwight", 6, 240),
    ...pack("swamp", "driplet", 6, 200),
    ...pack("snow", "umbral", 5, 200),
    ...pack("ruins", "glyphite", 5, 180),
  ];
}

export const LAND_CHESTS: { id: string; x: number; z: number; coins: number; item?: "heart" | "bombs" | "compass" }[] = [
  { id: "l-forest", x: LANDS.forest.x + 8, z: LANDS.forest.z - 6, coins: 0, item: "heart" },
  { id: "l-river", x: LANDS.river.x - 10, z: LANDS.river.z + 12, coins: 18 },
  { id: "l-mount", x: LANDS.mount.x + 6, z: LANDS.mount.z - 14, coins: 22 },
  { id: "l-desert", x: LANDS.desert.x + 42, z: LANDS.desert.z - 18, coins: 0, item: "bombs" },
  { id: "l-swamp", x: LANDS.swamp.x - 16, z: LANDS.swamp.z + 8, coins: 16 },
  { id: "l-snow", x: LANDS.snow.x + 12, z: LANDS.snow.z + 20, coins: 24 },
  { id: "l-ruins", x: LANDS.ruins.x, z: LANDS.ruins.z + 6, coins: 0, item: "compass" },
];

export function collideLands(nx: number, nz: number): { x: number; z: number } | null {
  let x = nx;
  let z = nz;
  let hit = false;
  const push = (cx: number, cz: number, hx: number, hz: number) => {
    const dx = x - cx;
    const dz = z - cz;
    if (Math.abs(dx) > hx || Math.abs(dz) > hz) return;
    const px = hx - Math.abs(dx);
    const pz = hz - Math.abs(dz);
    if (px < pz) x = cx + Math.sign(dx || 1) * hx;
    else z = cz + Math.sign(dz || 1) * hz;
    hit = true;
  };
  const ring = (cx: number, cz: number, r: number) => {
    const dx = x - cx;
    const dz = z - cz;
    const d = Math.hypot(dx, dz);
    if (d < r && d > 1e-4) {
      x = cx + (dx / d) * r;
      z = cz + (dz / d) * r;
      hit = true;
    }
  };
  ring(LANDS.forest.x, LANDS.forest.z, 3.4);
  push(LANDS.desert.x + 40, LANDS.desert.z - 20, 9.2, 9.2);
  push(LANDS.ruins.x, LANDS.ruins.z - 18, 7.4, 4.2);
  push(LANDS.swamp.x - 22, LANDS.swamp.z + 16, 3.6, 3.2);
  push(LANDS.snow.x - 18, LANDS.snow.z - 12, 3.4, 3.0);
  push(LANDS.river.x + 24, LANDS.river.z + 8, 3.2, 4.4);
  return hit ? { x, z } : null;
}

export const LAND_TRIPS: { name: string; x: number; z: number; cost: number }[] = [
  { name: "Whisperwood", x: LANDS.forest.x, z: LANDS.forest.z + 18, cost: 12 },
  { name: "Silverrun", x: LANDS.river.x - 20, z: LANDS.river.z, cost: 12 },
  { name: "Stoneback", x: LANDS.mount.x, z: LANDS.mount.z - 40, cost: 16 },
  { name: "Goldwaste", x: LANDS.desert.x - 40, z: LANDS.desert.z + 20, cost: 16 },
  { name: "Mirefen", x: LANDS.swamp.x + 30, z: LANDS.swamp.z + 20, cost: 14 },
  { name: "White Crown", x: LANDS.snow.x, z: LANDS.snow.z - 50, cost: 18 },
  { name: "Old Numer", x: LANDS.ruins.x, z: LANDS.ruins.z + 40, cost: 14 },
];
