/** Elderfour — the four-crown tree west of the vale. Overworld, not a WorldId. */
import { live } from "./live";
import { ET } from "./lands";
import type { Ladder } from "./climb";

export { ET };

export const ELDER = {
  outer: 13.2,
  inner: 10.05,
  shaft: 2.35,
  doorYaw: 1.98,
  doorHalf: 0.24,
  trunkH: 78,
};

export const FLOORS = {
  roots: 0.52,
  hollow: 12.6,
  trunk: 28.4,
  loft: 43.2,
  branch: 57.6,
  canopy: 74.8,
} as const;

export type ElderFloorId = keyof typeof FLOORS;

export const FLOOR_ORDER: ElderFloorId[] = ["roots", "hollow", "trunk", "loft", "branch", "canopy"];

export const WINDOWS: { id: string; y0: number; y1: number; yaw: number; half: number }[] = [
  { id: "hollow-vale", y0: 13.1, y1: 17.8, yaw: 1.98, half: 0.2 },
  { id: "trunk-town", y0: 29.0, y1: 33.6, yaw: 1.86, half: 0.18 },
  { id: "loft-north", y0: 43.6, y1: 47.8, yaw: 0.12, half: 0.16 },
  { id: "branch-east", y0: 57.2, y1: 62.2, yaw: 1.92, half: 0.3 },
  { id: "canopy-rim", y0: 74.8, y1: 82.4, yaw: 1.98, half: 0.42 },
];

export const BRANCHES: { id: string; yaw: number; len: number; w: number; y: number }[] = [
  { id: "east", yaw: 1.92, len: 17.4, w: 1.42, y: FLOORS.branch },
  { id: "south", yaw: 3.45, len: 12.2, w: 1.12, y: FLOORS.branch + 1.4 },
  { id: "west", yaw: 4.55, len: 13.6, w: 1.18, y: FLOORS.branch + 0.7 },
];

/** Diamond pads — same as Gran’s cloth. N, E, S, W. */
export const BELLS = [
  { id: 0, pip: 1, yaw: 0 },
  { id: 1, pip: 2, yaw: Math.PI * 0.5 },
  { id: 2, pip: 3, yaw: Math.PI },
  { id: 3, pip: 0, yaw: Math.PI * 1.5 },
] as const;

export const BELL_ORDER = [0, 1, 2, 3];
export const KNOT_ORDER = [0, 1, 2, 3];

export const CHESTS = {
  roots: { x: 0, z: 0, ang: 3.5, r: 6.4 },
  hollow: { x: 0, z: 0, ang: 4.4, r: 6.1 },
  nest: { x: 0, z: 0, ang: 3.45, r: ELDER.outer + 9.4 },
  crown: { x: 0, z: 0, ang: 0.2, r: 3.6 },
};

let gnd = 8.2;
let bellStep: number[] = [];
let knotStep: number[] = [];
let bellsDone = false;
let knotsDone = false;

export function setElderGnd(y: number) {
  gnd = y;
}

export function elderGnd() {
  return gnd;
}

export function extraY(y = live.y) {
  return y - gnd;
}

export function resetElder() {
  bellStep = [];
  knotStep = [];
  bellsDone = false;
  knotsDone = false;
}

export function bellsOpen() {
  return bellsDone;
}

export function knotsOpen() {
  return knotsDone;
}

export function bellProgress() {
  return bellStep.slice();
}

export function knotProgress() {
  return knotStep.slice();
}

export function inElder(x: number, z: number, pad = 0) {
  return Math.hypot(x - ET.x, z - ET.z) < ELDER.outer + 10 + pad;
}

export function elderRad(x: number, z: number) {
  return Math.hypot(x - ET.x, z - ET.z);
}

export function elderAng(x: number, z: number) {
  return Math.atan2(x - ET.x, z - ET.z);
}

export function angDiff(a: number, b: number) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function offsetAt(yaw: number, r: number) {
  return { x: ET.x + Math.sin(yaw) * r, z: ET.z + Math.cos(yaw) * r };
}

export function bellAt(i: number) {
  const b = BELLS[i]!;
  return offsetAt(b.yaw, 5.6);
}

export function knotAt(i: number) {
  const b = BELLS[i]!;
  return offsetAt(b.yaw, 5.4);
}

export function chestAt(kind: keyof typeof CHESTS) {
  const c = CHESTS[kind];
  return offsetAt(c.ang, c.r);
}

function onDonut(r: number, floor: ElderFloorId) {
  if (floor === "roots" || floor === "canopy") return r < ELDER.inner - 0.15;
  return r < ELDER.inner - 0.15 && r > ELDER.shaft;
}

function onBranchStrip(x: number, z: number, b: (typeof BRANCHES)[number]) {
  const dx = x - ET.x;
  const dz = z - ET.z;
  const fx = Math.sin(b.yaw);
  const fz = Math.cos(b.yaw);
  const along = dx * fx + dz * fz;
  const side = -dx * fz + dz * fx;
  const start = ELDER.outer - 1.6;
  return along > start && along < start + b.len && Math.abs(side) < b.w;
}

export function elderLiftAt(x: number, z: number, y: number, terrain: number): number {
  const r = elderRad(x, z);
  if (r > ELDER.outer + 20) return 0;
  const extra = y - terrain;
  let lift = 0;
  for (const id of FLOOR_ORDER) {
    if (!onDonut(r, id)) continue;
    const h = FLOORS[id];
    if (extra + 0.55 >= h) lift = Math.max(lift, h);
  }
  for (const b of BRANCHES) {
    if (!onBranchStrip(x, z, b)) continue;
    if (extra + 0.7 >= b.y) lift = Math.max(lift, b.y);
  }
  return lift;
}

export function elderLift(x: number, z: number, y: number, terrain: number) {
  return elderLiftAt(x, z, y, terrain);
}

export function wallOpenAt(x: number, z: number, extra: number) {
  const ang = elderAng(x, z);
  if (extra < 7.2 && Math.abs(angDiff(ang, ELDER.doorYaw)) < ELDER.doorHalf) return true;
  for (const w of WINDOWS) {
    if (extra >= w.y0 - 0.55 && extra <= w.y1 + 0.45 && Math.abs(angDiff(ang, w.yaw)) < w.half) return true;
  }
  return false;
}

export function collideElderAt(nx: number, nz: number, extra: number): { x: number; z: number } | null {
  const r = Math.hypot(nx - ET.x, nz - ET.z);
  if (r > ELDER.outer + 4 && r > 22) return null;
  let x = nx;
  let z = nz;
  let hit = false;

  const inner = ELDER.inner;
  const outer = ELDER.outer;
  const inWall = r > inner - 0.28 && r < outer + 0.55;
  if (inWall && extra > -0.4 && extra < ELDER.trunkH + 4 && !wallOpenAt(nx, nz, extra)) {
    const ang = elderAng(nx, nz);
    const toIn = Math.abs(r - (inner - 0.35));
    const toOut = Math.abs(r - (outer + 0.58));
    const nr = toIn < toOut ? inner - 0.35 : outer + 0.58;
    x = ET.x + Math.sin(ang) * nr;
    z = ET.z + Math.cos(ang) * nr;
    hit = true;
  }

  for (const root of ROOT_HITS) {
    const px = ET.x + root.x;
    const pz = ET.z + root.z;
    const dx = x - px;
    const dz = z - pz;
    const d2 = dx * dx + dz * dz;
    const rr = root.rad * root.rad;
    if (d2 < rr && d2 > 1e-6 && extra < 3.4) {
      const d = Math.sqrt(d2);
      x = px + (dx / d) * root.rad;
      z = pz + (dz / d) * root.rad;
      hit = true;
    }
  }
  return hit ? { x, z } : null;
}

export function collideElder(nx: number, nz: number) {
  if (live.house || live.below) return null;
  return collideElderAt(nx, nz, extraY());
}

/** Thick roots you walk around — the door sector stays clear. */
const ROOT_HITS: { x: number; z: number; rad: number }[] = [
  { x: -9.4, z: 8.2, rad: 1.55 },
  { x: 10.2, z: 6.4, rad: 1.45 },
  { x: -7.2, z: -11.4, rad: 1.5 },
  { x: 6.8, z: -10.6, rad: 1.35 },
  { x: -12.6, z: -2.2, rad: 1.4 },
  { x: 12.4, z: 1.6, rad: 1.38 },
];

function rungToward(yaw: number, r: number, destR: number, h: number, id: string): Ladder {
  const at = offsetAt(yaw, r);
  const dest = offsetAt(yaw, destR);
  const face = yaw + Math.PI;
  return {
    id,
    x: at.x,
    z: at.z,
    yaw: face,
    h,
    half: 0.72,
    destX: dest.x,
    destZ: dest.z,
  };
}

export function elderLadders(): Ladder[] {
  const list: Ladder[] = [];
  const inDoor = ELDER.doorYaw;
  if (bellsDone) {
    list.push(rungToward(inDoor + Math.PI, 7.6, 6.4, FLOORS.hollow, "elder-hollow"));
  }
  if (knotsDone) {
    list.push(rungToward(inDoor + 1.15, 7.4, 6.2, FLOORS.trunk, "elder-trunk"));
  }
  list.push(rungToward(inDoor - 1.05, 7.2, 6.1, FLOORS.loft, "elder-loft"));
  list.push(rungToward(inDoor + Math.PI * 0.55, 7.0, 5.8, FLOORS.branch, "elder-branch"));
  const vine = offsetAt(1.92, ELDER.outer + 2.2);
  const vineTop = offsetAt(1.92, 4.4);
  list.push({
    id: "elder-canopy",
    x: vine.x,
    z: vine.z,
    yaw: 1.92 + Math.PI,
    h: FLOORS.canopy,
    half: 0.78,
    destX: vineTop.x,
    destZ: vineTop.z,
  });
  return list;
}

export function strikeBell(i: number): "ok" | "done" | "reset" | "have" {
  if (bellsDone) return "have";
  const expect = BELL_ORDER[bellStep.length];
  if (expect !== i) {
    bellStep = [];
    return "reset";
  }
  bellStep.push(i);
  if (bellStep.length >= BELL_ORDER.length) {
    bellsDone = true;
    return "done";
  }
  return "ok";
}

export function pushKnot(i: number): "ok" | "done" | "reset" | "have" {
  if (knotsDone) return "have";
  if (knotStep[knotStep.length - 1] === i) return "ok";
  const expect = KNOT_ORDER[knotStep.length];
  if (expect !== i) {
    knotStep = [];
    return "reset";
  }
  knotStep.push(i);
  if (knotStep.length >= KNOT_ORDER.length) {
    knotsDone = true;
    return "done";
  }
  return "ok";
}

export function elderFloorName(extra: number): ElderFloorId | null {
  if (extra < 4) return extra > -0.2 && extra < 8 ? "roots" : null;
  let best: ElderFloorId = "roots";
  let bestD = 99;
  for (const id of FLOOR_ORDER) {
    const d = Math.abs(extra - FLOORS[id]);
    if (d < bestD) {
      bestD = d;
      best = id;
    }
  }
  return bestD < 7 ? best : null;
}
