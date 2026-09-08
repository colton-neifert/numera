import type { GemId } from "./content";
import { live } from "./world3d/live";

export type HintSnap = {
  hasSword: boolean;
  hasOcarina: boolean;
  hasHorse: boolean;
  hasAxe: boolean;
  hasBow: boolean;
  hasShield: boolean;
  hasPole: boolean;
  songs: string[];
  metNpcs: string[];
  worldsCleared: string[];
  gems: Record<GemId, boolean>;
  gemsPlaced: GemId[];
  quests: Record<string, number>;
  mushrooms: number;
  wood: number;
  currentWorld: string | null;
};

function has(q: string, ...words: string[]) {
  return words.some((w) => q.includes(w));
}

export function askClue(raw: string, s: HintSnap): string {
  const q = raw
    .toLowerCase()
    .replace(/[^a-z0-9 +'/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!q) return "Ask what you want to do next. I’ll give a clue, not the whole path.";

  if (has(q, "horse", "ride", "epona", "pony", "mount")) {
    if (s.hasHorse) {
      if (!s.songs.includes("horse")) return "You already have one. The man who still stands the keep door knows a song to call it.";
      return "You already have it. Play the call if it wandered. Hal taught it.";
    }
    if (!s.worldsCleared.includes("keep") && !s.hasSword) return "Get a blade first. Ash or the cedar chest. Then a horse waits west of that chest.";
    return "West of the cedar chest on the keep road, in the long grass. Walk up and name her.";
  }

  if (has(q, "sword", "blade", "weapon", "b button")) {
    if (s.hasSword) return "You already carry it. B swings. Hold B, then let go, for a spin.";
    if (!s.metNpcs.includes("oak-note")) return "Something is pinned to a tree near where you woke. Read it first.";
    return "Ash in the paddock hall will hand you one. Or follow the keep road to a lone cedar and open the chest.";
  }

  if (has(q, "flute", "ocarina", "reed", "pipe", "instrument")) {
    if (!s.hasOcarina) return "A small chest sits near the shrine in the west field. Not inside it. Beside it.";
    if (!s.songs.includes("oak")) return "The girl picking apples will put a song in your mouth if you talk to her.";
    return "O takes it out. Letters play notes. Songs you already know do something. Songs you don’t are just wind.";
  }

  if (has(q, "song", "oak", "mira", "bars", "gate")) {
    if (!s.hasOcarina) return "You need the reed first. It sleeps in a chest by the west shrine.";
    if (!s.songs.includes("oak")) return "Talk to the apple-picker. She will not write the notes down twice if you weren’t listening.";
    if (!s.gems.emerald) return "Play the first song she taught at the bars of the west stone house. Then go in.";
    return "Different songs do different things. Talk to people in houses. They keep the rest.";
  }

  if (has(q, "gem", "shrine", "sum", "orange", "spiritual")) {
    if (!s.gems.emerald) return "A long walk left from the meadow. A stone house with an orange window. A song lifts the bars.";
    if (!s.gems.ruby) return "East of the shrine a cave opened. The red one likes the dark.";
    if (!s.gems.sapphire) return "After the cave, the wet place. The blue one sleeps in the last hall.";
    if (s.gemsPlaced.length < 3) return "You hold all three. The keep door has three mouths. Feed them.";
    return "They already sit. What happens next is not a gift.";
  }

  if (has(q, "cavern", "cave", "red gem", "ruby", "addend")) {
    if (!s.worldsCleared.includes("meadow") && !s.gems.emerald) return "Wake the orange shrine first. The cave will not open its mouth till Sum remembers.";
    return "Inside: a plate, an eye, a key, then a second eye further in. The gem is not in the first room.";
  }

  if (has(q, "marsh", "blue", "sapphire", "wet")) {
    if (!s.gems.ruby) return "The red cave first. Then the marsh.";
    return "Two stones, an eye, a key, then another eye in the reeds. Do not stop at the first hall.";
  }

  if (has(q, "jail", "prison", "caught", "locker", "fang", "turn")) {
    if (live.jail.on) return live.jail.tip || "The box is a stair. The little key is not for the big door. Fire likes the wall.";
    return "The Lizard King puts people in a locker in the castle. They come out as fangs. If a bunch of them stand around you, they take you to a jail. Look at the box first.";
  }

  if (has(q, "keep", "king", "veyr", "nag", "lizard king", "castle")) {
    if (s.gemsPlaced.length < 3) return "Three gems have to sit in the sockets before the keep will let you in as a guest.";
    if (s.worldsCleared.includes("keep")) return "The keep already remembers. Temples still wait on the map.";
    return "Walk in. Wait till he swings. Then cut. Do not rush the first strike.";
  }

  if (has(q, "axe", "chop", "tree", "wood")) {
    if (!s.hasAxe) return "Not at the start. West of the village, after you have a blade and a reed. A chest that does not look like a sword chest.";
    if ((s.quests["mill-wood"] ?? 0) >= 1 && (s.quests["mill-wood"] ?? 0) < 2) {
      return s.wood >= 5
        ? "You have enough stacks. The miller is waiting by the wheel."
        : "Three chops drop a tree. Chop the fallen log three more times. Pick up the piles. He asked for five.";
    }
    return "Hold B with the axe to spin. Chop a tree three times. Chop the log on the ground for three more stacks.";
  }

  if (has(q, "mushroom", "nana", "broth", "cap")) {
    if ((s.quests["nana-broth"] ?? 0) >= 2) return "Nana already has her three. Sit if you like.";
    if ((s.quests["nana-broth"] ?? 0) < 1) return "The old woman in the east cabin likes caps from the feet of trees.";
    return s.mushrooms >= 3
      ? "You have three. Take them back to Nana."
      : "Walk up to a mushroom and press F. She will not start the pot on two.";
  }

  if (has(q, "apple", "tess", "brin", "bunk")) {
    if ((s.quests["tess-apple"] ?? 0) >= 3) return "Tess already has it. The top bunk is still hers.";
    if ((s.quests["tess-apple"] ?? 0) >= 2) return "You found it. Tess lives in a house in Oakstead. Give it back.";
    return "A boy in the west log house hid it. Look under a bunk, not on it.";
  }

  if (has(q, "bow", "arrow", "fairy bow")) {
    if (s.hasBow) return "You have it. Equip it in the backpack. Cut grass for arrows if you run out.";
    return "Bigger chests in later temples hide it. Not the first meadow chest.";
  }

  if (has(q, "bomb", "grotto", "crack")) {
    return "Grass and lizards drop them later. A cracked wall east of the meadow likes a loud gift.";
  }

  if (has(q, "shield", "block")) {
    if (s.hasShield) return "Hold R, or equip it. It has to be in front of you. After they swing, they are open.";
    return "Bess in the shop will sell one if you have the rupees.";
  }

  if (has(q, "fish", "pole", "fishing", "pond")) {
    if (!s.hasPole) return "A chest by the dock, a little off the water. Don’t open it while you swim.";
    return "Equip the pole. Stand at the dark water. F casts. Then a problem. Then reel.";
  }

  if (has(q, "sell", "market", "stall", "pax", "pack merchant", "firewood")) {
    return "A man with a big pack stands behind a stall at the Oakstead gate. He buys fish, cooked fish, mushrooms, wood, apples, seeds, and rocks. He will not buy your sword.";
  }

  if (has(q, "village", "oakstead", "town", "people")) {
    return "South of the meadow. A long walk toward the mill and the pond. The gold needle on the compass points there if you have one.";
  }

  if (has(q, "target", "lock on", "l button")) {
    return "Walk close till a yellow mark shows. Then L. The camera stays with them. Side-step with A and D.";
  }

  if (has(q, "door", "house", "go in")) {
    return "Walk up and press F. A math problem lets you in. Wrong answers put you back out. Fangs stay outside.";
  }

  if (has(q, "dungeon", "temple", "puzzle", "plate", "eye", "stuck")) {
    if (s.currentWorld && s.currentWorld !== "meadow") {
      return "Eyes look at you. Stones sit on gold plates. Keys show after both proofs. The last hall has a warden. The light will not take you until it falls.";
    }
    return "Temples open on the map after you wake Sum. Each one is a longer walk than the last.";
  }

  if (has(q, "hide", "seek", "tallow")) {
    return "The loud boy will play after you know Sun’s Count. Think of wheels. Then walls. Then water.";
  }

  if (has(q, "cobb", "boot", "carrot", "holt")) {
    return "After dark, one gardener jumps the other’s rows. Something gets left in the dirt.";
  }

  if (has(q, "well", "tallow boy", "small king")) {
    return "A small shape waits at the counting well after the lanterns die. Wave and it goes in.";
  }

  if (has(q, "heart", "heal", "dying", "health")) {
    return "Apples, mushrooms, cooked fish. Grass sometimes. Nana’s broth. Or the backpack math for a heart if you have nothing left.";
  }

  if (has(q, "save", "backpack")) {
    return "Cole in a house teaches a rest song. There is also a save in the backpack. The world remembers you.";
  }

  if (has(q, "map", "where", "go next", "what now", "stuck", "help")) {
    return nextClue(s);
  }

  if (has(q, "fight", "lizard", "fang", "combat")) {
    return "Walk up and press B. No math for fighting. Wait till they swing, then hit. Hold the shield if you have one.";
  }

  if (has(q, "swim", "dive", "underwater")) {
    return "The dark blue is deep. Hold F to go under. Lily pads hold you. A gold coin sleeps in the middle if you dive.";
  }

  return nextClue(s);
}

function nextClue(s: HintSnap): string {
  if (!s.metNpcs.includes("oak-note") && !s.hasSword) return "Start with words on a tree, not with a fight.";
  if (!s.hasSword) return "The first blade is not in a house. It is under a tree in the field.";
  if (!s.hasOcarina) return "After the blade, look west. A smaller chest keeps a quieter gift.";
  if (!s.songs.includes("oak")) return "Someone in the village still sings to the trees.";
  if (!s.gems.emerald) return "A song you already know is for a door that is not a house.";
  if (!s.gems.ruby) return "When Sum wakes, a mouth of stone opens east of it.";
  if (!s.gems.sapphire) return "After the red dark, a wet place. Do not mix the two gems.";
  if (s.gemsPlaced.length < 3) return "Three stones want three mouths. The keep is not a temple yet.";
  if (!s.worldsCleared.includes("keep")) return "The keep will not be kind. Wait for the swing.";
  if (!s.hasHorse) return s.hasSword ? "West of the first blade. Name her." : "The sword is in a chest in the meadow. A horse waits just west of it.";
  if (!s.worldsCleared.includes("grove")) return "The leftover split. The first of the five is green.";
  if (!s.worldsCleared.includes("vault") && s.worldsCleared.includes("keep")) {
    return "The map still has temples with no names on the first page. Open it.";
  }
  return "The count is whole enough. Walk. Ask something smaller if you are stuck on a thing.";
}
