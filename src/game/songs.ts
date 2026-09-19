import { replayOcarinaSong, sfx, stopOcarina, setMusicDuck } from "./audio";
import { playerMaxHp } from "./content";
import { useGame } from "./store";
import { live } from "./world3d/live";
import { CLOCK_WOOD } from "./world3d/field";
import { TEMPLE_GATES } from "./world3d/village";

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

export type SongId = "oak" | "sun" | "horse" | "time" | "lull" | "storm";

export const SONGS: {
  id: SongId;
  name: string;
  notes: string;
  beats: number[];
  teacher: string;
  blurb: string;
}[] = [
  { id: "oak", name: "Oak’s Song", notes: "ADGFDSAD", beats: [1, 1, 1.5, 0.5, 1, 1, 0.5, 2], teacher: "mira", blurb: "The vale knows you. Doors listen." },
  { id: "sun", name: "Sun’s Song", notes: "DGHGFDSA", beats: [0.75, 0.75, 1.5, 0.75, 0.75, 1, 0.75, 2], teacher: "tallow", blurb: "Turns night to morning. Fills hearts." },
  { id: "horse", name: "Horse’s Song", notes: "SDFGDSAS", beats: [0.5, 0.5, 0.5, 1.5, 0.75, 0.75, 1, 2], teacher: "hal", blurb: "Calls the horse, wherever she is." },
  { id: "time", name: "Song of Time", notes: "ASDFGDSA", beats: [1, 1, 1, 1, 1.5, 1, 1, 2], teacher: "bram", blurb: "Takes you home. Opens the old clock." },
  { id: "lull", name: "Nana’s Lullaby", notes: "DASADGFD", beats: [1.5, 1, 1, 1, 1.5, 1, 1, 2], teacher: "nana", blurb: "Lizards sleep. People remember you." },
  { id: "storm", name: "Song of Storms", notes: "ADFHGDSA", beats: [0.5, 0.5, 0.5, 1, 1, 1, 1, 2], teacher: "willow", blurb: "Rain. The sealed crag opens." },
];

export const TEACH: Record<string, SongId> = Object.fromEntries(SONGS.map((s) => [s.teacher, s.id])) as Record<string, SongId>;

export function notePhrase(notes: string) {
  return notes.split("").join(" ");
}

const AURA: Record<SongId, string> = {
  oak: "#c9e070",
  sun: "#f4c060",
  horse: "#e8d48a",
  time: "#7ec8d4",
  lull: "#c8b0e0",
  storm: "#6a88c8",
};

/** Flute loot is rare so cutting grass still matters. */
const SONG_LOOT_CHANCE = 0.15;

function songGivesLoot() {
  return Math.random() < SONG_LOOT_CHANCE;
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
  replayOcarinaSong(song.notes.split(""), NOTE_FREQ, () => {
    live.songLock = false;
    live.ocarina = false;
    setMusicDuck(false);
    applySong(id);
  }, song.beats);
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
    const mouth = TEMPLE_GATES.find((t) => Math.hypot(live.x - t.x, live.z - t.z) < 6);
    if (mouth && !live.house && !live.gateUse) {
      live.dungeonExitAt = { x: mouth.x, z: mouth.z };
      live.gateUse = { to: mouth.world, mx: mouth.x, mz: mouth.z, sx: 0, sz: 16.2, t: 0, dir: "in" };
      live.hint = "Oak’s Song. The door knows you.";
    } else {
      live.hint = "Oak’s Song. The vale knows you.";
    }
  } else if (id === "sun") {
    const dark = live.dusk > 0.55;
    live.day = dark ? 0.12 : 0.72;
    fillHearts();
    sfx.heal();
    live.hint = dark ? "Morning. Hearts filled." : "Night. Hearts filled.";
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
    if (Math.hypot(live.x - CLOCK_WOOD.x, live.z - CLOCK_WOOD.z) < 10) {
      sfx.warp();
      live.hint = "The clock opened.";
      live.songOpen = true;
    } else {
      sfx.warp();
      live.hint = "Song of Time. Home.";
      window.setTimeout(() => {
        live.x = 0;
        live.z = 12;
        g.enterWorld("meadow");
      }, 400);
    }
  } else if (id === "lull") {
    if (songGivesLoot()) g.healGrass();
    live.hush = 18;
    sfx.lull();
    live.hint = "Nana’s Lullaby. The lizards sleep.";
  } else if (id === "storm") {
    live.rainT = 22;
    sfx.ok();
    const crag = TEMPLE_GATES.find((t) => t.bomb);
    if (crag && Math.hypot(live.x - crag.x, live.z - crag.z) < 12) {
      g.setQuest("bombRock", 1);
      live.hint = "The rock broke in the rain.";
    } else {
      live.hint = "Song of Storms. The sky listens.";
    }
  }
}
