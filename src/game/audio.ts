import {
  playTheme as playScore,
  setMusicMix as mixMusic,
  setSfxMix as mixSfx,
  setTalkMix as mixTalk,
  getTalkMix as readTalk,
  setMusicDuck as duckScore,
  setMuted as muteScore,
  unlockMusic,
  setHidden,
  getSfxBus,
  playFanfare,
  playCeremony,
  playCue,
  setScene,
  currentBed,
  BEDS,
  setMasterMix,
} from "./music";

export {
  playFanfare,
  playCeremony,
  playCue,
  setScene,
  currentBed,
  BEDS,
  setHidden,
  setMasterMix,
  mixTalk as setTalkMix,
  readTalk as getTalkMix,
};

let ctx: AudioContext | null = null;
let muted = false;
type ThemeName = "title" | "field" | "battle" | "shop" | "ride" | "town" | "keep" | "dungeon" | "cook" | "chamber";
let theme: ThemeName | null = null;
let musicTimer: number | null = null;
let lowHealthTimer: number | null = null;
const voices: AudioScheduledSourceNode[] = [];
let master: GainNode | null = null;
let hipPass: BiquadFilterNode | null = null;
let airPass: BiquadFilterNode | null = null;
const MUSIC_GAIN = 0.72;
const BATTLE_GAIN = 0.96;
let ducked = false;
let musicMix = 1;
let sfxMix = 1;

export function setMusicMix(v: number) {
  musicMix = Math.max(0, Math.min(1, v));
  mixMusic(v);
}

export function setSfxMix(v: number) {
  sfxMix = Math.max(0, Math.min(1, v));
  mixSfx(v);
}

export function getMusicMix() {
  return musicMix;
}

export function getSfxMix() {
  return sfxMix;
}

function themeVol() {
  const base = theme === "battle" ? BATTLE_GAIN : MUSIC_GAIN;
  return base * musicMix * (ducked ? 0.08 : 1);
}

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function bus(audio: AudioContext): GainNode {
  const vol = themeVol();
  if (!master) {
    master = audio.createGain();
    hipPass = audio.createBiquadFilter();
    hipPass.type = "highpass";
    hipPass.Q.value = 0.4;
    airPass = audio.createBiquadFilter();
    airPass.type = "lowpass";
    airPass.Q.value = 0.35;
    master.connect(hipPass);
    hipPass.connect(airPass);
    airPass.connect(audio.destination);
  }
  const battle = theme === "battle";
  master.gain.value = vol;
  if (hipPass) hipPass.frequency.value = battle ? 55 : 110;
  if (airPass) airPass.frequency.value = battle ? 4600 : 2800;
  return master;
}

export function setMusicDuck(on: boolean) {
  ducked = on;
  duckScore(on);
}

export function setMuted(value: boolean) {
  muted = value;
  muteScore(value);
  if (muted) {
    stopMusic();
    stopLowHealth();
  } else if (theme) playTheme(theme);
}

export function setLowHealth(on: boolean) {
  if (!on || muted) {
    stopLowHealth();
    return;
  }
  if (lowHealthTimer != null) return;
  const beep = () => {
    if (muted) {
      stopLowHealth();
      return;
    }
    sfx.lowHeart();
  };
  beep();
  lowHealthTimer = window.setInterval(beep, 980);
}

function stopLowHealth() {
  if (lowHealthTimer == null) return;
  window.clearInterval(lowHealthTimer);
  lowHealthTimer = null;
}

function rumble(ms: number, strong = 0.9, weak = 0.45) {
  if (muted || typeof navigator === "undefined") return;
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* ignore */
  }
  try {
    const pads = navigator.getGamepads?.() ?? [];
    for (const pad of pads) {
      const act = pad?.vibrationActuator;
      if (!act?.playEffect) continue;
      void act.playEffect("dual-rumble", {
        startDelay: 0,
        duration: ms,
        strongMagnitude: strong,
        weakMagnitude: weak,
      });
    }
  } catch {
    /* ignore */
  }
}

export function unlockAudio() {
  ac();
  unlockMusic();
}

function tone(freq: number, dur: number, type: OscillatorType, gain = 0.05) {
  if (muted) return;
  const audio = ac();
  if (!audio) return;
  const osc = audio.createOscillator();
  const g = audio.createGain();
  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = type === "sine" ? 2400 : 1600;
  osc.type = type === "square" ? "triangle" : type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, audio.currentTime);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain * sfxMix), audio.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur);
  osc.connect(filter);
  filter.connect(g);
  g.connect(getSfxBus() ?? audio.destination);
  osc.start();
  osc.stop(audio.currentTime + dur + 0.02);
}

/** Dry keyboard/piano key-tap. A click plus a short square beep — not a sung note. */
function pianoBeep(freq: number, dur = 0.018, gain = 0.05) {
  if (muted) return;
  const audio = ac();
  if (!audio) return;
  const now = audio.currentTime;
  const osc = audio.createOscillator();
  osc.type = "square";
  osc.frequency.value = freq;
  const g = audio.createGain();
  g.gain.setValueAtTime(gain, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.connect(g);
  g.connect(getSfxBus() ?? audio.destination);
  osc.start(now);
  osc.stop(now + dur + 0.004);
}

function noise(dur: number, gain = 0.03, freq = 700) {
  if (muted) return;
  const audio = ac();
  if (!audio) return;
  const len = Math.max(1, Math.floor(audio.sampleRate * dur));
  const buf = audio.createBuffer(1, len, audio.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.28));
  }
  const src = audio.createBufferSource();
  src.buffer = buf;
  const filter = audio.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;
  filter.Q.value = 0.8;
  const g = audio.createGain();
  g.gain.setValueAtTime(gain, audio.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur);
  src.connect(filter);
  filter.connect(g);
  g.connect(getSfxBus() ?? audio.destination);
  src.start();
}

function swish(kind: "short" | "long") {
  if (muted) return;
  const audio = ac();
  if (!audio) return;
  const dur = kind === "long" ? 0.95 : 0.18;
  const len = Math.max(1, Math.floor(audio.sampleRate * dur));
  const buf = audio.createBuffer(1, len, audio.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    const t = i / len;
    const env =
      kind === "long"
        ? Math.sin(Math.PI * t) * (0.5 + 0.5 * Math.abs(Math.sin(t * Math.PI * 2.4)))
        : Math.sin(Math.PI * Math.min(1, t * 1.55)) * Math.exp(-t * 2.6);
    data[i] = (Math.random() * 2 - 1) * env;
  }
  const src = audio.createBufferSource();
  src.buffer = buf;
  const filter = audio.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = kind === "long" ? 1.35 : 1.05;
  const now = audio.currentTime;
  if (kind === "long") {
    filter.frequency.setValueAtTime(2600, now);
    filter.frequency.exponentialRampToValueAtTime(780, now + 0.32);
    filter.frequency.exponentialRampToValueAtTime(1900, now + 0.58);
    filter.frequency.exponentialRampToValueAtTime(380, now + dur);
  } else {
    filter.frequency.setValueAtTime(3200, now);
    filter.frequency.exponentialRampToValueAtTime(620, now + dur);
  }
  const g = audio.createGain();
  g.gain.setValueAtTime(kind === "long" ? 0.09 : 0.058, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  src.connect(filter);
  filter.connect(g);
  g.connect(getSfxBus() ?? audio.destination);
  src.start();

  const air = audio.createOscillator();
  air.type = "sine";
  if (kind === "long") {
    air.frequency.setValueAtTime(920, now);
    air.frequency.exponentialRampToValueAtTime(180, now + dur);
  } else {
    air.frequency.setValueAtTime(1100, now);
    air.frequency.exponentialRampToValueAtTime(380, now + dur);
  }
  const ag = audio.createGain();
  ag.gain.setValueAtTime(kind === "long" ? 0.034 : 0.02, now);
  ag.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  air.connect(ag);
  ag.connect(audio.destination);
  air.start();
  air.stop(now + dur + 0.03);

  rumble(kind === "long" ? 320 : 38, kind === "long" ? 0.85 : 0.4, kind === "long" ? 0.55 : 0.28);
}

function battleCry(mode: "spin" | "jump", high = false) {
  if (muted) return;
  const audio = ac();
  if (!audio) return;
  rumble(mode === "spin" ? 180 : 100, 0.6, 0.42);
  const now = audio.currentTime;
  const dur = mode === "spin" ? 0.98 : 0.52;
  const f0 = high ? 420 : 280;
  const f1 = high ? 760 : 490;
  const f2 = high ? 520 : 330;
  const voice = (type: OscillatorType, gain: number, offset: number, band: number) => {
    const osc = audio.createOscillator();
    const g = audio.createGain();
    const f = audio.createBiquadFilter();
    osc.type = type;
    osc.frequency.setValueAtTime(f0 + offset, now);
    osc.frequency.linearRampToValueAtTime(f1 + offset, now + dur * 0.28);
    osc.frequency.linearRampToValueAtTime(f2 + offset, now + dur);
    f.type = "bandpass";
    f.frequency.value = band;
    f.Q.value = 1.2;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(gain, now + 0.04);
    g.gain.setValueAtTime(gain * 0.82, now + dur * 0.48);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(f);
    f.connect(g);
    g.connect(getSfxBus() ?? audio.destination);
    osc.start(now);
    osc.stop(now + dur + 0.04);
  };
  voice("sawtooth", high ? 0.028 : 0.024, 0, high ? 980 : 720);
  voice("sine", high ? 0.055 : 0.048, 0, high ? 1180 : 880);
  voice("triangle", 0.028, high ? 190 : 130, high ? 1600 : 1200);
}

function yah(high = false) {
  if (muted) return;
  rumble(28, 0.3, 0.25);
  tone(high ? 540 : 360, 0.07, "sine", 0.03);
  window.setTimeout(() => tone(high ? 430 : 290, 0.11, "triangle", 0.022), 55);
}

export const sfx = {
  ok: () => {
    rumble(35, 0.3, 0.5);
    tone(523, 0.12, "sine", 0.04);
    window.setTimeout(() => tone(784, 0.16, "sine", 0.03), 80);
  },
  miss: () => {
    rumble(55, 0.5, 0.3);
    tone(196, 0.2, "triangle", 0.03);
    noise(0.12, 0.02, 280);
  },
  over: () => {
    rumble(780, 1, 0.95);
    noise(0.55, 0.09, 160);
    tone(196, 0.42, "sawtooth", 0.055);
    window.setTimeout(() => tone(165, 0.5, "triangle", 0.05), 180);
    window.setTimeout(() => tone(131, 0.7, "sine", 0.05), 420);
    window.setTimeout(() => {
      tone(98, 1.15, "triangle", 0.048);
      noise(0.7, 0.05, 90);
    }, 780);
    window.setTimeout(() => tone(73, 1.6, "sine", 0.04), 1180);
  },
  yelp: () => {
    rumble(40, 0.25, 0.45);
    tone(620, 0.07, "sine", 0.028);
    window.setTimeout(() => tone(480, 0.1, "sine", 0.022), 50);
  },
  hit: () => {
    rumble(180, 1, 0.78);
    noise(0.12, 0.04, 380);
    tone(196, 0.12, "triangle", 0.032);
    window.setTimeout(() => tone(147, 0.1, "sine", 0.02), 40);
  },
  swing: () => {
    swish("short");
  },
  slide: () => {
    rumble(80, 0.45, 0.35);
    noise(0.16, 0.04, 900);
    tone(180, 0.18, "sine", 0.02);
  },
  cry: (mode: "spin" | "jump" = "spin", high = false) => battleCry(mode, high),
  yah: (high = false) => yah(high),
  spin: () => {
    swish("long");
  },
  caveOut: () => {
    rumble(90, 0.4, 0.35);
    noise(0.28, 0.045, 900);
    window.setTimeout(() => noise(0.18, 0.028, 1600), 70);
    tone(523, 0.12, "sine", 0.036);
    window.setTimeout(() => tone(659, 0.12, "sine", 0.034), 90);
    window.setTimeout(() => tone(784, 0.14, "sine", 0.038), 180);
    window.setTimeout(() => tone(1047, 0.28, "triangle", 0.04), 280);
    window.setTimeout(() => tone(1319, 0.22, "sine", 0.022), 380);
  },
  enemy: () => {
    tone(196, 0.12, "triangle", 0.02);
  },
  hiss: () => {
    noise(0.1, 0.028, 1100);
  },
  lowHeart: () => {
    pianoBeep(1760, 0.022, 0.07);
  },
  claw: () => {
    rumble(55, 0.45, 0.28);
    noise(0.14, 0.04, 1600);
    tone(190, 0.07, "triangle", 0.022);
    window.setTimeout(() => noise(0.08, 0.022, 700), 50);
  },
  bark: () => {
    rumble(70, 0.5, 0.32);
    noise(0.1, 0.034, 820);
    tone(300, 0.09, "sawtooth", 0.032);
    window.setTimeout(() => tone(460, 0.14, "triangle", 0.028), 50);
    window.setTimeout(() => tone(230, 0.16, "sawtooth", 0.02), 150);
  },
  ouch: () => {
    rumble(110, 0.85, 0.45);
    noise(0.1, 0.032, 620);
    tone(880, 0.05, "square", 0.02);
    window.setTimeout(() => tone(523, 0.07, "square", 0.016), 45);
    window.setTimeout(() => tone(330, 0.12, "triangle", 0.014), 95);
    yah(false);
  },
  chop: () => {
    rumble(50, 0.4, 0.3);
    noise(0.05, 0.016, 640);
  },
  rustle: () => {
    noise(0.14, 0.022, 620);
    window.setTimeout(() => noise(0.1, 0.016, 480), 80);
  },
  charge: () => {
    rumble(40, 0.4, 0.4);
    tone(330, 0.07, "sine", 0.016);
  },
  fire: () => {
    rumble(30, 0.25, 0.3);
    noise(0.1, 0.018, 600);
  },
  sizzle: () => {
    noise(0.12, 0.016, 1400);
    noise(0.08, 0.01, 2200);
  },
  cast: () => {
    tone(392, 0.1, "sine", 0.035);
    window.setTimeout(() => tone(523, 0.14, "sine", 0.035), 80);
    window.setTimeout(() => tone(784, 0.2, "sine", 0.028), 160);
  },
  collect: () => {
    rumble(30, 0.25, 0.5);
    tone(660, 0.12, "sine", 0.032);
    window.setTimeout(() => tone(880, 0.16, "sine", 0.026), 70);
    window.setTimeout(() => tone(1175, 0.18, "sine", 0.02), 140);
  },
  coin: () => {
    rumble(10, 0.12, 0.22);
    noise(0.03, 0.016, 2400);
    tone(1244, 0.055, "triangle", 0.03);
    window.setTimeout(() => tone(1661, 0.09, "sine", 0.022), 45);
  },
  buy: () => {
    tone(523, 0.12, "sine", 0.032);
    window.setTimeout(() => tone(659, 0.14, "sine", 0.03), 90);
    window.setTimeout(() => tone(784, 0.2, "sine", 0.028), 180);
  },
  jump: () => {
    rumble(28, 0.35, 0.25);
    noise(0.06, 0.02, 500);
    tone(392, 0.1, "sine", 0.026);
  },
  hop: () => {
    rumble(16, 0.2, 0.18);
    noise(0.035, 0.01, 820);
    tone(494, 0.055, "sine", 0.028);
    window.setTimeout(() => tone(659, 0.08, "triangle", 0.02), 38);
  },
  roll: () => {
    rumble(70, 0.55, 0.3);
    noise(0.1, 0.018, 700);
  },
  win: () => {
    rumble(80, 0.6, 0.5);
    window.setTimeout(() => rumble(110, 0.85, 0.6), 180);
    tone(392, 0.16, "sine", 0.035);
    window.setTimeout(() => tone(523, 0.16, "sine", 0.035), 110);
    window.setTimeout(() => tone(659, 0.2, "sine", 0.032), 220);
    window.setTimeout(() => tone(784, 0.32, "sine", 0.03), 360);
  },
  battle: () => {
    rumble(180, 0.8, 0.45);
    noise(0.12, 0.02, 420);
    tone(196, 0.16, "triangle", 0.024);
  },
  hoof: (heavy = false) => {
    const h = heavy ? 1.4 : 1;
    noise(0.08, 0.1 * h, 260 + Math.random() * 70);
    noise(0.05, 0.062 * h, 720 + Math.random() * 180);
    noise(0.028, 0.04 * h, 1600 + Math.random() * 400);
    tone(98 + Math.random() * 22, 0.07, "triangle", 0.045 * h);
    if (heavy) {
      noise(0.09, 0.038, 480 + Math.random() * 80);
      rumble(18, 0.22, 0.12);
    }
  },
  hoot: () => {
    tone(392, 0.18, "sine", 0.018);
    window.setTimeout(() => tone(330, 0.28, "sine", 0.016), 160);
  },
  neigh: () => {
    if (muted) return;
    const audio = ac();
    if (!audio) return;
    const now = audio.currentTime;
    const osc = audio.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.linearRampToValueAtTime(680, now + 0.1);
    osc.frequency.linearRampToValueAtTime(340, now + 0.38);
    osc.frequency.linearRampToValueAtTime(250, now + 0.7);
    const vib = audio.createOscillator();
    vib.type = "sine";
    vib.frequency.value = 18;
    const vibG = audio.createGain();
    vibG.gain.value = 22;
    vib.connect(vibG);
    vibG.connect(osc.frequency);
    const filter = audio.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.linearRampToValueAtTime(520, now + 0.7);
    filter.Q.value = 1.4;
    const g = audio.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.07, now + 0.04);
    g.gain.exponentialRampToValueAtTime(0.04, now + 0.28);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.78);
    osc.connect(filter);
    filter.connect(g);
    g.connect(getSfxBus() ?? audio.destination);
    osc.start(now);
    vib.start(now);
    osc.stop(now + 0.82);
    vib.stop(now + 0.82);
    noise(0.18, 0.018, 1400);
  },
  snort: () => {
    if (muted) return;
    const audio = ac();
    if (!audio) return;
    const dur = 0.32;
    const len = Math.max(1, Math.floor(audio.sampleRate * dur));
    const buf = audio.createBuffer(1, len, audio.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const t = i / audio.sampleRate;
      const flutter = 0.2 + 0.8 * (0.5 + 0.5 * Math.sign(Math.sin(t * 52 * Math.PI * 2)));
      const env = Math.min(1, t * 18) * Math.exp(-t * 7);
      data[i] = (Math.random() * 2 - 1) * env * flutter;
    }
    const src = audio.createBufferSource();
    src.buffer = buf;
    const filter = audio.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 780;
    filter.Q.value = 0.7;
    const g = audio.createGain();
    g.gain.value = 0.2;
    src.connect(filter);
    filter.connect(g);
    g.connect(getSfxBus() ?? audio.destination);
    src.start();
  },
  moo: () => {
    tone(140, 0.18, "sine", 0.04);
    window.setTimeout(() => tone(110, 0.32, "triangle", 0.032), 120);
    window.setTimeout(() => tone(90, 0.28, "sine", 0.022), 300);
  },
  meow: () => {
    tone(680, 0.06, "sine", 0.022);
    window.setTimeout(() => tone(820, 0.08, "triangle", 0.018), 50);
    window.setTimeout(() => tone(540, 0.12, "sine", 0.014), 130);
  },
  ocarina: (freq: number) => {
    startOcarina(freq);
  },
  songOk: () => {
    rumble(40, 0.25, 0.45);
    tone(523, 0.14, "sine", 0.04);
    window.setTimeout(() => tone(659, 0.16, "sine", 0.038), 90);
    window.setTimeout(() => tone(784, 0.28, "sine", 0.042), 180);
  },
  step: (kind: "grass" | "stone" | "dirt" | "wood" | "water" = "grass", heavy = false) => {
    const h = heavy ? 1.5 : 1;
    if (kind === "stone") {
      rumble(heavy ? 36 : 12, 0.16 * h, 0.08);
      noise(0.048, 0.046 * h, 170 + Math.random() * 40);
      noise(0.02, 0.03 * h, 2200 + Math.random() * 700);
      tone(150 + Math.random() * 28, 0.04, "triangle", 0.016 * h);
    } else if (kind === "dirt") {
      noise(0.07, 0.038 * h, 240 + Math.random() * 70);
      noise(0.04, 0.018 * h, 900 + Math.random() * 200);
    } else if (kind === "wood") {
      rumble(heavy ? 28 : 10, 0.12 * h, 0.08);
      noise(0.05, 0.03 * h, 520 + Math.random() * 80);
      tone(210 + Math.random() * 40, 0.045, "triangle", 0.014 * h);
    } else if (kind === "water") {
      noise(0.1, 0.04 * h, 380 + Math.random() * 90);
      tone(180 + Math.random() * 40, 0.08, "sine", 0.016 * h);
    } else {
      noise(0.085, 0.034 * h, 380 + Math.random() * 90);
      noise(0.11, 0.02 * h, 1350 + Math.random() * 280);
    }
  },
  land: (kind: "grass" | "stone" = "grass") => {
    rumble(kind === "stone" ? 90 : 55, 0.45, 0.28);
    sfx.step(kind, true);
  },
  giggle: () => {
    tone(784, 0.07, "sine", 0.028);
    window.setTimeout(() => tone(988, 0.09, "sine", 0.024), 70);
    window.setTimeout(() => tone(1174, 0.11, "sine", 0.018), 150);
  },
  purr: () => {
    tone(98, 0.22, "sine", 0.018);
    window.setTimeout(() => tone(82, 0.28, "sine", 0.014), 160);
    window.setTimeout(() => tone(110, 0.2, "sine", 0.012), 340);
  },
  chirp: () => {
    tone(1760, 0.05, "sine", 0.018);
    window.setTimeout(() => tone(2093, 0.06, "sine", 0.014), 40);
  },
  buzz: () => {
    noise(0.07, 0.014, 900);
    tone(240, 0.05, "sawtooth", 0.01);
  },
  quack: () => {
    tone(280, 0.08, "sawtooth", 0.04);
    window.setTimeout(() => tone(190, 0.12, "sawtooth", 0.032), 70);
  },
  crow: () => {
    tone(380, 0.1, "sawtooth", 0.04);
    window.setTimeout(() => tone(620, 0.12, "sawtooth", 0.045), 90);
    window.setTimeout(() => tone(880, 0.16, "triangle", 0.04), 180);
    window.setTimeout(() => tone(340, 0.22, "sawtooth", 0.032), 340);
  },
  pant: (kind: "in" | "out" = "out") => {
    if (muted) return;
    const audio = ac();
    if (!audio) return;
    const now = audio.currentTime;
    const dur = kind === "in" ? 0.48 : 0.72;
    const src = audio.createBufferSource();
    src.buffer = noiseBuffer(audio);
    src.loop = true;
    const filter = audio.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = kind === "in" ? 0.7 : 0.55;
    if (kind === "in") {
      filter.frequency.setValueAtTime(780, now);
      filter.frequency.exponentialRampToValueAtTime(1680, now + dur);
    } else {
      filter.frequency.setValueAtTime(920, now);
      filter.frequency.exponentialRampToValueAtTime(280, now + dur);
    }
    const g = audio.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(kind === "in" ? 0.042 : 0.055, now + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(getSfxBus() ?? audio.destination);
    src.start(now);
    src.stop(now + dur + 0.04);
  },
  ribbit: () => {
    tone(310, 0.07, "triangle", 0.02);
    window.setTimeout(() => tone(210, 0.11, "sine", 0.016), 70);
  },
  chime: () => {
    tone(1046, 0.18, "sine", 0.016);
    window.setTimeout(() => tone(1318, 0.22, "sine", 0.012), 80);
    window.setTimeout(() => tone(1568, 0.28, "sine", 0.01), 180);
  },
  morning: () => {
    setMusicDuck(true);
    sfx.crow();
    sfx.chirp();
    window.setTimeout(() => tone(523, 0.22, "sine", 0.034), 80);
    window.setTimeout(() => tone(659, 0.22, "sine", 0.032), 240);
    window.setTimeout(() => tone(784, 0.28, "sine", 0.03), 420);
    window.setTimeout(() => tone(1046, 0.42, "sine", 0.028), 640);
    window.setTimeout(() => tone(784, 0.18, "sine", 0.02), 980);
    window.setTimeout(() => tone(1318, 0.55, "sine", 0.026), 1120);
    window.setTimeout(() => sfx.chirp(), 1500);
    window.setTimeout(() => tone(1568, 0.7, "sine", 0.018), 1680);
    window.setTimeout(() => setMusicDuck(false), 2800);
  },
  thud: () => {
    rumble(80, 0.7, 0.35);
    noise(0.1, 0.024, 280);
  },
  cricket: () => {
    const n = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      window.setTimeout(() => {
        tone(4200 + Math.random() * 900, 0.03, "square", 0.012);
      }, i * (40 + Math.random() * 30));
    }
  },
  stomp: () => {
    rumble(340, 1, 0.95);
    noise(0.28, 0.07, 110);
    tone(48, 0.32, "sine", 0.09);
    window.setTimeout(() => noise(0.16, 0.04, 70), 80);
    window.setTimeout(() => rumble(180, 0.7, 0.5), 110);
  },
  axeSlam: () => {
    rumble(320, 1, 0.82);
    noise(0.22, 0.055, 180);
    tone(78, 0.22, "sine", 0.05);
    window.setTimeout(() => noise(0.14, 0.032, 140), 70);
    window.setTimeout(() => rumble(140, 0.7, 0.45), 90);
  },
  kingFall: () => {
    rumble(900, 0.95, 0.7);
    noise(0.38, 0.05, 220);
    tone(196, 0.7, "sine", 0.05);
    window.setTimeout(() => tone(164, 0.85, "sine", 0.044), 420);
    window.setTimeout(() => {
      rumble(600, 0.7, 0.5);
      tone(130, 1.1, "triangle", 0.038);
    }, 980);
    window.setTimeout(() => tone(98, 1.35, "sine", 0.032), 1680);
    window.setTimeout(() => {
      rumble(400, 0.45, 0.35);
      tone(73, 1.8, "sine", 0.026);
      noise(0.22, 0.04, 140);
    }, 2500);
    window.setTimeout(() => tone(55, 2.2, "sine", 0.02), 3400);
  },
  knock: () => {
    noise(0.05, 0.02, 420);
    tone(210, 0.05, "triangle", 0.018);
  },
  heal: () => {
    tone(523, 0.12, "sine", 0.03);
    window.setTimeout(() => tone(659, 0.14, "sine", 0.028), 90);
    window.setTimeout(() => tone(784, 0.16, "sine", 0.026), 180);
    window.setTimeout(() => tone(1047, 0.22, "sine", 0.024), 280);
  },
  equip: () => {
    noise(0.08, 0.022, 1400);
    tone(494, 0.08, "triangle", 0.024);
    window.setTimeout(() => tone(392, 0.1, "sine", 0.02), 70);
  },
  select: () => {
    tone(587, 0.07, "sine", 0.022);
    window.setTimeout(() => tone(784, 0.09, "sine", 0.018), 50);
  },
  laugh: () => {
    tone(392, 0.09, "sine", 0.02);
    window.setTimeout(() => tone(494, 0.1, "sine", 0.018), 90);
    window.setTimeout(() => tone(330, 0.12, "sine", 0.016), 200);
  },
  lock: () => {
    rumble(35, 0.35, 0.4);
    tone(784, 0.08, "sine", 0.028);
    window.setTimeout(() => tone(1174, 0.12, "sine", 0.022), 60);
  },
  open: () => {
    noise(0.14, 0.02, 600);
    tone(330, 0.12, "sine", 0.024);
    window.setTimeout(() => tone(440, 0.16, "sine", 0.022), 90);
  },
  map: () => {
    tone(349, 0.1, "sine", 0.022);
    window.setTimeout(() => tone(294, 0.14, "sine", 0.02), 80);
  },
  scratch: () => noise(0.05, 0.018, 1800),
  fairy: () => {
    tone(988, 0.08, "sine", 0.02);
    window.setTimeout(() => tone(1319, 0.12, "sine", 0.016), 70);
  },
  locked: () => {
    tone(220, 0.1, "triangle", 0.02);
  },
  push: () => {
    rumble(40, 0.4, 0.25);
    noise(0.06, 0.016, 500);
  },
  plate: () => {
    tone(392, 0.1, "sine", 0.026);
    window.setTimeout(() => tone(523, 0.14, "sine", 0.022), 70);
  },
  switch: () => {
    tone(659, 0.1, "sine", 0.028);
    window.setTimeout(() => tone(784, 0.12, "sine", 0.024), 80);
    window.setTimeout(() => tone(988, 0.16, "sine", 0.02), 160);
  },
  key: () => {
    rumble(40, 0.35, 0.55);
    tone(784, 0.1, "sine", 0.028);
    window.setTimeout(() => tone(988, 0.12, "sine", 0.026), 80);
    window.setTimeout(() => tone(1175, 0.18, "sine", 0.022), 160);
  },
  chest: () => {
    rumble(110, 0.85, 0.55);
    noise(0.14, 0.03, 380);
    tone(196, 0.16, "sine", 0.03);
    window.setTimeout(() => tone(262, 0.16, "sine", 0.028), 90);
    window.setTimeout(() => tone(330, 0.18, "triangle", 0.03), 180);
    window.setTimeout(() => tone(392, 0.22, "sine", 0.032), 280);
    window.setTimeout(() => tone(523, 0.28, "triangle", 0.028), 400);
  },
  heart: () => {
    rumble(28, 0.25, 0.45);
    tone(880, 0.1, "sine", 0.034);
    window.setTimeout(() => tone(1175, 0.16, "sine", 0.03), 70);
    window.setTimeout(() => tone(1568, 0.2, "sine", 0.022), 150);
  },
  pick: () => {
    rumble(22, 0.2, 0.35);
    noise(0.06, 0.018, 500);
    tone(523, 0.08, "sine", 0.026);
    window.setTimeout(() => tone(659, 0.12, "sine", 0.022), 60);
  },
  throw: () => {
    rumble(40, 0.45, 0.25);
    noise(0.08, 0.018, 520);
  },
  smash: () => {
    rumble(70, 0.7, 0.35);
    noise(0.1, 0.022, 480);
  },
  block: () => {
    rumble(45, 0.45, 0.55);
    noise(0.06, 0.028, 1600);
    tone(740, 0.07, "triangle", 0.03);
    window.setTimeout(() => tone(1108, 0.09, "sine", 0.022), 40);
  },
  get: () => playFanfare("full"),
  rooster: () => playRooster(),
  splash: () => {
    rumble(70, 0.45, 0.3);
    noise(0.16, 0.04, 420);
    tone(180, 0.12, "sine", 0.03);
    window.setTimeout(() => noise(0.1, 0.022, 700), 80);
  },
  baa: () => {
    tone(280, 0.08, "sine", 0.022);
    window.setTimeout(() => tone(220, 0.14, "triangle", 0.02), 70);
    window.setTimeout(() => tone(190, 0.16, "sine", 0.016), 180);
  },
  creak: () => {
    noise(0.1, 0.014, 280);
    tone(140, 0.12, "triangle", 0.018);
    window.setTimeout(() => tone(110, 0.1, "sine", 0.012), 90);
  },
  bubble: () => {
    tone(420 + Math.random() * 180, 0.08, "sine", 0.016);
    window.setTimeout(() => tone(280 + Math.random() * 80, 0.1, "sine", 0.012), 40);
  },
  cluck: () => {
    tone(420 + Math.random() * 80, 0.05, "triangle", 0.012);
    window.setTimeout(() => tone(360 + Math.random() * 50, 0.04, "triangle", 0.01), 55);
  },
  howl: () => playHowl(),
  save: () => {
    rumble(30, 0.2, 0.4);
    tone(523, 0.1, "sine", 0.03);
    window.setTimeout(() => tone(659, 0.12, "sine", 0.028), 80);
    window.setTimeout(() => tone(784, 0.16, "sine", 0.032), 160);
    window.setTimeout(() => tone(1047, 0.28, "sine", 0.026), 260);
  },
  warp: () => {
    rumble(160, 0.55, 0.5);
    noise(0.22, 0.035, 280);
    tone(196, 0.2, "sine", 0.028);
    window.setTimeout(() => tone(294, 0.24, "sine", 0.026), 120);
    window.setTimeout(() => tone(392, 0.3, "triangle", 0.022), 260);
    window.setTimeout(() => tone(523, 0.4, "sine", 0.02), 420);
  },
  wind: () => {
    noise(0.55, 0.04, 360);
    window.setTimeout(() => noise(0.4, 0.03, 520), 180);
    window.setTimeout(() => noise(0.28, 0.022, 700), 360);
  },
  sparkle: () => {
    tone(1175, 0.07, "sine", 0.018);
    window.setTimeout(() => tone(1568, 0.1, "sine", 0.016), 50);
  },
  dive: () => {
    rumble(50, 0.35, 0.25);
    noise(0.12, 0.028, 380);
    tone(220, 0.1, "sine", 0.02);
  },
  echo: () => {
    rumble(50, 0.3, 0.4);
    tone(392, 0.12, "sine", 0.03);
    window.setTimeout(() => tone(523, 0.14, "sine", 0.028), 90);
    window.setTimeout(() => tone(659, 0.18, "sine", 0.026), 190);
    window.setTimeout(() => tone(392, 0.22, "triangle", 0.02), 340);
  },
  wish: () => {
    tone(659, 0.1, "sine", 0.028);
    window.setTimeout(() => tone(784, 0.12, "sine", 0.026), 80);
    window.setTimeout(() => tone(988, 0.2, "sine", 0.024), 170);
    window.setTimeout(() => tone(1319, 0.28, "sine", 0.018), 280);
  },
  skip: () => {
    rumble(40, 0.25, 0.4);
    tone(659, 0.08, "sine", 0.028);
    window.setTimeout(() => tone(784, 0.1, "sine", 0.026), 60);
    window.setTimeout(() => tone(988, 0.12, "sine", 0.024), 120);
    window.setTimeout(() => tone(1175, 0.16, "sine", 0.02), 190);
  },
  tweet: () => {
    tone(1480 + Math.random() * 220, 0.05, "sine", 0.014);
    window.setTimeout(() => tone(1680 + Math.random() * 180, 0.06, "sine", 0.012), 40);
  },
  fish: () => {
    noise(0.08, 0.018, 700);
    tone(520, 0.06, "sine", 0.012);
  },
  lull: () => {
    tone(392, 0.22, "sine", 0.03);
    window.setTimeout(() => tone(349, 0.24, "sine", 0.028), 200);
    window.setTimeout(() => tone(330, 0.28, "sine", 0.026), 420);
    window.setTimeout(() => tone(294, 0.4, "sine", 0.024), 680);
  },
  mill: () => {
    rumble(80, 0.4, 0.35);
    noise(0.18, 0.03, 180);
    tone(196, 0.2, "triangle", 0.03);
    window.setTimeout(() => tone(247, 0.16, "triangle", 0.024), 140);
  },
  watch: () => {
    tone(523, 0.12, "sine", 0.028);
    window.setTimeout(() => tone(659, 0.14, "sine", 0.026), 90);
    window.setTimeout(() => tone(784, 0.2, "sine", 0.024), 190);
    window.setTimeout(() => tone(1047, 0.28, "sine", 0.018), 320);
  },
  crackle: () => {
    noise(0.06, 0.016, 900);
    tone(180 + Math.random() * 80, 0.05, "sawtooth", 0.008);
  },
  rest: () => {
    tone(330, 0.14, "sine", 0.028);
    window.setTimeout(() => tone(392, 0.16, "sine", 0.026), 110);
    window.setTimeout(() => tone(494, 0.22, "sine", 0.024), 240);
    window.setTimeout(() => tone(330, 0.32, "triangle", 0.02), 400);
  },
  rows: () => {
    noise(0.12, 0.022, 420);
    tone(349, 0.1, "sine", 0.022);
    window.setTimeout(() => tone(440, 0.12, "sine", 0.02), 90);
    window.setTimeout(() => tone(523, 0.16, "sine", 0.018), 180);
  },
  flare: () => {
    rumble(60, 0.35, 0.4);
    noise(0.1, 0.03, 1400);
    tone(880, 0.08, "sine", 0.03);
    window.setTimeout(() => tone(1320, 0.16, "sine", 0.022), 70);
  },
  purse: () => {
    tone(523, 0.08, "triangle", 0.026);
    window.setTimeout(() => tone(659, 0.09, "triangle", 0.024), 70);
    window.setTimeout(() => tone(784, 0.1, "triangle", 0.022), 140);
    window.setTimeout(() => tone(988, 0.14, "triangle", 0.02), 220);
  },
  joke: () => {
    tone(784, 0.07, "square", 0.018);
    window.setTimeout(() => tone(659, 0.07, "square", 0.016), 80);
    window.setTimeout(() => tone(988, 0.1, "square", 0.014), 160);
    window.setTimeout(() => tone(523, 0.12, "triangle", 0.02), 260);
  },
  luck: () => {
    tone(440, 0.1, "sine", 0.026);
    window.setTimeout(() => tone(554, 0.1, "sine", 0.024), 90);
    window.setTimeout(() => tone(659, 0.12, "sine", 0.022), 180);
    window.setTimeout(() => tone(880, 0.2, "sine", 0.02), 280);
  },
  shade: () => {
    tone(196, 0.16, "sine", 0.028);
    window.setTimeout(() => tone(247, 0.18, "sine", 0.024), 140);
    window.setTimeout(() => tone(220, 0.28, "triangle", 0.02), 300);
  },
  loaf: () => {
    tone(392, 0.12, "sine", 0.026);
    window.setTimeout(() => tone(494, 0.12, "sine", 0.024), 110);
    window.setTimeout(() => tone(587, 0.2, "triangle", 0.022), 230);
  },
  root: () => {
    tone(174, 0.18, "triangle", 0.03);
    window.setTimeout(() => tone(220, 0.16, "triangle", 0.026), 140);
    window.setTimeout(() => tone(261, 0.22, "sine", 0.022), 280);
  },
  lamp: () => {
    tone(659, 0.1, "sine", 0.026);
    window.setTimeout(() => tone(784, 0.12, "sine", 0.024), 90);
    window.setTimeout(() => tone(988, 0.18, "sine", 0.02), 200);
  },
  gong: () => {
    rumble(90, 0.55, 0.5);
    tone(110, 0.5, "sine", 0.05);
    window.setTimeout(() => tone(165, 0.4, "triangle", 0.03), 80);
    window.setTimeout(() => tone(220, 0.6, "sine", 0.022), 200);
  },
  tick: () => {
    tone(880, 0.04, "square", 0.012);
  },
  fold: () => {
    tone(330, 0.12, "sine", 0.026);
    window.setTimeout(() => tone(392, 0.12, "sine", 0.022), 110);
    window.setTimeout(() => tone(262, 0.18, "triangle", 0.02), 240);
  },
  hide: () => {
    tone(392, 0.1, "sine", 0.02);
    window.setTimeout(() => tone(330, 0.14, "sine", 0.016), 90);
    window.setTimeout(() => tone(262, 0.22, "triangle", 0.014), 200);
  },
  chalk: () => {
    tone(740, 0.06, "square", 0.012);
    window.setTimeout(() => tone(698, 0.08, "square", 0.01), 70);
    window.setTimeout(() => tone(784, 0.12, "triangle", 0.014), 150);
  },
  name: () => {
    tone(494, 0.12, "sine", 0.022);
    window.setTimeout(() => tone(392, 0.14, "sine", 0.02), 120);
    window.setTimeout(() => tone(587, 0.22, "triangle", 0.018), 260);
  },
  nest: () => {
    tone(880, 0.06, "sine", 0.018);
    window.setTimeout(() => tone(988, 0.07, "sine", 0.016), 80);
    window.setTimeout(() => tone(1174, 0.1, "sine", 0.014), 160);
  },
  drip: () => {
    tone(1480, 0.04, "sine", 0.012);
    window.setTimeout(() => {
      tone(240, 0.09, "sine", 0.016);
      noise(0.05, 0.01, 1400);
    }, 55);
  },
  tide: () => {
    tone(220, 0.16, "sine", 0.028);
    window.setTimeout(() => tone(277, 0.14, "sine", 0.024), 120);
    window.setTimeout(() => tone(330, 0.22, "triangle", 0.02), 260);
  },
  breath: () => {
    tone(196, 0.22, "sine", 0.03);
    window.setTimeout(() => tone(247, 0.2, "sine", 0.024), 160);
    window.setTimeout(() => tone(294, 0.28, "triangle", 0.018), 340);
  },
  heat: () => {
    rumble(70, 0.22, 0.35);
    tone(165, 0.12, "triangle", 0.02);
    window.setTimeout(() => tone(220, 0.1, "square", 0.014), 90);
    window.setTimeout(() => tone(330, 0.16, "triangle", 0.016), 180);
  },
  quiet: () => {
    tone(196, 0.18, "sine", 0.018);
    window.setTimeout(() => tone(175, 0.22, "sine", 0.016), 140);
    window.setTimeout(() => tone(147, 0.3, "triangle", 0.014), 300);
  },
  drift: () => {
    tone(294, 0.14, "sine", 0.024);
    window.setTimeout(() => tone(349, 0.16, "sine", 0.02), 110);
    window.setTimeout(() => tone(440, 0.22, "triangle", 0.018), 240);
  },
};

let roosterEl: HTMLAudioElement | null = null;

function playRooster() {
  if (muted || typeof window === "undefined") return;
  if (!roosterEl) {
    roosterEl = new Audio("/game/sfx/rooster.mp3");
    roosterEl.preload = "auto";
  }
  try {
    roosterEl.pause();
    roosterEl.volume = 0.9;
    roosterEl.currentTime = 0;
    void roosterEl.play();
  } catch {
    /* ignore */
  }
}

function playHowl() {
  if (muted) return;
  const audio = ac();
  if (!audio) return;
  const now = audio.currentTime;
  const osc = audio.createOscillator();
  const g = audio.createGain();
  const f = audio.createBiquadFilter();
  osc.type = "sine";
  osc.frequency.setValueAtTime(240, now);
  osc.frequency.linearRampToValueAtTime(410, now + 0.65);
  osc.frequency.linearRampToValueAtTime(330, now + 1.1);
  osc.frequency.linearRampToValueAtTime(190, now + 2.15);
  f.type = "lowpass";
  f.frequency.value = 1100;
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.038, now + 0.22);
  g.gain.setValueAtTime(0.032, now + 1.1);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
  osc.connect(f);
  f.connect(g);
  g.connect(getSfxBus() ?? audio.destination);
  osc.start(now);
  osc.stop(now + 2.25);
}

function playGetFanfare() {
  playFanfare("full");
}
type Role = "lead" | "horn" | "pad" | "bass" | "harp" | "piano" | "drum";
type Note = { t: number; f: number; d: number; role?: Role; g?: number };

const THEMES: Record<string, { bpm: number; bars: number; notes: Note[] }> = {
  title: {
    bpm: 96,
    bars: 16,
    notes: (() => {
      const n: Note[] = [];
      const D = 146.83, A = 220, D4 = 293.66, F4 = 349.23, A4 = 440, D5 = 587.33, F5 = 698.46, A5 = 880;
      n.push(
        { t: 0, f: D4, d: 0.45, role: "horn", g: 0.07 },
        { t: 0.5, f: D4, d: 0.4, role: "horn", g: 0.065 },
        { t: 1, f: F4, d: 0.9, role: "horn", g: 0.075 },
        { t: 2, f: A4, d: 0.9, role: "horn", g: 0.078 },
        { t: 3, f: D5, d: 1.8, role: "horn", g: 0.084 },
        { t: 5, f: A4, d: 0.45, role: "lead", g: 0.06 },
        { t: 5.5, f: D5, d: 0.45, role: "lead", g: 0.064 },
        { t: 6, f: F5, d: 0.9, role: "lead", g: 0.07 },
        { t: 7, f: A5, d: 2.2, role: "lead", g: 0.074 },
        { t: 9.4, f: F5, d: 0.45, role: "horn", g: 0.06 },
        { t: 10, f: D5, d: 0.7, role: "horn", g: 0.062 },
        { t: 10.8, f: A4, d: 0.7, role: "horn", g: 0.058 },
        { t: 11.6, f: D5, d: 1.6, role: "horn", g: 0.07 },
        { t: 13.4, f: A4, d: 0.5, role: "lead", g: 0.056 },
        { t: 14, f: F4, d: 0.6, role: "lead", g: 0.054 },
        { t: 14.7, f: D4, d: 2.4, role: "lead", g: 0.06 },
        { t: 0, f: D, d: 8, role: "pad", g: 0.02 },
        { t: 0, f: A, d: 8, role: "pad", g: 0.014 },
        { t: 8, f: 174.61, d: 8, role: "pad", g: 0.02 },
        { t: 8, f: A, d: 8, role: "pad", g: 0.014 },
        { t: 0, f: D, d: 0.5, role: "bass", g: 0.06 },
        { t: 1, f: D, d: 0.5, role: "bass", g: 0.055 },
        { t: 2, f: A, d: 0.5, role: "bass", g: 0.055 },
        { t: 3, f: D, d: 0.7, role: "bass", g: 0.06 },
        { t: 8, f: 174.61, d: 0.5, role: "bass", g: 0.058 },
        { t: 9, f: 174.61, d: 0.5, role: "bass", g: 0.052 },
        { t: 10, f: A, d: 0.5, role: "bass", g: 0.052 },
        { t: 11, f: D, d: 0.8, role: "bass", g: 0.058 },
      );
      return n;
    })(),
  },
  field: {
    bpm: 126,
    bars: 16,
    notes: (() => {
      const n: Note[] = [];
      const D = 146.83, A = 220, F = 174.61, G = 196, D4 = 293.66, F4 = 349.23, G4 = 392, A4 = 440, C5 = 523.25, D5 = 587.33, F5 = 698.46, A5 = 880;
      const roots = [D, D, F, G, D, A, F, D];
      for (let bar = 0; bar < 16; bar++) {
        const r = roots[bar % 8]!;
        n.push({ t: bar * 4, f: r, d: 0.38, role: "bass", g: 0.062 });
        n.push({ t: bar * 4 + 1, f: r, d: 0.32, role: "bass", g: 0.052 });
        n.push({ t: bar * 4 + 2, f: r * 1.5, d: 0.32, role: "bass", g: 0.048 });
        n.push({ t: bar * 4 + 3, f: r, d: 0.34, role: "bass", g: 0.055 });
        n.push({ t: bar * 4, f: r * 2, d: 3.8, role: "pad", g: 0.012 });
      }
      const mel: [number, number, number][] = [
        [0, D4, 0.7], [0.75, A4, 0.22], [1, D5, 1.7],
        [3, C5, 0.35], [3.4, A4, 0.5],
        [4, F4, 0.35], [4.4, G4, 0.35], [4.8, A4, 0.7], [5.6, D5, 1.8],
        [8, A4, 0.35], [8.4, D5, 0.35], [8.8, F5, 0.7], [9.6, A5, 1.5],
        [11.2, F5, 0.35], [11.6, D5, 0.7],
        [12.4, A4, 0.35], [12.8, C5, 0.35], [13.2, D5, 0.7], [14, A4, 0.5], [14.6, D4, 1.4],
        [16, D5, 0.35], [16.4, F5, 0.35], [16.8, A5, 0.7], [17.6, F5, 0.4], [18.1, D5, 1.5],
        [20, A4, 0.3], [20.4, D5, 0.3], [20.8, F5, 0.5], [21.4, G4, 0.4], [21.9, A4, 1.6],
        [24, D4, 0.55], [24.6, A4, 0.25], [25, D5, 0.7], [25.8, F5, 0.9], [26.8, A5, 1.8],
        [28.8, F5, 0.4], [29.3, D5, 0.5], [29.9, A4, 0.5], [30.5, D5, 1.4],
        [32, D4, 0.5], [32.6, F4, 0.35], [33, A4, 0.7], [33.8, D5, 1.0],
        [35, C5, 0.4], [35.5, A4, 0.5], [36.1, F4, 0.5], [36.7, D4, 2.6],
      ];
      for (const [t, f, d] of mel) n.push({ t, f, d, role: "lead", g: 0.072 });
      n.push(
        { t: 1, f: A4, d: 1.6, role: "horn", g: 0.038 },
        { t: 5.6, f: D5, d: 1.8, role: "horn", g: 0.04 },
        { t: 9.6, f: A5, d: 1.5, role: "horn", g: 0.042 },
        { t: 14.6, f: D4, d: 1.4, role: "horn", g: 0.036 },
        { t: 18.1, f: D5, d: 1.6, role: "horn", g: 0.04 },
        { t: 21.9, f: A4, d: 1.6, role: "horn", g: 0.036 },
        { t: 26.8, f: A5, d: 1.8, role: "horn", g: 0.044 },
        { t: 33.8, f: D5, d: 2.0, role: "horn", g: 0.042 },
        { t: 36.7, f: D4, d: 2.4, role: "horn", g: 0.038 },
      );
      return n;
    })(),
  },
  battle: {
    bpm: 152,
    bars: 8,
    notes: (() => {
      const n: Note[] = [];
      const ost = [73.42, 73.42, 73.42, 87.31, 73.42, 73.42, 110, 98];
      for (let bar = 0; bar < 8; bar++) {
        const lift = bar >= 4 ? 1.125 : 1;
        for (let i = 0; i < 8; i++) {
          n.push({ t: bar * 4 + i * 0.5, f: ost[i]! * lift, d: 0.2, role: "bass", g: 0.078 });
        }
        for (let b = 0; b < 4; b++) {
          const snare = b % 2 === 1;
          n.push({
            t: bar * 4 + b,
            f: snare ? 1800 : 52,
            d: snare ? 0.09 : 0.14,
            role: "drum",
            g: snare ? 0.05 : 0.09,
          });
        }
        if (bar % 2 === 1) {
          n.push({ t: bar * 4 + 1.5, f: 1800, d: 0.06, role: "drum", g: 0.028 });
          n.push({ t: bar * 4 + 3.5, f: 1800, d: 0.06, role: "drum", g: 0.028 });
        }
      }
      const lead: Note[] = [
        { t: 0, f: 293.66, d: 0.35, role: "lead", g: 0.078 },
        { t: 0.5, f: 293.66, d: 0.22, role: "lead", g: 0.07 },
        { t: 1, f: 349.23, d: 0.45, role: "lead", g: 0.082 },
        { t: 1.5, f: 440, d: 0.7, role: "lead", g: 0.086 },
        { t: 2.5, f: 392, d: 0.35, role: "lead", g: 0.074 },
        { t: 3, f: 349.23, d: 0.35, role: "lead", g: 0.074 },
        { t: 3.5, f: 329.63, d: 0.45, role: "lead", g: 0.076 },
        { t: 4, f: 293.66, d: 0.3, role: "lead", g: 0.078 },
        { t: 4.5, f: 349.23, d: 0.22, role: "lead", g: 0.074 },
        { t: 5, f: 392, d: 0.35, role: "lead", g: 0.08 },
        { t: 5.5, f: 440, d: 0.45, role: "lead", g: 0.084 },
        { t: 6, f: 523.25, d: 0.35, role: "lead", g: 0.086 },
        { t: 6.5, f: 587.33, d: 1.2, role: "lead", g: 0.09 },
        { t: 8, f: 440, d: 0.28, role: "lead", g: 0.08 },
        { t: 8.5, f: 466.16, d: 0.28, role: "lead", g: 0.08 },
        { t: 9, f: 440, d: 0.35, role: "lead", g: 0.082 },
        { t: 9.5, f: 392, d: 0.45, role: "lead", g: 0.078 },
        { t: 10.5, f: 349.23, d: 0.35, role: "lead", g: 0.076 },
        { t: 11, f: 293.66, d: 0.35, role: "lead", g: 0.076 },
        { t: 11.5, f: 220, d: 0.45, role: "lead", g: 0.074 },
        { t: 12, f: 293.66, d: 0.28, role: "lead", g: 0.08 },
        { t: 12.5, f: 349.23, d: 0.28, role: "lead", g: 0.082 },
        { t: 13, f: 440, d: 0.35, role: "lead", g: 0.086 },
        { t: 13.5, f: 523.25, d: 0.4, role: "lead", g: 0.088 },
        { t: 14, f: 587.33, d: 0.35, role: "lead", g: 0.09 },
        { t: 14.5, f: 698.46, d: 1.3, role: "lead", g: 0.094 },
        { t: 16, f: 587.33, d: 0.4, role: "lead", g: 0.086 },
        { t: 16.5, f: 523.25, d: 0.3, role: "lead", g: 0.082 },
        { t: 17, f: 440, d: 0.35, role: "lead", g: 0.08 },
        { t: 17.5, f: 392, d: 0.3, role: "lead", g: 0.078 },
        { t: 18, f: 349.23, d: 0.35, role: "lead", g: 0.076 },
        { t: 18.5, f: 329.63, d: 0.4, role: "lead", g: 0.076 },
        { t: 19, f: 293.66, d: 0.45, role: "lead", g: 0.08 },
        { t: 19.5, f: 220, d: 0.4, role: "lead", g: 0.074 },
        { t: 20, f: 293.66, d: 0.28, role: "lead", g: 0.082 },
        { t: 20.5, f: 349.23, d: 0.28, role: "lead", g: 0.084 },
        { t: 21, f: 440, d: 0.28, role: "lead", g: 0.086 },
        { t: 21.5, f: 523.25, d: 0.28, role: "lead", g: 0.088 },
        { t: 22, f: 587.33, d: 0.35, role: "lead", g: 0.09 },
        { t: 22.5, f: 698.46, d: 0.4, role: "lead", g: 0.094 },
        { t: 23, f: 880, d: 1.6, role: "lead", g: 0.096 },
        { t: 25, f: 698.46, d: 0.4, role: "lead", g: 0.086 },
        { t: 25.5, f: 587.33, d: 0.35, role: "lead", g: 0.082 },
        { t: 26, f: 523.25, d: 0.4, role: "lead", g: 0.08 },
        { t: 26.5, f: 440, d: 0.4, role: "lead", g: 0.078 },
        { t: 27, f: 392, d: 0.5, role: "lead", g: 0.078 },
        { t: 27.6, f: 349.23, d: 0.5, role: "lead", g: 0.076 },
        { t: 28.2, f: 293.66, d: 1.8, role: "lead", g: 0.084 },
      ];
      n.push(...lead);
      n.push(
        { t: 0, f: 293.66, d: 1.4, role: "horn", g: 0.042 },
        { t: 4, f: 349.23, d: 1.4, role: "horn", g: 0.04 },
        { t: 8, f: 440, d: 1.6, role: "horn", g: 0.044 },
        { t: 12, f: 523.25, d: 1.8, role: "horn", g: 0.046 },
        { t: 16, f: 440, d: 1.5, role: "horn", g: 0.044 },
        { t: 20, f: 587.33, d: 1.8, role: "horn", g: 0.048 },
        { t: 24, f: 698.46, d: 2.2, role: "horn", g: 0.05 },
        { t: 28, f: 293.66, d: 3.2, role: "horn", g: 0.044 },
        { t: 0, f: 146.83, d: 16, role: "pad", g: 0.02 },
        { t: 0, f: 220, d: 16, role: "pad", g: 0.014 },
        { t: 16, f: 174.61, d: 16, role: "pad", g: 0.022 },
        { t: 16, f: 220, d: 16, role: "pad", g: 0.014 },
      );
      return n;
    })(),
  },
  shop: {
    bpm: 84,
    bars: 8,
    notes: [
      { t: 0, f: 659.25, d: 0.7, role: "lead", g: 0.032 },
      { t: 0.8, f: 784, d: 0.5, role: "lead", g: 0.03 },
      { t: 1.4, f: 659.25, d: 0.7, role: "lead", g: 0.03 },
      { t: 2.2, f: 523.25, d: 1, role: "lead", g: 0.028 },
      { t: 3.4, f: 587.33, d: 0.6, role: "lead", g: 0.028 },
      { t: 4.1, f: 659.25, d: 1.2, role: "lead", g: 0.032 },
      { t: 5.5, f: 880, d: 0.8, role: "lead", g: 0.03 },
      { t: 6.4, f: 784, d: 1.8, role: "lead", g: 0.032 },
      { t: 0, f: 329.63, d: 8, role: "pad", g: 0.01 },
      { t: 0, f: 493.88, d: 8, role: "pad", g: 0.008 },
      { t: 8, f: 261.63, d: 4, role: "pad", g: 0.01 },
    ],
  },
  ride: {
    bpm: 136,
    bars: 8,
    notes: (() => {
      const n: Note[] = [];
      const D = 146.83, A = 220, D4 = 293.66, F4 = 349.23, A4 = 440, D5 = 587.33, F5 = 698.46;
      for (let i = 0; i < 16; i++) {
        n.push({ t: i * 0.5, f: i % 2 ? A : D, d: 0.22, role: "bass", g: 0.055 });
      }
      n.push(
        { t: 0, f: D4, d: 0.22, role: "lead", g: 0.07 },
        { t: 0.5, f: F4, d: 0.22, role: "lead", g: 0.068 },
        { t: 1, f: A4, d: 0.45, role: "lead", g: 0.074 },
        { t: 1.6, f: D5, d: 0.7, role: "lead", g: 0.08 },
        { t: 2.4, f: A4, d: 0.3, role: "lead", g: 0.068 },
        { t: 2.8, f: F5, d: 0.9, role: "lead", g: 0.078 },
        { t: 3.8, f: D5, d: 0.45, role: "horn", g: 0.05 },
        { t: 4.4, f: A4, d: 0.3, role: "lead", g: 0.068 },
        { t: 4.8, f: D5, d: 0.3, role: "lead", g: 0.072 },
        { t: 5.2, f: F5, d: 1.1, role: "lead", g: 0.08 },
        { t: 6.4, f: D5, d: 1.4, role: "horn", g: 0.055 },
        { t: 0, f: D, d: 8, role: "pad", g: 0.016 },
        { t: 0, f: A, d: 8, role: "pad", g: 0.01 },
      );
      return n;
    })(),
  },
  town: {
    bpm: 112,
    bars: 8,
    notes: (() => {
      const n: Note[] = [];
      const D = 146.83, A = 220, D4 = 293.66, F4 = 349.23, A4 = 440, D5 = 587.33;
      n.push(
        { t: 0, f: D4, d: 0.7, role: "horn", g: 0.06 },
        { t: 0.8, f: A4, d: 0.35, role: "horn", g: 0.055 },
        { t: 1.2, f: D5, d: 1.4, role: "horn", g: 0.068 },
        { t: 2.8, f: A4, d: 0.45, role: "lead", g: 0.055 },
        { t: 3.4, f: F4, d: 0.7, role: "lead", g: 0.052 },
        { t: 4.2, f: D4, d: 0.45, role: "horn", g: 0.055 },
        { t: 4.8, f: F4, d: 0.45, role: "horn", g: 0.055 },
        { t: 5.4, f: A4, d: 1.8, role: "horn", g: 0.065 },
        { t: 7.4, f: D5, d: 0.5, role: "lead", g: 0.06 },
        { t: 8, f: A4, d: 0.5, role: "lead", g: 0.055 },
        { t: 8.6, f: D4, d: 2.2, role: "horn", g: 0.06 },
        { t: 0, f: D, d: 5, role: "bass", g: 0.05 },
        { t: 5, f: A, d: 5, role: "bass", g: 0.048 },
        { t: 0, f: D, d: 10, role: "pad", g: 0.016 },
        { t: 0, f: A, d: 10, role: "pad", g: 0.01 },
      );
      return n;
    })(),
  },
  keep: {
    bpm: 68,
    bars: 8,
    notes: [
      { t: 0, f: 329.63, d: 2.4, role: "lead", g: 0.03 },
      { t: 2.6, f: 392, d: 2, role: "lead", g: 0.028 },
      { t: 4.8, f: 349.23, d: 2.4, role: "lead", g: 0.03 },
      { t: 7.4, f: 293.66, d: 2.8, role: "lead", g: 0.028 },
      { t: 10.4, f: 329.63, d: 3.2, role: "lead", g: 0.03 },
      { t: 0.6, f: 493.88, d: 3, role: "horn", g: 0.014 },
      { t: 4.8, f: 440, d: 3, role: "horn", g: 0.013 },
      { t: 9.2, f: 392, d: 3.4, role: "horn", g: 0.014 },
      { t: 0, f: 261.63, d: 8, role: "pad", g: 0.012 },
      { t: 0, f: 329.63, d: 8, role: "pad", g: 0.01 },
      { t: 8, f: 220, d: 6, role: "pad", g: 0.012 },
      { t: 8, f: 329.63, d: 6, role: "pad", g: 0.01 },
    ],
  },
  dungeon: {
    bpm: 70,
    bars: 8,
    notes: [
      { t: 0, f: 349.23, d: 1.8, role: "lead", g: 0.026 },
      { t: 2, f: 329.63, d: 1.6, role: "lead", g: 0.024 },
      { t: 3.8, f: 392, d: 2.2, role: "lead", g: 0.028 },
      { t: 6.2, f: 293.66, d: 2, role: "lead", g: 0.024 },
      { t: 8.4, f: 349.23, d: 1.6, role: "lead", g: 0.026 },
      { t: 10.2, f: 440, d: 2.6, role: "lead", g: 0.028 },
      { t: 13.2, f: 392, d: 1.8, role: "lead", g: 0.026 },
      { t: 15.2, f: 329.63, d: 1.6, role: "lead", g: 0.024 },
      { t: 17, f: 349.23, d: 2.4, role: "lead", g: 0.028 },
      { t: 19.6, f: 293.66, d: 2.2, role: "lead", g: 0.024 },
      { t: 22.2, f: 440, d: 3.2, role: "lead", g: 0.03 },
      { t: 1, f: 523.25, d: 2, role: "horn", g: 0.012 },
      { t: 6.4, f: 493.88, d: 2.2, role: "horn", g: 0.012 },
      { t: 10.4, f: 587.33, d: 2.2, role: "horn", g: 0.012 },
      { t: 15.4, f: 523.25, d: 2.4, role: "horn", g: 0.012 },
      { t: 19.8, f: 659.25, d: 2.6, role: "horn", g: 0.013 },
      { t: 0, f: 220, d: 8, role: "pad", g: 0.011 },
      { t: 8, f: 246.94, d: 6, role: "pad", g: 0.011 },
      { t: 14.4, f: 196, d: 6.4, role: "pad", g: 0.011 },
      { t: 21, f: 220, d: 6, role: "pad", g: 0.011 },
    ],
  },
  cook: {
    bpm: 84,
    bars: 8,
    notes: [
      { t: 0, f: 392, d: 0.7, role: "lead", g: 0.03 },
      { t: 0.8, f: 440, d: 0.55, role: "lead", g: 0.028 },
      { t: 1.4, f: 523.25, d: 0.9, role: "lead", g: 0.032 },
      { t: 2.4, f: 440, d: 0.55, role: "lead", g: 0.028 },
      { t: 3, f: 392, d: 0.7, role: "lead", g: 0.03 },
      { t: 3.8, f: 329.63, d: 1.1, role: "lead", g: 0.03 },
      { t: 5.1, f: 349.23, d: 0.55, role: "lead", g: 0.026 },
      { t: 5.7, f: 392, d: 0.7, role: "lead", g: 0.028 },
      { t: 6.5, f: 523.25, d: 1.4, role: "lead", g: 0.032 },
      { t: 8.1, f: 440, d: 1.1, role: "lead", g: 0.028 },
      { t: 9.3, f: 392, d: 1.6, role: "lead", g: 0.03 },
      { t: 0.2, f: 196, d: 4.4, role: "pad", g: 0.012 },
      { t: 4.6, f: 246.94, d: 5.2, role: "pad", g: 0.012 },
      { t: 1.4, f: 783.99, d: 0.35, role: "horn", g: 0.01 },
      { t: 6.5, f: 659.25, d: 0.4, role: "horn", g: 0.01 },
    ],
  },
  chamber: {
    bpm: 64,
    bars: 8,
    notes: [
      { t: 0, f: 523.25, d: 0.9, role: "lead", g: 0.038 },
      { t: 1, f: 659.25, d: 0.9, role: "lead", g: 0.04 },
      { t: 2, f: 783.99, d: 1.2, role: "lead", g: 0.042 },
      { t: 3.3, f: 1046.5, d: 1.8, role: "lead", g: 0.044 },
      { t: 5.3, f: 987.77, d: 0.7, role: "lead", g: 0.036 },
      { t: 6.1, f: 880, d: 0.7, role: "lead", g: 0.036 },
      { t: 6.9, f: 783.99, d: 1.1, role: "lead", g: 0.038 },
      { t: 8.2, f: 659.25, d: 0.8, role: "lead", g: 0.036 },
      { t: 9.1, f: 783.99, d: 1.4, role: "lead", g: 0.04 },
      { t: 10.7, f: 1046.5, d: 2.4, role: "lead", g: 0.044 },
      { t: 0.2, f: 261.63, d: 6, role: "pad", g: 0.014 },
      { t: 6.2, f: 329.63, d: 7, role: "pad", g: 0.014 },
      { t: 1.1, f: 392, d: 4, role: "horn", g: 0.016 },
      { t: 5.4, f: 523.25, d: 4.6, role: "horn", g: 0.016 },
      { t: 10, f: 659.25, d: 3.2, role: "horn", g: 0.015 },
    ],
  },
};

function beatSec(bpm: number) {
  return 60 / bpm;
}

let noiseBuf: AudioBuffer | null = null;

function noiseBuffer(audio: AudioContext) {
  if (noiseBuf) return noiseBuf;
  const len = Math.floor(audio.sampleRate * 0.22);
  noiseBuf = audio.createBuffer(1, len, audio.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuf;
}

function spawnDrum(audio: AudioContext, dest: AudioNode, freq: number, start: number, dur: number, gain: number) {
  const snare = freq > 400;
  const src = audio.createBufferSource();
  src.buffer = noiseBuffer(audio);
  const filter = audio.createBiquadFilter();
  filter.type = snare ? "highpass" : "lowpass";
  filter.frequency.value = snare ? 1400 : 180;
  filter.Q.value = snare ? 0.7 : 1.1;
  const g = audio.createGain();
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), start + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(filter);
  filter.connect(g);
  g.connect(dest);
  src.start(start);
  src.stop(start + dur + 0.04);
  voices.push(src);
  if (!snare) {
    const thump = audio.createOscillator();
    thump.type = "sine";
    thump.frequency.setValueAtTime(freq, start);
    thump.frequency.exponentialRampToValueAtTime(36, start + dur);
    const tg = audio.createGain();
    tg.gain.setValueAtTime(0.0001, start);
    tg.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain * 1.35), start + 0.01);
    tg.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    thump.connect(tg);
    tg.connect(dest);
    thump.start(start);
    thump.stop(start + dur + 0.04);
    voices.push(thump);
  }
}

function stopMusic() {
  if (musicTimer != null) {
    window.clearTimeout(musicTimer);
    musicTimer = null;
  }
  for (const v of voices.splice(0)) {
    try {
      v.stop();
    } catch {
      /* already stopped */
    }
  }
}

function spawnVoice(
  audio: AudioContext,
  dest: AudioNode,
  freq: number,
  start: number,
  dur: number,
  role: Role,
  gain: number,
) {
  if (role === "drum") {
    spawnDrum(audio, dest, freq, start, dur, gain);
    return;
  }
  const osc = audio.createOscillator();
  const g = audio.createGain();
  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  if (role === "pad") {
    osc.type = "sine";
    filter.frequency.value = 900;
  } else if (role === "horn") {
    osc.type = "sawtooth";
    filter.frequency.value = 1650;
  } else if (role === "bass") {
    osc.type = "triangle";
    filter.frequency.value = 320;
    if (freq < 90) freq = freq * 2;
  } else if (role === "harp" || role === "piano") {
    osc.type = "triangle";
    filter.frequency.value = role === "piano" ? 1900 : 2400;
  } else {
    osc.type = "sawtooth";
    filter.frequency.value = 1800;
  }
  osc.frequency.value = freq;
  const attack = role === "pad" ? 0.7 : role === "horn" ? 0.16 : role === "bass" ? 0.2 : role === "harp" ? 0.02 : role === "piano" ? 0.01 : 0.1;
  const release = role === "harp" ? Math.min(0.45, dur * 0.7) : role === "piano" ? Math.min(2.4, dur * 0.82) : Math.min(0.9, dur * 0.35);
  const peakAt = start + attack;
  const fadeAt = start + Math.max(attack + 0.05, dur - release);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), peakAt);
  if (role === "piano") {
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain * 0.38), peakAt + Math.min(0.42, dur * 0.28));
  }
  g.gain.setValueAtTime(Math.max(0.0002, gain * (role === "piano" ? 0.28 : 0.85)), fadeAt);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(filter);
  filter.connect(g);
  if (role === "piano") {
    const body = audio.createOscillator();
    body.type = "sine";
    body.frequency.value = freq;
    const bg = audio.createGain();
    bg.gain.value = 0.55;
    body.connect(bg);
    bg.connect(g);
    body.start(start);
    body.stop(start + dur + 0.03);
    voices.push(body);
    const harm = audio.createOscillator();
    harm.type = "sine";
    harm.frequency.value = freq * 2;
    const hg = audio.createGain();
    hg.gain.value = 0.18;
    harm.connect(hg);
    hg.connect(g);
    harm.start(start);
    harm.stop(start + dur + 0.03);
    voices.push(harm);
  }
  g.connect(dest);
  osc.start(start);
  osc.stop(start + dur + 0.03);
  voices.push(osc);
}

function scheduleTheme(name: string) {
  if (muted) return;
  const audio = ac();
  const spec = THEMES[name];
  if (!audio || !spec) return;
  const dest = bus(audio);
  const beat = beatSec(spec.bpm);
  let phrase = 0;
  for (const n of spec.notes) {
    phrase = Math.max(phrase, n.t * beat + n.d);
  }
  const start = audio.currentTime + 0.02;
  for (const n of spec.notes) {
    const role = n.role ?? "lead";
    const gain = n.g ?? 0.03;
    const when = start + n.t * beat;
    spawnVoice(audio, dest, n.f, when, n.d, role, gain);
    if (role === "pad") {
      spawnVoice(audio, dest, n.f * 1.006, when, n.d, role, gain * 0.7);
    }
  }
  const overlap = 1.55;
  musicTimer = window.setTimeout(() => {
    voices.length = 0;
    if (theme === name && !muted) scheduleTheme(name);
  }, Math.max(500, (phrase - overlap) * 1000));
}

export function playTheme(name: Parameters<typeof playScore>[0]) {
  theme = name === "none" || name === "title" || name === "field" || name === "battle" || name === "shop" || name === "ride" || name === "town" || name === "keep" || name === "dungeon" || name === "cook" || name === "chamber" ? (name === "none" ? null : (name as ThemeName)) : theme;
  playScore(name);
}

type PipeVoice = {
  osc: OscillatorNode;
  harm: OscillatorNode;
  vib: OscillatorNode;
  g: GainNode;
};

let pipe: PipeVoice | null = null;
let replayTimer: number | null = null;

export function startOcarina(freq: number) {
  if (muted) return;
  stopOcarina();
  const audio = ac();
  if (!audio) return;
  const osc = audio.createOscillator();
  osc.type = "sine";
  osc.frequency.value = freq;
  const harm = audio.createOscillator();
  harm.type = "triangle";
  harm.frequency.value = freq * 2;
  const vib = audio.createOscillator();
  vib.frequency.value = 5.4;
  const vibG = audio.createGain();
  vibG.gain.value = 5.5;
  vib.connect(vibG);
  vibG.connect(osc.frequency);
  const lp = audio.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 2400;
  const g = audio.createGain();
  g.gain.setValueAtTime(0.0001, audio.currentTime);
  g.gain.exponentialRampToValueAtTime(0.2, audio.currentTime + 0.05);
  const hg = audio.createGain();
  hg.gain.value = 0.042;
  osc.connect(lp);
  harm.connect(hg);
  hg.connect(lp);
  lp.connect(g);
  g.connect(getSfxBus() ?? audio.destination);
  osc.start();
  harm.start();
  vib.start();
  pipe = { osc, harm, vib, g };
}

export function stopOcarina() {
  if (!pipe) return;
  const audio = ac();
  const now = audio ? audio.currentTime : 0;
  const v = pipe;
  pipe = null;
  try {
    const cur = Math.max(0.0002, v.g.gain.value || 0.05);
    v.g.gain.cancelScheduledValues(now);
    v.g.gain.setValueAtTime(cur, now);
    v.g.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
  } catch {
    /* ignore */
  }
  window.setTimeout(() => {
    try {
      v.osc.stop();
      v.harm.stop();
      v.vib.stop();
    } catch {
      /* already stopped */
    }
  }, 180);
}

export function muffleOcarina(freq: number) {
  if (muted) return;
  stopOcarina();
  const audio = ac();
  if (!audio) return;
  startOcarina(freq);
  if (!pipe) return;
  const now = audio.currentTime;
  try {
    pipe.g.gain.cancelScheduledValues(now);
    pipe.g.gain.setValueAtTime(0.018, now);
    pipe.g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
  } catch {
    /* ignore */
  }
  window.setTimeout(() => stopOcarina(), 130);
}

export function replayOcarinaSong(notes: string[], freqs: Record<string, number>, done: () => void) {
  if (replayTimer != null) window.clearTimeout(replayTimer);
  stopOcarina();
  let i = 0;
  const step = () => {
    if (i >= notes.length) {
      stopOcarina();
      replayTimer = null;
      done();
      return;
    }
    const f = freqs[notes[i]!] ?? 440;
    startOcarina(f);
    i += 1;
    const hold = i > notes.length - 5 ? 460 : 400;
    replayTimer = window.setTimeout(() => {
      stopOcarina();
      replayTimer = window.setTimeout(step, 85);
    }, hold);
  };
  step();
}
