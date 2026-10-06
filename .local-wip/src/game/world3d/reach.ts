/** Places you can see from the treehouse deck, then actually walk to. */
import { live } from "./live";
import { fieldHeight, heightAt, POND, MILL_AT, LOOK_AT, KEEP_OUT, TREE_HOME, TREE_HOUSE_H, TREE_HD, TREE_DECK_D } from "./field";
import { ET } from "./lands";
import type { Ladder } from "./climb";

export type ReachId = "lily" | "herm";

/** Stilt hut on Oakstead’s pond. The deck looks right at the chimney. */
export const LILY = {
  x: POND.x - 1.15,
  z: POND.z + 0.35,
  hw: 1.72,
  hd: 1.55,
  door: 0.58,
  yaw: -Math.PI / 2,
};

/** Goat cottage on Elderfour, facing town. */
export const HERM = {
  x: ET.x + 10.4,
  z: ET.z - 14.2,
  hw: 1.88,
  hd: 1.7,
  door: 0.64,
  yaw: -2.05,
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Hopping stones from the east dock to the pond hut. */
export const STONES: { x: number; z: number }[] = (() => {
  const sx = POND.x + POND.r * 0.9;
  const sz = POND.z + 1.55;
  const ex = LILY.x + 2.15;
  const ez = LILY.z + 0.15;
  return [0.16, 0.32, 0.48, 0.64, 0.8].map((t, i) => ({
    x: lerp(sx, ex, t) + Math.sin(i * 1.7) * 0.28,
    z: lerp(sz, ez, t) + Math.cos(i * 1.3) * 0.22,
  }));
})();

export type PeekId = "mill" | "look" | "keep" | "watch" | "lily" | "fall" | "ridge" | "light";

export const PEEKS: { id: PeekId; x: number; z: number; h: number; line: string }[] = [
  { id: "lily", x: LILY.x, z: LILY.z, h: 4.2, line: "A chimney in the pond. Stones from the east dock." },
  { id: "mill", x: MILL_AT.x, z: MILL_AT.z, h: 8.4, line: "The mill wheel. The roof has a ladder on the south wall." },
  { id: "look", x: LOOK_AT.x, z: LOOK_AT.z, h: 12.2, line: "The lookout. A ladder, then the rest of the vale." },
  { id: "keep", x: 0, z: 96, h: 16, line: "Oakstead’s keep. The lawn is watching. The road is honest." },
  { id: "watch", x: KEEP_OUT.x, z: KEEP_OUT.z, h: 28, line: "Flags on a split hill. A gorge keeps the road. A pine is waiting." },
  { id: "fall", x: -168, z: 72, h: 14, line: "White water behind the west hill. The cave is sealed until you wake it." },
  { id: "ridge", x: 36, z: -236, h: 16, line: "A broken tooth on the south ridge. The ladder at home can see it." },
  { id: "light", x: 1188, z: 86, h: 22, line: "A white tooth on the river’s mouth. Walk the water until the lamp is a door." },
];

export function startPeek(id?: PeekId) {
  const i = id ? PEEKS.findIndex((p) => p.id === id) : live.peekI;
  const p = PEEKS[(i + PEEKS.length) % PEEKS.length]!;
  live.peekI = (i + 1) % PEEKS.length;
  live.peekT = 3.8;
  live.peekKind = p.id;
  const y = fieldHeight(p.x, p.z) + p.h;
  live.shotCam = {
    x: live.x - Math.sin(live.yaw) * 0.35,
    y: live.y + 1.58,
    z: live.z - Math.cos(live.yaw) * 0.35,
    lx: p.x,
    ly: y,
    lz: p.z,
  };
  live.listen = p.line;
}

export function stepPeek(dt: number) {
  if (live.peekT <= 0) return;
  live.peekT = Math.max(0, live.peekT - dt);
  if (live.peekT <= 0) {
    live.peekKind = null;
    live.shotCam = null;
  }
}

function pushSeg(
  x: number,
  z: number,
  ax: number,
  az: number,
  bx: number,
  bz: number,
  rad: number,
): { x: number; z: number } | null {
  const dx = bx - ax;
  const dz = bz - az;
  const len2 = dx * dx + dz * dz || 1;
  let t = ((x - ax) * dx + (z - az) * dz) / len2;
  t = Math.max(0, Math.min(1, t));
  const px = ax + dx * t;
  const pz = az + dz * t;
  const ox = x - px;
  const oz = z - pz;
  const d = Math.hypot(ox, oz);
  if (d >= rad) return null;
  if (d < 1e-4) return { x: px + rad, z: pz };
  return { x: px + (ox / d) * rad, z: pz + (oz / d) * rad };
}

function wallsFor(v: { x: number; z: number; hw: number; hd: number; door: number; yaw: number }) {
  const c = Math.cos(v.yaw);
  const s = Math.sin(v.yaw);
  const corner = (lx: number, lz: number) => ({
    x: v.x + lx * c - lz * s,
    z: v.z + lx * s + lz * c,
  });
  return {
    n: corner(-v.hw, -v.hd),
    e: corner(v.hw, -v.hd),
    s: corner(v.hw, v.hd),
    w: corner(-v.hw, v.hd),
    doorL: corner(-v.door, v.hd),
    doorR: corner(v.door, v.hd),
    v,
  };
}

function inBox(v: { x: number; z: number; hw: number; hd: number; yaw: number }, x: number, z: number, pad = 0) {
  const dx = x - v.x;
  const dz = z - v.z;
  const c = Math.cos(-v.yaw);
  const s = Math.sin(-v.yaw);
  const lx = dx * c - dz * s;
  const lz = dx * s + dz * c;
  return Math.abs(lx) < v.hw - pad && Math.abs(lz) < v.hd - pad;
}

function inDoor(v: { x: number; z: number; hw: number; hd: number; door: number; yaw: number }, x: number, z: number) {
  const dx = x - v.x;
  const dz = z - v.z;
  const c = Math.cos(-v.yaw);
  const s = Math.sin(-v.yaw);
  const lx = dx * c - dz * s;
  const lz = dx * s + dz * c;
  return Math.abs(lx) < v.door + 0.14 && lz > v.hd - 0.7 && lz < v.hd + 1.15;
}

export function collideReach(nx: number, nz: number): { x: number; z: number } | null {
  let x = nx;
  let z = nz;
  let hit = false;
  const apply = (p: { x: number; z: number } | null) => {
    if (!p) return;
    x = p.x;
    z = p.z;
    hit = true;
  };
  for (const v of [LILY, HERM]) {
    const w = wallsFor(v);
    const thick = 0.4;
    apply(pushSeg(x, z, w.n.x, w.n.z, w.e.x, w.e.z, thick));
    apply(pushSeg(x, z, w.e.x, w.e.z, w.s.x, w.s.z, thick));
    apply(pushSeg(x, z, w.w.x, w.w.z, w.n.x, w.n.z, thick));
    apply(pushSeg(x, z, w.w.x, w.w.z, w.doorL.x, w.doorL.z, thick));
    apply(pushSeg(x, z, w.doorR.x, w.doorR.z, w.s.x, w.s.z, thick));
  }
  return hit ? { x, z } : null;
}

export function reachFloor(): number | null {
  const id = live.house;
  if (id === "lily") return fieldHeight(LILY.x, LILY.z) + 0.12;
  if (id === "herm") return fieldHeight(HERM.x, HERM.z) + 0.1;
  for (const s of STONES) {
    if (Math.hypot(live.x - s.x, live.z - s.z) < 0.58) return fieldHeight(s.x, s.z) + 0.42;
  }
  if (Math.hypot(live.x - LILY.x, live.z - LILY.z) < 2.15 && live.house !== "lily") {
    return fieldHeight(LILY.x, LILY.z) + 0.08;
  }
  return null;
}

export function reachDry(x = live.x, z = live.z) {
  if (live.house === "lily" || live.house === "herm") return true;
  if (Math.hypot(x - LILY.x, z - LILY.z) < 2.2) return true;
  for (const s of STONES) {
    if (Math.hypot(x - s.x, z - s.z) < 0.62) return true;
  }
  return false;
}

export function stepReach() {
  if (live.below || live.dungeon) return;
  const cur = live.house;
  if (cur && cur !== "lily" && cur !== "herm") return;
  if (inBox(LILY, live.x, live.z, 0.12)) {
    if (live.house !== "lily") {
      live.house = "lily";
      live.houseY = fieldHeight(LILY.x, LILY.z);
    }
    return;
  }
  if (inBox(HERM, live.x, live.z, 0.12)) {
    if (live.house !== "herm") {
      live.house = "herm";
      live.houseY = fieldHeight(HERM.x, HERM.z);
    }
    return;
  }
  if (cur === "lily" || cur === "herm") {
    const v = cur === "lily" ? LILY : HERM;
    if (inDoor(v, live.x, live.z)) return;
    live.house = null;
    live.houseY = 0;
  }
}

export function reachLadders(): Ladder[] {
  return [
    {
      id: "millloft",
      x: MILL_AT.x - 0.15,
      z: MILL_AT.z + 3.15,
      yaw: 0,
      h: 4.35,
      half: 0.7,
      destX: MILL_AT.x,
      destZ: MILL_AT.z + 0.2,
    },
    {
      id: "hermit",
      x: HERM.x + 0.35,
      z: HERM.z + 2.35,
      yaw: 0,
      h: 3.15,
      half: 0.62,
      destX: HERM.x,
      destZ: HERM.z + 0.4,
    },
  ];
}

export function onHomeDeck() {
  const plat = heightAt(TREE_HOME.x, TREE_HOME.z) + TREE_HOUSE_H;
  const dz = TREE_HOME.z + TREE_HD + TREE_DECK_D * 0.5;
  return live.y > plat - 0.5 && Math.hypot(live.x - TREE_HOME.x, live.z - dz) < 4.6;
}
