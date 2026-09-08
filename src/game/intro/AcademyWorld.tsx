import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, Sky, Stars } from "@react-three/drei";
import * as THREE from "three";
import { introMood } from "./mood";

const CAM = [
  { p: new THREE.Vector3(18, 7.2, 46), t: new THREE.Vector3(0, 3.4, 8) },
  { p: new THREE.Vector3(-10, 5.4, 28), t: new THREE.Vector3(2, 4.2, -6) },
  { p: new THREE.Vector3(8, 6.1, 16), t: new THREE.Vector3(0, 5.5, -22) },
  { p: new THREE.Vector3(-3, 9.4, 4), t: new THREE.Vector3(0, 6.8, -26) },
  { p: new THREE.Vector3(0, 6.6, 22), t: new THREE.Vector3(0, 5.8, -18) },
];

const _pos = new THREE.Vector3();
const _look = new THREE.Vector3();
const _tmp = new THREE.Vector3();
const _aim = new THREE.Vector3();
const _lookAt = new THREE.Vector3();

function samplePath(alpha: number, outP: THREE.Vector3, outT: THREE.Vector3) {
  const max = CAM.length - 1;
  const x = Math.min(max, Math.max(0, alpha * max));
  const i = Math.min(max - 1, Math.floor(x));
  const f = x - i;
  const s = f * f * (3 - 2 * f);
  outP.lerpVectors(CAM[i]!.p, CAM[i + 1]!.p, s);
  outT.lerpVectors(CAM[i]!.t, CAM[i + 1]!.t, s);
}

function Terrain() {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(220, 220, 90, 90);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      let y =
        Math.sin(x * 0.045) * 2.1 +
        Math.cos(z * 0.038) * 2.4 +
        Math.sin(x * 0.11 + z * 0.08) * 0.7;
      const dKeep = Math.hypot(x, z + 26);
      const dPath = Math.abs(x) + Math.max(0, z + 8) * 0.15;
      y *= 1 - Math.max(0, 1 - dKeep / 16) * 0.88;
      y *= 1 - Math.max(0, 1 - dPath / 10) * 0.35;
      pos.setY(i, y);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial color="#7d9260" roughness={0.92} metalness={0.02} />
    </mesh>
  );
}

function Grove() {
  const trees = useMemo(() => {
    const list: { x: number; z: number; s: number; r: number }[] = [];
    let n = 1;
    const rnd = () => {
      n = (n * 16807) % 2147483647;
      return (n - 1) / 2147483646;
    };
    for (let i = 0; i < 46; i++) {
      const a = rnd() * Math.PI * 2;
      const rad = 18 + rnd() * 70;
      const x = Math.cos(a) * rad;
      const z = Math.sin(a) * rad - 8;
      if (Math.hypot(x, z + 26) < 14) continue;
      list.push({ x, z, s: 0.7 + rnd() * 1.1, r: rnd() * Math.PI });
    }
    return list;
  }, []);

  return (
    <group>
      {trees.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]} rotation={[0, t.r, 0]} scale={t.s}>
          <mesh position={[0, 1.1, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.28, 2.2, 6]} />
            <meshStandardMaterial color="#5a4334" roughness={1} />
          </mesh>
          <mesh position={[0, 2.7, 0]} castShadow>
            <coneGeometry args={[1.15, 2.6, 7]} />
            <meshStandardMaterial color="#4f7a52" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Keep() {
  return (
    <group position={[0, 0, -28]}>
      <mesh position={[0, 4.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[10, 8.4, 8]} />
        <meshStandardMaterial color="#8a8680" roughness={0.78} />
      </mesh>
      <mesh position={[0, 8.7, 0]} castShadow>
        <boxGeometry args={[11.2, 0.7, 9.1]} />
        <meshStandardMaterial color="#7a7670" roughness={0.76} />
      </mesh>
      <Tower x={-6.4} z={-3.2} h={14} />
      <Tower x={6.4} z={-3.2} h={13} />
      <Tower x={-5.8} z={3.4} h={10} />
      <Tower x={5.8} z={3.4} h={10} />
      <mesh position={[0, 2.1, 4.15]}>
        <boxGeometry args={[2.6, 4.2, 0.4]} />
        <meshStandardMaterial color="#1a1c20" roughness={1} />
      </mesh>
      {[
        [-2.6, 5.2, 4.08],
        [2.6, 5.2, 4.08],
        [-2.6, 6.6, 4.08],
        [2.6, 6.6, 4.08],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <boxGeometry args={[0.7, 1.05, 0.12]} />
          <meshStandardMaterial
            color="#7eb8b0"
            emissive="#7eb8b0"
            emissiveIntensity={1.4}
            toneMapped={false}
          />
        </mesh>
      ))}
      <pointLight position={[0, 6, 5]} color="#7eb8b0" intensity={8} distance={28} />
    </group>
  );
}

function Tower({ x, z, h }: { x: number; z: number; h: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[1.15, 1.35, h, 8]} />
        <meshStandardMaterial color="#8c8882" roughness={0.8} />
      </mesh>
      <mesh position={[0, h + 0.85, 0]} castShadow>
        <coneGeometry args={[1.55, 1.8, 8]} />
        <meshStandardMaterial color="#5a6468" roughness={0.65} />
      </mesh>
    </group>
  );
}

function Pond() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-8, 0.18, 10]} receiveShadow>
      <circleGeometry args={[5.4, 32]} />
      <meshStandardMaterial
        color="#3d5c58"
        roughness={0.16}
        metalness={0.28}
        envMapIntensity={0.8}
      />
    </mesh>
  );
}

function Runes() {
  const glyphs = useMemo(
    () =>
      ["Σ", "+", "÷", "π", "n", "∞"].map((g, i) => ({
        g,
        x: Math.sin(i * 1.1) * 7,
        y: 4 + (i % 3),
        z: -18 - (i % 4),
      })),
    [],
  );
  return (
    <group>
      {glyphs.map((item, i) => (
        <Float key={i} speed={1.2 + i * 0.1} floatIntensity={0.4} rotationIntensity={0.2}>
          <mesh position={[item.x, item.y, item.z]}>
            <torusGeometry args={[0.35, 0.08, 8, 16]} />
            <meshStandardMaterial
              color="#7eb8b0"
              emissive="#7eb8b0"
              emissiveIntensity={0.8}
              roughness={0.3}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function CameraRig() {
  useFrame(({ camera }, delta) => {
    const d = Math.min(delta, 0.1);
    const hold = introMood.playing ? introMood.t : 1;
    samplePath(hold, _pos, _look);
    if (!introMood.playing) {
      const idle = performance.now() * 0.00012;
      _pos.x += Math.sin(idle) * 1.6;
      _pos.y += Math.cos(idle * 0.8) * 0.35;
    }
    camera.position.lerp(_pos, 1 - Math.exp(-d * 1.8));
    camera.getWorldDirection(_tmp);
    _aim.copy(_look).sub(camera.position).normalize();
    _tmp.lerp(_aim, 1 - Math.exp(-d * 2.2));
    _lookAt.copy(camera.position).add(_tmp);
    camera.lookAt(_lookAt);
  });
  return null;
}

function Lights() {
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const amb = useRef<THREE.AmbientLight>(null);
  useFrame(() => {
    const t = introMood.t;
    if (sun.current) {
      sun.current.intensity = 2.8 - t * 0.7;
      sun.current.color.setHSL(0.11, 0.32, 0.86 - t * 0.08);
    }
    if (hemi.current) hemi.current.intensity = 1.05 - t * 0.2;
    if (amb.current) amb.current.intensity = 0.42 - t * 0.08;
  });
  return (
    <>
      <hemisphereLight ref={hemi} args={["#d7e6f2", "#8a7a5c", 1.05]} />
      <directionalLight
        ref={sun}
        position={[22, 28, 14]}
        intensity={2.8}
        color="#fff4d8"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={80}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <ambientLight ref={amb} intensity={0.42} />
    </>
  );
}

const _fogDay = new THREE.Color("#c5d8ea");
const _fogDusk = new THREE.Color("#8ea0b4");
const _fogMix = new THREE.Color();

function Atmosphere() {
  const fog = useRef<THREE.Fog>(null);
  const bg = useRef<THREE.Color>(null);
  useFrame(() => {
    _fogMix.lerpColors(_fogDay, _fogDusk, introMood.t);
    fog.current?.color.copy(_fogMix);
    bg.current?.copy(_fogMix);
  });
  return (
    <>
      <color ref={bg} attach="background" args={["#c5d8ea"]} />
      <fog ref={fog} attach="fog" args={["#c5d8ea", 36, 160]} />
      <Sky
        distance={450000}
        sunPosition={[40, 18, 20]}
        mieCoefficient={0.004}
        mieDirectionalG={0.75}
        rayleigh={0.55}
        turbidity={3.2}
      />
      <Stars radius={90} depth={40} count={280} factor={2.4} fade speed={0.25} />
    </>
  );
}

export function AcademyScene() {
  return (
    <>
      <Atmosphere />
      <Lights />
      <Terrain />
      <Pond />
      <Grove />
      <Keep />
      <Runes />
      <CameraRig />
    </>
  );
}
