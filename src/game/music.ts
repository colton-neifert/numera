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
  | "none";

const D3 = 146.83, Fs3 = 185.0, G3 = 196.0, A3 = 220.0, B3 = 246.94;
const D4 = 293.66, E4 = 329.63, Fs4 = 369.99, G4 = 392.0, A4 = 440.0, B4 = 493.88;
const D5 = 587.33, E5 = 659.25, Fs5 = 739.99, A5 = 880.0, B5 = 987.77;

/** The Numera theme: call, rise, restore. */
const THEME: [number, number, number][] = [
  [0, D4, 0.46], [0.5, E4, 0.46], [1, Fs4, 0.46], [1.5, A4, 0.92],
  [2.5, G4, 0.38], [2.92, Fs4, 0.38], [3.32, E4, 0.38], [3.72, D4, 1.12],
  [5, A3, 0.4], [5.46, D4, 0.4], [5.92, Fs4, 0.4], [6.38, A4, 0.86],
  [7.4, B4, 1.3], [8.8, A4, 1.5],
  [10.4, Fs4, 0.38], [10.82, G4, 0.38], [11.24, A4, 0.4], [11.7, D5, 1.05],
  [12.9, B4, 0.42], [13.36, A4, 0.42], [13.82, G4, 0.42], [14.28, Fs4, 0.86],
  [15.3, E4, 0.38], [15.72, Fs4, 0.38], [16.14, G4, 0.4], [16.6, A4, 0.7],
  [17.4, D5, 2.4],
];

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
  const atk = role === "pad" || role === "choir" ? Math.min(0.45, dur * 0.22) : role === "harp" || role === "pluck" || role === "chime" ? 0.008 : 0.04;
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), start + atk);
  g.gain.setValueAtTime(Math.max(0.0002, gain * (role === "pad" ? 0.85 : 0.92)), start + dur * 0.62);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);

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
    osc.type = "sine";
    f.frequency.value = 2100;
    const harm = audio.createOscillator();
    harm.type = "triangle";
    harm.frequency.value = freq * 2;
    const hg = audio.createGain();
    hg.gain.value = 0.16;
    harm.connect(hg);
    hg.connect(f);
    const vib = audio.createOscillator();
    vib.frequency.value = 4.8;
    const vg = audio.createGain();
    vg.gain.value = 4.2;
    vib.connect(vg);
    vg.connect(osc.frequency);
    harm.start(start);
    harm.stop(start + dur + 0.04);
    vib.start(start);
    vib.stop(start + dur + 0.04);
    voices.push(harm, vib);
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
  if (kind === "battle" || kind === "boss") return [D3, D3, G3, A3, D3, B3 * 0.5, G3, A3];
  if (kind === "dungeon") return [A3 * 0.5, D3, Fs3, A3 * 0.5, G3 * 0.5, D3, E4 / 2, A3 * 0.5];
  if (kind === "keep" || kind === "chamber") return [D3, A3 * 0.5, G3, D3, B3 * 0.5, G3, A3 * 0.5, D3];
  return [D3, G3, A3, D3, B3 * 0.5, G3, A3, D3];
}

function arrange(kind: Bed): { bpm: number; notes: Note[] } {
  const n: Note[] = [];
  const night = kind === "night";
  const bpm = kind === "title" ? 72 : kind === "battle" ? 138 : kind === "boss" ? 108 : kind === "night" ? 66 : kind === "cook" ? 78 : kind === "dungeon" ? 82 : kind === "keep" || kind === "chamber" ? 70 : kind === "town" || kind === "shop" ? 88 : kind === "forest" ? 76 : kind === "water" ? 90 : kind === "ending" ? 74 : 96;
  const roots = chords(kind);
  const bars = kind === "title" ? 12 : 8;
  for (let b = 0; b < bars; b++) {
    const r = roots[b % 8]!;
    const t0 = b * 4;
    const padG = kind === "battle" ? 0.018 : night ? 0.016 : 0.014;
    n.push({ t: t0, f: r * 2, d: 3.7, role: kind === "keep" || kind === "chamber" ? "choir" : "pad", g: padG });
    if (kind !== "night" && kind !== "water" && kind !== "chamber") {
      n.push({ t: t0, f: r, d: 0.42, role: "bass", g: 0.055 });
      n.push({ t: t0 + 2, f: r * 1.5, d: 0.34, role: "bass", g: 0.042 });
    } else {
      n.push({ t: t0, f: r, d: 3.4, role: "bass", g: 0.032 });
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
      n.push({ t: t0 + 1.2, f: Fs5, d: 1.8, role: "chime", g: 0.01 });
    }
  }

  const leadRole: Role = kind === "town" || kind === "shop" || kind === "cook" || kind === "water" ? "harp" : kind === "keep" || kind === "chamber" ? "horn" : "lead";
  const leadG = kind === "battle" ? 0.062 : kind === "title" ? 0.058 : night ? 0.04 : 0.052;
  const delay = kind === "title" ? 8 : 0;
  const scale = kind === "battle" || kind === "boss" ? 0.75 : 1;
  for (const [t, f, d] of THEME) {
    n.push({ t: delay + t * scale, f: kind === "battle" || kind === "boss" ? f * 0.75 : f, d: d * (night ? 1.15 : 1) * (kind === "battle" ? 0.7 : 1), role: leadRole, g: leadG });
  }
  if (kind === "title") {
    n.push({ t: 0, f: D3, d: 7.5, role: "choir", g: 0.02 });
    n.push({ t: 2, f: A3, d: 6, role: "pad", g: 0.016 });
    n.push({ t: 4.5, f: D4, d: 0.8, role: "harp", g: 0.03 });
    n.push({ t: 5.4, f: Fs4, d: 0.8, role: "harp", g: 0.028 });
    n.push({ t: 6.3, f: A4, d: 1.2, role: "harp", g: 0.03 });
    n.push({ t: 26, f: D5, d: 3.2, role: "horn", g: 0.04 });
  }
  if (kind === "ending") {
    n.push({ t: 18, f: D5, d: 4, role: "choir", g: 0.03 });
    n.push({ t: 18, f: Fs5, d: 4, role: "horn", g: 0.028 });
  }
  if (kind === "cook") {
    n.push({ t: 0.5, f: A4, d: 0.3, role: "pluck", g: 0.028 });
    n.push({ t: 1.5, f: D5, d: 0.3, role: "pluck", g: 0.024 });
    n.push({ t: 4.5, f: Fs4, d: 0.3, role: "pluck", g: 0.024 });
  }
  if (kind === "chamber") {
    n.push({ t: 0, f: D4, d: 6, role: "choir", g: 0.024 });
    n.push({ t: 8, f: A4, d: 6, role: "choir", g: 0.02 });
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
    spawn(audio, musicBus, n.f, start + n.t * beat, n.d, n.role, (n.g ?? 0.03) * gScale);
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
    stopBed();
    return;
  }
  if (bed === name && voices.length > 0) return;
  const urgent = bed === "none" || name === "battle" || name === "boss" || name === "title" || name === "chamber" || name === "cook";
  if (!urgent && bed !== "none" && voices.length > 0) {
    nextBed = name;
    bed = name;
    return;
  }
  stopBed();
  bed = name;
  scheduleBed(name);
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
  if (verbGain && ctx) verbGain.gain.setTargetAtTime(s.indoor ? 0.38 : 0.2, ctx.currentTime, 0.08);
  if (air && ctx) air.frequency.setTargetAtTime(s.indoor ? 2800 : want === "battle" ? 4800 : 5200, ctx.currentTime, 0.1);
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
      ? [[0, A5, 0.08], [0.07, D5 * 2, 0.12]]
      : kind === "short"
        ? [[0, D4, 0.12], [0.12, Fs4, 0.12], [0.24, A4, 0.14], [0.4, D5, 0.32]]
        : kind === "sun"
          ? [[0, D4, 0.16], [0.16, Fs4, 0.16], [0.32, A4, 0.18], [0.52, D5, 0.22], [0.78, Fs5, 0.28], [1.1, A5, 0.5], [1.5, D5 * 2, 0.8]]
          : kind === "fire"
            ? [[0, D4, 0.12], [0.12, G4, 0.12], [0.24, B4, 0.16], [0.42, D5, 0.2], [0.66, G4, 0.16], [0.86, B4, 0.18], [1.1, D5, 0.7]]
            : kind === "water"
              ? [[0, A3, 0.18], [0.18, E4, 0.18], [0.38, A4, 0.22], [0.64, E5, 0.28], [1.0, A5, 0.4], [1.4, E5, 0.7]]
              : kind === "jewel"
                ? [[0, D4, 0.14], [0.14, A4, 0.14], [0.3, D5, 0.18], [0.52, Fs5, 0.22], [0.8, A5, 0.28], [1.16, D5, 0.22], [1.42, Fs5, 0.22], [1.7, A5, 0.9]]
                : [
                    [0, D4, 0.13],
                    [0.13, E4, 0.13],
                    [0.26, Fs4, 0.13],
                    [0.4, A4, 0.16],
                    [0.6, D5, 0.2],
                    [0.84, Fs5, 0.22],
                    [1.12, A5, 0.28],
                    [1.46, D5, 0.7],
                  ];
  for (const [t, f, d] of seq) {
    spawn(audio, dest, f, now + t, d, "lead", 0.07);
    spawn(audio, dest, f * 0.5, now + t, d * 1.1, "horn", 0.03);
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
];
