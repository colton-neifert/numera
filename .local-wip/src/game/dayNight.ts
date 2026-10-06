import { live, gameClock } from "./world3d/live";
import { MILL_AT, POND, TREE_TRUNK, ORCHARD_STAND, LOOK_AT, WELL_AT, VX, VZ, vWorld } from "./world3d/field";
import { festGoal } from "./fest";

const FARM_AT = { x: 50, z: -98 };
const SMITH_AT = { x: 40, z: -52 };
const FIRE_PIT = { x: VX, z: VZ + 8 };
const PADDOCK = { x: VX + 28, z: VZ + 24 };
const FIRE_R = 2.45;
const CHAIRS: { x: number; z: number; yaw: number }[] = [0.45, 2.55, 4.65].map((a) => ({
  x: FIRE_PIT.x + Math.sin(a) * FIRE_R,
  z: FIRE_PIT.z + Math.cos(a) * FIRE_R,
  yaw: a + Math.PI,
}));

export type DayShift = "dawn" | "day" | "dusk" | "night";

export function dayShift(hr?: number): DayShift {
  const t = hr ?? gameClock().t;
  if (t >= 5.1 && t < 7.6) return "dawn";
  if (t >= 7.6 && t < 17.2) return "day";
  if (t >= 17.2 && t < 20.2) return "dusk";
  return "night";
}

export function shiftName(s?: DayShift) {
  const k = s ?? dayShift();
  return k === "dawn" ? "Dawn" : k === "dusk" ? "Dusk" : k === "night" ? "Night" : "Day";
}

export function plantOpen(hr?: number) {
  const t = hr ?? gameClock().t;
  if (t >= 7.2 && t < 18.4) return 1;
  if (t >= 6.2 && t < 7.2) return (t - 6.2) / 1;
  if (t >= 18.4 && t < 19.6) return 1 - (t - 18.4) / 1.2;
  return 0;
}

export function foeHidesByDay(seed: number, hr?: number) {
  const shift = dayShift(hr);
  if (shift === "night") return false;
  if (shift === "dusk") return seed % 5 === 0;
  return seed % 4 !== 0;
}

export function foeHuntSpeed(seed: number, hr?: number) {
  const night = dayShift(hr) === "night";
  const base = 2.35;
  if (!night) return foeHidesByDay(seed, hr) ? 0 : base * 0.72;
  return base + 1.05 + (seed % 3) * 0.15;
}

export type NpcGoal = { x: number; z: number; sit?: boolean; hide?: boolean; yaw?: number };

/** Work by day, fire or home after dark. Mira comes down. Kids go in. */
export function npcGoal(id: string, hr?: number): NpcGoal | null {
  const fair = festGoal(id);
  if (fair) return fair;
  const shift = dayShift(hr);
  const night = shift === "night";
  const dusk = shift === "dusk";
  const fire = (i: number): NpcGoal => {
    const c = CHAIRS[i % CHAIRS.length]!;
    return { x: c.x, z: c.z, sit: true, yaw: c.yaw };
  };
  const home = (x: number, z: number, hide = night): NpcGoal => ({ x, z, hide, sit: hide });

  switch (id) {
    case "holt":
      if (night || dusk) return fire(0);
      return { x: FARM_AT.x + 2.4, z: FARM_AT.z - 1.2 };
    case "bramble":
      if (night) return home(FARM_AT.x - 3.2, FARM_AT.z - 4.4, true);
      return { x: FARM_AT.x - 1.4, z: FARM_AT.z + 1.6 };
    case "cobb":
      if (night || dusk) return fire(1);
      return { x: FARM_AT.x - 6.2, z: FARM_AT.z + 3.4 };
    case "flint":
      if (night) return { x: SMITH_AT.x - 1.6, z: SMITH_AT.z + 6.8, sit: true };
      return { x: SMITH_AT.x + 0.4, z: SMITH_AT.z + 7.2 };
    case "mill-man":
    case "oak4": {
      const millHome = vWorld(8, -96);
      if (night) return home(millHome.x, millHome.z, true);
      return { x: MILL_AT.x + 3.2, z: MILL_AT.z + 1.4 };
    }
    case "oak5": {
      const h = vWorld(-6, -92);
      if (night) return home(h.x, h.z, true);
      return { x: MILL_AT.x - 2.4, z: MILL_AT.z + 2.2 };
    }
    case "oak6":
      if (night) return fire(2);
      return { x: VX + 18, z: VZ - 8 };
    case "oak0": {
      const h = vWorld(-14, -74);
      if (night) return home(h.x, h.z, true);
      return { x: VX - 8, z: VZ + 4 };
    }
    case "oak1":
      if (night) return fire(1);
      return { x: VX + 6, z: VZ - 10 };
    case "oak2": {
      const h = vWorld(14, -74);
      if (night) return home(h.x, h.z, true);
      if (!dusk) {
        const skip = vWorld(12, -70);
        return { x: skip.x + 0.35, z: skip.z + 0.2, yaw: 0 };
      }
      return { x: VX + 3.2, z: VZ + 6.4 };
    }
    case "oak3": {
      const h = vWorld(-24, -88);
      if (night) return home(h.x, h.z, true);
      if (!dusk) {
        const skip = vWorld(12, -70);
        return { x: skip.x + 1.7, z: skip.z - 1.05, yaw: -0.55 };
      }
      return { x: VX - 4.2, z: VZ + 8.2 };
    }
    case "tess":
      return npcGoal("oak2", hr);
    case "tallow":
      if (night) return { x: PADDOCK.x - 2.4, z: PADDOCK.z + 3.2, sit: true };
      return { x: PADDOCK.x - 1.2, z: PADDOCK.z - 2.4 };
    case "ash":
      if (live.ashFollow) return null;
      if (night) return fire(0);
      return { x: PADDOCK.x - 6.4, z: PADDOCK.z - 4.2 };
    case "nora":
      if (night) return home(VX + 10, VZ - 14, true);
      return { x: VX + 8.4, z: VZ - 12 };
    case "pell":
      if (night) return { x: FIRE_PIT.x + 1.6, z: FIRE_PIT.z + 2.2, sit: true };
      return null;
    case "mira":
      if (night || dusk) return { x: ORCHARD_STAND.x, z: ORCHARD_STAND.z, sit: true };
      return null;
    case "finn":
      return { x: POND.x + 2.4, z: POND.z + 1.15, sit: night };
    case "reed":
      if (night) return fire(2);
      return { x: TREE_TRUNK.x + 14, z: TREE_TRUNK.z + 8 };
    case "fern":
      if (night) return { x: VX + 3.4, z: VZ + 4.6, sit: true };
      return { x: VX + 3.4, z: VZ + 5.4 };
    case "dusk":
      return { x: VX - 6, z: VZ + 22 };
    default:
      return null;
  }
}

export const MOON_STONE = { x: LOOK_AT.x + 8.4, z: LOOK_AT.z - 10.2 };
export const NIGHT_FANGS: { id: string; x: number; z: number }[] = [
  { id: "night-e0", x: VX + 22, z: VZ + 42 },
  { id: "night-e1", x: VX - 28, z: VZ + 36 },
  { id: "night-e2", x: VX + 8, z: VZ - 48 },
  { id: "night-e3", x: FARM_AT.x + 14, z: FARM_AT.z - 8 },
];

export const NIGHT_GLYPHS: { id: string; x: number; z: number }[] = [
  { id: "glyph-well", x: WELL_AT.x + 0.35, z: WELL_AT.z + 0.4 },
  { id: "glyph-look", x: LOOK_AT.x - 1.15, z: LOOK_AT.z + 0.9 },
  { id: "glyph-fire", x: FIRE_PIT.x - 2.05, z: FIRE_PIT.z - 1.55 },
  { id: "glyph-farm", x: FARM_AT.x + 1.8, z: FARM_AT.z - 2.2 },
  { id: "glyph-moon", x: MOON_STONE.x, z: MOON_STONE.z },
];

export function moonDir(hr?: number) {
  const t = hr ?? gameClock().t;
  const ang = ((t - 18) / 12) * Math.PI;
  return { x: Math.cos(ang), y: Math.max(0.12, Math.sin(ang)), z: 0.35 };
}

/** 6am east, noon high, 6pm west. */
export function sunDir(hr?: number) {
  const t = hr ?? gameClock().t;
  const ang = ((t - 6) / 12) * Math.PI;
  return { x: Math.cos(ang), y: Math.max(0.06, Math.sin(ang)), z: 0.22 };
}

export function sunShadowTip(len = 6.6, hr?: number) {
  const s = sunDir(hr);
  const reach = len * (0.18 / Math.max(0.18, s.y));
  return { x: -s.x * reach, z: -s.z * reach };
}

export function shadowTip(len = 7.4, hr?: number) {
  const m = moonDir(hr);
  const xz = Math.hypot(m.x, m.z) || 1;
  return {
    x: MOON_STONE.x - (m.x / xz) * len,
    z: MOON_STONE.z - (m.z / xz) * len,
  };
}

export function isNightHunt(hr?: number) {
  return dayShift(hr) === "night";
}

/** True past the inner square — the woods and the dark lane hunt after lamps. */
export function woodsHunt(x = live.x, z = live.z, hr?: number) {
  if (dayShift(hr) !== "night") return false;
  if (live.house || live.cave || live.dungeon) return false;
  return Math.hypot(x - VX, z - VZ) > 44;
}
