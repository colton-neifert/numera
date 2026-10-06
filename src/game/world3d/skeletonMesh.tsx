import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { lamb } from "./mats";

const BONE = "#efe8dc";
const SHADOW = "#1a1614";

function Box({ p, a, c = BONE }: { p: [number, number, number]; a: [number, number, number]; c?: string }) {
  return (
    <mesh position={p} castShadow>
      <boxGeometry args={a} />
      {lamb(c)}
    </mesh>
  );
}

/** A stylized skeleton: skull, jaw, ribs, spine, and separate limb bones. */
export function BoneFolk({
  horns = false,
  hat = false,
  cloth = "",
  sword = false,
  walk = true,
}: {
  horns?: boolean;
  hat?: boolean;
  cloth?: string;
  sword?: boolean;
  walk?: boolean;
}) {
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const jaw = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const s = Math.sin(clock.elapsedTime * (walk ? 5 : 2.2));
    if (armL.current) armL.current.rotation.x = s * (walk ? 0.7 : 0.9);
    if (armR.current) armR.current.rotation.x = -s * (walk ? 0.7 : 0.45);
    if (legL.current) legL.current.rotation.x = -s * (walk ? 0.55 : 0.08);
    if (legR.current) legR.current.rotation.x = s * (walk ? 0.55 : 0.08);
    if (jaw.current) jaw.current.position.y = 1.28 + Math.abs(Math.sin(clock.elapsedTime * 3)) * 0.02;
  });
  return (
    <group>
      <Box p={[0, 1.62, 0]} a={[0.32, 0.3, 0.28]} />
      <Box p={[-0.08, 1.66, 0.13]} a={[0.07, 0.06, 0.04]} c={SHADOW} />
      <Box p={[0.08, 1.66, 0.13]} a={[0.07, 0.06, 0.04]} c={SHADOW} />
      <Box p={[0, 1.52, 0.12]} a={[0.08, 0.05, 0.03]} c={SHADOW} />
      <group ref={jaw}>
        <Box p={[0, 0, 0.08]} a={[0.22, 0.08, 0.16]} />
        {[-0.06, 0, 0.06].map((x) => (
          <Box key={x} p={[x, 0.05, 0.14]} a={[0.03, 0.04, 0.03]} c="#f7f3ea" />
        ))}
      </group>
      {horns ? (
        <>
          <Box p={[-0.1, 1.86, 0]} a={[0.05, 0.22, 0.05]} c="#c23a3a" />
          <Box p={[0.1, 1.86, 0]} a={[0.05, 0.22, 0.05]} c="#c23a3a" />
        </>
      ) : null}
      {hat ? <Box p={[0, 1.9, 0]} a={[0.5, 0.1, 0.5]} c="#2f6a34" /> : null}
      {[0, 1, 2, 3].map((i) => (
        <Box key={i} p={[0, 1.22 - i * 0.12, 0]} a={[0.08, 0.08, 0.08]} />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <group key={`r${i}`}>
          <Box p={[-0.16, 1.16 - i * 0.1, 0.02]} a={[0.22, 0.04, 0.05]} />
          <Box p={[0.16, 1.16 - i * 0.1, 0.02]} a={[0.22, 0.04, 0.05]} />
        </group>
      ))}
      <Box p={[0, 0.72, 0]} a={[0.28, 0.08, 0.16]} />
      {cloth ? <Box p={[0, 0.95, 0]} a={[0.42, 0.5, 0.22]} c={cloth} /> : null}
      <group ref={armL} position={[-0.2, 1.2, 0]}>
        <Box p={[0, -0.16, 0]} a={[0.06, 0.28, 0.06]} />
        <Box p={[0, -0.4, 0]} a={[0.05, 0.24, 0.05]} />
        <Box p={[0, -0.56, 0.04]} a={[0.08, 0.05, 0.08]} />
      </group>
      <group ref={armR} position={[0.2, 1.2, 0]}>
        <Box p={[0, -0.16, 0]} a={[0.06, 0.28, 0.06]} />
        <Box p={[0, -0.4, 0]} a={[0.05, 0.24, 0.05]} />
        <Box p={[0, -0.56, 0.04]} a={[0.08, 0.05, 0.08]} />
        {sword ? (
          <Box p={[0.02, -0.9, 0.08]} a={[0.04, 0.7, 0.02]} c="#8a9098" />
        ) : null}
      </group>
      <group ref={legL} position={[-0.08, 0.68, 0]}>
        <Box p={[0, -0.2, 0]} a={[0.07, 0.32, 0.07]} />
        <Box p={[0, -0.48, 0]} a={[0.06, 0.28, 0.06]} />
        <Box p={[0, -0.64, 0.05]} a={[0.08, 0.05, 0.16]} />
      </group>
      <group ref={legR} position={[0.08, 0.68, 0]}>
        <Box p={[0, -0.2, 0]} a={[0.07, 0.32, 0.07]} />
        <Box p={[0, -0.48, 0]} a={[0.06, 0.28, 0.06]} />
        <Box p={[0, -0.64, 0.05]} a={[0.08, 0.05, 0.16]} />
      </group>
    </group>
  );
}
