import { useGame } from "./store";
import { revealItem, type GetId } from "./items";
import { takeCipher } from "./cipher";
import { live } from "./world3d/live";
import { writeActive } from "./saves";
import { heightAt, pondSurfaceY, rockGone } from "./world3d/field";
import {
  LONELY_CHEST,
  LOOK_AT,
  SPIRE_AT,
  MILL_AT,
  STAR_HILL,
  STONE_RING,
  SAND_SHIP,
  BEAN_AT,
  LIGHT_AT,
  WIND_HILL,
  FAR_POND,
  ZIP_LAND,
  SNOW_AT,
  PICNIC_AT,
  FAIRY_RING,
  OWL_AT,
  FLAG_AT,
  MOON_POND,
  FOX_AT,
  CLOUD_PIER,
  POND,
  CONCH_AT,
  DUCK_LAKE,
  BOAT_AT,
  TREE_HOME,
  TREE_HOUSE_H,
  VX,
  VZ,
} from "./world3d/field";
import { LANDS } from "./world3d/lands";
import { FOREST_AT } from "./world3d/mathWorld";
import { roomZ } from "./world3d/dungeonLayout";

function pushBox(nx: number, nz: number, cx: number, cz: number, hw: number, hd: number, rad = 0.5) {
  const dx = nx - cx;
  const dz = nz - cz;
  const hx = hw + rad;
  const hz = hd + rad;
  if (Math.abs(dx) >= hx || Math.abs(dz) >= hz) return null;
  if (hx - Math.abs(dx) < hz - Math.abs(dz)) return { x: cx + Math.sign(dx || 1) * hx, z: nz };
  return { x: nx, z: cz + Math.sign(dz || 1) * hz };
}

export type TreasureKind =
  | "heart"
  | "wallet"
  | "quiver"
  | "bombbag"
  | "seedbag"
  | "map"
  | "key"
  | "collect"
  | "cosmetic"
  | "story"
  | "rare";

export type TreasureGate =
  | { kind: "none" }
  | { kind: "bomb"; rock?: string }
  | { kind: "climb"; rise: number }
  | { kind: "night" }
  | { kind: "song" }
  | { kind: "lantern" }
  | { kind: "horse" }
  | { kind: "sling"; flag: string }
  | { kind: "swim" }
  | { kind: "zip" }
  | { kind: "math"; flag: string }
  | { kind: "bean" }
  | { kind: "house"; house: string };

export type TreasureDef = {
  id: string;
  kind: TreasureKind;
  title: string;
  blurb: string;
  x: number;
  z: number;
  size: "big" | "small";
  gate: TreasureGate;
  world: "meadow" | "cavern";
  hint: string;
  getId: GetId;
  map?: string;
  cipher?: string;
  outfit?: "meadow" | "ember" | "keep";
};

export type PickupDef = {
  id: string;
  kind: "feather" | "shell" | "key";
  x: number;
  z: number;
  yOff?: number;
  world: "meadow";
};

const PADDOCK = { x: VX + 28, z: VZ + 24 };
export const HORSE_PLATE = { x: PADDOCK.x + 3.6, z: PADDOCK.z - 1.2 };
export const CRACK_AT = { x: MILL_AT.x + 22.4, z: MILL_AT.z + 3.2 };
export const MILL_KEY_AT = { x: MILL_AT.x + 1.15, z: MILL_AT.z - 0.4, y: 3.35 };
export const MATH_AT = { x: LANDS.ruins.x + 18, z: LANDS.ruins.z + 12 };
export const EYE_AT = { x: WIND_HILL.x + 6.4, z: WIND_HILL.z + 8.2, y: 7.2 };
export const EYE_CHEST = { x: WIND_HILL.x - 2.2, z: WIND_HILL.z - 4.6 };
export const NORTH_LOOK = { x: -90.2, z: 356.4 };

export const TREASURES: TreasureDef[] = [
  {
    id: "cliff",
    kind: "heart",
    title: "Cliff Heart",
    blurb: "A gold heart sat on a hill nobody marked.",
    x: LONELY_CHEST.x,
    z: LONELY_CHEST.z,
    size: "big",
    gate: { kind: "none" },
    world: "meadow",
    hint: "A chest on a far gold hill. You can see it from the dunes.",
    getId: "container",
  },
  {
    id: "look",
    kind: "quiver",
    title: "Lookout Quiver",
    blurb: "More arrows sit in the leather.",
    x: LOOK_AT.x + 0.85,
    z: LOOK_AT.z + 0.4,
    size: "small",
    gate: { kind: "climb", rise: 8.2 },
    world: "meadow",
    hint: "A chest on the lookout deck. The ladder is the way.",
    getId: "quiver",
  },
  {
    id: "spire",
    kind: "map",
    title: "Oakstead Chart",
    blurb: "The fork had a map stuffed in the tines.",
    x: SPIRE_AT.x,
    z: SPIRE_AT.z - 0.35,
    size: "small",
    gate: { kind: "climb", rise: 38 },
    world: "meadow",
    hint: "Something gold in the giant fork. You saw it from the first path.",
    getId: "map",
    map: "vale",
  },
  {
    id: "crack",
    kind: "bombbag",
    title: "Crag Bomb Bag",
    blurb: "The rock kept a louder bag.",
    x: CRACK_AT.x,
    z: CRACK_AT.z + 1.35,
    size: "small",
    gate: { kind: "bomb", rock: "crack" },
    world: "meadow",
    hint: "The east rock is cracked. A bang would open it.",
    getId: "bombbag",
  },
  {
    id: "night",
    kind: "seedbag",
    title: "Star Hill Pouch",
    blurb: "Seeds that only show when the hill does.",
    x: STAR_HILL.x,
    z: STAR_HILL.z,
    size: "small",
    gate: { kind: "night" },
    world: "meadow",
    hint: "A chest on the star hill. It only opens when the stars are out.",
    getId: "seedbag",
  },
  {
    id: "song",
    kind: "heart",
    title: "Ring Heart",
    blurb: "The stones remembered a song, then a heart.",
    x: STONE_RING.x,
    z: STONE_RING.z,
    size: "big",
    gate: { kind: "song" },
    world: "meadow",
    hint: "A chest in the far ring. It has no lock. It wants a song.",
    getId: "container",
  },
  {
    id: "ship",
    kind: "wallet",
    title: "Sand-Ship Wallet",
    blurb: "The wreck kept a fatter purse.",
    x: SAND_SHIP.x + 2.4,
    z: SAND_SHIP.z - 1.2,
    size: "big",
    gate: { kind: "none" },
    world: "meadow",
    hint: "A wreck on the far dunes. Something gold on the deck.",
    getId: "wallet",
  },
  {
    id: "bean",
    kind: "heart",
    title: "Cloud Heart",
    blurb: "The stalk grew into a chest.",
    x: BEAN_AT.x,
    z: BEAN_AT.z,
    size: "big",
    gate: { kind: "bean" },
    world: "meadow",
    hint: "A bean in the dirt. Water, then climb.",
    getId: "container",
  },
  {
    id: "cave",
    kind: "story",
    title: "Light-Cave Tablet",
    blurb: "A scraped fourth mark, same as the stones.",
    x: LIGHT_AT.x + 1.6,
    z: LIGHT_AT.z - 2.2,
    size: "small",
    gate: { kind: "lantern" },
    world: "meadow",
    hint: "A mouth in the south rock. Too dark without a light.",
    getId: "relic",
    cipher: "cave-relic",
  },
  {
    id: "manor",
    kind: "heart",
    title: "Shuttered Heart",
    blurb: "Whoever lived here left a gold heart in the west room.",
    x: -51.5,
    z: -122.4,
    size: "big",
    gate: { kind: "house", house: "manor" },
    world: "meadow",
    hint: "A drawer in the locked room. After the letter.",
    getId: "container",
  },
  {
    id: "eye",
    kind: "rare",
    title: "Wind Figurine",
    blurb: "A little carved fox. Gran would pretend not to like it.",
    x: EYE_CHEST.x,
    z: EYE_CHEST.z,
    size: "small",
    gate: { kind: "sling", flag: "eye" },
    world: "meadow",
    hint: "A red eye on the west crag. A seed would knock it.",
    getId: "figurine",
  },
  {
    id: "math",
    kind: "map",
    title: "Old Numer Chart",
    blurb: "The seats were a count. The chest was the prize.",
    x: MATH_AT.x,
    z: MATH_AT.z,
    size: "small",
    gate: { kind: "math", flag: "math" },
    world: "meadow",
    hint: "Four stones in a ring. They want to be walked in order.",
    getId: "map",
    map: "ruins",
  },
  {
    id: "horse",
    kind: "map",
    title: "Woods Chart",
    blurb: "She stamped the lid. A map of the west woods.",
    x: HORSE_PLATE.x + 2.1,
    z: HORSE_PLATE.z + 0.4,
    size: "small",
    gate: { kind: "horse" },
    world: "meadow",
    hint: "A low stone in the paddock. Too wide for a boot.",
    getId: "map",
    map: "forest",
  },
  {
    id: "pond",
    kind: "map",
    title: "River Chart",
    blurb: "A wet map under the north pool.",
    x: FAR_POND.x + 2.8,
    z: FAR_POND.z - 1.4,
    size: "small",
    gate: { kind: "swim" },
    world: "meadow",
    hint: "A chest in the north pool. You have to get wet.",
    getId: "map",
    map: "river",
  },
  {
    id: "zip",
    kind: "map",
    title: "Peak Chart",
    blurb: "The zip dropped you on a map.",
    x: ZIP_LAND.x + 2.6,
    z: ZIP_LAND.z + 1.8,
    size: "small",
    gate: { kind: "none" },
    world: "meadow",
    hint: "A chest past the zip line. Ride the wire, or walk.",
    getId: "map",
    map: "mount",
  },
  {
    id: "forest",
    kind: "cosmetic",
    title: "Meadow Cloak",
    blurb: "Green cloth. The woods had been keeping it.",
    x: FOREST_AT.x + 8,
    z: FOREST_AT.z - 6,
    size: "big",
    gate: { kind: "none" },
    world: "meadow",
    hint: "A chest under the dark trees.",
    getId: "cloak",
    outfit: "meadow",
  },
  {
    id: "snow",
    kind: "map",
    title: "Crown Chart",
    blurb: "Ice had a map frozen to it.",
    x: SNOW_AT.x + 6,
    z: SNOW_AT.z - 4,
    size: "small",
    gate: { kind: "none" },
    world: "meadow",
    hint: "A chest on the white hill.",
    getId: "map",
    map: "snow",
  },
  {
    id: "swamp",
    kind: "map",
    title: "Fen Chart",
    blurb: "The bog kept a map on a dry stump.",
    x: LANDS.swamp.x + 12,
    z: LANDS.swamp.z - 8,
    size: "small",
    gate: { kind: "none" },
    world: "meadow",
    hint: "A chest on a stump in the southwest bog.",
    getId: "map",
    map: "swamp",
  },
  {
    id: "desert",
    kind: "map",
    title: "Dune Chart",
    blurb: "Sand had buried a second map by the wreck.",
    x: SAND_SHIP.x - 8.4,
    z: SAND_SHIP.z + 6.2,
    size: "small",
    gate: { kind: "none" },
    world: "meadow",
    hint: "Another chest in the wreck’s shadow.",
    getId: "map",
    map: "desert",
  },
  {
    id: "north",
    kind: "heart",
    title: "North Look Heart",
    blurb: "Past the blown stones, the vale drops away.",
    x: NORTH_LOOK.x,
    z: NORTH_LOOK.z,
    size: "big",
    gate: { kind: "bomb", rock: "north" },
    world: "meadow",
    hint: "North stones block a lookout. A bang would open the hill.",
    getId: "container",
  },
  {
    id: "cavern",
    kind: "heart",
    title: "Hollow Heart",
    blurb: "A side alcove the warden never walked.",
    x: 22.4,
    z: roomZ(2) + 10,
    size: "big",
    gate: { kind: "none" },
    world: "cavern",
    hint: "A chest in a side mouth of Sun Hollow.",
    getId: "container",
  },
];

export const FEATHERS: PickupDef[] = [
  { id: "feather-1", kind: "feather", x: TREE_HOME.x - 1.8, z: TREE_HOME.z + 0.6, yOff: TREE_HOUSE_H + 0.08, world: "meadow" },
  { id: "feather-2", kind: "feather", x: PICNIC_AT.x + 1.2, z: PICNIC_AT.z - 0.8, world: "meadow" },
  { id: "feather-3", kind: "feather", x: FAIRY_RING.x, z: FAIRY_RING.z + 1.4, world: "meadow" },
  { id: "feather-4", kind: "feather", x: OWL_AT.x - 1.6, z: OWL_AT.z + 0.8, world: "meadow" },
  { id: "feather-5", kind: "feather", x: FLAG_AT.x + 0.8, z: FLAG_AT.z, world: "meadow" },
  { id: "feather-6", kind: "feather", x: MOON_POND.x - 2.2, z: MOON_POND.z + 1.1, world: "meadow" },
  { id: "feather-7", kind: "feather", x: FOX_AT.x + 1.4, z: FOX_AT.z - 1.2, world: "meadow" },
  { id: "feather-8", kind: "feather", x: CLOUD_PIER.x, z: CLOUD_PIER.z - 2, world: "meadow" },
];

export const SHELLS: PickupDef[] = [
  { id: "shell-1", kind: "shell", x: POND.x - 3.4, z: POND.z + 2.2, world: "meadow" },
  { id: "shell-2", kind: "shell", x: FAR_POND.x - 4.2, z: FAR_POND.z + 2.8, world: "meadow" },
  { id: "shell-3", kind: "shell", x: CONCH_AT.x, z: CONCH_AT.z, world: "meadow" },
  { id: "shell-4", kind: "shell", x: DUCK_LAKE.x + 2.4, z: DUCK_LAKE.z - 1.6, world: "meadow" },
  { id: "shell-5", kind: "shell", x: BOAT_AT.x - 1.2, z: BOAT_AT.z + 1.8, world: "meadow" },
];

export const FEATHER_NEED = FEATHERS.length;
export const SHELL_NEED = SHELLS.length;

export function chestSave(id: string) {
  return `t:${id}`;
}

export function treasureById(id: string) {
  return TREASURES.find((t) => t.id === id || chestSave(t.id) === id);
}

export function isTreasureId(id: string) {
  return Boolean(treasureById(id));
}

export function treasureOpen(id: string, opened?: string[]) {
  const list = opened ?? useGame.getState().openedChests ?? [];
  const t = treasureById(id);
  if (!t) return list.includes(id);
  return list.includes(chestSave(t.id)) || list.includes(t.id);
}

export function pickupGot(id: string, seen?: string[]) {
  const list = seen ?? useGame.getState().seenItems ?? [];
  return list.includes(`k:${id}`);
}

export function nextWallet(max: number) {
  if (max < 200) return 200;
  if (max < 500) return 500;
  return max;
}

export function nextBag(max: number) {
  return Math.min(80, Math.max(20, max || 20) + 20);
}

export function mapsOwned(quests?: Record<string, number>) {
  const q = quests ?? useGame.getState().quests ?? {};
  return ["vale", "forest", "river", "mount", "desert", "swamp", "snow", "ruins"].filter((id) => (q[`map-${id}`] ?? 0) >= 1);
}

export function hasMap(id: string, quests?: Record<string, number>) {
  const q = quests ?? useGame.getState().quests ?? {};
  if ((q["map-vale"] ?? 0) >= 1 && (id === "vale" || id === "home")) return true;
  return (q[`map-${id}`] ?? 0) >= 1;
}

export function houseUnlocked(id: string, quests?: Record<string, number>) {
  const q = quests ?? useGame.getState().quests ?? {};
  if (id !== "manor") return true;
  return (q.manorOpen ?? 0) >= 1;
}

export function canUnlockHouse(id: string, quests?: Record<string, number>) {
  const q = quests ?? useGame.getState().quests ?? {};
  if (id !== "manor") return true;
  return (q.manorKey ?? 0) >= 1;
}

export function unlockHouse(id: string) {
  if (id !== "manor") return false;
  const q = useGame.getState().quests ?? {};
  if ((q.manorKey ?? 0) < 1) return false;
  if ((q.manorOpen ?? 0) >= 1) return true;
  useGame.getState().setQuest("manorOpen", 1);
  live.listen = "The old key turned. The boards fell inward.";
  return true;
}

function flagOn(name: string) {
  return Boolean(live.smashed[name] || live.smashed[`t-${name}`]);
}

export function gateReady(t: TreasureDef) {
  const g = t.gate;
  const quests = useGame.getState().quests ?? {};
  if (g.kind === "none") return true;
  if (g.kind === "bomb") {
    if (g.rock === "north") return rockGone(-92.4, 348.2) || flagOn("north-path") || flagOn("north");
    return flagOn(g.rock ?? "crack");
  }
  if (g.kind === "climb") return true;
  if (g.kind === "night") return Boolean(live.night);
  if (g.kind === "song") return Boolean(live.songOk);
  if (g.kind === "lantern") return (quests.lantern ?? 0) >= 1;
  if (g.kind === "horse") return flagOn("horse-plate");
  if (g.kind === "sling") return flagOn(g.flag);
  if (g.kind === "swim") return true;
  if (g.kind === "zip") return true;
  if (g.kind === "math") return flagOn(g.flag);
  if (g.kind === "bean") return Boolean(live.smashed.bean);
  if (g.kind === "house") return live.house === g.house && houseUnlocked(g.house) && (quests.manorDone ?? 0) >= 1;
  return true;
}

export function atTreasure(t: TreasureDef) {
  if (t.gate.kind === "house" && live.house !== t.gate.house) return false;
  if (t.gate.kind === "house" && live.house === t.gate.house) {
    return Math.hypot(live.x - t.x, live.z - t.z) < 2.8;
  }
  const d = Math.hypot(live.x - t.x, live.z - t.z);
  if (d >= 1.45) return false;
  if (t.gate.kind === "climb") {
    const y = heightAt(t.x, t.z);
    if (live.y < y + t.gate.rise - 1.15) return false;
  }
  if (t.gate.kind === "bean") {
    const y = heightAt(t.x, t.z);
    if (live.y < y + 5.2) return false;
  }
  if (t.gate.kind === "swim") {
    const wet = live.y < pondSurfaceY() + 0.55 || live.swim;
    if (!wet && d > 0.9) return false;
  }
  if (t.gate.kind === "zip" && !(live.zipping || flagOn("zip-land") || live.smashed.zip)) {
    if (d > 1.2) return false;
  }
  return gateReady(t);
}

export function nearTreasureHint(t: TreasureDef) {
  const d = Math.hypot(live.x - t.x, live.z - t.z);
  if (d > 6.5) return null;
  if (treasureOpen(t.id)) return null;
  if (t.gate.kind === "house" && live.house !== t.gate.house) {
    if (d < 3.2) return t.hint;
    return null;
  }
  if (t.gate.kind === "climb") {
    const y = heightAt(t.x, t.z);
    if (d < 3.4 && live.y < y + t.gate.rise - 1.15) return t.hint;
  }
  if (!gateReady(t) && d < 3.6) return t.hint;
  return null;
}

function applyKind(t: TreasureDef) {
  const g = useGame.getState();
  if (t.kind === "heart") {
    g.grantHeartContainer(chestSave(t.id));
    revealItem("container", true);
    return;
  }
  if (t.kind === "wallet") {
    const next = nextWallet(g.coinsMax ?? 100);
    useGame.setState({ coinsMax: next });
    g.addCoins(20);
    revealItem("wallet", true);
    live.listen = next >= 500 ? "The purse will not get fatter. It is already huge." : "Your purse got fatter.";
    return;
  }
  if (t.kind === "quiver") {
    const cap = nextBag(g.arrowsMax ?? 20);
    useGame.setState({ arrowsMax: cap, arrows: Math.min(cap, (g.arrows ?? 0) + 10) });
    revealItem("quiver", true);
    live.listen = "The quiver holds more.";
    return;
  }
  if (t.kind === "bombbag") {
    const cap = nextBag(g.bombsMax ?? 20);
    useGame.setState({ bombsMax: cap, bombs: Math.min(cap, (g.bombs ?? 0) + 8) });
    revealItem("bombbag", true);
    live.listen = "The bag holds more loud balls.";
    return;
  }
  if (t.kind === "seedbag") {
    const cap = nextBag(g.seedsMax ?? 20);
    useGame.setState({ seedsMax: cap, seeds: Math.min(cap, (g.seeds ?? 0) + 10) });
    revealItem("seedbag", true);
    live.listen = "More seeds. The sling is happier.";
    return;
  }
  if (t.kind === "map" && t.map) {
    g.setQuest(`map-${t.map}`, 1);
    g.discover(`map-${t.map}`);
    revealItem("map", true);
    live.listen = t.blurb;
    return;
  }
  if (t.kind === "cosmetic" && t.outfit) {
    const owned = g.ownedOutfits ?? [];
    if (!owned.includes(t.outfit)) useGame.setState({ ownedOutfits: [...owned, t.outfit], outfit: t.outfit });
    revealItem("cloak", true);
    live.listen = t.blurb;
    return;
  }
  if (t.kind === "story") {
    if (t.cipher) takeCipher(t.cipher, true);
    revealItem("relic", true);
    live.listen = t.blurb;
    return;
  }
  if (t.kind === "rare") {
    g.setQuest("figurine", 1);
    g.discover("figurine");
    revealItem("figurine", true);
    live.listen = t.blurb;
    return;
  }
  revealItem(t.getId, true);
}

export function grantTreasure(id: string): boolean {
  const t = treasureById(id);
  if (!t) return false;
  const g = useGame.getState();
  if (treasureOpen(t.id)) return false;
  g.openChest(chestSave(t.id));
  applyKind(t);
  live.chestOpen = { id: t.id, x: t.x, z: t.z, t: 0, item: t.getId, coins: 0, granted: true };
  writeActive();
  return true;
}

export function grantPickup(p: PickupDef): boolean {
  if (pickupGot(p.id)) return false;
  const g = useGame.getState();
  g.discover(`k:${p.id}`);
  if (p.kind === "feather") {
    const n = (g.quests?.feather ?? 0) + 1;
    g.setQuest("feather", n);
    revealItem("feather", true);
    live.listen = n >= FEATHER_NEED ? "Eight gold feathers. They became a heart." : `A gold feather. ${n} of ${FEATHER_NEED}.`;
    if (n >= FEATHER_NEED) {
      g.grantHeartContainer("feathers");
      revealItem("container", true);
    }
  } else if (p.kind === "shell") {
    const n = (g.quests?.shell ?? 0) + 1;
    g.setQuest("shell", n);
    revealItem("shell", true);
    live.listen = n >= SHELL_NEED ? "Five shells. The purse remembers the sea." : `A shell. ${n} of ${SHELL_NEED}.`;
    if (n >= SHELL_NEED) {
      const next = nextWallet(g.coinsMax ?? 100);
      useGame.setState({ coinsMax: next });
      g.addCoins(25);
      revealItem("wallet", true);
    }
  } else if (p.kind === "key") {
    g.setQuest("manorKey", 1);
    revealItem("key", true);
    live.listen = "An old house key. West of the inn, the boards might listen.";
  }
  writeActive();
  return true;
}

export function grantLantern() {
  const g = useGame.getState();
  if ((g.quests?.lantern ?? 0) >= 1) return false;
  g.setQuest("lantern", 1);
  g.discover("lantern");
  revealItem("lantern", true);
  live.listen = "Three fireflies. The jar is a lantern now.";
  writeActive();
  return true;
}

export function collideTreasure(x: number, z: number) {
  if (live.house) return null;
  let nx = x;
  let nz = z;
  let hit = false;
  if (!flagOn("crack") && !treasureOpen("crack")) {
    const p = pushBox(nx, nz, CRACK_AT.x, CRACK_AT.z, 1.15, 1.05, 0.5);
    if (p) {
      nx = p.x;
      nz = p.z;
      hit = true;
    }
  }
  return hit ? { x: nx, z: nz } : null;
}

export function markTreasureFlag(name: string) {
  live.smashed[name] = true;
  live.smashed[`t-${name}`] = true;
}

export const MATH_PADS = [0, 1, 2, 3].map((i) => {
  const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
  return { n: i + 1, x: MATH_AT.x + Math.cos(a) * 3.4, z: MATH_AT.z + Math.sin(a) * 3.4 };
});
