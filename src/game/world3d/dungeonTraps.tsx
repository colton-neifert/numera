import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { WorldId } from "../types";
import { isDungeon } from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { consumeTalk as consumeTalkRaw } from "../input";
import { roomZ } from "./dungeonLayout";
import { CavernCombine, FarGap } from "./cavernDungeon";

/**
 * Real-life dungeon physics — water over spikes, a log you roll for a bridge,
 * a crate as a step, a rope you cut, fire you put out with water, ice you slide on.
 * No random gags. Things a person would actually try.
 */

type Spot = { x: number; z: number; r: number; h: number };

const spots: Spot[] = [];
let sink = 0;
let icy = false;

export function trapHeight(x: number, z: number) {
  let y = 0;
  for (const s of spots) {
    if (Math.hypot(x - s.x, z - s.z) < s.r) y = Math.max(y, s.h);
  }
  return y;
}

export function trapSink() {
  return sink;
}

export function onIce() {
  return icy;
}

function addSpot(x: number, z: number, r: number, h: number) {
  spots.push({ x, z, r, h });
}

export function addTrapSpot(x: number, z: number, r: number, h: number) {
  addSpot(x, z, r, h);
}

export function beginTrapFrame() {
  spots.length = 0;
  sink = 0;
  icy = false;
}

function take(n: number, key: string) {
  if (live.smashed[key]) return;
  live.smashed[key] = true;
  const c = useGame.getState().addCoins(n);
  if (c > 0) revealItem("coin");
  sfx.ok();
}

function talkOk() {
  if (live.nearNpc || live.nearChest || live.nearHouse || live.nearGate || live.nearCave) return false;
  return consumeTalkRaw();
}

/** Pit sits in hall 1, right after the first door, blocking the way north (−Z). */
export const PIT = {
  x: 0,
  z: -18,
  hx: 46.4,
  hz: 8.2,
};

const LOG_LEN = 17.4;
const LOG_RAD = 0.52;

export function inPit(x: number, z: number, pad = 0) {
  return Math.abs(x - PIT.x) < PIT.hx + pad && Math.abs(z - PIT.z) < PIT.hz + pad;
}

export function logCovers(lx: number, lz: number, px: number, pz: number) {
  return Math.abs(px - lx) < LOG_RAD + 0.38 && Math.abs(pz - lz) < LOG_LEN * 0.5;
}

type Kind = "water" | "rope" | "fire" | "ice" | "none";

function kindFor(world: WorldId): Kind {
  if (world === "cavern" || world === "marsh" || world === "lake" || world === "fen") return "water";
  if (world === "grove" || world === "ridge") return "rope";
  if (world === "crater" || world === "hollow") return "fire";
  if (world === "grave" || world === "spire") return "ice";
  return "none";
}

export function DungeonTraps({ worldId }: { worldId: WorldId }) {
  if (!isDungeon(worldId)) return null;
  const kind = kindFor(worldId);
  return (
    <group>
      <TrapBegin />
      {kind === "water" ? <WaterSpikeLog worldId={worldId} /> : null}
      {kind === "rope" ? <RopePlank worldId={worldId} /> : null}
      {kind === "fire" ? <FireAndBucket worldId={worldId} /> : null}
      {kind === "ice" ? <IceHall /> : null}
      {worldId === "cavern" ? <CrateLedge z={roomZ(3)} /> : null}
      {worldId === "marsh" ? <CrateLedge z={roomZ(2)} /> : null}
      {worldId === "cavern" ? <WeightGate east /> : null}
      {worldId === "cavern" ? <FarGap /> : null}
      {worldId === "cavern" ? <CavernCombine /> : null}
    </group>
  );
}

function TrapBegin() {
  useEffect(() => () => {
    spots.length = 0;
    sink = 0;
    icy = false;
  }, []);
  useFrame(() => {
    beginTrapFrame();
  }, -3);
  return null;
}

function WaterSpikeLog({ worldId }: { worldId: WorldId }) {
  const log = useRef({
    x: 0,
    z: PIT.z + PIT.hz + 3.4,
    vx: 0,
    vz: 0,
    spin: 0,
    bridge: false,
  });
  const g = useRef<THREE.Group>(null);
  const water = useRef<THREE.Mesh>(null);
  const cool = useRef(0);
  const wet = worldId === "marsh" || worldId === "fen" ? "#2a6a58" : "#2a5a78";

  useFrame((_, dt) => {
    cool.current = Math.max(0, cool.current - dt);
    const p = log.current;
    const along = Math.abs(live.z - p.z);
    const across = Math.abs(live.x - p.x);
    const onLog = across < LOG_RAD + 0.42 && along < LOG_LEN * 0.52;

    if (!p.bridge && !live.mounted && Math.abs(live.speed) > 1.1 && across < 1.15 && along < LOG_LEN * 0.52) {
      const fx = -Math.sin(live.yaw);
      const fz = -Math.cos(live.yaw);
      const into = fx * (p.x - live.x) + fz * (p.z - live.z) > -0.05;
      if (into) {
        p.vx += fx * Math.min(14, 5 + Math.abs(live.speed)) * dt * 18;
        p.vz += fz * Math.min(14, 5 + Math.abs(live.speed)) * dt * 18;
      }
    }

    if (!p.bridge) {
      p.x += p.vx * dt;
      p.z += p.vz * dt;
      p.vx *= Math.exp(-dt * 1.6);
      p.vz *= Math.exp(-dt * 1.6);
      p.spin += Math.hypot(p.vx, p.vz) * dt * 1.35;
      p.x = Math.max(-8, Math.min(8, p.x));
      p.z = Math.max(PIT.z - PIT.hz - 1.2, Math.min(PIT.z + PIT.hz + 6.4, p.z));
      if (inPit(p.x, p.z, -0.6) && Math.hypot(p.vx, p.vz) < 2.4) {
        p.z = PIT.z;
        p.vx = 0;
        p.vz = 0;
        p.bridge = true;
        sfx.thud();
        take(6, `logbridge-${worldId}`);
      }
    }

    const logY = p.bridge ? 0.38 : 0.52;
    if (onLog && (p.bridge || !inPit(live.x, live.z) || inPit(p.x, p.z, 0.2))) {
      for (let t = -0.46; t <= 0.46; t += 0.12) {
        addSpot(p.x, p.z + t * LOG_LEN, LOG_RAD + 0.42, logY);
      }
    }

    if (inPit(live.x, live.z) && !onLog && !live.god && !live.balloonRide) {
      sink = -2.15;
      if (live.y < -0.45 && cool.current <= 0) {
        cool.current = 1.15;
        sfx.splash();
        sfx.ouch();
        useGame.getState().hurtField(8, true);
        const south = live.z >= PIT.z;
        live.z = south ? PIT.z + PIT.hz + 1.55 : PIT.z - PIT.hz - 1.55;
        live.y = 0.15;
        live.knock = { vx: 0, vz: south ? 16 : -16, t: 0.38 };
        live.listen = "The water hid the points.";
      }
    } else if (inPit(live.x, live.z, 2.4) && !onLog) {
      live.listen = live.listen || "Water. The bottom is not kind.";
    }

    if (g.current) {
      g.current.position.set(p.x, logY, p.z);
      g.current.rotation.x = p.spin;
    }
    if (water.current) {
      water.current.position.y = 0.1 + Math.sin(live.playT * 1.6) * 0.03;
    }
    live.logAt = { x: p.x, z: p.z };
  }, -2);

  const spikes: [number, number][] = [];
  for (let ix = -8; ix <= 8; ix++) {
    for (let iz = -2; iz <= 2; iz++) {
      spikes.push([ix * 5.1 + (iz % 2) * 1.4, iz * 3.05]);
    }
  }

  return (
    <group>
      <mesh position={[PIT.x, -1.22, PIT.z]} receiveShadow>
        <boxGeometry args={[PIT.hx * 2, 2.4, PIT.hz * 2]} />
        <meshLambertMaterial color="#1a1816" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={`rz${s}`} position={[PIT.x, 0.22, PIT.z + s * PIT.hz]} receiveShadow>
          <boxGeometry args={[PIT.hx * 2 + 0.8, 0.44, 0.7]} />
          <meshLambertMaterial color="#5a4a38" />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`rx${s}`} position={[PIT.x + s * PIT.hx, 0.22, PIT.z]} receiveShadow>
          <boxGeometry args={[0.7, 0.44, PIT.hz * 2]} />
          <meshLambertMaterial color="#5a4a38" />
        </mesh>
      ))}
      <mesh ref={water} position={[PIT.x, 0.1, PIT.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[PIT.hx * 2 - 0.6, PIT.hz * 2 - 0.5]} />
        <meshLambertMaterial color={wet} transparent opacity={0.58} depthWrite={false} />
      </mesh>
      {spikes.map(([sx, sz], i) => (
        <mesh key={i} position={[PIT.x + sx, -1.55, PIT.z + sz]} castShadow>
          <coneGeometry args={[0.16, 0.85, 5]} />
          <meshLambertMaterial color="#6a6458" />
        </mesh>
      ))}
      <group ref={g} position={[0, 0.52, PIT.z + PIT.hz + 3.4]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[LOG_RAD, LOG_RAD * 0.96, LOG_LEN, 8]} />
          <meshLambertMaterial color="#6a4a28" />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0, 0, s * (LOG_LEN * 0.5 - 0.04)]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[LOG_RAD + 0.02, LOG_RAD + 0.02, 0.08, 8]} />
            <meshLambertMaterial color="#4a3220" />
          </mesh>
        ))}
        {[-0.7, 0, 0.7].map((t, i) => (
          <mesh key={i} position={[0, LOG_RAD * 0.7, t * LOG_LEN * 0.28]} rotation={[0.2, 0.4, 0.1]}>
            <boxGeometry args={[0.06, 0.05, 1.1]} />
            <meshLambertMaterial color="#4a3220" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function RopePlank({ worldId }: { worldId: WorldId }) {
  const cut = useRef(false);
  const drop = useRef(0);
  const cool = useRef(0);
  const rope = { x: 0, z: PIT.z + PIT.hz + 0.4 };

  useFrame((_, dt) => {
    cool.current = Math.max(0, cool.current - dt);
    if (!cut.current && live.slash && Math.hypot(live.slash.x - rope.x, live.slash.z - rope.z) < 2.2) {
      cut.current = true;
      sfx.chop();
      live.slash = null;
    }
    if (cut.current && drop.current < 1) drop.current = Math.min(1, drop.current + dt * 1.7);
    const fallen = drop.current >= 0.98;
    if (fallen) {
      for (let t = -0.46; t <= 0.46; t += 0.12) {
        addSpot(0, PIT.z + t * LOG_LEN * 0.92, 0.85, 0.42);
      }
    }
    const onBoard = Math.abs(live.x) < 0.95 && Math.abs(live.z - PIT.z) < PIT.hz + 0.4;
    if (inPit(live.x, live.z) && !(fallen && onBoard) && !live.god) {
      sink = -2.15;
      if (live.y < -0.45 && cool.current <= 0) {
        cool.current = 1.15;
        sfx.ouch();
        useGame.getState().hurtField(8, true);
        const south = live.z >= PIT.z;
        live.z = south ? PIT.z + PIT.hz + 1.55 : PIT.z - PIT.hz - 1.55;
        live.y = 0.15;
        live.knock = { vx: 0, vz: south ? 16 : -16, t: 0.38 };
        live.listen = "The floor was a hole.";
      }
    } else if (inPit(live.x, live.z, 2.2) && !fallen) {
      live.listen = live.listen || "A board hangs. The rope is holding it.";
    }
    if (fallen) take(6, `ropeplank-${worldId}`);
  }, -2);

  const t = drop.current;
  const plankRot = (1 - t) * (-Math.PI / 2);
  const plankY = 4.8 * (1 - t) + 0.38 * t;
  const plankZ = THREE.MathUtils.lerp(rope.z, PIT.z, t);
  const spikes: [number, number][] = [];
  for (let ix = -8; ix <= 8; ix++) {
    for (let iz = -2; iz <= 2; iz++) spikes.push([ix * 5.1, iz * 3.05]);
  }

  return (
    <group>
      <mesh position={[PIT.x, -1.22, PIT.z]}>
        <boxGeometry args={[PIT.hx * 2, 2.4, PIT.hz * 2]} />
        <meshLambertMaterial color="#1a1816" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[PIT.x, 0.22, PIT.z + s * PIT.hz]}>
          <boxGeometry args={[PIT.hx * 2 + 0.8, 0.44, 0.7]} />
          <meshLambertMaterial color="#5a4a38" />
        </mesh>
      ))}
      {spikes.map(([sx, sz], i) => (
        <mesh key={i} position={[PIT.x + sx, -1.55, PIT.z + sz]}>
          <coneGeometry args={[0.16, 0.85, 5]} />
          <meshLambertMaterial color="#6a6458" />
        </mesh>
      ))}
      {!cut.current ? (
        <mesh position={[rope.x, 3.6, rope.z]}>
          <cylinderGeometry args={[0.035, 0.035, 5.4, 5]} />
          <meshLambertMaterial color="#c9a227" />
        </mesh>
      ) : null}
      <mesh position={[0, plankY, plankZ]} rotation={[plankRot, 0, 0]} castShadow>
        <boxGeometry args={[1.15, 0.16, LOG_LEN * 0.92]} />
        <meshLambertMaterial color="#8a6a40" />
      </mesh>
    </group>
  );
}

function FireAndBucket({ worldId }: { worldId: WorldId }) {
  const fireOn = useRef(true);
  const bucket = useRef({ x: -16.4, z: PIT.z + PIT.hz + 4.2, held: 0 as 0 | 1 | 2 });
  const pool = { x: -16.4, z: PIT.z + PIT.hz + 5.6 };
  const flame = useRef<THREE.Group>(null);
  const pail = useRef<THREE.Group>(null);
  const cool = useRef(0);

  useFrame((_, dt) => {
    cool.current = Math.max(0, cool.current - dt);
    const b = bucket.current;
    live.bucket = b.held;
    const nearB = Math.hypot(live.x - b.x, live.z - b.z) < 1.35;
    const nearP = Math.hypot(live.x - pool.x, live.z - pool.z) < 1.55;
    const nearF = Math.abs(live.z - PIT.z) < 2.4 && Math.abs(live.x) < PIT.hx;

    if (nearP) {
      live.wetT = Math.max(live.wetT, 4);
      if (b.held === 1) {
        b.held = 2;
        sfx.splash();
        live.listen = "The bucket is full.";
      }
    }
    if (b.held === 0 && nearB && talkOk()) {
      b.held = 1;
      sfx.ok();
      live.listen = "A bucket.";
    }
    if (fireOn.current && b.held === 2 && nearF && talkOk()) {
      fireOn.current = false;
      b.held = 1;
      sfx.sizzle();
      take(8, `fireout-${worldId}`);
      live.listen = "The fire went out.";
    }
    if (fireOn.current && nearF && live.wetT > 0.8) {
      fireOn.current = false;
      sfx.sizzle();
      take(8, `firewet-${worldId}`);
      live.listen = "Wet boots. The fire did not like that.";
    }
    const boom = live.lastBoom;
    if (fireOn.current && boom && Math.hypot(boom.x - pool.x, boom.z - pool.z) < 2.6) {
      fireOn.current = false;
      sfx.sizzle();
      take(8, `firesplash-${worldId}`);
    }
    if (fireOn.current && nearF && Math.abs(live.z - PIT.z) < 1.05 && cool.current <= 0 && !live.god) {
      cool.current = 0.9;
      sfx.sizzle();
      useGame.getState().hurtField(4, true);
      live.knock = { vx: 0, vz: live.z >= PIT.z ? 14 : -14, t: 0.32 };
      live.z += live.z >= PIT.z ? 1.2 : -1.2;
      live.listen = "Hot.";
    }
    if (nearF && fireOn.current) live.listen = live.listen || "A wall of fire. Water is on the left.";
    if (flame.current) flame.current.visible = fireOn.current;
    if (b.held > 0) {
      b.x = live.x - Math.sin(live.yaw) * 0.55;
      b.z = live.z - Math.cos(live.yaw) * 0.55;
    }
    if (pail.current) pail.current.position.set(b.x, b.held ? live.y + 0.72 : 0.28, b.z);
  }, -2);

  const b = bucket.current;
  return (
    <group>
      <mesh position={[pool.x, 0.04, pool.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.15, 12]} />
        <meshLambertMaterial color="#2a5a78" transparent opacity={0.7} />
      </mesh>
      <mesh position={[pool.x, 0.12, pool.z]}>
        <torusGeometry args={[1.15, 0.1, 5, 12]} />
        <meshLambertMaterial color="#5a4a38" />
      </mesh>
      <group ref={pail} position={[b.x, 0.28, b.z]}>
        <mesh>
          <cylinderGeometry args={[0.22, 0.18, 0.38, 8]} />
          <meshLambertMaterial color="#6a4a28" />
        </mesh>
        {b.held === 2 ? (
          <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.16, 8]} />
            <meshLambertMaterial color="#3a70a0" />
          </mesh>
        ) : null}
      </group>
      <group ref={flame} position={[0, 0, PIT.z]}>
        {Array.from({ length: 18 }, (_, i) => {
          const x = -42 + i * 4.9;
          return (
            <mesh key={i} position={[x, 1.15, 0]}>
              <coneGeometry args={[0.55, 2.2, 5]} />
              <meshLambertMaterial color="#e07030" emissive="#e07030" emissiveIntensity={0.85} />
            </mesh>
          );
        })}
        <pointLight color="#e07030" intensity={6} distance={18} position={[0, 2.2, 0]} />
      </group>
    </group>
  );
}

function IceHall() {
  useFrame(() => {
    icy = Math.abs(live.x) < 44 && live.z < 18 && live.z > PIT.z - PIT.hz - 22;
    if (icy && Math.abs(live.speed) > 8) live.listen = live.listen || "The floor is ice. Slow feet hold better.";
  }, -2);
  return (
    <mesh position={[0, 0.03, -6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[90, 56]} />
      <meshLambertMaterial color="#d4e4f0" transparent opacity={0.72} />
    </mesh>
  );
}

function CrateLedge({ z = roomZ(2) }: { z?: number }) {
  const crate = useRef({ x: 8.4, z: z + 4, vx: 0, vz: 0 });
  const ledge = { x: 22.4, z, y: 2.55 };
  const got = useRef(false);
  const g = useRef<THREE.Group>(null);
  const chest = useRef<THREE.Mesh>(null);

  useFrame((_, dt) => {
    const c = crate.current;
    const d = Math.hypot(live.x - c.x, live.z - c.z);
    if (!live.mounted && Math.abs(live.speed) > 0.8 && d < 1.15) {
      const fx = -Math.sin(live.yaw);
      const fz = -Math.cos(live.yaw);
      c.vx += fx * 22 * dt;
      c.vz += fz * 22 * dt;
    }
    c.x += c.vx * dt;
    c.z += c.vz * dt;
    c.vx *= Math.exp(-dt * 3.4);
    c.vz *= Math.exp(-dt * 3.4);
    c.x = Math.max(-30, Math.min(28, c.x));
    c.z = Math.max(z - 14, Math.min(z + 14, c.z));
    addSpot(c.x, c.z, 0.72, 0.95);
    addSpot(ledge.x, ledge.z, 2.35, ledge.y);
    if (g.current) g.current.position.set(c.x, 0.48, c.z);
    const onLedge = Math.hypot(live.x - ledge.x, live.z - ledge.z) < 2.2 && live.y > ledge.y - 0.4;
    if (onLedge && !got.current) {
      got.current = true;
      take(18, "crateledge");
      useGame.getState().healGrass();
      if (chest.current) chest.current.visible = false;
    }
    if (d < 2.4 && Math.abs(c.x - ledge.x) > 4) {
      live.listen = live.listen || "A wooden box. A shelf up the wall.";
    }
  }, -1);

  return (
    <group>
      <group ref={g} position={[crate.current.x, 0.48, crate.current.z]}>
        <mesh castShadow>
          <boxGeometry args={[0.95, 0.95, 0.95]} />
          <meshLambertMaterial color="#8a6a40" />
        </mesh>
        <mesh position={[0, 0.02, 0.48]}>
          <boxGeometry args={[0.7, 0.08, 0.04]} />
          <meshLambertMaterial color="#5a4a28" />
        </mesh>
      </group>
      <mesh position={[ledge.x, ledge.y * 0.5, ledge.z]} receiveShadow>
        <boxGeometry args={[4.4, ledge.y, 3.2]} />
        <meshLambertMaterial color="#5a4e42" />
      </mesh>
      {!got.current ? (
        <mesh ref={chest} position={[ledge.x, ledge.y + 0.45, ledge.z]} castShadow>
          <boxGeometry args={[0.7, 0.55, 0.5]} />
          <meshLambertMaterial color="#c9a227" />
        </mesh>
      ) : null}
    </group>
  );
}

function WeightGate({ east = false }: { east?: boolean }) {
  const z = east ? roomZ(2) : roomZ(1) - 18;
  const plate = { x: east ? 42 : -22.4, z };
  const crate = useRef({ x: east ? 34 : -16.2, z: z + 5.2, vx: 0, vz: 0 });
  const bars = useRef<THREE.Group>(null);
  const open = useRef(0);
  const got = useRef(false);
  const chest = { x: east ? 60 : -28.6, z };
  const cg = useRef<THREE.Group>(null);
  const barX = east ? 52 : -25.4;
  const crateMinX = east ? 28 : -32;
  const crateMaxX = east ? 62 : -8;

  useFrame((_, dt) => {
    const c = crate.current;
    const d = Math.hypot(live.x - c.x, live.z - c.z);
    if (!live.mounted && Math.abs(live.speed) > 0.7 && d < 1.12) {
      const fx = -Math.sin(live.yaw);
      const fz = -Math.cos(live.yaw);
      c.vx += fx * 22 * dt;
      c.vz += fz * 22 * dt;
    }
    c.x += c.vx * dt;
    c.z += c.vz * dt;
    c.vx *= Math.exp(-dt * 3.2);
    c.vz *= Math.exp(-dt * 3.2);
    c.x = Math.max(crateMinX, Math.min(crateMaxX, c.x));
    c.z = Math.max(z - 8, Math.min(z + 8, c.z));
    addSpot(c.x, c.z, 0.7, 0.95);
    if (cg.current) cg.current.position.set(c.x, 0.48, c.z);
    const onPlate =
      Math.hypot(live.x - plate.x, live.z - plate.z) < 0.95 || Math.hypot(c.x - plate.x, c.z - plate.z) < 0.95;
    open.current += ((onPlate ? 1 : 0) - open.current) * (1 - Math.exp(-dt * 8));
    if (bars.current) bars.current.position.y = 1.6 + open.current * 2.6;
    const through = open.current > 0.55 && Math.hypot(live.x - chest.x, live.z - chest.z) < 1.4;
    if (through && !got.current) {
      got.current = true;
      take(16, "weightgate");
    }
    if (d < 2.2 || Math.hypot(live.x - plate.x, live.z - plate.z) < 1.8) {
      live.listen = live.listen || "A floor plate. The bars drop when it is heavy.";
    }
    if (open.current < 0.4 && Math.abs(live.x - barX) < 1.2 && Math.abs(live.z - z) < 1.4) {
      live.x = barX + (east ? -1.4 : 1.2);
    }
  }, -1);

  return (
    <group>
      <mesh position={[plate.x, 0.04, plate.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.95, 12]} />
        <meshLambertMaterial color="#8a7a48" />
      </mesh>
      <group ref={cg} position={[crate.current.x, 0.48, crate.current.z]}>
        <mesh castShadow>
          <boxGeometry args={[0.95, 0.95, 0.95]} />
          <meshLambertMaterial color="#7a5a38" />
        </mesh>
      </group>
      <group ref={bars} position={[barX, 1.6, z]}>
        {[-0.7, -0.25, 0.25, 0.7].map((x) => (
          <mesh key={x} position={[x, 0, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 3.1, 6]} />
            <meshLambertMaterial color="#6a6458" />
          </mesh>
        ))}
      </group>
      {!got.current ? (
        <mesh position={[chest.x, 0.4, chest.z]} castShadow>
          <boxGeometry args={[0.7, 0.55, 0.5]} />
          <meshLambertMaterial color="#c9a227" />
        </mesh>
      ) : null}
    </group>
  );
}

