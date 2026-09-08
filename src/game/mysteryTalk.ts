import { hasMystery, currentMystery } from "./mystery";
import type { TalkLine } from "./dialogue";

export function extraTalk(npcId: string, name: string): TalkLine[] {
  const out: TalkLine[] = [];
  if (hasMystery("extraGossip")) {
    const bits: Record<string, string> = {
      nora: `Keep an ear on the well, ${name}. It talks when nobody is looking.`,
      tallow: `A cart I never saw before rolled through at dusk. I blinked and it was gone.`,
      cole: `The grass was wet this morning and it did not rain. Or it did, and I slept.`,
      wren: `Do not follow lights at night. Some of them walk.`,
      pell: `A stranger ordered stew and paid with a coin I have never stamped.`,
      ash: `If you hear a step that is not yours, ${name}, it still might be a friend.`,
    };
    const t = bits[npcId];
    if (t) out.push({ speaker: "", text: t });
  }
  if (hasMystery("merchant") && (npcId === "cobb" || npcId === "pell")) {
    out.push({ speaker: "", text: "A traveling packer was asking the hour. They never stay." });
  }
  if (hasMystery("stranger") && !currentMystery()?.helped && npcId === "ash") {
    out.push({ speaker: "", text: `Someone west of town looked lost. Not a lizard. Just lost.` });
  }
  if (hasMystery("afterRookBloom") && npcId === "mira") {
    out.push({ speaker: "", text: "The apples smell different. Sweeter. Like the valley remembered something." });
  }
  if (hasMystery("oldSong") && npcId === "willow") {
    out.push({ speaker: "", text: "There is a tune under the wind. I will not hum it. You might." });
  }
  return out.map((l) => ({ ...l, speaker: l.speaker || npcName(npcId) }));
}

function npcName(id: string) {
  return id.charAt(0).toUpperCase() + id.slice(1);
}
