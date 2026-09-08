import type { WorldId } from "../types";

export type Rect = { x: number; y: number; w: number; h: number; oneWay?: boolean };
export type ActorSpot = {
  id: string;
  x: number;
  y: number;
  kind: "plusling" | "timesprout" | "glyphite" | "remainder" | "emberling" | "driplet" | "umbral" | "sandwight" | "leftover" | "nag";
};
export type PickupSpot = { id: string; x: number; y: number };

export type LevelDef = {
  id: WorldId;
  width: number;
  height: number;
  spawn: { x: number; y: number };
  platforms: Rect[];
  enemies: ActorSpot[];
  crystals: PickupSpot[];
  gate: { x: number; y: number };
};

const H = 720;

const PLATS: Rect[] = [
  { x: 0, y: 660, w: 1800, h: 60 },
  { x: 2100, y: 660, w: 3600, h: 60 },
  { x: 380, y: 530, w: 220, h: 28, oneWay: true },
  { x: 760, y: 430, w: 200, h: 28, oneWay: true },
  { x: 1120, y: 500, w: 190, h: 28, oneWay: true },
  { x: 1480, y: 380, w: 210, h: 28, oneWay: true },
  { x: 2080, y: 520, w: 240, h: 28, oneWay: true },
  { x: 2480, y: 410, w: 200, h: 28, oneWay: true },
  { x: 2880, y: 500, w: 230, h: 28, oneWay: true },
  { x: 3280, y: 360, w: 200, h: 28, oneWay: true },
  { x: 3680, y: 500, w: 260, h: 28, oneWay: true },
  { x: 4120, y: 400, w: 220, h: 28, oneWay: true },
  { x: 4560, y: 490, w: 240, h: 28, oneWay: true },
];

function pack(
  id: WorldId,
  kind: ActorSpot["kind"],
  n: number,
  boss = false,
): LevelDef {
  const enemies: ActorSpot[] = Array.from({ length: n }, (_, i) => ({
    id: `${id}-e${i}`,
    kind,
    x: 420 + i * 420,
    y: 600,
  }));
  if (boss) {
    enemies.push({
      id: `${id}-boss`,
      kind: id === "echo" || id === "vault" ? "leftover" : "remainder",
      x: 30500,
      y: 560,
    });
  }
  const crystals: PickupSpot[] = Array.from({ length: 36 }, (_, i) => ({
    id: `${id}-c${i}`,
    x: 360 + i * 820,
    y: 270 + (i % 3) * 80,
  }));
  return {
    id,
    width: 32000,
    height: H,
    spawn: { x: 120, y: 520 },
    platforms: PLATS,
    enemies,
    crystals,
    gate: { x: 31200, y: 500 },
  };
}

export const LEVELS: Record<WorldId, LevelDef> = {
  meadow: pack("meadow", "plusling", 4),
  cavern: pack("cavern", "glyphite", 56),
  marsh: pack("marsh", "driplet", 56),
  grove: pack("grove", "timesprout", 60),
  crater: pack("crater", "emberling", 60),
  lake: pack("lake", "driplet", 60),
  grave: pack("grave", "umbral", 60),
  waste: pack("waste", "sandwight", 60),
  keep: pack("keep", "glyphite", 16, true),
  echo: pack("echo", "umbral", 64, true),
  ridge: pack("ridge", "timesprout", 60),
  spire: pack("spire", "glyphite", 60),
  fen: pack("fen", "driplet", 60),
  hollow: pack("hollow", "emberling", 60),
  vault: pack("vault", "umbral", 68, true),
  arena: pack("arena", "umbral", 16),
};
