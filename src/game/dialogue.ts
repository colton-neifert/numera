import type { WorldId } from "./types";
import type { HumanLook } from "./world3d/actors";
import { live } from "./world3d/live";
import { inVillage } from "./world3d/village";
import { vWorld, WELL_AT, TREE_HOME, POND } from "./world3d/field";
import { useGame } from "./store";

export type TalkPick = { label: string; say: TalkLine[] };
export type TalkLine = { speaker: string; text: string; picks?: TalkPick[] };

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
  stay?: boolean;
  worldAt?: boolean;
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
  rocks?: number;
  gems?: { emerald?: boolean; ruby?: boolean; sapphire?: boolean };
  hour?: number;
};

function L(tunic: string, sash: string, extra: Partial<HumanLook> = {}): HumanLook {
  const dress = Boolean(extra.longHair || extra.kit === "dress" || extra.kit === "pinafore");
  return {
    tunic,
    sash,
    hair: extra.hair ?? "#4a3220",
    skin: extra.skin ?? "#c49674",
    boots: extra.boots ?? "#3a2820",
    pants: extra.pants ?? (dress ? tunic : "#3a5a88"),
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
    Flint: `Mira used to bring me even rocks. Now she counts leaves. The anvil misses her.`,
    Bramble: `Mira used to taste the rows. Now she lives in that tree. The dirt misses her.`,
    Fern: `Mira has not read the board in days. She is in the apples. The notices miss her.`,
    Finn: `Mira used to sit on the dock. Now she sits in leaves. The pond misses her.`,
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
    Flint: `${horse} has good iron in her shoes. I can hear it.`,
    Bramble: `${horse} will pack the rows if you let her. I like her anyway.`,
    Fern: `${horse} cannot read. I will read the board for her.`,
    Finn: `${horse} will not fit on the dock. She can drink from the pond.`,
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
    Flint: `I hid behind the anvil. You did the work. Thank you.`,
    Bramble: `I left my rows. You kept them. Thank you.`,
    Fern: `I pinned a notice and ran. You stayed. Thank you.`,
    Finn: `I hid under the dock. You did not. Thank you.`,
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
      {
        speaker: "Mira",
        text: `${name}. The Oak still counts. So do the apples.`,
        picks: [
          {
            label: "I'll wait.",
            say: [
              { speaker: "Mira", text: "Good. The ladder is busy with me. I will come down when the last apple says so." },
              { speaker: "Mira", text: "Take one now if you like. Hearts like apples." },
            ],
          },
          {
            label: "Come down?",
            say: [
              { speaker: "Mira", text: "I will. After this branch. After this count. After you blink." },
              { speaker: "Mira", text: "Here. An apple so you do not stand there empty-handed." },
            ],
          },
          {
            label: "Can I have an apple?",
            say: [
              { speaker: "Mira", text: "Yes. Catch. If you miss, the grass eats it and I pretend I did not see." },
            ],
          },
        ],
      },
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
      {
        speaker: "Tallow",
        text: `${name}!! Hide and seek!! I hide three times. You find me!!`,
        picks: [
          {
            label: "I'll find you!",
            say: [
              { speaker: "Tallow", text: "NO PEEKING!! I am going to be so hidden you will think I am a bush!!" },
              { speaker: "Tallow", text: "Ash trains by the horse!! He has a real sword. He said I am too small. I am NOT too small!!" },
            ],
          },
          {
            label: "I'm too busy.",
            say: [
              { speaker: "Tallow", text: "Busy is a grown-up word. Fine. I will hide anyway. If you trip on me that still counts." },
            ],
          },
          {
            label: "Hide where?",
            say: [
              { speaker: "Tallow", text: "I cannot TELL you. That is the whole game. Maybe a barrel. Maybe not. I am a genius." },
            ],
          },
        ],
      },
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
          { speaker: "Nora", text: "D, A, F, S, D, G, D, A. A little rise, then it sits. That’s Loaf’s Rest." },
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
    lines: ({ name, quests, coins }) => {
      const tonic = quests?.tonic ?? 0;
      if (tonic >= 2) {
        return [
          { speaker: "Nana", text: `You still have a sip, ${name}. Drink it from your pack when the hearts look thin.` },
          { speaker: "Nana", text: "Ten rupees when the bottle is empty. I boil it again." },
        ];
      }
      if (tonic === 1) {
        if ((coins ?? 0) >= 10) {
          return [
            { speaker: "Nana", text: `Empty already, ${name}. Ten rupees. I fill it.` },
            { speaker: "Nana", text: "Hearts come all the way back. That is the special thing." },
          ];
        }
        return [
          { speaker: "Nana", text: `The bottle is empty, ${name}. Come back with ten rupees.` },
          { speaker: "Nana", text: "I do not boil it for free twice." },
        ];
      }
      return [
        {
          speaker: "Nana",
          text: `Come in when you like, ${name}. I boiled something special.`,
          picks: [
            {
              label: "Thank you.",
              say: [
                { speaker: "Nana", text: "A long drink. Hearts come all the way back. The first bottle is yours." },
                { speaker: "Nana", text: "Ten rupees when it’s empty. I boil it again." },
              ],
            },
            {
              label: "What does it do?",
              say: [
                { speaker: "Nana", text: "Every heart fills. Not a sip. All of them. That is the special thing." },
                { speaker: "Nana", text: "The first bottle is yours. Ten rupees when it’s empty." },
              ],
            },
            {
              label: "I'll save it.",
              say: [
                { speaker: "Nana", text: "Good. Heroes who save a drink live longer. Drink it from your pack when the hearts look thin." },
              ],
            },
          ],
        },
      ];
    },
  },
  {
    id: "gran",
    name: "Gran",
    world: "meadow",
    x: TREE_HOME.x + 3.25,
    z: TREE_HOME.z - 2.55,
    facing: 2.6,
    indoor: "yours",
    look: L("#6a4a48", "#c9a227", { hair: "#d0c8bc", kit: "cloak", hairStyle: "greybun", stoop: 0.1, shirt: "#efe6d4" }),
    lines: ({ name, quests, hasHorse, gems, hour }) => {
      if (live.homecoming) {
        live.homecoming = false;
        return [
          { speaker: "Gran", text: `There you are, ${name}. I kept the soup. I kept the lamp. I kept pretending I was not counting the road.` },
          { speaker: "Gran", text: "Sit. Then go again if you want. Coming back is the brave part." },
        ];
      }
      if (live.smashed.blanket) {
        return [
          { speaker: "Gran", text: `The blanket was enough, ${name}. I heard you. I did not have to look.` },
          { speaker: "Gran", text: "Old people pretend to sleep so children can be kind." },
        ];
      }
      if (live.smashed.pondkid) {
        return [
          { speaker: "Gran", text: `I heard. You pulled someone out of the pond, ${name}.` },
          { speaker: "Gran", text: "That is the job. Not the lizard. The pond. The person. Then soup." },
        ];
      }
      if (live.smashed.memorial || live.smashed.memflower) {
        return [
          { speaker: "Gran", text: `Oat liked the mill. Reed liked names. They went in a box anyway.` },
          { speaker: "Gran", text: "We still say them. That is how a vale keeps people." },
        ];
      }
      if ((hour ?? 12) >= 20 || (hour ?? 12) < 5) {
        return [
          { speaker: "Gran", text: `The lamp is on, ${name}. I leave it on so the tree is a star.` },
          { speaker: "Gran", text: "Bram is brave about watching. Sela is quiet about being scared. I am both. Come home when the vale is too big." },
        ];
      }
      if (live.rainT > 0.2) {
        return [
          { speaker: "Gran", text: `Rain, ${name}. The vale is washing its face. Sit until it is done.` },
          { speaker: "Gran", text: "Wet heroes still get soup." },
        ];
      }
      if (hasHorse) {
        return [
          { speaker: "Gran", text: `That horse ate two pears, ${name}. I am choosing to find it funny.` },
          { speaker: "Gran", text: "Ride far. Come back. That is the whole job." },
        ];
      }
      if (gems?.emerald || gems?.ruby || gems?.sapphire) {
        return [
          { speaker: "Gran", text: `You brought light home, ${name}. I saw it on the shelf. It does not fix the hissing. It helps me sleep anyway.` },
          { speaker: "Gran", text: "The vale is still loud. Soup is still soup. You are still you." },
        ];
      }
      if ((quests?.granTalk ?? 0) >= 1) {
        return [
          { speaker: "Gran", text: `Come home when the vale is too big, ${name}. The kettle is on.` },
          { speaker: "Gran", text: "Bram will try to follow. Sela will try to pack a rock. I will try to pretend I am not watching the road." },
        ];
      }
      return [
        {
          speaker: "Gran",
          text: `There you are, ${name}. Eat. Then go. The vale is loud tonight.`,
          picks: [
            {
              label: "I'll eat first.",
              say: [
                { speaker: "Gran", text: "Good. Soup first. Heroes who skip soup get thin." },
                { speaker: "Gran", text: "I heard hissing under the castle. Do not go in a box if a lizard asks you to. Come back for soup." },
              ],
            },
            {
              label: "I'll go now.",
              say: [
                { speaker: "Gran", text: "Then take a heel of bread. And come back before the lamp goes out." },
                { speaker: "Gran", text: "Bram will try to follow. Sela will try to pack a rock. I will try to pretend I am not watching the road." },
              ],
            },
            {
              label: "What hissing?",
              say: [
                { speaker: "Gran", text: "Under the castle. It is a lizard with opinions. You have a stick and a head. Use the head first." },
                { speaker: "Gran", text: "Do not go in a box if it asks you to. Come back for soup." },
              ],
            },
          ],
        },
      ];
    },
  },
  {
    id: "bram",
    name: "Bram",
    world: "meadow",
    x: TREE_HOME.x - 3.55,
    z: TREE_HOME.z + 0.45,
    facing: 0.4,
    indoor: "yours",
    kid: true,
    look: L("#3a5a88", "#c9a227", { hair: "#5c3a22", pants: "#3a5a88", shirt: "#a83838", kit: "vest", eyeShape: "round" }),
    lines: ({ name, hasHorse }) => {
      if (live.night) {
        return [
          { speaker: "Bram", text: `${name}. I am not scared. I am just sitting this close to Gran for no reason.` },
          { speaker: "Bram", text: "If a fang comes I will throw a sock. I put one on the branch. In case." },
        ];
      }
      if (live.smashed.findbram) {
        return [
          { speaker: "Bram", text: `You found me, ${name}. I was bark. I was very good bark.` },
          { speaker: "Bram", text: "Next time I will hide in the cellar. There is a cough down there. I am not going first." },
        ];
      }
      if (hasHorse) {
        return [
          { speaker: "Bram", text: `${name}!! The horse!! Put me on it!! I will hold the stick and look scary!!` },
          { speaker: "Bram", text: "If you leave without me I will still watch from the branch. I am very brave about watching." },
        ];
      }
      return [
        {
          speaker: "Bram",
          text: `${name}!! Take me!! I can carry the stick!! I practiced on Gran’s chair!!`,
          picks: [
            {
              label: "You can come.",
              say: [
                { speaker: "Bram", text: "YES. I will put on two socks. One for wearing. One for throwing at fangs." },
                { speaker: "Bram", text: "Gran says no. I am coming in my head. That still counts." },
              ],
            },
            {
              label: "Watch the tree.",
              say: [
                { speaker: "Bram", text: "Fine. I will watch from the branch. If a fang comes I will throw a sock." },
                { speaker: "Bram", text: "I am very brave about watching." },
              ],
            },
            {
              label: "Throw the sock.",
              say: [
                { speaker: "Bram", text: "I already put one on the branch. In case. It is my best sock. The fang should be scared." },
              ],
            },
          ],
        },
      ];
    },
  },
  {
    id: "sela",
    name: "Sela",
    world: "meadow",
    x: TREE_HOME.x + 3.45,
    z: TREE_HOME.z + 1.85,
    facing: 3.4,
    indoor: "yours",
    kid: true,
    look: L("#8a3a58", "#c9a227", {
      hair: "#4a3220",
      pants: "#8a3a58",
      shirt: "#efe6d4",
      kit: "dress",
      longHair: true,
      lashes: "long",
      eyeShape: "round",
      prop: "flowers",
    }),
    lines: ({ name }) => {
      if (live.night) {
        return [
          { speaker: "Sela", text: `The hissing is far, ${name}. I counted. Far is still a kind of close.` },
          { speaker: "Sela", text: "If you get lost, look for our tree. The lamp will be on. I will be the one who is not asleep." },
        ];
      }
      if (live.smashed.selaflower) {
        return [
          { speaker: "Sela", text: `Two flowers now, ${name}. One smooshed. One from you. The cup is full.` },
          { speaker: "Sela", text: "I will not pack a rock. I will pack the cup. Gran said no." },
        ];
      }
      if (live.smashed.givesela) {
        return [
          { speaker: "Sela", text: `I still have what you gave me, ${name}. It is in the box under my bed.` },
          { speaker: "Sela", text: "If you get lost, look for our tree. The lamp will be on." },
        ];
      }
      return [
        {
          speaker: "Sela",
          text: `I made you a flower, ${name}. It is a bit smooshed. It still counts.`,
          picks: [
            {
              label: "It's pretty.",
              say: [
                { speaker: "Sela", text: "I know. I picked the least smooshed one. The cup on the bench is for it if you get tired of holding it." },
                { speaker: "Sela", text: "If you get lost, look for our tree. The house is on the long arm. We will have the lamp on." },
              ],
            },
            {
              label: "I'll keep it safe.",
              say: [
                { speaker: "Sela", text: "Put it in a pocket that does not have rocks. Rocks win. Flowers lose. I have tested this." },
                { speaker: "Sela", text: "If you get lost, look for our tree. The lamp will be on. I will be the one who is not asleep." },
              ],
            },
            {
              label: "I'll look for the lamp.",
              say: [
                { speaker: "Sela", text: "Good. The house is on the long arm. Far is still a kind of close if the lamp is on." },
              ],
            },
          ],
        },
      ];
    },
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
    look: L("#6a4a28", "#c9a227", { hair: "#4a3220", shirt: "#6a4a28", kit: "overalls", hat: "beret", prop: "pitchfork" }),
    lines: ({ name, quests }) => {
      if ((quests?.ash ?? 0) >= 5) {
        return [{ speaker: "Holt", text: `${name}. You and Ash dropped that west brute. The rows heard the swing.` }];
      }
      return [
        { speaker: "Holt", text: `${name}. Crates of four. Always four. Cobb knows. Cobb pretends not to.` },
        { speaker: "Holt", text: "A sealed crag sits a long walk east of the mill. Only a loud ball cracks it. Tess plays skip for those." },
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
      { speaker: "Wren", text: "Three jewels hide in holes in this meadow. Stand in a hole and the map remembers." },
    ],
  },
  {
    id: "oak1",
    name: "Cole",
    world: "meadow",
    x: -4,
    z: -64,
    facing: 2.1,
    look: L("#4a5a38", "#c9a227", { hair: "#6a4228", shirt: "#6a6a68", kit: "vest" }),
    lines: ({ name }) => [
      { speaker: "Cole", text: `Oakstead is small, ${name}. I like it that way.` },
      { speaker: "Cole", text: "East of the keep road a dark mouth sits in the hill. People say a jewel waits at the back. I never went." },
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
    lines: ({ name, quests }) => {
      if ((quests?.tessSkip ?? 0) >= 2) {
        return [
          { speaker: "Tess", text: `Play skip again, ${name}!! Hit the green three times!! I pay rupees!!` },
          { speaker: "Tess", text: "The loud balls were a prize. Brin will race you to the well if you are bored." },
        ];
      }
      return [
        { speaker: "Tess", text: `Play skip with me, ${name}!! Tap when the pebble is in the green!!` },
        { speaker: "Tess", text: "Three greens. I’ll give you something loud. Something that cracks rocks." },
      ];
    },
  },
  {
    id: "oak3",
    name: "Brin",
    world: "meadow",
    x: -24,
    z: -88,
    facing: 0.3,
    kid: true,
    look: L("#5a3a22", "#c9a227", { hair: "#2a2018", hairStyle: "curly", pants: "#3a5a88", shirt: "#2a2824", kit: "vest" }),
    lines: ({ name }) => [
      { speaker: "Brin", text: `${name}. Tess says the top bunk is hers. I counted. She is right. I hate it.` },
      { speaker: "Brin", text: "Race me to the well!! Twelve counts. If you beat it I pay you." },
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
      { speaker: "Nell", text: live.night ? "Oat should have been at the mill. Reed should have been counting wood. The stone has their names now." : "If the mill is quiet, sit. If a name is missing, say it." },
    ],
  },
  {
    id: "oak6",
    name: "Reed",
    world: "meadow",
    x: 22,
    z: -90,
    facing: 4.0,
    look: L("#4a5a38", "#c9a227", { hair: "#3a3228", beard: true, hat: "green", shirt: "#6a6a68", kit: "vest", prop: "net" }),
    lines: ({ name, quests }) => {
      if ((quests?.ash ?? 0) >= 4) {
        return [{ speaker: "Reed", text: `${name}. Ash walks at your shoulder now. That’s a rare count.` }];
      }
      return [{ speaker: "Reed", text: `Wood for the fire. Grain for the mill. Names for the Oak, ${name}.` }, { speaker: "Reed", text: "A long walk south. A wet hole sits by the wild pond. I would not go without a blade." }];
    },
  },
  {
    id: "ash",
    name: "Ash",
    world: "meadow",
    x: 22,
    z: -86,
    facing: -0.6,
    look: L("#5a3a22", "#c9a227", {
      hair: "#3a2418",
      pants: "#3a5a88",
      boots: "#5a3a22",
      shirt: "#a83838",
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
        {
          speaker: "Ash",
          text: `${name}. Ash. This hall is mine. I teach anyone who can count a swing.`,
          picks: [
            {
              label: "Teach me.",
              say: [
                { speaker: "Ash", text: "Come in. I’ll give you a sword and show you how V hits." },
                { speaker: "Ash", text: "Hit V for a slash. Hold V for a spin. If you mess up, I’ll say so." },
              ],
            },
            {
              label: "Where’s the sword?",
              say: [
                { speaker: "Ash", text: "Inside. On the wall. Don’t swing it at the rafters. Then the real test." },
              ],
            },
            {
              label: "Maybe later.",
              say: [
                { speaker: "Ash", text: "Later is a door that never opens. Come when you mean it." },
              ],
            },
          ],
        },
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
      {
        speaker: "Dusk",
        text: `${name}. I think I just heard something.`,
        picks: [
          {
            label: "I'll keep the lantern.",
            say: [
              { speaker: "Dusk", text: "Good. Don’t walk the dark lane alone. The something likes people who do." },
            ],
          },
          {
            label: "What did you hear?",
            say: [
              { speaker: "Dusk", text: "A step that was not a foot. Or a foot that was not a person. I am choosing lanterns either way." },
              { speaker: "Dusk", text: "Keep yours high. Don’t walk the dark lane alone." },
            ],
          },
          {
            label: "I'll walk with you.",
            say: [
              { speaker: "Dusk", text: "Then we are two lanterns. That is almost a plan. Stay on the path." },
            ],
          },
        ],
      },
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
          { speaker: "Miller", text: "A D S D, then F G D A. It turns like the wheel. Miller’s Wheel." },
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
    look: L("#4a5a38", "#c9a227", { hair: "#3a2820", beard: true, hat: "green", shirt: "#a83838", kit: "vest", prop: "net" }),
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
    look: L("#6a4a28", "#c9a227", { hair: "#c8c0b4", hat: "beret", mustache: true, kit: "overalls", shirt: "#6a4a28" }),
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
      { speaker: "Lila", text: "The house west of me is boarded. A lamp still burns. I do not knock." },
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
    look: L("#5a3a22", "#c9a227", { hair: "#1a1410", shirt: "#2a2824", kit: "vest" }),
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
          return [{ speaker: "Hal", text: `S D F G, then D S A S. She will come to you, ${name}.` }];
        }
        return [
          { speaker: "Hal", text: `${name}. That horse west of the first blade knows a count.` },
          { speaker: "Hal", text: "S D F G, then D S A S. Play it. She comes running." },
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
    x: WELL_AT.x,
    z: WELL_AT.z,
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
  {
    id: "flint",
    name: "Flint",
    world: "meadow",
    x: 40.6,
    z: -45.6,
    facing: 3.4,
    stay: true,
    look: L("#4a4a48", "#c9a227", { hair: "#2a2018", beard: true, kit: "overalls", shirt: "#6a4a28", prop: "hammer", hat: "beret", pants: "#3a3228" }),
    lines: ({ name, rocks, quests, hour }) => {
      const q = quests?.["flint-ore"] ?? 0;
      const night = (hour ?? 12) >= 20 || (hour ?? 12) < 6;
      if (q >= 2) {
        if ((rocks ?? 0) >= 5) {
          return [
            { speaker: "Flint", text: `Five more, ${name}. The crater still coughs them up.` },
            { speaker: "Flint", text: "Keep bringing them. The anvil does not get tired of even numbers." },
          ];
        }
        return [
          { speaker: "Flint", text: night
            ? `${name}. The forge is banked. Come at day with rocks.`
            : `${name}. Five rocks when you have them. The crater east still coughs good ones.` },
          { speaker: "Flint", text: "A sealed crag sits a long walk east. Tess’s loud balls crack it. I want what falls out." },
        ];
      }
      if (q >= 1 && (rocks ?? 0) >= 5) {
        return [
          { speaker: "Flint", text: `Five. Good, ${name}. The anvil remembers even numbers.` },
          { speaker: "Flint", text: "A purse for the walk. Bring more when the crater coughs." },
        ];
      }
      if (q >= 1) {
        return [
          { speaker: "Flint", text: `Still short, ${name}. Five rocks. The path east of the mill, then farther.` },
          { speaker: "Flint", text: night ? "I bank the fire at night. The rocks can wait till morning." : "I count while I hammer. Do not interrupt the count." },
        ];
      }
      return [
        {
          speaker: "Flint",
          text: night
            ? `${name}. Forge is banked. In the morning I buy rocks.`
            : `${name}. Five rocks and I pay. The crater east coughs them up.`,
          picks: [
            {
              label: "What rocks?",
              say: [
                { speaker: "Flint", text: "The grey ones. Not cobbles. The crater spits them when it is angry." },
                { speaker: "Flint", text: "Five makes a purse. I keep buying if you keep walking." },
              ],
            },
            {
              label: "I'll find them.",
              say: [
                { speaker: "Flint", text: "East of the mill. Then farther. A sealed crag. Come back with five." },
                { speaker: "Flint", text: "If you hear the mountain tick, that is the ore remembering it was a mountain." },
              ],
            },
            {
              label: "Why you?",
              say: [
                { speaker: "Flint", text: "Someone has to hit things until they are useful. I am that someone." },
                { speaker: "Flint", text: "Ash has a blade. I have a hammer. Oakstead needs both." },
              ],
            },
          ],
        },
      ];
    },
  },
  {
    id: "bramble",
    name: "Bramble",
    world: "meadow",
    x: 54.2,
    z: -96.4,
    facing: 3.6,
    stay: true,
    look: L("#6a4a28", "#c9a227", { hair: "#4a3220", kit: "overalls", hat: "beret", prop: "pitchfork", shirt: "#efe6d4", kerchief: "#3a5a38" }),
    lines: ({ name, quests, hour }) => {
      const q = quests?.["bramble-crow"] ?? 0;
      const night = (hour ?? 12) >= 20 || (hour ?? 12) < 6;
      if (q >= 2) {
        return [
          { speaker: "Bramble", text: night
            ? `${name}. Chickens are in. Foxes are not. I sleep with a stick.`
            : `${name}. The rows are quieter. The crows went to bother someone else.` },
          { speaker: "Bramble", text: "Foxes have been walking the north hill at dusk. If you go, take a blade. They are not shy." },
        ];
      }
      if (q >= 1) {
        return [
          { speaker: "Bramble", text: `You hit my scarecrow, ${name}. The crows left. That is a day’s work.` },
          { speaker: "Bramble", text: "A purse. Come back if they return. They always return." },
        ];
      }
      return [
        {
          speaker: "Bramble",
          text: night
            ? `${name}. Crows sleep. I do not. Something on the north hill has been counting my hens.`
            : `${name}. Crows sit on my man of straw. A swing would teach them.`,
          picks: [
            {
              label: "I'll swing.",
              say: [
                { speaker: "Bramble", text: "The scarecrow is in the east rows. Hit it like you mean it. Not the pig." },
                { speaker: "Bramble", text: "If the crows go, I pay. If they stay, I still pay, but I will be rude about it." },
              ],
            },
            {
              label: "What's wrong?",
              say: [
                { speaker: "Bramble", text: "Crows. Foxes on the north hill. A shuttered house that still has a lamp." },
                { speaker: "Bramble", text: "Oakstead is small. The problems are not." },
              ],
            },
            {
              label: "Nice rows.",
              say: [
                { speaker: "Bramble", text: "They are. Cobb inspects them after dark. I pretend not to notice. The dirt notices." },
              ],
            },
          ],
        },
      ];
    },
  },
  {
    id: "fern",
    name: "Fern",
    world: "meadow",
    x: 4.75,
    z: -102.8,
    facing: 3.5,
    stay: true,
    worldAt: true,
    look: L("#3a4a68", "#c9a227", { hair: "#6a3a22", glasses: true, kit: "scholar", shirt: "#efe6d4", prop: "scroll", longHair: true }),
    lines: ({ name, hour, quests }) => {
      const h = hour ?? 12;
      const night = h >= 20 || h < 6;
      const rumor =
        night
          ? "The mill turns after dark even when Miller is in bed. I have counted it."
          : h < 12
            ? "Someone still lives in the shuttered house west of the inn. A lamp. No door."
            : h < 17
              ? "Three jewels hide in holes in this meadow. Stand in a hole and the map remembers."
              : "Foxes on the north hill. A sealed crag east. The castle north if you like stone.";
      return [
        { speaker: "Fern", text: `${name}. I pin what Oakstead whispers. Today: ${rumor}` },
        { speaker: "Fern", text: (quests?.["flint-ore"] ?? 0) < 1
          ? "Flint at the forge buys rocks. Bramble’s crows are a public nuisance. I put both on the board."
          : "If you find a jewel, the keep road is north. Hal will not smile about it." },
      ];
    },
  },
  {
    id: "finn",
    name: "Finn",
    world: "meadow",
    x: POND.x + 2.4,
    z: POND.z + 1.15,
    facing: 2.2,
    stay: true,
    look: L("#3a5a88", "#c9a227", { hair: "#3a2820", kit: "vest", shirt: "#efe6d4", prop: "net", hat: "green" }),
    lines: ({ name, hour }) => {
      const night = (hour ?? 12) >= 20 || (hour ?? 12) < 6;
      if (night) {
        return [
          { speaker: "Finn", text: `${name}. Fish sleep. I sit anyway. The dock is honest at night.` },
          { speaker: "Finn", text: "A wet hole sits south by the wild pond. I would not go without a blade. I went once. I left." },
        ];
      }
      return [
        { speaker: "Finn", text: `${name}. The creek runs from this pond toward the mill. Do not drink the mill end.` },
        { speaker: "Finn", text: "Pax buys fish at the gate. I catch them. The ducks steal them. That is the whole job." },
      ];
    },
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
    n.id === "ash" || n.worldAt
      ? n
      : n.world === "meadow" && inOldVillage(n.x, n.z)
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
  rook: "The castle sits north of Oakstead, up the long green hill.",
  ash: "Ash trains east of the square, by the sheep fence.",
  flint: "Flint at the forge buys rocks the crater coughs up.",
  bramble: "Bramble’s scarecrow is losing to crows. A swing would help.",
  fern: "Fern pins Oakstead’s whispers to the board by the fire.",
  finn: "Finn sits the pond dock and sells the catch to Pax.",
  cairn: "Crownward keeps the count. The sash is cream and gold.",
  holm: "The capital sits in front of the keep. Oakstead is the village that feeds it.",
};

export function heardTales(met: string[]): string[] {
  return met.map((id) => TALES[id]).filter((t): t is string => Boolean(t));
}
