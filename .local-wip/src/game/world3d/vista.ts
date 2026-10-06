/** Distant places you can see, then actually walk to. Not fake hills. */
import { live } from "./live";
import { heightAt, fieldHeight, TREE_HOME, TREE_HOUSE_H } from "./field";
import { useGame } from "../store";
import { RV, POND_ISLE, SOUTH_RUIN } from "./lands";

export type VistaId = "isle" | "pond" | "ridge" | "cliff";

export const VISTA: Record<
  VistaId,
  { x: number; z: number; hw: number; hd: number; door: number; yaw: number }
> = {
  /** Timber hut on Silverrun’s first island — chimney smoke from the vale. */
  isle: { x: RV.isle.x, z: RV.isle.z, hw: 2.18, hd: 2.02, door: 0.74, yaw: 0 },
  /** Stilt shack in the far pond. You see it across the water. */
  pond: { x: POND_ISLE.x, z: POND_ISLE.z, hw: 2.08, hd: 1.92, door: 0.7, yaw: 0 },
  /** Stone ruin on the south ridge. Visible from the treehouse ladder. */
  ridge: { x: SOUTH_RUIN.x, z: SOUTH_RUIN.z, hw: 2.48, hd: 2.22, door: 0.82, yaw: 0 },
  /** Dark mouth on Stoneback’s south face. The lookout sees the hole. */
  cliff: { x: 54, z: 404, hw: 2.15, hd: 2.85, door: 0.98, yaw: Math.PI },
};

export function smallVista(id: string | null): boolean {
  return (
    id === "isle" ||
    id === "pond" ||
    id === "ridge" ||
    id === "cliff" ||
    id === "yours" ||
    id === "watch" ||
    id === "light" ||
    id === "canopy" ||
    id === "fall" ||
    id === "lily" ||
    id === "herm"
  );
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
  if (d < 1e-4) {
    const nx = Math.abs(dz) >= Math.abs(dx) ? 0 : dz > 0 ? 1 : -1;
    const nz = nx === 0 ? (dx > 0 ? -1 : 1) : 0;
    return { x: px + nx * rad, z: pz + nz * rad };
  }
  return { x: px + (ox / d) * rad, z: pz + (oz / d) * rad };
}

function wallsFor(id: VistaId) {
  const v = VISTA[id];
  const c = Math.cos(v.yaw);
  const s = Math.sin(v.yaw);
  const corner = (lx: number, lz: number) => ({
    x: v.x + lx * c - lz * s,
    z: v.z + lx * s + lz * c,
  });
  const n = corner(-v.hw, -v.hd);
  const e = corner(v.hw, -v.hd);
  const sC = corner(v.hw, v.hd);
  const w = corner(-v.hw, v.hd);
  const doorL = corner(-v.door, v.hd);
  const doorR = corner(v.door, v.hd);
  const doorOut = id === "cliff";
  return { n, e, s: sC, w, doorL, doorR, doorOut, v };
}

export function collideVista(nx: number, nz: number): { x: number; z: number } | null {
  let x = nx;
  let z = nz;
  let hit = false;
  const apply = (p: { x: number; z: number } | null) => {
    if (!p) return;
    x = p.x;
    z = p.z;
    hit = true;
  };
  const thick = 0.42;
  for (const id of Object.keys(VISTA) as VistaId[]) {
    const w = wallsFor(id);
    const inside = live.house === id;
    apply(pushSeg(x, z, w.n.x, w.n.z, w.e.x, w.e.z, thick));
    apply(pushSeg(x, z, w.e.x, w.e.z, w.s.x, w.s.z, thick));
    apply(pushSeg(x, z, w.w.x, w.w.z, w.n.x, w.n.z, thick));
    if (inside || !w.doorOut) {
      apply(pushSeg(x, z, w.w.x, w.w.z, w.doorL.x, w.doorL.z, thick));
      apply(pushSeg(x, z, w.doorR.x, w.doorR.z, w.s.x, w.s.z, thick));
    } else {
      apply(pushSeg(x, z, w.w.x, w.w.z, w.s.x, w.s.z, thick));
    }
  }
  return hit ? { x, z } : null;
}

export function vistaFloor(): number | null {
  const id = live.house;
  if (id === "yours") return fieldHeight(TREE_HOME.x, TREE_HOME.z) + TREE_HOUSE_H + 0.04;
  if (id !== "isle" && id !== "pond" && id !== "ridge" && id !== "cliff") return null;
  const v = VISTA[id];
  return heightAt(v.x, v.z) + (id === "cliff" ? 0.55 : 0.08);
}

function inBox(id: VistaId, x: number, z: number, pad = 0) {
  const v = VISTA[id];
  const c = Math.cos(-v.yaw);
  const s = Math.sin(-v.yaw);
  const dx = x - v.x;
  const dz = z - v.z;
  const lx = dx * c - dz * s;
  const lz = dx * s + dz * c;
  return Math.abs(lx) < v.hw - pad && Math.abs(lz) < v.hd - pad;
}

function inDoor(id: VistaId, x: number, z: number) {
  const v = VISTA[id];
  const c = Math.cos(-v.yaw);
  const s = Math.sin(-v.yaw);
  const dx = x - v.x;
  const dz = z - v.z;
  const lx = dx * c - dz * s;
  const lz = dx * s + dz * c;
  const front = id === "cliff" ? lz < -v.hd + 0.85 && lz > -v.hd - 1.1 : lz > v.hd - 0.7 && lz < v.hd + 1.15;
  return Math.abs(lx) < v.door + 0.12 && front;
}

export function stepVista() {
  if (live.below || live.dungeon) return;
  if (live.house && live.house !== "isle" && live.house !== "pond" && live.house !== "ridge" && live.house !== "cliff")
    return;
  for (const id of Object.keys(VISTA) as VistaId[]) {
    if (inBox(id, live.x, live.z, 0.15)) {
      if (live.house !== id) {
        live.house = id;
        live.houseY = heightAt(VISTA[id].x, VISTA[id].z);
      }
      return;
    }
  }
  if (live.house === "isle" || live.house === "pond" || live.house === "ridge" || live.house === "cliff") {
    const id = live.house;
    if (inDoor(id, live.x, live.z)) return;
    live.house = null;
    live.houseY = 0;
  }
}

export function markVista(id: VistaId) {
  const g = useGame.getState();
  const key = `vista-${id}`;
  if ((g.quests?.[key] ?? 0) >= 1) return false;
  g.setQuest(key, 1);
  return true;
}

export function vistaSeen(id: VistaId) {
  return (useGame.getState().quests?.[`vista-${id}`] ?? 0) >= 1;
}
