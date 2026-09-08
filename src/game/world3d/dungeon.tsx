import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { WorldId } from "../types";
import { isDungeon, isDeepDungeon, WORLD_TINT, heightAt } from "./field";
import { useGame } from "../store";
import { live } from "./live";
import { sfx } from "../audio";

export type Wall = { x: number; z: number; w: number; d: number };

const HALL: Wall[] = [
  { x: 0, z: 36.4, w: 82, d: 1.2 },
  { x: 0, z: -44.4, w: 82, d: 1.2 },
  { x: 40.6, z: -4, w: 1.2, d: 82 },
  { x: -40.6, z: -4, w: 1.2, d: 82 },
  { x: -22.4, z: 8, w: 32, d: 1 },
  { x: 22.4, z: 8, w: 32, d: 1 },
  { x: -22.4, z: -14, w: 32, d: 1 },
  { x: 22.4, z: -14, w: 32, d: 1 },
];

function split(z: number): Wall[] {
  return [
    { x: -51.5, z, w: 71.3, d: 1.12 },
    { x: 51.5, z, w: 71.3, d: 1.12 },
  ];
}

function leftOpen(z: number): Wall {
  return { x: 48.2, z, w: 76, d: 1.12 };
}

function rightOpen(z: number): Wall {
  return { x: -48.2, z, w: 76, d: 1.12 };
}

export const DUNGEON_ROOM = 52;
export const LONG_ROOMS = 90;
export const DEEP_ROOMS = 120;

function chainWalls(rooms: number): Wall[] {
  const zMax = 28.4;
  const zMin = zMax - rooms * DUNGEON_ROOM;
  const mid = (zMax + zMin) * 0.5;
  const depth = zMax - zMin;
  const walls: Wall[] = [
    { x: 0, z: zMax, w: 176, d: 1.35 },
    { x: 0, z: zMin, w: 176, d: 1.35 },
    { x: 87.1, z: mid, w: 1.35, d: depth + 2 },
    { x: -87.1, z: mid, w: 1.35, d: depth + 2 },
  ];
  for (let i = 0; i < rooms - 1; i++) {
    const z = zMax - 20 - i * DUNGEON_ROOM;
    walls.push(...split(z));
    walls.push(i % 2 === 0 ? rightOpen(z + 10.2) : leftOpen(z + 10.2));
  }
  return walls;
}

const LONG: Wall[] = chainWalls(LONG_ROOMS);
const DEEP: Wall[] = chainWalls(DEEP_ROOMS);

const LONG_WORLDS = new Set<WorldId>([
  "cavern",
  "marsh",
  "grove",
  "crater",
  "lake",
  "grave",
  "waste",
  "echo",
  "ridge",
  "spire",
  "fen",
  "hollow",
  "vault",
]);

export function dungeonWalls(world: WorldId): Wall[] {
  if (!isDungeon(world)) return [];
  if (isDeepDungeon(world)) return DEEP;
  return LONG_WORLDS.has(world) ? LONG : HALL;
}

export function dungeonBounds(world?: WorldId): { x: number; zMin: number; zMax: number } {
  if (world && isDeepDungeon(world)) {
    return { x: 84.7, zMin: 28.4 - DEEP_ROOMS * DUNGEON_ROOM + 1.35, zMax: 27.05 };
  }
  if (world && LONG_WORLDS.has(world)) {
    return { x: 84.7, zMin: 28.4 - LONG_ROOMS * DUNGEON_ROOM + 1.35, zMax: 27.05 };
  }
  return { x: 39.4, zMin: -43.2, zMax: 35.2 };
}

function roomCenters(n: number) {
  return Array.from({ length: n }, (_, i) => 16 - i * DUNGEON_ROOM);
}

function shoveWall(x: number, z: number, w: Wall, rad: number): { x: number; z: number } | null {
  const hx = w.w * 0.5 + rad;
  const hz = w.d * 0.5 + rad;
  const dx = x - w.x;
  const dz = z - w.z;
  if (Math.abs(dx) >= hx || Math.abs(dz) >= hz) return null;
  const ox = hx - Math.abs(dx);
  const oz = hz - Math.abs(dz);
  if (ox < oz) return { x: w.x + Math.sign(dx || 1) * hx, z };
  return { x, z: w.z + Math.sign(dz || 1) * hz };
}

export function collideWalls(walls: Wall[], x: number, z: number, rad = 0.78): boolean {
  for (const w of walls) {
    const hx = w.w * 0.5 + rad;
    const hz = w.d * 0.5 + rad;
    if (Math.abs(x - w.x) < hx && Math.abs(z - w.z) < hz) return true;
  }
  return false;
}

export function clampDungeon(x: number, z: number, world?: WorldId): { x: number; z: number } {
  const b = dungeonBounds(world);
  let nx = Math.max(-b.x, Math.min(b.x, x));
  let nz = Math.max(b.zMin, Math.min(b.zMax, z));
  const walls = world ? dungeonWalls(world) : HALL;
  for (const w of walls) {
    const hit = shoveWall(nx, nz, w, 0.72);
    if (hit) {
      nx = hit.x;
      nz = hit.z;
    }
  }
  return { x: nx, z: nz };
}

export function dungeonCam(nx: number, nz: number, ny: number, world?: WorldId): { x: number; y: number; z: number } {
  let cx = 0;
  let cz = 13.05;
  if (world && isDeepDungeon(world)) {
    const rooms = roomCenters(DEEP_ROOMS);
    cz = rooms[0]!;
    for (const r of rooms) {
      if (nz < r + DUNGEON_ROOM * 0.45) cz = r;
    }
  } else if (world && LONG_WORLDS.has(world)) {
    const rooms = roomCenters(LONG_ROOMS);
    cz = rooms[0]!;
    for (const r of rooms) {
      if (nz < r + DUNGEON_ROOM * 0.45) cz = r;
    }
  } else {
    if (nz <= -8.05) cz = -16.15;
    else if (nz <= 6.15) cz = -1.05;
  }
  if (Math.abs(nx) > 8.2) cx = Math.sign(nx) * 10.4;
  return { x: cx, y: ny + 8.4, z: cz };
}

export function DungeonShell({ worldId }: { worldId: WorldId }) {
  if (!isDungeon(worldId)) return null;
  const tint = WORLD_TINT[worldId];
  const cave = worldId === "cavern";
  const torch =
    worldId === "lake"
      ? "#60a8e0"
      : worldId === "crater"
        ? "#e07030"
        : worldId === "grave"
          ? "#8878c0"
          : worldId === "echo" || worldId === "vault"
            ? "#a070d0"
            : worldId === "marsh" || worldId === "fen"
              ? "#40a090"
              : worldId === "waste"
                ? "#e0c060"
                : worldId === "grove" || worldId === "ridge"
                  ? "#50a048"
                  : worldId === "spire"
                    ? "#8090a8"
                    : worldId === "hollow"
                      ? "#e07030"
                      : cave
                        ? "#c88850"
                        : "#e08840";
  const floor = cave
    ? "#3a322c"
    : worldId === "marsh"
      ? "#2a4a40"
      : worldId === "crater"
        ? "#4a2818"
        : worldId === "grave"
          ? "#d4dde6"
          : worldId === "lake"
            ? "#2a4a68"
            : tint.grass;
  const wall = cave ? "#4a4038" : iWall(worldId, tint);
  const ceil = cave ? "#1c1814" : "#1a1410";
  const long = LONG_WORLDS.has(worldId);
  const deep = isDeepDungeon(worldId);
  const rooms = deep ? DEEP_ROOMS : long ? LONG_ROOMS : 3;
  const depth = rooms * DUNGEON_ROOM;
  const floorZ = 28.4 - depth * 0.5;
  const floorSize: [number, number] = deep || long ? [180, depth + 40] : [86, 88];
  return (
    <group>
      <mesh position={[0, -0.02, floorZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={floorSize} />
        <meshLambertMaterial color={floor} />
      </mesh>
      <mesh position={[0, 11.4, floorZ]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={floorSize} />
        <meshLambertMaterial color={ceil} />
      </mesh>
      {dungeonWalls(worldId).map((w, i) => (
        <mesh key={i} position={[w.x, 4.4, w.z]} castShadow receiveShadow>
          <boxGeometry args={[w.w, 9.0, w.d]} />
          <meshLambertMaterial color={i < 4 ? wall : floor} />
        </mesh>
      ))}
      {(cave ? CAVE_STALS : STALS).map((s, i) => (
        <mesh key={i} position={[s[0], 8.15 - s[3] * 0.42, s[1]]} rotation={[Math.PI, 0, 0]} castShadow>
          <coneGeometry args={[s[2], s[3], 7]} />
          <meshLambertMaterial color={cave ? "#5a4e42" : tint.leaf} />
        </mesh>
      ))}
      {(cave ? CAVE_MITES : []).map((s, i) => (
        <mesh key={`m${i}`} position={[s[0], s[3] * 0.42, s[1]]} castShadow>
          <coneGeometry args={[s[2], s[3], 7]} />
          <meshLambertMaterial color="#4a4036" />
        </mesh>
      ))}
      {ROCKS.map((r, i) => (
        <mesh key={`r${i}`} position={[r[0], r[2] * 0.4, r[1]]} scale={[r[2], r[2] * 0.7, r[2]]} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshLambertMaterial color={cave ? "#5a4a3c" : tint.leaf} />
        </mesh>
      ))}
      {cave ? <CaveDress /> : null}
      {worldId === "marsh" ? <MarshDress /> : null}
      {worldId === "grove" ? <GroveHallDress /> : null}
      {worldId === "crater" ? <CraterHallDress /> : null}
      {worldId === "lake" ? <LakeHallDress /> : null}
      {worldId === "grave" ? <GraveHallDress /> : null}
      {worldId === "waste" ? <WasteHallDress /> : null}
      {worldId === "echo" || worldId === "vault" ? <EchoHallDress /> : null}
      {worldId === "ridge" ? <GroveHallDress /> : null}
      {worldId === "spire" ? <GraveHallDress /> : null}
      {worldId === "fen" ? <LakeHallDress /> : null}
      {worldId === "hollow" ? <CraterHallDress /> : null}
      {(deep || long ? [-48, 48] : [-22, 22]).map((x) =>
        (deep ? roomCenters(DEEP_ROOMS) : long ? roomCenters(LONG_ROOMS) : [-14, 2, 14])
          .filter((_, i) => i % 5 === 0)
          .map((z) => <Torch key={`${x}-${z}`} x={x} z={z} color={torch} />),
      )}
      <ambientLight intensity={cave ? 0.28 : 0.62} color={cave ? "#c8b090" : "#f0e4c8"} />
      <hemisphereLight args={[torch, cave ? "#1a1410" : "#2a2018", cave ? 0.45 : 0.85]} />
    </group>
  );
}

function iWall(worldId: WorldId, tint: { grass: string; leaf: string }) {
  if (worldId === "marsh") return "#2a5a48";
  if (worldId === "grove") return "#3a4a28";
  if (worldId === "crater") return "#5a2a18";
  if (worldId === "lake") return "#2a4a68";
  if (worldId === "grave") return "#4a4e58";
  if (worldId === "waste") return "#8a6a40";
  if (worldId === "echo" || worldId === "vault") return "#3a2848";
  if (worldId === "ridge") return "#3a4a28";
  if (worldId === "spire") return "#4a4e58";
  if (worldId === "fen") return "#2a5a48";
  if (worldId === "hollow") return "#5a2a18";
  return tint.leaf;
}

function CaveDress() {
  return (
    <group>
      {CAVE_PUDDLES.map((p, i) => (
        <mesh key={`p${i}`} position={[p[0], 0.03, p[1]]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[p[2], 12]} />
          <meshLambertMaterial color="#2a4a58" transparent opacity={0.72} />
        </mesh>
      ))}
      {CAVE_BLOBS.map((b, i) => (
        <mesh key={`b${i}`} position={[b[0], b[2] * 0.45, b[1]]} scale={[b[2], b[2] * 0.85, b[2] * 0.9]} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshLambertMaterial color={i % 2 ? "#4a4034" : "#5a4a3c"} />
        </mesh>
      ))}
      <CaveDripsLive />
    </group>
  );
}

function CaveDripsLive() {
  const g = useRef<THREE.Group>(null);
  const drops = useRef(
    CAVE_PUDDLES.slice(0, 8).map((p, i) => ({
      x: p[0] + (i % 2 ? 0.2 : -0.15),
      z: p[1],
      y: 6.4 + (i % 3) * 0.4,
      v: 2.4 + (i % 3) * 0.35,
    })),
  );
  useFrame((_, dt) => {
    const root = g.current;
    if (!root) return;
    drops.current.forEach((d, i) => {
      d.y -= d.v * dt;
      if (d.y < 0.08) {
        d.y = 7.2;
        if (Math.hypot(live.x - d.x, live.z - d.z) < 10) sfx.drip();
      }
      const m = root.children[i];
      if (m) m.position.set(d.x, d.y, d.z);
    });
  });
  return (
    <group ref={g}>
      {drops.current.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.035, 6, 5]} />
          <meshBasicMaterial color="#9ec8dc" transparent opacity={0.7} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

const STALS: [number, number, number, number][] = [
  [-8, 8, 0.35, 1.8],
  [6, 4, 0.28, 1.4],
  [-4, -10, 0.4, 2.1],
  [10, -6, 0.22, 1.2],
  [0, 0, 0.5, 2.4],
  [-12, -2, 0.3, 1.6],
  [14, 10, 0.26, 1.5],
];

const CAVE_STALS: [number, number, number, number][] = [
  [-8, 8, 0.42, 2.4],
  [6, 4, 0.34, 1.9],
  [-4, -10, 0.5, 2.8],
  [10, -6, 0.28, 1.6],
  [0, 0, 0.62, 3.1],
  [-12, -2, 0.38, 2.2],
  [14, 10, 0.32, 1.8],
  [-16, 12, 0.44, 2.5],
  [8, -16, 0.36, 2.0],
  [-2, 14, 0.3, 1.7],
  [12, 2, 0.4, 2.3],
  [-9, -14, 0.35, 1.9],
  [3, -4, 0.26, 1.5],
  [-18, -8, 0.48, 2.6],
  [0, -34, 0.55, 2.8],
  [-14, -36, 0.4, 2.2],
  [12, -32, 0.36, 2.0],
  [-8, -22, 0.42, 2.4],
  [16, -40, 0.3, 1.7],
  [-22, -58, 0.48, 2.6],
  [18, -72, 0.4, 2.2],
  [-10, -88, 0.52, 2.9],
  [8, -104, 0.36, 2.0],
  [-16, -118, 0.44, 2.5],
  [14, -130, 0.38, 2.1],
  [0, -112, 0.58, 3.0],
];

const CAVE_MITES: [number, number, number, number][] = [
  [-7, 7, 0.38, 1.4],
  [5, 3, 0.28, 1.1],
  [-5, -9, 0.42, 1.6],
  [9, -5, 0.24, 0.95],
  [1, 1, 0.5, 1.8],
  [-11, -1, 0.3, 1.2],
  [13, 9, 0.26, 1.05],
  [-15, 11, 0.34, 1.35],
  [7, -15, 0.3, 1.15],
  [4, -34, 0.4, 1.5],
  [-10, -30, 0.32, 1.2],
  [6, -62, 0.36, 1.4],
  [-12, -88, 0.3, 1.15],
  [10, -116, 0.34, 1.3],
];

const CAVE_PUDDLES: [number, number, number][] = [
  [-3.2, 4.4, 1.6],
  [5.4, -2.2, 1.2],
  [-8.1, -11.4, 1.8],
  [2.2, -16.6, 1.1],
  [11.4, 6.2, 1.35],
  [-14.2, 2.6, 1.5],
  [0.4, -6.8, 0.95],
  [-6, -34, 1.4],
  [8, -40, 1.2],
  [0, -22, 1.1],
  [-8, -58, 1.5],
  [10, -74, 1.3],
  [-4, -96, 1.6],
  [6, -118, 1.4],
  [0, -132, 1.2],
];

const CAVE_BLOBS: [number, number, number][] = [
  [-20.4, 8, 2.2],
  [20.2, -10, 2.4],
  [-19.6, -14, 1.8],
  [19.8, 12, 2.0],
  [-10.4, 19.2, 1.7],
  [8.6, -22.6, 2.1],
  [-18, -36, 2.0],
  [18, -40, 1.8],
  [-22, -68, 2.2],
  [24, -92, 2.0],
  [-20, -118, 1.9],
  [16, -132, 1.7],
];

const ROCKS: [number, number, number][] = [
  [-14, 10, 1.6],
  [12, 8, 1.3],
  [-10, -12, 1.8],
  [8, -14, 1.4],
  [16, -2, 1.2],
];

const MARSH_PUDDLES: [number, number, number][] = [
  [-4.2, 8.4, 1.8],
  [6.1, 3.2, 1.4],
  [-8.6, -4.5, 2.1],
  [10.4, -12.2, 1.6],
  [2.2, -16.8, 1.2],
  [-12.4, 11.2, 1.5],
  [0, -34, 1.8],
  [-10, -38, 1.4],
  [12, -22, 1.6],
  [4, -42, 1.2],
  [-8, -62, 1.6],
  [12, -88, 1.4],
  [-6, -112, 1.5],
  [4, -128, 1.3],
];

function MarshDress() {
  return (
    <group>
      {MARSH_PUDDLES.map((p, i) => (
        <mesh key={`w${i}`} position={[p[0], 0.04, p[1]]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[p[2], 12]} />
          <meshLambertMaterial color="#2a6a58" transparent opacity={0.62} />
        </mesh>
      ))}
    </group>
  );
}

function GroveHallDress() {
  const moss: [number, number, number][] = [
    [-16, -48, 2.2],
    [18, -72, 2.6],
    [-10, -98, 2.0],
    [12, -128, 2.4],
    [0, -158, 2.8],
    [-18, -176, 2.1],
  ];
  return (
    <group>
      {moss.map(([x, z, r], i) => (
        <mesh key={i} position={[x, 0.04, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[r, 10]} />
          <meshLambertMaterial color="#2a4a22" />
        </mesh>
      ))}
    </group>
  );
}

function CraterHallDress() {
  return (
    <group>
      {[-52, -88, -128, -168].map((z, i) => (
        <mesh key={i} position={[i % 2 ? 14 : -14, 0.05, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.6, 10]} />
          <meshLambertMaterial color="#c05018" emissive="#e07030" emissiveIntensity={0.45} />
        </mesh>
      ))}
    </group>
  );
}

function LakeHallDress() {
  return (
    <group>
      {[-44, -78, -118, -162].map((z, i) => (
        <mesh key={i} position={[i % 2 ? -12 : 10, 0.04, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[2.1, 12]} />
          <meshLambertMaterial color="#1a4a68" transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function GraveHallDress() {
  return (
    <group>
      {[-56, -94, -136, -174].map((z, i) => (
        <mesh key={i} position={[i % 2 ? 16 : -16, 1.1, z]} rotation={[0, i * 0.4, 0]}>
          <boxGeometry args={[0.7, 2.2, 0.22]} />
          <meshLambertMaterial color="#c8d0d8" />
        </mesh>
      ))}
    </group>
  );
}

function WasteHallDress() {
  return (
    <group>
      {[-48, -82, -122, -166].map((z, i) => (
        <mesh key={i} position={[i % 2 ? -15 : 15, 0.35, z]} scale={[1.8, 0.7, 1.6]}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshLambertMaterial color="#c4a060" />
        </mesh>
      ))}
    </group>
  );
}

function EchoHallDress() {
  return (
    <group>
      {[-60, -100, -140, -178].map((z, i) => (
        <mesh key={i} position={[i % 2 ? 12 : -12, 1.35, z]} rotation={[0, i * 0.6, 0.08]}>
          <boxGeometry args={[1.6, 2.6, 0.4]} />
          <meshLambertMaterial color="#6a5a88" emissive="#3a2860" emissiveIntensity={0.35} />
        </mesh>
      ))}
    </group>
  );
}

function Torch({ x, z, color }: { x: number; z: number; color: string }) {
  const flame = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!flame.current) return;
    const u = 0.7 + Math.sin(clock.elapsedTime * 9 + x) * 0.2;
    flame.current.scale.setScalar(u);
  });
  return (
    <group position={[x, 3.4, z]}>
      <mesh>
        <cylinderGeometry args={[0.06, 0.08, 0.7, 6]} />
        <meshLambertMaterial color="#4a3220" />
      </mesh>
      <mesh ref={flame} position={[0, 0.45, 0]}>
        <sphereGeometry args={[0.12, 6, 5]} />
        <meshLambertMaterial color="#e07038" emissive="#e07038" emissiveIntensity={1.4} />
      </mesh>
      <pointLight color={color} intensity={4} distance={8} />
    </group>
  );
}

export const CAVERN_RUBY = { x: 0, z: 16 - (LONG_ROOMS - 1) * DUNGEON_ROOM };
export const MARSH_SAPPHIRE = { x: 0, z: 16 - (LONG_ROOMS - 1) * DUNGEON_ROOM };

export function DungeonGem({ worldId }: { worldId: WorldId }) {
  const gems = useGame((s) => s.gems);
  const glow = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (glow.current) glow.current.emissiveIntensity = 0.55 + Math.sin(clock.elapsedTime * 2.4) * 0.28;
  });
  const spot =
    worldId === "cavern" && !gems.ruby
      ? { x: CAVERN_RUBY.x, z: CAVERN_RUBY.z, color: "#c42838", emissive: "#e04040" }
      : worldId === "marsh" && !gems.sapphire
        ? { x: MARSH_SAPPHIRE.x, z: MARSH_SAPPHIRE.z, color: "#2a58c8", emissive: "#3a70e0" }
        : null;
  if (!spot) return null;
  const y = heightAt(spot.x, spot.z);
  return (
    <group position={[spot.x, y, spot.z]}>
      <mesh position={[0, 0.22, 0]} receiveShadow>
        <cylinderGeometry args={[0.7, 0.85, 0.42, 8]} />
        <meshLambertMaterial color="#4a3a28" />
      </mesh>
      <mesh position={[0, 0.52, 0]}>
        <cylinderGeometry args={[0.42, 0.5, 0.22, 8]} />
        <meshLambertMaterial color="#6a5040" />
      </mesh>
      <mesh position={[0, 1.15, 0]} rotation={[0, Math.PI / 5, 0]}>
        <octahedronGeometry args={[0.38, 0]} />
        <meshStandardMaterial ref={glow} color={spot.color} emissive={spot.emissive} emissiveIntensity={0.7} />
      </mesh>
      <pointLight color={spot.emissive} intensity={5} distance={7} position={[0, 1.4, 0]} />
    </group>
  );
}
