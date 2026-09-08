import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import * as THREE from "three";
import { N64Hero, N64Horse } from "../world3d/actors";
import { live } from "../world3d/live";
import { playTheme } from "../audio";
import { introMood } from "./mood";

const _look = new THREE.Vector3();
const _cam = new THREE.Vector3();

export function RideCanvas() {
  useEffect(() => {
    live.mounted = true;
    live.speed = 11;
    introMood.rideFade = 0;
    playTheme("ride");
    return () => {
      live.mounted = false;
      live.speed = 0;
      introMood.rideFade = 0;
      playTheme("none");
    };
  }, []);
  return (
    <Canvas
      className="absolute inset-0 h-full w-full"
      camera={{ position: [8, 4.2, 14], fov: 36, near: 0.2, far: 180 }}
      shadows
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
    >
      <RideScene />
    </Canvas>
  );
}

function RideScene() {
  const hero = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const shot = useRef(0);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const loop = 52;
    const u = (t * 6.2) % loop;
    const x = u - 26;
    const z = Math.sin(t * 0.38) * 4.8;
    const yaw = -Math.PI / 2 + Math.cos(t * 0.38) * 0.18;
    live.x = x;
    live.z = z;
    live.y = 0;
    live.yaw = yaw;
    live.speed = 12;
    live.mounted = true;
    if (hero.current) {
      hero.current.position.set(x, 0, z);
      hero.current.rotation.y = yaw;
    }
    const fx = -Math.sin(yaw);
    const fz = -Math.cos(yaw);
    const rx = Math.cos(yaw);
    const rz = -Math.sin(yaw);
    const beat = 5.4;
    const local = t % beat;
    const next = Math.floor(t / beat) % 4;
    if (next !== shot.current && local < 0.05) shot.current = next;
    let fade = 0;
    if (local < 0.7) fade = 1 - local / 0.7;
    else if (local > beat - 0.7) fade = (local - (beat - 0.7)) / 0.7;
    introMood.rideFade = Math.min(1, Math.max(0, fade));
    const s = shot.current;
    if (s === 0) {
      _cam.set(x - fx * 11 + rx * 4.2, 3.6, z - fz * 11 + rz * 4.2);
      _look.set(x + fx * 0.4, 1.15, z + fz * 0.4);
    } else if (s === 1) {
      _cam.set(x + rx * 12.5, 2.8, z + rz * 12.5);
      _look.set(x, 1.05, z);
    } else if (s === 2) {
      _cam.set(x + fx * 9.5 + rx * 3.4, 2.6, z + fz * 9.5 + rz * 3.4);
      _look.set(x - fx * 0.2, 1.2, z - fz * 0.2);
    } else {
      _cam.set(x - fx * 7 + rx * 2, 8.4, z - fz * 7 + rz * 2);
      _look.set(x, 0.6, z);
    }
    camera.position.copy(_cam);
    camera.lookAt(_look);
  });
  return (
    <>
      <color attach="background" args={["#9ec4e8"]} />
      <fog attach="fog" args={["#9ec4e8", 22, 70]} />
      <Sky sunPosition={[70, 42, 28]} mieCoefficient={0.004} rayleigh={0.9} turbidity={2} />
      <hemisphereLight args={["#d7e6f2", "#8a7a5c", 1]} />
      <directionalLight
        position={[18, 22, 10]}
        intensity={2.4}
        color="#fff4d8"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={50}
        shadow-camera-near={1}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
        shadow-bias={-0.001}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[90, 70]} />
        <meshLambertMaterial color="#6a9a48" />
      </mesh>
      {[-22, -12, -2, 8, 18, 28].map((tx) =>
        [-14, 14].map((tz) => (
          <group key={`${tx}-${tz}`} position={[tx, 0, tz]}>
            <mesh position={[0, 1.2, 0]} castShadow>
              <cylinderGeometry args={[0.2, 0.28, 2.4, 6]} />
              <meshLambertMaterial color="#5a3d24" />
            </mesh>
            <mesh position={[0, 2.8, 0]} castShadow>
              <sphereGeometry args={[1.45, 7, 5]} />
              <meshLambertMaterial color="#3d8a40" />
            </mesh>
          </group>
        )),
      )}
      <N64Horse x={0} z={0} />
      <group ref={hero}>
        <N64Hero />
      </group>
    </>
  );
}
