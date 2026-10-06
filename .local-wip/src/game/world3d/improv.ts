/** Observation puzzles. The world never names the solution. */
import { live } from "./live";
import { STUFF_AT, stuffWorld } from "./stuff";
import { useGame } from "../store";

export const SNAP = STUFF_AT.snap;
export const MILL_DITCH = STUFF_AT.millDitch;
export const WOOD_GAP = STUFF_AT.woodGap;

export function vineCut() {
  return Boolean(live.smashed["snap-vine"]);
}

export function millOpen() {
  return Boolean(live.smashed["mill-stick"]);
}

export function woodCapsCut() {
  return Boolean(live.smashed["wood-caps"]);
}

export function inGapBox(px: number, pz: number, x: number, z: number, hx: number, hz: number) {
  return Math.abs(px - x) < hx && Math.abs(pz - z) < hz;
}

export function wedgeFree(rockX: number, rockZ: number) {
  const home = { x: SNAP.x + 6.3, z: SNAP.z + 6.5 };
  return Math.hypot(rockX - home.x, rockZ - home.z) > 1.75;
}

export function canFreeSnap(vine: boolean, rockX: number, rockZ: number) {
  return vine && wedgeFree(rockX, rockZ);
}

export function stepImprov() {
  const w = stuffWorld();
  const log = w.things.find((t) => t.id === "log-snap");
  const rock = w.things.find((t) => t.id === "rock-snap");
  if (log?.pinned && rock && canFreeSnap(vineCut(), rock.x, rock.z)) {
    log.pinned = false;
    log.mass = 1.85;
  }

  const mill = w.things.find((t) => t.id === "log-mill");
  if (mill?.pinned && millOpen()) {
    mill.pinned = false;
    mill.mass = 1.8;
  }

  const wood = w.things.find((t) => t.id === "log-wood");
  if (wood?.pinned && woodCapsCut()) {
    wood.pinned = false;
    wood.mass = 1.8;
    wood.vz = -6.4;
    wood.vx = -2.2;
  }

  const gap = w.gaps.find((g) => g.id === "gap-snap");
  if (gap && !gap.bridged && inGapBox(live.x, live.z, gap.x, gap.z, gap.hx - 0.15, gap.hz + 0.1)) {
    if (!live.god && live.heroFlash < 0.15 && live.grounded) {
      live.heroFlash = 0.42;
      useGame.getState().hurtField(2);
      const n = Math.max(0.001, Math.hypot(live.x - gap.x, live.z - gap.z));
      live.knock = { vx: ((live.x - gap.x) / n) * 6.4, vz: ((live.z - gap.z) / n) * 6.4, t: 0.18 };
      if (!live.listen) live.listen = "The water had a mouth.";
    }
  }

  const millGap = w.gaps.find((g) => g.id === "gap-mill");
  if (millGap && !millGap.bridged && !millOpen() && inGapBox(live.x, live.z, millGap.x, millGap.z, millGap.hx, millGap.hz + 0.2)) {
    live.z += Math.sign(live.z - millGap.z || 1) * 0.04;
    live.speed *= 0.35;
    if (!live.listen) live.listen = "The ditch is in a hurry. The bank is not.";
  }
}
