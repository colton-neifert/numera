import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt } from "./field";
import { CAVE_MOUTH } from "./house";
import { lamb } from "./mats";

/**
 * Sun Hollow's mouth — carved into the east hill, facing Oakstead (south, −Z).
 * Two stone wolves, a sun disc over the lintel, hanging roots, warm dark inside.
 */
export function CaveMouth() {
  const y = heightAt(CAVE_MOUTH.x, CAVE_MOUTH.z);
  const glow = useRef<THREE.MeshBasicMaterial>(null);
  const flame = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (glow.current) glow.current.opacity = 0.38 + Math.sin(t * 1.45) * 0.1;
    flame.current.forEach((m, i) => {
      if (!m) return;
      const u = 0.78 + Math.sin(t * 8.4 + i * 1.7) * 0.18;
      m.scale.setScalar(u);
    });
  });
  return (
    <group position={[CAVE_MOUTH.x, y, CAVE_MOUTH.z]}>
      {/* Hill mass — the cave is cut into this, opening faces −Z (village). */}
      <mesh position={[0, 2.65, 2.15]} castShadow receiveShadow>
        <boxGeometry args={[11.4, 6.4, 5.6]} />
        {lamb("#6a5848", { kind: "stone" })}
      </mesh>
      <mesh position={[0, 5.55, 1.4]} rotation={[0.18, 0, 0]} castShadow>
        <boxGeometry args={[12.2, 2.4, 6.2]} />
        {lamb("#5a4a3c", { kind: "stone" })}
      </mesh>
      <mesh position={[0, 3.4, 4.4]} castShadow>
        <dodecahedronGeometry args={[3.4, 0]} />
        {lamb("#4a3e32", { kind: "stone" })}
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={`j${s}`} position={[s * 5.4, 2.4, 0.4]} rotation={[0.1, s * 0.2, s * -0.12]} castShadow>
          <boxGeometry args={[3.2, 5.4, 4.2]} />
          {lamb(s > 0 ? "#5a4c3c" : "#4e4236", { kind: "stone" })}
        </mesh>
      ))}
      {/* Lintel + sun disc over the door. */}
      <mesh position={[0, 4.15, -1.15]} castShadow>
        <boxGeometry args={[5.6, 0.85, 1.6]} />
        {lamb("#7a6a54", { kind: "stone" })}
      </mesh>
      <mesh position={[0, 4.85, -1.35]} rotation={[0.1, 0, 0]}>
        <circleGeometry args={[0.72, 12]} />
        <meshLambertMaterial color="#e8c040" emissive="#e8c040" emissiveIntensity={0.55} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.sin(a) * 1.05, 4.85 + Math.cos(a) * 0.15, -1.32]} rotation={[0.1, 0, a]}>
            <boxGeometry args={[0.12, 0.42, 0.08]} />
            <meshLambertMaterial color="#c9a227" emissive="#c9a227" emissiveIntensity={0.3} />
          </mesh>
        );
      })}
      {/* Dark mouth — walk into this. */}
      <mesh position={[0, 1.85, -0.55]}>
        <boxGeometry args={[3.15, 3.55, 1.4]} />
        <meshBasicMaterial color="#070504" />
      </mesh>
      <mesh position={[0, 1.75, -1.05]} rotation={[0.08, 0, 0]}>
        <planeGeometry args={[2.55, 3.15]} />
        <meshBasicMaterial ref={glow} color="#c46a28" transparent opacity={0.42} depthWrite={false} />
      </mesh>
      {/* Inner volume so it doesn't look like a painted wall. */}
      <mesh position={[0, 1.7, 0.85]}>
        <boxGeometry args={[2.8, 3.1, 2.4]} />
        <meshBasicMaterial color="#0c0806" />
      </mesh>
      {/* Hanging roots. */}
      {[-1.15, -0.45, 0.2, 0.85, 1.25].map((s, i) => (
        <mesh key={`root${i}`} position={[s, 3.55, -1.05]} rotation={[0.35 + i * 0.08, 0.15 * i, 0.08 * i]}>
          <cylinderGeometry args={[0.025, 0.055, 1.35 + (i % 3) * 0.35, 5]} />
          {lamb("#4a3a28", { kind: "wood" })}
        </mesh>
      ))}
      {/* Torches on the jambs. */}
      {[-1.85, 1.85].map((s, i) => (
        <group key={`t${s}`} position={[s, 0.02, -1.35]}>
          <mesh position={[0, 1.15, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.09, 1.55, 6]} />
            {lamb("#4a3220", { kind: "wood" })}
          </mesh>
          <mesh
            ref={(el) => {
              flame.current[i] = el;
            }}
            position={[0, 2.02, 0]}
          >
            <sphereGeometry args={[0.13, 6, 5]} />
            <meshBasicMaterial color="#f0a040" />
          </mesh>
        </group>
      ))}
      {/* Stone wolves — silent guards, not blobs. */}
      <StoneWolf x={-3.35} z={-2.05} yaw={0.35} />
      <StoneWolf x={3.35} z={-2.05} yaw={-0.35} />
      {/* Worn dirt leading in. */}
      {[-1.15, 0, 1.15].map((s, i) => (
        <mesh key={`d${i}`} position={[s * 0.55, 0.03, -2.15 - i * 0.35]} rotation={[-Math.PI / 2, 0, 0.12 * i]} receiveShadow>
          <circleGeometry args={[0.55, 8]} />
          {lamb("#8a7048", { kind: "dirt" })}
        </mesh>
      ))}
      {/* Scatter rocks so the hill reads as stone, not a box. */}
      {[-4.6, 4.4, -3.8, 3.6, -2.2, 2.4].map((s, i) => (
        <mesh
          key={`r${i}`}
          position={[s, 0.32 + (i % 3) * 0.12, -0.2 - (i % 2) * 0.85]}
          rotation={[0.2, i * 0.7, 0.25]}
          scale={[1, 0.65, 0.85]}
          castShadow
        >
          <dodecahedronGeometry args={[0.48 + (i % 3) * 0.14, 0]} />
          {lamb(i % 2 ? "#5a4a3c" : "#4a3c30", { kind: "stone" })}
        </mesh>
      ))}
    </group>
  );
}

function StoneWolf({ x, z, yaw }: { x: number; z: number; yaw: number }) {
  return (
    <group position={[x, 0.02, z]} rotation={[0, yaw, 0]}>
      <mesh position={[0, 0.62, 0.06]} rotation={[0.12, 0, 0]} castShadow>
        <capsuleGeometry args={[0.22, 0.42, 4, 8]} />
        {lamb("#6a6258", { kind: "stone" })}
      </mesh>
      <mesh position={[0, 0.92, -0.38]} rotation={[0.2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.22, 3, 7]} />
        {lamb("#5a5248", { kind: "stone" })}
      </mesh>
      <mesh position={[0, 0.86, -0.58]} castShadow>
        <sphereGeometry args={[0.08, 6, 5]} />
        {lamb("#4a4238", { kind: "stone" })}
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.12, 1.12, -0.32]} rotation={[0.2, s * 0.15, s * 0.35]} scale={[0.7, 1.2, 0.45]} castShadow>
          <sphereGeometry args={[0.08, 6, 5]} />
          {lamb("#5a5248", { kind: "stone" })}
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`l${s}`} position={[s * 0.16, 0.28, -0.18]} castShadow>
          <capsuleGeometry args={[0.055, 0.28, 3, 5]} />
          {lamb("#5a5248", { kind: "stone" })}
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`h${s}`} position={[s * 0.14, 0.28, 0.28]} castShadow>
          <capsuleGeometry args={[0.055, 0.32, 3, 5]} />
          {lamb("#5a5248", { kind: "stone" })}
        </mesh>
      ))}
      <mesh position={[0, 0.55, 0.48]} rotation={[0.7, 0, 0]} castShadow>
        <capsuleGeometry args={[0.08, 0.28, 3, 6]} />
        {lamb("#4a4238", { kind: "stone" })}
      </mesh>
    </group>
  );
}
