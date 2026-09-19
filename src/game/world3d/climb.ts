import { ORCHARD_LADDER, ORCHARD_LADDER_YAW, LOOK_LADDER, LOOK_LADDER_YAW, SPIRE_LADDER, SPIRE_LADDER_YAW, TREE_LADDER, TREE_LADDER_YAW, TREE_HOUSE_H, TREE_HOME, TREE_HD, TREE_DECK_D, heightAt } from "./field";
import { live } from "./live";

export type Ladder = {
  id: string;
  x: number;
  z: number;
  yaw: number;
  h: number;
  /** Half-width of the grab box. */
  half: number;
};

/** Real ladders only — not walls, not the sky. */
export function fieldLadders(): Ladder[] {
  return [
    {
      id: "orchard",
      x: ORCHARD_LADDER.x,
      z: ORCHARD_LADDER.z,
      yaw: ORCHARD_LADDER_YAW,
      h: 3.35,
      half: 0.55,
    },
    {
      id: "lookout",
      x: LOOK_LADDER.x,
      z: LOOK_LADDER.z,
      yaw: LOOK_LADDER_YAW,
      h: 10.2,
      half: 0.72,
    },
    {
      id: "spire",
      x: SPIRE_LADDER.x,
      z: SPIRE_LADDER.z,
      yaw: SPIRE_LADDER_YAW,
      h: 46,
      half: 0.8,
    },
    {
      id: "treehome",
      x: TREE_LADDER.x,
      z: TREE_LADDER.z,
      yaw: TREE_LADDER_YAW,
      h: TREE_HOUSE_H + 0.55,
      half: 0.95,
    },
  ];
}

export function nearLadder(x: number, z: number, extra?: Ladder[]): Ladder | null {
  const list = extra ? fieldLadders().concat(extra) : fieldLadders();
  let best: Ladder | null = null;
  let bestD = 99;
  for (const L of list) {
    const d = Math.hypot(x - L.x, z - L.z);
    if (d < L.half && d < bestD) {
      best = L;
      bestD = d;
    }
  }
  return best;
}

export function orchardTopY() {
  return 3.35;
}

/** Face the rungs (character forward is −Z). Ladder yaw is the mesh facing. */
export function ladderFaceYaw(L: Ladder) {
  return L.yaw;
}

function rungCenter(L: Ladder) {
  const along = L.id === "bunk" ? 0 : 0.21;
  return {
    x: L.x + Math.cos(L.yaw) * along,
    z: L.z - Math.sin(L.yaw) * along,
  };
}

export function snapToLadder(L: Ladder) {
  const face = ladderFaceYaw(L);
  const fx = -Math.sin(face);
  const fz = -Math.cos(face);
  const c = rungCenter(L);
  live.x = c.x - fx * 0.28;
  live.z = c.z - fz * 0.28;
  live.yaw = face;
}

export function climbingOrchard() {
  return live.climbing === "orchard";
}

export function miraInReach() {
  if (live.climbing !== "orchard") return false;
  return live.climbH > 1.6;
}

export function hopOffLadder(L: Ladder, back = 1.35) {
  const face = ladderFaceYaw(L);
  const fx = -Math.sin(face);
  const fz = -Math.cos(face);
  const c = rungCenter(L);
  const ontoDeck = (L.id === "lookout" || L.id === "treehome" || L.id === "vine") && live.climbH > L.h * 0.55;
  const dist = ontoDeck ? -1.72 : back;
  live.x = c.x - fx * dist;
  live.z = c.z - fz * dist;
  live.climbing = null;
  live.climbH = 0;
  live.climbV = 0;
  live.climbCool = 0.55;
  if (ontoDeck && L.id === "treehome") {
    live.y = heightAt(TREE_HOME.x, TREE_HOME.z) + TREE_HOUSE_H + 0.04;
    live.z = TREE_HOME.z + TREE_HD + TREE_DECK_D * 0.55;
    live.x = TREE_HOME.x;
    live.grounded = true;
  }
  if (ontoDeck && L.id === "vine") {
    live.y = heightAt(L.x, L.z) + 5.55;
    live.grounded = true;
  }
}

export function startClimb(L: Ladder, h = 0.12) {
  snapToLadder(L);
  live.climbing = L.id;
  live.climbH = h;
  live.climbV = 0;
  live.climbPhase = 0;
  live.speed = 0;
  live.vx = 0;
}

export function ladderById(id: string, extra?: Ladder[]): Ladder | null {
  const list = extra ? fieldLadders().concat(extra) : fieldLadders();
  return list.find((L) => L.id === id) ?? null;
}

export function bunkLadderAt(x: number, z: number): Ladder {
  return { id: "bunk", x, z, yaw: Math.PI / 2, h: 1.28, half: 0.48 };
}
