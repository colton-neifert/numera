import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sfx } from "../audio";
import { live } from "./live";
import { POND, VX, VZ, heightAt } from "./field";

function lamb(color: string) {
  return <meshLambertMaterial color={color} />;
}

const FLIES = [
  { x: VX + 6, z: VZ - 4 },
  { x: VX - 8, z: VZ + 2 },
  { x: VX + 3, z: VZ + 9 },
];

/** A few things that notice you. Not a crowd. */
export function Moments() {
  const frog = useRef({ x: POND.x + POND.r * 0.72, z: POND.z + 2.2, hop: 0, gone: false });
  const frogG = useRef<THREE.Group>(null);
  const flies = useRef(FLIES.map((p) => ({ ...p, y: 1.4, flee: 0 })));
  const flyG = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Group>(null);
  const bird = useRef({ y: 2.4, gone: 0 });
  const birdG = useRef<THREE.Group>(null);
  const said = useRef(false);

  useFrame((_, dt) => {
    const f = frog.current;
    if (!f.gone) {
      const d = Math.hypot(live.x - f.x, live.z - f.z);
      if (d < 2.6 && f.hop <= 0) {
        f.hop = 0.01;
        sfx.splash();
      }
      if (f.hop > 0) {
        f.hop += dt;
        const tx = POND.x;
        const tz = POND.z;
        const dist = Math.hypot(tx - f.x, tz - f.z) || 1;
        f.x += ((tx - f.x) / dist) * dt * 6;
        f.z += ((tz - f.z) / dist) * dt * 6;
        if (f.hop > 0.7) f.gone = true;
      }
    }
    if (frogG.current) {
      const lift = f.gone ? -1 : f.hop > 0 ? Math.sin(Math.min(1, f.hop) * Math.PI) * 0.7 : 0;
      frogG.current.visible = !f.gone;
      frogG.current.position.set(f.x, heightAt(f.x, f.z) + 0.12 + lift, f.z);
    }

    if (flyG.current) {
      flies.current.forEach((b, i) => {
        const d = Math.hypot(live.x - b.x, live.z - b.z);
        if (d < 2.4) b.flee = Math.min(1, b.flee + dt * 1.6);
        else b.flee = Math.max(0, b.flee - dt * 0.3);
        const a = live.playT * 1.4 + i;
        const wander = b.flee > 0.05 ? 0 : Math.sin(a) * 0.35;
        b.y = 1.3 + Math.sin(a * 2) * 0.25 + b.flee * 3.2;
        const child = flyG.current!.children[i] as THREE.Object3D | undefined;
        if (!child) return;
        child.position.set(b.x + wander, heightAt(b.x, b.z) + b.y, b.z + Math.cos(a) * (b.flee > 0.05 ? 0 : 0.3));
        child.visible = b.flee < 0.95;
      });
    }

    const night = live.dusk > 0.55;
    if (glow.current) {
      glow.current.visible = night;
      glow.current.children.forEach((c, i) => {
        const a = live.playT * 0.7 + i * 1.3;
        const x = VX - 4 + Math.cos(a) * (3 + i);
        const z = VZ + 6 + Math.sin(a * 0.8) * 3;
        c.position.set(x, heightAt(x, z) + 1.1 + Math.sin(a * 3) * 0.3, z);
      });
    }

    if (birdG.current && bird.current.gone < 1) {
      const bx = VX - 16;
      const bz = VZ - 8;
      if (Math.hypot(live.x - bx, live.z - bz) < 4) bird.current.gone += dt * 0.7;
      const g = bird.current.gone;
      birdG.current.position.set(bx + g * 8, heightAt(bx, bz) + 2.2 + g * 6, bz - g * 4);
      birdG.current.visible = g < 0.95;
    }

    const sx = VX + 18;
    const sz = VZ + 4;
    if (!said.current && Math.hypot(live.x - sx, live.z - sz) < 2.4 && !live.talking) {
      said.current = true;
      live.hint = "Oakstead. Travelers, traders, and people who are definitely not hiding anything.";
    }
  });

  const signY = heightAt(VX + 18, VZ + 4);
  return (
    <group>
      <group ref={frogG}>
        <mesh>
          <boxGeometry args={[0.28, 0.16, 0.34]} />
          {lamb("#3d7a32")}
        </mesh>
      </group>
      <group ref={flyG}>
        {FLIES.map((_, i) => (
          <mesh key={i}>
            <boxGeometry args={[0.22, 0.04, 0.1]} />
            {lamb(i === 1 ? "#e6d27a" : "#d8e8f0")}
          </mesh>
        ))}
      </group>
      <group ref={glow} visible={false}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i}>
            <boxGeometry args={[0.08, 0.08, 0.08]} />
            <meshBasicMaterial color="#f4e7a0" />
          </mesh>
        ))}
      </group>
      <group ref={birdG} position={[VX - 16, heightAt(VX - 16, VZ - 8) + 2.2, VZ - 8]}>
        <mesh>
          <boxGeometry args={[0.36, 0.08, 0.16]} />
          {lamb("#6a5038")}
        </mesh>
      </group>
      <group position={[VX + 18, signY, VZ + 4]}>
        <mesh position={[0, 0.7, 0]} castShadow>
          <boxGeometry args={[0.12, 1.4, 0.12]} />
          {lamb("#5a3a22")}
        </mesh>
        <mesh position={[0, 1.35, 0]} castShadow>
          <boxGeometry args={[1.15, 0.55, 0.08]} />
          {lamb("#c4a56a")}
        </mesh>
        <mesh position={[0, 1.42, 0.05]}>
          <boxGeometry args={[0.7, 0.08, 0.02]} />
          {lamb("#3a2a18")}
        </mesh>
      </group>
    </group>
  );
}
