import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import { Humanoid, HERO_LOOK } from "../world3d/actors";
import { N64Foe, N64Nag } from "../world3d/n64";
import { CoffinCage } from "../world3d/forgeHall";

export type StoryKind =
  | "vale"
  | "jewels"
  | "oak"
  | "thief"
  | "lizards"
  | "you"
  | "king"
  | "forge"
  | "wait"
  | "locks"
  | "lands";

export function shotFromVid(vid?: string, kicker?: string): StoryKind {
  const v = (vid ?? "").toLowerCase();
  const k = (kicker ?? "").toLowerCase();
  if (k.includes("moon hall") || k.includes("coffin") || k.includes("fang machine") || k.includes("empty locks"))
    return "forge";
  if (k.includes("last leaf") || k === "you" || k === "finish") return "you";
  if (k.includes("round hall") || k.includes("waiting") || k.includes("last hall") || k.includes("moonlight falls"))
    return "wait";
  if (k.includes("laugh") || k.includes("crowned") || k === "him" || k === "fight" || k.includes("once he was"))
    return "king";
  if (k.includes("found their places") || k.includes("the door") || (k.includes("lock") && !k.includes("empty")))
    return "locks";
  if (
    k.includes("far") ||
    k.includes("echoes") ||
    k.includes("road") ||
    k.includes("ridge") ||
    k.includes("five temples") ||
    k.includes("countries")
  )
    return "lands";
  if (v.includes("jewel") || k.includes("jewel")) return "jewels";
  if (v.includes("oak") || k.includes("oak") || k.includes("lesson")) return "oak";
  if (v.includes("thief") || k.includes("veyr")) return "thief";
  if (v.includes("lizard") || k.includes("lizard")) return "lizards";
  if (v.includes("you")) return "you";
  if (v.includes("king")) return "king";
  return "vale";
}

const CAM: Record<StoryKind, readonly [number, number, number]> = {
  vale: [2.4, 9.6, 22.8],
  jewels: [0.15, 1.9, 5.8],
  oak: [3.4, 4.8, 14.2],
  thief: [1.8, 3.2, 11.2],
  lizards: [2.4, 3.4, 12.4],
  you: [0.2, 2.85, -1.15],
  king: [1.2, 3.8, 11.6],
  forge: [0.4, 3.15, 11.2],
  wait: [0.6, 3.4, 12.4],
  locks: [0.2, 2.8, 10.2],
  lands: [0.4, 3.2, 14.5],
};

const LOOK: Record<StoryKind, readonly [number, number, number]> = {
  vale: [0.4, 3.2, -8.4],
  jewels: [0, 1.15, 0],
  oak: [0, 2.6, -0.4],
  thief: [0.1, 1.2, 0.2],
  lizards: [0, 1.1, 0.2],
  you: [-0.15, 1.5, 1.35],
  king: [0, 1.7, 0],
  forge: [0, 1.85, -2.0],
  wait: [0, 1.6, -1.2],
  locks: [0, 1.2, 0],
  lands: [0, 1.4, 0],
};

const BG: Record<StoryKind, string> = {
  vale: "#c5d8ea",
  jewels: "#1a2438",
  oak: "#c5d8ea",
  thief: "#1a2430",
  lizards: "#b8cce0",
  you: "#c5d8ea",
  king: "#1c1a16",
  forge: "#161410",
  wait: "#161410",
  locks: "#2a2620",
  lands: "#c5d8ea",
};

export function StoryShot({ kind }: { kind: StoryKind }) {
  const cam = CAM[kind];
  const bg = BG[kind];
  const dark = kind === "forge" || kind === "king" || kind === "wait" || kind === "locks" || kind === "thief";
  return (
    <div className="relative mx-auto mb-6 h-44 w-full max-w-md overflow-hidden rounded-md border border-[#c9a227]/35 sm:h-56">
      <Canvas
        className="absolute inset-0 h-full w-full"
        camera={{ position: [...cam], fov: 36, near: 0.2, far: 90 }}
        dpr={[1, 1.4]}
        gl={{ antialias: true, alpha: false, powerPreference: "low-power" }}
      >
        <color attach="background" args={[bg]} />
        <fog attach="fog" args={[bg, dark ? 16 : 18, dark ? 42 : 48]} />
        <ambientLight intensity={dark ? 0.55 : 0.78} />
        <hemisphereLight args={["#e8dcc0", "#3a5a28", dark ? 0.45 : 0.62]} />
        <directionalLight position={[8, 14, 6]} intensity={dark ? 0.85 : 1.05} color="#ffe8c0" />
        <Shot kind={kind} />
      </Canvas>
    </div>
  );
}

function Shot({ kind }: { kind: StoryKind }) {
  useFrame(({ camera, clock }) => {
    const t = clock.elapsedTime;
    const [cx, cy, cz] = CAM[kind];
    const [lx, ly, lz] = LOOK[kind];
    camera.position.set(cx + Math.sin(t * 0.16) * 0.18, cy, cz);
    camera.lookAt(lx, ly, lz);
  });
  if (kind === "jewels") return <Jewels />;
  if (kind === "oak") return <Oak />;
  if (kind === "thief") return <Thief />;
  if (kind === "lizards") return <Lizards />;
  if (kind === "you") return <You />;
  if (kind === "king") return <King />;
  if (kind === "forge") return <Forge />;
  if (kind === "wait") return <Wait />;
  if (kind === "locks") return <Locks />;
  if (kind === "lands") return <Lands />;
  return <Vale />;
}

function Ground({ color = "#7aaa4a" }: { color?: string }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[80, 80]} />
      <meshLambertMaterial color={color} />
    </mesh>
  );
}

function Tree({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 2.15, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.48, 4.3, 7]} />
        <meshLambertMaterial color="#5a3d24" />
      </mesh>
      <mesh position={[0, 5.15, 0]} castShadow>
        <sphereGeometry args={[2.05, 9, 7]} />
        <meshLambertMaterial color="#2f7a3c" />
      </mesh>
      <mesh position={[1.15, 4.55, 0.55]} castShadow>
        <sphereGeometry args={[1.25, 8, 6]} />
        <meshLambertMaterial color="#3d8a48" />
      </mesh>
      <mesh position={[-1.05, 4.7, -0.4]} castShadow>
        <sphereGeometry args={[1.15, 8, 6]} />
        <meshLambertMaterial color="#245a28" />
      </mesh>
    </group>
  );
}

function TreeHouse({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 3.4, 0]} castShadow>
        <cylinderGeometry args={[0.85, 1.15, 6.8, 8]} />
        <meshLambertMaterial color="#5a3d24" />
      </mesh>
      <mesh position={[2.4, 5.4, 0.2]} rotation={[0.08, 0.4, 0.55]} castShadow>
        <cylinderGeometry args={[0.28, 0.42, 5.2, 7]} />
        <meshLambertMaterial color="#4a3220" />
      </mesh>
      {[
        [0, 8.2, 0, 2.85],
        [1.6, 7.6, 1.1, 2.05],
        [-1.7, 7.7, -0.6, 1.9],
        [0.4, 8.9, -1.3, 1.7],
        [-0.8, 8.5, 1.4, 1.55],
      ].map((p, i) => (
        <mesh key={i} position={[p[0], p[1], p[2]]} castShadow>
          <sphereGeometry args={[p[3], 10, 8]} />
          <meshLambertMaterial color={i % 2 ? "#2a6a32" : "#245a28"} />
        </mesh>
      ))}
      <group position={[4.15, 6.05, 0.15]}>
        <mesh position={[0, -0.12, 0]} receiveShadow>
          <boxGeometry args={[3.6, 0.22, 3.1]} />
          <meshLambertMaterial color="#8a5a28" />
        </mesh>
        <mesh position={[0, 1.15, 0]} castShadow>
          <boxGeometry args={[3.35, 2.2, 2.85]} />
          <meshLambertMaterial color="#efe4cc" />
        </mesh>
        <mesh position={[0, 2.55, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[2.55, 1.55, 4]} />
          <meshLambertMaterial color="#8a3a28" />
        </mesh>
        <mesh position={[0, 0.55, 1.52]}>
          <boxGeometry args={[0.72, 1.15, 0.08]} />
          <meshLambertMaterial color="#5a3d24" />
        </mesh>
        <mesh position={[1.4, -0.05, 2.05]} receiveShadow>
          <boxGeometry args={[1.6, 0.16, 1.4]} />
          <meshLambertMaterial color="#7a4a22" />
        </mesh>
      </group>
    </group>
  );
}

function ValeCottage({
  x,
  z,
  rot = 0,
  cream = false,
  door = -0.85,
  chimney = 1.7,
}: {
  x: number;
  z: number;
  rot?: number;
  cream?: boolean;
  door?: number;
  chimney?: number;
}) {
  const wall = cream ? "#f4e7cf" : "#e6d2b0";
  const roof = cream ? "#9a3a2c" : "#7d3428";
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.22, 0]} receiveShadow>
        <boxGeometry args={[6.1, 0.44, 5.1]} />
        <meshLambertMaterial color="#8d7b62" />
      </mesh>
      <mesh position={[0, 2.35, 0]} castShadow>
        <boxGeometry args={[5.15, 3.7, 4.15]} />
        <meshLambertMaterial color={wall} />
      </mesh>
      {[-2.52, 2.52].map((px) => (
        <mesh key={px} position={[px, 2.35, 2.1]} castShadow>
          <boxGeometry args={[0.18, 3.7, 0.12]} />
          <meshLambertMaterial color="#5a3a24" />
        </mesh>
      ))}
      <mesh position={[0, 4.05, 2.12]}>
        <boxGeometry args={[5.15, 0.16, 0.1]} />
        <meshLambertMaterial color="#5a3a24" />
      </mesh>
      <mesh position={[0, 1.15, 2.12]}>
        <boxGeometry args={[5.15, 0.18, 0.1]} />
        <meshLambertMaterial color="#5a3a24" />
      </mesh>
      <mesh position={[door, 1.45, 2.16]} castShadow>
        <boxGeometry args={[1.05, 2.15, 0.1]} />
        <meshLambertMaterial color="#4a301c" />
      </mesh>
      <mesh position={[door, 0.42, 2.35]} receiveShadow>
        <boxGeometry args={[1.45, 0.16, 0.4]} />
        <meshLambertMaterial color="#6a4a30" />
      </mesh>
      {[door < 0 ? 1.15 : -1.35, door < 0 ? 1.95 : -2.05].map((wx, i) => (
        <group key={wx} position={[wx, 2.35, 2.14]}>
          <mesh>
            <boxGeometry args={[0.78, 0.78, 0.08]} />
            <meshLambertMaterial color="#5a3a24" />
          </mesh>
          <mesh position={[0, 0, 0.04]}>
            <boxGeometry args={[0.52, 0.52, 0.06]} />
            <meshLambertMaterial
              color={i === 0 ? "#f2d48a" : "#c5d6ea"}
              emissive={i === 0 ? "#e8b050" : "#000000"}
              emissiveIntensity={i === 0 ? 0.25 : 0}
            />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 4.95, 1.05]} rotation={[0.72, 0, 0]} castShadow>
        <boxGeometry args={[6.3, 0.22, 3.15]} />
        <meshLambertMaterial color={roof} />
      </mesh>
      <mesh position={[0, 4.95, -1.05]} rotation={[-0.72, 0, 0]} castShadow>
        <boxGeometry args={[6.3, 0.22, 3.15]} />
        <meshLambertMaterial color={roof} />
      </mesh>
      <mesh position={[0, 5.72, 0]} castShadow>
        <boxGeometry args={[6.35, 0.16, 0.28]} />
        <meshLambertMaterial color="#5c2a22" />
      </mesh>
      <mesh position={[chimney, 5.55, -0.35]} castShadow>
        <boxGeometry args={[0.55, 1.55, 0.55]} />
        <meshLambertMaterial color="#6a4030" />
      </mesh>
      <mesh position={[chimney, 6.4, -0.35]}>
        <boxGeometry args={[0.7, 0.16, 0.7]} />
        <meshLambertMaterial color="#4a2c22" />
      </mesh>
    </group>
  );
}

function Vale() {
  return (
    <group>
      <Ground />
      {/* Distant trees only — keep them off the camera path so this shot never flies through a canopy. */}
      <Tree x={-16.5} z={-4.2} s={2.15} />
      <Tree x={18.2} z={-6.4} s={2.35} />
      <Tree x={-20.4} z={3.2} s={1.45} />
      <Tree x={21.2} z={2.2} s={1.55} />
      <group position={[0.8, 0, -16.5]}>
        <mesh position={[0, 1.2, 0]} receiveShadow>
          <cylinderGeometry args={[7.2, 8.4, 2.4, 8]} />
          <meshLambertMaterial color="#6d8a4a" />
        </mesh>
        <mesh position={[0, 5.4, 0]} castShadow>
          <boxGeometry args={[3.4, 6.4, 3.1]} />
          <meshLambertMaterial color="#c4a070" />
        </mesh>
        <mesh position={[0, 8.85, 0]} castShadow>
          <boxGeometry args={[3.7, 0.35, 3.4]} />
          <meshLambertMaterial color="#8a4030" />
        </mesh>
        {[
          [-2.35, 0.15],
          [2.25, -0.2],
          [0.15, 2.05],
        ].map(([tx, tz], i) => (
          <group key={i} position={[tx, 0, tz]}>
            <mesh position={[0, 4.6, 0]} castShadow>
              <cylinderGeometry args={[0.85, 1.05, 7.2, 8]} />
              <meshLambertMaterial color="#b89068" />
            </mesh>
            <mesh position={[0, 8.7, 0]} castShadow>
              <coneGeometry args={[1.35, 2.1, 8]} />
              <meshLambertMaterial color="#a83828" />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 5.1, 1.58]}>
          <boxGeometry args={[0.7, 1.15, 0.08]} />
          <meshLambertMaterial color="#3a2a22" />
        </mesh>
        <mesh position={[0.7, 6.4, 1.58]}>
          <boxGeometry args={[0.45, 0.7, 0.08]} />
          <meshLambertMaterial color="#e8d090" emissive="#e0a848" emissiveIntensity={0.2} />
        </mesh>
      </group>
      <ValeCottage x={-8.4} z={0.2} rot={0.18} door={-0.9} chimney={1.65} />
      <ValeCottage x={8.2} z={1.1} rot={-0.22} cream door={0.7} chimney={-1.55} />
      <ValeCottage x={-0.6} z={-3.4} rot={0.04} door={-0.2} chimney={1.85} />
      <group position={[0.4, 0, 6.2]} scale={0.92}>
        <Humanoid look={HERO_LOOK} hero />
      </group>
    </group>
  );
}

function GlowGem({ x, color }: { x: number; color: string }) {
  const gem = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!gem.current) return;
    const t = clock.elapsedTime;
    gem.current.position.y = 1.62 + Math.sin(t * 1.5 + x * 3) * 0.07;
    gem.current.rotation.y = t * 0.7;
  });
  return (
    <group position={[x, 0, 0.1]}>
      <mesh position={[0, 0.58, 0]} castShadow>
        <cylinderGeometry args={[0.46, 0.56, 0.78, 8]} />
        <meshLambertMaterial color="#6a645c" />
      </mesh>
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.52, 0.52, 0.08, 10]} />
        <meshLambertMaterial color="#e6c45e" emissive="#c9a227" emissiveIntensity={0.4} />
      </mesh>
      <mesh ref={gem} position={[0, 1.62, 0]}>
        <octahedronGeometry args={[0.52, 0]} />
        <meshLambertMaterial color={color} emissive={color} emissiveIntensity={1.6} />
      </mesh>
      <pointLight position={[0, 1.8, 0.3]} color={color} intensity={2.2} distance={5} />
    </group>
  );
}

function Jewels() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <circleGeometry args={[8, 40]} />
        <meshLambertMaterial color="#3e4658" />
      </mesh>
      <mesh position={[0, 0.16, 0]} receiveShadow>
        <cylinderGeometry args={[2.55, 2.9, 0.32, 10]} />
        <meshLambertMaterial color="#8a8074" />
      </mesh>
      <mesh position={[0, 0.34, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.45, 2.05, 36]} />
        <meshLambertMaterial color="#f0d56a" emissive="#e2b84a" emissiveIntensity={0.55} />
      </mesh>
      <GlowGem x={-1.45} color="#3dcc62" />
      <GlowGem x={0} color="#e05848" />
      <GlowGem x={1.45} color="#5a88e8" />
    </group>
  );
}

function Oak() {
  return (
    <group>
      <Ground color="#6a8a48" />
      <mesh position={[0, 3.4, 0]} castShadow>
        <cylinderGeometry args={[0.85, 1.15, 6.8, 8]} />
        <meshLambertMaterial color="#5a3d24" />
      </mesh>
      <mesh position={[0, 8.1, 0]} castShadow>
        <sphereGeometry args={[3.4, 12, 9]} />
        <meshLambertMaterial color="#2f7a3c" />
      </mesh>
      <mesh position={[-2.2, 7.1, 1.1]} castShadow>
        <sphereGeometry args={[2.05, 9, 7]} />
        <meshLambertMaterial color="#245a28" />
      </mesh>
      <mesh position={[2.05, 7.4, -0.7]} castShadow>
        <sphereGeometry args={[1.85, 9, 7]} />
        <meshLambertMaterial color="#3d8a48" />
      </mesh>
      <mesh position={[1.6, 10.4, 0.4]}>
        <sphereGeometry args={[0.22, 8, 6]} />
        <meshLambertMaterial color="#7aca48" emissive="#5aaa38" emissiveIntensity={0.55} />
      </mesh>
    </group>
  );
}

function Thief() {
  return (
    <group>
      <Ground color="#3a5a38" />
      <Tree x={-4.4} z={-2.2} s={1.2} />
      <Tree x={3.8} z={-3.4} s={1.05} />
      <group position={[0, 0, 0.6]} rotation={[0, 0.35, 0]}>
        <Humanoid look={{ ...HERO_LOOK, tunic: "#4a3a28", hair: "#2a2018", mouth: "frown", brows: "mad" }} offer />
        {[
          ["#3ecf6a", -0.22, 2.05, -0.12],
          ["#c45c48", 0.05, 2.22, -0.18],
          ["#6a8ad4", 0.26, 2.02, -0.1],
        ].map(([c, x, y, z]) => (
          <mesh key={c} position={[x as number, y as number, z as number]}>
            <octahedronGeometry args={[0.16, 0]} />
            <meshLambertMaterial color={c as string} emissive={c as string} emissiveIntensity={0.9} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function GuardFang({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, Math.PI, 0]} scale={0.92}>
      <N64Foe kind="timesprout" seed={x > 0 ? 4 : 9} pose="guard" world="keep" />
    </group>
  );
}

function Lizards() {
  return (
    <group>
      <Ground color="#5a7a3a" />
      <Tree x={-5.2} z={-1.6} s={1.2} />
      <Tree x={4.6} z={-2.4} s={1.05} />
      <GuardFang x={-1.35} z={0.85} />
      <GuardFang x={1.45} z={0.7} />
    </group>
  );
}

function You() {
  return (
    <group>
      <Ground />
      <Tree x={-3.8} z={-2.2} s={1.25} />
      <mesh position={[2.4, 3.1, -1.6]} castShadow>
        <cylinderGeometry args={[0.42, 0.58, 6.2, 8]} />
        <meshLambertMaterial color="#5a3d24" />
      </mesh>
      <mesh position={[2.4, 6.6, -1.6]} castShadow>
        <sphereGeometry args={[1.15, 9, 7]} />
        <meshLambertMaterial color="#3a4a28" />
      </mesh>
      <mesh position={[2.85, 7.55, -1.35]}>
        <sphereGeometry args={[0.18, 8, 6]} />
        <meshLambertMaterial color="#7aca48" emissive="#5aaa38" emissiveIntensity={0.7} />
      </mesh>
      <group position={[-0.2, 0, 1.6]}>
        <Humanoid look={HERO_LOOK} hero offer />
        <mesh position={[0, 2.15, -0.16]}>
          <octahedronGeometry args={[0.2, 0]} />
          <meshLambertMaterial color="#3dcc62" emissive="#3dcc62" emissiveIntensity={1.3} />
        </mesh>
      </group>
    </group>
  );
}

function HallFloor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[9, 32]} />
        <meshLambertMaterial color="#4a4640" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[1.15, 2.05, 28]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
      <mesh position={[0, 3.1, -5.4]} castShadow>
        <boxGeometry args={[14, 6.4, 0.45]} />
        <meshLambertMaterial color="#5a5650" />
      </mesh>
      <mesh position={[0, 4.55, -5.15]}>
        <circleGeometry args={[0.95, 22]} />
        <meshBasicMaterial color="#eef4ff" />
      </mesh>
      <pointLight position={[0, 4.2, -2]} intensity={18} color="#dce8ff" distance={16} />
    </group>
  );
}

function Forge() {
  return (
    <group>
      <HallFloor />
      <CoffinCage open={0} z={-2.85} />
      <GuardFang x={-2.85} z={-2.55} />
      <GuardFang x={2.85} z={-2.55} />
    </group>
  );
}

function Wait() {
  return (
    <group>
      <HallFloor />
      <group position={[0, 0, -0.4]} rotation={[0, Math.PI, 0]} scale={0.78}>
        <N64Nag seed={2} />
      </group>
    </group>
  );
}

function King() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[22, 22]} />
        <meshLambertMaterial color="#3a3834" />
      </mesh>
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 2.1, 28]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
      <group position={[0, 0, 0.2]} rotation={[0, Math.PI, 0]} scale={0.82}>
        <N64Nag seed={1} />
      </group>
    </group>
  );
}

function Locks() {
  const gems = [
    { c: "#3ecf6a", x: -1.7 },
    { c: "#c45c48", x: 0 },
    { c: "#6a8ad4", x: 1.7 },
  ];
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[22, 22]} />
        <meshLambertMaterial color="#4a4640" />
      </mesh>
      <mesh position={[0, 1.55, -2.4]} castShadow>
        <boxGeometry args={[5.4, 3.1, 0.45]} />
        <meshLambertMaterial color="#3a3834" />
      </mesh>
      <mesh position={[0, 1.55, -2.18]}>
        <boxGeometry args={[1.15, 2.05, 0.12]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
      {gems.map((g) => (
        <group key={g.c} position={[g.x, 0, 0.6]}>
          <mesh position={[0, 0.28, 0]} castShadow>
            <cylinderGeometry args={[0.34, 0.42, 0.52, 6]} />
            <meshLambertMaterial color="#5a5550" />
          </mesh>
          <mesh position={[0, 0.92, 0]}>
            <octahedronGeometry args={[0.3, 0]} />
            <meshLambertMaterial color={g.c} emissive={g.c} emissiveIntensity={0.65} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Lands() {
  const bits: { x: number; ground: string; top: string }[] = [
    { x: -6.4, ground: "#3d8a48", top: "#2f7a3c" },
    { x: -3.2, ground: "#8a4830", top: "#c45c48" },
    { x: 0, ground: "#3a6a88", top: "#6a8ad4" },
    { x: 3.2, ground: "#2a2a38", top: "#5a5a78" },
    { x: 6.4, ground: "#c4a06a", top: "#d4b05a" },
  ];
  return (
    <group>
      <Ground color="#6a8a48" />
      {bits.map((b, i) => (
        <group key={i} position={[b.x, 0, -1.2]}>
          <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[1.35, 12]} />
            <meshLambertMaterial color={b.ground} />
          </mesh>
          <mesh position={[0, 1.15, 0]} castShadow>
            <coneGeometry args={[0.85, 2.2, 6]} />
            <meshLambertMaterial color={b.top} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
