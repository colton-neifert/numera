import { useRef, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { N64Hero } from "../world3d/actors";
import { live } from "../world3d/live";
import { useGame } from "../store";

export function LookCanvas() {
  return (
    <Canvas
      className="h-80 w-full rounded-lg"
      camera={{ position: [0.2, 1.32, -4.8], fov: 28, near: 0.1, far: 40 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={["#14110e"]} />
      <ambientLight intensity={0.65} />
      <hemisphereLight args={["#d7e6f2", "#6a5a40", 0.8]} />
      <directionalLight position={[-3, 8, -5]} intensity={2.35} color="#fff4d8" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[3.2, 24]} />
        <meshLambertMaterial color="#3a3228" />
      </mesh>
      <Aim />
      <Turn>
        <N64Hero />
      </Turn>
    </Canvas>
  );
}

function Aim() {
  const { camera } = useThree();
  const girl = useGame((s) => s.heroGender) === "girl";
  useFrame(() => {
    live.mounted = false;
    live.speed = 0;
    live.rolling = false;
    live.swinging = false;
    live.charging = false;
    live.spinning = false;
    live.ocarina = false;
    live.heldRock = false;
    live.heldWood = false;
    live.getItem = null;
    live.hasSword = true;
    live.hasShield = true;
    live.holding = girl ? "boom" : "sword";
    camera.lookAt(0, 1.05, 0);
  });
  return null;
}

function Turn({ children }: { children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.35;
  });
  return <group ref={ref}>{children}</group>;
}