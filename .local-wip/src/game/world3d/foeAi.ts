/** Field-lizard brains. Same mesh, different manners. */

export type FoeStyle = "rush" | "circle" | "lunge" | "guard" | "skitter";
export type FoePose = "walk" | "idle" | "chase" | "swipe" | "hiss" | "guard";

export function styleOf(kind: string): FoeStyle {
  if (kind === "timesprout") return "circle";
  if (kind === "driplet" || kind === "emberling") return "lunge";
  if (kind === "glyphite" || kind === "warden") return "guard";
  if (kind === "sandwight" || kind === "umbral") return "skitter";
  return "rush";
}

export function aggroRange(style: FoeStyle) {
  if (style === "circle") return 16.4;
  if (style === "lunge") return 13.2;
  if (style === "guard") return 10.8;
  if (style === "skitter") return 15.2;
  return 13.6;
}

export function dropRange(style: FoeStyle) {
  return aggroRange(style) + 8.4;
}

/** Oakstead is a town. Lizards do not hunt the square. */
export function villageSafe(
  foeX: number,
  foeZ: number,
  heroX: number,
  heroZ: number,
  inV: (x: number, z: number) => boolean,
) {
  return inV(foeX, foeZ) || inV(heroX, heroZ);
}

export function hitKnock(dx: number, dz: number, d: number, power = 7.6) {
  const n = Math.max(0.001, d);
  return { vx: -(dx / n) * power, vz: -(dz / n) * power, t: 0.3 };
}

export type FoeState = {
  x: number;
  z: number;
  yaw: number;
  pose: FoePose;
  aggro: boolean;
  patrolT: number;
  lungeT: number;
};

function moveToward(
  s: FoeState,
  tx: number,
  tz: number,
  speed: number,
  dt: number,
  face = true,
): number {
  const mx = tx - s.x;
  const mz = tz - s.z;
  const md = Math.hypot(mx, mz);
  if (md > 0.04) {
    const step = Math.min(md, speed * dt);
    s.x += (mx / md) * step;
    s.z += (mz / md) * step;
    if (face) s.yaw = Math.atan2(-mx, -mz);
  }
  return md;
}

export function stepFoe(
  s: FoeState,
  opt: {
    style: FoeStyle;
    dt: number;
    hx: number;
    hz: number;
    seed: number;
    playT: number;
    homeX: number;
    homeZ: number;
    safe: boolean;
    hide: boolean;
    hunt: number;
  },
): FoeState {
  const dt = opt.dt;
  const dx = opt.hx - s.x;
  const dz = opt.hz - s.z;
  const d = Math.hypot(dx, dz);
  const style = opt.style;
  const hunt = Math.max(0.35, opt.hunt);

  if (opt.safe) {
    s.aggro = false;
    s.pose = "walk";
    const pr = 1.6 + (opt.seed % 3) * 0.35;
    s.patrolT += dt * 0.45;
    const tx = opt.homeX + Math.cos(s.patrolT + opt.seed) * pr;
    const tz = opt.homeZ + Math.sin(s.patrolT * 0.85 + opt.seed) * pr;
    const md = moveToward(s, tx, tz, 0.85, dt);
    if (md < 0.25) s.pose = "idle";
    return s;
  }

  if (opt.hide && d > 5.4 && !s.aggro) {
    s.pose = "idle";
    s.yaw += Math.sin(opt.playT * 0.7 + opt.seed) * dt * 0.4;
    return s;
  }

  if (d < aggroRange(style)) s.aggro = true;
  if (d > dropRange(style)) s.aggro = false;

  if (!s.aggro) {
    s.patrolT += dt;
    const pr = 2.3 + (opt.seed % 4) * 0.45;
    const tx = opt.homeX + Math.cos(s.patrolT * 0.58 + opt.seed) * pr;
    const tz = opt.homeZ + Math.sin(s.patrolT * 0.58 + opt.seed * 1.3) * pr;
    const md = moveToward(s, tx, tz, 1.15, dt);
    s.pose = md > 0.3 ? "walk" : "idle";
    return s;
  }

  if (d < 1.18) {
    s.pose = "chase";
    s.yaw = Math.atan2(-dx, -dz);
    return s;
  }

  if (style === "circle") {
    const side = opt.seed % 2 ? 1 : -1;
    const cut = Math.sin(opt.playT * 1.15 + opt.seed) > 0.62;
    const rad = cut ? 1.45 : 3.55;
    const a = opt.playT * 1.35 * side + opt.seed;
    const tx = opt.hx + Math.cos(a) * rad;
    const tz = opt.hz + Math.sin(a) * rad;
    moveToward(s, tx, tz, hunt * (cut ? 3.15 : 2.2), dt);
    s.pose = cut || d < 4 ? "chase" : "walk";
    return s;
  }

  if (style === "lunge") {
    s.lungeT -= dt;
    if (s.lungeT <= 0) s.lungeT = 1.42 + (opt.seed % 3) * 0.18;
    if (s.lungeT > 0.95) {
      s.pose = "hiss";
      s.yaw = Math.atan2(-dx, -dz);
    } else if (s.lungeT > 0.62) {
      moveToward(s, opt.hx, opt.hz, hunt * 6.8, dt);
      s.pose = "chase";
    } else {
      moveToward(s, opt.hx, opt.hz, hunt * 1.05, dt);
      s.pose = "walk";
    }
    return s;
  }

  if (style === "guard") {
    moveToward(s, opt.hx, opt.hz, hunt * 1.22, dt);
    s.pose = d < 2.6 ? "chase" : "guard";
    return s;
  }

  if (style === "skitter") {
    const n = Math.max(0.001, d);
    const px = -dz / n;
    const pz = dx / n;
    const zig = Math.sin(opt.playT * 6.4 + opt.seed * 2.1) * 2.4;
    const tx = s.x + (dx / n) * 4 + px * zig;
    const tz = s.z + (dz / n) * 4 + pz * zig;
    moveToward(s, tx, tz, hunt * 3.05, dt);
    s.pose = d < 4.2 ? "chase" : "walk";
    return s;
  }

  moveToward(s, opt.hx, opt.hz, hunt * 2.45, dt);
  s.pose = d < 4.2 ? "chase" : "walk";
  return s;
}
