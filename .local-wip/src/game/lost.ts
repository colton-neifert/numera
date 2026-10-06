/** Nim runs. You do not. The vale keeps the long way. */
import { live } from "./world3d/live";
import { useGame } from "./store";
import { sfx } from "./audio";
import { takeCipher } from "./cipher";
import { revealItem } from "./items";

export type LostPhase = "off" | "bolt" | "search" | "den" | "open" | "done";

export const LOST = {
  scent: { x: -88, z: -22 },
  tracks: { x: -112, z: -36 },
  crate: { x: -136, z: -48 },
  fur: { x: -152, z: -58 },
  hole: { x: -168, z: -64 },
  detour: { x: -178, z: -84 },
  creek: { x: -208, z: -96 },
  den: { x: -236, z: -108 },
  cage: { x: -236, z: -122 },
  foes: [
    { id: "lost-e0", x: -232, z: -105, seed: 41 },
    { id: "lost-e1", x: -240, z: -107, seed: 47 },
  ],
};

export const DEN = {
  hw: 4.4,
  front: LOST.den.z,
  back: LOST.cage.z - 6.2,
  bars: LOST.cage.z + 2.15,
};

const HOLE_R = 0.72;
const WALL = 0.48;
const THICKET_X = -174;
const THICKET_Z = -50;
const THICKET_SOUTH = -72;
const THICKET_EAST = -156;

export type LostSnap = {
  phase: LostPhase;
  talked: boolean;
  latch: boolean;
  yipT: number;
  seen: Record<string, boolean>;
};

export const lost: LostSnap = {
  phase: "off",
  talked: false,
  latch: false,
  yipT: -40,
  seen: {},
};

export function lostAway() {
  const n = useGame.getState().quests?.lost ?? 0;
  return n >= 1 && n < 3;
}

export function lostDone() {
  return (useGame.getState().quests?.lost ?? 0) >= 3 || lost.phase === "done";
}

export function lostSearching() {
  return lost.phase === "search" || lost.phase === "den" || lost.phase === "open";
}

export function lostReady() {
  if (lostDone() || lost.phase !== "off") return false;
  const g = useGame.getState();
  if ((g.quests?.lost ?? 0) >= 1) return false;
  if ((g.quests?.nim ?? 0) < 1) return false;
  if (!g.hasSword) return false;
  if (live.house || live.dungeon || live.cave || live.below || live.talking) return false;
  if (live.chaseOn || live.festAct) return false;
  return Math.hypot(live.x - LOST.scent.x, live.z - LOST.scent.z) < 6.8;
}

export function beginBolt(force = false) {
  if (!force && !lostReady()) return false;
  if (!force && (lostDone() || lost.phase !== "off")) return false;
  const g = useGame.getState();
  if ((g.quests?.nim ?? 0) < 1 && !force) return false;
  lost.phase = "bolt";
  lost.talked = false;
  lost.latch = false;
  lost.yipT = live.playT;
  lost.seen = {};
  live.nimFollow = false;
  live.banner = "Nim ran.";
  live.bannerSub = "West. Then a hole.";
  live.listen = "Wait. That is not a vale smell.";
  sfx.yelp();
  g.setQuest("lost", 1);
  return true;
}

export function finishBolt() {
  if (lost.phase !== "bolt") return false;
  lost.phase = "search";
  live.listen = "A yelp. Then dirt. The hole is fox-sized.";
  sfx.yelp();
  return true;
}

export function markDen() {
  if (lost.phase !== "search" && lost.phase !== "den") return false;
  lost.phase = "den";
  const n = useGame.getState().quests?.lost ?? 0;
  if (n < 2) useGame.getState().setQuest("lost", 2);
  return true;
}

export function talkCage() {
  if (lost.phase !== "den" && lost.phase !== "open") return false;
  lost.talked = true;
  const n = useGame.getState().quests?.lost ?? 0;
  if (n < 2) useGame.getState().setQuest("lost", 2);
  live.listen =
    "I counted the bars. I cannot count them open. The wood is a latch. I am not pointing.";
  sfx.yelp();
  return true;
}

export function smashLatch() {
  if (lost.latch || lost.phase === "done" || lost.phase === "off") return false;
  if (!lost.talked) {
    live.listen = live.listen || "I am still in here. Talk. Then the wood.";
    return false;
  }
  lost.latch = true;
  lost.phase = "open";
  reunite();
  return true;
}

export function reunite() {
  if (lost.phase === "done") return false;
  lost.phase = "done";
  lost.latch = true;
  live.nimFollow = true;
  const g = useGame.getState();
  g.setQuest("lost", 3);
  if (g.grantHeartContainer("lost-fox")) revealItem("container");
  takeCipher("lost-lamp", false);
  live.getItem = "container";
  live.getTitle = "You got a Heart Container!";
  live.getBlurb = "I counted. You came. Do not make me say it twice.";
  live.banner = "Nim";
  live.bannerSub = "She counted. You came.";
  live.listen = "I counted. You came. Do not make me say it twice.";
  sfx.ok();
  return true;
}

export function hydrateLost() {
  const n = useGame.getState().quests?.lost ?? 0;
  if (n >= 3) {
    lost.phase = "done";
    lost.latch = true;
    lost.talked = true;
    live.nimFollow = (useGame.getState().quests?.nim ?? 0) >= 1;
    return;
  }
  if (n >= 2) {
    lost.phase = "den";
    live.nimFollow = false;
    return;
  }
  if (n >= 1) {
    lost.phase = lost.phase === "bolt" ? "bolt" : "search";
    live.nimFollow = false;
    return;
  }
  if (lost.phase !== "bolt") {
    lost.phase = "off";
    lost.talked = false;
    lost.latch = false;
  }
}

export function noteClue(id: string, line: string) {
  if (lost.seen[id]) return false;
  lost.seen[id] = true;
  live.listen = live.listen || line;
  return true;
}

export function lostYip(now: number) {
  if (!lostSearching() || lost.phase === "done") return false;
  if (now - lost.yipT < 16) return false;
  const d = Math.hypot(live.x - LOST.den.x, live.z - LOST.den.z);
  if (d > 92 || d < 10) return false;
  lost.yipT = now;
  live.listen = live.listen || "A small yip. West. Then dirt.";
  sfx.yelp();
  return true;
}

function pushSeg(
  nx: number,
  nz: number,
  ax: number,
  az: number,
  bx: number,
  bz: number,
  half: number,
): { x: number; z: number } | null {
  const abx = bx - ax;
  const abz = bz - az;
  const len = Math.hypot(abx, abz) || 1;
  const ux = abx / len;
  const uz = abz / len;
  const t = Math.max(0, Math.min(len, (nx - ax) * ux + (nz - az) * uz));
  const cx = ax + ux * t;
  const cz = az + uz * t;
  const dx = nx - cx;
  const dz = nz - cz;
  const d = Math.hypot(dx, dz);
  if (d >= half) return null;
  if (d < 1e-6) return { x: cx - uz * half, z: cz + ux * half };
  const u = half / d;
  return { x: cx + dx * u, z: cz + dz * u };
}

function pushCircle(nx: number, nz: number, cx: number, cz: number, r: number): { x: number; z: number } | null {
  const dx = nx - cx;
  const dz = nz - cz;
  const d = Math.hypot(dx, dz);
  if (d >= r) return null;
  if (d < 1e-6) return { x: cx + r, z: cz };
  const u = r / d;
  return { x: cx + dx * u, z: cz + dz * u };
}

export function collideLostAt(
  nx: number,
  nz: number,
  cageOn: boolean,
): { x: number; z: number } | null {
  let x = nx;
  let z = nz;
  let hit = false;
  const hole = pushCircle(x, z, LOST.hole.x, LOST.hole.z, HOLE_R);
  if (hole) {
    x = hole.x;
    z = hole.z;
    hit = true;
  }
  const thicket = [
    { ax: THICKET_X, az: THICKET_SOUTH, bx: THICKET_X, bz: THICKET_Z },
    { ax: THICKET_X, az: THICKET_Z, bx: THICKET_EAST, bz: THICKET_Z },
  ];
  for (const s of thicket) {
    const p = pushSeg(x, z, s.ax, s.az, s.bx, s.bz, WALL + 0.35);
    if (p) {
      x = p.x;
      z = p.z;
      hit = true;
    }
  }
  const cx = LOST.den.x;
  const denSegs = [
    { ax: cx - DEN.hw, az: DEN.front, bx: cx - DEN.hw, bz: DEN.back },
    { ax: cx + DEN.hw, az: DEN.front, bx: cx + DEN.hw, bz: DEN.back },
    { ax: cx - DEN.hw, az: DEN.back, bx: cx + DEN.hw, bz: DEN.back },
  ];
  for (const s of denSegs) {
    const p = pushSeg(x, z, s.ax, s.az, s.bx, s.bz, WALL);
    if (p) {
      x = p.x;
      z = p.z;
      hit = true;
    }
  }
  if (cageOn) {
    const gap = 0.82;
    const bars = [
      { ax: cx - DEN.hw + 0.2, az: DEN.bars, bx: cx - gap, bz: DEN.bars },
      { ax: cx + gap, az: DEN.bars, bx: cx + DEN.hw - 0.2, bz: DEN.bars },
    ];
    for (const s of bars) {
      const p = pushSeg(x, z, s.ax, s.az, s.bx, s.bz, 0.32);
      if (p) {
        x = p.x;
        z = p.z;
        hit = true;
      }
    }
  }
  return hit ? { x, z } : null;
}

export function collideLost(nx: number, nz: number) {
  if (live.house || live.below) return null;
  const cageOn = lost.phase === "search" || lost.phase === "den";
  return collideLostAt(nx, nz, cageOn);
}

export function holeTooSmall(x: number, z: number) {
  return Math.hypot(x - LOST.hole.x, z - LOST.hole.z) < HOLE_R;
}
