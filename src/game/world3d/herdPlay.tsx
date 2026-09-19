import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, TREE_TRUNK } from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { addTrapSpot } from "./dungeonTraps";

function pay(n: number, key: string) {
  if (live.smashed[key]) return;
  live.smashed[key] = true;
  const c = useGame.getState().addCoins(n);
  if (c > 0) revealItem("coin");
  sfx.ok();
}

export function HerdPlay() {
  return (
    <group>
      <Cairn />
      <SheepPen />
    </group>
  );
}

function Cairn() {
  const rocks = useRef([
    { x: TREE_TRUNK.x + 11.2, z: TREE_TRUNK.z - 3.4, y: 0 },
    { x: TREE_TRUNK.x + 12.4, z: TREE_TRUNK.z - 2.6, y: 0 },
    { x: TREE_TRUNK.x + 13.1, z: TREE_TRUNK.z - 3.8, y: 0 },
  ]);
  const gs = [useRef<THREE.Group>(null), useRef<THREE.Group>(null), useRef<THREE.Group>(null)];
  useFrame((_, dt) => {
    if (live.house) return;
    const rs = rocks.current;
    for (const r of rs) {
      const d = Math.hypot(live.x - r.x, live.z - r.z);
      if (d < 0.95 && Math.abs(live.speed) > 2.2) {
        const fx = -Math.sin(live.yaw);
        const fz = -Math.cos(live.yaw);
        r.x += fx * 3.4 * dt;
        r.z += fz * 3.4 * dt;
      }
    }
    const close =
      Math.hypot(rs[0]!.x - rs[1]!.x, rs[0]!.z - rs[1]!.z) < 0.7 &&
      Math.hypot(rs[1]!.x - rs[2]!.x, rs[1]!.z - rs[2]!.z) < 0.7;
    if (close) {
      rs[1]!.y = 0.32;
      rs[2]!.y = 0.62;
      addTrapSpot(rs[0]!.x, rs[0]!.z, 0.55, 0.9);
      pay(10, "cairn");
      live.listen = "Three stones. A little tower. People used to do this.";
    }
    rs.forEach((r, i) => {
      const g = gs[i]!.current;
      if (g) g.position.set(r.x, heightAt(r.x, r.z) + 0.16 + r.y, r.z);
    });
    if (rs.some((r) => Math.hypot(live.x - r.x, live.z - r.z) < 1.6) && !close)
      live.listen = live.listen || "Three stones. Stack them.";
  }, -2);
  return (
    <group>
      {gs.map((ref, i) => (
        <group key={i} ref={ref}>
          <mesh>
            <dodecahedronGeometry args={[0.2 + i * 0.03, 0]} />
            <meshLambertMaterial color={i === 1 ? "#7a7268" : "#6a5a4c"} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function SheepPen() {
  const pen = { x: TREE_TRUNK.x + 18.6, z: TREE_TRUNK.z + 11.2 };
  const s = useRef({ x: TREE_TRUNK.x + 9.4, z: TREE_TRUNK.z + 19.4 });
  const g = useRef<THREE.Group>(null);
  const inP = useRef(false);
  useFrame((_, dt) => {
    if (live.house) return;
    const p = s.current;
    const d = Math.hypot(live.x - p.x, live.z - p.z);
    if (d < 1.35 && Math.abs(live.speed) > 1.6) {
      const fx = (p.x - live.x) / Math.max(0.2, d);
      const fz = (p.z - live.z) / Math.max(0.2, d);
      p.x += fx * 3.6 * dt;
      p.z += fz * 3.6 * dt;
    }
    const inPen = Math.hypot(p.x - pen.x, p.z - pen.z) < 1.5;
    if (inPen && !inP.current) {
      inP.current = true;
      pay(12, "sheeppen");
      live.listen = "The sheep went in. It started eating. It is not leaving.";
    }
    if (g.current) g.current.position.set(p.x, heightAt(p.x, p.z) + 0.22, p.z);
    if (d < 2 && !inP.current) live.listen = live.listen || "A sheep. Nudge it into the pen.";
  });
  const py = heightAt(pen.x, pen.z);
  return (
    <group>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[pen.x + sd * 1.2, py + 0.45, pen.z]}>
          <boxGeometry args={[0.08, 0.9, 2.2]} />
          <meshLambertMaterial color="#6a4a28" />
        </mesh>
      ))}
      <mesh position={[pen.x, py + 0.45, pen.z - 1.1]}>
        <boxGeometry args={[2.4, 0.9, 0.08]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <group ref={g}>
        <mesh>
          <sphereGeometry args={[0.22, 7, 5]} />
          <meshLambertMaterial color="#efe6d4" />
        </mesh>
        <mesh position={[0.2, 0.08, 0.04]}>
          <sphereGeometry args={[0.1, 5, 4]} />
          <meshLambertMaterial color="#2a2420" />
        </mesh>
      </group>
    </group>
  );
}
