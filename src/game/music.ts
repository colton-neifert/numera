import { live } from "./world3d/live";

type Role = "lead" | "horn" | "pad" | "bass" | "harp" | "drum" | "chime" | "choir" | "pluck";
type Note = { t: number; f: number; d: number; role: Role; g?: number };
type Bed =
  | "title"
  | "field"
  | "night"
  | "town"
  | "forest"
  | "water"
  | "battle"
  | "boss"
  | "dungeon"
  | "keep"
  | "cook"
  | "chamber"
  | "ride"
  | "shop"
  | "ending"
  | "files"
  | "none";

const C3 = 130.81, D3 = 146.83, E3 = 164.81, F3 = 174.61, Fs3 = 185.0, G3 = 196.0, A3 = 220.0, B3 = 246.94;
const C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23, G4 = 392.0, A4 = 440.0, B4 = 493.88;
const C5 = 523.25, D5 = 587.33, E5 = 659.25, F5 = 698.46, G5 = 783.99, A5 = 880.0;
const Fs4 = 369.99, Fs5 = 739.99;

type Tune = [number, number, number][];

/** Green Meadow — a real tune you can hum: walk up, sit, then come home. */
const FIELD_TUNE: Tune = [
  [0, C4, 0.5], [0.5, D4, 0.5], [1, E4, 1], [2, G4, 0.5], [2.5, A4, 1.5],
  [4, G4, 0.5], [4.5, E4, 0.5], [5, D4, 1], [6, C4, 2],
  [8, E4, 0.5], [8.5, G4, 0.5], [9, A4, 1], [10, C5, 0.5], [10.5, A4, 1.5],
  [12, G4, 0.5], [12.5, E4, 0.5], [13, D4, 0.5], [13.5, E4, 0.5], [14, C4, 2],
  [16, F4, 0.5], [16.5, A4, 0.5], [17, C5, 1], [18, A4, 0.5], [18.5, G4, 1.5],
  [20, E4, 0.5], [20.5, G4, 0.5], [21, B4, 1], [22, G4, 0.5], [22.5, A4, 1.5],
  [24, C5, 0.5], [24.5, G4, 0.5], [25, E4, 1], [26, D4, 0.5], [26.5, E4, 0.5], [27, C4, 1],
  [28, D4, 0.5], [28.5, F4, 0.5], [29, E4, 1], [30, D4, 0.5], [30.5, C4, 1.5],
];

const NIGHT_TUNE: Tune = [
  [0, A3, 1], [1, C4, 1], [2, E4, 1.5], [3.5, D4, 0.5],
  [4, C4, 1], [5, A3, 2], [7, G3, 1],
  [8, A3, 0.5], [8.5, C4, 0.5], [9, E4, 1], [10, G4, 1.5], [11.5, E4, 0.5],
  [12, D4, 1], [13, C4, 1], [14, A3, 2],
  [16, E4, 1], [17, G4, 1], [18, A4, 1.5], [19.5, G4, 0.5],
  [20, E4, 1], [21, D4, 1], [22, C4, 1], [23, A3, 1],
  [24, C4, 0.5], [24.5, E4, 0.5], [25, G4, 1], [26, E4, 1], [27, D4, 1], [28, C4, 1], [29, A3, 3],
];

const TOWN_TUNE: Tune = [
  [0, G4, 0.5], [0.5, E4, 0.25], [0.75, G4, 0.25], [1, A4, 0.5], [1.5, G4, 0.5],
  [2, E4, 0.5], [2.5, D4, 0.5], [3, C4, 1],
  [4, E4, 0.5], [4.5, G4, 0.5], [5, C5, 0.5], [5.5, A4, 0.5],
  [6, G4, 0.5], [6.5, E4, 0.5], [7, D4, 1],
  [8, C4, 0.25], [8.25, D4, 0.25], [8.5, E4, 0.5], [9, G4, 0.5], [9.5, A4, 0.5],
  [10, C5, 1], [11, A4, 0.5], [11.5, G4, 0.5],
  [12, E4, 0.5], [12.5, C4, 0.5], [13, D4, 0.5], [13.5, E4, 0.5], [14, C4, 2],
];

const DUNGEON_TUNE: Tune = [
  [0, D3, 1.5], [1.5, F3, 1.5], [3, A3, 2],
  [5, G3, 1], [6, F3, 1], [7, E3, 1],
  [8, D3, 0.5], [8.5, F3, 0.5], [9, A3, 1], [10, C4, 1.5], [11.5, A3, 0.5],
  [12, G3, 1], [13, A3, 1], [14, F3, 2],
  [16, A3, 1], [17, C4, 1], [18, D4, 1.5], [19.5, C4, 0.5],
  [20, A3, 1], [21, G3, 1], [22, F3, 1], [23, D3, 1],
  [24, F3, 1], [25, A3, 1], [26, C4, 1], [27, A3, 1], [28, G3, 1], [29, F3, 1], [30, D3, 2],
];

const BATTLE_TUNE: Tune = [
  [0, A3, 0.25], [0.25, C4, 0.25], [0.5, E4, 0.5], [1, A4, 0.5], [1.5, G4, 0.25], [1.75, A4, 0.25],
  [2, E4, 0.5], [2.5, C4, 0.5], [3, D4, 0.5], [3.5, E4, 0.5],
  [4, A3, 0.25], [4.25, C4, 0.25], [4.5, E4, 0.5], [5, A4, 0.5], [5.5, C5, 1],
  [6.5, B4, 0.5], [7, A4, 1],
  [8, E4, 0.5], [8.5, G4, 0.5], [9, A4, 0.5], [9.5, C5, 0.5],
  [10, B4, 0.5], [10.5, A4, 0.5], [11, G4, 0.5], [11.5, E4, 0.5],
  [12, A4, 0.25], [12.25, C5, 0.25], [12.5, E5, 0.5], [13, C5, 0.5], [13.5, A4, 0.5],
  [14, G4, 0.5], [14.5, E4, 0.5], [15, A3, 1],
];

const KEEP_TUNE: Tune = [
  [0, C4, 1.5], [1.5, E4, 1.5], [3, G4, 2],
  [5, F4, 1], [6, E4, 1], [7, D4, 1],
  [8, C4, 1], [9, G3, 1], [10, A3, 1.5], [11.5, C4, 0.5],
  [12, E4, 1], [13, D4, 1], [14, C4, 2],
  [16, G4, 1.5], [17.5, E4, 1.5], [19, C5, 2],
  [21, A4, 1], [22, G4, 1], [23, E4, 1],
  [24, F4, 1], [25, E4, 1], [26, D4, 1], [27, E4, 1], [28, C4, 4],
];

const FILES_TUNE: Tune = [
  [0, A3, 3], [3, E4, 2.5], [5.5, D4, 2], [7.5, C4, 2.5],
  [10, E4, 2], [12, A4, 3], [15, G4, 2], [17, E4, 2.5],
  [19.5, D4, 2], [21.5, C4, 2], [23.5, A3, 4.5],
  [28, E3, 2], [30, A3, 4],
];

const WATER_TUNE: Tune = [
  [0, E4, 1], [1, G4, 1], [2, A4, 1.5], [3.5, G4, 0.5],
  [4, E4, 1], [5, D4, 1], [6, C4, 2],
  [8, G4, 0.5], [8.5, A4, 0.5], [9, C5, 1], [10, A4, 1], [11, G4, 1],
  [12, E4, 1], [13, G4, 1], [14, A4, 2],
  [16, C5, 1], [17, E5, 1], [18, D5, 1.5], [19.5, C5, 0.5],
  [20, A4, 1], [21, G4, 1], [22, E4, 1], [23, C4, 1],
  [24, D4, 1], [25, E4, 1], [26, G4, 1], [27, E4, 1], [28, D4, 1], [29, C4, 3],
];

const THEME = FIELD_TUNE;

function tuneFor(kind: Bed): Tune {
  if (kind === "night") return NIGHT_TUNE;
  if (kind === "town" || kind === "shop" || kind === "cook") return TOWN_TUNE;
  if (kind === "dungeon") return DUNGEON_TUNE;
  if (kind === "battle" || kind === "boss" || kind === "ride") return BATTLE_TUNE;
  if (kind === "keep" || kind === "chamber") return KEEP_TUNE;
  if (kind === "files") return FILES_TUNE;
  if (kind === "water") return WATER_TUNE;
  if (kind === "forest") return NIGHT_TUNE.map(([t, f, d]) => [t, f * 1.122, d] as [number, number, number]);
  return FIELD_TUNE;
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicBus: GainNode | null = null;
let sfxBus: GainNode | null = null;
let talkBus: GainNode | null = null;
let verb: DelayNode | null = null;
let verbGain: GainNode | null = null;
let hip: BiquadFilterNode | null = null;
let air: BiquadFilterNode | null = null;

let musicMix = 1;
let sfxMix = 1;
let talkMix = 1;
let masterMix = 1;
let muted = false;
let ducked = false;
let hidden = false;
let bed: Bed = "none";
let nextBed: Bed | null = null;
let timer: number | null = null;
const voices: AudioScheduledSourceNode[] = [];
let phraseGen = 0;
let waterAmt = 0;
let fireAmt = 0;
let nightAmt = 0;
let battleAmt = 0;
let ambTimer: number | null = null;
let fanfareUntil = 0;
let ceremonyUntil = 0;
let dripTimers: number[] = [];

export type MusicScene = {
  bed: Bed;
  night?: number;
  water?: number;
  fire?: number;
  indoor?: boolean;
  combat?: number;
};

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor({ latencyHint: "interactive" });
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function ensureGraph(audio: AudioContext) {
  if (master) return;
  master = audio.createGain();
  musicBus = audio.createGain();
  sfxBus = audio.createGain();
  talkBus = audio.createGain();
  hip = audio.createBiquadFilter();
  hip.type = "highpass";
  hip.frequency.value = 70;
  hip.Q.value = 0.4;
  air = audio.createBiquadFilter();
  air.type = "lowpass";
  air.frequency.value = 5200;
  air.Q.value = 0.35;
  verb = audio.createDelay(1.2);
  verb.delayTime.value = 0.22;
  verbGain = audio.createGain();
  verbGain.gain.value = 0.22;
  const fb = audio.createGain();
  fb.gain.value = 0.28;
  const verbLp = audio.createBiquadFilter();
  verbLp.type = "lowpass";
  verbLp.frequency.value = 2400;
  musicBus.connect(hip);
  hip.connect(air);
  air.connect(master);
  air.connect(verb);
  verb.connect(verbLp);
  verbLp.connect(verbGain);
  verbGain.connect(master);
  verbLp.connect(fb);
  fb.connect(verb);
  sfxBus.connect(master);
  talkBus.connect(master);
  master.connect(audio.destination);
  applyMix(audio.currentTime);
}

function themeVol() {
  const hide = hidden ? 0.08 : 1;
  const duck = ducked || (typeof performance !== "undefined" && performance.now() < fanfareUntil) ? 0.12 : 1;
  return Math.max(0.0002, masterMix * musicMix * hide * duck * (muted ? 0 : 1));
}

function applyMix(now: number) {
  if (!master || !musicBus || !sfxBus || !talkBus || !ctx) return;
  const t = now ?? ctx.currentTime;
  musicBus.gain.cancelScheduledValues(t);
  musicBus.gain.setTargetAtTime(themeVol(), t, 0.04);
  sfxBus.gain.setTargetAtTime(muted || hidden ? 0.0002 : masterMix * sfxMix * (hidden ? 0.15 : 1), t, 0.03);
  talkBus.gain.setTargetAtTime(muted ? 0.0002 : masterMix * talkMix, t, 0.03);
  master.gain.setTargetAtTime(muted ? 0.0002 : 1, t, 0.03);
}

export function getSfxBus(): GainNode | null {
  const audio = ac();
  if (!audio) return null;
  ensureGraph(audio);
  return sfxBus;
}

/** Echoey cave drip: ping, splash, then two delayed repeats. */
export function playCaveDrip(wet = 1) {
  if (muted) return;
  const audio = ac();
  if (!audio) return;
  ensureGraph(audio);
  const dest = sfxBus ?? audio.destination;
  const now = audio.currentTime;
  const ping = 1180 + Math.random() * 1100;
  const g0 = 0.055 * wet * (0.7 + Math.random() * 0.45);
  const tap = (freq: number, when: number, dur: number, gain: number, type: OscillatorType, lp: number) => {
    const osc = audio.createOscillator();
    const g = audio.createGain();
    const f = audio.createBiquadFilter();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);
    osc.frequency.exponentialRampToValueAtTime(Math.max(80, freq * 0.45), when + dur);
    f.type = "lowpass";
    f.frequency.value = lp;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), when + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(f);
    f.connect(g);
    g.connect(dest);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  };
  tap(ping, now, 0.16, g0, "sine", 4200);
  tap(210 + Math.random() * 80, now + 0.07, 0.22, g0 * 0.55, "sine", 900);
  const delay = audio.createDelay(0.9);
  delay.delayTime.value = 0.28;
  const dg = audio.createGain();
  dg.gain.value = 0.42 * wet;
  const fb = audio.createGain();
  fb.gain.value = 0.38 * wet;
  const lp = audio.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 1800;
  const pingOsc = audio.createOscillator();
  const pg = audio.createGain();
  pingOsc.type = "sine";
  pingOsc.frequency.value = ping * 0.92;
  pg.gain.setValueAtTime(g0 * 0.55, now);
  pg.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
  pingOsc.connect(pg);
  pg.connect(delay);
  delay.connect(lp);
  lp.connect(dg);
  dg.connect(dest);
  lp.connect(fb);
  fb.connect(delay);
  pingOsc.start(now);
  pingOsc.stop(now + 0.2);
  window.setTimeout(() => {
    delay.disconnect();
    dg.disconnect();
    fb.disconnect();
    lp.disconnect();
  }, 1400);
}

export function getTalkBus(): GainNode | null {
  const audio = ac();
  if (!audio) return null;
  ensureGraph(audio);
  return talkBus;
}

export function setMusicMix(v: number) {
  musicMix = Math.max(0, Math.min(1, v * v));
  if (ctx) applyMix(ctx.currentTime);
}
export function setSfxMix(v: number) {
  sfxMix = Math.max(0, Math.min(1, v * v));
  if (ctx) applyMix(ctx.currentTime);
}
export function setTalkMix(v: number) {
  talkMix = Math.max(0, Math.min(1, v * v));
  if (ctx) applyMix(ctx.currentTime);
}
export function setMasterMix(v: number) {
  masterMix = Math.max(0, Math.min(1, v * v));
  if (ctx) applyMix(ctx.currentTime);
}
export function getMusicMix() {
  return Math.sqrt(musicMix);
}
export function getSfxMix() {
  return Math.sqrt(sfxMix);
}
export function getTalkMix() {
  return Math.sqrt(talkMix);
}

export function setMuted(value: boolean) {
  muted = value;
  if (muted) stopBed();
  else if (bed !== "none") scheduleBed(bed);
  if (ctx) applyMix(ctx.currentTime);
}

export function setMusicDuck(on: boolean) {
  ducked = on;
  if (ctx) applyMix(ctx.currentTime);
}

export function setHidden(on: boolean) {
  hidden = on;
  const audio = ac();
  if (on) {
    if (audio && audio.state === "running") void audio.suspend();
  } else {
    if (audio && audio.state === "suspended") void audio.resume();
  }
  if (ctx) applyMix(ctx.currentTime);
}

export function unlockMusic() {
  const audio = ac();
  if (!audio) return;
  ensureGraph(audio);
  if (bed !== "none" && voices.length === 0 && !muted) scheduleBed(bed);
  startAmbience();
}

function stopBed() {
  if (timer != null) {
    window.clearTimeout(timer);
    timer = null;
  }
  for (const id of dripTimers) window.clearTimeout(id);
  dripTimers = [];
  for (const v of voices) {
    try {
      v.stop();
    } catch {
      /* already stopped */
    }
  }
  voices.length = 0;
}

function spawn(
  audio: AudioContext,
  dest: AudioNode,
  freq: number,
  start: number,
  dur: number,
  role: Role,
  gain: number,
) {
  const g = audio.createGain();
  g.gain.setValueAtTime(0.0001, start);
  const atk = role === "pad" || role === "choir" ? Math.min(0.45, dur * 0.22) : role === "harp" || role === "pluck" || role === "chime" || role === "lead" ? 0.012 : 0.04;
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), start + atk);
  if (role === "lead" || role === "harp" || role === "pluck") {
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain * 0.35), start + Math.min(dur, 0.28));
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur + 0.08);
  } else {
    g.gain.setValueAtTime(Math.max(0.0002, gain * (role === "pad" ? 0.85 : 0.92)), start + dur * 0.62);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  }

  if (role === "drum") {
    const src = audio.createBufferSource();
    src.buffer = noiseBuf(audio);
    const f = audio.createBiquadFilter();
    const snare = freq > 400;
    f.type = snare ? "highpass" : "lowpass";
    f.frequency.value = snare ? 1600 : 160;
    src.connect(f);
    f.connect(g);
    g.connect(dest);
    src.start(start);
    src.stop(start + dur + 0.04);
    voices.push(src);
    if (!snare) {
      const th = audio.createOscillator();
      th.type = "sine";
      th.frequency.setValueAtTime(freq, start);
      th.frequency.exponentialRampToValueAtTime(38, start + dur);
      const tg = audio.createGain();
      tg.gain.setValueAtTime(gain * 1.2, start);
      tg.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      th.connect(tg);
      tg.connect(dest);
      th.start(start);
      th.stop(start + dur + 0.03);
      voices.push(th);
    }
    return;
  }

  const osc = audio.createOscillator();
  const f = audio.createBiquadFilter();
  f.type = "lowpass";
  if (role === "lead") {
    osc.type = "triangle";
    f.frequency.value = 2600;
    const harm = audio.createOscillator();
    harm.type = "sine";
    harm.frequency.value = freq * 2;
    const hg = audio.createGain();
    hg.gain.value = 0.11;
    harm.connect(hg);
    hg.connect(f);
    harm.start(start);
    harm.stop(start + dur + 0.04);
    voices.push(harm);
  } else if (role === "horn") {
    osc.type = "triangle";
    f.frequency.value = 1400;
  } else if (role === "pad" || role === "choir") {
    osc.type = "sawtooth";
    f.frequency.value = role === "choir" ? 1100 : 900;
    const det = audio.createOscillator();
    det.type = "sawtooth";
    det.frequency.value = freq * 1.007;
    const dg = audio.createGain();
    dg.gain.value = 0.55;
    det.connect(dg);
    dg.connect(f);
    det.start(start);
    det.stop(start + dur + 0.05);
    voices.push(det);
    if (role === "choir") {
      const fifth = audio.createOscillator();
      fifth.type = "sine";
      fifth.frequency.value = freq * 1.5;
      const fg = audio.createGain();
      fg.gain.value = 0.22;
      fifth.connect(fg);
      fg.connect(f);
      fifth.start(start);
      fifth.stop(start + dur + 0.05);
      voices.push(fifth);
    }
  } else if (role === "bass") {
    osc.type = "sine";
    f.frequency.value = 420;
    const body = audio.createOscillator();
    body.type = "triangle";
    body.frequency.value = freq;
    const bg = audio.createGain();
    bg.gain.value = 0.45;
    body.connect(bg);
    bg.connect(g);
    body.start(start);
    body.stop(start + dur + 0.04);
    voices.push(body);
  } else if (role === "harp" || role === "pluck") {
    osc.type = "triangle";
    f.frequency.value = 2800;
    g.gain.exponentialRampToValueAtTime(0.0001, start + Math.min(dur, 1.4));
  } else if (role === "chime") {
    osc.type = "sine";
    f.frequency.value = 5200;
    const h = audio.createOscillator();
    h.type = "sine";
    h.frequency.value = freq * 2.01;
    const hg = audio.createGain();
    hg.gain.value = 0.22;
    h.connect(hg);
    hg.connect(g);
    h.start(start);
    h.stop(start + dur + 0.05);
    voices.push(h);
  } else {
    osc.type = "sine";
    f.frequency.value = 1800;
  }
  osc.frequency.value = freq;
  osc.connect(f);
  f.connect(g);
  g.connect(dest);
  osc.start(start);
  osc.stop(start + dur + 0.05);
  voices.push(osc);
}

let nbuf: AudioBuffer | null = null;
function noiseBuf(audio: AudioContext) {
  if (nbuf) return nbuf;
  nbuf = audio.createBuffer(1, Math.floor(audio.sampleRate * 0.28), audio.sampleRate);
  const d = nbuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return nbuf;
}

function chords(kind: Bed): number[] {
  if (kind === "battle" || kind === "boss") return [A3, C4, E3, A3, F3, G3, A3, E3];
  if (kind === "dungeon") return [D3, F3, A3 * 0.5, D3, C3, F3, G3, D3];
  if (kind === "keep" || kind === "chamber") return [C3, G3, A3, F3, C3, E3, G3, C3];
  if (kind === "night") return [A3, F3, C4, G3, A3, E3, D3, E3];
  if (kind === "files") return [A3, E3, F3, C4, A3, D3, E3, A3];
  if (kind === "water") return [A3, E3, F3, G3, A3, C4, G3, E3];
  if (kind === "town" || kind === "shop") return [C3, G3, A3, F3, C3, E3, F3, G3];
  return [C3, G3, A3, F3, C3, E3, F3, G3];
}

function arrange(kind: Bed): { bpm: number; notes: Note[] } {
  const n: Note[] = [];
  const night = kind === "night";
  const bpm = kind === "title" ? 88 : kind === "files" ? 64 : kind === "battle" ? 132 : kind === "boss" ? 108 : kind === "night" ? 58 : kind === "cook" ? 84 : kind === "dungeon" ? 70 : kind === "keep" || kind === "chamber" ? 66 : kind === "town" || kind === "shop" ? 100 : kind === "forest" ? 88 : kind === "water" ? 92 : kind === "ending" ? 80 : 104;
  const roots = chords(kind);
  const bars = kind === "title" ? 12 : 8;
  for (let b = 0; b < bars; b++) {
    const r = roots[b % 8]!;
    const t0 = b * 4;
    const padG = kind === "battle" ? 0.018 : night ? 0.016 : 0.014;
    n.push({ t: t0, f: r * 2, d: 3.6, role: kind === "keep" || kind === "chamber" ? "choir" : "pad", g: padG });
    if (kind !== "night" && kind !== "water" && kind !== "chamber" && kind !== "files") {
      n.push({ t: t0, f: r, d: 1.8, role: "bass", g: 0.05 });
      n.push({ t: t0 + 2, f: r * 1.5, d: 1.6, role: "bass", g: 0.038 });
    } else {
      n.push({ t: t0, f: r, d: 3.4, role: "bass", g: 0.03 });
    }
    if (kind === "battle" || kind === "boss" || kind === "ride") {
      n.push({ t: t0, f: 52, d: 0.14, role: "drum", g: 0.08 });
      n.push({ t: t0 + 1, f: 1800, d: 0.08, role: "drum", g: 0.045 });
      n.push({ t: t0 + 2, f: 52, d: 0.14, role: "drum", g: 0.07 });
      n.push({ t: t0 + 3, f: 1800, d: 0.08, role: "drum", g: 0.04 });
      if (kind === "boss" || battleAmt > 0.55) {
        n.push({ t: t0 + 0.5, f: 52, d: 0.08, role: "drum", g: 0.04 });
        n.push({ t: t0 + 2.5, f: 1600, d: 0.06, role: "drum", g: 0.03 });
      }
    } else if (kind === "field" || kind === "town") {
      n.push({ t: t0 + 2, f: 1800, d: 0.05, role: "drum", g: 0.016 });
    } else if (kind === "cook") {
      n.push({ t: t0 + 2.5, f: 1400, d: 0.04, role: "drum", g: 0.012 });
    }
    if (kind === "forest" && b % 2 === 1) n.push({ t: t0 + 1.5, f: A5, d: 1.6, role: "chime", g: 0.012 });
    if (kind === "water" || (kind === "field" && waterAmt > 0.35)) {
      n.push({ t: t0 + 0.75, f: A4, d: 0.5, role: "harp", g: 0.02 });
      n.push({ t: t0 + 2.25, f: D5, d: 0.7, role: "chime", g: 0.014 });
    }
    if (kind === "night") {
      n.push({ t: t0 + 1.2, f: G5, d: 1.8, role: "chime", g: 0.01 });
    }
  }

  const leadRole: Role = kind === "files" || kind === "keep" || kind === "chamber" ? "horn" : kind === "town" || kind === "shop" || kind === "cook" || kind === "water" ? "harp" : "lead";
  const leadG = kind === "files" ? 0.028 : kind === "battle" ? 0.058 : kind === "title" ? 0.062 : night ? 0.038 : 0.055;
  const delay = kind === "title" ? 4 : 0;
  const scale = kind === "battle" || kind === "boss" ? 0.72 : 1;
  const melody = kind === "title" ? FIELD_TUNE : tuneFor(kind);
  for (const [t, f, d] of melody) {
    n.push({ t: delay + t * scale, f, d: d * (night ? 1.15 : 1), role: leadRole, g: leadG });
  }
  if (kind === "files") {
    n.push({ t: 0, f: A3, d: 10, role: "choir", g: 0.012 });
    n.push({ t: 4, f: E4, d: 8, role: "pad", g: 0.01 });
  }
  if (kind === "title") {
    n.push({ t: 0, f: C3, d: 7.5, role: "choir", g: 0.018 });
    n.push({ t: 2, f: G3, d: 6, role: "pad", g: 0.014 });
    n.push({ t: 4.5, f: C4, d: 0.8, role: "harp", g: 0.028 });
    n.push({ t: 5.4, f: E4, d: 0.8, role: "harp", g: 0.026 });
    n.push({ t: 6.3, f: G4, d: 1.2, role: "harp", g: 0.028 });
    n.push({ t: 34, f: C5, d: 2.4, role: "horn", g: 0.036 });
  }
  if (kind === "ending") {
    n.push({ t: 30, f: C5, d: 4, role: "choir", g: 0.028 });
    n.push({ t: 30, f: E5, d: 4, role: "horn", g: 0.024 });
  }
  if (kind === "cook") {
    n.push({ t: 0.5, f: G4, d: 0.3, role: "pluck", g: 0.026 });
    n.push({ t: 1.5, f: C5, d: 0.3, role: "pluck", g: 0.022 });
    n.push({ t: 4.5, f: E4, d: 0.3, role: "pluck", g: 0.022 });
  }
  if (kind === "chamber") {
    n.push({ t: 0, f: C4, d: 6, role: "choir", g: 0.022 });
    n.push({ t: 8, f: G4, d: 6, role: "choir", g: 0.018 });
  }
  return { bpm, notes: n };
}

function phraseSec(kind: Bed) {
  const { bpm, notes } = arrange(kind);
  let max = 8;
  for (const n of notes) max = Math.max(max, n.t + n.d);
  return { bpm, notes, dur: (max * 60) / bpm };
}

function scheduleBed(name: Bed) {
  if (muted || name === "none") return;
  const audio = ac();
  if (!audio) return;
  ensureGraph(audio);
  if (!musicBus) return;
  const spec = phraseSec(name);
  const beat = 60 / spec.bpm;
  const start = audio.currentTime + 0.03;
  const gScale = (name === "battle" || name === "boss" ? 1.05 : 0.92) * (0.82 + battleAmt * 0.25);
  for (const n of spec.notes) {
    spawn(audio, musicBus, n.f, start + n.t * beat, Math.max(0.06, n.d * beat), n.role, (n.g ?? 0.03) * gScale);
  }
  if (name === "dungeon") {
    const dripT = [0.9, 2.4, 4.0, 5.8, 7.6, 10.2, 12.4];
    for (const t of dripT) {
      dripTimers.push(window.setTimeout(() => playCaveDrip(1), t * 1000));
    }
  }
  if (waterAmt > 0.15 && name !== "water" && name !== "battle") {
    spawn(audio, musicBus, A4, start + 0.8, 1.4, "harp", 0.016 * waterAmt);
    spawn(audio, musicBus, D5, start + 2.4, 1.8, "chime", 0.012 * waterAmt);
  }
  if (fireAmt > 0.2 && name !== "cook") {
    spawn(audio, musicBus, D4, start + 0.4, 2.2, "pluck", 0.014 * fireAmt);
  }
  const overlap = 1.4;
  const wait = Math.max(0.8, spec.dur - overlap);
  const gen = ++phraseGen;
  timer = window.setTimeout(() => {
    if (gen !== phraseGen) return;
    voices.length = 0;
    const play = nextBed ?? bed;
    nextBed = null;
    bed = play;
    if (bed !== "none" && !muted) scheduleBed(bed);
  }, wait * 1000);
}

export function playTheme(name: Bed | "none") {
  if (name === "none") {
    bed = "none";
    nextBed = null;
    phraseGen += 1;
    stopBed();
    return;
  }
  if (name === bed) return;
  phraseGen += 1;
  nextBed = null;
  stopBed();
  bed = name;
  if (!muted) scheduleBed(name);
}

export function setScene(s: MusicScene) {
  nightAmt = s.night ?? 0;
  waterAmt = s.water ?? 0;
  fireAmt = s.fire ?? 0;
  battleAmt = s.combat ?? 0;
  let want = s.bed;
  if (want === "field" && nightAmt > 0.55) want = "night";
  else if (want === "field" && waterAmt > 0.72) want = "water";
  else if (want === "field" && fireAmt > 0.72) want = "cook";
  playTheme(want);
  if (verbGain && ctx) verbGain.gain.setTargetAtTime(want === "dungeon" ? 0.52 : s.indoor ? 0.38 : 0.2, ctx.currentTime, 0.08);
  if (air && ctx) air.frequency.setTargetAtTime(s.indoor || want === "dungeon" ? 2400 : want === "battle" ? 4800 : 5200, ctx.currentTime, 0.1);
}

export type FanfareKind = "sparkle" | "short" | "full" | "jewel" | "sun" | "fire" | "water";

export function playFanfare(kind: FanfareKind = "full") {
  if (muted) return;
  const audio = ac();
  if (!audio) return;
  ensureGraph(audio);
  const now = audio.currentTime;
  setMusicDuck(true);
  fanfareUntil = performance.now() + (kind === "sparkle" ? 420 : kind === "short" ? 1100 : kind === "full" ? 2400 : 3600);
  window.setTimeout(() => setMusicDuck(false), kind === "sparkle" ? 480 : kind === "short" ? 1200 : kind === "full" ? 2500 : 3800);
  const dest = sfxBus ?? audio.destination;
  const seq: [number, number, number][] =
    kind === "sparkle"
      ? [[0, A5, 0.09], [0.08, D5 * 2, 0.16]]
      : kind === "short"
        ? [[0, A4, 0.1], [0.1, D5, 0.1], [0.2, Fs5, 0.12], [0.34, A5, 0.38]]
        : kind === "sun"
          ? [[0, D4, 0.14], [0.14, A4, 0.14], [0.28, D5, 0.16], [0.46, Fs5, 0.2], [0.7, A5, 0.24], [1.0, D5 * 2, 0.7]]
          : kind === "fire"
            ? [[0, D4, 0.12], [0.12, G4, 0.12], [0.24, B4, 0.16], [0.42, D5, 0.2], [0.66, G4, 0.16], [0.86, B4, 0.18], [1.1, D5, 0.7]]
            : kind === "water"
              ? [[0, A3, 0.18], [0.18, E4, 0.18], [0.38, A4, 0.22], [0.64, E5, 0.28], [1.0, A5, 0.4], [1.4, E5, 0.7]]
              : kind === "jewel"
                ? [[0, D4, 0.14], [0.14, A4, 0.14], [0.3, D5, 0.18], [0.52, Fs5, 0.22], [0.8, A5, 0.28], [1.16, D5, 0.22], [1.42, Fs5, 0.22], [1.7, A5, 0.9]]
                : [
                    [0, A4, 0.1],
                    [0.1, D5, 0.1],
                    [0.2, Fs5, 0.12],
                    [0.34, A5, 0.16],
                    [0.52, D5 * 2, 0.22],
                    [0.78, A5, 0.18],
                    [1.0, D5 * 2, 0.85],
                  ];
  const loud = kind === "sparkle" ? 0.08 : 0.14;
  for (const [t, f, d] of seq) {
    spawn(audio, dest, f, now + t, d, "lead", loud);
    spawn(audio, dest, f * 2, now + t, d * 0.7, "chime", loud * 0.45);
    spawn(audio, dest, f * 0.5, now + t, d * 1.05, "horn", loud * 0.4);
  }
}

export function playCeremony(gem: "emerald" | "ruby" | "sapphire" | "all") {
  if (muted) return;
  live.ceremony = { gem, t: 0 };
  playTheme("chamber");
  ceremonyUntil = performance.now() + 9200;
  window.setTimeout(() => playFanfare(gem === "emerald" ? "sun" : gem === "ruby" ? "fire" : gem === "all" ? "jewel" : "water"), 2800);
  window.setTimeout(() => {
    playTheme("keep");
    spawnThemeBurst();
  }, 6200);
}

function spawnThemeBurst() {
  const audio = ac();
  if (!audio || !musicBus || muted) return;
  const now = audio.currentTime;
  for (const [t, f, d] of THEME.slice(0, 8)) {
    spawn(audio, musicBus, f, now + t * 0.35, d * 0.8, "horn", 0.05);
    spawn(audio, musicBus, f * 0.5, now + t * 0.35, d, "choir", 0.02);
  }
}

export function playCue(name: "oak" | "secret" | "home" | "fear" | "victory" | "ending" | "veyr" | "sword") {
  if (muted) return;
  const audio = ac();
  if (!audio) return;
  ensureGraph(audio);
  const dest = sfxBus ?? audio.destination;
  const now = audio.currentTime;
  const phrases: Record<string, [number, number, number][]> = {
    oak: [[0, G3, 0.4], [0.4, D4, 0.5], [0.95, A4, 0.9]],
    secret: [[0, Fs5, 0.12], [0.12, A5, 0.12], [0.26, D5 * 2, 0.28]],
    home: [[0, D4, 0.28], [0.3, Fs4, 0.28], [0.62, A4, 0.7]],
    fear: [[0, D3, 0.5], [0.2, Fs3 * 0.94, 0.7], [0.5, A3 * 0.94, 0.9]],
    victory: [[0, D4, 0.16], [0.16, Fs4, 0.16], [0.32, A4, 0.18], [0.54, D5, 0.7]],
    ending: THEME.map(([t, f, d]) => [t * 0.45, f, d] as [number, number, number]),
    veyr: [[0, A3, 0.3], [0.3, D4, 0.35], [0.7, Fs4 * 0.94, 0.8]],
    sword: [[0, D4, 0.14], [0.14, A4, 0.16], [0.34, D5, 0.5]],
  };
  for (const [t, f, d] of phrases[name] ?? []) spawn(audio, dest, f, now + t, d, name === "fear" || name === "veyr" ? "choir" : "lead", 0.05);
}

function startAmbience() {
  if (ambTimer != null || typeof window === "undefined") return;
  ambTimer = window.setInterval(() => {
    if (muted || hidden || !ctx) return;
    const audio = ctx;
    ensureGraph(audio);
    if (!sfxBus) return;
    const now = audio.currentTime;
    if (nightAmt > 0.4 && Math.random() < 0.35) {
      spawn(audio, sfxBus, 1800 + Math.random() * 800, now, 0.04, "chime", 0.008);
    }
    if (waterAmt > 0.3 && Math.random() < 0.4) {
      spawn(audio, sfxBus, 280 + Math.random() * 80, now, 0.18, "harp", 0.01);
    }
    if (fireAmt > 0.3 && Math.random() < 0.5) {
      const src = audio.createBufferSource();
      src.buffer = noiseBuf(audio);
      const f = audio.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 700;
      const g = audio.createGain();
      g.gain.value = 0.02 * fireAmt;
      src.connect(f);
      f.connect(g);
      g.connect(sfxBus);
      src.start();
      src.stop(now + 0.22);
    }
  }, 1400);
}

export function currentBed() {
  return bed;
}

export const BEDS: Bed[] = [
  "title",
  "field",
  "night",
  "town",
  "forest",
  "water",
  "battle",
  "boss",
  "dungeon",
  "keep",
  "cook",
  "chamber",
  "ride",
  "shop",
  "ending",
  "files",
];
