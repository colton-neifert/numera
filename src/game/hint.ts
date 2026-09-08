import { live } from "./world3d/live";
import type { GemId } from "./content";
import { useGame } from "./store";

export function nextStep(s: {
  hasSword: boolean;
  hasOcarina: boolean;
  songs: string[];
  metNpcs: string[];
  worldsCleared: string[];
  gems: Record<GemId, boolean>;
  gemsPlaced: GemId[];
  hasHorse: boolean;
  hasBow: boolean;
  currentWorld: string | null;
}): string {
  const met = s.metNpcs;
  const cleared = s.worldsCleared;
  if (!met.includes("oak-note") && !s.hasSword) {
    return "A note is pinned to a tree. Walk up and talk to read it.";
  }
  if (!s.hasSword) {
    return "Ash in the paddock hall will put a blade in your hand. Or walk the keep road — a lone cedar hides a chest.";
  }
  if (!s.hasOcarina) {
    return "A reed flute sits in a chest near the shrine. Walk up to it.";
  }
  if (!s.songs.includes("oak")) {
    return "Mira will teach you a song for the flute. Talk to her. Then play it at the Sun Shrine.";
  }
  if (!s.gems.emerald) {
    return "The Sun Shrine is far west of the meadow. Play the oak song at the bars, then go in and take the jewel.";
  }
  if (!s.gems.ruby) {
    return "Dark Cave. Walk the halls. The fire jewel is at the end.";
  }
  if (!s.gems.sapphire) {
    return "Frog Marsh. Walk the halls. The water jewel is in the last hall.";
  }
  if (s.gems.emerald && s.gems.ruby && s.gems.sapphire && s.gemsPlaced.length < 3) {
    return "You have all three jewels. Take them to the castle. Put them in the three holes by the door.";
  }
  if (s.gemsPlaced.length >= 3 && !s.metNpcs.includes("false-dawn") && !cleared.includes("keep")) {
    return "The jewels sit. Something is about to happen.";
  }
  if (s.gemsPlaced.length >= 3 && !cleared.includes("keep")) {
    return "He took the light. Go in the castle. Wait until he swings. Then hit him.";
  }
  if (cleared.includes("keep") && !cleared.includes("grove")) {
    return s.hasHorse
      ? "His magic hid. Green Forest is first. A long walk, then the light."
      : "His magic hid. A horse waits west of the sword. Green Forest is next.";
  }
  if (cleared.includes("grove") && !cleared.includes("crater")) {
    return "The forest is done. Fire Mountain is next.";
  }
  if (cleared.includes("crater") && !cleared.includes("lake")) {
    return "The mountain is done. Blue Lake is next.";
  }
  if (cleared.includes("lake") && !cleared.includes("grave")) {
    return "The lake is done. Night Grave is next.";
  }
  if (cleared.includes("grave") && !cleared.includes("waste")) {
    return "The grave is done. Sand Land is last of the five.";
  }
  if (cleared.includes("waste") && !cleared.includes("echo")) {
    return "Five places are done. The Last Hall has opened. Walk the halls. Then stop him.";
  }
  if (cleared.includes("echo") && !cleared.includes("ridge")) {
    return "The magic split again. High Ridge is first.";
  }
  if (cleared.includes("ridge") && !cleared.includes("spire")) {
    return "The ridge is done. Clock Tower is next.";
  }
  if (cleared.includes("spire") && !cleared.includes("fen")) {
    return "The tower is done. Glass Swamp is next.";
  }
  if (cleared.includes("fen") && !cleared.includes("hollow")) {
    return "The swamp is done. Thunder Hollow is next.";
  }
  if (cleared.includes("hollow") && !cleared.includes("vault")) {
    return "Four quiet temples are done. Crown Cave has opened.";
  }
  if (!s.hasHorse) {
    return s.hasSword
      ? "A horse waits west of the sword chest. Walk up and name her."
      : "The first blade is in a chest near the meadow. A horse waits west of it.";
  }
  if (s.hasHorse && !s.songs.includes("horse")) {
    return "Hal at the keep can teach you a song to call the horse.";
  }
  return "The valley is safe. Walk around. The Arena is still there.";
}

export function flavorHint(world: string | null): string | null {
  const bits: string[] = [];
  if (world === "meadow") {
    if (!live.sawWellBoy) bits.push("Tallow keeps looking at the well.");
    if (live.night && !live.sawWellBoy) bits.push("A small shape waits at the counting well after dark.");
    if (live.jail.on) bits.unshift(live.jail.tip || "Look at the box. Then look up.");
    if (live.turned.length) bits.push("The Lizard King puts people in a locker in the castle. They come out as fangs.");
    if (live.night && !live.house) bits.push("If too many fangs stand around you, they take you to jail.");
    if (!live.hideSeek?.done && !live.hideSeek?.hiding) bits.push("Tallow wants a game. Talk to him after you know Sun’s Count.");
    if (!live.foundBoot) bits.push("Cobb loses things in Holt’s rows after dark.");
    const q = useGame.getState().quests ?? {};
    if ((q.ash ?? 0) < 1) bits.push("A fighter named Ash trains by the paddock. He does not fight for strangers.");
    if ((q.ash ?? 0) === 2) bits.push("Ash is waiting at Pell’s at half past six.");
    if ((q.ash ?? 0) === 3) bits.push("Ash wants a real fight. Talk to him.");
    if ((q.ash ?? 0) === 4) bits.push("Ash is with you. West of Oakstead, a ring of stones.");
    if (!(useGame.getState().defeated.meadow ?? []).includes("rook")) {
      bits.push(live.night ? "Rook is by the fire in Oakstead. You can’t miss him." : "Rook sits by the Oakstead fire, next to the sign that says his name.");
    }
    if ((q["nana-broth"] ?? 0) < 2) bits.push("Nana wants three mushrooms for a broth. They grow at the trees.");
    if ((q["mill-wood"] ?? 0) < 2) bits.push("The miller will pay for five stacks of wood. Chop a tree three times, then chop the fallen log for more.");
    if ((q["tess-apple"] ?? 0) < 3) bits.push("Tess lost an apple. Brin hid it under his bunk in the west log house.");
    bits.push("A man with a big pack buys fish and firewood at the Oakstead gate.");
    bits.push("The scarecrows turn after the lanterns die. Play for them.");
    bits.push("The red mailbox by the road has a letter. Tallow cannot reach it.");
    bits.push("Play a song under the little birdhouse. Something lives in it.");
    bits.push("The mill keeps a purse in the grain bin. Ask the miller, or look.");
    bits.push("Someone kicked a rupee under the wagon.");
    bits.push("The woodpile by the west cottages hid a coin.");
    bits.push("The tan cat in Oakstead winds around kind feet.");
    bits.push("The little birds by the birdhouse drop a seed if you swing.");
    bits.push("Your mailbox sits by your house. Prove it open. Then put your hand in.");
    bits.push("East of Pell’s table, a loft still keeps the first drawings of the Vale. Walk in.");
  }
  if (world && world !== "meadow" && world !== "keep" && world !== "arena") {
    bits.push("Count the floating digits as you walk. Do not skip one.");
    bits.push("The last hall has a warden. The light will not take you until it falls.");
  }
  if (!bits.length) return null;
  return bits[Math.floor(Date.now() / 28000) % bits.length] ?? null;
}
