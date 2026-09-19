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
  hasBombs: boolean;
  songs: string[];
  metNpcs: string[];
  worldsCleared: string[];
  gems: Record<GemId, boolean>;
  gemsPlaced: GemId[];
  quests: Record<string, number>;
  mushrooms: number;
  wood: number;
  rocks: number;
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

  if (has(q, "gem", "shrine", "sum", "orange", "spiritual", "jewel")) {
    if (!s.gems.emerald) return "Ask Cole. East of the keep road. A dark mouth. Walk there.";
    if (!s.gems.sapphire) return "Reed talks about wet water south of town. A hole in the bank.";
    if (!s.gems.ruby) return "Holt knows a sealed crag east of the mill. Tess plays skip for the loud balls that crack it.";
    if (s.gemsPlaced.length < 3) return "You hold all three. Walk them to the castle.";
    return "They already sit. What happens next is not a gift.";
  }

  if (has(q, "cavern", "cave", "dark mouth", "sun hollow", "emerald")) {
    return "Sun Hollow. Gold stone on gold, fire stone on fire. Roll the log over the water. The middle hall has four mouths — east first for a key. Two then three then five. Little sun, bigger, biggest. The chest holds a sling for the far eye.";
  }

  if (has(q, "marsh", "blue", "sapphire", "wet", "crypt")) {
    return "South of Oakstead, at the wild pond. A wet mouth in the bank.";
  }

  if (has(q, "bomb", "bombs", "crag", "rock", "ruby", "cinder", "crater")) {
    if (!s.hasBombs) return "Tess in Oakstead wants to play skip. Three greens. She gives loud balls.";
    return "A long walk east of the mill. Throw a bomb at the cracked rock.";
  }

  if (has(q, "jail", "prison", "caught", "locker", "fang", "turn")) {
    if (live.jail.on) return live.jail.tip || "The box is a stair. The little key is not for the big door. Fire likes the wall.";
    return "The Lizard King puts people in a coffin cage in the moon hall under the castle. They come out as fangs. If a bunch of them stand around you, they take you to a jail. Look at the box first.";
  }

  if (has(q, "keep", "king", "veyr", "nag", "lizard king", "castle")) {
    if (s.gemsPlaced.length < 3) return "Three gems have to sit in the sockets before the keep will let you in as a guest.";
    if (s.worldsCleared.includes("keep")) return "The keep already remembers. Walk Some Meadow. People still talk.";
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

  if (has(q, "flint", "forge", "blacksmith", "smith", "anvil", "ore")) {
    if ((s.quests["flint-ore"] ?? 0) >= 2) return "Flint still buys five rocks at a time. The crater east of the mill coughs them.";
    if ((s.quests["flint-ore"] ?? 0) >= 1) {
      return (s.rocks ?? 0) >= 5
        ? "You have five. Flint is at the forge east of the square."
        : "Grey rocks. The sealed crag east of the mill. Tess’s loud balls open it.";
    }
    return "Flint hammers east of the square, past Ash’s hall. He pays for five rocks.";
  }

  if (has(q, "bramble", "farm", "scarecrow", "crow", "chicken")) {
    if ((s.quests["bramble-crow"] ?? 0) >= 2) return "Bramble’s rows are quiet. She mentioned foxes on the north hill.";
    if ((s.quests["bramble-crow"] ?? 0) >= 1) return "You hit the scarecrow. Tell Bramble. East farm, past the mill.";
    return "Bramble’s farm is east of the mill. The straw man in her rows wants a swing.";
  }

  if (has(q, "shuttered", "boarded", "manor", "locked house")) {
    return "West of the inn a house is boarded. Someone still lights a lamp. The weeds behind it hid a purse.";
  }

  if (has(q, "village", "oakstead", "town", "people")) {
    return "South of the meadow. A long walk toward the mill and the pond. The gold mark on the compass points there if you have one.";
  }

  if (has(q, "target", "lock on", "l button")) {
    return "Walk close till a yellow mark shows. Then L. The camera stays with them. Side-step with A and D.";
  }

  if (has(q, "door", "house", "go in")) {
    return "Walk up and press F. A math problem lets you in. Wrong answers put you back out. Fangs stay outside.";
  }

  if (has(q, "dungeon", "temple", "puzzle", "plate", "eye", "stuck")) {
    if (s.currentWorld && s.currentWorld !== "meadow") {
      return "Push matching stones onto matching rings. Hit the red eye. Pick up the key. Then the wall in the next hall is the real puzzle — match the pictures, not the seats. Wrong order just resets. F at the mouth takes you home.";
    }
    return "Temples open on the map after you wake Sum. Each one is a handful of halls. The wall paintings are the answers.";
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
  if (!s.gems.emerald) return "Cole said a dark mouth east of the keep road. Walk. The map will not carry you.";
  if (!s.hasBombs) return "Tess wants to play skip. Three greens. She keeps loud balls.";
  if (!s.gems.sapphire) return "Reed said a wet hole south of the wild water.";
  if (!s.gems.ruby) return "Holt’s sealed crag. East of the mill. Bombs.";
  if (s.gemsPlaced.length < 3) return "Three stones want three mouths. The keep is not a temple yet.";
  if (!s.worldsCleared.includes("keep")) return "The keep will not be kind. Wait for the swing.";
  if (!s.hasHorse) return s.hasSword ? "West of the first blade. Name her." : "The sword is in a chest in the meadow. A horse waits just west of it.";
  if (!s.worldsCleared.includes("grove")) return "The leftover split. The first of the five is green.";
  if (!s.worldsCleared.includes("vault") && s.worldsCleared.includes("keep")) {
    return "The map still has temples with no names on the first page. Open it.";
  }
  return "The count is whole enough. Walk. Ask something smaller if you are stuck on a thing.";
}
