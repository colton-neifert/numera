import { Canvas, useFrame } from "@react-three/fiber";
import { Humanoid, HERO_LOOK } from "../world3d/actors";
import { N64Foe, N64Nag } from "../world3d/n64";

export type StoryKind = "vale" | "jewels" | "oak" | "thief" | "lizards" | "you" | "king";

export function shotFromVid(vid?: string, kicker?: string): StoryKind {
  const v = (vid ?? "").toLowerCase();
  const k = (kicker ?? "").toLowerCase();
  if (v.includes("king") || k.includes("lizard king") || k === "him" || k === "fight") return "king";
  if (v.includes("jewel") || k.includes("jewel")) return "jewels";
  if (v.includes("oak") || k.includes("oak")) return "oak";
  if (v.includes("thief") || k.includes("veyr")) return "thief";
  if (v.includes("lizard") || k.includes("lizard")) return "lizards";
  if (v.includes("you") || k === "you" || k === "finish") return "you";
  return "vale";
}

export function StoryShot({ kind }: { kind: StoryKind }) {
  const cam =
    kind === "jewels" || kind === "king"
      ? ([0.4, 2.4, 7.2] as const)
      : kind === "oak"
        ? ([1.2, 2.8, 8.4] as const)
        : ([0.2, 2.2, 7.6] as const);
  const bg = kind === "jewels" || kind === "king" ? "#2a2620" : "#c5d8ea";
  return (
    <div className="relative mx-auto mb-6 h-40 w-full max-w-md overflow-hidden rounded-md border border-[#c9a227]/35 sm:h-52">
      <Canvas
        className="absolute inset-0 h-full w-full"
        camera={{ position: [...cam], fov: 42, near: 0.1, far: 80 }}
        dpr={[1, 1.4]}
        gl={{ antialias: true, alpha: false, powerPreference: "low-power" }}
      >
        <color attach="background" args={[bg]} />
        <fog attach="fog" args={[bg, 12, 28]} />
        <ambientLight intensity={kind === "king" ? 0.35 : 0.72} />
        <hemisphereLight args={["#e8dcc0", "#3a5a28", kind === "king" ? 0.3 : 0.55]} />
        <directionalLight position={[6, 10, 4]} intensity={0.7} color="#ffe8c0" />
        <Shot kind={kind} />
      </Canvas>
    </div>
  );
}

function Shot({ kind }: { kind: StoryKind }) {
  useFrame(({ camera, clock }) => {
    const t = clock.elapsedTime;
    camera.position.x = (kind === "oak" ? 1.2 : 0.2) + Math.sin(t * 0.2) * 0.12;
    camera.lookAt(0, kind === "oak" ? 1.6 : 1.15, 0);
  });
  if (kind === "jewels") return <Jewels />;
  if (kind === "oak") return <Oak />;
  if (kind === "thief") return <Thief />;
  if (kind === "lizards") return <Lizards />;
  if (kind === "you") return <You />;
  if (kind === "king") return <King />;
  return <Vale />;
}

function Ground({ color = "#7aaa4a" }: { color?: string }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[40, 40]} />
      <meshLambertMaterial color={color} />
    </mesh>
  );
}

function Tree({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.24, 1.4, 6]} />
        <meshLambertMaterial color="#5a3d24" />
      </mesh>
      <mesh position={[0, 1.85, 0]} castShadow>
        <sphereGeometry args={[0.85, 8, 6]} />
        <meshLambertMaterial color="#3d8a48" />
      </mesh>
    </group>
  );
}

function Hut({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[1.8, 1.4, 1.6]} />
        <meshLambertMaterial color="#8a6a48" />
      </mesh>
      <mesh position={[0, 1.55, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.45, 0.85, 4]} />
        <meshLambertMaterial color="#6a3a28" />
      </mesh>
    </group>
  );
}

function Vale() {
  return (
    <group>
      <Ground />
      <Hut x={-2.2} z={-1.4} />
      <Hut x={1.8} z={-2.2} />
      <Tree x={-3.4} z={0.6} s={1.1} />
      <Tree x={2.6} z={-0.4} s={0.9} />
      <Tree x={0.4} z={-3.2} s={1.25} />
      <group position={[0.3, 0, 1.1]}>
        <Humanoid look={HERO_LOOK} />
      </group>
    </group>
  );
}

function Jewels() {
  const gems = [
    { c: "#3ecf6a", x: -1.2 },
    { c: "#c45c48", x: 0 },
    { c: "#6a8ad4", x: 1.2 },
  ];
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshLambertMaterial color="#6a6864" />
      </mesh>
      {gems.map((g) => (
        <group key={g.c} position={[g.x, 0, 0]}>
          <mesh position={[0, 0.28, 0]} castShadow>
            <cylinderGeometry args={[0.32, 0.4, 0.5, 6]} />
            <meshLambertMaterial color="#5a5550" />
          </mesh>
          <mesh position={[0, 0.85, 0]}>
            <octahedronGeometry args={[0.28, 0]} />
            <meshLambertMaterial color={g.c} emissive={g.c} emissiveIntensity={0.55} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Oak() {
  return (
    <group>
      <Ground color="#6a8a48" />
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.58, 2.8, 8]} />
        <meshLambertMaterial color="#5a3d24" />
      </mesh>
      <mesh position={[0, 3.2, 0]} castShadow>
        <sphereGeometry args={[1.7, 10, 8]} />
        <meshLambertMaterial color="#3d8a48" />
      </mesh>
      <mesh position={[-1.1, 2.7, 0.4]} castShadow>
        <sphereGeometry args={[0.9, 8, 6]} />
        <meshLambertMaterial color="#2f7a3c" />
      </mesh>
    </group>
  );
}

function Thief() {
  return (
    <group>
      <Ground />
      <Tree x={-2.2} z={-1.2} />
      <group position={[0.2, 0, 0.4]} rotation={[0, 0.6, 0]}>
        <Humanoid look={{ ...HERO_LOOK, tunic: "#4a3a28", hair: "#2a2018", mouth: "frown", brows: "mad" }} />
      </group>
      <mesh position={[0.55, 1.15, 0.15]}>
        <octahedronGeometry args={[0.14, 0]} />
        <meshLambertMaterial color="#3ecf6a" emissive="#3ecf6a" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

function Lizards() {
  return (
    <group>
      <Ground color="#5a7a3a" />
      <Tree x={-2.6} z={-0.8} />
      <group position={[0, 0, 0.6]}>
        <N64Foe kind="plusling" seed={2} pose="walk" />
      </group>
      <group position={[-1.4, 0, -0.5]} rotation={[0, 0.5, 0]}>
        <N64Foe kind="plusling" seed={5} pose="idle" />
      </group>
    </group>
  );
}

function You() {
  return (
    <group>
      <Ground />
      <Tree x={2.2} z={-1.4} s={0.85} />
      <group position={[0, 0, 0.5]}>
        <Humanoid look={HERO_LOOK} hero />
      </group>
    </group>
  );
}

function King() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 18]} />
        <meshLambertMaterial color="#4a4640" />
      </mesh>
      <group position={[0, 0, 0]}>
        <N64Nag seed={1} />
      </group>
    </group>
  );
}
