/** East-west gorge. The cliffs are the border. The bridge and the floor trails are the ways across. */

export const N_WALL = -266;
export const S_WALL = -312;
export const WALL_HALF = 7;
export const CANYON_X0 = -400;
export const CANYON_X1 = 400;
export const DECK = 13;
export const RIVER_Z = -289;

function inside(z: number, wall: number) {
  return Math.abs(z - wall) < WALL_HALF + 0.6;
}

export function onDeck(x: number, z: number) {
  if (Math.abs(x) > 3.6) return false;
  return z < N_WALL + 20 && z > S_WALL - 20;
}

export function canyonLift(x: number, z: number) {
  let h = 0;
  if (onDeck(x, z)) {
    const northStart = N_WALL + 16;
    const southEnd = S_WALL - 16;
    if (z >= northStart || z <= southEnd) h = 0;
    else if (z > N_WALL) h = DECK * ((northStart - z) / (northStart - N_WALL));
    else if (z < S_WALL) h = DECK * ((z - southEnd) / (S_WALL - southEnd));
    else h = DECK;
  }
  if (x < -60 && x > -210 && Math.abs(z - (N_WALL - WALL_HALF - 1.8)) < 1.7) {
    h = Math.max(h, 7);
  }
  if (Math.abs(x - 48) < 5 && z > N_WALL + 6 && z < N_WALL + 18) {
    h = Math.max(h, 8);
  }
  if (Math.abs(x + 200) < 6 && z < N_WALL - WALL_HALF && z > RIVER_Z - 2) {
    const u = (N_WALL - WALL_HALF - z) / (N_WALL - WALL_HALF - (RIVER_Z - 2));
    h = Math.max(h, 7 * (1 - Math.max(0, Math.min(1, u))));
  }
  return h;
}

function gapOpen(x: number, wall: "n" | "s", slab: boolean) {
  if (Math.abs(x) < 5.2) return true;
  if (wall === "n" && Math.abs(x + 180) < 5) return true;
  if (wall === "s" && Math.abs(x + 120) < 4.5) return true;
  if (wall === "s" && slab && Math.abs(x - 170) < 3.4) return true;
  return false;
}

export function collideCanyon(nx: number, nz: number, slab: boolean): { x: number; z: number } | null {
  if (nx < CANYON_X0 || nx > CANYON_X1) return null;
  if (onDeck(nx, nz)) return null;
  if (inside(nz, N_WALL) && !gapOpen(nx, "n", slab)) {
    return { x: nx, z: nz < N_WALL ? N_WALL - WALL_HALF - 0.5 : N_WALL + WALL_HALF + 0.5 };
  }
  if (inside(nz, S_WALL) && !gapOpen(nx, "s", slab)) {
    return { x: nx, z: nz < S_WALL ? S_WALL - WALL_HALF - 0.5 : S_WALL + WALL_HALF + 0.5 };
  }
  const inGap = nz < N_WALL - WALL_HALF && nz > S_WALL + WALL_HALF;
  if (inGap && Math.abs(nz - RIVER_Z) < 2.15 && nx > -250 && nx < 180 && Math.abs(nx) > 16) {
    const stones = [-86, -62];
    if (stones.some((s) => Math.hypot(nx - s, nz - RIVER_Z) < 1.15)) return null;
    if (slab && Math.abs(nx + 40) < 2.2) return null;
    return { x: nx, z: nz < RIVER_Z ? RIVER_Z - 2.5 : RIVER_Z + 2.5 };
  }
  if (Math.abs(nx + 2) < 7 && Math.abs(nz - (S_WALL - 26)) < 2.8 && nx < 6) {
    return { x: nx, z: nz > S_WALL - 26 ? S_WALL - 22 : S_WALL - 30 };
  }
  if (Math.abs(nx + 240) < 2.6 && nz < N_WALL - 2.5 && nz > N_WALL - WALL_HALF - 0.3) return null;
  return null;
}
