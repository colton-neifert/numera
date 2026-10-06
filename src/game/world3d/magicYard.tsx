import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { atmo } from "./lush/atmo";

/** A big storybook toadstool: red cap, white spots, thick stalk. */
export function SpottedMushroom({
  position,
  scale = 1,
  color = "#d23a3a",
}: {
  position: [number, number, number];
  scale?: number;
  color?: string;
}) {
  const spots = [
    [0.12, 0.22, 0.16],
    [-0.16, 0.18, 0.08],
    [0.02, 0.28, -0.12],
    [-0.06, 0.16, 0.2],
    [0.18, 0.12, -0.02],
  ] as const;
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.16, 0.56, 8]} />
        <meshLambertMaterial color="#f3e6d0" />
      </mesh>
      <mesh position={[0, 0.62, 0]} castShadow>
        <sphereGeometry args={[0.42, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshLambertMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.58, 0]} rotation={[Math.PI, 0, 0]}>
        <circleGeometry args={[0.34, 10]} />
        <meshLambertMaterial color="#f4efe4" side={THREE.DoubleSide} />
      </mesh>
      {spots.map((p, i) => (
        <mesh key={i} position={[p[0], 0.62 + p[1] * 0.15, p[2]]}>
          <sphereGeometry args={[0.055 + (i % 2) * 0.02, 6, 5]} />
          <meshLambertMaterial color="#fffaf2" />
        </mesh>
      ))}
    </group>
  );
}

/** Lanterns, timber, and big spotted mushrooms so a cottage is not a bare box. */
export function MagicYard({ w, d, seed = 1 }: { w: number; d: number; seed?: number }) {
  const glow = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (glow.current) glow.current.intensity = 1.6 + Math.sin(clock.elapsedTime * 2.2 + seed) * 0.35;
  });
  const z = d * 0.5 + 0.2;
  return (
    <group>
      <mesh position={[-w * 0.22, 2.35, z]} rotation={[0, 0, 0.7]}>
        <boxGeometry args={[0.1, 1.35, 0.08]} />
        <meshLambertMaterial color="#4a301c" />
      </mesh>
      <mesh position={[w * 0.22, 2.35, z]} rotation={[0, 0, -0.7]}>
        <boxGeometry args={[0.1, 1.35, 0.08]} />
        <meshLambertMaterial color="#4a301c" />
      </mesh>
      <mesh position={[0, 0.95, z + 0.08]} castShadow>
        <boxGeometry args={[1.35, 0.1, 0.28]} />
        <meshLambertMaterial color="#5a3a22" />
      </mesh>
      {[-0.42, 0.42].map((x) => (
        <mesh key={x} position={[x, 1.12, z + 0.16]}>
          <sphereGeometry args={[0.1, 6, 5]} />
          <meshLambertMaterial color={x < 0 ? "#e8d48a" : "#d45a68"} />
        </mesh>
      ))}
      <group position={[w * 0.42, 2.15, z]}>
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.7, 5]} />
          <meshLambertMaterial color="#3a2818" />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.16, 8, 6]} />
          <meshLambertMaterial color="#f4c878" emissive="#f0b040" emissiveIntensity={0.9} />
        </mesh>
        <pointLight ref={glow} color="#ffb060" intensity={1.8} distance={7} />
      </group>
      <SpottedMushroom position={[-w * 0.42, 0.05, z + 0.35]} scale={1.35} />
      <SpottedMushroom position={[w * 0.48, 0.05, z + 0.15]} scale={0.85} color="#c43a58" />
      <SpottedMushroom position={[-w * 0.15, 0.05, -d * 0.48]} scale={1.05} color="#e06830" />
    </group>
  );
}

/** A few soft circles along the sun, the way a lens flares in real light. */
export function SunGlints() {
  const group = useRef<THREE.Group>(null);
  const mats = useRef<THREE.MeshBasicMaterial[]>([]);
  useFrame(({ camera }) => {
    if (!group.current) return;
    const sun = atmo.sunDir.clone().normalize();
    const ahead = sun.dot(camera.getWorldDirection(new THREE.Vector3())) > 0.15 && atmo.sunI > 0.25;
    group.current.visible = ahead;
    if (!ahead) return;
    const far = camera.position.clone().addScaledVector(sun, 40);
    group.current.children.forEach((child, i) => {
      const t = 0.22 + i * 0.11;
      child.position.lerpVectors(camera.position, far, t);
      child.lookAt(camera.position);
      const m = mats.current[i];
      if (m) m.opacity = 0.14 + Math.sin(performance.now() * 0.001 + i) * 0.04;
    });
  });
  const rings = [
    { s: 1.6, c: "#fff4d0" },
    { s: 0.7, c: "#ffd0a0" },
    { s: 1.1, c: "#ffe8a8" },
    { s: 0.45, c: "#fffaf0" },
    { s: 0.9, c: "#f0c8a0" },
  ];
  return (
    <group ref={group}>
      {rings.map((r, i) => (
        <mesh key={i} renderOrder={20}>
          <circleGeometry args={[r.s, 16]} />
          <meshBasicMaterial
            ref={(el) => {
              if (el) mats.current[i] = el;
            }}
            color={r.c}
            transparent
            opacity={0.16}
            depthWrite={false}
            depthTest={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}
