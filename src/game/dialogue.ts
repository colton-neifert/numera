import type { WorldId } from "./types";
import type { HumanLook } from "./world3d/actors";
import { live, gameClock } from "./world3d/live";
import { inVillage } from "./world3d/village";
import { vWorld, WELL_AT, TREE_HOME, POND, RIDE_AT } from "./world3d/field";
import { hushLogCleared, seenCave, seenHush, seenVeil } from "./world3d/hidden";
import { quietKept } from "./world3d/quietFlag";
import { useGame } from "./store";
import { weaveLife } from "./chronicle";
import { sfx } from "./audio";

export type TalkPick = { label: string; say: TalkLine[]; act?: string };
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
              { speaker: "Tallow", text: "The basket is by the west drain. That is hiding. Nora says it is losing. She is wrong." },
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
    lines: ({ name, hasOcarina, songs, quests }) => {
      const q = quests?.["nora-basket"] ?? 0;
      if (q >= 2) {
        const lines: TalkLine[] = [
          { speaker: "Nora", text: `${name}. You brought the basket. I remember who walks my errands.` },
          { speaker: "Nora", text: "Reed’s log is the same water, toward the trees. It belongs across, not beside. Two banks. One stick." },
        ];
        if (hasOcarina && !(songs ?? []).includes("loaf")) {
          lines.push({ speaker: "Nora", text: "D, A, F, S, D, G, D, A. A little rise, then it sits. That’s Loaf’s Rest." });
        }
        return lines;
      }
      if (q === 1) {
        if (!live.smashed.norathanks) {
          live.smashed.norathanks = true;
          const g = useGame.getState();
          g.setQuest("nora-basket", 2);
          g.healAll();
          sfx.heal();
        }
        return [
          { speaker: "Nora", text: `There it is. Sit. Eat. Your hearts are full, ${name}.` },
          { speaker: "Nora", text: "The brook toward the trees still has Reed’s log in the grass. Walk it until it lies across." },
        ];
      }
      if (hasOcarina && !(songs ?? []).includes("loaf")) {
        return [
          { speaker: "Nora", text: `${name}. A loaf has a song, if you listen while it cools.` },
          { speaker: "Nora", text: "D, A, F, S, D, G, D, A. A little rise, then it sits. That’s Loaf’s Rest." },
          { speaker: "Nora", text: "Tallow left the morning basket by the west drain. Bring it if you see it. I will not send him." },
        ];
      }
      return [
        { speaker: "Nora", text: `${name}. Tallow left the morning basket by the west drain. Bring it if you see it.` },
        { speaker: "Nora", text: "I will not send him. He will turn a basket into a game. Cobb still walks Holt’s rows after dark. I bake. I notice." },
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
    lines: ({ name }) => {
      const lines = [
        { speaker: "Pip", text: `${name}!! This is my house!! Nana’s is the other warm one!!` },
        { speaker: "Pip", text: "The castle is far. Walk north until the stone gets tall." },
      ];
      if (quietKept()) {
        lines.push({
          speaker: "Pip",
          text: "The bell rang and nobody was there!! Nana said wind. Wind does not leave a glove.",
        });
      }
      return lines;
    },
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
          {
            speaker: "Nana",
            text: quietKept()
              ? "Ten rupees when the bottle is empty. And if you found a glove, leave it. He rings once and never stays for supper."
              : "Ten rupees when the bottle is empty. I boil it again.",
          },
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
          ...(quietKept()
            ? [{ speaker: "Nana", text: "If you found a glove, leave it where it was. He will want it next year. He always does." }]
            : []),
        ];
      }
      return [
        ...(quietKept()
          ? [{ speaker: "Nana", text: "If you found a glove, leave it where it was. He will want it next year. He always does." }]
          : []),
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
    lines: ({ name, quests, met }) => {
      const told = (quests?.["arc:family"] ?? 0) >= 1;
      const knows = (met ?? []).includes("hester");
      const lines: TalkLine[] = [
        {
          speaker: "Pell",
          text: told
            ? `${name}. The bowls stay. The heel of the loaf is for the child, not for the road.`
            : `${name}. How many for? Two, four, or six. The long table takes all of Oakstead.`,
        },
      ];
      if (knows && !told) {
        lines.push({
          speaker: "Pell",
          text: "A woman asked the way to a lake that is not on Fern's board. I still have her bowls. I was not sure she was real.",
          picks: [
            {
              label: "She's at the still water.",
              act: "family-tell",
              say: [
                { speaker: "Pell", text: "Then the bowls are not lost. They are waiting, which is a better job." },
                { speaker: "Pell", text: "Tell her the stew is the same. Tell the little one the heel is hers. This is for the walk. It is bread money, not a prize." },
              ],
            },
            {
              label: "Keep the bowls a while.",
              say: [{ speaker: "Pell", text: "I can do that. Shelves are patient. I am almost patient." }],
            },
          ],
        });
      } else {
        lines.push({ speaker: "Pell", text: "Write a friend if you want company. I count plates. Then I count them again." });
      }
      return lines;
    },
  },
  {
    id: "cobb",
    name: "Cobb",
    world: "meadow",
    x: 16,
    z: -102,
    facing: 1.2,
    look: L("#3a4a78", "#c9a227", { hair: "#3a2820", glasses: true, kit: "scholar", shirt: "#efe6d4", prop: "scroll" }),
    lines: ({ name, quests }) => {
      const four = (quests?.["holt-four"] ?? 0) >= 1;
      const done = (quests?.["arc:sack"] ?? 0) >= 3;
      if (four && !done && !live.smashed.cobbfour) {
        live.smashed.cobbfour = true;
        const g = useGame.getState();
        g.setQuest("arc:sack", 3);
        g.addCoins(12);
        sfx.ok();
      }
      if (four || done) {
        return [
          { speaker: "Cobb", text: `${name}. Holt's four is four. I wrote it that way. The row can stop being a worry.` },
          { speaker: "Cobb", text: "Tell him I was not angry. I was counting because counting is how I love a field. Twelve coins for the walk. Don't tell him I was frightened." },
        ];
      }
      return [
        { speaker: "Cobb", text: `${name}. I inspect. That’s all. Carrots grow if you jump. That’s science.` },
        { speaker: "Cobb", text: "Three sacks and a gap. A gap is not a sack. If Holt has four, put four on the pale stone. I will not count air." },
      ];
    },
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
      const four = (quests?.["holt-four"] ?? 0) >= 1;
      if (four) {
        return [
          { speaker: "Holt", text: `${name}. Four sacks. The pale stone is full. Tell Cobb before he invents a fifth.` },
          {
            speaker: "Holt",
            text:
              (quests?.ash ?? 0) >= 5
                ? "You and Ash dropped that west brute. The rows heard the swing."
                : "A sealed crag sits a long walk east of the mill. Only a loud ball cracks it. Tess plays skip for those.",
          },
        ];
      }
      return [
        { speaker: "Holt", text: `${name}. Four sacks. I can see three. The fourth is in the grass west of Bramble's rows.` },
        { speaker: "Holt", text: "Walk it onto the pale stone. Cobb counts a gap as extra. Four is four. Not five." },
        { speaker: "Holt", text: "My grandfather swore a road left the west hill. I walked the grass. There is no road." },
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
      { speaker: "Wren", text: "East of the keep road a dark mouth sits in the hill. Cole never went. Someone with a stick should." },
      { speaker: "Wren", text: "My cousin Ivy says she lives past the west hill. Ivy moved to the low towns. I would have heard." },
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
      { speaker: "Cole", text: "Grandfather drew a road west of the elder oak. I walked where he pointed. Grass. That is all." },
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
      const crossed = Boolean(live.smashed.creeklog);
      const helped = (quests?.["nora-basket"] ?? 0) >= 2;
      if (crossed && helped) {
        return [
          { speaker: "Reed", text: `${name}. Nora’s basket, and my log. Oakstead is counting you.` },
          { speaker: "Reed", text: "The brook is two banks and one stick. You did the count. The mill gets dry wood now." },
        ];
      }
      if (crossed) {
        return [
          { speaker: "Reed", text: `${name}. The log is across. I can get wood to the mill without soaking the grain.` },
          { speaker: "Reed", text: "Eight coins on the stick. That was the fare. I do not charge twice." },
        ];
      }
      if ((quests?.ash ?? 0) >= 4) {
        return [
          { speaker: "Reed", text: `${name}. Ash walks at your shoulder now. That’s a rare count.` },
          { speaker: "Reed", text: "My crossing still lies in the grass by the trees. Walk it across the brook when you have a moment." },
        ];
      }
      return [
        { speaker: "Reed", text: `Wood for the fire. Grain for the mill. Names for the Oak, ${name}.` },
        { speaker: "Reed", text: "My crossing rolled off the brook by the trees. It wants to lie across, not beside. Walk into it until it sits." },
        { speaker: "Reed", text: "A long walk south. A wet hole sits by the wild pond. I would not go without a blade." },
      ];
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
        return [{ speaker: "Miller", text: (quests?.["mill-board"] ?? 0) >= 1
          ? `${name}. The wheel still turns. That purse was mine. Keep it.`
          : `${name}. The wheel still turns. Your stacks sit by the door. My purse is still under the last board behind the mill.` }];
      }
      if ((quests?.["mill-wood"] ?? 0) >= 1) {
        if ((wood ?? 0) >= 5) {
          return [{ speaker: "Miller", text: `Five stacks. Good, ${name}. Look in the grain bin if you have not.` }];
        }
        return [{ speaker: "Miller", text: `Still short, ${name}. Five stacks of wood.` }];
      }
      return [
        { speaker: "Miller", text: (quests?.["inn-four"] ?? 0) >= 1
          ? `${name}. Four knocks. My cousin sleeps quieter. Five stacks of wood and the wheel remembers you.`
          : `${name}. Five stacks of wood and the wheel remembers you.` },
        { speaker: "Miller", text: "Chop a tree three times, then chop the fallen log." },
        { speaker: "Miller", text: (quests?.["mill-board"] ?? 0) >= 1
          ? "You found the purse. I stopped counting it years ago."
          : "I lost a purse behind the mill. The boards look the same. It is under the last one." },
        { speaker: "Miller", text: (quests?.["inn-four"] ?? 0) >= 1
          ? "You found the door Lila will not rent. Tell Mae the hall is quieter."
          : "The desk rents one, three, and five. His door is the count they skip. Mae is on the top floor." },
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
      {
        speaker: "Pax",
        text:
          (useGame.getState().quests?.["finn-tally"] ?? 0) >= 2
            ? "Finn's board is back. A fish is eight. Two is sixteen. Three is twenty-four. Do the sum before you sell, so the wallet has room."
            : "Finn counts his catch in threes. The ducks have his board. Until it comes back I still pay eight a fish. I just frown more.",
      },
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
    lines: ({ name, quests }) => [
      { speaker: "Lila", text: `${name}. Rooms upstairs. Stairs twice. Don’t wake Mae.` },
      { speaker: "Lila", text: (quests?.["manor-even"] ?? 0) >= 1
        ? "You knocked even. She answered. I still will not knock. Two, four, six. That is the whole of her."
        : "The house west of me is boarded. A lamp still burns. The back shutter answers even knocks. Two. Four. Six. I do not knock." },
    ],
  },
  {
    id: "gil",
    name: "Gil",
    world: "meadow",
    x: -33.3,
    z: -126.3,
    facing: 2.2,
    indoor: "inn",
    look: L("#5a3a22", "#c9a227", { hair: "#1a1410", shirt: "#2a2824", kit: "vest" }),
    lines: ({ name, quests }) => [
      { speaker: "Gil", text: (quests?.["inn-four"] ?? 0) >= 1
        ? `${name}. Quieter up there. I can sweep without counting snores.`
        : `This landing is mine, ${name}. Five doors above. The board skips a count. That door snores.` },
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
    lines: ({ name, quests }) => [
      { speaker: "Mae", text: `${name}. I like the hall. The stairs turn twice.` },
      { speaker: "Mae", text: (quests?.["inn-four"] ?? 0) >= 1
        ? "You knocked four. He stopped snoring. I can hear the clock again."
        : "The desk rents one, three, and five. Room four is the count they skip. Knock that many. I counted his snores." },
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
    lines: ({ name, quests }) => {
      const quiet = (quests?.["inn-four"] ?? 0) >= 1;
      const hour = (quests?.["lark-hour"] ?? 0) >= 1;
      if (hour) {
        return [{ speaker: "Lark", text: `${name}. Four. The clock agrees with the door now. Oakstead can be honest.` }];
      }
      return [
        { speaker: "Lark", text: `${name}. The inn clock keeps Oakstead honest. I keep the clock.` },
        { speaker: "Lark", text: quiet
          ? "You quieted room four. Stand under the clock and swing once for each hour. Stop when it shows that count."
          : "It wants the hour the desk will not sell. Mae counted snores upstairs. Then come swing the clock." },
      ];
    },
  },
  {
    id: "wren",
    name: "Wren",
    world: "meadow",
    ...vWorld(-6, -92),
    facing: 0.2,
    stay: true,
    look: L("#6a5030", "#c9a227", { hair: "#3a2418", mouth: "line", shirt: "#efe6d4" }),
    lines: ({ quests }) =>
      (quests?.years ?? 0) >= 3
        ? [{ speaker: "Wren", text: "That house past the south rise has a light now. It did not, before." }]
        : [{ speaker: "Wren", text: "There's an old house past the south rise. Empty since I was small." }],
  },
  {
    id: "odd",
    name: "Odd",
    world: "meadow",
    ...vWorld(8, -94),
    facing: -0.4,
    stay: true,
    look: L("#4a5a48", "#c9a227", { hair: "#c8c0b4", kit: "cloak", stoop: 0.06 }),
    lines: ({ quests }) =>
      (quests?.years ?? 0) >= 3
        ? [{ speaker: "Odd", text: "People walk wide of grandfather's house. Something answers if you stand in the door." }]
        : [{ speaker: "Odd", text: "My grandfather lived past the south rise. He left the door unlatched." }],
  },
  {
    id: "nell",
    name: "Nell",
    world: "meadow",
    ...vWorld(2, -86),
    facing: 1.1,
    stay: true,
    look: L("#8a4058", "#c9a227", { hair: "#6a3a22", longHair: true, mouth: "smile", shirt: "#efe6d4" }),
    lines: ({ quests }) =>
      (quests?.years ?? 0) >= 3
        ? [{ speaker: "Nell", text: "I don't look at that upstairs window anymore." }]
        : [{ speaker: "Nell", text: "I saw someone in the upstairs window. Or I thought I did." }],
  },
  {
    id: "brant",
    name: "Brant",
    world: "meadow",
    ...vWorld(-12, -88),
    facing: 0.6,
    stay: true,
    look: L("#3a4a68", "#c9a227", { hair: "#2a2018", mouth: "frown", shirt: "#d8d0c4" }),
    lines: ({ quests }) =>
      (quests?.years ?? 0) >= 3
        ? [{ speaker: "Brant", text: "Still a shed. If there's a lantern, it's a traveler. Don't make a ghost of it." }]
        : [{ speaker: "Brant", text: "Don't believe them. It's a shed with a story. Nobody stands in that window." }],
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
          return [
            { speaker: "Hal", text: "Her name is Bramble. She was mine before she was yours." },
            { speaker: "Hal", text: `S D F G, then D S A S. She still comes when you play it, ${name}.` },
          ];
        }
        return [
          { speaker: "Hal", text: `${name}. The bay mare west of the blade is Bramble.` },
          { speaker: "Hal", text: "I taught her one song. S D F G, then D S A S." },
          { speaker: "Hal", text: "Play it in the open. She will not come into a house." },
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
    lines: ({ quests }) => [
      { speaker: "Stone", text: "The Goddess of Measure left three stones in the earth." },
      { speaker: "Stone", text: (quests?.["mill-board"] ?? 0) >= 1
        ? "The purse found a hand. This stone can stop repeating it."
        : "Behind the mill, under the last board, a purse forgot its owner." },
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
            ? `${name}. Crows sleep. I do not. Something on the north hill has been counting my hens. And Holt's fourth sack is still in the grass.`
            : `${name}. Crows sit on my man of straw. A swing would teach them. The pale stone in the rows is short one sack.`,
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
        { speaker: "Fern", text: (useGame.getState().defeated.meadow ?? []).includes("rook")
          ? "Rook's notice came down. People went back to ovens and rows. I pinned that. It is the best thing on the board."
          : (quests?.["flint-ore"] ?? 0) < 1
          ? "Flint at the forge buys rocks. Bramble’s crows are a public nuisance. I put both on the board."
          : "If you find a jewel, the keep road is north. Hal will not smile about it." },
        { speaker: "Fern", text: "A child says a path dies between two stones west of the elder oak. Bramble says the child lies. I pinned both. I have not walked either." },
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
    lines: ({ name, hour, quests }) => {
      const night = (hour ?? 12) >= 20 || (hour ?? 12) < 6;
      const q = quests?.["finn-tally"] ?? 0;
      if (q >= 2) {
        return [
          { speaker: "Finn", text: `${name}. You brought the board. I remember who wades.` },
          { speaker: "Finn", text: "Pax pays eight a fish. Two is sixteen. Three is twenty-four. Tell him the sum. He will pretend he already knew." },
        ];
      }
      if (q === 1) {
        if (!live.smashed.finntally) {
          live.smashed.finntally = true;
          const g = useGame.getState();
          g.setQuest("finn-tally", 2);
          g.addFish();
          g.addCoins(6);
          sfx.ok();
        }
        return [
          { speaker: "Finn", text: `That's the board. The marks are still in threes. Take a fish, ${name}. And six coins for the wet boots.` },
          { speaker: "Finn", text: "Pax is at his stall. Eight a fish. Two is sixteen. Don't let him round you down to a smile." },
        ];
      }
      if (night) {
        return [
          { speaker: "Finn", text: `${name}. Fish sleep. The ducks do not. They dragged my tally board to the far bank, west side, in the reeds.` },
          { speaker: "Finn", text: "Three marks is one fish. Without the board I am guessing, and Pax does not buy guesses." },
        ];
      }
      return [
        { speaker: "Finn", text: `${name}. The creek runs from this pond toward the mill. Do not drink the mill end.` },
        { speaker: "Finn", text: "The ducks stole my tally board. Far bank, west side, in the reeds. Three marks is a fish. Bring the board and I will pay you like one." },
      ];
    },
  },
  {
    id: "gale",
    name: "Gale",
    world: "meadow",
    worldAt: true,
    stay: true,
    x: RIDE_AT.x + 1.6,
    z: RIDE_AT.z + 0.8,
    facing: -0.4,
    look: L("#3a5a78", "#c9a227", { hair: "#4a3220", kit: "vest", shirt: "#efe6d4", hat: "green", mouth: "smile" }),
    lines: ({ name, coins }) => {
      if (live.balloonRide) {
        return [
          {
            speaker: "Gale",
            text: `${name}. We're up. I have the rope. You have the view.`,
            picks: [
              {
                label: "Land here.",
                act: "landballoon",
                say: [{ speaker: "Gale", text: "Down we go. Hold the rim. I'll tie us off." }],
              },
              {
                label: "Keep flying.",
                say: [{ speaker: "Gale", text: "Then look around. I'll keep the rope. Don't fall out." }],
              },
            ],
          },
        ];
      }
      if (live.balloonTicket) {
        return [{ speaker: "Gale", text: `${name}. You already paid. Walk up to the basket and hit F. I get in with you.` }];
      }
      const poor = (coins ?? 0) < 8;
      return [
        {
          speaker: "Gale",
          text: `${name}. This balloon is mine. Eight rupees, then walk up and hit F. I fly. You look.`,
          picks: [
            {
              label: "Pay eight rupees.",
              act: "payballoon",
              say: [
                {
                  speaker: "Gale",
                  text: poor
                    ? "Eight rupees. Come back when the purse is heavier."
                    : "Paid. Walk up to the basket and hit F. I'll climb in with you.",
                },
              ],
            },
            {
              label: "Not today.",
              say: [{ speaker: "Gale", text: "The rope stays tied. Wave if you change your mind. I'll wave back." }],
            },
          ],
        },
      ];
    },
  },
  {
    id: "ivy",
    name: "Ivy",
    world: "meadow",
    worldAt: true,
    stay: true,
    x: -234,
    z: -346.5,
    facing: 0.5,
    look: L("#4a5a38", "#6a8a48", { hair: "#6a3a22", hairStyle: "bun", shirt: "#efe6d4", kit: "overalls", kerchief: "#3a5a38", longHair: true }),
    lines: ({ name, hour, met }) => {
      const night = (hour ?? 12) >= 20 || (hour ?? 12) < 6;
      const lines: TalkLine[] = [
        { speaker: "Ivy", text: `${name}. Wren thinks I left. I prefer it that way.` },
        {
          speaker: "Ivy",
          text: (met ?? []).includes("forgot-letter")
            ? "You found the letter. She can keep the low-country story. I still set two bowls."
            : "I have not crossed the lake. My brother said the island was a story. He also said the hill was empty.",
        },
      ];
      if (seenCave() && night) lines.push({ speaker: "Ivy", text: "The roots are wet tonight. Something under the ridge is awake. I do not go in." });
      return lines;
    },
  },
  {
    id: "quill",
    name: "Quill",
    world: "meadow",
    worldAt: true,
    stay: true,
    x: -332,
    z: -144.2,
    facing: 2.4,
    look: L("#3a3a48", "#c9a227", { hair: "#c8b090", shirt: "#d9d3c4", kit: "scholar", prop: "scroll" }),
    lines: ({ name, met }) => {
      const readCup = (met ?? []).includes("hush-carving");
      const readBoy = (met ?? []).includes("veyr-scrap");
      const lines: TalkLine[] = [
        { speaker: "Quill", text: `${name}. Ivy thinks I am a story. I think the town is loud.` },
        { speaker: "Quill", text: "They say the hill is empty. From here the castle is only a tooth of stone. I do not go." },
      ];
      if (readCup && readBoy) {
        lines.push({
          speaker: "Quill",
          text: "A cup for the sun. A boy who would not be a remainder. I will not tell you which one built the tower. The tower may not know either. That is allowed.",
        });
      } else if (readCup) {
        lines.push({ speaker: "Quill", text: "You read the cup. Good. Don't finish it. Finished stories get pinned to boards." });
      }
      if (seenCave()) lines.push({ speaker: "Quill", text: "Your boots are wet from underneath. I will not ask where." });
      else if (seenHush()) lines.push({ speaker: "Quill", text: "You found the bowl. Most people stop when the water gets loud." });
      return lines;
    },
  },
  {
    id: "silo",
    name: "Silo",
    world: "meadow",
    worldAt: true,
    stay: true,
    x: -188,
    z: -174,
    facing: 1.2,
    look: L("#4a4038", "#6a5a40", { hair: "#c8c0b4", beard: true, kit: "cloak", stoop: 0.18, elder: true, prop: "stick", mouth: "flat" }),
    lines: ({ name, met }) => [
      { speaker: "Silo", text: `${name}. If the town counted you, walk back up. I am not a number.` },
      {
        speaker: "Silo",
        text: (met ?? []).includes("hush-carving")
          ? "You read the cup. Don't read it to them. They will pin it, and then it will be a quest, and then it will be dead."
          : "The tower measured the sun until the cup cracked. I live in the crack. That is all I will spend.",
      },
    ],
  },
  {
    id: "moss",
    name: "Moss",
    world: "meadow",
    worldAt: true,
    stay: true,
    x: -232,
    z: -254,
    facing: 0.2,
    look: L("#3a4a38", "#2a3828", { hair: "#6a7a62", kit: "cloak", stoop: 0.22, elder: true, mouth: "flat", eyes: "#6a8a58" }),
    lines: ({ name }) => [
      { speaker: "Moss", text: `${name}. Sun is a loud neighbor. I live under it.` },
      {
        speaker: "Moss",
        text: hushLogCleared()
          ? "You cut the log. The dark fits now. I did not ask. I am not sorry."
          : "A log sits across the south mouth. I do not chop. Chopping is a daylight idea.",
      },
    ],
  },
  {
    id: "vetch",
    name: "Vetch",
    world: "meadow",
    worldAt: true,
    x: -22,
    z: -112,
    facing: 0.8,
    look: L("#2a2428", "#6a5a40", { hair: "#1a1412", kit: "cloak", hat: "wide", beard: true, mouth: "frown", prop: "scroll" }),
    lines: ({ name }) => [
      { speaker: "Vetch", text: `${name}. Daytime mouths lie politely. I only unpack after dark.` },
      { speaker: "Vetch", text: "Wren says her cousin left. The cousin says Wren is loud. I sell neither. I repeat them until one of you walks." },
    ],
  },
  {
    id: "hester",
    name: "Hester",
    world: "meadow",
    worldAt: true,
    stay: true,
    x: -328,
    z: -150,
    facing: 0.4,
    look: L("#6a4a58", "#c9a227", { hair: "#3a2418", hairStyle: "bun", longHair: true, kit: "dress", shirt: "#efe6d4", kerchief: "#6a4a38" }),
    lines: ({ name, quests }) => {
      const told = (quests?.["arc:family"] ?? 0) >= 1;
      return [
        {
          speaker: "Hester",
          text: told
            ? `${name}. Pell kept the bowls. That is a whole town, in one pot. We are staying.`
            : `${name}. We came for a season. The lake kept the season. If Oakstead asks, we are visiting. If Pell asks, he still has our bowls.`,
        },
        { speaker: "Hester", text: "Nima is asleep in the grass. Don't wake her for a story. Stories can wait. This place does not do mornings the way town does." },
      ];
    },
  },
  {
    id: "nima",
    name: "Nima",
    world: "meadow",
    worldAt: true,
    stay: true,
    kid: true,
    x: -334,
    z: -151.2,
    facing: 1.1,
    look: L("#c47a4a", "#c9a227", { hair: "#3a2418", kit: "pinafore", shirt: "#efe6d4", longHair: true, eyeShape: "round", prop: "bread" }),
    lines: ({ name, quests }) => [
      {
        speaker: "Nima",
        text: (quests?.["arc:family"] ?? 0) >= 1
          ? `${name}!! Tell Pell I want the heel. The bread one. Not the walking one.`
          : "Mama said not to ring bells. I don't have a bell. I have a stone that looks like a bun.",
      },
      { speaker: "Nima", text: "Pell gives heels. Mama says heels are for walking and for bread. I like the bread kind." },
    ],
  },
  {
    id: "hush-carving",
    name: "Carving",
    world: "meadow",
    worldAt: true,
    kind: "stone",
    x: -190,
    z: -178,
    facing: 0,
    lines: () => [
      { speaker: "Carving", text: "We measured the sun until it fit in a cup. The cup cracked." },
      { speaker: "Carving", text: "We left the tower standing so the crack would have shade." },
    ],
  },
  {
    id: "sack-tag",
    name: "Torn tag",
    world: "meadow",
    worldAt: true,
    kind: "note",
    x: -122,
    z: -214,
    facing: 0,
    lines: () => [
      { speaker: "Tag", text: "HOLT — four. Moved one sack to the dry-year bin." },
      { speaker: "Tag", text: "Do not let Cobb call this five. It is still four. — H" },
    ],
  },
  {
    id: "camp-ash",
    name: "Burned scrap",
    world: "meadow",
    worldAt: true,
    kind: "note",
    x: -104,
    z: -194,
    facing: 0,
    lines: () => [
      { speaker: "Scrap", text: "Three bedrolls. One sword broken at the guard. They let the fire eat the map." },
      { speaker: "Scrap", text: "The road on it goes west, then the charcoal stops." },
    ],
  },
  {
    id: "forgot-letter",
    name: "Folded letter",
    world: "meadow",
    worldAt: true,
    kind: "note",
    x: -238,
    z: -352,
    facing: 0,
    lines: () => [
      { speaker: "Letter", text: "Wren — if the town asks, I went to the low country." },
      { speaker: "Letter", text: "If you ask, I am where the water gets loud and then very quiet. I still set two bowls. — Ivy" },
    ],
  },
  {
    id: "veil-post",
    name: "Post",
    world: "meadow",
    worldAt: true,
    kind: "stone",
    x: -329,
    z: -149,
    facing: 0,
    lines: () => [
      { speaker: "Post", text: "Do not ring a bell here. The last one called a count that was not ours." },
      { speaker: "Post", text: "We took the clapper out and planted it. It did not grow." },
    ],
  },
  {
    id: "veyr-scrap",
    name: "Dropped page",
    world: "meadow",
    worldAt: true,
    kind: "note",
    x: 8,
    z: 36,
    facing: 0,
    lines: () => [
      { speaker: "Page", text: "The oak would not finish my name. It left a remainder. I will not be the remainder." },
      { speaker: "Page", text: "If a crown is the only thing that completes a count, then I will wear it. — V" },
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
      const merged = !head.length ? lines : lines[0]?.text === head[0]?.text ? lines : [...head, ...lines];
      return weaveLife(placed, ctx, merged);
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
          if (n.id === "lila") return live.innFloor === 0;
          if (n.id === "gil") return live.innFloor === 1;
          if (n.id === "mae") return live.innFloor === 2;
        }
        return true;
      }
      if (n.id === "pip") return live.house === "home";
      if (n.id === "nana") return live.house === "cabin";
      if (n.id === "dusk") return live.night && !live.house && !live.rookFight;
      if (n.id === "silo") return !live.house && seenHush();
      if (n.id === "moss") return !live.house && seenCave();
      if (n.id === "hester" || n.id === "nima") return !live.house && seenVeil();
      if (n.id === "vetch") {
        const h = gameClock().h;
        if (!(h >= 20.4 || h < 5.2)) return false;
      }
      if (live.house) return false;
      if (n.worldAt) return true;
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

/** People drawn in the world who are not on the town list. Still let you talk. */
const PASSER: Record<string, { name: string; say: string }> = {
  "meadow-kid-a": { name: "Lark", say: "{name}!! Don't step on my chalk. The square is a map and I am not done." },
  "meadow-kid-b": { name: "Ned", say: "{name}. I'm guarding this spot. You can stand next to it. You cannot have it." },
  "m-merch": { name: "Traveler", say: "{name}. I only unpack when the hour is right. Eight rupees for a sweet, if you catch me." },
  "m-stranger": { name: "Stranger", say: "{name}. I took a wrong path. Point me at the well and I will not ask twice." },
  "m-kid1": { name: "Dot", say: "We're racing. Don't tell Wren. She says the square is not a racetrack. It is." },
  "m-kid2": { name: "Jem", say: "{name}!! Dot cheats. She starts early. I start louder. That makes us even." },
};

export function passerBy(id: string): { id: string; name: string; lines: (hero: string) => TalkLine[] } | undefined {
  const p = PASSER[id];
  if (!p) return undefined;
  return {
    id,
    name: p.name,
    lines: (hero: string) => [{ speaker: p.name, text: p.say.replaceAll("{name}", hero) }],
  };
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
  gale: "Gale keeps a balloon on the south green. Eight rupees, then the rope.",
  ivy: "Wren's cousin Ivy did not go to the low towns. She still sets two bowls.",
  quill: "Quill watches the castle as a tooth of stone and will not finish the tower's story.",
  silo: "Silo lives in the crack of a cup that used to hold the sun.",
  hester: "A family kept the season on a lake that is not on Fern's board.",
  cairn: "Crownward keeps the count. The sash is cream and gold.",
  holm: "The capital sits in front of the keep. Oakstead is the village that feeds it.",
};

export function heardTales(met: string[]): string[] {
  return met.map((id) => TALES[id]).filter((t): t is string => Boolean(t));
}
