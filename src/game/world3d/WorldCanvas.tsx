import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Encounter, WorldId } from "../types";
import { ENEMIES } from "../content";
import { useGame } from "../store";
import { revealItem } from "../items";
import { sfx } from "../audio";
import { npcsIn, npcById, passerBy } from "../dialogue";
import {
  bindGameKeys,
  consumeBomb,
  consumeJump,
  consumeSwing,
  consumeTalk,
  consumeThrow,
  consumeCamAlign,
  consumeTarget,
  consumeSlide,
  injectedKeys,
  isSprintHeld,
  isShieldHeld,
  isBombHeld,
  isSwingHeld,
  isTalkHeld,
  lookAxes,
  lookDrag,
  moveAxes,
  queueJump,
  isJumpHeld,
} from "../input";
import { live, MORNING_8, gameClock, duskAmt } from "./live";
import { HeroBoom, HeroBomb } from "./heroes";
import { getStoryEnv, RIM_AMOUNT } from "./mats";
import {
  heightAt,
  pondU,
  standingInWater,
  footKind,
  spawnOnField,
  fieldActors,
  isDungeon,
  WORLD_TINT,
  TREES,
  ROCKS,
  rockGone,
  rockRadius,
  climbOnRocks,
  grottoDrop,
  TREE_HOME,
  TREE_HOUSE_H,
  TREE_HW,
  TREE_HD,
  VX,
  VZ,
  POND,
  KEEP_Z,
  SNOW_AT,
  moatRing,
  onDrawbridge,
} from "./field";
import { GrassTerrain } from "./painted";
import { N64Grove, N64Foe, FallingApples, fallenTrees, treeKey, type FangPose } from "./n64";
import {
  N64Hero,
  N64Person,
  N64Horse,
  AppleOrchard,
  N64Sign,
  N64Note,
  N64Gossip,
  N64Well,
  SongAura,
  RupeeMesh,
  HeartContainerMesh,
  rupeeTintFor,
} from "./actors";
import {
  HOUSES,
  houseSize,
  tryHouse,
  collideHouses,
  camNudge,
  collideInterior,
  collideFurniture,
  collidePeople,
  Houses,
  HouseInterior,
  Campfires,
  CAVE_MOUTH,
  bunkSpots,
  innStairLift,
  innStairArrive,
  homeMailSpot,
  roofAt,
} from "./house";
import {
  Village,
  collideVillage,
  collideGates,
  TEMPLE_GATES,
  SECRET_MOUTHS,
  worldGateOpen,
  PADDOCK,
  inVillage,
} from "./village";
import { BiomeDress } from "./biome";
import { MeadowArt, collideKeep, collideRanges, collideFountain } from "./meadowArt";
import { SunGlints } from "./magicYard";
import { VillageScenery } from "./villageArt";
import { TownLife, PondLife } from "./townLife";
import { QuietReturn } from "./quietReturn";
import { lastRoomZ } from "./dungeonLayout";
import { DungeonShell, DungeonGem, clampDungeon } from "./dungeon";
import {
  PUZZLES,
  makeRuntime,
  collideBlocks,
  collideDoors,
  nearestBlock,
  shoveBlock,
  platesSatisfied,
  doorOpen,
  keyVisible,
  chestAlreadyLooted,
  chestSaveId,
  markChestOpen,
  chestTier,
  type PuzzleRuntime,
} from "./puzzles";
import { HiddenSecrets, TreasureChest } from "./secrets";
import { PuzzleLayer } from "./puzzleLayer";
import { DungeonTraps, trapHeight, trapSink, onIce } from "./dungeonTraps";
import { MysteryLayer } from "./mysteryLayer";
import { WorldPolish, puffAt, splashAt, crackAt, sparkAt } from "./fx";
import { nearLadder, startClimb, hopOffLadder, fieldLadders, snapToLadder } from "./climb";
import { beginZip, stepZip } from "./zipPlay";
import { FangBuddy } from "./fangBuddy";
import { HeartPlay } from "./heartPlay";
import { ValeFeel, creekLift, collideFall, collideCreek, collideLog, collideGlade, collideStone } from "./valeFeel";
import { YearsMark, houseLift, SleighPass } from "./years";
import { Moments } from "./moments";
import { Terraces, terraceLift, collideTerrace } from "./terraces";
import { SecretCave, collideSecret } from "./secretCave";
import { BladeAltars } from "./bladeAltars";
import { ReturnGates, collideReturn } from "./returnGates";
import { Nooks, collideNooks } from "./nooks";
import { Curious } from "./curious";
import { ClimbWalls, collideWalls, grabWall, startWall, stepWall, dropWall, ledgeLift } from "./walls";
import { Palisade, collidePalisade } from "./palisade";
import { collideMoat, collideCastleGate } from "./moat";
import { collideCastle, stepCastleShop } from "./castleYard";
import { collideRegions, stepRegions } from "./greatRegions";
import { collideRidge, watchRidgeGate } from "./ridgeData";
import { collideRange, watchRangeGate } from "./rangeData";
import { collideCanyon } from "./canyonData";
import { stepCanyon } from "./canyon";
import { collideMouth, collideCave, watchRealm, onSurface } from "./realms";
import { watchChart } from "./chart";
import { collidePale, stepPale } from "./lostOutpost";
import { stepEvents, tickEvents } from "./worldEvents";
import { stepOldroot, Oldroot } from "./oldroot";
import { collideGiant } from "./giantTreeData";
import { Finds, collideFinds } from "./finds";
import { BombRocks, collideRockHoles, collideGrotto, shatterRocks } from "./bombRocks";
import { WowPlay, collideWow } from "./wowPlay";
import { AlivePlay, collideAlive } from "./alivePlay";
import { LushRender } from "./lush/post";
import { LushSky } from "./lush/sky";
import { GEM_TINTS, LushGem } from "./lush/gems";
import { atmo, gfxLevel } from "./lush/atmo";
import { sampleH } from "./lush/grid";
import { Near } from "./nearMount";
import { WonderPack } from "./wonderPack";
import { CountStones } from "./countStones";
import { NightLife } from "./nightLife";
import { CaveMouth } from "./caveMouth";
import { HiddenLands, tryHiddenRead } from "./hiddenLands";
import { collideHidden, hiddenMood } from "./hidden";

export type WorldHooks = {
  onEncounter: (encounter: Encounter, at: { x: number; y: number }) => void;
  onCollect: (id: string) => void;
  onGate: () => void;
};

function fieldHits(kind: string) {
  if (kind === "leftover" || kind === "warden" || kind === "remainder" || kind === "nag") return 18;
  if (kind === "plusling") return 8;
  if (kind === "glyphite") return 10;
  if (kind === "emberling") return 7;
  if (kind === "timesprout") return 6;
  const def = ENEMIES[kind];
  if (def?.boss) return 18;
  return 5;
}

function elementBonus(kind: string, element: string) {
  const weak = ENEMIES[kind]?.weak;
  if (element === "fire" && (kind === "plusling" || weak === "fire")) return 2;
  if (element === "ice" && (kind === "timesprout" || weak === "ice")) return 2;
  return 0;
}

function touchingHero() {
  if (live.balloonRide || live.zipping || live.cheatFly) return false;
  return live.y < heightAt(live.x, live.z) + 2.15;
}

function strikeFoe(worldId: WorldId, id: string, kind: string, dmg: number, x: number, z: number, element = live.blade): "hit" | "kill" | false {
  const g = useGame.getState();
  if ((g.defeated[worldId] ?? []).includes(id)) return false;
  if (live.playT - (live.foeHitT[id] ?? -9) < 0.42) return false;
  const bonus = elementBonus(kind, element);
  const max = fieldHits(kind);
  const hp = (live.foeHp[id] ?? max) - Math.max(1, dmg + bonus);
  live.foeHitT[id] = live.playT;
  live.foeHp[id] = hp;
  puffAt(x, z, undefined, true);
  sparkAt(x, heightAt(x, z) + 0.85, z, dmg > 1 ? 10 : 6);
  crackAt(x, z);
  const mat =
    /bat|moth|wing/i.test(kind) ? "bat" :
    /stone|rock|glyph/i.test(kind) ? "stone" :
    /metal|armor|guard/i.test(kind) ? "metal" :
    /wood|stump|door/i.test(kind) ? "wood" :
    "flesh";
  sfx.material(mat, dmg > 1);
  if (bonus > 0) {
    if (element === "fire") sfx.ember();
    else sfx.frost();
  }
  live.spark = Math.max(live.spark, dmg > 1 ? 1 : 0.72);
  live.hitStop = Math.max(live.hitStop, dmg > 1 ? 0.12 : 0.07);
  if (hp > 0) return "hit";
  const def = ENEMIES[kind];
  g.markDefeated(worldId, id);
  if (def) {
    g.addCoins(def.coins);
    useGame.setState({ xp: useGame.getState().xp + def.xp });
  }
  live.hint = `${def?.name ?? "The fang"} falls.`;
  live.aggroIds.delete(id);
  delete live.foeHp[id];
  delete live.foeHitT[id];
  delete live.foeTrack[id];
  if (live.lock?.id === id) live.lock = null;
  sfx.ok();
  if (Math.random() < 0.62) {
    live.drops.push({
      id: `foe-${id}-${live.playT.toFixed(2)}`,
      kind: Math.random() < 0.48 ? "heart" : "coin",
      x,
      z,
      y: 0.35,
      n: 1,
    });
  }
  return "kill";
}

const WALK = 14.2;
const RUN = 21;
const GRAV = 48;
const JUMP = 8.8;
const HORSE_WALK = 12;
const HORSE_RUN = 22;
const BOMB_WIND = 0.34;

function beginRoomWarp(to: WorldId, x: number, z: number, walk?: { x: number; z: number }) {
  if (live.roomWarp || live.warp) return;
  live.roomWarp = {
    to,
    x,
    z,
    t: 0,
    phase: "out",
    walkX: walk?.x,
    walkZ: walk?.z,
  };
  if (to === "cavern") {
    live.banner = "Sun Hollow";
    live.objective = "Find the heart of Sun Hollow.";
  } else if (to === "meadow") {
    live.objective = "";
  }
}

const FALLBACK_LOOK = {
  tunic: "#4a6a48",
  sash: "#c9a227",
  hair: "#c6ae6a",
  skin: "#c49674",
  boots: "#3a2820",
  pants: "#3a5a88",
};

function handPos() {
  const fx = -Math.sin(live.yaw);
  const fz = -Math.cos(live.yaw);
  const rx = Math.cos(live.yaw);
  const rz = -Math.sin(live.yaw);
  return {
    x: live.x + fx * 0.42 + rx * 0.32,
    y: live.y + 1.08,
    z: live.z + fz * 0.42 + rz * 0.32,
  };
}

function clearShots() {
  live.arrows.length = 0;
  live.booms.length = 0;
  live.bombs.length = 0;
  live.throws.length = 0;
}

function explodeAt(x: number, y: number, z: number) {
  puffAt(x, z, y, true);
  crackAt(x, z);
  sfx.smash();
  live.blast = { x, z, t: 0.45 };
  live.spark = 1;
  shatterRocks(x, z);
  const g = useGame.getState();
  if (Math.hypot(live.x - x, live.z - z) < 2.6 && live.y < y + 2.2) {
    g.hurtField(6, true);
    live.knock = { vx: (live.x - x) * 4, vz: (live.z - z) * 4, t: 0.28 };
  }
}

function grantChestItem(item: string | undefined, coins: number) {
  const g = useGame.getState();
  if (coins) g.addCoins(coins);
  if (item === "sword") {
    g.grantSword();
    revealItem("sword", true);
  } else if (item === "axe") {
    g.grantAxe();
    revealItem("axe", true);
  } else if (item === "ocarina") {
    g.grantOcarina();
    revealItem("ocarina", true);
  } else if (item === "bow") {
    g.grantBow();
    revealItem("bow", true);
  } else if (item === "sling") {
    g.grantSling();
    revealItem("sling", true);
  } else if (item === "boom") {
    g.grantBoom();
    revealItem("boom", true);
  } else if (item === "bombs") {
    g.grantBombs();
    revealItem("bombs", true);
  } else if (item === "compass") {
    g.grantCompass();
    revealItem("compass", true);
  } else if (item === "heart") {
    g.grantHeartContainer(`chest-${item}-${coins}`);
    revealItem("container", true);
  } else if (coins) {
    revealItem("coin", true);
  }
}

function collideWorld(nx: number, nz: number, worldId: WorldId, rt: PuzzleRuntime, skipBlock?: string | null) {
  let x = nx;
  let z = nz;
  if (live.house) {
    const a = collideInterior(x, z);
    if (a) {
      x = a.x;
      z = a.z;
    }
    const b = collideFurniture(x, z);
    if (b) {
      x = b.x;
      z = b.z;
    }
    const c = collidePeople(x, z);
    if (c) {
      x = c.x;
      z = c.z;
    }
    return { x, z };
  }
  if (!onSurface()) {
    if (live.realm === "grotto") return collideGrotto(x, z) ?? { x, z };
    const caveSpace = collideCave(x, z);
    return caveSpace ?? { x, z };
  }
  const mouth = collideMouth(x, z);
  if (mouth) {
    x = mouth.x;
    z = mouth.z;
  }
  const h = collideHouses(x, z, worldId);
  if (h) {
    x = h.x;
    z = h.z;
  }
  const k = collideKeep(x, z);
  if (k) {
    x = k.x;
    z = k.z;
  }
  const fall = collideFall(x, z);
  if (fall) {
    x = fall.x;
    z = fall.z;
  }
  const creek = collideCreek(x, z);
  if (creek) {
    x = creek.x;
    z = creek.z;
  }
  const logHit = collideLog(x, z);
  if (logHit) {
    x = logHit.x;
    z = logHit.z;
  }
  const glade = collideGlade(x, z);
  if (glade) {
    x = glade.x;
    z = glade.z;
  }
  const bowl = collideFountain(x, z);
  if (bowl) {
    x = bowl.x;
    z = bowl.z;
  }
  const rock = collideStone(x, z);
  if (rock) {
    x = rock.x;
    z = rock.z;
  }
  const terrace = worldId === "meadow" ? collideTerrace(x, z) : null;
  if (terrace) {
    x = terrace.x;
    z = terrace.z;
  }
  const cave = worldId === "meadow" ? collideSecret(x, z) : null;
  if (cave) {
    x = cave.x;
    z = cave.z;
  }
  const gate = worldId === "meadow" ? collideReturn(x, z) : null;
  if (gate) {
    x = gate.x;
    z = gate.z;
  }
  const nook = worldId === "meadow" ? collideNooks(x, z) : null;
  if (nook) {
    x = nook.x;
    z = nook.z;
  }
  const hole = collideRockHoles(x, z);
  if (hole) {
    x = hole.x;
    z = hole.z;
  }
  const face = collideWalls(x, z);
  if (face) {
    x = face.x;
    z = face.z;
  }
  const pal = worldId === "meadow" ? collidePalisade(x, z) : null;
  if (pal) {
    x = pal.x;
    z = pal.z;
  }
  const moat = worldId === "meadow" ? collideMoat(x, z) : null;
  if (moat) {
    x = moat.x;
    z = moat.z;
  }
  const castleDoor = worldId === "meadow" ? collideCastleGate(x, z) : null;
  if (castleDoor) {
    x = castleDoor.x;
    z = castleDoor.z;
  }
  const ridge = worldId === "meadow" ? collideRidge(x, z) : null;
  if (ridge) {
    x = ridge.x;
    z = ridge.z;
  }
  const rangeHit = worldId === "meadow" ? collideRange(x, z, Boolean(useGame.getState().quests?.rangeCrystal)) : null;
  if (rangeHit) {
    x = rangeHit.x;
    z = rangeHit.z;
  }
  const canyonHit = worldId === "meadow" ? collideCanyon(x, z, Boolean(useGame.getState().quests?.canyonSlab)) : null;
  if (canyonHit) {
    x = canyonHit.x;
    z = canyonHit.z;
  }
  const pale = worldId === "meadow" && onSurface() ? collidePale(x, z, Boolean(useGame.getState().quests?.rangeCrystal)) : null;
  if (pale) {
    x = pale.x;
    z = pale.z;
  }
  const tree = worldId === "meadow" ? collideGiant(x, z) : null;
  if (tree) {
    x = tree.x;
    z = tree.z;
  }
  const yard = worldId === "meadow" ? collideCastle(x, z) : null;
  if (yard) {
    x = yard.x;
    z = yard.z;
  }
  const region = worldId === "meadow" ? collideRegions(x, z) : null;
  if (region) {
    x = region.x;
    z = region.z;
  }
  const found = collideFinds(x, z);
  if (found) {
    x = found.x;
    z = found.z;
  }
  const wow = collideWow(x, z);
  if (wow) {
    x = wow.x;
    z = wow.z;
  }
  const alive = collideAlive(x, z);
  if (alive) {
    x = alive.x;
    z = alive.z;
  }
  const v = collideVillage(x, z, live.vx > 2);
  if (v) {
    x = v.x;
    z = v.z;
  }
  const g = collideGates(x, z);
  if (g) {
    x = g.x;
    z = g.z;
  }
  const bl = collideBlocks(rt, x, z, skipBlock);
  if (bl) {
    x = bl.x;
    z = bl.z;
  }
  if (collideDoors(rt, PUZZLES[worldId], x, z)) {
    return { x: live.x, z: live.z, blocked: true };
  }
  if (isDungeon(worldId)) {
    const d = clampDungeon(x, z, worldId);
    x = d.x;
    z = d.z;
  }
  for (const t of TREES) {
    if (fallenTrees.has(treeKey(t.x, t.z))) continue;
    const rad = 0.92 * t.s;
    const dx = x - t.x;
    const dz = z - t.z;
    const d2 = dx * dx + dz * dz;
    if (d2 < rad * rad && d2 > 1e-6) {
      const d = Math.sqrt(d2);
      x = t.x + (dx / d) * rad;
      z = t.z + (dz / d) * rad;
    }
  }
  for (const r of ROCKS) {
    if (rockGone(r.x, r.z)) continue;
    const rad = rockRadius(r.s) * 0.92;
    const dx = x - r.x;
    const dz = z - r.z;
    const d2 = dx * dx + dz * dz;
    if (d2 < rad * rad && d2 > 1e-6) {
      const d = Math.sqrt(d2);
      x = r.x + (dx / d) * rad;
      z = r.z + (dz / d) * rad;
    }
  }
  for (const p of Object.values(live.npcPos)) {
    if (!p) continue;
    const dx = x - p.x;
    const dz = z - p.z;
    const rad = 0.46;
    const d2 = dx * dx + dz * dz;
    if (d2 < rad * rad && d2 > 1e-6) {
      const d = Math.sqrt(d2);
      x = p.x + (dx / d) * rad;
      z = p.z + (dz / d) * rad;
    }
  }
  if (worldId === "meadow" && !live.balloonRide && !live.zipping) {
    const rim = collideRanges(x, z);
    if (rim) {
      x = rim.x;
      z = rim.z;
    }
    if (!live.cheatFly) {
      const hid = collideHidden(x, z);
      if (hid) {
        x = hid.x;
        z = hid.z;
      }
    }
  }
  return { x, z };
}

/** Walk the move in short steps so a sprint cannot skip through a wall. */
function stepSolids(
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  worldId: WorldId,
  rt: PuzzleRuntime,
  skipBlock?: string | null,
) {
  const dx = x1 - x0;
  const dz = z1 - z0;
  const dist = Math.hypot(dx, dz);
  const steps = Math.max(1, Math.ceil(dist / 0.12));
  let x = x0;
  let z = z0;
  const sx = dx / steps;
  const sz = dz / steps;
  for (let i = 0; i < steps; i++) {
    const hit = collideWorld(x + sx, z + sz, worldId, rt, skipBlock);
    x = hit.x;
    z = hit.z;
  }
  return { x, z };
}

function collideFoe(nx: number, nz: number, worldId: WorldId) {
  let x = nx;
  let z = nz;
  const h = collideHouses(x, z, worldId);
  if (h) {
    x = h.x;
    z = h.z;
  }
  const k = collideKeep(x, z);
  if (k) {
    x = k.x;
    z = k.z;
  }
  const v = collideVillage(x, z, false);
  if (v) {
    x = v.x;
    z = v.z;
  }
  for (const t of TREES) {
    if (fallenTrees.has(treeKey(t.x, t.z))) continue;
    const rad = 0.92 * t.s;
    const dx = x - t.x;
    const dz = z - t.z;
    const d2 = dx * dx + dz * dz;
    if (d2 < rad * rad && d2 > 1e-6) {
      const d = Math.sqrt(d2);
      x = t.x + (dx / d) * rad;
      z = t.z + (dz / d) * rad;
    }
  }
  for (const r of ROCKS) {
    if (rockGone(r.x, r.z)) continue;
    const rad = rockRadius(r.s) * 0.92;
    const dx = x - r.x;
    const dz = z - r.z;
    const d2 = dx * dx + dz * dz;
    if (d2 < rad * rad && d2 > 1e-6) {
      const d = Math.sqrt(d2);
      x = r.x + (dx / d) * rad;
      z = r.z + (dz / d) * rad;
    }
  }
  return { x, z };
}

function DayNight({ worldId }: { worldId: WorldId }) {
  const sun = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const amb = useRef<THREE.AmbientLight>(null);
  const bgCol = useRef(new THREE.Color());
  const sunCol = useRef(new THREE.Color());
  const hemiSky = useRef(new THREE.Color());
  const hemiGnd = useRef(new THREE.Color());
  const fogCol = useRef(new THREE.Color());
  const tmpA = useRef(new THREE.Color());
  const tmpB = useRef(new THREE.Color());
  const { scene, gl, camera } = useThree();
  const hi = gfxLevel(gl) === "high";
  const tint = WORLD_TINT[worldId];
  const env = useMemo(() => getStoryEnv(), []);
  useFrame(() => {
    const studio = live.charView ? live.studioLight : null;
    const { t: hr } = gameClock();
    const elev = Math.sin(live.day * Math.PI * 2);
    let dusk = duskAmt(hr);
    if (studio === "afternoon") dusk = 0;
    if (studio === "sunset") dusk = 0.28;
    if (studio === "night") dusk = 1;
    if (studio === "shade") dusk = 0;
    if (studio === "interior") dusk = 0.15;
    live.dusk = dusk;
    live.night = dusk > 0.62;

    const daySky = `rgb(${Math.round(tint.sky[0] * 2.4 + 80)}, ${Math.round(tint.sky[1] * 2.2 + 90)}, ${Math.round(tint.sky[2] * 2 + 110)})`;
    let dSun = 1.05 + Math.max(0, elev) * 0.55;
    let dHemi = 0.62 + Math.max(0, elev) * 0.22;
    let dAmb = 0.28 + Math.max(0, elev) * 0.12;
    let dSunC = "#fff1d0";
    let dSky = "#d8ecff";
    let dGnd = "#6a7a48";
    let dFog = tint.fog;
    let dBg = daySky;
    let dNear = 55;
    let dFar = 480;
    if (worldId === "meadow") {
      // Key-art golden hour: strong warm key, cool sky fill, long honey haze.
      dSunC = "#ffe2b4";
      dSky = "#9fd4f5";
      dGnd = "#6d8a3a";
      dFog = "#e4efd2";
      dBg = "#79c4f2";
      dSun = 1.55 + Math.max(0, elev) * 0.2;
      dHemi = 0.48;
      dAmb = 0.32;
      dNear = 150;
      dFar = 760;
    }
    if (hr >= 6.2 && hr < 11 && !studio) {
      const morn = Math.sin(((hr - 6.2) / 4.8) * Math.PI) * (1 - dusk);
      dSun += 0.55 * morn;
      dAmb += 0.28 * morn;
      dSunC = "#fff6dc";
      dSky = "#e8f4c8";
      dFog = "#e8eec8";
      dBg = "#f3ecd4";
    }

    const gSun = 0.95;
    const gHemi = 0.55;
    const gAmb = 0.3;
    const gSunC = "#f0a45a";
    const gSky = "#f0c090";
    const gGnd = "#8a5a38";
    const gFog = "#c87858";
    const gBg = "#c07048";
    const gNear = 42;
    const gFar = 300;

    const nSun = 0.92;
    const nHemi = 0.64;
    const nAmb = 0.46;
    const nSunC = "#d4e2f8";
    const nSky = "#9ab4dc";
    const nGnd = "#3e4e68";
    const nFog = "#3a4868";
    const nBg = "#283850";
    const nNear = 52;
    const nFar = 380;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const mix = (a: string, b: string, t: number, out: THREE.Color) => {
      tmpA.current.set(a);
      tmpB.current.set(b);
      out.copy(tmpA.current).lerp(tmpB.current, t);
    };

    let sunI: number;
    let hemiI: number;
    let ambI: number;
    let fogNear: number;
    let fogFar: number;
    if (dusk <= 0) {
      sunI = dSun;
      hemiI = dHemi;
      ambI = dAmb;
      fogNear = dNear;
      fogFar = dFar;
      sunCol.current.set(dSunC);
      hemiSky.current.set(dSky);
      hemiGnd.current.set(dGnd);
      fogCol.current.set(dFog);
      bgCol.current.set(dBg);
    } else if (dusk < 0.4) {
      const k = dusk / 0.4;
      sunI = lerp(dSun, gSun, k);
      hemiI = lerp(dHemi, gHemi, k);
      ambI = lerp(dAmb, gAmb, k);
      fogNear = lerp(dNear, gNear, k);
      fogFar = lerp(dFar, gFar, k);
      mix(dSunC, gSunC, k, sunCol.current);
      mix(dSky, gSky, k, hemiSky.current);
      mix(dGnd, gGnd, k, hemiGnd.current);
      mix(dFog, gFog, k, fogCol.current);
      mix(dBg, gBg, k, bgCol.current);
    } else {
      const k = (dusk - 0.4) / 0.6;
      sunI = lerp(gSun, nSun, k);
      hemiI = lerp(gHemi, nHemi, k);
      ambI = lerp(gAmb, nAmb, k);
      fogNear = lerp(gNear, nNear, k);
      fogFar = lerp(gFar, nFar, k);
      mix(gSunC, nSunC, k, sunCol.current);
      mix(gSky, nSky, k, hemiSky.current);
      mix(gGnd, nGnd, k, hemiGnd.current);
      mix(gFog, nFog, k, fogCol.current);
      mix(gBg, nBg, k, bgCol.current);
    }

    if (live.house || studio === "interior") {
      ambI += 0.38;
      hemiI += 0.12;
      sunI *= 0.35;
    }
    if (isDungeon(worldId) || live.dungeon) {
      sunI = 0.12;
      hemiI = 0.28;
      ambI = 0.16;
      sunCol.current.set("#c88850");
      hemiSky.current.set("#6a4a32");
      hemiGnd.current.set("#241c14");
      fogCol.current.set("#120e0a");
      bgCol.current.set("#0a0806");
      fogNear = 6;
      fogFar = 38;
    }
    if (studio === "shade") {
      sunI *= 0.35;
      hemiI += 0.18;
      ambI += 0.12;
    }
    const clock = gameClock();
    const storm =
      worldId === "meadow" &&
      !live.house &&
      !live.dungeon &&
      Math.floor(live.day * 2) % 4 === 1 &&
      clock.t > 13.2 &&
      clock.t < 16.4;
    live.raining = storm;
    if (storm) {
      fogNear = Math.min(fogNear, 22);
      fogFar = Math.min(fogFar, 110);
      tmpA.current.set("#8aa0b0");
      fogCol.current.lerp(tmpA.current, 0.42);
      sunI *= 0.62;
      if (!live.smashed.rainonce) {
        live.smashed.rainonce = true;
        live.hint = "Rain on the hill. The path is still the path.";
      }
    }

    const px = live.charView ? 0 : live.x;
    const py = live.charView ? 1 : live.y;
    const pz = live.charView ? 0 : live.z;
    const hi = gfxLevel(gl) === "high";
    live.quality = hi ? "high" : "low";

    if (sun.current) {
      if (sun.current.target.parent !== scene) scene.add(sun.current.target);
      const a = live.day * Math.PI * 2;
      const ox = studio === "shade" ? -38 : worldId === "meadow" ? 68 : 52;
      const oy = (worldId === "meadow" ? 18 : 36) + Math.max(0.15, elev) * (worldId === "meadow" ? 10 : 18);
      const oz = studio === "shade" ? 22 : worldId === "meadow" ? -52 : -34;
      if (worldId === "meadow" && !studio) {
        if (dusk > 0.55) {
          const ml = 140;
          sun.current.position.set(px + 0.42 * ml, py + 0.72 * ml, pz - 0.48 * ml);
          sun.current.target.position.set(px, py, pz);
        } else {
          // Low sun behind-left. Snap the shadow volume so the map does not swim.
          const lift = 0.34 + Math.max(0, elev) * 0.1;
          const snap = 6;
          const sx = Math.round(px / snap) * snap;
          const sy = Math.round(py / snap) * snap;
          const sz = Math.round(pz / snap) * snap;
          sun.current.position.set(sx - 0.52 * 140, sy + lift * 140, sz + 0.78 * 140);
          sun.current.target.position.set(sx, sy, sz);
        }
      } else if (studio) {
        sun.current.position.set(px + ox, py + oy, pz + oz);
        sun.current.target.position.set(px, py, pz);
      } else {
        sun.current.position.set(px + Math.cos(a) * 70, py + 28 + elev * 50, pz + Math.sin(a) * 50 - 16);
        sun.current.target.position.set(px, py, pz);
      }
      sun.current.intensity = sunI;
      sun.current.color.copy(sunCol.current);
      sun.current.target.updateMatrixWorld();
      sun.current.castShadow = hi;
      if (hi) {
        const res = 512;
        if (sun.current.shadow.mapSize.x !== res) {
          sun.current.shadow.mapSize.set(res, res);
          sun.current.shadow.map?.dispose();
          sun.current.shadow.map = null;
        }
        sun.current.shadow.camera.near = 4;
        sun.current.shadow.camera.far = 320;
        const span = 40;
        sun.current.shadow.camera.left = -span;
        sun.current.shadow.camera.right = span;
        sun.current.shadow.camera.top = span;
        sun.current.shadow.camera.bottom = -span;
        sun.current.shadow.camera.updateProjectionMatrix();
        sun.current.shadow.bias = -0.0002;
        sun.current.shadow.normalBias = 0.06;
        sun.current.shadow.radius = 3;
      }
      atmo.sunDir.copy(sun.current.position).sub(sun.current.target.position).normalize();
    }
    atmo.sunColor.copy(sunCol.current);
    RIM_AMOUNT.value = live.house || live.dungeon ? 0.22 : 0.85 * (1 - dusk * 0.75);
    atmo.sunI = sunI / 2.5;
    atmo.dusk = dusk;
    atmo.horizon.copy(fogCol.current);
    {
      const zen = dusk <= 0 ? "#7fa3c4" : dusk < 0.4 ? "#6f6f9c" : "#0d1630";
      tmpA.current.set(zen);
      atmo.zenith.lerp(tmpA.current, 0.08);
      tmpA.current.set(dusk < 0.4 ? "#fff0d8" : "#5a6488");
      atmo.cloud.lerp(tmpA.current, 0.08);
      tmpA.current.set(dusk < 0.4 ? "#c3a491" : "#1c2440");
      atmo.cloudShade.lerp(tmpA.current, 0.08);
    }
    if (fill.current) {
      if (worldId === "meadow" && !studio) {
        // Soft sky bounce from the camera side so backlit faces never go muddy.
        fill.current.position.set(px + (camera.position.x - px) * 4 + 6, py + 16, pz + (camera.position.z - pz) * 4);
        fill.current.intensity = live.night ? 0.48 : 0.74;
        fill.current.color.set(live.night ? "#8aa0d0" : "#cfe0f6");
      } else {
        fill.current.position.set(px - 28, py + 18, pz + 22);
        fill.current.intensity = (live.night ? 0.48 : 0.42) + (studio === "shade" ? 0.2 : 0);
        fill.current.color.set(live.night ? "#8aa0d0" : "#dce8ff");
      }
    }
    if (rim.current) {
      if (worldId === "meadow" && !studio) rim.current.position.set(px - 60, py + 20, pz + 10);
      else rim.current.position.set(px + 18, py + 14, pz - 40);
      rim.current.intensity = live.night ? 0.12 : worldId === "meadow" ? 0.5 : 0.38;
      rim.current.color.set(live.night ? "#a8b8e0" : worldId === "meadow" ? "#ffc070" : "#ffd8a0");
    }
    if (hemi.current) {
      hemi.current.intensity = hemiI + (hi ? 0 : 0.18);
      hemi.current.color.copy(hemiSky.current);
      hemi.current.groundColor.copy(hemiGnd.current);
    }
    if (amb.current) amb.current.intensity = ambI + (hi ? 0 : 0.2);
    scene.background = bgCol.current;
    if (hi && env && scene.environment !== env) scene.environment = env;
    scene.environmentIntensity = 0;
    const fog = scene.fog;
    if (fog instanceof THREE.Fog) {
      fog.color.copy(fogCol.current);
      fog.near = fogNear;
      fog.far = fogFar;
    }
    gl.toneMappingExposure = isDungeon(worldId)
      ? 0.92
      : live.night
        ? 1.18
        : worldId === "meadow"
          ? 1.02
          : 1.12;
  });
  return (
    <>
      <color attach="background" args={[tint.fog]} />
      <fog attach="fog" args={[tint.fog, 55, 480]} />
      <ambientLight ref={amb} intensity={0.58} />
      <hemisphereLight ref={hemi} args={["#ffe8c4", "#6a8a3c", 0.92]} />
      <directionalLight
        ref={sun}
        position={[68, 22, -52]}
        intensity={1.62}
        color="#ffb060"
        castShadow={false}
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-camera-near={4}
        shadow-camera-far={90}
        shadow-camera-left={-28}
        shadow-camera-right={28}
        shadow-camera-top={28}
        shadow-camera-bottom={-28}
        shadow-bias={-0.0008}
        shadow-radius={0}
      />
      {hi ? <directionalLight ref={fill} position={[-28, 18, 22]} intensity={0.62} color="#e8f0ff" /> : null}
      {hi ? <directionalLight ref={rim} position={[18, 14, -40]} intensity={0.48} color="#ffe2b0" /> : null}
      {worldId === "meadow" ? <LushSky /> : null}
      <NightStars />
    </>
  );
}

function NightStars() {
  const ref = useRef<THREE.Points>(null);
  const moon = useRef<THREE.Group>(null);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 280;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const e = 0.12 + Math.random() * 1.15;
      const r = 280 + Math.random() * 90;
      pos[i * 3] = Math.cos(a) * Math.cos(e) * r;
      pos[i * 3 + 1] = Math.sin(e) * r + 28;
      pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  useFrame(({ camera, clock }) => {
    if (!ref.current) return;
    ref.current.position.copy(camera.position);
    const mat = ref.current.material as THREE.PointsMaterial;
    mat.opacity = Math.max(0, (live.dusk - 0.38) * 1.7);
    ref.current.visible = live.dusk > 0.36;
    if (moon.current) {
      moon.current.position.copy(camera.position);
      moon.current.visible = live.dusk > 0.4;
      const glow = moon.current.children[1] as THREE.Mesh | undefined;
      if (glow) {
        const s = 1.05 + Math.sin(clock.elapsedTime * 0.6) * 0.04;
        glow.scale.setScalar(s);
      }
    }
  });
  return (
    <group>
      <points ref={ref} geometry={geo} visible={false} frustumCulled={false}>
        <pointsMaterial color="#e8f0ff" size={0.55} sizeAttenuation transparent opacity={0} depthWrite={false} fog={false} />
      </points>
      <group ref={moon} visible={false} frustumCulled={false}>
        <mesh position={[58, 96, -70]}>
          <sphereGeometry args={[9, 16, 12]} />
          <meshBasicMaterial color="#eef0e2" fog={false} />
        </mesh>
        <mesh position={[58, 96, -70]}>
          <sphereGeometry args={[14, 12, 10]} />
          <meshBasicMaterial color="#c8d4f0" transparent opacity={0.1} depthWrite={false} fog={false} />
        </mesh>
      </group>
    </group>
  );
}

function Player({
  worldId,
  spawn,
  hooks,
  paused,
  puzzle,
}: {
  worldId: WorldId;
  spawn: { x: number; y: number } | null;
  hooks: WorldHooks;
  paused: boolean;
  puzzle: MutableRefObject<PuzzleRuntime>;
}) {
  const group = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const vy = useRef(0);
  const orbit = useRef(0);
  const camPitch = useRef(0);
  const camDist = useRef(5.8);
  const camDesired = useRef(new THREE.Vector3());
  const shake = useRef(0);
  const talkLatch = useRef(false);
  const bombLatch = useRef(false);
  const slamCue = useRef(0);
  const throwLatch = useRef(false);
  const boot = useRef(false);
  const lean = useRef(0);
  const stepAcc = useRef(0);
  const coyote = useRef(0);
  const wasHome = useRef(true);
  const homeFor = useRef(0);
  const innKnocks = useRef(0);
  const innKnockIdle = useRef(0);
  const innKnockLatch = useRef(false);
  const innClockLatch = useRef(false);

  useEffect(() => {
    if (live.warpTo) {
      const p = live.warpTo;
      live.x = p.x;
      live.z = p.z;
      live.y = heightAt(p.x, p.z);
      live.yaw = worldId === "meadow" ? Math.PI : 0;
      live.speed = 0;
      live.vx = 0;
      live.house = null;
      live.houseY = 0;
      live.doorUse = null;
      live.mounted = false;
      live.dungeon = isDungeon(worldId);
      live.grounded = true;
      live.warpTo = null;
      vy.current = 0;
      if (worldId === "meadow" && Math.hypot(p.x - TREE_HOME.x, p.z - TREE_HOME.z) < 4) {
        const plat = heightAt(TREE_HOME.x, TREE_HOME.z) + TREE_HOUSE_H;
        live.house = "yours";
        live.houseY = heightAt(TREE_HOME.x, TREE_HOME.z);
        live.x = TREE_HOME.x;
        live.z = TREE_HOME.z + 1.15;
        live.y = plat + 0.04;
        live.yaw = Math.PI;
      }
      clearShots();
      puzzle.current = makeRuntime(worldId);
      live.dungFlags = { plates: false, key: false, pads: false, eyes: false, far: false, mix: false };
      if (live.sleepFade > 0.35) {
        live.roomWarp = { to: worldId, x: live.x, z: live.z, t: 0, phase: "in" };
      }
      boot.current = true;
      return;
    }
    const p = spawnOnField(worldId, spawn);
    live.x = p.x;
    live.z = p.z;
    live.y = heightAt(p.x, p.z);
    live.yaw = worldId === "meadow" ? Math.PI : 0;
    live.speed = 0;
    live.vx = 0;
    live.house = null;
    live.houseY = 0;
    live.doorUse = null;
    live.mounted = false;
    live.dungeon = isDungeon(worldId);
    live.grounded = true;
    live.warpTo = null;
    vy.current = 0;
    clearShots();
    puzzle.current = makeRuntime(worldId);
    live.dungFlags = { plates: false, key: false, pads: false, eyes: false, far: false, mix: false };
    const plat = heightAt(TREE_HOME.x, TREE_HOME.z) + TREE_HOUSE_H;
    const atHome = worldId === "meadow" && Math.hypot(p.x - TREE_HOME.x, p.z - TREE_HOME.z) < TREE_HW + 1.2;
    if (atHome) {
      live.house = "yours";
      live.houseY = heightAt(TREE_HOME.x, TREE_HOME.z);
      live.x = TREE_HOME.x;
      live.z = TREE_HOME.z + 1.15;
      live.y = plat + 0.04;
      live.yaw = Math.PI;
      camDist.current = 6.2;
      orbit.current = 0;
      camera.position.set(TREE_HOME.x, plat + 2.72, TREE_HOME.z - 3.55);
      camera.lookAt(TREE_HOME.x, plat + 1.22, TREE_HOME.z + 2.2);
    }
    boot.current = true;
  }, [worldId, spawn, puzzle, camera]);

  useEffect(() => {
    window.__controlsTest = {
      getYaw: () => live.yaw,
      getSpeed: () => live.speed,
      getX: () => live.x,
      getZ: () => live.z,
      getY: () => live.y,
      getGrounded: () => live.grounded,
      getVx: () => live.vx,
      getHint: () => live.hint,
      getLock: () => Boolean(live.lock),
      setKeys: (codes) => {
        injectedKeys.clear();
        for (const c of codes) injectedKeys.add(c);
      },
      setSteer: (v) => {
        live.steerOverride = v;
      },
      openPack: () => {
        live.openPack = true;
        live.wantPause = true;
      },
      jump: () => queueJump(),
      warp: (x, z) => {
        live.warpTo = { x, z };
      },
      setShot: (cam: { x: number; y: number; z: number; lx: number; ly: number; lz: number } | null) => {
        live.shotCam = cam;
      },
      setPull: (n: number) => {
        camDist.current = n;
      },
    };
    return () => {
      delete window.__controlsTest;
    };
  }, []);

  useFrame((_, rawDt) => {
    const raw = Math.min(0.05, Math.max(0, rawDt));
    if (live.hitStop > 0) live.hitStop = Math.max(0, live.hitStop - raw);
    const dt = live.hitStop > 0 ? raw * 0.12 : raw;
    live.paused = paused || live.doorMath || Boolean(live.chestOpen);
    live.playT += dt;
    if (live.blast) {
      live.blast.t -= dt;
      if (live.blast.t <= 0) live.blast = null;
    }
    live.place = { world: worldId, x: live.x, z: live.z, house: live.house };
    if (live.playT - live.bossSeen > 0.4) {
      if (live.bossTitleT > 0) live.bossTitleT = Math.max(0, live.bossTitleT - dt);
      if (live.bossTitleT <= 0 && !live.rookFight) {
        live.bossTitle = null;
        live.bossHp = 0;
        live.bossMax = 0;
      }
    }
    if (worldId === "cavern") live.objective = "Find the heart of Sun Hollow.";
    if (live.stompT > 0) live.stompT = Math.max(0, live.stompT - dt);
    if (Math.abs(live.speed) < 0.28 && live.grounded && !live.rolling && !live.zipping) live.stillT += dt;
    else live.stillT = 0;
    if (live.spark > 0) live.spark = Math.max(0, live.spark - dt * 2.4);
    if (live.heroFlash > 0) live.heroFlash = Math.max(0, live.heroFlash - dt * 3.2);
    if (live.blockFlash > 0) live.blockFlash = Math.max(0, live.blockFlash - dt * 4.2);
    if (live.cuccoRage > 0) live.cuccoRage = Math.max(0, live.cuccoRage - dt);
    if (live.trauma > 0) live.trauma = Math.max(0, live.trauma - dt * 1.6);
    shake.current = Math.max(live.spark, live.trauma * 0.35);

    if (worldId === "meadow") {
      if (live.house === "yours") homeFor.current += dt;
      if (
        homeFor.current > 0.8 &&
        wasHome.current &&
        live.house !== "yours" &&
        !live.smashed.valeLook &&
        !live.roomWarp &&
        !(useGame.getState().quests?.valeLook)
      ) {
        live.smashed.valeLook = true;
        live.smashed.placeVale = true;
        useGame.getState().setQuest("valeLook", 1);
        live.wantFly = true;
        live.sleepFade = 0;
        live.banner = "The Vale";
        sfx.bark();
      }
      wasHome.current = live.house === "yours";
    }

    if (live.wantFly && !live.flyover) {
      live.wantFly = false;
      live.flyover = {
        t: 0,
        sx: camera.position.x,
        sy: camera.position.y,
        sz: camera.position.z,
        lx: live.x,
        ly: live.y + 1.2,
        lz: live.z,
      };
    }

    if (live.warp) {
      const w = live.warp;
      live.warp = null;
      live.warpTo = { x: w.x, z: w.z };
      useGame.getState().enterWorld(w.to);
      return;
    }

    if (live.realmWarp) {
      const w = live.realmWarp;
      w.t += dt;
      if (w.phase === "out") {
        live.sleepFade = Math.min(1, w.t / 0.45);
        if (w.t >= 0.48) {
          w.phase = "hold";
          w.t = 0;
          live.sleepFade = 1;
          live.x = w.x;
          live.z = w.z;
          live.y = heightAt(w.x, w.z);
          live.yaw = w.yaw;
          live.realm = w.realm;
          live.realmName = w.name;
          live.region = w.name;
          if (w.name) {
            live.banner = w.name;
            live.bannerMs = 2400;
          }
          vy.current = 0;
          live.grounded = true;
        }
      } else if (w.phase === "hold") {
        live.sleepFade = 1;
        if (w.t > 0.1) {
          w.phase = "in";
          w.t = 0;
        }
      } else {
        live.sleepFade = Math.max(0, 1 - w.t / 0.45);
        if (w.t > 0.48) {
          live.sleepFade = 0;
          live.realmWarp = null;
        }
      }
    }

    if (live.gateCross) {
      const g = live.gateCross;
      g.t += dt;
      if (g.phase === "out") {
        live.sleepFade = Math.min(1, g.t / 0.36);
        const dx = g.walkX - live.x;
        const dz = g.walkZ - live.z;
        const d = Math.hypot(dx, dz) || 1;
        live.x += (dx / d) * 3.4 * dt;
        live.z += (dz / d) * 3.4 * dt;
        live.yaw = Math.atan2(-dx, -dz);
        live.y = heightAt(live.x, live.z);
        if (g.t >= 0.4) {
          g.phase = "hold";
          g.t = 0;
          live.sleepFade = 1;
          live.x = g.x;
          live.z = g.z;
          live.y = heightAt(g.x, g.z);
          live.yaw = g.yaw;
          vy.current = 0;
          live.grounded = true;
        }
      } else if (g.phase === "hold") {
        live.sleepFade = 1;
        if (g.t > 0.22) {
          g.phase = "in";
          g.t = 0;
          live.speed = 6;
        }
      } else {
        live.sleepFade = Math.max(0, 1 - g.t / 0.4);
        live.x += -Math.sin(live.yaw) * 4.2 * dt;
        live.z += -Math.cos(live.yaw) * 4.2 * dt;
        live.y = heightAt(live.x, live.z);
        if (g.t > 0.42) {
          live.sleepFade = 0;
          live.gateCross = null;
        }
      }
    }

    if (live.roomWarp) {
      const w = live.roomWarp;
      w.t += dt;
      if (w.phase === "out") {
        live.sleepFade = Math.min(1, w.t / 0.52);
        if (w.walkX != null && w.walkZ != null) {
          const dx = w.walkX - live.x;
          const dz = w.walkZ - live.z;
          const d = Math.hypot(dx, dz) || 1;
          live.x += (dx / d) * 2.15 * dt;
          live.z += (dz / d) * 2.15 * dt;
          live.yaw = Math.atan2(-dx, -dz);
          live.y = heightAt(live.x, live.z);
        }
        if (w.t >= 0.55) {
          w.phase = "hold";
          w.t = 0;
          live.sleepFade = 1;
          live.warp = { to: w.to, x: w.x, z: w.z };
        }
      } else if (w.phase === "hold") {
        live.sleepFade = 1;
        if (w.t > 0.12) {
          w.phase = "in";
          w.t = 0;
        }
      } else {
        live.sleepFade = Math.max(0, 1 - w.t / 0.48);
        if (w.t > 0.5) {
          live.sleepFade = 0;
          live.roomWarp = null;
        }
      }
    }

    if (live.warpTo && !live.roomWarp) {
      live.x = live.warpTo.x;
      live.z = live.warpTo.z;
      live.y = heightAt(live.x, live.z);
      live.house = null;
      live.doorUse = null;
      live.mounted = false;
      vy.current = 0;
      live.grounded = true;
      live.warpTo = null;
      clearShots();
    }

    if (!live.paused && !live.house) {
      live.day += dt / 640;
      if (live.day >= 1) live.day -= 1;
      live.dayCycle += dt / 640;
    }

    const rt = puzzle.current;
    const spec = PUZZLES[worldId];
    if (platesSatisfied(rt, spec)) rt.platesOn = true;

    if (live.sleepPhase === "out") {
      live.sleepFade = Math.min(1, live.sleepFade + dt * 0.85);
      if (live.sleepFade >= 1) {
        live.sleepPhase = "hold";
        live.sleepHold = 0;
        live.day = MORNING_8;
        useGame.getState().healAll();
        const woke = useGame.getState();
        if ((woke.quests?.planted ?? 0) > 0 && (woke.quests?.years ?? 0) < 3 && live.house === "yours") {
          woke.setQuest("years", 3);
          live.hint = "Nana is here. You're awake. Three years.";
        }
        sfx.ok();
      }
    } else if (live.sleepPhase === "hold") {
      live.sleepHold += dt;
      if (live.sleepHold > 0.55) {
        live.sleepPhase = "in";
      }
    } else if (live.sleepPhase === "in") {
      live.sleepFade = Math.max(0, live.sleepFade - dt * 0.9);
      if (live.sleepFade <= 0) {
        live.sleepPhase = "";
        live.bedLie = false;
        live.bed = null;
      }
    }

    if (live.doorUse) {
      live.doorUse.t += dt * 1.05;
      const leavingOak = live.doorUse.id === "yours" && live.doorUse.dir === "out";
      if (!live.sleepPhase && !live.roomWarp && !leavingOak) {
        const u = Math.min(1, live.doorUse.t / 1.05);
        live.sleepFade = u < 0.38 ? u / 0.38 : u < 0.62 ? 1 : Math.max(0, 1 - (u - 0.62) / 0.38);
      } else if (leavingOak) {
        live.sleepFade = 0;
      }
      const hut = HOUSES.find((h) => h.id === live.doorUse!.id);
      if (hut) {
        const { d } = houseSize(hut);
        const doorZ = hut.z + d * 0.5;
        if (live.doorUse.dir === "in") {
          const u = Math.min(1, live.doorUse.t);
          live.x += (hut.x - live.x) * dt * 3.2;
          live.z += (hut.z - 0.4 - live.z) * dt * 3.2;
          if (u > 0.28) live.doorUse.opened = true;
          if (live.doorUse.t > 1.05) {
            live.house = live.doorUse.id;
            live.houseY = heightAt(hut.x, hut.z);
            live.x = hut.x;
            live.z = hut.z;
            if (live.house === "inn") {
              live.innFloor = 0;
              live.innInRoom = false;
            }
            live.doorUse = null;
            clearShots();
          }
        } else if (hut.id === "yours") {
          const plat = heightAt(TREE_HOME.x, TREE_HOME.z) + TREE_HOUSE_H;
          const standZ = TREE_HOME.z + TREE_HD + 0.95;
          const k = Math.min(1, live.doorUse.t / 0.55);
          const e = k * k * (3 - 2 * k);
          live.x = TREE_HOME.x;
          live.z = TREE_HOME.z + 0.85 + (standZ - TREE_HOME.z - 0.85) * e;
          live.y = plat + 0.04;
          live.yaw = Math.PI;
          live.speed = 0;
          live.vx = 0;
          vy.current = 0;
          if (live.doorUse.t > 0.7) {
            live.house = null;
            live.houseY = heightAt(TREE_HOME.x, TREE_HOME.z);
            live.x = TREE_HOME.x;
            live.z = standZ;
            live.y = plat + 0.04;
            live.doorUse = null;
          }
        } else {
          live.x += (hut.x - live.x) * dt * 3.2;
          live.z += (doorZ + 1.35 - live.z) * dt * 3.2;
          if (live.doorUse.t > 1.05) {
            if (hut.id === "inn") {
              live.innFloor = 0;
              live.innInRoom = false;
            }
            live.house = null;
            live.houseY = 0;
            live.x = hut.x;
            live.z = doorZ + 1.4;
            live.doorUse = null;
          }
        }
      } else {
        live.doorUse = null;
      }
    }

    if (live.tunnel) {
      const tun = live.tunnel;
      tun.t += dt;
      live.speed = 2.6;
      if (tun.phase === "walk") {
        const dx = tun.tx - live.x;
        const dz = tun.tz - live.z;
        const d = Math.hypot(dx, dz) || 1;
        live.x += (dx / d) * Math.min(d, 2.4 * dt);
        live.z += (dz / d) * Math.min(d, 2.4 * dt);
        live.yaw = Math.atan2(-dx, -dz);
        live.y = heightAt(live.x, live.z);
        live.sleepFade = Math.min(1, tun.t / 0.85);
        if (d < 0.45 || tun.t > 1.15) {
          tun.phase = "black";
          tun.t = 0;
          live.sleepFade = 1;
        }
      } else if (tun.phase === "black") {
        live.sleepFade = 1;
        live.speed = 0;
        if (tun.t > 0.28) {
          live.x = tun.ex;
          live.z = tun.ez;
          live.y = heightAt(tun.ex, tun.ez);
          const dx = tun.ex - tun.tx;
          const dz = tun.ez - tun.tz;
          live.yaw = Math.atan2(-dx, -dz);
          tun.phase = "in";
          tun.t = 0;
        }
      } else {
        live.speed = 0;
        live.sleepFade = Math.max(0, 1 - tun.t / 0.55);
        if (tun.t > 0.58) {
          live.sleepFade = 0;
          live.tunnel = null;
        }
      }
    }

    tryHouse(live.x, live.z, worldId);

    const hut = live.house ? HOUSES.find((h) => h.id === live.house) : null;
    if (hut && (hut.kind === "home" || hut.kind === "inn" || hut.id === "yours")) {
      const bunk = bunkSpots(hut);
      const dTop = Math.hypot(live.x - bunk.top.x, live.z - bunk.top.z);
      const dBot = Math.hypot(live.x - bunk.bottom.x, live.z - bunk.bottom.z);
      live.nearBed = dTop < 1.15 ? "top" : dBot < 1.15 ? "bottom" : null;
    } else {
      live.nearBed = null;
    }

    const mail = homeMailSpot();
    live.nearMail = !live.house && Math.hypot(live.x - mail.x, live.z - mail.z) < 1.15;

    live.nearCave =
      worldId === "meadow" &&
      !live.house &&
      Math.hypot(live.x - CAVE_MOUTH.x, live.z - CAVE_MOUTH.z) < 2.4;

    live.nearGate = null;
    if (worldId === "meadow" && !live.house) {
      const st = useGame.getState();
      for (const g of TEMPLE_GATES) {
        if (!worldGateOpen(g.world, st.worldsCleared, st.gems)) continue;
        if (Math.hypot(live.x - g.x, live.z - g.z) < 2.05) {
          live.nearGate = g.world;
          break;
        }
      }
      if (!live.nearGate) {
        for (const m of SECRET_MOUTHS) {
          if (Math.hypot(live.x - m.x, live.z - m.z) < 2.2) {
            live.nearGate = m.world;
            break;
          }
        }
      }
    }

    const hx = live.horseX ?? PADDOCK.x;
    const hz = live.horseZ ?? PADDOCK.z;
    live.nearHorse =
      !live.house &&
      Math.hypot(live.x - hx, live.z - hz) < 2.05 &&
      Math.abs(live.speed) < 7 &&
      live.horseFlee < 0.08;

    let nearestNpc: string | null = null;
    let nearestD = 2.85;
    const people = npcsIn(worldId);
    if (worldId === "meadow" && !live.house) {
      const ash = npcById("ash");
      if (ash && !people.some((n) => n.id === "ash")) people.push(ash);
    }
    for (const n of people) {
      const p = live.npcPos[n.id] ?? { x: n.x, z: n.z };
      const d = Math.hypot(live.x - p.x, live.z - p.z);
      if (d < nearestD) {
        nearestD = d;
        nearestNpc = n.id;
      }
    }
    if (!live.house) {
      for (const [id, p] of Object.entries(live.npcPos)) {
        if (!p || people.some((n) => n.id === id)) continue;
        if (!passerBy(id) && !npcById(id)) continue;
        const kind = npcById(id)?.kind;
        if (kind && kind !== "person") continue;
        const d = Math.hypot(live.x - p.x, live.z - p.z);
        if (d < nearestD) {
          nearestD = d;
          nearestNpc = id;
        }
      }
    }
    live.nearNpc = nearestNpc;

    if (live.chestUnlock) {
      const ch = spec.chests.find((c) => c.id === live.chestUnlock);
      if (ch && !chestAlreadyLooted(worldId, ch)) {
        markChestOpen(chestSaveId(worldId, ch.id));
        rt.opened.add(ch.id);
        live.chestOpen = { id: ch.id, x: ch.x, z: ch.z, t: 0, item: ch.item ?? "coin", coins: ch.coins, granted: false };
        const face = Math.atan2(-(ch.x - live.x), -(ch.z - live.z));
        live.yaw = face;
        live.speed = 0;
        const loot = ch.item ?? "coin";
        const big = loot === "bow" || loot === "heart" || loot === "ocarina" || loot === "bombs" || loot === "axe" || loot === "boom";
        if (big) sfx.chestRare();
        else sfx.chest();
        grantChestItem(ch.item, ch.coins);
        live.chestUnlock = null;
      } else {
        live.chestUnlock = null;
      }
    }
    if (live.chestOpen) {
      live.chestOpen.t += dt;
      if (live.chestOpen.t > 2.6) {
        live.chestOpen = null;
        if (!live.ceremony) live.getItem = null;
      }
    }
    live.nearChest = null;
    if (!live.house) {
      for (const ch of spec.chests) {
        if (chestAlreadyLooted(worldId, ch) || rt.opened.has(ch.id)) continue;
        if (Math.hypot(live.x - ch.x, live.z - ch.z) < 1.35) live.nearChest = ch.id;
      }
    }

    const freeze =
      paused ||
      live.doorMath ||
      Boolean(live.doorUse) ||
      Boolean(live.roomWarp) ||
      Boolean(live.realmWarp) ||
      Boolean(live.gateCross) ||
      Boolean(live.tunnel) ||
      Boolean(live.flyover) ||
      live.sleepPhase !== "" ||
      live.bedLie ||
      live.sit ||
      Boolean(live.chestOpen) ||
      Boolean(live.talking) ||
      Boolean(live.bazaar);
    if (live.talking && live.talkNpc) {
      const who = live.npcPos[live.talkNpc];
      if (who) {
        const want = Math.atan2(-(who.x - live.x), -(who.z - live.z));
        let turn = want - live.yaw;
        while (turn > Math.PI) turn -= Math.PI * 2;
        while (turn < -Math.PI) turn += Math.PI * 2;
        live.yaw += turn * Math.min(1, dt * 6);
      }
    }
    const { steer: rawSteer, throttle } = moveAxes();
    const steer = live.steerOverride != null ? live.steerOverride : rawSteer;

    if (!freeze) {
      if (live.mountCool > 0) live.mountCool = Math.max(0, live.mountCool - dt);
      if (
        !live.mounted &&
        live.mountT <= 0 &&
        live.mountCool <= 0 &&
        live.nearHorse &&
        useGame.getState().hasHorse &&
        live.speed > 0.45 &&
        live.speed < 6.6 &&
        live.horseFlee < 0.08 &&
        !live.talking &&
        !live.cling
      ) {
        live.mountT = 0.01;
        live.speed = 0;
        sfx.neigh();
      }
      if (live.mountT > 0 && !live.mounted) {
        if (live.mountCool > 0) live.mountT = Math.max(0, live.mountT - dt / 0.85);
        else {
          live.mountT = Math.min(1, live.mountT + dt / 1.55);
          live.speed = 0;
          if (live.mountT >= 1) {
            live.mounted = true;
            live.hint = "You're on.";
          }
        }
      }
      if (live.cling > 0) live.speed = 0;
      if (live.mounted && (live.nearCave || live.nearGate || live.nearHouse)) {
        live.mounted = false;
        live.mountCool = 1.6;
        live.speed = 0;
        live.hint = live.nearHouse ? "She waits outside." : "She stops at the mouth. You go on foot.";
      }
      if (live.climbCool > 0) live.climbCool = Math.max(0, live.climbCool - dt);
      if (live.zipping) {
        const drop = consumeJump();
        stepZip(dt, drop);
      } else if (live.nearZip && consumeJump()) {
        beginZip();
      } else if (!live.climbing && !live.house && live.climbCool <= 0 && !live.mounted && !live.swim) {
        const held = grabWall();
        if (held && (Math.abs(throttle) > 0.2 || consumeJump())) startWall(held);
        else {
        const L = nearLadder(live.x, live.z);
        if (L) {
          const along = live.y - heightAt(L.x, L.z);
          if (along > 0.35 && along < L.h + 0.55) startClimb(L, along);
          else if (Math.abs(throttle) > 0.22 || along < 0.4) startClimb(L, Math.max(0.12, Math.min(along, L.h - 0.15)));
        }
        }
      }
      if (live.climbing?.startsWith("wall:")) {
        const was = live.climbing;
        stepWall(dt, throttle, steer);
        if (was && !live.climbing) vy.current = 0;
      } else if (live.climbing && !live.zipping) {
        const Lad = fieldLadders().find((l) => l.id === live.climbing) ?? nearLadder(live.x, live.z);
        if (Lad) {
          snapToLadder(Lad);
          live.climbV = throttle * 3.55;
          live.climbH += live.climbV * dt;
          live.climbPhase += dt * (Math.abs(live.climbV) > 0.12 ? 5.4 : 0);
          live.y = heightAt(Lad.x, Lad.z) + live.climbH;
          live.grounded = false;
          live.speed = 0;
          live.vx = 0;
          if (live.climbH >= Lad.h - 0.12) hopOffLadder(Lad);
          else if (live.climbH <= 0.08 && throttle < -0.15) hopOffLadder(Lad, 1.15);
        } else {
          live.climbing = null;
        }
      }
      if (live.knock && live.knock.t > 0 && !live.climbing) {
        live.knock.t -= dt;
        const kx = live.x + live.knock.vx * dt;
        const kz = live.z + live.knock.vz * dt;
        const kh = collideWorld(kx, kz, worldId, rt);
        live.x = kh.x;
        live.z = kh.z;
        if (Math.hypot(kh.x - kx, kh.z - kz) > 0.04) live.knock = null;
        else if (live.knock.t <= 0) live.knock = null;
      }

      if (!live.climbing && !live.zipping && live.pigRide <= 0) {
      const shieldWant = Boolean(live.hasShield && (isShieldHeld() || live.holding === "shield"));
      if (shieldWant && !live.shieldUp) live.shieldAge = 0;
      live.shieldUp = shieldWant;
      live.shieldAge = shieldWant ? live.shieldAge + dt : 9;
      if (consumeTarget()) {
        if (live.lock) live.lock = null;
        else {
          const foes = fieldActors(worldId).enemies;
          const dead = useGame.getState().defeated[worldId] ?? [];
          let best: { id: string; kind: string; x: number; z: number } | null = null;
          let bestD = 18;
          for (const f of foes) {
            if (dead.includes(f.id)) continue;
            const p = live.foeTrack[f.id] ?? { x: f.x, z: f.z };
            const d = Math.hypot(live.x - p.x, live.z - p.z);
            if (d < bestD) {
              bestD = d;
              best = { id: f.id, kind: f.kind, x: p.x, z: p.z };
            }
          }
          if (!best) {
            const fx = -Math.sin(live.yaw);
            const fz = -Math.cos(live.yaw);
            best = { id: "focus", kind: "focus", x: live.x + fx * 8, z: live.z + fz * 8 };
          }
          live.lock = best;
          if (best) sfx.select();
        }
      }
      if (live.lock) {
        if (live.lock.kind === "focus") {
          const fx = -Math.sin(live.yaw);
          const fz = -Math.cos(live.yaw);
          live.lock.x = live.x + fx * 8;
          live.lock.z = live.z + fz * 8;
        } else {
          const p = live.foeTrack[live.lock.id] ?? live.npcPos[live.lock.id] ?? live.lock;
          live.lock.x = p.x;
          live.lock.z = p.z;
          const dx = p.x - live.x;
          const dz = p.z - live.z;
          if (Math.hypot(dx, dz) > 22) live.lock = null;
          else live.yaw = Math.atan2(-dx, -dz);
        }
      }
      let drive = throttle;
      let wishX = 0;
      let wishZ = 0;
      let wish = 0;
      if (!live.lock) {
        const view = live.yaw + orbit.current;
        const fxv = -Math.sin(view);
        const fzv = -Math.cos(view);
        wishX = fxv * throttle - Math.cos(view) * steer;
        wishZ = fzv * throttle + Math.sin(view) * steer;
        wish = Math.min(1, Math.hypot(wishX, wishZ));
        drive = wish;
      } else if (drive < 0) drive *= 0.42;
      const wading = worldId === "meadow" && !live.house && standingInWater(live.x, live.z);
      const ice = onIce();
      if (wading || live.swim) live.wetT = Math.max(live.wetT, live.swim ? 1.4 : 0.7);
      else live.wetT = Math.max(0, live.wetT - dt * 2.2);
      const guard = live.shieldUp && live.hasShield ? (live.shieldAge < 0.34 ? 0.86 : 0.7) : 1;
      const sneaking = live.crouch && !live.mounted;
      const glide = live.gliding ? 0.55 : 1;
      const stickPush = Math.min(1, Math.abs(drive));
      const walkCap = sneaking ? 3.1 : 6.4;
      const runCap = (live.mounted ? 20 : 16.5) * (live.cheatFast ? 3.4 : 1) * glide;
      let speedMag = 0;
      if (stickPush > 0.1) {
        if (stickPush < 0.45) speedMag = walkCap * ((stickPush - 0.1) / 0.35);
        else speedMag = walkCap + (runCap - walkCap) * Math.min(1, (stickPush - 0.45) / 0.55);
      }
      const want = (drive < 0 ? -0.62 : 1) * speedMag * (live.balloonRide ? 0.62 : 1) * (wading ? 0.58 : ice ? 0.82 : 1) * guard;
      const accel = ice ? 8 : wading ? 22 : Math.abs(drive) < 0.04 ? 62 : 82;
      live.speed += (want - live.speed) * (1 - Math.exp(-dt * accel));
      if (Math.abs(drive) < 0.04) {
        live.speed *= Math.max(0, 1 - dt * (ice ? 0.7 : 28));
        if (Math.abs(live.speed) < 0.12) live.speed = 0;
      }
      live.sprinting = Math.abs(live.speed) > 9;
      let fx = -Math.sin(live.yaw);
      let fz = -Math.cos(live.yaw);
      let nx: number;
      let nz: number;
      if (live.lock) {
        const rx = Math.cos(live.yaw);
        const rz = -Math.sin(live.yaw);
        const lat = steer * 8 * 0.78;
        nx = live.x + fx * live.speed * dt + rx * lat * dt;
        nz = live.z + fz * live.speed * dt + rz * lat * dt;
      } else if (wish > 0.08) {
        const view = live.yaw + orbit.current;
        const inv = Math.hypot(wishX, wishZ) || 1;
        fx = wishX / inv;
        fz = wishZ / inv;
        const wantYaw = Math.atan2(-fx, -fz);
        let diff = wantYaw - live.yaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        live.yaw += diff * Math.min(1, dt * 14);
        orbit.current = view - live.yaw;
        nx = live.x + fx * live.speed * dt;
        nz = live.z + fz * live.speed * dt;
      } else {
        nx = live.x + fx * live.speed * dt;
        nz = live.z + fz * live.speed * dt;
      }
      const push = nearestBlock(rt, live.x, live.z, 1.45);
      let skip: string | null = null;
      if (push && Math.abs(live.speed) > 0.6) {
        shoveBlock(push, fx, fz, dt * 2.4);
        skip = push.id;
      }
      const hit = stepSolids(live.x, live.z, nx, nz, worldId, rt, skip);
      const step = Math.hypot(hit.x - live.x, hit.z - live.z);
      const rise = sampleH(hit.x, hit.z) - sampleH(live.x, live.z);
      const steep =
        worldId === "meadow" && onSurface() && !live.climbing && !live.house && rise > 0.45 && step > 0.001 && rise / step > 1.2;
      if (!steep) {
        live.x = hit.x;
        live.z = hit.z;
      }
      live.vx = live.speed;
      if (hut?.kind === "inn" && live.house === "inn" && !live.innInRoom) {
        const land = innStairArrive(hut, live.x, live.z);
        if (land) {
          live.innFloor = land.floor;
          live.x = land.x;
          live.z = land.z;
          live.yaw = land.yaw;
          live.speed = 0;
          live.vx = 0;
        }
        const four = (useGame.getState().quests?.["inn-four"] ?? 0) >= 1;
        if (!four && live.innFloor === 2 && !live.talking) {
          const dx = hut.x + 2.05;
          const dz = hut.z - 6.35;
          const nearDoor = live.slash && Math.hypot(live.slash.x - dx, live.slash.z - dz) < 1.8;
          if (nearDoor) {
            if (!innKnockLatch.current) {
              innKnockLatch.current = true;
              innKnocks.current += 1;
              innKnockIdle.current = 0;
              sfx.select();
              const n = innKnocks.current;
              live.listen = n > 6 ? "Too many. The door stays shut." : `${n}.`;
              if (n > 6) innKnocks.current = 0;
            }
          } else innKnockLatch.current = false;
          if (innKnocks.current > 0) {
            innKnockIdle.current += dt;
            if (innKnockIdle.current > 1.15) {
              const n = innKnocks.current;
              innKnocks.current = 0;
              innKnockIdle.current = 0;
              if (n === 4) {
                useGame.getState().setQuest("inn-four", 1);
                useGame.getState().addCoins(12);
                sfx.ok();
                live.listen = "Room 4 cracks open. Twelve coins, and the snoring stops.";
              } else {
                sfx.miss();
                live.listen = "Not four. The desk skips that door. He snores the missing count.";
              }
            }
          }
        }
        const clockDone = (useGame.getState().quests?.["lark-hour"] ?? 0) >= 1;
        if (!clockDone && live.innFloor === 0 && !live.talking) {
          const nearClock = Math.hypot(live.x - hut.x, live.z - (hut.z - 6.6)) < 2.3;
          if (nearClock && !live.listen) live.hint = "The inn clock. Swing once for each hour.";
          const struck = live.slash && Math.hypot(live.slash.x - hut.x, live.slash.z - (hut.z - 7.1)) < 2.2;
          if (struck) {
            if (!innClockLatch.current) {
              innClockLatch.current = true;
              const cur = live.innClock < 0 ? Math.floor(gameClock().t) % 12 : live.innClock;
              live.innClock = (cur + 1) % 12;
              sfx.select();
              const show = live.innClock === 0 ? 12 : live.innClock;
              live.listen = `${show}.`;
              if (live.innClock === 4) {
                useGame.getState().setQuest("lark-hour", 1);
                useGame.getState().addCoins(8);
                sfx.ok();
                live.listen = "Four. The clock agrees with the door. Eight coins drop from the slot.";
              }
            }
          } else innClockLatch.current = false;
        }
      }

      if (consumeSlide() && live.grounded && !live.sliding && !live.rolling && !live.mounted && !live.climbing) {
        live.sliding = true;
        live.slideU = 0;
        live.rolling = false;
        sfx.slide();
      }
      if (live.sliding) {
        live.slideU += dt * 1.55;
        const dist = 8.4 * dt;
        const steps = Math.max(1, Math.ceil(dist / 0.12));
        for (let i = 0; i < steps; i++) {
          const tx = live.x + fx * (dist / steps);
          const tz = live.z + fz * (dist / steps);
          const rh = collideWorld(tx, tz, worldId, rt);
          const blocked = Math.hypot(rh.x - tx, rh.z - tz) > 0.05;
          live.x = rh.x;
          live.z = rh.z;
          if (blocked) {
            live.sliding = false;
            live.slideU = 1;
            live.speed = 0;
            break;
          }
        }
        live.speed = 8;
        if (live.slideU >= 1) {
          live.sliding = false;
          live.slideU = 0;
          live.speed = 3.2;
        }
      }
      }

      const wet = pondU(live.x, live.z);
      const inMoat = moatRing(live.x, live.z) > 0.42 && !onDrawbridge(live.x, live.z);
      live.swim = (wet > 0.62 || inMoat) && !live.house && !live.mounted;
      if (live.grounded) coyote.current = 0.14;
      else coyote.current = Math.max(0, coyote.current - dt);
      const canCrouch = live.grounded && !live.mounted && !live.cheatFly && !live.balloonRide && !live.climbing && !live.zipping && !live.talking && !live.swim;
      if (isJumpHeld() && canCrouch) live.crouchHold = Math.min(0.4, live.crouchHold + dt);
      else if (!isJumpHeld()) live.crouchHold = 0;
      else live.crouchHold = Math.max(0, live.crouchHold - dt);
      live.crouch = live.crouchHold > 0.2;
      if (!freeze && live.climbing?.startsWith("wall:") && consumeJump()) {
        dropWall();
        vy.current = 3.2;
        live.grounded = false;
      } else if (!freeze && live.climbing && consumeJump()) {
        const Lad = fieldLadders().find((l) => l.id === live.climbing);
        if (Lad) hopOffLadder(Lad, live.climbH > Lad.h * 0.5 ? -1.4 : 1.15);
      } else if (!freeze && live.pigRide > 0 && consumeJump()) {
        live.pigRide = 0;
        vy.current = JUMP * 0.72;
        live.grounded = false;
      } else if (!freeze && !live.balloonRide && !live.zipping && !live.crouch && consumeJump() && (live.grounded || coyote.current > 0) && !live.mounted && !live.swim && live.pigRide <= 0) {
        vy.current = JUMP;
        live.grounded = false;
        coyote.current = 0;
        live.jumpStretch = 1;
        sfx.jump();
      }
      if (!freeze && live.mounted && consumeJump()) {
        vy.current = 6.4;
        live.grounded = false;
        live.horseJump = true;
      }
    }

    {
      const perch = worldId === "meadow" ? roofAt(live.x, live.z, worldId) : 0;
      const terrain0 = live.house || live.dungeon ? heightAt(live.x, live.z) : sampleH(live.x, live.z) - grottoDrop(live.x, live.z);
      const terrain = terrain0 + (worldId === "meadow" && !live.house && !live.dungeon ? terraceLift(live.x, live.z) + houseLift(live.x, live.z) : 0);
      const logTop = worldId === "meadow" && !live.house ? creekLift(live.x, live.z) : 0;
      const ledge = worldId === "meadow" && !live.house ? ledgeLift(live.x, live.z) : 0;
      const traps = trapHeight(live.x, live.z);
      const sink = trapSink();
      const ground =
        Math.max(
          terrain + climbOnRocks(live.x, live.z) + (hut ? innStairLift(hut, live.x, live.z) : 0) + logTop + traps + ledge,
          perch,
        ) + sink;
      if (!live.climbing && !live.zipping) {
        if (live.grottoPop || live.springPop) {
          vy.current = live.springPop || live.grottoPop;
          live.grottoPop = 0;
          live.springPop = 0;
          live.grounded = false;
          live.y = ground + 0.35;
        } else if (live.cheatFly && !live.house && !live.balloonRide) {
          if (isJumpHeld()) live.y += 9.5 * dt;
          vy.current = 0;
          live.grounded = false;
        } else if (live.balloonRide && !live.house) {
          const cruise = 14;
          live.balloonH += (cruise - live.balloonH) * Math.min(1, dt * 0.7);
          live.balloonX = live.x;
          live.balloonZ = live.z;
          live.y = ground + Math.max(0.35, live.balloonH);
          vy.current = 0;
          live.grounded = true;
          live.horseJump = false;
        } else if (live.pigRide > 0 && !live.house) {
          live.pigRide = Math.max(0, live.pigRide - dt);
          live.x = live.pigX;
          live.z = live.pigZ;
          live.yaw = live.pigYaw;
          live.speed = 5.2;
          live.grounded = true;
          vy.current = 0;
          live.y = heightAt(live.x, live.z) + 0.48;
        } else {
        const canGlide =
          useGame.getState().hasGlider &&
          !live.house &&
          !live.mounted &&
          !live.swim &&
          !live.cheatFly &&
          !live.balloonRide &&
          !live.climbing &&
          !live.zipping &&
          live.y - ground > 2.4;
        if (canGlide && (!live.grounded || vy.current < -0.2)) {
          live.gliding = true;
          if (throttle > 0.15) vy.current = Math.min(4.8, vy.current + 16 * dt);
          else if (throttle < -0.15) vy.current = Math.max(-6.2, vy.current - 12 * dt);
          else {
            vy.current -= 5 * dt;
            if (vy.current < -2.05) vy.current = -2.05;
            if (vy.current > 0.6) vy.current *= Math.exp(-dt * 3);
          }
        } else {
          live.gliding = false;
          vy.current -= GRAV * dt;
          if (!live.grounded && vy.current > 0.4 && !isJumpHeld()) vy.current *= Math.exp(-dt * 9.5);
          if (!live.grounded && vy.current < 0) vy.current -= GRAV * 0.38 * dt;
        }
        live.y += vy.current * dt;
        const floor = live.swim ? Math.max(ground, 0.22) : ground;
        if (live.y <= floor) {
          if (!live.grounded && vy.current < -2 && sink > -0.5) {
            const wet = standingInWater(live.x, live.z);
            if (wet) {
              sfx.splash();
              splashAt(live.x, live.z, floor + 0.06);
            } else {
              sfx.land(live.dungeon ? "stone" : "grass");
              puffAt(live.x, live.z, floor + 0.04, false);
            }
            live.stompT = 0.28;
            live.landSquash = 1;
          }
          live.y = floor;
          vy.current = 0;
          live.grounded = true;
          live.horseJump = false;
        } else {
          live.grounded = false;
        }
        live.airVy = vy.current;
        }
      }
      live.airVy = vy.current;
      live.jumpStretch = Math.max(0, live.jumpStretch - dt * 4);
      live.landSquash = live.grounded ? Math.max(0, live.landSquash - dt * 5) : 0;
    }

    if (freeze) {
      live.speed *= Math.max(0, 1 - dt * 8);
    }

    live.area = inVillage(live.x, live.z) ? "village" : "field";
    if (!onSurface()) {
      if (live.realmName && live.region !== live.realmName) {
        live.region = live.realmName;
        live.banner = live.realmName;
        live.bannerMs = 2200;
      }
    } else if (!isDungeon(worldId)) {
      const vx = live.x - VX;
      const vz = live.z - VZ;
      let region = "";
      if (Math.hypot(live.x + 62, live.z + 36) < 18) region = "Ashdoor";
      else if (live.z < -148 && live.x < -20 && live.x > -110) region = "Whispering Woods";
      else if (live.z > 48 && Math.abs(live.x) < 36) region = "The Keep";
      else if (Math.hypot(vx, vz) < 36) region = "Oakstead";
      else if (Math.hypot(live.x, live.z + 108) < 78) region = "Numeria Field";
      if (region && region !== live.region) {
        live.region = region;
        live.banner = region;
        live.bannerMs = 2200;
      }
    }

    const g = useGame.getState();
    live.hasSword = g.hasSword;
    live.hasShield = g.hasShield;
    live.hasHorse = g.hasHorse;
    if (g.holding) live.holding = g.holding;

    if (!freeze && !live.zipping && !live.climbing) {
      if (live.swinging) {
        live.swingU += dt * (live.swingKind === 3 ? 1.7 : 4.1);
        if (live.swingKind === 3) {
          if (live.swingU > 0.22 && slamCue.current < 1) {
            slamCue.current = 1;
            sfx.swing();
          }
          if (live.swingU > 0.52 && slamCue.current < 2) {
            slamCue.current = 2;
            sfx.bladeGround();
            const fx = -Math.sin(live.yaw);
            const fz = -Math.cos(live.yaw);
            puffAt(live.x + fx * 0.8, live.z + fz * 0.8, live.y + 0.04, false);
          }
        }
        if (live.swingU >= 1) {
          live.swinging = false;
          live.swingU = 0;
        }
      }
      const wantSwing = consumeSwing();
      const wantBomb = consumeBomb();
      const wantThrow = consumeThrow();

      if (live.holding === "axes" && g.hasThrowAxes && wantSwing) {
        const h = handPos();
        const fx = -Math.sin(live.yaw);
        const fz = -Math.cos(live.yaw);
        live.axes.push({
          x: h.x,
          y: h.y + 0.2,
          z: h.z,
          vx: fx * 18 + live.speed * 0.25,
          vy: 3.4,
          vz: fz * 18 + live.speed * 0.25,
          age: 0,
          yaw: live.yaw,
          stuck: false,
        });
        if (live.axes.length > 14) live.axes.splice(0, live.axes.length - 14);
        sfx.throw();
      }

      if (wantThrow && live.carry === "cucco") live.henToss = 1;

      if (live.holding === "bomb" && g.hasBombs) {
        if ((wantBomb || wantSwing) && live.bombWind <= 0 && !bombLatch.current) {
          bombLatch.current = true;
          live.bombWind = 0.02;
        }
        if (live.bombWind > 0) {
          live.bombWind += dt;
          if (live.bombWind >= BOMB_WIND) {
            if (g.spendBomb()) {
              const h = handPos();
              const fx = -Math.sin(live.yaw);
              const fz = -Math.cos(live.yaw);
              const power = 1 + Math.min(0.55, live.bombWind);
              live.bombs.push({
                x: h.x,
                y: h.y,
                z: h.z,
                vx: fx * 9.4 * power + live.speed * 0.35,
                vy: 4.6 + 2.2 * power,
                vz: fz * 9.4 * power + live.speed * 0.35,
                fuse: 2.35,
                boom: false,
                spin: 0,
                bounce: 0,
              });
              sfx.throw();
            }
            live.bombWind = 0;
          }
        }
        if (!wantBomb && !isSwingHeld()) bombLatch.current = false;
      } else {
        live.bombWind = 0;
        bombLatch.current = false;
      }

      if (live.holding === "boom" && g.hasBoom && live.booms.length === 0 && (wantSwing || wantThrow)) {
        const h = handPos();
        const fx = -Math.sin(live.yaw);
        const fz = -Math.cos(live.yaw);
        const rx = Math.cos(live.yaw);
        const rz = -Math.sin(live.yaw);
        live.booms.push({
          x: h.x,
          y: h.y,
          z: h.z,
          vx: fx * 17.8 + rx * 5.2,
          vz: fz * 17.8 + rz * 5.2,
          vy: 0.55,
          age: 0,
          back: false,
          spin: 0,
          ox: live.x,
          oz: live.z,
          sx: rx,
          sz: rz,
          fx,
          fz,
        });
        sfx.throw();
        throwLatch.current = true;
      }

      if ((live.holding === "bow" && g.hasBow) || (live.holding === "sling" && g.hasSling)) {
        if (isSwingHeld()) {
          live.slingPull = Math.min(1, live.slingPull + dt * 2.4);
        } else if (live.slingPull > 0.02) {
          const pull = live.slingPull;
          live.slingPull = 0;
          const seed = live.holding === "sling";
          const spent = seed ? g.spendSeed() : g.spendArrow();
          if (spent) {
            const h = handPos();
            const fx = -Math.sin(live.yaw);
            const fz = -Math.cos(live.yaw);
            const speed = 14 + pull * 16;
            const aimY = live.lock ? 0.18 : 0.04;
            live.arrows.push({
              x: h.x,
              y: h.y + 0.12,
              z: h.z,
              vx: fx * speed,
              vy: aimY * speed,
              vz: fz * speed,
              age: 0,
              kind: seed ? "seed" : "arrow",
            });
            sfx.throw();
          }
        }
      }

      if (live.holding === "sword" && g.hasSword) {
        const spd = Math.abs(live.speed);
        if (isSwingHeld() && !live.swinging && !live.spinning) {
          live.chargeHold += dt;
          if (live.chargeHold > 0.32) {
            live.charging = true;
            live.chargeU = Math.min(1, (live.chargeHold - 0.32) / 0.75);
          }
        }
        if (!isSwingHeld() && live.charging) {
          live.charging = false;
          if (live.chargeU > 0.22) {
            live.spinning = true;
            live.spinU = 0;
            sfx.spin();
            sfx.yah(true);
          } else {
            live.chargeU = 0;
          }
          live.chargeHold = 0;
        }
        if (!isSwingHeld()) live.chargeHold = 0;
        if (live.spinning) {
          live.spinU += dt * 1.15;
          live.slash = { x: live.x, z: live.z, r: 1.8 + live.chargeU * 1.1 };
          if (live.spinU >= 1) {
            live.spinning = false;
            live.spinU = 0;
            live.chargeU = 0;
            live.slash = null;
          }
        }
        if (wantSwing && !live.swinging && !live.charging && !live.spinning) {
          if (live.blade === "knife") {
            const fx = -Math.sin(live.yaw);
            const fz = -Math.cos(live.yaw);
            live.arrows.push({
              x: live.x + fx * 0.6,
              y: live.y + 1.1,
              z: live.z + fz * 0.6,
              vx: fx * 18,
              vy: 1.2,
              vz: fz * 18,
              age: 0,
              kind: "knife",
            });
            sfx.throw();
          }
          const running = spd > 6.2 && live.grounded && !live.mounted;
          live.swingKind = running ? 3 : spd > 1.6 ? 1 : live.combo;
          live.combo = (live.combo + 1) % 3;
          live.swinging = true;
          live.swingU = 0;
          if (running) {
            slamCue.current = 0;
            vy.current = 5.4;
            live.grounded = false;
            sfx.hyah();
          } else if (live.blade === "fire") sfx.fireSwing();
          else if (live.blade === "ice") sfx.iceSwing();
          else if (live.blade !== "knife") sfx.swing();
          if (!running && live.blade !== "knife" && Math.random() < (spd > 7 ? 0.7 : 0.4)) sfx.yah(spd > 7);
        }
      }
      if (live.swinging && live.holding === "sword" && g.hasSword && !live.spinning) {
        const t = live.swingU;
        if (t > 0.14 && t < 0.82) {
          const fx = -Math.sin(live.yaw);
          const fz = -Math.cos(live.yaw);
          const spin = live.spinning;
          live.slash = {
            x: live.x + fx * (spin ? 0.35 : 1.55),
            z: live.z + fz * (spin ? 0.35 : 1.55),
            r: live.blade === "knife" ? 0.35 : spin ? 2.5 : 2.25,
          };
        } else {
          live.slash = null;
        }
      } else if (!live.spinning) {
        live.slash = null;
      }

      if (!isSwingHeld() && !wantThrow) throwLatch.current = false;
    }

    const talk = consumeTalk() || (isTalkHeld() && !talkLatch.current);
    if (isTalkHeld()) talkLatch.current = true;
    else talkLatch.current = false;
    const talkOn = Boolean(talk) && onSurface();
    const caveTalk = Boolean(talk) && stepOldroot(Boolean(talk));
    const paleTalk = Boolean(talk) && stepPale(Boolean(talk));
    const eventTalk = Boolean(talk) && stepEvents(Boolean(talk));
    const canyonTook = worldId === "meadow" && onSurface() && stepCanyon(talkOn);
    const regionTook = worldId === "meadow" && stepRegions(talkOn && !canyonTook);
    const shopTook = worldId === "meadow" && stepCastleShop(talkOn && !regionTook && !canyonTook);
    if (talk && onSurface() && !caveTalk && !paleTalk && !eventTalk && !canyonTook && !shopTook && !regionTook && !freeze && !live.doorMath && !live.zipping) {
      const basket = Math.hypot(live.x - live.balloonX, live.z - live.balloonZ);
      if (live.nearZip) {
        beginZip();
      } else if (!live.balloonRide && live.balloonTicket && basket < 1.7 && !live.house && !live.mounted) {
        live.balloonRide = true;
        live.balloonTicket = false;
        live.balloonH = 2.4;
        live.x = live.balloonX;
        live.z = live.balloonZ;
        live.y = heightAt(live.balloonX, live.balloonZ) + 2.4;
        vy.current = 0;
        sfx.ok();
      } else if (!live.mounted && !live.nearNpc && live.nearPet === "cucco" && live.nearPetId && live.carry !== "cucco") {
        live.carry = "cucco";
        live.carryId = live.nearPetId;
        sfx.ok();
        live.listen = "You picked up a chicken.";
      } else if (live.carry === "cucco" && !live.nearNpc && !live.nearHouse && !live.nearChest && !live.nearMail) {
        live.henToss = 1;
      } else if (live.nearNpc) {
        useGame.getState().startDoorQuiz(live.nearNpc, "talk");
      } else if (live.nearHouse && !live.house) {
        const hut = HOUSES.find((h) => h.id === live.nearHouse);
        if (hut && hut.locked) {
          live.listen = hut.lockSay || "The door is boarded.";
          sfx.thud();
        } else {
          useGame.getState().startDoorQuiz(live.nearHouse, "door");
        }
      } else if (live.nearExit && live.house) {
        live.doorUse = { id: live.house, t: 0, dir: "out", opened: true };
      } else if (live.nearChest) {
        useGame.getState().startDoorQuiz(live.nearChest, "chest");
      } else if (live.nearCave) {
        beginRoomWarp("cavern", 0, 16.2, CAVE_MOUTH);
      } else if (live.nearGate) {
        const id = live.nearGate as WorldId;
        const mouth = TEMPLE_GATES.find((g) => g.world === id) ?? SECRET_MOUTHS.find((g) => g.world === id);
        beginRoomWarp(id, 0, 16.2, mouth ?? { x: live.x, z: live.z });
      } else if (live.nearDungeonExit) {
        beginRoomWarp("meadow", CAVE_MOUTH.x, CAVE_MOUTH.z + 3.6, fieldActors(worldId).gate);
      } else if (live.nearHorse && g.hasHorse && !live.mounted && live.mountT <= 0 && Math.abs(live.speed) < 7 && live.horseFlee < 0.08) {
        live.mountT = 0.01;
        live.speed = 0;
        sfx.neigh();
      } else if (live.mounted && live.nearHorse) {
        live.mounted = false;
        live.mountT = 0;
        live.mountCool = 1.4;
      } else if (!live.mounted && live.mountT <= 0 && g.hasHorse && Math.hypot(live.x - (live.horseX ?? 0), live.z - (live.horseZ ?? 0)) < 3.2 && Math.abs(live.speed) >= 7) {
        live.hint = "She's spooked. Walk up.";
        sfx.neigh();
      } else if (live.nearBed && live.house) {
        live.bed = live.nearBed;
        live.bedLie = true;
        live.sleepPhase = "out";
        live.sleepFade = 0;
      } else if (live.sit) {
        live.sit = false;
      } else if (live.nearChair && live.sitAt && Math.hypot(live.x - live.sitAt.x, live.z - live.sitAt.z) < 0.9) {
        live.sit = true;
        live.x = live.sitAt.x;
        live.z = live.sitAt.z;
        live.yaw = live.sitAt.yaw;
      } else if (live.nearMail) {
        useGame.getState().startDoorQuiz("mail", "mail");
      } else if (tryHiddenRead()) {
        sfx.ok();
      }
    }

    if (!freeze && !live.roomWarp && !live.realmWarp && !live.house && worldId === "meadow") {
      watchRealm();
      watchRidgeGate();
      watchRangeGate();
      watchChart();
      tickEvents(dt);
      const dCave = Math.hypot(live.x - CAVE_MOUTH.x, live.z - CAVE_MOUTH.z);
      if (dCave < 1.16) beginRoomWarp("cavern", 0, 16.2, CAVE_MOUTH);
      else if (live.nearGate) {
        const id = live.nearGate as WorldId;
        const mouth = TEMPLE_GATES.find((n) => n.world === id) ?? SECRET_MOUTHS.find((n) => n.world === id);
        if (mouth && Math.hypot(live.x - mouth.x, live.z - mouth.z) < 1.16) {
          beginRoomWarp(id, 0, 16.2, mouth);
        }
      }
    }
    if (!freeze && !live.roomWarp && isDungeon(worldId)) {
      const gate = fieldActors(worldId).gate;
      if (Math.hypot(live.x - gate.x, live.z - gate.z) < 1.18) {
        const secret = SECRET_MOUTHS.find((m) => m.world === worldId);
        const back = secret ?? CAVE_MOUTH;
        beginRoomWarp("meadow", back.x, back.z + 3.6, gate);
      }
    }
    if (!freeze && !live.roomWarp && (worldId === "grove" || worldId === "ridge")) {
      const z = lastRoomZ(worldId);
      if (Math.abs(live.x) < 3.2 && Math.abs(live.z - z) < 2.6 && !live.secretGot) {
        const gg = useGame.getState();
        if (worldId === "grove" && !gg.hasThrowAxes) {
          gg.grantThrowAxes();
          live.secretGot = 4;
          live.hint = "Throwing axes. Equip them. V throws. They stick.";
          sfx.chime();
        } else if (worldId === "ridge" && !gg.hasGlider) {
          gg.grantGlider();
          live.secretGot = 4;
          live.hint = "A wind cloth. Jump off something high. Up goes up. Down goes down.";
          sfx.chime();
        }
      }
    }

    if (!freeze && live.grounded && !live.climbing && !live.zipping && Math.abs(live.speed) > 0.7) {
      const spd = Math.abs(live.speed);
      const rate = 3.4 + Math.min(7.2, spd * 0.58);
      stepAcc.current += dt;
      if (stepAcc.current > Math.PI / rate) {
        stepAcc.current = 0;
        const kind = footKind(live.x, live.z, Boolean(live.house), live.dungeon);
        const running = spd > 8.2;
        sfx.step(kind, running);
        if (kind === "water") {
          splashAt(live.x, live.z, live.y + 0.05, running);
          if (live.ripples.length > 14) live.ripples.shift();
          live.ripples.push({ x: live.x, y: live.y + 0.07, z: live.z, t: 0 });
          if (running) sfx.splash();
        } else if (kind === "dirt" || kind === "stone" || (kind === "grass" && running)) {
          puffAt(live.x, live.z, live.y + 0.05, false);
        }
      }
    } else {
      stepAcc.current = 0;
    }

    if (consumeCamAlign()) orbit.current = 0;

    if (live.shotCam) {
      camera.position.set(live.shotCam.x, live.shotCam.y, live.shotCam.z);
      camera.lookAt(live.shotCam.lx, live.shotCam.ly, live.shotCam.lz);
    } else if (live.flyover) {
      const f = live.flyover;
      f.t += dt;
      const plat = heightAt(TREE_HOME.x, TREE_HOME.z) + TREE_HOUSE_H;
      const doorZ = TREE_HOME.z + TREE_HD;
      const hx = live.x;
      const hy = live.y + 1.35;
      const hz = live.z;
      const tw = { x: 6.5, z: -150.1 };
      const ty = heightAt(tw.x, tw.z);
      const shots: { t: number; x: number; y: number; z: number; lx: number; ly: number; lz: number; wave: boolean; face: boolean }[] = [
        { t: 0, x: TREE_HOME.x, y: plat + 1.4, z: TREE_HOME.z + 1.15, lx: TREE_HOME.x, ly: plat + 1.35, lz: doorZ + 1, wave: false, face: false },
        { t: 1.7, x: TREE_HOME.x, y: plat + 1.5, z: doorZ + 2.4, lx: hx, ly: hy, lz: hz, wave: false, face: true },
        { t: 3.1, x: hx + 1.7, y: plat + 1.7, z: hz + 2.3, lx: hx, ly: hy, lz: hz, wave: false, face: true },
        { t: 5.4, x: TREE_HOME.x + 16, y: plat + 8, z: TREE_HOME.z + 10, lx: TREE_HOME.x - 8, ly: plat + 6, lz: TREE_HOME.z, wave: false, face: false },
        { t: 7.2, x: TREE_HOME.x + 10, y: plat + 20, z: TREE_HOME.z + 26, lx: VX, ly: heightAt(VX, VZ) + 6, lz: VZ, wave: false, face: false },
        { t: 9.0, x: TREE_HOME.x + 18, y: heightAt(TREE_HOME.x + 18, TREE_HOME.z + 22) + 3.2, z: TREE_HOME.z + 22, lx: VX, ly: heightAt(VX, VZ) + 2, lz: VZ + 6, wave: false, face: false },
        { t: 10.6, x: tw.x + 0.15, y: ty + 1.25, z: tw.z + 1.7, lx: tw.x, ly: ty + 1.12, lz: tw.z, wave: true, face: false },
        { t: 12.4, x: tw.x + 0.15, y: ty + 1.25, z: tw.z + 1.7, lx: tw.x, ly: ty + 1.12, lz: tw.z, wave: true, face: false },
      ];
      let i = 0;
      while (i < shots.length - 2 && f.t > shots[i + 1]!.t) i++;
      const a = shots[i]!;
      const b = shots[Math.min(shots.length - 1, i + 1)]!;
      const u = Math.min(1, Math.max(0, (f.t - a.t) / Math.max(0.01, b.t - a.t)));
      const e = u * u * (3 - 2 * u);
      camera.position.set(a.x + (b.x - a.x) * e, a.y + (b.y - a.y) * e, a.z + (b.z - a.z) * e);
      camera.lookAt(a.lx + (b.lx - a.lx) * e, a.ly + (b.ly - a.ly) * e, a.lz + (b.lz - a.lz) * e);
      live.flyWave = b.wave ? "tallow" : null;
      if (a.face || b.face) live.yaw = Math.PI;
      live.sleepFade = f.t > 11.6 ? Math.min(1, (f.t - 11.6) / 0.7) : 0;
      if (f.t > 12.6) {
        live.flyover = null;
        live.flyWave = null;
        live.sleepFade = 0;
      }
    } else if (live.ceremony) {
      live.ceremony.t += dt;
      const u = Math.min(1, live.ceremony.t / 8.4);
      const fx = -Math.sin(live.yaw);
      const fz = -Math.cos(live.yaw);
      camera.position.set(live.x + fx * 2.15, live.y + 2.55, live.z + fz * 2.15);
      camera.lookAt(live.x - fx * 0.15, live.y + 1.5, live.z - fz * 0.15);
      live.getItem = u > 0.35 && u < 0.82 ? (live.ceremony.gem === "all" ? "emerald" : live.ceremony.gem) : null;
      if (live.ceremony.t > 9.2) {
        live.ceremony = null;
        live.getItem = null;
      }
    } else if (live.chestOpen) {
      const ch = live.chestOpen;
      const dx = ch.x - live.x;
      const dz = ch.z - live.z;
      const len = Math.hypot(dx, dz) || 1;
      const desired = camDesired.current;
      desired.set(live.x - (dx / len) * 3.1, live.y + 2.05, live.z - (dz / len) * 3.1);
      camera.position.lerp(desired, 1 - Math.exp(-dt * 4.2));
      camera.lookAt((live.x + ch.x) * 0.5, live.y + 1.05, (live.z + ch.z) * 0.5);
    } else if (!live.house && live.talking && live.talkNpc && live.npcPos[live.talkNpc]) {
      const who = live.npcPos[live.talkNpc]!;
      const mx = (live.x + who.x) * 0.5;
      const mz = (live.z + who.z) * 0.5;
      const dx = live.x - who.x;
      const dz = live.z - who.z;
      const len = Math.hypot(dx, dz) || 1;
      const desired = camDesired.current;
      desired.set(mx + (-dz / len) * 3.6, live.y + 1.85, mz + (dx / len) * 3.6);
      camera.position.lerp(desired, 1 - Math.exp(-dt * 3.4));
      camera.lookAt(mx, live.y + 1.28, mz);
    } else {
    const lookAmt = lookAxes();
    orbit.current += lookAmt * dt * 1.6 + lookDrag.x;
    camPitch.current = Math.max(-0.55, Math.min(0.85, camPitch.current + lookDrag.y));
    lookDrag.x = 0;
    lookDrag.y = 0;
    const lockOn = Boolean(live.lock && live.lock.kind !== "focus" && !live.house && !live.zipping);
    const fx = -Math.sin(live.yaw + orbit.current);
    const fz = -Math.cos(live.yaw + orbit.current);
    const mood = worldId === "meadow" && !live.house ? hiddenMood(live.x, live.z) : "";
    const wide = mood === "hush" || mood === "forgot" || mood === "veil";
    const inCave = mood === "cave";
    camDist.current += ((live.mounted ? 9.2 : live.zipping ? 8.2 : live.house === "yours" ? 5.4 : live.dungeon ? 7.6 : inCave ? 4.4 : wide ? 11 : lockOn ? 8.4 : 8.6) - camDist.current) * (1 - Math.exp(-dt * 4.6));
    const height = live.mounted ? 3.35 : live.zipping ? 2.35 : live.house === "yours" ? 2.42 : live.house ? 2.15 : inCave ? 1.62 : wide ? 4.35 : lockOn ? 2.45 : 2.72;
    const dist = live.zipping ? camDist.current : live.house === "yours" ? camDist.current : live.house ? 4.2 : camDist.current;
    const lead = live.house || live.dungeon ? 0 : Math.min(2.2, Math.abs(live.speed) * 0.075);
    const desired = camDesired.current;
    desired.set(live.x + fx * -dist + fx * lead, live.y + height + camPitch.current * 1.6 + (live.rolling ? 1.15 : 0), live.z + fz * -dist + fz * lead);
    if (live.rolling) {
      desired.x -= fx * 1.6;
      desired.z -= fz * 1.6;
    }
    if (lockOn && live.lock) {
      const lx = live.lock.x;
      const lz = live.lock.z;
      const dx = live.x - lx;
      const dz = live.z - lz;
      const len = Math.hypot(dx, dz) || 1;
      desired.set(live.x + (dx / len) * dist * 0.92, live.y + height, live.z + (dz / len) * dist * 0.92);
    }
    if (!live.house) {
      const yaw = live.yaw + orbit.current;
      const shoulder = lockOn ? 0.55 : live.dungeon ? 0.5 : 1.15;
      desired.x += Math.cos(yaw) * shoulder;
      desired.z += -Math.sin(yaw) * shoulder;
    }
    if (live.house === "yours") {
      const plat = heightAt(TREE_HOME.x, TREE_HOME.z) + TREE_HOUSE_H;
      desired.x = TREE_HOME.x - fx * 1.05;
      desired.z = TREE_HOME.z - fz * 1.05;
      desired.y = plat + 2.52;
    } else if (!live.house) {
      const gy = heightAt(desired.x, desired.z) + 1.62;
      if (desired.y < gy) desired.y = gy;
      const away = camNudge(desired.x, desired.z, desired.y, worldId);
      desired.x = away.x;
      desired.z = away.z;
    }
    if (shake.current > 0.02) {
      desired.x += (Math.random() - 0.5) * shake.current * 0.35;
      desired.y += (Math.random() - 0.5) * shake.current * 0.22;
    }
    if (boot.current && live.house === "yours") {
      camera.position.copy(desired);
      boot.current = false;
    } else {
      const camLerp = lockOn ? 10.2 : live.house ? 10.2 : wide || inCave ? 1.8 : 6.2;
      camera.position.lerp(desired, 1 - Math.exp(-dt * camLerp));
      boot.current = false;
    }
    const calling = Boolean(live.horseCall && !live.mounted && live.horseX != null && !live.house);
    if (calling) {
      live.speed = 0;
      const hx = live.horseX as number;
      const hz = live.horseZ as number;
      const dx = hx - live.x;
      const dz = hz - live.z;
      const len = Math.hypot(dx, dz) || 1;
      desired.set(live.x - (dx / len) * 3.4, live.y + 2.2, live.z - (dz / len) * 3.4);
      camera.position.lerp(desired, 1 - Math.exp(-dt * 2.8));
      camera.lookAt(hx, heightAt(hx, hz) + 1.35, hz);
    } else if (lockOn && live.lock) {
      camera.lookAt((live.x + live.lock.x) * 0.5, live.y + 1.12, (live.z + live.lock.z) * 0.5);
    } else {
      camera.lookAt(live.x, live.y + 1.32 - camPitch.current * 2.4, live.z);
    }
    }

    if (group.current) {
      group.current.position.set(live.x, live.y, live.z);
      group.current.rotation.y = live.yaw;
      const wantLean = live.grounded && !live.rolling && !live.climbing && !live.swim ? -steer * Math.min(1, Math.abs(live.speed) / 7) * 0.16 : 0;
      lean.current += (wantLean - lean.current) * (1 - Math.exp(-dt * 7));
      group.current.rotation.z = lean.current;
      const squash = live.grounded ? 1 - live.landSquash * 0.08 : 1 + live.jumpStretch * 0.08;
      group.current.scale.set(1, squash, 1);
    }

    if (worldId === "meadow") {
      const actors = fieldActors(worldId);
      if (Math.hypot(live.x - actors.gate.x, live.z - actors.gate.z) < 1.6 && g.worldsCleared.includes("meadow")) {
        /* meadow gate is flavor */
      }
    } else if (isDungeon(worldId)) {
      const actors = fieldActors(worldId);
      if (Math.hypot(live.x - actors.gate.x, live.z - actors.gate.z) < 1.8) {
        live.nearDungeonExit = true;
      } else live.nearDungeonExit = false;
    }
  });

  return (
    <group ref={group}>
      <N64Hero />
    </group>
  );
}

function LockReticle() {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    const lock = live.lock;
    if (!lock) {
      g.current.visible = false;
      return;
    }
    g.current.visible = true;
    const bob = 0.02 + Math.sin(clock.elapsedTime * 4.6) * 0.04;
    const y = heightAt(lock.x, lock.z) + bob;
    g.current.position.set(lock.x, y, lock.z);
  });
  return (
    <group ref={g} visible={false} renderOrder={40}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.34, 0.46, 22]} />
        <meshBasicMaterial color="#ffe44a" transparent opacity={0.92} depthTest={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.1, 6]} />
        <meshBasicMaterial color="#fff6c0" transparent opacity={0.88} depthTest={false} />
      </mesh>
      <mesh position={[0, 1.42, 0]}>
        <sphereGeometry args={[0.07, 8, 6]} />
        <meshBasicMaterial color="#ffe44a" depthTest={false} />
      </mesh>
    </group>
  );
}

function FlyingArrows({
  worldId,
  paused,
  puzzle,
  hooks,
}: {
  worldId: WorldId;
  paused: boolean;
  puzzle: MutableRefObject<PuzzleRuntime>;
  hooks: WorldHooks;
}) {
  const bombs = useRef<(THREE.Group | null)[]>([]);
  const blasts = useRef<(THREE.Group | null)[]>([]);
  const booms = useRef<(THREE.Group | null)[]>([]);
  const arrows = useRef<(THREE.Group | null)[]>([]);
  const blastAge = useRef<number[]>(Array(10).fill(-1));

  useFrame((_, rawDt) => {
    const dt = Math.min(0.05, rawDt);
    if (live.house && !live.doorUse) {
      if (live.bombs.length || live.booms.length || live.arrows.length) clearShots();
    }
    const freeze = paused || live.paused || live.doorMath;
    const rt = puzzle.current;
    const foes = fieldActors(worldId).enemies;

    const hitFoe = (x: number, z: number, r: number, dmg = 1) => {
      const g = useGame.getState();
      const dead = g.defeated[worldId] ?? [];
      for (const f of foes) {
        if (dead.includes(f.id)) continue;
        if ((live.foeHp[f.id] ?? 1) <= 0) continue;
        const p = live.foeTrack[f.id] ?? f;
        if (Math.hypot(x - p.x, z - p.z) < r) {
          strikeFoe(worldId, f.id, f.kind, dmg, p.x, p.z);
          return f.id;
        }
      }
      return null;
    };

    const solid = (x: number, z: number) => {
      const h = collideHouses(x, z, worldId);
      if (h && Math.hypot(h.x - x, h.z - z) > 0.01) return true;
      const k = collideKeep(x, z);
      if (k && Math.hypot(k.x - x, k.z - z) > 0.01) return true;
      const v = collideVillage(x, z);
      if (v && Math.hypot(v.x - x, v.z - z) > 0.01) return true;
      if (collideDoors(rt, PUZZLES[worldId], x, z)) return true;
      return false;
    };

    if (!freeze) {
      for (let i = live.bombs.length - 1; i >= 0; i--) {
        const b = live.bombs[i]!;
        if (b.boom) {
          live.bombs.splice(i, 1);
          continue;
        }
        b.vy -= GRAV * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.z += b.vz * dt;
        b.spin += dt * 9.4;
        b.fuse -= dt;
        const gy = heightAt(b.x, b.z) + 0.18;
        if (b.y < gy) {
          b.y = gy;
          b.vy = Math.abs(b.vy) * 0.46;
          b.vx *= 0.72;
          b.vz *= 0.72;
          b.bounce += 1;
          if (b.bounce > 5) {
            b.vx = 0;
            b.vz = 0;
            b.vy = 0;
          }
        }
        if (solid(b.x, b.z)) {
          b.vx *= -0.35;
          b.vz *= -0.35;
        }
        if (b.fuse <= 0) {
          explodeAt(b.x, b.y, b.z);
          hitFoe(b.x, b.z, 2.8, 3);
          const slot = blastAge.current.findIndex((t) => t < 0);
          const si = slot >= 0 ? slot : 0;
          blastAge.current[si] = 0;
          const mesh = blasts.current[si];
          if (mesh) mesh.position.set(b.x, b.y, b.z);
          b.boom = true;
          live.bombs.splice(i, 1);
        }
      }

      for (let i = live.booms.length - 1; i >= 0; i--) {
        const b = live.booms[i]!;
        b.age += dt;
        b.spin = (b.spin ?? 0) + dt * 18;
        if (!b.back) {
          const rx = b.sx ?? Math.cos(live.yaw);
          const rz = b.sz ?? -Math.sin(live.yaw);
          if (b.age > 0.22) {
            b.vx += rx * 42 * dt;
            b.vz += rz * 42 * dt;
          }
          if (b.age > 0.64) b.back = true;
        } else {
          const tx = live.x - b.x;
          const tz = live.z - b.z;
          const d = Math.hypot(tx, tz) || 0.001;
          const sp = 16.5;
          b.vx += (tx / d) * sp * dt * 6 - b.vx * dt * 3.2;
          b.vz += (tz / d) * sp * dt * 6 - b.vz * dt * 3.2;
          if (d < 0.85) {
            live.booms.splice(i, 1);
            sfx.ok();
            continue;
          }
        }
        b.x += b.vx * dt;
        b.z += b.vz * dt;
        b.y = heightAt(b.x, b.z) + 1.05 + Math.sin(b.age * 8) * 0.04;
        if (solid(b.x, b.z)) {
          b.back = true;
          b.vx *= -0.2;
          b.vz *= -0.2;
        }
        hitFoe(b.x, b.z, 0.95);
        for (const ch of PUZZLES[worldId].chests) {
          if (Math.hypot(b.x - ch.x, b.z - ch.z) < 0.9 && !chestAlreadyLooted(worldId, ch)) {
            live.nearChest = ch.id;
          }
        }
        if (b.age > 6.5) live.booms.splice(i, 1);
      }

      for (let i = live.axes.length - 1; i >= 0; i--) {
        const a = live.axes[i]!;
        if (a.stuck) continue;
        a.age += dt;
        a.x += a.vx * dt;
        a.z += a.vz * dt;
        a.y += a.vy * dt;
        a.vy -= 14 * dt;
        const gy = heightAt(a.x, a.z) + 0.18;
        const hit = hitFoe(a.x, a.z, 0.75);
        if (a.y <= gy || hit || a.age > 3.2) {
          a.stuck = true;
          a.vx = 0;
          a.vy = 0;
          a.vz = 0;
          a.y = hit ? Math.max(gy + 0.35, Math.min(a.y, gy + 1.15)) : gy + 0.1;
          if (hit) puffAt(a.x, a.z, a.y, false);
        }
      }

      for (let i = live.arrows.length - 1; i >= 0; i--) {
        const a = live.arrows[i]!;
        const steps = 3;
        const sdt = dt / steps;
        let dead = false;
        for (let s = 0; s < steps; s++) {
          a.x += a.vx * sdt;
          a.y += a.vy * sdt;
          a.z += a.vz * sdt;
          a.vy -= 4.2 * sdt;
          a.age += sdt;
          const gy = heightAt(a.x, a.z) + 0.08;
          if (a.y < gy || solid(a.x, a.z) || hitFoe(a.x, a.z, a.kind === "knife" ? 0.55 : 0.7, 1) || a.age > 2.4) {
            puffAt(a.x, a.z, a.y, false);
            dead = true;
            break;
          }
        }
        if (dead) live.arrows.splice(i, 1);
      }
    }

    for (let i = 0; i < 10; i++) {
      const m = bombs.current[i];
      if (!m) continue;
      const b = live.bombs[i];
      if (!b || b.boom) {
        m.visible = false;
      } else {
        m.visible = true;
        m.position.set(b.x, b.y, b.z);
        m.rotation.set(b.spin * 0.7, b.spin, b.spin * 0.4);
        const fuse = m.children[1] as THREE.Mesh | undefined;
        if (fuse?.material && "emissiveIntensity" in fuse.material) {
          (fuse.material as THREE.MeshLambertMaterial).emissiveIntensity = 0.6 + Math.sin(live.playT * 22) * 0.45;
        }
        const trail = m.children[2];
        if (trail) {
          const spd = Math.hypot(b.vx, b.vy, b.vz) || 1;
          trail.position.set((-b.vx / spd) * 0.28, (-b.vy / spd) * 0.28, (-b.vz / spd) * 0.28);
          trail.scale.set(1, 1, 0.6 + Math.min(2.4, spd * 0.12));
        }
      }
    }
    for (let i = 0; i < 10; i++) {
      const m = blasts.current[i];
      if (!m) continue;
      if (blastAge.current[i]! >= 0) {
        if (!freeze) blastAge.current[i] += dt;
        const t = blastAge.current[i]!;
        if (t > 0.55) {
          blastAge.current[i] = -1;
          m.visible = false;
        } else {
          m.visible = true;
          const s = 0.7 + t * 8.5;
          m.scale.setScalar(s);
          const smoke = m.children[2] as THREE.Mesh | undefined;
          if (smoke) smoke.scale.setScalar(0.7 + t * 3.2);
          const mat = (m.children[0] as THREE.Mesh | undefined)?.material as THREE.MeshBasicMaterial | undefined;
          if (mat) mat.opacity = Math.max(0, 0.6 - t * 1.1);
        }
      } else m.visible = false;
    }
    for (let i = 0; i < 6; i++) {
      const m = booms.current[i];
      if (!m) continue;
      const b = live.booms[i];
      if (!b) m.visible = false;
      else {
        m.visible = true;
        m.position.set(b.x, b.y ?? live.y + 1, b.z);
        m.rotation.y = b.spin ?? 0;
        m.rotation.z = (b.spin ?? 0) * 0.35;
        const trail = m.children[5];
        if (trail) {
          trail.position.set(-b.vx * 0.018, 0, -b.vz * 0.018);
          trail.scale.set(1, 1, 1.2 + Math.hypot(b.vx, b.vz) * 0.04);
        }
      }
    }
    for (let i = 0; i < 10; i++) {
      const m = arrows.current[i];
      if (!m) continue;
      const a = live.arrows[i];
      if (!a) m.visible = false;
      else {
        m.visible = true;
        m.position.set(a.x, a.y, a.z);
        m.lookAt(a.x + a.vx, a.y + a.vy, a.z + a.vz);
        const trail = m.children[2];
        if (trail) trail.position.set(0, 0, -0.45);
      }
    }
  });

  return (
    <group>
      {Array.from({ length: 10 }, (_, i) => (
        <group key={`bomb-${i}`} ref={(el) => { bombs.current[i] = el; }} visible={false}>
          <HeroBomb scale={1.85} />
        </group>
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <group key={`blast-${i}`} ref={(el) => { blasts.current[i] = el; }} visible={false}>
          <mesh>
            <icosahedronGeometry args={[0.62, 0]} />
            <meshBasicMaterial color="#f0a040" transparent opacity={0.7} depthWrite={false} />
          </mesh>
          <mesh>
            <octahedronGeometry args={[0.28, 0]} />
            <meshBasicMaterial color="#fff4d8" transparent opacity={0.9} depthWrite={false} />
          </mesh>
          <mesh position={[0.2, 0.25, -0.1]}>
            <dodecahedronGeometry args={[0.22, 0]} />
            <meshBasicMaterial color="#6a6058" transparent opacity={0.35} depthWrite={false} />
          </mesh>
          <mesh position={[-0.18, 0.12, 0.16]}>
            <dodecahedronGeometry args={[0.16, 0]} />
            <meshBasicMaterial color="#c45c38" transparent opacity={0.4} depthWrite={false} />
          </mesh>
        </group>
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <group key={`boom-${i}`} ref={(el) => { booms.current[i] = el; }} visible={false}>
          <HeroBoom scale={1.15} />
        </group>
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <group key={`arrow-${i}`} ref={(el) => { arrows.current[i] = el; }} visible={false}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.011, 0.014, 0.78, 5]} />
            <meshLambertMaterial color="#8a5a32" />
          </mesh>
          <mesh position={[0, 0, 0.44]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <coneGeometry args={[0.026, 0.16, 5]} />
            <meshLambertMaterial color="#e7decc" />
          </mesh>
          <mesh position={[0, 0, -0.46]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.004, 0.004, 0.16, 3]} />
            <meshBasicMaterial color="#f4ead2" transparent opacity={0.35} depthWrite={false} />
          </mesh>
          <mesh position={[0.018, 0, -0.3]} rotation={[0.35, 0, 0.4]}>
            <boxGeometry args={[0.01, 0.08, 0.035]} />
            <meshLambertMaterial color="#f3efe4" />
          </mesh>
          <mesh position={[-0.018, 0, -0.3]} rotation={[-0.35, 0, -0.4]}>
            <boxGeometry args={[0.01, 0.08, 0.035]} />
            <meshLambertMaterial color="#d9d0c2" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function FoeShots({ paused }: { paused: boolean }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((_, dt) => {
    if (paused || live.paused) return;
    const keep: typeof live.foeShots = [];
    for (const s of live.foeShots) {
      s.age += dt;
      s.x += s.vx * dt;
      s.z += s.vz * dt;
      s.y = heightAt(s.x, s.z) + 0.82;
      if (s.age > 2.2) continue;
      const d = Math.hypot(s.x - live.x, s.z - live.z);
      if (d < 1.08 && Math.abs(live.y - s.y) < 1.7 && s.age > 0.1) {
        if (live.shieldUp && useGame.getState().hasShield) {
          sfx.block();
          live.blockFlash = 1;
          if (live.shieldAge < 0.28) live.hitStop = Math.max(live.hitStop, 0.05);
        } else if (!live.god && live.heroFlash < 0.22) {
          useGame.getState().hurtField(1);
          live.heroFlash = 0.85;
          const n = d || 1;
          live.knock = { vx: ((live.x - s.x) / n) * 6.4, vz: ((live.z - s.z) / n) * 6.4, t: 0.16 };
        }
        puffAt(s.x, s.z, s.y, false);
        continue;
      }
      keep.push(s);
    }
    live.foeShots = keep;
    for (let i = 0; i < refs.current.length; i++) {
      const m = refs.current[i];
      if (!m) continue;
      const shot = keep[i];
      if (!shot) {
        m.visible = false;
        continue;
      }
      m.visible = true;
      m.position.set(shot.x, shot.y, shot.z);
    }
  });
  return (
    <group>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          visible={false}
        >
          <sphereGeometry args={[0.13, 6, 5]} />
          <meshBasicMaterial color="#e07040" />
        </mesh>
      ))}
    </group>
  );
}

function Foes({
  worldId,
  defeated,
  hooks,
  paused,
}: {
  worldId: WorldId;
  defeated: string[];
  hooks: WorldHooks;
  paused: boolean;
}) {
  const spots = useMemo(() => {
    const base = fieldActors(worldId).enemies.filter((e) => !defeated.includes(e.id)).map((e) => {
      const snow = Math.hypot(e.x - SNOW_AT.x, e.z - SNOW_AT.z) < 100;
      if (e.kind === "plusling" && !snow) return { ...e, kind: "timesprout" };
      if (e.kind === "timesprout" && snow) return { ...e, kind: "plusling" };
      return e;
    });
    if (worldId !== "meadow") return base;
    const pack = [
      { id: "snow-w1", kind: "plusling", x: SNOW_AT.x + 7, z: SNOW_AT.z + 4 },
      { id: "snow-w2", kind: "plusling", x: SNOW_AT.x - 9, z: SNOW_AT.z + 2 },
      { id: "snow-w3", kind: "plusling", x: SNOW_AT.x + 2, z: SNOW_AT.z - 10 },
    ];
    return base.concat(pack.filter((e) => !defeated.includes(e.id)));
  }, [worldId, defeated]);
  return (
    <group>
      {spots.map((e, i) => (
        <FoeBody key={e.id} spot={e} worldId={worldId} hooks={hooks} paused={paused} seed={i} />
      ))}
    </group>
  );
}

function FoeBody({
  spot,
  worldId,
  paused,
  seed,
}: {
  spot: { id: string; kind: string; x: number; z: number };
  worldId: WorldId;
  hooks: WorldHooks;
  paused: boolean;
  seed: number;
}) {
  const [show, setShow] = useState(() => Math.hypot(live.x - spot.x, live.z - spot.z) < (live.quality === "high" ? 80 : 36));
  const [dead, setDead] = useState(false);
  const pos = useRef({ x: spot.x, z: spot.z });
  const root = useRef<THREE.Group>(null);
  const yaw = useRef(0);
  const poseRef = useRef<FangPose>("walk");
  const swipeAt = useRef(-9);
  const wind = useRef(0);
  const hopY = useRef(0);
  const orbitA = useRef(seed * 1.7);
  const lungeT = useRef(0.4 + seed * 0.05);
  const hideU = useRef(spot.kind === "glyphite" ? 1 : 0);
  const spitT = useRef(0.8 + seed * 0.2);
  const callT = useRef(1.6 + seed * 0.15);
  const dying = useRef(0);
  useFrame((_, dt) => {
    if (dead) return;
    const lim = live.quality === "high" ? 80 : 36;
    const near = Math.hypot(live.x - pos.current.x, live.z - pos.current.z) < lim;
    if (near !== show) setShow(near);
    if (!root.current) return;
    if ((useGame.getState().defeated[worldId] ?? []).includes(spot.id) && dying.current <= 0) {
      dying.current = 0.001;
    }
    hopY.current = Math.max(0, hopY.current - dt * 2.6);
    if (dying.current > 0) {
      dying.current += dt;
      hopY.current = Math.max(hopY.current, 0.12 + dying.current * 0.15);
      poseRef.current = "hiss";
      const fall = Math.max(0.55, 1 - dying.current * 0.55);
      root.current.position.set(pos.current.x, heightAt(pos.current.x, pos.current.z) + hopY.current * 0.25, pos.current.z);
      root.current.rotation.y = yaw.current;
      root.current.rotation.z = Math.min(1.35, dying.current * 4.4);
      root.current.scale.set(fall, fall * 0.92, fall);
      if (dying.current > 0.04 && dying.current < 0.1) puffAt(pos.current.x, pos.current.z, undefined, true);
      if (dying.current > 0.48) {
        if (spot.kind === "warden" || spot.kind === "remainder" || spot.kind === "leftover") {
          live.bossTitle = null;
          live.bossHp = 0;
        }
        setDead(true);
      }
      return;
    }
    if (!paused && !live.paused && !live.house && !live.doorMath && live.hitStop <= 0.01) {
      const dx = live.x - pos.current.x;
      const dz = live.z - pos.current.z;
      const d = Math.hypot(dx, dz);
      const town = inVillage(pos.current.x, pos.current.z) || inVillage(live.x, live.z);
      const boss = spot.kind === "warden" || spot.kind === "remainder" || spot.kind === "leftover";
      let aggroR = town
        ? 0
        : boss
          ? 16.4
          : spot.kind === "glyphite"
            ? 8.4
            : spot.kind === "emberling"
              ? 14.2
              : spot.kind === "timesprout"
                ? 12.4
                : 10.6;
      if (live.crouch && !boss && !town && aggroR > 0) {
        const fx = -Math.sin(yaw.current);
        const fz = -Math.cos(yaw.current);
        const facing = d > 0.08 ? (fx * dx + fz * dz) / d : 1;
        const seesYou = facing > 0.42 && d < 3.4;
        const hearsYou = d < 1.5;
        if (!seesYou && !hearsYou) aggroR = 0;
      }
      if (d < aggroR) live.aggroIds.add(spot.id);
      else live.aggroIds.delete(spot.id);
      if (spot.kind === "sandwight" && d < aggroR && d > 3) {
        callT.current -= dt;
        if (callT.current <= 0) {
          callT.current = 4.4;
          for (const [id, p] of Object.entries(live.foeTrack)) {
            if (!p || id === spot.id) continue;
            if (Math.hypot(p.x - pos.current.x, p.z - pos.current.z) < 14) live.aggroIds.add(id);
          }
          poseRef.current = "hiss";
        }
      }
      const hpNow = live.foeHp[spot.id] ?? fieldHits(spot.kind);
      const phase2 = boss && hpNow <= Math.ceil(fieldHits(spot.kind) / 2);
      if (phase2 && !live.smashed[`phase-${spot.id}`]) {
        live.smashed[`phase-${spot.id}`] = true;
        live.bossTitle = "Second wind";
        live.bossTitleT = 2.4;
        sfx.thud();
      }
      if (boss && d < aggroR) {
        live.bossSeen = live.playT;
        if (!phase2) live.bossTitle = spot.kind === "leftover" ? "The Iron Champion" : live.bossTitle || "The Hollow Warden";
        live.bossTitleT = Math.max(live.bossTitleT, 0.4);
        live.bossMax = fieldHits(spot.kind);
        live.bossHp = live.foeHp[spot.id] ?? live.bossMax;
      }
      const hitAgo = live.playT - (live.foeHitT[spot.id] ?? -9);
      const stunned = hitAgo < 0.42;
      if (town) {
        poseRef.current = "idle";
        yaw.current += dt * 0.4;
      } else if (!stunned && d < aggroR && d > 1.18) {
        yaw.current = Math.atan2(-dx, -dz);
        const sp =
          spot.kind === "emberling" ? 3.55 : spot.kind === "glyphite" ? 1.18 : spot.kind === "timesprout" ? 1.82 : boss ? 2.55 : 2.22;
        const circle = spot.kind === "timesprout";
        const lunge = spot.kind === "emberling";
        const charge = spot.kind === "plusling" || spot.kind === "nag";
        const hop = spot.kind === "driplet";
        const hide = spot.kind === "glyphite";
        const spitKind = spot.kind === "emberling" || hop || (boss && (live.foeHp[spot.id] ?? 6) <= 4);
        if (hide) {
          const want = d < 5.4 || hitAgo < 2.2 ? 0 : 1;
          hideU.current += (want - hideU.current) * (1 - Math.exp(-dt * 4.2));
        } else hideU.current += (0 - hideU.current) * (1 - Math.exp(-dt * 6));
        if (spitKind) {
          spitT.current -= dt;
          if (spitT.current <= 0 && d > 2.2 && d < 11 && live.foeShots.length < 6) {
            spitT.current = hop ? 1.85 : boss ? 1.15 : 2.4;
            const n = d || 1;
            live.foeShots.push({
              x: pos.current.x,
              y: heightAt(pos.current.x, pos.current.z) + 0.9,
              z: pos.current.z,
              vx: (dx / n) * 9.4,
              vz: (dz / n) * 9.4,
              age: 0,
            });
            poseRef.current = "hiss";
          }
        }
        if (boss) {
          lungeT.current -= dt;
          if (lungeT.current > 0.55) {
            orbitA.current += dt * 0.85;
            const hold = 4.4;
            const tx = live.x + Math.cos(orbitA.current) * hold;
            const tz = live.z + Math.sin(orbitA.current) * hold;
            const ox = tx - pos.current.x;
            const oz = tz - pos.current.z;
            const od = Math.hypot(ox, oz) || 1;
            pos.current.x += (ox / od) * sp * dt;
            pos.current.z += (oz / od) * sp * dt;
            poseRef.current = "chase";
          } else if (lungeT.current > 0.18) {
            poseRef.current = "hiss";
            hopY.current = Math.max(hopY.current, 0.85);
          } else if (lungeT.current > -0.12) {
            pos.current.x += (dx / (d || 1)) * sp * 3.1 * dt;
            pos.current.z += (dz / (d || 1)) * sp * 3.1 * dt;
            hopY.current = 0.08;
            poseRef.current = "swipe";
            if (d < 3.8 && touchingHero() && live.playT - swipeAt.current > 0.4) {
              swipeAt.current = live.playT;
              puffAt(pos.current.x, pos.current.z, undefined, true);
              live.spark = Math.max(live.spark, 0.9);
              live.stompT = 0.32;
              if (live.shieldUp && useGame.getState().hasShield) {
                const perfect = live.shieldAge < 0.28;
                sfx.block();
                live.blockFlash = 1;
                if (perfect) {
                  live.hitStop = Math.max(live.hitStop, 0.09);
                  lungeT.current = Math.min(lungeT.current, 0.15);
                }
              } else if (!live.god && live.heroFlash < 0.22) {
                useGame.getState().hurtField(4);
                if (d > 0.001) live.knock = { vx: (dx / d) * 11, vz: (dz / d) * 11, t: 0.28 };
              }
            }
          } else {
            lungeT.current = phase2 ? 1.05 : 2.6 + (seed % 3) * 0.2;
            poseRef.current = "hiss";
          }
        } else if (lunge && d < 5.4) {
          lungeT.current -= dt;
          if (lungeT.current > 0.34) {
            poseRef.current = "hiss";
            hopY.current *= Math.max(0, 1 - dt * 6);
          } else if (lungeT.current > -0.16) {
            pos.current.x += (dx / d) * sp * 2.2 * dt;
            pos.current.z += (dz / d) * sp * 2.2 * dt;
            hopY.current = 0.62;
            poseRef.current = "swipe";
          } else {
            lungeT.current = 1.15 + (seed % 3) * 0.12;
            poseRef.current = "hiss";
          }
        } else if (circle) {
          orbitA.current += dt * 1.12;
          if (d > 2.7) {
            pos.current.x += (dx / d) * sp * dt;
            pos.current.z += (dz / d) * sp * dt;
          } else {
            const hold = 2.4;
            const tx = live.x + Math.cos(orbitA.current) * hold;
            const tz = live.z + Math.sin(orbitA.current) * hold;
            const ox = tx - pos.current.x;
            const oz = tz - pos.current.z;
            const od = Math.hypot(ox, oz) || 1;
            pos.current.x += (ox / od) * sp * dt;
            pos.current.z += (oz / od) * sp * dt;
          }
          poseRef.current = d < 2.4 ? "guard" : "walk";
        } else if (hop) {
          lungeT.current -= dt;
          hopY.current = Math.max(hopY.current, Math.abs(Math.sin(live.playT * 7.2)) * 0.45);
          if (lungeT.current > 0) {
            poseRef.current = "hiss";
          } else {
            pos.current.x += (dx / d) * sp * 1.65 * dt;
            pos.current.z += (dz / d) * sp * 1.65 * dt;
            poseRef.current = "chase";
            if (lungeT.current < -0.55) lungeT.current = 0.72;
          }
        } else if (charge) {
          lungeT.current -= dt;
          if (lungeT.current > 0.38) {
            poseRef.current = "hiss";
            if (d > 2.2) {
              pos.current.x -= (dx / d) * sp * 0.35 * dt;
              pos.current.z -= (dz / d) * sp * 0.35 * dt;
            }
          } else if (lungeT.current > -0.32) {
            pos.current.x += (dx / d) * sp * 3.4 * dt;
            pos.current.z += (dz / d) * sp * 3.4 * dt;
            hopY.current = 0.02;
            poseRef.current = "gallop";
          } else {
            lungeT.current = 1.35 + (seed % 3) * 0.12;
            poseRef.current = "idle";
          }
        } else if (hide) {
          if (hideU.current < 0.35) {
            pos.current.x += (dx / d) * sp * dt;
            pos.current.z += (dz / d) * sp * dt;
            poseRef.current = "guard";
          } else {
            poseRef.current = "sit";
          }
        } else if (spot.kind === "umbral" && (live.foeHp[spot.id] ?? 4) <= 2) {
          pos.current.x -= (dx / d) * sp * 1.85 * dt;
          pos.current.z -= (dz / d) * sp * 1.85 * dt;
          yaw.current = Math.atan2(dx, dz);
          poseRef.current = "gallop";
        } else {
          pos.current.x += (dx / d) * sp * dt;
          pos.current.z += (dz / d) * sp * dt;
          poseRef.current = d < 4 ? "chase" : "walk";
        }
        const wall = collideFoe(pos.current.x, pos.current.z, worldId);
        pos.current.x = wall.x;
        pos.current.z = wall.z;
      } else if (d > aggroR) {
        poseRef.current = "idle";
        if (spot.kind === "glyphite") hideU.current += (1 - hideU.current) * (1 - Math.exp(-dt * 3.2));
      }
      if (live.slash && Math.hypot(live.slash.x - pos.current.x, live.slash.z - pos.current.z) < (live.slash.r ?? 1.2)) {
        const dmg = live.spinning || live.jumpAtk ? 2 : 1;
        const r = strikeFoe(worldId, spot.id, spot.kind, dmg, pos.current.x, pos.current.z);
        if (r === "kill") {
          dying.current = 0.001;
          live.aggroIds.delete(spot.id);
          puffAt(pos.current.x, pos.current.z, undefined, true);
          return;
        }
        if (r === "hit") {
          const nx = d > 0.001 ? dx / d : 0;
          const nz = d > 0.001 ? dz / d : 0;
          pos.current.x -= nx * 7.2;
          pos.current.z -= nz * 7.2;
          hopY.current = 0.52;
          wind.current = 0;
          const wall = collideFoe(pos.current.x, pos.current.z, worldId);
          pos.current.x = wall.x;
          pos.current.z = wall.z;
        }
      }
      if (live.shieldUp && useGame.getState().hasShield && d < 1.62 && live.playT - swipeAt.current > 0.48) {
        const perfect = live.shieldAge < 0.28;
        const nx = d > 0.001 ? dx / d : 0;
        const nz = d > 0.001 ? dz / d : 0;
        pos.current.x -= nx * (perfect ? 3.4 : 2.2);
        pos.current.z -= nz * (perfect ? 3.4 : 2.2);
        hopY.current = perfect ? 0.72 : 0.55;
        wind.current = 0;
        swipeAt.current = live.playT + (perfect ? 0.45 : 0);
        live.blockFlash = 1;
        sfx.block();
        if (perfect) {
          live.hitStop = Math.max(live.hitStop, 0.07);
          if (!live.smashed.parry) {
            live.smashed.parry = true;
            live.hint = "Caught it. They're open.";
          }
        }
        sparkAt(pos.current.x, heightAt(pos.current.x, pos.current.z) + 0.7, pos.current.z, perfect ? 8 : 5);
        const wall = collideFoe(pos.current.x, pos.current.z, worldId);
        pos.current.x = wall.x;
        pos.current.z = wall.z;
      } else if (d < 1.42 && !live.rolling && hideU.current < 0.4 && !live.god && live.heroFlash < 0.22 && hitAgo > 0.2 && live.playT - swipeAt.current > 1.08 && wind.current <= 0) {
        wind.current = 0.26;
      }
      if (wind.current > 0) {
        wind.current -= dt;
        poseRef.current = "hiss";
        yaw.current = Math.atan2(-dx, -dz);
        if (wind.current <= 0) {
          swipeAt.current = live.playT;
          poseRef.current = "swipe";
          if (live.shieldUp && useGame.getState().hasShield) {
            const perfect = live.shieldAge < 0.28;
            sfx.block();
            live.blockFlash = 1;
            pos.current.x -= (dx / (d || 1)) * (perfect ? 1.6 : 0.7);
            pos.current.z -= (dz / (d || 1)) * (perfect ? 1.6 : 0.7);
            if (perfect) {
              live.hitStop = Math.max(live.hitStop, 0.08);
              swipeAt.current = live.playT + 0.4;
            }
          } else if (touchingHero()) {
            useGame.getState().hurtField(2);
            sfx.claw();
            sfx.ouch();
            if (d > 0.001) live.knock = { vx: (dx / d) * 8.2, vz: (dz / d) * 8.2, t: 0.2 };
          }
        }
      }
      if (live.playT - swipeAt.current < 0.35) poseRef.current = "swipe";
      else if (hitAgo < 0.62) poseRef.current = "hiss";
    }
    live.foeTrack[spot.id] = { x: pos.current.x, z: pos.current.z };
    const bury = hideU.current;
    root.current.position.set(pos.current.x, heightAt(pos.current.x, pos.current.z) + hopY.current - bury * 0.42, pos.current.z);
    root.current.rotation.y = yaw.current;
    root.current.rotation.z = 0;
    const flashed = live.playT - (live.foeHitT[spot.id] ?? -9) < 0.22;
    root.current.rotation.x = flashed ? -0.22 : 0;
    const bossS = spot.kind === "warden" || spot.kind === "remainder" ? 1.55 : 1;
    const s = bossS;
    root.current.scale.set(s, s * (1 - bury * 0.7), s);
  });
  if (!show || dead) return null;
  const hurt = live.playT - (live.foeHitT[spot.id] ?? -9) < 0.38;
  return (
    <group ref={root}>
      <N64Foe kind={spot.kind} seed={seed} world={worldId} pose="walk" poseRef={poseRef} act={hurt ? "hurt" : undefined} />
      {hurt ? (
        <mesh position={[0, 0.85, 0.2]}>
          <octahedronGeometry args={[0.18, 0]} />
          <meshBasicMaterial color="#ffe8a0" transparent opacity={0.85} depthWrite={false} />
        </mesh>
      ) : null}
    </group>
  );
}

function Crystals({ worldId, collected, hooks }: { worldId: WorldId; collected: string[]; hooks: WorldHooks }) {
  const spots = useMemo(
    () => fieldActors(worldId).crystals.filter((c) => !collected.includes(c.id)),
    [worldId, collected],
  );
  const cheap = live.quality !== "high";
  useFrame(() => {
    if (live.house || live.paused) return;
    for (const c of spots) {
      if (Math.hypot(live.x - c.x, live.z - c.z) < 1.05) hooks.onCollect(c.id);
    }
  });
  return (
    <group>
      {spots.map((c, i) => {
        if (cheap && Math.hypot(live.x - c.x, live.z - c.z) > 70) return null;
        return (
          <group key={c.id} position={[c.x, heightAt(c.x, c.z) + 0.95, c.z]}>
            <LushGem color={GEM_TINTS[i % 3]} seed={i * 1.7} />
          </group>
        );
      })}
    </group>
  );
}

function PuzzleBits({ worldId, puzzle }: { worldId: WorldId; puzzle: MutableRefObject<PuzzleRuntime> }) {
  const spec = PUZZLES[worldId];
  const [open, setOpen] = useState(false);
  const [keyed, setKeyed] = useState(false);
  const blockRefs = useRef<(THREE.Mesh | null)[]>([]);
  const plateMats = useRef<(THREE.MeshLambertMaterial | null)[]>([]);
  useFrame(() => {
    const rt = puzzle.current;
    const on = platesSatisfied(rt, spec);
    rt.platesOn = on;
    for (let i = 0; i < rt.blocks.length; i++) {
      const b = rt.blocks[i]!;
      const m = blockRefs.current[i];
      if (m) m.position.set(b.x, heightAt(b.x, b.z) + 0.45, b.z);
    }
    for (const mat of plateMats.current) {
      if (!mat) continue;
      mat.color.set(on ? "#c9a227" : "#8a7a48");
      mat.emissive.set(on ? "#c9a227" : "#000");
      mat.emissiveIntensity = on ? 0.4 : 0;
    }
    const anyOpen = spec.doors.some((d) => doorOpen(rt, d));
    if (anyOpen !== open) setOpen(anyOpen);
    if (rt.hasKey !== keyed) setKeyed(rt.hasKey);
  });
  const rt = puzzle.current;
  return (
    <group>
      {spec.plates.map((p, i) => (
        <mesh key={p.id} position={[p.x, heightAt(p.x, p.z) + 0.04, p.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[0.85, 16]} />
          <meshLambertMaterial
            ref={(el) => {
              plateMats.current[i] = el;
            }}
            color="#8a7a48"
          />
        </mesh>
      ))}
      {rt.blocks.map((b, i) => (
        <mesh
          key={b.id}
          ref={(el) => {
            blockRefs.current[i] = el;
          }}
          position={[b.x, heightAt(b.x, b.z) + 0.45, b.z]}
          castShadow
        >
          <boxGeometry args={[0.9, 0.9, 0.9]} />
          <meshLambertMaterial color="#8a7460" />
        </mesh>
      ))}
      {spec.switches.map((s) => (
        <mesh key={s.id} position={[s.x, heightAt(s.x, s.z) + 0.22, s.z]} castShadow>
          <cylinderGeometry args={[0.28, 0.34, 0.4, 8]} />
          <meshLambertMaterial color={rt.switchOn ? "#3d8a40" : "#a05038"} />
        </mesh>
      ))}
      {spec.doors.map((d) =>
        doorOpen(rt, d) ? null : (
          <mesh key={d.id} position={[d.x, heightAt(d.x, d.z) + 1.4, d.z]} castShadow>
            <boxGeometry args={[d.w, 2.8, 0.35]} />
            <meshLambertMaterial color="#5a4a38" />
          </mesh>
        ),
      )}
      {spec.keys.map((k) =>
        keyVisible(rt, k) ? (
          <mesh key={k.id} position={[k.x, heightAt(k.x, k.z) + 0.45, k.z]} castShadow>
            <torusGeometry args={[0.16, 0.05, 6, 10]} />
            <meshLambertMaterial color="#c9a227" emissive="#c9a227" emissiveIntensity={0.4} />
          </mesh>
        ) : null,
      )}
      {spec.chests.map((ch) => (
        <TreasureChest
          key={ch.id}
          id={ch.id}
          x={ch.x}
          z={ch.z}
          open={rt.opened.has(ch.id) || chestAlreadyLooted(worldId, ch)}
          size={chestTier(ch)}
        />
      ))}
    </group>
  );
}

function FieldNpcs({ worldId }: { worldId: WorldId }) {
  const [inside, setInside] = useState(false);
  const [at, setAt] = useState({ x: live.x, z: live.z });
  useFrame(() => {
    const v = Boolean(live.house);
    if (v !== inside) setInside(v);
    if (live.quality !== "high" && Math.hypot(live.x - at.x, live.z - at.z) > 10) setAt({ x: live.x, z: live.z });
  });
  const list = npcsIn(worldId);
  if (worldId === "meadow" && !inside && !list.some((n) => n.id === "ash")) {
    const ash = npcById("ash");
    if (ash) list.push(ash);
  }
  const plat = heightAt(TREE_HOME.x, TREE_HOME.z) + TREE_HOUSE_H;
  const cheap = live.quality !== "high";
  const shown = (() => {
    if (!cheap) return list;
    const houseId = live.house;
    const family = list.filter((n) => n.indoor && n.indoor === houseId);
    const rest = list
      .filter((n) => !family.includes(n))
      .filter((n) => Math.hypot((n.x ?? 0) - at.x, (n.z ?? 0) - at.z) < 52)
      .sort(
        (a, b) =>
          Math.hypot((a.x ?? 0) - at.x, (a.z ?? 0) - at.z) - Math.hypot((b.x ?? 0) - at.x, (b.z ?? 0) - at.z),
      )
      .slice(0, 6);
    return [...family, ...rest];
  })();
  return (
    <group>
      {shown.map((n) => {
        if (n.kind === "sign") return <N64Sign key={n.id} x={n.x} z={n.z} />;
        if (n.kind === "note") return <N64Note key={n.id} x={n.x} z={n.z} />;
        if (n.kind === "stone") return <N64Gossip key={n.id} x={n.x} z={n.z} />;
        if (n.kind === "well") return <N64Well key={n.id} x={n.x} z={n.z} />;
        return (
          <N64Person
            key={n.id}
            id={n.id}
            look={n.look ?? FALLBACK_LOOK}
            x={n.x}
            z={n.z}
            facing={n.facing}
            chore={n.chore}
            kid={n.kid}
            stay={Boolean(n.indoor) || n.stay || n.id === "mira"}
            floorY={n.indoor === "yours" ? plat : undefined}
          />
        );
      })}
    </group>
  );
}

function Drops() {
  const [, bump] = useState(0);
  const n = useRef(0);
  useFrame(() => {
    if (live.paused || live.house) return;
    let changed = false;
    for (let i = live.drops.length - 1; i >= 0; i--) {
      const d = live.drops[i]!;
      if (Math.hypot(live.x - d.x, live.z - d.z) < 1.1) {
        const g = useGame.getState();
        if (d.kind === "heart") g.healGrass();
        else if (d.kind === "coin") g.addCoins(d.n || 1);
        else if (d.kind === "arrow") g.addArrows(d.n || 3);
        else if (d.kind === "bomb") g.addBombs(d.n || 1);
        live.drops.splice(i, 1);
        sfx.pick();
        changed = true;
      }
    }
    if (changed || live.drops.length !== n.current) {
      n.current = live.drops.length;
      bump((k) => k + 1);
    }
  });
  return (
    <group>
      {live.drops.map((d) => (
        <group key={d.id} position={[d.x, heightAt(d.x, d.z) + 0.35, d.z]}>
          {d.kind === "heart" ? <HeartContainerMesh scale={0.45} /> : <RupeeMesh tint={rupeeTintFor(d.n || 1)} scale={0.7} />}
        </group>
      ))}
    </group>
  );
}

function ColDebug() {
  const [on, setOn] = useState(false);
  useFrame(() => {
    if (live.showCol !== on) setOn(live.showCol);
  });
  if (!on) return null;
  return (
    <group>
      {HOUSES.filter((h) => h.kind !== "keep").map((h) => {
        const { w, d } = houseSize(h);
        return (
          <mesh key={h.id} position={[h.x, heightAt(h.x, h.z) + 1.2, h.z]}>
            <boxGeometry args={[w, 2.4, d]} />
            <meshBasicMaterial color="#ff4d6a" wireframe transparent opacity={0.5} />
          </mesh>
        );
      })}
    </group>
  );
}

function SleepVeil() {
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  useFrame(() => {
    if (!mat.current || !mesh.current) return;
    const a = live.sleepFade;
    mat.current.opacity = a;
    mesh.current.visible = a > 0.01;
    mesh.current.position.copy(camera.position);
    mesh.current.quaternion.copy(camera.quaternion);
    mesh.current.translateZ(-0.4);
  });
  return (
    <mesh ref={mesh} visible={false} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <meshBasicMaterial ref={mat} color="#0a0810" transparent opacity={0} depthTest={false} />
    </mesh>
  );
}

function SlashArc() {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const on = live.swinging && live.holding === "sword" && live.swingU > 0.1 && live.swingU < 0.8;
    m.visible = on;
    if (!on) return;
    const u = (live.swingU - 0.1) / 0.7;
    const yaw = live.yaw;
    const reach = 1.25;
    m.position.set(
      live.x - Math.sin(yaw) * reach,
      live.y + 1.05,
      live.z - Math.cos(yaw) * reach,
    );
    m.rotation.set(-0.15, yaw + (u - 0.45) * 2.4, 0.15);
    const mat = m.material as THREE.MeshBasicMaterial;
    mat.opacity = Math.sin(Math.min(1, u) * Math.PI) * 0.72;
  });
  return (
    <mesh ref={mesh} visible={false}>
      <torusGeometry args={[0.78, 0.04, 5, 12, Math.PI * 0.9]} />
      <meshBasicMaterial color="#f6f1dc" transparent opacity={0.55} depthWrite={false} />
    </mesh>
  );
}

function ThrownAxes() {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    const root = g.current;
    if (!root) return;
    while (root.children.length < live.axes.length) {
      const axe = new THREE.Group();
      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.028, 0.56, 6),
        new THREE.MeshLambertMaterial({ color: "#8a5a32" }),
      );
      const head = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.15, 0.26, 4),
        new THREE.MeshLambertMaterial({ color: "#c8ced6" }),
      );
      head.rotation.z = Math.PI / 2;
      head.position.y = 0.3;
      const edge = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.22, 0.012),
        new THREE.MeshLambertMaterial({ color: "#f2f4f6" }),
      );
      edge.position.set(0.14, 0.3, 0);
      axe.add(handle, head, edge);
      root.add(axe);
    }
    for (let i = 0; i < root.children.length; i++) {
      const c = root.children[i]!;
      const a = live.axes[i];
      c.visible = Boolean(a);
      if (!a) continue;
      c.position.set(a.x, a.y, a.z);
      const inBody = a.y > heightAt(a.x, a.z) + 0.5;
      c.rotation.set(a.stuck ? (inBody ? 1.25 : Math.PI * 0.92) : a.age * 16, a.yaw, a.stuck ? 0.2 : 0);
    }
  });
  return <group ref={g} />;
}

function WorldScene({
  worldId,
  defeated,
  collected,
  spawn,
  hooks,
  paused,
}: {
  worldId: WorldId;
  defeated: string[];
  collected: string[];
  spawn: { x: number; y: number } | null;
  hooks: WorldHooks;
  paused: boolean;
}) {
  const puzzle = useRef<PuzzleRuntime>(makeRuntime(worldId));
  const [inside, setInside] = useState(false);
  const [houseId, setHouseId] = useState<string | null>(null);
  const tint = WORLD_TINT[worldId];
  useEffect(() => {
    puzzle.current = makeRuntime(worldId);
    live.dungFlags = { plates: false, key: false, pads: false, eyes: false, far: false, mix: false };
  }, [worldId]);
  useFrame(() => {
    const v = Boolean(live.house) && live.house !== "yours" && !live.doorUse;
    if (v !== inside) setInside(v);
    if (live.house !== houseId) setHouseId(live.house);
  });
  const snow = worldId === "grave";
  const cheap = live.quality !== "high";
  return (
    <>
      <DayNight worldId={worldId} />
      <SunGlints />
      <Player worldId={worldId} spawn={spawn} hooks={hooks} paused={paused} puzzle={puzzle} />
      <LockReticle />
      <FlyingArrows worldId={worldId} paused={paused} puzzle={puzzle} hooks={hooks} />
      {inside ? (
        houseId ? <HouseInterior id={houseId} /> : null
      ) : (
        <>
          {!isDungeon(worldId) ? (
            <>
              {worldId === "meadow" ? null : <GrassTerrain grass={tint.grass} snow={snow} segs={28} />}
              {cheap && worldId === "meadow" ? null : (
                <N64Grove denser={false} leaf={tint.leaf} skipValley={worldId === "meadow"} />
              )}
              <BombRocks />
              <Houses worldId={worldId} />
              <Near x={VX} z={VZ} r={70}>
                <Campfires />
              </Near>
              {worldId === "meadow" ? (
                <>
                  <Near x={VX} z={VZ} r={92}>
                    <Village worldId={worldId} />
                    <VillageScenery />
                  </Near>
                  <Near x={VX} z={VZ} r={78}>
                    <TownLife />
                  </Near>
                  <Near x={POND.x} z={POND.z} r={36}>
                    <PondLife />
                  </Near>
                  <MeadowArt />
                  <Oldroot />
                  <QuietReturn />
                  <ValeFeel />
                  <YearsMark />
                  <SleighPass />
                  <Moments />
                  <Near x={-72} z={-90} r={130}>
                    <Terraces />
                    <SecretCave />
                  </Near>
                  <BladeAltars />
                  <ReturnGates />
                  <Nooks />
                  <Curious />
                  <ClimbWalls />
                  <Palisade />
                  <Finds />
                  <WowPlay />
                  <AlivePlay />
                  <FangBuddy />
                  <HeartPlay />
                  <WonderPack />
                  <CountStones />
                  <NightLife />
                  <FallingApples />
                  <Near x={CAVE_MOUTH.x} z={CAVE_MOUTH.z} r={42}>
                    <CaveMouth />
                  </Near>
                  <Near x={PADDOCK.x} z={PADDOCK.z} r={36}>
                    <AppleOrchard />
                    <N64Horse x={PADDOCK.x} z={PADDOCK.z} />
                  </Near>
                  <HiddenLands />
                </>
              ) : null}
            </>
          ) : null}
          {cheap ? null : <BiomeDress worldId={worldId} />}
          {isDungeon(worldId) || worldId === "keep" ? <DungeonShell worldId={worldId} /> : null}
          {isDungeon(worldId) ? <DungeonGem worldId={worldId} /> : null}
          <DungeonTraps worldId={worldId} />
          <Foes worldId={worldId} defeated={defeated} hooks={hooks} paused={paused} />
          <FoeShots paused={paused} />
          <ThrownAxes />
          <SlashArc />
          <Crystals worldId={worldId} collected={collected} hooks={hooks} />
          <PuzzleLayer worldId={worldId} puzzle={puzzle} />
          <FieldNpcs worldId={worldId} />
          {cheap && !isDungeon(worldId) ? null : <HiddenSecrets worldId={worldId} />}
          {cheap || isDungeon(worldId) ? null : <MysteryLayer worldId={worldId} />}
          <WorldPolish worldId={worldId} />
          <SongAura />
          <Drops />
          <ColDebug />
        </>
      )}
      {inside && houseId ? <FieldNpcs worldId={worldId} /> : null}
      <SleepVeil />
      <LushRender />
    </>
  );
}

export function WorldCanvas({
  worldId,
  defeated,
  collected,
  spawn,
  hooks,
  paused = false,
}: {
  worldId: WorldId;
  defeated: string[];
  collected: string[];
  spawn: { x: number; y: number } | null;
  hooks: WorldHooks;
  paused?: boolean;
}) {
  useEffect(() => bindGameKeys(), []);
  return (
    <Canvas
      className={`h-full w-full ${paused ? "pointer-events-none" : ""}`}
      shadows={false}
      camera={{ fov: 50, near: 0.2, far: 2600, position: [14, 8, -48] }}
      dpr={1}
      gl={{
        antialias: false,
        alpha: false,
        preserveDrawingBuffer: false,
        powerPreference: "default",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.08,
      }}
      onCreated={(state) => {
        const { gl } = state;
        if (import.meta.env.DEV) (window as unknown as { __three?: unknown }).__three = state;
        const hi = gfxLevel(gl) === "high";
        live.quality = hi ? "high" : "low";
        gl.shadowMap.enabled = hi;
        gl.shadowMap.type = hi ? THREE.PCFSoftShadowMap : THREE.BasicShadowMap;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        if (!hi) gl.toneMapping = THREE.NoToneMapping;
        state.setDpr(hi ? 1 : 0.5);
        if (import.meta.env.DEV) (window as unknown as { __gfx?: string }).__gfx = live.quality;
      }}
    >
      <WorldScene
        worldId={worldId}
        defeated={defeated}
        collected={collected}
        spawn={spawn}
        hooks={hooks}
        paused={paused}
      />
    </Canvas>
  );
}
