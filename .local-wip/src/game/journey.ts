import type { WorldId } from "./types";
import { TREE_HOME, POND, KEEP_Z, LOOK_AT, WELL_AT } from "./world3d/field";
import { landAt, RV, FW, MW, QH, ET } from "./world3d/lands";
import { inVillage, VX, VZ, TEMPLE_GATES } from "./world3d/village";
import { live } from "./world3d/live";
import { useGame } from "./store";
import { LOST } from "./lost";

/** One adventure. Each id is a chapter the player can grow into — not a menu. */
export type ChapterId =
  | "home"
  | "vale"
  | "strange"
  | "hollow"
  | "river"
  | "woods"
  | "peak"
  | "mire"
  | "keep"
  | "far"
  | "last";

export type PlaceId =
  | "home"
  | "yard"
  | "oakstead"
  | "vale"
  | "lookout"
  | "pond"
  | "keep-road"
  | "cavern-mouth"
  | "cavern"
  | "marsh-mouth"
  | "marsh"
  | "silverrun"
  | "whisperwood"
  | "quiet-hollow"
  | "stoneback"
  | "summit"
  | "mirefen"
  | "goldwaste"
  | "whitecrown"
  | "oldnumer"
  | "keep"
  | "grove"
  | "crater"
  | "lake"
  | "grave"
  | "waste"
  | "echo"
  | "ridge"
  | "spire"
  | "fen"
  | "hollow-temple"
  | "vault"
  | "arena"
  | "undervale"
  | "glow-grotto"
  | "blackwater"
  | "root-cathedral"
  | "elderfour"
  | "scent-hollow"
  | "bone-hall"
  | "ember-vein";

export type JourneySnap = {
  world: WorldId | null;
  house: string | null;
  leftHome: boolean;
  cipherN: number;
  cleared: string[];
  gems: { emerald?: boolean; ruby?: boolean; sapphire?: boolean };
  gemsPlaced: string[];
  hasSword: boolean;
  hasSling: boolean;
  hasHorse: boolean;
  claws: boolean;
  places: string[];
  quests: Record<string, number>;
};

export const CHAPTERS: Record<
  ChapterId,
  { roman: string; title: string; sub: string; order: number }
> = {
  home: { roman: "I", title: "The Tree", sub: "A lamp. Soup. A vale that still feels small.", order: 0 },
  vale: { roman: "I", title: "The Green Vale", sub: "People have names. The road has a direction.", order: 1 },
  strange: { roman: "II", title: "The Fourth Count", sub: "The stories stop at three. The stones do not.", order: 2 },
  hollow: { roman: "III", title: "The Dark Mouth", sub: "The first real walk. A jewel waits at the back.", order: 3 },
  river: { roman: "IV", title: "Silverrun", sub: "The water does not stop for Oakstead.", order: 4 },
  woods: { roman: "V", title: "Whisperwood", sub: "The trees remember a skipped year.", order: 5 },
  peak: { roman: "VI", title: "Stoneback", sub: "The mountain was the first counter.", order: 6 },
  mire: { roman: "VII", title: "The Wet Country", sub: "A second jewel. A hole that wants you.", order: 7 },
  keep: { roman: "VIII", title: "The Castle", sub: "Three jewels. A door that should have stayed asleep.", order: 8 },
  far: { roman: "IX", title: "Far Countries", sub: "Forest. Fire. Water. Night. Sand.", order: 9 },
  last: { roman: "X", title: "The Last Hall", sub: "He still wants a crown.", order: 10 },
};

export const PLACES: Record<PlaceId, { name: string; sub: string }> = {
  home: { name: "Home", sub: "Gran kept the lamp on." },
  yard: { name: "The Long Branch", sub: "The vale starts at the ladder." },
  oakstead: { name: "Oakstead", sub: "A town that likes being small." },
  vale: { name: "The Green Vale", sub: "Hills, a mill, a castle on the north one." },
  lookout: { name: "The Lookout", sub: "West trees. East water. North a mountain with no song." },
  pond: { name: "The Pond", sub: "Finn sits here. The water keeps a stone." },
  "keep-road": { name: "The Keep Road", sub: "North. The door under the castle is still sleeping." },
  "cavern-mouth": { name: "A Dark Mouth", sub: "Cole never went. A jewel waits at the back." },
  cavern: { name: "Sun Hollow", sub: "Gold stone on gold. The first real dark." },
  "marsh-mouth": { name: "A Wet Mouth", sub: "Reed would not go without a blade." },
  marsh: { name: "Reed Crypt", sub: "The water here remembers every count." },
  silverrun: { name: "Silverrun", sub: "The river has a mind. It does not ask Oakstead." },
  whisperwood: { name: "Whisperwood", sub: "Twin pines, then a hollow oak, then the mouths." },
  "quiet-hollow": { name: "Quiet Hollow", sub: "A town that does not pay taxes. They count past three." },
  stoneback: { name: "Stoneback", sub: "Trails, not a staircase. The peak is watching." },
  summit: { name: "The Summit", sub: "The vale was told there were only three." },
  mirefen: { name: "Mirefen", sub: "The ground wants a snack. Keep moving." },
  goldwaste: { name: "Goldwaste", sub: "Sand that pretends to be a bed." },
  whitecrown: { name: "White Crown", sub: "The white is lying about being soft." },
  oldnumer: { name: "Old Numer", sub: "Someone counted here until they ran out." },
  keep: { name: "The Castle", sub: "Home of the jewels. He makes fangs here." },
  grove: { name: "Green Forest", sub: "A piece of his magic hid in the trees." },
  crater: { name: "Fire Mountain", sub: "The eye of fire first. Then the deep heat." },
  lake: { name: "Blue Lake", sub: "Water hid a piece of his magic." },
  grave: { name: "Night Grave", sub: "The night-eye first. Then the long dark." },
  waste: { name: "Sand Land", sub: "Sand hid the last of the five." },
  echo: { name: "The Last Hall", sub: "One hall is left. He still wants to be king." },
  ridge: { name: "High Ridge", sub: "A high hill hid a leftover scrap." },
  spire: { name: "Clock Tower", sub: "Hours that do not belong to anyone." },
  fen: { name: "Glass Swamp", sub: "The water here is like a mirror." },
  "hollow-temple": { name: "Thunder Hollow", sub: "Thunder hid a fire in this hollow." },
  vault: { name: "Crown Cave", sub: "The last of his magic. He still wants a crown." },
  arena: { name: "The Arena", sub: "A fight that does not end." },
  undervale: { name: "The Below", sub: "The vale was a lid." },
  "glow-grotto": { name: "Glow Grotto", sub: "The pond keeps a second sky." },
  blackwater: { name: "Blackwater", sub: "A river that never saw the sun." },
  "root-cathedral": { name: "Root Cathedral", sub: "The woods hold a roof of living wood." },
  elderfour: { name: "Elderfour", sub: "Four crowns. One year missing from the rings." },
  "scent-hollow": { name: "Scent Hollow", sub: "A fox-sized hole. The long way is south." },
  "bone-hall": { name: "Bone Hall", sub: "Old Numer’s cellar. The count ran out." },
  "ember-vein": { name: "Ember Vein", sub: "The mountain’s first fire, still warm." },
};

const CHAPTER_RANK: ChapterId[] = [
  "home",
  "vale",
  "strange",
  "hollow",
  "river",
  "woods",
  "peak",
  "mire",
  "keep",
  "far",
  "last",
];

const FAR_WORLDS = ["grove", "crater", "lake", "grave", "waste"];
const LAST_WORLDS = ["echo", "ridge", "spire", "fen", "hollow", "vault"];

export function snapJourney(): JourneySnap {
  const g = useGame.getState();
  return {
    world: g.currentWorld,
    house: live.house,
    leftHome: (g.quests?.lefthome ?? 0) >= 1,
    cipherN: (g.cipher ?? []).length,
    cleared: g.worldsCleared ?? [],
    gems: g.gems ?? {},
    gemsPlaced: g.gemsPlaced ?? [],
    hasSword: Boolean(g.hasSword),
    hasSling: Boolean(g.hasSling),
    hasHorse: Boolean(g.hasHorse),
    claws: (g.quests?.claws ?? 0) >= 1,
    places: g.placesSeen ?? [],
    quests: g.quests ?? {},
  };
}

export function chapterOf(s: JourneySnap): ChapterId {
  const c = s.cleared;
  if (c.includes("vault") || c.includes("echo")) return "last";
  if (LAST_WORLDS.some((w) => c.includes(w))) return "last";
  if (FAR_WORLDS.some((w) => c.includes(w))) return "far";
  if (c.includes("keep") || s.gemsPlaced.length >= 3) return "keep";
  if (s.gems.emerald && s.gems.ruby && s.gems.sapphire) return "keep";
  if (c.includes("marsh") || s.gems.sapphire || s.places.includes("mirefen")) return "mire";
  if (s.claws || s.places.includes("summit") || s.places.includes("stoneback")) return "peak";
  if (s.places.includes("whisperwood") || s.places.includes("quiet-hollow") || c.includes("grove")) return "woods";
  if (s.places.includes("silverrun")) return "river";
  if (c.includes("cavern") || s.hasSling || s.gems.emerald || s.places.includes("cavern")) return "hollow";
  if (s.cipherN >= 1) return "strange";
  if (s.leftHome || s.places.includes("oakstead") || s.places.includes("vale")) return "vale";
  return "home";
}

/** Intended next step — a hint, never a map pin. */
export function nextRoad(s: JourneySnap): { chapter: ChapterId; hint: string } {
  const ch = chapterOf(s);
  if (!s.leftHome && s.house === "yours")
    return { chapter: ch, hint: "Eat. Then the ladder. The vale starts outside." };
  if (!s.hasSword)
    return { chapter: ch, hint: "Ash in the paddock hall will put a blade in your hand. Or the cedar chest on the keep road." };
  if ((s.quests?.chase ?? 0) === 1)
    return { chapter: ch, hint: "Green scraps in Oakstead. Jump the farm crates or cut north to the zip grass. If you lose it: hay, mill, the lookout bush, under the wagon." };
  if ((s.quests?.stolenleaf ?? 0) >= 1 && (s.quests?.chaseLeaf ?? 0) < 1)
    return { chapter: ch, hint: "Mira wants the last leaf. She is in the apples." };
  if ((s.quests?.fest ?? 0) === 1 && !s.places.includes("cavern"))
    return { chapter: ch, hint: "Fern pinned a fair for dusk. Or tell her to hang the lanterns now." };
  if (s.cipherN < 1)
    return { chapter: ch, hint: "Gran covered a cloth for a reason. South of the tree a stone has four pits. One is blank." };
  if (!s.gems.emerald && !s.cleared.includes("cavern"))
    return { chapter: ch, hint: "Cole sits in Oakstead. East of the keep road a dark mouth sits in the hill." };
  if (!s.places.includes("lookout") && !s.places.includes("silverrun") && !s.places.includes("whisperwood"))
    return { chapter: ch, hint: "The lookout north of town. From there the vale is not the whole world." };
  if (!s.gems.sapphire && !s.cleared.includes("marsh"))
    return { chapter: ch, hint: "Reed talks about a wet hole south, by the wild pond." };
  if (!s.gems.ruby)
    return { chapter: ch, hint: "Holt knows a sealed crag east of the mill. Tess’s loud balls crack it." };
  if (s.gemsPlaced.length < 3)
    return { chapter: ch, hint: "Three jewels. The castle north of town is where they sit." };
  if (!s.cleared.includes("keep"))
    return { chapter: ch, hint: "The door under the castle. He is waiting where moonlight falls in a circle." };
  if (!FAR_WORLDS.some((w) => s.cleared.includes(w)))
    return { chapter: ch, hint: "His magic hid in five far countries. Forest. Fire. Water. Night. Sand." };
  return { chapter: ch, hint: "The vale is wide. A horse knows the way." };
}

/** One line an NPC can say that points at the next chapter without spoiling it. */
export function roadTalk(who: string, name: string, s: JourneySnap): string | null {
  const next = nextRoad(s);
  const lines: Record<string, Partial<Record<ChapterId, string>> & { any?: string }> = {
    gran: {
      home: `Eat, ${name}. Then go. The vale is loud tonight, but it is still our vale.`,
      vale: `Come home when the vale is too big, ${name}. The kettle is on.`,
      strange: `Leave the cloth, ${name}. Three jewels. Always three.`,
      hollow: `You went in a hole. Come back for soup anyway.`,
      keep: `The vale is small now. I am still in it. So is the soup.`,
      far: `Far countries, ${name}. Ride. Come back. That is still the whole job.`,
      any: `Come home when it is too big, ${name}.`,
    },
    cole: {
      home: `Oakstead is small, ${name}. I like it that way.`,
      vale: `East of the keep road a dark mouth sits in the hill. I never went.`,
      strange: `People argue about how many jewels there were. I argue about lunch.`,
      hollow: `You went. West the woods start lying. East the water does not stop for us.`,
      woods: `Rowan still lives in those trees. He hated being pinned.`,
      river: `The mill used to take that water. Now the water takes what it wants.`,
      peak: `That mountain was here before Oakstead. It does not like being counted.`,
      keep: `The castle is a mouth. You already knew.`,
      any: `Oakstead is still small, ${name}. You do not have to stay small.`,
    },
    fern: {
      vale: `Cole still points at a dark mouth and does not walk there. I pinned it anyway.`,
      strange: `The town song used to have one more note. I found the paper. It ended mid-word.`,
      hollow: `West, the woods start lying. Twin pines, then a hollow oak. Rowan hated being pinned.`,
      river: `East, the water has a mill gate and a turtle who thinks he is a bridge.`,
      woods: `A town west of the woods does not pay taxes. I have not walked that far. I pinned it anyway.`,
      peak: `Stoneback kept a number. The vale was told to forget it.`,
      keep: `If you found the jewels, the keep road is north. Hal will not smile about it.`,
      far: `Five countries after the door. I pinned the names. I have not gone.`,
    },
    ash: {
      vale: `The first real walk is the dark mouth, ${name}. Cole sits and points at it.`,
      hollow: `You did the hole. The castle is next if you like being scared on purpose.`,
      keep: `Anytime, ${name}. You know where I walk.`,
    },
    reed: {
      vale: `A long walk south. A wet hole sits by the wild pond. I would not go without a blade.`,
      hollow: `You have a jewel. The wet one is still sitting in that hole.`,
    },
    bram: {
      home: `${name}!! Take me!! I practiced on Gran’s chair!!`,
      vale: `You went!! I watched from the branch!! The tree is still here!!`,
      far: `Bring the horse back. I will hold the stick. I will look scary.`,
    },
    sela: {
      home: `If you get lost, look for our tree. The lamp will be on.`,
      vale: `South of the tree there are fat stones with numbers. The biggest did not hug back.`,
      strange: `Gran covered the cloth. I saw. I did not tell Bram. He would throw a sock at it.`,
    },
  };
  const pack = lines[who];
  if (!pack) return null;
  const ch = next.chapter;
  return pack[ch] ?? pack.any ?? null;
}

const WORLD_PLACE: Partial<Record<WorldId, PlaceId>> = {
  cavern: "cavern",
  marsh: "marsh",
  grove: "grove",
  crater: "crater",
  lake: "lake",
  grave: "grave",
  waste: "waste",
  keep: "keep",
  echo: "echo",
  ridge: "ridge",
  spire: "spire",
  fen: "fen",
  hollow: "hollow-temple",
  vault: "vault",
  arena: "arena",
};

function near(x: number, z: number, at: { x: number; z: number }, r: number) {
  return Math.hypot(x - at.x, z - at.z) < r;
}

export function placeAt(x: number, z: number, world: WorldId | null, house: string | null): PlaceId {
  if (live.below) {
    const at = live.underAt;
    if (at === "glow") return "glow-grotto";
    if (at === "black") return "blackwater";
    if (at === "root") return "root-cathedral";
    if (at === "bone") return "bone-hall";
    if (at === "ember") return "ember-vein";
    return "undervale";
  }
  if (house === "yours") return "home";
  if (world && world !== "meadow" && WORLD_PLACE[world]) return WORLD_PLACE[world]!;
  if (!world || world === "meadow") {
    const cavernGate = TEMPLE_GATES.find((g) => g.world === "cavern");
    const marshGate = TEMPLE_GATES.find((g) => g.world === "marsh");
    if (cavernGate && near(x, z, cavernGate, 16)) return "cavern-mouth";
    if (marshGate && near(x, z, marshGate, 18)) return "marsh-mouth";
    if (near(x, z, { x: 0, z: KEEP_Z }, 28) && z > 70) return "keep";
    if (near(x, z, MW.summit, 36)) return "summit";
    if (near(x, z, LOOK_AT, 10)) return "lookout";
    if (near(x, z, ET, 34)) return "elderfour";
    if (near(x, z, LOST.den, 22) || near(x, z, LOST.cage, 14)) return "scent-hollow";
    if (near(x, z, POND, 16)) return "pond";
    if (near(x, z, QH, 48)) return "quiet-hollow";
    const homeD = Math.hypot(x - TREE_HOME.x, z - TREE_HOME.z);
    if (homeD < 26) return "yard";
    if (inVillage(x, z) && homeD > 32) return "oakstead";
    if (z > 48 && Math.abs(x) < 70) return "keep-road";
    const land = landAt(x, z).id;
    if (land === "forest") return "whisperwood";
    if (land === "river" || near(x, z, RV.ford, 80) || near(x, z, RV.sign, 22)) return "silverrun";
    if (land === "mount") return "stoneback";
    if (land === "swamp") return "mirefen";
    if (land === "desert") return "goldwaste";
    if (land === "snow") return "whitecrown";
    if (land === "ruins") return "oldnumer";
    if (near(x, z, WELL_AT, 8) || near(x, z, { x: VX, z: VZ }, 40)) return "oakstead";
    return "vale";
  }
  return "vale";
}

export function placeCard(id: PlaceId) {
  return PLACES[id];
}

export function chapterCard(id: ChapterId) {
  return CHAPTERS[id];
}

export function chapterIndex(id: ChapterId) {
  return CHAPTER_RANK.indexOf(id);
}

/** Title cards skip these so the treehouse opening is quiet. */
export function silentPlace(id: PlaceId) {
  return id === "home";
}

export function musicBedFor(place: PlaceId, house: string | null): "field" | "town" | "forest" | "water" | "mount" | "dungeon" | "keep" | "chamber" {
  if (house === "yours") return "chamber";
  if (place === "oakstead" || place === "yard") return place === "oakstead" ? "town" : "field";
  if (place === "whisperwood" || place === "quiet-hollow" || place === "grove" || place === "root-cathedral" || place === "elderfour" || place === "scent-hollow") return "forest";
  if (place === "silverrun" || place === "pond" || place === "marsh" || place === "lake" || place === "fen" || place === "blackwater" || place === "glow-grotto") return "water";
  if (place === "stoneback" || place === "summit" || place === "whitecrown" || place === "ember-vein") return "mount";
  if (place === "keep" || place === "keep-road") return place === "keep" ? "keep" : "field";
  if (
    place === "cavern" ||
    place === "cavern-mouth" ||
    place === "mirefen" ||
    place === "oldnumer" ||
    place === "grave" ||
    place === "vault" ||
    place === "echo" ||
    place === "undervale" ||
    place === "bone-hall"
  )
    return "dungeon";
  return "field";
}
