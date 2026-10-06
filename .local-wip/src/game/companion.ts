import type { WorldId } from "./types";
import { TREE_HD, TREE_HOME } from "./world3d/field";
import { live } from "./world3d/live";
import { useGame } from "./store";
import { lostAway } from "./lost";

export type NimMood = "idle" | "walk" | "sit" | "hop" | "look" | "hide" | "plate" | "sniff" | "dig" | "crawl" | "fetch" | "track" | "growl";

export function nimShelf() {
  return { x: TREE_HOME.x + 0.18, z: TREE_HOME.z - TREE_HD + 0.22, yOff: 1.78 };
}

const last: { cat: string; t: number; line: string } = { cat: "", t: -99, line: "" };

export function resetNimChat() {
  last.cat = "";
  last.t = -99;
  last.line = "";
}

export function nimFollowing() {
  if (lostAway()) return false;
  return (useGame.getState().quests?.nim ?? 0) >= 1 || live.nimFollow;
}

export function markNimMet() {
  live.nimFollow = true;
  const n = useGame.getState().quests?.nim ?? 0;
  if (n < 1) useGame.getState().setQuest("nim", 1);
}

export function hydrateNim() {
  const met = (useGame.getState().quests?.nim ?? 0) >= 1;
  live.nimFollow = met && !lostAway();
  if (!met) {
    live.nimOnPlate = false;
    const s = nimShelf();
    live.nimX = s.x;
    live.nimZ = s.z;
    live.nimMood = "sit";
  }
}

export function nimYip(line: string, cat: string, force = false) {
  if (live.playT + 0.5 < last.t) resetNimChat();
  if (!force && live.listen) return false;
  if (!force && live.playT - last.t < 16) return false;
  if (!force && cat === last.cat && live.playT - last.t < 40) return false;
  last.cat = cat;
  last.t = live.playT;
  last.line = line;
  live.listen = line;
  return true;
}

export type NimCtx = {
  world: WorldId;
  house: string | null;
  fangD: number;
  boss: boolean;
  hp: number;
  maxHp: number;
  cipherN: number;
  still: number;
  speed: number;
  wet: boolean;
  night: boolean;
  afterTalk: string | null;
  nearStatue: boolean;
  nearBridge: boolean;
  nearCrate: boolean;
  nearGourd: boolean;
  nearPlate: boolean;
  dungeon: boolean;
  horse: boolean;
  jewel: boolean;
  low: boolean;
  item?: string | null;
  village?: boolean;
  rain?: boolean;
  storm?: boolean;
  fog?: boolean;
  snow?: boolean;
  mill?: boolean;
  carry?: string | null;
  nearLoose?: boolean;
  food?: boolean;
  fishing?: boolean;
  fest?: boolean;
  chase?: boolean;
  chaseLost?: boolean;
  place?: string | null;
  creature?: string | null;
  jobNear?: string | null;
  danger?: string | null;
  foeNear?: boolean;
};

export function considerNim(ctx: NimCtx): string | null {
  if (lostAway()) return null;
  if (!live.nimFollow && (useGame.getState().quests?.nim ?? 0) < 1) return null;
  if (live.talking || live.doorMath) return null;
  if (live.playT + 0.5 < last.t) resetNimChat();
  if (ctx.fishing && live.fishAct === "bite" && last.cat !== "fish-bite") {
    last.cat = "fish-bite";
    last.t = live.playT;
    return "Now. I will not eat it. I will watch you miss.";
  }
  if (live.playT - last.t < 18) return null;

  if (ctx.boss && last.cat !== "boss") {
    return "I will be the brave one who is over here.";
  }
  if (ctx.foeNear && last.cat !== "fang") {
    return ctx.low
      ? "That one has teeth. You have fewer hearts than usual. I am concerned. I am also not going first."
      : "Something with teeth. I counted them. I stopped at too many.";
  }
  if (ctx.fangD < 5.5 && ctx.fangD > 0.2 && last.cat !== "fang") {
    return ctx.low
      ? "That one has teeth. You have fewer hearts than usual. I am concerned. I am also not going first."
      : "Something with teeth. I counted them. I stopped at too many.";
  }
  if (ctx.danger === "sink" && last.cat !== "sink") {
    return "The ground wants a snack. We are the snack.";
  }
  if (ctx.danger === "ice" && last.cat !== "ice") {
    return "This floor is lying about being a floor.";
  }
  if (ctx.danger === "rapids" && last.cat !== "rapids") {
    return "The water is in a hurry. I am not.";
  }
  if (ctx.danger === "deep" && last.cat !== "wet") {
    return "I can swim. I prefer not to prove it.";
  }
  if (ctx.jobNear === "sniff" && last.cat !== "sniff") {
    return "The dirt is keeping a secret. I can hear it chewing.";
  }
  if (ctx.jobNear === "crawl" && last.cat !== "hole") {
    return "I fit. You do not. I am not bragging. I am measuring.";
  }
  if (ctx.jobNear === "dig" && last.cat !== "dig") {
    return "This mound is a door. I have used doors like this.";
  }
  if (ctx.jobNear === "fetch" && last.cat !== "fetch") {
    return "I can reach that. I will complain the entire way.";
  }
  if (ctx.jobNear === "track" && last.cat !== "track") {
    return "Someone ran. The smell did not.";
  }
  if (ctx.fishing && last.cat !== "fish") {
    return live.fishAct === "bite"
      ? "Now. I will not eat it. I will watch you miss."
      : live.fishKind === "bottle"
        ? "A bottle. Not a fish. I still want credit."
        : "I will not eat that. I will watch you miss.";
  }
  if (ctx.fest && last.cat !== "fest") {
    return "They hung lanterns for a leaf. I am not wearing a crown. I am considering it.";
  }
  if (ctx.chase && last.cat !== "chase") {
    return ctx.chaseLost
      ? "Hay. Mill. The hill. Under the wagon. I can smell green. I will not go first."
      : "That is not a cousin. That is a thief with a leaf. Run.";
  }
  if (ctx.food && last.cat !== "food") {
    return "That is for people. I will still be involved.";
  }
  if (ctx.creature === "pig" && last.cat !== "pig") {
    return "It has opinions. I have better ones.";
  }
  if (ctx.creature === "chicken" && last.cat !== "hen") {
    return "Birds who cannot fly are a personal insult.";
  }
  if (ctx.creature === "peekit" && last.cat !== "peekit") {
    return "A small face in the roots. It is counting you. I will count it back.";
  }
  if (ctx.creature === "jack" && last.cat !== "jack") {
    return "That bird steals shiny things. I do not shine. I am still offended.";
  }
  if (ctx.creature === "hare" && last.cat !== "hare") {
    return "It thinks if it does not move, it is a stone. I also thought that once.";
  }
  if (ctx.creature === "ring" && last.cat !== "rings") {
    return "Three rings. The inside one is empty. I will not stand on it.";
  }
  if (ctx.creature === "henmark" && last.cat !== "henmark") {
    return "The hen pecks in fours. I will not join the committee.";
  }
  if (ctx.creature === "dial" && last.cat !== "dial") {
    return "The stone is waiting for a shadow. I am waiting for supper. We are not equally patient.";
  }
  if (ctx.creature === "horse" && last.cat !== "horse-look") {
    return "Tall. Soft. I could live with being that tall. I will not admit it.";
  }
  if (ctx.creature === "fox" && last.cat !== "fox") {
    return "A cousin. We are not sharing a den. We are sharing a look.";
  }
  if (ctx.creature === "long" && last.cat !== "long") {
    return "That hill has legs. I am going to look at a smaller hill.";
  }
  if (ctx.creature === "stump" && last.cat !== "stump") {
    return "That stump walked. I saw it. It will deny it. I respect the commitment.";
  }
  if (ctx.creature === "wick" && last.cat !== "wick") {
    return "Little lamps with wings. They are going to a table that still thinks it is supper.";
  }
  if (ctx.creature === "hearth" && last.cat !== "hearth") {
    return "This place stopped in the middle of a meal. I will not sit. The bowls are the wrong shape.";
  }
  if (ctx.creature === "thorn" && last.cat !== "thorn") {
    return "A bush with legs. It pinched me first. I am keeping score.";
  }
  if (ctx.creature === "apple" && last.cat !== "apple") {
    return "It fell. I did not make it fall. I will still be involved.";
  }
  if (ctx.creature === "clamp" && last.cat !== "clamp") {
    return "The water has a mouth. I am a wolf. I am staying on this bank.";
  }
  if (ctx.creature === "millstick" && last.cat !== "millstick") {
    return "A stick is doing a job it is too small for. I have been that stick.";
  }
  if (ctx.creature === "woodlog" && last.cat !== "woodlog") {
    return "Soft things under a heavy thing. The hill is already leaning.";
  }
  if (ctx.creature === "road" && last.cat !== "road") {
    return "The village thinks it is the whole world. The road disagrees.";
  }
  if (ctx.creature === "cart" && last.cat !== "cart") {
    return "Someone left in a hurry. Or a wheel did.";
  }
  if (ctx.creature === "shrine" && last.cat !== "shrine") {
    return "It has a face. It has been waiting for a song, or a person who remembers one.";
  }
  if (ctx.place === "lookout" && last.cat !== "look") {
    return "West is teeth. East is wet. North is a number someone scraped off. I am not drawing a map of it.";
  }
  if (ctx.place === "river" && last.cat !== "river") {
    return "The water does not care that we are from a tree.";
  }
  if (ctx.place === "mount" && last.cat !== "mount") {
    return "This hill is counting. I can hear it. That does not mean I will climb first.";
  }
  if (ctx.place === "cavern" && last.cat !== "cave") {
    return "The first real dark. I will be the brave one who is slightly behind you.";
  }
  if (ctx.place === "ruins" && last.cat !== "ruins") {
    return "Someone counted here until they ran out.";
  }
  if (ctx.place === "keep" && last.cat !== "keep") {
    return "Stone that wants to be a mouth. I have seen this plan.";
  }
  if (ctx.place === "desert" && last.cat !== "sand") {
    return "The ground is pretending to be a bed. It is not.";
  }
  if (ctx.place === "snow" && last.cat !== "snow") {
    return "The white is lying about being soft.";
  }
  if (ctx.place === "forest" && last.cat !== "woods") {
    return "The trees are standing too close. I am counting mouths, not trees.";
  }
  if (ctx.place === "hollow" && last.cat !== "hollow") {
    return "They do not want a map. I also do not want a map. We can live here.";
  }
  if (ctx.place === "hall" && last.cat !== "hall") {
    return "Four mouths. One was filled in. I am not going first.";
  }
  if (ctx.place === "roots" && last.cat !== "roots") {
    return "The well kept a secret under the buckets. I fit. You barely.";
  }
  if (ctx.place === "undervale" && last.cat !== "below") {
    return "The vale was a lid. I am not drawing a map of the cellar.";
  }
  if (ctx.place === "blackwater" && last.cat !== "black") {
    return "A river with no sky. I can swim. I prefer not to prove it twice.";
  }
  if (ctx.place === "rootcat" && last.cat !== "rootcat") {
    return "The woods are standing on their own heads. I will not climb them from this side.";
  }
  if (ctx.place === "elderfour" && last.cat !== "elder") {
    return "Four hats. The new one is still growing. I am not jumping from here.";
  }
  if (ctx.place === "scent" && last.cat !== "scent") {
    return "I counted. You came. I am not making a habit of holes.";
  }
  if (ctx.place === "keeproad" && last.cat !== "keeproad") {
    return "These stones copied the hill. Badly. I am not lining them up for you.";
  }
  if (ctx.place === "isle" && last.cat !== "isle") {
    return "A house in the river. I counted the smoke from town. I did not think you would walk on water.";
  }
  if (ctx.place === "ridge" && last.cat !== "ridge") {
    return "The ladder could see this door. I did not mention it. I wanted you to notice.";
  }
  if (ctx.place === "cliff" && last.cat !== "cliff") {
    return "The lookout’s hole. I thought it was a painting. I was wrong. I am rarely wrong.";
  }
  if (ctx.low && ctx.hp <= 4 && last.cat !== "hurt") {
    return "You are leaking. I cannot be the hearts. Stop for a minute.";
  }
  if (ctx.wet && last.cat !== "wet") {
    return "I can swim. I prefer not to prove it.";
  }
  if (ctx.low && ctx.speed > 2 && last.cat !== "hurt") {
    return "You are leaking. I do not carry bandages.";
  }
  if (ctx.afterTalk) {
    const line = afterNpc(ctx.afterTalk);
    if (line) return line;
  }
  if (ctx.jewel && last.cat !== "jewel") {
    return "Light. Keep it. The vale is worse at holding on to things than I am.";
  }
  if (ctx.item && last.cat !== "item") {
    const found = itemLine(ctx.item);
    if (found) return found;
  }
  if (ctx.dungeon && ctx.nearPlate && last.cat !== "plate") {
    return "A heavy floor. I will sit if you ask. I will not sit if you shove.";
  }
  if (ctx.nearStatue && last.cat !== "statue") {
    return "The wall is already doing the work. The stones are waiting to be wrong.";
  }
  if (ctx.nearBridge && last.cat !== "bridge") {
    return "Three planks. I can swim. That is not a hint. That is a complaint.";
  }
  if (ctx.nearCrate && last.cat !== "crate") {
    return "Smallest on the left. I am not lining them up. I have a tail.";
  }
  if (ctx.nearLoose && last.cat !== "loose") {
    return "That one is not scenery. I checked.";
  }
  if (ctx.nearGourd && last.cat !== "gourd") {
    return "The plates have groups. Count the groups, not my patience.";
  }
  if (ctx.carry && last.cat !== "carry") {
    if (ctx.carry === "cucco") return "That bird will remember this. I am staying out of it.";
    if (ctx.carry === "frog") return "Wet. Again. I did not agree to a collection.";
    if (ctx.carry === "crate") return "You have hands. I have a tail. The box is yours.";
  }
  if (ctx.horse && last.cat !== "horse") {
    return "I will sit behind. If I fall, you will pretend it was a plan.";
  }
  if (ctx.storm && last.cat !== "storm") {
    return "The sky is counting too loud. I am not going first.";
  }
  if (ctx.fog && last.cat !== "fog") {
    return "The trees hid. I did not agree to a guessing game.";
  }
  if (ctx.snow && last.cat !== "snow") {
    return "White on my nose. This is not a gift.";
  }
  if (ctx.rain && last.cat !== "rain") {
    return "The vale is washing its face. I am not a towel.";
  }
  if (ctx.village && last.cat !== "town") {
    return "Too many feet. I will be the small one on purpose.";
  }
  if (ctx.mill && last.cat !== "mill") {
    return "It counts without numbers. I respect the mill more than most people.";
  }
  if (ctx.night && ctx.still > 2.4 && last.cat !== "night") {
    return "The sky has a hole in it. Do not tell Gran I said that.";
  }
  if (live.x < -340 && live.x > -1400 && last.cat !== "woods") {
    return "The trees are standing too close. I am counting mouths, not trees.";
  }
  if (ctx.cipherN >= 8 && last.cat !== "fourth") {
    return "I had a name for the last one. I am still not saying it.";
  }
  if (ctx.cipherN >= 5 && last.cat !== "marks") {
    return "People count to three and then look proud. I have been tired.";
  }
  if (ctx.still > 8 && last.cat !== "wait") {
    return "If we live here now, I want a cushion.";
  }
  if (ctx.speed > 11 && last.cat !== "run") {
    return "I have small legs. You have no excuse.";
  }
  if (ctx.dungeon && ctx.world === "cavern" && last.cat !== "hollow") {
    return "Lamps I like. Mouths in the rock I do not.";
  }
  if (ctx.house === "yours" && last.cat !== "home") {
    return "The shelf was mine. I am lending it to the lamp.";
  }
  return null;
}

function itemLine(item: string): string | null {
  const k = item.toLowerCase();
  if (k.includes("sword") || k.includes("blade")) return "A stick with opinions. I approve of opinions. I will not hold it.";
  if (k.includes("ocarina") || k.includes("flute") || k.includes("reed")) return "A mouth that is not a mouth. Do not ask me to sing.";
  if (k.includes("bow") || k.includes("sling")) return "Distance. I like distance. From the teeth, specifically.";
  if (k.includes("bomb")) return "Loud balls. Tess is going to be proud. I am going to stand further away.";
  if (k.includes("compass")) return "It points. I already knew. I am still not pointing.";
  if (k.includes("emerald") || k.includes("ruby") || k.includes("sapphire") || k.includes("gem")) {
    return "Light. Keep it. The vale is worse at holding on to things than I am.";
  }
  if (k.includes("heart")) return "A spare. Put it somewhere I do not have to watch you leak.";
  return null;
}

function afterNpc(id: string): string | null {
  const map: Record<string, string> = {
    gran: "She is counting the road. I counted it too. It is the same road.",
    bram: "He is brave about socks. I am brave about coming.",
    sela: "She packed a flower. I packed myself. Gran will notice one of those.",
    mira: "She counts apples. I count holes.",
    fern: "She pins rumors. I am not a rumor.",
    finn: "He guesses planks. I have already decided I dislike water.",
    holt: "He will not unmix the crates. I also will not. We are a team.",
    ash: "He likes swords. I like not being the thing they hit.",
    nana: "She boils hearts back. I am not a soup.",
    tallow: "He hides. I follow. We are not the same kind of small.",
    ink: "He painted a leftover until it stood up. I stood up. We are not discussing it.",
    note: "It split. I got the small half. Do not look proud about that.",
    cole: "He points at mouths in the rock. I point at nothing. Guess who is more popular.",
    reed: "Wet. I said that already.",
    tess: "She skips. I hop. We are not the same sport.",
    willow: "She kept a seat. I kept a shelf.",
    pell: "He counts plates. I sit on them. Different hobbies.",
    flint: "Rocks. People love rocks. I do not.",
    bramble: "She said foxes like they are a pest. I am a guest.",
    rook: "Friends share leftovers. I am not that kind of leftover.",
    noll: "He sits where nobody sits. I sat on a shelf. We are the same hobby.",
    quill: "He finishes blades. I finish snacks. Different crafts.",
    maren: "She sells hearts. I contain hearts. Do not mix us up.",
    ivo: "He counted chairs. I counted four. We are in trouble together.",
    sedge: "He is proud of not paying taxes. I have never paid taxes.",
  };
  return map[id] ?? null;
}

export function nimTalkLines(
  name: string,
  met: boolean,
  cipherN: number,
): { speaker: string; text: string; picks?: { label: string; say: { speaker: string; text: string }[] }[] }[] {
  if (!met) {
    return [
      {
        speaker: "Nim",
        text: `You are ${name}. The lamp said so. I have been in it long enough to listen.`,
        picks: [
          {
            label: "Who are you?",
            say: [
              { speaker: "Nim", text: "Nim. I live on the shelf. Gran thinks I am a moth who pays rent in leftover pear." },
              { speaker: "Nim", text: "The vale is bad at counting past three. I am coming. I am tired of the lamp." },
            ],
          },
          {
            label: "You can come.",
            say: [
              { speaker: "Nim", text: "I was coming anyway. Asking is polite. I can be polite." },
              { speaker: "Nim", text: "I can smell what the dirt is hiding. I can fit where you cannot. Ask. I will sit on a floor if it is heavy. I will not draw a map of it." },
            ],
          },
          {
            label: "Stay with Gran.",
            say: [
              { speaker: "Nim", text: "No. Roofs are boring. Bram can watch. I am worse at watching and better at coming." },
              { speaker: "Nim", text: "If you run I will still be there. I have small legs and a long grudge." },
            ],
          },
        ],
      },
    ];
  }
  if (cipherN >= 8) {
    return [
      { speaker: "Nim", text: `You are collecting the leftover, ${name}. Do not look at me like I am it.` },
      { speaker: "Nim", text: "Three jewels. A scraped fourth. I had a name. I am keeping it until the sky makes sense." },
    ];
  }
  if (live.dungeon) {
    return [
      { speaker: "Nim", text: "This rock is counting. I can hear it. That does not mean I will do the work." },
      { speaker: "Nim", text: "If a floor wants weight, ask. If a wall wants a number, look at the wall." },
    ];
  }
  if (live.night) {
    return [
      { speaker: "Nim", text: "The hole in the sky is not the moon. I checked. Several times. The lamp was a better ceiling." },
      { speaker: "Nim", text: "Come home when the vale is too big. I will pretend I suggested it." },
    ];
  }
  return [
    {
      speaker: "Nim",
      text: `I am still here, ${name}. I have not become a moth.`,
      picks: [
        {
          label: "Any ideas?",
          say: [
            { speaker: "Nim", text: "Yes. Look at what is already sitting there. I will not point. Pointing is for people who want to be lamps." },
            { speaker: "Nim", text: "If the dirt is chewing, ask. If a hole is fox-sized, ask. If a floor is heavy, ask. That is not a map. That is physics." },
          ],
        },
        {
          label: "Are you scared?",
          say: [
            { speaker: "Nim", text: "Yes. I am also coming. Those can be the same sentence." },
            { speaker: "Nim", text: "Bram throws socks. I throw myself onto a plate. We all have a method." },
          ],
        },
        {
          label: "Go home.",
          say: [
            { speaker: "Nim", text: "The shelf will be there. I will not. That is the point of a leftover." },
          ],
        },
      ],
    },
  ];
}
