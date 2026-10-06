import type { TalkLine, TalkPick } from "./dialogue";
import { useGame } from "./store";
import { seenCave, seenHush, seenVeil } from "./world3d/hidden";

/**
 * What the vale remembers.
 * Flags live in the existing quest map so they save with the file.
 * Nothing here announces itself. People mention things, or they don't.
 */

type Q = Record<string, number>;

export type Rumor = {
  id: string;
  mouths: string[];
  text: string;
  aside: string;
};

/** Some of these are wrong. Some are half. A few are the only map that exists. */
export const RUMORS: Rumor[] = [
  {
    id: "falls-knock",
    mouths: ["finn", "pax"],
    text: "Something knocks under the falls west of the oaks. Fish don't knock.",
    aside: "I haven't walked it. The dock is enough water for one man.",
  },
  {
    id: "no-road",
    mouths: ["holt", "bramble"],
    text: "My grandfather's west road is a story. I walked the grass. Grass is what I found.",
    aside: "If you find a road, it grew there after I looked. Roads do that, when they want.",
  },
  {
    id: "ivy-left",
    mouths: ["oak0", "nell"],
    text: "Ivy went to the low towns. I would have heard if she was still on our hill.",
    aside: "Cousins write, or they don't. She doesn't.",
  },
  {
    id: "ivy-stayed",
    mouths: ["vetch", "quill"],
    text: "Wren's cousin did not go to any low town. Wren likes a story she can sweep.",
    aside: "I won't draw you a map. Maps get pinned. Pinned things die.",
  },
  {
    id: "wolf-crown",
    mouths: ["tallow", "oak2"],
    text: "A wolf with a little crown drinks from our pond at night. Tess saw the crown. Tess sees a lot of crowns.",
    aside: "I would not fight it. I would ask to wear the crown on Tuesdays.",
  },
  {
    id: "even-sack",
    mouths: ["cobb", "oak6"],
    text: "A sack of even grain walked off. Crows do not carry sacks. Holt says the count is fine.",
    aside: "Holt says the count is fine when he hopes you will stop counting.",
  },
  {
    id: "cup-tower",
    mouths: ["flint", "silo"],
    text: "That tower in the west bowl was a cup for the sun. Not a temple. Not a king's.",
    aside: "I won't say who drank. Some questions rust the anvil.",
  },
  {
    id: "still-house",
    mouths: ["pell", "finn"],
    text: "A family asked the way to a lake that is not on Fern's board. I still set two bowls aside.",
    aside: "If they are real, they are hungry. If they are not, the bowls can wait.",
  },
  {
    id: "rook-pay",
    mouths: ["ash", "oak1"],
    text: "Rook was promised a name, not a reason. He took the square because a promise is a poor roof.",
    aside: "Wanting a name is ordinary. Making a town kneel for it is the part I answer with a sword.",
  },
  {
    id: "bell-out",
    mouths: ["hester", "nima"],
    text: "Don't ring a bell on the still water. The last one called a count that was not ours.",
    aside: "We took the clapper out. It did not grow back. That is the whole warning.",
  },
  {
    id: "cellar-mouth",
    mouths: ["nora", "oak5"],
    text: "The dark mouth east of the keep road used to be a cellar. It is not a cellar now.",
    aside: "Gran's boy would go look. Gran's boy would also come home.",
  },
  {
    id: "oak-first",
    mouths: ["vetch", "ink"],
    text: "The oak looked at Veyr before it looked at anyone else. Then it changed its mind.",
    aside: "Daylight will tell you he was only greedy. Greedy is simpler. It is not the whole page.",
  },
];

const MEMORY: Record<string, Record<string, string>> = {
  oak0: {
    rook: "The square is loud again. Wipe your feet anyway.",
    hush: "Your cuffs are a mud I don't sell. I will not ask which hill.",
    veyr: "A boy who hated a remainder. I have swept worse reasons off this step. Not many sadder.",
    jewels: "Hal says the door took the stones. The step is still dirty. Start there.",
  },
  oak1: {
    rook: "Rook is a size that fits a chair again. I like him better when he is that size.",
    veyr: "I read the page you found, or one like it. A name is not a crown. He learned the wrong lesson from a true hurt.",
    hush: "You went where grandfather drew the road. I am glad the grass lied to me and not to you.",
    jewels: "Three stones back in a lock. The vale feels like it exhaled. Sit, if you want. The chair remembers you.",
  },
  nora: {
    rook: "I hid in the bread. The bread is out again. So am I. Thank you for the ordinary morning.",
    jewels: "The dough sat up and listened this morning. I don't know what you did on the hill. The oven does.",
    cave: "You smell like wet stone. Eat first. Then tell me nothing, if you'd rather.",
  },
  ash: {
    rook: "We put him down and the town stood up. That is the only parade I need.",
    veyr: "I have trained boys who wanted a name that loud. The work is to want a home more.",
    jewels: "The keep will hold, if we do. Go walk. I'll watch the paddock.",
  },
  fern: {
    rook: "I took Rook's notice down. The pin is still in the board. Pins are cheap. People are not.",
    veyr: "I will not pin a boy's shame. If the town should know, you tell them. I only pin what they already whisper.",
    hush: "You have mud on you that is not our mud. I won't pin it unless you ask me to.",
  },
  pell: {
    rook: "The long table was empty, then it wasn't. I counted the plates twice because I wanted to.",
  },
  holt: {
    sack: "Cobb has the number now. Leave the dry-year bin alone. It is a private four.",
    rook: "The rows kept growing while we ran. Dirt is ruder than knights. I respect it.",
  },
  cobb: {
    rook: "I inspected the west path at speed. I am inspecting it slowly again. This is better.",
  },
  flint: {
    rook: "The anvil does not care who sat in the square. I do. You did the work. Bring rocks when you can.",
    jewels: "Even the ore sounds different. Don't quote me. Ore is not a poet.",
  },
  finn: {
    cave: "Your boots have been under something. The pond is jealous. I am not.",
    hush: "West water on you. I still won't walk past the dock. Someone should. It was you.",
  },
  nana: {
    rook: "I took the children. You took the night. Come drink when the brave wears off.",
    jewels: "The oak is quieter. That is how a lock sounds when it is a lock again.",
  },
  mira: {
    rook: "I came down. I ran. You stayed. The apples are still here, if you want one that is not a speech.",
    hush: "You smell like a waterfall. Sit under the leaves until you smell like an apple again.",
  },
  quill: {
    veil: "You came back from the still water. Most people stop when a story gets quiet.",
  },
  silo: {
    veyr: "A boy, a remainder, a crown. Old news. The cup cracked before he was born. He just noticed.",
  },
  hal: {
    rook: "The road stayed open because you were on it. I still stand here. That is not an insult.",
    jewels: "The door held. You can pass. I watch anyway.",
  },
  tallow: {
    rook: "You beat the big scary one!! I hid in a barrel that was not a barrel!! It was a bush!!",
  },
  oak6: {
    sack: "Holt's four is a real four. I hauled wood, not grain, so I will not be in the argument.",
  },
};

function rookDown() {
  const d = useGame.getState().defeated?.meadow;
  return Array.isArray(d) && d.includes("rook");
}

function jewelsIn(gems?: { emerald?: boolean; ruby?: boolean; sapphire?: boolean }) {
  return Boolean(gems?.emerald && gems?.ruby && gems?.sapphire);
}

export function memoryBeat(
  npcId: string,
  quests: Q,
  met: string[],
  gems?: { emerald?: boolean; ruby?: boolean; sapphire?: boolean },
): { key: string; text: string } | null {
  const book = MEMORY[npcId];
  if (!book) return null;
  const ready: [string, boolean][] = [
    ["family", (quests["arc:family"] ?? 0) >= 1],
    ["sack", (quests["arc:sack"] ?? 0) >= 3],
    ["letter", met.includes("forgot-letter")],
    ["veyr", met.includes("veyr-scrap") && (met.includes("hush-carving") || npcId !== "quill")],
    ["rook", rookDown()],
    ["jewels", jewelsIn(gems)],
    ["cave", seenCave()],
    ["hush", seenHush()],
    ["veil", seenVeil()],
  ];
  for (const [beat, on] of ready) {
    if (!on || !book[beat]) continue;
    const key = `mem:${npcId}:${beat}`;
    if ((quests[key] ?? 0) >= 1) continue;
    return { key, text: book[beat] };
  }
  return null;
}

export function sealMemory(npcId: string) {
  const g = useGame.getState();
  const beat = memoryBeat(npcId, g.quests ?? {}, g.metNpcs ?? [], g.gems);
  if (!beat) return;
  if ((g.quests?.[beat.key] ?? 0) >= 1) return;
  g.setQuest(beat.key, 1);
}

export function nextRumor(npcId: string, quests: Q): Rumor | null {
  for (const r of RUMORS) {
    if (!r.mouths.includes(npcId)) continue;
    if ((quests[`rumor:${r.id}`] ?? 0) >= 1) continue;
    return r;
  }
  return null;
}

function rumorPick(speaker: string, rumor: Rumor): TalkPick {
  return {
    label: "Heard anything?",
    act: `hear:${rumor.id}`,
    say: [
      { speaker, text: rumor.text },
      { speaker, text: rumor.aside },
    ],
  };
}

function enoughPick(speaker: string): TalkPick {
  return {
    label: "That's enough.",
    say: [{ speaker, text: "Then I'll keep the rest in my pocket." }],
  };
}

export function applyTalkAct(act: string | undefined) {
  if (!act) return;
  const g = useGame.getState();
  if (act.startsWith("hear:")) {
    const id = act.slice("hear:".length);
    if ((g.quests?.[`rumor:${id}`] ?? 0) < 1) g.setQuest(`rumor:${id}`, 1);
    return;
  }
  if (act === "sack-return") {
    if ((g.quests?.["arc:sack"] ?? 0) >= 3) return;
    g.setQuest("arc:sack", 3);
    g.addCoins(12);
    return;
  }
  if (act === "family-tell") {
    if ((g.quests?.["arc:family"] ?? 0) >= 1) return;
    g.setQuest("arc:family", 1);
    g.addCoins(8);
  }
}

export function weaveLife(
  npc: { id: string; name: string; kind?: string },
  ctx: { name: string; met: string[]; quests?: Q; gems?: { emerald?: boolean; ruby?: boolean; sapphire?: boolean } },
  lines: TalkLine[],
): TalkLine[] {
  if (!lines.length) return lines;
  if (npc.kind && npc.kind !== "person") return lines;
  if (npc.id === "gale") return lines;
  const quests = ctx.quests ?? {};
  const out: TalkLine[] = lines.map((l) => ({
    ...l,
    picks: l.picks ? l.picks.map((p) => ({ ...p, say: p.say.map((s) => ({ ...s })) })) : undefined,
  }));

  const beat = memoryBeat(npc.id, quests, ctx.met, ctx.gems);
  if (beat && out[0]?.text !== beat.text) {
    out.unshift({ speaker: npc.name, text: beat.text });
  }

  if (npc.id === "cobb" && (quests["arc:sack"] ?? 0) < 3 && ctx.met.includes("sack-tag")) {
    const host = out[out.length - 1]!;
    host.picks = [
      ...(host.picks ?? []),
      {
        label: "Holt moved a sack.",
        act: "sack-return",
        say: [
          { speaker: "Cobb", text: "Four. He moved one so the dry year would still be four. I was ready to call it five and ruin his week." },
          { speaker: "Cobb", text: "He could have told me. I would have written it down as four anyway. Here. For the walk. Don't tell him I was frightened. Tell him the count is even." },
        ],
      },
      {
        label: "Not yet.",
        say: [{ speaker: "Cobb", text: "Then I will keep counting. Bring the truth when it is even." }],
      },
    ];
  }

  if (!ctx.met.includes(npc.id)) return out;
  const rumor = nextRumor(npc.id, quests);
  if (!rumor) return out;
  const last = out[out.length - 1]!;
  const had = Boolean(last.picks?.length);
  last.picks = [...(last.picks ?? []), rumorPick(npc.name, rumor)];
  if (!had) last.picks.push(enoughPick(npc.name));
  return out;
}
