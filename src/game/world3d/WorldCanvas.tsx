import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Encounter, WorldId } from "../types";
import { ENEMIES } from "../content";
import { useGame } from "../store";
import { revealItem } from "../items";
import { sfx } from "../audio";
import { npcsIn, npcById } from "../dialogue";
import {
  bindGameKeys,
  consumeBomb,
  consumeJump,
  consumeSwing,
  consumeTalk,
  consumeThrow,
  consumeCamAlign,
  consumeTarget,
  injectedKeys,
  isSprintHeld,
  isSlideHeld,
  isBombHeld,
  isSwingHeld,
  isTalkHeld,
  lookAxes,
  moveAxes,
  queueJump,
} from "../input";
import { live, MORNING_8, gameClock, duskAmt } from "./live";
import { HeroBoom, HeroBomb } from "./heroes";
import { getStoryEnv } from "./mats";
import {
  heightAt,
  pondU,
  spawnOnField,
  fieldActors,
  isDungeon,
  WORLD_TINT,
  TREES,
  ROCKS,
  rockGone,
  rockRadius,
  climbOnRocks,
  TREE_HOME,
  TREE_HOUSE_H,
  TREE_HW,
  TREE_HD,
} from "./field";
import { GrassTerrain } from "./painted";
import { N64Grove, N64Rocks, N64Foe, type FangPose } from "./n64";
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
  collideInterior,
  collideFurniture,
  collidePeople,
  Houses,
  HouseInterior,
  Campfires,
  CAVE_MOUTH,
  bunkSpots,
  innStairLift,
  homeMailSpot,
  roofAt,
} from "./house";
import {
  Village,
  collideVillage,
  collideGates,
  TEMPLE_GATES,
  worldGateOpen,
  PADDOCK,
  inVillage,
} from "./village";
import { BiomeDress } from "./biome";
import { MeadowArt, collideKeep } from "./meadowArt";
import { VillageScenery } from "./villageArt";
import { TownLife } from "./townLife";
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
import { DungeonTraps } from "./dungeonTraps";
import { MysteryLayer } from "./mysteryLayer";
import { WorldPolish, puffAt, crackAt } from "./fx";
import { nearLadder, startClimb, hopOffLadder, fieldLadders, snapToLadder } from "./climb";
import { beginZip, stepZip } from "./zipPlay";

export type WorldHooks = {
  onEncounter: (encounter: Encounter, at: { x: number; y: number }) => void;
  onCollect: (id: string) => void;
  onGate: () => void;
};

function fieldHits(kind: string) {
  const def = ENEMIES[kind];
  if (!def) return 3;
  if (def.boss) return 6;
  return Math.max(2, Math.min(6, Math.round(def.maxHp / 70)));
}

function strikeFoe(worldId: WorldId, id: string, kind: string, dmg: number, x: number, z: number): "hit" | "kill" | false {
  const g = useGame.getState();
  if ((g.defeated[worldId] ?? []).includes(id)) return false;
  if (live.playT - (live.foeHitT[id] ?? -9) < 0.42) return false;
  const max = fieldHits(kind);
  const hp = (live.foeHp[id] ?? max) - Math.max(1, dmg);
  live.foeHitT[id] = live.playT;
  live.foeHp[id] = hp;
  puffAt(x, z, undefined, dmg > 1);
  sfx.hit();
  live.spark = Math.max(live.spark, 0.55);
  if (hp > 0) return "hit";
  const def = ENEMIES[kind];
  g.markDefeated(worldId, id);
  if (def) {
    g.addCoins(def.coins);
    useGame.setState({ xp: useGame.getState().xp + def.xp });
  }
  live.hint = `${def?.name ?? "Lizard"} falls.`;
  live.aggroIds.delete(id);
  delete live.foeHp[id];
  delete live.foeHitT[id];
  delete live.foeTrack[id];
  if (live.lock?.id === id) live.lock = null;
  sfx.ok();
  return "kill";
}

const WALK = 5.4;
const RUN = 9.6;
const GRAV = 28;
const JUMP = 8.6;
const HORSE_WALK = 11.2;
const HORSE_RUN = 16.4;
const BOMB_WIND = 0.34;

const FALLBACK_LOOK = {
  tunic: "#4a6a48",
  sash: "#c9a227",
  hair: "#4a3220",
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
  live.spark = 1;
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
    revealItem("sword");
  } else if (item === "axe") {
    g.grantAxe();
    revealItem("axe");
  } else if (item === "ocarina") {
    g.grantOcarina();
    revealItem("ocarina");
  } else if (item === "bow") {
    g.grantBow();
    revealItem("bow");
  } else if (item === "sling") {
    g.grantSling();
    revealItem("sling");
  } else if (item === "boom") {
    g.grantBoom();
    revealItem("boom");
  } else if (item === "bombs") {
    g.grantBombs();
    revealItem("bombs");
  } else if (item === "compass") {
    g.grantCompass();
    revealItem("compass");
  } else if (item === "heart") {
    g.grantHeartContainer(`chest-${item}-${coins}`);
    revealItem("container");
  } else if (coins) {
    revealItem("coin");
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
    const rad = 0.48 * t.s;
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
    const rad = rockRadius(r.s) * 0.72;
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
  const { scene, gl } = useThree();
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
      dSunC = "#ffb060";
      dSky = "#ffd4a0";
      dGnd = "#7a8a42";
      dFog = "#f0c898";
      dBg = "#f2b878";
      dSun = 1.62 + Math.max(0, elev) * 0.18;
      dHemi = 0.92;
      dAmb = 0.48;
      dNear = 80;
      dFar = 560;
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

    const nSun = 0.78;
    const nHemi = 0.58;
    const nAmb = 0.4;
    const nSunC = "#c8d6f4";
    const nSky = "#8aa6d4";
    const nGnd = "#3a4860";
    const nFog = "#3a4868";
    const nBg = "#24344c";
    const nNear = 48;
    const nFar = 320;

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
    if (studio === "shade") {
      sunI *= 0.35;
      hemiI += 0.18;
      ambI += 0.12;
    }

    const px = live.charView ? 0 : live.x;
    const py = live.charView ? 1 : live.y;
    const pz = live.charView ? 0 : live.z;
    const low = live.quality === "low";

    if (sun.current) {
      if (sun.current.target.parent !== scene) scene.add(sun.current.target);
      const a = live.day * Math.PI * 2;
      const ox = studio === "shade" ? -38 : worldId === "meadow" ? 68 : 52;
      const oy = (worldId === "meadow" ? 18 : 36) + Math.max(0.15, elev) * (worldId === "meadow" ? 10 : 18);
      const oz = studio === "shade" ? 22 : worldId === "meadow" ? -52 : -34;
      if (worldId === "meadow" || studio) {
        sun.current.position.set(px + ox, py + oy, pz + oz);
      } else {
        sun.current.position.set(px + Math.cos(a) * 70, py + 28 + elev * 50, pz + Math.sin(a) * 50 - 16);
      }
      sun.current.intensity = sunI;
      sun.current.color.copy(sunCol.current);
      sun.current.target.position.set(px, py, pz);
      sun.current.target.updateMatrixWorld();
      sun.current.shadow.mapSize.set(512, 512);
      const span = 28;
      sun.current.shadow.camera.left = -span;
      sun.current.shadow.camera.right = span;
      sun.current.shadow.camera.top = span;
      sun.current.shadow.camera.bottom = -span;
      sun.current.shadow.camera.updateProjectionMatrix();
      sun.current.shadow.bias = -0.00035;
      sun.current.shadow.normalBias = 0.035;
      sun.current.shadow.radius = 2.2;
    }
    if (fill.current) {
      fill.current.position.set(px - 28, py + 18, pz + 22);
      fill.current.intensity = (live.night ? 0.48 : worldId === "meadow" ? 0.28 : 0.42) + (studio === "shade" ? 0.2 : 0);
      fill.current.color.set(live.night ? "#8aa0d0" : worldId === "meadow" ? "#ffd8b0" : "#dce8ff");
    }
    if (rim.current) {
      rim.current.position.set(px + 18, py + 14, pz - 40);
      rim.current.intensity = live.night ? 0.12 : worldId === "meadow" ? 0.55 : 0.38;
      rim.current.color.set(live.night ? "#a8b8e0" : worldId === "meadow" ? "#ffc070" : "#ffd8a0");
    }
    if (hemi.current) {
      hemi.current.intensity = hemiI;
      hemi.current.color.copy(hemiSky.current);
      hemi.current.groundColor.copy(hemiGnd.current);
    }
    if (amb.current) amb.current.intensity = ambI;
    scene.background = bgCol.current;
    if (env && scene.environment !== env) scene.environment = env;
    scene.environmentIntensity = 0;
    const fog = scene.fog;
    if (fog instanceof THREE.Fog) {
      fog.color.copy(fogCol.current);
      fog.near = fogNear;
      fog.far = fogFar;
    }
    gl.toneMappingExposure = live.night ? 1.18 : worldId === "meadow" ? 1.28 : 1.12;
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
        castShadow
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
      <directionalLight ref={fill} position={[-28, 18, 22]} intensity={0.62} color="#e8f0ff" />
      <directionalLight ref={rim} position={[18, 14, -40]} intensity={0.48} color="#ffe2b0" />
      <NightStars />
    </>
  );
}

function NightStars() {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 220;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const e = 0.18 + Math.random() * 1.1;
      const r = 220 + Math.random() * 80;
      pos[i * 3] = Math.cos(a) * Math.cos(e) * r;
      pos[i * 3 + 1] = Math.sin(e) * r + 40;
      pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  useFrame(() => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.PointsMaterial;
    mat.opacity = Math.max(0, (live.dusk - 0.45) * 1.6);
    ref.current.visible = live.dusk > 0.42;
  });
  return (
    <points ref={ref} geometry={geo} visible={false}>
      <pointsMaterial color="#e8f0ff" size={1.6} sizeAttenuation transparent opacity={0} depthWrite={false} />
    </points>
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
  const camDist = useRef(5.8);
  const shake = useRef(0);
  const talkLatch = useRef(false);
  const bombLatch = useRef(false);
  const throwLatch = useRef(false);
  const boot = useRef(false);

  useEffect(() => {
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
    const dt = Math.min(0.05, Math.max(0, rawDt));
    live.paused = paused || live.doorMath || Boolean(live.chestOpen);
    live.playT += dt;
    if (live.spark > 0) live.spark = Math.max(0, live.spark - dt * 2.4);
    if (live.heroFlash > 0) live.heroFlash = Math.max(0, live.heroFlash - dt * 3.2);
    shake.current = live.spark;

    if (live.warp) {
      const w = live.warp;
      live.warp = null;
      useGame.getState().enterWorld(w.to);
      live.warpTo = { x: w.x, z: w.z };
      return;
    }

    if (live.warpTo) {
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
            live.doorUse = null;
            clearShots();
          }
        } else {
          live.x += (hut.x - live.x) * dt * 3.2;
          live.z += (doorZ + 1.35 - live.z) * dt * 3.2;
          if (live.doorUse.t > 1.05) {
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

    const gems = useGame.getState().gems;
    live.nearCave =
      worldId === "meadow" &&
      Boolean(gems.emerald) &&
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
    }

    const hx = live.horseX ?? PADDOCK.x;
    const hz = live.horseZ ?? PADDOCK.z;
    live.nearHorse = !live.house && Math.hypot(live.x - hx, live.z - hz) < 2.2;

    let nearestNpc: string | null = null;
    let nearestD = 1.65;
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
    live.nearNpc = nearestNpc;

    if (live.chestUnlock) {
      const ch = spec.chests.find((c) => c.id === live.chestUnlock);
      if (ch && !chestAlreadyLooted(worldId, ch)) {
        markChestOpen(chestSaveId(worldId, ch.id));
        rt.opened.add(ch.id);
        live.chestOpen = { id: ch.id, x: ch.x, z: ch.z, t: 0, item: ch.item ?? "coin", coins: ch.coins, granted: false };
        grantChestItem(ch.item, ch.coins);
        live.chestUnlock = null;
      } else {
        live.chestUnlock = null;
      }
    }
    if (live.chestOpen) {
      live.chestOpen.t += dt;
      if (live.chestOpen.t > 2.6) live.chestOpen = null;
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
      live.sleepPhase !== "" ||
      live.bedLie ||
      live.sit;
    const { steer: rawSteer, throttle } = moveAxes();
    const steer = live.steerOverride != null ? live.steerOverride : rawSteer;

    if (!freeze) {
      if (live.climbCool > 0) live.climbCool = Math.max(0, live.climbCool - dt);
      if (live.zipping) {
        const drop = consumeJump();
        stepZip(dt, drop);
      } else if (live.nearZip && consumeJump()) {
        beginZip();
      } else if (!live.climbing && !live.house && live.climbCool <= 0 && !live.mounted && !live.swim) {
        const L = nearLadder(live.x, live.z);
        if (L) {
          const along = live.y - heightAt(L.x, L.z);
          if (along > 0.35 && along < L.h + 0.55) startClimb(L, along);
          else if (Math.abs(throttle) > 0.22 || along < 0.4) startClimb(L, Math.max(0.12, Math.min(along, L.h - 0.15)));
        }
      }
      if (live.climbing && !live.zipping) {
        const Lad = fieldLadders().find((l) => l.id === live.climbing) ?? nearLadder(live.x, live.z);
        if (Lad) {
          snapToLadder(Lad);
          live.climbV = throttle * 3.55;
          live.climbH += live.climbV * dt;
          live.climbPhase += dt * (Math.abs(live.climbV) > 0.12 ? 9.2 : 0);
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
        live.x += live.knock.vx * dt;
        live.z += live.knock.vz * dt;
        if (live.knock.t <= 0) live.knock = null;
      }

      if (!live.climbing && !live.zipping) {
      const sprint = isSprintHeld();
      const maxSp = live.mounted ? (sprint ? HORSE_RUN : HORSE_WALK) : sprint ? RUN : WALK;
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
            for (const [id, p] of Object.entries(live.npcPos)) {
              const d = Math.hypot(live.x - p.x, live.z - p.z);
              if (d < bestD && d > 0.4) {
                bestD = d;
                best = { id, kind: "npc", x: p.x, z: p.z };
              }
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
      if (!live.lock && drive < 0) drive = 0;
      const want = drive * maxSp;
      live.speed += (want - live.speed) * (1 - Math.exp(-dt * 8));
      if (Math.abs(drive) < 0.04) live.speed *= Math.max(0, 1 - dt * 6);
      live.sprinting = sprint && Math.abs(live.speed) > 0.4;
      const fx = -Math.sin(live.yaw);
      const fz = -Math.cos(live.yaw);
      let nx: number;
      let nz: number;
      if (live.lock) {
        const rx = Math.cos(live.yaw);
        const rz = -Math.sin(live.yaw);
        const lat = steer * maxSp * 0.72;
        nx = live.x + fx * live.speed * dt + rx * lat * dt;
        nz = live.z + fz * live.speed * dt + rz * lat * dt;
      } else {
        const turn = 2.35 * (0.35 + Math.min(1, Math.abs(live.speed) / maxSp));
        live.yaw += steer * turn * dt;
        nx = live.x + fx * live.speed * dt;
        nz = live.z + fz * live.speed * dt;
      }
      const push = nearestBlock(rt, live.x, live.z, 1.45);
      let skip: string | null = null;
      if (push && Math.abs(live.speed) > 0.6) {
        shoveBlock(push, fx, fz, dt * 2.4);
        skip = push.id;
      }
      const hit = collideWorld(nx, nz, worldId, rt, skip);
      live.x = hit.x;
      live.z = hit.z;
      live.vx = live.speed;

      if (isSlideHeld() && live.grounded && !live.rolling && !live.mounted) {
        live.rolling = true;
        live.rollU = 0;
        sfx.slide();
      }
      if (live.rolling) {
        live.rollU += dt * 1.7;
        live.x += fx * 7.2 * dt;
        live.z += fz * 7.2 * dt;
        const rh = collideWorld(live.x, live.z, worldId, rt);
        live.x = rh.x;
        live.z = rh.z;
        if (live.rollU >= 1) live.rolling = false;
      }
      }

      const wet = pondU(live.x, live.z);
      live.swim = wet > 0.55 && !live.house;
      if (!freeze && live.climbing && consumeJump()) {
        const Lad = fieldLadders().find((l) => l.id === live.climbing);
        if (Lad) hopOffLadder(Lad, live.climbH > Lad.h * 0.5 ? -1.4 : 1.15);
      } else if (!freeze && !live.zipping && consumeJump() && live.grounded && !live.mounted && !live.swim) {
        vy.current = JUMP;
        live.grounded = false;
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
      const ground = Math.max(
        heightAt(live.x, live.z) + climbOnRocks(live.x, live.z) + (hut ? innStairLift(hut, live.x, live.z) : 0),
        perch,
      );
      if (!live.climbing && !live.zipping) {
        vy.current -= GRAV * dt;
        live.y += vy.current * dt;
        const floor = live.swim ? Math.max(ground, 0.22) : ground;
        if (live.y <= floor) {
          if (!live.grounded && vy.current < -2) sfx.land("grass");
          live.y = floor;
          vy.current = 0;
          live.grounded = true;
          live.horseJump = false;
        } else {
          live.grounded = false;
        }
      }
      live.jumpStretch = Math.max(0, live.jumpStretch - dt * 4);
      live.landSquash = live.grounded ? Math.max(0, live.landSquash - dt * 5) : 0;
    }

    if (freeze) {
      live.speed *= Math.max(0, 1 - dt * 8);
    }

    live.area = inVillage(live.x, live.z) ? "village" : "field";

    const g = useGame.getState();
    live.hasSword = g.hasSword;
    live.hasShield = g.hasShield;
    live.hasHorse = g.hasHorse;
    if (g.holding) live.holding = g.holding;

    if (!freeze && !live.zipping && !live.climbing) {
      if (live.swinging) {
        live.swingU += dt * 2.6;
        if (live.swingU >= 1) {
          live.swinging = false;
          live.swingU = 0;
        }
      }
      const wantSwing = consumeSwing();
      const wantBomb = consumeBomb();
      const wantThrow = consumeThrow();

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
        if (wantSwing) {
          const seed = live.holding === "sling";
          const spent = seed ? g.spendSeed() : g.spendArrow();
          if (spent) {
            const h = handPos();
            const fx = -Math.sin(live.yaw);
            const fz = -Math.cos(live.yaw);
            const aimY = live.lock ? 0.15 : 0.05;
            live.arrows.push({
              x: h.x,
              y: h.y + 0.12,
              z: h.z,
              vx: fx * 24,
              vy: aimY * 24,
              vz: fz * 24,
              age: 0,
              kind: seed ? "seed" : "arrow",
            });
            sfx.swing();
          }
        }
      }

      if (live.holding === "sword" && g.hasSword && wantSwing && !live.swinging) {
        live.swinging = true;
        live.swingU = 0;
        sfx.swing();
      }
      if (live.swinging && live.holding === "sword" && g.hasSword) {
        const fx = -Math.sin(live.yaw);
        const fz = -Math.cos(live.yaw);
        const spin = live.spinning;
        live.slash = {
          x: live.x + fx * (spin ? 0.35 : 1.15),
          z: live.z + fz * (spin ? 0.35 : 1.15),
          r: spin ? 2.15 : 1.5,
        };
      } else {
        live.slash = null;
      }

      if (!isSwingHeld() && !wantThrow) throwLatch.current = false;
    }

    const talk = consumeTalk() || (isTalkHeld() && !talkLatch.current);
    if (isTalkHeld()) talkLatch.current = true;
    else talkLatch.current = false;
    if (talk && !freeze && !live.doorMath && !live.zipping) {
      if (live.nearZip) {
        beginZip();
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
        live.warp = { x: 0, z: 16.2, to: "cavern" };
      } else if (live.nearGate) {
        const id = live.nearGate as WorldId;
        live.warp = { x: 0, z: 16.2, to: id };
      } else if (live.nearHorse && g.hasHorse) {
        live.mounted = !live.mounted;
        sfx.neigh();
      } else if (live.nearBed && live.house) {
        live.bed = live.nearBed;
        live.bedLie = true;
        live.sleepPhase = "out";
        live.sleepFade = 0;
      } else if (live.nearChair && live.sitAt) {
        live.sit = !live.sit;
      } else if (live.nearMail) {
        useGame.getState().startDoorQuiz("mail", "mail");
      }
    }

    if (consumeCamAlign()) orbit.current = 0;

    if (live.shotCam) {
      camera.position.set(live.shotCam.x, live.shotCam.y, live.shotCam.z);
      camera.lookAt(live.shotCam.lx, live.shotCam.ly, live.shotCam.lz);
    } else if (live.ceremony) {
      live.ceremony.t += dt;
      const u = Math.min(1, live.ceremony.t / 8.4);
      const ang = 0.4 + u * Math.PI * 1.35;
      const rad = 4.6 - u * 0.8;
      camera.position.set(live.x + Math.sin(ang) * rad, live.y + 2.2 + Math.sin(u * Math.PI) * 1.4, live.z + Math.cos(ang) * rad);
      camera.lookAt(live.x, live.y + 1.35, live.z);
      live.getItem = u > 0.35 && u < 0.82 ? (live.ceremony.gem === "all" ? "emerald" : live.ceremony.gem) : null;
      if (live.ceremony.t > 9.2) {
        live.ceremony = null;
        live.getItem = null;
      }
    } else {
    const lookAmt = lookAxes();
    orbit.current += lookAmt * dt * 1.6;
    const fx = -Math.sin(live.yaw + orbit.current);
    const fz = -Math.cos(live.yaw + orbit.current);
    camDist.current += ((live.mounted ? 7.4 : live.zipping ? 8.2 : live.house === "yours" ? 6.15 : live.dungeon ? 6.6 : 5.8) - camDist.current) * (1 - Math.exp(-dt * 4));
    const height = live.mounted ? 3.35 : live.zipping ? 2.35 : live.house === "yours" ? 2.62 : live.house ? 2.15 : 2.55;
    const dist = live.zipping ? camDist.current : live.house === "yours" ? camDist.current : live.house ? 4.2 : camDist.current;
    const desired = new THREE.Vector3(live.x + fx * -dist, live.y + height, live.z + fz * -dist);
    if (live.house === "yours") {
      const plat = heightAt(TREE_HOME.x, TREE_HOME.z) + TREE_HOUSE_H;
      desired.x = Math.max(TREE_HOME.x - TREE_HW + 0.7, Math.min(TREE_HOME.x + TREE_HW - 0.7, desired.x));
      desired.z = Math.max(TREE_HOME.z - TREE_HD + 0.65, Math.min(TREE_HOME.z + TREE_HD - 0.25, desired.z));
      desired.y = Math.max(plat + 1.45, Math.min(plat + 3.28, desired.y));
    }
    if (shake.current > 0.02) {
      desired.x += (Math.random() - 0.5) * shake.current * 0.35;
      desired.y += (Math.random() - 0.5) * shake.current * 0.22;
    }
    if (boot.current && live.house === "yours") {
      camera.position.copy(desired);
      boot.current = false;
    } else {
      camera.position.lerp(desired, 1 - Math.exp(-dt * 6.2));
      boot.current = false;
    }
    camera.lookAt(live.x, live.y + 1.18, live.z);
    }

    if (group.current) {
      group.current.position.set(live.x, live.y, live.z);
      group.current.rotation.y = live.yaw;
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
  const { camera } = useThree();
  useFrame(({ clock }) => {
    if (!g.current) return;
    const lock = live.lock;
    if (!lock) {
      g.current.visible = false;
      return;
    }
    g.current.visible = true;
    const bob = Math.sin(clock.elapsedTime * 6.2) * 0.22;
    const y = heightAt(lock.x, lock.z) + 2.55 + bob;
    g.current.position.set(lock.x, y, lock.z);
    g.current.lookAt(camera.position);
  });
  return (
    <group ref={g} visible={false} renderOrder={40}>
      <mesh rotation={[0, 0, Math.PI]} position={[0, 0, 0]}>
        <coneGeometry args={[0.92, 1.72, 3]} />
        <meshBasicMaterial color="#ffe44a" depthTest={false} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI]} position={[0, -0.04, 0.03]}>
        <coneGeometry args={[0.52, 1.05, 3]} />
        <meshBasicMaterial color="#fff8b8" depthTest={false} />
      </mesh>
      <mesh position={[0, 1.05, 0.02]}>
        <ringGeometry args={[0.18, 0.36, 18]} />
        <meshBasicMaterial color="#ffe44a" depthTest={false} side={THREE.DoubleSide} />
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
        const hit = hitFoe(b.x, b.z, 1.15, 2);
        if (hit || b.fuse <= 0) {
          explodeAt(b.x, b.y, b.z);
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
          if (a.y < gy || solid(a.x, a.z) || hitFoe(a.x, a.z, 0.7) || a.age > 2.4) {
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
            <cylinderGeometry args={[0.025, 0.02, 0.72, 6]} />
            <meshLambertMaterial color="#c4a070" />
          </mesh>
          <mesh position={[0, 0, 0.38]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.05, 0.14, 5]} />
            <meshLambertMaterial color="#8a8478" />
          </mesh>
          <mesh position={[0, 0, -0.42]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.035, 0.55, 5]} />
            <meshBasicMaterial color="#f4ead2" transparent opacity={0.4} depthWrite={false} />
          </mesh>
        </group>
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
  const spots = useMemo(() => fieldActors(worldId).enemies.filter((e) => !defeated.includes(e.id)), [worldId, defeated]);
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
  const [show, setShow] = useState(() => Math.hypot(live.x - spot.x, live.z - spot.z) < 80);
  const [dead, setDead] = useState(false);
  const pos = useRef({ x: spot.x, z: spot.z });
  const root = useRef<THREE.Group>(null);
  const yaw = useRef(0);
  const poseRef = useRef<FangPose>("walk");
  const swipeAt = useRef(-9);
  useFrame((_, dt) => {
    if (dead) return;
    const near = Math.hypot(live.x - pos.current.x, live.z - pos.current.z) < 80;
    if (near !== show) setShow(near);
    if (!root.current) return;
    if ((useGame.getState().defeated[worldId] ?? []).includes(spot.id)) {
      setDead(true);
      return;
    }
    if (!paused && !live.paused && !live.house && !live.doorMath) {
      const dx = live.x - pos.current.x;
      const dz = live.z - pos.current.z;
      const d = Math.hypot(dx, dz);
      if (d < 16) live.aggroIds.add(spot.id);
      else live.aggroIds.delete(spot.id);
      const hitAgo = live.playT - (live.foeHitT[spot.id] ?? -9);
      if (d < 14 && d > 1.15) {
        pos.current.x += (dx / d) * 2.35 * dt;
        pos.current.z += (dz / d) * 2.35 * dt;
        yaw.current = Math.atan2(-dx, -dz);
        poseRef.current = d < 4 ? "chase" : "walk";
      } else if (d > 14) {
        poseRef.current = "walk";
      }
      if (live.slash && Math.hypot(live.slash.x - pos.current.x, live.slash.z - pos.current.z) < (live.slash.r ?? 1.2)) {
        const dmg = live.spinning || live.jumpAtk ? 2 : 1;
        const r = strikeFoe(worldId, spot.id, spot.kind, dmg, pos.current.x, pos.current.z);
        if (r === "kill") {
          setDead(true);
          live.aggroIds.delete(spot.id);
          return;
        }
        if (r === "hit") {
          const nx = d > 0.001 ? dx / d : 0;
          const nz = d > 0.001 ? dz / d : 0;
          pos.current.x -= nx * 0.55;
          pos.current.z -= nz * 0.55;
        }
      }
      if (d < 1.32 && !live.god && live.heroFlash < 0.22 && hitAgo > 0.2 && live.playT - swipeAt.current > 0.95) {
        swipeAt.current = live.playT;
        poseRef.current = "swipe";
        yaw.current = Math.atan2(-dx, -dz);
        if (live.shieldUp && useGame.getState().hasShield) {
          sfx.block();
        } else {
          useGame.getState().hurtField(2);
          if (d > 0.001) live.knock = { vx: (dx / d) * 8.2, vz: (dz / d) * 8.2, t: 0.2 };
        }
      }
      if (live.playT - swipeAt.current < 0.35) poseRef.current = "swipe";
      else if (hitAgo < 0.28) poseRef.current = "hiss";
    }
    live.foeTrack[spot.id] = { x: pos.current.x, z: pos.current.z };
    root.current.position.set(pos.current.x, heightAt(pos.current.x, pos.current.z), pos.current.z);
    root.current.rotation.y = yaw.current;
    const flashed = live.playT - (live.foeHitT[spot.id] ?? -9) < 0.18;
    const bossS = spot.kind === "warden" || spot.kind === "remainder" ? 1.55 : 1;
    const s = (flashed ? 1.08 : 1) * bossS;
    root.current.scale.setScalar(s);
  });
  if (!show || dead) return null;
  const hurt = live.playT - (live.foeHitT[spot.id] ?? -9) < 0.28;
  return (
    <group ref={root}>
      <N64Foe kind={spot.kind} seed={seed} world={worldId} pose="walk" poseRef={poseRef} act={hurt ? "hurt" : undefined} />
    </group>
  );
}

function Crystals({ worldId, collected, hooks }: { worldId: WorldId; collected: string[]; hooks: WorldHooks }) {
  const spots = useMemo(
    () => fieldActors(worldId).crystals.filter((c) => !collected.includes(c.id)),
    [worldId, collected],
  );
  useFrame(() => {
    if (live.house || live.paused) return;
    for (const c of spots) {
      if (Math.hypot(live.x - c.x, live.z - c.z) < 1.05) hooks.onCollect(c.id);
    }
  });
  return (
    <group>
      {spots.map((c) => (
        <mesh key={c.id} position={[c.x, heightAt(c.x, c.z) + 0.55, c.z]} castShadow>
          <octahedronGeometry args={[0.28, 0]} />
          <meshLambertMaterial color="#7ad0e8" emissive="#4aa8d0" emissiveIntensity={0.55} />
        </mesh>
      ))}
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
  useFrame(() => {
    const v = Boolean(live.house);
    if (v !== inside) setInside(v);
  });
  const list = npcsIn(worldId);
  if (worldId === "meadow" && !inside && !list.some((n) => n.id === "ash")) {
    const ash = npcById("ash");
    if (ash) list.push(ash);
  }
  const plat = heightAt(TREE_HOME.x, TREE_HOME.z) + TREE_HOUSE_H;
  return (
    <group>
      {list.map((n) => {
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
            stay={Boolean(n.indoor) || n.stay || n.id === "ash" || n.id === "mira"}
            floorY={n.indoor === "yours" ? plat : undefined}
          />
        );
      })}
    </group>
  );
}

function Drops() {
  const [, bump] = useState(0);
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
    if (changed) bump((n) => n + 1);
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
  return (
    <>
      <DayNight worldId={worldId} />
      <Player worldId={worldId} spawn={spawn} hooks={hooks} paused={paused} puzzle={puzzle} />
      <LockReticle />
      <FlyingArrows worldId={worldId} paused={paused} puzzle={puzzle} hooks={hooks} />
      {inside ? (
        houseId ? <HouseInterior id={houseId} /> : null
      ) : (
        <>
          {!isDungeon(worldId) ? (
            <>
              <GrassTerrain grass={tint.grass} snow={snow} segs={worldId === "meadow" ? 16 : 28} />
              <N64Grove denser={false} leaf={tint.leaf} skipValley={worldId === "meadow"} />
              <N64Rocks />
              <Houses worldId={worldId} />
              <Campfires />
              {worldId === "meadow" ? <Village worldId={worldId} /> : null}
              {worldId === "meadow" ? <VillageScenery /> : null}
              {worldId === "meadow" ? <TownLife /> : null}
              {worldId === "meadow" ? <MeadowArt /> : null}
              {worldId === "meadow" ? <AppleOrchard /> : null}
              {worldId === "meadow" ? <N64Horse x={PADDOCK.x} z={PADDOCK.z} /> : null}
            </>
          ) : null}
          <BiomeDress worldId={worldId} />
          {isDungeon(worldId) || worldId === "keep" ? <DungeonShell worldId={worldId} /> : null}
          {isDungeon(worldId) ? <DungeonGem worldId={worldId} /> : null}
          {isDungeon(worldId) ? <DungeonTraps worldId={worldId} /> : null}
          <Foes worldId={worldId} defeated={defeated} hooks={hooks} paused={paused} />
          <Crystals worldId={worldId} collected={collected} hooks={hooks} />
          <PuzzleLayer worldId={worldId} puzzle={puzzle} />
          <FieldNpcs worldId={worldId} />
          {!isDungeon(worldId) ? <HiddenSecrets worldId={worldId} /> : null}
          {!isDungeon(worldId) ? <MysteryLayer worldId={worldId} /> : null}
          <WorldPolish worldId={worldId} />
          <SongAura />
          <Drops />
          <ColDebug />
        </>
      )}
      {inside && houseId ? <FieldNpcs worldId={worldId} /> : null}
      <SleepVeil />
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
      shadows
      camera={{ fov: 50, near: 0.18, far: 420, position: [14, 8, -48] }}
      dpr={[1, 1]}
      gl={{
        antialias: false,
        alpha: false,
        preserveDrawingBuffer: false,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.08,
      }}
      onCreated={({ gl, scene }) => {
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.BasicShadowMap;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        live.quality = "low";
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
