import type { GradeBand } from "../types";
import { TREE_TRUNK } from "./field";
import { roomZ } from "./dungeonLayout";

export type Op = "+" | "×" | "−";

export type PileSpec = { left: number; right: number; op: Op; answer: number };
export type StatueSet = PileSpec & { nums: number[] };
export type BridgeSet = PileSpec & { nums: number[] };
export type CrateSet = { nums: number[] };
export type PlateSet = { plates: { groups: number; size: number }[]; extra: number };

export function opResult(left: number, right: number, op: Op) {
  if (op === "×") return left * right;
  if (op === "−") return left - right;
  return left + right;
}

export function worldMath(grade: GradeBand): {
  statue: StatueSet;
  bridge: BridgeSet;
  crates: CrateSet;
  plates: PlateSet;
} {
  if (grade === "g68") {
    return {
      statue: { nums: [18, 21, 24, 28], left: 6, right: 4, op: "×", answer: 24 },
      bridge: { nums: [16, 28, 35], left: 7, right: 4, op: "×", answer: 28 },
      crates: { nums: [5, 10, 15, 20] },
      plates: { plates: [{ groups: 4, size: 3 }, { groups: 2, size: 5 }], extra: 3 },
    };
  }
  if (grade === "g45") {
    return {
      statue: { nums: [12, 15, 16, 18], left: 3, right: 5, op: "×", answer: 15 },
      bridge: { nums: [9, 18, 21], left: 6, right: 3, op: "×", answer: 18 },
      crates: { nums: [3, 6, 9, 12] },
      plates: { plates: [{ groups: 3, size: 3 }, { groups: 4, size: 2 }], extra: 2 },
    };
  }
  if (grade === "g23") {
    return {
      statue: { nums: [6, 8, 9, 12], left: 4, right: 5, op: "+", answer: 9 },
      bridge: { nums: [4, 8, 12], left: 3, right: 4, op: "×", answer: 12 },
      crates: { nums: [2, 4, 6, 8] },
      plates: { plates: [{ groups: 2, size: 3 }, { groups: 2, size: 2 }], extra: 3 },
    };
  }
  return {
    statue: { nums: [3, 4, 5, 7], left: 2, right: 3, op: "+", answer: 5 },
    bridge: { nums: [2, 6, 9], left: 3, right: 3, op: "+", answer: 6 },
    crates: { nums: [1, 2, 3, 4] },
    plates: { plates: [{ groups: 1, size: 2 }, { groups: 1, size: 3 }], extra: 2 },
  };
}

/** First dungeon always teaches 2 + 3 before the 2-3-5 stepping hall. */
export const HOLLOW_STATUE: StatueSet = {
  nums: [2, 3, 5, 8],
  left: 2,
  right: 3,
  op: "+",
  answer: 5,
};

export const STATUE_AT = { x: TREE_TRUNK.x + 24, z: TREE_TRUNK.z - 34 };
export const BRIDGE_AT = { x: 94, z: -120 };
export const ORDER_AT = { x: 46, z: -114 };
export const GOURD_AT = { x: 58, z: -82 };
export const FOREST_AT = { x: -880, z: -48 };
export const HOLLOW_AT = { x: 0, z: roomZ(3) + 12 };

export const CREEK = {
  x: BRIDGE_AT.x,
  z: BRIDGE_AT.z,
  hx: 9.4,
  hz: 4.2,
};

export function inCreek(x: number, z: number, pad = 0) {
  return Math.abs(x - CREEK.x) < CREEK.hx + pad && Math.abs(z - CREEK.z) < CREEK.hz + pad;
}

export function plateNeed(p: { groups: number; size: number }) {
  return p.groups * p.size;
}

export function cratesSolved(
  crates: { n: number; x: number; z: number }[],
  slots: { n: number; x: number; z: number }[],
  rad = 0.85,
) {
  if (crates.length !== slots.length) return false;
  return slots.every((s) => crates.some((c) => c.n === s.n && Math.hypot(c.x - s.x, c.z - s.z) < rad));
}

export function gourdCounts(
  gourds: { x: number; z: number; held?: boolean }[],
  plates: { x: number; z: number }[],
  rad = 1.08,
) {
  return plates.map((p) => gourds.filter((g) => !g.held && Math.hypot(g.x - p.x, g.z - p.z) < rad).length);
}

export function platesSolved(counts: number[], needs: number[]) {
  if (counts.length !== needs.length || needs.length === 0) return false;
  return needs.every((n, i) => counts[i] === n);
}

type MathBody = { id: string; x: number; z: number; r: number; soft?: boolean };
const bodies: MathBody[] = [];

export function beginMathBodies() {
  bodies.length = 0;
}

export function addMathBody(id: string, x: number, z: number, r: number, soft = true) {
  bodies.push({ id, x, z, r, soft });
}

export function collideMath(x: number, z: number, skip?: string | null): { x: number; z: number } | null {
  let ox = x;
  let oz = z;
  let hit = false;
  for (const b of bodies) {
    if (skip && b.id === skip) continue;
    const dx = ox - b.x;
    const dz = oz - b.z;
    const rad = b.r + 0.32;
    const d2 = dx * dx + dz * dz;
    if (d2 >= rad * rad || d2 < 1e-6) continue;
    if (b.soft) {
      const dNear = Math.hypot(x - b.x, z - b.z);
      if (dNear < b.r + 1.15) continue;
    }
    const d = Math.sqrt(d2);
    ox = b.x + (dx / d) * rad;
    oz = b.z + (dz / d) * rad;
    hit = true;
  }
  return hit ? { x: ox, z: oz } : null;
}

export function nearestMath(px: number, pz: number, max = 1.4) {
  let best: MathBody | null = null;
  let bestD = max;
  for (const b of bodies) {
    if (!b.soft) continue;
    const d = Math.hypot(px - b.x, pz - b.z);
    if (d < bestD) {
      best = b;
      bestD = d;
    }
  }
  return best;
}

export function clampAround(p: { x: number; z: number }, cx: number, cz: number, rad: number) {
  const d = Math.hypot(p.x - cx, p.z - cz);
  if (d <= rad || d < 1e-6) return;
  p.x = cx + ((p.x - cx) / d) * rad;
  p.z = cz + ((p.z - cz) / d) * rad;
}

export function mushOrder() {
  return [1, 2, 4, 8];
}
