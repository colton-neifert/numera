import type { WorldId } from "../types";
import { useGame } from "../store";
import { lastRoomZ, roomZ, splitZ } from "./dungeonLayout";

export type Block = { id: string; x: number; z: number; color?: string };
export type Plate = { id: string; x: number; z: number; color?: string };
export type SwitchSpot = { id: string; x: number; z: number; ranged?: boolean };
export type DoorNeed = "plates" | "switch" | "key" | "switch2" | "key2" | "boss" | "shortcut" | "pads" | "eyes" | "far";
export type Door = { id: string; x: number; z: number; w: number; need: DoorNeed; axis?: "x" | "z" };
export type KeySpot = {
  id: string;
  x: number;
  z: number;
  need: "plates" | "switch" | "none" | "pads" | "eyes" | "far";
  kind?: "small" | "key2" | "boss";
};
export type ChestSpot = {
  id: string;
  x: number;
  z: number;
  need: "key" | "plates" | "none";
  coins: number;
  item?: "sword" | "axe" | "ocarina" | "bow" | "sling" | "boom" | "bombs" | "heart" | "compass";
};
export type EyeSpot = { id: string; x: number; z: number; color: string; size?: number };
export type MuralSpot = { x: number; z: number; yaw: number; colors: string[]; caption: string; dots?: number[] };
export type PadSpot = { id: string; x: number; z: number; n: number; color?: string };
export type TorchSpot = { id: string; x: number; z: number; color?: string };

const BIG_LOOT = new Set(["sword", "axe", "ocarina", "bow", "sling", "boom", "bombs", "compass"]);

export function chestTier(ch: { item?: string; coins?: number }): "big" | "small" {
  return ch.item && BIG_LOOT.has(ch.item) ? "big" : "small";
}

export type PuzzleSpec = {
  hint: string;
  blocks: Block[];
  plates: Plate[];
  switches: SwitchSpot[];
  doors: Door[];
  keys: KeySpot[];
  chests: ChestSpot[];
  eyes?: EyeSpot[];
  eyeOrder?: number[];
  murals?: MuralSpot[];
  pads?: PadSpot[];
  padOrder?: number[];
  torches?: TorchSpot[];
  torchOrder?: number[];
  memory?: boolean;
};

function doorsFor(p: string, first: "plates" | "switch"): Door[] {
  return [
    { id: `${p}d`, x: 0, z: splitZ(0), w: DOOR_W, need: first },
    { id: `${p}d2`, x: 0, z: splitZ(1), w: DOOR_W, need: first === "plates" ? "switch" : "plates" },
    { id: `${p}d3`, x: 0, z: splitZ(2), w: DOOR_W, need: "key" },
    { id: `${p}d4`, x: 0, z: splitZ(3), w: DOOR_W, need: "switch2" },
  ];
}

const DOOR_W = 8.8;

function blockSet(
  p: string,
  colors: [string, string] | null,
  switchFirst: boolean,
): { blocks: Block[]; plates: Plate[] } {
  const bx = switchFirst ? -12.4 : 10.2;
  const px = switchFirst ? 12.4 : 10.2;
  const bz = roomZ(0) + (switchFirst ? -6 : 4);
  const pz = roomZ(0) + (switchFirst ? 4 : -4);
  return {
    blocks: [
      { id: `${p}b1`, x: bx, z: bz, color: colors?.[0] },
      { id: `${p}b2`, x: bx + 5.2, z: bz, color: colors?.[1] },
    ],
    plates: [
      { id: `${p}p1`, x: px, z: pz, color: colors?.[0] },
      { id: `${p}p2`, x: px + 5.2, z: pz, color: colors?.[1] },
    ],
  };
}

function prizeChests(p: string, coins: number, item?: ChestSpot["item"]): ChestSpot[] {
  return [
    { id: `${p}c`, x: 14.4, z: roomZ(4) + 4, need: "none", coins, item },
    { id: `${p}c2`, x: -16.4, z: roomZ(4) - 6, need: "none", coins: Math.max(8, Math.floor(coins * 0.45)), item: "heart" },
    { id: `${p}c3`, x: 18.2, z: roomZ(6), need: "none", coins: 12 },
  ];
}

export const PUZZLES: Record<WorldId, PuzzleSpec> = {
  meadow: {
    hint: "A note on a tree. Then Mira’s song. Play it at the Sun Shrine — or push both stones onto the gold plates — and go in for the orange jewel.",
    blocks: [
      { id: "mb", x: -87.8, z: 25.6 },
      { id: "mb2", x: -76.2, z: 26.0 },
    ],
    plates: [
      { id: "mp", x: -87.8, z: 32.2 },
      { id: "mp2", x: -76.2, z: 32.2 },
    ],
    switches: [],
    doors: [{ id: "md", x: -82, z: 30.1, w: 4.6, need: "plates" }],
    keys: [],
    chests: [
      { id: "msword", x: 18.6, z: -26.4, need: "none", coins: 0, item: "sword" },
      { id: "mocarina", x: 4.4, z: 10.2, need: "none", coins: 0, item: "ocarina" },
      { id: "maxe", x: -19.4, z: 8.2, need: "none", coins: 0, item: "axe" },
    ],
  },
  keep: {
    hint: "Set the three jewels in the holes in front of the castle, {name}. Then the Lizard King.",
    blocks: [],
    plates: [],
    switches: [{ id: "ks", x: 9.4, z: -5.2 }],
    doors: [{ id: "kd", x: 9.4, z: -10.4, w: 2.8, need: "key" }],
    keys: [{ id: "kk", x: 9.4, z: -7.4, need: "switch" }],
    chests: [{ id: "kc", x: 9.4, z: -12.6, need: "key", coins: 28 }],
  },
  cavern: {
    hint: "Sun Hollow. Match the two stones. Roll the log. The hall in the middle has four mouths. East first.",
    blocks: [
      { id: "cb1", x: 10.2, z: 20, color: "#c9a227" },
      { id: "cb2", x: 4.8, z: 20, color: "#e07a28" },
    ],
    plates: [
      { id: "cp1", x: 10.2, z: 12, color: "#c9a227" },
      { id: "cp2", x: 4.8, z: 12, color: "#e07a28" },
    ],
    switches: [
      { id: "cs", x: 48, z: roomZ(2) },
      { id: "csfar", x: 0, z: roomZ(7) - 16, ranged: true },
    ],
    doors: [
      { id: "cd0", x: 0, z: splitZ(0), w: DOOR_W, need: "plates" },
      { id: "cdHubN", x: 0, z: splitZ(2), w: DOOR_W, need: "key" },
      { id: "cdShort", x: -30, z: roomZ(2), w: 8.2, need: "shortcut", axis: "x" },
      { id: "cdPads", x: 0, z: splitZ(4), w: DOOR_W, need: "pads" },
      { id: "cdEyes", x: 0, z: splitZ(5), w: DOOR_W, need: "eyes" },
      { id: "cdFar", x: 0, z: splitZ(7), w: DOOR_W, need: "far" },
      { id: "cdMix", x: 0, z: splitZ(8), w: DOOR_W, need: "switch2" },
      { id: "cdKey2", x: 0, z: splitZ(9), w: DOOR_W, need: "key2" },
      { id: "cdBoss", x: 0, z: splitZ(10), w: DOOR_W, need: "boss" },
    ],
    keys: [
      { id: "ck", x: 54, z: roomZ(2) + 6, need: "switch", kind: "small" },
      { id: "ck2", x: 8, z: roomZ(7) + 8, need: "far", kind: "key2" },
      { id: "ckb", x: 0, z: roomZ(10) + 8, need: "none", kind: "boss" },
    ],
    chests: [
      { id: "csling", x: 0, z: roomZ(6) + 6, need: "none", coins: 0, item: "sling" },
      { id: "cheart", x: 14, z: roomZ(3) + 8, need: "none", coins: 0, item: "heart" },
      { id: "ccompass", x: 60, z: roomZ(2), need: "none", coins: 18, item: "compass" },
      { id: "ccoin", x: -8, z: roomZ(9) + 4, need: "none", coins: 24 },
    ],
    eyes: [
      { id: "ce0", x: -10.2, z: roomZ(5) - 2, color: "#c42838", size: 1.35 },
      { id: "ce1", x: 0, z: roomZ(5) - 2, color: "#e8c040", size: 0.72 },
      { id: "ce2", x: 10.2, z: roomZ(5) - 2, color: "#e07a28", size: 1.0 },
    ],
    eyeOrder: [1, 2, 0],
    pads: [
      { id: "cpd0", x: -10.2, z: roomZ(4), n: 5, color: "#c9a227" },
      { id: "cpd1", x: 0, z: roomZ(4), n: 2, color: "#6a8a4a" },
      { id: "cpd2", x: 10.2, z: roomZ(4), n: 3, color: "#6a8a4a" },
    ],
    padOrder: [2, 3, 5],
    murals: [
      {
        x: 0,
        z: roomZ(0) + 10.4,
        yaw: Math.PI,
        colors: ["#c9a227", "#e07a28"],
        caption: "Gold stone on gold. Fire stone on fire.",
      },
      {
        x: 0,
        z: roomZ(2) + 18,
        yaw: Math.PI,
        colors: ["#c9a227", "#e8c040", "#e07a28", "#c42838"],
        caption: "Four mouths. East first. The west mouth waits.",
      },
      {
        x: 0,
        z: roomZ(4) + 14,
        yaw: 0,
        colors: ["#6a8a4a", "#6a8a4a", "#c9a227"],
        caption: "Two, then three, then what they make together.",
        dots: [2, 3, 5],
      },
      {
        x: 0,
        z: roomZ(5) + 14,
        yaw: 0,
        colors: ["#e8c040", "#e07a28", "#c42838"],
        caption: "Little sun, then bigger, then biggest.",
      },
      {
        x: 0,
        z: roomZ(7) + 12,
        yaw: 0,
        colors: ["#e8c040"],
        caption: "Too far for a sword. A seed from the sling.",
      },
      {
        x: 0,
        z: roomZ(8) + 14,
        yaw: 0,
        colors: ["#c9a227", "#e07a28", "#e8c040"],
        caption: "Stone. Seed. Step. All three.",
      },
    ],
  },
  marsh: {
    hint: "Match the water colors. Hit the eye. Take the key. The wall’s order is the colors, not the chairs.",
    ...blockSet("w", ["#2a6ad8", "#6ec8e8"], false),
    switches: [{ id: "ws", x: 18.4, z: roomZ(1) }],
    doors: doorsFor("w", "plates"),
    keys: [{ id: "wk", x: -22.4, z: roomZ(2), need: "switch" }],
    chests: prizeChests("w", 20, "heart"),
    eyes: [
      { id: "we0", x: -10.2, z: roomZ(3) - 2, color: "#6ec8e8", size: 0.9 },
      { id: "we1", x: 0, z: roomZ(3) - 2, color: "#2a6ad8", size: 1.0 },
      { id: "we2", x: 10.2, z: roomZ(3) - 2, color: "#1a3a88", size: 1.15 },
    ],
    eyeOrder: [2, 0, 1],
    murals: [
      {
        x: 0,
        z: roomZ(3) + 12.4,
        yaw: 0,
        colors: ["#1a3a88", "#6ec8e8", "#2a6ad8"],
        caption: "Deep water, then pale water, then the middle blue.",
      },
    ],
  },
  grove: {
    hint: "Two stones on gold. Hit the eye. Take the key. The wall is adding: two, then three, then the sum.",
    ...blockSet("g", ["#5a8a38", "#c9a227"], false),
    switches: [{ id: "gs", x: -18.4, z: roomZ(1) }],
    doors: doorsFor("g", "plates"),
    keys: [{ id: "gk", x: 22.4, z: roomZ(2), need: "switch" }],
    chests: prizeChests("g", 0, "bow"),
    pads: [
      { id: "gpd0", x: -10.2, z: roomZ(3), n: 5, color: "#c9a227" },
      { id: "gpd1", x: 0, z: roomZ(3), n: 2, color: "#6a8a4a" },
      { id: "gpd2", x: 10.2, z: roomZ(3), n: 3, color: "#6a8a4a" },
    ],
    padOrder: [2, 3, 5],
    murals: [
      {
        x: 0,
        z: roomZ(3) + 12.4,
        yaw: 0,
        colors: ["#6a8a4a", "#6a8a4a", "#c9a227"],
        caption: "Two, then three, then what they make together.",
        dots: [2, 3, 5],
      },
    ],
  },
  crater: {
    hint: "The fire eye first. Then two stones. Then light the bowls the way the wall counts: one flame, two, three.",
    ...blockSet("f", ["#e07030", "#c42838"], true),
    switches: [{ id: "fs", x: 22.4, z: roomZ(0) + 2 }],
    doors: doorsFor("f", "switch"),
    keys: [{ id: "fk", x: -22.4, z: roomZ(2), need: "plates" }],
    chests: prizeChests("f", 24),
    torches: [
      { id: "ft0", x: 10.2, z: roomZ(3), color: "#e8c040" },
      { id: "ft1", x: -10.2, z: roomZ(3), color: "#c42838" },
      { id: "ft2", x: 0, z: roomZ(3) - 8, color: "#e07030" },
    ],
    torchOrder: [0, 2, 1],
    murals: [
      {
        x: 0,
        z: roomZ(3) + 12.4,
        yaw: 0,
        colors: ["#e8c040", "#e07030", "#c42838"],
        caption: "One little fire, then a bigger fire, then the biggest.",
        dots: [1, 2, 3],
      },
    ],
  },
  lake: {
    hint: "Two stones. Eye. Key. Then even numbers first, odd numbers after — the wall says so.",
    ...blockSet("l", ["#2a6ad8", "#6ec8e8"], false),
    switches: [{ id: "ls", x: -22.4, z: roomZ(1) }],
    doors: doorsFor("l", "plates"),
    keys: [{ id: "lk", x: 22.4, z: roomZ(2), need: "switch" }],
    chests: prizeChests("l", 0, "boom"),
    pads: [
      { id: "lpd0", x: -12.2, z: roomZ(3) + 4, n: 1, color: "#c9a227" },
      { id: "lpd1", x: -4.2, z: roomZ(3) + 4, n: 2, color: "#2a6ad8" },
      { id: "lpd2", x: 4.2, z: roomZ(3) + 4, n: 3, color: "#c9a227" },
      { id: "lpd3", x: 12.2, z: roomZ(3) + 4, n: 4, color: "#2a6ad8" },
    ],
    padOrder: [2, 4, 1, 3],
    murals: [
      {
        x: 0,
        z: roomZ(3) + 12.4,
        yaw: 0,
        colors: ["#2a6ad8", "#2a6ad8", "#c9a227", "#c9a227"],
        caption: "The even pair first (2 then 4). Then the odd pair (1 then 3).",
        dots: [2, 4, 1, 3],
      },
    ],
  },
  grave: {
    hint: "Night-eye first. Two stones. Key. Then watch the three lights. Copy them.",
    ...blockSet("n", null, true),
    switches: [{ id: "ns", x: 22.4, z: roomZ(0) + 2 }],
    doors: doorsFor("n", "switch"),
    keys: [{ id: "nk", x: -22.4, z: roomZ(2), need: "plates" }],
    chests: prizeChests("n", 26),
    eyes: [
      { id: "ne0", x: -10.2, z: roomZ(3), color: "#c8d0e8", size: 1 },
      { id: "ne1", x: 0, z: roomZ(3), color: "#8878c0", size: 1 },
      { id: "ne2", x: 10.2, z: roomZ(3), color: "#e8c040", size: 1 },
    ],
    eyeOrder: [2, 0, 1],
    memory: true,
    murals: [
      {
        x: 0,
        z: roomZ(3) + 12.4,
        yaw: 0,
        colors: ["#c8d0e8", "#8878c0", "#e8c040"],
        caption: "Watch the three lights. Then hit them in the same order.",
      },
    ],
  },
  waste: {
    hint: "Two sands. Eye. Key. Then keep doubling — 1, 2, 4, 8.",
    ...blockSet("s", ["#c4a060", "#e0c060"], false),
    switches: [{ id: "ss", x: -22.4, z: roomZ(1) }],
    doors: doorsFor("s", "plates"),
    keys: [{ id: "sk", x: 22.4, z: roomZ(2), need: "switch" }],
    chests: prizeChests("s", 28),
    pads: [
      { id: "spd0", x: -12.2, z: roomZ(3), n: 8, color: "#c9a227" },
      { id: "spd1", x: -4.2, z: roomZ(3), n: 1, color: "#8a6a40" },
      { id: "spd2", x: 4.2, z: roomZ(3), n: 4, color: "#c4a060" },
      { id: "spd3", x: 12.2, z: roomZ(3), n: 2, color: "#8a6a40" },
    ],
    padOrder: [1, 2, 4, 8],
    murals: [
      {
        x: 0,
        z: roomZ(3) + 12.4,
        yaw: 0,
        colors: ["#8a6a40", "#8a6a40", "#c4a060", "#c9a227"],
        caption: "Start at one. Keep doubling.",
        dots: [1, 2, 4, 8],
      },
    ],
  },
  echo: {
    hint: "Two plates. Eye. Key. Then four lights. Watch, then copy.",
    ...blockSet("e", ["#6a5a88", "#a070d0"], false),
    switches: [{ id: "es", x: -22.4, z: roomZ(1) }],
    doors: doorsFor("e", "plates"),
    keys: [{ id: "ek", x: 22.4, z: roomZ(2), need: "switch" }],
    chests: prizeChests("e", 80),
    eyes: [
      { id: "ee0", x: -12.2, z: roomZ(3), color: "#c8b0e8", size: 0.95 },
      { id: "ee1", x: -4.2, z: roomZ(3), color: "#8878c0", size: 0.95 },
      { id: "ee2", x: 4.2, z: roomZ(3), color: "#a070d0", size: 0.95 },
      { id: "ee3", x: 12.2, z: roomZ(3), color: "#e8c040", size: 0.95 },
    ],
    eyeOrder: [1, 3, 0, 2],
    memory: true,
    murals: [
      {
        x: 0,
        z: roomZ(3) + 12.4,
        yaw: 0,
        colors: ["#c8b0e8", "#8878c0", "#a070d0", "#e8c040"],
        caption: "Four lights. Watch them sing. Hit that song back.",
      },
    ],
  },
  ridge: {
    hint: "Two stones. Eye. Key. Then three plus five — step the two parts, then the sum.",
    ...blockSet("rd", ["#50a048", "#c9a227"], false),
    switches: [{ id: "rds", x: -22.4, z: roomZ(1) }],
    doors: doorsFor("rd", "plates"),
    keys: [{ id: "rdk", x: 22.4, z: roomZ(2), need: "switch" }],
    chests: prizeChests("rd", 22),
    pads: [
      { id: "rdp0", x: -10.2, z: roomZ(3), n: 8, color: "#c9a227" },
      { id: "rdp1", x: 0, z: roomZ(3), n: 3, color: "#50a048" },
      { id: "rdp2", x: 10.2, z: roomZ(3), n: 5, color: "#50a048" },
    ],
    padOrder: [3, 5, 8],
    murals: [
      {
        x: 0,
        z: roomZ(3) + 12.4,
        yaw: 0,
        colors: ["#50a048", "#50a048", "#c9a227"],
        caption: "Three, then five, then what they make together.",
        dots: [3, 5, 8],
      },
    ],
  },
  spire: {
    hint: "Eye of hours first. Then stones. Then the key. Then walk the clock: 1 at the top, then 2, 3, 4 around.",
    ...blockSet("sp", null, true),
    switches: [{ id: "sps", x: 22.4, z: roomZ(0) + 2 }],
    doors: doorsFor("sp", "switch"),
    keys: [{ id: "spk", x: -22.4, z: roomZ(2), need: "plates" }],
    chests: prizeChests("sp", 24),
    pads: clockPads("spp", roomZ(3)),
    padOrder: [1, 2, 3, 4],
    murals: [
      {
        x: 0,
        z: roomZ(3) + 12.4,
        yaw: 0,
        colors: ["#c9a227", "#8090a8", "#8090a8", "#8090a8"],
        caption: "Start at the top. Walk around like a clock. 1, then 2, then 3, then 4.",
        dots: [1, 2, 3, 4],
      },
    ],
  },
  fen: {
    hint: "Two stones on the glass. Eye. Key. Then four plus five, then the sum.",
    ...blockSet("fn", ["#40a090", "#6ec8e8"], false),
    switches: [{ id: "fns", x: -22.4, z: roomZ(1) }],
    doors: doorsFor("fn", "plates"),
    keys: [{ id: "fnk", x: 22.4, z: roomZ(2), need: "switch" }],
    chests: prizeChests("fn", 26),
    pads: [
      { id: "fnp0", x: -10.2, z: roomZ(3), n: 9, color: "#c9a227" },
      { id: "fnp1", x: 0, z: roomZ(3), n: 4, color: "#40a090" },
      { id: "fnp2", x: 10.2, z: roomZ(3), n: 5, color: "#40a090" },
    ],
    padOrder: [4, 5, 9],
    murals: [
      {
        x: 0,
        z: roomZ(3) + 12.4,
        yaw: 0,
        colors: ["#40a090", "#40a090", "#c9a227"],
        caption: "Four, then five, then what they make together.",
        dots: [4, 5, 9],
      },
    ],
  },
  hollow: {
    hint: "Fire eye first. Stones. Key. Then dimmest light to brightest.",
    ...blockSet("hl", ["#e07030", "#c42838"], true),
    switches: [{ id: "hls", x: 22.4, z: roomZ(0) + 2 }],
    doors: doorsFor("hl", "switch"),
    keys: [{ id: "hlk", x: -22.4, z: roomZ(2), need: "plates" }],
    chests: prizeChests("hl", 28),
    eyes: [
      { id: "hle0", x: -12.2, z: roomZ(3), color: "#e8c040", size: 1.2 },
      { id: "hle1", x: -4.2, z: roomZ(3), color: "#5a3a28", size: 0.7 },
      { id: "hle2", x: 4.2, z: roomZ(3), color: "#c07040", size: 0.95 },
      { id: "hle3", x: 12.2, z: roomZ(3), color: "#fff0c8", size: 1.4 },
    ],
    eyeOrder: [1, 2, 0, 3],
    murals: [
      {
        x: 0,
        z: roomZ(3) + 12.4,
        yaw: 0,
        colors: ["#5a3a28", "#c07040", "#e8c040", "#fff0c8"],
        caption: "Dimmest first, then brighter, then brighter, then the brightest.",
      },
    ],
  },
  vault: {
    hint: "Two plates. Eye. Key. Then the lonely numbers that nothing divides: 2, 3, 5, 7.",
    ...blockSet("vt", ["#6a5a88", "#c9a227"], false),
    switches: [{ id: "vts", x: -22.4, z: roomZ(1) }],
    doors: doorsFor("vt", "plates"),
    keys: [{ id: "vtk", x: 22.4, z: roomZ(2), need: "switch" }],
    chests: prizeChests("vt", 90),
    pads: [
      { id: "vtp0", x: -12.2, z: roomZ(3), n: 4, color: "#3a2848" },
      { id: "vtp1", x: -4.2, z: roomZ(3), n: 2, color: "#c9a227" },
      { id: "vtp2", x: 4.2, z: roomZ(3), n: 9, color: "#3a2848" },
      { id: "vtp3", x: 12.2, z: roomZ(3), n: 3, color: "#c9a227" },
      { id: "vtp4", x: -8.2, z: roomZ(3) - 10, n: 5, color: "#c9a227" },
      { id: "vtp5", x: 8.2, z: roomZ(3) - 10, n: 7, color: "#c9a227" },
    ],
    padOrder: [2, 3, 5, 7],
    murals: [
      {
        x: 0,
        z: roomZ(3) + 12.4,
        yaw: 0,
        colors: ["#c9a227", "#c9a227", "#c9a227", "#c9a227"],
        caption: "Only the lonely numbers. Nothing else can cut them. Match the wall. Skip the rest.",
        dots: [2, 3, 5, 7],
      },
    ],
  },
  arena: {
    hint: "The hour turns. Cut the ring. Waves do not wait.",
    blocks: [],
    plates: [],
    switches: [],
    doors: [],
    keys: [],
    chests: [],
  },
};

function clockPads(p: string, z: number): PadSpot[] {
  const spots: { n: number; x: number; z: number }[] = [
    { n: 1, x: 0, z: z + 8 },
    { n: 2, x: 8, z },
    { n: 3, x: 0, z: z - 8 },
    { n: 4, x: -8, z },
  ];
  return spots.map((s) => ({ id: `${p}${s.n}`, x: s.x, z: s.z, n: s.n, color: s.n === 1 ? "#c9a227" : "#8090a8" }));
}

export type PuzzleRuntime = {
  blocks: Block[];
  platesOn: boolean;
  switchOn: boolean;
  switch2On: boolean;
  hasKey: boolean;
  hasKey2: boolean;
  hasBoss: boolean;
  shortcut: boolean;
  padOn: boolean;
  eyeOn: boolean;
  farOn: boolean;
  unlocked: boolean;
  opened: Set<string>;
  hint: string;
  eyeSeq: number[];
  padSeq: number[];
  torchSeq: number[];
  memoryT: number;
  memoryI: number;
  memoryReady: boolean;
  lastPadId: string | null;
  lastPadT: number;
  told: Set<string>;
  hitLatch: Set<string>;
};

export function chestSaveId(world: WorldId, id: string) {
  return `${world}:${id}`;
}

const OPENED = new Set<string>();

export function isChestOpen(saveId: string) {
  if (OPENED.has(saveId)) return true;
  if ((useGame.getState().openedChests ?? []).includes(saveId)) {
    OPENED.add(saveId);
    return true;
  }
  return false;
}

export function markChestOpen(saveId: string) {
  OPENED.add(saveId);
  useGame.getState().openChest(saveId);
}

export function chestAlreadyLooted(world: WorldId, ch: ChestSpot) {
  const saveId = chestSaveId(world, ch.id);
  if (isChestOpen(saveId)) return true;
  const g = useGame.getState();
  if (ch.item === "sword" && g.hasSword) return true;
  if (ch.item === "axe" && g.hasAxe) return true;
  if (ch.item === "ocarina" && g.hasOcarina) return true;
  if (ch.item === "bow" && g.hasBow) return true;
  if (ch.item === "sling" && g.hasSling) return true;
  if (ch.item === "boom" && g.hasBoom) return true;
  if (ch.item === "bombs" && g.hasBombs) return true;
  if (ch.item === "compass" && g.hasCompass) return true;
  return false;
}

export function makeRuntime(world: WorldId): PuzzleRuntime {
  const spec = PUZZLES[world];
  return {
    blocks: spec.blocks.map((b) => ({ ...b })),
    platesOn: false,
    switchOn: false,
    switch2On: false,
    hasKey: false,
    hasKey2: false,
    hasBoss: false,
    shortcut: false,
    padOn: false,
    eyeOn: false,
    farOn: false,
    unlocked: false,
    opened: new Set(spec.chests.filter((c) => chestAlreadyLooted(world, c)).map((c) => c.id)),
    hint: spec.hint,
    eyeSeq: [],
    padSeq: [],
    torchSeq: [],
    memoryT: 0,
    memoryI: -1,
    memoryReady: !spec.memory,
    lastPadId: null,
    lastPadT: 0,
    told: new Set(),
    hitLatch: new Set(),
  };
}

export function platesSatisfied(rt: PuzzleRuntime, spec: PuzzleSpec): boolean {
  if (!spec.plates.length) return false;
  const used = new Set<string>();
  return spec.plates.every((p) =>
    rt.blocks.some((b) => {
      if (used.has(b.id)) return false;
      if (Math.hypot(b.x - p.x, b.z - p.z) >= 0.95) return false;
      if (p.color && b.color && p.color !== b.color) return false;
      used.add(b.id);
      return true;
    }),
  );
}

export function doorOpen(rt: PuzzleRuntime, door: Door): boolean {
  if (rt.unlocked) return true;
  if (door.need === "plates") return rt.platesOn;
  if (door.need === "switch") return rt.switchOn;
  if (door.need === "switch2") return rt.switch2On;
  if (door.need === "key") return rt.hasKey || rt.unlocked;
  if (door.need === "key2") return rt.hasKey2 || rt.unlocked;
  if (door.need === "boss") return rt.hasBoss || rt.unlocked;
  if (door.need === "shortcut") return rt.shortcut || rt.farOn;
  if (door.need === "pads") return rt.padOn;
  if (door.need === "eyes") return rt.eyeOn;
  if (door.need === "far") return rt.farOn;
  return false;
}

export function keyVisible(rt: PuzzleRuntime, key: KeySpot): boolean {
  if (rt.opened.has(key.id)) return false;
  if (key.kind === "boss" && rt.hasBoss) return false;
  if (key.kind === "key2" && rt.hasKey2) return false;
  if ((!key.kind || key.kind === "small") && rt.hasKey && key.id === "ck") return false;
  if (key.need === "none") return true;
  if (key.need === "plates") return rt.platesOn;
  if (key.need === "pads") return rt.padOn;
  if (key.need === "eyes") return rt.eyeOn;
  if (key.need === "far") return rt.farOn;
  return rt.switchOn;
}

export function collideDoors(rt: PuzzleRuntime, spec: PuzzleSpec, nx: number, nz: number): boolean {
  for (const d of spec.doors) {
    if (doorOpen(rt, d)) continue;
    if (d.axis === "x") {
      if (Math.abs(nx - d.x) < 0.95 && Math.abs(nz - d.z) < d.w * 0.56) return true;
    } else if (Math.abs(nx - d.x) < d.w * 0.56 && Math.abs(nz - d.z) < 0.95) return true;
  }
  return false;
}

export function nearestBlock(rt: PuzzleRuntime, px: number, pz: number, max = 1.35) {
  let best: Block | null = null;
  let bestD = max;
  for (const b of rt.blocks) {
    const d = Math.hypot(px - b.x, pz - b.z);
    if (d < bestD) {
      best = b;
      bestD = d;
    }
  }
  return best;
}

export function collideBlocks(rt: PuzzleRuntime, nx: number, nz: number, skipId?: string | null): { x: number; z: number } | null {
  for (const b of rt.blocks) {
    if (skipId && b.id === skipId) continue;
    const dx = nx - b.x;
    const dz = nz - b.z;
    const rad = 0.95;
    const d2 = dx * dx + dz * dz;
    if (d2 < rad * rad && d2 > 0.0001) {
      const d = Math.sqrt(d2);
      return { x: b.x + (dx / d) * rad, z: b.z + (dz / d) * rad };
    }
  }
  return null;
}

export function shoveBlock(b: Block, ux: number, uz: number, dist: number) {
  b.x += ux * dist;
  b.z += uz * dist;
  b.x = Math.max(-66, Math.min(66, b.x));
  b.z = Math.max(-720, Math.min(36, b.z));
}

export function pushSeq(seq: number[], next: number, order: number[]): { seq: number[]; ok: boolean; done: boolean } {
  const i = seq.length;
  if (i < order.length && order[i] === next) {
    const ns = [...seq, next];
    return { seq: ns, ok: true, done: ns.length >= order.length };
  }
  if (order[0] === next) {
    return { seq: [next], ok: true, done: order.length === 1 };
  }
  return { seq: [], ok: false, done: false };
}

export function seqComplete(rt: PuzzleRuntime, spec: PuzzleSpec): boolean {
  if (spec.eyeOrder?.length) return rt.eyeSeq.length >= spec.eyeOrder.length;
  if (spec.padOrder?.length) return rt.padSeq.length >= spec.padOrder.length;
  if (spec.torchOrder?.length) return rt.torchSeq.length >= spec.torchOrder.length;
  return false;
}

export type PuzzleHit = { x: number; z: number; r: number };

export function stepPuzzle(
  world: WorldId,
  rt: PuzzleRuntime,
  spec: PuzzleSpec,
  px: number,
  pz: number,
  dt: number,
  hits: PuzzleHit[],
  now: number,
): { hint: string | null; sfx: "ok" | "miss" | "chime" | "key" | "pick" | null } {
  let cue: { hint: string | null; sfx: "ok" | "miss" | "chime" | "key" | "pick" | null } = { hint: null, sfx: null };
  const say = (id: string, msg: string, sound: typeof cue.sfx = "ok") => {
    if (rt.told.has(id)) return;
    rt.told.add(id);
    cue = { hint: msg, sfx: sound };
  };
  const blurt = (msg: string, sound: typeof cue.sfx) => {
    cue = { hint: msg, sfx: sound };
  };

  if (platesSatisfied(rt, spec)) {
    if (!rt.platesOn) say("plates", "Both stones sat down. A door moved.", "chime");
    rt.platesOn = true;
  }

  const struck = (x: number, z: number, r: number) => hits.some((h) => Math.hypot(h.x - x, h.z - z) < h.r + r) || Math.hypot(px - x, pz - z) < r;
  const projectile = (x: number, z: number, r: number) => hits.some((h) => Math.hypot(h.x - x, h.z - z) < h.r + r);

  for (const s of spec.switches) {
    if (s.ranged) {
      if (!rt.farOn && projectile(s.x, s.z, 0.9)) {
        rt.farOn = true;
        rt.shortcut = true;
        say("far", "The far eye went dark. A west mouth opened back at the hall.", "chime");
      }
      continue;
    }
    const second = spec.switches.indexOf(s) > 0;
    if (second) continue;
    if (!rt.switchOn && struck(s.x, s.z, 0.85)) {
      rt.switchOn = true;
      say("switch", "The eye went dark. Listen for a key.", "ok");
    }
  }

  for (const k of spec.keys) {
    if (!keyVisible(rt, k)) continue;
    if (Math.hypot(px - k.x, pz - k.z) < 1.2) {
      rt.opened.add(k.id);
      if (k.kind === "boss") {
        rt.hasBoss = true;
        say("bosskey", "A big key. Heavy gold.", "key");
      } else if (k.kind === "key2") {
        rt.hasKey2 = true;
        say("key2", "Another small key.", "key");
      } else {
        rt.hasKey = true;
        say("key", "A small gold key.", "key");
      }
    }
  }

  if (spec.memory && spec.eyes?.length && spec.eyeOrder?.length) {
    const nearRoom = spec.eyes.some((e) => Math.hypot(px - e.x, pz - e.z) < 16);
    if (nearRoom && !rt.memoryReady && rt.memoryI < 0) {
      rt.memoryI = 0;
      rt.memoryT = 0;
      say("watch", "Watch the lights. Then copy them.", "ok");
    }
    if (!rt.memoryReady && rt.memoryI >= 0) {
      rt.memoryT += dt;
      if (rt.memoryT > 0.62) {
        rt.memoryT = 0;
        rt.memoryI += 1;
        if (rt.memoryI >= spec.eyeOrder.length) {
          rt.memoryReady = true;
          rt.memoryI = -1;
          say("copy", "Now you. Same order.", "ok");
        }
      }
    }
  }

  const canHitEyes = !spec.memory || rt.memoryReady;
  if (canHitEyes && spec.eyes && spec.eyeOrder && !rt.eyeOn) {
    for (let i = 0; i < spec.eyes.length; i++) {
      const e = spec.eyes[i]!;
      const latch = `e:${e.id}`;
      const hitNow = hits.some((h) => Math.hypot(h.x - e.x, h.z - e.z) < h.r + 0.7);
      if (!hitNow) {
        rt.hitLatch.delete(latch);
        continue;
      }
      if (rt.hitLatch.has(latch)) continue;
      rt.hitLatch.add(latch);
      if (rt.eyeSeq.includes(i)) continue;
      const res = pushSeq(rt.eyeSeq, i, spec.eyeOrder);
      rt.eyeSeq = res.seq;
      if (res.done) {
        rt.eyeOn = true;
        if (world !== "cavern") rt.switch2On = true;
        say("seq", "That was it. The last door believed you.", "chime");
      } else if (res.ok) {
        blurt("That one was right. Keep going.", "ok");
      } else {
        blurt("Not that one. Look at the pictures on the wall.", "miss");
      }
    }
  }

  if (spec.pads && spec.padOrder && !rt.padOn) {
    let stepped: PadSpot | null = null;
    for (const p of spec.pads) {
      if (Math.hypot(px - p.x, pz - p.z) < 0.95) {
        stepped = p;
        break;
      }
    }
    if (!stepped) {
      rt.lastPadId = null;
    } else if (stepped.id !== rt.lastPadId && now - rt.lastPadT > 280) {
      rt.lastPadId = stepped.id;
      rt.lastPadT = now;
      const res = pushSeq(rt.padSeq, stepped.n, spec.padOrder);
      rt.padSeq = res.seq;
      if (res.done) {
        rt.padOn = true;
        if (world !== "cavern") rt.switch2On = true;
        say("seq", "The numbers sat down. A door moved.", "chime");
      } else if (res.ok) {
        blurt(rt.padSeq.length === 1 ? "A start. Next number." : "Good. Next.", "ok");
      } else {
        blurt("Wrong stone. The wall still knows the order.", "miss");
      }
    }
  }

  if (spec.torches && spec.torchOrder && !rt.switch2On) {
    for (let i = 0; i < spec.torches.length; i++) {
      const t = spec.torches[i]!;
      const latch = `t:${t.id}`;
      const hitNow = hits.some((h) => Math.hypot(h.x - t.x, h.z - t.z) < h.r + 0.65) || Math.hypot(px - t.x, pz - t.z) < 0.8;
      if (!hitNow) {
        rt.hitLatch.delete(latch);
        continue;
      }
      if (rt.hitLatch.has(latch)) continue;
      rt.hitLatch.add(latch);
      if (rt.torchSeq.includes(i)) continue;
      const res = pushSeq(rt.torchSeq, i, spec.torchOrder);
      rt.torchSeq = res.seq;
      if (res.done) {
        rt.switch2On = true;
        say("seq", "All three fires. The door liked the count.", "chime");
      } else if (res.ok) {
        blurt("A fire caught. Next bowl.", "ok");
      } else {
        rt.torchSeq = [];
        blurt("The fires went out. The wall counts them.", "miss");
      }
    }
  }

  if (world !== "cavern" && !rt.switch2On && seqComplete(rt, spec)) rt.switch2On = true;

  if (spec.murals) {
    for (const m of spec.murals) {
      if (Math.hypot(px - m.x, pz - m.z) < 4.8) {
        const id = `mural:${m.caption.slice(0, 18)}`;
        if (!rt.told.has(id)) {
          rt.told.add(id);
          if (!cue.hint) cue = { hint: m.caption, sfx: cue.sfx };
        }
      }
    }
  }

  if (world === "cavern" && pz > 8) {
    say("enter", "Sun Hollow. Gold stone on gold. Fire stone on fire.", null);
  }
  const prizeZ = lastRoomZ(world);
  if (prizeZ && pz < prizeZ + 16) {
    say(
      "prize",
      world === "cavern" || world === "marsh" || world === "crater" ? "The jewel is close." : "The last hall. Walk to the light.",
      null,
    );
  }

  return cue;
}

export function dungeonPrizeWorld(world: WorldId) {
  return world === "cavern" || world === "marsh" || world === "crater";
}
