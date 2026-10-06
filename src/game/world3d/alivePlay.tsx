import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  heightAt,
  TREE_HOME,
  LOOK_AT,
  POND,
  pondSurfaceY,
  KEEP_Z,
} from "./field";
import { inVillage } from "./village";
import { live } from "./live";
import { lamb } from "./mats";
import { Near } from "./nearMount";
import { puffAt } from "./fx";
import { addTrapSpot } from "./dungeonTraps";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";

/** Creek hollow west of home — boulders hide a nook. */
export const CREEK_HOLLOW = { x: TREE_HOME.x - 14.8, z: TREE_HOME.z + 22.4 };
/** Quiet ledge west of Sunset Hill. */
export const CLIFF_NOOK = { x: LOOK_AT.x - 16.4, z: LOOK_AT.z + 9.2 };
/** Fern gap between home and the elder oak. */
export const FERN_GAP = { x: TREE_HOME.x - 9.2, z: TREE_HOME.z + 30.6 };
/** Tiny pond islet — stepping stones, no sign. */
export const POND_ISLE = { x: POND.x + 1.4, z: POND.z - 3.2 };

export const ALIVE_LOOKS: { x: number; z: number; r: number }[] = [
  { x: CREEK_HOLLOW.x, z: CREEK_HOLLOW.z, r: 16 },
  { x: CLIFF_NOOK.x, z: CLIFF_NOOK.z, r: 14 },
  { x: POND_ISLE.x, z: POND_ISLE.z, r: 12 },
  { x: FERN_GAP.x, z: FERN_GAP.z, r: 10 },
];

const HOLLOW_ROCKS: [number, number, number][] = [
  [1.85, 0.2, 0.55],
  [-0.35, 1.95, 0.7],
  [-1.95, 0.15, 0.62],
  [-0.55, -1.85, 0.5],
  [1.45, -1.35, 0.48],
];

export function collideAlive(nx: number, nz: number): { x: number; z: number } | null {
  const hits: [number, number, number][] = HOLLOW_ROCKS.map(([ox, oz, r]) => [
    CREEK_HOLLOW.x + ox,
    CREEK_HOLLOW.z + oz,
    r + 0.35,
  ]);
  hits.push([CLIFF_NOOK.x + 1.1, CLIFF_NOOK.z - 0.4, 0.85]);
  let x = nx;
  let z = nz;
  let hit = false;
  for (const [cx, cz, r] of hits) {
    const dx = x - cx;
    const dz = z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 < r * r && d2 > 1e-6) {
      const d = Math.sqrt(d2);
      x = cx + (dx / d) * r;
      z = cz + (dz / d) * r;
      hit = true;
    }
  }
  return hit ? { x, z } : null;
}

function pay(n: number, key: string) {
  if (live.smashed[key]) return;
  live.smashed[key] = true;
  if (n > 0) {
    const c = useGame.getState().addCoins(n);
    if (c > 0) revealItem("coin");
    sfx.ok();
  }
}

export function AlivePlay() {
  return (
    <group>
      <NoticeDirector />
      <CreekHollow />
      <CliffNook />
      <FernGap />
      <PondSteps />
      <BirdFlush />
      <PathFox />
      <NightPulse />
      <FarFall />
    </group>
  );
}

function NoticeDirector() {
  useFrame(() => {
    if (live.house || live.dungeon) {
      live.fangNotice = null;
      return;
    }
    const spots = [
      { id: "creekHollow", x: CREEK_HOLLOW.x, z: CREEK_HOLLOW.z, r: 20 },
      { id: "cliffNook", x: CLIFF_NOOK.x, z: CLIFF_NOOK.z, r: 18 },
      { id: "pondIsle", x: POND_ISLE.x, z: POND_ISLE.z, r: 14 },
    ];
    let best: { id: string; x: number; z: number; d: number } | null = null;
    for (const s of spots) {
      if (live.smashed[s.id]) continue;
      const d = Math.hypot(live.x - s.x, live.z - s.z);
      if (d < s.r && d > 2.4 && (!best || d < best.d)) best = { id: s.id, x: s.x, z: s.z, d };
    }
    live.fangNotice = best ? { id: best.id, x: best.x, z: best.z } : null;
    if (best && best.d < 12) {
      live.fangLookX = best.x;
      live.fangLookZ = best.z;
      live.fangLookT = 1.6;
    }
  });
  return null;
}

function CreekHollow() {
  const y = heightAt(CREEK_HOLLOW.x, CREEK_HOLLOW.z);
  const lid = useRef<THREE.Group>(null);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - CREEK_HOLLOW.x, live.z - CREEK_HOLLOW.z);
    if (d < 1.35 && !live.smashed.creekHollow) {
      pay(14, "creekHollow");
      live.banner = "A Hidden Hollow";
    }
    if (lid.current) lid.current.rotation.x = live.smashed.creekHollow ? -0.85 : 0;
  });
  return (
    <Near x={CREEK_HOLLOW.x} z={CREEK_HOLLOW.z} r={42}>
      <group position={[CREEK_HOLLOW.x, y, CREEK_HOLLOW.z]}>
        {HOLLOW_ROCKS.map(([ox, oz, r], i) => (
          <mesh key={i} position={[ox, r * 0.55, oz]} scale={[1, 0.72, 1.1]} castShadow>
            <sphereGeometry args={[r, 7, 5]} />
            {lamb(i % 2 ? "#6a6458" : "#7a7468", { kind: "stone" })}
          </mesh>
        ))}
        <mesh position={[0.15, 0.04, 0.1]} rotation={[-Math.PI / 2, 0, 0.3]} receiveShadow>
          <circleGeometry args={[0.85, 8]} />
          {lamb("#4a4030", { kind: "dirt" })}
        </mesh>
        <group position={[0.05, 0.18, 0.08]}>
          <mesh castShadow>
            <boxGeometry args={[0.42, 0.22, 0.32]} />
            {lamb("#6a4a28", { kind: "wood" })}
          </mesh>
          <group ref={lid} position={[0, 0.12, -0.08]}>
            <mesh position={[0, 0.02, 0.08]} castShadow>
              <boxGeometry args={[0.42, 0.05, 0.32]} />
              {lamb("#7a5a32", { kind: "wood" })}
            </mesh>
          </group>
        </group>
      </group>
    </Near>
  );
}

function CliffNook() {
  const y = heightAt(CLIFF_NOOK.x, CLIFF_NOOK.z);
  const sat = useRef(0);
  useFrame((_, dt) => {
    if (live.house) return;
    const d = Math.hypot(live.x - CLIFF_NOOK.x, live.z - CLIFF_NOOK.z);
    if (d < 5.5 && !live.smashed.placeNook) {
      live.smashed.placeNook = true;
      live.banner = "The Quiet Ledge";
    }
    if (d < 2.4 && live.stillT > 1.4) {
      sat.current += dt;
      if (sat.current > 2.2) pay(8, "cliffNook");
    } else sat.current = 0;
  });
  return (
    <Near x={CLIFF_NOOK.x} z={CLIFF_NOOK.z} r={36}>
      <group position={[CLIFF_NOOK.x, y, CLIFF_NOOK.z]}>
        <mesh position={[1.1, 0.42, -0.4]} scale={[1.2, 0.7, 1]} castShadow>
          <sphereGeometry args={[0.72, 7, 5]} />
          {lamb("#7a7468", { kind: "stone" })}
        </mesh>
        <mesh position={[-0.85, 0.18, 0.55]} rotation={[0.2, 0.4, 0.1]} castShadow>
          <cylinderGeometry args={[0.22, 0.28, 0.45, 7]} />
          {lamb("#5a3d24", { kind: "wood" })}
        </mesh>
        <mesh position={[0.2, 0.02, 0.15]} rotation={[-Math.PI / 2, 0, 0.4]} receiveShadow>
          <circleGeometry args={[1.15, 8]} />
          {lamb("#6a8840")}
        </mesh>
      </group>
    </Near>
  );
}

function FernGap() {
  const pts = useMemo(() => {
    const out: [number, number, number][] = [];
    for (let i = 0; i < 7; i++) {
      const u = i / 6;
      const x = TREE_HOME.x - 4.2 - u * 18;
      const z = TREE_HOME.z + 8 + u * 36;
      out.push([x, heightAt(x, z), z]);
    }
    return out;
  }, []);
  useFrame(() => {
    if (live.house) return;
    if (Math.hypot(live.x - FERN_GAP.x, live.z - FERN_GAP.z) < 3.2 && !live.smashed.fernGap) {
      live.smashed.fernGap = true;
    }
  });
  return (
    <Near x={FERN_GAP.x} z={FERN_GAP.z} r={40}>
      <group>
        {pts.map((p, i) => (
          <group key={i} position={p}>
            {[-0.18, 0.16].map((s) => (
              <mesh key={s} position={[s, 0.28, (i % 2) * 0.12]} rotation={[0.15, s * 0.4, s * 0.35]} castShadow>
                <coneGeometry args={[0.16, 0.55, 5]} />
                {lamb(i % 2 ? "#3a6a32" : "#2e5a28")}
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </Near>
  );
}

function PondSteps() {
  const stones = useMemo(() => {
    const sx = POND.x + 9.2;
    const sz = POND.z + 0.4;
    return [
      { x: sx, z: sz },
      { x: (sx + POND_ISLE.x) * 0.5, z: (sz + POND_ISLE.z) * 0.5 },
      { x: (sx + POND_ISLE.x * 2) / 3, z: (sz + POND_ISLE.z * 2) / 3 },
      { x: POND_ISLE.x, z: POND_ISLE.z },
    ];
  }, []);
  const wy = pondSurfaceY();
  useFrame(() => {
    if (live.house) return;
    for (const s of stones) addTrapSpot(s.x, s.z, 0.72, wy + 0.16 - heightAt(s.x, s.z));
    const d = Math.hypot(live.x - POND_ISLE.x, live.z - POND_ISLE.z);
    if (d < 1.15 && live.grounded && !live.swim) {
      pay(12, "pondIsle");
      if (!live.smashed.placeIsle) {
        live.smashed.placeIsle = true;
        live.banner = "Nobody's Isle";
      }
    }
  }, -2);
  return (
    <Near x={POND.x} z={POND.z} r={36}>
      <group>
        {stones.map((s, i) => (
          <mesh key={i} position={[s.x, wy + 0.1, s.z]} rotation={[0.08, i * 0.7, 0.04]} castShadow>
            <cylinderGeometry args={[i === 3 ? 1.15 : 0.55, i === 3 ? 1.25 : 0.62, 0.22, 7]} />
            {lamb(i === 3 ? "#5a7a38" : "#6a6458", { kind: i === 3 ? undefined : "stone" })}
          </mesh>
        ))}
        <mesh position={[POND_ISLE.x + 0.25, wy + 0.95, POND_ISLE.z - 0.2]} castShadow>
          <cylinderGeometry args={[0.07, 0.09, 1.4, 5]} />
          {lamb("#5a3a22", { kind: "wood" })}
        </mesh>
        <mesh position={[POND_ISLE.x + 0.25, wy + 1.65, POND_ISLE.z - 0.2]}>
          <sphereGeometry args={[0.38, 6, 5]} />
          {lamb("#2a6a32")}
        </mesh>
      </group>
    </Near>
  );
}

function BirdFlush() {
  const birds = useRef(
    Array.from({ length: 8 }, (_, i) => ({
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      t: 9,
      spin: i,
    })),
  );
  const cool = useRef(4);
  const refs = useRef<(THREE.Group | null)[]>([]);
  useFrame((_, dt) => {
    cool.current -= dt;
    const woods = !live.house && !inVillage(live.x, live.z) && !live.dungeon;
    if (woods && Math.abs(live.speed) > 9.5 && cool.current <= 0) {
      cool.current = 16 + Math.random() * 10;
      const fx = -Math.sin(live.yaw);
      const fz = -Math.cos(live.yaw);
      const ox = live.x + fx * 3.4 + (Math.random() - 0.5) * 2;
      const oz = live.z + fz * 3.4 + (Math.random() - 0.5) * 2;
      const oy = heightAt(ox, oz) + 1.4;
      for (let i = 0; i < birds.current.length; i++) {
        const b = birds.current[i]!;
        const a = (i / 8) * Math.PI * 2 + Math.random() * 0.4;
        b.x = ox + Math.cos(a) * 0.4;
        b.z = oz + Math.sin(a) * 0.4;
        b.y = oy;
        b.vx = Math.cos(a) * (4.8 + Math.random() * 3.2);
        b.vz = Math.sin(a) * (4.8 + Math.random() * 3.2);
        b.vy = 3.4 + Math.random() * 2.2;
        b.t = 0;
      }
      puffAt(ox, oz, oy, false);
      sfx.thud();
    }
    for (let i = 0; i < birds.current.length; i++) {
      const b = birds.current[i]!;
      b.t += dt;
      if (b.t > 2.4) {
        const g = refs.current[i];
        if (g) g.visible = false;
        continue;
      }
      b.x += b.vx * dt;
      b.z += b.vz * dt;
      b.y += b.vy * dt;
      b.vy += dt * 1.6;
      b.spin += dt * 14;
      const g = refs.current[i];
      if (g) {
        g.visible = true;
        g.position.set(b.x, b.y, b.z);
        g.rotation.y = Math.atan2(-b.vx, -b.vz);
        g.rotation.x = -0.35;
      }
    }
  });
  return (
    <group>
      {birds.current.map((_, i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          visible={false}
        >
          <mesh>
            <coneGeometry args={[0.07, 0.22, 4]} />
            {lamb("#3a3228")}
          </mesh>
          <mesh position={[0.09, 0, 0]} rotation={[0, 0, 0.5]}>
            <planeGeometry args={[0.22, 0.08]} />
            <meshBasicMaterial color="#4a4034" side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[-0.09, 0, 0]} rotation={[0, 0, -0.5]}>
            <planeGeometry args={[0.22, 0.08]} />
            <meshBasicMaterial color="#4a4034" side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function PathFox() {
  const p = useRef({ x: 0, z: 0, y: 0, yaw: 0, t: 9, vx: 0, vz: 0 });
  const cool = useRef(12);
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    cool.current -= dt;
    const onPath = !live.house && !live.dungeon && Math.abs(live.x) < 18 && live.z > TREE_HOME.z + 8 && live.z < -70;
    if (onPath && Math.abs(live.speed) > 3 && cool.current <= 0 && p.current.t > 3) {
      cool.current = 28 + Math.random() * 18;
      const fx = -Math.sin(live.yaw);
      const fz = -Math.cos(live.yaw);
      const rx = Math.cos(live.yaw);
      const rz = -Math.sin(live.yaw);
      const side = Math.random() < 0.5 ? 1 : -1;
      p.current.x = live.x + fx * 9.5 + rx * side * 6;
      p.current.z = live.z + fz * 9.5 + rz * side * 6;
      p.current.vx = -rx * side * 7.4;
      p.current.vz = -rz * side * 7.4;
      p.current.yaw = Math.atan2(-p.current.vx, -p.current.vz);
      p.current.t = 0;
      live.fangLookX = p.current.x;
      live.fangLookZ = p.current.z;
      live.fangLookT = 1.8;
    }
    p.current.t += dt;
    if (p.current.t < 2.6) {
      p.current.x += p.current.vx * dt;
      p.current.z += p.current.vz * dt;
      p.current.y = heightAt(p.current.x, p.current.z);
      if (g.current) {
        g.current.visible = true;
        g.current.position.set(p.current.x, p.current.y, p.current.z);
        g.current.rotation.y = p.current.yaw;
      }
    } else if (g.current) g.current.visible = false;
  });
  return (
    <group ref={g} visible={false}>
      <mesh position={[0, 0.28, 0.04]} rotation={[0.15, 0, 0]} castShadow>
        <capsuleGeometry args={[0.11, 0.28, 4, 6]} />
        {lamb("#b45a28")}
      </mesh>
      <mesh position={[0, 0.42, -0.22]} castShadow>
        <sphereGeometry args={[0.1, 6, 5]} />
        {lamb("#c46a32")}
      </mesh>
      <mesh position={[0, 0.38, -0.34]} scale={[0.7, 0.55, 1]}>
        <sphereGeometry args={[0.06, 5, 4]} />
        {lamb("#d8c4a8")}
      </mesh>
      <mesh position={[0, 0.32, 0.28]} rotation={[0.9, 0, 0]}>
        <coneGeometry args={[0.05, 0.28, 4]} />
        {lamb("#a84a22")}
      </mesh>
    </group>
  );
}

function NightPulse() {
  const m = useRef<THREE.MeshBasicMaterial>(null);
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const night = live.dusk > 0.55 && !live.house;
    const y = heightAt(0, KEEP_Z) + 18;
    if (g.current) {
      g.current.visible = night;
      g.current.position.set(0, y, KEEP_Z);
    }
    if (m.current) m.current.opacity = night ? 0.28 + Math.sin(clock.elapsedTime * 1.15) * 0.18 : 0;
  });
  return (
    <group ref={g} visible={false}>
      <mesh>
        <sphereGeometry args={[1.8, 8, 6]} />
        <meshBasicMaterial ref={m} color="#ffe6a0" transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

function FarFall() {
  const cool = useRef(18);
  useFrame((_, dt) => {
    cool.current -= dt;
    if (live.house || live.dungeon || cool.current > 0) return;
    if (Math.abs(live.speed) < 1.2) return;
    cool.current = 22 + Math.random() * 28;
    const a = Math.random() * Math.PI * 2;
    const r = 18 + Math.random() * 16;
    const x = live.x + Math.cos(a) * r;
    const z = live.z + Math.sin(a) * r;
    if (inVillage(x, z)) return;
    puffAt(x, z, heightAt(x, z) + 0.4, true);
    if (Math.hypot(live.x - x, live.z - z) < 22) {
      live.fangLookX = x;
      live.fangLookZ = z;
      live.fangLookT = 1.2;
    }
  });
  return null;
}
