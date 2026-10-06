import { useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, VX, VZ } from "./field";
import { live } from "./live";
import { lamb } from "./mats";

/**
 * A place wall: upright dirt-brown boards, house-fence tall, not a mountain.
 * Oakstead is the small ring. Stairs drop out of it into the bigger ring.
 */

type Ring = {
  id: string;
  x: number;
  z: number;
  r: number;
  gapAt: number[];
  gap: number;
};

const OAK = { x: VX + 2, z: VZ - 18 };
const FIELD = { x: 0, z: -72 };

const RINGS: Ring[] = [
  { id: "oak", x: OAK.x, z: OAK.z, r: 12, gapAt: [Math.PI / 2], gap: 0.46 },
  { id: "field", x: FIELD.x, z: FIELD.z, r: 34, gapAt: [0, Math.PI / 2, Math.PI, -Math.PI / 2], gap: 0.34 },
];

function angDiff(a: number, b: number) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function inGap(ring: Ring, ang: number) {
  for (const g of ring.gapAt) if (Math.abs(angDiff(ang, g)) < ring.gap) return true;
  return false;
}

export function collidePalisade(nx: number, nz: number): { x: number; z: number } | null {
  if (live.house || live.roomWarp) return null;
  for (const ring of RINGS) {
    const dx = nx - ring.x;
    const dz = nz - ring.z;
    const dist = Math.hypot(dx, dz) || 0.001;
    if (Math.abs(dist - ring.r) > 1.05) continue;
    if (inGap(ring, Math.atan2(dz, dx))) continue;
    const target = dist < ring.r ? ring.r - 0.8 : ring.r + 0.8;
    const s = target / dist;
    return { x: ring.x + dx * s, z: ring.z + dz * s };
  }
  return null;
}

function BoardRing({ ring, shade }: { ring: Ring; shade: string }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    const step = 0.82;
    const n = Math.floor((Math.PI * 2 * ring.r) / step);
    let w = 0;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      if (inGap(ring, a)) continue;
      if ((i % 2 === 0) !== (shade === "#6b4e32")) continue;
      const h = 2.15 + (i % 5) * 0.12;
      const x = ring.x + Math.cos(a) * ring.r;
      const z = ring.z + Math.sin(a) * ring.r;
      const y = heightAt(x, z) + h * 0.5;
      p.set(x, y, z);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a);
      s.set(0.74, h, 0.1);
      m.compose(p, q, s);
      mesh.setMatrixAt(w, m);
      w++;
    }
    mesh.count = w;
    mesh.instanceMatrix.needsUpdate = true;
  }, [ring, shade]);
  const cap = Math.ceil((Math.PI * 2 * ring.r) / 0.82);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, cap]} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      {lamb(shade)}
    </instancedMesh>
  );
}

function OakStairs() {
  const y = heightAt(OAK.x, OAK.z + 12);
  const lines = [0.4, 1.3, 2.2, 3.1, 4.0, 4.9, 5.8, 6.7];
  return (
    <group position={[OAK.x, y, OAK.z + 11.2]} rotation={[0, 0, 0]}>
      <mesh position={[0, -0.7, 3.6]} rotation={[-0.2, 0, 0]} receiveShadow castShadow>
        <boxGeometry args={[3.4, 0.16, 8.2]} />
        {lamb("#8d6b45")}
      </mesh>
      {lines.map((z) => (
        <mesh key={z} position={[0, -0.55 - z * 0.16, z]} rotation={[-0.2, 0, 0]}>
          <boxGeometry args={[3.15, 0.05, 0.08]} />
          {lamb("#5a4030")}
        </mesh>
      ))}
    </group>
  );
}

const stairZ = { z: 0, on: false };

function watchStairs() {
  if (live.house || live.roomWarp || live.warp || live.dungeon) return;
  const z = live.z;
  const prev = stairZ.on ? stairZ.z : z;
  stairZ.z = z;
  stairZ.on = true;
  if (Math.abs(live.x - OAK.x) > 2.1) return;
  const goingOut = z > prev + 0.001;
  const goingIn = z < prev - 0.001;
  if (Math.abs(live.speed) < 0.3) {
    if (z > OAK.z + 8 && z < OAK.z + 16) live.hint = "The stairs leave Oakstead.";
    return;
  }
  if (goingOut && z > OAK.z + 12.2 && z < OAK.z + 16.4) {
    live.roomWarp = {
      to: "meadow",
      x: OAK.x,
      z: -100,
      t: 0,
      phase: "out",
      walkX: OAK.x,
      walkZ: OAK.z + 16,
    };
    live.banner = "The field";
    return;
  }
  if (goingIn && z < OAK.z + 17.2 && z > OAK.z + 13.4) {
    live.roomWarp = {
      to: "meadow",
      x: OAK.x,
      z: OAK.z + 4,
      t: 0,
      phase: "out",
      walkX: OAK.x,
      walkZ: OAK.z + 9,
    };
    live.banner = "Oakstead";
  }
}

export function Palisade() {
  useFrame(() => watchStairs());
  return (
    <group>
      {RINGS.map((ring) => (
        <group key={ring.id}>
          <BoardRing ring={ring} shade="#6b4e32" />
          <BoardRing ring={ring} shade="#8a6844" />
        </group>
      ))}
      <OakStairs />
    </group>
  );
}
