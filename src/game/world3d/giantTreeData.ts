/** The giant tree is geography. The hollow is a real tunnel. The valley is only through it. */

export const TREE = { x: 312, z: 72 };
export const MOUTH_0 = TREE.x - 20;
export const MOUTH_1 = TREE.x + 28;
export const MOUTH_HALF = 4.1;

export const VALLEY = { x: TREE.x + 52, z: TREE.z + 8 };
export const VALLEY_R = 24;
export const VALLEY_THICK = 4.2;

export const CLIMB = [
  { x: TREE.x - 8, z: TREE.z - 18, y: 1.6 },
  { x: TREE.x - 4, z: TREE.z - 20, y: 3.4 },
  { x: TREE.x - 1, z: TREE.z - 22, y: 5.4 },
  { x: TREE.x + 2, z: TREE.z - 23, y: 7.6 },
  { x: TREE.x + 6, z: TREE.z - 22, y: 10 },
  { x: TREE.x + 10, z: TREE.z - 19, y: 12.6 },
  { x: TREE.x + 12, z: TREE.z - 15, y: 15.2 },
];

function angDiff(a: number, b: number) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function passageZ(x: number) {
  const t = (x - MOUTH_0) / (MOUTH_1 - MOUTH_0);
  const u = Math.max(0, Math.min(1, t));
  return TREE.z + Math.sin(u * Math.PI) * 3.2 + u * 8;
}

export function treeLift(x: number, z: number) {
  let h = 0;
  for (const p of CLIMB) {
    const d = Math.hypot(x - p.x, z - p.z);
    if (d < 2.4) h = Math.max(h, p.y * (1 - d / 2.4));
  }
  return h;
}

function pushRadial(nx: number, nz: number, cx: number, cz: number, dist: number, target: number) {
  const dx = nx - cx;
  const dz = nz - cz;
  const s = target / (dist || 0.001);
  return { x: cx + dx * s, z: cz + dz * s };
}

export function collideGiant(nx: number, nz: number): { x: number; z: number } | null {
  if (nx > MOUTH_0 - 0.4 && nx < MOUTH_1 + 0.4) {
    const zc = passageZ(nx);
    const dz = nz - zc;
    const pocket = Math.abs(nx - (TREE.x + 2)) < 3.4 && dz < -MOUTH_HALF && dz > -9.5;
    if (!pocket && Math.abs(dz) < 7.2 && Math.abs(dz) > MOUTH_HALF) {
      return { x: nx, z: zc + Math.sign(dz || 1) * MOUTH_HALF };
    }
    if (!pocket && Math.abs(nx - (TREE.x + 6)) < 1.1 && Math.abs(dz) < 1.3) {
      return { x: nx < TREE.x + 6 ? TREE.x + 4.6 : TREE.x + 7.4, z: nz };
    }
  }
  const dx = nx - TREE.x;
  const dz = nz - TREE.z;
  const dist = Math.hypot(dx, dz);
  if (dist < 15.5 && dist > 0.2) {
    const zc = passageZ(Math.max(MOUTH_0, Math.min(MOUTH_1, nx)));
    const inHollow = nx > MOUTH_0 && nx < MOUTH_1 && Math.abs(nz - zc) < MOUTH_HALF + 0.2;
    if (!inHollow) return pushRadial(nx, nz, TREE.x, TREE.z, dist, 15.9);
  }
  const vx = nx - VALLEY.x;
  const vz = nz - VALLEY.z;
  const vd = Math.hypot(vx, vz);
  if (vd > VALLEY_R - VALLEY_THICK && vd < VALLEY_R + VALLEY_THICK) {
    const gap = Math.abs(angDiff(Math.atan2(vz, vx), Math.PI)) < 0.34;
    if (!gap) {
      const target = vd < VALLEY_R ? VALLEY_R - VALLEY_THICK - 0.4 : VALLEY_R + VALLEY_THICK + 0.4;
      return pushRadial(nx, nz, VALLEY.x, VALLEY.z, vd, target);
    }
  }
  const pond = Math.hypot(nx - (VALLEY.x + 4), nz - (VALLEY.z + 2));
  if (pond < 4.2) return pushRadial(nx, nz, VALLEY.x + 4, VALLEY.z + 2, pond, 4.5);
  const stream = Math.abs(nz - (48 + (nx - 250) * 0.12));
  if (nx > 248 && nx < 292 && stream < 2.1 && Math.hypot(nx - 270, nz - 50) > 2.2) {
    return { x: nx, z: nz < 48 + (nx - 250) * 0.12 ? 46 : 54 };
  }
  return null;
}
