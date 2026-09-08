import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { N64Nag } from "../world3d/n64";
import { sfx } from "../audio";

export function NagCanvas() {
  useEffect(() => {
    const t = window.setTimeout(() => sfx.laugh(), 400);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <Canvas
      className="absolute inset-0 h-full w-full"
      camera={{ position: [0.2, 2.55, 8.4], fov: 38, near: 0.1, far: 80 }}
      shadows
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
    >
      <NagScene />
    </Canvas>
  );
}

function NagScene() {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3(0, 1.55, -3.1));
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const u = Math.min(1, t / 7.5);
    const s = u * u * (3 - 2 * u);
    camera.position.set(
      0.15 + Math.sin(t * 0.16) * 0.22,
      2.35 + (1 - s) * 0.55,
      7.85 - s * 2.15 + Math.cos(t * 0.13) * 0.12,
    );
    look.current.set(0, 1.62 + Math.sin(t * 1.8) * 0.04, -3.15);
    camera.lookAt(look.current);
  });
  const stone = "#6a6560";
  const wall = "#5a5550";
  const dark = "#3a3834";
  return (
    <>
      <color attach="background" args={["#1a1814"]} />
      <fog attach="fog" args={["#2a2620", 10, 28]} />
      <ambientLight intensity={0.38} />
      <hemisphereLight args={["#e8dcc0", "#3a3228", 0.45]} />
      <directionalLight position={[4, 8, 6]} intensity={0.55} color="#ffe2b0" />
      <pointLight position={[0, 3.2, 1.2]} intensity={22} color="#ffe2b0" distance={18} />
      <pointLight position={[-3.4, 2.6, -2.2]} intensity={10} color="#ffd8a0" distance={10} />
      <pointLight position={[3.2, 2.4, -1.4]} intensity={8} color="#e8a060" distance={9} />
      <mesh position={[0, -0.28, -1.2]} receiveShadow>
        <boxGeometry args={[18, 0.62, 16]} />
        <meshLambertMaterial color="#4a4640" />
      </mesh>
      <mesh position={[0, 0.04, -1.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14.4, 12.6]} />
        <meshLambertMaterial color={stone} />
      </mesh>
      <mesh position={[0, 4.2, -1.2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14.4, 12.6]} />
        <meshLambertMaterial color={dark} />
      </mesh>
      {[
        [0, 4.9, 14.4, 0.5],
        [0, -7.3, 14.4, 0.5],
        [7.0, -1.2, 0.5, 12.6],
        [-7.0, -1.2, 0.5, 12.6],
      ].map(([wx, wz, ww, dd], i) => (
        <mesh key={i} position={[wx, 2.1, wz]} castShadow>
          <boxGeometry args={[ww as number, 4.2, dd as number]} />
          <meshLambertMaterial color={wall} />
        </mesh>
      ))}
      {([-4.2, 4.2] as const).map((cx) =>
        ([-2.4, 2.2] as const).map((cz) => (
          <mesh key={`${cx}-${cz}`} position={[cx, 2.05, cz - 1.2]} castShadow>
            <cylinderGeometry args={[0.28, 0.34, 4.1, 8]} />
            <meshLambertMaterial color="#7a7570" />
          </mesh>
        )),
      )}
      <mesh position={[0, 0.55, -4.75]} castShadow>
        <boxGeometry args={[2.4, 1.1, 1.15]} />
        <meshLambertMaterial color="#4a4038" />
      </mesh>
      <mesh position={[0, 1.35, -5.05]} castShadow>
        <boxGeometry args={[1.6, 1.55, 0.45]} />
        <meshLambertMaterial color="#3a322c" />
      </mesh>
      {([-1.55, 0, 1.55] as const).map((gx, i) => (
        <group key={i} position={[gx, 0, -3.55]}>
          <mesh position={[0, 0.28, 0]} castShadow>
            <cylinderGeometry args={[0.38, 0.48, 0.55, 6]} />
            <meshLambertMaterial color={stone} />
          </mesh>
          <mesh position={[0, 0.62, 0]}>
            <octahedronGeometry args={[0.12, 0]} />
            <meshLambertMaterial color={i === 0 ? "#3ecf6a" : i === 1 ? "#c45c48" : "#6a8ad4"} transparent opacity={0.28} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 2.55, 4.9]}>
        <boxGeometry args={[2.2, 3.1, 0.28]} />
        <meshLambertMaterial color="#2a2018" />
      </mesh>
      <group position={[0, 0.02, -3.15]}>
        <N64Nag laugh seed={1} />
      </group>
    </>
  );
}
