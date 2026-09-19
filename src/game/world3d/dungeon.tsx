import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { WorldId } from "../types";
import { isDungeon, isDeepDungeon, WORLD_TINT, heightAt } from "./field";
import { useGame } from "../store";
import { live } from "./live";
import { sfx } from "../audio";
import { DUNGEON_ROOM, HALL_HALF, dungeonRoomCount, dungeonSpan, lastRoomZ, roomCenters, roomZ, splitZ, cavernWalls } from "./dungeonLayout";
import { CavernRooms } from "./cavernDungeon";

export type Wall = { x: number; z: number; w: number; d: number };

export { DUNGEON_ROOM, lastRoomZ, roomZ } from "./dungeonLayout";

function splitDoor(z: number): Wall[] {
  const gap = 4.3;
  const outer = HALL_HALF;
  const w = outer - gap;
  const cx = (outer + gap) * 0.5;
  return [
    { x: -cx, z, w, d: 1.18 },
    { x: cx, z, w, d: 1.18 },
  ];
}

function chainWalls(rooms: number): Wall[] {
  const zMax = 28.4;
  const zMin = zMax - rooms * DUNGEON_ROOM;
  const mid = (zMax + zMin) * 0.5;
  const depth = zMax - zMin;
  const walls: Wall[] = [
    { x: 0, z: zMax, w: HALL_HALF * 2 + 2, d: 1.35 },
    { x: 0, z: zMin, w: HALL_HALF * 2 + 2, d: 1.35 },
    { x: HALL_HALF, z: mid, w: 1.35, d: depth + 2 },
    { x: -HALL_HALF, z: mid, w: 1.35, d: depth + 2 },
  ];
  for (let i = 0; i < rooms - 1; i++) walls.push(...splitDoor(splitZ(i)));
  return walls;
}

const WALLS = new Map<number, Wall[]>();

function wallsFor(rooms: number) {
  let w = WALLS.get(rooms);
  if (!w) {
    w = chainWalls(rooms);
    WALLS.set(rooms, w);
  }
  return w;
}

export function dungeonWalls(world: WorldId): Wall[] {
  if (!isDungeon(world)) return [];
  if (world === "cavern") return cavernWalls();
  return wallsFor(dungeonRoomCount(world));
}

export function dungeonBounds(world?: WorldId): { x: number; zMin: number; zMax: number } {
  if (world && isDungeon(world)) return dungeonSpan(world);
  return { x: 39.4, zMin: -43.2, zMax: 35.2 };
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
  if (world === "keep") {
    const r = 15.4;
    const d = Math.hypot(x, z);
    if (d > r) {
      x *= r / d;
      z *= r / d;
    }
    return { x, z };
  }
  const b = dungeonBounds(world);
  let nx = Math.max(-b.x, Math.min(b.x, x));
  let nz = Math.max(b.zMin, Math.min(b.zMax, z));
  const walls = world ? dungeonWalls(world) : [];
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
  if (world && isDungeon(world)) {
    const rooms = roomCenters(dungeonRoomCount(world));
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
  const rooms = dungeonRoomCount(worldId);
  const depth = rooms * DUNGEON_ROOM;
  const floorZ = 28.4 - depth * 0.5;
  const floorW = worldId === "cavern" ? 148 : HALL_HALF * 2 + 8;
  const floorSize: [number, number] = [floorW, depth + 24];
  const centers = roomCenters(rooms);
  const walls = dungeonWalls(worldId);
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
      {walls.map((w, i) => (
        <mesh key={i} position={[w.x, 4.4, w.z]} castShadow receiveShadow>
          <boxGeometry args={[w.w, 9.0, w.d]} />
          <meshLambertMaterial color={i < 4 ? wall : worldId === "cavern" ? wall : floor} />
        </mesh>
      ))}
      {worldId === "cavern" ? (
        <CavernRooms />
      ) : (
        <>
          {centers.map((z, i) => (
            <RoomDress key={i} worldId={worldId} z={z} i={i} tint={tint} cave={cave} />
          ))}
          {[-HALL_HALF + 2.2, HALL_HALF - 2.2].map((x) =>
            centers.map((z) => <Torch key={`${x}-${z}`} x={x} z={z} color={torch} />),
          )}
        </>
      )}
      {cave && worldId !== "cavern" ? <CaveDripsLive /> : null}
      <ambientLight intensity={worldId === "cavern" ? 0.48 : cave ? 0.32 : 0.62} color={cave ? "#c8b090" : "#f0e4c8"} />
      <hemisphereLight args={[torch, cave ? "#1a1410" : "#2a2018", worldId === "cavern" ? 0.7 : cave ? 0.5 : 0.85]} />
    </group>
  );
}

function RoomDress({
  worldId,
  z,
  i,
  tint,
  cave,
}: {
  worldId: WorldId;
  z: number;
  i: number;
  tint: { grass: string; leaf: string };
  cave: boolean;
}) {
  const side = i % 2 ? 1 : -1;
  const px = side * 22;
  return (
    <group>
      <mesh position={[px, 8.2, z + 8]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[0.34 + (i % 3) * 0.08, 1.6 + (i % 2) * 0.5, 7]} />
        <meshLambertMaterial color={cave ? "#5a4e42" : tint.leaf} />
      </mesh>
      {cave ? (
        <mesh position={[-px * 0.4, 0.03, z - 6]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.4, 12]} />
          <meshLambertMaterial color="#2a4a58" transparent opacity={0.72} />
        </mesh>
      ) : null}
      {worldId === "marsh" || worldId === "fen" ? (
        <mesh position={[px * 0.35, 0.04, z - 4]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.6, 12]} />
          <meshLambertMaterial color="#2a6a58" transparent opacity={0.62} />
        </mesh>
      ) : null}
      {worldId === "grove" || worldId === "ridge" ? (
        <mesh position={[-px * 0.5, 0.04, z + 6]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[2.1, 10]} />
          <meshLambertMaterial color="#2a4a22" />
        </mesh>
      ) : null}
      {worldId === "crater" || worldId === "hollow" ? (
        <mesh position={[px * 0.45, 0.05, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.3, 10]} />
          <meshLambertMaterial color="#c05018" emissive="#e07030" emissiveIntensity={0.4} />
        </mesh>
      ) : null}
      {worldId === "lake" ? (
        <mesh position={[-px * 0.4, 0.04, z - 5]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.9, 12]} />
          <meshLambertMaterial color="#1a4a68" transparent opacity={0.7} />
        </mesh>
      ) : null}
      {worldId === "grave" || worldId === "spire" ? (
        <mesh position={[px, 1.1, z + 10]} rotation={[0, i * 0.4, 0]}>
          <boxGeometry args={[0.7, 2.2, 0.22]} />
          <meshLambertMaterial color="#c8d0d8" />
        </mesh>
      ) : null}
      {worldId === "waste" ? (
        <mesh position={[px, 0.35, z + 9]} scale={[1.6, 0.65, 1.4]}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshLambertMaterial color="#c4a060" />
        </mesh>
      ) : null}
      {worldId === "echo" || worldId === "vault" ? (
        <mesh position={[px, 1.35, z + 9]} rotation={[0, i * 0.6, 0.08]}>
          <boxGeometry args={[1.4, 2.4, 0.35]} />
          <meshLambertMaterial color="#6a5a88" emissive="#3a2860" emissiveIntensity={0.35} />
        </mesh>
      ) : null}
      <mesh position={[-px, 0.55, z + 11]} scale={[1.4, 1.0, 1.2]} castShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshLambertMaterial color={cave ? "#5a4a3c" : tint.leaf} />
      </mesh>
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

function CaveDripsLive() {
  const g = useRef<THREE.Group>(null);
  const drops = useRef(
    [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({
      x: ((i % 4) - 1.5) * 8,
      z: roomZ(i % 8) + (i % 3) * 4,
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

export const CAVERN_RUBY = { x: 0, z: lastRoomZ("cavern") };
export const MARSH_SAPPHIRE = { x: 0, z: lastRoomZ("marsh") };

export function dungeonPrizeAt(world: WorldId) {
  return { x: 0, z: lastRoomZ(world) };
}

export function DungeonGem({ worldId }: { worldId: WorldId }) {
  const gems = useGame((s) => s.gems);
  const glow = useRef<THREE.MeshLambertMaterial>(null);
  useFrame(({ clock }) => {
    if (glow.current) glow.current.emissiveIntensity = 0.55 + Math.sin(clock.elapsedTime * 2.4) * 0.28;
  });
  const spot =
    worldId === "cavern" && !gems.emerald
      ? { x: 0, z: lastRoomZ(worldId) - 14, color: "#e07a28", emissive: "#e89840" }
      : worldId === "marsh" && !gems.sapphire
        ? { x: 0, z: lastRoomZ(worldId), color: "#2a58c8", emissive: "#3a70e0" }
        : worldId === "crater" && !gems.ruby
          ? { x: 0, z: lastRoomZ(worldId), color: "#c42838", emissive: "#e04040" }
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
        <meshLambertMaterial ref={glow} color={spot.color} emissive={spot.emissive} emissiveIntensity={0.7} />
      </mesh>
      <pointLight color={spot.emissive} intensity={5} distance={7} position={[0, 1.4, 0]} />
    </group>
  );
}

export function DungeonAltar({ worldId }: { worldId: WorldId }) {
  if (!isDungeon(worldId)) return null;
  if (worldId === "cavern" || worldId === "marsh" || worldId === "crater") return null;
  const z = lastRoomZ(worldId);
  const glow = useRef<THREE.MeshLambertMaterial>(null);
  useFrame(({ clock }) => {
    if (glow.current) glow.current.emissiveIntensity = 0.45 + Math.sin(clock.elapsedTime * 2.1) * 0.25;
  });
  const color = isDeepDungeon(worldId) ? "#c9a227" : "#7ad0e8";
  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, 0.22, 0]} receiveShadow>
        <cylinderGeometry args={[0.85, 1.0, 0.44, 8]} />
        <meshLambertMaterial color="#4a3a28" />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.9, 8]} />
        <meshLambertMaterial ref={glow} color={color} emissive={color} emissiveIntensity={0.55} />
      </mesh>
      <pointLight color={color} intensity={4.2} distance={7} position={[0, 1.4, 0]} />
    </group>
  );
}
