import type { WorldId } from "../types";
import { LEVELS } from "../phaser/levels";
import { live } from "./live";
import { dungeonRoomCount, roomZ } from "./dungeonLayout";

/** Oakstead sits on a flat green in the middle. Castle hill is a short walk north. */
export const VX = 0;
export const VZ = -108;
export const VR = 80;
export const VILLAGE_Y = 5.4;

/** Your treehouse — a little south of Oakstead, on a long branch. */
export const TREE_TRUNK = { x: VX - 38, z: VZ - 54 };
/** Half-width / half-depth of the hollow interior (not counting the deck). */
export const TREE_HW = 5.45;
export const TREE_HD = 4.55;
export const TREE_CEIL = 3.72;
export const TREE_DOOR = 1.08;
export const TREE_DECK_D = 3.45;
export const TREE_HOME = { x: TREE_TRUNK.x + 12.2, z: TREE_TRUNK.z + 0.5 };
export const TREE_LADDER = { x: TREE_HOME.x, z: TREE_HOME.z + TREE_HD + TREE_DECK_D + 0.28 };
export const TREE_LADDER_YAW = 0;
export const TREE_HOUSE_H = 6.35;
/** Zip line lands in the north meadow, past Oakstead. */
export const ZIP_LAND = { x: VX + 12, z: VZ + 48 };
export const KEEP_Y = 4.6;
export const KEEP_Z = 96;
export const JAIL_Z = 74;
const OLD_VZ = -82;
const TOWN_SPREAD = 1.62;

export function vWorld(x: number, z: number) {
  return { x: VX + x * TOWN_SPREAD, z: VZ + (z - OLD_VZ) * TOWN_SPREAD };
}

const ORCHARD_TREE_OLD = { x: -24.2, z: -80.8 };
export const ORCHARD_TREE = vWorld(ORCHARD_TREE_OLD.x, ORCHARD_TREE_OLD.z);
/** Ladder stands clear of the canopy so Mira’s head never sits in the leaves. */
export const ORCHARD_LADDER = {
  x: ORCHARD_TREE.x + 0.58,
  z: ORCHARD_TREE.z,
};
export const ORCHARD_LADDER_YAW = Math.PI / 2;
/** Ground spot in front of the rails — never on the rungs. */
export const ORCHARD_STAND = {
  x: ORCHARD_TREE.x + 1.85,
  z: ORCHARD_TREE.z,
};

export const ECHO_GLADE = { x: 380, z: 48 };
export const COW_PAD = { x: -360, z: -36 };
export const FAIRY_RING = { x: 430, z: 270 };
export const PICNIC_AT = { x: 88, z: 360 };
export const FAR_POND = { x: -248, z: 310 };
export const LONELY_CHEST = { x: 640, z: -380 };
export const KEEP_OUT = { x: 48, z: 490 };
export const PIG_AT = { x: 168, z: -430 };
export const BALLOON_AT = { x: -430, z: 150 };
export const BOTTLE_AT = { x: FAR_POND.x + 10.4, z: FAR_POND.z + 3.2 };
export const GOAT_AT = { x: -560, z: -180 };
export const SHROOM_AT = { x: 330, z: 330 };
export const BEE_AT = vWorld(-22, -78);
export const CRATE_AT = vWorld(6, -110);
export const BELL_AT = vWorld(3.2, -72);
export const KITE_AT = { x: 210, z: -520 };
export const RABBIT_AT = { x: -168, z: 230 };
export const CAMP_AT = { x: -620, z: 170 };
export const SHEEP_AT = { x: 248, z: 168 };
export const SNOW_AT = { x: -70, z: 680 };
export const STAR_HILL = { x: 510, z: 390 };
export const GIANT_AT = { x: -290, z: 530 };
export const ICE_AT = { x: SNOW_AT.x + 22, z: SNOW_AT.z - 12 };
export const OWL_AT = { x: 40, z: 160 };
export const BUSH_AT = { x: 490, z: -70 };
export const TALK_TREE = { x: 355, z: 40 };
export const FLAG_AT = { x: 730, z: 210 };
export const DESERT_AT = { x: 710, z: -450 };
export const LOG_AT = { x: -280, z: -380 };
export const WIND_HILL = { x: -1080, z: 90 };
export const MOON_POND = { x: 1080, z: 720 };
export const LOST_CART = { x: -920, z: -860 };
export const HAT_ROCK = { x: 260, z: -1120 };
export const BALL_AT = { x: VX + 10.4, z: VZ + 9.2 };
export const SNEEZE_TREE = { x: VX + 48, z: VZ - 26 };
export const MOLE_AT = { x: VX + 22, z: VZ + 28 };
export const SHY_AT = { x: VX - 14, z: VZ + 20 };
export const TINY_HOLE = { x: GIANT_AT.x - 7.4, z: GIANT_AT.z + 5.2 };
export const BARREL_AT = { x: VX + 18.4, z: VZ + 7.6 };
export const PUMPKIN_AT = { x: VX - 24.2, z: VZ - 12.8 };
export const ECHO_ROCK = { x: -640, z: 480 };
export const SCARECROW_AT = { x: 188, z: -92 };
export const GEYSER_AT = { x: 1480, z: -220 };
export const LIGHT_AT = { x: 80, z: -1720 };
export const FACE_AT = { x: -1560, z: 380 };
export const FOX_AT = { x: 920, z: 1080 };
export const MAIL_NOWHERE = { x: -1520, z: -980 };
export const RED_SHROOM = { x: 640, z: -920 };
export const PLANE_AT = { x: -180, z: 1480 };
export const GHOST_BENCH = { x: -880, z: 980 };
export const PAINT_DOOR = { x: -420, z: -1480 };
export const CONCH_AT = { x: 1580, z: 180 };
export const BEAN_AT = { x: 1680, z: 520 };
export const POTATO_AT = { x: -340, z: 820 };
export const SEE_AT = { x: VX - 8.2, z: VZ + 14.4 };
export const WHOOP_AT = { x: VX + 6.2, z: VZ - 18.4 };
export const BANANA_AT = { x: 4, z: -48 };
export const LEMON_AT = { x: VX + 28.4, z: VZ + 4.2 };
export const DANDELION_AT = { x: VX - 30.2, z: VZ + 16.4 };
export const SWING_AT = { x: VX - 40.2, z: VZ - 8.4 };
export const CLOVER_AT = { x: VX + 36.2, z: VZ + 22.4 };
export const SLEEP_GIANT = { x: -2200, z: -180 };
export const STONE_RING = { x: 420, z: 2480 };
export const MIRROR_LAKE = { x: -2100, z: 1320 };
export const CANNON_AT = { x: 18, z: 78 };
export const FOSSIL_AT = { x: 2100, z: -860 };
export const SWORD_STONE = { x: -780, z: 1680 };
export const HAMMOCK_AT = { x: VX + 22.4, z: VZ - 32.2 };
export const DUCK_AT = { x: VX - 46.2, z: VZ - 18.4 };
export const WET_PAINT = { x: VX + 14.2, z: VZ - 38.6 };
export const CRAB_AT = { x: 1640, z: 140 };
export const VANE_AT = { x: VX + 4.2, z: VZ + 38.4 };
/** Climbable lookout just north-west of Oakstead — the vale is huge from the deck. */
export const LOOK_AT = { x: VX - 32, z: VZ + 64 };
export const LOOK_LADDER = { x: LOOK_AT.x, z: LOOK_AT.z - 1.92 };
export const LOOK_LADDER_YAW = Math.PI;
/** Giant fork south of town — you see it from the first step. */
export const SPIRE_AT = { x: VX + 6, z: VZ - 78 };
export const SPIRE_LADDER = { x: SPIRE_AT.x, z: SPIRE_AT.z + 2.2 };
export const SPIRE_LADDER_YAW = 0;
export const LAUNDRY_AT = { x: VX + 20.4, z: VZ - 14.8 };
export const BOUNCE_AT = { x: 186, z: -72 };
export const WHALE_AT = { x: -3180, z: 880 };
export const NEEDLE_AT = { x: 2760, z: 2080 };
export const CLOUD_PIER = { x: -160, z: 3460 };
export const ICE_CROWN = { x: -60, z: -3360 };
export const SAND_SHIP = { x: 3380, z: -400 };
/** Gale's balloon on the south green. */
export const RIDE_AT = { x: VX + 2.2, z: VZ - 12 };
export const BALLOON_TRIPS: { name: string; x: number; z: number; cost: number }[] = [
  { name: "the fork", x: SPIRE_AT.x, z: SPIRE_AT.z, cost: 10 },
  { name: "the lookout", x: LOOK_AT.x, z: LOOK_AT.z, cost: 8 },
  { name: "the giant", x: SLEEP_GIANT.x, z: SLEEP_GIANT.z, cost: 15 },
  { name: "the snow hill", x: SNOW_AT.x, z: SNOW_AT.z, cost: 15 },
  { name: "town", x: RIDE_AT.x, z: RIDE_AT.z, cost: 8 },
];
export const SOCK_PEAK = { x: -4100, z: -2360 };
export const CLOCK_WOOD = { x: 2720, z: -3180 };
export const FLOWER_SEA = { x: 4180, z: 1540 };
export const SNORE_HILL = { x: -2920, z: 3180 };
export const RAINBOW_ARCH = { x: 1540, z: 4180 };
export const ANT_TABLE = { x: -3520, z: -2680 };
export const BIRD_STACK = { x: 540, z: 4560 };
export const LOST_SHOE = { x: 4560, z: -720 };
export const FOOT_AT = { x: VX - 10.4, z: VZ + 6 };
export const PUSH_AT = { x: VX + 8.6, z: VZ - 10 };
export const MILL_AT = vWorld(2, -116);
export const BREAD_HILL = { x: -4800, z: 920 };
export const EDGE_MAIL = { x: 36, z: 6680 };
export const STAIR_NONE = { x: 5600, z: 2100 };
export const CHESS_AT = { x: -1680, z: 5380 };
export const DUCK_LAKE = { x: 5080, z: -2580 };
export const DOOR_FIELD = { x: -5380, z: -1180 };
export const YOU_COMPASS = { x: 2780, z: 5180 };
export const CONE_AT = { x: VX + 5.2, z: VZ + 11 };
export const PIANO_AT = { x: -6200, z: 1800 };
export const SPOON_AT = { x: 7200, z: -1400 };
export const BOAT_AT = { x: 120, z: 7900 };
export const CAT_AT = { x: -7200, z: -2200 };
export const WISH_AT = { x: 6400, z: 4200 };
export const CART_AT = { x: VX + 7.6, z: VZ + 9.2 };
export const CUP_AT = { x: 8800, z: 800 };
export const UMBRELLA_AT = { x: -8800, z: 400 };
export const SLIDE_AT = { x: 280, z: -8800 };
export const HAT_FAR = { x: -280, z: 9200 };
export const WHOOP_AT_TOWN = { x: VX - 6.2, z: VZ + 12 };
export const CHEESE_AT = { x: VX + 11.2, z: VZ + 6 };
export const SANDWICH_AT = { x: 2400, z: -6400 };
export const BOUNCE_HOUSE = { x: -2400, z: 6400 };
export const CARD_AT = { x: 7600, z: 5200 };

export const HF_SIZE = 52000;
export const HF_SEGS = 220;
export const HF_OX = 0;
export const HF_OZ = -80;

/** Analytic terrain. Used to bake the playable heightfield and for far lands. */
function terrainY(x: number, z: number): number {
  const hill = (cx: number, cz: number, r: number, h: number) => {
    const d = Math.hypot(x - cx, z - cz);
    if (d >= r) return 0;
    const u = 1 - d / r;
    return u * u * (3 - 2 * u) * h;
  };
  const plateau = (cx: number, cz: number, rIn: number, rOut: number, h: number) => {
    const d = Math.hypot(x - cx, z - cz);
    if (d >= rOut) return 0;
    if (d <= rIn) return h;
    const u = 1 - (d - rIn) / Math.max(0.01, rOut - rIn);
    return u * u * (3 - 2 * u) * h;
  };
  let y =
    Math.sin(x * 0.016) * 1.15 +
    Math.cos(z * 0.013) * 1.25 +
    Math.sin(x * 0.038 + z * 0.029) * 0.55 +
    Math.cos(x * 0.007 + z * 0.009) * 0.85 +
    Math.sin(x * 0.055 - z * 0.041) * 0.28;
  // Castle sits far north of town on a long hill with a flat crown.
  // Road fills the gap up to the plateau — never stacks on top (that made a cliff).
  const keepPlat = plateau(0, KEEP_Z, 22, 42, 17.4);
  y += keepPlat;
  {
    const z0 = VZ + 52;
    const z1 = KEEP_Z - 22;
    if (z > z0 && z < z1) {
      const along = (z - z0) / Math.max(0.01, z1 - z0);
      const rise = along * along * (3 - 2 * along) * 17.4;
      const half = 16 + along * 20;
      const dx = Math.abs(x);
      if (dx < half) {
        const side = 1 - dx / half;
        const road = rise * side * side * (3 - 2 * side);
        y += Math.max(0, road - keepPlat);
      }
    }
  }
  // Ring of wooded hills around the village green (leave a gap toward the keep).
  const ring: [number, number, number, number][] = [
    [0.85, 78, 28, 10.4],
    [1.28, 88, 32, 12.6],
    [1.72, 74, 26, 9.2],
    [2.18, 86, 30, 11.4],
    [2.62, 80, 28, 10.0],
    [3.08, 92, 34, 13.2],
    [3.52, 76, 26, 9.0],
    [3.98, 88, 30, 11.8],
    [4.42, 82, 28, 10.6],
    [4.88, 90, 32, 12.2],
    [5.32, 78, 26, 9.4],
    [5.72, 84, 28, 10.8],
  ];
  for (const [a, dist, r, h] of ring) {
    const hx = VX + Math.sin(a) * dist;
    const hz = VZ + Math.cos(a) * dist;
    if (Math.hypot(hx, hz - KEEP_Z) < 52) continue;
    y += hill(hx, hz, r, h);
  }
  y += hill(VX - 76, VZ + 2, 32, 11.8);
  y += hill(VX + 78, VZ - 8, 34, 12.4);
  y += hill(VX + 6, VZ - 82, 36, 13.0);
  y += hill(VX - 58, VZ - 58, 28, 10.2);
  y += hill(VX + 56, VZ - 54, 28, 10.6);
  y += hill(-78, -345, 52, 10.5);
  y += hill(88, -360, 48, 9.6);
  y += hill(-8, -410, 64, 13.5);
  y += hill(120, 36, 36, 6.2);
  y += hill(-110, 28, 32, 5.2);
  {
    const d = Math.hypot(x - 72, z + 40);
    const wobble = 1 + 0.18 * Math.sin(x * 0.48) + 0.14 * Math.cos(z * 0.4);
    if (d < 9.4 * wobble) {
      const u = 1 - d / (9.4 * wobble);
      y -= u * u * 4.2;
    }
  }
  y += hill(ECHO_GLADE.x, ECHO_GLADE.z, 32, 2.5);
  y += hill(COW_PAD.x, COW_PAD.z, 36, 1.8);
  y += hill(FAIRY_RING.x, FAIRY_RING.z, 28, 2.2);
  y += hill(PICNIC_AT.x, PICNIC_AT.z, 26, 2.4);
  y += hill(FAR_POND.x, FAR_POND.z, 34, 1.6);
  y += hill(LONELY_CHEST.x, LONELY_CHEST.z, 30, 2.8);
  y += hill(KEEP_OUT.x, KEEP_OUT.z, 22, 1.9);
  y += hill(PIG_AT.x, PIG_AT.z, 24, 1.7);
  y += hill(BALLOON_AT.x, BALLOON_AT.z, 26, 2.4);
  y += hill(GOAT_AT.x, GOAT_AT.z, 26, 2.0);
  y += hill(SHROOM_AT.x, SHROOM_AT.z, 22, 1.6);
  y += hill(KITE_AT.x, KITE_AT.z, 28, 2.6);
  y += hill(RABBIT_AT.x, RABBIT_AT.z, 22, 1.5);
  y += hill(CAMP_AT.x, CAMP_AT.z, 26, 2.1);
  y += hill(SHEEP_AT.x, SHEEP_AT.z, 24, 1.8);
  y += hill(SNOW_AT.x, SNOW_AT.z, 36, 3.4);
  y += hill(STAR_HILL.x, STAR_HILL.z, 30, 3.0);
  y += hill(GIANT_AT.x, GIANT_AT.z, 24, 1.7);
  y += hill(ICE_AT.x, ICE_AT.z, 20, 0.6);
  y += hill(OWL_AT.x, OWL_AT.z, 22, 2.2);
  y += hill(BUSH_AT.x, BUSH_AT.z, 20, 1.6);
  y += hill(FLAG_AT.x, FLAG_AT.z, 26, 3.6);
  y += hill(DESERT_AT.x, DESERT_AT.z, 40, 1.2);
  y += hill(BELL_AT.x, BELL_AT.z, 18, 1.4);
  y += hill(LOG_AT.x, LOG_AT.z, 22, 1.6);
  y += hill(WIND_HILL.x, WIND_HILL.z, 54, 16.8);
  y -= hill(MOON_POND.x, MOON_POND.z, 36, 4.6);
  y += hill(LOST_CART.x, LOST_CART.z, 28, 2.2);
  y += hill(HAT_ROCK.x, HAT_ROCK.z, 36, 8.4);
  y += hill(GEYSER_AT.x, GEYSER_AT.z, 32, 4.8);
  y += hill(LIGHT_AT.x, LIGHT_AT.z, 48, 18.4);
  y += hill(FACE_AT.x, FACE_AT.z, 70, 22.0);
  y += hill(FOX_AT.x, FOX_AT.z, 34, 3.6);
  y += hill(MAIL_NOWHERE.x, MAIL_NOWHERE.z, 28, 2.4);
  y += hill(RED_SHROOM.x, RED_SHROOM.z, 26, 2.2);
  y += hill(PLANE_AT.x, PLANE_AT.z, 40, 9.6);
  y += hill(GHOST_BENCH.x, GHOST_BENCH.z, 30, 2.8);
  y += hill(PAINT_DOOR.x, PAINT_DOOR.z, 44, 10.4);
  y += hill(CONCH_AT.x, CONCH_AT.z, 36, 3.2);
  y += hill(BEAN_AT.x, BEAN_AT.z, 28, 2.0);
  y += hill(POTATO_AT.x, POTATO_AT.z, 22, 1.8);
  y += hill(SLEEP_GIANT.x, SLEEP_GIANT.z, 90, 16.4);
  y += hill(STONE_RING.x, STONE_RING.z, 48, 3.2);
  y -= hill(MIRROR_LAKE.x, MIRROR_LAKE.z, 40, 5.2);
  y += hill(FOSSIL_AT.x, FOSSIL_AT.z, 36, 4.4);
  y += hill(SWORD_STONE.x, SWORD_STONE.z, 34, 6.2);
  y += hill(LOOK_AT.x, LOOK_AT.z, 16, 5.6);
  y += hill(SPIRE_AT.x, SPIRE_AT.z, 22, 8.4);
  y += hill(WHALE_AT.x, WHALE_AT.z, 110, 22.0);
  y += hill(NEEDLE_AT.x, NEEDLE_AT.z, 42, 8.4);
  y += hill(CLOUD_PIER.x, CLOUD_PIER.z, 64, 24.0);
  y += hill(ICE_CROWN.x, ICE_CROWN.z, 70, 20.4);
  y += hill(SAND_SHIP.x, SAND_SHIP.z, 52, 6.8);
  y += hill(RIDE_AT.x, RIDE_AT.z, 7, 0.55);
  y += hill(SOCK_PEAK.x, SOCK_PEAK.z, 88, 26.0);
  y += hill(CLOCK_WOOD.x, CLOCK_WOOD.z, 58, 14.4);
  y += hill(FLOWER_SEA.x, FLOWER_SEA.z, 90, 8.2);
  y += hill(SNORE_HILL.x, SNORE_HILL.z, 96, 22.0);
  y -= hill(RAINBOW_ARCH.x, RAINBOW_ARCH.z, 48, 3.6);
  y += hill(ANT_TABLE.x, ANT_TABLE.z, 40, 4.2);
  y += hill(BIRD_STACK.x, BIRD_STACK.z, 52, 16.8);
  y += hill(LOST_SHOE.x, LOST_SHOE.z, 44, 7.2);
  y += hill(BREAD_HILL.x, BREAD_HILL.z, 80, 18.4);
  y += hill(EDGE_MAIL.x, EDGE_MAIL.z, 36, 4.2);
  y += hill(STAIR_NONE.x, STAIR_NONE.z, 40, 12.6);
  y += hill(CHESS_AT.x, CHESS_AT.z, 48, 16.0);
  y -= hill(DUCK_LAKE.x, DUCK_LAKE.z, 42, 4.8);
  y += hill(DOOR_FIELD.x, DOOR_FIELD.z, 38, 6.4);
  y += hill(YOU_COMPASS.x, YOU_COMPASS.z, 44, 5.2);
  y += hill(PIANO_AT.x, PIANO_AT.z, 56, 10.4);
  y += hill(SPOON_AT.x, SPOON_AT.z, 48, 8.6);
  y -= hill(BOAT_AT.x, BOAT_AT.z, 40, 3.8);
  y += hill(CAT_AT.x, CAT_AT.z, 70, 14.2);
  y += hill(WISH_AT.x, WISH_AT.z, 42, 7.4);
  y += hill(CUP_AT.x, CUP_AT.z, 48, 11.2);
  y += hill(UMBRELLA_AT.x, UMBRELLA_AT.z, 52, 16.4);
  y += hill(SLIDE_AT.x, SLIDE_AT.z, 70, 22.0);
  y += hill(HAT_FAR.x, HAT_FAR.z, 56, 12.8);
  y += hill(SANDWICH_AT.x, SANDWICH_AT.z, 40, 6.4);
  y += hill(BOUNCE_HOUSE.x, BOUNCE_HOUSE.z, 36, 4.2);
  y += hill(BOUNCE_AT.x, BOUNCE_AT.z, 18, 1.6);
  y += hill(1100, -80, 70, 14.2);
  y += hill(-1180, -200, 64, 13.4);
  y += hill(80, 1180, 72, 16.2);
  y += hill(-60, -1200, 68, 14.8);
  y += hill(1320, 420, 58, 12.6);
  y += hill(-1280, 480, 56, 12.0);
  y += hill(980, -980, 62, 13.0);
  y += hill(-1040, -640, 50, 11.4);
  y += hill(640, 1100, 48, 11.8);
  y += hill(-720, 1040, 52, 12.4);
  // Wide rolling country so the vale is a field, not a pocket green.
  {
    const valeR = Math.hypot(x - HF_OX, z - HF_OZ);
    if (valeR > 155 && valeR < 10000) {
      const u = Math.min(1, (valeR - 155) / 4200);
      y += u * u * (5.2 + 3.0 * Math.sin(x * 0.0055) * Math.cos(z * 0.0048));
    }
  }
  const wildHills: [number, number, number, number][] = [
    [268, 18, 48, 9.8],
    [-248, 52, 44, 8.6],
    [148, 252, 52, 11.4],
    [-172, 236, 46, 9.6],
    [348, -58, 40, 8.0],
    [-336, -22, 42, 8.4],
    [92, 352, 50, 10.8],
    [-48, -328, 46, 9.0],
    [318, 178, 42, 8.8],
    [-292, 192, 44, 9.2],
    [228, -328, 38, 7.4],
    [-196, -348, 42, 8.2],
    [402, -140, 36, 7.6],
    [-368, -168, 38, 7.8],
    [210, 300, 40, 8.4],
    [-220, 280, 38, 8.0],
    [520, 80, 54, 11.2],
    [-510, 60, 50, 10.4],
    [80, 460, 58, 12.6],
    [-90, -520, 52, 10.8],
    [580, -220, 46, 9.4],
    [-540, -260, 48, 9.8],
    [420, 380, 44, 10.2],
    [-380, 420, 46, 10.6],
    [680, 140, 50, 11.0],
    [-660, 180, 48, 10.4],
    [250, -560, 52, 10.2],
    [-240, -540, 46, 9.4],
    [720, -360, 42, 8.6],
    [-700, -300, 44, 8.8],
    [40, 640, 62, 14.8],
    [-620, 360, 40, 8.2],
    [560, 480, 38, 9.0],
    [900, 180, 58, 12.4],
    [-880, 220, 54, 11.6],
    [160, 920, 64, 13.8],
    [-140, -940, 60, 12.8],
    [1180, -280, 52, 11.2],
    [-1120, -360, 50, 10.8],
    [760, 820, 48, 11.4],
    [-800, 860, 46, 10.6],
    [1280, 120, 56, 12.0],
    [-1240, 60, 54, 11.8],
    [420, -1080, 58, 12.2],
    [-480, -1020, 52, 11.0],
    [1040, 540, 44, 10.4],
    [-980, 620, 46, 10.8],
    [1480, -220, 40, 8.6],
    [80, -1720, 54, 16.4],
    [-1560, 380, 62, 18.8],
    [920, 1080, 42, 9.2],
    [-1520, -980, 46, 9.6],
    [640, -920, 38, 8.2],
    [-180, 1480, 50, 11.4],
    [-880, 980, 40, 8.8],
    [-420, -1480, 48, 10.6],
    [1580, 180, 44, 9.0],
    [1680, 520, 40, 8.4],
    [1800, -640, 58, 12.2],
    [-1760, -400, 56, 11.8],
    [200, 1880, 64, 14.2],
    [-240, -1880, 60, 13.6],
    [-2200, -180, 80, 14.8],
    [420, 2480, 52, 8.6],
    [-2100, 1320, 56, 6.4],
    [2100, -860, 48, 9.4],
    [-780, 1680, 44, 8.8],
    [2400, 200, 62, 13.2],
    [-2400, 80, 60, 12.8],
    [200, 2600, 70, 15.4],
    [-160, -2500, 66, 14.6],
    [-3180, 880, 96, 18.4],
    [2760, 2080, 48, 9.2],
    [-160, 3460, 70, 20.8],
    [-60, -3360, 74, 18.6],
    [3380, -400, 56, 8.4],
    [3100, 1400, 60, 13.6],
    [-3000, -1600, 64, 14.2],
    [1200, 3200, 68, 15.0],
    [-1400, -3100, 62, 13.8],
    [-4100, -2360, 90, 22.4],
    [2720, -3180, 56, 13.6],
    [4180, 1540, 80, 10.2],
    [-2920, 3180, 88, 20.4],
    [1540, 4180, 54, 8.8],
    [-3520, -2680, 48, 9.4],
    [540, 4560, 58, 15.6],
    [4560, -720, 50, 9.8],
    [3800, 2800, 64, 14.4],
    [-3800, 1400, 60, 13.8],
    [800, -4200, 70, 15.2],
    [-800, 4200, 66, 14.6],
    [-4800, 920, 76, 16.8],
    [36, 6680, 40, 6.4],
    [5600, 2100, 48, 12.2],
    [-1680, 5380, 52, 14.6],
    [5080, -2580, 50, 8.4],
    [-5380, -1180, 46, 10.2],
    [2780, 5180, 48, 9.6],
    [6200, -800, 60, 13.4],
    [-6200, 400, 58, 12.8],
    [200, -6200, 66, 14.0],
    [-6200, 1800, 58, 11.6],
    [7200, -1400, 52, 10.4],
    [120, 7900, 46, 8.2],
    [-7200, -2200, 64, 13.4],
    [6400, 4200, 50, 9.8],
    [8000, 600, 56, 12.2],
    [-8000, -400, 54, 11.8],
    [-200, -8000, 62, 13.0],
    [8800, 800, 52, 11.4],
    [-8800, 400, 56, 14.2],
    [280, -8800, 68, 18.6],
    [-280, 9200, 54, 12.2],
    [14000, 400, 90, 20],
    [-14000, -280, 86, 18],
    [500, -14000, 96, 22],
    [-400, 14000, 88, 19],
    [16000, 1800, 80, 16],
    [-16000, 1200, 78, 15],
    [1800, 16000, 84, 17],
    [-1600, -16000, 82, 16],
    [12000, 12000, 76, 16],
    [-12000, -12000, 74, 15],
    [18000, -800, 70, 14],
    [-18000, 600, 70, 14],
    [22000, 800, 96, 22],
    [-22000, -600, 92, 20],
    [600, -22000, 110, 26],
    [-500, 22000, 100, 24],
  ];
  for (const [hx, hz, r, h] of wildHills) y += hill(hx, hz, r, h);
  {
    const keepD = Math.hypot(x, z - KEEP_Z);
    const dv = Math.hypot(x - VX, z - VZ);
    const rIn = 18;
    const rOut = 34;
    const towardKeep = z > VZ + 8 && Math.abs(x) < 24;
    const towardSouth = z < VZ - 6;
    const inPond = pondU(x, z) > 0.06;
    const pondWest = x < POND.x - 2 && Math.hypot(x - (POND.x - 20), z - POND.z) < 30;
    if (keepD > 40 && dv < rOut && !towardKeep && !towardSouth && !pondWest && !inPond) {
      const u = dv <= rIn ? 1 : 1 - (dv - rIn) / Math.max(0.01, rOut - rIn);
      const s = u * u * (3 - 2 * u);
      y = y * (1 - s) + VILLAGE_Y * s;
    }
  }
  // Rise west of the village pond so the pines sit on a grassy bank.
  y += hill(POND.x - 20, POND.z - 5, 20, 5.4);
  const pu = pondU(x, z);
  if (pu > 0) {
    const villagePond = Math.hypot((x - POND.x) / 1.1, (z - POND.z) / 0.82) < POND.r * 1.85;
    y -= pu * pu * (villagePond ? 1.18 : 1.45);
  }
  y = flattenHousePads(x, z, y);
  const pth = pathU(x, z);
  if (pth > 0) y -= pth * 0.08;
  return y;
}

const HF_N = HF_SEGS + 1;
export const TERRAIN_REV = 44;
let hfGrid: Float32Array | null = null;
let hfRev = -1;

function ensureHF() {
  if (hfGrid && hfRev === TERRAIN_REV) return hfGrid;
  const g = new Float32Array(HF_N * HF_N);
  hfGrid = g;
  hfRev = TERRAIN_REV;
  const step = HF_SIZE / HF_SEGS;
  const x0 = HF_OX - HF_SIZE / 2;
  const z0 = HF_OZ - HF_SIZE / 2;
  for (let j = 0; j < HF_N; j++) {
    for (let i = 0; i < HF_N; i++) {
      g[j * HF_N + i] = terrainY(x0 + i * step, z0 + j * step);
    }
  }
  return g;
}

/** Stay on the grass mesh — no walking off into the sky. */
export function clampPlayable(x: number, z: number) {
  const maxR = HF_SIZE * 0.47;
  const dx = x - HF_OX;
  const dz = z - HF_OZ;
  const d = Math.hypot(dx, dz);
  if (d <= maxR) return { x, z };
  const s = maxR / d;
  return { x: HF_OX + dx * s, z: HF_OZ + dz * s };
}

export function heightAt(x: number, z: number): number {
  if (live.dungeon || live.flat) return 0;
  if (live.house) return live.houseY || 0;
  return fieldHeight(x, z);
}

/**
 * Rolling hills around Oakstead. The baked height grid is far too coarse to hold them, so they ride on
 * top of it as smooth cosine swells — solid ground for walking, planting and drawing alike.
 */
export const MOUNDS: { x: number; z: number; r: number; h: number }[] = [
  { x: -62, z: VZ + 78, r: 40, h: 9.5 },
  { x: 8, z: VZ + 92, r: 46, h: 11 },
  { x: 54, z: VZ + 82, r: 30, h: 7.5 },
  { x: -18, z: VZ + 108, r: 42, h: 10 },
  { x: 42, z: VZ + 118, r: 36, h: 8 },
  { x: 268, z: 18, r: 52, h: 11 },
  { x: -248, z: 52, r: 48, h: 10 },
  { x: 148, z: 252, r: 54, h: 12 },
  { x: -172, z: 236, r: 50, h: 10 },
  { x: -48, z: -328, r: 50, h: 10 },
];

export function moundLift(x: number, z: number) {
  let y = 0;
  for (const m of MOUNDS) {
    const dx = x - m.x;
    const dz = z - m.z;
    const d2 = dx * dx + dz * dz;
    if (d2 >= m.r * m.r) continue;
    const u = Math.cos((Math.sqrt(d2) / m.r) * Math.PI) * 0.5 + 0.5;
    const v = m.h * u;
    // Overlapping swells merge softly instead of stacking into a spike.
    y = y + v - (y * v) / 14;
  }
  if (y <= 0) return 0;
  // Building pads stay level: the swell dies away before it reaches a doorstep.
  for (const p of housePads()) {
    const dx = Math.abs(x - p.x) - p.hx;
    const dz = Math.abs(z - p.z) - p.hz;
    const d = Math.hypot(Math.max(0, dx), Math.max(0, dz));
    if (d < 9) {
      const u = d / 9;
      y *= u * u * (3 - 2 * u);
    }
  }
  return y;
}

/** Terrain height ignoring dungeon/interior flags — for baking ground, grass, trees. */
export function fieldHeight(x: number, z: number): number {
  return baseHeight(x, z) + moundLift(x, z);
}

function baseHeight(x: number, z: number): number {
  const x0 = HF_OX - HF_SIZE / 2;
  const z0 = HF_OZ - HF_SIZE / 2;
  const u = (x - x0) / HF_SIZE;
  const v = (z - z0) / HF_SIZE;
  if (u <= 0 || v <= 0 || u >= 1 || v >= 1) return terrainY(x, z);
  const grid = ensureHF();
  const fx = u * HF_SEGS;
  const fz = v * HF_SEGS;
  const i = Math.min(HF_SEGS - 1, Math.max(0, Math.floor(fx)));
  const j = Math.min(HF_SEGS - 1, Math.max(0, Math.floor(fz)));
  const tx = fx - i;
  const tz = fz - j;
  const i0 = j * HF_N + i;
  const a = grid[i0]!;
  const b = grid[i0 + 1]!;
  const c = grid[i0 + HF_N]!;
  const d = grid[i0 + HF_N + 1]!;
  return a * (1 - tx) * (1 - tz) + b * tx * (1 - tz) + c * (1 - tx) * tz + d * tx * tz;
}

export const WATER_Y = 0.1;
export const POND = { x: VX - 54, z: VZ - 22, r: 12.4 };
export const WILD_POND = { x: 268, z: -448, r: 16.4 };
export const DOCK = { x: POND.x + POND.r * 1.18, z: POND.z + 2.4 };
export const POLE_CHEST = { x: DOCK.x + 1.35, z: DOCK.z + 0.95 };

const pipWell = vWorld(-24, -66);
const nanaWell = vWorld(24, -66);
export const WELL_AT = { x: pipWell.x - 7.6, z: pipWell.z + 0.6 };
export const WELL_TWO = { x: nanaWell.x + 7.6, z: nanaWell.z + 0.6 };

export function pondU(x: number, z: number) {
  const wobble = 1 + 0.16 * Math.sin(x * 0.38) + 0.12 * Math.cos(z * 0.34);
  const dx = (x - POND.x) / (POND.r * 1.1 * wobble);
  const dz = (z - POND.z) / (POND.r * 0.8 * wobble);
  const a = Math.max(0, 1 - Math.hypot(dx, dz));
  const d2 = Math.hypot(x - FAR_POND.x, z - FAR_POND.z);
  const b = Math.max(0, 1 - d2 / 11);
  const d3 = Math.hypot(x - WILD_POND.x, z - WILD_POND.z);
  const c = Math.max(0, 1 - d3 / (WILD_POND.r * 1.05));
  return Math.max(a, b, c);
}

export function pondSurfaceY() {
  return VILLAGE_Y - 0.92;
}

function distSeg(x: number, z: number, ax: number, az: number, bx: number, bz: number) {
  const dx = bx - ax;
  const dz = bz - az;
  const len2 = dx * dx + dz * dz || 1;
  let t = ((x - ax) * dx + (z - az) * dz) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(x - (ax + dx * t), z - (az + dz * t));
}

/** Dirt path across the village green, plus door / pond branches. */
export const PATH_RUNS: { pts: [number, number][]; half: number }[] = (() => {
  const home = vWorld(-24, -66);
  const ash = vWorld(16, -52);
  const cabin = vWorld(24, -66);
  const shop = vWorld(18, -42);
  const oak0 = vWorld(-14, -74);
  const oak5 = vWorld(-6, -92);
  const oak4 = vWorld(8, -96);
  const fire: [number, number] = [VX, VZ + 8];
  const spawn: [number, number] = [VX + 3, VZ + 16];
  return [
    {
      half: 2.65,
      pts: [
        [10, VZ - 44],
        [7, VZ - 30],
        [9, VZ - 16],
        [3, VZ - 4],
        spawn,
        fire,
        [VX, VZ],
        [VX - 4, VZ - 12],
        [POND.x + 8, POND.z + 6],
      ],
    },
    { half: 2.15, pts: [[9, VZ - 16], [20, VZ - 12], [28, VZ - 6]] },
    { half: 2.05, pts: [
      [TREE_LADDER.x + 1.4, TREE_LADDER.z + 2.6],
      [TREE_TRUNK.x + 10, TREE_TRUNK.z + 16],
      [VX - 14, VZ - 26],
      [VX - 6, VZ - 8],
      [VX, VZ + 8],
    ] },
    { half: 1.5, pts: [fire, [home.x + 4, home.z + 6], [home.x, home.z + 4.6]] },
    { half: 1.48, pts: [[VX, VZ], [ash.x, ash.z + 5.4]] },
    { half: 1.45, pts: [[VX, VZ], [cabin.x, cabin.z + 4.8]] },
    { half: 1.42, pts: [fire, [oak0.x, oak0.z + 4.2]] },
    { half: 1.42, pts: [[VX - 4, VZ - 12], [oak5.x, oak5.z + 4.2]] },
    { half: 1.42, pts: [[VX - 4, VZ - 12], [oak4.x, oak4.z + 4.2]] },
    { half: 1.45, pts: [[shop.x - 4, shop.z + 8], [shop.x, shop.z + 5.4]] },
    { half: 1.7, pts: [[VX + 8, VZ + 4], [40, -52]] },
    { half: 1.65, pts: [[VX + 10, VZ - 6], [50, -98]] },
    { half: 1.6, pts: [[VX - 8, VZ - 8], [-48, -124]] },
    { half: 1.8, pts: [spawn, [VX, VZ + 36], [0, -48]] },
    { half: 2.35, pts: [spawn, [VX + 70, VZ + 10], [220, -90], [DESERT_AT.x, DESERT_AT.z]] },
    { half: 2.25, pts: [[VX, VZ], [-90, VZ + 4], [COW_PAD.x, COW_PAD.z]] },
    { half: 2.1, pts: [spawn, [VX + 2, VZ - 90], [8, -360]] },
    { half: 3.4, pts: [spawn, [8, -360], [40, -1400], [80, -3200], [120, -5600], [120, -7900], [80, -12000], [40, -16000]] },
    { half: 3.2, pts: [spawn, [220, -90], [800, -200], [1800, -320], [3380, -400]] },
    { half: 3.2, pts: [[VX, VZ], [0, 280], [-40, 900], [-100, 2000], [-160, 3460]] },
    { half: 3.0, pts: [spawn, [-80, VZ + 8], [-400, -40], [-1200, 200], [-2200, -180]] },
    { half: 2.9, pts: [spawn, [40, 80], [200, 400], [540, 1200], [540, 4560]] },
  ];
})();

export function pathU(x: number, z: number) {
  let best = 0;
  for (const run of PATH_RUNS) {
    const pts = run.pts;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i]!;
      const b = pts[i + 1]!;
      const d = distSeg(x, z, a[0], a[1], b[0], b[1]);
      const u = 1 - d / run.half;
      if (u > best) best = u;
    }
  }
  if (best <= 0) return 0;
  return best * best * (3 - 2 * best);
}

type Pad = { x: number; z: number; hx: number; hz: number; y: number; blend: number };
const PAD_SPECS: { ox: number; oz: number; w: number; d: number }[] = [
  { ox: -24, oz: -66, w: 16.4, d: 15.2 },
  { ox: 0, oz: -50, w: 16.4, d: 15.2 },
  { ox: 16, oz: -52, w: 22.8, d: 20.4 },
  { ox: 24, oz: -66, w: 16.4, d: 15.2 },
  { ox: 18, oz: -42, w: 20.6, d: 18.8 },
  { ox: -14, oz: -74, w: 14.6, d: 13.4 },
  { ox: -4, oz: -64, w: 14.6, d: 13.4 },
  { ox: 14, oz: -74, w: 14.6, d: 13.4 },
  { ox: -24, oz: -88, w: 14.6, d: 13.4 },
  { ox: 8, oz: -96, w: 14.6, d: 13.4 },
  { ox: -6, oz: -92, w: 14.6, d: 13.4 },
  { ox: 22, oz: -90, w: 14.6, d: 13.4 },
  { ox: -36, oz: -78, w: 14.6, d: 13.4 },
  { ox: 34, oz: -98, w: 14.6, d: 13.4 },
  { ox: 2, oz: -116, w: 16.8, d: 15.4 },
  { ox: -34, oz: -126, w: 22.8, d: 20.2 },
  { ox: 32, oz: -112, w: 22.4, d: 20.0 },
  { ox: 46, oz: -94, w: 16.8, d: 15.6 },
];

let HOUSE_PADS: Pad[] | null = null;
let skipPads = false;
export function housePads(): Pad[] {
  if (HOUSE_PADS) return HOUSE_PADS;
  HOUSE_PADS = PAD_SPECS.map((s) => {
    const p = vWorld(s.ox, s.oz);
    return {
      x: p.x,
      z: p.z,
      hx: s.w * 0.5 + 1.6,
      hz: s.d * 0.5 + 1.6,
      y: 0,
      blend: 5.2,
    };
  });
  skipPads = true;
  for (const p of HOUSE_PADS) p.y = VILLAGE_Y;
  HOUSE_PADS.push(
    { x: 0, z: KEEP_Z - 18, hx: 10.4, hz: 8.2, y: KEEP_Y + 8.8, blend: 10 },
    { x: 40, z: -52, hx: 8.2, hz: 7.4, y: VILLAGE_Y, blend: 5.2 },
    { x: 50, z: -98, hx: 8.4, hz: 7.6, y: VILLAGE_Y, blend: 5.2 },
    { x: -48, z: -124, hx: 8.6, hz: 7.8, y: VILLAGE_Y, blend: 5.2 },
  );
  skipPads = false;
  return HOUSE_PADS;
}

export function flattenHousePads(x: number, z: number, y: number) {
  if (skipPads) return y;
  if (pondU(x, z) > 0.1) return y;
  let out = y;
  for (const p of housePads()) {
    const dx = Math.abs(x - p.x) - p.hx;
    const dz = Math.abs(z - p.z) - p.hz;
    if (dx <= 0 && dz <= 0) {
      out = p.y;
      continue;
    }
    const d = Math.hypot(Math.max(0, dx), Math.max(0, dz));
    if (d < p.blend) {
      const u = 1 - d / p.blend;
      const s = u * u * (3 - 2 * u);
      out = out * (1 - s) + p.y * s;
    }
  }
  return out;
}

/** Thin fence AABBs. Gaps are the path gates — do not close them. */
export const FENCE_HITS: { cx: number; cz: number; hx: number; hz: number }[] = [
  { cx: vWorld(-24, -66).x - 7.4, cz: vWorld(-24, -66).z - 0.7, hx: 0.16, hz: 5.9 },
  { cx: vWorld(-24, -66).x, cz: vWorld(-24, -66).z - 6.6, hx: 7.4, hz: 0.16 },
  { cx: 0, cz: vWorld(0, -50).z - 6.4, hx: 7.1, hz: 0.16 },
  { cx: vWorld(0, -50).x - 7.1, cz: vWorld(0, -50).z - 0.9, hx: 0.16, hz: 5.5 },
  { cx: vWorld(0, -50).x + 7.1, cz: vWorld(0, -50).z - 0.9, hx: 0.16, hz: 5.5 },
  { cx: POND.x - 12, cz: POND.z + 8.5, hx: 6, hz: 0.16 },
];

export type TreeSpot = { x: number; z: number; s: number; r: number; h: number };

function seeded(start = 1) {
  let n = start;
  return () => {
    n = (n * 16807) % 2147483647;
    return (n - 1) / 2147483646;
  };
}

export function treeSpots(): TreeSpot[] {
  const list: TreeSpot[] = [];
  const rnd = seeded();
  for (let i = 0; i < 520 && list.length < 240; i++) {
    const a = rnd() * Math.PI * 2;
    const rad = 40 + rnd() * 1680;
    const x = Math.cos(a) * rad;
    const z = Math.sin(a) * rad - 10;
    if (Math.hypot(x, z - KEEP_Z) < 22) continue;
    if (Math.hypot(x - VX, z - VZ) < VR + 14) continue;
    if (pondU(x, z) > 0.08) continue;
    if (z < VZ - 40 && Math.abs(x) < 12) continue;
    if (z > VZ && z < -16 && Math.abs(x) < 16) continue;
    list.push({
      x,
      z,
      s: 1.35 + rnd() * 1.15,
      r: rnd() * Math.PI,
      h: 0.92 + rnd() * 0.55,
    });
  }
  list.push(
    { x: 92, z: -380, s: 3.4, r: 0.4, h: 1.35 },
    { x: -98, z: -360, s: 3.1, r: 1.1, h: 1.28 },
    { x: 28, z: -430, s: 3.6, r: 2.2, h: 1.4 },
    { x: 120, z: -40, s: 2.8, r: 0.8, h: 1.22 },
    { x: -118, z: -18, s: 2.9, r: 1.6, h: 1.18 },
  );
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2 + 0.11;
    const dist = VR + 12 + (i % 5) * 7.5;
    const x = VX + Math.sin(a) * dist;
    const z = VZ + Math.cos(a) * dist;
    if (Math.hypot(x, z - KEEP_Z) < 34) continue;
    if (pondU(x, z) > 0.08) continue;
    list.push({
      x,
      z,
      s: 1.5 + (i % 4) * 0.24,
      r: a,
      h: 0.95 + (i % 3) * 0.14,
    });
  }
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2 + 0.37;
    const dist = 92 + (i % 7) * 42;
    const x = VX + Math.sin(a) * dist;
    const z = VZ + Math.cos(a) * dist;
    if (Math.hypot(x, z - KEEP_Z) < 40) continue;
    if (Math.hypot(x - VX, z - VZ) < VR + 18) continue;
    if (pondU(x, z) > 0.08) continue;
    list.push({
      x,
      z,
      s: 1.6 + (i % 5) * 0.28,
      r: a * 0.7,
      h: 1.0 + (i % 4) * 0.12,
    });
  }
  for (let i = 0; i < 56; i++) {
    const a = (i / 56) * Math.PI * 2 + 0.61;
    const dist = 340 + (i % 8) * 55;
    const x = VX + Math.sin(a) * dist;
    const z = VZ + Math.cos(a) * dist;
    if (Math.hypot(x, z - KEEP_Z) < 40) continue;
    if (Math.hypot(x - VX, z - VZ) < VR + 18) continue;
    if (pondU(x, z) > 0.08) continue;
    list.push({
      x,
      z,
      s: 1.8 + (i % 5) * 0.32,
      r: a * 0.5,
      h: 1.05 + (i % 4) * 0.14,
    });
  }
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2 + 0.88;
    const dist = 720 + (i % 9) * 72;
    const x = VX + Math.sin(a) * dist;
    const z = VZ + Math.cos(a) * dist;
    if (Math.hypot(x, z - KEEP_Z) < 40) continue;
    if (pondU(x, z) > 0.08) continue;
    list.push({
      x,
      z,
      s: 1.9 + (i % 5) * 0.34,
      r: a * 0.4,
      h: 1.08 + (i % 4) * 0.16,
    });
  }
  return list;
}

export const TREES = treeSpots();

/** Canopy stand height, or 0 if not over a tree. */
export function treePerch(x: number, z: number) {
  let best = 0;
  for (const t of TREES) {
    const canopy = 2.05 * t.s;
    if (Math.hypot(x - t.x, z - t.z) >= canopy) continue;
    const y = heightAt(t.x, t.z) + 4.15 * t.s;
    if (y > best) best = y;
  }
  return best;
}

export type RockSpot = { x: number; z: number; s: number; r: number; k: number };

export function rockSpots(): RockSpot[] {
  const list: RockSpot[] = [];
  const rnd = seeded(3);
  for (let i = 0; i < 160; i++) {
    const a = rnd() * Math.PI * 2;
    const rad = 22 + rnd() * 8500;
    const x = Math.cos(a) * rad;
    const z = Math.sin(a) * rad - 8;
    if (Math.hypot(x, z - KEEP_Z) < 18) continue;
    if (Math.hypot(x - VX, z - VZ) < VR + 14) continue;
    if (z > VZ && z < -16 && Math.abs(x) < 16) continue;
    list.push({
      x,
      z,
      s: 0.38 + rnd() * 0.22,
      r: rnd() * Math.PI,
      k: rnd(),
    });
  }
  const nearTown: { x: number; z: number; s: number; r: number }[] = [
    { x: 14.2, z: VZ + VR + 10, s: 0.5, r: 0.4 },
    { x: -18.6, z: VZ + VR + 14, s: 0.48, r: 1.15 },
    { x: 28.4, z: VZ + VR + 6, s: 0.52, r: 0.7 },
    { x: VX + VR + 12, z: VZ + 8, s: 0.5, r: 0.55 },
    { x: VX + VR + 8, z: VZ - 10, s: 0.46, r: 1.4 },
    { x: VX - VR - 10, z: VZ + 6, s: 0.5, r: 0.2 },
    { x: VX - VR - 14, z: VZ - 12, s: 0.48, r: 1.8 },
    { x: 8.2, z: -22.4, s: 0.5, r: 0.9 },
    { x: -12.6, z: -16.8, s: 0.47, r: 0.35 },
    { x: 22.8, z: -8.4, s: 0.49, r: 1.25 },
  ];
  for (const t of nearTown) list.push({ x: t.x, z: t.z, s: t.s, r: t.r, k: 0.4 });
  const boulders: { x: number; z: number; s: number; r: number }[] = [
    { x: 62.4, z: -8.6, s: 2.15, r: 0.4 },
    { x: -64.2, z: 8.4, s: 1.92, r: 1.35 },
    { x: 142.2, z: 36.4, s: 2.05, r: 0.6 },
    { x: -154.6, z: 48.2, s: 2.22, r: 1.1 },
    { x: 310, z: -40, s: 2.35, r: 0.9 },
    { x: -320, z: 70, s: 2.18, r: 1.4 },
    { x: 248.6, z: -128.4, s: 2.32, r: 1.6 },
    { x: 418.2, z: 74.6, s: 2.22, r: 1.25 },
    { x: 88.4, z: 214.2, s: 2.05, r: 0.5 },
    { x: 94.6, z: 220.8, s: 1.95, r: 1.1 },
    { x: 82.2, z: 226.4, s: 2.12, r: 0.8 },
    { x: -92.4, z: 348.2, s: 2.28, r: 1.3 },
    { x: -605, z: -22, s: 2.08, r: 0.7 },
    { x: 648, z: 158, s: 1.95, r: 1.2 },
    { x: 74, z: 538, s: 2.12, r: 0.4 },
    { x: 776, z: -304, s: 2.25, r: 1.5 },
    { x: -206, z: 498, s: 1.88, r: 0.9 },
  ];
  for (const b of boulders) {
    if (Math.hypot(b.x, b.z - KEEP_Z) < 16) continue;
    if (Math.hypot(b.x - VX, b.z - VZ) < VR + 6) continue;
    list.push({ x: b.x, z: b.z, s: b.s, r: b.r, k: 0.82 });
  }
  return list;
}

export const ROCKS = rockSpots();
export const blownRocks = new Set<string>();

export function rockKey(x: number, z: number) {
  return `${x.toFixed(1)},${z.toFixed(1)}`;
}

export function rockGone(x: number, z: number) {
  return blownRocks.has(rockKey(x, z));
}

export function rockRadius(s: number) {
  return 0.62 * s;
}

export function rockHeight(s: number) {
  return Math.max(0.22, 0.58 * s);
}

export function climbOnRocks(x: number, z: number) {
  let h = 0;
  for (const r of ROCKS) {
    if (r.s < 1.1 || rockGone(r.x, r.z)) continue;
    const rad = rockRadius(r.s);
    if (Math.hypot(x - r.x, z - r.z) < rad * 0.78) h = Math.max(h, rockHeight(r.s));
  }
  return h;
}

export const LOGS: { x: number; z: number; s: number; r: number }[] = [
  { x: 28.4, z: 18.2, s: 1, r: 0.4 },
  { x: -34.2, z: 12.6, s: 0.92, r: 1.1 },
  { x: 48.6, z: -22.4, s: 1.08, r: -0.5 },
  { x: -56.2, z: -18.8, s: 0.86, r: 0.8 },
  { x: 102.4, z: 28.2, s: 1.12, r: 0.2 },
];

export const SHROOMS: { x: number; z: number; s: number }[] = [
  { x: 26.4, z: 16.2, s: 1 },
  { x: -30.8, z: 10.4, s: 0.9 },
  { x: 44.2, z: -18.6, s: 1.1 },
];

export type GrassTuft = { id: string; x: number; z: number };

export function fieldPebbles(world: WorldId): { id: string; x: number; z: number }[] {
  const list: { id: string; x: number; z: number }[] = [];
  const rnd = seeded(world.length * 19 + 3);
  const count = world === "meadow" ? 10 : 6;
  for (let i = 0; i < count * 2 && list.length < count; i++) {
    const a = rnd() * Math.PI * 2;
    const rad = 6 + rnd() * (world === "meadow" ? 34 : 16);
    const x = Math.cos(a) * rad + (world === "meadow" ? -6 : 2);
    const z = Math.sin(a) * rad + (world === "meadow" ? 10 : 10);
    if (pondU(x, z) > 0.12) continue;
    if (Math.hypot(x, z - KEEP_Z) < 16) continue;
    if (Math.hypot(x - VX, z - VZ) < VR + 8) continue;
    list.push({ id: `pb-${world}-${list.length}`, x, z });
  }
  return list;
}

export function pickShrooms(world: WorldId): { id: string; x: number; z: number; s: number }[] {
  if (world !== "meadow") {
    return [
      { id: `sh-${world}-0`, x: 6.4, z: 10.2, s: 1 },
      { id: `sh-${world}-1`, x: -7.8, z: -3.4, s: 0.9 },
    ];
  }
  const list: { id: string; x: number; z: number; s: number }[] = [];
  TREES.forEach((t, i) => {
    if (i % 7 !== 0) return;
    if (Math.hypot(t.x, t.z - KEEP_Z) < 20) return;
    if (Math.hypot(t.x - VX, t.z - VZ) < VR + 4) return;
    list.push({
      id: `sh-t${i}`,
      x: t.x + 0.7 * t.s,
      z: t.z + 0.55 * t.s,
      s: 0.85 + (i % 3) * 0.1,
    });
  });
  const extras = [
    { id: "sh-r0", x: 62.4 + 1.2, z: -8.6, s: 0.9 },
    { id: "sh-h0", x: vWorld(-24, -66).x + 2.2, z: vWorld(-24, -66).z + 2.4, s: 0.8 },
  ];
  return [...list.slice(0, 18), ...extras];
}

export const pickedShrooms = new Set<string>();

export function grassWhisps(world: WorldId): { x: number; z: number }[] {
  if (world === "grave" || world === "cavern" || world === "echo" || world === "keep") return [];
  const list: { x: number; z: number }[] = [];
  const rnd = seeded(17 + world.length * 11);
  const count = world === "meadow" ? 110 : 32;
  for (let i = 0; i < count * 2 && list.length < count; i++) {
    const a = rnd() * Math.PI * 2;
    const rad = 10 + rnd() * (world === "meadow" ? 1800 : 56);
    const x = Math.cos(a) * rad;
    const z = Math.sin(a) * rad - 8;
    if (pondU(x, z) > 0.12) continue;
    if (Math.hypot(x - VX, z - VZ) < VR + 14) continue;
    if (Math.hypot(x, z - KEEP_Z) < 16) continue;
    if (z > VZ && z < -16 && Math.abs(x) < 16) continue;
    list.push({ x, z });
  }
  return list;
}

export function grassTufts(world: WorldId): GrassTuft[] {
  if (world === "grave") return [];
  const list: GrassTuft[] = [];
  const rnd = seeded(11 + world.length * 13);
  const count = world === "meadow" ? 110 : 28;
  for (let i = 0; i < count * 3 && list.length < count; i++) {
    const a = rnd() * Math.PI * 2;
    const rad = 8 + rnd() * (world === "meadow" ? 2000 : 48);
    const x = Math.cos(a) * rad;
    const z = Math.sin(a) * rad - 6;
    if (pondU(x, z) > 0.12) continue;
    if (Math.hypot(x - VX, z - VZ) < VR + 14) continue;
    if (Math.hypot(x, z - KEEP_Z) < 16) continue;
    if (z > VZ && z < -16 && Math.abs(x) < 16) continue;
    list.push({ id: `g-${world}-${list.length}`, x, z });
  }
  return list;
}

export function isDungeon(world: WorldId) {
  return world !== "meadow" && world !== "keep" && world !== "arena";
}

export function isDeepDungeon(world: WorldId) {
  return isDungeon(world) && world !== "cavern" && world !== "marsh";
}

export function isBossKind(kind: string) {
  return kind === "remainder" || kind === "leftover" || kind === "nag" || kind === "rook" || kind === "warden";
}

export function spawnOnField(
  world: WorldId,
  resume: { x: number; y: number } | null,
): { x: number; z: number } {
  if (world === "meadow") {
    if (
      resume &&
      Number.isFinite(resume.x) &&
      Number.isFinite(resume.y) &&
      Math.abs(resume.x) < 250 &&
      resume.y < 4 &&
      resume.y > -400
    ) {
      return { x: resume.x, z: resume.y };
    }
    return { x: TREE_HOME.x, z: TREE_HOME.z + 1.15 };
  }
  if (resume && Number.isFinite(resume.x) && Number.isFinite(resume.y) && Math.abs(resume.x) < 15000 && Math.abs(resume.y) < 16000) {
    return { x: resume.x, z: resume.y };
  }
  if (world === "arena") return { x: 0, z: 12 };
  if (world === "keep") return { x: 0, z: 8.4 };
  if (isDungeon(world)) return { x: 0, z: 16.2 };
  return { x: 0, z: 12.4 };
}

export type FieldSpot = { id: string; kind: string; x: number; z: number };
export type CrystalSpot = { id: string; x: number; z: number };

export function fieldActors(world: WorldId): {
  enemies: FieldSpot[];
  crystals: CrystalSpot[];
  gate: { x: number; z: number };
} {
  if (world === "arena") {
    const n = 12;
    return {
      enemies: Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        return { id: `arena-e${i}`, kind: "plusling", x: Math.cos(a) * 18.2, z: Math.sin(a) * 18.2 };
      }),
      crystals: [],
      gate: { x: 0, z: -16 },
    };
  }
  if (world === "keep") {
    return {
      enemies: [{ id: "keep-boss", kind: "remainder", x: 0, z: -9.2 }],
      crystals: [
        { id: "keep-c0", x: -6.4, z: 8.6 },
        { id: "keep-c1", x: 6.4, z: 8.6 },
        { id: "keep-c2", x: 0, z: 10.2 },
      ],
      gate: { x: 0, z: 14 },
    };
  }
  if (world === "meadow") {
    return {
      enemies: [
        { id: "meadow-e0", kind: "plusling", x: 18, z: -40 },
        { id: "meadow-e1", kind: "plusling", x: -16, z: -38 },
        { id: "meadow-e2", kind: "plusling", x: 88, z: -96 },
        { id: "meadow-e3", kind: "plusling", x: -82, z: -92 },
        { id: "meadow-e4", kind: "plusling", x: 220, z: -280 },
        { id: "meadow-e5", kind: "plusling", x: -210, z: -260 },
        { id: "meadow-e6", kind: "plusling", x: 180, z: 160 },
        { id: "meadow-e7", kind: "plusling", x: 96, z: -134 },
        { id: "meadow-e8", kind: "plusling", x: -92, z: -130 },
        { id: "meadow-e9", kind: "plusling", x: -160, z: 180 },
        { id: "meadow-e10", kind: "plusling", x: 24, z: -198 },
        { id: "meadow-e11", kind: "plusling", x: -30, z: -202 },
        { id: "meadow-e12", kind: "plusling", x: 140, z: -240 },
        { id: "meadow-e13", kind: "plusling", x: 90, z: 280 },
        { id: "meadow-e14", kind: "plusling", x: 340, z: -230 },
        { id: "meadow-e15", kind: "plusling", x: -110, z: -42 },
        { id: "meadow-e16", kind: "plusling", x: 78, z: 52 },
        { id: "meadow-e17", kind: "plusling", x: 48, z: -46 },
        { id: "meadow-e18", kind: "plusling", x: 420, z: 40 },
        { id: "meadow-e19", kind: "plusling", x: -380, z: -20 },
        { id: "meadow-e20", kind: "plusling", x: 250, z: -460 },
        { id: "meadow-e21", kind: "plusling", x: -240, z: 300 },
        { id: "meadow-e22", kind: "plusling", x: 620, z: -250 },
        { id: "meadow-e23", kind: "plusling", x: -560, z: 160 },
        { id: "meadow-e24", kind: "plusling", x: 980, z: 80 },
        { id: "meadow-e25", kind: "plusling", x: -1020, z: 40 },
        { id: "meadow-e26", kind: "plusling", x: 220, z: 980 },
        { id: "meadow-e27", kind: "plusling", x: -180, z: -1020 },
        { id: "meadow-e28", kind: "plusling", x: 1080, z: -420 },
        { id: "meadow-e29", kind: "plusling", x: -980, z: -560 },
        { id: "meadow-e30", kind: "plusling", x: 760, z: 720 },
        { id: "meadow-e31", kind: "plusling", x: -840, z: 780 },
        { id: "meadow-e32", kind: "plusling", x: LOST_CART.x + 18, z: LOST_CART.z + 10 },
        { id: "meadow-e33", kind: "plusling", x: HAT_ROCK.x - 16, z: HAT_ROCK.z + 12 },
        { id: "meadow-e34", kind: "plusling", x: GEYSER_AT.x - 20, z: GEYSER_AT.z + 14 },
        { id: "meadow-e35", kind: "plusling", x: LIGHT_AT.x + 22, z: LIGHT_AT.z + 18 },
        { id: "meadow-e36", kind: "plusling", x: FACE_AT.x + 28, z: FACE_AT.z - 16 },
        { id: "meadow-e37", kind: "plusling", x: FOX_AT.x - 24, z: FOX_AT.z - 12 },
        { id: "meadow-e38", kind: "plusling", x: MAIL_NOWHERE.x + 16, z: MAIL_NOWHERE.z + 20 },
        { id: "meadow-e39", kind: "plusling", x: SLEEP_GIANT.x + 40, z: SLEEP_GIANT.z + 20 },
        { id: "meadow-e40", kind: "plusling", x: STONE_RING.x - 30, z: STONE_RING.z - 18 },
        { id: "meadow-e41", kind: "plusling", x: FOSSIL_AT.x - 22, z: FOSSIL_AT.z + 16 },
        { id: "meadow-e42", kind: "plusling", x: SWORD_STONE.x + 20, z: SWORD_STONE.z - 14 },
        { id: "meadow-e43", kind: "plusling", x: WHALE_AT.x + 36, z: WHALE_AT.z - 18 },
        { id: "meadow-e44", kind: "plusling", x: CLOUD_PIER.x + 22, z: CLOUD_PIER.z - 16 },
        { id: "meadow-e45", kind: "plusling", x: SAND_SHIP.x - 24, z: SAND_SHIP.z + 14 },
        { id: "meadow-e46", kind: "plusling", x: ICE_CROWN.x + 18, z: ICE_CROWN.z + 20 },
        { id: "meadow-e47", kind: "plusling", x: NEEDLE_AT.x - 16, z: NEEDLE_AT.z + 12 },
        { id: "meadow-e48", kind: "plusling", x: LOOK_AT.x + 10, z: LOOK_AT.z + 8 },
        { id: "meadow-e49", kind: "plusling", x: SOCK_PEAK.x + 28, z: SOCK_PEAK.z - 16 },
        { id: "meadow-e50", kind: "plusling", x: CLOCK_WOOD.x - 18, z: CLOCK_WOOD.z + 14 },
        { id: "meadow-e51", kind: "plusling", x: FLOWER_SEA.x + 22, z: FLOWER_SEA.z - 12 },
        { id: "meadow-e52", kind: "plusling", x: SNORE_HILL.x + 30, z: SNORE_HILL.z + 18 },
        { id: "meadow-e53", kind: "plusling", x: RAINBOW_ARCH.x - 16, z: RAINBOW_ARCH.z - 10 },
        { id: "meadow-e54", kind: "plusling", x: ANT_TABLE.x + 14, z: ANT_TABLE.z + 10 },
        { id: "meadow-e55", kind: "plusling", x: BIRD_STACK.x - 20, z: BIRD_STACK.z + 12 },
        { id: "meadow-e56", kind: "plusling", x: LOST_SHOE.x + 16, z: LOST_SHOE.z - 8 },
        { id: "meadow-e57", kind: "plusling", x: RIDE_AT.x + 8, z: RIDE_AT.z - 6 },
        { id: "meadow-e58", kind: "plusling", x: BREAD_HILL.x + 24, z: BREAD_HILL.z - 14 },
        { id: "meadow-e59", kind: "plusling", x: EDGE_MAIL.x + 12, z: EDGE_MAIL.z - 10 },
        { id: "meadow-e60", kind: "plusling", x: STAIR_NONE.x - 16, z: STAIR_NONE.z + 12 },
        { id: "meadow-e61", kind: "plusling", x: CHESS_AT.x + 18, z: CHESS_AT.z - 10 },
        { id: "meadow-e62", kind: "plusling", x: DUCK_LAKE.x - 14, z: DUCK_LAKE.z + 10 },
        { id: "meadow-e63", kind: "plusling", x: DOOR_FIELD.x + 12, z: DOOR_FIELD.z + 8 },
        { id: "meadow-e64", kind: "plusling", x: YOU_COMPASS.x - 10, z: YOU_COMPASS.z + 8 },
        { id: "meadow-e65", kind: "plusling", x: PIANO_AT.x + 16, z: PIANO_AT.z - 10 },
        { id: "meadow-e66", kind: "plusling", x: SPOON_AT.x - 12, z: SPOON_AT.z + 8 },
        { id: "meadow-e67", kind: "plusling", x: BOAT_AT.x + 10, z: BOAT_AT.z - 8 },
        { id: "meadow-e68", kind: "plusling", x: CAT_AT.x + 20, z: CAT_AT.z + 12 },
        { id: "meadow-e69", kind: "plusling", x: WISH_AT.x - 8, z: WISH_AT.z + 6 },
        { id: "meadow-e70", kind: "plusling", x: CUP_AT.x + 14, z: CUP_AT.z - 8 },
        { id: "meadow-e71", kind: "plusling", x: UMBRELLA_AT.x - 12, z: UMBRELLA_AT.z + 10 },
        { id: "meadow-e72", kind: "plusling", x: SLIDE_AT.x + 16, z: SLIDE_AT.z + 12 },
        { id: "meadow-e73", kind: "plusling", x: HAT_FAR.x - 10, z: HAT_FAR.z - 8 },
      ],
      crystals: [
        { id: "meadow-c0", x: 16.4, z: 24.2 },
        { id: "meadow-c1", x: -18.6, z: 20.4 },
        { id: "meadow-c2", x: 32.2, z: -8.6 },
        { id: "meadow-c3", x: -28.4, z: -22.2 },
        { id: "meadow-c4", x: 8.2, z: 36.4 },
        { id: "meadow-c5", x: -48.2, z: 6.4 },
        { id: "meadow-c6", x: 54.6, z: 12.8 },
        { id: "meadow-c7", x: -8.4, z: 44.2 },
        { id: "meadow-c8", x: 280, z: 90 },
        { id: "meadow-c9", x: -310, z: 140 },
        { id: "meadow-c10", x: 540, z: -180 },
        { id: "meadow-c11", x: -520, z: 220 },
        { id: "meadow-c12", x: 620, z: 380 },
        { id: "meadow-c13", x: -580, z: -280 },
        { id: "meadow-c14", x: 700, z: -360 },
        { id: "meadow-c15", x: -640, z: 400 },
        { id: "meadow-c16", x: 480, z: 520 },
        { id: "meadow-c17", x: -420, z: 560 },
        { id: "meadow-c18", x: 200, z: -580 },
        { id: "meadow-c19", x: -180, z: -560 },
        { id: "meadow-c20", x: 740, z: 80 },
        { id: "meadow-c21", x: -720, z: 40 },
        { id: "meadow-c22", x: 360, z: -500 },
        { id: "meadow-c23", x: -340, z: 640 },
        { id: "meadow-c24", x: 1020, z: 200 },
        { id: "meadow-c25", x: -1080, z: 160 },
        { id: "meadow-c26", x: 180, z: 1040 },
        { id: "meadow-c27", x: -160, z: -1100 },
        { id: "meadow-c28", x: 1180, z: -480 },
        { id: "meadow-c29", x: -1140, z: -620 },
        { id: "meadow-c30", x: WIND_HILL.x + 8, z: WIND_HILL.z - 6 },
        { id: "meadow-c31", x: MOON_POND.x - 6, z: MOON_POND.z + 8 },
        { id: "meadow-c32", x: LOST_CART.x + 5, z: LOST_CART.z - 4 },
        { id: "meadow-c33", x: HAT_ROCK.x - 6, z: HAT_ROCK.z + 5 },
        { id: "meadow-c34", x: GEYSER_AT.x + 6, z: GEYSER_AT.z - 4 },
        { id: "meadow-c35", x: LIGHT_AT.x - 8, z: LIGHT_AT.z + 6 },
        { id: "meadow-c36", x: FACE_AT.x + 10, z: FACE_AT.z - 8 },
        { id: "meadow-c37", x: FOX_AT.x - 6, z: FOX_AT.z + 8 },
        { id: "meadow-c38", x: BEAN_AT.x - 4, z: BEAN_AT.z + 6 },
        { id: "meadow-c39", x: CONCH_AT.x + 5, z: CONCH_AT.z - 5 },
        { id: "meadow-c40", x: SLEEP_GIANT.x + 12, z: SLEEP_GIANT.z - 8 },
        { id: "meadow-c41", x: STONE_RING.x + 6, z: STONE_RING.z },
        { id: "meadow-c42", x: MIRROR_LAKE.x - 8, z: MIRROR_LAKE.z + 6 },
        { id: "meadow-c43", x: FOSSIL_AT.x - 5, z: FOSSIL_AT.z + 4 },
        { id: "meadow-c44", x: SWORD_STONE.x + 4, z: SWORD_STONE.z - 6 },
        { id: "meadow-c45", x: LOOK_AT.x - 3, z: LOOK_AT.z + 4 },
        { id: "meadow-c46", x: WHALE_AT.x + 10, z: WHALE_AT.z - 6 },
        { id: "meadow-c47", x: CLOUD_PIER.x - 6, z: CLOUD_PIER.z + 4 },
        { id: "meadow-c48", x: SAND_SHIP.x + 8, z: SAND_SHIP.z - 4 },
        { id: "meadow-c49", x: ICE_CROWN.x - 5, z: ICE_CROWN.z + 6 },
        { id: "meadow-c50", x: NEEDLE_AT.x + 4, z: NEEDLE_AT.z - 5 },
        { id: "meadow-c51", x: SOCK_PEAK.x + 8, z: SOCK_PEAK.z - 6 },
        { id: "meadow-c52", x: CLOCK_WOOD.x - 5, z: CLOCK_WOOD.z + 4 },
        { id: "meadow-c53", x: FLOWER_SEA.x + 6, z: FLOWER_SEA.z - 4 },
        { id: "meadow-c54", x: SNORE_HILL.x - 8, z: SNORE_HILL.z + 6 },
        { id: "meadow-c55", x: RAINBOW_ARCH.x + 4, z: RAINBOW_ARCH.z },
        { id: "meadow-c56", x: ANT_TABLE.x - 3, z: ANT_TABLE.z + 3 },
        { id: "meadow-c57", x: BIRD_STACK.x + 5, z: BIRD_STACK.z - 4 },
        { id: "meadow-c58", x: LOST_SHOE.x - 4, z: LOST_SHOE.z + 5 },
        { id: "meadow-c59", x: RIDE_AT.x - 2, z: RIDE_AT.z + 3 },
        { id: "meadow-c60", x: BREAD_HILL.x + 6, z: BREAD_HILL.z - 4 },
        { id: "meadow-c61", x: EDGE_MAIL.x - 3, z: EDGE_MAIL.z + 2 },
        { id: "meadow-c62", x: STAIR_NONE.x + 4, z: STAIR_NONE.z - 3 },
        { id: "meadow-c63", x: CHESS_AT.x - 5, z: CHESS_AT.z + 4 },
        { id: "meadow-c64", x: DUCK_LAKE.x + 5, z: DUCK_LAKE.z - 3 },
        { id: "meadow-c65", x: DOOR_FIELD.x - 4, z: DOOR_FIELD.z + 3 },
        { id: "meadow-c66", x: YOU_COMPASS.x + 3, z: YOU_COMPASS.z - 4 },
        { id: "meadow-c67", x: PIANO_AT.x + 4, z: PIANO_AT.z - 3 },
        { id: "meadow-c68", x: SPOON_AT.x - 4, z: SPOON_AT.z + 3 },
        { id: "meadow-c69", x: BOAT_AT.x + 3, z: BOAT_AT.z - 2 },
        { id: "meadow-c70", x: CAT_AT.x - 6, z: CAT_AT.z + 4 },
        { id: "meadow-c71", x: WISH_AT.x + 4, z: WISH_AT.z - 3 },
        { id: "meadow-c72", x: CUP_AT.x - 4, z: CUP_AT.z + 3 },
        { id: "meadow-c73", x: UMBRELLA_AT.x + 5, z: UMBRELLA_AT.z - 3 },
        { id: "meadow-c74", x: SLIDE_AT.x + 6, z: SLIDE_AT.z - 4 },
        { id: "meadow-c75", x: HAT_FAR.x - 3, z: HAT_FAR.z + 4 },
      ],
      gate: { x: 0, z: -70 },
    };
  }
  if (isDungeon(world)) {
    if (world === "cavern") {
      return {
        enemies: [
          { id: "cavern-e0", kind: "glyphite", x: -10, z: roomZ(3) },
          { id: "cavern-e1", kind: "glyphite", x: 10, z: roomZ(3) + 6 },
          { id: "cavern-e2", kind: "glyphite", x: 8, z: roomZ(5) + 8 },
          { id: "cavern-e3", kind: "glyphite", x: -8, z: roomZ(8) + 4 },
          { id: "cavern-warden", kind: "warden", x: 0, z: roomZ(11) },
        ],
        crystals: [
          { id: "cavern-c0", x: -10, z: roomZ(0) - 4 },
          { id: "cavern-c1", x: 16, z: roomZ(3) - 8 },
          { id: "cavern-c2", x: -12, z: roomZ(6) },
          { id: "cavern-c3", x: 10, z: roomZ(9) },
        ],
        gate: { x: 0, z: 22.2 },
      };
    }
    const n = dungeonRoomCount(world);
    const kind = LEVELS[world].enemies[0]?.kind ?? "glyphite";
    const enemies: FieldSpot[] = [];
    for (let i = 5; i < n - 1; i++) {
      enemies.push({
        id: `${world}-e${i}`,
        kind,
        x: i % 2 ? 14 : -14,
        z: roomZ(i) + (i % 2 ? 6 : -4),
      });
    }
    if (isDeepDungeon(world) && world !== "crater") {
      const boss = world === "echo" || world === "vault" ? "leftover" : "warden";
      enemies.push({ id: `${world}-warden`, kind: boss, x: 0, z: roomZ(n - 2) });
    }
    const crystals: CrystalSpot[] = Array.from({ length: n }, (_, i) => ({
      id: `${world}-c${i}`,
      x: i % 2 ? 18 : -18,
      z: roomZ(i) + 10,
    }));
    return { enemies, crystals, gate: { x: 0, z: 22.2 } };
  }
  return { enemies: [], crystals: [], gate: { x: 0, z: 12 } };
}

export function postgameEchoes(world: WorldId): FieldSpot[] {
  if (world === "arena" || world === "keep") return [];
  const kind = world === "meadow" ? "plusling" : world === "grove" ? "timesprout" : "glyphite";
  return [
    { id: `${world}-echo0`, kind, x: 14.2, z: 10.4 },
    { id: `${world}-echo1`, kind, x: -16.8, z: -8.2 },
  ];
}

export const WORLD_TINT: Record<
  WorldId,
  { grass: string; leaf: string; fog: string; sky: [number, number, number] }
> = {
  meadow: { grass: "#6a8a40", leaf: "#4a6a30", fog: "#d6d2c4", sky: [210, 204, 186] },
  cavern: { grass: "#7a6a52", leaf: "#6a5a42", fog: "#c8b89a", sky: [96, 78, 52] },
  marsh: { grass: "#3a6a48", leaf: "#2a5a38", fog: "#7ab0a0", sky: [22, 42, 28] },
  grove: { grass: "#2a5a28", leaf: "#1a4a1c", fog: "#4a6a48", sky: [16, 32, 8] },
  crater: { grass: "#5a2a18", leaf: "#3a1a10", fog: "#c06030", sky: [90, 22, 4] },
  lake: { grass: "#4a7a58", leaf: "#2a5a38", fog: "#88c4e0", sky: [18, 32, 70] },
  grave: { grass: "#e6eef4", leaf: "#c8d4dc", fog: "#c4d2de", sky: [78, 62, 18] },
  waste: { grass: "#d4b06a", leaf: "#8a6a30", fog: "#f0d8a0", sky: [95, 58, 10] },
  keep: { grass: "#6a7a58", leaf: "#3a5a38", fog: "#90a8c0", sky: [30, 28, 55] },
  echo: { grass: "#5a4a70", leaf: "#3a2a58", fog: "#8878b0", sky: [40, 16, 70] },
  ridge: { grass: "#3a6a30", leaf: "#2a4a20", fog: "#6a8a58", sky: [22, 40, 12] },
  spire: { grass: "#5a5c58", leaf: "#3a3c40", fog: "#90a0b0", sky: [28, 26, 48] },
  fen: { grass: "#3a6a58", leaf: "#2a4a48", fog: "#80c0c8", sky: [16, 48, 52] },
  hollow: { grass: "#4a2818", leaf: "#3a1810", fog: "#c07040", sky: [80, 28, 8] },
  vault: { grass: "#3a2a48", leaf: "#2a1a38", fog: "#6a5088", sky: [36, 12, 58] },
  arena: { grass: "#6a7a48", leaf: "#4a6a30", fog: "#a8c090", sky: [40, 50, 18] },
};
