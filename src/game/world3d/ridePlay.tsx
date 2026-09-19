import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, TREE_TRUNK, VX, VZ } from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";

function pay(n: number, key: string) {
  if (live.smashed[key]) return;
  live.smashed[key] = true;
  const c = useGame.getState().addCoins(n);
  if (c > 0) revealItem("coin");
  sfx.ok();
}

const FLAGS = [
  { x: TREE_TRUNK.x + 16, z: TREE_TRUNK.z + 8 },
  { x: VX + 8, z: VZ + 6 },
  { x: TREE_TRUNK.x + 4, z: TREE_TRUNK.z + 22 },
];

export function RidePlay() {
  return (
    <group>
      <HorseFlags />
      <LeafWind />
    </group>
  );
}

function HorseFlags() {
  const hit = useRef([false, false, false]);
  useFrame(() => {
    if (live.house || !live.mounted) return;
    FLAGS.forEach((f, i) => {
      if (hit.current[i]) return;
      if (Math.hypot(live.x - f.x, live.z - f.z) < 2.2) {
        hit.current[i] = true;
        sfx.ok();
        live.listen = i < 2 ? "A flag. Keep riding." : "Three flags. The horse knew the course.";
        if (i === 2 || hit.current.every(Boolean)) {
          pay(16, "horserace");
          live.listen = "You rode the course. The horse shook its head like a champion.";
        }
      }
    });
    if (live.mounted) {
      for (let i = 0; i < FLAGS.length; i++) {
        const f = FLAGS[i]!;
        if (!hit.current[i] && Math.hypot(live.x - f.x, live.z - f.z) < 4)
          live.listen = live.listen || "A flag. Ride through it.";
      }
    }
  });
  return (
    <group>
      {FLAGS.map((f, i) => (
        <group key={i} position={[f.x, heightAt(f.x, f.z), f.z]}>
          <mesh position={[0, 1.1, 0]}>
            <cylinderGeometry args={[0.04, 0.05, 2.2, 5]} />
            <meshLambertMaterial color="#6a4a28" />
          </mesh>
          <mesh position={[0.28, 1.85, 0]}>
            <boxGeometry args={[0.55, 0.35, 0.04]} />
            <meshLambertMaterial color="#c42828" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function LeafWind() {
  const g = useRef<THREE.Group>(null);
  const on = useRef(false);
  useFrame((_, dt) => {
    if (live.house) return;
    const x = TREE_TRUNK.x - 6.4;
    const z = TREE_TRUNK.z - 4.2;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 2.4 && !live.grounded && live.y > heightAt(live.x, live.z) + 1.1) {
      live.glideT = Math.max(live.glideT, 2.4);
      on.current = true;
      pay(8, "leafwind");
      live.listen = "The wind took the leaves. And you.";
    }
    if (g.current) {
      g.current.rotation.y += dt * 1.6;
      g.current.position.set(x, heightAt(x, z) + 1.2 + Math.sin(live.playT * 2) * 0.2, z);
    }
    if (d < 2.6) live.listen = live.listen || "Leaves going up. Jump in them.";
  });
  return (
    <group ref={g}>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[Math.cos(i) * 0.5, (i % 3) * 0.2, Math.sin(i) * 0.5]} rotation={[0.4, i, 0.2]}>
          <planeGeometry args={[0.22, 0.14]} />
          <meshLambertMaterial color="#c45c28" side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}
