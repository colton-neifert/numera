/** Heartland mountain ring. The rock is the wall. Openings are the only ways through. */
import { live } from "./live";

export const RIDGE_C = { x: 0, z: -8 };
export const RIDGE_R = 196;
export const RIDGE_RX = 248;
export const RIDGE_RZ = 188;
export const RIDGE_THICK = 11;
export const RIDGE_CREST = 18;

export type Opening = { id: string; a: number; half: number; name: string; kind: "pass" | "brick" | "hollow" | "river" | "cave" | "climb" };

export const OPENINGS: Opening[] = [
  { id: "north", a: Math.PI / 2, half: 0.062, name: "The North Pass", kind: "pass" },
  { id: "east", a: 0.05, half: 0.055, name: "The Stone Road", kind: "brick" },
  { id: "south", a: -1.35, half: 0.058, name: "The Hollow", kind: "hollow" },
  { id: "west", a: Math.PI * 0.92, half: 0.05, name: "The West Gate", kind: "river" },
  { id: "secret", a: -2.35, half: 0.04, name: "The Side Cave", kind: "cave" },
];

export const OUTER_R = 470;
export const OUTER_THICK = 20;
export const OUTER_CREST = 58;
export const OUTER: Opening[] = [
  { id: "high", a: 1.15, half: 0.045, name: "The High Gate", kind: "pass" },
  { id: "old", a: -0.4, half: 0.04, name: "The Old Tunnel", kind: "brick" },
  { id: "wild", a: 2.6, half: 0.042, name: "The Wild Arch", kind: "hollow" },
];

const BANDS = [{ rx: RIDGE_RX, rz: RIDGE_RZ, thick: RIDGE_THICK, openings: OPENINGS, crest: RIDGE_CREST }];

/** Ellipse so the valley is wide east-west and the cliffs stay clear of the canyon and the range. */
export function ellipseR(a: number, rx: number, rz: number) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const base = (rx * rz) / Math.hypot(rz * c, rx * s);
  const bend = 1 + 0.07 * Math.sin(a * 2.0) + 0.045 * Math.sin(a * 3.0 + 0.8) - 0.035 * Math.cos(a * 5.0);
  return base * bend;
}

/** Ground rises gently toward the cliffs, so the middle of the valley stays the low open field. */
export function fieldBowl(x: number, z: number) {
  const dx = x - RIDGE_C.x;
  const dz = z - RIDGE_C.z;
  const d = Math.hypot(dx, dz);
  const rad = ellipseR(Math.atan2(dz, dx), RIDGE_RX, RIDGE_RZ);
  const start = rad - 78;
  if (d < start || d > rad + 6) return 0;
  if (Math.hypot(x, z + 108) < 88) return 0;
  if (Math.hypot(x, z - 96) < 42) return 0;
  const u = Math.min(1, (d - start) / 78);
  return u * u * 7;
}

function holeOn(a: number, openings: Opening[], thickPad: boolean) {
  for (const o of openings) {
    const span = !thickPad || o.kind === "climb" ? o.half : o.half - 0.016;
    if (Math.abs(angDiff(a, o.a)) < span) return o;
  }
  return null;
}

export function angDiff(a: number, b: number) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function holeAt(a: number) {
  return holeOn(a, OPENINGS, true);
}

export function ridgeAngle(x: number, z: number) {
  return Math.atan2(z - RIDGE_C.z, x - RIDGE_C.x);
}

export function ridgeDist(x: number, z: number) {
  return Math.hypot(x - RIDGE_C.x, z - RIDGE_C.z);
}

/** The ring is a wall, not a hill. Nothing walks over it. */
export function ridgeLift(_x: number, _z: number) {
  return 0;
}

export function collideRidge(nx: number, nz: number): { x: number; z: number } | null {
  const dx = nx - RIDGE_C.x;
  const dz = nz - RIDGE_C.z;
  const dist = Math.hypot(dx, dz) || 0.001;
  const a = Math.atan2(dz, dx);
  for (const band of BANDS) {
    const rad = ellipseR(a, band.rx, band.rz);
    if (dist < rad - band.thick || dist > rad + band.thick) continue;
    const hole = holeOn(a, band.openings, true);
    if (hole && hole.kind !== "climb") return null;
    const target = dist < rad ? rad - band.thick - 0.6 : rad + band.thick + 0.6;
    const s = target / dist;
    return { x: RIDGE_C.x + dx * s, z: RIDGE_C.z + dz * s };
  }
  const rad0 = ellipseR(a, RIDGE_RX, RIDGE_RZ);
  const outer = rad0 + RIDGE_THICK;
  if (dist > outer + 0.2) {
    const gate = OPENINGS.find((o) => o.kind !== "climb" && Math.abs(angDiff(a, o.a)) < o.half * 0.9);
    const limit = gate ? outer + 20 : outer + 0.45;
    if (!gate || dist > limit) {
      const s = (limit - 0.3) / dist;
      return { x: RIDGE_C.x + dx * s, z: RIDGE_C.z + dz * s };
    }
  }
  return null;
}

/** Name the passage when you walk through it. The opening itself is the way. */
export function watchRidgeGate() {
  if (live.realmWarp || live.roomWarp || live.house) return;
  const dx = live.x - RIDGE_C.x;
  const dz = live.z - RIDGE_C.z;
  const dist = Math.hypot(dx, dz) || 0.001;
  const a = Math.atan2(dz, dx);
  for (const o of OPENINGS) {
    if (o.kind === "climb") continue;
    if (Math.abs(angDiff(a, o.a)) > o.half * 0.55) continue;
    const rad = ellipseR(o.a, RIDGE_RX, RIDGE_RZ);
    if (Math.abs(dist - rad) > 2.2) continue;
    if (live.banner !== o.name) {
      live.banner = o.name;
      live.bannerMs = 1400;
    }
    return;
  }
}
