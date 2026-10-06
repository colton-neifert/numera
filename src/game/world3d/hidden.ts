/**
 * Places the map does not name.
 * West of Oakstead the ground rises into an ordinary hill. A notch in that hill
 * drops into a valley. A sheet of water hides a tunnel. The tunnel comes out
 * in an older wood. A lake sits past the north ridge. None of this is a quest.
 */

export const HUSH = { x: -196, z: -228 };
export const HUSH_POOL = { x: -206, z: -228, r: 6.2 };
export const HUSH_FALLS = { x: -216.4, z: -228 };
export const HUSH_TOWER = { x: -196, z: -180 };
export const HUSH_LADDER = { x: -196, z: -183.15, yaw: Math.PI, h: 13.2 };
export const HUSH_LOG = { x: -196, z: -274 };
export const FORGOT = { x: -242, z: -358 };
export const VEIL = { x: -332, z: -148, r: 20 };
export const VEIL_ISLE = { x: -332, z: -146.5 };

/** Short walk behind the falls, then south under the ridge, out among old trees. */
export const CAVE_PATH: [number, number][] = [
  [-220, -228],
  [-230, -228],
  [-230, -252],
  [-228, -278],
  [-234, -314],
  [-236, -344],
];

export const CAVE_HEART = { x: -246, z: -250 };

const RIM_R = 46;
const RIM_H = 13.4;
const BOWL_R = 40;
const BOWL_H = 6.5;

export const DEER_TRAIL: [number, number][] = [
  [-68, -184],
  [-96, -200],
  [-122, -214],
  [-146, -226],
  [-168, -228],
];

export const CLIFF_TRAIL: [number, number][] = [
  [-164, -164],
  [-206, -152],
  [-258, -142],
  [-304, -144],
];

export const SOUTH_TRAIL: [number, number][] = [
  [-190, -248],
  [-196, -266],
  [-196, -286],
  [-214, -318],
  [-236, -348],
];

export const STREAM: [number, number][] = [
  [-206, -228],
  [-192, -226],
  [-180, -222],
  [-170, -216],
];

/** Wet streak outside the notch. It looks like it goes nowhere. */
export const WHISPER: [number, number][] = [
  [-152, -228],
  [-136, -218],
  [-118, -204],
  [-104, -194],
];

export const VEIL_STONES: [number, number][] = Array.from({ length: 7 }, (_, i) => {
  const t = (i + 1) / 8;
  const ang = -0.95 * (1 - t);
  const rad = VEIL.r * 0.84 * (1 - t) + 2.4 * t;
  return [VEIL.x + Math.cos(ang) * rad + Math.sin(t * Math.PI) * 1.6, VEIL.z + Math.sin(ang) * rad];
});

export const HOLLOW = { x: -94, z: -158 };
export const CRACK = { x: -128, z: -258 };
export const WHISPER_END = { x: -104, z: -194 };
/** A pretty falls beside the cliff path. It is not a door. */
export const DECOY_FALLS = { x: -228, z: -162 };
export const SHELF = { x: 140, z: 276 };
export const UNDER_BRIDGE = { x: -184, z: -221.4 };
export const HAMLET = { x: -172, z: -252 };

/** Round room. The dark stone is last. Not a sign. */
export const CAVE_PLATES: [number, number][] = [
  [-226.2, -246.4],
  [-226.2, -253.6],
  [-233.4, -250],
];

export const FORGOT_TRUNKS: [number, number][] = [
  [-254, -368],
  [-226, -372],
  [-258, -346],
  [-222, -342],
  [-250, -336],
  [-230, -332],
];

export const MOUTH_ROCKS: [number, number, number][] = [
  [-148.5, -223.6, 2.05],
  [-150.2, -232.6, 2.2],
];

function hypot(x: number, z: number, x1: number, z1: number) {
  const dx = x - x1;
  const dz = z - z1;
  return Math.hypot(dx, dz);
}

function distSeg(x: number, z: number, ax: number, az: number, bx: number, bz: number) {
  const dx = bx - ax;
  const dz = bz - az;
  const len2 = dx * dx + dz * dz || 1;
  let t = ((x - ax) * dx + (z - az) * dz) / len2;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const px = ax + dx * t;
  const pz = az + dz * t;
  return { d: Math.hypot(x - px, z - pz), t };
}

function gapCut(ang: number) {
  const a = Math.abs(ang);
  let e = 0;
  if (a < 0.14) e = 1;
  else if (a < 0.28) e = (0.28 - a) / 0.14;
  let south = Math.abs(ang + Math.PI / 2);
  if (south > Math.PI) south = Math.PI * 2 - south;
  let s = 0;
  if (south < 0.085) s = 1;
  else if (south < 0.16) s = (0.16 - south) / 0.075;
  return e > s ? e : s;
}

/** 1 along the tunnel centre, 0 outside the rock. Wider in the chamber and the alcove. */
export function caveU(x: number, z: number) {
  let best = 0;
  const pts = CAVE_PATH;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]!;
    const b = pts[i + 1]!;
    const hit = distSeg(x, z, a[0], a[1], b[0], b[1]);
    const half = i === 0 ? 2.5 : 3.15;
    const u = 1 - Math.max(0, hit.d - 0.35) / half;
    if (u > best) best = u;
  }
  const chamber = hypot(x, z, -230, -250);
  if (chamber < 9) {
    const u = 1 - chamber / 9;
    if (u > best) best = u;
  }
  const alcove = hypot(x, z, CAVE_HEART.x, CAVE_HEART.z);
  if (alcove < 4.4) {
    const u = 1 - alcove / 4.4;
    if (u > best) best = u;
  }
  // The side room stays connected. Stones in the throat, not the height, keep it shut.
  const spur = distSeg(x, z, -230, -250, CAVE_HEART.x, CAVE_HEART.z);
  const su = 1 - Math.max(0, spur.d - 0.25) / 2.2;
  if (su > best) best = su;
  return best < 0 ? 0 : best > 1 ? 1 : best;
}

/** 0 at the falls mouth, 1 at the root exit. */
export function caveT(x: number, z: number) {
  const pts = CAVE_PATH;
  let bestD = 1e9;
  let along = 0;
  let walked = 0;
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]!;
    const b = pts[i + 1]!;
    total += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  let acc = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]!;
    const b = pts[i + 1]!;
    const seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const hit = distSeg(x, z, a[0], a[1], b[0], b[1]);
    if (hit.d < bestD) {
      bestD = hit.d;
      along = acc + seg * hit.t;
    }
    acc += seg;
  }
  walked = total || 1;
  const t = along / walked;
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

function runSink(x: number, z: number, pts: [number, number][], half: number, depth: number) {
  let best = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]!;
    const b = pts[i + 1]!;
    const d = distSeg(x, z, a[0], a[1], b[0], b[1]).d;
    const u = 1 - Math.max(0, d - half * 0.25) / half;
    if (u > best) best = u;
  }
  if (best <= 0) return 0;
  return best * best * depth;
}

function veilSink(x: number, z: number) {
  const d = hypot(x, z, VEIL.x, VEIL.z);
  if (d > VEIL.r + 14) return 0;
  let s = 0;
  if (d < VEIL.r) {
    const u = 1 - d / VEIL.r;
    s = u * u * 2.65;
  }
  const id = hypot(x, z, VEIL_ISLE.x, VEIL_ISLE.z);
  if (id < 7.4) {
    const k = 0.5 + 0.5 * Math.cos(Math.min(1, id / 7.4) * Math.PI);
    s -= k * 4.15;
  }
  for (let i = 0; i < VEIL_STONES.length; i++) {
    const st = VEIL_STONES[i]!;
    const sd = hypot(x, z, st[0], st[1]);
    if (sd < 0.95) {
      const k = 1 - sd / 0.95;
      s = s * (1 - k) + -0.2 * k;
    }
  }
  return s;
}

/** Added to field height. Positive is up. */
export function hushDelta(x: number, z: number) {
  const dx = x - HUSH.x;
  const dz = z - HUSH.z;
  const d = Math.hypot(dx, dz);
  let delta = 0;
  if (d < 82) {
    const ang = Math.atan2(dz, dx);
    const cut = gapCut(ang);
    const band = Math.exp(-((d - RIM_R) * (d - RIM_R)) / (2 * 7.4 * 7.4));
    const rim = RIM_H * band * (1 - cut * 0.94);
    let bowl = 0;
    if (d < BOWL_R) {
      const u = 0.5 + 0.5 * Math.cos((d / BOWL_R) * Math.PI);
      bowl = BOWL_H * u;
    }
    delta = rim - bowl;
  }
  const pd = hypot(x, z, HUSH_POOL.x, HUSH_POOL.z);
  if (pd < HUSH_POOL.r) {
    const u = 0.5 + 0.5 * Math.cos((pd / HUSH_POOL.r) * Math.PI);
    delta -= u * 1.55;
  }
  delta -= runSink(x, z, STREAM, 1.15, 0.55);
  delta -= runSink(x, z, WHISPER, 0.85, 0.32);
  delta -= veilSink(x, z);
  const fd = hypot(x, z, FORGOT.x, FORGOT.z);
  if (fd < 34) {
    const u = 0.5 + 0.5 * Math.cos((fd / 34) * Math.PI);
    delta -= u * 1.45;
  }
  const cu = caveU(x, z);
  if (cu > 0.001) {
    const t = caveT(x, z);
    const target = -5.7 * (1 - t) * (1 - t * 0.2);
    delta = delta * (1 - cu) + target * cu;
  }
  // Bridge deck stays dry where the underground river crosses the chamber.
  if (Math.abs(x + 230) < 1.35 && Math.abs(z + 250) < 7.5 && caveU(x, z) > 0.4) {
    const t = caveT(x, z);
    const target = -4.35 * (1 - t);
    if (delta < target) delta = target;
  }
  return delta;
}

/** Deep enough to swim. The falls lip and the stepping stones are not in here. */
export function hushSwimU(x: number, z: number) {
  const pd = hypot(x, z, HUSH_POOL.x, HUSH_POOL.z);
  const pool = pd < HUSH_POOL.r * 0.78 ? 1 - pd / (HUSH_POOL.r * 0.78) : 0;
  const d = hypot(x, z, VEIL.x, VEIL.z);
  if (d > VEIL.r * 0.9) return pool;
  if (hypot(x, z, VEIL_ISLE.x, VEIL_ISLE.z) < 5.3) return pool;
  for (let i = 0; i < VEIL_STONES.length; i++) {
    const st = VEIL_STONES[i]!;
    if (hypot(x, z, st[0], st[1]) < 0.85) return pool;
  }
  const veil = 1 - d / (VEIL.r * 0.9);
  return veil > pool ? veil : pool;
}

/** Shallow water: splash, but you keep your feet. */
export function hushShallow(x: number, z: number) {
  if (hushSwimU(x, z) > 0.2) return false;
  if (runSink(x, z, STREAM, 1.15, 0.55) > 0.18) return true;
  if (runSink(x, z, WHISPER, 0.85, 0.32) > 0.12) return true;
  if (Math.abs(z + 250) < 2.4 && Math.abs(x + 230) < 8 && Math.abs(x + 230) > 1.5 && caveU(x, z) > 0.45) return true;
  return false;
}

/** Sand tint for the wet streak and the valley stream banks. */
export function hushBank(x: number, z: number) {
  const s = runSink(x, z, STREAM, 2.1, 1);
  const w = runSink(x, z, WHISPER, 1.6, 1);
  return s > w ? s : w;
}

export type HiddenMood = "" | "hush" | "cave" | "forgot" | "veil";

export function hiddenMood(x: number, z: number): HiddenMood {
  const cu = caveU(x, z);
  if (cu > 0.52 && caveT(x, z) < 0.92) return "cave";
  if (Math.hypot(x - HUSH.x, z - HUSH.z) < 37) return "hush";
  if (Math.hypot(x - FORGOT.x, z - FORGOT.z) < 28) return "forgot";
  if (Math.hypot(x - VEIL.x, z - VEIL.z) < VEIL.r + 5) return "veil";
  return "";
}

type Margins = { hush?: number; cave?: number; veil?: number; forgot?: number; log?: number; plates?: number };

const marked = new Set<string>();

function readMargins(): Margins {
  try {
    if (typeof localStorage === "undefined") return {};
    const raw = localStorage.getItem("numeria-margins");
    return raw ? (JSON.parse(raw) as Margins) : {};
  } catch {
    return {};
  }
}

function writeMargins(m: Margins) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem("numeria-margins", JSON.stringify(m));
  } catch {
    /* private mode */
  }
}

export function seenHush() {
  return readMargins().hush === 1;
}

export function seenCave() {
  return readMargins().cave === 1;
}

export function seenVeil() {
  return readMargins().veil === 1;
}

export function markMargin(id: "hush" | "cave" | "veil" | "forgot") {
  if (marked.has(id)) return;
  const m = readMargins();
  if (m[id] === 1) {
    marked.add(id);
    return;
  }
  m[id] = 1;
  writeMargins(m);
  marked.add(id);
}

let logGone = false;
let logLoaded = false;

export function hushLogCleared() {
  if (!logLoaded) {
    logLoaded = true;
    logGone = readMargins().log === 1;
  }
  return logGone;
}

export function clearHushLog() {
  logGone = true;
  logLoaded = true;
  const m = readMargins();
  m.log = 1;
  writeMargins(m);
}

let platesOpen = false;
let platesLoaded = false;

export function cavePlatesOpen() {
  if (!platesLoaded) {
    platesLoaded = true;
    platesOpen = readMargins().plates === 1;
  }
  return platesOpen;
}

export function openCavePlates() {
  platesOpen = true;
  platesLoaded = true;
  const m = readMargins();
  if (m.plates === 1) return;
  m.plates = 1;
  writeMargins(m);
}

function pushOut(x: number, z: number, cx: number, cz: number, r: number) {
  const dx = x - cx;
  const dz = z - cz;
  const d2 = dx * dx + dz * dz;
  if (d2 >= r * r || d2 < 1e-6) return null;
  const d = Math.sqrt(d2);
  return { x: cx + (dx / d) * r, z: cz + (dz / d) * r };
}

/** Solid things that are not terrain: the notch stones, the fallen trunk, a few walls. */
export function collideHidden(nx: number, nz: number) {
  let x = nx;
  let z = nz;
  let hit = false;
  for (let i = 0; i < MOUTH_ROCKS.length; i++) {
    const r = MOUTH_ROCKS[i]!;
    const p = pushOut(x, z, r[0], r[1], r[2] * 0.82);
    if (p) {
      x = p.x;
      z = p.z;
      hit = true;
    }
  }
  // Falls cliff, with a hole in the middle.
  if (Math.abs(z - HUSH_FALLS.z) > 2.15) {
    const p = pushOut(x, z, -221.6, z < HUSH_FALLS.z ? -234 : -222, 3.1);
    if (p) {
      x = p.x;
      z = p.z;
      hit = true;
    }
  }
  if (!hushLogCleared()) {
    for (let i = -3; i <= 3; i++) {
      const p = pushOut(x, z, HUSH_LOG.x + i * 1.15, HUSH_LOG.z, 0.85);
      if (p) {
        x = p.x;
        z = p.z;
        hit = true;
      }
    }
  }
  const shack = [
    [-237.2, -353.2, 1.15],
    [-230.6, -353.2, 1.15],
    [-237.4, -349.2, 0.85],
    [-230.4, -349.2, 0.85],
  ];
  for (let i = 0; i < shack.length; i++) {
    const s = shack[i]!;
    const p = pushOut(x, z, s[0], s[1], s[2]);
    if (p) {
      x = p.x;
      z = p.z;
      hit = true;
    }
  }
  const tower = pushOut(x, z, HUSH_TOWER.x, HUSH_TOWER.z, 1.25);
  if (tower) {
    x = tower.x;
    z = tower.z;
    hit = true;
  }
  // West cliff bites so the sheet is the way in, not a walk around the lip.
  for (const c of [
    [-223.2, -214.5, 2.2],
    [-223.2, -241.5, 2.2],
  ] as [number, number, number][]) {
    const p = pushOut(x, z, c[0], c[1], c[2]);
    if (p) {
      x = p.x;
      z = p.z;
      hit = true;
    }
  }
  const cu = caveU(x, z);
  const ct = caveT(x, z);
  if (cu > 0.16 && ct > 0.07 && ct < 0.92) {
    const pts = CAVE_PATH;
    for (let i = 1; i < pts.length - 1; i++) {
      const a = pts[i]!;
      const b = pts[i + 1]!;
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      const len = Math.hypot(dx, dz) || 1;
      const rx = -dz / len;
      const rz = dx / len;
      const steps = Math.max(1, Math.round(len / 3.4));
      for (let s = 0; s <= steps; s++) {
        const u = s / steps;
        const cx = a[0] + dx * u;
        const cz = a[1] + dz * u;
        if (Math.hypot(cx + 230, cz + 250) < 7.6) continue;
        if (Math.hypot(cx - CAVE_HEART.x, cz - CAVE_HEART.z) < 4.4) continue;
        for (const side of [-1, 1]) {
          const p = pushOut(x, z, cx + rx * side * 2.35, cz + rz * side * 2.35, 1.02);
          if (p) {
            x = p.x;
            z = p.z;
            hit = true;
          }
        }
      }
    }
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      const gap = (target: number, half: number) => {
        let da = Math.abs(ang - target);
        if (da > Math.PI) da = Math.PI * 2 - da;
        return da < half;
      };
      if (gap(Math.PI, 0.48) || gap(Math.PI / 2, 0.42) || gap(-Math.PI / 2, 0.42)) continue;
      const p = pushOut(x, z, -230 + Math.cos(ang) * 6.55, -250 + Math.sin(ang) * 6.55, 1.12);
      if (p) {
        x = p.x;
        z = p.z;
        hit = true;
      }
    }
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const ad = Math.abs(ang);
      if (ad < 0.62 || ad > Math.PI * 2 - 0.62) continue;
      const p = pushOut(x, z, CAVE_HEART.x + Math.cos(ang) * 3.05, CAVE_HEART.z + Math.sin(ang) * 3.05, 0.92);
      if (p) {
        x = p.x;
        z = p.z;
        hit = true;
      }
    }
    if (!cavePlatesOpen()) {
      for (const b of [
        [-236.2, -250, 1.12],
        [-238.2, -248.75, 1.02],
        [-238.2, -251.25, 1.02],
      ] as [number, number, number][]) {
        const p = pushOut(x, z, b[0], b[1], b[2]);
        if (p) {
          x = p.x;
          z = p.z;
          hit = true;
        }
      }
    }
  }
  // Hollow trunk. East side is open.
  {
    const dx = x - HOLLOW.x;
    const dz = z - HOLLOW.z;
    const d = Math.hypot(dx, dz);
    if (d > 0.82 && d < 1.62) {
      const ang = Math.atan2(dz, dx);
      const gap = Math.abs(ang) < 0.58;
      if (!gap) {
        const target = d - 0.82 < 1.62 - d ? 0.8 : 1.64;
        x = HOLLOW.x + (dx / d) * target;
        z = HOLLOW.z + (dz / d) * target;
        hit = true;
      }
    }
  }
  for (const c of [
    [CRACK.x + 0.8, CRACK.z + 1.55, 1.12],
    [CRACK.x + 0.8, CRACK.z - 1.55, 1.12],
    [CRACK.x - 2.3, CRACK.z + 1.7, 0.95],
    [CRACK.x - 2.3, CRACK.z - 1.7, 0.95],
  ] as [number, number, number][]) {
    const p = pushOut(x, z, c[0], c[1], c[2]);
    if (p) {
      x = p.x;
      z = p.z;
      hit = true;
    }
  }
  for (const c of [
    [WHISPER_END.x, WHISPER_END.z - 1.3, 1.15],
    [WHISPER_END.x - 1.4, WHISPER_END.z + 0.4, 1.25],
    [DECOY_FALLS.x - 1.6, DECOY_FALLS.z, 1.7],
    [DECOY_FALLS.x - 0.4, DECOY_FALLS.z - 2.4, 1.15],
    [DECOY_FALLS.x - 0.4, DECOY_FALLS.z + 2.4, 1.15],
  ] as [number, number, number][]) {
    const p = pushOut(x, z, c[0], c[1], c[2]);
    if (p) {
      x = p.x;
      z = p.z;
      hit = true;
    }
  }
  for (let i = 0; i < FORGOT_TRUNKS.length; i++) {
    const t = FORGOT_TRUNKS[i]!;
    const p = pushOut(x, z, t[0], t[1], 0.72);
    if (p) {
      x = p.x;
      z = p.z;
      hit = true;
    }
  }
  return hit ? { x, z } : null;
}
