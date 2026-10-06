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
  | "snow"
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
let pendingTheme: Bed | "none" | null = null;
let nextBed: Bed | null = null;
let timer: number | null = null;
const voices: AudioScheduledSourceNode[] = [];
let phraseGen = 0;
let waterGain: GainNode | null = null;
let fallGain: GainNode | null = null;
let waterOn = false;

function ensureWater(audio: AudioContext) {
  if (waterOn || !sfxBus) return;
  waterOn = true;
  const loop = (freq: number, q: number) => {
    const src = audio.createBufferSource();
    src.buffer = noiseBuf(audio);
    src.loop = true;
    const f = audio.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = freq;
    f.Q.value = q;
    const g = audio.createGain();
    g.gain.value = 0;
    src.connect(f);
    f.connect(g);
    g.connect(sfxBus!);
    src.start();
    return g;
  };
  waterGain = loop(520, 0.4);
  fallGain = loop(280, 0.2);
}
let fireAmt = 0;
let nightAmt = 0;
let battleAmt = 0;
let waterAmt = 0;
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
  /** 0–1, only when a waterfall is actually nearby. */
  fall?: number;
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

function voiceOf(
  audio: AudioContext,
  dest: AudioNode,
  freq: number,
  start: number,
  dur: number,
  role: Role,
  gain: number,
) {
  const peak = Math.max(0.0002, gain * 0.72);
  const g = audio.createGain();
  g.gain.setValueAtTime(0.0001, start);
  g.connect(dest);

  if (role === "drum") {
    const src = audio.createBufferSource();
    src.buffer = noiseBuf(audio);
    const f = audio.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = freq > 400 ? 900 : 180;
    const eg = audio.createGain();
    eg.gain.setValueAtTime(peak * (freq > 400 ? 0.35 : 0.8), start);
    eg.gain.exponentialRampToValueAtTime(0.0001, start + Math.min(0.18, dur));
    src.connect(f);
    f.connect(eg);
    eg.connect(dest);
    src.start(start);
    src.stop(start + dur + 0.03);
    voices.push(src);
    return;
  }

  if (role === "harp" || role === "pluck" || role === "chime") {
    const sr = audio.sampleRate;
    const n = Math.max(8, Math.round(sr / Math.max(80, freq)));
    const len = Math.floor(sr * Math.min(1.8, dur + 0.15));
    const buf = audio.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    const burst = new Float32Array(n);
    for (let i = 0; i < n; i++) burst[i] = (Math.random() * 2 - 1) * (1 - i / n);
    let prev = 0;
    for (let i = 0; i < len; i++) {
      const y = (burst[i % n]! + prev) * 0.494;
      burst[i % n] = y;
      prev = y;
      data[i] = y * Math.exp(-i / (sr * (0.28 + Math.min(dur, 1.2) * 0.22)));
    }
    const src = audio.createBufferSource();
    src.buffer = buf;
    const lp = audio.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = role === "chime" ? 3200 : 2200;
    g.gain.exponentialRampToValueAtTime(peak * (role === "chime" ? 0.45 : 1.15), start + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, start + Math.min(dur, 1.5));
    src.connect(lp);
    lp.connect(g);
    src.start(start);
    src.stop(start + Math.min(dur, 1.6) + 0.02);
    voices.push(src);
    return;
  }

  if (role === "lead" || role === "horn") {
    const o = audio.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(freq, start);
    const vib = audio.createOscillator();
    vib.frequency.value = 4.4;
    const vibG = audio.createGain();
    vibG.gain.value = freq * 0.006;
    vib.connect(vibG);
    vibG.connect(o.frequency);
    const lp = audio.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1600;
    const br = audio.createBufferSource();
    br.buffer = noiseBuf(audio);
    br.loop = true;
    const bp = audio.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = Math.min(1800, freq * 1.8);
    bp.Q.value = 3.2;
    const bg = audio.createGain();
    bg.gain.value = 0.06;
    br.connect(bp);
    bp.connect(bg);
    bg.connect(g);
    o.connect(lp);
    lp.connect(g);
    const atk = 0.08;
    g.gain.exponentialRampToValueAtTime(peak, start + Math.min(atk, dur * 0.35));
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.start(start);
    vib.start(start);
    br.start(start);
    const end = start + dur + 0.04;
    o.stop(end);
    vib.stop(end);
    br.stop(end);
    voices.push(o, vib, br);
    return;
  }

  const o = audio.createOscillator();
  o.type = "sine";
  o.frequency.value = freq;
  const o2 = audio.createOscillator();
  o2.type = "sine";
  o2.frequency.value = freq * 1.003;
  const lp = audio.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = role === "bass" ? 380 : 1200;
  const mix = audio.createGain();
  o.connect(mix);
  o2.connect(mix);
  mix.connect(lp);
  lp.connect(g);
  const atk = role === "bass" ? 0.1 : 0.42;
  g.gain.exponentialRampToValueAtTime(peak * (role === "bass" ? 1.1 : 0.8), start + Math.min(atk, dur * 0.45));
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.start(start);
  o2.start(start);
  const end = start + dur + 0.05;
  o.stop(end);
  o2.stop(end);
  voices.push(o, o2);
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
  voiceOf(audio, dest, freq, start, dur, role, gain);
  return;
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
    osc.type = "triangle";
    f.frequency.value = role === "choir" ? 1400 : 1100;
    const det = audio.createOscillator();
    det.type = "sine";
    det.frequency.value = freq * 1.004;
    const dg = audio.createGain();
    dg.gain.value = 0.22;
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

function n(
  t: number,
  f: number,
  d: number,
  role: Role,
  g: number,
): Note {
  return { t, f, d, role, g };
}

/** Hand-written themes. Times are beats. The same rising shape (step, step, leap, hold) is the Numeria motif. */
function composed(kind: Bed): { bpm: number; notes: Note[] } {
  const D4 = 293.66, E4 = 329.63, F4 = 349.23, Fs4 = 369.99, G4 = 392, A4 = 440, B4 = 493.88;
  const C5 = 523.25, D5 = 587.33, E5 = 659.25;
  const D3 = 146.83, G3 = 196, A3 = 220, C4 = 261.63, F3 = 174.61, E3 = 164.81;
  const motif = (t0: number, g: number, role: Role = "lead"): Note[] => [
    n(t0, D4, 1, role, g),
    n(t0 + 1, E4, 1, role, g),
    n(t0 + 2, G4, 1.5, role, g * 1.05),
    n(t0 + 3.5, A4, 2, role, g),
    n(t0 + 6, B4, 1, role, g * 0.9),
    n(t0 + 7, A4, 1, role, g * 0.85),
    n(t0 + 8, G4, 1, role, g),
    n(t0 + 9, E4, 1, role, g),
    n(t0 + 10, D4, 2, role, g),
  ];
  if (kind === "town" || kind === "shop" || kind === "cook" || kind === "field" || kind === "ride" || kind === "title" || kind === "files") {
    const bpm = kind === "town" || kind === "shop" ? 80 : kind === "files" ? 76 : 96;
    const g = kind === "files" ? 0.02 : 0.032;
    const notes: Note[] = [
      n(0, D4, 1.5, "harp", 0.02),
      n(1.5, G4, 1.5, "harp", 0.018),
      n(3, A4, 1.5, "harp", 0.018),
      n(4.5, D5, 1.2, "harp", 0.014),
      n(0, D3, 8, "bass", 0.022),
      n(8, G3, 8, "bass", 0.02),
      ...motif(8, g),
      n(8, D4, 8, "pad", 0.012),
      n(16, G3, 8, "pad", 0.012),
      n(16, G4, 1, "lead", g * 0.85),
      n(17, A4, 1, "lead", g * 0.85),
      n(18, B4, 1.5, "lead", g),
      n(19.5, D5, 2, "lead", g),
      n(22, B4, 1, "lead", g * 0.8),
      n(23, A4, 1, "lead", g * 0.8),
      n(24, G4, 1, "pad", 0.016),
      n(25, E4, 1, "pad", 0.016),
      n(26, D4, 2, "lead", g),
      n(20, D4, 0.5, "harp", 0.012),
      n(22, A4, 0.5, "harp", 0.012),
      n(28, D3, 4, "bass", 0.02),
      n(28, D4, 4, "pad", 0.014),
    ];
    if (kind === "town") {
      notes.push(n(12, G4, 2, "harp", 0.01));
    }
    return { bpm, notes };
  }
  if (kind === "forest" || kind === "night" || kind === "water" || kind === "snow") {
    return {
      bpm: kind === "snow" ? 60 : 78,
      notes: [
        n(0, D3, 8, "pad", 0.016),
        n(0, A3, 8, "pad", 0.01),
        n(2, D4, 1.5, "harp", 0.012),
        n(4, E4, 1.5, "harp", 0.01),
        ...motif(8, 0.02),
        n(8, D3, 10, "bass", 0.016),
        n(20, A3, 1.5, "lead", 0.016),
        n(22, G4, 2, "lead", 0.014),
        n(26, D4, 4, "pad", 0.012),
      ],
    };
  }
  if (kind === "chamber" || kind === "keep" || kind === "ending") {
    return {
      bpm: kind === "chamber" ? 72 : 66,
      notes: [
        n(0, D3, 8, "pad", 0.02),
        n(0, A3, 8, "pad", 0.012),
        n(4, D4, 6, "pad", 0.014),
        ...motif(8, 0.026),
        n(20, G3, 6, "pad", 0.014),
        n(20, B4, 2, "lead", 0.018),
        n(22, A4, 2, "lead", 0.016),
        n(24, D4, 6, "pad", 0.016),
      ],
    };
  }
  if (kind === "dungeon") {
    return {
      bpm: 76,
      notes: [
        n(0, D3, 2, "bass", 0.028),
        n(2, D3, 0.5, "harp", 0.012),
        n(4, A3, 2, "bass", 0.024),
        n(6, A3, 0.5, "harp", 0.01),
        n(8, D4, 1.5, "lead", 0.018),
        n(10, F4, 1.5, "lead", 0.016),
        n(12, A4, 2, "lead", 0.016),
        n(16, G4, 1.5, "lead", 0.014),
        n(18, E4, 1.5, "lead", 0.014),
        n(20, D4, 4, "pad", 0.012),
        n(0, D3, 8, "pad", 0.01),
        n(16, D3, 2, "bass", 0.024),
        n(20, A3, 2, "bass", 0.02),
      ],
    };
  }
  if (kind === "battle" || kind === "boss") {
    const g = kind === "boss" ? 0.034 : 0.028;
    return {
      bpm: kind === "boss" ? 112 : 126,
      notes: [
        n(0, A3, 0.5, "bass", 0.03),
        n(1, A3, 0.5, "bass", 0.022),
        n(2, E3, 0.5, "bass", 0.028),
        n(3, E3, 0.5, "bass", 0.02),
        n(0, A4, 0.5, "lead", g),
        n(0.5, C5, 0.5, "lead", g),
        n(1, E5, 1, "lead", g),
        n(2, D5, 0.5, "lead", g * 0.9),
        n(2.5, C5, 0.5, "lead", g * 0.85),
        n(3, A4, 1, "lead", g),
        n(4, A3, 4, "pad", 0.012),
        n(4, C5, 0.5, "lead", g),
        n(4.5, A4, 0.5, "lead", g * 0.8),
        n(5, G4, 1, "lead", g),
        n(6, A4, 2, "lead", g),
        n(0, 70, 0.1, "drum", 0.02),
        n(2, 70, 0.1, "drum", 0.016),
      ],
    };
  }
  return {
    bpm: 96,
    notes: [...motif(0, 0.028), n(0, D3, 8, "pad", 0.014), n(8, A3, 4, "bass", 0.018)],
  };
}

function arrange(kind: Bed): { bpm: number; notes: Note[] } {
  return composed(kind);
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
  const wait = Math.max(0.45, spec.dur - 0.45);
  const gen = ++phraseGen;
  timer = window.setTimeout(() => {
    if (gen !== phraseGen) return;
    const play = nextBed ?? bed;
    nextBed = null;
    const switching = play !== name;
    if (switching) {
      for (const v of voices) {
        try {
          v.stop();
        } catch {
          /* already ended */
        }
      }
    }
    voices.length = 0;
    bed = play;
    if (bed !== "none" && !muted) scheduleBed(bed);
  }, wait * 1000);
}

export function playTheme(name: Bed | "none") {
  if (name === bed || name === pendingTheme) return;
  const audio = ac();
  if (name === "none") {
    pendingTheme = "none";
    bed = "none";
    nextBed = null;
    phraseGen += 1;
    if (audio && musicBus) {
      const now = audio.currentTime;
      musicBus.gain.cancelScheduledValues(now);
      musicBus.gain.setValueAtTime(Math.max(0.001, musicBus.gain.value), now);
      musicBus.gain.linearRampToValueAtTime(0.0001, now + 0.4);
      window.setTimeout(() => {
        pendingTheme = null;
        stopBed();
      }, 420);
    } else {
      pendingTheme = null;
      stopBed();
    }
    return;
  }
  if (audio && musicBus && bed !== "none") {
    pendingTheme = name;
    phraseGen += 1;
    nextBed = name;
    const now = audio.currentTime;
    musicBus.gain.cancelScheduledValues(now);
    musicBus.gain.setValueAtTime(Math.max(0.001, musicBus.gain.value), now);
    musicBus.gain.linearRampToValueAtTime(0.0001, now + 0.45);
    const next = name;
    window.setTimeout(() => {
      stopBed();
      pendingTheme = null;
      bed = next;
      const a = ac();
      if (a && musicBus) {
        musicBus.gain.cancelScheduledValues(a.currentTime);
        musicBus.gain.setValueAtTime(0.0001, a.currentTime);
        musicBus.gain.linearRampToValueAtTime(1, a.currentTime + 0.75);
      }
      if (!muted) scheduleBed(next);
    }, 470);
    return;
  }
  phraseGen += 1;
  nextBed = null;
  pendingTheme = null;
  stopBed();
  bed = name;
  if (audio && musicBus) {
    musicBus.gain.cancelScheduledValues(audio.currentTime);
    musicBus.gain.setValueAtTime(0.0001, audio.currentTime);
    musicBus.gain.linearRampToValueAtTime(1, audio.currentTime + 0.8);
  }
  if (!muted) scheduleBed(name);
}

export function setScene(s: MusicScene) {
  nightAmt = s.night ?? 0;
  waterAmt = s.water ?? 0;
  fireAmt = s.fire ?? 0;
  battleAmt = s.combat ?? 0;
  const audio = ac();
  if (audio) {
    ensureGraph(audio);
    ensureWater(audio);
    const now = audio.currentTime;
    if (waterGain) waterGain.gain.setTargetAtTime(waterAmt * 0.045, now, 0.25);
    if (fallGain) fallGain.gain.setTargetAtTime(Math.max(0, s.fall ?? 0) * 0.09, now, 0.3);
  }
  let want = s.bed;
  if (want === "field" && nightAmt > 0.55) want = "night";
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
    if (muted || hidden || !ctx || !sfxBus) return;
    if (bed === "none" || bed === "chamber" || bed === "title" || bed === "files" || bed === "keep" || bed === "battle" || bed === "boss") return;
    const audio = ctx;
    ensureGraph(audio);
    const now = audio.currentTime;
    const outside = bed === "town" || bed === "field" || bed === "forest" || bed === "night" || bed === "shop" || bed === "ride";
    if (outside && nightAmt < 0.45 && Math.random() < 0.28) {
      const o = audio.createOscillator();
      o.type = "sine";
      const f0 = 1400 + Math.random() * 500;
      o.frequency.setValueAtTime(f0, now);
      o.frequency.exponentialRampToValueAtTime(f0 * (1.08 + Math.random() * 0.12), now + 0.07);
      const g = audio.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.0045, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
      o.connect(g);
      g.connect(sfxBus);
      o.start(now);
      o.stop(now + 0.11);
    }
    if ((bed === "forest" || bed === "field" || bed === "night") && Math.random() < 0.35) {
      const src = audio.createBufferSource();
      src.buffer = noiseBuf(audio);
      const f = audio.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = bed === "forest" ? 700 : 480;
      f.Q.value = 0.5;
      const g = audio.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.003, now + 0.25);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
      src.connect(f);
      f.connect(g);
      g.connect(sfxBus);
      src.start(now);
      src.stop(now + 1.15);
    }
    if (fireAmt > 0.45 && Math.random() < 0.4) {
      const src = audio.createBufferSource();
      src.buffer = noiseBuf(audio);
      const f = audio.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 900;
      const g = audio.createGain();
      g.gain.setValueAtTime(0.004 * fireAmt, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      src.connect(f);
      f.connect(g);
      g.connect(sfxBus);
      src.start(now);
      src.stop(now + 0.18);
    }
  }, 2600 + Math.floor(Math.random() * 1800));
}

export function sting(kind: "yes" | "pickup" | "treasure" | "key") {
  if (muted) return;
  const audio = ac();
  if (!audio) return;
  ensureGraph(audio);
  const dest = sfxBus ?? audio.destination;
  const now = audio.currentTime;
  const D4 = 293.66, Fs4 = 369.99, A4 = 440, D5 = 587.33, G4 = 392, B4 = 493.88;
  if (kind === "yes") {
    voiceOf(audio, dest, D4, now, 0.22, "pluck", 0.05);
    voiceOf(audio, dest, Fs4, now + 0.12, 0.22, "pluck", 0.045);
    voiceOf(audio, dest, A4, now + 0.24, 0.28, "pluck", 0.05);
    voiceOf(audio, dest, D5, now + 0.4, 0.45, "lead", 0.03);
    return;
  }
  if (kind === "pickup") {
    voiceOf(audio, dest, G4, now, 0.16, "pluck", 0.04);
    voiceOf(audio, dest, B4, now + 0.1, 0.28, "pluck", 0.038);
    return;
  }
  if (kind === "key") {
    const src = audio.createBufferSource();
    src.buffer = noiseBuf(audio);
    const f = audio.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 1800;
    const g = audio.createGain();
    g.gain.setValueAtTime(0.03, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
    src.connect(f);
    f.connect(g);
    g.connect(dest);
    src.start(now);
    src.stop(now + 0.07);
    voiceOf(audio, dest, A4, now + 0.05, 0.2, "pluck", 0.04);
    voiceOf(audio, dest, D5, now + 0.16, 0.35, "lead", 0.028);
    return;
  }
  voiceOf(audio, dest, D4, now, 0.2, "pluck", 0.04);
  voiceOf(audio, dest, Fs4, now + 0.14, 0.22, "pluck", 0.04);
  voiceOf(audio, dest, A4, now + 0.28, 0.24, "pluck", 0.042);
  voiceOf(audio, dest, D5, now + 0.46, 0.7, "lead", 0.032);
  voiceOf(audio, dest, A4, now + 0.46, 0.7, "pad", 0.016);
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
