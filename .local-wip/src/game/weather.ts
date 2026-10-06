/** Dynamic weather. Ticks on live. No React. Do not import village / journey / actors. */
import { live, gameClock } from "./world3d/live";
import { landAt, dryBedU, type LandId } from "./world3d/lands";
import { heightAt } from "./world3d/field";
import { hasMystery } from "./mystery";

export type WeatherKind = "sun" | "cloud" | "rain" | "storm" | "fog" | "snow";

export type WeatherSnap = {
  kind: WeatherKind;
  hold: number;
  rain: number;
  storm: number;
  fog: number;
  snow: number;
  cloud: number;
  flash: number;
  thunderT: number;
  slipX: number;
  slipZ: number;
  forced: boolean;
  said: WeatherKind | null;
};

export const weather: WeatherSnap = {
  kind: "sun",
  hold: 42,
  rain: 0,
  storm: 0,
  fog: 0,
  snow: 0,
  cloud: 0.12,
  flash: 0,
  thunderT: 5,
  slipX: 0,
  slipZ: 0,
  forced: false,
  said: "sun",
};

/** Lookout stone — a four that only reads when lightning writes. */
export const STORM_STONE = { x: -26.4, z: -38.2 };

/** Whisperwood trail crumbs. Fog eats them. */
export const WOOD_MARKS: { x: number; z: number }[] = [
  { x: -380, z: -72 },
  { x: -458, z: -56 },
  { x: -538, z: -38 },
  { x: -628, z: -24 },
  { x: -718, z: -14 },
];

export const FOG_BANKS: { x: number; z: number; r: number }[] = [
  { x: -718, z: -14, r: 30 },
  { x: -380, z: -72, r: 22 },
  { x: -1048, z: 54, r: 26 },
];

const SAY: Record<WeatherKind, string> = {
  sun: "The sky opened.",
  cloud: "Clouds over the vale.",
  rain: "Rain. The river is coming up. The lookout gully is filling.",
  storm: "A storm. Things in the grass that were not there.",
  fog: "Fog. The west trees ate the path.",
  snow: "Snow. Watch your feet.",
};

export function weatherWeights(
  land: LandId,
  night: boolean,
  hour: number,
  prev: WeatherKind,
): Record<WeatherKind, number> {
  const w: Record<WeatherKind, number> = {
    sun: 38,
    cloud: 24,
    rain: 16,
    storm: 5,
    fog: 9,
    snow: 2,
  };
  if (land === "desert") {
    w.sun = 58;
    w.cloud = 28;
    w.rain = 2;
    w.storm = 1;
    w.fog = 3;
    w.snow = 0;
  } else if (land === "snow") {
    w.sun = 8;
    w.cloud = 14;
    w.rain = 0;
    w.storm = 8;
    w.fog = 12;
    w.snow = 52;
  } else if (land === "swamp") {
    w.sun = 10;
    w.cloud = 16;
    w.rain = 24;
    w.storm = 8;
    w.fog = 32;
    w.snow = 0;
  } else if (land === "forest") {
    w.fog += 12;
    w.rain += 8;
    w.sun -= 10;
  } else if (land === "mount") {
    w.snow += 12;
    w.fog += 8;
    w.storm += 4;
  } else if (land === "river") {
    w.rain += 10;
    w.fog += 4;
  }
  if (night) {
    w.fog += 12;
    w.storm += 8;
    w.sun = Math.max(4, w.sun - 18);
  }
  if (hour >= 6 && hour < 10) w.fog += 14;
  if (prev === "rain") {
    w.fog += 10;
    w.cloud += 12;
    w.rain -= 8;
  }
  if (prev === "storm") {
    w.rain += 16;
    w.fog += 10;
    w.storm -= 3;
  }
  if (prev === "sun") w.cloud += 8;
  for (const k of Object.keys(w) as WeatherKind[]) w[k] = Math.max(0, w[k]);
  return w;
}

export function pickWeighted(w: Record<WeatherKind, number>, roll: number): WeatherKind {
  const keys = Object.keys(w) as WeatherKind[];
  let sum = 0;
  for (const k of keys) sum += w[k]!;
  if (sum <= 0) return "sun";
  let t = (((roll % 1) + 1) % 1) * sum;
  for (const k of keys) {
    t -= w[k]!;
    if (t <= 0) return k;
  }
  return keys[keys.length - 1] ?? "sun";
}

function holdFor(kind: WeatherKind) {
  if (kind === "sun") return 48 + Math.random() * 42;
  if (kind === "cloud") return 32 + Math.random() * 28;
  if (kind === "rain") return 28 + Math.random() * 26;
  if (kind === "storm") return 18 + Math.random() * 16;
  if (kind === "fog") return 24 + Math.random() * 22;
  return 30 + Math.random() * 24;
}

function toward(kind: WeatherKind) {
  return {
    rain: kind === "rain" ? 0.78 : kind === "storm" ? 1 : 0,
    storm: kind === "storm" ? 1 : 0,
    fog: kind === "fog" ? 1 : kind === "rain" ? 0.18 : kind === "storm" ? 0.28 : 0,
    snow: kind === "snow" ? 1 : 0,
    cloud: kind === "cloud" ? 0.85 : kind === "rain" || kind === "storm" ? 0.7 : kind === "fog" ? 0.45 : 0.1,
  };
}

function snapTo(kind: WeatherKind, k = 1) {
  const t = toward(kind);
  weather.rain = t.rain * k;
  weather.storm = t.storm * k;
  weather.fog = t.fog * k;
  weather.snow = t.snow * k;
  weather.cloud = t.cloud * k;
}

export function forceWeather(kind: WeatherKind, seconds = 40) {
  weather.kind = kind;
  weather.hold = seconds;
  weather.forced = true;
  weather.thunderT = kind === "storm" ? 1.2 : 8;
  snapTo(kind, 1);
  syncLive();
  if (kind === "rain" || kind === "storm") live.rainT = Math.max(live.rainT, seconds);
  if (kind === "fog") live.fogT = Math.max(live.fogT, 0.72);
  say(kind, true);
}

function say(kind: WeatherKind, forced = false) {
  if (weather.said === kind && !forced) return;
  weather.said = kind;
  if (live.playT < 6) return;
  if (live.talking || live.house) return;
  live.hint = SAY[kind];
}

function pickNext() {
  weather.forced = false;
  const land = landAt(live.x, live.z).id;
  const { t: hour } = gameClock();
  const w = weatherWeights(land, live.night, hour, weather.kind);
  const next = pickWeighted(w, Math.random());
  weather.kind = next;
  weather.hold = holdFor(next);
  weather.thunderT = next === "storm" ? 1.6 : 7;
  say(next);
}

function syncLive() {
  live.weatherRise = riverBoost();
  const want = weather.rain > 0.22 ? Math.min(1, (weather.rain - 0.16) / 0.55) : 0;
  if (want > live.dryFlow) live.dryFlow = want;
  if (weather.kind === "rain" || weather.kind === "storm") {
    live.rainT = Math.max(live.rainT, 0.9);
  }
  if (weather.kind === "fog") live.fogT = Math.max(live.fogT, weather.fog);
}

export function riverBoost() {
  return 1 + weather.rain * 0.62 + weather.storm * 0.28;
}

export function rainAmt() {
  return weather.rain;
}

export function stormOn() {
  return weather.kind === "storm" && weather.storm > 0.35;
}

export function fogAmt() {
  return Math.max(weather.fog, live.fogT ?? 0);
}

export function snowAmt(x = live.x, z = live.z) {
  const land = landAt(x, z).id;
  if (land === "snow") return Math.max(0.72, weather.snow);
  if (land === "mount" && weather.kind !== "sun") return Math.max(weather.snow, 0.28);
  return weather.snow;
}

export function isSlippery(x = live.x, z = live.z) {
  if (weather.rain < 0.28 && snowAmt(x, z) < 0.45) return false;
  const land = landAt(x, z).id;
  if (land === "desert") return false;
  if (live.swim || live.house || live.climbing) return false;
  if (Math.hypot(x, z + 100) < 15) return false;
  return true;
}

export function streamFlow() {
  return live.dryFlow > 0.22;
}

export function weatherKind() {
  return weather.kind;
}

const LOOK = {
  sunMul: 1,
  hemiMul: 1,
  ambMul: 1,
  fogK: 0,
  fogNear: 14,
  fogFar: 72,
  fogCol: "#9aacb8",
  skyCol: "#8aa0b0",
  flash: 0,
};

export function weatherLook() {
  const k = weather.kind;
  const land = landAt(live.x, live.z).id;
  let sunMul = 1;
  let hemiMul = 1;
  let ambMul = 1;
  let fogK = 0;
  let fogNear = 14;
  let fogFar = 80;
  let fogCol = "#9aacb8";
  let skyCol = "#8aa0b0";
  if (k === "cloud") {
    sunMul = 0.72;
    hemiMul = 0.9;
    ambMul = 0.92;
    fogK = 0.18;
    fogCol = "#c8d0d4";
    skyCol = "#b8c8d4";
  } else if (k === "rain") {
    sunMul = 0.48;
    hemiMul = 0.72;
    ambMul = 0.78;
    fogK = 0.42;
    fogNear = 22;
    fogFar = 160;
    fogCol = "#7a94a4";
    skyCol = "#6a8494";
  } else if (k === "storm") {
    sunMul = 0.32;
    hemiMul = 0.58;
    ambMul = 0.7;
    fogK = 0.55;
    fogNear = 16;
    fogFar = 120;
    fogCol = "#4a5a68";
    skyCol = "#3a4a58";
  } else if (k === "fog") {
    sunMul = 0.55;
    hemiMul = 0.8;
    ambMul = 0.88;
    fogK = 0.82;
    fogNear = 6;
    fogFar = 42;
    fogCol = "#c8d0d4";
    skyCol = "#b8c4c8";
  } else if (k === "snow") {
    sunMul = 0.7;
    hemiMul = 0.85;
    fogK = 0.38;
    fogNear = 20;
    fogFar = 140;
    fogCol = "#d0dce8";
    skyCol = "#c4d4e4";
  }
  if (land === "snow") {
    fogK = Math.max(fogK, 0.32);
    fogCol = "#d0dce8";
    skyCol = "#c8d8e8";
  }
  if (land === "forest" && (k === "fog" || k === "rain" || k === "storm")) {
    fogK = Math.min(1, fogK + 0.18);
    fogNear = Math.min(fogNear, 8);
    fogFar = Math.min(fogFar, 48);
  }
  LOOK.sunMul = sunMul;
  LOOK.hemiMul = hemiMul;
  LOOK.ambMul = ambMul;
  LOOK.fogK = fogK;
  LOOK.fogNear = fogNear;
  LOOK.fogFar = fogFar;
  LOOK.fogCol = fogCol;
  LOOK.skyCol = skyCol;
  LOOK.flash = weather.flash;
  return LOOK;
}

export function localPrecip(x = live.x, z = live.z): { rain: number; snow: number } {
  const land = landAt(x, z).id;
  if (land === "snow") return { rain: 0, snow: Math.max(0.7, weather.snow) };
  if (land === "desert" && !weather.forced) return { rain: weather.rain * 0.12, snow: 0 };
  if (land === "mount" && weather.kind !== "sun" && weather.kind !== "fog") {
    return { rain: weather.rain * 0.35, snow: Math.max(weather.snow, weather.rain * 0.55) };
  }
  return { rain: weather.rain, snow: weather.snow };
}

export function slipStep(dt: number, nx: number, nz: number, fx: number, fz: number, speed: number) {
  if (!isSlippery(live.x, live.z)) {
    weather.slipX *= Math.max(0, 1 - dt * 4.2);
    weather.slipZ *= Math.max(0, 1 - dt * 4.2);
    return { x: nx, z: nz };
  }
  const wet = Math.max(weather.rain, snowAmt() * 0.7);
  weather.slipX += fx * speed * dt * (0.42 + wet * 0.55);
  weather.slipZ += fz * speed * dt * (0.42 + wet * 0.55);
  const gully = dryBedU(live.x, live.z);
  const slope = gully > 0.12 ? 6.4 : 3.6;
  const hl = heightAt(live.x - 0.9, live.z);
  const hr = heightAt(live.x + 0.9, live.z);
  const hn = heightAt(live.x, live.z - 0.9);
  const hs = heightAt(live.x, live.z + 0.9);
  weather.slipX += (hl - hr) * dt * slope * wet;
  weather.slipZ += (hn - hs) * dt * slope * wet;
  const drag = gully > 0.12 ? 0.85 : 1.5;
  weather.slipX *= Math.max(0, 1 - dt * drag);
  weather.slipZ *= Math.max(0, 1 - dt * drag);
  const cap = 7.2;
  const mag = Math.hypot(weather.slipX, weather.slipZ);
  if (mag > cap) {
    weather.slipX *= cap / mag;
    weather.slipZ *= cap / mag;
  }
  return { x: nx + weather.slipX * dt, z: nz + weather.slipZ * dt };
}

function mysteryWeather(dt: number) {
  const { t: hour } = gameClock();
  if (hasMystery("stormNights") && live.night && !live.house && weather.kind !== "storm" && weather.kind !== "rain") {
    forceWeather("storm", 36);
  }
  if (hasMystery("fogMornings") && hour >= 6 && hour < 10 && !live.night && !live.house) {
    if (weather.kind !== "fog") forceWeather("fog", 28);
    live.fogT = Math.min(1, (live.fogT ?? 0) + dt * 0.15);
  } else if (weather.kind !== "fog") {
    live.fogT = Math.max(0, (live.fogT ?? 0) - dt * 0.12);
  }
  if (hasMystery("windDays") && !live.night && !live.house) live.windT = 1;
  else live.windT = Math.max(0, (live.windT ?? 0) - dt);
}

export function tickWeather(dt: number) {
  const d = Math.min(0.05, dt);
  if (live.rainT > 0) live.rainT = Math.max(0, live.rainT - d);
  if (live.paused) return;

  if (live.rainT > 2.4 && weather.kind !== "rain" && weather.kind !== "storm") {
    forceWeather("storm", Math.max(16, live.rainT));
  }

  mysteryWeather(d);

  if (!live.house && !live.cave && !live.dungeon && !live.below) {
    weather.hold -= d;
    if (weather.hold <= 0) pickNext();
  }

  const t = toward(weather.kind);
  const k = 1 - Math.exp(-d * 1.35);
  weather.rain += (t.rain - weather.rain) * k;
  weather.storm += (t.storm - weather.storm) * k;
  weather.fog += (t.fog - weather.fog) * k;
  weather.snow += (t.snow - weather.snow) * k;
  weather.cloud += (t.cloud - weather.cloud) * k;

  if (weather.kind === "storm") {
    weather.thunderT -= d;
    weather.flash = Math.max(0, weather.flash - d * 4.6);
    if (weather.thunderT <= 0) {
      weather.flash = 1;
      weather.thunderT = 3.4 + Math.random() * 5.2;
    }
  } else {
    weather.flash = Math.max(0, weather.flash - d * 5);
  }

  if (live.dryFlow > t.rain) live.dryFlow = Math.max(t.rain, live.dryFlow - d * 0.14);
  syncLive();
}
