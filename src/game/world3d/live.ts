import type { WorldId } from "../types";

export const live = {
  x: 0,
  z: 12,
  y: 2,
  yaw: 0,
  camYaw: 0,
  speed: 0,
  vx: 0,
  engaged: false,
  rolling: false,
  rollU: 0,
  sprinting: false,
  landSquash: 0,
  jumpStretch: 0,
  wantPause: false,
  coachOn: false,
  devOpen: false,
  god: false,
  showCol: false,
  showCoords: false,
  sliding: false,
  slideU: 0,
  grounded: true,
  keys: 0,
  hint: "",
  listen: "",
  nearNpc: null as string | null,
  talking: false,
  pendingTalk: null as string | null,
  talkNpc: null as string | null,
  nearMail: false,
  mailAct: null as null | "open" | "reach" | "pull",
  mailT: 0,
  mailReady: false,
  mailSend: false,
  letter: null as { from: string; lines: string[] } | null,
  pendingLetter: false,
  wantFly: false,
  flyover: null as null | {
    t: number;
    sx: number;
    sy: number;
    sz: number;
    lx: number;
    ly: number;
    lz: number;
  },
  shotCam: null as null | { x: number; y: number; z: number; lx: number; ly: number; lz: number },
  climbed: false,
  steerOverride: null as number | null,
  dungeon: false,
  flat: false,
  arenaWave: 0,
  arenaOn: false,
  arenaPack: [] as { id: string; x: number; z: number; kind: string }[],
  hasSword: false,
  swinging: false,
  swingU: 0,
  swordDrawn: false,
  drawing: false,
  drawU: 0,
  sheathing: false,
  sheathU: 0,
  charging: false,
  chargeU: 0,
  spinning: false,
  spinU: 0,
  axeWhirl: false,
  axeSpin: 0,
  axeSlam: false,
  slamU: 0,
  holding: "sword" as "sword" | "axe" | "bow" | "sling" | "boom" | "bomb" | "shield" | "pole" | "none",
  slingU: 0,
  slingPull: 0,
  slingShot: false,
  hasShield: false,
  shieldUp: false,
  sideHop: 0,
  house: null as string | null,
  houseY: 0,
  nearHouse: null as string | null,
  nearExit: false,
  doorUse: null as { id: string; t: number; dir: "in" | "out"; opened: boolean; switched?: boolean } | null,
  roomFade: 0,
  roomFadeOut: false,
  gateUse: null as {
    to: WorldId;
    mx: number;
    mz: number;
    sx: number;
    sz: number;
    t: number;
    dir: "in" | "out";
    done?: boolean;
  } | null,
  doorReach: false,
  houseHold: 0,
  houseFace: false,
  cave: false,
  pit: 0,
  caveLeft: false,
  cavePush: 0,
  nearPitExit: false,
  climbOut: false,
  climbing: null as string | null,
  climbH: 0,
  climbPhase: 0,
  climbV: 0,
  climbCool: 0,
  onStairs: false,
  nearDungeonExit: false,
  dungeonDoors: [] as { x: number; z: number; w: number; axis?: "x" | "z" }[],
  dungeonExitAt: null as { x: number; z: number } | null,
  dungFlags: { plates: false, key: false, pads: false, eyes: false, far: false, mix: false },
  nearGate: null as string | null,
  nearRuby: false,
  nearSapphire: false,
  nearHeart: false,
  bed: null as "top" | "bottom" | null,
  nearBed: null as "top" | "bottom" | null,
  bedT: 0,
  bedLie: false,
  innFloor: 0,
  innInRoom: false,
  nearStairs: null as "up" | "down" | null,
  nearInnDoor: null as number | null,
  innSlept: false,
  homeSlept: false,
  sleepFade: 0,
  sleepPhase: "" as "" | "out" | "hold" | "in",
  sleepHold: 0,
  restBoost: 0,
  restUntil: 0,
  fedBoost: 0,
  fedUntil: 0,
  dayCycle: 0,
  wasNight: false,
  curfewStage: 0,
  passedOut: false,
  wakeHome: false,
  wakeT: 0,
  sit: false,
  nearChair: false,
  sitAt: null as { x: number; z: number; yaw: number; warm?: boolean } | null,
  sitFresh: 0,
  slash: null as { x: number; z: number; r?: number } | null,
  bladeTrail: [] as { x: number; y: number; z: number }[],
  nearHorse: false,
  nameHorse: false,
  mounted: false,
  hasHorse: false,
  horseStam: 1,
  horseGallop: false,
  horseTired: false,
  horseX: null as number | null,
  horseZ: null as number | null,
  horseYaw: 0.55,
  horseCall: false,
  horseJump: false,
  horseWet: false,
  horseBrake: false,
  horseRear: 0,
  throws: [] as {
    id: string;
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    age: number;
    skip?: number;
    broken: boolean;
    kind?: "rock" | "cucco" | "crate" | "stick" | "frog" | "flower";
    bits: { x: number; y: number; z: number; vx: number; vy: number; vz: number }[];
  }[],
  arrows: [] as { x: number; y: number; z: number; vx: number; vy: number; vz: number; age: number; kind?: "arrow" | "seed" }[],
  booms: [] as { x: number; y: number; z: number; vx: number; vz: number; vy?: number; age: number; back: boolean; spin?: number; ox?: number; oz?: number; sx?: number; sz?: number; fx?: number; fz?: number }[],
  bombs: [] as { x: number; y: number; z: number; vx: number; vy: number; vz: number; fuse: number; boom: boolean; spin: number; bounce: number }[],
  drops: [] as {
    id: string;
    kind: "heart" | "coin" | "arrow" | "bomb" | "seed" | "crystal" | "sword" | "axe" | "ocarina" | "bow" | "sling" | "boom" | "bombs" | "compass";
    x: number;
    y: number;
    z: number;
    n: number;
  }[],
  getItem: null as string | null,
  sheep: {} as Record<string, { x: number; z: number; r: number }>,
  chickens: {} as Record<string, { x: number; z: number; r: number }>,
  carryId: null as string | null,
  chestOpen: null as {
    id: string;
    x: number;
    z: number;
    t: number;
    item: string;
    coins: number;
    granted: boolean;
  } | null,
  pendingFire: false,
  battleCue: false,
  aggroIds: new Set<string>(),
  foeHp: {} as Record<string, number>,
  foeHitT: {} as Record<string, number>,
  wardenCue: false,
  hideSeek: null as null | { hiding: boolean; pending: boolean; round: number; x: number; z: number; done: boolean },
  foundBoot: false,
  sawWellBoy: false,
  digitLastZ: 40,
  digitOk: true,
  digitN: 0,
  heldRock: false,
  heldWood: false,
  nearRock: false,
  nearWood: false,
  nearApple: false,
  nearShroom: false,
  nearFish: false,
  nearStall: false,
  nearCook: false,
  fishCool: 0,
  wishN: 0,
  fishAct: null as null | "wind" | "cast" | "wait" | "bite" | "reel",
  fishT: 0,
  castX: 0,
  castZ: 0,
  provedShake: new Set<string>(),
  provedShroom: new Set<string>(),
  pickT: 0,
  nearSongGate: false,
  shrineOpen: false,
  nearCave: false,
  pickRock: null as string | null,
  dropRock: null as { x: number; z: number } | null,
  dropWood: null as { x: number; z: number } | null,
  pickWood: false,
  ocarina: false,
  songBuf: "",
  songOk: null as string | null,
  songOpen: false,
  songLock: false,
  songAura: null as { color: string; t: number } | null,
  hideFairy: false,
  foes: [] as { x: number; z: number }[],
  foeTrack: {} as Record<string, { x: number; z: number }>,
  npcPos: {} as Record<string, { x: number; z: number }>,
  plot: { phase: "idle" as "idle" | "sneak" | "stomp" | "chase", stompT: 0 },
  fireLit: false,
  fireBoost: 0,
  fires: [] as { x: number; z: number; boost: number }[],
  rockSpots: [] as { id: string; x: number; z: number }[],
  hover: null as { id: string; kind: string; x: number; z: number } | null,
  lock: null as { id: string; kind: string; x: number; z: number } | null,
  fight: {
    foeId: null as string | null,
    heroAct: "idle" as "idle" | "slash" | "jump" | "spin" | "hurt",
    foeAct: "idle" as "idle" | "run" | "scratch" | "hurt",
    tag: null as string | null,
  },
  jumpAtk: false,
  jumpU: 0,
  nearAltar: null as string | null,
  ceremony: null as null | { gem: "emerald" | "ruby" | "sapphire" | "all"; t: number },
  knock: null as { vx: number; vz: number; t: number } | null,
  doorCall: null as { house: string; phase: "bang" | "talk" | "shut" } | null,
  doorMath: false,
  chestUnlock: null as string | null,
  nearChest: null as string | null,
  chestLocked: false,
  strike: null as { id: string; dmg: number } | null,
  heroFlash: 0,
  guardStab: 0,
  down: 0,
  day: 0.18,
  night: false,
  dusk: 0,
  echoCool: 0,
  skipBoost: 0,
  hush: 0,
  millSpin: 0,
  millRide: 0,
  watch: 0,
  spark: 0,
  joke: 0,
  lucky: 0,
  trauma: 0,
  warpTo: null as { x: number; z: number } | null,
  qaPumps: 0,
  backflips: 0,
  skels: [] as { id: string; x: number; z: number }[],
  cracks: [] as { x: number; z: number; t: number; spin: number }[],
  puffs: [] as { x: number; y: number; z: number; t: number; s: number }[],
  area: "field" as "field" | "village",
  paused: false,
  openPack: false,
  cookT: 0,
  story: null as string | null,
  storyCue: null as string | null,
  escort: null as { x: number; z: number; cue?: string; gem?: "emerald" | "ruby" | "sapphire"; heart?: "emerald" | "ruby" | "sapphire" } | null,
  pendingGem: null as "emerald" | "ruby" | "sapphire" | null,
  pendingHeart: null as "emerald" | "ruby" | "sapphire" | null,
  afterGem: null as "emerald" | "ruby" | "sapphire" | null,
  afterHeart: null as "emerald" | "ruby" | "sapphire" | null,
  resumeGem: null as "emerald" | "ruby" | "sapphire" | null,
  chamber: false,
  warp: null as { x: number; z: number; to: WorldId } | null,
  flip: 0,
  flipDir: 1,
  swim: false,
  under: false,
  bossTitle: null as string | null,
  bossTitleT: 0,
  bossHp: 0,
  bossMax: 0,
  bossDying: false,
  bossDown: false,
  guardsDown: false,
  wantMenu: false,
  menuOpen: false,
  dine: null as null | {
    phase:
      | "host"
      | "follow"
      | "seat"
      | "drink"
      | "wait"
      | "ready"
      | "menu"
      | "order"
      | "kitchen"
      | "carry"
      | "served"
      | "eat"
      | "askok"
      | "return"
      | "check"
      | "sign"
      | "pay"
      | "done"
      | "clear"
      | "wash";
    party: number;
    t: number;
    drink: string | null;
    food: string | null;
    side: string | null;
    hostX: number;
    hostZ: number;
    table: number;
    guest: string | null;
    guests: string[];
    bill: number;
    eatU: number;
    bites: number;
    healed: boolean;
    okT: number;
    chatI: number;
    chatWho: string | null;
    chatLine: string;
    chatWait: boolean;
    chatT: number;
    laughT: number;
    checkT: number;
    askedCheck: boolean;
  },
  dinner: null as null | { who: string; hour: number; arrived: boolean; left: boolean; all?: boolean },
  nearDesk: false,
  nearKitchen: false,
  npcMood: {} as Record<string, "idle" | "eat" | "sip" | "laugh" | "mad" | "talk" | "scared" | "sleep" | "smile" | "worried" | "sad">,
  npcMad: {} as Record<string, number>,
  npcTarget: {} as Record<string, string>,
  npcBumps: {} as Record<string, number>,
  lastBoom: null as null | { x: number; z: number; t: number },
  rookFight: false,
  rookWarn: false as boolean,
  rookWound: 0,
  rookLootAt: null as null | { x: number; z: number },
  rookThanks: false,
  rookThanked: {} as Record<string, boolean>,
  ashFollow: false,
  ashHunt: false,
  allyHit: null as null | { x: number; z: number; r: number },
  ashDummy: 0,
  ashCheer: 0,
  ashHits: 0,
  ashSpar: false,
  ashFlip: 0,
  ashSlide: 0,
  bombHeld: 0,
  bombWind: 0,
  nightFang: false,
  nightCreep: false,
  blownHay: {} as Record<string, boolean>,
  miraUp: true,
  miraPhase: "pick" as "pick" | "descend" | "step" | "walk" | "return" | "ascend",
  miraClimb: 1,
  miraWait: 22,
  ramCount: 0,
  cuccoRage: 0,
  laundryOn: 0,
  balloonRide: false,
  balloonH: 0,
  balloonX: 2.2,
  balloonZ: -120,
  balloonAirT: 0,
  balloonPick: 0,
  balloonOfferT: 0,
  balloonFrom: { x: 2.2, z: -120 },
  balloonTo: { x: 2.2, z: -120 },
  sawVale: false,
  wheelT: 0,
  gooseOn: false,
  duckRide: false,
  sheepRide: -1,
  townSheep: null as string | null,
  carryKid: null as string | null,
  wagonRide: false,
  pathCart: false,
  raftRide: false,
  pebbleOn: false,
  zipping: false,
  zipU: 0,
  nearZip: false,
  glideT: 0,
  smashed: {} as Record<string, boolean>,
  leafN: 0,
  carry: null as null | "cat" | "cucco" | "frog" | "crate" | "stick" | "flower",
  nearPet: null as null | "cat" | "cucco" | "frog" | "crate" | "stick" | "flower",
  nearPetId: null as string | null,
  stillT: 0,
  haySoft: 0,
  pigRide: 0,
  pigX: 0,
  spyT: 0,
  pigZ: 0,
  pigYaw: 0,
  tinyT: 0,
  hat: null as null | "pumpkin" | "kite" | "mask" | "giant" | "pot" | "leaf",
  nearHat: null as null | "pumpkin" | "kite" | "mask" | "giant" | "pot" | "leaf",
  flowerHat: false,
  appleFed: 0,
  flowers: 0,
  wetT: 0,
  raceT: 0,
  skipGame: false,
  bellT: 0,
  dogFollow: 0,
  backT: 0,
  carryT: 0,
  beeRage: 0,
  cutN: 0,
  jumpN: 0,
  whistleN: 0,
  dizzyT: 0,
  rainT: 0,
  fogT: 0,
  windT: 0,
  circleN: 0,
  boostY: 0,
  hideBarrel: false,
  hideGrass: false,
  logAt: null as { x: number; z: number } | null,
  bucket: 0 as 0 | 1 | 2,
  awayFar: false,
  homecoming: false,
  nearBarrel: false,
  giantT: 0,
  rollN: 0,
  rollChainT: 0,
  stompT: 0,
  soakT: 0,
  appleAte: 0,
  swingN: 0,
  keepCircle: 0,
  turned: [] as string[],
  locker: {
    phase: "idle" as "idle" | "drag" | "shut" | "open" | "done",
    t: 0,
    who: "" as string,
  },
  jail: {
    on: false,
    fade: 0,
    surround: 0,
    used: false,
    cx: -1.6,
    cz: 0.4,
    hasKey: false,
    chestOpen: false,
    torchLit: false,
    brickOut: false,
    doorOpen: false,
    tip: "",
  },
  playT: 0,
  clockHour: -1,
  lastGift: -999,
  pendingGift: false,
  charView: false,
  viewerWire: false,
  viewerAnim: "idle" as
    | "idle"
    | "walk"
    | "run"
    | "sprint"
    | "jump"
    | "fall"
    | "land"
    | "roll"
    | "swing"
    | "block"
    | "bow"
    | "boom"
    | "bomb"
    | "hurt"
    | "talk"
    | "item"
    | "ride",
  viewerYaw: 0,
  viewerPitch: 0.12,
  viewerDist: 4.6,
  studioLight: "afternoon" as "afternoon" | "shade" | "sunset" | "night" | "interior",
  quality: "low" as "high" | "low",
  banner: "",
  streak: 0,
  eventKind: "" as string,
  eventT: 0,
};

export const FANG_LOCKER_NPCS = ["oak4", "oak6", "oak1"];
export function dayFromHour(hour: number) {
  return (((hour - 6) % 24) + 24) % 24 / 24;
}

export const MORNING_8 = dayFromHour(8);

export function gameClock(day = live.day) {
  const t = (day * 24 + 6) % 24;
  const h = Math.floor(t);
  const m = Math.floor((t - h) * 60);
  return { h, m, t };
}

/** 0 = full day, 1 = full night. Dusk ~4:45pm–9:00pm, dawn ~5:10am–7:40am. */
export function duskAmt(hr?: number) {
  const t = hr ?? gameClock().t;
  const sm = (a: number, b: number, x: number) => {
    const u = Math.max(0, Math.min(1, (x - a) / Math.max(0.001, b - a)));
    return u * u * (3 - 2 * u);
  };
  if (t >= 21 || t < 5.15) return 1;
  if (t >= 16.75 && t < 21) return sm(16.75, 21, t);
  if (t >= 5.15 && t < 7.65) return 1 - sm(5.15, 7.65, t);
  return 0;
}

export function formatClock(day = live.day) {
  const { h, m } = gameClock(day);
  const ap = h >= 12 ? "PM" : "AM";
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${String(m).padStart(2, "0")} ${ap}`;
}

export function formatHour(hour: number) {
  const h = ((Math.floor(hour) % 24) + 24) % 24;
  const m = Math.round((hour - Math.floor(hour)) * 60) % 60;
  const ap = h >= 12 ? "PM" : "AM";
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${String(m).padStart(2, "0")} ${ap}`;
}

export function parsePartySize(text: string) {
  const t = text.trim().toLowerCase();
  const n = t.match(/\d+/);
  if (n) return Math.max(1, Math.min(6, Number(n[0])));
  if (/every(one|body)|whole town|all of (them|us|oakstead)/.test(t)) return 6;
  const words: [string, number][] = [
    ["six", 6],
    ["five", 5],
    ["four", 4],
    ["three", 3],
    ["two", 2],
    ["one", 1],
    ["just me", 1],
    ["myself", 1],
    ["alone", 1],
  ];
  for (const [w, v] of words) {
    if (t.includes(w)) return v;
  }
  return 2;
}

export function parseDinnerInvite(text: string) {
  const t = text.trim().toLowerCase();
  const dinner =
    /dinner|supper|pell|restaurant|eatery|steak|eat(ing)? out|meet( me)? (at|for)|come (eat|to pell|to dinner)/.test(t);
  const all = /every(one|body)|whole town|all of (them|us|oakstead)|the whole village/.test(t);
  if (!dinner && !all) return null;
  let hour = 18.5;
  const m = t.match(/(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/);
  if (m) {
    let h = Number(m[1]);
    const min = m[2] ? Number(m[2]) : /:30|half/.test(t) ? 30 : 0;
    const ap = (m[3] ?? "").replace(/\./g, "");
    if (ap.startsWith("p") && h < 12) h += 12;
    if (ap.startsWith("a") && h === 12) h = 0;
    if (!ap && h > 0 && h < 7) h += 12;
    hour = ((h % 24) + 24) % 24 + min / 60;
  }
  return { hour, all };
}

export function afterMeal() {
  live.fedBoost = 1;
  live.fedUntil = live.dayCycle + 1;
}

export function ashPays(): boolean {
  return Boolean(live.dine?.guests.includes("ash"));
}

export function blankDine(partial: Partial<NonNullable<typeof live.dine>> = {}): NonNullable<typeof live.dine> {
  const guests = [...(partial.guests ?? [])];
  if (live.dinner && !live.dinner.left && live.dinner.who === "ash" && !guests.includes("ash")) {
    guests.push("ash");
    live.dinner.arrived = true;
  }
  return {
    phase: "host",
    party: 1,
    t: 0,
    drink: null,
    food: null,
    side: null,
    hostX: live.x,
    hostZ: live.z,
    table: 0,
    guest: null,
    bill: 0,
    eatU: 0,
    bites: 0,
    healed: false,
    okT: 0,
    chatI: 0,
    chatWho: null,
    chatLine: "",
    chatWait: false,
    chatT: 0,
    laughT: 0,
    checkT: 0,
    askedCheck: false,
    ...partial,
    guests,
  };
}
