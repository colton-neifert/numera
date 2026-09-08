import { useRef, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { N64Hero, type FighterAct } from "../world3d/actors";
import { N64Foe } from "../world3d/n64";

export type CombatStageProps = {
  enemyKind: string;
  heroAct: FighterAct;
  foeAct: FighterAct;
  boss?: boolean;
  element?: string;
  bolt?: boolean;
  heroDash?: number;
  foeDash?: number;
  slow?: boolean;
};

export function CombatStage({
  enemyKind,
  heroAct,
  foeAct,
  boss,
  element,
  bolt,
  heroDash = 0,
  foeDash = 0,
  slow,
}: CombatStageProps) {
  return (
    <Canvas
      className="absolute inset-0 h-full w-full"
      camera={{ position: [0, 1.85, 6.4], fov: 36, near: 0.1, far: 40 }}
      shadows
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#0c0b09"]} />
      <fog attach="fog" args={["#0c0b09", 8, 20]} />
      <ambientLight intensity={0.32} />
      <spotLight
        position={[-3.2, 6.5, 4]}
        angle={0.48}
        penumbra={0.55}
        intensity={52}
        color="#fff1d0"
        castShadow
      />
      <spotLight position={[3.4, 6.2, 4]} angle={0.46} penumbra={0.6} intensity={40} color="#c8d8ff" />
      <hemisphereLight args={["#4a3a28", "#1a1410", 0.45]} />
      <StageFloor />
      <Dashers heroDash={heroDash} foeDash={foeDash} slow={slow}>
        <group rotation={[0, -0.55, 0]}>
          <N64Hero act={heroAct} />
          {heroAct === "slam" ? <SlamRing /> : null}
          {heroAct === "slam" ? <SwordCut /> : null}
        </group>
        <group rotation={[0, 0.55, 0]} scale={boss ? 1.25 : 1}>
          <N64Foe kind={enemyKind} act={foeAct} />
          {foeAct === "slam" ? <SlamRing dark /> : null}
        </group>
      </Dashers>
      {bolt ? <StageBolt element={element} reverse={false} /> : null}
    </Canvas>
  );
}

function Dashers({
  heroDash,
  foeDash,
  slow,
  children,
}: {
  heroDash: number;
  foeDash: number;
  slow?: boolean;
  children: [ReactNode, ReactNode];
}) {
  const hero = useRef<THREE.Group>(null);
  const foe = useRef<THREE.Group>(null);
  const h = useRef(0);
  const f = useRef(0);
  useFrame((_, dt) => {
    const k = 1 - Math.exp(-dt * (slow ? 4 : 10));
    h.current += (heroDash - h.current) * k;
    f.current += (foeDash - f.current) * k;
    if (hero.current) hero.current.position.set(-2.15 + h.current * 3.55, 0.55, 0.2);
    if (foe.current) foe.current.position.set(2.2 - f.current * 3.55, 0.55, 0.15);
  });
  const kids = children;
  return (
    <>
      <group ref={hero} position={[-2.15, 0.55, 0.2]}>
        {kids[0]}
      </group>
      <group ref={foe} position={[2.2, 0.55, 0.15]}>
        {kids[1]}
      </group>
    </>
  );
}

function StageFloor() {
  return (
    <group>
      <mesh position={[0, -0.12, 0.4]} receiveShadow>
        <boxGeometry args={[9.2, 0.28, 5.4]} />
        <meshLambertMaterial color="#4a3a28" />
      </mesh>
      <mesh position={[0, 0.04, 0.4]} receiveShadow>
        <boxGeometry args={[8.6, 0.08, 4.8]} />
        <meshLambertMaterial color="#5a4a34" />
      </mesh>
      <mesh position={[0, 0.1, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.1, 3.28, 40]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
      <mesh position={[-2.15, 0.14, 0.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.92, 20]} />
        <meshLambertMaterial color="#3a3228" />
      </mesh>
      <mesh position={[2.2, 0.14, 0.15]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.92, 20]} />
        <meshLambertMaterial color="#3a3228" />
      </mesh>
      {[-1.15, 0, 1.15].map((z) => (
        <mesh key={z} position={[0, -0.02, 2.9 + z * 0.08]} receiveShadow>
          <boxGeometry args={[2.4, 0.16, 0.55]} />
          <meshLambertMaterial color="#3a3024" />
        </mesh>
      ))}
      <mesh position={[0, 3.4, -2.8]}>
        <planeGeometry args={[16, 7]} />
        <meshLambertMaterial color="#14110e" />
      </mesh>
      {[-4.2, 4.2].map((x) => (
        <mesh key={x} position={[x, 2.2, -2.1]}>
          <boxGeometry args={[1.6, 5.2, 0.5]} />
          <meshLambertMaterial color="#2a2218" />
        </mesh>
      ))}
      <mesh position={[0, 4.6, -2.2]}>
        <boxGeometry args={[10, 0.35, 0.6]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
    </group>
  );
}

function StageBolt({ element, reverse }: { element?: string; reverse?: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const t = useRef(0);
  const color =
    element === "fire" ? "#e07038" : element === "ice" ? "#7ec8d4" : element === "storm" ? "#e8d48a" : element === "dark" ? "#6a4a78" : "#7dba5a";
  useFrame((_, dt) => {
    t.current += dt;
    if (!ref.current) return;
    const u = Math.min(1, t.current * 1.55);
    const x = reverse ? 2.1 - u * 4.2 : -2.1 + u * 4.2;
    ref.current.position.set(x, 1.15 + Math.sin(u * 10) * 0.12, 0.2);
    ref.current.scale.setScalar(0.7 + Math.sin(u * 14) * 0.15);
  });
  return (
    <group ref={ref} position={[reverse ? 2.1 : -2.1, 1.15, 0.2]}>
      <mesh>
        <sphereGeometry args={[0.14, 8, 6]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.22, 8, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

function SwordCut() {
  const ref = useRef<THREE.Group>(null);
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt;
    if (!ref.current) return;
    const u = Math.min(1, t.current * 2.4);
    ref.current.rotation.y = -0.4 + u * 2.6;
    ref.current.position.set(0.35 + u * 3.2, 1.05, 0.15);
    ref.current.visible = u < 1;
  });
  return (
    <group ref={ref} position={[0.4, 1.05, 0.15]}>
      <mesh rotation={[0.2, 0, 0.9]}>
        <boxGeometry args={[1.6, 0.04, 0.22]} />
        <meshBasicMaterial color="#e8f0ff" />
      </mesh>
      <mesh rotation={[0.2, 0, 0.9]}>
        <boxGeometry args={[1.9, 0.18, 0.06]} />
        <meshBasicMaterial color="#fff6c8" transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

function SlamRing({ dark }: { dark?: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt;
    if (!ref.current) return;
    const u = Math.min(1, t.current * 2.4);
    ref.current.scale.setScalar(0.4 + u * 2.2);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = 1 - u;
  });
  return (
    <mesh ref={ref} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.35, 0.48, 24]} />
      <meshBasicMaterial color={dark ? "#6a4a78" : "#e8d48a"} transparent opacity={1} />
    </mesh>
  );
}
