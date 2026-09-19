import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, TREE_TRUNK } from "./field";
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

export function SparkPlay() {
  return (
    <group>
      <CampPutOut />
      <PaperPlane />
      <LostChick />
    </group>
  );
}

function CampPutOut() {
  const x = TREE_TRUNK.x - 5.4;
  const z = TREE_TRUNK.z + 7.2;
  const y = heightAt(x, z);
  const out = useRef(false);
  const flame = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (!out.current && d < 1.35 && (live.wetT > 0.6 || live.bucket > 0)) {
      out.current = true;
      if (flame.current) flame.current.visible = false;
      pay(9, "campout");
      live.listen = "You put it out. The smoke went away.";
    }
    if (d < 1.8 && !out.current) live.listen = live.listen || "A fire. Water would put it out.";
  });
  return (
    <group position={[x, y, z]}>
      {[-0.12, 0.12, 0].map((s, i) => (
        <mesh key={i} position={[s, 0.08, i === 2 ? 0.1 : -0.05]} rotation={[0.2, 0.4, 0.3]}>
          <cylinderGeometry args={[0.04, 0.05, 0.35, 5]} />
          <meshLambertMaterial color="#5a3a22" />
        </mesh>
      ))}
      <mesh ref={flame} position={[0, 0.42, 0]}>
        <coneGeometry args={[0.14, 0.4, 5]} />
        <meshLambertMaterial color="#e07030" emissive="#c05020" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

function PaperPlane() {
  const p = useRef({ x: TREE_TRUNK.x + 2.2, z: TREE_TRUNK.z + 3.4, fly: false, a: 0 });
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (live.house) return;
    const o = p.current;
    if (!o.fly) {
      const d = Math.hypot(live.x - o.x, live.z - o.z);
      if (d < 1.1 && (live.slash || Math.abs(live.speed) > 4)) {
        o.fly = true;
        live.listen = "The plane flew. It knows the wind.";
      }
      if (d < 1.5) live.listen = live.listen || "A paper plane. Throw it.";
    } else {
      o.a += dt;
      o.x += Math.cos(o.a * 0.4) * dt * 3.2;
      o.z -= dt * 2.4;
      if (o.a > 4) {
        pay(7, "paperplane");
        live.listen = "It landed in the grass. A rupee was folded in the wing.";
        o.fly = false;
        o.a = 0;
        o.x = TREE_TRUNK.x + 2.2;
        o.z = TREE_TRUNK.z + 3.4;
      }
    }
    if (g.current) g.current.position.set(o.x, heightAt(o.x, o.z) + 0.2 + (o.fly ? 0.8 : 0), o.z);
  });
  return (
    <group ref={g}>
      <mesh rotation={[0.4, 0.2, 0.1]}>
        <coneGeometry args={[0.08, 0.28, 3]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
    </group>
  );
}

function LostChick() {
  const hen = { x: TREE_TRUNK.x + 5.8, z: TREE_TRUNK.z + 8.4 };
  const p = useRef({ x: TREE_TRUNK.x - 7.2, z: TREE_TRUNK.z + 14.6, held: false });
  const g = useRef<THREE.Group>(null);
  const done = useRef(false);
  useFrame((_, dt) => {
    if (live.house || done.current) return;
    const c = p.current;
    if (!c.held) {
      const d = Math.hypot(live.x - c.x, live.z - c.z);
      if (d < 2.6) {
        c.x += (live.x - c.x) * dt * 0.65;
        c.z += (live.z - c.z) * dt * 0.65;
      }
      if (d < 1.05) c.held = true;
      if (d < 2) live.listen = live.listen || "A lost chick. Walk. It will follow.";
    } else {
      c.x += (live.x + 0.45 - c.x) * dt * 3;
      c.z += (live.z + 0.25 - c.z) * dt * 3;
      const dh = Math.hypot(live.x - hen.x, live.z - hen.z);
      if (dh < 1.55) {
        done.current = true;
        pay(12, "lostchick");
        live.listen = "The hen puffed up. The chick went under her wing.";
      }
    }
    if (g.current) {
      g.current.visible = !done.current;
      g.current.position.set(c.x, heightAt(c.x, c.z) + 0.12, c.z);
    }
  });
  const hy = heightAt(hen.x, hen.z);
  return (
    <group>
      <group position={[hen.x, hy, hen.z]}>
        <mesh position={[0, 0.22, 0]}>
          <sphereGeometry args={[0.18, 6, 5]} />
          <meshLambertMaterial color="#efe4cc" />
        </mesh>
        <mesh position={[0.16, 0.28, 0.04]}>
          <sphereGeometry args={[0.1, 5, 4]} />
          <meshLambertMaterial color="#efe4cc" />
        </mesh>
      </group>
      <group ref={g}>
        <mesh>
          <sphereGeometry args={[0.08, 6, 5]} />
          <meshLambertMaterial color="#e8d448" />
        </mesh>
      </group>
    </group>
  );
}

