import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { WorldId } from "../types";
import { heightAt } from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { ForgeHall } from "./forgeHall";

export function BiomeDress({ worldId }: { worldId: WorldId }) {
  if (worldId === "meadow") return <MeadowBits />;
  if (worldId === "marsh") return <MarshBits />;
  if (worldId === "lake") return <LakeBits />;
  if (worldId === "crater") return <CraterBits />;
  if (worldId === "grave") return <GraveBits />;
  if (worldId === "waste") return <WasteBits />;
  if (worldId === "grove") return <GroveBits />;
  if (worldId === "echo" || worldId === "vault") return <EchoBits />;
  if (worldId === "ridge") return <GroveBits />;
  if (worldId === "fen") return <MarshBits />;
  if (worldId === "hollow") return <CraterBits />;
  if (worldId === "spire") return <KeepYard />;
  if (worldId === "keep") return <KeepYard />;
  if (worldId === "arena") return <ArenaBits />;
  if (worldId === "cavern") return <CavernBits />;
  return null;
}

function MeadowBits() {
  return (
    <group>
      <Cairn x={22} z={-18} id="cairn-east" />
      <Cairn x={-18} z={12} id="cairn-west" />
      <LoneCedar x={17.4} z={-28.8} />
      <NightOwl />
    </group>
  );
}

function LoneCedar({ x, z }: { x: number; z: number }) {
  const y = heightAt(x, z);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 1.7, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.34, 3.4, 8]} />
        <meshLambertMaterial color="#4a3220" />
      </mesh>
      <mesh position={[0, 4.4, 0]} castShadow>
        <icosahedronGeometry args={[1.55, 0]} />
        <meshLambertMaterial color="#2a6a28" />
      </mesh>
      <mesh position={[0.7, 3.9, 0.25]} castShadow>
        <icosahedronGeometry args={[1.05, 0]} />
        <meshLambertMaterial color="#3d8a32" />
      </mesh>
      <mesh position={[-0.62, 4.05, -0.2]} castShadow>
        <icosahedronGeometry args={[0.95, 0]} />
        <meshLambertMaterial color="#245a24" />
      </mesh>
    </group>
  );
}

function CavernBits() {
  const drips = useRef<(THREE.Mesh | null)[]>([]);
  const cool = useRef(1.2);
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    drips.current.forEach((m, i) => {
      if (!m) return;
      const u = (t * 0.42 + i * 0.17) % 1;
      m.position.y = 7.6 - u * 7.35;
      const s = 0.045 + (1 - u) * 0.05;
      m.scale.set(s, s * (1.4 + u * 1.8), s);
      const mat = m.material as THREE.MeshLambertMaterial;
      mat.opacity = 0.85 * (1 - u * 0.35);
    });
    cool.current -= dt;
    if (cool.current <= 0) {
      cool.current = 1.6 + Math.random() * 1.8;
      sfx.drip();
    }
  });
  const spots = [
    [-8, -6],
    [-3, 4],
    [5, 3],
    [8, -12],
    [2, -18],
    [-12, 8],
    [12, -2],
    [-6, -14],
    [0, 10],
    [7, 8],
    [-14, -8],
    [4, -7],
  ];
  return (
    <group>
      {[[-6, 8], [5, 3], [-3, -7], [8, -12], [1, -16], [-10, 2]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.06, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.7 + (i % 3) * 0.22, 12]} />
          <meshLambertMaterial color="#2a5060" transparent opacity={0.55} />
        </mesh>
      ))}
      {spots.map(([x, z], i) => (
        <mesh
          key={`d-${i}`}
          ref={(el) => {
            drips.current[i] = el;
          }}
          position={[x, 7, z]}
        >
          <sphereGeometry args={[1, 6, 5]} />
          <meshLambertMaterial color="#9ec4d4" transparent opacity={0.75} />
        </mesh>
      ))}
    </group>
  );
}

function Cairn({ x, z, id }: { x: number; z: number; id: string }) {
  const y = heightAt(x, z);
  const paid = useRef((useGame.getState().seenItems ?? []).includes(`s:${id}`));
  const glow = useRef<THREE.Mesh>(null);
  const [, bump] = useState(0);
  useFrame(({ clock }) => {
    if (glow.current) glow.current.visible = Boolean(live.songOk) && Math.hypot(live.x - x, live.z - z) < 3.2 && !paid.current;
    if (paid.current || !live.songOk) return;
    if (Math.hypot(live.x - x, live.z - z) > 1.8) return;
    paid.current = true;
    if (useGame.getState().discover(`s:${id}`)) {
      const n = useGame.getState().addCoins(20);
      if (n > 0) revealItem("coin");
      live.hint = "A rupee under the stacked stones.";
      sfx.get();
      bump((v) => v + 1);
    }
    void clock;
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.16, 0]} rotation={[0.1, 0.4, 0]}>
        <boxGeometry args={[0.55, 0.32, 0.42]} />
        <meshLambertMaterial color="#8a8884" />
      </mesh>
      <mesh position={[0.04, 0.42, -0.04]} rotation={[-0.08, 0.6, 0.05]}>
        <boxGeometry args={[0.38, 0.24, 0.3]} />
        <meshLambertMaterial color="#9a9894" />
      </mesh>
      <mesh position={[0, 0.62, 0]} rotation={[0.12, -0.3, 0]}>
        <boxGeometry args={[0.22, 0.18, 0.2]} />
        <meshLambertMaterial color="#7a7874" />
      </mesh>
      <mesh ref={glow} position={[0, 0.82, 0]} visible={false}>
        <sphereGeometry args={[0.08, 6, 5]} />
        <meshBasicMaterial color="#c9a227" />
      </mesh>
    </group>
  );
}

function MeadowButterflies() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const a = t * 0.7 + i * 2.1;
      m.position.set(Math.cos(a) * (4 + i) + 4, 1.2 + Math.sin(t * 2.4 + i) * 0.35, Math.sin(a * 0.9) * (4 + i) - 12);
      m.rotation.y = a + Math.PI / 2;
      m.rotation.z = Math.sin(t * 18 + i) * 0.5;
    });
  });
  return (
    <group>
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <planeGeometry args={[0.18, 0.12]} />
          <meshLambertMaterial color={i % 2 ? "#f4e8a0" : "#e8d0f0"} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function NightOwl() {
  const g = useRef<THREE.Group>(null);
  const hoot = useRef(6);
  const perch = { x: -16.4, z: 8.6, y: 4.6 };
  useFrame((_, dt) => {
    if (!g.current) return;
    const on = live.night && !live.house && !live.cave;
    g.current.visible = on;
    if (!on) return;
    hoot.current -= dt;
    if (hoot.current <= 0) {
      hoot.current = 9 + Math.random() * 10;
      if (Math.hypot(live.x - perch.x, live.z - perch.z) < 18) sfx.hoot();
    }
    g.current.rotation.y = Math.atan2(-(live.x - perch.x), -(live.z - perch.z));
  });
  return (
    <group ref={g} position={[perch.x, perch.y, perch.z]} visible={false}>
      <mesh scale={[1.1, 1.3, 0.9]}>
        <sphereGeometry args={[0.16, 7, 6]} />
        <meshLambertMaterial color="#4a3a28" />
      </mesh>
      <mesh position={[0, 0.2, 0.04]} scale={[0.85, 0.7, 0.8]}>
        <sphereGeometry args={[0.12, 6, 5]} />
        <meshLambertMaterial color="#5a4a32" />
      </mesh>
      <mesh position={[-0.06, 0.22, 0.1]}>
        <sphereGeometry args={[0.035, 5, 4]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
      <mesh position={[0.06, 0.22, 0.1]}>
        <sphereGeometry args={[0.035, 5, 4]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
      <mesh position={[0, 0.16, 0.16]} rotation={[0.4, 0, 0]}>
        <coneGeometry args={[0.03, 0.08, 4]} />
        <meshLambertMaterial color="#c47838" />
      </mesh>
    </group>
  );
}

function MarshBits() {
  return (
    <group>
      <mesh position={[0, 0.08, 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[22, 24]} />
        <meshLambertMaterial color="#3a7a68" transparent opacity={0.72} />
      </mesh>
      {REEDS.map((r, i) => (
        <Reed key={i} x={r[0]} z={r[1]} h={r[2]} />
      ))}
      {[[-6, 4], [8, -3], [-3, -8], [11, 9]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.12, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.4 + (i % 2) * 0.4, 10]} />
          <meshLambertMaterial color="#6aaa58" />
        </mesh>
      ))}
      <MarshFrogs />
      <MarshMist />
    </group>
  );
}

const REEDS: [number, number, number][] = [
  [-10, 6, 1.4],
  [-8, 3, 1.8],
  [-12, -2, 1.2],
  [9, 5, 1.6],
  [12, 1, 1.3],
  [7, -6, 1.7],
  [4, 10, 1.1],
  [-4, 12, 1.5],
  [14, -8, 1.4],
  [-14, 8, 1.2],
];

function MarshFrogs() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    refs.current.forEach((g, i) => {
      if (!g) return;
      const hop = Math.max(0, Math.sin(t * 2.2 + i * 1.3));
      g.position.y = heightAt(g.position.x, g.position.z) + hop * hop * 0.45;
    });
  });
  const spots = [
    [-5.2, 3.4],
    [7.1, -2.2],
    [2.4, 6.8],
  ];
  return (
    <group>
      {spots.map(([x, z], i) => (
        <group
          key={i}
          position={[x, heightAt(x, z), z]}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <mesh position={[0, 0.08, 0]} scale={[1.1, 0.7, 1.3]}>
            <sphereGeometry args={[0.1, 7, 5]} />
            <meshLambertMaterial color="#3d7a48" />
          </mesh>
          <mesh position={[0.04, 0.14, -0.08]}>
            <sphereGeometry args={[0.05, 6, 5]} />
            <meshLambertMaterial color="#4a8a52" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function MarshMist() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      m.position.set(Math.sin(t * 0.18 + i) * 8, 0.55 + Math.sin(t * 0.6 + i) * 0.2, Math.cos(t * 0.15 + i * 1.3) * 7);
      const mat = m.material as THREE.MeshLambertMaterial;
      mat.opacity = 0.12 + Math.sin(t * 0.8 + i) * 0.06;
    });
  });
  return (
    <group>
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <sphereGeometry args={[1.6, 8, 6]} />
          <meshLambertMaterial color="#c8e0d8" transparent opacity={0.14} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function Reed({ x, z, h }: { x: number; z: number; h: number }) {
  const y = heightAt(x, z);
  return (
    <group position={[x, y, z]}>
      {[0, 0.12, -0.1].map((dx, i) => (
        <mesh key={i} position={[dx, h * 0.45, i * 0.08]} rotation={[0.08, 0, dx * 0.4]}>
          <cylinderGeometry args={[0.03, 0.05, h, 4]} />
          <meshLambertMaterial color="#2a5a38" />
        </mesh>
      ))}
    </group>
  );
}

function LakeBits() {
  return (
    <group>
      <mesh position={[0, heightAt(0, 4) + 0.02, 4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[26, 28]} />
        <meshLambertMaterial color="#3a78a8" transparent opacity={0.85} />
      </mesh>
      <group position={[0, heightAt(0, 16) + 0.2, 16]}>
        <mesh position={[0, 0.12, 0]} receiveShadow>
          <boxGeometry args={[8, 0.16, 2.2]} />
          <meshLambertMaterial color="#6a4a28" />
        </mesh>
        <mesh position={[0, 0.12, -3]} >
          <boxGeometry args={[1.4, 0.12, 6]} />
          <meshLambertMaterial color="#5a3d24" />
        </mesh>
        <mesh position={[3.2, 0.9, 0.6]}>
          <cylinderGeometry args={[0.04, 0.05, 1.6, 6]} />
          <meshLambertMaterial color="#4a3220" />
        </mesh>
        <mesh position={[3.2, 1.75, 0.6]}>
          <sphereGeometry args={[0.12, 8, 6]} />
          <meshLambertMaterial color="#e8d48a" emissive="#c9a227" emissiveIntensity={0.5} />
        </mesh>
      </group>
      <LakeFish />
    </group>
  );
}

function LakeFish() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const splash = useRef(0);
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const u = (t * 0.35 + i * 0.4) % 1;
      const hop = Math.max(0, Math.sin(u * Math.PI));
      m.position.y = 0.2 + hop * 1.4;
      m.position.x = Math.cos(i * 1.7 + t * 0.2) * (6 + i);
      m.position.z = 4 + Math.sin(i * 1.1 + t * 0.18) * (5 + i * 0.4);
      m.rotation.z = hop * 0.8 - 0.2;
    });
    splash.current -= dt;
    if (splash.current <= 0) {
      splash.current = 4 + Math.random() * 4;
      if (Math.hypot(live.x, live.z - 4) < 22) sfx.fish();
    }
  });
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          scale={[1.4, 0.45, 0.55]}
        >
          <sphereGeometry args={[0.12, 6, 5]} />
          <meshLambertMaterial color="#3a6a88" />
        </mesh>
      ))}
    </group>
  );
}

function CraterBits() {
  const glow = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (glow.current) {
      const m = glow.current.material as THREE.MeshLambertMaterial;
      m.emissiveIntensity = 0.8 + Math.sin(clock.elapsedTime * 2.2) * 0.25;
    }
  });
  return (
    <group>
      <mesh ref={glow} position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[8, 20]} />
        <meshLambertMaterial color="#e07030" emissive="#c04010" emissiveIntensity={1} />
      </mesh>
      {[[-5, 4], [6, -3], [3, 7], [-7, -5], [10, 2]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.05, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.3 + (i % 3) * 0.4, 10]} />
          <meshLambertMaterial color="#d45a20" emissive="#a03010" emissiveIntensity={0.7} />
        </mesh>
      ))}
      {[[-16, -8, 3.2], [18, -6, 2.8], [-12, 14, 2.4], [14, 12, 3]].map(([x, z, s], i) => (
        <mesh key={i} position={[x, s * 0.4, z]} scale={[s, s * 0.55, s]} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshLambertMaterial color="#5a2a18" />
        </mesh>
      ))}
      <pointLight position={[0, 2.4, 0]} intensity={18} color="#ff6a28" distance={28} />
      <CraterEmbers />
      <LavaBubbles />
    </group>
  );
}

function CraterEmbers() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const u = (t * 0.22 + i * 0.13) % 1;
      m.position.set(Math.sin(i * 2.1) * 3.4, 0.4 + u * 3.2, Math.cos(i * 1.7) * 3.4);
      const s = 0.04 + (1 - u) * 0.08;
      m.scale.setScalar(s);
    });
  });
  return (
    <group>
      {Array.from({ length: 10 }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <sphereGeometry args={[1, 5, 4]} />
          <meshLambertMaterial color="#ff8a40" emissive="#ff6010" emissiveIntensity={1.2} />
        </mesh>
      ))}
    </group>
  );
}

function LavaBubbles() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const u = (t * 0.4 + i * 0.22) % 1;
      const pop = Math.sin(u * Math.PI);
      m.position.set(Math.sin(i * 1.7) * 2.4, 0.12 + pop * 0.55, Math.cos(i * 1.3) * 2.4);
      m.scale.setScalar(0.12 + pop * 0.22);
    });
  });
  return (
    <group>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <sphereGeometry args={[1, 6, 5]} />
          <meshLambertMaterial color="#ffc070" emissive="#ff8020" emissiveIntensity={1} />
        </mesh>
      ))}
    </group>
  );
}

function GraveBits() {
  return (
    <group>
      {STONES.map((s, i) => (
        <group key={i} position={[s[0], heightAt(s[0], s[1]) + 0.55, s[1]]} rotation={[0, s[2], 0.04]}>
          <mesh castShadow>
            <boxGeometry args={[0.55, 1.1, 0.18]} />
            <meshLambertMaterial color="#8a8e94" />
          </mesh>
          <mesh position={[0, 0.58, 0]} scale={[1.15, 0.28, 1.2]}>
            <sphereGeometry args={[0.28, 6, 5]} />
            <meshLambertMaterial color="#f2f6fa" />
          </mesh>
          <mesh position={[0, 0.62, 0]}>
            <boxGeometry args={[0.42, 0.22, 0.16]} />
            <meshLambertMaterial color="#7a7e84" />
          </mesh>
        </group>
      ))}
      {[[-18, -20], [16, -24], [8, 18]].map(([x, z], i) => (
        <mesh key={i} position={[x, 3.2, z]} scale={[4, 2.2, 3]} rotation={[0, i, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshLambertMaterial color="#6a7278" />
        </mesh>
      ))}
      {[
        [-10, 6],
        [12, -8],
        [-16, -12],
        [7, 14],
        [-4, -16],
      ].map(([x, z], i) => (
        <mesh key={`drift${i}`} position={[x, heightAt(x, z) + 0.18, z]} scale={[2.4 + i * 0.2, 0.35, 1.8]} rotation={[0, i * 0.7, 0]} receiveShadow>
          <sphereGeometry args={[0.7, 7, 5]} />
          <meshLambertMaterial color="#f4f8fc" />
        </mesh>
      ))}
      <GraveLanterns />
      <GraveFog />
    </group>
  );
}

const STONES: [number, number, number][] = [
  [-6, 4, 0.2],
  [-3, 6, -0.3],
  [4, 5, 0.1],
  [7, 2, 0.4],
  [-8, -4, -0.2],
  [2, -6, 0.15],
  [9, -3, -0.4],
  [-12, 8, 0.25],
  [11, 9, -0.1],
];

function GraveLanterns() {
  const mats = useRef<(THREE.MeshLambertMaterial | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    mats.current.forEach((m, i) => {
      if (!m) return;
      m.emissiveIntensity = 0.35 + Math.sin(t * 1.6 + i) * 0.2;
    });
  });
  const spots = [
    [-5, 3],
    [6, -2],
    [0, 8],
  ];
  return (
    <group>
      {spots.map(([x, z], i) => (
        <group key={i} position={[x, heightAt(x, z), z]}>
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.04, 0.05, 1.4, 6]} />
            <meshLambertMaterial color="#3a3830" />
          </mesh>
          <mesh
            position={[0, 1.45, 0]}
            ref={(el) => {
              if (el) mats.current[i] = el.material as THREE.MeshLambertMaterial;
            }}
          >
            <sphereGeometry args={[0.12, 8, 6]} />
            <meshLambertMaterial color="#c8c0a0" emissive="#d8d0a8" emissiveIntensity={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function GraveFog() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      m.position.set(Math.sin(t * 0.12 + i * 1.4) * 6, 0.45 + Math.sin(t * 0.5 + i) * 0.15, Math.cos(t * 0.1 + i) * 5);
      (m.material as THREE.MeshLambertMaterial).opacity = 0.1 + Math.sin(t * 0.7 + i) * 0.05;
    });
  });
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <sphereGeometry args={[2.2, 8, 6]} />
          <meshLambertMaterial color="#b8b4c8" transparent opacity={0.12} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function Tumbleweeds() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const a = t * 0.22 + i * 2;
      const x = Math.cos(a) * (10 + i * 3);
      const z = Math.sin(a * 0.7) * (8 + i * 2);
      m.position.set(x, heightAt(x, z) + 0.35, z);
      m.rotation.z = t * 1.4 + i;
    });
  });
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <dodecahedronGeometry args={[0.32, 0]} />
          <meshLambertMaterial color="#c4a060" />
        </mesh>
      ))}
    </group>
  );
}

function SandDevil() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const cx = Math.sin(t * 0.15) * 8;
    const cz = Math.cos(t * 0.12) * 8;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const a = t * 2.4 + i * 0.7;
      const r = 0.15 + i * 0.12;
      const y = 0.2 + i * 0.22;
      m.position.set(cx + Math.cos(a) * r, heightAt(cx, cz) + y, cz + Math.sin(a) * r);
    });
  });
  return (
    <group>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <sphereGeometry args={[0.09 + i * 0.012, 5, 4]} />
          <meshLambertMaterial color="#e8d090" transparent opacity={0.55} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function WasteBits() {
  return (
    <group>
      {[[-20, 8, 6], [18, -10, 7], [-8, -22, 8], [24, 14, 5], [6, 20, 6.5]].map(([x, z, s], i) => (
        <mesh key={i} position={[x, s * 0.22, z]} scale={[s, s * 0.38, s * 0.85]} rotation={[0, i * 0.7, 0]}>
          <sphereGeometry args={[1, 8, 5]} />
          <meshLambertMaterial color="#d4b06a" />
        </mesh>
      ))}
      {[[-4, 6], [10, -8], [-14, -4]].map(([x, z], i) => (
        <mesh key={i} position={[x, heightAt(x, z) + 0.9, z]} rotation={[0.2, i, 0.1]} castShadow>
          <cylinderGeometry args={[0.08, 0.14, 1.8, 5]} />
          <meshLambertMaterial color="#6a4a28" />
        </mesh>
      ))}
      <Tumbleweeds />
      <SandDevil />
    </group>
  );
}

function GroveBits() {
  return (
    <group>
      {[[-16, 4], [18, -6], [-10, -16], [12, 14], [0, -22]].map(([x, z], i) => (
        <mesh key={i} position={[x, heightAt(x, z) + 0.04, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[2.4, 10]} />
          <meshLambertMaterial color="#2a4a22" />
        </mesh>
      ))}
      <GroveGlowCaps />
      <GroveVines />
    </group>
  );
}

function GroveGlowCaps() {
  const mats = useRef<(THREE.MeshLambertMaterial | null)[]>([]);
  useFrame(({ clock }) => {
    const u = 0.35 + Math.sin(clock.elapsedTime * 1.6) * 0.2;
    mats.current.forEach((m) => {
      if (m) m.emissiveIntensity = u;
    });
  });
  const spots = [
    [10.2, -2.2],
    [12.4, -4.1],
    [9.6, -4.8],
    [-8.4, 3.2],
  ];
  return (
    <group>
      {spots.map(([x, z], i) => (
        <group key={i} position={[x, heightAt(x, z), z]}>
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.03, 0.04, 0.16, 5]} />
            <meshLambertMaterial color="#c8b090" />
          </mesh>
          <mesh
            position={[0, 0.18, 0]}
            ref={(el) => {
              if (el) mats.current[i] = el.material as THREE.MeshLambertMaterial;
            }}
          >
            <sphereGeometry args={[0.1, 7, 5]} />
            <meshLambertMaterial color="#7ad4a0" emissive="#3a8a58" emissiveIntensity={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function GroveVines() {
  return (
    <group>
      {[
        [8, -8],
        [-6, 6],
        [14, 2],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, heightAt(x, z) + 1.4, z]} rotation={[0.15, i, 0.4]}>
          <cylinderGeometry args={[0.03, 0.05, 2.4, 5]} />
          <meshLambertMaterial color="#2f6a38" />
        </mesh>
      ))}
    </group>
  );
}

function EchoBits() {
  return (
    <group>
      {[[-10, 6], [8, -8], [-4, -14], [14, 10]].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.4, z]} rotation={[0, i * 0.5, 0.08]} castShadow>
          <boxGeometry args={[1.8, 2.8, 0.45]} />
          <meshLambertMaterial color="#6a5a88" />
        </mesh>
      ))}
      <pointLight position={[0, 6, 0]} intensity={10} color="#b898e0" distance={40} />
      <EchoMotes />
    </group>
  );
}

function EchoMotes() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      m.position.set(Math.sin(t * 0.4 + i) * (6 + i), 1.2 + Math.sin(t * 1.3 + i * 0.7) * 0.5, Math.cos(t * 0.35 + i * 1.1) * (6 + i * 0.4));
    });
  });
  return (
    <group>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <sphereGeometry args={[0.08, 6, 5]} />
          <meshLambertMaterial color="#d8c0f0" emissive="#a080d0" emissiveIntensity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function KeepYard() {
  return (
    <group>
      <ForgeHall radius={16.4} wallH={16.8} coffinOpen={0.18} />
      <KeepBanners />
      <KeepLamps />
    </group>
  );
}

function KeepBanners() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      m.rotation.y = Math.sin(t * 1.3 + i) * 0.12;
    });
  });
  return (
    <group>
      {[-8, 8].map((x, i) => (
        <group key={x} position={[x, heightAt(x, -19.2) + 2.2, -19.2]}>
          <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[0.04, 0.05, 1.4, 6]} />
            <meshLambertMaterial color="#4a4038" />
          </mesh>
          <mesh
            ref={(el) => {
              refs.current[i] = el;
            }}
            position={[0.28, 0.15, 0]}
          >
            <planeGeometry args={[0.55, 0.9]} />
            <meshLambertMaterial color="#6a3030" side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function KeepLamps() {
  const mats = useRef<(THREE.MeshLambertMaterial | null)[]>([]);
  useFrame(() => {
    const on = live.night || live.spark > 0;
    mats.current.forEach((m) => {
      if (!m) return;
      m.emissive.set(on ? "#f4c060" : "#000000");
      m.emissiveIntensity = on ? (live.spark > 0 ? 1.4 : 0.8) : 0;
    });
  });
  const spots = [
    [-6.4, -8.2],
    [6.4, -8.2],
    [0, 6.4],
  ];
  return (
    <group>
      {spots.map(([x, z], i) => (
        <group key={i} position={[x, heightAt(x, z), z]}>
          <mesh position={[0, 0.9, 0]}>
            <cylinderGeometry args={[0.05, 0.06, 1.8, 6]} />
            <meshLambertMaterial color="#4a4038" />
          </mesh>
          <mesh
            position={[0, 1.85, 0]}
            ref={(el) => {
              if (el) mats.current[i] = el.material as THREE.MeshLambertMaterial;
            }}
          >
            <sphereGeometry args={[0.14, 8, 6]} />
            <meshLambertMaterial color="#e8d48a" emissive="#000000" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function ArenaBits() {
  const sand = useRef<THREE.Mesh>(null);
  const glass = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (glass.current) glass.current.rotation.y = clock.elapsedTime * 0.15;
  });
  return (
    <group>
      <mesh ref={sand} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[38, 40]} />
        <meshLambertMaterial color="#c9a85a" />
      </mesh>
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[28.6, 29.6, 36]} />
        <meshLambertMaterial color="#8a6a30" />
      </mesh>
      {Array.from({ length: 20 }, (_, i) => {
        const a = (i / 20) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 25.4, 0.06, Math.sin(a) * 25.4]} rotation={[-Math.PI / 2, 0, a]}>
            <boxGeometry args={[i % 3 === 0 ? 0.7 : 0.35, 0.12, 0.08]} />
            <meshLambertMaterial color="#6a4a20" />
          </mesh>
        );
      })}
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2 + 0.2;
        return (
          <mesh key={`p-${i}`} position={[Math.cos(a) * 32.4, 1.6, Math.sin(a) * 32.4]} castShadow>
            <cylinderGeometry args={[0.28, 0.38, 3.2, 8]} />
            <meshLambertMaterial color="#7a6a50" />
          </mesh>
        );
      })}
      <group ref={glass} position={[0, 1.4, 0]}>
        <mesh>
          <coneGeometry args={[0.55, 1.2, 6]} />
          <meshLambertMaterial color="#e8d48a" transparent opacity={0.55} />
        </mesh>
        <mesh position={[0, -1.15, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.55, 1.2, 6]} />
          <meshLambertMaterial color="#e8d48a" transparent opacity={0.55} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.18, 8]} />
          <meshLambertMaterial color="#8a6a30" />
        </mesh>
      </group>
    </group>
  );
}

