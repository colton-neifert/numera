import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { WorldId } from "../types";
import type { GemId } from "../content";
import { useGame } from "../store";
import { heightAt, POND, VX as FIELD_VX, VZ as FIELD_VZ, VR as FIELD_VR, vWorld, FENCE_HITS, pondSurfaceY } from "./field";
import { pushAabb } from "./house";
import { live } from "./live";
import { N64Sign, N64Well } from "./actors";
import { lamb as stdLamb, type MatKind } from "./mats";

export const VX = FIELD_VX;
export const VZ = FIELD_VZ;
export const VR = FIELD_VR;
export const VILLAGE_NAME = "Oakstead";

export const FIRE_PIT = { x: VX, z: VZ + 8 };
export const WELL_AT = { x: VX - 10, z: VZ - 4 };
export const FOUNTAIN = { x: VX + 2, z: VZ - 18 };
export const PADDOCK = { x: VX + 28, z: VZ + 24 };
export const WAGON_AT = { x: VX + 16, z: VZ - 6 };
export const HAY = { x: VX - 16, z: VZ + 18 };
export const STALL = vWorld(18, -42);
export const MILL_AT = vWorld(2, -116);

function lamb(color: string, extra?: { emissive?: string; emit?: number; kind?: MatKind }) {
  return stdLamb(color, extra);
}

const FIRE_R = 5.6;
export const fireChairs: { x: number; z: number; yaw: number }[] = [0.45, 2.55, 4.65].map((a) => ({
  x: FIRE_PIT.x + Math.sin(a) * FIRE_R,
  z: FIRE_PIT.z + Math.cos(a) * FIRE_R,
  yaw: a + Math.PI,
}));

export function inVillage(x: number, z: number) {
  return Math.hypot(x - VX, z - VZ) < VR;
}

export const TEMPLE_GATES: { world: WorldId; x: number; z: number; color: string; name: string }[] = [
  { world: "marsh", x: -52, z: 86, color: "#2a8a78", name: "Marsh" },
  { world: "grove", x: 172, z: 38, color: "#3d8a32", name: "Grove" },
  { world: "crater", x: 246, z: -84, color: "#c45c38", name: "Crater" },
  { world: "lake", x: -186, z: -42, color: "#3a7ab8", name: "Lake" },
  { world: "grave", x: 84, z: 208, color: "#c8d4dc", name: "Grave" },
  { world: "waste", x: 328, z: 118, color: "#c4a060", name: "Waste" },
  { world: "echo", x: -276, z: 82, color: "#7a68b0", name: "Echo" },
  { world: "ridge", x: 412, z: -196, color: "#5a8a40", name: "Ridge" },
  { world: "spire", x: -352, z: -158, color: "#6a7080", name: "Spire" },
  { world: "fen", x: 204, z: 276, color: "#3a8a88", name: "Fen" },
  { world: "hollow", x: -208, z: 236, color: "#8a4030", name: "Hollow" },
  { world: "vault", x: 8, z: 328, color: "#5a3a78", name: "Vault" },
];

const CHAIN: WorldId[] = TEMPLE_GATES.map((g) => g.world);

export function worldGateOpen(world: WorldId, cleared: string[], _gems: Record<GemId, boolean> | Record<string, boolean>) {
  const i = CHAIN.indexOf(world);
  if (i < 0) return true;
  if (i === 0) return cleared.includes("cavern") || cleared.includes("meadow");
  return cleared.includes(CHAIN[i - 1]!);
}

function pushRing(x: number, z: number, cx: number, cz: number, r: number) {
  const dx = x - cx;
  const dz = z - cz;
  const d = Math.hypot(dx, dz);
  if (d >= r || d < 0.0001) return null;
  const u = r / d;
  return { x: cx + dx * u, z: cz + dz * u };
}

export function collideVillage(nx: number, nz: number, _sprint = false): { x: number; z: number } | null {
  if (live.house || live.doorUse) return null;
  let x = nx;
  let z = nz;
  let hit = false;
  const apply = (p: { x: number; z: number } | null) => {
    if (!p) return;
    x = p.x;
    z = p.z;
    hit = true;
  };
  apply(pushRing(x, z, FIRE_PIT.x, FIRE_PIT.z, 0.85));
  apply(pushRing(x, z, WELL_AT.x, WELL_AT.z, 1.15));
  apply(pushRing(x, z, FOUNTAIN.x, FOUNTAIN.z, 1.45));
  apply(pushAabb(x, z, WAGON_AT.x, WAGON_AT.z, 1.35, 0.7, 0.4));
  apply(pushAabb(x, z, HAY.x, HAY.z, 0.85, 0.7, 0.4));
  for (const c of fireChairs) apply(pushRing(x, z, c.x, c.z, 0.42));
  const rails: { cx: number; cz: number; hx: number; hz: number }[] = [
    { cx: PADDOCK.x, cz: PADDOCK.z - 6.2, hx: 7.2, hz: 0.18 },
    { cx: PADDOCK.x, cz: PADDOCK.z + 6.2, hx: 7.2, hz: 0.18 },
    { cx: PADDOCK.x - 7.2, cz: PADDOCK.z, hx: 0.18, hz: 6.2 },
    { cx: PADDOCK.x + 7.2, cz: PADDOCK.z, hx: 0.18, hz: 6.2 },
  ];
  for (const r of rails) apply(pushAabb(x, z, r.cx, r.cz, r.hx, r.hz, 0.35));
  apply(pushAabb(x, z, POND.x + 2.2, POND.z + 0.4, 1.6, 0.28, 0.35));
  apply(pushRing(x, z, POND.x, POND.z, POND.r * 0.42));
  for (const f of FENCE_HITS) apply(pushAabb(x, z, f.cx, f.cz, f.hx, f.hz, 0.32));
  return hit ? { x, z } : null;
}

export function collideGates(nx: number, nz: number): { x: number; z: number } | null {
  if (live.house) return null;
  let x = nx;
  let z = nz;
  let hit = false;
  for (const g of TEMPLE_GATES) {
    const p = pushAabb(x, z, g.x, g.z, 1.15, 0.42, 0.45);
    if (p) {
      x = p.x;
      z = p.z;
      hit = true;
    }
  }
  return hit ? { x, z } : null;
}

function LogSeat({ x, z, yaw }: { x: number; z: number; yaw: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, yaw, 0]}>
      <mesh position={[0, 0.22, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.18, 0.2, 0.95, 7]} />
        {lamb("#6a4a28")}
      </mesh>
      <mesh position={[0, 0.38, 0]} rotation={[0.05, 0.2, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.12, 0.13, 0.7, 6]} />
        {lamb("#5a3a20")}
      </mesh>
    </group>
  );
}

function VillageFire() {
  const flame = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (flame.current) {
      flame.current.scale.setScalar(0.92 + Math.sin(t * 9) * 0.1);
      flame.current.rotation.y = t * 0.7;
    }
    if (glow.current) glow.current.intensity = (3.2 + live.dusk * 5.8) + Math.sin(t * 7) * 0.6;
    if (live.house) return;
    let found = false;
    for (const c of fireChairs) {
      if (Math.hypot(live.x - c.x, live.z - c.z) < 0.78) {
        live.nearChair = true;
        live.sitAt = { x: c.x, z: c.z, yaw: c.yaw, warm: true };
        found = true;
        break;
      }
    }
    if (!found && live.sitAt?.warm && !live.sit) {
      live.nearChair = false;
      live.sitAt = null;
    }
  });
  const y = heightAt(FIRE_PIT.x, FIRE_PIT.z);
  return (
    <group position={[FIRE_PIT.x, y, FIRE_PIT.z]}>
      {[0, 2.1, 4.2].map((a, i) => (
        <mesh key={i} position={[Math.sin(a) * 0.4, 0.12, Math.cos(a) * 0.4]} rotation={[0.2, a, 0.4]} castShadow>
          <cylinderGeometry args={[0.08, 0.1, 0.55, 5]} />
          {lamb(i % 2 ? "#5a3d24" : "#4a3220")}
        </mesh>
      ))}
      <mesh ref={flame} position={[0, 0.55, 0]}>
        <coneGeometry args={[0.28, 0.85, 6]} />
        <meshLambertMaterial color="#ff8844" emissive="#ff6020" emissiveIntensity={1.5} />
      </mesh>
      <pointLight ref={glow} position={[0, 0.9, 0]} color="#ff8844" intensity={4} distance={11} />
      {fireChairs.map((c, i) => (
        <LogSeat key={i} x={c.x - FIRE_PIT.x} z={c.z - FIRE_PIT.z} yaw={c.yaw} />
      ))}
    </group>
  );
}

function OakFountain() {
  const spray = useRef<THREE.Mesh>(null);
  const y = heightAt(FOUNTAIN.x, FOUNTAIN.z);
  useFrame(({ clock }) => {
    if (!spray.current) return;
    const t = clock.elapsedTime;
    spray.current.scale.setScalar(0.88 + Math.sin(t * 3.2) * 0.12);
    spray.current.position.y = 1.15 + Math.sin(t * 4) * 0.06;
  });
  return (
    <group position={[FOUNTAIN.x, y, FOUNTAIN.z]}>
      <mesh position={[0, 0.16, 0]} receiveShadow>
        <cylinderGeometry args={[1.55, 1.7, 0.32, 16]} />
        {lamb("#9a9488")}
      </mesh>
      <mesh position={[0, 0.38, 0]}>
        <cylinderGeometry args={[1.32, 1.38, 0.2, 16]} />
        {lamb("#8a8680")}
      </mesh>
      <mesh position={[0, 0.46, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.22, 16]} />
        <meshLambertMaterial color="#4a90a0" transparent opacity={0.55} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.72, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.28, 0.7, 10]} />
        {lamb("#8a8478")}
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.42, 0.48, 0.14, 12]} />
        {lamb("#9a9488")}
      </mesh>
      <mesh ref={spray} position={[0, 1.18, 0]}>
        <coneGeometry args={[0.14, 0.42, 7]} />
        <meshLambertMaterial color="#8ec8d8" transparent opacity={0.5} depthWrite={false} />
      </mesh>
    </group>
  );
}

function PaddockRails() {
  const posts: { x: number; z: number }[] = [];
  for (let i = -6; i <= 6; i++) {
    posts.push({ x: PADDOCK.x + i * 1.15, z: PADDOCK.z - 6.2 });
    posts.push({ x: PADDOCK.x + i * 1.15, z: PADDOCK.z + 6.2 });
  }
  for (let i = -5; i <= 5; i++) {
    posts.push({ x: PADDOCK.x - 7.2, z: PADDOCK.z + i * 1.12 });
    posts.push({ x: PADDOCK.x + 7.2, z: PADDOCK.z + i * 1.12 });
  }
  return (
    <group>
      {posts.map((p, i) => {
        const y = heightAt(p.x, p.z);
        return (
          <group key={i} position={[p.x, y, p.z]}>
            <mesh position={[0, 0.55, 0]} castShadow>
              <cylinderGeometry args={[0.06, 0.07, 1.1, 5]} />
              {lamb("#6a4a28")}
            </mesh>
          </group>
        );
      })}
      <mesh position={[PADDOCK.x, heightAt(PADDOCK.x, PADDOCK.z) + 0.02, PADDOCK.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[13, 11]} />
        <meshLambertMaterial color="#8a7a4a" />
      </mesh>
    </group>
  );
}

function Wagon() {
  const y = heightAt(WAGON_AT.x, WAGON_AT.z);
  return (
    <group position={[WAGON_AT.x, y, WAGON_AT.z]}>
      <mesh position={[0, 0.72, 0]} castShadow>
        <boxGeometry args={[1.85, 0.55, 1.05]} />
        {lamb("#6a3a18")}
      </mesh>
      {[-0.62, 0.62].flatMap((x) =>
        [-0.48, 0.48].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.32, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.28, 0.28, 0.12, 8]} />
            {lamb("#3a2818")}
          </mesh>
        )),
      )}
    </group>
  );
}

function HayBale() {
  const y = heightAt(HAY.x, HAY.z);
  return (
    <group position={[HAY.x, y, HAY.z]}>
      <mesh position={[0, 0.38, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.45, 0.7, 8]} />
        {lamb("#c4a050")}
      </mesh>
    </group>
  );
}

function MillHouse() {
  const y = heightAt(MILL_AT.x, MILL_AT.z);
  const wheel = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    live.millSpin += dt * 0.55;
    if (wheel.current) wheel.current.rotation.z = live.millSpin;
  });
  return (
    <group position={[MILL_AT.x, y, MILL_AT.z]}>
      <mesh position={[0, 2.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[6.4, 4.2, 5.8]} />
        {lamb("#d8c8b0")}
      </mesh>
      <mesh position={[0, 4.85, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[4.6, 2.4, 4]} />
        {lamb("#3f362f")}
      </mesh>
      <mesh position={[0, 5.35, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[4.05, 1.6, 4]} />
        {lamb("#322c28")}
      </mesh>
      <group ref={wheel} position={[3.35, 2.15, 0]}>
        <mesh rotation={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[1.55, 1.55, 0.22, 12]} />
          {lamb("#5a3d24")}
        </mesh>
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} rotation={[0, 0, (i / 8) * Math.PI]} position={[0, 0, 0]}>
            <boxGeometry args={[0.12, 3.0, 0.08]} />
            {lamb("#6a4a28")}
          </mesh>
        ))}
      </group>
      <mesh position={[0, 1.15, 2.95]} castShadow>
        <boxGeometry args={[1.15, 2.2, 0.12]} />
        {lamb("#3a2818")}
      </mesh>
    </group>
  );
}

function GateArch({ x, z, color, open }: { x: number; z: number; color: string; open: boolean }) {
  const y = heightAt(x, z);
  return (
    <group position={[x, y, z]}>
      {[-1.15, 1.15].map((s) => (
        <mesh key={s} position={[s, 1.35, 0]} castShadow>
          <boxGeometry args={[0.42, 2.7, 0.42]} />
          {lamb("#b8a888")}
        </mesh>
      ))}
      <mesh position={[0, 2.85, 0]} castShadow>
        <boxGeometry args={[2.7, 0.42, 0.5]} />
        {lamb("#a89880")}
      </mesh>
      <mesh position={[0, 3.35, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.7, 6]} />
        {lamb(color, { emissive: color, emit: open ? 0.7 : 0.15 })}
      </mesh>
      {!open ? (
        <mesh position={[0, 1.2, 0]}>
          <boxGeometry args={[1.85, 2.2, 0.12]} />
          {lamb("#3a2818")}
        </mesh>
      ) : null}
    </group>
  );
}

function PondWater() {
  const water = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => {
    const g = new THREE.CircleGeometry(1, 26);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const a = Math.atan2(z, x);
      const wobble = 1 + 0.16 * Math.sin(a * 3.4) + 0.12 * Math.cos(a * 5.1);
      pos.setX(i, POND.x + x * POND.r * wobble);
      pos.setZ(i, POND.z + z * POND.r * 0.86 * wobble);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  useFrame(({ clock }) => {
    if (!water.current) return;
    const t = clock.elapsedTime;
    water.current.position.y = pondSurfaceY() + Math.sin(t * 0.75) * 0.035;
    const mat = water.current.material as THREE.MeshStandardMaterial;
    mat.opacity = 0.62 + Math.sin(t * 1.15) * 0.06;
    mat.emissiveIntensity = 0.12 + Math.sin(t * 0.9) * 0.04;
  });
  return (
    <group>
      <mesh ref={water} geometry={geo} position={[0, pondSurfaceY(), 0]} receiveShadow>
        {lamb("#4aa8b0", { kind: "water" })}
      </mesh>
      <mesh position={[POND.x, pondSurfaceY() + 0.04, POND.z]} rotation={[-Math.PI / 2, 0, 0.3]}>
        <circleGeometry args={[POND.r * 0.58, 18]} />
        {lamb("#9ed4dc", { kind: "water" })}
      </mesh>
    </group>
  );
}

function PondDock() {
  const y = heightAt(POND.x + 2.4, POND.z + 0.6);
  return (
    <group position={[POND.x + 2.4, y, POND.z + 0.6]}>
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <boxGeometry args={[2.6, 0.12, 1.15]} />
        {lamb("#6a4a28")}
      </mesh>
      {[-0.9, 0.9].map((x) => (
        <mesh key={x} position={[x, -0.15, 0.4]}>
          <boxGeometry args={[0.12, 0.55, 0.12]} />
          {lamb("#4a3220")}
        </mesh>
      ))}
    </group>
  );
}

export function Village({ worldId }: { worldId: WorldId }) {
  const cleared = useGame((s) => s.worldsCleared);
  const gems = useGame((s) => s.gems);
  if (worldId !== "meadow") return null;
  return (
    <group>
      <VillageFire />
      <OakFountain />
      <N64Well x={WELL_AT.x} z={WELL_AT.z} />
      <PaddockRails />
      <Wagon />
      <HayBale />
      <MillHouse />
      <PondWater />
      <PondDock />
      <N64Sign x={VX + 4} z={VZ + 22} />
      {TEMPLE_GATES.map((g) => (
        <GateArch key={g.world} x={g.x} z={g.z} color={g.color} open={worldGateOpen(g.world, cleared, gems)} />
      ))}
    </group>
  );
}
