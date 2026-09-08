import { replayOcarinaSong, sfx, stopOcarina, setMusicDuck } from "./audio";
import { playerMaxHp } from "./content";
import { writeActive } from "./saves";
import { useGame } from "./store";
import { live } from "./world3d/live";
import { heightAt, vWorld } from "./world3d/field";

export const NOTE_LETTER: Record<string, string> = {
  KeyA: "A",
  KeyS: "S",
  KeyD: "D",
  KeyF: "F",
  KeyG: "G",
  KeyH: "H",
};

export const NOTE_FREQ: Record<string, number> = {
  A: 294,
  S: 349,
  D: 440,
  F: 494,
  G: 587,
  H: 698,
};

export type SongId =
  | "oak"
  | "sun"
  | "horse"
  | "time"
  | "night"
  | "echo"
  | "skip"
  | "lull"
  | "mill"
  | "watch"
  | "rest"
  | "rows"
  | "spark"
  | "purse"
  | "joke"
  | "luck"
  | "shade"
  | "loaf"
  | "root"
  | "lamp"
  | "hour"
  | "fold"
  | "hide"
  | "chalk"
  | "name"
  | "nest"
  | "tide"
  | "breath"
  | "heat"
  | "quiet"
  | "drift";

export const SONGS: {
  id: SongId;
  name: string;
  notes: string;
  teacher: string;
  blurb: string;
}[] = [
  { id: "oak", name: "Oak’s Song", notes: "ASDASD", teacher: "mira", blurb: "Opens gates. Mends a little." },
  { id: "sun", name: "Sun’s Count", notes: "FDAFDA", teacher: "tallow", blurb: "Sometimes fills all your hearts." },
  { id: "horse", name: "Horse’s Measure", notes: "DFGDFG", teacher: "hal", blurb: "Calls the horse to you." },
  { id: "time", name: "Song of Time", notes: "ADFADF", teacher: "bram", blurb: "Fast travel home to the meadow." },
  { id: "night", name: "Night’s Sum", notes: "GHAGHA", teacher: "oak5", blurb: "Turns day to night, or night to morning." },
  { id: "echo", name: "Reed’s Echo", notes: "HFGHFG", teacher: "oak6", blurb: "Sometimes calls rupees out of the grass." },
  { id: "skip", name: "Tess’s Skip", notes: "FHFHFH", teacher: "oak2", blurb: "Makes your feet light for a little while." },
  { id: "lull", name: "Nana’s Lullaby", notes: "DGDGDG", teacher: "nana", blurb: "Lizards go still. Sometimes mends." },
  { id: "mill", name: "Miller’s Wheel", notes: "HADHAD", teacher: "mill-man", blurb: "Spins the mill. Grain-rupees may fall." },
  { id: "watch", name: "Wren’s Watch", notes: "SAFSAF", teacher: "oak0", blurb: "Guards you. The next hit does no harm." },
  { id: "rest", name: "Cole’s Rest", notes: "GFDGFD", teacher: "oak1", blurb: "Saves your file." },
  { id: "rows", name: "Holt’s Rows", notes: "DSADSA", teacher: "holt", blurb: "Sometimes hearts in the dirt." },
  { id: "spark", name: "Brin’s Spark", notes: "AHFAHF", teacher: "oak3", blurb: "A flash of light. Lizards forget you." },
  { id: "purse", name: "Oat’s Purse", notes: "FGAFGA", teacher: "oak4", blurb: "Sometimes shakes coins from the grass." },
  { id: "joke", name: "Pip’s Joke", notes: "SHASHA", teacher: "pip", blurb: "A joke. Lizards might drop a rupee." },
  { id: "luck", name: "Tuck’s Count", notes: "HSHSHS", teacher: "tuck", blurb: "Rupees count twice for a little while." },
  { id: "shade", name: "Cobb’s Shade", notes: "GAGAGA", teacher: "cobb", blurb: "Hides you. Hearts sometimes in the rows." },
  { id: "loaf", name: "Nora’s Loaf", notes: "DADADA", teacher: "nora", blurb: "Sometimes warm hearts by the fountain." },
  { id: "root", name: "Nim’s Root", notes: "FSFFSF", teacher: "nim", blurb: "The moss sometimes gives hearts." },
  { id: "lamp", name: "Ash’s Lamp", notes: "SDSDSD", teacher: "ash", blurb: "The keep remembers light." },
  { id: "hour", name: "Hour’s Call", notes: "HFHFHF", teacher: "willow", blurb: "Opens the Arena of Time." },
  { id: "fold", name: "Pell’s Fold", notes: "AGAGAG", teacher: "pell", blurb: "The count may come home." },
  { id: "hide", name: "Lark’s Hide", notes: "SGSGSG", teacher: "lark", blurb: "You go quiet." },
  { id: "chalk", name: "Sera’s Chalk", notes: "FGFGFG", teacher: "sera", blurb: "Dust of a leftover." },
  { id: "name", name: "Echo’s Name", notes: "HGHGHG", teacher: "echo", blurb: "The boy under the crown." },
  { id: "nest", name: "Nest’s Count", notes: "AFAFAF", teacher: "nest", blurb: "The bird still counts." },
  { id: "tide", name: "Tide’s Pull", notes: "SASASA", teacher: "gossip-lake", blurb: "The water sometimes gives." },
  { id: "breath", name: "Marsh’s Breath", notes: "DHDHDH", teacher: "gossip-marsh", blurb: "Hearts may come up with the mist." },
  { id: "heat", name: "Crater’s Heat", notes: "DFDFDF", teacher: "gossip-crater", blurb: "Coins may come up hot." },
  { id: "quiet", name: "Grave’s Quiet", notes: "GFGFGF", teacher: "gossip-grave", blurb: "Hearts among the stones." },
  { id: "drift", name: "Waste’s Drift", notes: "HAHAHA", teacher: "gossip-waste", blurb: "Coins may ride the sand. Feet go light." },
];

export const TEACH: Record<string, SongId> = Object.fromEntries(SONGS.map((s) => [s.teacher, s.id])) as Record<string, SongId>;

const AURA: Record<SongId, string> = {
  oak: "#c9e070",
  sun: "#f4c060",
  horse: "#e8d48a",
  time: "#7ec8d4",
  night: "#6a4a88",
  echo: "#8ad4a0",
  skip: "#f0c070",
  lull: "#c8b0e0",
  mill: "#d4b07a",
  watch: "#e8e0c8",
  rest: "#a8c8e0",
  rows: "#6aaa48",
  spark: "#f4e080",
  purse: "#4fd86a",
  joke: "#e07070",
  luck: "#c9a227",
  shade: "#3a4a38",
  loaf: "#e8c090",
  root: "#4a7a38",
  lamp: "#f4d060",
  hour: "#c9a227",
  fold: "#efe6d4",
  hide: "#5a6a78",
  chalk: "#d8d0c4",
  name: "#8a9ab8",
  nest: "#c45c48",
  tide: "#3a7a88",
  breath: "#5a9a88",
  heat: "#d47838",
  quiet: "#4a4a58",
  drift: "#c4b48a",
};

function dropRing(
  kind: "coin" | "heart",
  lx: number,
  lz: number,
  n: number,
  spread: number,
  tag: string,
  village = false,
) {
  const p = village ? vWorld(lx, lz) : { x: lx, z: lz };
  for (let i = 0; i < n; i++) {
    const a = i * 1.72 + 0.4;
    const x = p.x + Math.cos(a) * spread;
    const z = p.z + Math.sin(a) * spread;
    live.drops.push({
      id: `${tag}-${Date.now()}-${i}`,
      kind,
      x,
      y: heightAt(x, z) + 0.4,
      z,
      n: 1,
    });
  }
}

function dropHere(kind: "coin" | "heart", n: number, spread: number, tag: string) {
  dropRing(kind, live.x, live.z, n, spread, tag, false);
}

/** Flute loot is rare so cutting grass still matters. */
const SONG_LOOT_CHANCE = 0.15;

function songGivesLoot() {
  return Math.random() < SONG_LOOT_CHANCE;
}

function maybeDropHere(kind: "coin" | "heart", n: number, spread: number, tag: string, yes: string, no: string) {
  if (!songGivesLoot()) {
    live.hint = no;
    return;
  }
  dropHere(kind, n, spread, tag);
  live.hint = yes;
}

function maybeDropRing(
  kind: "coin" | "heart",
  lx: number,
  lz: number,
  n: number,
  spread: number,
  tag: string,
  yes: string,
  no: string,
) {
  if (!songGivesLoot()) {
    live.hint = no;
    return;
  }
  dropRing(kind, lx, lz, n, spread, tag, true);
  live.hint = yes;
}

export function pushNote(letter: string) {
  live.songBuf = (live.songBuf + letter).slice(-16);
}

export function peekSong(letter: string): SongId | null {
  const next = (live.songBuf + letter).slice(-16);
  const known = useGame.getState().songs ?? [];
  for (const s of SONGS) {
    if (!known.includes(s.id)) continue;
    if (next.endsWith(s.notes)) return s.id;
  }
  return null;
}

export function completeSong(id: SongId) {
  const song = SONGS.find((s) => s.id === id);
  if (!song) return;
  live.songBuf = "";
  live.songLock = true;
  live.songOk = song.name;
  live.songAura = { color: AURA[id] ?? "#c9a227", t: 3.2 };
  stopOcarina();
  sfx.songOk();
  const extra = (song.notes + song.notes.slice(-3)).split("");
  replayOcarinaSong(extra, NOTE_FREQ, () => {
    live.songLock = false;
    live.ocarina = false;
    setMusicDuck(false);
    applySong(id);
  });
}

function fillHearts() {
  const g = useGame.getState();
  const max = playerMaxHp(g.xp, g.outfit, g.heartsExtra ?? 0);
  useGame.setState({ hp: max });
}

function applySong(id: SongId) {
  const g = useGame.getState();
  if (id === "oak") {
    live.songOpen = true;
    if (songGivesLoot()) g.healGrass();
    sfx.ok();
    live.hint = "Oak’s Song. The shrine bars listen.";
  } else if (id === "sun") {
    if (songGivesLoot()) {
      fillHearts();
      sfx.heal();
      live.hint = "Sun’s Count. Every heart is full.";
    } else {
      live.hint = "Sun’s Count. The sun stays quiet. Cut grass for a heart.";
    }
  } else if (id === "horse") {
    if (!g.hasHorse) {
      live.hint = "No horse answers yet.";
    } else if (live.mounted) {
      sfx.neigh();
      live.hint = "You're already on her.";
    } else if (live.house || live.cave || live.dungeon || g.currentWorld !== "meadow") {
      live.hint = "She can't hear you here.";
    } else {
      live.horseCall = true;
      sfx.neigh();
      live.hint = "She heard you.";
    }
  } else if (id === "time") {
    sfx.warp();
    live.hint = "The Song of Time. Home.";
    window.setTimeout(() => {
      live.x = 0;
      live.z = 12;
      g.enterWorld("meadow");
    }, 400);
  } else if (id === "night") {
    const dark = Math.sin(live.day * Math.PI * 2) < -0.08;
    live.day = dark ? 0.12 : 0.72;
    sfx.warp();
    live.hint = dark ? "Morning comes." : "Night falls.";
  } else if (id === "echo") {
    if (live.echoCool > 0) {
      live.hint = "The echo is still ringing.";
      return;
    }
    live.echoCool = 32;
    sfx.echo();
    maybeDropHere("coin", 5, 1.6, "echo", "Reed’s Echo shakes rupees from the grass.", "Reed’s Echo. The grass keeps its rupees.");
  } else if (id === "skip") {
    live.skipBoost = 14;
    sfx.skip();
    live.hint = "Tess’s Skip — your feet go light.";
  } else if (id === "lull") {
    if (songGivesLoot()) g.healGrass();
    live.hush = 16;
    sfx.lull();
    live.hint = "Nana’s Lullaby. The lizards go still.";
  } else if (id === "mill") {
    live.millSpin = 20;
    sfx.mill();
    maybeDropRing("coin", 2, -116, 4, 1.8, "mill-song", "The mill turns. Grain-rupees spill.", "The mill turns. No grain falls this time.");
  } else if (id === "watch") {
    live.watch = 22;
    sfx.watch();
    live.hint = "Wren’s Watch. The next strike will miss.";
  } else if (id === "rest") {
    if (songGivesLoot()) g.healGrass();
    writeActive();
    sfx.rest();
    live.hint = "Cole’s Rest. The file is saved.";
  } else if (id === "rows") {
    sfx.rows();
    maybeDropRing("heart", 16, -102, 4, 1.5, "rows", "Holt’s Rows. The garden gives hearts.", "Holt’s Rows. The garden stays still.");
  } else if (id === "spark") {
    live.spark = 8;
    live.hush = Math.max(live.hush, 7);
    sfx.sparkle();
    sfx.flare();
    live.hint = "Brin’s Spark. The lizards blink.";
  } else if (id === "purse") {
    sfx.purse();
    maybeDropRing("coin", 8, -96, 5, 1.7, "purse", "Oat’s Purse. Coins in the grass.", "Oat’s Purse. Nothing shakes loose.");
  } else if (id === "joke") {
    live.joke = 8;
    sfx.joke();
    maybeDropHere("coin", 1, 1.4, "joke", "Pip’s Joke. Even the lizards paid to leave.", "Pip’s Joke. Nobody paid.");
  } else if (id === "luck") {
    live.lucky = 28;
    sfx.luck();
    live.hint = "Tuck’s Count. Rupees count twice.";
  } else if (id === "shade") {
    live.hush = Math.max(live.hush, 14);
    sfx.shade();
    maybeDropRing("heart", -28, -82, 3, 1.4, "shade", "Cobb’s Shade. You walk unseen.", "Cobb’s Shade. You walk unseen.");
  } else if (id === "loaf") {
    sfx.loaf();
    maybeDropRing("heart", 18, -70, 3, 1.4, "loaf", "Nora’s Loaf. Warm hearts by the fountain.", "Nora’s Loaf. The oven stays cold.");
  } else if (id === "root") {
    sfx.root();
    maybeDropHere("heart", 4, 1.6, "root", "Nim’s Root. The moss gives hearts.", "Nim’s Root. The moss stays quiet.");
  } else if (id === "lamp") {
    live.spark = Math.max(live.spark, 10);
    sfx.lamp();
    maybeDropHere("heart", 3, 1.3, "lamp", "Ash’s Lamp. The keep remembers light.", "Ash’s Lamp. The keep stays dark.");
  } else if (id === "hour") {
    sfx.gong();
    sfx.warp();
    live.hint = "Hour’s Call. The Arena of Time opens.";
    window.setTimeout(() => useGame.getState().enterWorld("arena"), 900);
  } else if (id === "fold") {
    sfx.fold();
    maybeDropRing("coin", 10.2, -84.2, 4, 1.5, "fold", "Pell’s Fold. The count comes home.", "Pell’s Fold. The count stays put.");
  } else if (id === "hide") {
    live.hush = Math.max(live.hush, 16);
    sfx.hide();
    live.hint = "Lark’s Hide. You go quiet.";
  } else if (id === "chalk") {
    sfx.chalk();
    maybeDropHere("coin", 4, 1.4, "chalk", "Sera’s Chalk. Dust of a leftover.", "Sera’s Chalk. Only dust.");
  } else if (id === "name") {
    sfx.name();
    live.hush = Math.max(live.hush, 10);
    maybeDropHere("heart", 3, 1.2, "name", "Echo’s Name. The boy under the crown.", "Echo’s Name. The boy under the crown.");
  } else if (id === "nest") {
    sfx.tweet();
    sfx.nest();
    maybeDropHere("coin", 3, 1.1, "nest", "Nest’s Count. The bird still counts.", "Nest’s Count. The nest is empty.");
  } else if (id === "tide") {
    live.skipBoost = Math.max(live.skipBoost, 14);
    sfx.tide();
    maybeDropHere("coin", 3, 1.6, "tide", "Tide’s Pull. The water gives.", "Tide’s Pull. The water keeps its coins.");
  } else if (id === "breath") {
    sfx.breath();
    maybeDropHere("heart", 3, 1.4, "breath", "Marsh’s Breath. Hearts in the mist.", "Marsh’s Breath. Only mist.");
  } else if (id === "heat") {
    sfx.heat();
    maybeDropHere("coin", 4, 1.5, "heat", "Crater’s Heat. Coins come up hot.", "Crater’s Heat. Nothing comes up.");
  } else if (id === "quiet") {
    live.hush = Math.max(live.hush, 12);
    sfx.quiet();
    maybeDropHere("heart", 3, 1.4, "quiet", "Grave’s Quiet. The lizards forget.", "Grave’s Quiet. The lizards forget.");
  } else if (id === "drift") {
    live.skipBoost = Math.max(live.skipBoost, 12);
    sfx.drift();
    maybeDropHere("coin", 4, 1.6, "drift", "Waste’s Drift. Coins ride the sand.", "Waste’s Drift. Only sand.");
  }
}
