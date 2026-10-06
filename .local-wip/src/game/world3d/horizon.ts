/** Places you can see from Oakstead, then actually walk to later. Not painted hills. */
import { live } from "./live";
import { fieldHeight, KEEP_OUT } from "./field";
import { FW, LANDS } from "./lands";
import type { Ladder } from "./climb";

export type HorizonId = "watch" | "light" | "canopy" | "fall" | "palace" | "crown" | "fen" | "zig";

export const HZ = {
  /** Castle on the north hill. The lookout sees the flags. A gorge blocks the road. */
  watch: { x: KEEP_OUT.x, z: KEEP_OUT.z, hw: 4.4, hd: 3.6, door: 1.05, yaw: 0 },
  gorge: { x: KEEP_OUT.x, z: KEEP_OUT.z - 38 },
  log: { x: KEEP_OUT.x - 28, z: KEEP_OUT.z - 52 },
  /** Lighthouse past Silverrun’s mouth. Smoke of the lamp from the east bank. */
  light: { x: 1188, z: 86, hw: 1.85, hd: 1.85, door: 0.7, yaw: -0.4 },
  /** Hut in Whisperwood’s owl tree. You see the roof from the woods gate. */
  canopy: { x: FW.owl.x, z: FW.owl.z, hw: 1.72, hd: 1.58, door: 0.62, yaw: 0.2 },
  /** Waterfall glen west of the lookout, behind the elder hill. */
  fall: { x: -168, z: 72, hw: 1.95, hd: 1.72, door: 0.68, yaw: 0.15 },
  cave: { x: -142, z: 28 },
  /** Goldwaste mesa palace — a gold tooth on the southeast sky. */
  palace: { x: LANDS.desert.x + 40, z: LANDS.desert.z - 20 },
  /** Ice spire on White Crown. */
  crown: { x: LANDS.snow.x, z: LANDS.snow.z },
  /** Lantern house in Mirefen. */
  fen: { x: LANDS.swamp.x - 22, z: LANDS.swamp.z + 16 },
  /** Broken ziggurat of Old Numer. */
  zig: { x: LANDS.ruins.x, z: LANDS.ruins.z - 18 },
};

export function logBridged() {
  return Boolean(live.smashed["watch-log"]);
}

export function mesaOpen() {
  return Boolean(live.smashed["mesa-stair"]);
}

export function glenOpen() {
  return Boolean(live.smashed["glen-cave"]);
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

function pushBox(x: number, z: number, cx: number, cz: number, hx: number, hz: number) {
  const dx = x - cx;
  const dz = z - cz;
  if (Math.abs(dx) > hx || Math.abs(dz) > hz) return null;
  const px = hx - Math.abs(dx);
  const pz = hz - Math.abs(dz);
  if (px < pz) return { x: cx + Math.sign(dx || 1) * hx, z };
  return { x, z: cz + Math.sign(dz || 1) * hz };
}

export function collideHorizon(nx: number, nz: number): { x: number; z: number } | null {
  let x = nx;
  let z = nz;
  let hit = false;
  const apply = (p: { x: number; z: number } | null) => {
    if (!p) return;
    x = p.x;
    z = p.z;
    hit = true;
  };

  const g = HZ.gorge;
  if (!logBridged()) {
    apply(pushSeg(x, z, g.x - 42, g.z, g.x + 42, g.z, 4.2));
  } else {
    apply(pushSeg(x, z, g.x - 42, g.z, g.x - 4.2, g.z, 3.4));
    apply(pushSeg(x, z, g.x + 4.2, g.z, g.x + 42, g.z, 3.4));
  }

  if (!mesaOpen()) {
    apply(pushBox(x, z, HZ.palace.x, HZ.palace.z + 8.4, 11, 2.4));
  }

  if (!glenOpen()) {
    apply(pushBox(x, z, HZ.cave.x, HZ.cave.z, 1.35, 0.55));
  }

  return hit ? { x, z } : null;
}

export function horizonFloor(): number | null {
  const id = live.house;
  if (id === "watch") return fieldHeight(HZ.watch.x, HZ.watch.z) + 0.12;
  if (id === "light") return fieldHeight(HZ.light.x, HZ.light.z) + 0.1;
  if (id === "canopy") return fieldHeight(HZ.canopy.x, HZ.canopy.z) + 9.15;
  if (id === "fall") return fieldHeight(HZ.fall.x, HZ.fall.z) + 0.08;
  if (logBridged()) {
    const g = HZ.gorge;
    if (Math.abs(live.x - g.x) < 3.6 && Math.abs(live.z - g.z) < 5.2) {
      const a = fieldHeight(g.x, g.z - 8);
      const b = fieldHeight(g.x, g.z + 8);
      return Math.max(a, b) - 0.15;
    }
  }
  return null;
}

function inDoor(id: HorizonId, x: number, z: number) {
  const v = id === "watch" ? HZ.watch : id === "light" ? HZ.light : id === "canopy" ? HZ.canopy : HZ.fall;
  const dx = x - v.x;
  const dz = z - v.z;
  const c = Math.cos(-v.yaw);
  const s = Math.sin(-v.yaw);
  const lx = dx * c - dz * s;
  const lz = dx * s + dz * c;
  return Math.abs(lx) < v.door + 0.18 && lz > v.hd - 0.7 && lz < v.hd + 1.2;
}

function inBox(id: HorizonId, x: number, z: number, pad = 0) {
  const v = id === "watch" ? HZ.watch : id === "light" ? HZ.light : id === "canopy" ? HZ.canopy : HZ.fall;
  const dx = x - v.x;
  const dz = z - v.z;
  const c = Math.cos(-v.yaw);
  const s = Math.sin(-v.yaw);
  const lx = dx * c - dz * s;
  const lz = dx * s + dz * c;
  return Math.abs(lx) < v.hw - pad && Math.abs(lz) < v.hd - pad;
}

export function stepHorizon() {
  if (live.below || live.dungeon) return;
  const cur = live.house;
  if (cur && cur !== "watch" && cur !== "light" && cur !== "canopy" && cur !== "fall") return;
  for (const id of ["watch", "light", "canopy", "fall"] as HorizonId[]) {
    if (id === "canopy" && live.y < fieldHeight(HZ.canopy.x, HZ.canopy.z) + 7.6) continue;
    if (inBox(id, live.x, live.z, 0.12)) {
      if (live.house !== id) {
        live.house = id;
        live.houseY = fieldHeight(
          id === "watch" ? HZ.watch.x : id === "light" ? HZ.light.x : id === "canopy" ? HZ.canopy.x : HZ.fall.x,
          id === "watch" ? HZ.watch.z : id === "light" ? HZ.light.z : id === "canopy" ? HZ.canopy.z : HZ.fall.z,
        );
      }
      return;
    }
  }
  if (cur === "watch" || cur === "light" || cur === "canopy" || cur === "fall") {
    if (inDoor(cur, live.x, live.z)) return;
    live.house = null;
    live.houseY = 0;
  }
}

export function horizonLadders(): Ladder[] {
  const c = HZ.canopy;
  return [
    {
      id: "canopy",
      x: c.x + 0.15,
      z: c.z + 1.85,
      yaw: 0,
      h: 9.4,
      half: 0.7,
      destX: c.x,
      destZ: c.z + 0.4,
    },
    {
      id: "watch-wall",
      x: HZ.watch.x + 5.1,
      z: HZ.watch.z + 1.2,
      yaw: Math.PI * 0.5,
      h: 6.2,
      half: 0.62,
    },
  ];
}

export function markHorizon(id: HorizonId) {
  const key = `vista-${id}`;
  if (live.smashed[key]) return false;
  live.smashed[key] = true;
  return true;
}
