import type { WorldId } from "./types";
import type { HumanLook } from "./world3d/actors";
import { live } from "./world3d/live";
import { inVillage } from "./world3d/village";
import { vWorld } from "./world3d/field";
import { useGame } from "./store";

export type TalkLine = { speaker: string; text: string };

export type NpcDef = {
  id: string;
  name: string;
  world: WorldId;
  x: number;
  z: number;
  facing: number;
  look?: HumanLook;
  kind?: "person" | "sign" | "stone" | "well" | "note";
  chore?: "pick";
  indoor?: string;
  kid?: boolean;
  lines: (ctx: TalkCtx) => TalkLine[];
};

export type TalkCtx = {
  name: string;
  cleared: WorldId[];
  met: string[];
  hasOcarina?: boolean;
  hasHorse?: boolean;
  songs?: string[];
  coins?: number;
  coinsMax?: number;
  quests?: Record<string, number>;
  mushrooms?: number;
  wood?: number;
};

function L(tunic: string, sash: string, extra: Partial<HumanLook> = {}): HumanLook {
  return {
    tunic,
    sash,
    hair: extra.hair ?? "#4a3220",
    skin: extra.skin ?? "#c49674",
    boots: extra.boots ?? "#3a2820",
    pants: extra.pants ?? "#5a4a38",
    mouth: extra.mouth ?? "smile",
    blush: extra.blush ?? "#e8a090",
    ...extra,
  };
}

function missMira(who: string, name: string): TalkLine | null {
  if (!live.miraUp) return null;
  const bits: Record<string, string> = {
    Tallow: `Mira is in the tree again, ${name}!! I waved. She picked apples. She never comes down when I want her.`,
    Nora: `Mira hasn’t been by for bread. She’s up that tree from morning. Tell her I saved a heel.`,
    Wren: `${name}. Wipe your feet. Mira would say the same if she ever came down from the apples.`,
    Cole: `Oakstead is quieter when Mira’s in the leaves. She used to sit here.`,
    Tess: `Mira is stuck in the tree!! Tell her to hop down and play skip!!`,
    Oat: `The mill turns. Mira counts leaves instead. I miss her at the door.`,
    Nell: `Mira is in the oak again. Day is when I wait for her to come down.`,
    Reed: `Wood for the fire. Mira for the tree. We miss her on the path.`,
    Holt: `Mira used to taste the rows. Now she lives in that tree. The dirt misses her.`,
    Willow: `Mira is in her tree. She will not come to this one. I miss her voice, not her advice.`,
    Cobb: `Mira used to count my crates. Now she counts leaves. I miss the even numbers.`,
    Brin: `Mira won’t play. She’s in the apples again. Tell her the top bunk is still Tess’s.`,
    Pell: `Mira has not sat for stew. She is in that tree. The long table misses her.`,
    Pip: `Mira is up the tree!! Nana says come down. She does not come down.`,
    Nana: `That girl is in the apples again. I saved her a bowl. It is getting cold.`,
    Tuck: `Mira left a stitch on my bench. Then she went back to the tree. I miss the quiet.`,
    Miller: `Mira used to bring the even sacks. Now I hear her in the leaves. The mill misses her.`,
    Lila: `Mira has not taken a room. She sleeps in apples. I miss her at breakfast.`,
    Gil: `Mira used to wave from the landing. Now I only hear the leaves.`,
    Mae: `The hall is quieter. Mira is in that tree again.`,
    Ash: `Mira’s in the apples. I’d rather she came down and counted with us, ${name}.`,
    Pax: `Mira is not at the well. She is in the apples. The bucket misses her.`,
  };
  const text = bits[who];
  return text ? { speaker: who, text } : null;
}

function noticeHorse(who: string, name: string): TalkLine | null {
  if (!live.mounted) return null;
  const horse = useGame.getState().horseName || "your horse";
  const bits: Record<string, string> = {
    Tallow: `${horse} is SO tall!! Can I sit too??`,
    Nora: `Wipe her hooves before the bread, ${name}. She’s a beauty though.`,
    Wren: `${name}. A horse in town. Mind the children. Mind the pies.`,
    Cole: `${horse} has kind eyes. Sit. She can graze.`,
    Tess: `A HORSE!! A REAL HORSE!! Hi ${horse}!!`,
    Oat: `The mill path is narrow. ${horse} still looks proud.`,
    Nell: `I used to ride. Then I didn’t. She looks fast.`,
    Reed: `Wood for the fire. Hay for ${horse}. Fair trade.`,
    Holt: `${horse} will pack the rows if you let her. I like her anyway.`,
    Willow: `Even the trees watch ${horse}. I am watching too.`,
    Cobb: `${horse}’s steps are even. I respect even steps.`,
    Brin: `Can ${horse} jump the bunk?? Tess said no.`,
    Pell: `${horse} may not come in. I will bring carrots out.`,
    Pip: `Horse!! Horse!! Nana look!!`,
    Nana: `A good animal, ${name}. Speak soft and she will listen.`,
    Tuck: `${horse} would muss the wool. Still, what a coat.`,
    Miller: `Keep ${horse} off the grain. She may have an apple later.`,
    Lila: `The inn has a rail. ${horse} can wait. You can eat.`,
    Gil: `${horse} fills the landing. I will make room.`,
    Mae: `A horse in the hall. The hall can take it.`,
    Ash: `${horse} is honest. Ride her like you mean it, ${name}.`,
    Pax: `${horse} drinks from the well if I let her. I let her.`,
    Mira: `${horse} can have an apple. I have extras in the leaves.`,
    Cairn: `Crownward sees many horses. Yours still turns heads.`,
    Holm: `${horse} has good feet. The north road will like her.`,
  };
  const text = bits[who];
  return text ? { speaker: who, text } : { speaker: who, text: `${horse} is a fine one, ${name}.` };
}

function thanksRook(who: string, name: string, id: string): TalkLine | null {
  if (!live.rookThanks) return null;
  if (live.rookThanked[id]) return null;
  const bits: Record<string, string> = {
    Ash: `${name}. We stood together. Thank you for counting me in.`,
    Nora: `You stopped him, ${name}. I hid in the bread. Thank you.`,
    Wren: `${name}. You stood when we ran. Oakstead thanks you.`,
    Cole: `Rook was a house with a sword. You made him a man again. Thank you.`,
    Tess: `You beat the big scary Rook!! Thank you thank you!!`,
    Oat: `The mill still turns. We came back because of you. Thank you.`,
    Nell: `I bolted the door. Then I heard him fall. Thank you.`,
    Reed: `We ran. You did not. Oakstead owes you.`,
    Holt: `I left my rows. You kept them. Thank you.`,
    Willow: `Even I ran, ${name}. You did not. Thank you.`,
    Cobb: `I was inspecting the west path. At speed. Thank you.`,
    Brin: `I ran with Tess. You stayed. Thank you.`,
    Pell: `The long table was empty. Now it is not. Thank you.`,
    Pip: `Nana pulled me. You fought him. Thank you!!`,
    Nana: `I took the children. You took Rook. Bless you.`,
    Tuck: `I dropped a stitch and ran. Thank you for the quiet.`,
    Miller: `The mill hid me. You did the work. Thank you.`,
    Lila: `The inn emptied. You filled the night with something better. Thank you.`,
    Gil: `I locked the landing. Thank you for opening the morning.`,
    Mae: `I hid in the hall. Thank you.`,
    Lark: `The clock kept counting while we ran. Thank you.`,
    Pax: `The well was a bad hiding place. Thank you anyway.`,
    Mira: `${name}. I came down. I ran. You stayed. Thank you.`,
    Cairn: `Crownward emptied. You put him down. The city thanks you.`,
    Holm: `I held the north gate. You held Rook. Thank you.`,
  };
  const text = bits[who];
  return text ? { speaker: who, text } : { speaker: who, text: `${name}. You put Rook down. Thank you.` };
}

const NPCS_RAW: NpcDef[] = [
  {
    id: "oak-note",
    name: "Pinned note",
    world: "meadow",
    x: -8,
    z: -70,
    facing: 0,
    kind: "note",
    lines: () => [
      { speaker: "Note", text: "Ash at the paddock will put a blade in your hand. Or walk the keep road — a lone cedar, a chest, a count of rings." },
    ],
  },
  {
    id: "mira",
    name: "Mira",
    world: "meadow",
    x: -24.2,
    z: -80.8,
    facing: 0.4,
    chore: "pick",
    look: L("#3d7a48", "#c9a227", { hair: "#6a3a22", mouth: "smile", longHair: true, shirt: "#efe6d4", kit: "pinafore", prop: "flowers", lashes: "long" }),
    lines: ({ name }) => [
      { speaker: "Mira", text: `${name}. The Oak still counts. So do the apples.` },
      { speaker: "Mira", text: "Come by when the ladder is free. I will come down if you wait." },
    ],
  },
  {
    id: "tallow",
    name: "Tallow",
    world: "meadow",
    x: 4,
    z: -108,
    facing: 2.2,
    kid: true,
    look: L("#5a3a22", "#c9a227", { hair: "#6a4224", skin: "#f0c8a8", pants: "#3a3228", shirt: "#efe6d4", kit: "vest", eyeShape: "round" }),
    lines: ({ name }) => [
      { speaker: "Tallow", text: `${name}!! Hide and seek!! I hide three times. You find me!!` },
      { speaker: "Tallow", text: "Ash trains by the horse!! He has a real sword. He said I am too small. I am NOT too small!!" },
    ],
  },
  {
    id: "nora",
    name: "Nora",
    world: "meadow",
    x: 1.4,
    z: -79.6,
    facing: 2.4,
    look: L("#8a3a38", "#c9a227", { hair: "#5a3a28", shirt: "#efe6d4", kit: "apron", apron: "#efe6d4", kerchief: "#c8b090", prop: "bread", longHair: true, pants: "#8a3a38" }),
    lines: ({ name, hasOcarina, songs }) => {
      if (hasOcarina && !(songs ?? []).includes("loaf")) {
        return [
          { speaker: "Nora", text: `${name}. A loaf has a song, if you listen while it cools.` },
          { speaker: "Nora", text: "D, F, A. Then again. That’s Loaf’s Rest." },
        ];
      }
      return [
        { speaker: "Nora", text: `${name}. Bread’s in the oven. Tallow’s in the lane. Guess which one I can count on.` },
        { speaker: "Nora", text: "Cobb inspects Holt’s rows after dark. I bake. I notice." },
      ];
    },
  },
  {
    id: "pip",
    name: "Pip",
    world: "meadow",
    x: -24,
    z: -66,
    facing: 2.4,
    kid: true,
    indoor: "home",
    look: L("#8a3a38", "#c9a227", { hair: "#4a3220", pants: "#8a3a38", shirt: "#efe6d4", kit: "dress", kerchief: "#c8b090", prop: "lamb", longHair: true }),
    lines: ({ name }) => [
      { speaker: "Pip", text: `${name}!! This is my house!! Nana’s is the other warm one!!` },
      { speaker: "Pip", text: "The castle is far. Walk north until the stone gets tall." },
    ],
  },
  {
    id: "nana",
    name: "Nana",
    world: "meadow",
    x: 24,
    z: -66,
    facing: 0.4,
    indoor: "cabin",
    look: L("#6a4a68", "#c9a227", { hair: "#c8c0b4", kit: "cloak", hairStyle: "greybun", stoop: 0.08 }),
    lines: ({ name }) => [
      { speaker: "Nana", text: `Come in when you like, ${name}. The kettle knows your name.` },
      { speaker: "Nana", text: "Pip runs. You walk. That is the better count." },
    ],
  },
  {
    id: "pell",
    name: "Pell",
    world: "meadow",
    x: 32,
    z: -112,
    facing: 0,
    look: L("#5a3a28", "#c9a227", { hair: "#2a2018", kit: "cloak", hat: "wide", mustache: true, beard: true, shirt: "#3a5a88", prop: "cloth" }),
    lines: ({ name }) => [
      { speaker: "Pell", text: `${name}. How many for? Two, four, or six. The long table takes all of Oakstead.` },
      { speaker: "Pell", text: "Write a friend if you want company. I count plates. Then I count them again." },
    ],
  },
  {
    id: "cobb",
    name: "Cobb",
    world: "meadow",
    x: 16,
    z: -102,
    facing: 1.2,
    look: L("#3a4a78", "#c9a227", { hair: "#3a2820", glasses: true, kit: "scholar", shirt: "#efe6d4", prop: "scroll" }),
    lines: ({ name }) => [
      { speaker: "Cobb", text: `${name}. I inspect. That’s all. Carrots grow if you jump. That’s science.` },
      { speaker: "Cobb", text: "Holt sleeps in the dirt. Someone has to count the rows." },
    ],
  },
  {
    id: "holt",
    name: "Holt",
    world: "meadow",
    x: 18,
    z: -100,
    facing: 3.4,
    look: L("#6a4a28", "#c9a227", { hair: "#4a3220", shirt: "#efe6d4", kit: "overalls", hat: "beret", prop: "pitchfork" }),
    lines: ({ name, quests }) => {
      if ((quests?.ash ?? 0) >= 5) {
        return [{ speaker: "Holt", text: `${name}. You and Ash dropped that west brute. The rows heard the swing.` }];
      }
      return [
        { speaker: "Holt", text: `${name}. Crates of four. Always four. Cobb knows. Cobb pretends not to.` },
        { speaker: "Holt", text: "I sleep by the rows so the count stays honest." },
      ];
    },
  },
  {
    id: "oak0",
    name: "Wren",
    world: "meadow",
    x: -14,
    z: -74,
    facing: 0.8,
    look: L("#6a4a28", "#c9a227", { hair: "#6a3a22", hairStyle: "bun", shirt: "#efe6d4", kit: "overalls" }),
    lines: ({ name }) => [
      { speaker: "Wren", text: `${name}. Wipe your feet.` },
      { speaker: "Wren", text: "The mill keeps the grain. The fangs keep the night. I keep the door." },
    ],
  },
  {
    id: "oak1",
    name: "Cole",
    world: "meadow",
    x: -4,
    z: -64,
    facing: 2.1,
    look: L("#4a5a38", "#c9a227", { hair: "#6a4228", shirt: "#efe6d4", kit: "vest" }),
    lines: ({ name }) => [
      { speaker: "Cole", text: `Oakstead is small, ${name}. I like it that way.` },
      { speaker: "Cole", text: "North of here the stone gets proud. That’s Crownward, then the keep." },
    ],
  },
  {
    id: "oak2",
    name: "Tess",
    world: "meadow",
    x: 14,
    z: -74,
    facing: 3.5,
    kid: true,
    look: L("#3d7a48", "#c9a227", { hair: "#8a4a28", pants: "#3d7a48", shirt: "#efe6d4", kit: "pinafore", prop: "flowers", longHair: true, eyeShape: "round" }),
    lines: ({ name }) => [
      { speaker: "Tess", text: `The top bunk is mine, ${name}!! Brin can have the ladder!!` },
      { speaker: "Tess", text: "Play skip after the apples come down!!" },
    ],
  },
  {
    id: "oak3",
    name: "Brin",
    world: "meadow",
    x: -24,
    z: -88,
    facing: 0.3,
    kid: true,
    look: L("#5a3a22", "#c9a227", { hair: "#2a2018", hairStyle: "curly", pants: "#3d6a38", shirt: "#efe6d4", kit: "vest" }),
    lines: ({ name }) => [
      { speaker: "Brin", text: `${name}. Tess says the top bunk is hers. I counted. She is right. I hate it.` },
    ],
  },
  {
    id: "oak4",
    name: "Oat",
    world: "meadow",
    x: 8,
    z: -96,
    facing: 1.7,
    look: L("#5a3a22", "#c9a227", { hair: "#c8c0b4", hat: "beret", mustache: true, kit: "overalls", shirt: "#efe6d4" }),
    lines: ({ name }) => [
      { speaker: "Oat", text: `The mill turns, ${name}. If the count is wrong, sit. The wheel will finish it.` },
    ],
  },
  {
    id: "oak5",
    name: "Nell",
    world: "meadow",
    x: -6,
    z: -92,
    facing: 2.8,
    look: L("#3d6a48", "#c9a227", { hair: "#c8c0b4", kerchief: "#3a5a38", kit: "apron", apron: "#efe6d4", prop: "can", stoop: 0.06 }),
    lines: ({ name }) => [
      { speaker: "Nell", text: `${name}. Night listener. Don’t open for fangs. Don’t open for Rook either.` },
    ],
  },
  {
    id: "oak6",
    name: "Reed",
    world: "meadow",
    x: 22,
    z: -90,
    facing: 4.0,
    look: L("#4a5a38", "#c9a227", { hair: "#3a3228", beard: true, hat: "green", shirt: "#efe6d4", kit: "vest", prop: "net" }),
    lines: ({ name, quests }) => {
      if ((quests?.ash ?? 0) >= 4) {
        return [{ speaker: "Reed", text: `${name}. Ash walks at your shoulder now. That’s a rare count.` }];
      }
      return [{ speaker: "Reed", text: `Wood for the fire. Grain for the mill. Names for the Oak, ${name}.` }];
    },
  },
  {
    id: "ash",
    name: "Ash",
    world: "meadow",
    x: 16,
    z: -44,
    facing: Math.PI,
    look: L("#5a3a22", "#c9a227", {
      hair: "#3a2418",
      pants: "#3a3228",
      boots: "#5a3a22",
      shirt: "#efe6d4",
      kit: "vest",
      mouth: "smile",
      brows: "neutral",
      eyes: "#3a5a38",
    }),
    lines: ({ name, quests }) => {
      const q = quests?.ash ?? 0;
      const huntDone = (useGame.getState().defeated.meadow ?? []).includes("ash-hunt");
      const rookDown = (useGame.getState().defeated.meadow ?? []).includes("rook");
      const groveDone = (useGame.getState().worldsCleared ?? []).includes("grove");
      if (groveDone && q >= 5) {
        return [
          { speaker: "Ash", text: `Sorry. I can’t come with you for the next gym, ${name}.` },
          { speaker: "Ash", text: "I have to stay here and look after my town. Goodbye, friend." },
        ];
      }
      if (rookDown && q >= 5) {
        return [
          { speaker: "Ash", text: `${name}. We dropped him. I still can’t believe the size of that swing.` },
          { speaker: "Ash", text: "Anytime. You know where I walk." },
        ];
      }
      if (q >= 5 || huntDone) {
        return [
          { speaker: "Ash", text: `${name}. That’s a real friend. If Rook grows tonight, I’m at your shoulder.` },
          { speaker: "Ash", text: "I mean it. Don’t start that fight without me." },
        ];
      }
      if (q >= 4) {
        return [
          { speaker: "Ash", text: `West of town, ${name}. Ring of stones. Big lizard. We take it together.` },
          { speaker: "Ash", text: "I’ll keep to your left. Hit when I do." },
        ];
      }
      if (q >= 3) {
        return [
          { speaker: "Ash", text: `That was a good table, ${name}. I don’t sit with just anyone.` },
          { speaker: "Ash", text: "There’s a brute west of town. Fight it with me. Then I’ll call us friends for real." },
        ];
      }
      if (q >= 2) {
        return [
          { speaker: "Ash", text: `Pell’s whenever you can, ${name}. Don’t worry. I’ll pay for your food.` },
          { speaker: "Ash", text: "I’ll walk with you. Don’t eat alone." },
        ];
      }
      if (q >= 1) {
        return [
          { speaker: "Ash", text: `Come inside, ${name}. Hit V for a slash. Hold V for a spin.` },
          { speaker: "Ash", text: "If you mess up, I’ll say so. Then the real test." },
        ];
      }
      return [
        { speaker: "Ash", text: `${name}. Ash. This hall is mine. I teach anyone who can count a swing.` },
        { speaker: "Ash", text: "Come in. I’ll give you a sword and show you how V hits." },
      ];
    },
  },
  {
    id: "dusk",
    name: "Dusk",
    world: "meadow",
    x: -2,
    z: -80,
    facing: 0.4,
    look: L("#2a241c", "#c9a227", { hair: "#1a1410", cap: "#3a3228", mouth: "frown", brows: "worried", eyes: "#c9a227" }),
    lines: ({ name }) => [
      { speaker: "Dusk", text: `${name}. I think I just heard something.` },
      { speaker: "Dusk", text: "Keep the lantern. Don’t walk the dark lane alone." },
    ],
  },
  {
    id: "rook",
    name: "Rook",
    world: "meadow",
    x: 3.2,
    z: -84,
    facing: 2.4,
    look: L("#3a2a28", "#8a3a38", { hair: "#1a1410", boots: "#1a1410", pants: "#2a2018", cap: "#2a1818", mouth: "smile", brows: "raised", eyes: "#4a3a38" }),
    lines: ({ name, quests }) => {
      const beaten = (useGame.getState().defeated.meadow ?? []).includes("rook");
      if (live.night && useGame.getState().hasSword && !beaten && !live.rookFight) {
        return [
          { speaker: "Rook", text: `${name}. You might not like this...` },
          { speaker: "Rook", text: "Stay." },
        ];
      }
      const q = quests?.rook ?? 0;
      if (q >= 3) {
        return [
          { speaker: "Rook", text: `${name}. You kept counting. I liked that.` },
          { speaker: "Rook", text: "By the fire. After dark. I have something big." },
        ];
      }
      if (q >= 2) {
        return [
          { speaker: "Rook", text: `${name}. Friends share leftovers. I have been saving mine.` },
          { speaker: "Rook", text: "Come by the fire at night. Don’t bring Cobb. He talks." },
        ];
      }
      if (q >= 1) {
        return [
          { speaker: "Rook", text: `${name}. I sit where the count is soft.` },
          { speaker: "Rook", text: "If a plate goes missing, it wasn’t me. If a friend grows, it might be." },
        ];
      }
      return [
        { speaker: "Rook", text: `${name}. I’m Rook. I sit by the fire in Oakstead. You can’t miss me.` },
        { speaker: "Rook", text: "Stay with me until dark. I get bigger after the sun goes. That’s a joke. Mostly." },
        { speaker: "Rook", text: "Bring a sword if you want the joke to finish. I’ll be right here." },
      ];
    },
  },
  {
    id: "mill-man",
    name: "Miller",
    world: "meadow",
    x: 2.4,
    z: -115.4,
    facing: 3.6,
    indoor: "mill",
    look: L("#6a4a28", "#c9a227", { hair: "#3a2820", hat: "beret", mustache: true, kit: "overalls", shirt: "#efe6d4" }),
    lines: ({ name, hasOcarina, songs, quests, wood }) => {
      if (hasOcarina && !(songs ?? []).includes("mill")) {
        return [
          { speaker: "Miller", text: `${name}. The wheel has a song older than the bags.` },
          { speaker: "Miller", text: "H, A, D. Twice. H A D H A D. Miller’s Wheel." },
        ];
      }
      if ((quests?.["mill-wood"] ?? 0) >= 2) {
        return [{ speaker: "Miller", text: `${name}. The wheel still turns. Your stacks sit by the door.` }];
      }
      if ((quests?.["mill-wood"] ?? 0) >= 1) {
        if ((wood ?? 0) >= 5) {
          return [{ speaker: "Miller", text: `Five stacks. Good, ${name}. Look in the grain bin if you have not.` }];
        }
        return [{ speaker: "Miller", text: `Still short, ${name}. Five stacks of wood.` }];
      }
      return [
        { speaker: "Miller", text: `${name}. Five stacks of wood and the wheel remembers you.` },
        { speaker: "Miller", text: "Chop a tree three times, then chop the fallen log." },
      ];
    },
  },
  {
    id: "shopkeep",
    name: "Bess",
    world: "meadow",
    x: 18,
    z: -52,
    facing: Math.PI,
    indoor: "shop",
    look: L("#3d6a48", "#c9a227", { hair: "#3a2418", kerchief: "#3a5a38", kit: "apron", apron: "#efe6d4", shirt: "#efe6d4", prop: "veggies", longHair: true }),
    lines: ({ name, hasHorse }) => [
      {
        speaker: "Bess",
        text: hasHorse
          ? `${name}. Hearts, a shield, bigger bags. I’ve got oats for that horse too. Board on the counter.`
          : `${name}. Hearts, a shield, bigger bags. The board on the counter is the shop.`,
      },
    ],
  },
  {
    id: "pax",
    name: "Pax",
    world: "meadow",
    x: 10.4,
    z: -54.2,
    facing: 3.1,
    look: L("#4a5a38", "#c9a227", { hair: "#3a2820", beard: true, hat: "green", shirt: "#efe6d4", kit: "vest", prop: "net" }),
    lines: ({ name }) => [
      { speaker: "Pax", text: `${name}. I buy what the Vale grows. Mushrooms. Fish. Don’t bring me Rook.` },
    ],
  },
  {
    id: "tuck",
    name: "Tuck",
    world: "meadow",
    x: 6,
    z: -70,
    facing: 1.4,
    look: L("#6a4a28", "#c9a227", { hair: "#c8c0b4", hat: "beret", mustache: true, kit: "overalls", shirt: "#efe6d4" }),
    lines: ({ name, coins, coinsMax }) => {
      if ((coinsMax ?? 100) >= 200) {
        return [{ speaker: "Tuck", text: `${name}. The bigger bag sits well. Don’t fill it with leftover chalk.` }];
      }
      if ((coins ?? 0) >= 100) {
        return [{ speaker: "Tuck", text: `${name}. A hundred rupees and I stitch a bigger wallet. Talk to me once more.` }];
      }
      return [{ speaker: "Tuck", text: `${name}. Bring a hundred rupees. I’ll stitch a bag that holds two hundred.` }];
    },
  },
  {
    id: "lila",
    name: "Lila",
    world: "meadow",
    x: -34,
    z: -126,
    facing: 0.2,
    indoor: "inn",
    look: L("#3d6a48", "#c9a227", { hair: "#d4c08a", kit: "cloak", shirt: "#efe6d4", prop: "herbs", longHair: true }),
    lines: ({ name }) => [
      { speaker: "Lila", text: `${name}. Rooms upstairs. Stairs twice. Don’t wake Mae.` },
    ],
  },
  {
    id: "gil",
    name: "Gil",
    world: "meadow",
    x: -32,
    z: -124,
    facing: 2.6,
    indoor: "inn",
    look: L("#5a3a22", "#c9a227", { hair: "#1a1410", shirt: "#efe6d4", kit: "vest" }),
    lines: ({ name }) => [
      { speaker: "Gil", text: `Landing’s mine to sweep, ${name}. The clock is Lila’s to wind.` },
    ],
  },
  {
    id: "mae",
    name: "Mae",
    world: "meadow",
    x: -34,
    z: -126,
    facing: 3.1,
    indoor: "inn",
    look: L("#d47848", "#e8d48a", { hair: "#d4b05a", shirt: "#efe6d4", kit: "pinafore", longHair: true }),
    lines: ({ name }) => [
      { speaker: "Mae", text: `${name}. I like the hall. The stairs turn twice.` },
      { speaker: "Mae", text: "Room 4 is locked. That’s the miller’s cousin. He snores." },
    ],
  },
  {
    id: "lark",
    name: "Lark",
    world: "meadow",
    x: -30,
    z: -120,
    facing: 0.9,
    look: L("#3a4a68", "#c9a227", { hair: "#3a2820", glasses: true, kit: "scholar", shirt: "#efe6d4", prop: "scroll" }),
    lines: ({ name }) => [
      { speaker: "Lark", text: `${name}. The inn clock keeps Oakstead honest. I keep the clock.` },
    ],
  },
  {
    id: "hal",
    name: "Hal",
    world: "meadow",
    x: 0,
    z: -20,
    facing: 0,
    look: L("#3a5a88", "#c9a227", { hair: "#3a2820", kit: "guard", hat: "helm", shirt: "#efe6d4", prop: "spear", mouth: "frown" }),
    lines: ({ name, cleared, hasOcarina, hasHorse, songs }) => {
      if (hasOcarina && hasHorse) {
        if (songs?.includes("horse")) {
          return [{ speaker: "Hal", text: `D F G. Then D F G again. She will come to you, ${name}.` }];
        }
        return [
          { speaker: "Hal", text: `${name}. That horse west of the first blade knows a count.` },
          { speaker: "Hal", text: "D F G. Then D F G again. Play it. She comes running." },
        ];
      }
      if (cleared.includes("keep")) {
        return [{ speaker: "Hal", text: `${name}. The door held. You walked. That is the job.` }];
      }
      return [
        { speaker: "Hal", text: `${name}. I am the door. Gems first. Then the king.` },
        { speaker: "Hal", text: "Oakstead is behind you. The keep is this stone." },
      ];
    },
  },
  {
    id: "well",
    name: "Well",
    world: "meadow",
    x: 8,
    z: -76,
    facing: 0,
    kind: "well",
    lines: () => [{ speaker: "Well", text: "The bucket remembers every even number. Drop a rupee if you must." }],
  },
  {
    id: "ink",
    name: "Ink",
    world: "meadow",
    x: 46,
    z: -94,
    facing: 3.4,
    indoor: "loft",
    look: L("#4a3a28", "#c9a227", { hair: "#d8d0c4", glasses: true, beard: true, kit: "scholar", shirt: "#efe6d4", prop: "book", mouth: "smile", eyeShape: "narrow", pants: "#3a3228", stoop: 0.04 }),
    lines: ({ name }) => [
      { speaker: "Ink", text: `${name}. This loft is where the Vale was counted onto cloth before it was counted into dirt.` },
      { speaker: "Ink", text: "Three gems. A leftover. A boy who would not leave a remainder. We painted it until it would stand up and walk." },
      { speaker: "Ink", text: "The dummies by the door are you and a lizard, both facing in. Walk around them. Faces meet the way you entered." },
      { speaker: "Ink", text: "If a lizard ever moonwalked at you, that was us. We fixed it. They face their snouts now." },
      { speaker: "Ink", text: "The little vale on the table is the map we kept when the dirt would not sit still. Oakstead north. Keep south. Temples as the count opens them." },
      { speaker: "Ink", text: "The easels are old takes. Oak. Gems. The king before he had a crown. The credits board names who counted. Look, then go count." },
    ],
  },
  {
    id: "loft-note",
    name: "Studio note",
    world: "meadow",
    x: 46.4,
    z: -95.2,
    facing: 0,
    indoor: "loft",
    kind: "note",
    lines: () => [
      { speaker: "Note", text: "Rule one: the face looks where the feet go." },
      { speaker: "Note", text: "Rule two: Oakstead sits north of the keep. The gold N is −Z — the way you walk with the camera at your back." },
      { speaker: "Note", text: "Rule three: a leftover does not vanish. It splits. We had to paint that twice." },
      { speaker: "Note", text: "The table is a counting of the Vale. Gold is you. The chain of temples is the leftover’s road." },
    ],
  },
  {
    id: "gossip-oak",
    name: "Stone",
    world: "meadow",
    x: -10,
    z: -86,
    facing: 0,
    kind: "stone",
    lines: () => [
      { speaker: "Stone", text: "The Goddess of Measure left three stones in the earth." },
      { speaker: "Stone", text: "Behind the mill, under the last board, a purse forgot its owner." },
    ],
  },
];

function inOldVillage(x: number, z: number) {
  return z < -48 && z > -140 && Math.abs(x) < 48;
}

function decorate(placed: NpcDef): NpcDef {
  if (placed.id === "rook") return placed;
  if (placed.kind && placed.kind !== "person") return placed;
  const orig = placed.lines;
  return {
    ...placed,
    lines: (ctx: TalkCtx) => {
      const thank = thanksRook(placed.name, ctx.name, placed.id);
      const extra = missMira(placed.name, ctx.name);
      const horse = noticeHorse(placed.name, ctx.name);
      const lines = orig(ctx);
      const head: TalkLine[] = [];
      if (thank) {
        live.rookThanked[placed.id] = true;
        head.push(thank);
      }
      if (extra && extra.text !== thank?.text) head.push(extra);
      if (horse) head.push(horse);
      if (!head.length) return lines;
      if (lines[0]?.text === head[0]?.text) return lines;
      return [...head, ...lines];
    },
  };
}

export const NPCS: NpcDef[] = NPCS_RAW.map((n) => {
  const placed =
    n.world === "meadow" && inOldVillage(n.x, n.z)
      ? { ...n, x: vWorld(n.x, n.z).x, z: vWorld(n.x, n.z).z }
      : n;
  return decorate(placed);
});

export function npcsIn(world: WorldId): NpcDef[] {
  return NPCS.filter((n) => {
    if (n.world !== world) return false;
    if (!n.kind || n.kind === "person") {
      if (live.house === "eatery") {
        const diners = ["pell", "cobb", "oak0", "oak1", "oak2", "oak4", "oak5", "oak6", "holt", "mira", "nora"];
        if (live.dinner?.arrived && !live.dinner.left && live.dinner.who) diners.push(live.dinner.who);
        return diners.includes(n.id);
      }
      if (n.indoor) {
        if (n.indoor === "eatery") return false;
        if (live.house !== n.indoor) return false;
        if (n.indoor === "inn") {
          if (live.innInRoom) return false;
          if (n.id === "lila" || n.id === "gil") return live.innFloor === 0;
          if (n.id === "mae") return live.innFloor === 2;
        }
        return true;
      }
      if (n.id === "pip") return live.house === "home";
      if (n.id === "nana") return live.house === "cabin";
      if (n.id === "dusk") return live.night && !live.house && !live.rookFight;
      if (live.house) return false;
      if (world !== "meadow") return true;
      return inVillage(n.x, n.z);
    }
    if (n.indoor) return live.house === n.indoor;
    if (live.house) return false;
    return n.kind === "sign" || n.kind === "note" || n.kind === "stone" || n.kind === "well";
  });
}

export function npcById(id: string): NpcDef | undefined {
  return NPCS.find((n) => n.id === id);
}

const TALES: Record<string, string> = {
  "oak-note": "The Oak pinned a note: Ash has a blade — or a cedar on the keep road does.",
  ink: "East of Pell’s table, a loft still keeps the first drawings of the Vale.",
  mira: "The Oak chose a child who still counted true. Veyr would not leave a leftover.",
  tallow: "The sheep come home one short when a remainder walks.",
  nora: "Pip sold chalk to Veyr, and pretends he did not.",
  willow: "Willow kept a seat for the boy who would not finish.",
  cobb: "The smaller gardener jumps Holt’s rows after dark.",
  rook: "Rook sits by the Oakstead fire. You can’t miss him. He gets bigger after dark.",
  ash: "Ash trains by the paddock. He does not fight for strangers.",
  cairn: "Crownward keeps the count. The sash is cream and gold.",
  holm: "The capital sits in front of the keep. Oakstead is the village that feeds it.",
};

export function heardTales(met: string[]): string[] {
  return met.map((id) => TALES[id]).filter((t): t is string => Boolean(t));
}
