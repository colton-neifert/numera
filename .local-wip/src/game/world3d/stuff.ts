/**
 * Loose world objects — crates, barrels, logs, rocks, pots, statues, boulders.
 * They push, roll, float, fall, stack, hold plates, block paths, and react
 * to water, explosions, and swords. Puzzles are built from these rules;
 * the game never names the solution.
 */
import { TREE_TRUNK, POND, LOOK_AT, WELL_AT, PATH_CREEK, heightAt, pondU } from "./field";
import { RV, FW, riverCurrent } from "./lands";
import { live } from "./live";
import { LOST } from "../lost";

export type StuffKind = "crate" | "barrel" | "rock" | "log" | "pot" | "statue" | "boulder";

export type StuffEvent =
  | "lift"
  | "throw"
  | "break"
  | "thud"
  | "splash"
  | "plate"
  | "gate"
  | "beam"
  | "smash"
  | "bridge";

export type Stuff = {
  id: string;
  kind: StuffKind;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  yaw: number;
  spin: number;
  hp: number;
  mass: number;
  r: number;
  h: number;
  roll: boolean;
  float: boolean;
  lift: boolean;
  brk: boolean;
  plate: boolean;
  beam: boolean;
  dead: boolean;
  held: boolean;
  wet: boolean;
  cracked: boolean;
  onId: string | null;
  pinned?: boolean;
};

export type Plate = { id: string; x: number; z: number; r: number; need: number; on: boolean };
export type Gate = { id: string; x: number; z: number; hx: number; hz: number; plate?: string; rec?: string; open: boolean };
export type Beam = {
  id: string;
  ox: number;
  oz: number;
  dx: number;
  dz: number;
  hitX: number;
  hitZ: number;
  powered: boolean;
  rec: string;
};
export type Receiver = { id: string; x: number; z: number; r: number; on: boolean };
export type Gap = { id: string; x: number; z: number; hx: number; hz: number; log: string; bridged: boolean };
export type Crack = { id: string; x: number; z: number; hx: number; hz: number; hp: number; dead: boolean };
export type StuffChest = { id: string; x: number; z: number; need: string; coins: number; open: boolean };

export type StuffWorld = {
  things: Stuff[];
  plates: Plate[];
  gates: Gate[];
  beams: Beam[];
  recs: Receiver[];
  gaps: Gap[];
  cracks: Crack[];
  chests: StuffChest[];
};

export type StuffCtx = {
  dt: number;
  t: number;
  px: number;
  py: number;
  pz: number;
  yaw: number;
  speed: number;
  grounded: boolean;
  house: boolean;
  slash: { x: number; z: number; r?: number } | null;
  boom: { x: number; z: number } | null;
  wantUse: boolean;
  heightAt: (x: number, z: number) => number;
  wetAt: (x: number, z: number) => number;
  currentAt: (x: number, z: number) => { vx: number; vz: number } | null;
};

const GRAV = 22;

function kindStats(kind: StuffKind): Pick<Stuff, "hp" | "mass" | "r" | "h" | "roll" | "float" | "lift" | "brk" | "plate" | "beam"> {
  if (kind === "crate") return { hp: 2, mass: 1, r: 0.42, h: 0.7, roll: false, float: true, lift: true, brk: true, plate: true, beam: false };
  if (kind === "barrel") return { hp: 2, mass: 1.1, r: 0.4, h: 0.86, roll: true, float: true, lift: true, brk: true, plate: true, beam: false };
  if (kind === "rock") return { hp: 9, mass: 2.6, r: 0.46, h: 0.62, roll: false, float: false, lift: false, brk: false, plate: true, beam: false };
  if (kind === "log") return { hp: 8, mass: 1.8, r: 0.85, h: 0.44, roll: true, float: true, lift: false, brk: false, plate: false, beam: false };
  if (kind === "pot") return { hp: 1, mass: 0.45, r: 0.26, h: 0.42, roll: false, float: false, lift: true, brk: true, plate: false, beam: false };
  if (kind === "statue") return { hp: 12, mass: 3.4, r: 0.52, h: 1.35, roll: false, float: false, lift: false, brk: false, plate: true, beam: true };
  return { hp: 14, mass: 7, r: 0.78, h: 1.05, roll: true, float: false, lift: false, brk: false, plate: true, beam: false };
}

export function makeThing(id: string, kind: StuffKind, x: number, z: number, extra: Partial<Stuff> = {}): Stuff {
  const s = kindStats(kind);
  return {
    id,
    kind,
    x,
    y: 0,
    z,
    vx: 0,
    vy: 0,
    vz: 0,
    yaw: extra.yaw ?? 0,
    spin: 0,
    dead: false,
    held: false,
    wet: false,
    cracked: extra.cracked ?? false,
    onId: null,
    pinned: extra.pinned ?? false,
    ...s,
    ...extra,
  };
}

export function emptyWorld(): StuffWorld {
  return { things: [], plates: [], gates: [], beams: [], recs: [], gaps: [], cracks: [], chests: [] };
}

/** Landmark spots used by puzzles — keep in one place so hints/dev warp agree. */
export const STUFF_AT = {
  yard: { x: TREE_TRUNK.x + 20.4, z: TREE_TRUNK.z + 2.2 },
  plate: { x: TREE_TRUNK.x + 24.2, z: TREE_TRUNK.z + 2.2 },
  creek: { x: TREE_TRUNK.x - 10.4, z: TREE_TRUNK.z + 18.6 },
  path: { x: PATH_CREEK.x, z: PATH_CREEK.z },
  pond: { x: POND.x + 12.6, z: POND.z + 1.2 },
  isle: { x: POND.x + 3.4, z: POND.z - 5.6 },
  well: { x: WELL_AT.x + 2.6, z: WELL_AT.z + 1.8 },
  look: { x: LOOK_AT.x + 4.2, z: LOOK_AT.z - 6.4 },
  beam: { x: -68, z: 6 },
  boulder: { x: LOOK_AT.x + 10, z: LOOK_AT.z + 26 },
  barrelStop: { x: LOOK_AT.x + 10, z: LOOK_AT.z + 8 },
  crack: { x: LOOK_AT.x + 10, z: LOOK_AT.z - 4.5 },
  ford: { x: RV.ford.x - 12, z: RV.ford.z - 10 },
  wood: { x: FW.gate.x + 8, z: FW.gate.z - 4 },
  snap: { x: TREE_TRUNK.x - 24.4, z: TREE_TRUNK.z + 10.2 },
  millDitch: { x: 16.8, z: -154.6 },
  woodGap: { x: FW.trail.x + 6, z: FW.trail.z - 14 },
};

export function seedMeadow(w: StuffWorld) {
  const Y = STUFF_AT.yard;
  w.things.push(
    makeThing("crate-yard-a", "crate", Y.x - 1.15, Y.z),
    makeThing("crate-yard-b", "crate", Y.x + 0.2, Y.z + 0.85),
    makeThing("rock-yard", "rock", Y.x - 2.4, Y.z + 1.6),
    makeThing("pot-yard", "pot", Y.x - 3.2, Y.z - 1.1),
  );
  w.plates.push({ id: "plate-yard", x: STUFF_AT.plate.x, z: STUFF_AT.plate.z, r: 0.72, need: 0.9, on: false });
  w.gates.push({ id: "gate-yard", x: STUFF_AT.plate.x + 2.4, z: STUFF_AT.plate.z, hx: 0.22, hz: 1.15, plate: "plate-yard", open: false });
  w.chests.push({ id: "chest-yard", x: STUFF_AT.plate.x + 4.1, z: STUFF_AT.plate.z, need: "gate-yard", coins: 15, open: false });

  const C = STUFF_AT.creek;
  w.things.push(makeThing("log-creek", "log", C.x + 5.2, C.z + 5.6, { yaw: Math.PI / 2 }));
  w.things.push(makeThing("crate-creek", "crate", C.x + 3.2, C.z + 1.2));
  w.gaps.push({ id: "gap-creek", x: C.x, z: C.z, hx: 3.4, hz: 0.85, log: "log-creek", bridged: false });

  const P = STUFF_AT.path;
  w.things.push(makeThing("log-path", "log", P.x - 6.8, P.z + 5.4, { yaw: Math.PI / 2 }));
  w.gaps.push({ id: "gap-path", x: P.x, z: P.z, hx: 3.6, hz: 0.92, log: "log-path", bridged: false });

  w.things.push(makeThing("crate-pond", "crate", STUFF_AT.pond.x + 2.8, STUFF_AT.pond.z + 1.6));
  w.things.push(makeThing("rock-pond", "rock", STUFF_AT.pond.x + 1.4, STUFF_AT.pond.z + 0.4));
  w.chests.push({ id: "chest-isle", x: STUFF_AT.isle.x, z: STUFF_AT.isle.z, need: "none", coins: 12, open: false });

  w.things.push(
    makeThing("pot-well-a", "pot", STUFF_AT.well.x, STUFF_AT.well.z),
    makeThing("pot-well-b", "pot", STUFF_AT.well.x - 4.6, STUFF_AT.well.z + 0.4),
    makeThing("pot-well-c", "pot", WELL_AT.x - 1.8, WELL_AT.z - 2.2),
    makeThing("barrel-town", "barrel", WELL_AT.x + 5.4, WELL_AT.z - 0.6),
    makeThing("crate-town", "crate", WELL_AT.x + 6.6, WELL_AT.z + 1.4),
  );

  const L = STUFF_AT.look;
  w.things.push(makeThing("crate-look-a", "crate", L.x, L.z, { brk: false }), makeThing("crate-look-b", "crate", L.x + 1.15, L.z + 0.35, { brk: false }));
  w.chests.push({ id: "chest-look", x: L.x + 0.4, z: L.z + 3.35, need: "stack", coins: 18, open: false });

  w.things.push(makeThing("statue-beam", "statue", STUFF_AT.beam.x, STUFF_AT.beam.z, { yaw: 0 }));
  w.beams.push({
    id: "sun-beam",
    ox: STUFF_AT.beam.x - 8.4,
    oz: STUFF_AT.beam.z,
    dx: 1,
    dz: 0,
    hitX: STUFF_AT.beam.x,
    hitZ: STUFF_AT.beam.z,
    powered: false,
    rec: "rec-beam",
  });
  w.recs.push({ id: "rec-beam", x: STUFF_AT.beam.x, z: STUFF_AT.beam.z + 8.2, r: 0.9, on: false });
  w.gates.push({ id: "gate-beam", x: STUFF_AT.beam.x, z: STUFF_AT.beam.z + 10.2, hx: 1.2, hz: 0.22, rec: "rec-beam", open: false });
  w.chests.push({ id: "chest-beam", x: STUFF_AT.beam.x, z: STUFF_AT.beam.z + 12.4, need: "gate-beam", coins: 20, open: false });

  w.things.push(makeThing("boulder-hill", "boulder", STUFF_AT.boulder.x, STUFF_AT.boulder.z));
  w.things.push(makeThing("barrel-stop", "barrel", STUFF_AT.barrelStop.x - 2.4, STUFF_AT.barrelStop.z));
  w.cracks.push({ id: "crack-hill", x: STUFF_AT.crack.x, z: STUFF_AT.crack.z, hx: 1.35, hz: 0.45, hp: 2, dead: false });
  w.chests.push({ id: "chest-crack", x: STUFF_AT.crack.x, z: STUFF_AT.crack.z - 2.6, need: "crack-hill", coins: 16, open: false });

  w.things.push(makeThing("crate-ford", "crate", STUFF_AT.ford.x, STUFF_AT.ford.z));
  w.things.push(makeThing("log-wood", "log", STUFF_AT.woodGap.x + 5.6, STUFF_AT.woodGap.z + 6.2, { yaw: Math.PI / 2, pinned: true, mass: 8.4 }));
  w.things.push(makeThing("crate-wood", "crate", STUFF_AT.wood.x + 2.4, STUFF_AT.wood.z + 1.2));
  w.things.push(makeThing("pot-wood", "pot", STUFF_AT.wood.x - 1.6, STUFF_AT.wood.z + 0.6));
  w.gaps.push({ id: "gap-wood", x: STUFF_AT.woodGap.x, z: STUFF_AT.woodGap.z, hx: 3.8, hz: 1.0, log: "log-wood", bridged: false });
  w.chests.push({ id: "chest-wood", x: STUFF_AT.woodGap.x, z: STUFF_AT.woodGap.z - 5.2, need: "gap-wood", coins: 18, open: false });

  const S = STUFF_AT.snap;
  w.things.push(makeThing("log-snap", "log", S.x + 5.1, S.z + 6.4, { yaw: Math.PI / 2, pinned: true, mass: 11 }));
  w.things.push(makeThing("rock-snap", "rock", S.x + 6.3, S.z + 6.5));
  w.gaps.push({ id: "gap-snap", x: S.x, z: S.z, hx: 4.3, hz: 1.12, log: "log-snap", bridged: false });
  w.chests.push({ id: "chest-snap", x: S.x - 0.2, z: S.z - 5.4, need: "gap-snap", coins: 24, open: false });

  const M = STUFF_AT.millDitch;
  w.things.push(makeThing("log-mill", "log", M.x + 6.8, M.z + 5.5, { yaw: 0.15, pinned: true, mass: 7.5 }));
  w.gaps.push({ id: "gap-mill", x: M.x, z: M.z, hx: 3.9, hz: 1.05, log: "log-mill", bridged: false });
  w.chests.push({ id: "chest-mill", x: M.x, z: M.z - 4.8, need: "gap-mill", coins: 16, open: false });

  w.things.push(makeThing("crate-lost", "crate", LOST.crate.x + 1.4, LOST.crate.z - 0.8, { yaw: 0.7 }));
  w.things.push(makeThing("log-lost", "log", LOST.creek.x, LOST.creek.z + 3.6, { yaw: Math.PI / 2 }));
  w.gaps.push({ id: "gap-lost", x: LOST.creek.x, z: LOST.creek.z, hx: 3.4, hz: 0.85, log: "log-lost", bridged: false });
}

export function seedCavern(w: StuffWorld) {
  w.things.push(makeThing("pot-cave-a", "pot", 6.4, 14), makeThing("pot-cave-b", "pot", -6.2, 15.2), makeThing("crate-cave", "crate", 8.4, 22));
}

let WORLD: StuffWorld | null = null;
let shoveId: string | null = null;
let seeded = "";

export function stuffWorld(map = "meadow"): StuffWorld {
  if (!WORLD || seeded !== map) {
    WORLD = emptyWorld();
    if (map === "cavern") seedCavern(WORLD);
    else seedMeadow(WORLD);
    seeded = map;
  }
  return WORLD;
}

export function resetStuff() {
  WORLD = null;
  seeded = "";
  shoveId = null;
}

function hypot(ax: number, az: number, bx: number, bz: number) {
  return Math.hypot(ax - bx, az - bz);
}

function groundY(t: Stuff, w: StuffWorld, ctx: StuffCtx) {
  let y = ctx.heightAt(t.x, t.z);
  if (t.onId) {
    const o = w.things.find((x) => x.id === t.onId && !x.dead && !x.held);
    if (o) y = Math.max(y, o.y + o.h);
  }
  return y;
}

export function stepStuff(w: StuffWorld, ctx: StuffCtx): StuffEvent[] {
  const ev: StuffEvent[] = [];
  const dt = Math.min(0.05, ctx.dt);
  shoveId = null;
  if (ctx.house) {
    for (const t of w.things) if (t.held) t.held = false;
    return ev;
  }

  let held = w.things.find((t) => t.held && !t.dead) ?? null;
  if (ctx.wantUse) {
    if (held) {
      const fx = -Math.sin(ctx.yaw);
      const fz = -Math.cos(ctx.yaw);
      held.held = false;
      held.vx = fx * 8.4 + Math.sign(ctx.speed) * 1.4 * fx;
      held.vy = 4.2;
      held.vz = fz * 8.4 + Math.sign(ctx.speed) * 1.4 * fz;
      held.x = ctx.px + fx * 0.7;
      held.z = ctx.pz + fz * 0.7;
      held.y = ctx.py + 1.05;
      held = null;
      ev.push("throw");
    } else {
      let best: Stuff | null = null;
      let bestD = 1.25;
      for (const t of w.things) {
        if (t.dead || !t.lift) continue;
        const d = hypot(ctx.px, ctx.pz, t.x, t.z);
        if (d < bestD) {
          best = t;
          bestD = d;
        }
      }
      if (best) {
        best.held = true;
        best.vx = 0;
        best.vy = 0;
        best.vz = 0;
        best.onId = null;
        held = best;
        ev.push("lift");
      }
    }
  }

  if (held) {
    const fx = -Math.sin(ctx.yaw);
    const fz = -Math.cos(ctx.yaw);
    held.x = ctx.px + fx * 0.35;
    held.z = ctx.pz + fz * 0.35;
    held.y = ctx.py + 1.18;
    held.yaw = ctx.yaw;
    if (ctx.slash && held.brk) {
      breakThing(w, held, ctx, ev);
      held = null;
    }
  }

  for (const t of w.things) {
    if (t.dead || t.held) continue;
    const gy = groundY(t, w, ctx);
    const wet = ctx.wetAt(t.x, t.z);
    const nowWet = wet > 0.28 && t.float;
    if (nowWet && !t.wet) ev.push("splash");
    t.wet = nowWet;

    if (t.wet) {
      t.vy = 0;
      t.y = gy + t.h * 0.28 + Math.sin(ctx.t * 2.1 + t.x * 0.2) * 0.05;
      const cur = ctx.currentAt(t.x, t.z);
      if (cur) {
        t.vx += cur.vx * dt * 1.55;
        t.vz += cur.vz * dt * 1.55;
      }
      t.vx *= Math.exp(-dt * 0.55);
      t.vz *= Math.exp(-dt * 0.55);
    } else {
      t.vy -= GRAV * dt;
      t.y += t.vy * dt;
      if (t.y <= gy) {
        if (t.vy < -6) ev.push("thud");
        t.y = gy;
        t.vy = t.vy < -4 ? -t.vy * 0.22 : 0;
        if (!t.onId) tryStack(w, t);
      }
    }

    const d = hypot(ctx.px, ctx.pz, t.x, t.z);
    const reach = t.r + 0.55;
    if (t.pinned) {
      t.vx = 0;
      t.vz = 0;
    } else if (d < reach && Math.abs(ctx.speed) > 0.7 && ctx.grounded && Math.abs(ctx.py - t.y) < t.h + 0.7) {
      const fx = -Math.sin(ctx.yaw);
      const fz = -Math.cos(ctx.yaw);
      const into = fx * (t.x - ctx.px) + fz * (t.z - ctx.pz) > 0.05;
      if (into) {
        const push = Math.min(9.5, 3.2 + Math.abs(ctx.speed)) / t.mass;
        t.vx += fx * push * dt * 14;
        t.vz += fz * push * dt * 14;
        shoveId = t.id;
        if (t.kind === "statue") {
          const side = (ctx.px - t.x) * fz - (ctx.pz - t.z) * fx;
          t.yaw += side * dt * 1.6;
        }
        if (t.kind === "log") {
          t.yaw += (fx * t.vz - fz * t.vx) * dt * 0.22;
        }
      }
    }

    if (t.roll && !t.wet && !t.pinned) {
      const hx = ctx.heightAt(t.x - 0.45, t.z) - ctx.heightAt(t.x + 0.45, t.z);
      const hz = ctx.heightAt(t.x, t.z - 0.45) - ctx.heightAt(t.x, t.z + 0.45);
      t.vx += (hx * 7.4) / t.mass * dt;
      t.vz += (hz * 7.4) / t.mass * dt;
    }

    if (t.kind === "boulder") {
      const near = hypot(ctx.px, ctx.pz, t.x, t.z) < 16;
      if (near && Math.hypot(t.vx, t.vz) < 0.35 && t.z > STUFF_AT.barrelStop.z - 1) {
        t.vz = -8.2;
        ev.push("thud");
      }
      if (t.z < STUFF_AT.crack.z - 8 && Math.hypot(t.vx, t.vz) < 0.4) {
        t.x = STUFF_AT.boulder.x;
        t.z = STUFF_AT.boulder.z;
        t.vx = 0;
        t.vz = 0;
      }
    }

    t.x += t.vx * dt;
    t.z += t.vz * dt;
    const fric = t.wet ? 0.45 : t.roll ? 0.85 : 2.6;
    t.vx *= Math.exp(-dt * fric);
    t.vz *= Math.exp(-dt * fric);
    t.spin += Math.hypot(t.vx, t.vz) * dt * (t.kind === "log" ? 1.5 : t.roll ? 2.2 : 0.4);

    if (t.onId) {
      const o = w.things.find((x) => x.id === t.onId && !x.dead && !x.held);
      if (o && hypot(t.x, t.z, o.x, o.z) < o.r + t.r + 0.12) {
        t.x += (o.x - t.x) * (1 - Math.exp(-dt * 8));
        t.z += (o.z - t.z) * (1 - Math.exp(-dt * 8));
        t.vx = o.vx;
        t.vz = o.vz;
      } else t.onId = null;
    }
  }

  separate(w);

  if (ctx.boom) {
    for (const t of w.things) {
      if (t.dead || t.held) continue;
      const d = hypot(ctx.boom.x, ctx.boom.z, t.x, t.z);
      if (d < 3.2) {
        const ux = (t.x - ctx.boom.x) / (d || 1);
        const uz = (t.z - ctx.boom.z) / (d || 1);
        const k = (3.2 - d) * 7.5 / t.mass;
        t.vx += ux * k;
        t.vz += uz * k;
        t.vy += 3.4 / t.mass;
        t.onId = null;
        if (t.brk && d < 2.15) breakThing(w, t, ctx, ev);
      }
    }
    for (const c of w.cracks) {
      if (c.dead) continue;
      if (Math.abs(ctx.boom.x - c.x) < c.hx + 1.4 && Math.abs(ctx.boom.z - c.z) < c.hz + 1.4) {
        c.hp -= 2;
        if (c.hp <= 0) {
          c.dead = true;
          ev.push("smash");
        }
      }
    }
  }

  if (ctx.slash) {
    for (const t of w.things) {
      if (t.dead || t.held || !t.brk) continue;
      if (hypot(ctx.slash.x, ctx.slash.z, t.x, t.z) < (ctx.slash.r ?? 1.4) + t.r) {
        t.hp -= 1;
        const ux = (t.x - ctx.px) / (hypot(ctx.px, ctx.pz, t.x, t.z) || 1);
        const uz = (t.z - ctx.pz) / (hypot(ctx.px, ctx.pz, t.x, t.z) || 1);
        t.vx += ux * 3.2;
        t.vz += uz * 3.2;
        if (t.hp <= 0) breakThing(w, t, ctx, ev);
      }
    }
  }

  for (const t of w.things) {
    if (t.dead || t.held || Math.hypot(t.vx, t.vz) < 3.5) continue;
    for (const c of w.cracks) {
      if (c.dead) continue;
      if (Math.abs(t.x - c.x) < c.hx + t.r && Math.abs(t.z - c.z) < c.hz + t.r) {
        c.hp -= t.kind === "boulder" ? 2 : 1;
        t.vx *= -0.2;
        t.vz *= -0.2;
        if (c.hp <= 0) {
          c.dead = true;
          ev.push("smash");
        }
      }
    }
  }

  for (const p of w.plates) {
    let mass = 0;
    for (const t of w.things) {
      if (t.dead || t.held) continue;
      if (!t.plate) continue;
      if (hypot(t.x, t.z, p.x, p.z) < p.r + t.r * 0.4) mass += t.mass;
    }
    if (ctx.grounded && hypot(ctx.px, ctx.pz, p.x, p.z) < p.r + 0.2) mass += 1;
    const on = mass >= p.need;
    if (on && !p.on) ev.push("plate");
    p.on = on;
  }

  for (const g of w.gates) {
    let want = g.open;
    if (g.plate) want = Boolean(w.plates.find((p) => p.id === g.plate)?.on);
    if (g.rec) want = Boolean(w.recs.find((r) => r.id === g.rec)?.on);
    if (want && !g.open) ev.push("gate");
    g.open = want;
  }

  for (const gap of w.gaps) {
    const log = w.things.find((t) => t.id === gap.log && !t.dead);
    const was = gap.bridged;
    gap.bridged = Boolean(log && Math.abs(log.x - gap.x) < gap.hx + 0.4 && Math.abs(log.z - gap.z) < gap.hz + 0.55);
    if (gap.bridged && !was) ev.push("bridge");
  }

  stepBeams(w, ev);
  return ev;
}

function tryStack(w: StuffWorld, t: Stuff) {
  if (t.kind !== "crate" && t.kind !== "barrel") return;
  let best: Stuff | null = null;
  let bestD = t.r + 0.18;
  for (const o of w.things) {
    if (o === t || o.dead || o.held) continue;
    if (o.kind !== "crate" && o.kind !== "barrel" && o.kind !== "rock") continue;
    const d = hypot(t.x, t.z, o.x, o.z);
    if (d < bestD && t.y >= o.y + o.h - 0.25 && t.y <= o.y + o.h + 0.35) {
      best = o;
      bestD = d;
    }
  }
  if (best) {
    t.onId = best.id;
    t.x = best.x;
    t.z = best.z;
    t.vx = 0;
    t.vz = 0;
  }
}

function separate(w: StuffWorld) {
  const list = w.things;
  for (let i = 0; i < list.length; i++) {
    const a = list[i]!;
    if (a.dead || a.held) continue;
    for (let j = i + 1; j < list.length; j++) {
      const b = list[j]!;
      if (b.dead || b.held) continue;
      if (a.onId === b.id || b.onId === a.id) continue;
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const min = a.r + b.r;
      const d2 = dx * dx + dz * dz;
      if (d2 >= min * min || d2 < 1e-8) continue;
      const d = Math.sqrt(d2);
      const nx = dx / d;
      const nz = dz / d;
      const overlap = min - d;
      const am = b.mass / (a.mass + b.mass);
      const bm = a.mass / (a.mass + b.mass);
      a.x -= nx * overlap * am;
      a.z -= nz * overlap * am;
      b.x += nx * overlap * bm;
      b.z += nz * overlap * bm;
      const rel = (a.vx - b.vx) * nx + (a.vz - b.vz) * nz;
      if (rel < 0) {
        const bounce = 0.35;
        const jimp = (-(1 + bounce) * rel) / (1 / a.mass + 1 / b.mass);
        a.vx -= (jimp / a.mass) * nx;
        a.vz -= (jimp / a.mass) * nz;
        b.vx += (jimp / b.mass) * nx;
        b.vz += (jimp / b.mass) * nz;
      }
    }
  }
}

function breakThing(w: StuffWorld, t: Stuff, ctx: StuffCtx, ev: StuffEvent[]) {
  t.dead = true;
  t.held = false;
  t.hp = 0;
  ev.push("break");
}

function stepBeams(w: StuffWorld, ev: StuffEvent[]) {
  for (const r of w.recs) r.on = false;
  for (const b of w.beams) {
    let x = b.ox;
    let z = b.oz;
    let dx = b.dx;
    let dz = b.dz;
    const len = Math.hypot(dx, dz) || 1;
    dx /= len;
    dz /= len;
    b.powered = false;
    b.hitX = x;
    b.hitZ = z;
    let bounced = false;
    for (let i = 0; i < 56; i++) {
      x += dx * 0.38;
      z += dz * 0.38;
      b.hitX = x;
      b.hitZ = z;
      const rec = w.recs.find((r) => r.id === b.rec && hypot(r.x, r.z, x, z) < r.r);
      if (rec) {
        rec.on = true;
        b.powered = true;
        if (!ev.includes("beam")) ev.push("beam");
        break;
      }
      if (!bounced) {
        const st = w.things.find((t) => !t.dead && t.beam && hypot(t.x, t.z, x, z) < t.r + 0.25);
        if (st) {
          const nx = -Math.sin(st.yaw);
          const nz = -Math.cos(st.yaw);
          const dot = dx * nx + dz * nz;
          dx -= 2 * dot * nx;
          dz -= 2 * dot * nz;
          const nlen = Math.hypot(dx, dz) || 1;
          dx /= nlen;
          dz /= nlen;
          x = st.x + dx * (st.r + 0.2);
          z = st.z + dz * (st.r + 0.2);
          bounced = true;
        }
      }
      if (Math.hypot(x - b.ox, z - b.oz) > 22) break;
    }
  }
}

export function collideStuff(nx: number, nz: number, skip?: string | null): { x: number; z: number } | null {
  const w = WORLD;
  if (!w) return null;
  let x = nx;
  let z = nz;
  let hit = false;
  const skipId = skip ?? shoveId;
  for (const t of w.things) {
    if (t.dead || t.held || t.id === skipId) continue;
    if (t.kind === "pot") continue;
    const dx = x - t.x;
    const dz = z - t.z;
    const rad = t.r + (t.mass > 2.4 ? 0.38 : 0.22);
    const d2 = dx * dx + dz * dz;
    if (d2 >= rad * rad || d2 < 1e-8) continue;
    if (t.mass < 2 && d2 > (t.r * 0.6) * (t.r * 0.6)) continue;
    const d = Math.sqrt(d2);
    x = t.x + (dx / d) * rad;
    z = t.z + (dz / d) * rad;
    hit = true;
  }
  for (const g of w.gates) {
    if (g.open) continue;
    const dx = Math.abs(x - g.x);
    const dz = Math.abs(z - g.z);
    if (dx < g.hx + 0.4 && dz < g.hz + 0.4) {
      if (g.hx + 0.4 - dx < g.hz + 0.4 - dz) x = g.x + Math.sign(x - g.x || 1) * (g.hx + 0.4);
      else z = g.z + Math.sign(z - g.z || 1) * (g.hz + 0.4);
      hit = true;
    }
  }
  for (const c of w.cracks) {
    if (c.dead) continue;
    const dx = Math.abs(x - c.x);
    const dz = Math.abs(z - c.z);
    if (dx < c.hx + 0.35 && dz < c.hz + 0.35) {
      if (c.hx + 0.35 - dx < c.hz + 0.35 - dz) x = c.x + Math.sign(x - c.x || 1) * (c.hx + 0.35);
      else z = c.z + Math.sign(z - c.z || 1) * (c.hz + 0.35);
      hit = true;
    }
  }
  for (const gap of w.gaps) {
    if (gap.bridged) continue;
    if (Math.abs(x - gap.x) < gap.hx && Math.abs(z - gap.z) < gap.hz) {
      z = gap.z + Math.sign(z - gap.z || 1) * (gap.hz + 0.05);
      hit = true;
    }
  }
  return hit ? { x, z } : null;
}

export function stuffHeld(): Stuff | null {
  return WORLD?.things.find((t) => t.held && !t.dead) ?? null;
}

export function nearestStuff(px: number, pz: number, max = 1.6): Stuff | null {
  if (!WORLD) return null;
  let best: Stuff | null = null;
  let bestD = max;
  for (const t of WORLD.things) {
    if (t.dead) continue;
    const d = hypot(px, pz, t.x, t.z);
    if (d < bestD) {
      best = t;
      bestD = d;
    }
  }
  return best;
}

export function stuffChestReady(w: StuffWorld, need: string, px = 0, py = 0, pz = 0): boolean {
  if (need === "none") return true;
  if (need === "stack") {
    const a = w.things.find((t) => t.id === "crate-look-a" && !t.dead);
    const b = w.things.find((t) => t.id === "crate-look-b" && !t.dead);
    const stacked = Boolean((a && a.onId === "crate-look-b") || (b && b.onId === "crate-look-a"));
    const L = STUFF_AT.look;
    const gy = heightAt(L.x + 0.4, L.z + 3.35);
    const onLedge = py > gy + 1.05 && Math.hypot(px - (L.x + 0.4), pz - (L.z + 3.35)) < 1.5;
    return stacked || onLedge;
  }
  if (need.startsWith("gate-")) return Boolean(w.gates.find((g) => g.id === need)?.open);
  if (need.startsWith("crack-")) return Boolean(w.cracks.find((c) => c.id === need)?.dead);
  if (need.startsWith("gap-")) return Boolean(w.gaps.find((g) => g.id === need)?.bridged);
  return true;
}

export function tryStuffChest(id: string): number {
  const w = WORLD;
  if (!w) return 0;
  const c = w.chests.find((x) => x.id === id);
  if (!c || c.open) return 0;
  if (!stuffChestReady(w, c.need, live.x, live.y, live.z)) return 0;
  c.open = true;
  return c.coins;
}

export function liveStuffCtx(dt: number, wantUse: boolean): StuffCtx {
  const boom =
    live.lastBoom && live.playT - live.lastBoom.t < 0.12
      ? { x: live.lastBoom.x, z: live.lastBoom.z }
      : null;
  return {
    dt,
    t: live.playT,
    px: live.x,
    py: live.y,
    pz: live.z,
    yaw: live.yaw,
    speed: live.speed,
    grounded: live.grounded,
    house: Boolean(live.house),
    slash: live.slash,
    boom,
    wantUse,
    heightAt,
    wetAt: pondU,
    currentAt: riverCurrent,
  };
}

export function stuffTrapSpots(add: (x: number, z: number, r: number, h: number) => void) {
  if (!WORLD) return;
  for (const t of WORLD.things) {
    if (t.dead || t.held) continue;
    const gy = heightAt(t.x, t.z);
    add(t.x, t.z, t.r + 0.18, t.y + t.h - gy);
  }
  for (const gap of WORLD.gaps) {
    if (!gap.bridged) continue;
    const log = WORLD.things.find((t) => t.id === gap.log && !t.dead);
    if (!log) continue;
    add(log.x, log.z, Math.max(gap.hx, 0.7), log.h + 0.08);
  }
}
