import { JAIL_Z, KEEP_Z, VZ, fieldHeight, housePads, pathU, pondU } from "../field";
import { LANDS, landW, riverU } from "../lands";
import { waterU } from "./waterRuns";

/** World metres per height-grid cell. Terrain, grass and flowers all sample this one grid so they agree. */
export const CELL = 1.5;

const OFF = 32768;
const hCache = new Map<number, number>();
const gCache = new Map<number, number>();

function key(ix: number, iz: number) {
  return (ix + OFF) * 65536 + (iz + OFF);
}

export function gridH(ix: number, iz: number) {
  const k = key(ix, iz);
  let v = hCache.get(k);
  if (v === undefined) {
    v = fieldHeight(ix * CELL, iz * CELL);
    if (hCache.size > 900000) hCache.clear();
    hCache.set(k, v);
  }
  return v;
}

/** Ground height off the shared grid — matches the rendered terrain triangles exactly. */
export function sampleH(x: number, z: number) {
  const fx = x / CELL;
  const fz = z / CELL;
  const ix = Math.floor(fx);
  const iz = Math.floor(fz);
  const ux = fx - ix;
  const uz = fz - iz;
  const a = gridH(ix, iz);
  const b = gridH(ix + 1, iz);
  const c = gridH(ix, iz + 1);
  const d = gridH(ix + 1, iz + 1);
  if (ux + uz <= 1) return a + (b - a) * ux + (c - a) * uz;
  return d + (c - d) * (1 - ux) + (b - d) * (1 - uz);
}

function smooth(a: number, b: number, v: number) {
  const u = Math.max(0, Math.min(1, (v - a) / (b - a)));
  return u * u * (3 - 2 * u);
}

/** Packed-earth amount for the keep road, which is not part of PATH_RUNS. */
export function keepRoadU(x: number, z: number) {
  if (z < VZ + 10 || z > KEEP_Z - 8) return 0;
  const d = Math.abs(x + Math.sin(z * 0.045) * 1.6);
  return d < 3.2 ? 1 - d / 3.2 : 0;
}

/** How green a land is: scales blade density so desert and snow stay bare. */
export function lushness(x: number, z: number) {
  let m = 1;
  m -= landW(x, z, "desert") * 0.94;
  m -= landW(x, z, "snow") * 0.9;
  m -= landW(x, z, "mount") * 0.55;
  m -= landW(x, z, "ruins") * 0.35;
  m -= landW(x, z, "swamp") * 0.25;
  return Math.max(0, m);
}

const VALE = LANDS.vale.grass;

/** RGB multiplier that carries each land's grass tint onto the key-art palette. */
export function landMul(x: number, z: number, out: [number, number, number]) {
  let r = VALE[0];
  let g = VALE[1];
  let b = VALE[2];
  let w = 1;
  for (const id of ["forest", "river", "mount", "desert", "swamp", "snow", "ruins"] as const) {
    const k = landW(x, z, id);
    if (k <= 0.01) continue;
    const c = LANDS[id].grass;
    r += c[0] * k * 3;
    g += c[1] * k * 3;
    b += c[2] * k * 3;
    w += k * 3;
  }
  out[0] = Math.min(2.2, r / w / VALE[0]);
  out[1] = Math.min(2.0, g / w / VALE[1]);
  out[2] = Math.min(3.4, b / w / VALE[2]);
  return out;
}

let bare: { x: number; z: number; hx: number; hz: number }[] | null = null;
/** Footprints registered by the scene (houses etc.) where nothing grows. */
export function setBareBoxes(list: { x: number; z: number; hx: number; hz: number }[]) {
  bare = list;
  gCache.clear();
}

/** 0 … 1 — how much grass may grow at a point. */
export function grassAt(x: number, z: number) {
  let m = lushness(x, z);
  if (m <= 0.02) return 0;
  const p = pathU(x, z);
  if (p > 0) m *= 1 - smooth(0.02, 0.4, p);
  const kr = keepRoadU(x, z);
  if (kr > 0) m *= 1 - smooth(0.05, 0.5, kr);
  if (m <= 0) return 0;
  const pu = pondU(x, z);
  if (pu > 0) m *= 1 - smooth(0.0, 0.08, pu);
  const ru = riverU(x, z);
  if (ru > 0) m *= 1 - smooth(0.02, 0.3, ru);
  const wu = waterU(x, z);
  if (wu > 0) m *= 1 - smooth(0.25, 0.6, wu);
  if (m <= 0) return 0;
  if (Math.hypot(x, z - KEEP_Z) < 17) return 0;
  if (Math.hypot(x, z - JAIL_Z) < 10.5) return 0;
  if (bare) {
    for (const b of bare) {
      if (Math.abs(x - b.x) < b.hx && Math.abs(z - b.z) < b.hz) return 0;
    }
  }
  return m;
}

void housePads;

export function gridGrass(ix: number, iz: number) {
  const k = key(ix, iz);
  let v = gCache.get(k);
  if (v === undefined) {
    const x = ix * CELL;
    const z = iz * CELL;
    v = grassAt(x, z);
    if (v > 0) {
      const sx = gridH(ix + 1, iz) - gridH(ix - 1, iz);
      const sz = gridH(ix, iz + 1) - gridH(ix, iz - 1);
      const slope = Math.hypot(sx, sz) / (2 * CELL);
      v *= 1 - smooth(0.85, 1.35, slope);
    }
    if (gCache.size > 900000) gCache.clear();
    gCache.set(k, v);
  }
  return v;
}

export function sampleGrass(x: number, z: number) {
  const fx = x / CELL;
  const fz = z / CELL;
  const ix = Math.floor(fx);
  const iz = Math.floor(fz);
  const ux = fx - ix;
  const uz = fz - iz;
  const a = gridGrass(ix, iz);
  const b = gridGrass(ix + 1, iz);
  const c = gridGrass(ix, iz + 1);
  const d = gridGrass(ix + 1, iz + 1);
  return (a + (b - a) * ux) * (1 - uz) + (c + (d - c) * ux) * uz;
}

function hash2(ix: number, iz: number) {
  const s = Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Cheap smooth value noise, 0 … 1. */
export function vnoise(x: number, z: number) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1);
  const d = hash2(ix + 1, iz + 1);
  return (a + (b - a) * ux) * (1 - uz) + (c + (d - c) * ux) * uz;
}

export function seeded(n: number) {
  let x = (Math.abs(Math.floor(n)) % 2147483646) + 1;
  return () => {
    x = (x * 16807) % 2147483647;
    return (x - 1) / 2147483646;
  };
}
