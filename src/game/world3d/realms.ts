import { live } from "./live";

/** A cave is not "Oakstead, but lower." It is another world that you walk into. */
export const MOUTH = { x: -86, z: -16 };
export const CAVE_AT = { x: 2400, z: 2400 };

export function onSurface() {
  return !live.realm || live.realm === "surface";
}

export function beginRealm(realm: string, name: string, x: number, z: number, yaw: number) {
  if (live.realmWarp || live.roomWarp) return;
  live.realmWarp = { t: 0, phase: "out", x, z, yaw, realm, name };
}

export function watchRealm() {
  if (live.realmWarp || live.roomWarp || live.house) return;
  if (onSurface()) {
    const inside = Math.abs(live.x - MOUTH.x) < 1.7 && live.z < MOUTH.z - 9.2 && live.z > MOUTH.z - 13;
    if (inside) beginRealm("oldroot", "Oldroot Cave", CAVE_AT.x, CAVE_AT.z + 4, 0);
    return;
  }
  if (live.realm === "oldroot") {
    const leaving = Math.abs(live.x - CAVE_AT.x) < 1.8 && live.z < CAVE_AT.z - 9.4;
    if (leaving) beginRealm("surface", "", MOUTH.x, MOUTH.z + 3.5, Math.PI);
  }
}

export function collideMouth(nx: number, nz: number) {
  if (!onSurface()) return null;
  const dx = nx - MOUTH.x;
  const dz = nz - MOUTH.z;
  if (dz > 2 || dz < -12.5 || Math.abs(dx) > 6) return null;
  if (Math.abs(dx) < 1.7 && dz < 0.4) return null;
  if (dz < 0.6 && Math.abs(dx) < 5.2) return { x: MOUTH.x + Math.sign(dx || 1) * 1.7, z: nz };
  if (Math.abs(dx) < 5 && dz < -11.6) return { x: nx, z: MOUTH.z - 11.4 };
  return null;
}

export function collideCave(nx: number, nz: number) {
  if (live.realm !== "oldroot") return null;
  const x0 = CAVE_AT.x - 8;
  const x1 = CAVE_AT.x + 8;
  const z0 = CAVE_AT.z - 11;
  const z1 = CAVE_AT.z + 14;
  let x = nx;
  let z = nz;
  if (x < x0) x = x0;
  if (x > x1) x = x1;
  if (z > z1) z = z1;
  if (z < z0 + 1.2 && Math.abs(x - CAVE_AT.x) > 1.8) z = z0 + 1.2;
  if (z < z0 - 0.4) z = z0 - 0.2;
  const pocket = Math.hypot(x - (CAVE_AT.x + 5.2), z - CAVE_AT.z) < 2.4;
  if (!pocket && x > CAVE_AT.x + 3.2 && z > CAVE_AT.z - 2 && z < CAVE_AT.z + 2) x = CAVE_AT.x + 3.2;
  if (x === nx && z === nz) return null;
  return { x, z };
}
