import { useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { HERO_LOOK, Humanoid, N64Hero, type HumanLook } from "../world3d/actors";
import { N64Foe } from "../world3d/n64";
import { live } from "../world3d/live";
import { getStoryEnv } from "../world3d/mats";
import { atmo } from "../world3d/lush/atmo";
import { LushSky } from "../world3d/lush/sky";
import { LushTree, LushTreeClock } from "../world3d/lush/trees";

/**
 * Character lab: the cast lined up on a patch of turf, lit exactly like the meadow at golden hour.
 * Light to render, so faces and outfits can be tuned without booting the whole world.
 */

const SUN = new THREE.Vector3(-0.52, 0.34, 0.78).normalize();

function Light() {
  const { scene } = useThree();
  useEffect(() => {
    atmo.sunDir.copy(SUN);
    atmo.sunColor.set("#ffc58a");
    atmo.sunI = 1;
    atmo.dusk = 0;
    atmo.horizon.set("#f1d3a2");
    atmo.zenith.set("#7fa3c4");
    const env = getStoryEnv();
    if (env) scene.environment = env;
    scene.environmentIntensity = 0;
    live.charView = false;
    live.hasSword = true;
    live.hasShield = true;
    live.holding = "sword";
    live.grounded = true;
    const anim = new URLSearchParams(window.location.search).get("anim");
    live.speed = anim === "walk" ? 3 : anim === "run" ? 7 : 0;
    live.swinging = anim === "swing";
  }, [scene]);
  return (
    <>
      <fog attach="fog" args={["#f1d3a2", 40, 400]} />
      <ambientLight intensity={0.16} />
      <hemisphereLight args={["#c6d8ee", "#73803c", 0.92]} />
      <directionalLight
        position={[SUN.x * 30, SUN.y * 30, SUN.z * 30]}
        intensity={2.5}
        color="#ffc58a"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-camera-near={1}
        shadow-camera-far={80}
        shadow-bias={-0.0002}
        shadow-normalBias={0.04}
      />
      <directionalLight position={[2, 6, -12]} intensity={0.74} color="#cfe0f6" />
      <directionalLight position={[-14, 5, 2]} intensity={0.5} color="#ffc070" />
    </>
  );
}

const CAMS: Record<string, { p: [number, number, number]; t: [number, number, number]; fov: number }> = {
  front: { p: [0, 1.25, -4.6], t: [0, 1.05, 0], fov: 30 },
  face: { p: [0.25, 1.55, -1.9], t: [0, 1.42, 0], fov: 30 },
  side: { p: [-4.6, 1.25, 0], t: [0, 1.05, 0], fov: 30 },
  back: { p: [0.6, 1.5, 4.6], t: [0, 1.05, 0], fov: 30 },
  three: { p: [-2.6, 1.5, -3.9], t: [0, 1.05, 0], fov: 30 },
  wide: { p: [0, 2.2, -11], t: [0, 1.1, 0], fov: 34 },
};

function Cam({ cam }: { cam: string }) {
  const { camera } = useThree();
  useFrame(() => {
    const c = CAMS[cam] ?? CAMS.front!;
    camera.position.set(...c.p);
    (camera as THREE.PerspectiveCamera).fov = c.fov;
    camera.lookAt(...c.t);
    camera.updateProjectionMatrix();
  });
  return null;
}

const VILLAGER: HumanLook = { ...HERO_LOOK, tunic: "#8a3a38", shirt: "#efe6d4", kit: "dress", kerchief: "#c8b090", longHair: true, pants: "#8a3a38" };
const FARMER: HumanLook = { ...HERO_LOOK, tunic: "#5a3a22", shirt: "#a83838", kit: "vest", hairStyle: "curly", pants: "#3a5a88" };

export function CharLab() {
  const q = useMemo(() => new URLSearchParams(typeof window === "undefined" ? "" : window.location.search), []);
  const who = q.get("who") ?? "all";
  const cam = q.get("cam") ?? (who === "all" ? "wide" : "three");
  const foe = q.get("foe") ?? "plusling";
  // Characters face -Z, toward the camera.
  const cast: { key: string; node: React.ReactNode }[] = [
    { key: "hero", node: <N64Hero /> },
    { key: "girl", node: <Humanoid look={VILLAGER} moodId="smile" /> },
    { key: "man", node: <Humanoid look={FARMER} moodId="smile" /> },
    { key: "kid", node: <Humanoid look={FARMER} kid moodId="laugh" /> },
    { key: "foe", node: <N64Foe kind={foe} seed={3} pose={(q.get("pose") as "idle") ?? "idle"} world="meadow" /> },
    { key: "foe2", node: <N64Foe kind="timesprout" seed={5} pose="idle" world="meadow" /> },
    { key: "boss", node: <N64Foe kind="remainder" seed={7} pose="idle" world="meadow" /> },
  ];
  const shown = who === "all" ? cast : who === "duel" ? cast.filter((c) => c.key === "hero" || c.key === "foe") : cast.filter((c) => c.key === who);
  return (
    <div style={{ position: "fixed", inset: 0, background: "#f1d3a2" }}>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ fov: 30, near: 0.1, far: 2600, position: [0, 1.25, -4.6] }}
        gl={{ antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.02 }}
        onCreated={({ gl }) => {
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <Light />
        <LushSky />
        <LushTreeClock />
        <Cam cam={cam} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[60, 48]} />
          <meshStandardMaterial color="#5c9230" roughness={0.96} />
        </mesh>
        <LushTree kind="oak" variant={1} position={[-5.5, -0.1, 7]} scale={1.2} />
        <LushTree kind="pine" variant={2} position={[6.5, -0.1, 9]} scale={1.1} />
        {shown.map((c, i) => (
          <group key={c.key} position={[(i - (shown.length - 1) / 2) * -1.7, 0, 0]}>
            {c.node}
          </group>
        ))}
      </Canvas>
    </div>
  );
}
