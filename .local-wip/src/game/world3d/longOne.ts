/** The Long Count — a walking hill. Not a boss. Not marked. */
import { live } from "./live";

export type LongKind = "walk" | "swim" | "hide";
export type LongMode = "walk" | "swim" | "hide" | "look";

export type LongPt = { x: number; z: number; kind: LongKind };

/**
 * Circuit of four lands. Stays off Oakstead’s green.
 * South vale (seen from the tree) → Silverrun swim → Stoneback ridge
 * → vanish behind the west peak → reappear on the woods’ north edge.
 */
export const LONG_PATH: LongPt[] = [
  { x: 96, z: -348, kind: "walk" },
  { x: 210, z: -300, kind: "walk" },
  { x: 310, z: -210, kind: "walk" },
  { x: 400, z: -92, kind: "walk" },
  { x: 538, z: -74, kind: "swim" },
  { x: 680, z: -66, kind: "swim" },
  { x: 858, z: -42, kind: "swim" },
  { x: 1070, z: 44, kind: "swim" },
  { x: 860, z: 160, kind: "walk" },
  { x: 420, z: 280, kind: "walk" },
  { x: 120, z: 390, kind: "walk" },
  { x: -48, z: 520, kind: "walk" },
  { x: -92, z: 740, kind: "walk" },
  { x: -110, z: 888, kind: "hide" },
  { x: -420, z: 240, kind: "walk" },
  { x: -520, z: -40, kind: "walk" },
  { x: -280, z: -240, kind: "walk" },
  { x: -40, z: -360, kind: "walk" },
];

export const LONG_BODY_R = 13.2;
export const LONG_SWIM_R = 10.4;
export const LONG_SCALE = 1.42;

type LongState = {
  i: number;
  u: number;
  x: number;
  z: number;
  y: number;
  yaw: number;
  headYaw: number;
  mode: LongMode;
  lookT: number;
  hideT: number;
  phase: number;
  seen: boolean;
  close: boolean;
  spookT: number;
  speed: number;
  dist: number;
  spoutT: number;
  emerge: boolean;
  lookCool: number;
};

function start(): LongState {
  const a = LONG_PATH[0]!;
  return {
    i: 0,
    u: 0,
    x: a.x,
    z: a.z,
    y: 6,
    yaw: Math.PI * 0.15,
    headYaw: 0,
    mode: "walk",
    lookT: 0,
    hideT: 0,
    phase: 0,
    seen: false,
    close: false,
    spookT: 0,
    speed: 0,
    dist: 999,
    spoutT: 4,
    emerge: false,
    lookCool: 0,
  };
}

let S = start();

export function resetLong() {
  S = start();
}

export function longNow() {
  return S;
}

export function longVisible() {
  return S.mode !== "hide";
}

export type LongWorld = {
  height: (x: number, z: number) => number;
  wet: (x: number, z: number) => number;
  px: number;
  pz: number;
  pyaw: number;
  slash: { x: number; z: number; r?: number } | null;
  boom: { x: number; z: number } | null;
  indoor: boolean;
  song: string;
};

function wrap(i: number) {
  const n = LONG_PATH.length;
  return ((i % n) + n) % n;
}

function ang(a: number, b: number) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function lerpAng(a: number, b: number, t: number) {
  return a + ang(a, b) * Math.min(1, t);
}

export function collideLong(x: number, z: number): { x: number; z: number } | null {
  if (S.mode === "hide") return null;
  const dx = x - S.x;
  const dz = z - S.z;
  const d = Math.hypot(dx, dz);
  const r = S.mode === "swim" ? LONG_SWIM_R : LONG_BODY_R;
  if (d >= r || d < 0.0001) return null;
  const u = r / d;
  return { x: S.x + dx * u, z: S.z + dz * u };
}

export function stepLong(dt: number, w: LongWorld) {
  const cap = Math.min(0.1, dt);
  S.emerge = false;
  const a = LONG_PATH[S.i]!;
  const b = LONG_PATH[wrap(S.i + 1)]!;
  const span = Math.hypot(b.x - a.x, b.z - a.z) || 1;
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const wantYaw = Math.atan2(-dx, -dz);

  S.dist = Math.hypot(w.px - S.x, w.pz - S.z);
  const wetHere = w.wet(S.x, S.z);
  const playerNear = S.dist < 24 && !w.indoor && S.mode !== "hide";
  const playerMid = S.dist < 42 && !w.indoor && S.mode !== "hide";

  if (S.spookT > 0) S.spookT = Math.max(0, S.spookT - cap);
  if (S.lookCool > 0) S.lookCool = Math.max(0, S.lookCool - cap);

  if (S.mode !== "hide") {
    if (w.slash && Math.hypot(w.slash.x - S.x, w.slash.z - S.z) < (w.slash.r ?? 1.2) + 8) {
      S.spookT = Math.max(S.spookT, 3.2);
      S.lookT = 0;
      if (S.mode === "look") S.mode = wetHere > 0.38 || a.kind === "swim" ? "swim" : "walk";
    }
    if (w.boom && Math.hypot(w.boom.x - S.x, w.boom.z - S.z) < 28) {
      S.spookT = Math.max(S.spookT, 4.4);
      S.lookT = 0;
    }
    if (S.dist < 90 && /H$/.test(w.song)) {
      S.lookT = Math.max(S.lookT, 7.5);
    }
  }

  if (S.mode === "hide") {
    S.hideT -= cap;
    S.speed = 0;
    if (S.hideT <= 0) {
      S.i = wrap(S.i + 1);
      S.u = 0;
      const n = LONG_PATH[S.i]!;
      S.x = n.x;
      S.z = n.z;
      S.mode = n.kind === "swim" ? "swim" : "walk";
      S.hideT = 0;
      S.emerge = true;
    }
  } else if (S.lookT > 0 && S.spookT <= 0) {
    S.lookT -= cap;
    S.mode = "look";
    S.speed = 0;
    if (S.lookT <= 0) {
      S.mode = wetHere > 0.38 || a.kind === "swim" ? "swim" : "walk";
      S.lookCool = 18;
    }
  } else {
    const swimming = a.kind === "swim" || b.kind === "swim" || wetHere > 0.4;
    S.mode = swimming ? "swim" : "walk";
    if (playerNear && S.spookT <= 0 && S.dist > 10 && S.lookCool <= 0) {
      S.lookT = 4.8 + Math.min(2.4, (28 - S.dist) * 0.12);
      S.mode = "look";
      S.speed = 0;
    } else {
      const base = swimming ? 5.1 : 6.35;
      const spd = S.spookT > 0 ? base * 1.7 : base;
      S.speed = spd;
      S.u += (spd * cap) / span;
      S.phase += spd * cap * 0.28;
      if (S.u >= 1) {
        S.u -= 1;
        S.i = wrap(S.i + 1);
        const arrived = LONG_PATH[S.i]!;
        if (arrived.kind === "hide") {
          S.mode = "hide";
          S.hideT = 72 + (S.i % 5) * 6;
          S.speed = 0;
          S.u = 0;
        }
      }
    }
  }

  if (S.mode !== "hide") {
    const pa = LONG_PATH[S.i]!;
    const pb = LONG_PATH[wrap(S.i + 1)]!;
    S.x = pa.x + (pb.x - pa.x) * S.u;
    S.z = pa.z + (pb.z - pa.z) * S.u;
    const face = Math.atan2(-(pb.x - pa.x), -(pb.z - pa.z));
    S.yaw = lerpAng(S.yaw, S.mode === "look" ? wantYaw : face, cap * (S.mode === "look" ? 1.4 : 2.2));
  }

  const g = w.height(S.x, S.z);
  const wet = w.wet(S.x, S.z);
  if (S.mode === "swim" || wet > 0.35) {
    S.y = g + 1.6 + wet * 2.8;
  } else {
    S.y = g;
  }

  let head = 0;
  if ((S.mode === "look" || playerMid) && S.mode !== "hide") {
    const toP = Math.atan2(-(w.px - S.x), -(w.pz - S.z));
    head = ang(S.yaw, toP);
    head = Math.max(-0.7, Math.min(0.7, head));
  }
  S.headYaw += (head - S.headYaw) * Math.min(1, cap * 3.2);

  if (!w.indoor && S.mode !== "hide" && S.dist < 400 && S.dist > 14) {
    S.seen = true;
  }
  if (!w.indoor && S.mode !== "hide" && S.dist < 28) {
    S.close = true;
  }

  if (S.mode === "swim") {
    S.spoutT -= cap;
    if (S.spoutT < 0) S.spoutT = 7.2 + (S.i % 3);
  }

  live.longX = S.x;
  live.longZ = S.z;
  live.longY = S.y;
  live.longYaw = S.yaw;
  live.longMode = S.mode;
  live.longSeen = live.longSeen || S.seen;
}
