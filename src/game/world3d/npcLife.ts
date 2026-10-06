import { POND, WELL_AT, VX, VZ, BELL_AT } from "./field";
import { FIRE_PIT, FOUNTAIN, HAY, MILL_AT, PADDOCK, STALL } from "./village";
import { FARM_AT } from "./townLife";
import { gameClock, live } from "./live";
import { useGame } from "../store";

type Spot = { x: number; z: number };

const SQUARE: Spot = { x: VX, z: VZ };
const EAST_PATH: Spot = { x: VX + 18, z: VZ + 6 };
const WEST_PATH: Spot = { x: VX - 16, z: VZ + 4 };
const DOCK: Spot = { x: POND.x + 8.4, z: POND.z + 2.2 };
const FARM: Spot = { x: FARM_AT.x + 2.2, z: FARM_AT.z + 1.4 };
const FORGE: Spot = { x: VX + 22, z: VZ + 14 };
const NOTICE: Spot = { x: VX - 4, z: VZ - 6 };
const GATE: Spot = { x: 0, z: -20 };
const ROAD: Spot = { x: 2, z: 18 };
const WOOD: Spot = { x: VX + 24, z: VZ + 8 };
const DRAIN: Spot = { x: -22, z: -104 };
const BROOK: Spot = { x: -24.6, z: -132.2 };

function jitter(spot: Spot, id: string, hour: number): Spot {
  const n = id.charCodeAt(0) + id.length * 13 + hour * 7;
  const a = (n % 360) * 0.01745;
  const r = 0.55 + (n % 5) * 0.16;
  return { x: spot.x + Math.cos(a) * r, z: spot.z + Math.sin(a) * r };
}

function townGather() {
  const d = useGame.getState().defeated?.meadow;
  return Array.isArray(d) && d.includes("rook");
}

/** Where an outdoor villager is walking right now. Night sends them home. */
export function npcErrand(id: string | undefined, homeX: number, homeZ: number): Spot | null {
  if (!id) return null;
  const { t } = gameClock();
  const hour = Math.floor(t);
  const night = t >= 20.15 || t < 6.05;
  const home = { x: homeX, z: homeZ };
  if (night) return home;
  if (live.bellT > 0.2) return jitter(BELL_AT, id, hour);

  const morning = t < 11.2;
  const eve = t >= 17.2;
  if (eve && townGather() && id !== "hal" && id !== "finn" && id !== "flint") {
    return jitter(FIRE_PIT, id, hour);
  }

  const pick = (...spots: Spot[]) => jitter(spots[hour % spots.length] ?? spots[0]!, id, hour);

  switch (id) {
    case "pax":
      return morning ? pick(WELL_AT, STALL) : pick(STALL, SQUARE, WELL_AT);
    case "nora": {
      const basket = useGame.getState().quests?.["nora-basket"] ?? 0;
      if (basket < 1 && !morning) return pick(DRAIN, STALL, DRAIN);
      return morning ? pick(STALL, STALL, SQUARE) : eve ? pick(STALL, home) : pick(STALL, FOUNTAIN);
    }
    case "ash":
      return morning ? pick(PADDOCK, PADDOCK, SQUARE) : eve ? pick(FIRE_PIT, PADDOCK) : pick(PADDOCK, SQUARE);
    case "holt":
    case "bramble":
      return pick(FARM, HAY, FARM, EAST_PATH);
    case "cobb":
      return morning ? pick(FARM, MILL_AT) : pick(FARM, STALL, MILL_AT);
    case "finn":
      return pick(POND, DOCK, DOCK, POND);
    case "flint":
      return pick(FORGE, FORGE, STALL);
    case "fern":
      return pick(NOTICE, NOTICE, SQUARE);
    case "tallow":
      return pick(SQUARE, WELL_AT, FOUNTAIN, STALL, PADDOCK);
    case "oak0":
      return morning ? pick(home, WELL_AT) : pick(WELL_AT, SQUARE, home);
    case "oak1":
      return pick(FIRE_PIT, SQUARE, WEST_PATH, home);
    case "oak2":
      return pick(FOUNTAIN, SQUARE, WELL_AT, STALL);
    case "oak3":
      return pick(FOUNTAIN, WELL_AT, SQUARE, FOUNTAIN);
    case "oak4":
      return pick(MILL_AT, MILL_AT, SQUARE);
    case "oak5":
      return pick(WELL_AT, home, FOUNTAIN);
    case "oak6":
      return live.smashed.creeklog ? pick(BROOK, WOOD, MILL_AT) : pick(WOOD, BROOK, HAY);
    case "dusk":
      return eve ? pick(FIRE_PIT, SQUARE) : pick(SQUARE, WEST_PATH, FIRE_PIT);
    case "rook":
      return pick(FIRE_PIT, FIRE_PIT, SQUARE);
    case "tuck":
      return pick(STALL, home, SQUARE);
    case "pell":
      return morning ? pick(home, STALL) : eve ? pick(FIRE_PIT, home) : pick(SQUARE, home);
    case "hal":
      return morning ? pick(GATE, GATE, ROAD) : eve ? pick(GATE, ROAD) : pick(ROAD, GATE, { x: 4, z: 42 });
    case "vetch":
      return pick(WEST_PATH, { x: -22, z: -112 }, SQUARE);
    default:
      if (id.startsWith("oak")) return pick(SQUARE, FOUNTAIN, WELL_AT);
      return null;
  }
}

export function npcNightHome(id: string | undefined, t = gameClock().t) {
  if (!id) return false;
  return t >= 20.15 || t < 6.05;
}
