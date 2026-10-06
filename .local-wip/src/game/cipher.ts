import { live } from "./world3d/live";
import { useGame } from "./store";
import type { TalkLine } from "./dialogue";

/** The Fourth Mark — notes the player keeps. Never a full answer. */
export const CIPHER: Record<string, { title: string; note: string; listen?: string }> = {
  "home-slate": {
    title: "The cloth",
    note: "A mark under Gran’s cloth. She put the cloth back.",
    listen: "The cloth moved. Something was drawn under it. Then it was covered again.",
  },
  "gran-three": {
    title: "Gran",
    note: "Gran says there were always three jewels. Four is a child’s mistake.",
  },
  "sky-ring": {
    title: "The hole",
    note: "An empty ring in the night sky. Not the moon.",
    listen: "The sky has a hole in it. The moon is beside it, not in it.",
  },
  chisel: {
    title: "Scratched stone",
    note: "A stone south of home. Four pits. One is scraped blank.",
    listen: "Someone took a chisel to the last pit. On purpose.",
  },
  well: {
    title: "The well",
    note: "The well whispered one, two, three. Then it stopped.",
    listen: "One. Two. Three. Then nothing.",
  },
  "nana-three": {
    title: "Nana",
    note: "Nana says the song has three names. She will not say a fourth.",
  },
  mira: {
    title: "The oak",
    note: "Mira says the oak’s rings skip a year. As if a count was pulled out.",
  },
  fern: {
    title: "The board",
    note: "Fern found a torn last line on the town song. The paper ends mid-word.",
  },
  ash: {
    title: "The keep book",
    note: "Ash says a page is missing from the keep book. The stitch is still there.",
  },
  cobb: {
    title: "The crates",
    note: "Cobb’s crates come up one short. Every time. He counts again anyway.",
  },
  holt: {
    title: "Holt’s four",
    note: "Holt packs crates of four. He looks at Cobb like Cobb is the one who is wrong.",
  },
  "fest-four": {
    title: "The dark lantern",
    note: "The fair hung four lanterns. One never lights. Cobb says he did not hang a fourth.",
    listen: "Four lanterns. One never lights. Cobb says he did not hang a fourth.",
  },
  "chase-leaf": {
    title: "The last leaf",
    note: "A gray thing ran with Oakstead’s last green leaf in its teeth. The oak had been counting it.",
    listen: "It dropped the leaf. It looked at you like you had counted wrong.",
  },
  "storm-flash": {
    title: "Lightning mark",
    note: "A four on the lookout stone. It only shows when the sky writes.",
    listen: "The hill kept a four. The sky had to say it out loud.",
  },
  "elder-ring": {
    title: "The living four",
    note: "Elderfour’s crown still grows a fourth ring. The vale was told to stop at three.",
    listen: "A ring that is still growing. Someone told the vale to stop counting.",
  },
  watchers: {
    title: "The road faces",
    note: "Four old men on the home road. The woods ruin copied their faces and mixed the line.",
    listen: "The road had them first. The woods only copied.",
  },
  "well-pips": {
    title: "The rim count",
    note: "The well rim is marked on four sides. The river posts copied the posts and left the pits behind.",
    listen: "The well counted first. The river only copied.",
  },
  "laundry-line": {
    title: "Nana’s line",
    note: "Nana hangs four. One pin is empty. The mountain dirt copied the colors and not the line.",
    listen: "The line in town hangs true. The mountain only copied.",
  },
  "cairn-rings": {
    title: "The lookout stacks",
    note: "Little rings on the lookout hill. The keep road copied the stones and mixed the pile.",
    listen: "The hill stacked them first. The keep road only copied.",
  },
  "lost-lamp": {
    title: "Gold ribbon",
    note: "Nim’s lamp ribbon on a hole west of the lookout. She fit. You did not. A den south of the hole had a cage.",
    listen: "I counted. You came. Do not make me say it twice.",
  },
  "ring-three": {
    title: "Empty rings",
    note: "Three rings cut in old stone. The inside one is empty. They show up far from each other.",
    listen: "Three rings. The inside one is empty. Someone stopped counting.",
  },
  "camp-fold": {
    title: "Folded mile",
    note: "A cold camp east of town. The book said the maps fold there. A traveler on a stump would not say from where.",
    listen: "The page says the maps fold here. Do not ask the man on the stump where.",
  },
  "sun-dial": {
    title: "The walking shadow",
    note: "A needle of stone south of Oakstead. At dusk its shadow sits on a bronze plate. Something was buried for the light, not for you.",
    listen: "The plate took the shadow. Someone meant it to.",
  },
  tallow: {
    title: "Tallow",
    note: "Tallow counted four hissing things. Then there were three. The fourth looked up.",
  },
  nim: {
    title: "The lamp fox",
    note: "A gold fox from Gran’s lamp. She will not say the last name. She is tired of three.",
  },
  "glyph-sun": {
    title: "Sun stone",
    note: "A roadside stone with a sun cut in it. It warms a little at dusk.",
  },
  "glyph-fire": {
    title: "Fire stone",
    note: "A farm stone with a flame cut in it. Warm even in shade.",
  },
  "glyph-water": {
    title: "Water stone",
    note: "A pond stone with a wave cut in it. Cold when the rest of the bank is not.",
  },
  "glyph-blank": {
    title: "Blank stone",
    note: "A fourth stone with the mark scraped out. Same size as the others.",
    listen: "The cut is the same shape as the other stones. Someone did not want it read.",
  },
  "peak-count": {
    title: "The peak count",
    note: "Stoneback kept a fourth digit. Not a jewel. A number the vale was told to forget.",
    listen: "The mountain was the first counter. The vale learned numbers from this stone, then was told there were only three.",
  },
  ruin: {
    title: "Four seats",
    note: "Four empty seats in the dirt south of town. One is filled in with packed earth.",
    listen: "Four seats. One buried on purpose. The dirt is newer than the stone.",
  },
  "cavern-mural": {
    title: "The cave wall",
    note: "Sun Hollow had four suns on a wall. Someone scratched the last one out.",
    listen: "Four suns. The last is only scratches now.",
  },
  "cavern-slate": {
    title: "The quiet hall",
    note: "Scratched low on a pillar: 3 is 4 take away.",
    listen: "Someone wrote it small, as if they were not supposed to.",
  },
  tablet: {
    title: "The warden",
    note: "The temple warden dropped a broken number-stone. The last notch is missing.",
    listen: "A number-stone. The last notch is gone.",
  },
  "fang-stare": {
    title: "The lizards",
    note: "At night some lizards look up and forget to hunt.",
  },
  "cave-relic": {
    title: "The dark mouth",
    note: "A tablet in the south cave. Four marks. The last is scraped out, same as the roadside stones.",
    listen: "Someone cut the last mark out. They were careful. They did not want it read.",
  },
  "woods-rings": {
    title: "West rings",
    note: "Four rings cut in a fallen lintel in Whisperwood. The last ring is only a scratch.",
    listen: "Four rings. The last is a scratch. The grove behind the lying trees skipped a year.",
  },
  "four-stones": {
    title: "Four stones",
    note: "Standing stones in the vale, the woods, the river, and the peak. Three have pits. One does not. They rang.",
    listen: "Somewhere far south, stone answered.",
  },
  uncounted: {
    title: "The empty pit",
    note: "Four pits in the southern dirt. The empty one took a step. A mouth opened.",
    listen: "The empty pit took a step. A mouth opened south.",
  },
  "quiet-hollow": {
    title: "Quiet Hollow",
    note: "A town west of the woods that does not pay taxes. They count past three there.",
    listen: "A town that does not pay taxes. They look up, then away.",
  },
  "root-roads": {
    title: "Root roads",
    note: "The well kept a road under Oakstead. West woods. East water. South stones.",
    listen: "The well kept a road. Nobody mended it.",
  },
  remainder: {
    title: "The Remainder",
    note: "A fourth thing in a hall that was filled in. It copied the vale’s count, then sat down.",
    listen: "The fourth thing sat down. It was tired of being a mistake.",
  },
  "quiet-blade": {
    title: "The unfinished edge",
    note: "A rusty tang in the southern count. A whetstone on a mountain ledge. Quill in the hollow can hear metal.",
    listen: "A rusty tang. It used to be a longer blade.",
  },
  "well-fourth": {
    title: "The torn note",
    note: "Oak’s song plus one more. The well kept the verse Fern would not pin.",
    listen: "The torn note. The well kept it.",
  },
  noll: {
    title: "Noll",
    note: "A man who sits where nobody sits. He starts at the top. He finishes on the empty one.",
  },
  "long-count": {
    title: "The long count",
    note: "Four pits on a walking hill. The last is scraped blank. It still walks the old count.",
    listen: "The hill had pits. Four. One was blank. Then it walked.",
  },
  "manor-four": {
    title: "The west house",
    note: "A letter in a locked room. She set four places. The town said three. The fourth cup is still warm at night.",
    listen: "The letter stops mid-line. The ink is not old.",
  },
  "fish-bottle": {
    title: "The bottle",
    note: "A bottle from the far pond at night. The letter says four. Then the ink runs.",
    listen: "Count the pond at dawn. The fourth one still swims.",
  },
  "numbered-carp": {
    title: "The numbered carp",
    note: "A carp with four marks. Gran used to stitch that on cloth.",
    listen: "Four marks. The last one is scraped, same as the stones.",
  },
  "under-world": {
    title: "The Below",
    note: "A second vale under the first. Roads of stone. A river with no sky. The well was a door.",
    listen: "The vale has a cellar. Nobody mended the stairs.",
  },
  "under-count": {
    title: "Count Below",
    note: "A mural under Oakstead. Four marks. The last is scraped, same as the stones. The town is standing on a count it will not say.",
    listen: "Four pits. One blank. The well was never just a well.",
  },
  "lily-hut": {
    title: "Pond house",
    note: "A chimney in Oakstead’s pond. Stones from the east dock. The heart was under the floor.",
    listen: "A house you could see from the deck. You hopped to it.",
  },
  "mill-loft": {
    title: "Mill roof",
    note: "The mill wheel has a ladder on the south wall. The roof looks at the flags.",
    listen: "The mill roof. You saw this wheel from the tree.",
  },
  "herm-ledge": {
    title: "Elderfour roof",
    note: "A cottage on the west hill. The chimney was always in the vale’s eye.",
    listen: "The west hill was a walk. Someone lives where the goats do.",
  },
  "last-hearth": {
    title: "Last Hearth",
    note: "A cellar west of Rowan’s hut. Three moss bowls. A fourth that is only a scratch.",
    listen: "The door gave. Steam that is not steam. Someone left in a hurry a long time ago.",
  },
  "hearth-table": {
    title: "The set table",
    note: "Four bowls at Last Hearth. Three match the moss. One is empty on purpose.",
    listen: "Four bowls. Three have the shape of moss. The fourth is only a scratch.",
  },
  "snap-bend": {
    title: "The other bank",
    note: "West of the home oak a creek keeps a mouth. The bark on the bank was not finished being a tree.",
    listen: "The bark remembered the other bank.",
  },
  "keep-gate": {
    title: "The road ran out",
    note: "North of Oakstead the banners keep going until they do not. The castle is not a painting.",
    listen: "The road ran out. The castle did not.",
  },
  "road-shrine": {
    title: "A worn face",
    note: "Halfway to the keep a stone still listens if you play for it.",
    listen: "The little stone liked the song. It had been a long time.",
  },
};

export function hasCipher(id: string, list?: string[]) {
  const found = list ?? useGame.getState().cipher ?? [];
  return found.includes(id);
}

export function takeCipher(id: string, speak = false) {
  const g = useGame.getState();
  const found = g.cipher ?? [];
  if (found.includes(id)) return false;
  if (typeof g.markCipher === "function") g.markCipher(id);
  if (found.length === 0 && !live.chapterCue) live.chapterCue = "strange";
  const bit = CIPHER[id];
  if (speak && bit?.listen) live.listen = bit.listen;
  return true;
}

export function cipherNotes(found: string[]) {
  return found.map((id) => CIPHER[id]).filter(Boolean) as { title: string; note: string }[];
}

/** Quiet threads — only after the player has enough pieces. Never the whole answer. */
export function cipherThread(found: string[]): string | null {
  const n = found.length;
  if (n >= 12) return "Three jewels. A scraped fourth. A hole in the sky. Whatever Veyr opened, it was not just a door.";
  if (n >= 8) return "The songs stop at three. The stones do not.";
  if (n >= 5) return "People do not agree how many there were.";
  if (n >= 2) return "The marks do not match the stories.";
  return null;
}

/** One odd line the first time you talk. Never the answer. */
export function cipherTalk(npcId: string, name: string): TalkLine[] {
  const lines: Record<string, { id: string; speaker: string; text: string }> = {
    gran: {
      id: "gran-three",
      speaker: "Gran",
      text: `There were always three jewels, ${name}. Four is a child’s mistake.`,
    },
    nana: {
      id: "nana-three",
      speaker: "Nana",
      text: "The song has three names. I will not say a fourth. There isn’t one.",
    },
    mira: {
      id: "mira",
      speaker: "Mira",
      text: "The oak’s rings skip a year. As if a count was pulled out.",
    },
    rowan: {
      id: "woods-rings",
      speaker: "Rowan",
      text: "The west oak skipped a ring. Same as Mira’s tree. Same missing year. I do not like that.",
    },
    fern: {
      id: "fern",
      speaker: "Fern",
      text: "I found a torn last line on the town song. The paper ends mid-word. I did not pin it.",
    },
    ash: {
      id: "ash",
      speaker: "Ash",
      text: "A page is missing from the keep book. The stitch is still there. Nobody talks about it.",
    },
    cobb: {
      id: "cobb",
      speaker: "Cobb",
      text: "The crates come up one short. Every time. I count again. Still short.",
    },
    holt: {
      id: "holt",
      speaker: "Holt",
      text: "Crates of four. Always four. Cobb is the one who is wrong.",
    },
    tallow: {
      id: "tallow",
      speaker: "Tallow",
      text: "I counted four hissing things!! Then there were three. The fourth looked UP.",
    },
    noll: {
      id: "noll",
      speaker: "Noll",
      text: "She always started at the top. She always finished on the empty one. I am not talking about soup.",
    },
    quill: {
      id: "quiet-blade",
      speaker: "Quill",
      text: "Bring me a tang and a stone that is not a jewel. I will not name the fourth edge until it exists.",
    },
  };
  const bit = lines[npcId];
  if (!bit || hasCipher(bit.id)) return [];
  return [{ speaker: bit.speaker, text: bit.text }];
}

export function cipherForNpc(npcId: string): string | null {
  const map: Record<string, string> = {
    gran: "gran-three",
    nana: "nana-three",
    mira: "mira",
    rowan: "woods-rings",
    fern: "fern",
    ash: "ash",
    cobb: "cobb",
    holt: "holt",
    tallow: "tallow",
    nim: "nim",
    noll: "noll",
    quill: "quiet-blade",
  };
  return map[npcId] ?? null;
}
