import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { WorldId } from "../types";
import type { GemId } from "../content";
import { useGame } from "../store";
import { heightAt, POND, VX as FIELD_VX, VZ as FIELD_VZ, VR as FIELD_VR, vWorld, pondSurfaceY, VILLAGE_Y, WELL_AT, WELL_TWO } from "./field";
import { pushAabb } from "./house";
import { live } from "./live";
import { N64Sign, N64Well, Flame } from "./actors";
import { lamb as stdLamb, type MatKind } from "./mats";

export const VX = FIELD_VX;
export const VZ = FIELD_VZ;
export const VR = FIELD_VR;
export const VILLAGE_NAME = "Oakstead";

export const FIRE_PIT = { x: VX, z: VZ + 8 };
export { WELL_AT, WELL_TWO };
export const FOUNTAIN = { x: VX + 2, z: VZ - 18 };
export const PADDOCK = { x: VX + 28, z: VZ + 24 };
export const WAGON_AT = { x: VX + 16, z: VZ - 6 };
export const HAY = { x: VX - 16, z: VZ + 18 };
export const STALL = vWorld(18, -42);
export const MILL_AT = vWorld(2, -116);

function lamb(color: string, extra?: { emissive?: string; emit?: number; kind?: MatKind }) {
  return stdLamb(color, extra);
}

const FIRE_R = 2.45;
export const fireChairs: { x: number; z: number; yaw: number }[] = [0.45, 2.55, 4.65].map((a) => ({
  x: FIRE_PIT.x + Math.sin(a) * FIRE_R,
  z: FIRE_PIT.z + Math.cos(a) * FIRE_R,
  yaw: a + Math.PI,
}));

export function inVillage(x: number, z: number) {
  return Math.hypot(x - VX, z - VZ) < VR;
}

export const TEMPLE_GATES: { world: WorldId; x: number; z: number; color: string; name: string; bomb?: boolean }[] = [
  { world: "cavern", x: 22.6, z: 9.4, color: "#e07a28", name: "a dark mouth" },
  { world: "marsh", x: 252, z: -462, color: "#2a6ad8", name: "a wet mouth" },
  { world: "crater", x: 640, z: -260, color: "#d42838", name: "a sealed crag", bomb: true },
];

export function worldGateOpen(world: WorldId, _cleared: string[], _gems: Record<GemId, boolean> | Record<string, boolean>) {
  const gate = TEMPLE_GATES.find((g) => g.world === world);
  if (!gate) return false;
  if (gate.bomb) return (useGame.getState().quests?.bombRock ?? 0) >= 1;
  return true;
}

function pushRing(x: number, z: number, cx: number, cz: number, r: number) {
  const dx = x - cx;
  const dz = z - cz;
  const d = Math.hypot(dx, dz);
  if (d >= r || d < 0.0001) return null;
  const u = r / d;
  return { x: cx + dx * u, z: cz + dz * u };
}

export type FenceSeg = { ax: number; az: number; bx: number; bz: number; gate?: { t: number; w: number } };

export function allFenceRuns(): FenceSeg[] {
  const pip = vWorld(-24, -66);
  const yours = vWorld(0, -50);
  const nana = vWorld(24, -66);
  const oak4 = vWorld(8, -96);
  const oak2 = vWorld(14, -74);
  const oak6 = vWorld(22, -90);
  const wren = vWorld(-14, -74);
  const px = PADDOCK.x;
  const pz = PADDOCK.z;
  return [
    { ax: pip.x - 6.2, az: pip.z + 5.4, bx: pip.x + 6.2, bz: pip.z + 5.4, gate: { t: 0.5, w: 2.2 } },
    { ax: pip.x - 6.2, az: pip.z + 5.4, bx: pip.x - 6.2, bz: pip.z - 5.0 },
    { ax: pip.x + 6.2, az: pip.z + 5.4, bx: pip.x + 6.2, bz: pip.z - 5.0 },
    { ax: pip.x - 7.4, az: pip.z - 6.6, bx: pip.x + 7.2, bz: pip.z - 6.6 },
    { ax: yours.x - 6.4, az: yours.z + 5.6, bx: yours.x + 6.4, bz: yours.z + 5.6, gate: { t: 0.5, w: 2.4 } },
    { ax: yours.x - 6.4, az: yours.z + 5.6, bx: yours.x - 6.4, bz: yours.z - 5.2 },
    { ax: yours.x + 6.4, az: yours.z + 5.6, bx: yours.x + 6.4, bz: yours.z - 5.2 },
    { ax: yours.x - 7.1, az: yours.z - 6.4, bx: yours.x + 7.1, bz: yours.z - 6.4 },
    { ax: nana.x - 5.8, az: nana.z + 5.2, bx: nana.x + 5.8, bz: nana.z + 5.2, gate: { t: 0.48, w: 2.1 } },
    { ax: nana.x - 5.8, az: nana.z + 5.2, bx: nana.x - 5.8, bz: nana.z - 4.8 },
    { ax: oak4.x - 5.6, az: oak4.z + 6.4, bx: oak2.x - 4.2, bz: oak2.z + 6.2 },
    { ax: oak4.x - 6.4, az: oak4.z + 5.2, bx: oak4.x + 7.2, bz: oak4.z + 5.2, gate: { t: 0.55, w: 2.4 } },
    { ax: oak4.x + 7.2, az: oak4.z + 5.2, bx: oak6.x + 6.4, bz: oak6.z + 4.4 },
    { ax: oak6.x + 6.4, az: oak6.z + 4.4, bx: oak6.x + 6.4, bz: oak6.z - 5.2 },
    { ax: wren.x - 5.4, az: wren.z + 5.0, bx: wren.x + 5.4, bz: wren.z + 5.0, gate: { t: 0.55, w: 2 } },
    { ax: px - 6.9, az: pz - 6.2, bx: px + 6.9, bz: pz - 6.2 },
    { ax: px - 6.9, az: pz + 6.2, bx: px + 6.9, bz: pz + 6.2 },
    { ax: px - 7.2, az: pz - 5.6, bx: px - 7.2, bz: pz + 5.6 },
    { ax: px + 7.2, az: pz - 5.6, bx: px + 7.2, bz: pz - 1.15 },
    { ax: px + 7.2, az: pz + 1.15, bx: px + 7.2, bz: pz + 5.6 },
    { ax: 46.4, az: -104.2, bx: 58.6, bz: -104.2, gate: { t: 0.45, w: 2.4 } },
    { ax: 46.4, az: -104.2, bx: 46.4, bz: -91.6 },
    { ax: 58.6, az: -104.2, bx: 58.6, bz: -91.6 },
    { ax: 46.4, az: -91.6, bx: 58.6, bz: -91.6, gate: { t: 0.5, w: 2.2 } },
    { ax: 36.4, az: -57.8, bx: 48.2, bz: -57.8 },
    { ax: 36.4, az: -57.8, bx: 36.4, bz: -44.6, gate: { t: 0.62, w: 2.2 } },
    { ax: 48.2, az: -57.8, bx: 48.2, bz: -44.6 },
  ];
}

function collideFenceSeg(
  x: number,
  z: number,
  ax: number,
  az: number,
  bx: number,
  bz: number,
  thick: number,
  gate?: { t: number; w: number },
) {
  const dx = bx - ax;
  const dz = bz - az;
  const len = Math.hypot(dx, dz) || 1;
  const ux = dx / len;
  const uz = dz / len;
  let t = (x - ax) * ux + (z - az) * uz;
  t = Math.max(0, Math.min(len, t));
  if (gate && Math.abs(t - gate.t * len) < gate.w * 0.5) return null;
  const cx = ax + ux * t;
  const cz = az + uz * t;
  const d = Math.hypot(x - cx, z - cz);
  if (d >= thick || d < 1e-6) return null;
  if (live.y > heightAt(cx, cz) + 0.9) return null;
  const u = thick / d;
  return { x: cx + (x - cx) * u, z: cz + (z - cz) * u };
}

export function fencePerch(x: number, z: number) {
  let y = 0;
  for (const s of allFenceRuns()) {
    const dx = s.bx - s.ax;
    const dz = s.bz - s.az;
    const len = Math.hypot(dx, dz) || 1;
    const ux = dx / len;
    const uz = dz / len;
    let t = (x - s.ax) * ux + (z - s.az) * uz;
    t = Math.max(0, Math.min(len, t));
    if (s.gate && Math.abs(t - s.gate.t * len) < s.gate.w * 0.5) continue;
    const cx = s.ax + ux * t;
    const cz = s.az + uz * t;
    if (Math.hypot(x - cx, z - cz) < 0.42) y = Math.max(y, heightAt(cx, cz) + 1.08);
  }
  return y;
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
  apply(pushRing(x, z, FIRE_PIT.x, FIRE_PIT.z, 1.05));
  apply(pushRing(x, z, WELL_AT.x, WELL_AT.z, 0.92));
  apply(pushRing(x, z, WELL_TWO.x, WELL_TWO.z, 0.92));
  apply(pushRing(x, z, FOUNTAIN.x, FOUNTAIN.z, 1.05));
  apply(pushAabb(x, z, WAGON_AT.x, WAGON_AT.z, 1.15, 0.55, 0.28));
  apply(pushAabb(x, z, HAY.x, HAY.z, 0.7, 0.55, 0.28));
  for (const c of fireChairs) apply(pushRing(x, z, c.x, c.z, 0.32));
  for (const s of allFenceRuns()) {
    apply(collideFenceSeg(x, z, s.ax, s.az, s.bx, s.bz, 0.16, s.gate));
  }
  apply(pushAabb(x, z, POND.x + 2.2, POND.z + 0.4, 1.4, 0.22, 0.22));
  return hit ? { x, z } : null;
}

export function collideGates(nx: number, nz: number): { x: number; z: number } | null {
  if (live.house) return null;
  const crater = TEMPLE_GATES.find((g) => g.bomb);
  if (crater && (useGame.getState().quests?.bombRock ?? 0) < 1) {
    const p = pushAabb(nx, nz, crater.x, crater.z, 2.8, 2.4, 0.75);
    if (p) return p;
  }
  return null;
}

function LogSeat({ x, z, yaw }: { x: number; z: number; yaw: number }) {
  const y = heightAt(FIRE_PIT.x + x, FIRE_PIT.z + z) - heightAt(FIRE_PIT.x, FIRE_PIT.z);
  return (
    <group position={[x, y, z]} rotation={[0, yaw, 0]}>
      <mesh position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.32, 0.32, 8]} />
        {lamb("#5a3a20")}
      </mesh>
      <mesh position={[0, 0.33, 0]} rotation={[-Math.PI / 2, 0, 0.2]}>
        <circleGeometry args={[0.26, 8]} />
        {lamb("#6a4a28")}
      </mesh>
    </group>
  );
}

function VillageFire() {
  const [night, setNight] = useState(false);
  useFrame(({ clock }) => {
    if (live.night !== night) setNight(live.night);
    if (live.house) return;
    let found = false;
    for (const c of fireChairs) {
      if (Math.hypot(live.x - c.x, live.z - c.z) < 0.7) {
        live.nearChair = true;
        live.sitAt = { x: c.x, z: c.z, yaw: c.yaw, warm: Boolean(live.night) };
        live.sitFresh = live.playT;
        found = true;
        break;
      }
    }
    if (!found && live.sitAt?.warm && !live.sit) {
      live.nearChair = false;
      live.sitAt = null;
    }
    void clock;
  });
  const y = heightAt(FIRE_PIT.x, FIRE_PIT.z);
  const boost = 1 + (live.fires.find((f) => Math.hypot(f.x - FIRE_PIT.x, f.z - FIRE_PIT.z) < 2)?.boost ?? 0) * 0.12;
  const rocks = [
    0.12, 0.7, 1.2, 1.75, 2.3, 2.85, 3.4, 3.95, 4.5, 5.05, 5.6, 6.15,
  ];
  return (
    <group position={[FIRE_PIT.x, y, FIRE_PIT.z]}>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.15, 14]} />
        {lamb("#3a2c20")}
      </mesh>
      <mesh position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.62, 12]} />
        {lamb("#2a1c14")}
      </mesh>
      {rocks.map((a, i) => {
        const r = 0.92 + (i % 3) * 0.06;
        const s = 0.15 + (i % 4) * 0.035;
        return (
          <mesh
            key={i}
            position={[Math.sin(a) * r, 0.1, Math.cos(a) * r]}
            rotation={[0.25 * ((i % 3) - 1), a, 0.2 * (i % 2)]}
            scale={[1, 0.62 + (i % 3) * 0.12, 0.85]}
            castShadow
          >
            <dodecahedronGeometry args={[s, 0]} />
            {lamb(i % 2 ? "#6a6458" : "#5a5448")}
          </mesh>
        );
      })}
      {[0.2, 1.4, 2.5].map((a, i) => (
        <mesh key={`lg${i}`} position={[Math.sin(a) * 0.16, 0.1, Math.cos(a) * 0.16]} rotation={[0.12, a + 0.4, 0.55]} castShadow>
          <cylinderGeometry args={[0.055, 0.07, 0.48, 6]} />
          {lamb(i % 2 ? "#3a2418" : "#2a1c12")}
        </mesh>
      ))}
      {night ? <Flame scale={1.55 * boost} /> : null}
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
        {lamb("#9a9488", { kind: "stone" })}
      </mesh>
      <mesh position={[0, 0.42, 0]} castShadow>
        <cylinderGeometry args={[1.48, 1.48, 0.22, 16]} />
        {lamb("#7a746c", { kind: "stone" })}
      </mesh>
      <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, 1.32, 20]} />
        {lamb("#8a8478", { kind: "stone" })}
      </mesh>
      <mesh position={[0, 0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.22, 16]} />
        <meshLambertMaterial color="#4a90a0" transparent opacity={0.7} depthWrite={false} />
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
  const y = heightAt(PADDOCK.x, PADDOCK.z);
  return (
    <group>
      <mesh position={[PADDOCK.x, y + 0.02, PADDOCK.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
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
      {[-1.35, 1.35].map((s) => (
        <mesh key={s} position={[s, 1.15, -0.2]} castShadow>
          <dodecahedronGeometry args={[1.15, 0]} />
          {lamb("#4a4034")}
        </mesh>
      ))}
      <mesh position={[0, 2.15, -0.35]} castShadow>
        <dodecahedronGeometry args={[1.45, 0]} />
        {lamb("#3a3228")}
      </mesh>
      <mesh position={[0, 1.05, 0.35]} rotation={[0.2, 0, 0]}>
        <sphereGeometry args={[0.78, 10, 8]} />
        <meshLambertMaterial color={open ? "#0c0a08" : "#2a2218"} />
      </mesh>
      {open ? (
        <pointLight position={[0, 1.1, 0.2]} color={color} intensity={1.4} distance={5} />
      ) : null}
    </group>
  );
}

function SealedCrag({ x, z }: { x: number; z: number }) {
  const y = heightAt(x, z);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 1.55, 0]} castShadow>
        <dodecahedronGeometry args={[2.35, 0]} />
        {lamb("#5a4a3c")}
      </mesh>
      <mesh position={[-1.1, 1.05, 0.4]} rotation={[0.2, 0.4, 0.1]} castShadow>
        <dodecahedronGeometry args={[1.35, 0]} />
        {lamb("#4a3a2c")}
      </mesh>
      <mesh position={[1.05, 0.85, 0.35]} rotation={[-0.1, -0.3, 0.2]} castShadow>
        <dodecahedronGeometry args={[1.15, 0]} />
        {lamb("#6a5a48")}
      </mesh>
      <mesh position={[0.15, 2.35, -0.2]} castShadow>
        <dodecahedronGeometry args={[0.85, 0]} />
        {lamb("#3a3228")}
      </mesh>
    </group>
  );
}

function PondWater() {
  const water = useRef<THREE.Mesh>(null);
  const bowl = useMemo(() => {
    const pts = [
      new THREE.Vector2(0.05, -1.32),
      new THREE.Vector2(POND.r * 0.42, -1.22),
      new THREE.Vector2(POND.r * 0.68, -0.78),
      new THREE.Vector2(POND.r * 0.9, -0.22),
      new THREE.Vector2(POND.r * 1.05, 0.04),
      new THREE.Vector2(POND.r * 1.18, 0.08),
    ];
    const g = new THREE.LatheGeometry(pts, 36);
    g.scale(1, 1, 0.9);
    g.computeVertexNormals();
    return g;
  }, []);
  const waterGeo = useMemo(() => {
    const g = new THREE.CircleGeometry(1, 36);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const a = Math.atan2(z, x);
      const wobble = 1 + 0.12 * Math.sin(a * 2.5) + 0.08 * Math.cos(a * 4.1);
      pos.setX(i, POND.x + x * POND.r * 0.98 * wobble);
      pos.setZ(i, POND.z + z * POND.r * 0.9 * wobble);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  useFrame(({ clock }) => {
    if (!water.current) return;
    water.current.position.y = pondSurfaceY() + Math.sin(clock.elapsedTime * 0.5) * 0.03;
  });
  const rim = VILLAGE_Y;
  return (
    <group>
      <mesh geometry={bowl} position={[POND.x, rim, POND.z]} receiveShadow>
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh position={[POND.x, rim + 0.02, POND.z]} rotation={[-Math.PI / 2, 0, 0.2]} receiveShadow scale={[1.18, 0.9, 1]}>
        <ringGeometry args={[POND.r * 0.92, POND.r * 1.28, 28]} />
        <meshLambertMaterial color="#7a5830" />
      </mesh>
      <mesh ref={water} geometry={waterGeo} position={[0, pondSurfaceY(), 0]} receiveShadow>
        <meshLambertMaterial color="#3a5c58" emissive="#1a3030" emissiveIntensity={0.22} transparent opacity={0.9} />
      </mesh>
      <mesh position={[POND.x - 1.4, pondSurfaceY() + 0.05, POND.z + 0.8]} rotation={[-Math.PI / 2, 0, 0.3]}>
        <circleGeometry args={[POND.r * 0.55, 18]} />
        <meshLambertMaterial color="#4a7068" transparent opacity={0.28} depthWrite={false} />
      </mesh>
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2 + 0.1;
        const wobble = 1 + 0.14 * Math.sin(a * 2.6);
        const r = POND.r * 1.16 * wobble;
        const x = POND.x + Math.cos(a) * r;
        const z = POND.z + Math.sin(a) * r * 0.78;
        return (
          <mesh key={i} position={[x, heightAt(x, z) + 0.05, z]} rotation={[-Math.PI / 2, 0, a]} receiveShadow>
            <circleGeometry args={[0.7 + (i % 3) * 0.18, 8]} />
            <meshLambertMaterial color={i % 2 ? "#8a6840" : "#6e4e2c"} />
          </mesh>
        );
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2 + 0.18;
        const r = POND.r * 1.3;
        const x = POND.x + Math.cos(a) * r;
        const z = POND.z + Math.sin(a) * r * 0.78;
        return (
          <mesh key={`g${i}`} position={[x, heightAt(x, z) + 0.16, z]} rotation={[0.12, a, 0.06]}>
            <coneGeometry args={[0.065, 0.38, 4]} />
            {lamb("#4a7a32")}
          </mesh>
        );
      })}
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
      <N64Well x={WELL_TWO.x} z={WELL_TWO.z} />
      <PaddockRails />
      <Wagon />
      <HayBale />
      <MillHouse />
      <PondWater />
      <N64Sign x={VX + 4} z={VZ + 22} />
      {TEMPLE_GATES.filter((g) => g.world !== "cavern").map((g) => {
        const open = worldGateOpen(g.world, cleared, gems);
        if (g.bomb && !open) return <SealedCrag key={g.world} x={g.x} z={g.z} />;
        return <GateArch key={g.world} x={g.x} z={g.z} color={g.color} open={open} />;
      })}
    </group>
  );
}
