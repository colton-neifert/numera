import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt } from "./field";
import { live } from "./live";
import { VX, VZ } from "./village";
import { sfx } from "../audio";

export function WorldPolish({ worldId: _worldId }: { worldId: string }) {
  return (
    <group>
      <GroundCracks />
      <DustPuffs />
    </group>
  );
}

function GroundCracks() {
  const [, bump] = useState(0);
  const n = useRef(0);
  const fade = useRef(0);
  useFrame((_, dt) => {
    for (const c of live.cracks) c.t += dt;
    const next = live.cracks.filter((c) => c.t < 8);
    if (next.length !== live.cracks.length) live.cracks = next;
    fade.current += dt;
    if (live.cracks.length !== n.current || (live.cracks.length && fade.current > 0.15)) {
      n.current = live.cracks.length;
      fade.current = 0;
      bump((x) => x + 1);
    }
  });
  return (
    <group>
      {live.cracks.map((c, i) => {
        const a = Math.max(0, 1 - c.t / 8);
        const y = heightAt(c.x, c.z) + 0.028;
        return (
          <group key={`${c.x}-${c.z}-${i}`} position={[c.x, y, c.z]}>
            <mesh rotation={[-Math.PI / 2, 0, c.spin]}>
              <circleGeometry args={[0.58, 8]} />
              <meshBasicMaterial color="#3a3228" transparent opacity={0.5 * a} depthWrite={false} />
            </mesh>
            {[0, 1, 2, 3, 4].map((k) => (
              <mesh key={k} rotation={[-Math.PI / 2, 0, c.spin + (k * Math.PI) / 5]} position={[0, 0.005, 0]}>
                <planeGeometry args={[1.2 - k * 0.08, 0.05]} />
                <meshBasicMaterial color="#1a1410" transparent opacity={0.75 * a} depthWrite={false} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

function DustPuffs() {
  const [, bump] = useState(0);
  const n = useRef(0);
  useFrame((_, dt) => {
    for (const p of live.puffs) {
      p.t += dt;
      p.y += dt * 0.55;
      p.s += dt * 0.9;
    }
    if (live.puffs.some((p) => p.t > 0.55)) live.puffs = live.puffs.filter((p) => p.t < 0.55);
    if (live.puffs.length !== n.current) {
      n.current = live.puffs.length;
      bump((x) => x + 1);
    }
  });
  return (
    <group>
      {live.puffs.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]} scale={p.s}>
          <sphereGeometry args={[0.16, 6, 5]} />
          <meshBasicMaterial color="#b89a68" transparent opacity={Math.max(0, 0.42 * (1 - p.t / 0.55))} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function NightStars() {
  const g = useRef<THREE.Group>(null);
  const pts = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = 0; i < 70; i++) {
      const a = (i * 2.399) % (Math.PI * 2);
      const e = 0.25 + (i % 9) * 0.08;
      arr.push([Math.cos(a) * Math.cos(e) * 88, 18 + Math.sin(e) * 42, Math.sin(a) * Math.cos(e) * 88]);
    }
    return arr;
  }, []);
  const mats = useRef<THREE.MeshBasicMaterial[]>([]);
  useFrame(({ camera }) => {
    if (g.current) g.current.position.set(camera.position.x, 0, camera.position.z);
    const o = !live.house && !live.cave ? Math.max(0, (live.dusk - 0.28) / 0.72) ** 1.35 * 0.92 : 0;
    for (const m of mats.current) m.opacity = o;
  });
  return (
    <group ref={g}>
      {pts.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[i % 7 === 0 ? 0.22 : 0.11, 4, 3]} />
          <meshBasicMaterial
            ref={(m) => {
              if (m) mats.current[i] = m;
            }}
            color={i % 5 === 0 ? "#ffe9b0" : "#e8f0ff"}
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function WindLeaves() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const leaves = useRef(
    Array.from({ length: 5 }, (_, i) => ({
      x: live.x + (i - 2) * 4,
      y: 2.2,
      z: live.z + i * 3,
      vx: 1.15 + (i % 3) * 0.35,
      vz: -0.35,
      spin: i,
      wait: 2 + i * 3.2,
    })),
  );
  useFrame((_, dt) => {
    for (let i = 0; i < leaves.current.length; i++) {
      const L = leaves.current[i]!;
      L.wait -= dt;
      if (L.wait > 0) continue;
      L.x += L.vx * dt;
      L.z += L.vz * dt;
      L.y = heightAt(L.x, L.z) + 1.5 + Math.sin(L.spin + L.x * 0.25) * 0.5;
      L.spin += dt * 2.5;
      if (L.x > live.x + 22) {
        L.x = live.x - 8;
        L.z = live.z + (Math.random() - 0.5) * 14;
        L.wait = 5 + Math.random() * 12;
      }
      const m = refs.current[i];
      if (m) {
        m.position.set(L.x, L.y, L.z);
        m.rotation.set(0.4, L.spin, 0.25);
        m.visible = L.wait <= 0;
      }
    }
  });
  return (
    <group>
      {leaves.current.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          visible={false}
        >
          <planeGeometry args={[0.22, 0.14]} />
          <meshBasicMaterial color={i % 2 ? "#c45c38" : "#3d8a40"} side={THREE.DoubleSide} transparent opacity={0.85} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function Birds() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const tweetAt = useRef(4);
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    tweetAt.current -= dt;
    if (tweetAt.current <= 0) {
      tweetAt.current = 6 + Math.random() * 8;
      if (!live.night) sfx.tweet();
    }
    for (let i = 0; i < 4; i++) {
      const g = refs.current[i];
      if (!g) continue;
      const a = t * 0.22 + i * 1.6;
      g.position.set(Math.cos(a) * (16 + i * 3), 11 + Math.sin(t * 0.8 + i) * 0.8, VZ + Math.sin(a) * (16 + i * 2));
      g.rotation.y = a + Math.PI / 2;
      g.visible = !live.night;
    }
  });
  return (
    <group>
      {[0, 1, 2, 3].map((i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <mesh scale={[1.4, 0.4, 0.5]}>
            <sphereGeometry args={[0.14, 6, 5]} />
            <meshLambertMaterial color="#2a2018" />
          </mesh>
          <mesh position={[0.12, 0.04, 0]} rotation={[0.2, 0, 0.4]}>
            <planeGeometry args={[0.28, 0.1]} />
            <meshLambertMaterial color="#3a3228" side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Butterflies() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const bugs = useRef([
    { ox: VX - 4, oz: VZ + 3, p: 0 },
    { ox: VX + 6, oz: VZ - 5, p: 2.1 },
    { ox: -12, oz: 10, p: 4.2 },
  ]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    bugs.current.forEach((b, i) => {
      const x = b.ox + Math.sin(t * 0.7 + b.p) * 2.4;
      const z = b.oz + Math.cos(t * 0.55 + b.p) * 2.1;
      const g = refs.current[i];
      if (g) g.position.set(x, heightAt(x, z) + 1.15 + Math.sin(t * 3 + b.p) * 0.22, z);
    });
  });
  return (
    <group>
      {bugs.current.map((_, i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <mesh rotation={[0.2, 0, 0.65]} position={[-0.04, 0, 0]}>
            <planeGeometry args={[0.16, 0.1]} />
            <meshBasicMaterial color="#f4ead4" side={THREE.DoubleSide} transparent opacity={0.92} depthWrite={false} />
          </mesh>
          <mesh rotation={[0.2, 0, -0.65]} position={[0.04, 0, 0]}>
            <planeGeometry args={[0.16, 0.1]} />
            <meshBasicMaterial color="#f4ead4" side={THREE.DoubleSide} transparent opacity={0.92} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Moon() {
  const ref = useRef<THREE.Group>(null);
  const shade = useRef<THREE.Mesh>(null);
  useFrame(({ camera }) => {
    const a = live.day * Math.PI * 2;
    const elev = Math.sin(a + Math.PI);
    if (ref.current) {
      if (elev < 0.04) {
        ref.current.visible = false;
        return;
      }
      const pitch = 0.2 + elev * 0.92;
      const dist = 170;
      ref.current.position.set(
        camera.position.x + Math.cos(a + Math.PI) * dist * Math.cos(pitch),
        camera.position.y + Math.sin(pitch) * dist,
        camera.position.z + Math.sin(a + Math.PI) * dist * Math.cos(pitch),
      );
      ref.current.visible = true;
    }
    if (shade.current) {
      const phase = Math.sin(live.day * Math.PI * 4);
      shade.current.position.x = phase * 0.85;
      shade.current.scale.set(0.72 + Math.abs(phase) * 0.2, 0.95, 0.9);
    }
  });
  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[6.2, 16, 12]} />
        <meshBasicMaterial color="#f4eed8" fog={false} />
      </mesh>
      <mesh ref={shade} position={[0.7, 0.1, 0.4]} scale={[0.82, 0.95, 0.9]}>
        <sphereGeometry args={[5.6, 14, 10]} />
        <meshBasicMaterial color="#1a2238" fog={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[8.2, 12, 8]} />
        <meshBasicMaterial color="#d8e4ff" transparent opacity={0.12} depthWrite={false} fog={false} />
      </mesh>
    </group>
  );
}

function Sun() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ camera }) => {
    const a = live.day * Math.PI * 2;
    const elev = Math.sin(a);
    if (ref.current) {
      if (elev < 0.04) {
        ref.current.visible = false;
        return;
      }
      const pitch = 0.28 + elev * 0.95;
      const dist = 175;
      ref.current.position.set(
        camera.position.x + Math.cos(a) * dist * Math.cos(pitch),
        camera.position.y + Math.sin(pitch) * dist,
        camera.position.z + Math.sin(a) * dist * Math.cos(pitch),
      );
      ref.current.visible = true;
    }
  });
  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[8.4, 16, 12]} />
        <meshBasicMaterial color="#ffe08a" fog={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[12.2, 12, 8]} />
        <meshBasicMaterial color="#ffd060" transparent opacity={0.2} depthWrite={false} fog={false} />
      </mesh>
    </group>
  );
}

function Clouds() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  useFrame(({ camera }, dt) => {
    for (let i = 0; i < refs.current.length; i++) {
      const g = refs.current[i];
      if (!g) continue;
      g.position.x += dt * (0.55 + i * 0.08);
      const cx = camera.position.x;
      const cz = camera.position.z;
      if (g.position.x > cx + 52) g.position.x = cx - 52;
      g.position.z = cz + (i - 2) * 10;
      g.visible = live.dusk < 0.82 && !live.house && !live.cave;
    }
  });
  return (
    <group>
      {[
        [-20, 18, -12],
        [8, 20, 6],
        [-6, 22, 16],
        [22, 19, -8],
        [-32, 21, 10],
      ].map(([x, y, z], i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          position={[x, y, z]}
        >
          <mesh scale={[3.2, 1.1, 1.8]}>
            <sphereGeometry args={[1.1, 8, 6]} />
            <meshLambertMaterial color="#f4f0e8" />
          </mesh>
          <mesh position={[1.4, 0.1, 0.2]} scale={[2.2, 0.9, 1.4]}>
            <sphereGeometry args={[1.0, 8, 6]} />
            <meshLambertMaterial color="#efeae0" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function puffAt(x: number, z: number, y?: number, heavy = false) {
  if (live.puffs.length > 64) live.puffs.splice(0, live.puffs.length - 48);
  const n = heavy ? 6 : 1;
  for (let i = 0; i < n; i++) {
    live.puffs.push({
      x: x + (Math.random() - 0.5) * (heavy ? 1.4 : 0.22),
      y: (y ?? heightAt(x, z) + 0.12) + Math.random() * (heavy ? 0.22 : 0.06),
      z: z + (Math.random() - 0.5) * (heavy ? 1.4 : 0.22),
      t: 0,
      s: (heavy ? 0.95 : 0.38) + Math.random() * (heavy ? 0.7 : 0.32),
    });
  }
}

export function crackAt(x: number, z: number) {
  live.cracks.push({ x, z, t: 0, spin: Math.random() * Math.PI });
}
