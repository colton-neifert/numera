/** The Below — a second world under Numeria. Compressed map. Exits land on distant surface. */
import { live } from "./live";
import { heightAt, POND, WELL_AT, WILD_POND, MILL_AT, LOOK_AT } from "./field";
import { FW, MW, RV, QH, LANDS } from "./lands";
import { Q } from "./quiet";
import { useGame } from "../store";

export type UnderRegionId =
  | "well"
  | "glow"
  | "mill"
  | "count"
  | "black"
  | "root"
  | "quiet"
  | "ember"
  | "sink"
  | "bone";

export type UnderEnter = "walk" | "talk" | "dive";

export type UnderHole = {
  id: string;
  region: UnderRegionId;
  /** Surface mouth. */
  x: number;
  z: number;
  r: number;
  /** Spawn in the Below. */
  ux: number;
  uz: number;
  enter: UnderEnter;
  outX: number;
  outZ: number;
  listen: string;
  outListen: string;
  kind: "both" | "in" | "out";
};

export type UnderRoom = {
  id: UnderRegionId;
  name: string;
  sub: string;
  x: number;
  z: number;
  r: number;
  floor: string;
  glow: string;
};

export const UR: Record<UnderRegionId, UnderRoom> = {
  well: { id: "well", name: "Well Deep", sub: "Light from a bucket that never came this far.", x: 0, z: 0, r: 16.4, floor: "#2a2218", glow: "#c9a227" },
  glow: { id: "glow", name: "Glow Grotto", sub: "The pond keeps a second sky.", x: -48, z: 8, r: 15.2, floor: "#16322e", glow: "#3ec8a0" },
  mill: { id: "mill", name: "Mill Cellar", sub: "Gears that still turn for no grain.", x: 26, z: 8, r: 9.2, floor: "#3a2a18", glow: "#c47838" },
  count: { id: "count", name: "Count Below", sub: "Four marks. One scraped.", x: 2, z: 46, r: 13.4, floor: "#262018", glow: "#e8d48a" },
  black: { id: "black", name: "Blackwater", sub: "A river that never saw the sun.", x: 80, z: 4, r: 17.6, floor: "#141c24", glow: "#4aa0c8" },
  root: { id: "root", name: "Root Cathedral", sub: "The woods hold a roof of living wood.", x: -98, z: 12, r: 17.2, floor: "#1a2418", glow: "#6ad07a" },
  quiet: { id: "quiet", name: "Quiet Deep", sub: "They counted past three down here first.", x: -136, z: -8, r: 13.2, floor: "#1c241c", glow: "#c9a227" },
  ember: { id: "ember", name: "Ember Vein", sub: "The mountain’s first fire, still warm.", x: 8, z: 96, r: 15.4, floor: "#2a1810", glow: "#e07038" },
  sink: { id: "sink", name: "Sinkbowl", sub: "A pond that forgot which way was up.", x: 40, z: -54, r: 15.2, floor: "#241c14", glow: "#6a8a58" },
  bone: { id: "bone", name: "Bone Hall", sub: "Old Numer’s cellar. The count ran out.", x: 8, z: -98, r: 18.4, floor: "#2e2820", glow: "#d8c8a0" },
};

export const UNDER_ROOMS = Object.values(UR);

export const UNDER_TUNNELS: { a: UnderRegionId; b: UnderRegionId; w: number }[] = [
  { a: "well", b: "glow", w: 4.6 },
  { a: "well", b: "mill", w: 3.8 },
  { a: "well", b: "count", w: 4.4 },
  { a: "well", b: "black", w: 5.2 },
  { a: "glow", b: "root", w: 4.8 },
  { a: "root", b: "quiet", w: 4.2 },
  { a: "count", b: "ember", w: 4.6 },
  { a: "well", b: "sink", w: 4.8 },
  { a: "sink", b: "bone", w: 4.6 },
  { a: "black", b: "bone", w: 4.4 },
];

export const UNDER_HOLES: UnderHole[] = [
  {
    id: "well",
    region: "well",
    x: WELL_AT.x,
    z: WELL_AT.z + 1.35,
    r: 1.05,
    ux: UR.well.x,
    uz: UR.well.z + 5.4,
    enter: "talk",
    outX: WELL_AT.x + 1.55,
    outZ: WELL_AT.z + 0.4,
    listen: "The well goes farther than the bucket.",
    outListen: "A shaft of daylight. Oakstead is up there.",
    kind: "both",
  },
  {
    id: "pond",
    region: "glow",
    x: POND.x - 9.2,
    z: POND.z - 9.6,
    r: 1.35,
    ux: UR.glow.x + 4.2,
    uz: UR.glow.z + 6.4,
    enter: "walk",
    outX: POND.x - 10.4,
    outZ: POND.z - 11.2,
    listen: "A dark mouth in the bank. Cold air. Pond water dripping the other way.",
    outListen: "Daylight on water. The pond is above you.",
    kind: "both",
  },
  {
    id: "mill",
    region: "mill",
    x: MILL_AT.x + 0.2,
    z: MILL_AT.z - 4.4,
    r: 1.05,
    ux: UR.mill.x,
    uz: UR.mill.z + 3.6,
    enter: "talk",
    outX: MILL_AT.x,
    outZ: MILL_AT.z - 5.4,
    listen: "A hatch the mill pretends is a shadow.",
    outListen: "Grain dust. The mill floor is a lid.",
    kind: "both",
  },
  {
    id: "oak",
    region: "root",
    x: FW.oak.x - 3.4,
    z: FW.oak.z - 2.6,
    r: 1.28,
    ux: UR.root.x + 5.2,
    uz: UR.root.z + 6.8,
    enter: "walk",
    outX: FW.oak.x - 4.6,
    outZ: FW.oak.z - 3.4,
    listen: "A root hole. The oak kept a stair it does not show.",
    outListen: "Wood and birds. Whisperwood is the roof.",
    kind: "both",
  },
  {
    id: "falls",
    region: "black",
    x: RV.hole.x,
    z: RV.hole.z,
    r: 1.7,
    ux: UR.black.x + 5.4,
    uz: UR.black.z + 6.2,
    enter: "dive",
    outX: RV.pool.x - 6,
    outZ: RV.pool.z - 8,
    listen: "The pool is deeper than it looks. Something cold pulls.",
    outListen: "White water. Silverrun does not know you were under it.",
    kind: "both",
  },
  {
    id: "peak",
    region: "ember",
    x: MW.crack.x,
    z: MW.crack.z,
    r: 1.32,
    ux: UR.ember.x - 3.2,
    uz: UR.ember.z + 5.6,
    enter: "walk",
    outX: MW.crack.x + 1.8,
    outZ: MW.crack.z - 2.2,
    listen: "A warm crack. The mountain is hollow here.",
    outListen: "Stoneback’s wind. The peak is still counting.",
    kind: "both",
  },
  {
    id: "wild",
    region: "sink",
    x: WILD_POND.x,
    z: WILD_POND.z,
    r: 2.35,
    ux: UR.sink.x,
    uz: UR.sink.z + 5.2,
    enter: "dive",
    outX: WILD_POND.x + 8.4,
    outZ: WILD_POND.z + 10.2,
    listen: "The wild pond has no bottom in the middle.",
    outListen: "Mud and sky. The wild pond lets you go.",
    kind: "both",
  },
  {
    id: "ruin",
    region: "bone",
    x: LANDS.ruins.x + 10,
    z: LANDS.ruins.z + 16,
    r: 1.45,
    ux: UR.bone.x,
    uz: UR.bone.z + 8.2,
    enter: "walk",
    outX: LANDS.ruins.x + 12,
    outZ: LANDS.ruins.z + 20,
    listen: "Stairs that go into Old Numer, not up it.",
    outListen: "South stones. The count on the surface is the same one.",
    kind: "both",
  },
  {
    id: "hollow",
    region: "quiet",
    x: QH.x + 7.2,
    z: QH.z - 5.4,
    r: 1.22,
    ux: UR.quiet.x + 4.4,
    uz: UR.quiet.z + 5.2,
    enter: "walk",
    outX: QH.x + 8.4,
    outZ: QH.z - 7.2,
    listen: "A hole Quiet Hollow does not put on any map.",
    outListen: "Still air. They knew this road.",
    kind: "both",
  },
  {
    id: "count",
    region: "count",
    x: LOOK_AT.x + 18.4,
    z: LOOK_AT.z - 8.6,
    r: 1.18,
    ux: UR.count.x,
    uz: UR.count.z + 5.6,
    enter: "talk",
    outX: LOOK_AT.x + 20,
    outZ: LOOK_AT.z - 10,
    listen: "A scraped stone. The hole under it is the same shape.",
    outListen: "The lookout. The vale was standing on this.",
    kind: "both",
  },
];

/** One-way cracks that dump you far from where you went in. */
export const UNDER_SHORTS: UnderHole[] = [
  {
    id: "bone-south",
    region: "bone",
    x: Q.mosaic.x,
    z: Q.mosaic.z + 8,
    r: 1.1,
    ux: UR.bone.x - 2,
    uz: UR.bone.z - 14.4,
    enter: "walk",
    outX: Q.mosaic.x,
    outZ: Q.mosaic.z + 8,
    listen: "",
    outListen: "A crack. Daylight that smells like south stones.",
    kind: "out",
  },
  {
    id: "quiet-wood",
    region: "quiet",
    x: FW.pool.x + 4,
    z: FW.pool.z,
    r: 1.1,
    ux: UR.quiet.x - 9.4,
    uz: UR.quiet.z,
    enter: "walk",
    outX: FW.pool.x + 4,
    outZ: FW.pool.z + 2,
    listen: "",
    outListen: "A root hole. The woods are dripping on the other side.",
    kind: "out",
  },
  {
    id: "ember-ridge",
    region: "ember",
    x: MW.eastledge.x,
    z: MW.eastledge.z,
    r: 1.1,
    ux: UR.ember.x + 11.2,
    uz: UR.ember.z + 5.4,
    enter: "walk",
    outX: MW.eastledge.x,
    outZ: MW.eastledge.z + 2,
    listen: "",
    outListen: "Warm air. The mountain’s other face.",
    kind: "out",
  },
  {
    id: "black-ford",
    region: "black",
    x: RV.ford.x,
    z: RV.ford.z - 8,
    r: 1.1,
    ux: UR.black.x + 12.4,
    uz: UR.black.z - 8.2,
    enter: "walk",
    outX: RV.ford.x,
    outZ: RV.ford.z - 10,
    listen: "",
    outListen: "The river’s voice. A ford, not the falls.",
    kind: "out",
  },
  {
    id: "glow-yard",
    region: "glow",
    x: -28,
    z: -154,
    r: 1.1,
    ux: UR.glow.x - 10.6,
    uz: UR.glow.z - 6.4,
    enter: "walk",
    outX: -28,
    outZ: -154,
    listen: "",
    outListen: "Home hill. The treehouse lamp is a star from here.",
    kind: "out",
  },
];

const TUNNEL_W = 4.8;

function capDist(x: number, z: number, ax: number, az: number, bx: number, bz: number) {
  const dx = bx - ax;
  const dz = bz - az;
  const len2 = dx * dx + dz * dz || 1;
  let t = ((x - ax) * dx + (z - az) * dz) / len2;
  t = Math.max(0, Math.min(1, t));
  const px = ax + dx * t;
  const pz = az + dz * t;
  return { d: Math.hypot(x - px, z - pz), t, px, pz };
}

export function underWalk(x: number, z: number) {
  for (const r of UNDER_ROOMS) {
    if (Math.hypot(x - r.x, z - r.z) < r.r - 0.35) return true;
  }
  for (const t of UNDER_TUNNELS) {
    const a = UR[t.a];
    const b = UR[t.b];
    const hit = capDist(x, z, a.x, a.z, b.x, b.z);
    if (hit.d < t.w) return true;
  }
  return false;
}

export function nearestWalk(x: number, z: number) {
  let best = { x: UR.well.x, z: UR.well.z, d: 1e9 };
  for (const r of UNDER_ROOMS) {
    const d = Math.hypot(x - r.x, z - r.z);
    const rad = r.r - 0.55;
    const nx = d < 1e-4 ? r.x : r.x + ((x - r.x) / d) * Math.min(d, rad);
    const nz = d < 1e-4 ? r.z : r.z + ((z - r.z) / d) * Math.min(d, rad);
    const nd = Math.hypot(x - nx, z - nz);
    if (nd < best.d) best = { x: nx, z: nz, d: nd };
  }
  for (const t of UNDER_TUNNELS) {
    const a = UR[t.a];
    const b = UR[t.b];
    const hit = capDist(x, z, a.x, a.z, b.x, b.z);
    const half = t.w - 0.25;
    let nx = hit.px;
    let nz = hit.pz;
    if (hit.d > 1e-4 && hit.d > half) {
      nx = hit.px + ((x - hit.px) / hit.d) * half;
      nz = hit.pz + ((z - hit.pz) / hit.d) * half;
    }
    const nd = Math.hypot(x - nx, z - nz);
    if (nd < best.d) best = { x: nx, z: nz, d: nd };
  }
  return best;
}

export function collideUnder(nx: number, nz: number) {
  if (underWalk(nx, nz)) return { x: nx, z: nz };
  const p = nearestWalk(nx, nz);
  return { x: p.x, z: p.z };
}

function bowl(x: number, z: number, cx: number, cz: number, r: number) {
  const d = Math.hypot(x - cx, z - cz);
  if (d >= r) return 0;
  const u = 1 - d / r;
  return u * u * (3 - 2 * u);
}

export function riverU(x: number, z: number) {
  const a = UR.glow;
  const b = UR.well;
  const c = UR.black;
  const ab = capDist(x, z, a.x + 6, a.z - 2, b.x + 4, b.z - 3.2);
  const bc = capDist(x, z, b.x + 4, b.z - 3.2, c.x - 2, c.z - 1.4);
  const d = Math.min(ab.d, bc.d);
  const w = 3.35;
  if (d >= w) return 0;
  return (1 - d / w) * (1 - d / w);
}

export function onBridge(x: number, z: number) {
  const bx = UR.black.x - 3.2;
  const bz = UR.black.z + 0.4;
  return Math.abs(x - bx) < 1.15 && Math.abs(z - bz) < 4.4;
}

export function underHeight(x: number, z: number) {
  let y = 1.18;
  y -= bowl(x, z, UR.glow.x, UR.glow.z, UR.glow.r) * 0.72;
  y -= bowl(x, z, UR.sink.x, UR.sink.z, UR.sink.r) * 0.85;
  y += bowl(x, z, UR.ember.x, UR.ember.z, UR.ember.r) * 0.55;
  y += bowl(x, z, UR.bone.x, UR.bone.z, UR.bone.r) * 0.22;
  y += bowl(x, z, UR.count.x, UR.count.z, UR.count.r) * 0.12;
  y -= bowl(x, z, UR.well.x, UR.well.z, UR.well.r) * 0.16;
  y -= riverU(x, z) * 1.05;
  if (onBridge(x, z)) y = 2.35;
  const mill = bowl(x, z, UR.mill.x, UR.mill.z, UR.mill.r);
  y += mill * 0.18;
  return y;
}

export function underWet(x: number, z: number) {
  if (onBridge(x, z)) return 0;
  const river = riverU(x, z);
  const glow = bowl(x, z, UR.glow.x, UR.glow.z, 7.4);
  const sink = bowl(x, z, UR.sink.x, UR.sink.z, 8.2);
  return Math.max(river, glow * 0.92, sink * 0.78);
}

export function underRegionAt(x: number, z: number): UnderRegionId | null {
  let best: { id: UnderRegionId; d: number } | null = null;
  for (const r of UNDER_ROOMS) {
    const d = Math.hypot(x - r.x, z - r.z);
    if (d < r.r + 2 && (!best || d < best.d)) best = { id: r.id, d };
  }
  return best?.id ?? null;
}

export function surfaceHoleAt(x: number, z: number) {
  let best: { hole: UnderHole; d: number } | null = null;
  for (const h of UNDER_HOLES) {
    if (h.kind === "out") continue;
    const d = Math.hypot(x - h.x, z - h.z);
    if (d < h.r + 0.55 && (!best || d < best.d)) best = { hole: h, d };
  }
  return best;
}

export function underExitAt(x: number, z: number) {
  let best: { hole: UnderHole; d: number } | null = null;
  const all = [...UNDER_HOLES, ...UNDER_SHORTS];
  for (const h of all) {
    if (h.kind === "in") continue;
    const d = Math.hypot(x - h.ux, z - h.uz);
    if (d < 2.15 && (!best || d < best.d)) best = { hole: h, d };
  }
  return best;
}

export function enterBelow(hole: UnderHole) {
  live.below = true;
  live.cave = true;
  live.house = null;
  live.mounted = false;
  live.climbing = null;
  live.swim = false;
  const room = UR[hole.region];
  live.x = room.x;
  live.z = room.z;
  live.y = underHeight(room.x, room.z) + 0.28;
  live.speed = 0;
  live.underAt = hole.region;
  const g = useGame.getState();
  if ((g.quests?.qBelow ?? 0) < 1) g.setQuest("qBelow", 1);
}

export function leaveBelow(hole: UnderHole) {
  live.below = false;
  live.cave = false;
  live.underAt = "";
  live.climbing = null;
  live.x = hole.outX;
  live.z = hole.outZ;
  live.y = heightAt(hole.outX, hole.outZ) + 0.28;
  live.speed = 0;
  live.swim = false;
}

export function clearBelow() {
  live.below = false;
  live.underAt = "";
  if (!live.house) live.cave = false;
}

export function underFishId(x: number, z: number) {
  if (!live.below) return null;
  const w = underWet(x, z);
  if (w < 0.18 || w > 0.62) return null;
  const r = underRegionAt(x, z);
  if (r === "glow") return "glow";
  if (r === "black" || r === "well" || r === "sink") return "black";
  return null;
}

export { TUNNEL_W };
