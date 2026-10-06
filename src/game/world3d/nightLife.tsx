import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, TREE_LADDER, VX, VZ, POND, LOOK_AT, WATCH_SPIRE, WOW_BRIDGE } from "./field";
import { FIRE_PIT } from "./village";
import { live } from "./live";
import { lamb } from "./mats";

const POSTS: [number, number][] = [
  [TREE_LADDER.x - 1.2, TREE_LADDER.z + 6.4],
  [-16.8, -132.2],
  [VX - 10, VZ - 16],
  [VX + 6.4, VZ + 4.2],
  [FIRE_PIT.x + 4.2, FIRE_PIT.z - 2.4],
  [POND.x + 10.4, POND.z + 4.2],
  [LOOK_AT.x + 1.6, LOOK_AT.z + 2.2],
  [WOW_BRIDGE.x + 2.4, WOW_BRIDGE.z - 2.2],
  [WATCH_SPIRE.x - 2.8, WATCH_SPIRE.z + 3.2],
  [0.8, VZ + 28],
  [0.6, 18],
];

export function NightLife() {
  return (
    <group>
      {POSTS.map((p, i) => (
        <LanternPost key={i} x={p[0]} z={p[1]} />
      ))}
      <Fireflies />
      <HillMark />
    </group>
  );
}

function LanternPost({ x, z }: { x: number; z: number }) {
  const y = heightAt(x, z);
  const flame = useRef<THREE.Mesh>(null);
  const lit = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (!flame.current) return;
    const night = live.dusk > 0.35;
    flame.current.visible = night;
    const s = 0.85 + Math.sin(clock.elapsedTime * 7.2 + x) * 0.12;
    flame.current.scale.setScalar(s);
    if (lit.current) {
      const want = night && live.quality === "high" ? 2.35 + s * 0.4 : 0;
      lit.current.intensity += (want - lit.current.intensity) * 0.12;
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.85, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.07, 1.7, 6]} />
        {lamb("#4a3220", { kind: "wood" })}
      </mesh>
      <mesh position={[0, 1.72, 0]}>
        <boxGeometry args={[0.22, 0.08, 0.22]} />
        {lamb("#3a2a1c")}
      </mesh>
      <mesh ref={flame} position={[0, 1.88, 0]} visible={false}>
        <sphereGeometry args={[0.1, 6, 5]} />
        <meshBasicMaterial color="#f0b060" />
      </mesh>
      <pointLight ref={lit} position={[0, 1.88, 0]} color="#f4c078" intensity={0} distance={10} decay={2} />
    </group>
  );
}

function HillMark() {
  const mat = useRef<THREE.MeshLambertMaterial>(null);
  const y = heightAt(LOOK_AT.x, LOOK_AT.z);
  useFrame(({ clock }) => {
    if (!mat.current) return;
    const night = live.dusk > 0.55;
    mat.current.emissiveIntensity = night ? 0.28 + Math.sin(clock.elapsedTime * 1.4) * 0.12 : 0;
    mat.current.opacity = night ? 0.72 : 0.08;
  });
  return (
    <mesh position={[LOOK_AT.x, y + 0.06, LOOK_AT.z]} rotation={[-Math.PI / 2, 0, 0.4]}>
      <ringGeometry args={[0.55, 0.82, 16]} />
      <meshLambertMaterial ref={mat} color="#c9a227" emissive="#e8c040" emissiveIntensity={0} transparent opacity={0.08} depthWrite={false} />
    </mesh>
  );
}

function Fireflies() {
  const pts = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 28;
    const pos = new Float32Array(n * 3);
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  useFrame(({ clock }) => {
    if (!pts.current) return;
    const on = live.dusk > 0.5 && !live.house;
    pts.current.visible = on;
    if (!on) return;
    const t = clock.elapsedTime;
    const arr = geo.attributes.position.array as Float32Array;
    for (let i = 0; i < 28; i++) {
      const a = t * 0.35 + i * 1.7;
      const pond = i < 16;
      const ox = pond ? POND.x : FIRE_PIT.x;
      const oz = pond ? POND.z : FIRE_PIT.z;
      arr[i * 3] = ox + Math.sin(a) * (pond ? 6 + (i % 5) : 4 + (i % 3)) + Math.cos(a * 0.7) * 2;
      arr[i * 3 + 1] = heightAt(ox, oz) + 1.2 + Math.sin(a * 1.6 + i) * 0.55;
      arr[i * 3 + 2] = oz + Math.cos(a * 0.9) * (pond ? 5 + (i % 4) : 3.4);
    }
    geo.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={pts} geometry={geo} visible={false}>
      <pointsMaterial color="#d8f080" size={0.22} sizeAttenuation transparent opacity={0.85} depthWrite={false} />
    </points>
  );
}
